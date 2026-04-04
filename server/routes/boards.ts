import { Router, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { notifyBoardCollaborators } from './notifications.js';

const router = Router();

// Permission middleware
const checkPermission = (required: 'owner' | 'editor' | 'viewer') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const boardId = req.body.boardId || req.query.boardId || req.params.id;
    console.log(`[Middleware] Route: ${req.method} ${req.originalUrl}, resolved boardId: ${boardId}, userId: ${req.userId}`);
    if (!boardId) return next(); 

    db.get(
      'SELECT permission FROM collaborators WHERE board_id = ? AND user_id = ?',
      [boardId, req.userId],
      (err, collaborator: any) => {
        if (err) {
          console.error('[Middleware] Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }
        
        console.log('[Middleware] Found collaborator record:', collaborator);
        
        if (!collaborator) {
          return res.status(403).json({ message: 'Access denied: No record in collaborators table' });
        }
        
        const levels = { owner: 3, editor: 2, viewer: 1 };
        const userLevel = levels[collaborator.permission as keyof typeof levels] || 0;
        const requiredLevel = levels[required];
        
        if (userLevel < requiredLevel) {
          return res.status(403).json({ message: `Insufficient permission: have ${collaborator.permission}, need ${required}` });
        }
        next();
      }
    );
  };
};

// Get all boards for user
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.userId;
  db.all(
    `SELECT b.*, c.permission, u.username as owner_username, u.avatar_seed as owner_avatar_seed 
     FROM boards b 
     JOIN collaborators c ON b.id = c.board_id 
     LEFT JOIN users u ON b.owner_id = u.id
     WHERE c.user_id = ?`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.json(rows);
    }
  );
});

// Create board
router.post('/', authenticateToken, (req: AuthRequest, res) => {
  const { name } = req.body;
  const userId = req.userId;
  const boardId = uuidv4();

  db.serialize(() => {
    db.run(
      'INSERT INTO boards (id, name, owner_id) VALUES (?, ?, ?)',
      [boardId, name, userId]
    );

    db.run(
      'INSERT INTO collaborators (board_id, user_id, permission) VALUES (?, ?, ?)',
      [boardId, userId, 'owner'],
      (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.status(201).json({ id: boardId, name, owner_id: userId });
      }
    );
  });
});

// Update Board (Rename)
router.put('/:id', authenticateToken, checkPermission('owner'), (req: AuthRequest, res) => {
  const { name } = req.body;
  db.run('UPDATE boards SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [name, req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    notifyBoardCollaborators(req.params.id, req.userId!, 'board_updated', '看板已更新', `成员修改了看板名称为 ${name}`);
    res.json({ message: 'Board updated' });
  });
});

// Delete Board
router.delete('/:id', authenticateToken, checkPermission('owner'), (req: AuthRequest, res) => {
  const boardId = req.params.id;
  db.serialize(() => {
    db.run('DELETE FROM tasks WHERE column_id IN (SELECT id FROM columns WHERE board_id = ?)', [boardId]);
    db.run('DELETE FROM columns WHERE board_id = ?', [boardId]);
    db.run('DELETE FROM collaborators WHERE board_id = ?', [boardId]);
    db.run('DELETE FROM boards WHERE id = ?', [boardId], (err) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.json({ message: 'Board deleted' });
    });
  });
});

// Get full board details
router.get('/:id', authenticateToken, checkPermission('viewer'), (req: AuthRequest, res) => {
  const boardId = req.params.id;
  db.get(
    'SELECT b.name, c.permission FROM boards b JOIN collaborators c ON b.id = c.board_id WHERE b.id = ? AND c.user_id = ?',
    [boardId, req.userId],
    (err, boardInfo: any) => {
      if (err || !boardInfo) {
        return res.status(500).json({ message: 'Database error or board not found' });
      }

      db.all('SELECT * FROM columns WHERE board_id = ? ORDER BY position', [boardId], (err, columns: any[]) => {
        if (err) return res.status(500).json({ message: 'Database error' });

        db.all(
          `SELECT t.id, t.column_id as columnId, t.content, t.description, t.priority, t.due_date as dueDate, t.tags, t.position 
           FROM tasks t 
           JOIN columns c ON t.column_id = c.id 
           WHERE c.board_id = ? ORDER BY t.position`,
          [boardId],
          (err, tasks: any[]) => {
            if (err) return res.status(500).json({ message: 'Database error' });

            const result = columns.map(col => ({
              ...col,
              tasks: tasks.filter(task => task.columnId === col.id).map(t => ({
                ...t,
                tags: t.tags ? JSON.parse(t.tags) : []
              }))
            }));
            res.json({ 
              id: boardId, 
              name: boardInfo.name,
              columns: result, 
              permission: boardInfo.permission 
            });
          }
        );
      });
    }
  );
});

// Collaborators
router.get('/:id/collaborators', authenticateToken, checkPermission('viewer'), (req, res) => {
  db.all(
    `SELECT u.id, u.username, u.email, u.avatar_seed, c.permission FROM users u 
     JOIN collaborators c ON u.id = c.user_id 
     WHERE c.board_id = ?`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.json(rows);
    }
  );
});

router.post('/:id/collaborators', authenticateToken, checkPermission('owner'), (req, res) => {
  const { email, permission } = req.body;
  db.get('SELECT id FROM users WHERE email = ?', [email], (err, user: any) => {
    if (!user) return res.status(404).json({ message: 'User not found' });
    db.run(
      'INSERT OR REPLACE INTO collaborators (board_id, user_id, permission) VALUES (?, ?, ?)',
      [req.params.id, user.id, permission || 'editor'],
      (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: 'Collaborator added' });
      }
    );
  });
});

router.delete('/:id/collaborators/:userId', authenticateToken, checkPermission('owner'), (req, res) => {
  db.run('DELETE FROM collaborators WHERE board_id = ? AND user_id = ?', [req.params.id, req.params.userId], (err) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json({ message: 'Collaborator removed' });
  });
});

// Columns & Tasks (with simple permission check via boardId in body/query)
router.post('/:id/columns', authenticateToken, checkPermission('editor'), (req: AuthRequest, res) => {
  const { title, position } = req.body;
  const colId = uuidv4();
  db.run('INSERT INTO columns (id, board_id, title, position) VALUES (?, ?, ?, ?)', [colId, req.params.id, title, position], (err) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    notifyBoardCollaborators(req.params.id, req.userId!, 'board_updated', '看板已更新', `成员添加了新列：${title}`);
    res.status(201).json({ id: colId, board_id: req.params.id, title, position });
  });
});

router.put('/columns/:id/position', authenticateToken, checkPermission('editor'), (req: AuthRequest, res) => {
  const { position, boardId } = req.body;
  const columnId = req.params.id;

  db.serialize(() => {
    // Get current position
    db.get('SELECT position FROM columns WHERE id = ?', [columnId], (err, row: any) => {
      if (err || !row) return res.status(500).json({ message: 'Column not found' });
      const oldPos = row.position;
      
      if (oldPos < position) {
        db.run('UPDATE columns SET position = position - 1 WHERE board_id = ? AND position > ? AND position <= ?', [boardId, oldPos, position]);
      } else if (oldPos > position) {
        db.run('UPDATE columns SET position = position + 1 WHERE board_id = ? AND position >= ? AND position < ?', [boardId, position, oldPos]);
      }
      
      db.run('UPDATE columns SET position = ? WHERE id = ?', [position, columnId], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: 'Position updated' });
      });
    });
  });
});

router.put('/columns/:id', authenticateToken, checkPermission('editor'), (req: AuthRequest, res) => {
  const { title } = req.body;
  db.get('SELECT board_id FROM columns WHERE id = ?', [req.params.id], (err, row: any) => {
    db.run('UPDATE columns SET title = ? WHERE id = ?', [title, req.params.id], (err) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (row) {
        notifyBoardCollaborators(row.board_id, req.userId!, 'board_updated', '看板已更新', `成员重命名了列为：${title}`);
      }
      res.json({ message: 'Column updated' });
    });
  });
});

router.delete('/columns/:id', authenticateToken, checkPermission('editor'), (req: AuthRequest, res) => {
  db.serialize(() => {
    // Get board id first
    db.get('SELECT board_id, title FROM columns WHERE id = ?', [req.params.id], (err, row: any) => {
      if (err || !row) return res.status(500).json({ message: 'Column not found' });
      db.run('DELETE FROM tasks WHERE column_id = ?', [req.params.id]);
      db.run('DELETE FROM columns WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        notifyBoardCollaborators(row.board_id, req.userId!, 'board_updated', '看板已更新', `成员删除了列：${row.title}`);
        res.json({ message: 'Column deleted' });
      });
    });
  });
});

// For tasks, we need to know the boardId. The frontend should send it or we find it.
// Let's assume the frontend adds boardId to these requests.
router.post('/tasks', authenticateToken, checkPermission('editor'), (req: AuthRequest, res) => {
  const { columnId, content, description, priority, dueDate, tags, position } = req.body;
  const taskId = uuidv4();
  db.run(
    'INSERT INTO tasks (id, column_id, content, description, priority, due_date, tags, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [taskId, columnId, content, description, priority || 'medium', dueDate, JSON.stringify(tags || []), position || 0],
    (err) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      db.get('SELECT board_id FROM columns WHERE id = ?', [columnId], (err, row: any) => {
        if (row) {
          notifyBoardCollaborators(row.board_id, req.userId!, 'task_created', '任务已创建', `成员创建了新任务`);
        }
      });
      res.status(201).json({ id: taskId, columnId, content, description, priority, dueDate, tags });
    }
  );
});

router.put('/tasks/:id', authenticateToken, checkPermission('editor'), (req: AuthRequest, res) => {
  const fields = req.body;
  const taskId = req.params.id;
  const { boardId, columnId, position } = fields;

  if (position !== undefined && columnId !== undefined) {
    db.serialize(() => {
      // Get current task info
      db.get('SELECT column_id, position FROM tasks WHERE id = ?', [taskId], (err, row: any) => {
        if (err || !row) return res.status(500).json({ message: 'Task not found' });
        
        const oldColId = row.column_id;
        const oldPos = row.position;

        const finalizeTaskUpdate = () => {
          // Update the task itself
          const updateFields = { ...fields };
          delete updateFields.boardId;
          
          let query = 'UPDATE tasks SET ';
          const params: any[] = [];
          const keys = Object.keys(updateFields);
          keys.forEach((key, index) => {
            let val = updateFields[key];
            if (key === 'tags') val = JSON.stringify(val);
            const dbKey = key === 'columnId' ? 'column_id' : key === 'dueDate' ? 'due_date' : key;
            query += `${dbKey} = ?`;
            params.push(val);
            if (index < keys.length - 1) query += ', ';
          });
          query += ' WHERE id = ?';
          params.push(taskId);

          db.run(query, params, (err) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            res.json({ message: 'Task updated' });
          });
        };

        if (oldColId === columnId) {
          db.all('SELECT id FROM tasks WHERE column_id = ? ORDER BY position', [columnId], (err, tasks: any[]) => {
            if (tasks) {
              let ids = tasks.map(t => t.id).filter(id => id !== taskId);
              ids.splice(position, 0, taskId);
              ids.forEach((id, idx) => {
                db.run('UPDATE tasks SET position = ? WHERE id = ?', [idx, id]);
              });
            }
            finalizeTaskUpdate();
          });
        } else {
          db.all('SELECT id FROM tasks WHERE column_id = ? ORDER BY position', [oldColId], (err, oldTasks: any[]) => {
            if (oldTasks) {
              let ids = oldTasks.map(t => t.id).filter(id => id !== taskId);
              ids.forEach((id, idx) => {
                db.run('UPDATE tasks SET position = ? WHERE id = ?', [idx, id]);
              });
            }
            db.all('SELECT id FROM tasks WHERE column_id = ? ORDER BY position', [columnId], (err, newTasks: any[]) => {
              if (newTasks) {
                let ids = newTasks.map(t => t.id).filter(id => id !== taskId);
                ids.splice(position, 0, taskId);
                ids.forEach((id, idx) => {
                  db.run('UPDATE tasks SET position = ? WHERE id = ?', [idx, id]);
                });
              }
              finalizeTaskUpdate();
            });
          });
        }
      });
    });
  } else {
    // Normal update without position change
    let query = 'UPDATE tasks SET ';
    const params: any[] = [];
    const keys = Object.keys(fields).filter(k => k !== 'boardId');
    keys.forEach((key, index) => {
      let val = fields[key];
      if (key === 'tags') val = JSON.stringify(val);
      const dbKey = key === 'columnId' ? 'column_id' : key === 'dueDate' ? 'due_date' : key;
      query += `${dbKey} = ?`;
      params.push(val);
      if (index < keys.length - 1) query += ', ';
    });
    query += ' WHERE id = ?';
    params.push(taskId);
    db.run(query, params, (err) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.json({ message: 'Updated' });
    });
  }
});

router.delete('/tasks/:id', authenticateToken, checkPermission('editor'), (req: AuthRequest, res) => {
  db.get('SELECT c.board_id FROM tasks t JOIN columns c ON t.column_id = c.id WHERE t.id = ?', [req.params.id], (err, row: any) => {
    db.run('DELETE FROM tasks WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (row) {
        notifyBoardCollaborators(row.board_id, req.userId!, 'task_updated', '任务已更新', `成员删除了任务`);
      }
      res.json({ message: 'Deleted' });
    });
  });
});

export default router;
