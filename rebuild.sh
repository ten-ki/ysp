#!/bin/bash
# 完全リセット
rm -rf youtuber-sim
mkdir -p youtuber-sim/server youtuber-sim/client/src

echo "📦 サーバー(Backend)作成中..."
cd youtuber-sim/server
npm init -y > /dev/null
npm install express cors dotenv @google/generative-ai
cat << 'EOF' > server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/evaluate', async (req, res) => {
  try {
    const { title, summary, quality, stats } = req.body;
    const prompt = `YouTuberゲームのGMとして結果をJSONのみで出力せよ。
    【ステータス】企画:${stats.planning} 編集:${stats.editing} カリスマ:${stats.charisma}
    【動画】タイトル:${title} 内容:${summary} 編集レベル:${quality}
    【判定項目】
    score(0-1000):面白さ。企画/編集が高いと高得点。
    hate(0-200):不快度。低いカリスマや過激企画で上昇。
    subs(数値):登録者増減。scoreに比例。
    money(数値):収益。score×10。
    cmts:短い視聴者コメント3つ。
    形式:{"score":0,"hate":0,"subs":0,"money":0,"cmts":["","",""]}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
    res.json(JSON.parse(jsonMatch[0]));
  } catch (e) {
    res.status(500).json({cmts:["通信エラーが発生しました"]});
  }
});
app.listen(3000, () => console.log("Server OK"));
EOF
touch .env

echo "📦 画面(Frontend)作成中..."
cd ../client
npm create vite@latest . -- --template react
npm install
rm -f src/App.jsx src/App.css src/index.css
touch src/index.css

cat << 'EOF' > src/App.jsx
import { useState } from 'react';
import './App.css';

export default function App() {
  const [stats, setStats] = useState({ sub: 10, money: 10000, sta: 100, plan: 10, edit: 10, char: 10 });
  const [input, setInput] = useState({ title: '', summary: '', quality: 'normal' });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const postVideo = async () => {
    if (!input.title || stats.sta < 40) return alert("タイトル未入力かスタミナ不足です");
    setLoading(true);
    try {
      // ローカル/Render自動切り替え (後でURLを書き換え)
      const url = window.location.hostname.includes('github.dev') 
        ? 'https://' + window.location.hostname.replace('-5173', '-3000') + '/api/evaluate'
        : 'http://localhost:3000/api/evaluate';

      const res = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, stats: { planning: stats.plan, editing: stats.edit, charisma: stats.char } })
      });
      const d = await res.json();
      setStats(s => ({ ...s, sub: s.sub + d.subs, money: s.money + d.money, sta: s.sta - 40 }));
      setLogs([{ title: input.title, ...d }, ...logs]);
      setInput({ ...input, title: '', summary: '' });
    } catch (e) { alert("エラー"); }
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
EOF

cat << 'EOF' > src/App.css
.game-root { max-width: 500px; margin: 0 auto; background: #fafafa; min-height: 100vh; padding: 10px; font-family: sans-serif; }
.stats-bar { display: flex; justify-content: space-around; background: #222; color: #fff; padding: 10px; border-radius: 8px; font-weight: bold; }
.main { display: grid; gap: 15px; margin-top: 15px; }
.form { background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px #ccc; }
input, textarea { width: 100%; margin-bottom: 10px; padding: 8px; box-sizing: border-box; }
button { width: 100%; padding: 12px; background: #e00; color: #fff; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 5px; font-weight: bold; }
.btns { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; margin-bottom: 10px; }
.btns button { background: #555; font-size: 0.7em; padding: 8px; }
.card { background: #fff; padding: 10px; margin-bottom: 8px; border-radius: 5px; border-left: 5px solid #e00; font-size: 0.9em; }
.fire { background: #ffebeb; border-left-color: #f00; border: 2px solid #f00; }
.cmts { color: #666; font-size: 0.8em; margin-top: 5px; }
EOF

echo "✅ 全ての構築が完了しました！"