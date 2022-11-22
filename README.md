# dataverse-auth
Cross-platform pure NodeJS On-behalf-of authentication against Microsoft dataverse Pro. Stores the token for use with NodeJS applications such as [dataverseify](https://github.com/scottdurow/dataverse-ify)

> **Note:** Version 2 of dataverse-auth is not compatible with version Version 1 of dataverse-ify and dataverse-gen.
  Use npx dataverse-auth@1 instead if you want to continue to use the older version

## Usage
`~$ npx dataverse-auth [environment]`\
E.g.\
`~$ npx dataverse-auth contosoorg.crm.dynamics.com`

### Optional - specify tenant url
You you want to specify the tenant Url rather that it be looked up automatically
`~$ npx dataverse-auth [tennant] [environment]`\
E.g.\
`~$ npx dataverse-auth contoso.onmicrosoft.com contosoorg.crm.dynamics.com`
For more information see the [dataverse-ify project](https://github.com/scottdurow/dataverse-ify)

## Other commands
- `npx dataverse-auth list` : Lists the currently authenticated environments
- `npx dataverse auth [environmentUrl] test-connection` : Tests a previously authenticated environment
- `npx dataverse auth [environmentUrl] remove` : Removes the stored token for an authenticated environment
- `npx dataverse auth [environmentUrl] device-code` : Adds an authentication profile using the device-code flow. Use this if you are having trouble authenticating using the interactive prompt.

## Tested on
- Linux
  - ✔ Manjaro
  - ✔ Ubuntu
  - ✔ Debian (see workaround below)
- MacOS
  - ✔ 10.15
- Windows
  - ✔ 10

## Debian install
By default the Debian kernel is hardened and proactively deny unprivileged user namespaces. This causes an issue when you install electron or packages depending on it, and there are (at least) two ways to bypass that.

### Method1, enable unprivileged namespaces
For NPX to work you will have to enable unprivileged user namespaces. Instructions on how to do this is found in the [this article](https://wiki.debian.org/LXC#Configuration_of_the_host_system) 

### Method2, install and modify permissions
First, install the NPM package, globally or in a dedicated project. After the install navigate to $NPM_PACKAGES/lib/node_modules/dataverse-auth/node_modules/electron/dist (tip: if you try to run dataverse-auth the full path will be in the error message)
Change the owner of chrome-sandbox to root and chmod it to 4755:  
`~$ sudo chown root chrome-sandbox && sudo chmod 4755 chrome-sandbox`

Now you can run it like any other package:  
`~$ dataverse-auth myorg.crm.dynamics.com`

### Build & Test
`dataverse-auth` uses electron which uses node-gyp. You will need to install Python and Visual Studio C++ core features.
To build & test locally, use:
```
npm run start org.api.crm3.dynamics.com
npm run start list
npm run start org.api.crm3.dynamics.com test-connection
```

### ADAL -> MSAL
As of version 2, dataverse-ify now uses MSAL for all authentication based on guidance given by https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-node-migration
