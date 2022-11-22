#!/usr/bin/env node
import { LogLevel } from "@azure/msal-node";
import { interactiveAcquireAuthCode, InteractiveAcquireAuthCodeResult } from "./MsalAuth/InteractiveAuthenticate";
import { SimpleLogger } from "./MsalAuth/SimpleLogger";
import { exit } from "process";

const argEnvUrl: string | undefined = process.argv[2]; //org e.g. "contoso-env.crm11.dynamics.com";
const argTenant: string | undefined = process.argv[3]; //tenant e.g. "contoso.onmicrosoft.com";

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
