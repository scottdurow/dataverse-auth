/* eslint-disable sonarjs/cognitive-complexity */
import minimist from "minimist";
export enum DataverseAuthCommands {
  TestConnection = "test-connection",
  List = "list",
  Remove = "remove",
  DeviceCode = "device-code",
  ClientSecretAuth = "client-secret-auth",
  Help = "help",
}
const commands: string[] = [
  DataverseAuthCommands.List,
  DataverseAuthCommands.TestConnection,
  DataverseAuthCommands.DeviceCode,
  DataverseAuthCommands.Remove,
  DataverseAuthCommands.ClientSecretAuth,
  DataverseAuthCommands.Help,
];

export class DataverseAuthArgs {
  constructor(processArgs: string[]) {
    const args = minimist(processArgs, {
      alias: { tenant: "t", applicationId: "a", clientSecret: "s" },
    });
    this.verboseLogging = args.verbose || args.v || false;
    this.environmentUrl = args.environment || args.e;
    this.tenantUrl = args.tenantUrl || args.tu;
    this.command = processArgs.find((a) => commands.indexOf(a) > -1);

    // Strip out all commands to leave just the environment and tenant urls.
    const justUrls = args._.filter((a) => commands.indexOf(a) === -1);
    if (!this.environmentUrl && justUrls.length === 1) {
      this.environmentUrl = args._[0];
    } else if (!this.environmentUrl && justUrls.length === 2) {
      this.tenantUrl = args._[0];
      this.environmentUrl = args._[1];
    }
  }

  public outputHelp() {
    console.log(`Usage: npx dataverse-auth [EnvUrl] [test-connection] [remove] [list] [device-code]
    
    [EnvUrl]            The url of the environment to authenticate against (e.g. contoso.dynamics.com)
    test-connection     Tests a pre-created authentication profile using the environment url as the key
    remove              Removes an authentication profile using the environment url as the key
    list                Lists all the authentication profiles
    device-code         Uses the device code flow to authenticate against the given environment
    `);
  }

  public environmentUrl: string;
  public tenantUrl?: string;
  public command?: string;
  public verboseLogging = false;
}
