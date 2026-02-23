import mongoose from 'mongoose';

/**
 * Conecta ao MongoDB usando a URI definida em MONGO_URI no .env
 * A conexão é feita uma única vez e reutilizada em toda a aplicação.
 */
export async function connectMongo() {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        throw new Error('❌  MONGO_URI não está definida no arquivo .env');
    }

    await mongoose.connect(uri);
    console.log('🍃 MongoDB conectado com sucesso!');
}

export default mongoose;
