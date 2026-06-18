import { Router } from 'express';
import db, { getSlideCount } from '../db.js';

const router = Router();

/**
 * 获取分类信息
 * @param {number|null} categoryId
 * @returns {object|null}
 */
function getCategory(categoryId) {
  if (!categoryId) return null;
  const row = db
    .prepare('SELECT id, name, color FROM categories WHERE id = ?')
    .get(categoryId);
  return row || null;
}

/**
 * 将片夹行映射为 API 响应（含张数和分类）
 * @param {object} row
 * @returns {object}
 */
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

/** GET /api/folders - 片夹列表 */
router.get('/', (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM folders ORDER BY code ASC')
    .all();
  res.json(rows.map(mapFolder));
});

/** GET /api/folders/:id - 片夹详情（含单张列表） */
router.get('/:id', (req, res) => {
  const row = db
    .prepare('SELECT * FROM folders WHERE id = ?')
    .get(req.params.id);

  if (!row) {
    return res.status(404).json({ error: '片夹不存在' });
  }

  const slides = db
    .prepare(
      'SELECT id, folder_id, sequence, description, created_at FROM slides WHERE folder_id = ? ORDER BY sequence ASC'
    )
    .all(row.id);

  res.json({ ...mapFolder(row), slides });
});

/**
 * 校验分类ID是否存在
 * @param {number|null} categoryId
 * @returns {object|null} 错误对象或 null
 */
function validateCategory(categoryId) {
  if (!categoryId) return null;
  const exists = db
    .prepare('SELECT 1 FROM categories WHERE id = ?')
    .get(categoryId);
  if (!exists) {
    return { status: 400, error: '所选分类不存在' };
  }
  return null;
}

/** POST /api/folders - 新建片夹 */
router.post('/', (req, res) => {
  const { code, theme, era, storage_location, category_id } = req.body;

  if (!code || !theme || !era || !storage_location) {
    return res.status(400).json({ error: '请填写编号、主题、年代、存储位置' });
  }

  const catId = category_id || null;

  const catError = validateCategory(catId);
  if (catError) {
    return res.status(catError.status).json({ error: catError.error });
  }

  try {
    const result = db
      .prepare(
        'INSERT INTO folders (code, theme, era, storage_location, category_id) VALUES (?, ?, ?, ?, ?)'
      )
      .run(code, theme, era, storage_location, catId);

    const row = db
      .prepare('SELECT * FROM folders WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json(mapFolder(row));
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: '编号已存在' });
    }
    throw err;
  }
});

/** PUT /api/folders/:id - 更新片夹 */
router.put('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM folders WHERE id = ?')
    .get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: '片夹不存在' });
  }

  const { code, theme, era, storage_location, category_id } = req.body;

  if (!code || !theme || !era || !storage_location) {
    return res.status(400).json({ error: '请填写编号、主题、年代、存储位置' });
  }

  const catId = category_id === undefined ? existing.category_id : (category_id || null);

  const catError = validateCategory(catId);
  if (catError) {
    return res.status(catError.status).json({ error: catError.error });
  }

  try {
    db.prepare(
      'UPDATE folders SET code = ?, theme = ?, era = ?, storage_location = ?, category_id = ? WHERE id = ?'
    ).run(code, theme, era, storage_location, catId, req.params.id);

    const row = db
      .prepare('SELECT * FROM folders WHERE id = ?')
      .get(req.params.id);

    res.json(mapFolder(row));
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: '编号已存在' });
    }
    throw err;
  }
});

/** DELETE /api/folders/:id - 删除片夹 */
router.delete('/:id', (req, res) => {
  const result = db
    .prepare('DELETE FROM folders WHERE id = ?')
    .run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: '片夹不存在' });
  }

  res.status(204).send();
});

export default router;
