import express, { Response } from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// SSE Clients
interface Client {
  userId: string;
  res: Response;
}
let clients: Client[] = [];

// Get user notifications
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  db.all(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching notifications:', err);
        return res.status(500).json({ message: 'Error fetching notifications' });
      }
      res.json(rows);
    }
  );
});

// SSE Stream endpoint for real-time notifications
router.get('/stream', authenticateToken, (req: AuthRequest, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  clients.push({ userId, res });

  // Keep alive connection
  const interval = setInterval(() => {
    res.write(':\n\n'); 
  }, 15000);

  req.on('close', () => {
    clearInterval(interval);
    clients = clients.filter(c => c.res !== res);
  });
});

// Mark notification as read
router.put('/:id/read', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const notificationId = req.params.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  db.run(
    'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?',
    [notificationId, userId],
    function (err) {
      if (err) {
        console.error('Error updating notification:', err);
        return res.status(500).json({ message: 'Error updating notification' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      res.json({ message: 'Notification marked as read' });
    }
  );
});

// Mark all as read
router.put('/read-all', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  db.run(
    'UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0',
    [userId],
    function (err) {
      if (err) {
        console.error('Error updating notifications:', err);
        return res.status(500).json({ message: 'Error updating notifications' });
      }
      res.json({ message: 'All notifications marked as read', modified: this.changes });
    }
  );
});

// Delete notification
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const notificationId = req.params.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  db.run(
    'DELETE FROM notifications WHERE id = ? AND user_id = ?',
    [notificationId, userId],
    function (err) {
      if (err) {
        console.error('Error deleting notification:', err);
        return res.status(500).json({ message: 'Error deleting notification' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      res.json({ message: 'Notification deleted' });
    }
  );
});

// Delete all notifications
router.delete('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  db.run(
    'DELETE FROM notifications WHERE user_id = ?',
    [userId],
    function (err) {
      if (err) {
        console.error('Error deleting all notifications:', err);
        return res.status(500).json({ message: 'Error deleting all notifications' });
      }
      res.json({ message: 'All notifications deleted', deleted: this.changes });
    }
  );
});

// Helper for other API routes to create a notification directly in the DB and push via SSE
export const createNotification = (userId: string, type: string, title: string, content: string) => {
  return new Promise<void>((resolve, reject) => {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    db.run(
      'INSERT INTO notifications (id, user_id, type, title, content, read) VALUES (?, ?, ?, ?, ?, 0)',
      [id, userId, type, title, content],
      (err) => {
        if (err) {
          reject(err);
        } else {
          // Push notification directly to correct online clients
          clients.filter(c => c.userId === userId).forEach(c => {
            const data = JSON.stringify({ id, type, title, content, read: 0, created_at: createdAt });
            c.res.write(`data: ${data}\n\n`);
          });
          resolve();
        }
      }
    );
  });
};

export const notifyBoardCollaborators = (boardId: string, authorId: string, type: string, title: string, content: string) => {
  db.all('SELECT user_id FROM collaborators WHERE board_id = ? AND user_id != ?', [boardId, authorId], (err, rows: any[]) => {
    if (err || !rows) return;
    rows.forEach(row => {
      createNotification(row.user_id, type, title, content).catch(console.error);
    });
  });
};

export default router;
