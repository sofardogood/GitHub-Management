import { GoogleGenerativeAI } from '@google/generative-ai';

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
                return res.status(200).json({ summary: 'READMEが見つかりません。' });
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

        // Save to DB (if prisma available)
        try {
            const prisma = require('../../lib/prisma.js');
            if (prisma) {
                // We need repo ID. fetchRepos might not return ID in this context easily unless we query DB.
                // But we have 'repo' string "owner/name".
                // Let's try to update by fullName
                await prisma.repo.update({
                    where: { fullName: repo },
                    data: { summary: summary },
                });
            }
        } catch (e) {
            console.warn('Failed to save summary to DB:', e.message);
        }

        res.status(200).json({ summary });
    } catch (error) {
        console.error('AI Summary Error:', error);
        res.status(500).json({ error: 'Failed to generate summary', details: error.message });
    }
}
