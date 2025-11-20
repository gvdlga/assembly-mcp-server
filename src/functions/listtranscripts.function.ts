import { ApiKeyManager, McpFunction, ResponseFormatter } from '@geniusagents/mcp';
import { AssemblyAI } from "assemblyai";

export class ListTranscriptionsFunction implements McpFunction {

    public name: string = "assembly_list_transcriptions";

    public description: string = "Get a list of all transcriptions.";

    public inputschema = {
        type: "object",
        properties: {
        }
    };

    public zschema = {};

    public async handleExecution(args: any, extra: any) {
        try {
            const sessionId = extra.sessionId;
            let apiKey: string | undefined;
            if (sessionId) {
                apiKey = ApiKeyManager.getInstance().getApiKey(sessionId);
            } else {
                apiKey = process.env.ASSEMBLY_API_KEY;
            }
            if (!apiKey || apiKey.trim() === "") {
                throw new Error("No ASSEMBLY_API_KEY provided. Cannot authorize Assembly API.")
            }
            const client = new AssemblyAI({
                apiKey: apiKey,
            });

            const { transcriptionId } = args;
            const transcriptList = await client.transcripts.list({ limit: 200 });
            return ResponseFormatter.formatSuccess(transcriptList.transcripts);
        } catch (error) {
            return ResponseFormatter.formatError(error);
        }
    }
}