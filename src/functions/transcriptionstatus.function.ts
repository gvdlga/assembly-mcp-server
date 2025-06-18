import { ApiKeyManager } from "../utils/apikeymanager.js";
import { McpFunction } from "./function.js";
import { z } from "zod";
import { ResponseFormatter } from '../utils/ResponseFormatter.js';
import { AssemblyAI, TranscriptParams } from "assemblyai";

export class TranscriptionStatusFunction implements McpFunction {

    public name: string = "assembly_transcriptionstatus";

    public description: string = "Get the status of a transcription." ;

    public inputschema = {
        type: "object",
        properties: {
          transcriptionId: {
            type: "string",
            description: "The id of the transcription that you want a status from."
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
            const transcript = await client.transcripts.get(transcriptionId);
            if (transcript.status === "error") {
                throw new Error(`Assembly transcription status request failed: ${transcript.error}`);
            }

            let text: string = "";

            if (transcript.utterances) {
                for (const utterance of transcript.utterances!) {
                    text = text + "Speaker " + utterance.speaker + ": " + utterance.text + "\n";
                }
            } else {
                if (transcript.text) {
                    text = transcript.text!;
                }
            }
            

            return ResponseFormatter.formatSuccess(
                {
                    transcriptionId: transcript.id,
                    status: transcript.status,
                    text: text
                }
            );
        } catch (error) {
            return ResponseFormatter.formatError(error);
        }
    }
  }