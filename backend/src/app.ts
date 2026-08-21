import express  from 'express';
import routes from './routes/index.js'
import globalErrorHandler from './middlewares/globalErrorHandling.js';
const app = express();
app.use(express.json());

app.use('/api/v1',routes)
app.use(globalErrorHandler);

export default app