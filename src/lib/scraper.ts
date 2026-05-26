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
      
      const primaryMarkdown = response.markdown || '';
      
      // Extract links from markdown
      const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
      const allLinks: { text: string; url: string }[] = [];
      let match;
      while ((match = linkRegex.exec(primaryMarkdown)) !== null) {
        allLinks.push({ text: match[1].trim(), url: match[2].trim() });
      }

      // Filter high-value guidelines (NIH guide, NSF opportunity solicitation pages, agency detail links)
      const guidelineLinks = allLinks.filter(lnk => {
        const u = lnk.url.toLowerCase();
        if (u.includes('grants.gov') && !u.includes('apply07.grants.gov')) return false;
        if (u.includes('twitter.com') || u.includes('youtube.com') || u.includes('blogspot.com') || u.includes('adobe.com') || u.includes('hhs.gov/privacy') || u.includes('hhs.gov/vulnerability') || u.includes('usa.gov') || u.includes('whitehouse.gov') || u.includes('usaspending.gov') || u.includes('sba.gov') || u.includes('sam.gov') || u.includes('ignet.gov') || u.includes('mailto:')) return false;
        return true;
      });

      // Filter attachments and forms
      const attachmentLinks = allLinks.filter(lnk => {
        const u = lnk.url.toLowerCase();
        return u.endsWith('.pdf') || u.endsWith('.docx') || u.endsWith('.doc') || u.endsWith('.zip') || u.endsWith('.xlsx') || u.endsWith('.xls') || u.includes('apply07.grants.gov') || lnk.text.toLowerCase().includes('apply') || lnk.text.toLowerCase().includes('package') || lnk.text.toLowerCase().includes('form');
      });

      let extraContent = '';
      
      // Scrape top 1 guideline link (limit to 1 to stay safe on route execution time)
      const maxSubScrapes = 1;
      const scrapedUrls = new Set<string>();
      
      for (let i = 0; i < Math.min(guidelineLinks.length, maxSubScrapes); i++) {
        const subLink = guidelineLinks[i];
        if (scrapedUrls.has(subLink.url)) continue;
        scrapedUrls.add(subLink.url);
        
        console.log(`Deep crawling guideline document: ${subLink.text} (${subLink.url})...`);
        try {
          const subResponse = await this.app.scrape(subLink.url, {
            formats: ['markdown']
          });
          if (subResponse.markdown) {
            extraContent += `\n\n## 📄 Extracted Document Context: ${subLink.text} (${subLink.url})\n\n${subResponse.markdown.substring(0, 15000)}`;
          }
        } catch (subErr) {
          console.error(`Failed to scrape sub-link ${subLink.url}:`, subErr);
        }
      }

      // Compile Opportunity Attachments & Forms block
      let attachmentsBlock = `\n\n### 📎 Opportunity Attachments & Forms\n`;
      if (attachmentLinks.length > 0) {
        const seenUrls = new Set<string>();
        attachmentLinks.forEach(lnk => {
          if (!seenUrls.has(lnk.url)) {
            seenUrls.add(lnk.url);
            attachmentsBlock += `- [${lnk.text}](${lnk.url})\n`;
          }
        });
      } else {
        attachmentsBlock += `- [Official Opportunity Page](${url})\n`;
      }

      return primaryMarkdown + extraContent + attachmentsBlock;
    } catch (e: any) {
      console.error(`Error scraping Grant URL: ${e}`);
      return '';
    }
  }
}
