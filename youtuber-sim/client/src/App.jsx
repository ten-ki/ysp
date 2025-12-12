import { useState } from 'react';
import { API_URL } from './config';
import './App.css';

export default function App() {
  const [stats, setStats] = useState({ sub: 10, money: 10000, sta: 100, plan: 10, edit: 10, char: 10 });
  const [input, setInput] = useState({ title: '', summary: '' });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('create');

  const postVideo = async () => {
    if (!input.title) return alert("タイトルを入力してください");
    if (stats.sta < 40) return alert("スタミナ不足です！休息してください");
    
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...input, 
          quality: 'normal', 
          stats: { planning: stats.plan, editing: stats.edit, charisma: stats.char } 
        })
      });
      if (!res.ok) throw new Error("Server Error");
      const d = await res.json();
      
      setStats(s => ({ ...s, sub: s.sub + d.subs, money: s.money + d.money, sta: s.sta - 40 }));
      setLogs([{ title: input.title, ...d }, ...logs]);
      setInput({ title: '', summary: '' });
      setTab('history'); 
    } catch (e) {
      alert(`エラーが発生しました。\nURL設定を確認してください。\n設定中のURL: ${API_URL}`);
    }
    setLoading(false);
  };

  const train = (type, label) => {
    if (stats.money < 5000) return alert("資金が足りません (¥5,000必要)");
    setStats(s => ({ ...s, money: s.money - 5000, [type]: s[type] + 5 }));
    alert(`${label}がアップしました！`);
  };

  const rest = () => {
    setStats(s => ({ ...s, sta: 100 }));
    alert("体力が全回復しました！");
  };

  return (
    <div className="app-container">
      <header className="stats-header">
        <div className="stat-item">👥 {stats.sub.toLocaleString()}</div>
        <div className="stat-item">💰 ¥{stats.money.toLocaleString()}</div>
        <div className="stat-item">⚡ {stats.sta}/100</div>
      </header>

      <div className="tabs">
        <button className={tab === 'create' ? 'active' : ''} onClick={() => setTab('create')}>📹 撮影</button>
        <button className={tab === 'train' ? 'active' : ''} onClick={() => setTab('train')}>💪 特訓</button>
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>📜 履歴</button>
      </div>

      <main className="content-area">
        {tab === 'create' && (
          <div className="card create-card">
            <h3>新作動画を撮影</h3>
            <label>動画タイトル</label>
            <input value={input.title} onChange={e => setInput({...input, title: e.target.value})} placeholder="例: 100万円使ってみた"/>
            <label>企画内容</label>
            <textarea value={input.summary} onChange={e => setInput({...input, summary: e.target.value})} placeholder="AIが内容を審査します..."/>
            <button className="primary-btn" onClick={postVideo} disabled={loading}>{loading ? "審査中..." : "動画を投稿 (消費40)"}</button>
            <div className="current-stats">能力: 企画Lv{stats.plan} / 編集Lv{stats.edit} / カリスマLv{stats.char}</div>
          </div>
        )}

        {tab === 'train' && (
          <div className="train-grid">
            <div className="card train-card" onClick={rest}><h4>💤 完全休息</h4><p>スタミナ全回復</p><span className="cost">無料</span></div>
            <div className="card train-card" onClick={() => train('plan', '企画力')}><h4>📝 企画会議</h4><p>企画力UP</p><span className="cost">-¥5,000</span></div>
            <div className="card train-card" onClick={() => train('edit', '編集力')}><h4>💻 編集講座</h4><p>編集力UP</p><span className="cost">-¥5,000</span></div>
          </div>
        )}

        {tab === 'history' && (
          <div className="logs-list">
            {logs.length === 0 && <p className="empty-msg">動画履歴なし</p>}
            {logs.map((l, i) => (
              <div key={i} className={`log-card ${l.hate > 80 ? 'flaming' : ''}`}>
                <div className="log-header"><span className="log-title">{l.title}</span><span className="log-score">{l.score}点</span></div>
                <div className="log-stats"><span>登録:{l.subs > 0 ? '+' : ''}{l.subs}</span><span>収益:¥{l.money}</span>{l.hate > 80 && <span className="hate-badge">🔥炎上</span>}</div>
                <div className="comments-box">{l.cmts.map((c, idx) => <div key={idx} className="cmt">💬 {c}</div>)}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}