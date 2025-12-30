import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../../lib/prisma.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

export default async function handler(req, res) {
    const { repo } = req.query; // e.g., "owner/repo"

    if (!repo) {
        return res.status(400).json({ error: 'Missing repo parameter' });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    try {
        // 1. Fetch README content from GitHub API
        const readmeRes = await fetch(`https://api.github.com/repos/${repo}/readme`, {
            headers: {
                'Accept': 'application/vnd.github.raw',
                'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (!readmeRes.ok) {
            if (readmeRes.status === 404) {
                return res.status(200).json({ summary: 'READMEが見つかりません。', saved: false });
            }
            throw new Error(`GitHub API error: ${readmeRes.status}`);
        }

        const readmeText = await readmeRes.text();
        const truncatedReadme = readmeText.slice(0, 5000); // Limit context size

        // 2. Call Gemini for summarization
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const prompt = `
      以下のREADME.mdの内容を読んで、このリポジトリが「何をするものか」を3〜4行の箇条書きで日本語で要約してください。
      エンジニアがひと目で技術スタックや目的を理解できるように、簡潔かつ具体的に書いてください。
      
      README content:
      ${truncatedReadme}
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        // 3. Save to DB
        let saved = false;
        if (prisma) {
            try {
                await prisma.repo.update({
                    where: { fullName: repo },
                    data: { summary: summary },
                });
                saved = true;
                console.log(`Summary saved for ${repo}`);
            } catch (e) {
                console.error('Failed to save summary to DB:', e.message);
            }
        }

        res.status(200).json({ summary, saved });
    } catch (error) {
        console.error('AI Summary Error:', error);
        res.status(500).json({ error: 'Failed to generate summary', details: error.message });
    }
}

