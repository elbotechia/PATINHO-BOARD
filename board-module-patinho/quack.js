import { Router } from 'express';
import Question    from '../board-server-patinho/apps/models/QuestionModel.js';
import Answer      from '../board-server-patinho/apps/models/AnswerModel.js';
import { requireAuth } from '../board-server-patinho/apps/middleware/auth.js';

const quack = Router();

// ─── Questions ────────────────────────────────────────────────────────────────

/** GET /api/questions  –  lista todas as perguntas (ordem: mais recente) */
quack.get('/questions', async (req, res) => {
    try {
        const { lang, tag, q } = req.query;
        const filter = {};

        if (lang) filter.language = lang;
        if (tag)  filter.tags = tag;
        if (q) {
            const regex = new RegExp(q, 'i');
            filter.$or  = [{ title: regex }, { description: regex }];
        }

        const questions = await Question.find(filter)
            .sort({ createdAt: -1 })
            .populate('author', 'username');

        // conta respostas para cada pergunta
        const withCount = await Promise.all(
            questions.map(async (question) => {
                const answer_count = await Answer.countDocuments({ question: question._id });
                return { ...question.toJSON(), answer_count };
            }),
        );

        res.json(withCount);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** GET /api/questions/:id  –  pergunta + respostas */
quack.get('/questions/:id', async (req, res) => {
    try {
        const question = await Question.findById(req.params.id).populate('author', 'username');
        if (!question) return res.status(404).json({ error: 'Pergunta não encontrada.' });

        // incrementa views
        question.views += 1;
        await question.save();

        const answers = await Answer.find({ question: req.params.id })
            .sort({ is_accepted: -1, votes: -1 })
            .populate('author', 'username');

        res.json({ ...question.toJSON(), answers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** POST /api/questions  –  cria uma nova pergunta (requer autenticação) */
quack.post('/questions', requireAuth, async (req, res) => {
    try {
        const { title, description, code_snippet, language, tags } = req.body;
        if (!title || !description)
            return res.status(400).json({ error: 'title e description são obrigatórios.' });

        const question = await Question.create({
            title,
            description,
            code_snippet: code_snippet || '',
            language:     language     || 'javascript',
            tags:         Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
            author:       req.user._id,
        });

        await question.populate('author', 'username');
        res.status(201).json(question);
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: messages.join(' | ') });
        }
        res.status(500).json({ error: err.message });
    }
});

// ─── Answers ──────────────────────────────────────────────────────────────────

/** POST /api/questions/:id/answers  –  responde uma pergunta (requer autenticação) */
quack.post('/questions/:id/answers', requireAuth, async (req, res) => {
    try {
        const { content, code_snippet } = req.body;
        if (!content)
            return res.status(400).json({ error: 'content é obrigatório.' });

        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ error: 'Pergunta não encontrada.' });

        const answer = await Answer.create({
            question:     req.params.id,
            content,
            code_snippet: code_snippet || '',
            author:       req.user._id,
        });

        await answer.populate('author', 'username');
        res.status(201).json(answer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** PATCH /api/answers/:id/accept  –  aceita uma resposta (requer autenticação) */
quack.patch('/answers/:id/accept', requireAuth, async (req, res) => {
    try {
        const answer = await Answer.findById(req.params.id);
        if (!answer) return res.status(404).json({ error: 'Resposta não encontrada.' });

        // desmarcar outras respostas aceitas da mesma pergunta
        await Answer.updateMany({ question: answer.question }, { is_accepted: false });
        answer.is_accepted = true;
        await answer.save();

        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** PATCH /api/answers/:id/vote  –  vota em uma resposta (+1 / -1) */
quack.patch('/answers/:id/vote', async (req, res) => {
    try {
        const { direction } = req.body; // 'up' | 'down'
        const delta = direction === 'down' ? -1 : 1;

        const updated = await Answer.findByIdAndUpdate(
            req.params.id,
            { $inc: { votes: delta } },
            { new: true },
        ).populate('author', 'username');

        if (!updated) return res.status(404).json({ error: 'Resposta não encontrada.' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Stats ────────────────────────────────────────────────────────────────────

/** GET /api/stats  –  números gerais para o dashboard */
quack.get('/stats', async (_req, res) => {
    try {
        const total_q  = await Question.countDocuments();
        const total_a  = await Answer.countDocuments();
        const accepted = await Answer.countDocuments({ is_accepted: true });

        const languages = await Question.aggregate([
            { $group: { _id: '$language', count: { $sum: 1 } } },
            { $sort:  { count: -1 } },
            { $project: { language: '$_id', count: 1, _id: 0 } },
        ]);

        res.json({ total_q, total_a, accepted, languages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default quack;
