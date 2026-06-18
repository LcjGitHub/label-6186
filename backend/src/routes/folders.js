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

function getActiveBorrow(folderId) {
  const row = db
    .prepare(
      'SELECT id, borrower, borrow_date, expected_return_date FROM borrow_records WHERE folder_id = ? AND actual_return_date IS NULL'
    )
    .get(folderId);
  return row || null;
}

/**
 * 将片夹行映射为 API 响应（含张数和分类）
 * @param {object} row
 * @param {boolean} includeRemarks 是否包含备注（列表接口不返回，详情接口返回）
 * @param {number} [precomputedSlideCount] 预计算的张数，避免重复查询
 * @returns {object}
 */
function mapFolder(row, includeRemarks = false, precomputedSlideCount = undefined) {
  const base = {
    id: row.id,
    code: row.code,
    theme: row.theme,
    era: row.era,
    storage_location: row.storage_location,
    category_id: row.category_id || null,
    category: getCategory(row.category_id),
    slide_count: precomputedSlideCount !== undefined ? precomputedSlideCount : getSlideCount(row.id),
    active_borrow: getActiveBorrow(row.id),
    created_at: row.created_at,
  };
  if (includeRemarks) {
    base.remarks = row.remarks || null;
  }
  return base;
}

/** GET /api/folders - 片夹列表（支持 keyword 按主题模糊搜索，支持排序） */
router.get('/', (req, res) => {
  const { keyword, sort_by, sort_order } = req.query;

  const allowedSortBy = ['code', 'slide_count'];
  const sortBy = allowedSortBy.includes(sort_by) ? sort_by : 'code';
  const sortOrder = sort_order === 'desc' ? 'DESC' : 'ASC';

  let orderClause;
  if (sortBy === 'slide_count') {
    orderClause = `slide_count ${sortOrder}, f.code ASC`;
  } else {
    orderClause = `f.code ${sortOrder}`;
  }

  const baseSql = `
    SELECT f.*, COALESCE(s.count, 0) AS slide_count
    FROM folders f
    LEFT JOIN (
      SELECT folder_id, COUNT(*) AS count
      FROM slides
      GROUP BY folder_id
    ) s ON f.id = s.folder_id
  `;

  let rows;
  if (keyword && keyword.trim()) {
    rows = db
      .prepare(`${baseSql} WHERE f.theme LIKE ? ORDER BY ${orderClause}`)
      .all(`%${keyword.trim()}%`);
  } else {
    rows = db
      .prepare(`${baseSql} ORDER BY ${orderClause}`)
      .all();
  }

  res.json(rows.map((row) => mapFolder(row, false, row.slide_count)));
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

  res.json({ ...mapFolder(row, true), slides });
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
  const { code, theme, era, storage_location, category_id, remarks } = req.body;

  if (!code || !theme || !era || !storage_location) {
    return res.status(400).json({ error: '请填写编号、主题、年代、存储位置' });
  }

  const catId = category_id || null;
  const remarksValue = remarks || null;

  const catError = validateCategory(catId);
  if (catError) {
    return res.status(catError.status).json({ error: catError.error });
  }

  try {
    const result = db
      .prepare(
        'INSERT INTO folders (code, theme, era, storage_location, remarks, category_id) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(code, theme, era, storage_location, remarksValue, catId);

    const row = db
      .prepare('SELECT * FROM folders WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json(mapFolder(row, true));
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

  const { code, theme, era, storage_location, category_id, remarks } = req.body;

  if (!code || !theme || !era || !storage_location) {
    return res.status(400).json({ error: '请填写编号、主题、年代、存储位置' });
  }

  const catId = category_id === undefined ? existing.category_id : (category_id || null);
  const remarksValue = remarks === undefined ? existing.remarks : (remarks || null);

  const catError = validateCategory(catId);
  if (catError) {
    return res.status(catError.status).json({ error: catError.error });
  }

  try {
    db.prepare(
      'UPDATE folders SET code = ?, theme = ?, era = ?, storage_location = ?, remarks = ?, category_id = ? WHERE id = ?'
    ).run(code, theme, era, storage_location, remarksValue, catId, req.params.id);

    const row = db
      .prepare('SELECT * FROM folders WHERE id = ?')
      .get(req.params.id);

    res.json(mapFolder(row, true));
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
