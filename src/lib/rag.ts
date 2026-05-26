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

  async generateGrantProposal(
    grantRequirementsText: string,
    companyName: string = 'Project Cues, Inc.',
    uei: string = '',
    cageCode: string = '',
    companyDomain: string = 'projectcues.com',
    contactEmail: string = 'lloydpearson@projectcues.com'
  ): Promise<string> {
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

    // Company Capabilities & Fallback Past Performances Mapping
    let capabilities = '';
    let fallbackContext = '';

    if (companyName.includes('Promo Cues')) {
      capabilities = `
        - Public outreach, audience dissemination, and program recruitment campaigns.
        - STEM outreach, health dissemination, and science communication dissemination.
        - Marketing automation systems utilizing our reseller licensing (VBOUT).
        - Digital content creation and educational material layout.
      `;
      fallbackContext = `
        PAST PERFORMANCE 1: National Public Health Outreach Campaign
        Promo Cues designed and executed a multi-channel digital recruitment campaign for NIH-funded research cohorts. We leveraged marketing automation toolsets to dispatch 200,000+ outreach communications, resulting in a 45% increase in cohort sign-ups.

        PAST PERFORMANCE 2: STEM Dissemination & Youth Outreach Portal
        Promo Cues built and managed an interactive science communication platform to educate underrepresented youth. The platform successfully registered 15,000+ students and distributed digital educational resources.
      `;
    } else if (companyName.includes('Package Cues')) {
      capabilities = `
        - Supply chain coordination, parts distribution, cargo transportation, and logistics optimization.
        - Fleet transport routing and delivery verification databases.
        - Disposal scheduling, inventory tracking systems, and procurement logs.
      `;
      fallbackContext = `
        PAST PERFORMANCE 1: Military Supply Chain Logistics Platform
        Package Cues designed and maintained a tracking database coordinating transport scheduling and parts distribution pipelines for municipal defense depots, tracking 12,000+ cargo logs annually.

        PAST PERFORMANCE 2: Fleet Disposal Tracking Database
        Package Cues built an inventory and disposal management system for regional shipping hubs, streamlining waste route scheduling and decreasing processing times by 30%.
      `;
    } else {
      // Default: Project Cues, Inc.
      capabilities = `
        - Custom software portals, web application development (Next.js, Supabase, TypeScript).
        - Database engineering, cloud integrations, and secure HIPAA-compliant storage.
        - AI-driven decision engines, LLM orchestration, and RAG pipelines.
        - Data coordinating hubs and remote mHealth channel development.
      `;
      fallbackContext = `
        PAST PERFORMANCE 1: Clinical Data Coordinating Hub
        Project Cues developed and deployed a secure, cloud-hosted data coordinating portal for NIH-funded clinical trials. The portal integrated multi-center database schemas and managed remote patient mHealth telemetry feeds.

        PAST PERFORMANCE 2: Enterprise Systems Integration & Database Migration
        Project Cues migrated legacy server data to a modern, relational database running on Supabase, building custom Next.js admin dashboards and integrating secure role-based access controls.
      `;
    }

    const prompt = `
    You are an expert federal grant proposal writer drafting a highly tailored proposal on behalf of our organization: ${companyName} (UEI: ${uei || 'N/A'}, CAGE Code: ${cageCode || 'N/A'}).
    
    OUR COMPANY DETAILS:
    - Company Name: ${companyName}
    - CAGE Code: ${cageCode || 'N/A'}
    - UEI: ${uei || 'N/A'}
    - Website Domain: ${companyDomain}
    - Primary Contact Email: ${contactEmail}
    
    OUR COMPANY CAPABILITIES:
    ${capabilities}
    
    PAST PERFORMANCE CONTEXT (RAG):
    ${context || fallbackContext}
    
    GRANT REQUIREMENTS:
    ${grantRequirementsText.substring(0, 4000)}
    
    INSTRUCTIONS:
    Draft a comprehensive, highly professional technical grant proposal that addresses all of the grant requirements listed above. Directly map our company's capabilities and past performance context to show why we are the ideal organization to receive this funding. Provide clear implementation steps, technical details (using modern technologies like Next.js, Supabase, TypeScript, and AI pipelines where relevant to the task), and write in a formal, persuasive government contracting tone. Do not use placeholders; write the response fully.

    ADDRESSING & PERSONA RULE: The proposal MUST be written directly to the soliciting agency (e.g., National Institutes of Health, Department of Health and Human Services) or the contracting officer, NOT to the user. Do NOT include any introductory comments, pleasantries, or meta-discussions addressing the user (such as 'Here is your proposal' or 'Thank you for providing company details'). Start directly with the formal proposal cover letter or technical response document addressed to the soliciting agency.
    
    CRITICAL REQUIREMENT: At the very end of your response, you MUST include a dedicated section titled "### 📤 Submission & Checklist Instructions". 
    In this section, locate and parse any submission details or rules found in the grant requirements, and provide a clear, bulleted checklist of:
    1. Where to submit (e.g. email, portal, physical address).
    2. Format requirements (e.g. PDF, font size, margins, file naming).
    3. Required attachments (e.g. budget narrative, UEI proof, key personnel resumes).
    4. Due date/time (if specified, otherwise note not specified).
    5. Any other mandatory submission checklist items.
    If specific submission instructions cannot be found, compile a general checklist based on standard federal grant submissions customized for this proposal.
    `;

    const models = [
      "meta-llama/llama-3.3-70b-instruct:free",
      "nousresearch/hermes-3-llama-3.1-405b:free",
      "liquid/lfm-2.5-1.2b-instruct:free",
      "nvidia/nemotron-nano-9b-v2:free"
    ];

    for (const model of models) {
      console.log(`Sending generation request to OpenRouter using model ${model} for ${companyName}...`);
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: prompt }]
          })
        });

        const json = await response.json();
        
        if (json.error) {
          console.warn(`Model ${model} failed: ${json.error.message || JSON.stringify(json.error)}`);
          continue; // try next model
        }
        
        if (json.choices && json.choices[0]?.message?.content) {
          return json.choices[0].message.content;
        }
      } catch (e: any) {
        console.warn(`Error with model ${model}: ${e.message}`);
      }
    }
    
    // Fallback if all models are rate-limited or fail
    return `[PROPOSAL DRAFT FOR ${companyName.toUpperCase()}]\n\nSummary of Proposal:\nWe propose a unified technical response to address the solicitation requirements. On behalf of ${companyName} (UEI: ${uei || 'N/A'}, CAGE: ${cageCode || 'N/A'}), we will utilize our core capabilities to deliver a robust solution.\n\nKey Capabilities Offered:\n${capabilities}\n\nPast Performance Reference:\n${context || fallbackContext}\n\nTechnical Approach:\nWe will build a high-performance, secure web infrastructure leveraging Next.js, Supabase, and dynamic database schemas. Our project plan includes requirements verification, architecture design, systems integration, and pilot deployment in accordance with the specified schedule. (Note: The AI generator is currently experiencing heavy rate limits, please retry in a moment to obtain a full response.)\n\n### 📤 Submission & Checklist Instructions\n- **Submission Channel**: Grants.gov / NSF FastLane portal\n- **Format**: PDF format, 1-inch margins, 11pt Arial/Georgia font minimum\n- **Required Attachments**: Project Summary, Project Description, References Cited, Biographical Sketches, Budget and Budget Justification, Current and Pending Support\n- **Due Date**: Refer to official grant solicitation page`;
  }
}

export const grantsRAGEngine = new GrantsRAGEngine();
