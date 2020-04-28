#!/usr/bin/env node
import { authenticate } from "./authenticate";
import { addTokenToCache } from "./TokenCache";
import { version } from "./version";

const argTenant = process.argv[2]; //"contoso.onmicrosoft.com";
const argEnvUrl = process.argv[3]; //"contoso-env.crm11.dynamics.com";
console.log(`cds-auth v${version}`);
console.log(`Authenticating for Tenant:'${argTenant}' and Environment:'${argEnvUrl}`);

// eslint-disable-next-line @typescript-eslint/no-use-before-define
main();

async function main(): Promise<void> {
  try {
    const token = await authenticate(argTenant, argEnvUrl);
    // Save token to token cache
    addTokenToCache(argEnvUrl, token);
  } catch (ex) {
    console.log("ERROR:" + ex);
  }
}
