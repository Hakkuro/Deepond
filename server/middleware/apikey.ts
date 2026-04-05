import { Request, Response, NextFunction } from 'express';
import db from '../db.js';

export interface AgentRequest extends Request {
  /** 通过 API Key 自动解析出的用户 ID */
  agentUserId?: string;
}

/** Promise 封装 db.get */
const dbGet = <T = any>(sql: string, params: any[] = []): Promise<T | undefined> =>
  new Promise((resolve, reject) => db.get(sql, params, (err, row: any) => err ? reject(err) : resolve(row)));

/**
 * 每用户独立 API Key 认证中间件
 * 通过 X-API-Key header 或 ?apikey= query 传入
 * 自动从数据库查找对应用户，将 userId 注入 req.agentUserId
 */
export const authenticateApiKey = async (req: AgentRequest, res: Response, next: NextFunction) => {
  const key = (req.headers['x-api-key'] as string) ?? (req.query.apikey as string);

  if (!key) {
    return res.status(401).json({ ok: false, error: 'Missing API Key' });
  }

  try {
    const user = await dbGet<{ id: string }>('SELECT id FROM users WHERE api_key = ?', [key]);
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Invalid API Key' });
    }
    req.agentUserId = user.id;
    next();
  } catch {
    return res.status(500).json({ ok: false, error: 'Database error during authentication' });
  }
};
