import { Router } from 'express';
import jwt         from 'jsonwebtoken';
import User        from '../models/UserModel.js';

const auth = Router();

// ─── Registro ─────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { username, email, password }
 */
auth.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'username, email e password são obrigatórios.' });
        }

        // Verifica duplicata antes de tentar salvar (mensagem mais amigável)
        const exists = await User.findOne({ $or: [{ email }, { username }] });
        if (exists) {
            const field = exists.email === email.toLowerCase() ? 'e-mail' : 'nome de usuário';
            return res.status(409).json({ error: `Este ${field} já está cadastrado.` });
        }

        const user  = await User.create({ username, email, password });
        const token = signToken(user._id);

        res.status(201).json({ token, user });
    } catch (err) {
        // Erro de validação do Mongoose
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: messages.join(' | ') });
        }
        res.status(500).json({ error: err.message });
    }
});

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
auth.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'email e password são obrigatórios.' });
        }

        // select('+password') traz o campo que tem select:false no schema
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const match = await user.comparePassword(password);
        if (!match) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const token = signToken(user._id);
        res.json({ token, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Perfil autenticado ───────────────────────────────────────────────────────

/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 */
auth.get('/me', requireAuth, async (req, res) => {
    res.json({ user: req.user });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function signToken(userId) {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );
}

/** Middleware inline reutilizável neste arquivo */
async function requireAuth(req, res, next) {
    try {
        const header = req.headers.authorization || '';
        const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
        if (!token) return res.status(401).json({ error: 'Token de autenticação ausente.' });

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(payload.id);
        if (!req.user) return res.status(401).json({ error: 'Usuário não encontrado.' });
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
}

export default auth;
