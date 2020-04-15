import Cryptr from "cryptr";
import { TokenResponse } from "adal-node";
import os from "os";
import path from "path";
import fs from "fs";
export interface TokenCache {
  [index: string]: string;
}
function getAuthCachePath(): string {
  const homeDirPath = os.homedir();
  const authCachePath = path.join(homeDirPath, "cds-auth-cache");
  return authCachePath;
}
function getCrypto(): Cryptr {
  const cryptr = new Cryptr(os.userInfo.name);
  return cryptr;
}
export function loadTokenCache(): TokenCache {
  const authCachePath = getAuthCachePath();
  let tokenCache = {} as TokenCache;

  // Load existing file if there is one
  if (fs.existsSync(authCachePath)) {
    const tokenCacheJSON = fs.readFileSync(authCachePath);
    tokenCache = (JSON.parse(tokenCacheJSON.toString()) as unknown) as TokenCache;
  }
  return tokenCache;
}

export function addTokenToCache(envUrl: string, token: TokenResponse): void {
  const tokenCache = loadTokenCache();
  // Encrypt - not 100% secure, but just so we are not putting down plain text
  const jsonToken = JSON.stringify(token);
  const jsonTokenEncrypyed = getCrypto().encrypt(jsonToken);
  // Add to the token cache
  tokenCache[envUrl] = jsonTokenEncrypyed;
  fs.writeFileSync(getAuthCachePath(), JSON.stringify(tokenCache));
}

export function getTokenFromCache(envUrl: string): TokenResponse {
  const tokenCache = loadTokenCache();
  const tokenEncrypted = tokenCache[envUrl];
  if (!tokenEncrypted) {
    throw new Error(`No token found for environment ${envUrl}`);
  }
  const jsonToken = getCrypto().decrypt(tokenEncrypted);
  return JSON.parse(jsonToken) as TokenResponse;
}
