import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/export-proposal
 * Generates a structured proposal document from opportunity data.
 * Returns Markdown format for client-side rendering or download.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { project, orgName, sections } = body;

    if (!project || !orgName) {
      return NextResponse.json({ error: 'Missing project or orgName' }, { status: 400 });
    }

    // Generate structured proposal sections
    const proposalSections = [];

    // Cover Page
    proposalSections.push({
      title: 'Cover Page',
      content: [
        `# Technical Proposal`,
        ``,
        `**Solicitation Number:** ${project.solicitation_number || 'N/A'}`,
        `**Title:** ${project.title}`,
        `**Agency:** ${project.agency}`,
        `**Submitted by:** ${orgName}`,
        `**Date:** ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
        `**Deadline:** ${project.deadline_date || 'TBD'}`,
        project.naics_code ? `**NAICS Code:** ${project.naics_code}` : '',
        project.set_aside_type ? `**Set-Aside:** ${project.set_aside_type}` : '',
      ].filter(Boolean).join('\n'),
    });

    // Executive Summary
    proposalSections.push({
      title: 'Executive Summary',
      content: [
        `## 1. Executive Summary`,
        ``,
        `${orgName} is pleased to submit this proposal in response to ${project.solicitation_number || 'the above solicitation'} for ${project.title}.`,
        ``,
        `Our firm brings proven expertise in the capabilities required by ${project.agency}. This proposal outlines our technical approach, management plan, past performance, and pricing structure designed to deliver exceptional value.`,
        ``,
        project.amount ? `**Proposed Contract Value:** $${Number(project.amount).toLocaleString()}` : '',
      ].filter(Boolean).join('\n'),
    });

    // Technical Approach
    proposalSections.push({
      title: 'Technical Approach',
      content: [
        `## 2. Technical Approach`,
        ``,
        `### 2.1 Understanding of Requirements`,
        ``,
        `[Based on the solicitation description, outline your understanding of the government's requirements here.]`,
        ``,
        project.description ? `> **Solicitation Synopsis:** ${project.description.substring(0, 500)}...` : '',
        ``,
        `### 2.2 Proposed Solution`,
        ``,
        `[Describe your proposed solution, methodology, tools, and technologies.]`,
        ``,
        `### 2.3 Deliverables & Milestones`,
        ``,
        `| Milestone | Deliverable | Timeline |`,
        `|-----------|-------------|----------|`,
        `| Kickoff | Project Plan | Week 1 |`,
        `| Phase 1 | [Deliverable] | [Date] |`,
        `| Phase 2 | [Deliverable] | [Date] |`,
        `| Final | Completion Report | [Date] |`,
      ].join('\n'),
    });

    // Management Plan
    proposalSections.push({
      title: 'Management Plan',
      content: [
        `## 3. Management Plan`,
        ``,
        `### 3.1 Key Personnel`,
        ``,
        `| Role | Name | Qualifications |`,
        `|------|------|----------------|`,
        `| Program Manager | [Name] | [Qualifications] |`,
        `| Technical Lead | [Name] | [Qualifications] |`,
        `| Quality Assurance | [Name] | [Qualifications] |`,
        ``,
        `### 3.2 Communication Plan`,
        ``,
        `- Weekly status reports to the Contracting Officer's Representative (COR)`,
        `- Monthly progress reviews`,
        `- Ad-hoc issue escalation procedures`,
        ``,
        `### 3.3 Quality Control`,
        ``,
        `[Describe your QA/QC processes and standards.]`,
      ].join('\n'),
    });

    // Past Performance
    proposalSections.push({
      title: 'Past Performance',
      content: [
        `## 4. Past Performance`,
        ``,
        `### Contract 1`,
        `- **Contract Number:** [Number]`,
        `- **Agency:** [Agency]`,
        `- **Period of Performance:** [Dates]`,
        `- **Contract Value:** [Value]`,
        `- **Description:** [Brief description of work performed and outcomes]`,
        ``,
        `### Contract 2`,
        `- **Contract Number:** [Number]`,
        `- **Agency:** [Agency]`,
        `- **Period of Performance:** [Dates]`,
        `- **Contract Value:** [Value]`,
        `- **Description:** [Brief description of work performed and outcomes]`,
      ].join('\n'),
    });

    // Pricing
    proposalSections.push({
      title: 'Pricing',
      content: [
        `## 5. Pricing Schedule`,
        ``,
        `| CLIN | Description | Qty | Unit | Unit Price | Total |`,
        `|------|-------------|-----|------|------------|-------|`,
        `| 0001 | [Description] | 1 | EA | $0.00 | $0.00 |`,
        `| 0002 | [Description] | 1 | EA | $0.00 | $0.00 |`,
        ``,
        `**Total Proposed Price:** $0.00`,
        ``,
        `*All prices are firm-fixed-price unless otherwise specified.*`,
      ].join('\n'),
    });

    // Compliance Matrix
    proposalSections.push({
      title: 'Compliance Matrix',
      content: [
        `## 6. Compliance Matrix`,
        ``,
        `| SOW Requirement | Proposal Section | Compliant | Notes |`,
        `|-----------------|-----------------|-----------|-------|`,
        `| [Requirement 1] | Section 2.1 | ✅ | |`,
        `| [Requirement 2] | Section 2.2 | ✅ | |`,
        `| [Requirement 3] | Section 3.1 | ✅ | |`,
      ].join('\n'),
    });

    // Combine all sections into full document
    const fullDocument = proposalSections.map(s => s.content).join('\n\n---\n\n');

    return NextResponse.json({
      sections: proposalSections,
      fullDocument,
      metadata: {
        solicitationNumber: project.solicitation_number,
        agency: project.agency,
        generatedAt: new Date().toISOString(),
        orgName,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Export failed' }, { status: 500 });
  }
}
