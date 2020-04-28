import { BrowserWindow } from "electron";
import { TokenResponse } from "adal-node";
import { adalAuth } from "./adalAuth";
import https from "https";

// Create the browser window.
function getTenantUrl(envUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let url = envUrl.endsWith("/")
      ? `${envUrl}api/data`
      : `${envUrl}/api/data`;
    
    url = !url.startsWith("http://") && !url.startsWith("https://")
      ? `https://${url}`
      : url.replace("http://", "https://"); 
    
    https.get(url, (response) => {
      if (response.headers["www-authenticate"]) {
        try {
          resolve(response.headers["www-authenticate"].split("=")[1].split(",")[0]);
        } catch(err) {
          console.log("Failed to parse 'www-authenticate' header from Environment\n\n" + response.headers["www-authenticate"]);
          reject("Failed to parse 'www-authenticate' header from Environment");
        }
      } else {
        const message = `${envUrl} is not valid Environment`; 
        console.log(message)
        reject(message);
      }
    });
  });
}

export async function authenticate(tenant: string, envUrl: string): Promise<TokenResponse> {
  tenant = await getTenantUrl(envUrl);

  return new Promise((resolve, reject) => {
    let loginComplete = false;

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

    // Navigate to the get code page
    win.loadURL(`${tenant}?client_id=51f81489-12ee-4a9e-aaae-a2591f45987d&response_type=code&haschrome=1&redirect_uri=app%3A%2F%2F58145B91-0C36-4500-8554-080854F2AC97&scope=openid`);
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
