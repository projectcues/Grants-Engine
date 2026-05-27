import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/compliance-matrix
 * Generates a compliance matrix from the solicitation description.
 * Extracts requirements, maps them to proposal sections, and identifies gaps.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, description, orgCapabilities } = body;

    if (!description) {
      return NextResponse.json({ error: 'No description provided' }, { status: 400 });
    }

    // Extract requirements from the solicitation description
    const text = description.toLowerCase();
    const requirements: Array<{
      id: string;
      requirement: string;
      category: string;
      compliant: boolean;
      proposalSection: string;
      notes: string;
    }> = [];

    let reqCounter = 1;

    // Technical Requirements
    const techKeywords = [
      { keyword: 'experience in', category: 'Technical', section: '2.1 Technical Approach' },
      { keyword: 'must provide', category: 'Technical', section: '2.2 Proposed Solution' },
      { keyword: 'shall deliver', category: 'Deliverable', section: '2.3 Deliverables' },
      { keyword: 'shall perform', category: 'Technical', section: '2.2 Proposed Solution' },
      { keyword: 'is required to', category: 'Technical', section: '2.2 Proposed Solution' },
      { keyword: 'must demonstrate', category: 'Qualification', section: '4. Past Performance' },
      { keyword: 'shall submit', category: 'Administrative', section: '6. Compliance' },
      { keyword: 'must have', category: 'Qualification', section: '3.1 Key Personnel' },
      { keyword: 'required certification', category: 'Qualification', section: '3.1 Key Personnel' },
      { keyword: 'security clearance', category: 'Security', section: '3.1 Key Personnel' },
      { keyword: 'insurance', category: 'Administrative', section: '6. Compliance' },
      { keyword: 'bonding', category: 'Financial', section: '5. Pricing' },
      { keyword: 'delivery schedule', category: 'Deliverable', section: '2.3 Deliverables' },
      { keyword: 'period of performance', category: 'Administrative', section: '2.3 Deliverables' },
      { keyword: 'quality control', category: 'Quality', section: '3.3 Quality Control' },
      { keyword: 'status report', category: 'Administrative', section: '3.2 Communication Plan' },
      { keyword: 'small business', category: 'Set-Aside', section: '6. Compliance' },
      { keyword: 'past performance', category: 'Qualification', section: '4. Past Performance' },
      { keyword: 'key personnel', category: 'Staffing', section: '3.1 Key Personnel' },
    ];

    // Extract sentences containing requirement keywords
    const sentences = description.split(/[.;]\s+/).filter((s: string) => s.length > 20);
    
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase().trim();
      for (const { keyword, category, section } of techKeywords) {
        if (lower.includes(keyword)) {
          // Check compliance against org capabilities
          const capLower = (orgCapabilities || '').toLowerCase();
          const isCompliant = capLower ? 
            keyword.split(' ').some(w => capLower.includes(w)) : false;

          requirements.push({
            id: `REQ-${String(reqCounter++).padStart(3, '0')}`,
            requirement: sentence.trim().substring(0, 200),
            category,
            compliant: isCompliant,
            proposalSection: section,
            notes: isCompliant ? 'Capability confirmed' : 'Review and address',
          });
          break; // One match per sentence
        }
      }
    }

    // If few requirements found, add generic ones based on content
    if (requirements.length < 3) {
      const genericReqs = [
        { category: 'Technical', req: 'Technical approach addressing stated requirements', section: '2.1 Technical Approach' },
        { category: 'Staffing', req: 'Qualified key personnel with relevant experience', section: '3.1 Key Personnel' },
        { category: 'Qualification', req: 'Past performance on similar contracts', section: '4. Past Performance' },
        { category: 'Administrative', req: 'Pricing schedule with all CLINs', section: '5. Pricing' },
        { category: 'Quality', req: 'Quality assurance/quality control plan', section: '3.3 Quality Control' },
      ];
      for (const g of genericReqs) {
        requirements.push({
          id: `REQ-${String(reqCounter++).padStart(3, '0')}`,
          requirement: g.req,
          category: g.category,
          compliant: false,
          proposalSection: g.section,
          notes: 'Generic requirement — verify against solicitation',
        });
      }
    }

    // Summary statistics
    const compliantCount = requirements.filter(r => r.compliant).length;
    const totalCount = requirements.length;
    const complianceRate = totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 0;

    const gapCategories = [...new Set(
      requirements.filter(r => !r.compliant).map(r => r.category)
    )];

    return NextResponse.json({
      requirements,
      summary: {
        total: totalCount,
        compliant: compliantCount,
        gaps: totalCount - compliantCount,
        complianceRate,
        gapCategories,
      },
      projectId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Compliance check failed' }, { status: 500 });
  }
}
