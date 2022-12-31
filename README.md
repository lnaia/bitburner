# BitBurner

Private repo to host bitburner game code.

https://bitburner.readthedocs.io/en/latest/

## Sync instructions

Each file that needs to be downloaded has to be:

- added to the in game exec that downloads a list of files
- added to the deploy job, to ensure it gets uploaded

## Type definitions

https://github.com/bitburner-official/bitburner-src/blob/dev/src/ScriptEditor/NetscriptDefinitions.d.ts

Example tsconfig transpilation project:
https://github.com/edusig/bitburner/blob/master/tsconfig.json

script collection:
https://github.com/moriakaice/bitburner

## Conventions

### Filenames

Prefixed with `exe-` means it's a direct executable
Prefixed with `lib-` means it's a library, no executable
