import { Link } from 'react-router-dom'
import { ArrowLeft, ScrollText } from 'lucide-react'

export default function TermsOfService() {
  const sections = [
    {
      title: '第1条（本サービスについて）',
      content: [
        '「狩りメモ」（以下「本サービス」）は、狩猟・射撃に関する記録管理を目的とした個人開発のWebアプリケーションです。',
        '本サービスでは、以下の機能を提供します。',
      ],
      list: [
        '狩猟記録・射撃記録の作成および管理',
        '銃砲・弾薬の在庫管理',
        '各種許可証・免許の管理',
        '猟隊（チーム）機能によるメンバー間の情報共有',
        'AI による標的写真の解析（任意機能・ユーザー自身のAPIキーを使用）',
      ],
      after: '本サービスは無料で提供されますが、提供内容や機能は予告なく変更される場合があります。',
    },
    {
      title: '第2条（アカウント）',
      content: [
        '本サービスの利用にはアカウント登録が必要です。ユーザーは正確な情報を登録し、自身のアカウントを適切に管理する責任を負います。',
        'アカウントの認証情報（パスワード等）を第三者に共有しないでください。アカウントの不正使用が判明した場合は、速やかにご連絡ください。',
        '長期間利用がないアカウントは、事前通知の上で削除する場合があります。',
      ],
    },
    {
      title: '第3条（利用上のルール）',
      content: [
        'ユーザーは、日本国の法令（銃砲刀剣類所持等取締法、鳥獣保護管理法等を含む）を遵守した上で本サービスを利用してください。',
        '本サービスに登録する情報は、実際の記録に基づく正確なものとしてください。',
        'チーム機能を利用する際は、他のメンバーのプライバシーおよび情報の取り扱いに十分ご配慮ください。',
      ],
    },
    {
      title: '第4条（禁止事項）',
      content: ['ユーザーは、以下の行為を行ってはなりません。'],
      list: [
        '法令または公序良俗に反する行為',
        '他のユーザーの情報を不正に取得・利用する行為',
        '本サービスのサーバーやネットワークに過度の負荷をかける行為',
        '本サービスの運営を妨害する行為、またはそのおそれのある行為',
        'リバースエンジニアリング、不正アクセス、スクレイピング等の技術的な攻撃',
        '虚偽の情報を登録する行為',
        'その他、運営者が不適切と判断する行為',
      ],
    },
    {
      title: '第5条（データの取り扱い）',
      content: [
        '本サービスのデータは、Supabase（クラウドデータベースサービス）上に保存されます。運営者はデータの安全な管理に努めますが、完全なセキュリティを保証するものではありません。',
        'AI標的解析機能を利用する場合、ユーザー自身が設定したAnthropicのAPIキーを通じて画像データが外部サービス（Anthropic API）に送信されます。この機能は任意であり、APIキーはユーザーのブラウザ内にのみ保存されます。',
        '運営者は、サービス改善のために匿名化・集計化された利用統計を参照する場合があります。個人を特定できる形でのデータの第三者提供は行いません。',
      ],
    },
    {
      title: '第6条（免責事項）',
      content: [
        '本サービスは「現状有姿（as is）」で提供されます。運営者は、本サービスの完全性、正確性、信頼性、特定目的への適合性について保証しません。',
        '本サービスは個人開発のアプリケーションであり、予告なくサービスが中断・終了する可能性があります。',
        '本サービスの利用または利用不能により生じた損害（データの消失を含む）について、運営者は一切の責任を負いません。',
        '重要なデータは、ユーザー自身で定期的にバックアップを取ることを推奨します。',
      ],
    },
    {
      title: '第7条（知的財産権）',
      content: [
        '本サービスを構成するソフトウェア、デザイン、ロゴ等の知的財産権は運営者に帰属します。',
        'ユーザーが本サービスに登録したデータ（狩猟記録、写真等）の権利はユーザーに帰属します。ただし、サービス提供に必要な範囲での利用を許諾いただくものとします。',
      ],
    },
    {
      title: '第8条（サービスの終了・アカウント停止）',
      content: [
        '運営者は、やむを得ない事情がある場合、本サービスの全部または一部を終了することがあります。その際は、可能な限り事前に通知いたします。',
        'ユーザーが本規約に違反した場合、運営者は事前通知なくアカウントの停止または削除を行うことがあります。',
        'ユーザーは、いつでもアカウントの削除を申請できます。',
      ],
    },
    {
      title: '第9条（規約の変更）',
      content: [
        '運営者は、必要に応じて本規約を変更できるものとします。重要な変更がある場合は、本サービス上で通知いたします。',
        '変更後も本サービスの利用を継続した場合、変更後の規約に同意したものとみなします。',
      ],
    },
    {
      title: '第10条（準拠法・管轄）',
      content: [
        '本規約は日本法に準拠し、日本法に従って解釈されるものとします。',
        '本規約に関する紛争については、運営者の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。',
      ],
    },
  ]

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          to="/settings"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft size={16} />
          設定に戻る
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
        <ScrollText className="text-emerald-600" size={24} />
        利用規約
      </h1>
      <p className="text-sm text-stone-500 mb-8">
        最終更新日：2026年4月10日
      </p>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-700 leading-relaxed">
            本利用規約（以下「本規約」）は、「狩りメモ」（以下「本サービス」）の利用条件を定めるものです。
            本サービスをご利用いただく前に、本規約をよくお読みください。
            本サービスを利用することにより、本規約に同意したものとみなされます。
          </p>
        </div>

        {sections.map((section, index) => (
          <div
            key={index}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
          >
            <h2 className="font-semibold text-gray-800 mb-3 text-base">
              {section.title}
            </h2>
            <div className="space-y-2">
              {section.content.map((paragraph, pIndex) => (
                <p
                  key={pIndex}
                  className="text-sm text-gray-700 leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-2 mt-2">
                  {section.list.map((item, lIndex) => (
                    <li key={lIndex} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {section.after && (
                <p className="text-sm text-gray-700 leading-relaxed mt-2">
                  {section.after}
                </p>
              )}
            </div>
          </div>
        ))}

        <div className="bg-stone-50 rounded-xl border border-stone-200 p-6 text-center">
          <p className="text-xs text-stone-500">
            ご不明な点がございましたら、アプリ内のお問い合わせ機能よりご連絡ください。
          </p>
        </div>
      </div>

      <div className="mt-8 mb-4">
        <Link
          to="/settings"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft size={16} />
          設定に戻る
        </Link>
      </div>
    </div>
  )
}
