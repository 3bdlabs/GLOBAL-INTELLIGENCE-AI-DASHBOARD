export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const { contextText } = await req.json();

        if (!contextText || typeof contextText !== 'string') {
            return new Response(JSON.stringify({ error: 'Missing contextText array in body' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434';

        // Phase 3: The AI Logic (Master Analyst) - System Prompt Draft
        const systemPrompt = `You are the Lead Intelligence Director for a strategic military and geopolitical dashboard. 
Your task is to analyze the provided recent intelligence summaries (the Global Context Buffer) and produce a cohesive strategic synthesis.
Your output MUST be a strict JSON object with EXACTLY the following four fields (do not add properties or markdown blocks):
1. "trend_correlation": A string explaining links across categories (e.g., Security -> Economy).
2. "seven_day_forecast": A string providing a predictive strategic outlook for the next week.
3. "advisor_strategy": A string with actionable recommendations based on the intelligence.
4. "confidence_score": An integer from 0 to 100 representing the certainty of your analysis.

Context to analyze:
${contextText}`;

        // Targeting the correct Ollama model
        const ollamaPayload = {
            model: 'gpt-oss:20b',
            messages: [{ role: 'system', content: systemPrompt }],
            format: 'json',
            stream: false,
        };

        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ollamaPayload),
        });

        if (!response.ok) {
            throw new Error(`Ollama returned status ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        const messageContent = data.message?.content || '{}';
        let parsedContent;
        try {
            parsedContent = JSON.parse(messageContent);
        } catch (e) {
            throw new Error('Ollama response was not valid JSON');
        }

        return new Response(JSON.stringify(parsedContent), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error('Strategic Synthesis Error:', err);
        return new Response(JSON.stringify({ error: 'Internal Server Error', details: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
