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
        this.defaultModel = 'llama-3.3-70b-versatile';
        this.defaultParams = {
            temperature: 0.7,
            max_tokens: 1000,
            top_p: 0.9,
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
}
exports.default = GroqService;
