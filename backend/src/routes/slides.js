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

/** DELETE /api/slides/:id - 删除单张 */
router.delete('/:id', (req, res) => {
  const result = db
    .prepare('DELETE FROM slides WHERE id = ?')
    .run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: '单张不存在' });
  }

  res.status(204).send();
});

export default router;
