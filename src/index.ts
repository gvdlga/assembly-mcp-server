#!/usr/bin/env node
import { GeniusMcpServer, ApiKeyManager, McpFunction } from '@geniusagents/mcp';
import { TranscribeFunction } from "./functions/transcribe.function.js";
import { TranscriptionStatusFunction } from "./functions/transcriptionstatus.function.js";
import { DeleteTranscriptionFunction } from "./functions/deletetranscription.function.js";
import { ListTranscriptionsFunction } from "./functions/listtranscripts.function.js";
import { DeleteAllTranscriptionsFunction } from "./functions/deletealltranscriptions.function.js";

// Initialize the ApiKeyManager with the MCP Name for the Genius Dashboard
ApiKeyManager.initialize({
    mcpName: "Assembly",
    dashboardUrl: process.env.DASHBOARD_URL || "https://dashboard.geniusagents.nl/api/mcp"
});

const functions: McpFunction[] = [
    new TranscribeFunction(),
    new TranscriptionStatusFunction(),
    new DeleteTranscriptionFunction(),
    new ListTranscriptionsFunction(),
    new DeleteAllTranscriptionsFunction()
];

const server = new GeniusMcpServer("Assembly MCP Service", 3005, functions);
server.run().catch(console.error);