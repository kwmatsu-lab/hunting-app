import Anthropic from '@anthropic-ai/sdk'

/**
 * 射撃標的の写真をClaude APIで解析し、スコア・弾数などを抽出する
 * @param {string} imageBase64 - base64エンコードされた画像データ
 * @param {string} mediaType - 'image/jpeg' | 'image/png' | 'image/webp'
 * @param {string} apiKey - Anthropic API key
 * @returns {{ score, rounds, notes } | null}
 */
export async function analyzeShootingTarget(imageBase64, mediaType, apiKey) {
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  })

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: imageBase64 },
          },
          {
            type: 'text',
            text: `この射撃標的（ターゲット）の画像を分析してください。
以下の情報を抽出して、必ずJSONのみを返してください（説明文は不要）:
{
  "score": 合計スコア（数値。スコア表示がない場合はnull）,
  "rounds": 確認できる弾痕の総数（数値。不明な場合はnull）,
  "grouping_mm": グルーピングの大きさ（mm。計測不能な場合はnull）,
  "notes": "弾着の傾向・グルーピングの状態・特記事項などを日本語で簡潔に"
}`,
          },
        ],
      },
    ],
  })

  const text = response.content.find(b => b.type === 'text')?.text || ''
  const match = text.match(/\{[\s\S]*?\}/)
  if (!match) return null

  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

/**
 * FileオブジェクトをBase64文字列に変換する
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result // data:image/jpeg;base64,XXXX
      const base64 = result.split(',')[1]
      resolve({ base64, mediaType: file.type })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
