#!/usr/bin/env node
import { app } from "electron";
import { TokenResponse } from "adal-node";
import { authenticate } from "./authenticate";
import { addTokenToCache } from "./TokenCache";
export const argTenant = process.argv[2]; //"contoso.onmicrosoft.com";
export const argEnvUrl = process.argv[3]; //"contoso-env.crm11.dynamics.com";
console.log(`Authenticating for Tenant:'${argTenant}' and Environment:'${argEnvUrl}`);

// eslint-disable-next-line @typescript-eslint/no-use-before-define
main();

function main(): void {
  app.allowRendererProcessReuse = true;
  app
    .whenReady()
    .then(authenticate)
    .then(
      function(token: TokenResponse) {
        // Save token to token cache
        addTokenToCache(argEnvUrl, token);
      },
      function(reason) {
        console.log("ERROR:" + reason);
      },
    );
}
