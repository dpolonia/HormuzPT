import { Router } from 'express';
import { config } from '../config.js';

const router = Router();

// POST /api/chat — Q&A with LLM (Moderado tier)
router.post('/chat', async (req, res) => {
    try {
        const { question } = req.body as { question?: string };
        if (!question) {
            res.status(400).json({ error: 'Missing "question" in request body' });
            return;
        }

        // TODO: Implement LLM routing (Moderado tier: claude-sonnet → gpt-5.4 → gemini-3-flash)
        // For now, return a stub response
        const model = 'stub';
        const tier = 'moderado';

        res.json({
            answer: `[Provisório] Resposta automática de demonstração. A integração LLM está pendente. Pergunta recebida: "${question}"`,
            model,
            tier,
            tokens_in: 0,
            tokens_out: 0,
            cost_eur: 0,
            cached: false,
        });
    } catch (err) {
        res.status(500).json({ error: 'Chat failed', detail: String(err) });
    }
});

export default router;
