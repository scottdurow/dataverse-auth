# node-cds-auth
Cross-platform pure NodeJS On-behalf-of authenticaiton against CDS for use with [cdsify](https://github.com/scottdurow/cdsify/wiki)

## Usage
`~$ npx node-cds-auth [environment]`\
E.g.\
`~$ npx node-cds-auth contosoorg.crm.dynamics.com`

### Optional - specify tenant url
You you want to specify the tenant Url rather that it be looked up automatically
`~$ npx node-cds-auth [tennant] [environment]`\
E.g.\
`~$ npx node-cds-auth contoso.onmicrosoft.com contosoorg.crm.dynamics.com`
For more information see the [cdsify project](https://github.com/scottdurow/cdsify/wiki)

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
First, install the NPM package, globally or in a dedicated project. After the install navigate to $NPM_PACKAGES/lib/node_modules/node-cds-auth/node_modules/electron/dist (tip: if you try to run cds-auth the full path will be in the error message)
Change the owner of chrome-sandbox to root and chmod it to 4755:
`~$ sudo chown root chrome-sandbox && sudo chmod 4755 chrome-sandbox'

Now you can run it like any other package:
`~$ cds-auth myorg.crm.dynamics.com`