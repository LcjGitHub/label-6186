import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const totalFolders = db
    .prepare('SELECT COUNT(*) AS count FROM folders')
    .get().count;

  const totalSlides = db
    .prepare('SELECT COUNT(*) AS count FROM slides')
    .get().count;

  const eraDistribution = db
    .prepare(
      'SELECT era, COUNT(*) AS count FROM folders GROUP BY era ORDER BY count DESC'
    )
    .all()
    .map((row) => ({ era: row.era, count: row.count }));

  res.json({
    total_folders: totalFolders,
    total_slides: totalSlides,
    era_distribution: eraDistribution,
  });
});

export default router;
