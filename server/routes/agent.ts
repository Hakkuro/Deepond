import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticateApiKey, AgentRequest } from '../middleware/apikey.js';

const router = Router();

// 所有路由统一使用 API Key 认证
router.use(authenticateApiKey);

// ──────── 辅助 ────────

const ok = (res: Response, data?: unknown) => res.json({ ok: true, data });
const fail = (res: Response, status: number, error: string) => res.status(status).json({ ok: false, error });

/** 包装 db.all / db.get / db.run 为 Promise */
const dbAll = <T = any>(sql: string, params: any[] = []): Promise<T[]> =>
  new Promise((resolve, reject) => db.all(sql, params, (err, rows: any) => err ? reject(err) : resolve(rows)));

const dbGet = <T = any>(sql: string, params: any[] = []): Promise<T | undefined> =>
  new Promise((resolve, reject) => db.get(sql, params, (err, row: any) => err ? reject(err) : resolve(row)));

const dbRun = (sql: string, params: any[] = []): Promise<{ changes: number }> =>
  new Promise((resolve, reject) => db.run(sql, params, function (err) { err ? reject(err) : resolve({ changes: this.changes }); }));

// ──────── 看板 CRUD ────────

router.get('/boards', async (req: AgentRequest, res) => {
  try {
    const userId = req.agentUserId!;
    const boards = await dbAll(
      `SELECT b.*, c.permission FROM boards b JOIN collaborators c ON b.id = c.board_id WHERE c.user_id = ?`,
      [userId]
    );
    ok(res, boards);
  } catch (e: any) { fail(res, 500, e.message); }
});

router.get('/boards/:id', async (req: AgentRequest, res) => {
  try {
    const boardId = req.params.id;
    const board = await dbGet('SELECT * FROM boards WHERE id = ?', [boardId]);
    if (!board) return fail(res, 404, 'Board not found');

    const columns = await dbAll('SELECT * FROM columns WHERE board_id = ? ORDER BY position', [boardId]);
    const tasks = await dbAll(
      `SELECT t.id, t.column_id as columnId, t.content, t.description, t.priority,
              t.due_date as dueDate, t.tags, t.position
       FROM tasks t JOIN columns c ON t.column_id = c.id WHERE c.board_id = ? ORDER BY t.position`,
      [boardId]
    );

    const result = {
      ...board,
      columns: columns.map((col: any) => ({
        ...col,
        tasks: tasks
          .filter((t: any) => t.columnId === col.id)
          .map((t: any) => ({ ...t, tags: t.tags ? JSON.parse(t.tags) : [] })),
      })),
    };
    ok(res, result);
  } catch (e: any) { fail(res, 500, e.message); }
});

router.post('/boards', async (req: AgentRequest, res) => {
  try {
    const { name } = req.body;
    const userId = req.agentUserId!;
    if (!name) return fail(res, 400, 'name is required');

    const boardId = uuidv4();
    await dbRun('INSERT INTO boards (id, name, owner_id) VALUES (?, ?, ?)', [boardId, name, userId]);
    await dbRun('INSERT INTO collaborators (board_id, user_id, permission) VALUES (?, ?, ?)', [boardId, userId, 'owner']);
    ok(res, { id: boardId, name, owner_id: userId });
  } catch (e: any) { fail(res, 500, e.message); }
});

router.put('/boards/:id', async (req: AgentRequest, res) => {
  try {
    const { name } = req.body;
    if (!name) return fail(res, 400, 'name is required');
    await dbRun('UPDATE boards SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [name, req.params.id]);
    ok(res, { id: req.params.id, name });
  } catch (e: any) { fail(res, 500, e.message); }
});

router.delete('/boards/:id', async (req: AgentRequest, res) => {
  try {
    const boardId = req.params.id;
    await dbRun('DELETE FROM tasks WHERE column_id IN (SELECT id FROM columns WHERE board_id = ?)', [boardId]);
    await dbRun('DELETE FROM columns WHERE board_id = ?', [boardId]);
    await dbRun('DELETE FROM collaborators WHERE board_id = ?', [boardId]);
    await dbRun('DELETE FROM boards WHERE id = ?', [boardId]);
    ok(res, { deleted: boardId });
  } catch (e: any) { fail(res, 500, e.message); }
});

// ──────── 列 CRUD ────────

router.post('/boards/:id/columns', async (req: AgentRequest, res) => {
  try {
    const { title, position } = req.body;
    if (!title) return fail(res, 400, 'title is required');
    const colId = uuidv4();
    const pos = position ?? 0;
    await dbRun('INSERT INTO columns (id, board_id, title, position) VALUES (?, ?, ?, ?)', [colId, req.params.id, title, pos]);
    ok(res, { id: colId, board_id: req.params.id, title, position: pos });
  } catch (e: any) { fail(res, 500, e.message); }
});

router.put('/columns/:id', async (req: AgentRequest, res) => {
  try {
    const { title } = req.body;
    if (!title) return fail(res, 400, 'title is required');
    await dbRun('UPDATE columns SET title = ? WHERE id = ?', [title, req.params.id]);
    ok(res, { id: req.params.id, title });
  } catch (e: any) { fail(res, 500, e.message); }
});

router.delete('/columns/:id', async (req: AgentRequest, res) => {
  try {
    await dbRun('DELETE FROM tasks WHERE column_id = ?', [req.params.id]);
    await dbRun('DELETE FROM columns WHERE id = ?', [req.params.id]);
    ok(res, { deleted: req.params.id });
  } catch (e: any) { fail(res, 500, e.message); }
});

// ──────── 任务 CRUD ────────

router.post('/tasks', async (req: AgentRequest, res) => {
  try {
    const { columnId, content, description, priority, dueDate, tags, position } = req.body;
    if (!columnId || !content) return fail(res, 400, 'columnId and content are required');
    const taskId = uuidv4();
    await dbRun(
      'INSERT INTO tasks (id, column_id, content, description, priority, due_date, tags, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [taskId, columnId, content, description ?? '', priority ?? 'medium', dueDate ?? null, JSON.stringify(tags ?? []), position ?? 0]
    );
    ok(res, { id: taskId, columnId, content });
  } catch (e: any) { fail(res, 500, e.message); }
});

router.put('/tasks/:id', async (req: AgentRequest, res) => {
  try {
    const fields = req.body;
    const taskId = req.params.id;
    const mapping: Record<string, string> = { columnId: 'column_id', dueDate: 'due_date' };
    const setClauses: string[] = [];
    const params: any[] = [];

    for (const [key, val] of Object.entries(fields)) {
      if (key === 'boardId') continue;
      const dbCol = mapping[key] ?? key;
      setClauses.push(`${dbCol} = ?`);
      params.push(key === 'tags' ? JSON.stringify(val) : val);
    }

    if (!setClauses.length) return fail(res, 400, 'No fields to update');
    params.push(taskId);
    await dbRun(`UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`, params);
    ok(res, { id: taskId, updated: Object.keys(fields) });
  } catch (e: any) { fail(res, 500, e.message); }
});

router.delete('/tasks/:id', async (req: AgentRequest, res) => {
  try {
    await dbRun('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    ok(res, { deleted: req.params.id });
  } catch (e: any) { fail(res, 500, e.message); }
});

// ──────── 协作者 ────────

router.get('/boards/:id/collaborators', async (req: AgentRequest, res) => {
  try {
    const rows = await dbAll(
      `SELECT u.id, u.username, u.email, c.permission FROM users u
       JOIN collaborators c ON u.id = c.user_id WHERE c.board_id = ?`,
      [req.params.id]
    );
    ok(res, rows);
  } catch (e: any) { fail(res, 500, e.message); }
});

router.post('/boards/:id/collaborators', async (req: AgentRequest, res) => {
  try {
    const { email, permission } = req.body;
    if (!email) return fail(res, 400, 'email is required');
    const user: any = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (!user) return fail(res, 404, 'User not found');
    await dbRun(
      'INSERT OR REPLACE INTO collaborators (board_id, user_id, permission) VALUES (?, ?, ?)',
      [req.params.id, user.id, permission ?? 'editor']
    );
    ok(res, { added: email, permission: permission ?? 'editor' });
  } catch (e: any) { fail(res, 500, e.message); }
});

router.delete('/boards/:id/collaborators/:userId', async (req: AgentRequest, res) => {
  try {
    await dbRun('DELETE FROM collaborators WHERE board_id = ? AND user_id = ?', [req.params.id, req.params.userId]);
    ok(res, { removed: req.params.userId });
  } catch (e: any) { fail(res, 500, e.message); }
});

// ──────── 导入 / 导出 ────────

router.get('/boards/:id/export', async (req: AgentRequest, res) => {
  try {
    const boardId = req.params.id;
    const board = await dbGet('SELECT * FROM boards WHERE id = ?', [boardId]);
    if (!board) return fail(res, 404, 'Board not found');
    const columns = await dbAll('SELECT * FROM columns WHERE board_id = ? ORDER BY position', [boardId]);
    const tasks = await dbAll(
      'SELECT t.* FROM tasks t JOIN columns c ON t.column_id = c.id WHERE c.board_id = ?', [boardId]
    );
    ok(res, {
      ...board,
      columns: columns.map((c: any) => ({
        ...c,
        tasks: tasks.filter((t: any) => t.column_id === c.id).map((t: any) => ({ ...t, tags: JSON.parse(t.tags || '[]') })),
      })),
    });
  } catch (e: any) { fail(res, 500, e.message); }
});

router.post('/boards/:id/import', async (req: AgentRequest, res) => {
  try {
    const boardId = req.params.id;
    const { columns } = req.body;
    if (!Array.isArray(columns)) return fail(res, 400, 'columns array is required');

    await dbRun('DELETE FROM tasks WHERE column_id IN (SELECT id FROM columns WHERE board_id = ?)', [boardId]);
    await dbRun('DELETE FROM columns WHERE board_id = ?', [boardId]);

    for (const col of columns) {
      const colId = col.id ?? uuidv4();
      await dbRun('INSERT INTO columns (id, board_id, title, position) VALUES (?, ?, ?, ?)', [colId, boardId, col.title, col.position]);
      for (const task of (col.tasks ?? [])) {
        const taskId = task.id ?? uuidv4();
        await dbRun(
          'INSERT INTO tasks (id, column_id, content, description, priority, due_date, tags, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [taskId, colId, task.content, task.description, task.priority, task.due_date, JSON.stringify(task.tags ?? []), task.position]
        );
      }
    }
    ok(res, { imported: boardId });
  } catch (e: any) { fail(res, 500, e.message); }
});

// ──────── 用户查询（辅助） ────────

router.get('/users', async (req: AgentRequest, res) => {
  try {
    const { email, username } = req.query;
    if (email) {
      const user = await dbGet('SELECT id, username, email FROM users WHERE email = ?', [email]);
      return user ? ok(res, user) : fail(res, 404, 'User not found');
    }
    if (username) {
      const user = await dbGet('SELECT id, username, email FROM users WHERE username = ?', [username]);
      return user ? ok(res, user) : fail(res, 404, 'User not found');
    }
    const users = await dbAll('SELECT id, username, email FROM users');
    ok(res, users);
  } catch (e: any) { fail(res, 500, e.message); }
});

export default router;
