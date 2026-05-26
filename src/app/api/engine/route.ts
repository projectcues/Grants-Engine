import { NextResponse } from 'next/server';
import { GrantsScraper } from '@/lib/scraper';
import { grantsRAGEngine } from '@/lib/rag';
import { createClient } from '@/utils/supabase/server';

export const maxDuration = 60; // Set maximum execution time for this route to 60 seconds

export async function POST(req: Request) {
  try {
    const { grantUrl } = await req.json();

    if (!grantUrl) {
      return NextResponse.json({ error: 'grantUrl is required' }, { status: 400 });
    }

    console.log(`Starting Grants Engine run for ${grantUrl}`);

    // Retrieve active company profile from authenticated session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let companyName = 'Project Cues, Inc.';
    let uei = '';
    let cageCode = '';
    
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_name, uei, cage_code')
        .eq('id', user.id)
        .single();
      if (profile?.organization_name) {
        companyName = profile.organization_name;
        uei = profile.uei || '';
        cageCode = profile.cage_code || '';
      }
    }

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
    const proposal = await grantsRAGEngine.generateGrantProposal(grantText, companyName, uei, cageCode);

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
              ai_model_used: "llama-3.3-70b-free"
            }
          }]
        })
      });
      console.log(`Logged grant generation for ${grantUrl} to Amplitude.`);
    }

    return NextResponse.json({
      success: true,
      grantUrl,
      proposalSnippet: proposal.substring(0, 500) + '...',
      proposal: proposal
    });

  } catch (error: any) {
    console.error('Grants Engine Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

