#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-use-before-define */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const electron = require("electron/");
import proc from "child_process";
import { exit } from "process";
import { InteractiveAcquireAuthCodeResult } from "./MsalAuth/InteractiveAuthenticate";
import {
  acquireToken,
  acquireTokenByCodeMsal,
  acquireTokenUsingDeviceCode,
  getAllUsers,
  removeToken,
} from "./MsalAuth/MsalNodeAuth";
import { version } from "./version";
import { prompt } from "enquirer";
import { SimpleLogger } from "./MsalAuth/SimpleLogger";
import chalk from "chalk";
import { DataverseAuthArgs, DataverseAuthCommands } from "./DataverseAuthArgs";
console.log(chalk.yellow(`dataverse-auth v${version}`));
console.log(
  chalk.gray(`
  This is a beta version. v2 is not compatible with version v1 of dataverse-ify and dataverse-gen.
  Use npx dataverse-auth@1 instead if you want to continue to use the older version.`),
);

const currentDir = __dirname;

main();

async function main(): Promise<void> {
  try {
    const args = new DataverseAuthArgs(process.argv.slice(2));

    if (args.verboseLogging) {
      console.log("Verbose logging ON");
    }

    // Which command to run?
    switch (args.command) {
      case DataverseAuthCommands.Help:
        args.outputHelp();
        break;
      case DataverseAuthCommands.TestConnection:
        await testAuth(args);
        break;
      case DataverseAuthCommands.List:
        listAuth();
        break;
      case DataverseAuthCommands.Remove:
        removeAuth(args);
        break;
      case DataverseAuthCommands.DeviceCode:
        await deviceCodeAuth(args);
        break;
      default:
        await interactiveAuth(args);
        break;
    }
  } catch (e) {
    console.log(chalk.red(e));
  }
}

async function getEnvironmentUrl(args: DataverseAuthArgs): Promise<string> {
  if (!args.environmentUrl) {
    try {
      const response = await prompt<{ env: string }>({
        type: "input",
        name: "env",
        message: "Enter environment url (e.g. org.crm.dynamics.com)",
      });

      if (response && response.env) {
        args.environmentUrl = response.env;
      }
    } catch {
      //noop
    }
  }
  if (!args.environmentUrl) {
    throw "Please provide an environment url. (e.g. org.crm.dynamics.com)";
  }
  return args.environmentUrl;
}

function listAuth(): void {
  console.log("Current Microsoft Dataverse user profiles:");
  getAllUsers().forEach((a, i) => console.log(`[${i}]   ${a.userName}\t: ${a.environment}`));
  exit();
}

function removeAuth(args: DataverseAuthArgs): void {
  removeToken(args.environmentUrl)
    .catch((error) => {
      console.error(error);
      exit(1);
    })
    .then(() => {
      console.log(`Authentication profile removed for ${args.environmentUrl}`);
      exit(0);
    });
}

async function testAuth(args: DataverseAuthArgs): Promise<void> {
  const logger = new SimpleLogger();
  try {
    const bearerToken = await acquireToken(args.environmentUrl, logger.Log);
    logger.OutputToConsole(args.verboseLogging);
    console.log(`\nBearer ${bearerToken}`);
    console.log(`\nAuthentication successful for ${args.environmentUrl}`);
    exit(0);
  } catch (error) {
    logger.OutputToConsole(args.verboseLogging);
    console.error(`Authentication failed: ${error}`);
    exit(1);
  }
}

async function deviceCodeAuth(args: DataverseAuthArgs): Promise<void> {
  try {
    await getEnvironmentUrl(args);
    console.log(`Authenticating for environment (using device code flow): '${args.environmentUrl}'`);

    const result = await acquireTokenUsingDeviceCode(args.environmentUrl);

    if (result) {
      console.log(`Authentication successful for ${result.account?.name} (${result.account?.username})`);
    } else throw "Authentication cancelled";
    exit(0);
  } catch (error) {
    console.error(`Authentication failed: ${error}`);
    exit(1);
  }
}

async function interactiveAuth(args: DataverseAuthArgs): Promise<void> {
  try {
    await getEnvironmentUrl(args);

    console.log(`Authenticating for environment: '${args.environmentUrl}'`);

    // We create a child process to perform the interactive authentication using the electron process
    // This returns the auth code which is then used to get the token from MSAL
    const processArgs = [currentDir + "/."];
    if (args.tenantUrl) {
      processArgs.push("-t");
      processArgs.push(args.tenantUrl);
    }
    if (args.environmentUrl) {
      processArgs.push("-e");
      processArgs.push(args.environmentUrl);
    }
    const child = proc.spawn(electron, [currentDir + "/.", ...processArgs], {
      windowsHide: false,
    });
    let authResult = "";

    if (child.stdout) {
      child.stdout.on("data", function (data) {
        authResult += data.toString();
      });
    }

    child.on("close", function () {
      onCloseCallback(authResult, args);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-function-return-type
    const handleTerminationSignal = function (signal: any) {
      process.on(signal, function signalHandler() {
        if (!child.killed) {
          child.kill(signal);
        }
      });
    };

    handleTerminationSignal("SIGINT");
    handleTerminationSignal("SIGTERM");
  } catch (error) {
    console.error(`Authentication failed: ${error}`);
    exit(1);
  }
}

async function onCloseCallback(authResult: string, args: DataverseAuthArgs): Promise<void> {
  const logger = new SimpleLogger();
  try {
    // Auth using msal
    // Get the first { to mark start of JSON
    const startIndex = authResult.indexOf("{");
    if (startIndex === -1) {
      throw "Unexpected result:" + authResult;
    }

    const result = JSON.parse(authResult.substring(startIndex)) as InteractiveAcquireAuthCodeResult;

    logger.AppendLog(result.log);

    if (result.authCode) {
      const msalResult = await acquireTokenByCodeMsal(args.environmentUrl, result.authCode, logger.Log);
      if (msalResult) {
        if (args.verboseLogging) {
          // output log, but don't output the token for brevity
          logger.OutputToConsole(args.verboseLogging);
          console.log({ ...msalResult, ...{ idToken: "****", accessToken: "****" } });
        }
        console.log(`Authentication successful for ${msalResult.account?.name} (${msalResult.account?.username})`);
      }
      exit(0);
    } else {
      // get last error
      const errorLog = result.log && result.log.find((l) => l.Level === 0);
      throw errorLog?.Message ?? "Unknown error";
    }
  } catch (error) {
    logger.OutputToConsole(args.verboseLogging);
    console.error(`Authentication failed: ${error}`);
    exit(1);
  }
}
