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
  - ❌ Debian (see [issue #1](https://github.com/scottdurow/node-cds-auth/issues/1))
- MacOS
  - ✔ 10.15
- Windows
  - ✔ 10
