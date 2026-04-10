import { Link } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'

const LAST_UPDATED = '2026年4月10日'

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-stone-800 mb-3 border-b border-stone-200 pb-2">
        {title}
      </h2>
      <div className="text-sm text-stone-700 leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  )
}

export default function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* ヘッダー */}
      <Link
        to="/settings"
        className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-900 mb-6"
      >
        <ArrowLeft size={16} />
        設定に戻る
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <Shield className="text-emerald-600" size={28} />
        <h1 className="text-2xl font-bold text-stone-800">プライバシーポリシー</h1>
      </div>
      <p className="text-xs text-stone-500 mb-8">
        最終更新日：{LAST_UPDATED}
      </p>

      <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-6 sm:p-8">
        <p className="text-sm text-stone-700 leading-relaxed mb-8">
          狩りメモ（以下「本アプリ」）は、ユーザーの皆さまの個人情報を適切に取り扱うことを
          重要な責務と考えています。本ポリシーでは、本アプリがどのような情報を収集し、
          どのように利用・保護するかについてご説明します。
        </p>

        {/* 1. 収集する情報 */}
        <Section title="1. 収集する情報">
          <p>本アプリでは、サービス提供のために以下の情報を収集・保存します。</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>アカウント情報：</strong>メールアドレス、パスワード（ハッシュ化して保存）、表示名</li>
            <li><strong>狩猟記録：</strong>日時、場所、猟果、メモなどの狩猟活動に関する記録</li>
            <li><strong>射撃記録：</strong>射撃場での練習記録、標的画像、スコアなど</li>
            <li><strong>位置情報（GPS）：</strong>狩猟場所の記録のために取得する位置データ（ユーザーが明示的に入力・許可した場合のみ）</li>
            <li><strong>銃砲情報：</strong>所持する銃砲の種類・名称などの登録情報</li>
            <li><strong>許可証・免許情報：</strong>狩猟免許番号、銃砲所持許可証番号、有効期限などの管理情報</li>
            <li><strong>弾薬在庫：</strong>弾薬の種類・数量などの在庫管理データ</li>
          </ul>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mt-3">
            <p className="text-xs text-amber-700">
              <strong>Anthropic APIキーについて：</strong>AI標的解析機能をご利用の場合、
              Anthropic APIキーをブラウザの localStorage に保存することができます。
              このキーはサーバーには送信されず、お使いのブラウザ内にのみ保持されます。
            </p>
          </div>
        </Section>

        {/* 2. 利用目的 */}
        <Section title="2. 利用目的">
          <p>収集した情報は、以下の目的のために利用します。</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>ユーザー認証およびアカウント管理</li>
            <li>狩猟記録・射撃記録・弾薬在庫の保存と表示</li>
            <li>許可証・免許の有効期限管理と通知</li>
            <li>猟隊（チーム）機能における情報共有</li>
            <li>AI標的解析機能の提供（ユーザーが任意で有効化した場合）</li>
            <li>サービスの改善と安定運用</li>
          </ul>
        </Section>

        {/* 3. データの保存 */}
        <Section title="3. データの保存">
          <p>
            本アプリのデータは以下のインフラストラクチャに保存されます。
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>Supabase：</strong>認証情報およびすべてのユーザーデータは
              Supabase のクラウドデータベースに保存されます。Supabase は
              データの暗号化（転送中および保存時）を提供しています。
            </li>
            <li>
              <strong>Vercel：</strong>フロントエンドアプリケーションの
              ホスティングに使用しています。Vercel 上にユーザーデータは保存されません。
            </li>
            <li>
              <strong>ブラウザ localStorage：</strong>Anthropic APIキー（任意設定）のみ、
              お使いのブラウザに保存されます。
            </li>
          </ul>
        </Section>

        {/* 4. 情報の共有 */}
        <Section title="4. 情報の共有・第三者提供">
          <p>
            本アプリは、ユーザーの個人情報を第三者に販売・貸与することはありません。
            以下の場合に限り、情報が共有されることがあります。
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>チーム機能：</strong>ユーザーが猟隊（チーム）に参加している場合、
              狩猟記録などの一部情報がチームメンバー間で共有されます。
              これはユーザーが自ら参加・共有を選択した場合に限ります。
            </li>
            <li>
              <strong>AI解析機能：</strong>標的画像の解析にAnthropic APIを利用する場合、
              画像データがAnthropic社のサーバーに送信されます。
              送信はユーザーの操作によってのみ実行されます。
            </li>
            <li>
              <strong>法令に基づく開示：</strong>法令の定めにより開示が求められた場合、
              必要最小限の範囲で情報を提供することがあります。
            </li>
          </ul>

          <p className="mt-2">
            本アプリはトラッキングCookieや第三者アクセス解析ツールを使用していません。
          </p>
        </Section>

        {/* 5. セキュリティ */}
        <Section title="5. セキュリティ">
          <p>
            ユーザーの情報を保護するため、以下のセキュリティ対策を講じています。
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>すべての通信はTLS（HTTPS）で暗号化されています</li>
            <li>パスワードはハッシュ化して保存され、平文では保持しません</li>
            <li>Supabase のRow Level Security（RLS）により、各ユーザーのデータは本人のみがアクセスできます</li>
            <li>Anthropic APIキーはサーバーに保存されず、ブラウザ内にのみ保持されます</li>
          </ul>
          <p className="mt-2 text-xs text-stone-500">
            ※ 本アプリは個人開発によるものであり、大規模なセキュリティ体制を保証するものではありません。
            重大なセキュリティ上の懸念がある場合は、速やかにお知らせください。
          </p>
        </Section>

        {/* 6. ユーザーの権利 */}
        <Section title="6. ユーザーの権利">
          <p>ユーザーは、ご自身の情報に関して以下の権利を有します。</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>アクセス：</strong>本アプリに保存されているご自身のデータをいつでも確認できます</li>
            <li><strong>修正：</strong>登録情報や各種記録を随時修正・更新できます</li>
            <li><strong>削除：</strong>アカウントおよび関連データの削除を請求できます</li>
            <li><strong>データエクスポート：</strong>ご自身のデータのエクスポートを請求できます</li>
          </ul>
          <p className="mt-2">
            上記の請求は、下記の連絡先までご連絡ください。合理的な期間内に対応いたします。
          </p>
        </Section>

        {/* 7. ポリシーの変更 */}
        <Section title="7. ポリシーの変更">
          <p>
            本ポリシーは、必要に応じて改定されることがあります。
            重要な変更がある場合は、本アプリ上でお知らせいたします。
            変更後も本アプリを継続して利用された場合、改定後のポリシーに
            同意したものとみなします。
          </p>
        </Section>

        {/* 8. お問い合わせ */}
        <Section title="8. お問い合わせ">
          <p>
            本ポリシーに関するご質問やご要望がございましたら、
            以下の連絡先までお気軽にお問い合わせください。
          </p>
          <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 mt-2">
            <p className="text-sm text-stone-700">
              <strong>狩りメモ 運営</strong><br />
              メール：<a href="mailto:support@karimemo.app" className="text-emerald-700 hover:underline">support@karimemo.app</a>
            </p>
          </div>
        </Section>
      </div>
    </div>
  )
}
