const prisma = require('../../../lib/prisma.js');
const { generateSummary } = require('../../../lib/gemini.js');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    // Allow manual trigger or cron
    // const { limit = 5 } = req.body; 

    try {
        // 1. Find repos without description (or very short) and no summary yet
        const repos = await prisma.repo.findMany({
            where: {
                OR: [
                    { description: '' },
                    { description: null }
                ],
                summary: null,
            },
            take: 3, // Process 3 at a time to avoid timeout/rate limits
        });

        if (repos.length === 0) {
            return res.status(200).json({ message: 'No repositories need summarization.' });
        }

        const results = [];

        // 2. Generate summaries
        for (const repo of repos) {
            // Mock file structure or fetch it? 
            // For now, we use the repo name and existing metadata as context.
            // Ideally we would fetch file tree, but that's expensive for this step.
            const context = `
        Language: ${repo.language}
        Stars: ${repo.stars}
        Topics: ${repo.topics ? JSON.stringify(repo.topics) : '[]'}
      `;

            const summary = await generateSummary(repo.name, { note: "File structure fetch skipped for speed" }, context);

            if (summary) {
                // 3. Save to DB
                await prisma.repo.update({
                    where: { id: repo.id },
                    data: { summary },
                });
                results.push({ name: repo.name, summary });
            }
        }

        res.status(200).json({
            processed: results.length,
            results
        });

    } catch (error) {
        console.error('Summary generation failed:', error);
        res.status(500).json({ error: error.message });
    }
}
