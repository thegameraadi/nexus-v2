#!/usr/bin/env node
/**
 * NEXUS v2 — Agentic Daily News Briefing Content Pipeline
 *
 * 5 Modular Pipeline Stages:
 * 1. scout(sourcesConfig)   -> Ingests RSS, arXiv, SEC EDGAR, Hacker News, Reddit OAuth (strict 7-day recency window)
 * 2. rank(candidates)       -> Deduplicates, computes authority, corroboration, novelty, magnitude (discriminating deals vs administrative noise)
 * 3. synth(topCandidates)   -> Synthesizes brief, column-aware tags, honest LLM/deterministic reporting
 * 4. editor(items)          -> Multi-factor scoring with ceiling rules, 3x daily non-destructive merging
 * 5. publish(dayDigest)     -> Writes YYYY-MM-DD.json, updates index.json (last 7), commits to git
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DATA_DIR = path.resolve(ROOT_DIR, 'public', 'data');
const SOURCES_FILE = path.resolve(__dirname, 'sources.json');

// Ensure public/data directory exists
if (!fs.existsSync(PUBLIC_DATA_DIR)) {
  fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
}

// ----------------------------------------------------------------------------
// Utility Functions
// ----------------------------------------------------------------------------

function getTodayISODate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getSevenDaysAgoISODate() {
  const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
}

function getFormattedTime() {
  return new Date().toISOString().substring(11, 19);
}

function cleanHtml(raw) {
  if (!raw) return '';
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8216;|&lsquo;/g, "'")
    .replace(/&#8220;|&ldquo;/g, '"')
    .replace(/&#8221;|&rdquo;/g, '"')
    .replace(/&#8230;|&hellip;/g, '...')
    .replace(/&#8211;|&ndash;/g, '-')
    .replace(/&#8212;|&mdash;/g, '—')
    .replace(/&#[0-9]+;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips RSS/wire/press boilerplate phrases and disclaimers.
 */
function sanitizeBoilerplate(raw) {
  if (!raw) return '';
  let text = cleanHtml(raw);

  const boilerplatePatterns = [
    /\bview\s+(?:the\s+)?(?:full\s+)?press\s+release(?:\s+here)?\.?/gi,
    /\bread\s+(?:the\s+)?(?:full\s+)?press\s+release(?:\s+here)?\.?/gi,
    /\bthe\s+post\s+[\s\S]*?\s+appeared\s+first\s+on\s+[\s\S]*?\.?/gi,
    /\b(?:read\s+more|continue\s+reading|click\s+here|full\s+story|read\s+full\s+article)(?:\s+at\s+[\s\S]*?)?\.?/gi,
    /\[\+\d+\s+chars\]/gi,
    /\bphoto\s+(?:by|credit):\s*[\s\S]*?(?:\.|$)/gi,
    /\b(?:copyright|all\s+rights\s+reserved|all\s+rights\s+reserved\.)\s*[\s\S]*?(?:\.|$)/gi,
    /\b(?:business\s+wire|pr\s+newswire|globenewswire|marketwired)\s*[-—–:]\s*/gi,
    /\b(?:reuters|bloomberg|associated\s+press|ap)\s*[-—–:]\s*/gi,
    /\bcontact\s+(?:media|investor|press|us):\s*[\s\S]*?(?:\.|$)/gi,
    /\bfor\s+more\s+information(?:\s+visit|\s+contact)?:\s*[\s\S]*?(?:\.|$)/gi,
    /\bhttps?:\/\/\S+/gi,
  ];

  for (const p of boilerplatePatterns) {
    text = text.replace(p, ' ');
  }

  return cleanSummaryText(text.replace(/\s+/g, ' ').trim());
}

function cleanSummaryText(text) {
  if (!text) return '';
  let s = text.trim();
  s = s.replace(/\[\.\.\.\]/g, '').replace(/\.\.\.+/g, '.');
  s = s.replace(/[-—–,;:\s]+$/, '');
  if (s.length > 0 && !/[.!?]$/.test(s)) {
    s += '.';
  }
  return s;
}

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function computeOverlapSimilarity(textA, textB) {
  const tokensA = new Set(tokenize(textA));
  const tokensB = new Set(tokenize(textB));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  return intersection / union;
}

/**
 * Calculates human-readable edition label based on calendar distance from reference date.
 */
function getEditionLabel(editionDateStr, referenceDateStr) {
  try {
    const [y1, m1, d1] = referenceDateStr.split('-').map(Number);
    const [y2, m2, d2] = editionDateStr.split('-').map(Number);
    const refUtc = Date.UTC(y1, m1 - 1, d1);
    const targetUtc = Date.UTC(y2, m2 - 1, d2);
    const diffDays = Math.round((refUtc - targetUtc) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';

    const dateObj = new Date(targetUtc);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[dateObj.getUTCMonth()]} ${dateObj.getUTCDate()}`;
  } catch {
    return editionDateStr;
  }
}

/**
 * Computes granular Magnitude based on deal size and institutional materiality.
 * Disclosed scale:
 *   $1B+ -> 9.0 - 9.8
 *   $100M+ -> 8.0 - 8.9
 *   $10M+ -> 6.5 - 7.4
 *   $1M+ -> 5.5 - 6.4
 * Form 8-K / major regulatory / treaty / antitrust -> 7.5 - 8.5
 * Routine administrative filings (Form D, Form D/A, Form 4 without figures) -> 2.5 - 4.5
 */
function computeMagnitude(item) {
  const combined = `${item.headline} ${item.rawText || ''}`.toLowerCase();

  const billionMatch = combined.match(/\$([0-9]+(?:\.[0-9]+)?)\s*(?:billion|b\b)/i);
  const millionMatch = combined.match(/\$([0-9]+(?:\.[0-9]+)?)\s*(?:million|m\b)/i);

  if (billionMatch) {
    const amt = parseFloat(billionMatch[1]);
    if (amt >= 10) return 9.8;
    if (amt >= 2) return 9.5;
    return 9.1;
  }

  if (millionMatch) {
    const amt = parseFloat(millionMatch[1]);
    if (amt >= 500) return 8.8;
    if (amt >= 100) return 8.2;
    if (amt >= 50) return 7.4;
    if (amt >= 10) return 6.5;
    return 5.5;
  }

  // Material corporate and regulatory milestones
  if (/\b(?:form 8-k|quarterly earnings|earnings release|monopoly ruling|antitrust suit|doj lawsuit|supreme court|merger agreement|acquisition agreement)\b/i.test(combined)) {
    return 8.2;
  }

  // Major institutional actions
  if (/\b(?:executive order|ftc enforcement|sec lawsuit|phase 3 trial|clinical endpoint|gigawatt|grid interconnection)\b/i.test(combined)) {
    return 7.5;
  }

  // Routine administrative filings without disclosed amounts (Form D, Form D/A, Form 4)
  if (
    /\b(?:form d(?:\/a)?|form 4|form 3|schedule 13[gd]|notice of exempt offering|amendment)\b/i.test(combined) ||
    item.source.includes('/ D') ||
    item.source.includes('/ 4')
  ) {
    return 3.2; // Routine filing noise: 2.5 - 4.5
  }

  // General corporate activity
  if (/\b(?:partnership|launches|unveils|hires|expansion|patent)\b/i.test(combined)) {
    return 5.2;
  }

  return 4.5;
}

/**
 * Assigns column-aware tags to prevent inappropriate tag leakage.
 * e.g., arXiv benchmark papers in research get #BENCHMARK or #RESEARCH, never #VENTURE.
 * Routine Form D/A gets #FILING, not #VENTURE.
 */
function assignTag(item, columnHint) {
  const combined = `${item.headline} ${item.rawText || ''}`.toLowerCase();

  if (columnHint === 'research') {
    if (/benchmark|eval|leaderboard|score|mmlu|gsm8k|humaneval|swe-bench/i.test(combined)) return 'BENCHMARK';
    if (/reasoning|chain-of-thought|rl|reinforcement|distillation|search/i.test(combined)) return 'REASONING';
    if (/architecture|transformer|attention|mamba|diffusion|state space/i.test(combined)) return 'ARCHITECTURE';
    if (/dataset|corpus|pretraining|synthetic data/i.test(combined)) return 'DATASET';
    if (/quantum|superconductor|fusion|crispr|biology|protein/i.test(combined)) return 'FRONTIER';
    return 'RESEARCH';
  }

  if (columnHint === 'venture') {
    if (item.source.includes('SEC EDGAR') || /\b(?:form d(?:\/a)?|form 4|regulatory)\b/i.test(combined)) {
      if (/amendment|d\/a/i.test(combined) || item.source.includes('D/A')) return 'FILING';
      return 'DISCLOSURE';
    }
    if (/\b(?:series\s+[a-g]|seed\s+round|growth\s+round|\$[0-9]+[mb]\s+round)\b/i.test(combined)) return 'VENTURE';
    if (/\b(?:acquisition|merger|buys|acquires)\b/i.test(combined)) return 'M&A';
    if (/\b(?:ipo|public\s+listing|direct\s+listing)\b/i.test(combined)) return 'IPO';
    return 'VENTURE';
  }

  if (columnHint === 'titans') {
    if (/datacenter|megawatt|gigawatt|gpu|cluster|cluster\s+compute|nuclear|smr/i.test(combined)) return 'INFRASTRUCTURE';
    if (/antitrust|ftc|doj|monopoly|court|ruling|investigation/i.test(combined)) return 'REGULATORY';
    if (/earnings|revenue|operating\s+income|guidance/i.test(combined)) return 'EARNINGS';
    if (/partnership|agreement|deal|contract/i.test(combined)) return 'PARTNERSHIP';
    return 'TITANS';
  }

  if (item.beat === 'science') {
    if (/crispr|gene|clinical|phase\s+[123]|vaccine|oncology/i.test(combined)) return 'BIOTECH';
    if (/quantum|superconductor|fusion|materials|physics/i.test(combined)) return 'PHYSICS';
    if (/space|orbit|telescope|nasa|esa/i.test(combined)) return 'AEROSPACE';
    return 'SCIENCE';
  }

  if (item.beat === 'markets') {
    if (/treasury|yield|rate\s+cut|fed|inflation|cpi|central\s+bank/i.test(combined)) return 'MACRO';
    if (/nasdaq|s&p|equities|stocks|rally|selloff/i.test(combined)) return 'EQUITIES';
    if (/commodities|crude|oil|gold/i.test(combined)) return 'COMMODITIES';
    return 'MARKETS';
  }

  if (item.beat === 'politics') {
    if (/treaty|sanctions|tariffs|geopolitics|export\s+control/i.test(combined)) return 'GEOPOLITICS';
    if (/bill|legislation|congress|senate|executive\s+order/i.test(combined)) return 'POLICY';
    return 'POLICY';
  }

  return 'REPORT';
}

/**
 * Calls Gemini ListModels API to discover currently active models for this key.
 */
async function listAvailableModels(apiKey) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const models = (data.models || [])
        .filter((m) => {
          const methods = m.supportedGenerationMethods || m.supportedActions || [];
          return methods.includes('generateContent');
        })
        .map((m) => m.name.replace(/^models\//, ''));
      return { success: true, models };
    } else {
      const errText = await res.text().catch(() => '');
      return { success: false, status: res.status, error: errText };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Invokes Gemini API across prioritized model endpoints, disabling dead models immediately.
 */
async function callGemini(item, apiKey, candidateModels, disabledModels) {
  const sanitizedText = sanitizeBoilerplate(item.rawText);

  const prompt = `You are NEXUS, an autonomous news intelligence briefing engine.
CRITICAL CONSTRAINT: Synthesize strictly from the provided source text. Do NOT invent, assume, or fabricate any facts, figures, implications, or analysis not explicitly stated.
Output JSON conforming exactly to this schema:
{
  "headline": "Active voice headline under 14 words",
  "summary": "Factual 2-3 sentence analytical summary derived strictly from the text. Zero hype, zero invented analysis.",
  "tag": "UPPERCASE_TAG_UNDER_15_CHARS",
  "relevanceScore": 8.5
}

Dispatch Details:
Beat: ${item.beat}
Column Hint: ${item.columnHint}
Title: ${item.headline}
Source: ${item.source}
Context: ${sanitizedText || item.headline}`;

  let lastStatus = 0;
  let lastErr = '';

  for (const model of candidateModels) {
    if (disabledModels.has(model)) {
      continue;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      lastStatus = res.status;
      if (res.ok) {
        const result = await res.json();
        const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!jsonText) throw new Error('Empty candidate response');
        let parsed;
        try {
          parsed = JSON.parse(jsonText);
        } catch {
          const cleaned = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();
          parsed = JSON.parse(cleaned);
        }
        const pTokens = result.usageMetadata?.promptTokenCount || 250;
        const cTokens = result.usageMetadata?.candidatesTokenCount || 80;
        return {
          success: true,
          model,
          parsed,
          promptTokens: pTokens,
          candidatesTokens: cTokens,
        };
      } else {
        const errBody = await res.text().catch(() => '');
        lastErr = errBody;
        console.error(`[SYNTH LLM ERROR] Model ${model} HTTP ${res.status}: ${errBody.slice(0, 180)}`);

        // Mark dead models (404, 403, 410) as unavailable for the rest of this run
        if (res.status === 404 || res.status === 403 || res.status === 410) {
          disabledModels.add(model);
          console.warn(`[SYNTH] Model ${model} returned HTTP ${res.status}. Marking model as unavailable for this run.`);
        } else if (res.status === 400 && (errBody.includes('API key') || errBody.includes('not valid') || errBody.includes('INVALID_ARGUMENT'))) {
          for (const m of candidateModels) disabledModels.add(m);
          console.warn(`[SYNTH] API key rejected with HTTP 400. Disabling LLM calls for this run.`);
          break;
        } else {
          disabledModels.add(model);
          break;
        }
      }
    } catch (err) {
      console.error(`[SYNTH LLM EXCEPTION] Model ${model}:`, err.message);
      lastErr = err.message;
    }
  }

  return {
    success: false,
    status: lastStatus,
    error: lastErr,
  };
}

// ----------------------------------------------------------------------------
// STAGE 1: SCOUT
// ----------------------------------------------------------------------------
async function scout(sourcesConfig, agentLog) {
  agentLog.push({
    timestamp: getFormattedTime(),
    module: 'SCOUT',
    message: 'Initializing ingestion pipeline across 5 beats (strict 7-day recency filter).',
    status: 'ok',
  });

  const candidates = [];
  const today = getTodayISODate();
  const sevenDaysAgo = getSevenDaysAgoISODate();

  for (const [beatId, beatConfig] of Object.entries(sourcesConfig.beats)) {
    // 1. RSS Feeds
    if (Array.isArray(beatConfig.rss)) {
      for (const rss of beatConfig.rss) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);

          const res = await fetch(rss.url, {
            headers: { 'User-Agent': 'NexusBriefingEngine/2.0 (Mozilla/5.0 compatible)' },
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (!res.ok) continue;
          const xml = await res.text();

          // Regex extract <item> or <entry>
          const itemMatches = xml.match(/<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi) || [];
          for (const itemXml of itemMatches.slice(0, 8)) {
            const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            const linkMatch =
              itemXml.match(/<link[^>]*href=["']([^"']+)["']/i) ||
              itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
            const descMatch =
              itemXml.match(/<(?:description|summary|content)[^>]*>([\s\S]*?)<\/(?:description|summary|content)>/i);
            const dateMatch =
              itemXml.match(/<(?:pubDate|published|dc:date)[^>]*>([\s\S]*?)<\/(?:pubDate|published|dc:date)>/i);

            const rawTitle = titleMatch ? cleanHtml(titleMatch[1]) : '';
            const rawLink = linkMatch ? cleanHtml(linkMatch[1]) : '';
            const rawDesc = descMatch ? cleanHtml(descMatch[1]) : '';

            let itemDate = today;
            if (dateMatch) {
              try {
                const parsed = new Date(dateMatch[1].trim());
                if (!isNaN(parsed.getTime())) {
                  const isoDate = parsed.toISOString().split('T')[0];
                  if (isoDate <= today) itemDate = isoDate;
                }
              } catch {}
            }

            // Strict recency check: discard any wire older than 7 days
            if (itemDate < sevenDaysAgo) continue;

            if (rawTitle && rawTitle.length > 10) {
              candidates.push({
                source: rss.name,
                date: itemDate,
                headline: rawTitle,
                rawText: rawDesc,
                url: rawLink,
                beat: beatId,
                columnHint: rss.defaultColumn,
                baseAuthority: rss.authority || 8.5,
              });
            }
          }
        } catch {
          // Non-blocking feed timeout
        }
      }
    }

    // 2. arXiv API (for research & frontier)
    if (beatConfig.arxiv && Array.isArray(beatConfig.arxiv.categories)) {
      try {
        const query = beatConfig.arxiv.categories.map((c) => `cat:${c}`).join('+OR+');
        const arxivUrl = `https://export.arxiv.org/api/query?search_query=${query}&sortBy=submittedDate&sortOrder=descending&max_results=${beatConfig.arxiv.maxResults || 5}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(arxivUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
          const xml = await res.text();
          const entries = xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
          for (const entry of entries) {
            const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            const summaryMatch = entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
            const idMatch = entry.match(/<id[^>]*>([\s\S]*?)<\/id>/i);
            const pubMatch = entry.match(/<published[^>]*>([\s\S]*?)<\/published>/i);

            const title = titleMatch ? cleanHtml(titleMatch[1]).replace(/\s+/g, ' ') : '';
            const summary = summaryMatch ? cleanHtml(summaryMatch[1]) : '';
            const link = idMatch ? cleanHtml(idMatch[1]) : '';

            let arxivDate = today;
            if (pubMatch) {
              try {
                const parsed = new Date(pubMatch[1].trim());
                if (!isNaN(parsed.getTime())) {
                  const isoDate = parsed.toISOString().split('T')[0];
                  if (isoDate <= today) arxivDate = isoDate;
                }
              } catch {}
            }

            // Strict recency check: discard any paper older than 7 days
            if (arxivDate < sevenDaysAgo) continue;

            if (title) {
              candidates.push({
                source: 'arXiv Preprint',
                date: arxivDate,
                headline: title,
                rawText: summary,
                url: link,
                beat: beatId,
                columnHint: beatConfig.arxiv.defaultColumn || 'research',
                baseAuthority: beatConfig.arxiv.authority || 9.5,
              });
            }
          }
        }
      } catch {
        // arXiv network bypass
      }
    }

    // 3. SEC EDGAR full-text search API (tightened from 60 days to 7 days)
    if (beatConfig.secEdgar && Array.isArray(beatConfig.secEdgar.keywords)) {
      try {
        const q = encodeURIComponent(beatConfig.secEdgar.keywords[0]);
        const secUrl = `https://efts.sec.gov/LATEST/search-index?q=${q}&forms=${beatConfig.secEdgar.forms.join(',')}&startdt=${sevenDaysAgo}&enddt=${today}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(secUrl, {
          headers: {
            'User-Agent': 'NexusBriefingEngine/2.0 (contact@nexusbrief.io)',
            Accept: 'application/json',
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const json = await res.json();
          const hits = json?.hits?.hits || [];
          for (const hit of hits.slice(0, 4)) {
            const entityName = hit._source?.entity_name || hit._source?.display_names?.[0] || 'Public Issuer';
            const formType = hit._source?.form || 'SEC';
            const rawFileDate = hit._source?.file_date;
            if (rawFileDate && rawFileDate < sevenDaysAgo) continue;
            const fileDate = rawFileDate && rawFileDate <= today ? rawFileDate : today;

            const desc = hit._source?.description || '';

            candidates.push({
              source: `SEC EDGAR / ${formType}`,
              date: fileDate,
              headline: `${entityName} Discloses Material Operations in Form ${formType}`,
              rawText: `SEC regulatory submission filed by ${entityName}. Form ${formType}${desc ? ': ' + desc : ' detailing material operations and capital restructuring.'}`,
              url: `https://www.sec.gov/edgar/browse/?CIK=${hit._source?.ciks?.[0] || ''}`,
              beat: beatId,
              columnHint: beatConfig.secEdgar.defaultColumn || 'venture',
              baseAuthority: beatConfig.secEdgar.authority || 9.6,
            });
          }
        }
      } catch {
        // SEC API bypass
      }
    }

    // 4. Hacker News API
    if (beatConfig.hackerNews) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const ids = await res.json();
          const targetIds = (ids || []).slice(0, 15);

          for (const id of targetIds) {
            try {
              const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
              if (itemRes.ok) {
                const itemData = await itemRes.json();
                if (itemData && itemData.title) {
                  const matches = (beatConfig.hackerNews.keywords || []).some((kw) =>
                    itemData.title.toLowerCase().includes(kw.toLowerCase())
                  );
                  if (matches) {
                    let hnDate = today;
                    if (itemData.time) {
                      const d = new Date(itemData.time * 1000).toISOString().split('T')[0];
                      if (d <= today) hnDate = d;
                    }
                    if (hnDate < sevenDaysAgo) continue;

                    candidates.push({
                      source: 'Hacker News Dispatch',
                      date: hnDate,
                      headline: itemData.title,
                      rawText: itemData.text ? cleanHtml(itemData.text) : '',
                      url: itemData.url || `https://news.ycombinator.com/item?id=${id}`,
                      beat: beatId,
                      columnHint: beatConfig.hackerNews.defaultColumn || 'titans',
                      baseAuthority: beatConfig.hackerNews.authority || 8.2,
                    });
                  }
                }
              }
            } catch {
              // item bypass
            }
          }
        }
      } catch {
        // HN bypass
      }
    }

    // 5. Reddit OAuth
    if (
      process.env.REDDIT_CLIENT_ID &&
      process.env.REDDIT_CLIENT_SECRET &&
      beatConfig.reddit &&
      Array.isArray(beatConfig.reddit.subreddits)
    ) {
      try {
        const auth = Buffer.from(
          `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
        ).toString('base64');
        const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'NexusBriefingEngine/2.0',
          },
          body: 'grant_type=client_credentials',
        });
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          const accessToken = tokenData.access_token;

          for (const sub of beatConfig.reddit.subreddits) {
            const subRes = await fetch(`https://oauth.reddit.com/r/${sub}/hot?limit=8`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'User-Agent': 'NexusBriefingEngine/2.0',
              },
            });
            if (subRes.ok) {
              const subData = await subRes.json();
              const posts = subData?.data?.children || [];
              for (const post of posts) {
                const p = post.data;
                if (p && !p.stickied && p.title) {
                  let redditDate = today;
                  if (p.created_utc) {
                    const d = new Date(p.created_utc * 1000).toISOString().split('T')[0];
                    if (d <= today) redditDate = d;
                  }
                  if (redditDate < sevenDaysAgo) continue;

                  candidates.push({
                    source: `Reddit r/${sub}`,
                    date: redditDate,
                    headline: p.title,
                    rawText: p.selftext ? cleanHtml(p.selftext) : '',
                    url: `https://reddit.com${p.permalink}`,
                    beat: beatId,
                    columnHint: beatConfig.reddit.defaultColumn || 'research',
                    baseAuthority: beatConfig.reddit.authority || 7.8,
                  });
                }
              }
            }
          }
        }
      } catch {
        // Reddit bypass
      }
    }
  }

  // Global recency filter: strictly reject any candidate older than 7 days
  const recentCandidates = candidates.filter((c) => {
    return c.date && c.date >= sevenDaysAgo && c.date <= today;
  });

  if (recentCandidates.length === 0) {
    agentLog.push({
      timestamp: getFormattedTime(),
      module: 'SCOUT',
      message: 'Zero candidates ingested within 7-day window. Columns will remain in synthesizing standby.',
      status: 'warn',
    });
    return [];
  }

  agentLog.push({
    timestamp: getFormattedTime(),
    module: 'SCOUT',
    message: `Scouted ${recentCandidates.length} candidate signals across 5 beats (all within 7-day window).`,
    status: 'ok',
  });

  return recentCandidates;
}

// ----------------------------------------------------------------------------
// STAGE 2: RANK
// ----------------------------------------------------------------------------
function rank(candidates, agentLog) {
  if (candidates.length === 0) return [];

  agentLog.push({
    timestamp: getFormattedTime(),
    module: 'RANK',
    message: 'Initiating deduplication & 4-factor scoring heuristics (discriminating deals vs administrative noise).',
    status: 'ok',
  });

  // 1. Deduplication via headline overlap
  const survivors = [];
  let droppedCount = 0;

  for (const candidate of candidates) {
    let isDuplicate = false;
    for (const existing of survivors) {
      const sim = computeOverlapSimilarity(candidate.headline, existing.headline);
      if (sim > 0.55) {
        isDuplicate = true;
        droppedCount++;
        if (candidate.baseAuthority > existing.baseAuthority) {
          existing.headline = candidate.headline;
          existing.source = candidate.source;
          existing.rawText = candidate.rawText;
          existing.url = candidate.url;
          existing.baseAuthority = candidate.baseAuthority;
          existing.date = candidate.date;
        }
        break;
      }
    }
    if (!isDuplicate) {
      survivors.push(candidate);
    }
  }

  // 2. Score authority, corroboration, novelty, magnitude (0-10 each)
  const scored = survivors.map((item, idx) => {
    const authority = Math.min(10, Math.max(1, Number(item.baseAuthority.toFixed(1))));

    // Corroboration: real overlap across survivor corpus (baseline ~4.5, increasing with corroboration)
    let overlapCount = 0;
    for (let i = 0; i < survivors.length; i++) {
      if (i !== idx && computeOverlapSimilarity(item.headline, survivors[i].headline) > 0.25) {
        overlapCount++;
      }
    }
    const corroboration = Number(Math.min(9.8, Math.max(3.5, 4.5 + overlapCount * 1.5)).toFixed(1));

    // Novelty: presence of breakthrough indicators vs routine filings
    const noveltyKeywords = [
      'breakthrough',
      'first ever',
      'unveils',
      'discovers',
      'record',
      'superconducting',
      'quantum supremacy',
      'state-of-the-art',
      'outperforms',
      'milestone',
      'new architecture',
    ];
    let noveltyScore = 5.0;
    for (const kw of noveltyKeywords) {
      if (`${item.headline} ${item.rawText || ''}`.toLowerCase().includes(kw)) {
        noveltyScore += 1.2;
      }
    }
    // Penalize routine administrative filings and amendments for novelty
    if (/\b(?:form d|form 4|routine|amendment|notice)\b/i.test(`${item.headline} ${item.rawText || ''}`)) {
      noveltyScore -= 1.5;
    }
    const novelty = Number(Math.min(9.8, Math.max(3.0, noveltyScore)).toFixed(1));

    // Magnitude: granular deal size & materiality scoring
    const magnitude = computeMagnitude(item);

    const floorRank = authority * 0.3 + corroboration * 0.25 + novelty * 0.25 + magnitude * 0.2;

    return {
      ...item,
      scores: {
        authority,
        corroboration,
        novelty,
        magnitude,
      },
      floorRank,
    };
  });

  scored.sort((a, b) => b.floorRank - a.floorRank);

  agentLog.push({
    timestamp: getFormattedTime(),
    module: 'RANK',
    message: `Deduplication dropped ${droppedCount} redundant wires. ${scored.length} candidates evaluated.`,
    status: 'ok',
  });

  return scored;
}

// ----------------------------------------------------------------------------
// STAGE 3: SYNTH
// ----------------------------------------------------------------------------
async function synth(rankedCandidates, agentLog) {
  if (rankedCandidates.length === 0) return [];

  agentLog.push({
    timestamp: getFormattedTime(),
    module: 'SYNTH',
    message: 'Selecting candidates clearing quality floor for synthesis.',
    status: 'ok',
  });

  // Group by beat and column
  const groups = {};
  for (const c of rankedCandidates) {
    const key = `${c.beat}:${c.columnHint}`;
    if (!groups[key]) groups[key] = [];
    if (groups[key].length < 5) {
      groups[key].push(c);
    }
  }

  const selectedForSynthesis = Object.values(groups).flat();
  const synthesized = [];
  let llmSuccessCount = 0;
  let totalPromptTokens = 0;
  let totalCandidateTokens = 0;
  let estimatedCostUSD = 0;
  let droppedForLackOfSubstance = 0;
  let lastLlmErrorStatus = null;

  const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
  let candidateModels = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'];
  const disabledModels = new Set();

  // Pre-flight: Call ListModels once to inspect which models are active for this key
  if (apiKey) {
    const listRes = await listAvailableModels(apiKey);
    if (listRes.success) {
      const active = listRes.models;
      const flash = active.filter((m) => /flash/i.test(m));
      console.log(`[SYNTH] ListModels verified ${active.length} active models (flash: ${flash.join(', ') || 'none'}).`);
      agentLog.push({
        timestamp: getFormattedTime(),
        module: 'SYNTH',
        message: `Available Gemini models: ${flash.length > 0 ? flash.join(', ') : active.slice(0, 5).join(', ')}.`,
        status: 'ok',
      });

      // Prioritize active flash models discovered from the API key
      const activePrioritized = candidateModels.filter((m) => active.includes(m));
      const otherActiveFlash = active.filter((m) => /flash/i.test(m) && !candidateModels.includes(m));
      if (activePrioritized.length > 0 || otherActiveFlash.length > 0) {
        candidateModels = [...new Set([...activePrioritized, ...otherActiveFlash, ...candidateModels])];
      }
    } else {
      console.warn(`[SYNTH] ListModels query failed: HTTP ${listRes.status || 'error'}: ${listRes.error?.slice(0, 150)}`);
      agentLog.push({
        timestamp: getFormattedTime(),
        module: 'SYNTH',
        message: `ListModels query returned HTTP ${listRes.status || 'error'}. Attempting candidate models (${candidateModels.join(', ')}).`,
        status: 'warn',
      });
      if (listRes.status) {
        lastLlmErrorStatus = listRes.status;
        if (listRes.status === 400 || listRes.status === 401 || listRes.status === 403) {
          for (const m of candidateModels) disabledModels.add(m);
        }
      }
    }
  }

  for (const item of selectedForSynthesis) {
    const sanitizedText = sanitizeBoilerplate(item.rawText);

    // Attempt LLM synthesis if API key is provided and viable candidate models remain
    if (apiKey) {
      const viableModels = candidateModels.filter((m) => !disabledModels.has(m));
      if (viableModels.length > 0) {
        const geminiRes = await callGemini(item, apiKey, viableModels, disabledModels);
        if (geminiRes.success && geminiRes.parsed) {
          llmSuccessCount++;
          totalPromptTokens += geminiRes.promptTokens;
          totalCandidateTokens += geminiRes.candidatesTokens;
          estimatedCostUSD += geminiRes.promptTokens * 0.00000015 + geminiRes.candidatesTokens * 0.0000006;

          let finalTag = geminiRes.parsed.tag || assignTag(item, item.columnHint);
          // Ensure column-aware tag correctness
          if (item.columnHint === 'research' && finalTag === 'VENTURE') {
            finalTag = 'RESEARCH';
          }

          synthesized.push({
            ...item,
            headline: geminiRes.parsed.headline || item.headline,
            summary: cleanSummaryText(geminiRes.parsed.summary || sanitizedText || item.headline),
            tag: finalTag,
            relevanceScore: Number(geminiRes.parsed.relevanceScore) || 8.8,
          });
          continue;
        } else {
          if (!lastLlmErrorStatus && geminiRes.status) {
            lastLlmErrorStatus = geminiRes.status;
          }
        }
      }
    }

    // Deterministic Algorithmic Synthesis (Zero invented text)
    // Extract factual sentences from sanitized text
    const sentences = (sanitizedText || '')
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 25);

    // Filter out sentences that merely repeat the headline
    const nonRedundantSentences = sentences.filter(
      (s) => computeOverlapSimilarity(s, item.headline) < 0.75
    );

    let finalSummary = '';
    if (nonRedundantSentences.length >= 1) {
      finalSummary = nonRedundantSentences.slice(0, 3).join(' ');
    } else if (sentences.length >= 1 && sentences[0].length >= 40) {
      finalSummary = sentences.slice(0, 2).join(' ');
    } else if (sanitizedText && sanitizedText.length >= 50 && computeOverlapSimilarity(sanitizedText, item.headline) < 0.8) {
      finalSummary = sanitizedText;
    }

    finalSummary = cleanSummaryText(finalSummary);

    // If source text is empty, boilerplate-only, or merely duplicates headline: DROP ITEM ENTIRELY
    if (!finalSummary || finalSummary.length < 35) {
      droppedForLackOfSubstance++;
      continue;
    }

    const tag = assignTag(item, item.columnHint);

    synthesized.push({
      ...item,
      headline: item.headline,
      summary: finalSummary,
      tag,
      relevanceScore: Number((7.8 + (item.floorRank % 1.5)).toFixed(1)),
    });
  }

  const totalTokens = totalPromptTokens + totalCandidateTokens;
  const costStr = estimatedCostUSD > 0 ? `$${estimatedCostUSD.toFixed(5)}` : 'free tier';

  // Strictly honest reporting: only claim LLM synthesis if the LLM actually ran
  if (llmSuccessCount > 0) {
    agentLog.push({
      timestamp: getFormattedTime(),
      module: 'SYNTH',
      message: `LLM synthesis complete for ${llmSuccessCount} items (${droppedForLackOfSubstance} dropped for thin context). Tokens: ${totalTokens}. Est cost: ${costStr}.`,
      status: 'ok',
    });
  } else {
    let message = `Deterministic synthesis produced ${synthesized.length} items (${droppedForLackOfSubstance} dropped for lack of substantive source text, LLM key not configured). Est cost: free tier.`;
    if (apiKey) {
      const allCandidatesDisabled = candidateModels.every((m) => disabledModels.has(m));
      if (allCandidatesDisabled || lastLlmErrorStatus === 404) {
        message = `Deterministic synthesis (no LLM model available: all endpoints returned 404). Produced ${synthesized.length} items. Est cost: free tier.`;
      } else if (lastLlmErrorStatus) {
        message = `Deterministic synthesis produced ${synthesized.length} items (LLM call failed with HTTP ${lastLlmErrorStatus}). Est cost: free tier.`;
      } else {
        message = `Deterministic synthesis produced ${synthesized.length} items (LLM endpoints unavailable). Est cost: free tier.`;
      }
    }

    agentLog.push({
      timestamp: getFormattedTime(),
      module: 'SYNTH',
      message,
      status: 'ok',
    });
  }

  return synthesized;
}

// ----------------------------------------------------------------------------
// STAGE 4: EDITOR & 3X DAILY MERGE
// ----------------------------------------------------------------------------
function editor(synthesizedItems, sourcesConfig, agentLog) {
  agentLog.push({
    timestamp: getFormattedTime(),
    module: 'EDITOR',
    message: 'Computing composite 5-factor scores and executing non-destructive edition merge.',
    status: 'ok',
  });

  const today = getTodayISODate();
  const sevenDaysAgo = getSevenDaysAgoISODate();
  const targetFile = path.resolve(PUBLIC_DATA_DIR, `${today}.json`);

  // Check if today's edition already exists on disk
  let existingDigest = null;
  if (fs.existsSync(targetFile)) {
    try {
      existingDigest = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
    } catch {
      existingDigest = null;
    }
  }

  const dayDigest = {
    date: today,
    label: 'Today',
    lastUpdated: new Date().toISOString(),
    agentLog: [],
    beats: {},
  };

  // Initialize all beats and columns from sources.json
  for (const [beatId, config] of Object.entries(sourcesConfig.beats)) {
    dayDigest.beats[beatId] = { columns: {} };
    for (const col of config.columns) {
      dayDigest.beats[beatId].columns[col] = [];
    }
  }

  // Populate existing items from earlier runs of the day (preserving their IDs, scores, and summaries)
  // Prune any legacy items that violate the strict 7-day recency window
  let existingItemsKeptCount = 0;
  if (existingDigest?.beats) {
    for (const [beatId, beatObj] of Object.entries(existingDigest.beats)) {
      if (!dayDigest.beats[beatId]) continue;
      for (const [colKey, items] of Object.entries(beatObj.columns || {})) {
        if (!dayDigest.beats[beatId].columns[colKey]) continue;
        if (Array.isArray(items)) {
          for (const item of items) {
            // Prune stale items older than 7 days
            if (item.date && item.date < sevenDaysAgo) {
              continue;
            }
            // Enforce column-aware tags on retained existing items
            if (colKey === 'research' && item.tag === 'VENTURE') {
              item.tag = assignTag(item, 'research');
            }
            if (colKey === 'venture' && item.tag === 'VENTURE' && (item.source.includes('SEC') || item.headline.includes('Form D'))) {
              item.tag = assignTag(item, 'venture');
            }
            dayDigest.beats[beatId].columns[colKey].push(item);
            existingItemsKeptCount++;
          }
        }
      }
    }
  }

  let newItemsAddedCount = 0;
  let itemIdCounter = existingItemsKeptCount + 1;

  for (const item of synthesizedItems) {
    const beatId = item.beat;
    const colKey = item.columnHint;

    if (!dayDigest.beats[beatId] || !dayDigest.beats[beatId].columns[colKey]) {
      continue;
    }

    const targetColumn = dayDigest.beats[beatId].columns[colKey];

    // Check for duplicate in targetColumn by URL or high headline similarity (> 0.85)
    const isDuplicate = targetColumn.some((existing) => {
      if (item.url && existing.url && item.url === existing.url) return true;
      const sim = computeOverlapSimilarity(item.headline, existing.headline);
      return sim > 0.85;
    });

    if (isDuplicate) {
      // Keep existing item with its original scores, summary, and publish time
      continue;
    }

    const auth = item.scores.authority;
    const corr = item.scores.corroboration;
    const nov = item.scores.novelty;
    const mag = item.scores.magnitude;
    const rel = item.relevanceScore;

    let total = Number(
      (0.25 * auth + 0.2 * corr + 0.2 * nov + 0.2 * mag + 0.15 * rel).toFixed(1)
    );

    // Authority alone cannot push total score to 9.0+.
    // Only stories with high marks across at least three dimensions (>= 7.8) should crack 9.0.
    const highDimensions = [auth, corr, nov, mag, rel].filter((s) => s >= 7.8).length;
    if (highDimensions < 3 && total >= 8.5) {
      total = 8.4;
    }
    // An SEC filing or routine wire with low magnitude or novelty caps around 8.0-8.2
    if ((mag < 5.5 || nov < 5.0) && total > 8.2) {
      total = 8.2;
    }

    // Item date must match item's verified publication date (capped to <= edition date)
    const validItemDate = item.date && item.date <= today ? item.date : today;

    const digestItem = {
      id: `${beatId}-${colKey}-${today.replace(/-/g, '')}-${itemIdCounter++}`,
      source: item.source,
      date: validItemDate,
      headline: item.headline,
      summary: item.summary,
      tag: item.tag || assignTag(item, colKey),
      url: item.url,
      thumbnail: `https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&q=80`,
      beat: beatId,
      column: colKey,
      scores: {
        authority: auth,
        corroboration: corr,
        novelty: nov,
        magnitude: mag,
        relevance: rel,
        total,
      },
    };

    targetColumn.push(digestItem);
    newItemsAddedCount++;
  }

  // Preserve previous agent logs from earlier runs if merging
  const previousLogs = Array.isArray(existingDigest?.agentLog) ? existingDigest.agentLog : [];

  agentLog.push({
    timestamp: getFormattedTime(),
    module: 'EDITOR',
    message: existingItemsKeptCount > 0
      ? `3x daily merge: retained ${existingItemsKeptCount} existing dispatches, integrated ${newItemsAddedCount} new dispatches.`
      : `Enforced column quotas and finalized DayDigest edition tree (${newItemsAddedCount} dispatches).`,
    status: 'ok',
  });

  dayDigest.agentLog = [...previousLogs, ...agentLog].slice(-30);
  return dayDigest;
}

// ----------------------------------------------------------------------------
// STAGE 5: PUBLISH
// ----------------------------------------------------------------------------
function publish(dayDigest, agentLog) {
  const today = dayDigest.date;
  const targetFile = path.resolve(PUBLIC_DATA_DIR, `${today}.json`);
  const indexFile = path.resolve(PUBLIC_DATA_DIR, 'index.json');

  // Count items in new digest
  let newTotalItems = 0;
  for (const b of Object.values(dayDigest.beats)) {
    for (const c of Object.values(b.columns)) {
      newTotalItems += c.length;
    }
  }

  // Write edition file
  fs.writeFileSync(targetFile, JSON.stringify(dayDigest, null, 2), 'utf8');
  console.log(`[PUBLISH] Written daily digest to: ${targetFile} (${newTotalItems} items)`);

  // Rebuild index.json strictly from actual existing files on disk
  const existingFiles = fs
    .readdirSync(PUBLIC_DATA_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map((f) => f.replace('.json', ''))
    .sort()
    .reverse();

  // Keep last 7 editions
  const last7Dates = existingFiles.slice(0, 7);
  const updatedIndex = last7Dates.map((dateStr) => ({
    date: dateStr,
    label: getEditionLabel(dateStr, today),
  }));

  fs.writeFileSync(indexFile, JSON.stringify(updatedIndex, null, 2), 'utf8');
  console.log(`[PUBLISH] Updated index.json with ${updatedIndex.length} verified on-disk editions.`);

  agentLog.push({
    timestamp: getFormattedTime(),
    module: 'PUBLISH',
    message: `Artifacts committed to /public/data/. Edition ${today} live (${newTotalItems} dispatches).`,
    status: 'ok',
  });

  // If running inside GitHub Actions, commit and push with race-handling rebase & retry
  if (process.env.GITHUB_ACTIONS === 'true') {
    try {
      execSync('git config user.name "github-actions[bot]"');
      execSync('git config user.email "github-actions[bot]@users.noreply.github.com"');
      execSync('git add public/data/');
      const status = execSync('git status --porcelain').toString();
      if (status.trim().length === 0) {
        console.log('[PUBLISH] No data changes to commit.');
        return;
      }
      execSync(`git commit -m "chore(data): auto-publish daily briefing [${today}]"`);
    } catch (commitErr) {
      console.error('[PUBLISH CRITICAL ERROR] Git staging/commit failed:', commitErr.message);
      throw commitErr;
    }

    try {
      console.log('[PUBLISH] Pushing briefing data to origin main...');
      execSync('git push origin main');
      console.log('[PUBLISH] Successfully committed and pushed to git repository.');
    } catch (pushErr) {
      console.warn('[PUBLISH] Initial git push rejected. Running git pull --rebase origin main to resolve race condition...');
      try {
        try {
          execSync('git pull --rebase origin main');
        } catch {
          console.warn('[PUBLISH] Merge conflict during rebase. Favoring newly synthesized briefing data...');
          execSync('git checkout --theirs public/data/ && git add public/data/ && GIT_EDITOR=true git rebase --continue');
        }
        console.log('[PUBLISH] Rebase successful. Retrying git push...');
        execSync('git push origin main');
        console.log('[PUBLISH] Successfully pushed after rebase retry.');
      } catch (retryErr) {
        console.error('[PUBLISH CRITICAL ERROR] Git push retry failed after rebase:', retryErr.message);
        throw new Error(`Git publish failed to push to origin/main: ${retryErr.message}`);
      }
    }
  }
}

// ----------------------------------------------------------------------------
// MAIN ORCHESTRATION
// ----------------------------------------------------------------------------
async function main() {
  let currentCommitSha = 'unknown';
  let commitMessage = '';
  try {
    currentCommitSha = execSync('git rev-parse HEAD').toString().trim();
    commitMessage = execSync('git log -1 --pretty=%B').toString().trim().split('\n')[0];
  } catch {}

  console.log('================================================================');
  console.log('NEXUS v2 — Daily Agentic Synthesis Pipeline');
  console.log(`Commit SHA:  ${currentCommitSha}`);
  console.log(`Commit Msg:  ${commitMessage}`);
  console.log(`Environment: ${process.env.GITHUB_ACTIONS === 'true' ? 'GitHub Actions CI' : 'Local Development'}`);
  console.log('================================================================');

  const agentLog = [];
  agentLog.push({
    timestamp: getFormattedTime(),
    module: 'SCOUT',
    message: `Pipeline active on commit ${currentCommitSha.substring(0, 7)}: "${commitMessage.substring(0, 50)}"`,
    status: 'ok',
  });

  const sourcesConfig = JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf8'));

  try {
    const candidates = await scout(sourcesConfig, agentLog);
    const ranked = rank(candidates, agentLog);
    const synthesized = await synth(ranked, agentLog);
    const dayDigest = editor(synthesized, sourcesConfig, agentLog);
    publish(dayDigest, agentLog);

    console.log('================================================================');
    console.log('Pipeline execution successfully completed.');
    console.log('================================================================');
  } catch (err) {
    console.error('[PIPELINE ERROR]', err);
    process.exit(1);
  }
}

main();
