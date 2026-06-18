import express from 'express';
import cors from 'cors';
import { initSchema } from './db.js';
import { seedDatabase } from './seed.js';
import foldersRouter from './routes/folders.js';
import slidesRouter from './routes/slides.js';

const PORT = 8000;
const app = express();

initSchema();
seedDatabase();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/folders', foldersRouter);
app.use('/api/folders', slidesRouter);
app.use('/api/slides', slidesRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`Slides API running at http://localhost:${PORT}`);
});
