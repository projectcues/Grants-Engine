import { NextResponse } from 'next/server';
import { GrantsScraper } from '@/lib/scraper';
import { grantsRAGEngine } from '@/lib/rag';
import { createClient } from '@supabase/supabase-js';
import { authenticateRequest } from '@/utils/auth';

export const maxDuration = 60; // Set maximum execution time for this route to 60 seconds

export async function POST(req: Request) {
  try {
    const { grantUrl } = await req.json();

    if (!grantUrl) {
      return NextResponse.json({ error: 'grantUrl is required' }, { status: 400 });
    }

    // Verify authentication via session cookie or API key
    const authResult = await authenticateRequest(req);
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Starting Grants Engine run for ${grantUrl} (user: ${authResult.userId})`);

    // Retrieve active company profile from Supabase service client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dbzbsqreymotzovhgodv.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let companyName = 'Project Cues, Inc.';
    let uei = '';
    let cageCode = '';
    let companyDomain = 'projectcues.com';
    let contactEmail = 'lloydpearson@projectcues.com';
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_name, uei, cage_code')
      .eq('id', authResult.userId)
      .single();

    if (profile?.organization_name) {
      companyName = profile.organization_name;
      uei = profile.uei || '';
      cageCode = profile.cage_code || '';
      
      if (companyName.includes('Promo Cues')) {
        companyDomain = 'promocues.com';
        contactEmail = 'lloydpearson@promocues.com';
      } else if (companyName.includes('Package Cues')) {
        companyDomain = 'packagecues.com';
        contactEmail = 'lloydpearson@packagecues.com';
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
    const proposal = await grantsRAGEngine.generateGrantProposal(grantText, companyName, uei, cageCode, companyDomain, contactEmail);

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

