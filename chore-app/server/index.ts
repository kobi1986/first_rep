import express from 'express';
import cors from 'cors';
import path from 'path';
import membersRouter from './routes/members';
import choresRouter from './routes/chores';
import occurrencesRouter from './routes/occurrences';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/members', membersRouter);
app.use('/api/chores', choresRouter);
app.use('/api/occurrences', occurrencesRouter);

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
