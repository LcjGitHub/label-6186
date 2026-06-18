import { Router } from 'express';
import db, { getSlideCount } from '../db.js';

const router = Router();

function getCategory(categoryId) {
  if (!categoryId) return null;
  const row = db
    .prepare('SELECT id, name, color FROM categories WHERE id = ?')
    .get(categoryId);
  return row || null;
}

function mapFolder(row) {
  return {
    id: row.id,
    code: row.code,
    theme: row.theme,
    era: row.era,
    storage_location: row.storage_location,
    category_id: row.category_id || null,
    category: getCategory(row.category_id),
    slide_count: getSlideCount(row.id),
    created_at: row.created_at,
  };
}

function mapSlideWithFolder(slideRow, folderRow) {
  return {
    id: slideRow.id,
    folder_id: slideRow.folder_id,
    sequence: slideRow.sequence,
    description: slideRow.description,
    created_at: slideRow.created_at,
    folder: {
      id: folderRow.id,
      code: folderRow.code,
      theme: folderRow.theme,
    },
  };
}

router.get('/', (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return res.status(400).json({ error: '请输入搜索关键词' });
  }

  const keyword = `%${q.trim()}%`;

  const folderRows = db
    .prepare(
      `SELECT * FROM folders 
       WHERE theme LIKE ? OR code LIKE ? 
       ORDER BY code ASC`
    )
    .all(keyword, keyword);

  const slideRows = db
    .prepare(
      `SELECT s.*, f.code as folder_code, f.theme as folder_theme 
       FROM slides s
       INNER JOIN folders f ON s.folder_id = f.id
       WHERE s.description LIKE ?
       ORDER BY s.folder_id ASC, s.sequence ASC`
    )
    .all(keyword);

  const folderIdsFromSlides = [...new Set(slideRows.map((s) => s.folder_id))];
  const folderMap = {};
  for (const fid of folderIdsFromSlides) {
    const frow = db.prepare('SELECT * FROM folders WHERE id = ?').get(fid);
    if (frow) {
      folderMap[fid] = frow;
    }
  }

  const matchedFolders = folderRows.map(mapFolder);

  const matchedSlides = slideRows.map((srow) => {
    const frow = folderMap[srow.folder_id];
    return {
      id: srow.id,
      folder_id: srow.folder_id,
      sequence: srow.sequence,
      description: srow.description,
      created_at: srow.created_at,
      folder: frow
        ? {
            id: frow.id,
            code: frow.code,
            theme: frow.theme,
          }
        : null,
    };
  });

  res.json({
    folders: matchedFolders,
    slides: matchedSlides,
    total: matchedFolders.length + matchedSlides.length,
  });
});

export default router;
