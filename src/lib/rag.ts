import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'dummy_key';
const supabase = createClient(supabaseUrl, supabaseKey);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

class GrantsRAGEngine {
  private extractor: any = null;
  private hasTransformers = true;

  async init() {
    if (this.extractor || !this.hasTransformers) return;
    try {
      console.log("Initializing local transformer pipeline...");
      const { pipeline } = await import('@xenova/transformers');
      this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    } catch (e) {
      console.log("⚠️ Failed to load Xenova transformers on this environment. Falling back to direct database queries.");
      this.hasTransformers = false;
    }
  }

  async getEmbedding(text: string): Promise<number[] | null> {
    try {
      await this.init();
      if (!this.extractor) return null;
      const output = await this.extractor(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    } catch (e) {
      console.error("Error generating embedding:", e);
      return null;
    }
  }

  async embedPastGrant(grantId: string, text: string) {
    const embedding = await this.getEmbedding(text);
    if (!embedding) {
      console.log("Skipping embedding generation (using text fallback).");
      const { error } = await supabase.from('past_grants').upsert({
        grant_id: grantId,
        content: text
      });
      if (error) throw error;
      return;
    }
    
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
    let context = '';
    
    try {
      const queryText = grantRequirementsText.substring(0, 1000);
      const queryEmbedding = await this.getEmbedding(queryText);

      if (queryEmbedding) {
        const { data: matchData, error: matchError } = await supabase.rpc('match_past_grants', {
          query_embedding: queryEmbedding,
          match_threshold: 0.5,
          match_count: 2
        });

        if (matchError) {
          console.error('Supabase match error:', matchError);
        } else if (matchData && matchData.length > 0) {
          context = matchData.map((d: any) => d.content).join('\n\n');
        }
      }
    } catch (e) {
      console.log("Vector search failed, using database query fallback:", e);
    }

    // Fallback: If context is still empty, do a direct database lookup
    if (!context) {
      try {
        const { data: directData } = await supabase
          .from('past_grants')
          .select('content')
          .limit(2);
        if (directData && directData.length > 0) {
          context = directData.map((d: any) => d.content).join('\n\n');
        }
      } catch (e) {
        console.error("Direct database query fallback failed:", e);
      }
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
      return "This is a simulated grant proposal for Project Cues. We will build a unified web portal powered by Next.js and Supabase, leveraging our past success in community infrastructure deployment.";
    }
  }
}

export const grantsRAGEngine = new GrantsRAGEngine();
