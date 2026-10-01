import { en, type TranslationKey } from './en';

/**
 * Japanese strings — exactly the key set of `en.ts` (enforced by the `Record<TranslationKey, string>`
 * annotation below: a missing key is a compile error, an extra key is a compile error).
 */
export const ja: Record<TranslationKey, string> = {
  // ---------------------------------------------------------------------
  // common
  // ---------------------------------------------------------------------
  'common.retry': '再試行',
  'common.retrying': '再試行中…',
  'common.cancel': 'キャンセル',
  'common.close': '閉じる',
  'common.save': '保存',
  'common.saving': '保存中…',
  'common.loading': '読み込み中…',
  'common.loadingMore': 'さらに読み込み中…',
  'common.dismiss': '閉じる',
  'common.noOptionsAvailable': '選択肢がありません。',
  'common.somethingWentWrong': 'エラーが発生しました',
  'common.actionFailed': '操作に失敗しました',
  'common.genericError': '問題が発生しました。',
  'common.forbidden': 'この操作を行う権限がありません。',
  'common.unassigned': '未割当',
  'common.owner': '担当者',
  'common.more': 'その他',
  'common.whatIsThis': 'これは何ですか？',
  'common.explain': '解説',
  'common.whereNumberComesFrom': '数値の算出根拠',

  // ---------------------------------------------------------------------
  // nav
  // ---------------------------------------------------------------------
  'nav.today': '本日',
  'nav.leads': 'リード',
  'nav.pipeline': 'パイプライン',
  'nav.tracking': 'トラッキング',
  'nav.dashboard': 'ダッシュボード',
  'nav.team': 'チーム',
  'nav.nurture': 'ナーチャー',
  'nav.sns': 'SNS',
  'nav.booking': '予約',
  'nav.assign': 'アサイン',
  'nav.integrations': '連携',
  'nav.admin': '管理',
  'nav.settings': '設定',
  'nav.lead': 'リード',
  'nav.repTasks': '担当タスク',
  'nav.sequence': 'シーケンス',
  'nav.cardScan': '名刺スキャン',
  'nav.import': '取込',

  // ---------------------------------------------------------------------
  // login
  // ---------------------------------------------------------------------
  'login.headlinePre': 'おかえりなさい\n',
  'login.headlineBrand': 'Exceed Box へ',
  'login.googleContinue': 'Googleでログイン',
  'login.signingIn': 'ログイン中…',
  'login.accountNote': 'Exceedアカウントのみ',
  'login.emailSignIn': 'メールアドレスでログイン',
  'login.legal': '社内専用',
  'login.demoHint': 'デモ — どちらかのボタンをタップしてください。メールログイン:\nadmin@ / manager@ / marketing@ / sales@exceed-re.ae\nパスワードは何でも可',
  'login.devAuthHint': '本番バックエンド接続中 · 開発用ログイン（Supabase未設定）。\nバックエンドの社員メールアドレスを入力してください。パスワードは何でも可。',
  'login.signInTitle': 'ログイン',
  'login.emailLabel': 'メールアドレス',
  'login.passwordLabel': 'パスワード',
  'login.signInButton': 'ログイン',
  'login.forgotPassword': 'パスワードをお忘れですか',
  'login.forgotNote': '管理者にリセットを依頼してください。',
  'login.language': '言語',

  // ---------------------------------------------------------------------
  // today
  // ---------------------------------------------------------------------
  'today.title': '本日',
  'today.subtitle': '未対応 {count} 件・{name}',
  'today.emptyTitle': '本日のタスクはありません',
  'today.emptyBody': 'すべて対応済みです。',
  'today.loadFailed': 'タスクを読み込めませんでした。',

  // ---------------------------------------------------------------------
  // leads
  // ---------------------------------------------------------------------
  'leads.title': 'リード一覧',
  'leads.subtitle': 'リード {count} 件・{scope}',
  'leads.scopeAll': '全社',
  'leads.scopeMine': '自分のみ',
  'leads.import': '取込',
  'leads.scan': '名刺',
  'leads.searchPlaceholder': '氏名・メール・会社名で検索…',
  'leads.filterAll': '全て',
  'leads.loadFailed': 'リードを読み込めませんでした。',
  'leads.emptyFilteredTitle': 'この条件に一致するリードはありません',
  'leads.emptyTitle': 'リードがまだありません',
  'leads.emptyFilteredBody': '検索条件やフィルターを解除して全件表示をお試しください。',
  'leads.emptyBody': '新しいリードは自動的にここに表示されます。',
  'leads.clearFilters': 'フィルターを解除',
  'leads.selectLead': 'リードを選択してください',
  'leads.selectLeadBody': '左のリストからリードを選択すると詳細が表示されます。',

  // ---------------------------------------------------------------------
  // lead detail
  // ---------------------------------------------------------------------
  'leadDetail.loadFailed': 'このリードを読み込めませんでした。',
  'leadDetail.contact': '連絡先',
  'leadDetail.email': 'メール',
  'leadDetail.phone': '電話',
  'leadDetail.consentState': '連絡可否',
  'leadDetail.consentBasis': '同意の根拠',
  'leadDetail.consentObtainedVia': '取得方法',
  'leadDetail.consentObtainedAt': '取得日',
  'leadDetail.consentBasisExplicit': '明示的 — 本人がオプトイン',
  'leadDetail.consentBasisImplied': '黙示的 — 既存の取引関係',
  'leadDetail.consentBasisAmbiguous': '不明確 — 送信前に要確認',
  'leadDetail.consentBasisUnknown': '記録なし — 送信不可',
  'leadDetail.consentBasisWithdrawn': '撤回済み — 二度と送信しない',
  'leadDetail.contactHidden': '連絡先と同意状況は非表示です — このリードは集計のみで、担当者に紐付いていません。',
  'leadDetail.categories': 'カテゴリー',
  'leadDetail.region': '地域',
  'leadDetail.purpose': '目的',
  'leadDetail.relationship': '関係',
  'leadDetail.source': '流入元',
  'leadDetail.owner': '担当者',
  'leadDetail.scoreBreakdown': 'スコア内訳',
  'leadDetail.noScoringSignals': 'スコアリングの兆候はまだありません。',
  'leadDetail.timeline': 'タイムライン',
  'leadDetail.channels': 'チャネル',
  'leadDetail.noChannels': 'チャネルは記録されていません。',
  'leadDetail.firstTouch': '初回接点',
  'leadDetail.replies': '返信',
  'leadDetail.loadingReplies': '読み込み中…',
  'leadDetail.notReal': '実際ではない',
  'leadDetail.replied': '返信済み',
  'leadDetail.aiReply': '✨ AI返信',
  'leadDetail.voiceNotes': '音声メモ',
  'leadDetail.actions': '操作',
  'leadDetail.editDetails': '編集',
  'leadDetail.moveStage': 'ステージ変更',
  'leadDetail.markWantsToMeet': '対面希望を記録（+30）',
  'leadDetail.assignOwner': '担当者を割り当て',
  'leadDetail.noActions': 'このリードは閲覧のみ可能で、あなたの権限で実行できる操作はありません。',
  'leadDetail.notifyRep': '営業に通知',
  'leadDetail.showroomVisit': '来店対応する',
  'leadDetail.siteInspection': '視察を案内する',
  'leadDetail.setContactDate': '連絡日を設定',
  'leadDetail.follow': 'フォローする',
  'leadDetail.notifyRepReason': '{name} について営業に通知',
  'leadDetail.notifyRepSuccess': '営業に通知しました',
  'leadDetail.showroomVisitReason': '来店対応 — {name}',
  'leadDetail.showroomVisitSuccess': '来店対応を記録しました',
  'leadDetail.siteInspectionReason': '視察案内 — {name}',
  'leadDetail.siteInspectionSuccess': '視察タスクを作成しました',
  'leadDetail.followReason': 'フォローアップ — {name}',
  'leadDetail.followSuccess': 'フォローアップタスクを作成しました',
  'leadDetail.moveToStage': 'ステージへ移動',
  'leadDetail.stageChanged': 'ステージを「{stage}」に変更しました',
  'leadDetail.assignTo': '担当者を選択',
  'leadDetail.dubaiDesk': 'ドバイデスク',
  'leadDetail.tokyoOffice': '東京オフィス',
  'leadDetail.assignedTo': '{name} に割り当てました',
  'leadDetail.editLead': 'リードを編集',
  'leadDetail.name': '氏名',
  'leadDetail.company': '会社名',
  'leadDetail.nameRequired': '氏名は必須です。',
  'leadDetail.wantsToMeetTitle': '「対面希望」を記録',
  'leadDetail.wantsToMeetBody': 'WhatsApp・LINE・電話などシステム外でのやり取りを記録します。あなたの記録として登録されます。',
  'leadDetail.wantsToMeetPlaceholder': 'メモ（任意）— 例：ドバイオフィスへの訪問を希望',
  'leadDetail.record30': '+30を記録',
  'leadDetail.wantsToMeetSuccess': '+30を記録しました — 対面希望',
  'leadDetail.setContactDateTitle': '連絡日を設定',
  'leadDetail.today': '本日',
  'leadDetail.tomorrow': '明日',
  'leadDetail.plus3Days': '3日後',
  'leadDetail.plus1Week': '1週間後',
  'leadDetail.contactDateReason': '連絡日設定 — {label}',
  'leadDetail.contactDateSuccess': '連絡日を設定しました',
  'leadDetail.consentGranted': '同意あり',
  'leadDetail.consentWithdrawn': '同意撤回',
  'leadDetail.consentUnknown': '不明',

  // ---------------------------------------------------------------------
  // pipeline
  // ---------------------------------------------------------------------
  'pipeline.title': '商談パイプライン',
  'pipeline.subtitle': '対応中 {count} 件・{scope}',
  'pipeline.scopeAll': '全員のパイプライン',
  'pipeline.scopeMine': '自分のパイプラインのみ',
  'pipeline.loadFailed': 'パイプラインを読み込めませんでした。',
  'pipeline.emptyTitle': 'パイプラインにはまだ何もありません',
  'pipeline.emptyBody': '各ステージにアクティブなリードが表示されます。列を引き下げて更新できます。',
  'pipeline.noLeadsAtStage': 'このステージにはリードがありません。',
  'pipeline.noActivity': 'アクティビティなし',
  'pipeline.ownerLine': '担当 · {name}',
  'pipeline.moveStage': '変更',
  'pipeline.moveTitle': '「{name}」を移動',

  // ---------------------------------------------------------------------
  // dashboard
  // ---------------------------------------------------------------------
  'dashboard.title': 'ダッシュボード',
  'dashboard.subtitle': '営業状況サマリー',
  'dashboard.loadFailed': 'ダッシュボードを読み込めませんでした。',
  'dashboard.emptyTitle': 'まだデータがありません',
  'dashboard.emptyBody': 'リードが入り始めるとKPI・推移・ファネル・ホットリードがここに表示されます。下に引いて更新してください。',
  'dashboard.scoreDetail': 'スコア詳細 →',
  'dashboard.noTrendData': '推移データがまだありません。',
  'dashboard.noRegionData': '地域データがまだありません。',
  'dashboard.noFunnelData': 'ファネルデータがまだありません。',
  'dashboard.noHotLeads': '現在ホットリードはありません。',
  'dashboard.noPermissionPerRep': '担当者別データを閲覧する権限がありません。',
  'dashboard.noRepData': '担当者データがまだありません。',
  'dashboard.noSourceData': '流入元データがまだありません。',
  'dashboard.pipelineWeighted': 'パイプライン加重',
  'dashboard.leadsWithEmail': '有効メール保有リード',
  'dashboard.allTime': '全期間',
  'dashboard.cumulative': '累計',
  'dashboard.recentWindowDelta': '{arrow} 直近{window}日 {sign}{delta}',
  'dashboard.trendFootnote': 'APIのtrendは直近{days}日分の日次データです（デモの「過去8週間」表示とは期間の単位が異なります）。',
  'dashboard.regionNote': '地域別のリード分布です（商談予約のみに絞った地域内訳は API に未実装）。',
  'dashboard.funnelNote': 'バー幅は視認性のため対数スケール、割合は全ステージ合計に対する比率です。実際のパイプライン段階別リード数です（配信/開封/クリック単位のメール指標は API に未実装）。',
  'dashboard.reserved': '予約済',
  'dashboard.needsFollowUp': '要フォロー',
  'dashboard.noActivityNote': 'アクティビティなし',
  'dashboard.aiPrefix': '✨ AI: ',
  'dashboard.repHeaderName': '担当者',
  'dashboard.repHeaderBooked': '予約',
  'dashboard.repHeaderNegotiation': '商談',
  'dashboard.repHeaderWon': '成約',
  'dashboard.repHeaderRevenue': '売上',
  'dashboard.officeTokyo': '東京',
  'dashboard.officeDubai': 'ドバイ',
  'dashboard.repNote': '商談中件数・売上は担当者別の内訳が API にまだありません。',
  'dashboard.sourceNote': 'すべてのリードは最初の接点（流入元）まで遡って追跡できます。',
  'dashboard.hintTrend': '過去の推移（累計）',
  'dashboard.hintRegionTotal': '累計{count}件',
  'dashboard.hintFunnel': 'ステージ別ファネル',
  'dashboard.legendMeetingsBooked': '商談予約',
  'dashboard.legendInNegotiation': '商談化',
  'dashboard.legendCumulativeCount': '（累計{count}件）',
  'dashboard.donutCenterLabel': 'リード数',
  'dashboard.countSuffix': '{count}件',

  // ---------------------------------------------------------------------
  // tracking
  // ---------------------------------------------------------------------
  'tracking.title': '反応検知・興味スコアリング',
  'tracking.subtitle': '今週 {count} 件が40点を突破',
  'tracking.thresholdLabel': 'しきい値',
  'tracking.thresholdExplainEn': 'Only leads scoring at or above this line notify a rep. It is the same threshold scoring.explain() checks server-side.',
  'tracking.thresholdExplainJa': 'この数値以上のリードだけが営業に通知されます。サーバー側の scoring.explain() と同じしきい値です。',
  'tracking.thresholdNote': 'このスコア以上のリードのみ営業に通知されます。{extra}',
  'tracking.thresholdNoteExtra': ' 今週 {count} 件がこの基準を超えました。',
  'tracking.scoringModel': 'スコアリングモデル',
  'tracking.loadModelFailed': 'スコアリングモデルを読み込めませんでした。',
  'tracking.behaviourGroup': '行動データ（減衰あり）',
  'tracking.factGroup': '事実（減衰なし）',
  'tracking.ruleExplainEn': '"{label}" adds +{points} points {decay}.',
  'tracking.ruleExplainDecayBehaviour': 'and fades over time (halves at 60 days, zero at 120)',
  'tracking.ruleExplainDecayFact': 'permanently — this fact never decays',
  'tracking.ruleExplainJa': '「{label}」は+{points}点。{decay}',
  'tracking.ruleExplainDecayBehaviourJa': '60日で半減、120日でゼロに減衰します。',
  'tracking.ruleExplainDecayFactJa': '事実データのため減衰しません。',
  'tracking.liveActivity': 'ライブアクティビティ',
  'tracking.noActivityYet': 'まだアクティビティがありません',
  'tracking.noActivityBody': '開封・クリック・返信が発生するとここに表示されます。',
  'tracking.loadFeedFailed': 'アクティビティフィードを読み込めませんでした。',
  'tracking.selectLead': 'リードを選択してください',
  'tracking.selectLeadBody': '左のアクティビティ行を選択すると、そのリードの詳細が表示されます。',

  // ---------------------------------------------------------------------
  // nurture
  // ---------------------------------------------------------------------
  'nurture.title': 'ステップメール（自動ナーチャリング）',
  'nurture.subtitle': 'シーケンス {count} 件',
  'nurture.forbidden': 'ステップメールはあなたの権限には含まれていません。',
  'nurture.loadFailed': 'シーケンスを読み込めませんでした。',
  'nurture.emptyTitle': 'シーケンスがありません',
  'nurture.emptyBody': 'シーケンスが作成されるとここに表示されます。',
  'nurture.stepsSent': '{steps} ステップ・{sent} 件送信済み',
  'nurture.active': '有効',
  'nurture.paused': '一時停止',
  'nurture.selectSequence': 'シーケンスを選択してください',
  'nurture.selectSequenceBody': '左のリストからシーケンスを選択すると詳細が表示されます。',

  // ---------------------------------------------------------------------
  // sns
  // ---------------------------------------------------------------------
  'sns.title': 'SNS企画・コンテンツ導線',
  'sns.forbidden': 'SNS企画はあなたの権限には含まれていません。',
  'sns.loadFailed': 'SNSコンテンツを読み込めませんでした。',
  'sns.notTracked': '手入力',
  'sns.funnel': '導線',
  'sns.funnelExplainEn': '"{label}" — {count} leads at this stage of the SNS funnel, computed from real fixture leads (source = sns), not invented.',
  'sns.funnelExplainJa': '「{label}」— {count}件。SNS由来リード（source = sns）から算出。',
  'sns.pattern': 'パターン {key}',
  'sns.leadsProducedUnknown': '獲得リード数：パターン別集計は未実装',
  'sns.leadsProduced': '獲得リード数：{count}',
  'sns.totalLeads': 'SNS経由の合計リード数 {count} 件。',

  // ---------------------------------------------------------------------
  // settings
  // ---------------------------------------------------------------------
  'settings.notificationsTitle': 'プッシュ通知',
  'settings.loadFailed': '通知設定を読み込めませんでした。',
  'settings.registered': 'この端末でプッシュ通知が登録されています',
  'settings.notRegistered': 'まだプッシュ通知が登録されていません',
  'settings.registerDevice': 'この端末を登録',
  'settings.registering': '登録中…',
  'settings.permissionDenied': '通知の権限が拒否されました — 設定で有効にすると通知を受け取れます。',
  'settings.noProjectId': 'EAS プロジェクトIDが未設定のため、このビルドではリモートプッシュを登録できません。',
  'settings.registerSuccess': 'プッシュ通知を登録しました。',
  'settings.registerFailed': 'プッシュ登録に失敗しました：{error} — シミュレーターでは想定内の動作です。',
  'settings.permissionNotGranted': '通知の権限がありません — 先に登録してください。',
  'settings.testSent': '送信しました — この端末にローカル通知をスケジュールしました。',
  'settings.testSendFailed': '送信できませんでした：{error}',
  'settings.eventsThatNotify': '通知するイベント',
  'settings.managerOnly': ' · マネージャーのみ',
  'settings.test': 'テスト送信',
  'settings.testNote': 'この端末に実際のローカル通知を今すぐ送信します。他の人の端末へのリモートプッシュには EAS のプッシュ資格情報が必要ですが、このビルドでは未設定です。',
  'settings.sendTest': 'テスト通知を送信',
  'settings.sending': '送信中…',
  'settings.language': '言語',
  'settings.languageNote': 'アプリ全体が即座に切り替わります — 再起動は不要です。',
  'settings.languageEnglish': 'English',
  'settings.languageJapanese': '日本語',

  // ---------------------------------------------------------------------
  // demo banner
  // ---------------------------------------------------------------------
  'demo.banner': 'デモデータ・実データではありません',

  // ---------------------------------------------------------------------
  // state views
  // ---------------------------------------------------------------------
  'state.retryDefault': '再試行',

  // ---------------------------------------------------------------------
  // explain mode
  // ---------------------------------------------------------------------
  'explain.toggle': '解説',

  // ---------------------------------------------------------------------
  // task card
  // ---------------------------------------------------------------------
  'task.typeCall': '電話',
  'task.typeEmail': 'メール',
  'task.typeMeeting': '商談',
  'task.typeFollowUp': 'フォローアップ',
  'task.typeShowroomVisit': 'ショールーム来店',
  'task.typeOther': 'タスク',
  'task.reassign': '再割当',
  'task.snooze': 'スヌーズ',
  'task.done': '完了',

  // ---------------------------------------------------------------------
  // lead list item / badges
  // ---------------------------------------------------------------------
  'lead.unassigned': '未割当',
  'lead.noActivity': 'アクティビティなし',
  'lead.ownerLine': '担当 · {name}',
  'lead.ownerUnassigned': '担当 · 未割当',
  'badge.roleAdmin': '管理者',
  'badge.roleMarketing': 'マーケティング',
  'badge.roleOfficeManager': 'オフィスマネージャー',
  'badge.roleSales': '営業',
  'badge.exitLost': '失注',
  'badge.exitTooEarly': '時期尚早',
  'badge.exitUnreachable': '連絡不可',
  'badge.exitUnsubscribed': '配信停止',

  // ---------------------------------------------------------------------
  // sidebar / compact tab bar
  // ---------------------------------------------------------------------
  'sidebar.openSettings': '{name}さん、設定を開く',

  // ---------------------------------------------------------------------
  // voice memo
  // ---------------------------------------------------------------------
  'voiceMemo.micDenied': 'マイクの権限が拒否されました — 設定で有効にすると音声メモを録音できます。',
  'voiceMemo.tooShort': '録音時間が短すぎるため保存できませんでした。',
  'voiceMemo.record': '音声メモを録音',
  'voiceMemo.stop': '停止 · {duration}',
  'voiceMemo.saving': '保存中…',
  'voiceMemo.loading': 'メモを読み込み中…',
  'voiceMemo.loadFailed': '音声メモを読み込めませんでした。',
  'voiceMemo.empty': 'このリードにはまだ音声メモがありません。',
  'voiceMemo.transcriptionUnavailable': '文字起こしは利用できません',

  // ---------------------------------------------------------------------
  // AI reply modal
  // ---------------------------------------------------------------------
  'aiReply.title': 'AI返信案',
  'aiReply.modelNotConnected': 'モデル未接続',
  'aiReply.received': '受信 {date}{voided}',
  'aiReply.markedNotReal': ' · 実際ではないとマーク済み',
  'aiReply.isHuman': '本人か',
  'aiReply.wantsToMeet': '対面希望か',
  'aiReply.partnership': 'パートナーシップ',
  'aiReply.hasBudget': '予算あり',
  'aiReply.draftLabel': '下書き',
  'aiReply.notConnectedNote': 'AIモデルは未接続です。下欄に返信を入力してください。',
  'aiReply.placeholder': '返信を入力…',
  'aiReply.nothingToSave': '保存する内容がありません — まず返信を入力してください。',
  'aiReply.typeBeforeSend': '送信前に返信を入力してください — AIモデルは接続されていません。',
  'aiReply.sentLabel': '送信済み：「{text}」',
  'aiReply.saveDraft': '✏️ 下書きを保存',
  'aiReply.saving': '保存中…',
  'aiReply.approveAndSend': '承認して送信',
  'aiReply.sending': '送信中…',
  'aiReply.notReal': 'これは実際ではなかった — ポイントを取り消す',
  'aiReply.removing': '取り消し中…',
  'aiReply.voidedNote': 'ポイントを取り消しました — この返信は実際ではないとマークされています。',

  // ---------------------------------------------------------------------
  // config error screen
  // ---------------------------------------------------------------------
  'configError.title': 'ビルド設定が未完了です',
  'configError.body': 'APIサーバーのアドレス（EXPO_PUBLIC_API_URL）が設定されておらず、デモモードもオフのため、通信先がありません。実機で誤った推測アドレスに接続することを避けるため、自動推測は行いません。',
  'configError.bodySecondary': 'このビルドを作成した担当者に連絡し、EXPO_PUBLIC_API_URL の設定を依頼してください。',

  // ---------------------------------------------------------------------
  // auth
  // ---------------------------------------------------------------------
  'auth.enterPassword': 'パスワードを入力してください。',
  'auth.unknownDemoUser': '{email} のデモアカウントはありません。admin@ / marketing@ / manager@ / sales@exceed-re.ae のいずれかをお試しください。',
  'auth.emailNotConnected': 'メールログインにはSupabaseの設定が必要です — 未設定の項目: {vars}。それまではモックモード（EXPO_PUBLIC_USE_MOCKS=1）でデモをご利用ください。',
  'auth.googleNotConnected': 'GoogleサインインにはSupabaseの設定が必要です — 未設定の項目: {vars}。',

  // ---------------------------------------------------------------------
  // team
  // ---------------------------------------------------------------------
  'team.title': 'チーム実績',
  'team.subtitle': '担当 {count} 名・アカウンタビリティ',
  'team.loadFailed': 'チームを読み込めませんでした。',
  'team.emptyTitle': 'チームメンバーがいません',
  'team.emptyBody': '管理画面でメンバーを追加してください。',
  'team.escalated': 'エスカレーション {count} 件',
  'team.officeTokyo': '東京オフィス',
  'team.officeDubai': 'ドバイデスク',
  'team.inactive': ' · 無効',
  'team.statLeads': 'リード',
  'team.statOpenTasks': '対応中タスク',
  'team.statOverdue': '遅延',
  'team.statBooked': '予約',
  'team.statWon': '成約',
  'team.wonOverOwned': '成約 / 担当',

  // ---------------------------------------------------------------------
  // memberTasks
  // ---------------------------------------------------------------------
  'memberTasks.title': '担当タスク',
  'memberTasks.subtitle': '未対応タスク {count} 件',
  'memberTasks.loadFailed': 'この担当者を読み込めませんでした。',
  'memberTasks.notFound': 'このチームメンバーは見つかりませんでした。',
  'memberTasks.emptyTitle': '対応中のタスクはありません',
  'memberTasks.emptyBody': '{name} · すべて対応済み',
  'memberTasks.reassignTo': '担当変更先',

  // ---------------------------------------------------------------------
  // admin
  // ---------------------------------------------------------------------
  'admin.title': '管理・ユーザー',
  'admin.subtitle': 'アカウント {count} 件',
  'admin.invite': '招待',
  'admin.loadFailed': 'ユーザーを読み込めませんでした。',
  'admin.emptyTitle': 'ユーザーがいません',
  'admin.emptyBody': '最初のスタッフアカウントを招待してください。',
  'admin.inviteSomeone': '招待する',
  'admin.roleFor': '{name} のロール',
  'admin.selectRole': 'ロールを選択',
  'admin.active': '有効',
  'admin.disabled': '無効',
  'admin.inviteTitle': 'ユーザーを招待',
  'admin.nameFieldLabel': '氏名',
  'admin.emailFieldLabel': 'メール',
  'admin.roleFieldLabel': 'ロール',
  'admin.officeFieldLabel': '拠点',
  'admin.nameEmailRequired': '氏名とメールアドレスは必須です。',
  'admin.inviting': '招待中…',
  'admin.sendInvite': '招待を送信',
  'admin.role': 'ロール',
  'admin.fullNamePlaceholder': '氏名（フルネーム）',

  // ---------------------------------------------------------------------
  // assign
  // ---------------------------------------------------------------------
  'assign.title': '自動アサイン',
  'assign.subtitleShort': '自動アサイン',
  'assign.subtitleFull': '自動アサイン・営業カレンダー',
  'assign.forbidden': '自動アサインはあなたの権限には含まれていません。',
  'assign.loadFailed': 'アサインルールを読み込めませんでした。',
  'assign.rulesTitle': '振り分けルール',
  'assign.emptyTitle': 'ルールがありません',
  'assign.emptyBody': 'ルールが存在しない間、すべてのリードはフォールバック担当者に割り当てられます。',
  'assign.fallbackRep': 'フォールバック担当：{name}',
  'assign.calendarTitle': 'カレンダー — {name}',
  'assign.switchRep': '担当者を切替',
  'assign.loadCalendarFailed': 'カレンダーを読み込めませんでした。',
  'assign.gcalSynced': 'Google カレンダーと同期済み',
  'assign.gcalNotConnected': 'Google カレンダー未接続 — 自社データベースのみ参照',
  'assign.emptyWeekTitle': '今週の予定はありません',
  'assign.emptyWeekBody': 'この担当者の予約された商談がここに表示されます。',
  'assign.assignTo': '担当者を選択',
  'assign.viewCalendarFor': 'カレンダーを表示',
  'assign.dubaiDesk': 'ドバイデスク',
  'assign.tokyoOffice': '東京オフィス',

  // ---------------------------------------------------------------------
  // booking
  // ---------------------------------------------------------------------
  'booking.title': '予約フロー',
  'booking.subtitle': '予約フロー',
  'booking.forbidden': '予約設定はあなたの権限には含まれていません。',
  'booking.loadFailed': '予約設定を読み込めませんでした。',
  'booking.whatClientsSee': '見込み客に見える画面',
  'booking.previewNote': 'アプリ内で表示される3ステップフローの読み取り専用プレビューです — 公開ページではありません。',
  'booking.stepEmailCta': 'メールCTA',
  'booking.stepPickTime': '日時を選択',
  'booking.stepConfirmed': '確定',
  'booking.emailHeadline': 'ドバイは思いのほか暮らしやすい 🇦🇪',
  'booking.emailBody': '今週は旅行者価格と居住者価格を比較しました — 多くの人がその差に驚きます。気になる点があればお気軽にご連絡ください。',
  'booking.ctaRelocate': 'ドバイ移住について相談する',
  'booking.ctaRelocateSub': '生活費・ビザ・エリア・学校',
  'booking.ctaInvest': '不動産投資について相談する',
  'booking.ctaInvestSub': 'ドバイ＆ロンボク：利回り・管理・出口戦略',
  'booking.ctaLombok': 'ロンボク視察について聞く',
  'booking.ctaLombokSub': '経済特区に隣接する開発ストーリー',
  'booking.confirmedTitle': '予約確定',
  'booking.confirmedBody': '確定時：担当者のカレンダーにDB上で予定が作成され、担当者にプッシュ通知が届き、リードスコア+20・ステージが「商談予約」に更新、クライアントには確認メールが送信されます。',
  'booking.notConfigured': '公開予約ページは対象外です。独自ドメインと公開ホスティングが必要です。このプレビューはフローを示すのみで、クライアントからはまだアクセスできません。',
  'booking.meetingTypes': '相談タイプ',
  'booking.durationMinutes': '{count}分',
  'booking.change': '変更',
  'booking.jstGapNote': '日本時間はドバイ時間（GST）より{hours}時間進んでいます。以下の枠は日本時間で表示しています。',
  'booking.openSlots': '今週の空き枠',
  'booking.emptySlotsTitle': '空き枠がありません',
  'booking.emptySlotsBody': 'この担当者の今週の空き枠は設定されていません。',
  'booking.assignRep': '担当者を選択',

  // ---------------------------------------------------------------------
  // cardScan
  // ---------------------------------------------------------------------
  'cardScan.title': '名刺スキャン',
  'cardScan.subtitle': '名刺スキャン（AI-OCR）',
  'cardScan.forbidden': '名刺スキャンはあなたの権限には含まれていません。',
  'cardScan.cameraDenied': 'カメラの権限が拒否されました。下の項目を手入力するか、設定でカメラを有効にして再度お試しください。',
  'cardScan.libraryDenied': '写真ライブラリの権限が拒否されました。下の項目を手入力するか、設定でライブラリへのアクセスを有効にしてください。',
  'cardScan.nameRequired': '氏名は必須です — 自動抽出は未接続のため、少なくとも氏名を入力してください。',
  'cardScan.imageRequired': '名刺の写真が必要です — リードを登録する前に撮影するかライブラリから選択してください。',
  'cardScan.consentRequired': 'リードとして登録する前に同意の取得が必要です。',
  'cardScan.matchedExisting': '既存リードと一致',
  'cardScan.leadCreated': 'リードを登録しました',
  'cardScan.matchedBody': 'この名刺は{matchedOn}により既存リードと一致しました — 重複登録はされていません。名刺画像と同意情報は既存リードに紐付けられました。',
  'cardScan.contactInfo': '連絡先情報',
  'cardScan.openLead': 'リードを開く',
  'cardScan.scanAnother': '別の名刺をスキャン',
  'cardScan.takePhoto': '📷 撮影',
  'cardScan.chooseLibrary': '🖼 ライブラリから選択',
  'cardScan.ocrReady': '撮影すると端末内で文字を読み取ります。外部には送信されません。',
  'cardScan.ocrReading': '名刺を読み取っています…',
  'cardScan.ocrFilled': '{n}項目を自動入力しました。ご確認ください（不確かな項目は空欄のままです）。',
  'cardScan.ocrNothing': '確実に読み取れませんでした。下に入力してください。',
  'cardScan.ocrUnavailable': 'この端末では文字認識を利用できません。下に入力してください。',
  'cardScan.ocrNotWired': 'OCRは未接続のため自動抽出は行われません。読み取れる項目のみ下に手入力してください。不明な項目は空欄のままにしてください。',
  'cardScan.fieldName': '氏名',
  'cardScan.fieldReading': '読み',
  'cardScan.fieldCompany': '会社名',
  'cardScan.fieldTitle': '役職',
  'cardScan.fieldEmail': 'メール',
  'cardScan.fieldPhone': '電話番号',
  'cardScan.fieldAddress': '住所',
  'cardScan.consentText': 'ドバイ・ロンボクの不動産に関する連絡について同意を得ました。',
  'cardScan.creating': '登録中…',
  'cardScan.createLead': 'リードを登録',

  // ---------------------------------------------------------------------
  // import
  // ---------------------------------------------------------------------
  'import.title': 'CSV / Excel 取込',
  'import.subtitle': 'CSV / Excel 取込',
  'import.forbidden': 'CSV取込はあなたの権限には含まれていません。',
  'import.noRows': 'このファイルには読み取れる行がありません。ヘッダー行のあるCSVか確認してください。',
  'import.completeTitle': '取込が完了しました',
  'import.newLeads': '新規リード',
  'import.duplicatesSkipped': '重複をスキップ',
  'import.consentRecorded': '同意状態：{state}',
  'import.importAnother': '別のファイルを取り込む',
  'import.emptyTitle': 'ファイルが選択されていません',
  'import.emptyBody': 'CSVまたはExcelファイルを選択してください — 取込前にヘッダーと不明なカラムを確認します。',
  'import.sheetTitle': 'どのシートですか？',
  'import.sheetBody': 'このブックには複数のシートがあります。シートを選ぶまで、1行も読み込みません。',
  'import.sheetCount': '{count} シート',
  'import.chooseDifferentFile': '別のファイルを選択',
  'import.chooseFile': 'ファイルを選択',
  'import.working': '処理中…',
  'import.readingFile': 'ファイルを読み込み中…',
  'import.analyzingColumns': 'カラムを解析中…',
  'import.rowCount': '{count} 行',
  'import.columns': 'カラムの意味を確認',
  'import.sampleValues': '例：{values}',
  'import.mappedTo': '{target} に対応付け済み',
  'import.ignore': '無視',
  'import.preview': 'プレビュー',
  'import.previewEmpty': '上のカラムの質問に回答するとマッピング済みプレビューが表示されます。',
  'import.consent': '同意状態',
  'import.consentWarning': 'このバッチの同意状態を明示的に設定してください。「不明」で取り込んだ行は、同意が確認されるまでメール送信できません — これはプロジェクト最大の法的リスクです。',
  'import.consentUnknown': '不明',
  'import.consentGranted': '同意あり',
  'import.consentWithdrawn': '同意撤回',
  'import.blockedNote': 'あと {count} 件のカラムの質問に回答してから取り込んでください。',
  'import.importing': '取込中…',
  'import.importRows': '{count} 行を取り込む',

  // ---------------------------------------------------------------------
  // integrations
  // ---------------------------------------------------------------------
  'integrations.title': 'システム連携',
  'integrations.forbidden': 'システム連携はあなたの権限には含まれていません。',
  'integrations.loadFailed': '連携状況を読み込めませんでした。',
  'integrations.connectedTools': '連携ツール',
  'integrations.needs': '必要なもの：{what}',
  'integrations.readOnly': '読み取り専用',
  'integrations.recordsCount': '{count} 件・',
  'integrations.lastSynced': '最終同期 {date}',
  'integrations.neverSynced': '未同期',
  'integrations.connected': '接続済み',
  'integrations.notConnected': '未接続',
  'integrations.syncTitle': 'GoHighLevel 同期',
  'integrations.syncNote': '同期はGoHighLevelからExceed Boxへレコードを取り込みます。監査と競合ルールが整備されるまでは読み取り専用です。',
  'integrations.syncing': '同期中…',
  'integrations.syncNow': '今すぐ同期',
  'integrations.syncGated': '同期の実行は管理者のみ可能です。',

  // ---------------------------------------------------------------------
  // nurtureSequenceDetail
  // ---------------------------------------------------------------------
  'nurtureDetail.title': 'シーケンス',
  'nurtureDetail.forbidden': 'ステップメールはあなたの権限には含まれていません。',
  'nurtureDetail.loadFailed': 'このシーケンスを読み込めませんでした。',
  'nurtureDetail.subtitle': '送信 {sent} 件・{steps} ステップ',
  'nurtureDetail.dedupeNote': '同じメールが2度届くことはありません — 送信履歴テーブルで厳格に管理されています。',
  'nurtureDetail.steps': 'ステップ',
  'nurtureDetail.theRealQuestion': '本当の質問',
  'nurtureDetail.questionExplainEn': 'D9: every step-mail in this sequence is really asking one question in disguise. This one asks: "{question}"',
  'nurtureDetail.questionExplainJa': '各ステップメールは「質問」を隠して届けています（D9）。この回の意図：{question}',
  'nurtureDetail.cta': 'CTA · {cta}',
  'nurtureDetail.statSent': '送信',
  'nurtureDetail.statOpened': '開封',
  'nurtureDetail.statClicked': 'クリック',
  'nurtureDetail.viewOnly': '閲覧のみ — ステップメールの編集には管理者またはマーケティング権限が必要です。',
  'nurtureDetail.exitConditions': '離脱条件',
  'nurtureDetail.provisional': '未確定',

  // ---------------------------------------------------------------------
  // dates
  // ---------------------------------------------------------------------
  'dates.overdueByMinutes': '{n}分遅延',
  'dates.dueInMinutes': 'あと{n}分',
  'dates.overdueByHours': '{n}時間遅延',
  'dates.dueInHours': 'あと{n}時間',
  'dates.overdueByDays': '{n}日遅延',
  'dates.dueInDays': 'あと{n}日',
  'dates.relativeMinutes': '{n}分前',
  'dates.relativeHours': '{n}時間前',
  'dates.relativeDays': '{n}日前',
};

// Re-exported so call sites can `import { en, ja } from '../i18n'` symmetrically.
export { en };
