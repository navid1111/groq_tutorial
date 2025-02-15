import fs from 'fs';
import Groq, {
  ChatCompletionAssistantMessageParam,
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
} from 'groq-sdk';
import { ChatCompletionTool } from 'groq-sdk/resources/chat/completions';
import { Inventroy } from './../models/Inventory';

interface DebateScores {
  winner: string;
  person1Score: number;
  person2Score: number;
  reason: string;
  analysis: string; // Add this new field
}

interface TranscriptionOptions {
  language?: string;
  prompt?: string;
}

// Add interface for inventory response
interface InventoryResponse {
  productId: string;
  quantity: number;
  location: string;
  status: string;
  lastUpdated: string;
}

// Add interface for tool call arguments
interface InventoryToolArgs {
  productId: string;
  location?: string;
  detailed?: boolean;
}

class GroqService {
  private groq: Groq;
  private defaultModel: string;
  private defaultParams: {
    temperature: number;
    max_tokens: number;
    top_p: number;
  };

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    this.defaultModel = 'deepseek-r1-distill-llama-70b';
    this.defaultParams = {
      temperature: 0.6,
      max_tokens: 1024,
      top_p: 0.95,
    };
  }

  async getCompletion(prompt: string) {
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: this.defaultModel,
        ...this.defaultParams,
      });
      return completion.choices[0].message.content || '';
    } catch (error) {
      console.error('Error in Groq completion:', error);
      throw error;
    }
  }

  async getDiseaseOfPlant(imageUrl: string): Promise<any> {
    // Return type is now 'any' or a specific interface
    try {
      const response = await this.groq.chat.completions.create({
        model: 'llama-3.2-90b-vision-preview',
        ...this.defaultParams,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Identify the plant and predict the most likely disease affecting it (if any) in this image. Respond in JSON format ONLY, with no other text or explanations.  Use the following JSON structure:

{
  "plant": "[Plant Name]",
  "disease": "[Disease Name]",
  "probability": "[Probability Percentage]"
}

If the image does not contain a clear plant leaf, respond ONLY with:

{
  "error": "Please provide an image of a plant leaf."
}

If no disease is detected, use:

{
  "plant": "[Plant Name]",
  "disease": "None",
  "probability": "100%"
}
`,
              },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        return { error: 'No response from model.' }; // Handle empty response
      }

      try {
        const jsonResponse = JSON.parse(content);
        return jsonResponse; // Return the parsed JSON object
      } catch (jsonError) {
        console.error('Error parsing JSON:', jsonError, content); // Log parsing error and content
        return { error: 'Invalid JSON response from model.' }; // Handle JSON parsing error
      }
    } catch (error) {
      console.error('Error diagnosing plant disease:', error);
      return { error: 'Failed to diagnose plant disease. Please try again.' }; // Return error object
    }
  }
  async judgeAndGiveDebateScore(
    debateTopic: string,
    prompt1: string,
    prompt2: string,
  ): Promise<DebateScores | null> {
    try {
      console.log('Debate judging started...');
      console.log('Topic:', debateTopic);

      const completion = await this.groq.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'user',
            content: `
            You are a debate judge. Analyze these two arguments and provide scores.
            First provide your analysis between <think> tags, then provide the scores.
            
            TOPIC: ${debateTopic}
            Person 1: ${prompt1}
            Person 2: ${prompt2}
            
            Format your response EXACTLY like this - do not deviate from this format:
            <think>
            [Your detailed analysis here]
            </think>
            
            Winner: [Person 1/Person 2]
            Person 1 Score: [0-100]
            Person 2 Score: [0-100]
            
            Reasoning:
            [Detailed reasoning for the scores]
          `,
          },
        ],
        ...this.defaultParams,
      });

      console.log('Received response from Groq');
      const content = completion.choices[0]?.message?.content;

      if (!content) {
        console.error('No content in response');
        return null;
      }

      console.log('Raw response:', content);
      const scores = this.parseScores(content);
      console.log('Parsed scores:', scores);

      return scores;
    } catch (error) {
      console.error('Error in Groq completion:', error);
      throw error;
    }
  }

  private parseScores(content: string): DebateScores | null {
    try {
      const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
      const person1Match = content.match(/Person 1 Score: (\d+)/);
      const person2Match = content.match(/Person 2 Score: (\d+)/);
      const winnerMatch = content.match(/Winner: (Person \d)/);

      if (!person1Match || !person2Match || !winnerMatch) {
        console.error('Could not parse scores from response');
        return null;
      }

      return {
        winner: winnerMatch[1],
        person1Score: parseInt(person1Match[1]),
        person2Score: parseInt(person2Match[1]),
        reason: content.includes('Reasoning:')
          ? content.split('Reasoning:')[1].trim()
          : 'No detailed reasoning provided',
        analysis: thinkMatch ? thinkMatch[1].trim() : 'No analysis provided',
      };
    } catch (error) {
      console.error('Error parsing scores:', error);
      return null;
    }
  }

  async transcribeAudio(
    filePath: string,
    options: TranscriptionOptions = {},
  ): Promise<string> {
    let fileStream: fs.ReadStream | null = null;
    try {
      console.log('Starting transcription for:', filePath);

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      fileStream = fs.createReadStream(filePath);
      console.log('Created file stream');

      // Log the file details
      const stats = fs.statSync(filePath);
      console.log('File stats:', {
        size: stats.size,
        path: filePath,
      });

      const response = await this.groq.audio.transcriptions.create({
        file: fileStream,
        model: 'whisper-large-v3',
        language: options.language || 'en',
        prompt: options.prompt,
        response_format: 'json', // Changed from 'text' to 'json'
      });

      console.log('Raw API response:', response);

      // Handle different response formats
      const transcription = response.text;

      if (!transcription) {
        console.error('Invalid API response:', response);
        throw new Error('No transcription received from API');
      }

      console.log('Transcription completed successfully');
      return transcription;
    } catch (error: any) {
      console.error('Transcription error:', {
        message: error.message,
        stack: error.stack,
        filePath,
      });
      throw new Error(`Transcription failed: ${error.message}`);
    } finally {
      if (fileStream) {
        fileStream.destroy();
      }
    }
  }

  private tools: ChatCompletionTool[] = [
    {
      type: 'function',
      function: {
        name: 'check_inventory',
        description: `Retrieve real-time inventory information including stock levels, locations, 
                     restock dates, and product availability. Supports multiple identification methods
                     and localization. Returns JSON data with inventory details or error information.`,
        parameters: {
          type: 'object',
          properties: {
            productId: {
              type: 'string',
              description:
                'Unique product identifier (e.g., SKU, UPC, or internal ID). Example: "PROD-23567-2023"',
            },
            productName: {
              type: 'string',
              description:
                'Product name for fuzzy matching (use when ID not available)',
            },
            location: {
              type: 'string',
              description:
                'Warehouse/Site ID to check specific inventory. Example: "WAREHOUSE-NY-12"',
              default: 'all',
            },
            language: {
              type: 'string',
              description:
                'Response language code (ISO 639-1). Example: "en", "es", "fr"',
              default: 'en',
            },
            detailed: {
              type: 'boolean',
              description: 'Return extended inventory details when true',
              default: false,
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (pagination)',
              minimum: 1,
              maximum: 100,
              default: 10,
            },
            offset: {
              type: 'number',
              description: 'Pagination offset for large result sets',
              minimum: 0,
              default: 0,
            },
          },
          required: ['productId'],
          oneOf: [{ required: ['productId'] }, { required: ['productName'] }],
          additionalProperties: false,
        },
      },
    },
  ];
  async checkInventory(query: string): Promise<string> {
    try {
      // Initial request to get tool calls
      const initialResponse = await this.groq.chat.completions.create({
        model: this.defaultModel,
        ...this.defaultParams,
        messages: [
          {
            role: 'user',
            content: query,
          } as ChatCompletionUserMessageParam,
        ],
        tools: this.tools,
        tool_choice: 'auto',
      } as ChatCompletionCreateParams);

      const message = initialResponse.choices[0]?.message;
      if (!message) {
        throw new Error('No valid response from Groq API');
      }

      const toolCalls = message.tool_calls || [];
      if (toolCalls.length === 0) {
        return message.content || 'No tool calls detected in response';
      }

      // Process tool calls with proper typing
      const toolResponses: ChatCompletionToolMessageParam[] = await Promise.all(
        toolCalls.map(async toolCall => {
          try {
            const args = JSON.parse(
              toolCall.function.arguments,
            ) as InventoryToolArgs;

            if (!args.productId) {
              throw new Error('Missing productId in tool arguments');
            }

            const inventory = await Inventroy.getInventoryStatus(
              args.productId,
            );

            return {
              role: 'tool',
              content: JSON.stringify(inventory),
              tool_call_id: toolCall.id,
            };
          } catch (error) {
            console.error('Tool call processing error:', error);
            return {
              role: 'tool',
              content: JSON.stringify({
                error: 'Failed to retrieve inventory',
              }),
              tool_call_id: toolCall.id,
            };
          }
        }),
      );

      // Prepare messages for final response
      const messages: ChatCompletionMessageParam[] = [
        { role: 'user', content: query } as ChatCompletionUserMessageParam,
        {
          role: 'assistant',
          content: message.content,
          tool_calls: message.tool_calls,
        } as ChatCompletionAssistantMessageParam,
        ...toolResponses,
      ];

      // Get final response with proper typing
      const finalResponse = await this.groq.chat.completions.create({
        model: this.defaultModel,
        ...this.defaultParams,
        messages,
      } as ChatCompletionCreateParams);

      const finalContent = finalResponse.choices[0]?.message?.content;
      if (!finalContent) {
        throw new Error('No content in final response');
      }

      return finalContent;
    } catch (error) {
      console.error('Inventory check error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(
        `Inventory check failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}

export default GroqService;
