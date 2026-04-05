import { useState, useEffect } from 'react';
import { Key, RefreshCw, Copy, Check, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { useDialog } from '../../contexts/DialogContext';
import api from '../../lib/api';

export function ApiKeySection() {
  const { t } = useAppContext();
  const { success, error } = useToast();
  const { confirm } = useDialog();

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/auth/apikey').then(res => setApiKey(res.data.apiKey)).catch(() => {});
  }, []);

  const generate = async () => {
    if (apiKey) {
      const ok = await confirm({
        title: t.regenerateApiKey ?? 'Regenerate API Key',
        message: t.regenerateApiKeyDesc ?? '重新生成会使旧的 Key 立即失效，确认继续？',
        confirmLabel: t.confirm,
        variant: 'danger',
      });
      if (!ok) return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/apikey/generate');
      setApiKey(res.data.apiKey);
      setVisible(true);
      success(t.apiKeyGenerated ?? 'API Key 已生成');
    } catch {
      error(t.apiKeyFailed ?? '生成失败');
    } finally {
      setLoading(false);
    }
  };

  const revoke = async () => {
    const ok = await confirm({
      title: t.revokeApiKey ?? 'Revoke API Key',
      message: t.revokeApiKeyDesc ?? '吊销后需重新生成才能使用 CLI 工具。',
      confirmLabel: t.delete,
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await api.delete('/auth/apikey');
      setApiKey(null);
      setVisible(false);
      success(t.apiKeyRevoked ?? 'API Key 已吊销');
    } catch {
      error('操作失败');
    }
  };

  const copyKey = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /** 显示脱敏后的 key */
  const maskedKey = apiKey ? `${apiKey.slice(0, 8)}${'•'.repeat(20)}${apiKey.slice(-6)}` : null;

  return (
    <section className="bg-stone-50/50 dark:bg-stone-900/50 rounded-[2.5rem] p-8 border border-stone-200 dark:border-stone-800 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white dark:bg-black rounded-xl border border-stone-200 dark:border-stone-800">
          <Key size={20} className="text-black dark:text-white" />
        </div>
        <div>
          <h3 className="text-lg font-black text-black dark:text-white tracking-tight">
            {t.apiKeyTitle ?? 'API Key'}
          </h3>
          <p className="text-xs text-stone-400 font-medium">
            {t.apiKeyDesc ?? '用于 CLI 工具和 AI Agent 访问您的看板'}
          </p>
        </div>
      </div>

      {apiKey ? (
        <div className="space-y-4">
          {/* Key 显示 */}
          <div className="flex items-center gap-2 bg-white dark:bg-black rounded-2xl border border-stone-200 dark:border-stone-800 px-4 py-3">
            <code className="flex-1 text-sm font-mono text-black dark:text-white truncate select-all">
              {visible ? apiKey : maskedKey}
            </code>
            <button
              type="button"
              onClick={() => setVisible(v => !v)}
              className="text-stone-400 hover:text-black dark:hover:text-white transition-colors shrink-0"
              title={visible ? 'Hide' : 'Show'}
            >
              {visible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              type="button"
              onClick={copyKey}
              className="text-stone-400 hover:text-black dark:hover:text-white transition-colors shrink-0"
              title="Copy"
            >
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-black dark:hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              {t.regenerate ?? '重新生成'}
            </button>
            <button
              type="button"
              onClick={revoke}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-rose-500/50 hover:text-rose-500 transition-colors"
            >
              <Trash2 size={12} />
              {t.revoke ?? '吊销'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 text-sm font-bold text-stone-400 hover:text-black hover:border-black dark:hover:text-white dark:hover:border-white transition-all disabled:opacity-50"
        >
          {loading ? <RefreshCw size={16} className="animate-spin mx-auto" /> : (t.generateApiKey ?? '生成 API Key')}
        </button>
      )}
    </section>
  );
}
