#!/usr/bin/env node
import { LogLevel } from "@azure/msal-node";
import { interactiveAcquireAuthCode, InteractiveAcquireAuthCodeResult } from "./MsalAuth/InteractiveAuthenticate";
import { SimpleLogger } from "./MsalAuth/SimpleLogger";
import { exit } from "process";

let argTenant: string | undefined;
let argEnvUrl: string;
if (process.argv.length >= 4) {
  // If 2 parameters, assume we pass tenant and environment Url
  argTenant = process.argv[2]; //"contoso.onmicrosoft.com";
  argEnvUrl = process.argv[3]; //"contoso-env.crm11.dynamics.com";
} else {
  // If 1 parameter, assume just the environment Url
  argEnvUrl = process.argv[2]; //"contoso-env.crm11.dynamics.com";
}

function outputResult(result: InteractiveAcquireAuthCodeResult): void {
  console.log(JSON.stringify(result));
}

const logger = new SimpleLogger();
process.setUncaughtExceptionCaptureCallback((error) => {
  logger.Log(LogLevel.Error, error.message);
  outputResult({ log: logger?.output });
  exit(1);
});

if (!argEnvUrl) {
  throw "Please supply an environment url. E.g. npx dataverse-auth contoso.crm.dynamics.com";
}
// This is called via the bin command dataverse-auth
// Either <tenantUrl> <environmentUrl> can be provided
// Or just <environmentUrl> and we lookup the <tenantUrl>

// eslint-disable-next-line @typescript-eslint/no-use-before-define
interactiveAcquireAuthCode(logger.Log, argEnvUrl, argTenant)
  .then((authCode) => {
    outputResult({ authCode: authCode, log: logger?.output });
    //exit(0);
  })
  .catch((ex) => {
    logger.Log(LogLevel.Error, ex as string);
    outputResult({ log: logger?.output });
    //exit(1);
  });
