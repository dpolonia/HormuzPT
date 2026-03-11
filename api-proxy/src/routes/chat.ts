import { Router, Request, Response } from 'express';
import { config } from '../config.js';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const router = Router();

// Load baseline state as context
let baselineState = '';
try {
    const statePath = path.join(process.cwd(), '../data/model_state_initial.json');
    baselineState = fs.readFileSync(statePath, 'utf8');
} catch (e) {
    console.warn("Could not load baseline state for Chat context");
}

let anthropic: Anthropic | null = null;
try {
    anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY || 'stub',
    });
} catch (e) {
    console.error("Failed to initialize Anthropic client:", e);
}

// POST /api/chat — Q&A with LLM (Moderado tier)
router.post('/chat', async (req: Request, res: Response) => {
    try {
        const { question } = req.body as { question?: string };
        if (!question) {
            res.status(400).json({ error: 'Missing "question" in request body' });
            return;
        }

        if (!anthropic || process.env.ANTHROPIC_API_KEY === 'stub' || !process.env.ANTHROPIC_API_KEY) {
            return res.json({
                answer: `[Modo Offline] Integração Anthropic API não configurada. A pergunta foi: "${question}"`,
                model: 'offline-stub',
                tier: 'moderado',
                tokens_in: 0,
                tokens_out: 0,
                cost_eur: 0,
                cached: false,
            });
        }

        const systemPrompt = `We are an energy-system modeling dashboard for Portugal (HormuzPT).
Your role is to explain the economic impacts of a crude oil shock based on the dashboard projections.
Base your responses on the following baseline projection state:
${baselineState}
Always reply in concise, clear European Portuguese.`;

        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            temperature: 0.3,
            system: systemPrompt,
            messages: [{ role: 'user', content: question }]
        });

        const answerText = message.content[0].type === 'text' ? message.content[0].text : 'No text response generated.';
        
        res.json({
            answer: answerText,
            model: 'claude-3-5-sonnet-20241022',
            tier: 'moderado',
            tokens_in: message.usage.input_tokens,
            tokens_out: message.usage.output_tokens,
            cost_eur: 0, // Simplified for now
            cached: false,
        });
    } catch (err) {
        console.error("Chat error:", err);
        res.status(500).json({ error: 'Chat failed', detail: String(err) });
    }
});

export default router;
