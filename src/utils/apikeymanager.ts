export class ApiKeyManager {

    static apiKeys: {[sessionId: string]: string} = {};

    static getApiKey(sessionId: string): string | undefined{
        console.log(`Retrieving API key for session ${sessionId}`);
        if (!this.apiKeys[sessionId]) {
            console.warn(`No API key found for session ${sessionId}. Returning undefined.`);
            return undefined;
        }
        return this.apiKeys[sessionId];
    }
    
    static setApiKey(sessionId: string, apiKey: string) {
        console.log(`Setting API key for session ${sessionId}`);
        this.apiKeys[sessionId] = apiKey;
    }
}