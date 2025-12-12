import { useState } from 'react';
import './App.css';

// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// 修正するのはここだけ！さっきコピーしたURLを貼ってください
const API_URL = "https://ysp-8uk9.onrender.com";
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲


export default function App() {
  const [stats, setStats] = useState({ sub: 10, money: 10000, sta: 100, plan: 10, edit: 10, char: 10 });
  const [input, setInput] = useState({ title: '', summary: '', quality: 'normal' });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const postVideo = async () => {
    if (!input.title || stats.sta < 40) return alert("タイトル未入力かスタミナ不足です");
    setLoading(true);
    try {
      // ここで一番上のURLを使います
      const res = await fetch(API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, stats: { planning: stats.plan, editing: stats.edit, charisma: stats.char } })
      });
      const d = await res.json();
      setStats(s => ({ ...s, sub: s.sub + d.subs, money: s.money + d.money, sta: s.sta - 40 }));
      setLogs([{ title: input.title, ...d }, ...logs]);
      setInput({ ...input, title: '', summary: '' });
    } catch (e) { alert("エラー: URLが間違っているか、サーバーが準備中です"); }
    setLoading(false);
  };

  const action = (type) => {
    if (type === 'rest') return setStats(s => ({ ...s, sta: 100 }));
    if (stats.money < 5000) return alert("資金不足");
    setStats(s => ({ ...s, money: s.money - 5000, [type]: s[type] + 10 }));
  };

  return (
    <div className="game-root">
      <header className="stats-bar">
        <div>👥 {stats.sub}人</div><div>💰 ¥{stats.money}</div><div>⚡ {stats.sta}/100</div>
      </header>
      <div className="main">
        <section className="form">
          <input placeholder="タイトル" value={input.title} onChange={e => setInput({ ...input, title: e.target.value })} />
          <textarea placeholder="あらすじ" value={input.summary} onChange={e => setInput({ ...input, summary: e.target.value })} />
          <button onClick={postVideo} disabled={loading}>{loading ? "審査中" : "投稿(⚡40)"}</button>
          <div className="btns">
            <button onClick={() => action('rest')}>💤 休息</button>
            <button onClick={() => action('plan')}>📝 企画特訓</button>
            <button onClick={() => action('edit')}>💻 編集講座</button>
          </div>
          <small>能力: 企画{stats.plan} 編集{stats.edit} カリスマ{stats.char}</small>
        </section>
        <section className="logs">
          {logs.map((l, i) => (
            <div key={i} className={`card ${l.hate > 100 ? 'fire' : ''}`}>
              <strong>{l.title} (得点:{l.score})</strong>
              <div>{l.subs > 0 ? '+' : ''}{l.subs}人 / ¥{l.money}</div>
              <div className="cmts">{l.cmts.map(c => <div key={c}>💬 {c}</div>)}</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}