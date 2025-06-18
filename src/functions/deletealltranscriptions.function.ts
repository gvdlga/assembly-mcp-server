import { ApiKeyManager } from "../utils/apikeymanager.js";
import { McpFunction } from "./function.js";
import { z } from "zod";
import { ResponseFormatter } from '../utils/ResponseFormatter.js';
import { AssemblyAI, TranscriptParams } from "assemblyai";
import { TranscriptionStatusFunction } from "./transcriptionstatus.function.js";

export class DeleteAllTranscriptionsFunction implements McpFunction {

    public name: string = "assembly_delete_all_transcriptions";

    public description: string = "Delete all transcriptions from the server." ;

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
                apiKey = ApiKeyManager.getApiKey(sessionId);
            } else {
                apiKey = process.env.ASSEMBLY_API_KEY;
            }
            if (!apiKey || apiKey.trim() === "") {
                throw new Error("No ASSEMBLY_API_KEY provided. Cannot authorize Assembly API.")
            }
            const client = new AssemblyAI({
                apiKey: apiKey,
            });

            const transcriptList = await client.transcripts.list({limit: 200});
            const transcriptions = transcriptList.transcripts;
            const deleted = [];
            for (const transcript of transcriptions) {
                if (transcript.audio_url !== "deleted_by_user") {
                    const tr = await client.transcripts.delete(transcript.id);
                    if (tr.status === "error") {
                        throw new Error(`Assembly transcription deletion failed: ${tr.error}`);
                    }
                    deleted.push(tr);
                }
            }

            return ResponseFormatter.formatSuccess(deleted);
        } catch (error) {
            return ResponseFormatter.formatError(error);
        }
    }
  }