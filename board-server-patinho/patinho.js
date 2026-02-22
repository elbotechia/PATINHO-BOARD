import 'dotenv/config';
import { createServer } from './apps/routes/app.js';

const patinho = {
    on: {
        async board() {
            await createServer();
        },
    },
};

export default patinho;
