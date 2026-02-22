/**
 * Animal — classe base para todas as entidades do PATINHO-BOARD.
 * Inspirada no pato: simples, flutuante e funcional.
 */
export class Animal {
    constructor(data = {}) {
        this.id         = data.id          ?? null;
        this.created_at = data.created_at  ?? new Date().toISOString();
        this.updated_at = data.updated_at  ?? new Date().toISOString();
    }

    /** Retorna representação plana (JSON-safe) do animal. */
    toJSON() {
        return { ...this };
    }

    /** Atualiza o timestamp de modificação. */
    touch() {
        this.updated_at = new Date().toISOString();
        return this;
    }
}
