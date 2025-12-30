const prisma = require('../../lib/prisma.js');

export default async function handler(req, res) {
    if (!prisma) {
        res.status(500).json({ error: 'Database not available' });
        return;
    }

    const repo = req.query.repo || (req.body && req.body.repo);

    if (req.method === 'GET') {
        if (!repo) {
            res.status(400).json({ error: 'Missing repo parameter' });
            return;
        }

        try {
            const repoData = await prisma.repo.findUnique({
                where: { fullName: repo },
                select: { summary: true, description: true, customUrl: true },
            });

            if (!repoData) {
                res.status(404).json({ error: 'Repo not found' });
                return;
            }

            res.status(200).json(repoData);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
        return;
    }

    if (req.method === 'PATCH') {
        const { summary, description, customUrl } = req.body || {};

        if (!repo) {
            res.status(400).json({ error: 'Missing repo parameter' });
            return;
        }

        try {
            const updateData = {};
            if (summary !== undefined) updateData.summary = summary;
            if (description !== undefined) updateData.description = description;
            if (customUrl !== undefined) updateData.customUrl = customUrl;

            const updated = await prisma.repo.update({
                where: { fullName: repo },
                data: updateData,
            });

            res.status(200).json({
                ok: true,
                summary: updated.summary,
                description: updated.description,
                customUrl: updated.customUrl
            });
        } catch (error) {
            if (error.code === 'P2025') {
                res.status(404).json({ error: 'Repo not found' });
                return;
            }
            res.status(500).json({ error: error.message });
        }
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
}
