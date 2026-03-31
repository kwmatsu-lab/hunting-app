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
 * 銃砲所持許可証の画像を解析し、各項目を抽出する
 */
export async function analyzeGunPermit(imageBase64, mediaType, apiKey) {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
        {
          type: 'text',
          text: `銃砲所持許可証の画像を解析してください。
ページ種別を判定し、以下のJSONのみを返してください（説明文不要）。
元号は西暦に変換してください（令和n年→2018+n年, 平成n年→1988+n年）。

【所持者情報ページ（氏名・住所・許可証番号が記載されているページ）】
{
  "page": "holder",
  "bookNumber": "許可証番号（例: 第302202000001号）",
  "originalIssueDate": "原交付日 YYYY-MM-DD",
  "issueDate": "交付日 YYYY-MM-DD",
  "issuer": "交付機関名（例: 東京都公安委員会）"
}

【銃諸元ページ（許可番号・銃番号・メーカーなどが記載されているページ）】
{
  "page": "spec",
  "originalPermitDate": "原許可日 YYYY-MM-DD",
  "originalPermitNumber": "原許可番号（例: 第220020009号）",
  "permitDate": "許可年月日 YYYY-MM-DD",
  "permitNumber": "許可番号（例: 第220080423号）",
  "permitValidityText": "有効期間の原文（例: 令和11年の誕生日まで）",
  "renewalPeriodText": "更新申請期間の原文",
  "type": "種類（散弾銃/ライフル/空気銃/その他のいずれか）",
  "mechanism": "型式（例: 単身連発スライド式（ポンプ式））",
  "serialNumber": "銃番号（例: A364975M）",
  "manufacturer": "メーカー名（例: レミントン）",
  "model": "モデル名等（例: M870）",
  "caliber": "適合実(空)包（例: 12ga）"
}`
        }
      ]
    }]
  })
  const text = response.content.find(b => b.type === 'text')?.text || ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) } catch { return null }
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
