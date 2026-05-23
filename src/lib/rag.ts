import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';

const supabaseUrl = process.env.SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'dummy_key';
const supabase = createClient(supabaseUrl, supabaseKey);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

class GrantsRAGEngine {
  private extractor: any = null;

  async init() {
    if (!this.extractor) {
      this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    await this.init();
    const output = await this.extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  async embedPastGrant(grantId: string, text: string) {
    const embedding = await this.getEmbedding(text);
    
    const { error } = await supabase.from('past_grants').upsert({
      grant_id: grantId,
      content: text,
      embedding: embedding
    });

    if (error) {
      console.error('Error embedding grant:', error);
      throw error;
    }
    console.log(`Embedded past grant ${grantId} into Supabase.`);
  }

  async generateGrantProposal(grantRequirementsText: string): Promise<string> {
    const queryText = grantRequirementsText.substring(0, 1000);
    const queryEmbedding = await this.getEmbedding(queryText);

    const { data: matchData, error: matchError } = await supabase.rpc('match_past_grants', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 2
    });

    if (matchError) {
      console.error('Supabase match error:', matchError);
    }

    let context = '';
    if (matchData && matchData.length > 0) {
      context = matchData.map((d: any) => d.content).join('\n\n');
    }

    const prompt = `
    You are an expert federal grant proposal writer for Project Cues, Inc.
    Using the following successful past grant performance context, draft a technical grant proposal
    for the following grant requirements.
    
    PAST GRANT CONTEXT:
    ${context}
    
    GRANT REQUIREMENTS:
    ${grantRequirementsText.substring(0, 4000)}
    `;

    console.log("Sending generation request to OpenRouter (Anthropic Claude 4.6 Sonnet)...");
    
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "anthropic/claude-sonnet-4.6",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const json = await response.json();
      
      if (json.error) {
        throw new Error(json.error.message || "Unknown API error");
      }
      
      return json.choices[0].message.content;
    } catch (e: any) {
      console.log(`OpenRouter API Error: ${e.message}`);
      return "This is a simulated grant proposal for Project Cues due to an API error.";
    }
  }
}

export const grantsRAGEngine = new GrantsRAGEngine();
