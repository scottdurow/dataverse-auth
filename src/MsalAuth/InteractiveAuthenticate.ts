import { app, BrowserWindow } from "electron";
import https from "https";
import { ILoggerCallback, LogLevel } from "@azure/msal-common";
import { LogEntry } from "./SimpleLogger";
import { msalConfig } from "./MsalConfig";

export interface InteractiveAcquireAuthCodeResult {
  authCode?: string;
  log: LogEntry[];
}

// Create the browser window.
function getTenantUrl(logger: ILoggerCallback, envUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let url = envUrl.endsWith("/") ? `${envUrl}api/data` : `${envUrl}/api/data`;
    url =
      !url.startsWith("http://") && !url.startsWith("https://") ? `https://${url}` : url.replace("http://", "https://");

    logger(LogLevel.Verbose, `getTenantUrl: ${url}`, false);

    https.get(url, (response) => {
      const wwwAuthenticateHeader = response.headers["www-authenticate"];
      logger(LogLevel.Verbose, `getTenantUrl: www-authenticate=${wwwAuthenticateHeader}`, false);
      if (wwwAuthenticateHeader) {
        try {
          const tenantAuthUrl = wwwAuthenticateHeader.split("=")[1].split(",")[0];
          logger(LogLevel.Verbose, `getTenantUrl: ${tenantAuthUrl}`, false);
          resolve(tenantAuthUrl);
        } catch (err) {
          const message = `Failed to parse 'www-authenticate' header from Environment ${wwwAuthenticateHeader}`;
          logger(LogLevel.Error, `getTenantUrl: ${message}`, false);
          reject(message);
        }
      } else {
        const message = `${envUrl} is not valid Environment`;
        logger(LogLevel.Error, `getTenantUrl: ${message}`, false);
        reject(message);
      }
    });
  });
}

export async function interactiveAcquireAuthCode(
  logger: ILoggerCallback,
  envUrl: string,
  tenantUrl?: string,
): Promise<string> {
  let authUrl = `https://login.microsoftonline.com/${tenantUrl}/oauth2/v2.0/authorize`;

  logger(LogLevel.Verbose, `interactiveGetAuthCode: envUrl=${envUrl} tenantUrl=${tenantUrl}`, true);
  try {
    if (!tenantUrl) {
      logger(LogLevel.Verbose, "interactiveGetAuthCode: No tenant provided - calling getTenantUrl", false);
      authUrl = await getTenantUrl(logger, envUrl);
    } else {
      await app.whenReady();
    }
  } catch (error) {
    logger(LogLevel.Error, error as string, false);
    return "";
  }

  return openBrowserWaitForRedirect(authUrl, logger);
}

function openBrowserWaitForRedirect(authUrl: string, logger: ILoggerCallback): Promise<string> {
  return new Promise((resolve, reject) => {
    let loginComplete = false;

    // Create the browser window.
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      alwaysOnTop: true,
      autoHideMenuBar: true,
      titleBarStyle: "default",
      title: "Sign in to your account",
      webPreferences: {
        nodeIntegration: true,
      },
    });

    // Navigate to the get code page
    const url = `${authUrl}?client_id=${
      msalConfig.clientId
    }&response_type=code&haschrome=1&redirect_uri=${encodeURIComponent(msalConfig.redirectUrl)}&scope=openid`;
    logger(LogLevel.Verbose, `loadURL ${url}`, true);
    win.loadURL(url).catch((error) => {
      logger(LogLevel.Error, error, false);
      if (!loginComplete) {
        reject(error);
      }
    });
    win.on("closed", function () {
      logger(LogLevel.Verbose, `closed loginComplete=${loginComplete}`, false);
      if (!loginComplete) {
        reject("Login Closed: Authentication was not completed");
      }
    });

    win.webContents.on("will-redirect", function (event, redirectUrl) {
      logger(LogLevel.Verbose, `interactiveGetAuthCode: will-redirect redirectUrl=${redirectUrl}`, true);
      // Check if this is the success callback
      if (redirectUrl.toLowerCase().startsWith(msalConfig.redirectUrl.toLowerCase())) {
        // Stop the redirect to the app: endpoint
        event.preventDefault();
        loginComplete = true;
        const regex = /(?<=code=)[^&]*/gm;
        const codeMatch = regex.exec(redirectUrl);

        if (!codeMatch) {
          const message = "Cannot find code in redirect";
          logger(LogLevel.Error, `interactiveGetAuthCode: ${message}`, false);
          throw new Error(message);
        }

        logger(LogLevel.Verbose, `interactiveGetAuthCode: will-redirect codeMatch=${codeMatch}`, true);
        win.close();
        resolve(codeMatch[0]);
      }
    });
  });
}
