import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
    {
        question: {
            type:     mongoose.Schema.Types.ObjectId,
            ref:      'Question',
            required: [true, 'A pergunta de referência é obrigatória.'],
        },
        content: {
            type:     String,
            required: [true, 'O conteúdo da resposta é obrigatório.'],
        },
        code_snippet: {
            type:    String,
            default: '',
        },
        author: {
            type:     mongoose.Schema.Types.ObjectId,
            ref:      'User',
            required: [true, 'O autor é obrigatório.'],
        },
        is_accepted: {
            type:    Boolean,
            default: false,
        },
        votes: {
            type:    Number,
            default: 0,
        },
    },
    { timestamps: true },
);

const Answer = mongoose.model('Answer', answerSchema);
export default Answer;
