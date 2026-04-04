import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

router.post('/register', async (req, res) => {
  const { username, email, password, avatar_seed } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    db.run(
      'INSERT INTO users (id, username, email, password_hash, avatar_seed) VALUES (?, ?, ?, ?, ?)',
      [userId, username, email, hashedPassword, avatar_seed || username],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ message: 'Username or email already exists' });
          }
          return res.status(500).json({ message: 'Database error' });
        }
        res.status(201).json({ message: 'User created', userId });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user: any) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, avatarSeed: user.avatar_seed } });
  });
});

import { authenticateToken, AuthRequest } from '../middleware/auth.js';

router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  const { username, email, avatar_seed } = req.body;
  const userId = req.userId;

  if (!username || !email) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  db.run(
    'UPDATE users SET username = ?, email = ?, avatar_seed = ? WHERE id = ?',
    [username, email, avatar_seed, userId],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ message: 'Username or email already exists' });
        }
        return res.status(500).json({ message: 'Database error' });
      }
      res.json({ 
        message: 'Profile updated', 
        user: { id: userId, username, email, avatarSeed: avatar_seed } 
      });
    }
  );
});

// Get User Statistics
router.get('/profile/stats', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.userId;
  
  db.get('SELECT COUNT(*) as total FROM boards WHERE owner_id = ?', [userId], (err, row1: any) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    
    db.get('SELECT COUNT(*) as total FROM collaborators WHERE user_id = ?', [userId], (err, row2: any) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      
      res.json({
        totalBoards: row1.total || 0,
        collaborations: row2.total || 0
      });
    });
  });
});

// Update Password
router.put('/password', authenticateToken, async (req: AuthRequest, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.userId;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  db.get('SELECT password_hash FROM users WHERE id = ?', [userId], async (err, user: any) => {
    if (err || !user) return res.status(500).json({ message: 'Database error' });

    const isValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValid) return res.status(401).json({ message: 'Invalid old password' });

    const newHash = await bcrypt.hash(newPassword, 10);
    db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId], (err) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.json({ message: 'Password updated successfully' });
    });
  });
});

// Delete Account
router.delete('/account', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.userId;

  db.serialize(() => {
    db.run('DELETE FROM tasks WHERE column_id IN (SELECT id FROM columns WHERE board_id IN (SELECT id FROM boards WHERE owner_id = ?))', [userId]);
    db.run('DELETE FROM columns WHERE board_id IN (SELECT id FROM boards WHERE owner_id = ?)', [userId]);
    db.run('DELETE FROM collaborators WHERE board_id IN (SELECT id FROM boards WHERE owner_id = ?) OR user_id = ?', [userId, userId]);
    db.run('DELETE FROM notifications WHERE user_id = ?', [userId]);
    db.run('DELETE FROM boards WHERE owner_id = ?', [userId]);
    db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.json({ message: 'Account deleted successfully' });
    });
  });
});

export default router;
