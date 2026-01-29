import Database from 'better-sqlite3';
import { join } from 'path';

export type NadeRecord = {
  id: number;
  title: string;
  map: string;
  side: string;
  startPosition: string;
  targetPosition: string;
  nadeType: string;
  description: string;
  tags: string;
  localVideoPath: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NadeInput = Omit<NadeRecord, 'id' | 'createdAt' | 'updatedAt'>;

export type NadeFilters = {
  map?: string;
  side?: string;
  startPosition?: string;
  nadeType?: string;
  search?: string;
  sort?: 'new' | 'map' | 'title';
};

let db: Database.Database | null = null;

export function initDb(userDataPath: string) {
  if (db) {
    return db;
  }
  const dbPath = join(userDataPath, 'nades.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS maps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS nades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      map TEXT NOT NULL,
      side TEXT NOT NULL,
      startPosition TEXT NOT NULL,
      targetPosition TEXT NOT NULL,
      nadeType TEXT NOT NULL,
      description TEXT NOT NULL,
      tags TEXT NOT NULL,
      localVideoPath TEXT,
      videoUrl TEXT,
      thumbnailUrl TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  seedMaps();
  seedNades();

  return db;
}

function seedMaps() {
  if (!db) return;
  const count = db.prepare('SELECT COUNT(*) as count FROM maps').get() as { count: number };
  if (count.count > 0) return;
  const maps = ['Mirage', 'Inferno', 'Dust2', 'Ancient', 'Nuke', 'Anubis', 'Vertigo', 'Overpass'];
  const stmt = db.prepare('INSERT INTO maps (name) VALUES (?)');
  const insertMany = db.transaction((items: string[]) => {
    for (const name of items) {
      stmt.run(name);
    }
  });
  insertMany(maps);
}

function seedNades() {
  if (!db) return;
  const count = db.prepare('SELECT COUNT(*) as count FROM nades').get() as { count: number };
  if (count.count > 0) return;
  const now = new Date().toISOString();
  const demo: NadeInput[] = [
    {
      title: 'Window Smoke from Top Mid',
      map: 'Mirage',
      side: 'T',
      startPosition: 'Top Mid',
      targetPosition: 'Window',
      nadeType: 'smoke',
      description: 'Line up with antenna, jump-throw.',
      tags: 'mid,window,execute',
      localVideoPath: null,
      videoUrl: 'https://www.youtube.com/watch?v=example',
      thumbnailUrl: null
    },
    {
      title: 'CT Smoke from Banana',
      map: 'Inferno',
      side: 'T',
      startPosition: 'Banana',
      targetPosition: 'CT',
      nadeType: 'smoke',
      description: 'Aim at roof edge, normal throw.',
      tags: 'b,ct,smoke',
      localVideoPath: null,
      videoUrl: 'https://www.youtube.com/watch?v=example2',
      thumbnailUrl: null
    },
    {
      title: 'A Site Pop Flash',
      map: 'Dust2',
      side: 'T',
      startPosition: 'Long Corner',
      targetPosition: 'A Site',
      nadeType: 'flash',
      description: 'Bounce off wall for quick pop.',
      tags: 'a,flash,entry',
      localVideoPath: null,
      videoUrl: 'https://www.twitch.tv/example',
      thumbnailUrl: null
    }
  ];
  const stmt = db.prepare(`
    INSERT INTO nades (
      title,
      map,
      side,
      startPosition,
      targetPosition,
      nadeType,
      description,
      tags,
      localVideoPath,
      videoUrl,
      thumbnailUrl,
      createdAt,
      updatedAt
    ) VALUES (
      @title,
      @map,
      @side,
      @startPosition,
      @targetPosition,
      @nadeType,
      @description,
      @tags,
      @localVideoPath,
      @videoUrl,
      @thumbnailUrl,
      @createdAt,
      @updatedAt
    )
  `);
  const insertMany = db.transaction((items: NadeInput[]) => {
    for (const item of items) {
      stmt.run({ ...item, createdAt: now, updatedAt: now });
    }
  });
  insertMany(demo);
}

export function listMaps() {
  if (!db) throw new Error('Database not initialized');
  return db.prepare('SELECT name FROM maps ORDER BY name').all() as { name: string }[];
}

export function addMap(name: string) {
  if (!db) throw new Error('Database not initialized');
  db.prepare('INSERT INTO maps (name) VALUES (?)').run(name);
}

export function listNades(filters: NadeFilters) {
  if (!db) throw new Error('Database not initialized');
  const clauses: string[] = [];
  const params: Record<string, string> = {};

  if (filters.map) {
    clauses.push('map = @map');
    params.map = filters.map;
  }
  if (filters.side) {
    clauses.push('side = @side');
    params.side = filters.side;
  }
  if (filters.startPosition) {
    clauses.push('startPosition = @startPosition');
    params.startPosition = filters.startPosition;
  }
  if (filters.nadeType) {
    clauses.push('nadeType = @nadeType');
    params.nadeType = filters.nadeType;
  }
  if (filters.search) {
    clauses.push('(title LIKE @search OR tags LIKE @search OR description LIKE @search)');
    params.search = `%${filters.search}%`;
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sort = filters.sort === 'map'
    ? 'ORDER BY map, title'
    : filters.sort === 'title'
      ? 'ORDER BY title'
      : 'ORDER BY datetime(createdAt) DESC';

  const stmt = db.prepare(`SELECT * FROM nades ${where} ${sort}`);
  return stmt.all(params) as NadeRecord[];
}

export function getNade(id: number) {
  if (!db) throw new Error('Database not initialized');
  return db.prepare('SELECT * FROM nades WHERE id = ?').get(id) as NadeRecord | undefined;
}

export function createNade(input: NadeInput) {
  if (!db) throw new Error('Database not initialized');
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO nades (
      title,
      map,
      side,
      startPosition,
      targetPosition,
      nadeType,
      description,
      tags,
      localVideoPath,
      videoUrl,
      thumbnailUrl,
      createdAt,
      updatedAt
    ) VALUES (
      @title,
      @map,
      @side,
      @startPosition,
      @targetPosition,
      @nadeType,
      @description,
      @tags,
      @localVideoPath,
      @videoUrl,
      @thumbnailUrl,
      @createdAt,
      @updatedAt
    )
  `);
  const info = stmt.run({ ...input, createdAt: now, updatedAt: now });
  return info.lastInsertRowid as number;
}

export function updateNade(id: number, input: NadeInput) {
  if (!db) throw new Error('Database not initialized');
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE nades SET
      title = @title,
      map = @map,
      side = @side,
      startPosition = @startPosition,
      targetPosition = @targetPosition,
      nadeType = @nadeType,
      description = @description,
      tags = @tags,
      localVideoPath = @localVideoPath,
      videoUrl = @videoUrl,
      thumbnailUrl = @thumbnailUrl,
      updatedAt = @updatedAt
    WHERE id = @id
  `);
  stmt.run({ ...input, updatedAt: now, id });
}

export function deleteNade(id: number) {
  if (!db) throw new Error('Database not initialized');
  db.prepare('DELETE FROM nades WHERE id = ?').run(id);
}

export function exportJson() {
  if (!db) throw new Error('Database not initialized');
  const maps = listMaps().map((row) => row.name);
  const nades = db.prepare('SELECT * FROM nades').all() as NadeRecord[];
  return { maps, nades };
}

export function importJson(payload: { maps: string[]; nades: NadeRecord[] }) {
  if (!db) throw new Error('Database not initialized');
  const insertMap = db.prepare('INSERT OR IGNORE INTO maps (name) VALUES (?)');
  const insertNade = db.prepare(`
    INSERT INTO nades (
      id,
      title,
      map,
      side,
      startPosition,
      targetPosition,
      nadeType,
      description,
      tags,
      localVideoPath,
      videoUrl,
      thumbnailUrl,
      createdAt,
      updatedAt
    ) VALUES (
      @id,
      @title,
      @map,
      @side,
      @startPosition,
      @targetPosition,
      @nadeType,
      @description,
      @tags,
      @localVideoPath,
      @videoUrl,
      @thumbnailUrl,
      @createdAt,
      @updatedAt
    )
  `);

  const tx = db.transaction(() => {
    for (const map of payload.maps) {
      insertMap.run(map);
    }
    for (const nade of payload.nades) {
      insertNade.run(nade);
    }
  });
  tx();
}
