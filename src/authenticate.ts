import { BrowserWindow } from "electron";
import { TokenResponse } from "adal-node";
import { adalAuth } from "./adalAuth";
export function authenticate(tenant: string, envUrl: string): Promise<TokenResponse> {
  return new Promise((resolve, reject) => {
    let loginComplete = false;
    // Create the browser window.
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      alwaysOnTop: true,
      autoHideMenuBar: true,
      titleBarStyle: "hidden",
      webPreferences: {
        nodeIntegration: true,
      },
    });
    const url = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?client_id=51f81489-12ee-4a9e-aaae-a2591f45987d&response_type=code&haschrome=1&redirect_uri=app%3A%2F%2F58145B91-0C36-4500-8554-080854F2AC97&scope=openid`;
    // Navigate to the get code page
    win.loadURL(url);
    win.on("closed", function() {
      if (!loginComplete) {
        reject("Login Closed");
      }
    });
    win.webContents.on("will-redirect", function(event, newUrl) {
      // Check if this is the success callback
      if (newUrl.startsWith("app://58145b91-0c36-4500-8554-080854f2ac97")) {
        // Stop the redirect to the app: endpoint
        event.preventDefault();
        loginComplete = true;
        adalAuth(envUrl, newUrl).then(
          function(tokenResponse) {
            const token = tokenResponse as TokenResponse;
            console.log("Token Aquisition Completed");
            win.close();
            resolve(token);
          },
          function(err) {
            console.log("Token Aquisition failed:" + JSON.stringify(err));
            reject(err);
          },
        );
      }
    });
  });
}
