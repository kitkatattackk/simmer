import 'dotenv/config';
import express from 'express';
import recipesRouter from './routes/recipes';

const app = express();
const PORT = 3001;

app.use(express.json());
app.use('/api/recipes', recipesRouter);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
