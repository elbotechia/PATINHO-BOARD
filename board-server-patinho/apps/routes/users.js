import { Router }   from 'express';
import multer        from 'multer';
import path          from 'path';
import fs            from 'fs';
import { fileURLToPath } from 'url';
import User          from '../models/UserModel.js';
import Question      from '../models/QuestionModel.js';
import { requireAuth } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Pasta de storage na raiz do projeto ───────────────────────────────────────
const storageDir = path.resolve(__dirname, '../../../../storage');
if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

// ── Multer: salva o arquivo em /storage com nome único ────────────────────────
const diskStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, storageDir),
    filename: (req, file, cb) => {
        const ext  = path.extname(file.originalname).toLowerCase();
        const name = `avatar-${req.user._id}-${Date.now()}${ext}`;
        cb(null, name);
    },
});

const upload = multer({
    storage: diskStorage,
    limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp|gif/;
        const ok = allowed.test(file.mimetype) && allowed.test(path.extname(file.originalname).toLowerCase());
        cb(ok ? null : new Error('Apenas imagens são permitidas (jpeg, jpg, png, webp, gif).'), ok);
    },
});

const users = Router();

// ─── GET /api/users/me ────────────────────────────────────────────────────────
users.get('/me', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).lean();
        if (user.avatar) user.avatarUrl = `/storage/${user.avatar}`;
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── PUT /api/users/me ────────────────────────────────────────────────────────
users.put('/me', requireAuth, async (req, res) => {
    try {
        const { username, bio } = req.body;
        const update = {};
        if (username !== undefined) update.username = username;
        if (bio      !== undefined) update.bio      = bio;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: update },
            { new: true, runValidators: true },
        ).lean();

        if (user.avatar) user.avatarUrl = `/storage/${user.avatar}`;
        res.json({ user });
    } catch (err) {
        if (err.name === 'ValidationError') {
            const msgs = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: msgs.join(' | ') });
        }
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/users/me/avatar ────────────────────────────────────────────────
users.post('/me/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });

        // Remove avatar antigo se existir
        const prev = await User.findById(req.user._id).select('avatar');
        if (prev?.avatar) {
            const old = path.join(storageDir, prev.avatar);
            if (fs.existsSync(old)) fs.unlinkSync(old);
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { avatar: req.file.filename } },
            { new: true },
        ).lean();

        user.avatarUrl = `/storage/${user.avatar}`;
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/users/:id/questions ─────────────────────────────────────────────
users.get('/:id/questions', requireAuth, async (req, res) => {
    try {
        const questions = await Question.find({ author: req.params.id })
            .populate('author', 'username avatar')
            .sort({ createdAt: -1 })
            .lean();
        res.json({ questions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/users/:id ────────────────────────────────────────────────────────
users.get('/:id', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).lean();
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
        if (user.avatar) user.avatarUrl = `/storage/${user.avatar}`;
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default users;
