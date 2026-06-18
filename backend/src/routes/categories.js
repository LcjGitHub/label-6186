import { Router } from 'express';
import db from '../db.js';

const router = Router();

/**
 * 将分类行映射为 API 响应
 * @param {object} row
 * @returns {object}
 */
function mapCategory(row) {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    created_at: row.created_at,
  };
}

/** GET /api/categories - 分类列表 */
router.get('/', (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM categories ORDER BY name ASC')
    .all();
  res.json(rows.map(mapCategory));
});

/** GET /api/categories/:id - 分类详情 */
router.get('/:id', (req, res) => {
  const row = db
    .prepare('SELECT * FROM categories WHERE id = ?')
    .get(req.params.id);

  if (!row) {
    return res.status(404).json({ error: '分类不存在' });
  }

  res.json(mapCategory(row));
});

/** POST /api/categories - 新建分类 */
router.post('/', (req, res) => {
  const { name, color } = req.body;

  if (!name) {
    return res.status(400).json({ error: '请填写分类名称' });
  }

  const categoryColor = color || '#3b82f6';

  try {
    const result = db
      .prepare('INSERT INTO categories (name, color) VALUES (?, ?)')
      .run(name, categoryColor);

    const row = db
      .prepare('SELECT * FROM categories WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json(mapCategory(row));
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: '分类名称已存在' });
    }
    throw err;
  }
});

/** PUT /api/categories/:id - 更新分类 */
router.put('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM categories WHERE id = ?')
    .get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: '分类不存在' });
  }

  const { name, color } = req.body;

  if (!name) {
    return res.status(400).json({ error: '请填写分类名称' });
  }

  const categoryColor = color || existing.color;

  try {
    db.prepare(
      'UPDATE categories SET name = ?, color = ? WHERE id = ?'
    ).run(name, categoryColor, req.params.id);

    const row = db
      .prepare('SELECT * FROM categories WHERE id = ?')
      .get(req.params.id);

    res.json(mapCategory(row));
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: '分类名称已存在' });
    }
    throw err;
  }
});

/** DELETE /api/categories/:id - 删除分类 */
router.delete('/:id', (req, res) => {
  const result = db
    .prepare('DELETE FROM categories WHERE id = ?')
    .run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: '分类不存在' });
  }

  res.status(204).send();
});

export default router;
