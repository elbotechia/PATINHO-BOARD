import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath    = path.resolve(__dirname, '../../data/patinho.db');

const db = knex({
    client: 'sqlite3',
    connection: { filename: dbPath },
    useNullAsDefault: true,
});

// ─── Migrations ────────────────────────────────────────────────────────────────

export async function runMigrations() {
    const hasQuestions = await db.schema.hasTable('questions');
    if (!hasQuestions) {
        await db.schema.createTable('questions', t => {
            t.increments('id').primary();
            t.string('title',     255).notNullable();
            t.text('description').notNullable();
            t.text('code_snippet').defaultTo('');
            t.string('language',  60).defaultTo('javascript');
            t.string('tags',     255).defaultTo('');
            t.string('author',   100).notNullable();
            t.integer('views').defaultTo(0);
            t.timestamps(true, true);
        });
        console.log('✅  Tabela questions criada.');
    }

    const hasAnswers = await db.schema.hasTable('answers');
    if (!hasAnswers) {
        await db.schema.createTable('answers', t => {
            t.increments('id').primary();
            t.integer('question_id').notNullable().references('id').inTable('questions').onDelete('CASCADE');
            t.text('content').notNullable();
            t.text('code_snippet').defaultTo('');
            t.string('author', 100).notNullable();
            t.boolean('is_accepted').defaultTo(false);
            t.integer('votes').defaultTo(0);
            t.timestamps(true, true);
        });
        console.log('✅  Tabela answers criada.');
    }
}

export default db;
