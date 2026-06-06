const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');
const router = express.Router();

// Get all songs with sunday date (public)
router.get('/', (req, res) => {
  const songs = db.prepare('SELECT * FROM songs ORDER BY position ASC, id ASC').all();
  const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('sunday_date');
  res.json({ songs, sundayDate: setting?.value || null });
});

// Get single song (public)
router.get('/:id', (req, res) => {
  const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(req.params.id);
  if (!song) return res.status(404).json({ error: 'Song not found' });
  res.json(song);
});

// Reorder songs — must be before /:id routes
router.put('/reorder/bulk', requireAuth, (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array of ids' });
  const update = db.prepare('UPDATE songs SET position = ? WHERE id = ?');
  const updateAll = db.transaction((ids) => {
    ids.forEach((id, index) => update.run(index, id));
  });
  updateAll(order);
  res.json({ success: true });
});

// Update sunday date (admin)
router.put('/settings/sunday-date', requireAuth, (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'date is required' });
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('sunday_date', date);
  res.json({ success: true });
});

// Create song (admin)
router.post('/', requireAuth, (req, res) => {
  const { title, artist, lyrics, chords, tag } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

  const maxPos = db.prepare('SELECT MAX(position) as max FROM songs').get();
  const position = (maxPos?.max ?? -1) + 1;

  const result = db.prepare(
    'INSERT INTO songs (title, artist, lyrics, chords, tag, position) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(title.trim(), artist?.trim() || '', lyrics || '', chords || '', tag || null, position);

  res.status(201).json(db.prepare('SELECT * FROM songs WHERE id = ?').get(result.lastInsertRowid));
});

// Update song (admin)
router.put('/:id', requireAuth, (req, res) => {
  const { title, artist, lyrics, chords, tag } = req.body;
  const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(req.params.id);
  if (!song) return res.status(404).json({ error: 'Song not found' });

  db.prepare('UPDATE songs SET title = ?, artist = ?, lyrics = ?, chords = ?, tag = ? WHERE id = ?').run(
    title?.trim() ?? song.title,
    artist?.trim() ?? song.artist,
    lyrics ?? song.lyrics,
    chords ?? song.chords,
    tag !== undefined ? (tag || null) : song.tag,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM songs WHERE id = ?').get(req.params.id));
});

// Delete song (admin)
router.delete('/:id', requireAuth, (req, res) => {
  const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(req.params.id);
  if (!song) return res.status(404).json({ error: 'Song not found' });
  db.prepare('DELETE FROM songs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
