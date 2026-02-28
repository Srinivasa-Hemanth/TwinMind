import { Client } from '@microsoft/microsoft-graph-client';
import { InteractionRequiredAuthError, type IPublicClientApplication, type AccountInfo } from '@azure/msal-browser';
import { loginRequest } from '../authConfig';

export const uploadToOneDrive = async (
    instance: IPublicClientApplication,
    account: AccountInfo | null,
    file: Blob,
    fileName: string
) => {
    if (!account) {
        throw new Error('No user account found. Please sign in first.');
    }

    let tokenResponse;
    try {
        tokenResponse = await instance.acquireTokenSilent({
            ...loginRequest,
            account,
        });
    } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
            tokenResponse = await instance.acquireTokenPopup({
                ...loginRequest,
                account,
            });
        } else {
            throw error;
        }
    }

    const graphClient = Client.init({
        authProvider: (done) => {
            done(null, tokenResponse.accessToken);
        },
    });

    try {
        const path = `/me/drive/root:/TwinMindRecordings/${fileName}:/content`;

        const response = await graphClient
            .api(path)
            .put(file);

        console.log(`Uploaded ${fileName} successfully:`, response);
        return response;
    } catch (error) {
        console.error(`Error uploading ${fileName}:`, error);
        throw error;
    }
};
