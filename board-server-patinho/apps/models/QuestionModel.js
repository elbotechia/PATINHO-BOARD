import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
    {
        title: {
            type:      String,
            required:  [true, 'O título é obrigatório.'],
            trim:      true,
            maxlength: [255, 'O título não pode ter mais de 255 caracteres.'],
        },
        description: {
            type:     String,
            required: [true, 'A descrição é obrigatória.'],
        },
        code_snippet: {
            type:    String,
            default: '',
        },
        language: {
            type:    String,
            default: 'javascript',
            trim:    true,
        },
        tags: {
            type:    [String],
            default: [],
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref:  'User',
            required: [true, 'O autor é obrigatório.'],
        },
        views: {
            type:    Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

// ── Virtual: conta respostas sem duplicar dados ───────────────────────────────
questionSchema.virtual('answers', {
    ref:          'Answer',
    localField:   '_id',
    foreignField: 'question',
});

const Question = mongoose.model('Question', questionSchema);
export default Question;
