export async function handleStrategicSynthesis(req: Request): Promise<Response> {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const body = await req.json();
        const { contextText } = body;

        // Fetch live context from the bridge
        let liveContextStr = '';
        try {
            const { getAiContext } = await import('./worldmonitor/ai-context/v1/handler');
            const liveContext = await getAiContext({ request: req } as any);
            liveContextStr = `
LIVE STRATEGIC CONTEXT:
- Regional News Headlines: ${JSON.stringify(liveContext.regionalNews)}
- Infrastructure Status: ${liveContext.infrastructure.cablesDegraded} cables degraded, ${liveContext.infrastructure.chokepointsCongested} chokepoints congested.
`;
        } catch (e) {
            console.warn('Failed to fetch live context for synthesis:', e);
        }

        const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434';

        const systemPrompt = `You are the Lead Intelligence Director for a strategic military and geopolitical dashboard. 
Your task is to analyze the provided recent intelligence summaries (the Global Context Buffer) and produce a cohesive strategic synthesis.
Your output MUST be a strict JSON object with EXACTLY the following four fields (do not add properties or markdown blocks):
1. "trend_correlation": A string explaining links across categories (e.g., Security -> Economy).
2. "seven_day_forecast": A string providing a predictive strategic outlook for the next week.
3. "advisor_strategy": A string with actionable recommendations based on the intelligence.
4. "confidence_score": An integer from 0 to 100 representing the certainty of your analysis.

${liveContextStr}

Context to analyze:
${contextText}`;

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
            const errorText = await response.text();
            throw new Error(`Ollama returned status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const messageContent = data.message?.content || '{}';

        let parsedContent;
        try {
            parsedContent = JSON.parse(messageContent);
        } catch (e) {
            console.error('Failed to parse Ollama JSON:', messageContent);
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
