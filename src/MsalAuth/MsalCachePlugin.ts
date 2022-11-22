import { ICachePlugin, TokenCacheContext } from "@azure/msal-node";
import { constants } from "fs";
import fs from "fs/promises";
import os from "os";
import path from "path";

// This is a simple plain text auth token cache
// however we use the msal-node-extensions to provide a secure storage of tokens
// See https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-node-migration#enable-token-caching
function getAuthCachePath(): string {
  const homeDirPath = os.homedir();
  return path.join(homeDirPath, "dataverse-auth-cache");
}

// Call back APIs which automatically write and read into a .json file - example implementation
const beforeCacheAccess = async (cacheContext: TokenCacheContext): Promise<void> => {
  const cachePath = getAuthCachePath();
  let exists = true;
  try {
    await fs.access(cachePath, constants.R_OK | constants.W_OK);
  } catch {
    exists = false;
  }
  if (exists) {
    const cache = await fs.readFile(cachePath, "utf-8");
    cacheContext.tokenCache.deserialize(cache);
  }
};

const afterCacheAccess = async (cacheContext: TokenCacheContext): Promise<void> => {
  if (cacheContext.cacheHasChanged) {
    await fs.writeFile(getAuthCachePath(), cacheContext.tokenCache.serialize());
  }
};

// Cache Plugin
export const cachePlugin: ICachePlugin = {
  beforeCacheAccess,
  afterCacheAccess,
};
