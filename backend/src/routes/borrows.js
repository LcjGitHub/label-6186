import { Router } from 'express';
import db from '../db.js';

const router = Router();

function mapBorrow(row) {
  return {
    id: row.id,
    folder_id: row.folder_id,
    folder_code: row.folder_code,
    folder_theme: row.folder_theme,
    borrower: row.borrower,
    borrow_date: row.borrow_date,
    expected_return_date: row.expected_return_date,
    actual_return_date: row.actual_return_date,
    created_at: row.created_at,
  };
}

function enrichBorrowRow(row) {
  const folder = db
    .prepare('SELECT code, theme FROM folders WHERE id = ?')
    .get(row.folder_id);
  return mapBorrow({
    ...row,
    folder_code: folder?.code ?? '',
    folder_theme: folder?.theme ?? '',
  });
}

router.get('/active', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT br.*, f.code AS folder_code, f.theme AS folder_theme
       FROM borrow_records br
       JOIN folders f ON f.id = br.folder_id
       WHERE br.actual_return_date IS NULL
       ORDER BY br.borrow_date DESC`
    )
    .all();
  res.json(rows.map(mapBorrow));
});

router.get('/folder/:folderId', (req, res) => {
  const folderId = Number(req.params.folderId);
  const folder = db
    .prepare('SELECT id FROM folders WHERE id = ?')
    .get(folderId);
  if (!folder) {
    return res.status(404).json({ error: '片夹不存在' });
  }
  const rows = db
    .prepare(
      `SELECT br.*, f.code AS folder_code, f.theme AS folder_theme
       FROM borrow_records br
       JOIN folders f ON f.id = br.folder_id
       WHERE br.folder_id = ?
       ORDER BY br.borrow_date DESC`
    )
    .all(folderId);
  res.json(rows.map(mapBorrow));
});

router.post('/', (req, res) => {
  const { folder_id, borrower, borrow_date, expected_return_date } = req.body;

  if (!folder_id || !borrower || !borrow_date || !expected_return_date) {
    return res.status(400).json({ error: '请填写片夹、借阅人、借出日期和预计归还日期' });
  }

  const folder = db
    .prepare('SELECT id FROM folders WHERE id = ?')
    .get(Number(folder_id));
  if (!folder) {
    return res.status(404).json({ error: '片夹不存在' });
  }

  const activeBorrow = db
    .prepare(
      'SELECT id FROM borrow_records WHERE folder_id = ? AND actual_return_date IS NULL'
    )
    .get(Number(folder_id));
  if (activeBorrow) {
    return res.status(409).json({ error: '该片夹已有未归还的借阅记录' });
  }

  if (new Date(expected_return_date) < new Date(borrow_date)) {
    return res.status(400).json({ error: '预计归还日期不能早于借出日期' });
  }

  const result = db
    .prepare(
      'INSERT INTO borrow_records (folder_id, borrower, borrow_date, expected_return_date) VALUES (?, ?, ?, ?)'
    )
    .run(Number(folder_id), borrower, borrow_date, expected_return_date);

  const row = db
    .prepare('SELECT * FROM borrow_records WHERE id = ?')
    .get(result.lastInsertRowid);

  res.status(201).json(enrichBorrowRow(row));
});

router.put('/:id/return', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM borrow_records WHERE id = ?')
    .get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: '借阅记录不存在' });
  }

  if (existing.actual_return_date) {
    return res.status(409).json({ error: '该借阅已归还' });
  }

  const returnDate = req.body.actual_return_date || new Date().toISOString().slice(0, 10);

  if (new Date(returnDate) < new Date(existing.borrow_date)) {
    return res.status(400).json({ error: '实际归还日期不能早于借出日期' });
  }

  db.prepare(
    'UPDATE borrow_records SET actual_return_date = ? WHERE id = ?'
  ).run(returnDate, req.params.id);

  const row = db
    .prepare('SELECT * FROM borrow_records WHERE id = ?')
    .get(req.params.id);

  res.json(enrichBorrowRow(row));
});

export default router;
