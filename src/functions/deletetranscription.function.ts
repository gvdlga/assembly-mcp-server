import { ApiKeyManager } from "../utils/apikeymanager.js";
import { McpFunction } from "./function.js";
import { z } from "zod";
import { ResponseFormatter } from '../utils/ResponseFormatter.js';
import { AssemblyAI } from "assemblyai";

export class DeleteTranscriptionFunction implements McpFunction {

    public name: string = "assembly_delete_transcription";

    public description: string = "Delete a transcription from the server." ;

    public inputschema = {
        type: "object",
        properties: {
          transcriptionId: {
            type: "string",
            description: "The id of the transcription that you want to delete."
          }
        },
        required: ["transcriptionId"]
      };

    public zschema = {transcriptionId: z.string()};

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
              
            if (!args || !args.transcriptionId) {
                throw new Error("The transcriptionId parameter should be provided.");
            }
            const { transcriptionId } = args;
            const transcript = await client.transcripts.delete(transcriptionId);
            if (transcript.status === "error") {
                throw new Error(`Assembly transcription deletion failed: ${transcript.error}`);
            }

            return ResponseFormatter.formatSuccess(
                {
                    transcriptionId: transcript.id,
                    status: transcript.status
                }
            );
        } catch (error) {
            return ResponseFormatter.formatError(error);
        }
    }
  }