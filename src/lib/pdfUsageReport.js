/**
 * 使用実績報告書 PDF 生成
 * 第74号様式（第94条関係）
 *
 * レイアウト: A4縦 (595.28 x 841.89 pt)
 */
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

// ── 定数 ──────────────────────────────────────────
const A4W = 595.28
const A4H = 841.89
const MARGIN = 50
const LINE_H = 16
const SMALL = 8
const NORMAL = 9.5
const TITLE_SIZE = 13

// 罫線色
const BLACK = rgb(0, 0, 0)
const GRAY = rgb(0.4, 0.4, 0.4)

// ── ヘルパー ──────────────────────────────────────
function drawText(page, font, text, x, y, size = NORMAL, color = BLACK) {
  page.drawText(text || '', { x, y, size, font, color })
}

function drawLine(page, x1, y1, x2, y2, thickness = 0.5) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color: BLACK })
}

function drawRect(page, x, y, w, h, thickness = 0.5) {
  page.drawRectangle({ x, y, width: w, height: h, borderColor: BLACK, borderWidth: thickness, color: rgb(1, 1, 1) })
}

function fmtDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日`
}

// ── 使用実績テーブル描画 ──────────────────────────
function drawUsageTable(page, font, title, records, startY, tableW) {
  const x = MARGIN
  let y = startY

  // セクションヘッダー
  drawText(page, font, title, x + 4, y - 12, NORMAL)
  y -= 20

  // 有・無
  const hasRecords = records.length > 0
  drawText(page, font, `有${hasRecords ? ' ○' : ''}　・　無${!hasRecords ? ' ○' : ''}`, x + tableW - 120, y + 8, NORMAL)

  // テーブルヘッダー
  const cols = [
    { label: '年月日', w: 90 },
    { label: '場所', w: 130 },
    { label: '同行者', w: 100 },
    { label: '消費弾数', w: 70 },
    { label: '備考', w: tableW - 390 },
  ]

  const rowH = 20
  const headerH = 18

  // ヘッダー背景
  let cx = x
  for (const col of cols) {
    drawRect(page, cx, y - headerH, col.w, headerH)
    drawText(page, font, col.label, cx + 4, y - headerH + 5, SMALL)
    cx += col.w
  }
  y -= headerH

  // データ行（最大6行）
  const maxRows = 6
  for (let i = 0; i < maxRows; i++) {
    const r = records[i]
    cx = x
    for (let ci = 0; ci < cols.length; ci++) {
      drawRect(page, cx, y - rowH, cols[ci].w, rowH)
      if (r) {
        let val = ''
        switch (ci) {
          case 0: val = fmtDate(r.date); break
          case 1: val = r.location || ''; break
          case 2: val = r.companion || ''; break
          case 3: val = r.rounds != null ? String(r.rounds) : ''; break
          case 4: val = r.notes || ''; break
        }
        // テキストが長すぎる場合は切り詰め
        if (val.length > 20) val = val.substring(0, 19) + '…'
        drawText(page, font, val, cx + 3, y - rowH + 6, SMALL)
      }
      cx += cols[ci].w
    }
    y -= rowH
  }

  return y
}

// ── メイン: PDF生成 ──────────────────────────────
export async function generateUsageReport({
  reportDate,       // 報告日
  commission,       // 公安委員会名
  reporterName,     // 報告者氏名
  permitNumber,     // 許可番号
  gunType,          // 銃種等
  permitDate,       // 許可年月日
  purpose,          // 許可に係る用途
  huntingRecords,   // 狩猟実績 [{ date, location, companion, rounds, notes }]
  pestRecords,      // 有害鳥獣駆除実績
  shootingRecords,  // 標的射撃実績
}) {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  // 日本語フォント読み込み（Google Fonts CDN から取得）
  const fontUrl = 'https://fonts.gstatic.com/s/notosansjp/v56/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEj75s.ttf'
  const fontResp = await fetch(fontUrl)
  const fontAB = await fontResp.arrayBuffer()
  const fontBytes = new Uint8Array(fontAB)
  const jpFont = await pdfDoc.embedFont(fontBytes, { subset: true })

  // ─── 表面 ───
  const page1 = pdfDoc.addPage([A4W, A4H])
  const tableW = A4W - MARGIN * 2

  let y = A4H - MARGIN

  // 様式番号
  drawText(page1, jpFont, '第74号（第94条関係）', MARGIN, y, SMALL, GRAY)
  drawText(page1, jpFont, '（表）', A4W - MARGIN - 30, y, SMALL, GRAY)
  y -= 30

  // タイトル
  const titleText = '使　用　実　績　報　告　書'
  const titleW = jpFont.widthOfTextAtSize(titleText, TITLE_SIZE)
  drawText(page1, jpFont, titleText, (A4W - titleW) / 2, y, TITLE_SIZE)
  y -= 30

  // 「次のとおり使用の実績を報告します。」
  drawText(page1, jpFont, '次のとおり使用の実績を報告します。', MARGIN + 60, y, NORMAL)
  y -= 25

  // 日付行
  drawText(page1, jpFont, reportDate ? fmtDate(reportDate) : '　　年　　月　　日', MARGIN + 60, y, NORMAL)
  y -= 20

  // 公安委員会殿
  drawText(page1, jpFont, `${commission || '　　　　'}公安委員会殿`, MARGIN + 60, y, NORMAL)
  y -= 25

  // 報告者氏名
  drawText(page1, jpFont, '報告者氏名', MARGIN + 200, y, NORMAL)
  drawText(page1, jpFont, reporterName || '', MARGIN + 280, y, NORMAL)
  drawLine(page1, MARGIN + 270, y - 3, A4W - MARGIN, y - 3, 0.3)
  y -= 30

  // ─── 許可情報テーブル ───
  const infoH = 22
  const labelW = 100
  const valW = tableW - labelW

  // 許可番号
  drawRect(page1, MARGIN, y - infoH, labelW, infoH)
  drawText(page1, jpFont, '許可番号', MARGIN + 10, y - infoH + 7, SMALL)
  drawRect(page1, MARGIN + labelW, y - infoH, valW, infoH)
  drawText(page1, jpFont, permitNumber || '', MARGIN + labelW + 8, y - infoH + 7, NORMAL)
  y -= infoH

  // 銃種等
  drawRect(page1, MARGIN, y - infoH, labelW, infoH)
  drawText(page1, jpFont, '銃種等', MARGIN + 10, y - infoH + 7, SMALL)
  drawRect(page1, MARGIN + labelW, y - infoH, valW, infoH)
  drawText(page1, jpFont, gunType || '', MARGIN + labelW + 8, y - infoH + 7, NORMAL)
  y -= infoH

  // 許可年月日
  drawRect(page1, MARGIN, y - infoH, labelW, infoH)
  drawText(page1, jpFont, '許可年月日', MARGIN + 10, y - infoH + 7, SMALL)
  drawRect(page1, MARGIN + labelW, y - infoH, valW, infoH)
  drawText(page1, jpFont, permitDate ? fmtDate(permitDate) : '', MARGIN + labelW + 8, y - infoH + 7, NORMAL)
  y -= infoH

  // 許可に係る用途
  drawRect(page1, MARGIN, y - infoH, labelW, infoH)
  drawText(page1, jpFont, '許可に係る用途', MARGIN + 10, y - infoH + 7, SMALL)
  drawRect(page1, MARGIN + labelW, y - infoH, valW, infoH)
  drawText(page1, jpFont, purpose || '', MARGIN + labelW + 8, y - infoH + 7, NORMAL)
  y -= infoH + 10

  // ─── 使用実績（狩猟）───
  y = drawUsageTable(page1, jpFont, '使用実績（狩猟）', huntingRecords || [], y, tableW)
  y -= 10

  // ─── 使用実績（有害鳥獣駆除）───
  y = drawUsageTable(page1, jpFont, '使用実績（有害鳥獣駆除）', pestRecords || [], y, tableW)

  // ─── 裏面 ───
  const page2 = pdfDoc.addPage([A4W, A4H])
  let y2 = A4H - MARGIN

  drawText(page2, jpFont, '（裏）', A4W - MARGIN - 30, y2, SMALL, GRAY)
  y2 -= 20

  // ─── 使用実績（標的射撃）───
  y2 = drawUsageTable(page2, jpFont, '使用実績（標的射撃）', shootingRecords || [], y2, tableW)
  y2 -= 20

  // ─── 備考 ───
  drawText(page2, jpFont, '備考', MARGIN, y2, NORMAL)
  y2 -= 18
  const notes = [
    '１　直前２年間の使用実績がある場合は、直前２年間の使用実績のうち最近のものから',
    '　　順次記載し、使用実績がない場合は備考欄に理由を記入すること。',
    '２　備考欄には、上記のほか添付書類名、狩猟又は有害鳥獣駆除に係る鳥獣の種類',
    '　　（使用実績（狩猟）又は使用実績（有害鳥獣駆除）の備考欄に限る。）',
    '　　その他必要な事項を記載すること。',
    '３　用紙の大きさは、日本産業規格Ａ４とすること。',
  ]
  for (const line of notes) {
    drawText(page2, jpFont, line, MARGIN + 20, y2, SMALL, GRAY)
    y2 -= 14
  }

  // PDF保存
  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}
