import React from 'react';
import { ExternalLink } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  
  let currentList: React.ReactNode[] = [];
  let inList = false;

  const flushList = (key: number) => {
    if (currentList.length > 0) {
      renderedElements.push(
        <ul key={`list-${key}`} className="list-disc pl-5 my-3 space-y-1.5 text-slate-350 text-sm text-left">
          {...currentList}
        </ul>
      );
      currentList = [];
    }
    inList = false;
  };

  const parseInlineStyles = (text: string, isLinkButton = false) => {
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      const precedingText = text.substring(lastIndex, match.index);
      if (precedingText) {
        parts.push(parseBoldText(precedingText));
      }

      const label = match[1];
      const url = match[2];

      if (isLinkButton) {
        parts.push(
          <a
            key={`link-${match.index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-lg text-emerald-400 font-semibold text-xs transition-all shadow-sm my-1.5 hover:scale-[1.01]"
          >
            <span>{label}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        );
      } else {
        parts.push(
          <a
            key={`link-${match.index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-450 hover:text-emerald-300 font-medium hover:underline"
          >
            <span>{label}</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        );
      }

      lastIndex = linkRegex.lastIndex;
    }

    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push(parseBoldText(remainingText));
    }

    return parts.length > 0 ? parts : text;
  };

  const parseBoldText = (text: string) => {
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      const precedingText = text.substring(lastIndex, match.index);
      if (precedingText) {
        parts.push(precedingText);
      }
      parts.push(<strong key={`bold-${match.index}`} className="font-semibold text-slate-100">{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }

    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push(remainingText);
    }

    return parts.length > 0 ? parts : text;
  };

  let isAttachmentSection = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('### 📎') || trimmed.includes('Opportunity Attachments & Forms')) {
      flushList(index);
      isAttachmentSection = true;
      renderedElements.push(
        <h3 key={`h3-${index}`} className="text-base font-semibold text-white mt-6 mb-3 border-t border-slate-800/80 pt-5 flex items-center gap-2 text-left">
          {trimmed.replace(/^###\s+/, '')}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('## ') || (trimmed.startsWith('### ') && !trimmed.includes('📎'))) {
      isAttachmentSection = false;
    }

    if (trimmed.startsWith('### ')) {
      flushList(index);
      renderedElements.push(
        <h3 key={`h3-${index}`} className="text-sm font-semibold text-slate-200 mt-5 mb-2 text-left">
          {parseInlineStyles(trimmed.substring(4))}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList(index);
      renderedElements.push(
        <h2 key={`h2-${index}`} className="text-lg font-light text-white mt-8 mb-4 border-b border-slate-800/60 pb-2 text-left">
          {parseInlineStyles(trimmed.substring(3))}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      flushList(index);
      renderedElements.push(
        <h1 key={`h1-${index}`} className="text-xl font-light text-white mt-6 mb-4 text-left">
          {parseInlineStyles(trimmed.substring(2))}
        </h1>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      const content = trimmed.substring(2);
      currentList.push(
        <li key={`li-${index}-${currentList.length}`} className="leading-relaxed">
          {parseInlineStyles(content, isAttachmentSection)}
        </li>
      );
    } else if (trimmed === '') {
      flushList(index);
      renderedElements.push(<div key={`br-${index}`} className="h-2" />);
    } else {
      flushList(index);
      renderedElements.push(
        <p key={`p-${index}`} className="text-slate-350 text-sm leading-relaxed my-2 text-left">
          {parseInlineStyles(trimmed, isAttachmentSection)}
        </p>
      );
    }
  });

  flushList(lines.length);

  return <div className="space-y-1 font-sans">{renderedElements}</div>;
}
