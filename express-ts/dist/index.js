"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables first
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const groq_1 = __importDefault(require("./src/config/groq"));
const error_1 = __importDefault(require("./src/middlewares/error"));
const debate_1 = __importDefault(require("./src/routers/debate"));
const port = 8000;
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Verify API key is present
if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set in environment variables');
}
const groqService = new groq_1.default();
app.use('/debate', debate_1.default);
app.use(error_1.default);
app.listen(port, () => {
    console.log(`now listening on port ${port}`);
});
