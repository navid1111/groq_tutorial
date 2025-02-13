"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const groq_sdk_1 = __importDefault(require("groq-sdk"));
class GroqService {
    constructor() {
        this.groq = new groq_sdk_1.default({
            apiKey: process.env.GROQ_API_KEY,
        });
        this.defaultModel = 'deepseek-r1-distill-llama-70b';
        this.defaultParams = {
            temperature: 0.6,
            max_tokens: 1024,
            top_p: 0.95,
        };
    }
    getCompletion(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const completion = yield this.groq.chat.completions.create(Object.assign({ messages: [{ role: 'user', content: prompt }], model: this.defaultModel }, this.defaultParams));
                return completion.choices[0].message.content || '';
            }
            catch (error) {
                console.error('Error in Groq completion:', error);
                throw error;
            }
        });
    }
    judgeAndGiveDebateScore(debateTopic, prompt1, prompt2) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Debate judging started...');
                console.log('Topic:', debateTopic);
                const completion = yield this.groq.chat.completions.create(Object.assign({ model: this.defaultModel, messages: [
                        {
                            role: 'user',
                            content: `
            You are a debate judge. Analyze these two arguments and provide scores.
            First provide your analysis between <think> tags, then provide the scores.
            
            TOPIC: ${debateTopic}
            Person 1: ${prompt1}
            Person 2: ${prompt2}
            
            Format your response exactly like this:
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
                    ] }, this.defaultParams));
                console.log('Received response from Groq');
                const content = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                if (!content) {
                    console.error('No content in response');
                    return null;
                }
                console.log('Raw response:', content);
                const scores = this.parseScores(content);
                console.log('Parsed scores:', scores);
                return scores;
            }
            catch (error) {
                console.error('Error in Groq completion:', error);
                throw error;
            }
        });
    }
    parseScores(content) {
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
        }
        catch (error) {
            console.error('Error parsing scores:', error);
            return null;
        }
    }
}
exports.default = GroqService;
