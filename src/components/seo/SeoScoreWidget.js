import React, { useMemo, useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';

export default function SeoScoreWidget({ title = '', description = '', keyword = '', content = '', onScoreChange }) {
  // Strip HTML to get plain text word count
  const plainText = content.replace(/<[^>]+>/g, ' ');
  const wordCount = plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
  
  // Advanced checks
  const hasH1 = /<h1[^>]*>/.test(content);
  const hasHeadings = /<h[1-6][^>]*>/.test(content);
  
  // Check for images without alt tags
  const imgTags = content.match(/<img[^>]+>/g) || [];
  const missingAltCount = imgTags.filter(img => !/alt=["'][^"']+["']/.test(img)).length;

  // Link counters
  const anchorTags = content.match(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi) || [];
  let internalLinks = 0;
  let externalLinks = 0;
  anchorTags.forEach(tag => {
    if (tag.includes('href="/"') || tag.includes("href='/'") || tag.match(/href=["']\/[^"']*["']/)) {
      internalLinks++;
    } else if (tag.includes('href="http') || tag.includes("href='http")) {
      externalLinks++;
    }
  });

  // Readability (Flesch-Kincaid basic proxy: avg words per sentence)
  const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
  const wordsPerSentence = wordCount / sentences;
  const isReadable = wordsPerSentence < 20; // 20 words per sentence is getting hard to read

  // Duplicate Meta
  const isDuplicateMeta = title && description && title.toLowerCase() === description.toLowerCase();
  
  const checks = useMemo(() => {
    const list = [
      {
        id: 'titleLength',
        label: 'Title length (50-60 chars)',
        passed: title.length >= 50 && title.length <= 60,
        warning: title.length > 0 && (title.length < 50 || title.length > 60),
      },
      {
        id: 'descLength',
        label: 'Meta Description (150-160 chars)',
        passed: description.length >= 150 && description.length <= 160,
        warning: description.length > 0 && (description.length < 150 || description.length > 160),
      },
      {
        id: 'wordCount',
        label: 'Word count (> 300 words)',
        passed: wordCount >= 300,
        warning: wordCount > 0 && wordCount < 300,
      },
      {
        id: 'headings',
        label: 'Has Heading Structure (H1-H6)',
        passed: hasHeadings,
        warning: !hasHeadings && wordCount > 50, // Warning if content has text but no headings
      },
      {
        id: 'readability',
        label: `Readability (Avg ${Math.round(wordsPerSentence)} words/sentence)`,
        passed: isReadable,
        warning: !isReadable,
      },
      {
        id: 'internalLinks',
        label: `Internal Links (${internalLinks})`,
        passed: internalLinks > 0,
        warning: internalLinks === 0 && wordCount > 300,
      },
      {
        id: 'externalLinks',
        label: `External Links (${externalLinks})`,
        passed: externalLinks > 0,
        warning: externalLinks === 0 && wordCount > 300,
      }
    ];

    if (title || description) {
      list.push({
        id: 'duplicateMeta',
        label: 'Unique Title and Description',
        passed: !isDuplicateMeta,
        warning: false,
      });
    }

    if (imgTags.length > 0) {
      list.push({
        id: 'altText',
        label: `All Images have Alt Text (${missingAltCount} missing)`,
        passed: missingAltCount === 0,
        warning: missingAltCount > 0,
      });
    }

    if (keyword) {
      const keywordRegex = new RegExp(keyword, 'i');
      list.push({
        id: 'keywordTitle',
        label: 'Focus keyword in SEO title',
        passed: keywordRegex.test(title),
      });
      list.push({
        id: 'keywordDesc',
        label: 'Focus keyword in Meta description',
        passed: keywordRegex.test(description),
      });
      list.push({
        id: 'keywordContent',
        label: 'Focus keyword in content',
        passed: keywordRegex.test(plainText),
      });
    }

    return list;
  }, [title, description, keyword, wordCount, plainText, hasHeadings, imgTags.length, missingAltCount, internalLinks, externalLinks, isReadable, isDuplicateMeta]);

  const passedCount = checks.filter(c => c.passed).length;
  const score = checks.length > 0 ? Math.round((passedCount / checks.length) * 100) : 0;

  useEffect(() => {
    if (onScoreChange) {
      onScoreChange(score);
    }
  }, [score, onScoreChange]);

  let scoreColor = 'var(--danger)';
  if (score >= 70) scoreColor = 'var(--success)';
  else if (score >= 40) scoreColor = 'var(--warning)';

  return (
    <div className="cms-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontSize: 14 }}>Live SEO Score</h4>
        <div style={{ fontSize: 24, fontWeight: 700, color: scoreColor }}>
          {score}/100
        </div>
      </div>
      
      <div style={{ background: 'var(--bg-base)', borderRadius: 99, height: 6, marginBottom: 16 }}>
        <div style={{ width: `${score}%`, height: '100%', background: scoreColor, borderRadius: 99, transition: 'all 0.3s' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {checks.map(check => (
          <div key={check.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
            {check.passed ? (
              <FiCheckCircle color="var(--success)" size={14} />
            ) : check.warning ? (
              <FiAlertCircle color="var(--warning)" size={14} />
            ) : (
              <FiXCircle color="var(--muted)" size={14} />
            )}
            <span style={{ color: check.passed ? 'var(--text-primary)' : 'inherit' }}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
