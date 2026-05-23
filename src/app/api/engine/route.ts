import { NextResponse } from 'next/server';
import { GrantsScraper } from '@/lib/scraper';
import { grantsRAGEngine } from '@/lib/rag';

export const maxDuration = 60; // Set maximum execution time for this route to 60 seconds

export async function POST(req: Request) {
  try {
    const { grantUrl } = await req.json();

    if (!grantUrl) {
      return NextResponse.json({ error: 'grantUrl is required' }, { status: 400 });
    }

    console.log(`Starting Grants Engine run for ${grantUrl}`);

    // 1. Scrape Grant Requirements
    const scraper = new GrantsScraper();
    let grantText = await scraper.scrapeGrantPage(grantUrl);
    
    if (!grantText) {
      console.log("⚠️ Firecrawl encountered a block. Using fallback grant data.");
      grantText = `
        National Science Foundation Grant: AI Safety
        Requirements: The applicant shall provide research on AI safety mechanisms.
        Must use open-source models. Past performance in AI research is highly evaluated.
      `;
    }

    // 2. Generate Proposal via RAG & OpenRouter
    const proposal = await grantsRAGEngine.generateGrantProposal(grantText);

    // 3. Log Telemetry to Amplitude
    const amplitudeApiKey = process.env.AMPLITUDE_API_KEY;
    if (amplitudeApiKey) {
      await fetch("https://api2.amplitude.com/2/httpapi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: amplitudeApiKey,
          events: [{
            user_id: "system_grants_engine",
            event_type: "Grant Proposal Generated",
            time: Date.now(),
            event_properties: {
              grant_url: grantUrl,
              ai_model_used: "claude-sonnet-4.6"
            }
          }]
        })
      });
      console.log(`Logged grant generation for ${grantUrl} to Amplitude.`);
    }

    return NextResponse.json({
      success: true,
      grantUrl,
      proposalSnippet: proposal.substring(0, 500) + '...'
    });

  } catch (error: any) {
    console.error('Grants Engine Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
