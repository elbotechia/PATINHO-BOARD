import express    from 'express';
import cors       from 'cors';
import morgan     from 'morgan';
import path       from 'path';
import { fileURLToPath } from 'url';

import { Server }      from '../models/Server.js';
import { connectMongo } from '../mongo.js';
import authRoutes      from './auth.js';
import usersRoutes     from './users.js';
import quack           from '../../../board-module-patinho/quack.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createServer() {
    const { PORT, PUBLIC_DIR, MODULE_DIR, SERVER_DIR } = process.env;

    // ── Conecta ao MongoDB ────────────────────────────────────────────────────
    await connectMongo();

    // ── Express app ────────────────────────────────────────────────────────
    const app = express();

    app.use(cors());
    app.use(morgan('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Arquivos estáticos do client
    const publicPath  = path.resolve(process.cwd(), PUBLIC_DIR || './board-client-patinho/public/');
    const storagePath = path.resolve(process.cwd(), './storage');
    app.use(express.static(publicPath));
    app.use('/storage', express.static(storagePath));

    // Autenticação
    app.use('/api/auth', authRoutes);

    // Usuários / perfil / avatar
    app.use('/api/users', usersRoutes);

    // API principal
    app.use('/api', quack);

    // Rota raiz → home
    app.get('/', (_req, res) => res.sendFile(path.join(publicPath, 'home.html')));

    // Fallback → index.html (dashboard)
    app.get('*', (_req, res) => {
        res.sendFile(path.join(publicPath, 'index.html'));
    });

    // ── Iniciar servidor ───────────────────────────────────────────────────
    const server = new Server(PORT || 3030, PUBLIC_DIR, MODULE_DIR, SERVER_DIR);
    server.start(app);

    return server;
}

