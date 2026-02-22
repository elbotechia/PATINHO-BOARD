import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        username: {
            type:      String,
            required:  [true, 'O nome de usuário é obrigatório.'],
            unique:    true,
            trim:      true,
            minlength: [3, 'O nome de usuário deve ter pelo menos 3 caracteres.'],
            maxlength: [30, 'O nome de usuário não pode ter mais de 30 caracteres.'],
        },
        email: {
            type:     String,
            required: [true, 'O e-mail é obrigatório.'],
            unique:   true,
            trim:     true,
            lowercase: true,
            match:    [/^\S+@\S+\.\S+$/, 'Formato de e-mail inválido.'],
        },
        password: {
            type:      String,
            required:  [true, 'A senha é obrigatória.'],
            minlength: [6, 'A senha deve ter pelo menos 6 caracteres.'],
            select:    false,   // nunca retorna a senha em queries normais
        },
        role: {
            type:    String,
            enum:    ['user', 'admin'],
            default: 'user',
        },
        avatar: {
            type:    String,
            default: null,   // nome do arquivo salvo em /storage
        },
        bio: {
            type:    String,
            default: '',
            maxlength: [300, 'A bio não pode ter mais de 300 caracteres.'],
        },
    },
    { timestamps: true },
);

// ── Hash da senha antes de salvar ─────────────────────────────────────────────
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const cost  = parseInt(process.env.BCRYPT_COST, 10) || 12;
    this.password = await bcrypt.hash(this.password, cost);
    next();
});

// ── Método de instância: compara senha em texto plano com o hash ───────────────
userSchema.methods.comparePassword = async function (plain) {
    return bcrypt.compare(plain, this.password);
};

// ── Remove a senha do JSON retornado ao cliente ────────────────────────────────
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
