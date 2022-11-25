/* eslint-disable quotes */
/* eslint-disable sonarjs/no-duplicate-string */
import { DataverseAuthArgs, DataverseAuthCommands } from "../DataverseAuthArgs";

describe("DataverseAuthArgs", () => {
  it("Extracts test-connection", () => {
    const args = new DataverseAuthArgs([DataverseAuthCommands.List]);
    expect(args.command).toBe(DataverseAuthCommands.List);
  });

  it("Extracts test-connection with verbose", () => {
    const args = new DataverseAuthArgs(["org.dynamics.com", DataverseAuthCommands.TestConnection, "--verbose"]);
    expect(args.environmentUrl).toBe("org.dynamics.com");
    expect(args.command).toBe(DataverseAuthCommands.TestConnection);
    expect(args.verboseLogging).toBe(true);
  });

  it("Extracts test-connection with verbose (short)", () => {
    const args = new DataverseAuthArgs(["org.dynamics.com", DataverseAuthCommands.TestConnection, "-v"]);
    expect(args.environmentUrl).toBe("org.dynamics.com");
    expect(args.command).toBe(DataverseAuthCommands.TestConnection);
    expect(args.verboseLogging).toBe(true);
  });

  it("Environment Url only", () => {
    const args = new DataverseAuthArgs(["org.dynamics.com"]);
    expect(args.environmentUrl).toBe("org.dynamics.com");
    expect(args.verboseLogging).toBe(false);
  });

  it("Environment Url and tenant Url", () => {
    const args = new DataverseAuthArgs(["contoso.com", "org.dynamics.com"]);
    expect(args.tenantUrl).toBe("contoso.com");
    expect(args.environmentUrl).toBe("org.dynamics.com");
    expect(args.verboseLogging).toBe(false);
  });
});
