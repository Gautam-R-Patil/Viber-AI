// FIX: Import GenerateContentResponse to correctly type API stream and generateContent responses.
// FIX: Corrected imports from "@google/genai". Removed types that are not exported (LiveSession, SystemInstruction, CloseEvent, ErrorEvent) and corrected typo FunctionDeclarationTool to FunctionDeclaration.
// FIX: Removed SystemInstruction from import as it is not a public type and the systemInstruction parameter should be a string.
// FIX: Added 'Type' to imports for defining a JSON schema for code suggestions.
import { GoogleGenAI, Tool, GenerateContentResponse, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from '@google/genai';
import { ApiHistoryItem, GroundingSource, GeneratedFile, GeneratedFileType, ApiPart, ProjectState } from '../types';
import { frontendSystemInstruction } from '../prompts/agents/frontend';
import { enhancerSystemInstruction } from '../prompts/agents/enhancer';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not found.");
}

// --- AUDIO UTILITIES for LIVE API ---

/** Encodes raw audio bytes into a Base64 string. */
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/** Decodes a Base64 string into raw audio bytes. */
function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer that the browser can play.
 * The browser's native `decodeAudioData` is for file formats like MP3/WAV, not raw streams.
 */
async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    // FIX: Corrected typo from Int116Array to Int16Array.
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


/** Creates a Blob object for the Live API from raw microphone audio data. */
export function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    // Convert Float32Array to Int16Array
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000', // Live API requires 16000Hz PCM audio
    };
}


/**
 * Connects to the Gemini Live API for a real-time, two-way audio conversation.
 * @param systemInstruction The system prompt for the AI agent.
 * @param callbacks An object containing handlers for session events (onopen, onmessage, etc.).
 * @param tools Optional array of tools (e.g., function declarations) for the AI.
 * @returns A promise that resolves with the active LiveSession instance.
 */
// FIX: Corrected the function signature to use public types. `systemInstruction` is a `string`, and the return type is inferred from the SDK.
export const connectLiveSession = (
  systemInstruction: string,
  callbacks: {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => void;
    onerror: (e: ErrorEvent) => void;
    onclose: (e: CloseEvent) => void;
  },
  tools?: Tool[],
) => {
    if (!API_KEY) throw new Error("Missing API Key...");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction,
            ...(tools && { tools })
        },
    });
};


/**
 * Parses the suggested retry delay from a Gemini API error response.
 * @param error The error object from the API call.
 * @returns The suggested delay in milliseconds, or null if not found.
 */
const getRetryDelay = (error: any): number | null => {
    try {
        // The error message from the SDK is often a JSON string.
        const errorMessage = error?.message || '';
        const errorJson = JSON.parse(errorMessage);
        
        // The actual Google API error is nested inside the 'error' property.
        const googleApiError = errorJson.error || errorJson;

        const details = googleApiError?.details;
        if (Array.isArray(details)) {
            const retryInfo = details.find(
                (d: any) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
            );
            if (retryInfo?.retryDelay) {
                // The delay is in the format "38s" or "38.123s".
                const delayStr = retryInfo.retryDelay;
                const seconds = parseFloat(delayStr.replace('s', ''));
                if (!isNaN(seconds)) {
                    // Convert to milliseconds and add a small buffer (500ms) to be safe.
                    return seconds * 1000 + 500;
                }
            }
        }
    } catch (e) {
        // Parsing failed, which is acceptable. We'll fall back to exponential backoff.
    }
    return null;
};


/**
 * A utility function to retry an async operation with exponential backoff.
 * It now intelligently handles API-suggested retry delays for rate-limiting errors.
 * @param operation The async function to execute.
 * @param isRetryable A function that determines if an error is retryable.
 * @param maxRetries The maximum number of retries.
 * @param initialDelay The initial delay in milliseconds.
 * @returns A promise that resolves with the result of the operation.
 */
async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    isRetryable: (error: any) => boolean,
    maxRetries: number = 5,
    initialDelay: number = 2000
): Promise<T> {
    let delay = initialDelay;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            if (isRetryable(error) && i < maxRetries - 1) {
                const apiSuggestedDelay = getRetryDelay(error);
                const waitTime = apiSuggestedDelay || delay;

                console.warn(`Attempt ${i + 1} failed due to a retryable error. Retrying in ${Math.round(waitTime / 1000)}s...`, error.message);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                
                // If we didn't get a suggested delay from the API, use exponential backoff for the next potential failure.
                if (!apiSuggestedDelay) {
                    delay *= 2;
                }
            } else {
                console.error(`Attempt ${i + 1} failed. No more retries.`, error);
                // Rethrow the last error if not retryable or max retries are reached
                throw error;
            }
        }
    }
    // This line should not be reachable if the loop logic is correct.
    throw new Error('Max retries reached without success.');
}

/**
 * Checks if an error is retryable, such as a rate limit (429) or server overload (503) error.
 * @param error The error object.
 * @returns True if the error is retryable, false otherwise.
 */
const isRetryableError = (error: any): boolean => {
    const errorMessage = (error?.message || '').toLowerCase();
    // The Gemini API can return 503 (UNAVAILABLE/overloaded) or 429 (RESOURCE_EXHAUSTED/rate-limited) errors.
    // The error message might be a stringified JSON.
    return (
        errorMessage.includes('503') ||
        errorMessage.includes('overloaded') ||
        errorMessage.includes('unavailable') ||
        errorMessage.includes('429') ||
        errorMessage.includes('resource_exhausted')
    );
};


/**
 * Escapes special characters in a string for use in a regular expression.
 * @param {string} str The string to escape.
 * @returns {string} The escaped string.
 */
function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}


/**
 * Generates website code from a prompt, streaming the results file by file.
 * This function now also parses a `[THINK]...[/THINK]` block from the beginning of the stream,
 * yielding it as a separate object so the UI can display the AI's plan before showing the code.
 */
export async function* generateWebsiteCodeStream(prompt: string, isThinkingMode: boolean): AsyncGenerator<GeneratedFile | { thoughts: string }> {
  if (!API_KEY) {
    throw new Error("Missing API Key. Please ensure the API_KEY environment variable is set.");
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
      const model = isThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
      const config: { systemInstruction: string, thinkingConfig?: { thinkingBudget: number } } = {
        systemInstruction: frontendSystemInstruction,
      };

      if (isThinkingMode) {
          config.thinkingConfig = { thinkingBudget: 32768 };
      }

      const operation = () => ai.models.generateContentStream({ model, contents: prompt, config });
      const stream = await retryWithBackoff<AsyncGenerator<GenerateContentResponse>>(operation, isRetryableError);

      let buffer = '';
      let thoughtsParsed = false;
      let currentFile: { name: string; type: GeneratedFileType } | null = null;
      let currentContent = '';

      for await (const chunk of stream) {
          buffer += chunk.text || '';

          // FIX: Correctly buffer and parse thoughts that may be split across multiple chunks.
          if (!thoughtsParsed) {
              const endTagIndex = buffer.indexOf('[/THINK]');
              if (endTagIndex !== -1) {
                  const startTagIndex = buffer.indexOf('[THINK]');
                  if (startTagIndex !== -1 && startTagIndex < endTagIndex) {
                      const thoughts = buffer.substring(startTagIndex + 7, endTagIndex).trim();
                      yield { thoughts };
                      buffer = buffer.substring(endTagIndex + 8).trimStart();
                  }
                  thoughtsParsed = true;
              } else if (buffer.length > 200 && !buffer.includes('[THINK]')) {
                  // Fallback: If no [THINK] tag appears after a reasonable number of characters,
                  // assume the model skipped it and proceed with file parsing.
                  thoughtsParsed = true;
              }
          }
          
          if (!thoughtsParsed) continue; // Keep buffering until thoughts are processed or skipped

          while(true) {
              if (!currentFile) {
                  const startMatch = buffer.match(/`?\[START_FILE:([\w/.-]+)]`?/);
                  if (startMatch) {
                      currentFile = { name: startMatch[1], type: startMatch[1].split('.').pop() as GeneratedFileType };
                      currentContent = '';
                      buffer = buffer.substring(startMatch.index! + startMatch[0].length);
                  } else {
                      break;
                  }
              }

              if (currentFile) {
                  const endMarkerRegex = new RegExp(`\`?\\[END_FILE:${escapeRegExp(currentFile.name)}]\`?`);
                  const nextStartMatch = buffer.match(/`?\[START_FILE:[\w/.-]+]`?/);
                  const endMatch = buffer.match(endMarkerRegex);

                  const endMarkerIndex = endMatch?.index;
                  const nextStartMarkerIndex = nextStartMatch?.index;
                  
                  let fileBoundaryIndex: number | undefined;
                  let isImplicitEnd = false;

                  if (endMarkerIndex !== undefined && nextStartMarkerIndex !== undefined) {
                      fileBoundaryIndex = Math.min(endMarkerIndex, nextStartMarkerIndex);
                      isImplicitEnd = nextStartMarkerIndex < endMarkerIndex;
                  } else {
                      fileBoundaryIndex = endMarkerIndex ?? nextStartMarkerIndex;
                      isImplicitEnd = fileBoundaryIndex === nextStartMarkerIndex;
                  }
                  
                  if (fileBoundaryIndex !== undefined) {
                      const contentPart = buffer.substring(0, fileBoundaryIndex);
                      currentContent += contentPart;
                      yield { ...currentFile, content: currentContent };

                      const markerLength = isImplicitEnd ? 0 : endMatch![0].length;
                      buffer = buffer.substring(fileBoundaryIndex + markerLength);
                      
                      currentFile = null;
                      currentContent = '';
                      continue;
                  } else {
                      // FIX: When no full boundary marker is found, avoid consuming a partial marker
                      // at the end of the buffer by processing only the content before the last
                      // potential marker start ('[').
                      const lastBracketIndex = buffer.lastIndexOf('[');

                      let contentPart = buffer;
                      if (lastBracketIndex !== -1) {
                          contentPart = buffer.substring(0, lastBracketIndex);
                          buffer = buffer.substring(lastBracketIndex);
                      } else {
                          buffer = '';
                      }
                      
                      if (contentPart) {
                          currentContent += contentPart;
                          yield { ...currentFile, content: currentContent };
                      }
                      break;
                  }
              }
          }
      }
      
      if (currentFile && buffer) {
        currentContent += buffer;
        yield { ...currentFile, content: currentContent };
      }

  } catch (error) {
    console.error('Error generating website code:', error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate website: ${error.message}`);
    }
    throw new Error('An unknown error occurred while generating the website.');
  }
}

const parseThoughtsAndText = (text: string | undefined): { thoughts?: string; text: string } => {
    const safeText = text || '';
    const thoughtMatch = safeText.match(/^\[THINK\]([\s\S]*?)\[\/THINK\]\s*/);
    if (thoughtMatch) {
        return {
            thoughts: thoughtMatch[1].trim(),
            text: safeText.substring(thoughtMatch[0].length),
        };
    }
    return { text: safeText };
};


export async function getAgentResponse(history: ApiHistoryItem[], systemInstruction: string, tools?: Tool[]): Promise<{ text: string; rawText: string; sources?: GroundingSource[]; thoughts?: string }> {
    if (!API_KEY) {
        throw new Error("Missing API Key. Please ensure the API_KEY environment variable is set.");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    try {
        const operation = () => {
            const lastUserMessage = history.length > 0 ? history[history.length - 1] : null;
            const filePart = lastUserMessage?.parts.find(part => typeof part !== 'string' && 'inlineData' in part) as { inlineData: { mimeType: string } } | undefined;

            let modelName = 'gemini-2.5-flash'; // Default model
            if (filePart?.inlineData.mimeType.startsWith('video/')) {
                modelName = 'gemini-2.5-pro';
            } else if (filePart?.inlineData.mimeType.startsWith('image/')) {
                modelName = 'gemini-2.5-flash';
            }
            
            const contents = history.length > 0 ? history : [{role: 'user', parts: [{text: "As the Manager AI, greet the user and start the conversation based on your instructions."}]}];
    
            return ai.models.generateContent({
                model: modelName,
                contents: contents,
                config: { systemInstruction, ...(tools && { tools }) }
            });
        };

        const response = await retryWithBackoff<GenerateContentResponse>(operation, isRetryableError);
        const rawText = response.text || ''; // Get the raw response
        const { thoughts, text } = parseThoughtsAndText(rawText); // Parse it for clean text and thoughts
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

        const sources: GroundingSource[] = [];
        if (groundingChunks) {
            for (const chunk of groundingChunks) {
                if (chunk.web && chunk.web.uri && chunk.web.title) {
                    sources.push({ uri: chunk.web.uri, title: chunk.web.title });
                }
            }
        }
        
        // Return both the clean text and the raw text
        return { text, rawText, thoughts, sources: sources.length > 0 ? sources : undefined };

    } catch (error) {
        console.error('Error in getAgentResponse:', error);
        if (error instanceof Error) {
            throw new Error(`Chat failed: ${error.message}`);
        }
        throw new Error('An unknown error occurred during the chat.');
    }
}

export async function* getAgentResponseStream(history: ApiHistoryItem[], systemInstruction: string, tools?: Tool[]): AsyncGenerator<{ textChunk: string; sources?: GroundingSource[]; thoughts?: string }> {
    if (!API_KEY) throw new Error("Missing API Key...");
    
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    try {
        const operation = () => {
            const lastUserMessage = history.length > 0 ? history[history.length - 1] : null;
            const filePart = lastUserMessage?.parts.find(part => typeof part !== 'string' && 'inlineData' in part) as { inlineData: { mimeType: string } } | undefined;

            let modelName = 'gemini-2.5-flash'; // Default model
            if (filePart?.inlineData.mimeType.startsWith('video/')) {
                modelName = 'gemini-2.5-pro';
            } else if (filePart?.inlineData.mimeType.startsWith('image/')) {
                modelName = 'gemini-2.5-flash';
            }

            return ai.models.generateContentStream({
                model: modelName,
                contents: history.length > 0 ? history : [{ role: 'user', parts: [{ text: "Greet user and start conversation." }] }],
                config: { systemInstruction, ...(tools && { tools }) }
            });
        };

        const stream = await retryWithBackoff<AsyncGenerator<GenerateContentResponse>>(operation, isRetryableError);

        let buffer = '';
        let thoughtsParsed = false;
        let sourcesSent = false;

        for await (const chunk of stream) {
            // FIX: Ensure candidates exist before accessing them to prevent runtime errors.
            const candidate = chunk.candidates?.[0];

            // FIX: The `.text` property is a convenience accessor on the `GenerateContentResponse` (chunk), not on the `Candidate` object.
            buffer += chunk.text || '';

            if (!candidate) continue;

            let sources: GroundingSource[] | undefined;
            if (!sourcesSent) {
                const groundingChunks = candidate.groundingMetadata?.groundingChunks;
                const tempSources: GroundingSource[] = [];
                if (groundingChunks) {
                    for (const groundChunk of groundingChunks) {
                        if (groundChunk.web?.uri && groundChunk.web?.title) {
                            tempSources.push({ uri: groundChunk.web.uri, title: groundChunk.web.title });
                        }
                    }
                }
                if (tempSources.length > 0) {
                    sources = tempSources;
                    sourcesSent = true;
                }
            }

            if (thoughtsParsed) {
                if (buffer) {
                    yield { textChunk: buffer, sources };
                    buffer = '';
                }
                // If sources were found in this chunk, yield them even if buffer is empty
                else if (sources) {
                    yield { textChunk: '', sources };
                }
                continue;
            }

            const endTagIndex = buffer.indexOf('[/THINK]');
            if (endTagIndex !== -1) {
                const startTagIndex = buffer.indexOf('[THINK]');
                if (startTagIndex !== -1 && startTagIndex < endTagIndex) {
                    const thoughts = buffer.substring(startTagIndex + 7, endTagIndex).trim();
                    const remainingText = buffer.substring(endTagIndex + 8);
                    yield { textChunk: remainingText, sources, thoughts };
                    buffer = ''; // Clear buffer since it's all processed.
                } else {
                    // Found a stray [/THINK] without a start, treat as text
                    yield { textChunk: buffer, sources };
                    buffer = '';
                }
                thoughtsParsed = true;
            } else if (buffer.length > 500 && !buffer.includes('[THINK]')) {
                 // Fallback: If no [THINK] tag appears after a reasonable number of characters,
                 // assume the model skipped it and proceed.
                thoughtsParsed = true;
                yield { textChunk: buffer, sources };
                buffer = '';
            }
            // If we're here, it means we're still waiting for [/THINK], so we buffer and continue to the next chunk.
        }

        if (buffer) {
            yield { textChunk: buffer };
        }
    } catch (error) {
        console.error('Error in getAgentResponseStream:', error);
        if (error instanceof Error) {
            throw new Error(`Chat stream failed: ${error.message}`);
        }
        throw new Error('An unknown error occurred during the chat stream.');
    }
}

/**
 * Generates a concise summary of a completed project to be stored in the knowledge base.
 * @param project The project state object to summarize.
 * @returns A promise that resolves with a summary string.
 */
export async function summarizeProjectForMemory(project: ProjectState): Promise<string> {
    if (!API_KEY) {
        throw new Error("Missing API Key. Please ensure the API_KEY environment variable is set.");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const summarizationPrompt = `
        You are a memory consolidation AI. Your task is to create a concise, one-paragraph summary of the following web development project for future reference.
        This summary will be shown to another AI to give it context from past work.
        Focus on the project's core purpose, key features, and design aesthetic. Do not include conversational filler.

        Project Title: "${project.title}"

        Product Requirements Document (PRD):
        ---
        ${project.prdContent}
        ---

        Final generated files: ${project.generatedCode.files.map(f => f.name).join(', ')}

        Now, produce the summary.
    `;

    try {
        const operation = () => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: summarizationPrompt }] }],
            config: { systemInstruction: "You are an expert summarizer. Be brief and factual." }
        });

        const response = await retryWithBackoff<GenerateContentResponse>(operation, isRetryableError);
        return response.text?.trim() || "Could not summarize project.";
    } catch (error) {
        console.error("Error summarizing project for memory:", error);
        return `Failed to summarize project "${project.title}".`;
    }
}

/**
 * Generates code completion suggestions using the Gemini API.
 * @param codeBeforeCursor The code in the current file up to the cursor position.
 * @param fileName The name of the file being edited.
 * @returns A promise that resolves with an array of suggestion strings.
 */
export async function getCodeSuggestions(codeBeforeCursor: string, fileName: string): Promise<string[]> {
    if (!API_KEY) {
        console.warn("API_KEY not found. Code completion will be disabled.");
        return [];
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // Determine language from file name for the prompt
    const language = fileName.split('.').pop() || 'plaintext';

    const prompt = `
        You are an AI code completion assistant inside a code editor.
        Based on the code context from the file "${fileName}", provide relevant code completions.
        The cursor is at the end of this code snippet:
        \`\`\`${language}
        ${codeBeforeCursor}
        \`\`\`
        Provide up to 3 concise code completion suggestions.
    `;

    try {
        const operation = () => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: 'A single code completion suggestion.'
                            },
                            description: 'A list of code completion suggestions.'
                        }
                    },
                    required: ['suggestions']
                },
                temperature: 0.2,
                maxOutputTokens: 150,
            }
        });
        
        // Use retryWithBackoff in case of rate limiting, with fewer retries for quick feedback.
        const response = await retryWithBackoff<GenerateContentResponse>(operation, isRetryableError, 2, 500);

        const jsonText = response.text?.trim();
        if (!jsonText) return [];
        
        const result = JSON.parse(jsonText);

        if (result.suggestions && Array.isArray(result.suggestions)) {
            return result.suggestions.filter((s: any) => typeof s === 'string');
        }

        return [];
    } catch (error) {
        // Don't spam console for completion errors, as they can happen frequently
        // console.error('Error getting code suggestions:', error);
        return [];
    }
}

/**
 * Takes a user's simple prompt and enhances it using the Gemini API to be more detailed.
 * @param prompt The user's input string.
 * @returns A promise that resolves with the enhanced prompt string.
 */
export async function enhancePrompt(prompt: string): Promise<string> {
    if (!API_KEY) {
        throw new Error("Missing API Key. Cannot enhance prompt.");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        const operation = () => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { systemInstruction: enhancerSystemInstruction, temperature: 0.8 }
        });
        
        // Use retryWithBackoff for resilience, but with fewer retries for a quick user-facing feature.
        const response = await retryWithBackoff<GenerateContentResponse>(operation, isRetryableError, 2, 1000);
        return response.text?.trim() || prompt; // Fallback to original prompt on empty response
    } catch (error) {
        console.error("Error enhancing prompt:", error);
        // In case of an error, just return the original prompt to avoid disrupting the user flow.
        return prompt;
    }
}
