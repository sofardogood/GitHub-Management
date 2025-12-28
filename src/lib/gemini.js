const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function generateSummary(repoName, fileStructure, context = '') {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('GEMINI_API_KEY is not set');
        return null;
    }

    try {
        const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp' });

        const prompt = `
You are an expert developer. Summarize the GitHub repository "${repoName}" in Japanese (1-2 sentences).
Based on the file structure and any context provided.

File Structure:
${JSON.stringify(fileStructure, null, 2)}

Context:
${context}

Output ONLY the summary text in Japanese.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error('Gemini verification failed:', error);
        return null;
    }
}

module.exports = {
    generateSummary,
};
