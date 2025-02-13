import Groq from 'groq-sdk';

interface DebateScores {
  winner: string;
  person1Score: number;
  person2Score: number;
  reason: string;
  analysis: string; // Add this new field
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
}

export default GroqService;
