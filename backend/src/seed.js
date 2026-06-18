import db from './db.js';

/**
 * 写入 MVP 种子数据（示例分类、3 个片夹及若干单张描述）
 */
export function seedDatabase() {
  const folderCount = db.prepare('SELECT COUNT(*) AS count FROM folders').get().count;
  if (folderCount > 0) {
    return;
  }

  const insertCategory = db.prepare(`
    INSERT INTO categories (name, color)
    VALUES (@name, @color)
  `);

  const categories = [
    { name: '城市纪实', color: '#3b82f6' },
    { name: '旅行风景', color: '#22c55e' },
    { name: '人物生活', color: '#f97316' },
  ];

  const categoryIds = {};
  for (const cat of categories) {
    const result = insertCategory.run(cat);
    categoryIds[cat.name] = result.lastInsertRowid;
  }

  const insertFolder = db.prepare(`
    INSERT INTO folders (code, theme, era, storage_location, category_id)
    VALUES (@code, @theme, @era, @storage_location, @category_id)
  `);

  const insertSlide = db.prepare(`
    INSERT INTO slides (folder_id, sequence, description)
    VALUES (@folder_id, @sequence, @description)
  `);

  const seed = [
    {
      code: 'SF-001',
      theme: '八十年代城市风貌',
      era: '1980年代',
      storage_location: 'A柜-第2层-左3',
      category_id: categoryIds['城市纪实'],
      slides: [
        { sequence: 1, description: '上海外滩夜景，黄浦江两岸灯火' },
        { sequence: 2, description: '南京路步行街人流与霓虹招牌' },
        { sequence: 3, description: '老式有轨电车驶过街口' },
      ],
    },
    {
      code: 'SF-002',
      theme: '家庭旅行纪念',
      era: '1995年',
      storage_location: 'B柜-第1层-中2',
      category_id: categoryIds['旅行风景'],
      slides: [
        { sequence: 1, description: '黄山迎客松前全家合影' },
        { sequence: 2, description: '山顶云海与日出' },
      ],
    },
    {
      code: 'SF-003',
      theme: '校园青春纪实',
      era: '2001年',
      storage_location: 'C柜-第3层-右1',
      category_id: categoryIds['人物生活'],
      slides: [
        { sequence: 1, description: '毕业典礼上抛掷学士帽' },
        { sequence: 2, description: '图书馆台阶上的班级合影' },
        { sequence: 3, description: '操场上的接力赛冲刺瞬间' },
        { sequence: 4, description: '宿舍楼下梧桐叶落的秋景' },
      ],
    },
  ];

  db.exec('BEGIN');
  try {
    const folderIds = {};
    for (const folder of seed) {
      const result = insertFolder.run({
        code: folder.code,
        theme: folder.theme,
        era: folder.era,
        storage_location: folder.storage_location,
        category_id: folder.category_id,
      });
      folderIds[folder.code] = result.lastInsertRowid;
      for (const slide of folder.slides) {
        insertSlide.run({
          folder_id: result.lastInsertRowid,
          sequence: slide.sequence,
          description: slide.description,
        });
      }
    }

    const insertBorrow = db.prepare(`
      INSERT INTO borrow_records (folder_id, borrower, borrow_date, expected_return_date, actual_return_date)
      VALUES (@folder_id, @borrower, @borrow_date, @expected_return_date, @actual_return_date)
    `);

    insertBorrow.run({
      folder_id: folderIds['SF-001'],
      borrower: '张老师',
      borrow_date: '2025-05-10',
      expected_return_date: '2025-06-10',
      actual_return_date: '2025-06-08',
    });

    insertBorrow.run({
      folder_id: folderIds['SF-002'],
      borrower: '李同学',
      borrow_date: new Date().toISOString().slice(0, 10),
      expected_return_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      actual_return_date: null,
    });

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  console.log('Seed data inserted: 3 categories, 3 folders, 2 borrow records');
}
