import { NextResponse } from 'next/server';
import { GrantsScraper } from '@/lib/scraper';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'Grant URL is required' }, { status: 400 });
    }

    const scraper = new GrantsScraper();
    const markdownText = await scraper.scrapeGrantPage(url);

    if (!markdownText) {
      return NextResponse.json({ error: 'Failed to extract text from the provided URL' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: markdownText.substring(0, 2000) // Returns preview of scraped data
    });

  } catch (error: any) {
    console.error('Scrape Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
