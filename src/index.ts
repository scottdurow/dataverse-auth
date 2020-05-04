#!/usr/bin/env node
import { authenticate } from "./authenticate";
import { addTokenToCache } from "./TokenCache";
import { version } from "./version";

let argTenant: string | undefined;
let argEnvUrl: string;

if (process.argv.length >= 4) {
  // If 2 parameters, assume we pass tenant and environment Url
  argTenant = process.argv[2]; //"contoso.onmicrosoft.com";
  argEnvUrl = process.argv[3]; //"contoso-env.crm11.dynamics.com";
} else {
  // If 1 parameter, assume just the envrionment Url
  argEnvUrl = process.argv[2]; //"contoso-env.crm11.dynamics.com";
}

console.log(`cds-auth v${version}`);
console.log(`Authenticating for Environment:'${argEnvUrl}'` + (argTenant ? ` Tenant:'${argTenant}` : ""));

// This is called via the bin command cds-auth
// Either <tenantUrl> <environmentUrl> can be provided
// Or just <environmentUrl> and we lookup the <tenantUrl>

// eslint-disable-next-line @typescript-eslint/no-use-before-define
main();

async function main(): Promise<void> {
  try {
    const token = await authenticate(argEnvUrl, argTenant);
    // Save token to token cache
    addTokenToCache(argEnvUrl, token);
  } catch (ex) {
    console.log("ERROR:" + ex);
  }
}
