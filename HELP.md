# companion-module-ptzoptics-visca

This module can be used to control PTZ camera's with the Sony VISCA protocol.

## Commands

- Custom Command
It is aloud to send a custom command. Send then in this format;
(80) 2A 02 02 11 12
You don't send the first 80, this is hard programmed in the code. When entering a wrong command, regex won't allow it.
