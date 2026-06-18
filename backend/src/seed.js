import db from './db.js';

/**
 * 写入 MVP 种子数据（3 个片夹及若干单张描述）
 */
export function seedDatabase() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM folders').get().count;
  if (count > 0) {
    return;
  }

  const insertFolder = db.prepare(`
    INSERT INTO folders (code, theme, era, storage_location)
    VALUES (@code, @theme, @era, @storage_location)
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
    for (const folder of seed) {
      const result = insertFolder.run({
        code: folder.code,
        theme: folder.theme,
        era: folder.era,
        storage_location: folder.storage_location,
      });
      for (const slide of folder.slides) {
        insertSlide.run({
          folder_id: result.lastInsertRowid,
          sequence: slide.sequence,
          description: slide.description,
        });
      }
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  console.log('Seed data inserted: 3 folders');
}
