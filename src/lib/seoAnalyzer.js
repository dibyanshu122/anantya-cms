/**
 * SEO Analyzer - calculates SEO score for a blog post
 */

export function analyzeSeo(data) {
  const issues = [];
  let score = 0;
  const maxScore = 100;
  const checks = [];

  const {
    title, content, seoTitle, seoDescription, focusKeyword,
    featuredImageUrl, featuredImageAlt, excerpt, faqs = [],
  } = data;

  // --- SEO Title ---
  if (!seoTitle) {
    issues.push({ type: 'error', message: 'SEO Title is missing' });
    checks.push({ label: 'SEO Title', pass: false });
  } else if (seoTitle.length < 50) {
    issues.push({ type: 'warning', message: `SEO Title too short (${seoTitle.length}/50–60 chars)` });
    checks.push({ label: 'SEO Title length', pass: false });
    score += 5;
  } else if (seoTitle.length > 60) {
    issues.push({ type: 'warning', message: `SEO Title too long (${seoTitle.length}/50–60 chars)` });
    checks.push({ label: 'SEO Title length', pass: false });
    score += 5;
  } else {
    checks.push({ label: 'SEO Title (50–60 chars)', pass: true });
    score += 10;
  }

  // --- Meta Description ---
  if (!seoDescription) {
    issues.push({ type: 'error', message: 'Meta Description is missing' });
    checks.push({ label: 'Meta Description', pass: false });
  } else if (seoDescription.length < 150) {
    issues.push({ type: 'warning', message: `Meta Description too short (${seoDescription.length}/150–160 chars)` });
    checks.push({ label: 'Meta Description length', pass: false });
    score += 5;
  } else if (seoDescription.length > 160) {
    issues.push({ type: 'warning', message: `Meta Description too long (${seoDescription.length}/150–160 chars)` });
    checks.push({ label: 'Meta Description length', pass: false });
    score += 5;
  } else {
    checks.push({ label: 'Meta Description (150–160 chars)', pass: true });
    score += 10;
  }

  // --- Focus Keyword ---
  if (!focusKeyword) {
    issues.push({ type: 'info', message: 'Focus keyword not set' });
    checks.push({ label: 'Focus Keyword', pass: false });
  } else {
    checks.push({ label: 'Focus Keyword set', pass: true });
    score += 5;

    // Keyword in SEO Title
    if (seoTitle && seoTitle.toLowerCase().includes(focusKeyword.toLowerCase())) {
      checks.push({ label: 'Keyword in SEO Title', pass: true });
      score += 10;
    } else {
      issues.push({ type: 'warning', message: 'Focus keyword not found in SEO Title' });
      checks.push({ label: 'Keyword in SEO Title', pass: false });
    }

    // Keyword in Meta Description
    if (seoDescription && seoDescription.toLowerCase().includes(focusKeyword.toLowerCase())) {
      checks.push({ label: 'Keyword in Meta Description', pass: true });
      score += 5;
    } else {
      issues.push({ type: 'warning', message: 'Focus keyword not found in Meta Description' });
      checks.push({ label: 'Keyword in Meta Description', pass: false });
    }

    // Keyword in content
    if (content) {
      const plainText = content.replace(/<[^>]*>/g, '').toLowerCase();
      const kwCount = (plainText.match(new RegExp(focusKeyword.toLowerCase(), 'g')) || []).length;
      const wordCount = plainText.split(/\s+/).filter(Boolean).length;
      const density = wordCount > 0 ? ((kwCount / wordCount) * 100).toFixed(1) : 0;

      if (kwCount > 0) {
        checks.push({ label: `Keyword density: ${density}%`, pass: density >= 0.5 && density <= 2.5 });
        if (density >= 0.5 && density <= 2.5) score += 5;
      } else {
        issues.push({ type: 'warning', message: 'Focus keyword not found in content' });
        checks.push({ label: 'Keyword in content', pass: false });
      }
      
      // Readability Calculation (Flesch-Kincaid)
      const sentences = plainText.split(/[.!?]+/).filter(Boolean).length || 1;
      const syllables = plainText.split(/[aeiouy]+/).length || 1;
      const fleschKincaid = 206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount);
      const readability = Math.max(0, Math.min(100, Math.round(fleschKincaid)));
      
      checks.push({ label: `Readability Score: ${readability}/100`, pass: readability >= 60 });
      if (readability >= 60) {
        score += 5;
      } else {
        issues.push({ type: 'warning', message: 'Readability score is below 60. Try using shorter sentences.' });
      }
    }
  }

  // --- Featured Image ---
  if (!featuredImageUrl) {
    issues.push({ type: 'error', message: 'Featured image is missing' });
    checks.push({ label: 'Featured Image', pass: false });
  } else {
    checks.push({ label: 'Featured Image', pass: true });
    score += 5;
    if (!featuredImageAlt) {
      issues.push({ type: 'warning', message: 'Featured image alt text is missing' });
      checks.push({ label: 'Image Alt Text', pass: false });
    } else {
      checks.push({ label: 'Image Alt Text', pass: true });
      score += 5;
    }
  }

  // --- Content Analysis ---
  if (content) {
    const plainText = content.replace(/<[^>]*>/g, '');
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;

    // Word count
    if (wordCount < 300) {
      issues.push({ type: 'error', message: `Content too short (${wordCount} words, min 300)` });
      checks.push({ label: `Word count: ${wordCount}`, pass: false });
    } else if (wordCount < 1000) {
      checks.push({ label: `Word count: ${wordCount} (good)`, pass: true });
      score += 5;
    } else {
      checks.push({ label: `Word count: ${wordCount} (excellent)`, pass: true });
      score += 10;
    }

    // H1 check
    const h1Matches = content.match(/<h1[^>]*>/gi) || [];
    if (h1Matches.length === 0) {
      issues.push({ type: 'error', message: 'No H1 heading found' });
      checks.push({ label: 'H1 Heading', pass: false });
    } else if (h1Matches.length > 1) {
      issues.push({ type: 'warning', message: `Multiple H1 tags found (${h1Matches.length})` });
      checks.push({ label: 'Single H1', pass: false });
      score += 2;
    } else {
      checks.push({ label: 'Single H1', pass: true });
      score += 5;
    }

    // H2 check
    const h2Count = (content.match(/<h2[^>]*>/gi) || []).length;
    if (h2Count === 0) {
      issues.push({ type: 'warning', message: 'No H2 headings found' });
      checks.push({ label: 'H2 Headings', pass: false });
    } else {
      checks.push({ label: `H2 Headings: ${h2Count}`, pass: true });
      score += 3;
    }

    // Internal links
    const internalLinks = (content.match(/href="\/[^"]*"/gi) || []).length;
    if (internalLinks === 0) {
      issues.push({ type: 'warning', message: 'No internal links found' });
      checks.push({ label: 'Internal Links', pass: false });
    } else {
      checks.push({ label: `Internal Links: ${internalLinks}`, pass: true });
      score += 5;
    }

    // External links
    const externalLinks = (content.match(/href="https?:\/\/(?!anantya\.ai)[^"]*"/gi) || []).length;
    checks.push({ label: `External Links: ${externalLinks}`, pass: externalLinks > 0 });
    if (externalLinks > 0) score += 3;
  }

  // --- Excerpt ---
  if (!excerpt) {
    issues.push({ type: 'warning', message: 'Blog excerpt/summary is missing' });
    checks.push({ label: 'Blog Excerpt', pass: false });
  } else {
    checks.push({ label: 'Blog Excerpt', pass: true });
    score += 5;
  }

  // --- FAQ Section ---
  if (faqs.length > 0) {
    checks.push({ label: `FAQ Section: ${faqs.length} items`, pass: true });
    score += 5;
  } else {
    checks.push({ label: 'FAQ Section', pass: false });
  }

  const finalScore = Math.min(score, maxScore);
  return {
    score: finalScore,
    grade: finalScore >= 80 ? 'A' : finalScore >= 60 ? 'B' : finalScore >= 40 ? 'C' : 'D',
    color: finalScore >= 80 ? '#22C55E' : finalScore >= 60 ? '#F59E0B' : '#EF4444',
    issues,
    checks,
  };
}

export function calculateReadTime(content) {
  if (!content) return 0;
  const plainText = content.replace(/<[^>]*>/g, '');
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount / 200); // avg 200 wpm reading speed
}

export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
