import Groq from 'groq-sdk';

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

    this.defaultModel = 'llama-3.3-70b-versatile';
    this.defaultParams = {
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 0.9,
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
}

export default GroqService;
