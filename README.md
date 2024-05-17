# companion-module-ptzoptics-visca

See [HELP.md](./companion/HELP.md) and [LICENSE](./LICENSE)

## Getting started

Executing a `yarn` command should perform all necessary steps to develop the module. If it doesn't, follow the steps below.

First, download and install module dependencies using `yarn install`. You can then build the module using `yarn build`. The module can be loaded by Companion by adding a symlink to the module folder to the [`companion-module-dev`](https://github.com/bitfocus/companion-module-base/wiki) you specify in your Companion installation's settings. (Or you can simply clone the module into a folder inside `companion-module-dev`.)

Use `yarn lint` to check code style and `yarn lint --fix` to fix mechanically-fixable formatting errors. Use `yarn test` to run module tests. The module includes a Github workflow that lints module code and runs tests when you push to Github or create a PR, so you can check lint/testing results for your pushes in the "Actions" tab of your Github repository.

Run `yarn dev` to compile module code, then watch for changes to automatically recompile it. This is a useful way to quickly test code changes as you work on them.

## Supported cameras

This module exists to support PTZOptics cameras, first and foremost. G3 series cameras are probably most supported, because that's what the module maintainer uses himself. G2 series cameras are expected to work reasonably well, too, but they're less well-tested and so we rely on user testing to ensure support.

This module uses VISCA over TCP/IP to control cameras. This protocol, initially developed by Sony, is implemented by many manufacturers for many different cameras. But cameras often implement it in subtly different form. This module attempts to enable support for non-PTZOptics cameras. But when such support would be incompatible with PTZOptics cameras -- for example, if a camera uses a different byte sequence for a command than PTZOptics cameras do -- the module will only support the PTZOptics mechanism. Users who use non-PTZOptics cameras are expected to use the "Custom command" action to work around this.
