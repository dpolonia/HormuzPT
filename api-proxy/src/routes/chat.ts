import { Router, Request, Response } from 'express';
import { config } from '../config.js';
import { LLMRouter } from '../llm/router.js';
import Database from 'better-sqlite3';
import path from 'path';

// Connect implicitly to the same history database
const dbDir = path.join(process.cwd(), 'data');
const db = new Database(path.join(dbDir, 'history.sqlite'));

const router = Router();
const llmRouter = new LLMRouter();

// POST /api/chat — Q&A with LLM (Moderado tier)
router.post('/chat', async (req: Request, res: Response) => {
    console.log(`[chat] Incoming request from ${req.ip} with body:`, req.body);
    try {
        const { question } = req.body as { question?: string };
        if (!question) {
            res.status(400).json({ error: 'Missing "question" in request body' });
            return;
        }

        // Fetch baseline dynamically from the recalibrator through our own proxy config
        let baselineState = "Dados não disponíveis.";
        try {
            const stateRes = await fetch(`http://127.0.0.1:${config.port}/api/model-state`);
            if (stateRes.ok) {
                const stateData = await stateRes.json();
                baselineState = JSON.stringify(stateData.state, null, 2);
            }
        } catch (err) {
            console.warn("Chat could not fetch current model context");
        }

        const systemPrompt = `You are a Senior Energy Economist analyzing the HormuzPT projections (a Portuguese energy-system model simulating crude oil shocks).
Your goal is to explain the economic and cascade impacts to policymakers clearly and objectively.
Base your insights strictly on this baseline model state:
${baselineState}

Rules for your response:
1. Tone: Professional, analytical, and objective.
2. Language: Concise and clear European Portuguese (PT-PT).
3. Structure: Use a direct, structured format (e.g., bullet points) if explaining multiple effects. Do not use conversational filler (e.g., "Olá", "Aqui está a análise", "Espero ter ajudado").
4. Constraints: Only discuss data derived from the provided model state and the established parameters of the HormuzPT dashboard. If asked about external topics, politely decline and refocus on the energy model.`;

        const fullPrompt = `${systemPrompt}\n\nUser Question:\n${question}`;
        
        console.log("Chat route accepted prompt. Resolving LLM route...");
        const result = await llmRouter.chat(fullPrompt, 'frontend_qa');
        console.log("LLM route resolved and returned:", result.model_meta);
        // Log the usage to History DB
        try {
            const stmt = db.prepare('INSERT INTO history_events (timestamp, user, action, details) VALUES (?, ?, ?, ?)');
            const timestamp = new Date().toISOString();
            const details = {
                question,
                model_meta: result.model_meta,
                tokens_in: result.tokens_in,
                tokens_out: result.tokens_out,
                cost_usd: result.cost_usd
            };
            stmt.run(timestamp, 'system', 'qna', JSON.stringify(details));
        } catch (dbErr) {
            console.error("Failed to log Q&A interaction to SQLite:", dbErr);
        }

        res.json({
            answer: result.answer,
            model_meta: result.model_meta,
            tokens_in: result.tokens_in,
            tokens_out: result.tokens_out,
            cost_usd: result.cost_usd,
            cached: false,
        });
    } catch (err) {
        console.error("Chat error:", err);
        res.status(500).json({ error: 'Chat failed', detail: String(err) });
    }
});

export default router;
