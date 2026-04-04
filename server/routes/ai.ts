import { Router } from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Export all boards for a user
router.get('/export/:userId', (req, res) => {
  const userId = req.params.userId;

  db.all('SELECT b.* FROM boards b JOIN collaborators c ON b.id = c.board_id WHERE c.user_id = ? AND c.permission = "owner"', [userId], (err, boards: any[]) => {
    if (err) return res.status(500).json({ error: err.message });

    const exportData: any = { userId, boards: [] };

    // This is a bit complex for a single query, so we'll do it sequentially for each board
    const fetchBoardData = async (board: any) => {
      return new Promise((resolve) => {
        db.all('SELECT * FROM columns WHERE board_id = ? ORDER BY position', [board.id], (err, columns: any[]) => {
          db.all('SELECT t.* FROM tasks t JOIN columns col ON t.column_id = col.id WHERE col.board_id = ?', [board.id], (err, tasks: any[]) => {
            resolve({
              ...board,
              columns: columns.map(c => ({
                ...c,
                tasks: tasks.filter(t => t.column_id === c.id).map(t => ({ ...t, tags: JSON.parse(t.tags || '[]') }))
              }))
            });
          });
        });
      });
    };

    Promise.all(boards.map(fetchBoardData)).then(fullBoards => {
      res.json({ ...exportData, boards: fullBoards });
    });
  });
});

// Export a single board
router.get('/export/board/:boardId', (req, res) => {
  const boardId = req.params.boardId;

  db.get('SELECT * FROM boards WHERE id = ?', [boardId], (err, board: any) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!board) return res.status(404).json({ error: 'Board not found' });

    db.all('SELECT * FROM columns WHERE board_id = ? ORDER BY position', [boardId], (err, columns: any[]) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all('SELECT t.* FROM tasks t JOIN columns col ON t.column_id = col.id WHERE col.board_id = ?', [boardId], (err, tasks: any[]) => {
        if (err) return res.status(500).json({ error: err.message });

        const fullBoard = {
          ...board,
          columns: columns.map(c => ({
            ...c,
            tasks: tasks.filter(t => t.column_id === c.id).map(t => ({ ...t, tags: JSON.parse(t.tags || '[]') }))
          }))
        };

        res.json({ boards: [fullBoard] });
      });
    });
  });
});

// Import boards for a user
router.post('/import/:userId', (req, res) => {
  const userId = req.params.userId;
  const { boards } = req.body;

  if (!Array.isArray(boards)) return res.status(400).json({ error: 'Invalid data' });

  db.serialize(() => {
    boards.forEach(board => {
      const boardId = board.id || uuidv4();
      db.run('INSERT OR REPLACE INTO boards (id, name, owner_id) VALUES (?, ?, ?)', [boardId, board.name, userId]);
      db.run('INSERT OR REPLACE INTO collaborators (board_id, user_id, permission) VALUES (?, ?, ?)', [boardId, userId, 'owner']);

      if (board.columns) {
        board.columns.forEach((col: any) => {
          const colId = col.id || uuidv4();
          db.run('INSERT OR REPLACE INTO columns (id, board_id, title, position) VALUES (?, ?, ?, ?)', [colId, boardId, col.title, col.position]);

          if (col.tasks) {
            col.tasks.forEach((task: any) => {
              const taskId = task.id || uuidv4();
              db.run(
                'INSERT OR REPLACE INTO tasks (id, column_id, content, description, priority, due_date, tags, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [taskId, colId, task.content, task.description, task.priority, task.due_date, JSON.stringify(task.tags || []), task.position]
              );
            });
          }
        });
      }
    });

    res.json({ message: 'Import successful' });
  });
});

// Override a specific board with imported data
router.post('/import/board/:boardId', (req, res) => {
  const boardId = req.params.boardId;
  let boardData: any = null;

  // Flexibility: handle different wrapping structures
  if (req.body.boards && Array.isArray(req.body.boards) && req.body.boards.length > 0) {
    boardData = req.body.boards[0];
  } else if (Array.isArray(req.body) && req.body.length > 0) {
    boardData = req.body[0];
  } else if (req.body.name || req.body.columns) {
    boardData = req.body;
  }

  console.log('Overriding board:', boardId);
  
  if (!boardData) {
    console.error('Invalid import data structure:', JSON.stringify(req.body).substring(0, 100));
    return res.status(400).json({ error: 'Invalid data format' });
  }

  console.log('Valid board data found for:', boardData.name || 'Unnamed');

  db.serialize(() => {
    // 1. Clear existing data linked to this board
    db.run('DELETE FROM tasks WHERE column_id IN (SELECT id FROM columns WHERE board_id = ?)', [boardId]);
    db.run('DELETE FROM columns WHERE board_id = ?', [boardId]);

    console.log('Queued deletions for board:', boardId);

    // 2. Queue all new insertions
    if (boardData.columns) {
      boardData.columns.forEach((col: any) => {
        const colId = col.id || uuidv4();
        db.run('INSERT INTO columns (id, board_id, title, position) VALUES (?, ?, ?, ?)', [colId, boardId, col.title, col.position]);

        if (col.tasks) {
          col.tasks.forEach((task: any) => {
            const taskId = task.id || uuidv4();
            db.run(
              'INSERT INTO tasks (id, column_id, content, description, priority, due_date, tags, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [taskId, colId, task.content, task.description, task.priority, task.due_date, JSON.stringify(task.tags || []), task.position]
            );
          });
        }
      });
    }
    
    // 3. Final synchronization point
    db.get('SELECT 1', (err) => {
      if (err) {
        console.error('Error during import operations:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('Board override complete successfully');
      res.json({ message: 'Board override successful' });
    });
  });
});

export default router;
