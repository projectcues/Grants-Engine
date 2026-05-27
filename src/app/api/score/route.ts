import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;

// NAICS code categories for matching
const NAICS_CATEGORIES: Record<string, string[]> = {
  'software_it': ['511210', '518210', '541511', '541512', '541513', '541519', '334111', '334614'],
  'marketing_advertising': ['541810', '541820', '541830', '541840', '541850', '541860', '541890', '541910', '541922'],
  'logistics_transport': ['484110', '484121', '484122', '484210', '484220', '484230', '488510', '493110', '493120'],
  'construction': ['236210', '236220', '237110', '237120', '237130', '237210', '237310', '237990'],
  'janitorial_waste': ['561710', '561720', '561790', '562111', '562112', '562119', '562211', '562212', '562991'],
  'manufacturing_parts': ['332111', '332112', '332119', '332312', '332313', '332410', '332510', '332613', '332710', '332722', '332911', '332912', '332913', '332919', '332991', '332993', '332996', '332999'],
  'electronics': ['334111', '334112', '334118', '334210', '334220', '334290', '334310', '334412', '334413', '334416', '334417', '334418', '334419', '335110', '335311', '335312', '335931'],
  'healthcare': ['621111', '621112', '621210', '621310', '621320', '621330', '621340', '621391', '621399', '621410', '621420', '621491', '621492', '621498', '621511', '621512'],
  'communications': ['517111', '517112', '517210', '517410', '517911', '517919'],
  'professional_services': ['541110', '541191', '541199', '541211', '541213', '541214', '541310', '541320', '541330', '541340', '541350', '541360', '541370', '541380', '541410', '541420', '541430', '541490', '541611', '541612', '541613', '541614', '541618', '541620', '541690', '541710', '541711', '541712', '541720', '541990']
};

// Company capability profiles - used for intelligent matching
interface CompanyProfile {
  name: string;
  categories: string[];
  keywords: string[];
  setAsideEligible: string[];
  naicsCodes: string[];
}

const COMPANY_PROFILES: Record<string, CompanyProfile> = {
  'Project Cues': {
    name: 'Project Cues, Inc.',
    categories: ['software_it', 'professional_services', 'communications'],
    keywords: ['software', 'web', 'app', 'data', 'ai', 'machine learning', 'analytics', 'dashboard', 'platform', 'portal', 'database', 'cloud', 'saas', 'api', 'integration', 'automation', 'digital', 'technology', 'cyber', 'information', 'network', 'system', 'it support', 'help desk', 'mhealth', 'telehealth', 'remote'],
    setAsideEligible: ['Total Small Business Set-Aside (FAR 19.5)', 'Small Business Set-Aside'],
    naicsCodes: ['541511', '541512', '541519', '518210', '511210', '541611']
  },
  'Promo Cues': {
    name: 'Promo Cues, LLC',
    categories: ['marketing_advertising', 'professional_services'],
    keywords: ['advertising', 'marketing', 'communication', 'outreach', 'recruitment', 'campaign', 'dissemination', 'education', 'training', 'media', 'public relations', 'branding', 'social media', 'engagement', 'awareness', 'promotion', 'event', 'video', 'content', 'creative', 'graphic', 'print', 'publishing'],
    setAsideEligible: ['Total Small Business Set-Aside (FAR 19.5)', 'Small Business Set-Aside'],
    naicsCodes: ['541810', '541820', '541830', '541840', '541850', '541860', '541890', '541910']
  },
  'Package Cues': {
    name: 'Package Cues, LLC',
    categories: ['logistics_transport', 'janitorial_waste', 'manufacturing_parts'],
    keywords: ['logistics', 'shipping', 'transport', 'cargo', 'delivery', 'warehouse', 'supply chain', 'inventory', 'freight', 'disposal', 'dumpster', 'janitorial', 'cleaning', 'maintenance', 'parts', 'supply', 'valve', 'hose', 'tubing', 'adapter', 'gland', 'pipe', 'fitting', 'hardware', 'motor', 'propulsion'],
    setAsideEligible: ['Total Small Business Set-Aside (FAR 19.5)', 'Small Business Set-Aside'],
    naicsCodes: ['484110', '484121', '484210', '493110', '561720', '562111', '332919', '332999']
  }
};

function getCompanyProfile(orgName: string): CompanyProfile | null {
  for (const [key, profile] of Object.entries(COMPANY_PROFILES)) {
    if (orgName.toLowerCase().includes(key.toLowerCase())) return profile;
  }
  return null;
}

function getNaicsCategory(naicsCode: string): string | null {
  for (const [cat, codes] of Object.entries(NAICS_CATEGORIES)) {
    if (codes.includes(naicsCode)) return cat;
    // Check 4-digit prefix match
    if (codes.some(c => c.substring(0, 4) === naicsCode.substring(0, 4))) return cat;
  }
  return null;
}

function scoreOpportunity(
  profile: CompanyProfile,
  title: string,
  description: string,
  naicsCode: string | null,
  pscCode: string | null,
  setAside: string | null,
  amount: number | null,
  baseType: string | null
): { score: number; level: string; reason: string; factors: string[] } {
  let score = 50; // baseline
  const factors: string[] = [];
  const text = (title + ' ' + (description || '')).toLowerCase();

  // 1. NAICS Code Match (0-25 points)
  if (naicsCode) {
    if (profile.naicsCodes.includes(naicsCode)) {
      score += 25;
      factors.push(`Direct NAICS match (${naicsCode})`);
    } else {
      const oppCategory = getNaicsCategory(naicsCode);
      if (oppCategory && profile.categories.includes(oppCategory)) {
        score += 15;
        factors.push(`NAICS category match: ${oppCategory}`);
      } else if (oppCategory) {
        score -= 15;
        factors.push(`NAICS mismatch: ${oppCategory} vs ${profile.categories.join(', ')}`);
      }
    }
  }

  // 2. Keyword Relevance (0-20 points)
  const matchedKeywords = profile.keywords.filter(kw => text.includes(kw));
  const keywordScore = Math.min(20, matchedKeywords.length * 4);
  score += keywordScore;
  if (matchedKeywords.length > 0) {
    factors.push(`${matchedKeywords.length} keyword matches: ${matchedKeywords.slice(0, 3).join(', ')}${matchedKeywords.length > 3 ? '...' : ''}`);
  }

  // 3. Set-Aside Eligibility (0-15 points)
  if (setAside) {
    const isEligible = profile.setAsideEligible.some(sa => 
      setAside.toLowerCase().includes(sa.toLowerCase()) ||
      sa.toLowerCase().includes(setAside.toLowerCase())
    );
    if (setAside.toLowerCase().includes('small business') && isEligible) {
      score += 15;
      factors.push(`Eligible for set-aside: ${setAside.substring(0, 40)}`);
    } else if (setAside.toLowerCase().includes('sdvosb') || setAside.toLowerCase().includes('8(a)') || setAside.toLowerCase().includes('hubzone')) {
      score -= 10;
      factors.push(`Not eligible for set-aside: ${setAside.substring(0, 40)}`);
    }
  }

  // 4. Contract size appropriateness (-10 to +10)
  if (amount) {
    if (amount >= 10000 && amount <= 5000000) {
      score += 10;
      factors.push('Contract size appropriate for small business');
    } else if (amount > 50000000) {
      score -= 10;
      factors.push('Contract too large for small business capacity');
    }
  }

  // 5. Base type bonus
  if (baseType === 'Sources Sought' || baseType === 'Presolicitation') {
    score += 5;
    factors.push(`Early-stage opportunity (${baseType}): more time to prepare`);
  }

  // Clamp score
  score = Math.max(5, Math.min(99, score));

  // Determine level
  let level: string;
  if (score >= 75) level = 'High';
  else if (score >= 50) level = 'Medium';
  else level = 'Low';

  // Build reason
  const reason = factors.length > 0 
    ? factors.join('. ') + '.'
    : 'General opportunity. Review requirements for alignment.';

  return { score, level, reason, factors };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orgName, projects } = body;

    if (!orgName || !projects?.length) {
      return NextResponse.json({ error: 'orgName and projects array required' }, { status: 400 });
    }

    const profile = getCompanyProfile(orgName);
    if (!profile) {
      // Fallback for unknown companies — try to get profile from DB
      return NextResponse.json({ 
        scores: projects.map((p: any) => ({
          id: p.id,
          score: 50,
          level: 'Medium',
          reason: 'Company profile not configured. Set up NAICS codes and capabilities in Settings.',
          factors: []
        }))
      });
    }

    const scores = projects.map((p: any) => ({
      id: p.id,
      ...scoreOpportunity(
        profile,
        p.title || '',
        p.description || '',
        p.naics_code || null,
        p.classification_code || null,
        p.set_aside_type || null,
        p.amount || null,
        p.base_type || null
      )
    }));

    return NextResponse.json({ scores });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
