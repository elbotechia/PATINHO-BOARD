import jwt  from 'jsonwebtoken';
import User from '../models/UserModel.js';

/**
 * Middleware de autenticação JWT.
 * Verifica o header: Authorization: Bearer <token>
 * Em caso de sucesso, popula req.user com o documento do usuário.
 */
export async function requireAuth(req, res, next) {
    try {
        const header = req.headers.authorization || '';
        const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

        if (!token) {
            return res.status(401).json({ error: 'Token de autenticação ausente.' });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user    = await User.findById(payload.id);

        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado.' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
}

/**
 * Middleware opcional: popula req.user apenas se o token for válido.
 * Não bloqueia a requisição caso não haja token.
 */
export async function optionalAuth(req, _res, next) {
    try {
        const header = req.headers.authorization || '';
        const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
        if (!token) return next();

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user      = await User.findById(payload.id);
    } catch {
        // token inválido → ignora silenciosamente
    }
    next();
}
