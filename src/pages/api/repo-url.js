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
                select: { customUrl: true },
            });

            if (!repoData) {
                res.status(404).json({ error: 'Repo not found' });
                return;
            }

            res.status(200).json({ customUrl: repoData.customUrl });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
        return;
    }

    if (req.method === 'PATCH') {
        const { customUrl } = req.body || {};

        if (!repo) {
            res.status(400).json({ error: 'Missing repo parameter' });
            return;
        }

        try {
            const updated = await prisma.repo.update({
                where: { fullName: repo },
                data: { customUrl: customUrl || null },
            });

            res.status(200).json({ ok: true, customUrl: updated.customUrl });
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
