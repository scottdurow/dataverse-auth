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
console.log(`dataverse-auth v${version}`);

const ARG_LOG = "log";
const ARG_TEST_CONNECTION = "test-connection";
const ARG_LIST = "list";
const ARG_REMOVE = "remove";
const ARG_DEVICE_CODE = "device-code";
const argFlags = [ARG_LOG, ARG_TEST_CONNECTION, ARG_LIST, ARG_REMOVE, ARG_DEVICE_CODE];
const verboseLog = process.argv.findIndex((a) => a === argFlags[0]) > -1;
if (verboseLog) {
  console.log("Verbose logging ON");
}

// Remove flags and node args
const args = process.argv.filter((a) => argFlags.indexOf(a) === -1).slice(2);
const currentDir = __dirname;
let environmentUrl = args[0];

main();

async function main(): Promise<void> {
  // Which command to run?
  switch (getCommand()) {
    case ARG_TEST_CONNECTION:
      await testAuth();
      break;
    case ARG_LIST:
      listAuth();
      break;
    case ARG_REMOVE:
      removeAuth();
      break;
    case ARG_DEVICE_CODE:
      await deviceCodeAuth();
      break;
    default:
      await interactiveAuth();
      break;
  }
}

async function getEnvironmentUrl(): Promise<string> {
  if (!environmentUrl) {
    const response = await prompt<{ env: string }>({
      type: "input",
      name: "env",
      message: "Enter environment url (e.g. org.crm.dynamics.com)",
    });

    if (response && response.env) {
      environmentUrl = response.env;
    } else {
      throw "Please provide an environment url. (e.g. org.crm.dynamics.com)";
    }
  }
  return environmentUrl;
}

function getCommand(): string | undefined {
  return process.argv.find((a) => argFlags.indexOf(a) > -1);
}

function listAuth(): void {
  console.log("Current Microsoft Dataverse user profiles:");
  getAllUsers().forEach((a, i) => console.log(`[${i}]   ${a.environment}\t: ${a.userName}`));
  exit();
}

function removeAuth(): void {
  removeToken(environmentUrl)
    .catch((error) => {
      console.error(error);
      exit(1);
    })
    .then(() => {
      console.log(`Authentication profile removed for ${environmentUrl}`);
      exit(0);
    });
}

async function testAuth(): Promise<void> {
  const logger = new SimpleLogger();
  try {
    const bearerToken = await acquireToken(environmentUrl, logger.Log);
    logger.OutputToConsole(verboseLog);
    console.log(`\nBearer ${bearerToken}`);
    console.log(`\nAuthentication successful for ${environmentUrl}`);
    exit(0);
  } catch (error) {
    logger.OutputToConsole(verboseLog);
    console.error(`Authentication failed: ${error}`);
    exit(1);
  }
}

async function deviceCodeAuth(): Promise<void> {
  await getEnvironmentUrl();
  console.log(`Authenticating for environment (using device code flow): '${environmentUrl}'`);
  try {
    const result = await acquireTokenUsingDeviceCode(environmentUrl);

    if (result) {
      console.log(`Authentication successful for ${result.account?.name} (${result.account?.username})`);
    }
    exit(0);
  } catch (error) {
    console.error(`Authentication failed: ${error}`);
    exit(1);
  }
}

async function interactiveAuth(): Promise<void> {
  await getEnvironmentUrl();

  console.log(`Authenticating for environment: '${environmentUrl}'`);

  // We create a child process to perform the interact authentication using the electron process
  // This returns the auth code which is then used to get the token from MSAL
  const child = proc.spawn(electron, [currentDir + "/.", ...args], {
    windowsHide: false,
  });
  let authResult = "";

  if (child.stdout) {
    child.stdout.on("data", function (data) {
      authResult += data.toString();
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  child.on("close", function (code: number) {
    onCloseCallback(authResult);
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
}

async function onCloseCallback(authResult: string): Promise<void> {
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
      const msalResult = await acquireTokenByCodeMsal(environmentUrl, result.authCode, logger.Log);
      if (msalResult) {
        if (verboseLog) {
          // output log, but don't output the token for brevity
          logger.OutputToConsole(verboseLog);
          console.log({ ...msalResult, ...{ idToken: "****", accessToken: "****" } });
        }
        console.log(`Authentication successful for ${msalResult.account?.name} (${msalResult.account?.username})`);
      }
      exit(0);
    }
  } catch (error) {
    logger.OutputToConsole(verboseLog);
    console.error(`Authentication failed: ${error}`);
    exit(1);
  }
}
