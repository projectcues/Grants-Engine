import FirecrawlApp from '@mendable/firecrawl-js';

export class GrantsScraper {
  private app: FirecrawlApp;

  constructor() {
    this.app = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY
    });
  }

  async scrapeGrantPage(url: string): Promise<string> {
    console.log(`Scraping grant requirements from ${url}...`);
    try {
      const response = await this.app.scrape(url, {
        formats: ['markdown']
      });
      
      return response.markdown || '';
    } catch (e: any) {
      console.error(`Error scraping Grant URL: ${e}`);
      return '';
    }
  }
}
