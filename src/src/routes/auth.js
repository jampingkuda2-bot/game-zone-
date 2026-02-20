import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database.js';

const router = Router();
const SECRET = process.env.JWT_SECRET || 'gamezone_secret_2024';

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username dan password wajib diisi' });
  if (username.length < 3) return res.status(400).json({ error: 'Username minimal 3 karakter' });
  if (password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const avatar = Math.floor(Math.random() * 8) + 1;
    const stmt = db.prepare('INSERT INTO users (username, password, avatar) VALUES (?, ?, ?)');
    const result = stmt.run(username, hashed, avatar);
    const token = jwt.sign({ id: result.lastInsertRowid, username }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: result.lastInsertRowid, username, avatar, wins: 0, losses: 0, draws: 0 } });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Username sudah dipakai' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(400).json({ error: 'Username tidak ditemukan' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Password salah' });
  const token = jwt.sign({ id: user.id, username }, SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username, avatar: user.avatar, wins: user.wins, losses: user.losses, draws: user.draws } });
});

router.get('/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, SECRET);
    const user = db.prepare('SELECT id, username, avatar, wins, losses, draws FROM users WHERE id = ?').get(decoded.id);
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Token invalid' });
  }
});

export default router;
