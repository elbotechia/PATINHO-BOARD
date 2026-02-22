import { Animal } from '../../../board-module-patinho/QUACK-QUACK/Animal.js';

export class Server extends Animal {
    constructor(port, publicDir, moduleDir, serverDir) {
        super();
        this.port      = port;
        this.publicDir = publicDir;
        this.moduleDir = moduleDir;
        this.serverDir = serverDir;
        this.instance  = null;      // http.Server retornado por app.listen()
    }

    /** Inicia o servidor e armazena a instância. */
    start(app) {
        this.instance = app.listen(this.port, () => {
            console.log(`\n🦆 PATINHO-BOARD rodando em http://localhost:${this.port}\n`);
        });
        return this.instance;
    }

    /** Encerra o servidor graciosamente. */
    stop() {
        return new Promise((resolve, reject) => {
            if (!this.instance) return resolve();
            this.instance.close(err => (err ? reject(err) : resolve()));
        });
    }
}
