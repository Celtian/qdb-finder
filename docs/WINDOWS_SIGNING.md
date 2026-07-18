# Optional Windows signing

Initial releases are unsigned. Windows SmartScreen may therefore warn users until the application has established reputation.

Electron Forge can sign the Squirrel package when a code-signing certificate is available. Store the certificate and password as encrypted GitHub Actions secrets, configure Forge's `certificateFile` and `certificatePassword` from environment variables, and never commit either value. EV certificates generally provide the best initial SmartScreen experience.
