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
