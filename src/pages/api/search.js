const { ensureGitHubEnv, getForce } = require('../../lib/api-utils.js');
const { fetchRepoContext } = require('../../../agentskills/skills/github-manager/scripts/fetch-repo-context.js');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MAX_CANDIDATES = 60;
const MAX_RESULTS = 8;
const MAX_DEPENDENCIES = 20;
const SNIPPET_LIMIT = 600;

function toClientRepo(context) {
  return {
    id: context.id,
    fullName: context.fullName,
    description: context.description,
    language: context.language,
    url: context.url,
    dependencies: context.dependencies || [],
  };
}

function normalizeForSearch(text) {
  return (text || '').toLowerCase();
}

function tokenize(text) {
  return normalizeForSearch(text)
    .split(/\s+|[\/,.:;(){}\[\]<>"'`~!@#$%^&*+=?\\|-]+/)
    .filter(Boolean);
}

function expandQuery(query) {
  const tokens = new Set(tokenize(query));
  const synonyms = {
    ocr: ['text recognition', 'tesseract', 'pytesseract', 'easyocr', 'opencv'],
    vision: ['image', 'opencv', 'cnn'],
    scraping: ['crawler', 'puppeteer', 'playwright', 'beautifulsoup'],
    speech: ['audio', 'whisper'],
    translate: ['translation'],
  };

  Object.keys(synonyms).forEach((key) => {
    if (query.toLowerCase().includes(key.toLowerCase())) {
      synonyms[key].forEach((value) => tokens.add(value.toLowerCase()));
    }
  });

  return Array.from(tokens);
}

function keywordScore(query, context) {
  const tokens = expandQuery(query);
  const text = normalizeForSearch(context.text || '');
  const deps = (context.dependencies || []).map((dep) => dep.toLowerCase());
  let score = 0;

  tokens.forEach((token) => {
    if (!token) return;
    if (text.includes(token)) {
      score += 1;
    }
    if (deps.some((dep) => dep.includes(token))) {
      score += 2;
    }
  });

  return score;
}

function truncateText(text, limit) {
  if (!text) return '';
  return text.length > limit ? text.slice(0, limit) : text;
}

function buildRepoSnippet(context) {
  const deps = (context.dependencies || []).slice(0, MAX_DEPENDENCIES);
  const snippet = truncateText(context.text || '', SNIPPET_LIMIT);
  return [
    `id: ${context.id}`,
    `name: ${context.fullName}`,
    context.description ? `description: ${context.description}` : '',
    context.language ? `language: ${context.language}` : '',
    deps.length ? `dependencies: ${deps.join(', ')}` : '',
    snippet ? `context: ${snippet}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function pickCandidates(contexts, query) {
  if (contexts.length <= MAX_CANDIDATES) {
    return contexts;
  }

  const scored = contexts
    .map((context) => ({ context, score: keywordScore(query, context) }))
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0)
    .slice(0, MAX_CANDIDATES)
    .map((item) => item.context);

  if (scored.length >= 10) {
    return scored;
  }

  return contexts.slice(0, MAX_CANDIDATES);
}

function buildGeminiPrompt(query, contexts) {
  const repoBlocks = contexts.map(buildRepoSnippet).join('\n\n');
  return [
    'You are ranking GitHub repositories by relevance to the query.',
    'Return JSON only with the shape:',
    '{"items":[{"id":123,"score":0.87}]}',
    'Rules:',
    '- Use only ids from the list.',
    '- Score is a number between 0 and 1.',
    `- Return at most ${MAX_RESULTS} items.`,
    'Query:',
    query,
    'Repositories:',
    repoBlocks,
  ].join('\n');
}

function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    text = fenced[1];
  }
  const startBrace = text.indexOf('{');
  const endBrace = text.lastIndexOf('}');
  const startBracket = text.indexOf('[');
  const endBracket = text.lastIndexOf(']');
  let payload = '';
  if (startBrace !== -1 && endBrace !== -1 && endBrace > startBrace) {
    payload = text.slice(startBrace, endBrace + 1);
  } else if (startBracket !== -1 && endBracket !== -1 && endBracket > startBracket) {
    payload = text.slice(startBracket, endBracket + 1);
  } else {
    return null;
  }
  try {
    return JSON.parse(payload);
  } catch (error) {
    return null;
  }
}

function normalizeGeminiItems(parsed) {
  if (!parsed) return null;
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.items)) return parsed.items;
  if (Array.isArray(parsed.results)) return parsed.results;
  return null;
}

function parseItemsFromText(text) {
  if (!text) return [];
  const items = [];
  const pattern = /id\s*[:=]\s*(\d+)[\s\S]*?score\s*[:=]\s*([0-9]*\.?[0-9]+)/gi;
  let match = pattern.exec(text);
  while (match) {
    items.push({ id: Number(match[1]), score: Number(match[2]) });
    match = pattern.exec(text);
  }
  return items;
}

async function geminiRank(query, contexts) {
  const prompt = buildGeminiPrompt(query, contexts);
  const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 512,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            items: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  id: { type: 'INTEGER' },
                  score: { type: 'NUMBER' },
                },
                required: ['id', 'score'],
              },
            },
          },
          required: ['items'],
        },
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${errorText}`);
  }

  const data = await response.json();
  const text =
    data.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') || '';
  const parsed = extractJson(text);
  const items = normalizeGeminiItems(parsed) || parseItemsFromText(text);
  if (!items || !items.length) {
    throw new Error('Gemini response is invalid.');
  }

  return items;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!ensureGitHubEnv(res)) return;

  const query = (req.query.q || '').toString().trim();
  if (!query) {
    res.status(400).json({ error: 'Query is empty.' });
    return;
  }

  try {
    const contexts = await fetchRepoContext({ force: getForce(req) });
    if (!contexts.length) {
      res.status(200).json({ query, mode: 'keyword', items: [] });
      return;
    }

    if (GEMINI_API_KEY) {
      try {
        const candidates = pickCandidates(contexts, query);
        const scored = await geminiRank(query, candidates);
        const repoMap = new Map(
          candidates.map((context) => [String(context.id), context])
        );
        const items = scored
          .map((item) => {
            const repo = repoMap.get(String(item.id));
            const score = Number(item.score);
            if (!repo || !Number.isFinite(score)) return null;
            const normalized = Math.max(0, Math.min(1, score));
            return { repo: toClientRepo(repo), score: normalized };
          })
          .filter(Boolean)
          .sort((a, b) => b.score - a.score)
          .slice(0, MAX_RESULTS);

        res.status(200).json({
          query,
          mode: 'semantic',
          items,
        });
        return;
      } catch (error) {
        console.warn(`Gemini ranking failed: ${error.message}`);
      }
    }

    const scored = contexts
      .map((context) => ({
        repo: toClientRepo(context),
        score: keywordScore(query, context),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS);

    res.status(200).json({
      query,
      mode: 'keyword',
      items: scored,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
