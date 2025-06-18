import { ApiKeyManager } from "../utils/apikeymanager.js";
import { McpFunction } from "./function.js";
import { z } from "zod";
import { ResponseFormatter } from '../utils/ResponseFormatter.js';
import { AssemblyAI, TranscriptParams } from "assemblyai";

export class TranscribeFunction implements McpFunction {

    public name: string = "assembly_transcribe";

    public description: string = "Transcribe an audio file to text." ;

    public inputschema = {
        type: "object",
        properties: {
          audio: {
            type: "string",
            description: "The filename or file url of the audio file."
          },
          speakerLabels: {
            type: "boolean",
            description: "Set speakerLabels to true when you want to identify each speaker in an audiofile."
          },
          languageCode: {
            type: "string",
            description: "Two letter code for the language of the audio file."
          }
        },
        required: ["address"]
      };

    public zschema = {audio: z.string(), speakerLabels: z.boolean().optional(), languageCode: z.string().optional()};

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
              
            if (!args || !args.audio) {
                throw new Error("The audio parameter should be provided and should indicate the location of the audio file.");
            }
            const { audio, speakerLabels, languageCode } = args;
            const data: any = {
                audio: audio,
                speech_model: "best",
                speaker_labels: (speakerLabels === true),
                language_code: (languageCode?languageCode:"nl"),
            }
              
            const transcript = await client.transcripts.submit(data);
            if (transcript.status === "error") {
                throw new Error(`Assembly transcription failed: ${transcript.error}`);
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