#!/usr/bin/env node
/**
 * Deepond Kanban CLI — AI Agent 专用命令行工具
 *
 * 支持两种调用方式:
 *   1. CLI flags:  npx tsx cli/kanban-cli.ts <resource> <action> --key value
 *   2. JSON stdin: echo '{"resource":"boards","action":"create","name":"Sprint"}' | npx tsx cli/kanban-cli.ts
 *
 * 环境变量:
 *   KANBAN_API_KEY  — 必需，个人 API Key
 *   KANBAN_API_URL  — 可选，默认 http://localhost:4000
 */

// ──────── 配置 ────────

const API_URL = process.env.KANBAN_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000';
const API_KEY = process.env.KANBAN_API_KEY ?? '';

// ──────── 类型 ────────

interface ApiResult { ok: boolean; data?: unknown; error?: string }
type Params = Record<string, unknown>;

// ──────── HTTP ────────

const request = async (method: string, path: string, body?: unknown): Promise<ApiResult> => {
  const res = await fetch(`${API_URL}/api/agent${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json() as Promise<ApiResult>;
};

// ──────── 输出 ────────

const out = (result: ApiResult): never => {
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.ok ? 0 : 1);
};

// ──────── stdin 读取 ────────

const readStdin = (): Promise<string> => new Promise((resolve) => {
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { buf += chunk; });
  process.stdin.on('end', () => resolve(buf.trim()));

  // 无管道输入时 50ms 超时，回退到 CLI flags 模式
  if (process.stdin.isTTY) resolve('');
  else setTimeout(() => { if (!buf) resolve(''); }, 50);
});

// ──────── CLI flags 解析 ────────

const parseFlagsFromArgs = (argv: string[]): Params => {
  const flags: Params = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const eqIdx = arg.indexOf('=');
    const key = eqIdx > -1 ? arg.slice(2, eqIdx) : arg.slice(2);
    const raw = eqIdx > -1 ? arg.slice(eqIdx + 1) : (argv[++i] ?? '');
    flags[key] = coerce(raw);
  }
  return flags;
};

/** 自动类型转换：布尔/null/数字保持原生类型 */
const coerce = (v: string): unknown => {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
};

// ──────── 参数辅助 ────────

const require_ = (p: Params, key: string, hint?: string): string => {
  const val = p[key];
  if (val === undefined || val === '') {
    out({ ok: false, error: `缺少必需参数: ${key}${hint ? ` (${hint})` : ''}` });
  }
  return String(val);
};

const optional = (p: Params, key: string): unknown => p[key];

const str = (p: Params, key: string): string | undefined => {
  const v = p[key];
  return v !== undefined ? String(v) : undefined;
};

const num = (p: Params, key: string, fallback: number): number => {
  const v = p[key];
  return v !== undefined ? Number(v) : fallback;
};

const tags = (p: Params): string[] => {
  const v = p.tags;
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
};

/** 从 params 中提取非空字段构建 body */
const pick = (p: Params, keys: string[]): Params => {
  const result: Params = {};
  for (const k of keys) {
    if (p[k] !== undefined) result[k] = k === 'tags' ? tags(p) : p[k];
  }
  return result;
};

// ──────── 命令路由表 ────────

type Handler = (p: Params) => Promise<ApiResult>;

const commands: Record<string, Handler> = {
  // ── 看板 ──
  'boards:list':   (p) => request('GET', '/boards'),
  'boards:get':    (p) => request('GET', `/boards/${require_(p, 'id')}`),
  'boards:create': (p) => request('POST', '/boards', { name: require_(p, 'name') }),
  'boards:rename': (p) => request('PUT', `/boards/${require_(p, 'id')}`, { name: require_(p, 'name') }),
  'boards:delete': (p) => request('DELETE', `/boards/${require_(p, 'id')}`),

  // ── 列 ──
  'columns:add':    (p) => request('POST', `/boards/${require_(p, 'boardId')}/columns`, {
    title: require_(p, 'title'), position: num(p, 'position', 0),
  }),
  'columns:rename': (p) => request('PUT', `/columns/${require_(p, 'id')}`, { title: require_(p, 'title') }),
  'columns:delete': (p) => request('DELETE', `/columns/${require_(p, 'id')}`),

  // ── 任务 ──
  'tasks:add': (p) => request('POST', '/tasks', {
    columnId: require_(p, 'columnId'),
    content:  require_(p, 'content'),
    description: str(p, 'description') ?? '',
    priority: str(p, 'priority') ?? 'medium',
    dueDate:  optional(p, 'dueDate') ?? null,
    tags:     tags(p),
    position: num(p, 'position', 0),
    assigneeId: optional(p, 'assigneeId') ?? null,
  }),
  'tasks:update': (p) => request('PUT', `/tasks/${require_(p, 'id')}`,
    pick(p, ['content', 'description', 'priority', 'dueDate', 'tags', 'columnId', 'position', 'assigneeId']),
  ),
  'tasks:delete': (p) => request('DELETE', `/tasks/${require_(p, 'id')}`),

  // ── 协作者 ──
  'collaborators:list':   (p) => request('GET', `/boards/${require_(p, 'boardId')}/collaborators`),
  'collaborators:add':    (p) => request('POST', `/boards/${require_(p, 'boardId')}/collaborators`, {
    email: require_(p, 'email'), permission: str(p, 'permission') ?? 'editor',
  }),
  'collaborators:remove': (p) => request('DELETE', `/boards/${require_(p, 'boardId')}/collaborators/${require_(p, 'userId')}`),

  // ── 导入导出 ──
  'board:export': (p) => request('GET', `/boards/${require_(p, 'id')}/export`),
  'board:import': async (p) => {
    const filePath = require_(p, 'file', 'JSON 文件路径');
    const { readFileSync } = await import('fs');
    return request('POST', `/boards/${require_(p, 'id')}/import`, JSON.parse(readFileSync(filePath, 'utf-8')));
  },

  // ── 用户 ──
  'users:list': () => request('GET', '/users'),
  'users:find': (p) => request('GET', `/users?${p.email ? `email=${p.email}` : `username=${p.username}`}`),

  // ── 通用 API 调用 ──
  'api:call': (p) => {
    const method = String(require_(p, 'method')).toUpperCase();
    const path = require_(p, 'path', '相对路径，如 /boards');
    const { method: _, path: __, resource: ___, action: ____, ...body } = p as Record<string, unknown>;
    return request(method, path, Object.keys(body).length ? body : undefined);
  },
};

// ──────── 帮助信息 ────────

const HELP: ApiResult = {
  ok: false,
  error: 'Unknown command',
  data: {
    usage: [
      'CLI flags: npx tsx cli/kanban-cli.ts <resource> <action> [--key value]',
      'JSON stdin: echo \'{"resource":"boards","action":"list"}\' | npx tsx cli/kanban-cli.ts',
    ],
    commands: {
      boards:        'list | get --id | create --name | rename --id --name | delete --id',
      columns:       'add --boardId --title [--position] | rename --id --title | delete --id',
      tasks:         'add --columnId --content [--description --priority --dueDate --tags --assigneeId] | update --id [...] | delete --id',
      collaborators: 'list --boardId | add --boardId --email [--permission] | remove --boardId --userId',
      board:         'export --id | import --id --file',
      users:         'list | find --email | find --username',
      api:           'call --method GET|POST|PUT|DELETE --path /route [--body-key value]',
    },
    env: {
      KANBAN_API_KEY: '必需 — 在个人主页生成',
      KANBAN_API_URL: '可选 — 默认 http://localhost:4000',
    },
  },
};

// ──────── 主入口 ────────

const run = async () => {
  if (!API_KEY) return out({ ok: false, error: 'KANBAN_API_KEY 环境变量未设置' });

  // 优先尝试 stdin JSON
  const stdinRaw = await readStdin();
  let params: Params;
  let resource: string;
  let action: string;

  if (stdinRaw) {
    try {
      const json = JSON.parse(stdinRaw);
      ({ resource, action, ...params } = json);
    } catch {
      return out({ ok: false, error: 'stdin JSON 解析失败' });
    }
  } else {
    const argv = process.argv.slice(2);
    resource = String(argv[0] ?? '');
    action = String(argv[1] ?? '');
    params = parseFlagsFromArgs(argv.slice(2));
  }

  const key = `${resource}:${action}`;
  const handler = commands[key];
  if (!handler) return out(HELP);

  return out(await handler(params));
};

run().catch((e) => out({ ok: false, error: e.message }));
