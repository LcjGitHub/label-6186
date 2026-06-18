import { Router } from 'express';
import db from '../db.js';

const router = Router();

/** POST /api/folders/:folderId/slides - 在片夹下新增单张 */
router.post('/:folderId/slides', (req, res) => {
  const folderId = Number(req.params.folderId);
  const folder = db.prepare('SELECT id FROM folders WHERE id = ?').get(folderId);

  if (!folder) {
    return res.status(404).json({ error: '片夹不存在' });
  }

  const { sequence, description } = req.body;

  if (sequence == null || !description) {
    return res.status(400).json({ error: '请填写序号与描述' });
  }

  try {
    const result = db
      .prepare(
        'INSERT INTO slides (folder_id, sequence, description) VALUES (?, ?, ?)'
      )
      .run(folderId, Number(sequence), description);

    const row = db
      .prepare('SELECT * FROM slides WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json(row);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: '该序号已存在' });
    }
    throw err;
  }
});

/** PUT /api/slides/:id - 更新单张 */
router.put('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM slides WHERE id = ?')
    .get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: '单张不存在' });
  }

  const { sequence, description } = req.body;

  if (sequence == null || !description) {
    return res.status(400).json({ error: '请填写序号与描述' });
  }

  try {
    db.prepare('UPDATE slides SET sequence = ?, description = ? WHERE id = ?').run(
      Number(sequence),
      description,
      req.params.id
    );

    const row = db
      .prepare('SELECT * FROM slides WHERE id = ?')
      .get(req.params.id);

    res.json(row);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: '该序号已存在' });
    }
    throw err;
  }
});

/**
 * 将片夹下所有单张按当前 sequence 排序后，重新从 1 开始连续编号
 * @param {number} folderId
 */
function renumberFolderSlides(folderId) {
  const slides = db
    .prepare(
      'SELECT id FROM slides WHERE folder_id = ? ORDER BY sequence ASC, id ASC'
    )
    .all(folderId);

  if (slides.length <= 1) return;

  try {
    db.exec('BEGIN');
    const updateStmt = db.prepare('UPDATE slides SET sequence = ? WHERE id = ?');
    slides.forEach((slide, index) => {
      updateStmt.run(index + 1, slide.id);
    });
    db.exec('COMMIT');
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch (_e) {
      // ignore
    }
    throw err;
  }
}

/** DELETE /api/slides/:id - 删除单张（删除后对该片夹剩余单张重新从1连续编号） */
router.delete('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM slides WHERE id = ?')
    .get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: '单张不存在' });
  }

  const folderId = existing.folder_id;

  const result = db
    .prepare('DELETE FROM slides WHERE id = ?')
    .run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: '单张不存在' });
  }

  renumberFolderSlides(folderId);

  res.status(204).send();
});

/**
 * PATCH /api/slides/:id/move - 调整单张序号（上移/下移）
 * body: { direction: 'up' | 'down' }
 * 按排序列表中的位置找相邻项，而非固定序号±1
 */
router.patch('/:id/move', (req, res) => {
  const slideId = Number(req.params.id);
  const { direction } = req.body;

  if (direction !== 'up' && direction !== 'down') {
    return res.status(400).json({ error: 'direction 参数必须是 up 或 down' });
  }

  const current = db
    .prepare('SELECT * FROM slides WHERE id = ?')
    .get(slideId);

  if (!current) {
    return res.status(404).json({ error: '单张不存在' });
  }

  const { folder_id } = current;

  const allSlides = db
    .prepare(
      'SELECT id, sequence FROM slides WHERE folder_id = ? ORDER BY sequence ASC, id ASC'
    )
    .all(folder_id);

  const currentIndex = allSlides.findIndex((s) => s.id === slideId);

  if (direction === 'up' && currentIndex <= 0) {
    return res.status(400).json({ error: '已经是第一张，无法上移' });
  }
  if (direction === 'down' && currentIndex >= allSlides.length - 1) {
    return res.status(400).json({ error: '已经是最后一张，无法下移' });
  }

  const neighborIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  const neighbor = allSlides[neighborIndex];
  const currentSequence = current.sequence;
  const neighborSequence = neighbor.sequence;

  try {
    db.exec('BEGIN');

    const tempSequence = -1;

    db.prepare('UPDATE slides SET sequence = ? WHERE id = ?').run(
      tempSequence,
      neighbor.id
    );

    db.prepare('UPDATE slides SET sequence = ? WHERE id = ?').run(
      neighborSequence,
      current.id
    );

    db.prepare('UPDATE slides SET sequence = ? WHERE id = ?').run(
      currentSequence,
      neighbor.id
    );

    db.exec('COMMIT');

    const slides = db
      .prepare(
        'SELECT id, folder_id, sequence, description, created_at FROM slides WHERE folder_id = ? ORDER BY sequence ASC'
      )
      .all(folder_id);

    res.json({ slides });
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch (_e) {
      // rollback failed, ignore
    }
    throw err;
  }
});

export default router;
