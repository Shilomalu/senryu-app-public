import postgres from 'postgres';

// Vercelが自動で設定する環境変数を使います
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  prepare: false,
});

export default async function handler(req, res) {
  // 1. POST送信以外は弾く
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 2. フロントエンドから送られてくるデータを受け取る
    // ★重要: あなたの元のコードで req.body.xxx と書いていた名前と合わせてください
    const { content, score } = req.body; 

    // 3. Supabaseに保存する
    const result = await sql`
      INSERT INTO senryus (content, score)
      VALUES (${content}, ${score})
      RETURNING id
    `;

    res.status(200).json({ message: '投稿成功', id: result[0].id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error' });
  }
}