import { type Configuration, LogLevel } from '@azure/msal-browser';

export const msalConfig: Configuration = {
    auth: {
        clientId: import.meta.env.VITE_MSAL_CLIENT_ID || 'client-id-here',
        authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MSAL_TENANT_ID || 'common'}`,
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: 'sessionStorage', // This configures where your cache will be stored
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        console.info(message);
                        return;
                    case LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                }
            },
        },
    },
};

export const loginRequest = {
    scopes: ['User.Read', 'Files.ReadWrite', 'Files.ReadWrite.All', 'Sites.ReadWrite.All'],
};
