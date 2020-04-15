import { AuthenticationContext } from "adal-node";
import { argEnvUrl } from "./index";
export function adalAuth(redirectUrl: string): Promise<unknown> {
  const authorityHostUrl = "https://login.windows.net/common";
  const server = argEnvUrl;
  const regex = /(?<=code=)[^&]*/gm;
  const codeMatch = regex.exec(redirectUrl);
  if (!codeMatch) throw new Error("Cannot find code in redirect");

  // eslint-disable-next-line @typescript-eslint/no-this-alias
  return new Promise((resolve, reject) => {
    const context = new AuthenticationContext(authorityHostUrl);
    context.acquireTokenWithAuthorizationCode(
      codeMatch[0],
      "app://58145B91-0C36-4500-8554-080854F2AC97",
      "https://" + server,
      "51f81489-12ee-4a9e-aaae-a2591f45987d",
      "",
      (err, tokenResponse) => {
        if (err) {
          console.log("Error");
          console.log(err);
          reject(err);
        } else {
          console.log("Success");
          console.log(tokenResponse);
          resolve(tokenResponse);
        }
      },
    );
  });
}
