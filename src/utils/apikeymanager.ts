import { auth } from "@modelcontextprotocol/sdk/client/auth.js";
import { Request } from "express";

const MCP_NAME = "Assembly";

type AuthData = {
    geniusKey?: string,
    apiKey?:string, 
    userId?: string, 
    password?: string, 
    accessToken?: string, 
    expiresAt?: Date
};

export class ApiKeyManager {

    static apiKeys: {[sessionId: string]: AuthData} = {};

    static getAuthType(sessionId: string): string {
        const authData = this.getAuthData(sessionId);
        if (authData.apiKey) {
            return "apiKey";
        }
        if (authData.accessToken && authData.expiresAt) {
            return "oauth2";
        }
        if (authData.userId && authData.password) {
            return "basic";
        }
        return "invalid";
    }

    static getAuthData(sessionId: string): AuthData {
        return this.apiKeys[sessionId];
    }

    static getApiKey(sessionId: string): string | undefined {
        const authData = this.apiKeys[sessionId];
        return authData ? authData.apiKey : undefined;
    }
    
    static async getAccessToken(sessionId: string): Promise<string | undefined> {
        let authData: AuthData | undefined = this.apiKeys[sessionId];
        if (authData && this.isExpired(authData)) {
            authData = await ApiKeyManager.loadAuthDataFromDashboard(authData.geniusKey!);
        }
        return authData ? authData.accessToken : undefined;
    }
    
    static getUserId(sessionId: string): string | undefined {
        const authData = this.apiKeys[sessionId];
        return authData ? authData.userId : undefined;
    }
    
    static getPassword(sessionId: string): string | undefined {
        const authData = this.apiKeys[sessionId];
        return authData ? authData.password : undefined;
    }
    
    static setAuthData(sessionId: string, authData: AuthData) {
        this.apiKeys[sessionId] = authData;
    }

    private static isExpired(authData: AuthData): boolean {
        if (authData.expiresAt) {
            const now = new Date();
            return now >= authData.expiresAt;
        }
        return false;
    }

    private static async loadAuthDataFromDashboard(geniusKey: string): Promise<AuthData | undefined> {
        let authData: AuthData | undefined = undefined;
        const result = await fetch('https://dashboard.geniusagents.nl/api/mcp?mcpName=' + MCP_NAME, {
            method: 'GET',
            headers: {
                'x-api-key': geniusKey
            }
        });
        if (result.ok) {
            const data = await result.json();
            console.log(`Received auth data from dashboard: ${JSON.stringify(data)}`);
            if (data.apiKey) {
                authData = { 
                    apiKey: data.apiKey, 
                    geniusKey: geniusKey 
                };
            } else if (data.accessToken && data.expiresAt) {
                authData = { 
                    accessToken: data.accessToken, 
                    expiresAt: new Date(data.expiresAt),
                    geniusKey: geniusKey
                };
            } else if (data.userId && data.password) {
                authData = { 
                    userId: data.userId, 
                    password: data.password,
                    geniusKey: geniusKey 
                };
            }
        }
        return authData;
    }

    static async loadAuthData(req: Request): Promise<AuthData | undefined> {
        const headers = req.headers;
        const sessionId = req.query.sessionId as string;
        let authData: AuthData | undefined = ApiKeyManager.getAuthData(sessionId);
        if (!authData) {
            console.log(`No auth data found for session ${sessionId}, attempting to load from request headers`);
            if (headers) {
                const apiKey:string | string[] | undefined = req.headers['x-api-key'];
                if (apiKey && typeof apiKey === "string" && apiKey.startsWith("genius")) {
                    //We found a Genius API key, now read the actuel key from the genius dashboard by authenticating at the /api/mcp endpoint
                    authData = await this.loadAuthDataFromDashboard(apiKey);
                } else if (headers.authorization && headers.authorization.startsWith("Bearer")) {
                    // We found a Bearer token, use it as API key
                    const apiKey = headers.authorization.substring(7, headers.authorization.length);
                    authData = { apiKey: apiKey };
                } 
            }
            if (authData) {
                ApiKeyManager.setAuthData(sessionId, authData);
            }
        }
        return authData
    }
        
}