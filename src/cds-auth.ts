#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-var-requires
const electron = require("electron/");

import proc from "child_process";

// Get the tenant and env url from the arguments
if (process.argv.length < 3) {
  console.log("Please supply the CDS envrionment url (e.g. >node-cds-auth contoso-env.crm11.dynamics.com)");
  process.exit();
} else {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  main();
}

function main(): void {
  const currentDir = __dirname;
  const child = proc.spawn(electron, [currentDir + "/.", ...process.argv.slice(2)], {
    stdio: "inherit",
    windowsHide: false,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  child.on("close", function(code: any) {
    process.exit(code);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-function-return-type
  const handleTerminationSignal = function(signal: any) {
    process.on(signal, function signalHandler() {
      if (!child.killed) {
        child.kill(signal);
      }
    });
  };

  handleTerminationSignal("SIGINT");
  handleTerminationSignal("SIGTERM");
}
