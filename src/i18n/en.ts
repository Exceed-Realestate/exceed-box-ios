/**
 * English strings. `ja.ts` must define exactly this key set — see index.tsx: `ja` is typed as
 * `Record<TranslationKey, string>`, so a missing or misspelled key on either side is a compile
 * error, not a silent fallback to English.
 *
 * Flat, dot-namespaced keys (`'today.title'`) rather than nested objects — easier to grep for a
 * screen's strings and to keep `en`/`ja` mechanically diffable key-by-key.
 */
export const en = {
  // ---------------------------------------------------------------------
  // common — shared chrome used by many screens/components
  // ---------------------------------------------------------------------
  'common.retry': 'Retry',
  'common.retrying': 'Retrying…',
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.save': 'Save',
  'common.saving': 'Saving…',
  'common.loading': 'Loading…',
  'common.loadingMore': 'Loading more…',
  'common.dismiss': 'Dismiss',
  'common.noOptionsAvailable': 'No options available.',
  'common.somethingWentWrong': 'Something went wrong',
  'common.actionFailed': 'Action failed',
  'common.genericError': 'Something went wrong.',
  'common.forbidden': "You don't have permission to do that.",
  'common.unassigned': 'Unassigned',
  'common.owner': 'Owner',
  'common.more': 'More',
  'common.whatIsThis': 'What is this?',
  'common.explain': 'Explain',
  'common.whereNumberComesFrom': 'WHERE THE NUMBER COMES FROM',

  // ---------------------------------------------------------------------
  // nav — tab bar / sidebar / stack header titles
  // ---------------------------------------------------------------------
  'nav.today': 'Today',
  'nav.leads': 'Leads',
  'nav.pipeline': 'Pipeline',
  'nav.tracking': 'Tracking',
  'nav.dashboard': 'Dashboard',
  'nav.team': 'Team',
  'nav.nurture': 'Nurture',
  'nav.sns': 'SNS',
  'nav.booking': 'Booking',
  'nav.assign': 'Assign',
  'nav.integrations': 'Integrations',
  'nav.admin': 'Admin',
  'nav.settings': 'Settings',
  'nav.lead': 'Lead',
  'nav.repTasks': 'Rep tasks',
  'nav.sequence': 'Sequence',
  'nav.cardScan': 'Card scan',
  'nav.import': 'Import',

  // ---------------------------------------------------------------------
  // login
  // ---------------------------------------------------------------------
  'login.headlinePre': 'Welcome\nback to\n',
  'login.headlineBrand': 'Exceed Box.',
  'login.googleContinue': 'Continue with Google',
  'login.signingIn': 'Signing in…',
  'login.accountNote': 'Exceed accounts only',
  'login.emailSignIn': 'Sign in with email',
  'login.legal': 'For Exceed Real Estate employees only',
  'login.demoHint': 'DEMO — tap either button. Email sign-in:\nadmin@ / manager@ / marketing@ / sales@exceed-re.ae\nany password',
  'login.devAuthHint': 'LIVE BACKEND · developer sign-in (no Supabase yet).\nUse a staff email from the backend roster — any password.',
  'login.signInTitle': 'Sign in',
  'login.emailLabel': 'Email',
  'login.passwordLabel': 'Password',
  'login.signInButton': 'Sign in',
  'login.forgotPassword': 'Forgot password?',
  'login.forgotNote': 'Ask an admin to reset it for now.',
  'login.language': 'Language',

  // ---------------------------------------------------------------------
  // today
  // ---------------------------------------------------------------------
  'today.title': 'Today',
  'today.subtitle': '{count} open · {name}',
  'today.emptyTitle': 'Nothing due right now',
  'today.emptyBody': 'Everything due is handled.',
  'today.loadFailed': 'Could not load your tasks.',

  // ---------------------------------------------------------------------
  // leads
  // ---------------------------------------------------------------------
  'leads.title': 'Leads',
  'leads.subtitle': '{count} lead{s} · {scope}',
  'leads.scopeAll': 'All office',
  'leads.scopeMine': 'Yours only',
  'leads.import': 'Import',
  'leads.scan': 'Scan',
  'leads.searchPlaceholder': 'Search name, email, company…',
  'leads.filterAll': 'All',
  'leads.loadFailed': 'Could not load leads.',
  'leads.emptyFilteredTitle': 'No leads match this filter',
  'leads.emptyTitle': 'No leads yet',
  'leads.emptyFilteredBody': 'Try clearing the search or filter to see the full list.',
  'leads.emptyBody': 'New leads will appear here automatically.',
  'leads.clearFilters': 'Clear filters',
  'leads.selectLead': 'Select a lead',
  'leads.selectLeadBody': 'Choose a lead on the left to see its full detail here.',

  // ---------------------------------------------------------------------
  // lead detail
  // ---------------------------------------------------------------------
  'leadDetail.loadFailed': 'Could not load this lead.',
  'leadDetail.contact': 'Contact',
  'leadDetail.email': 'Email',
  'leadDetail.phone': 'Phone',
  'leadDetail.consentState': 'Contact allowed',
  'leadDetail.consentBasis': 'Consent basis',
  'leadDetail.consentObtainedVia': 'Obtained via',
  'leadDetail.consentObtainedAt': 'Obtained on',
  'leadDetail.consentBasisExplicit': 'Explicit — they opted in',
  'leadDetail.consentBasisImplied': 'Implied — existing business relationship',
  'leadDetail.consentBasisAmbiguous': 'Ambiguous — needs confirming before sending',
  'leadDetail.consentBasisUnknown': 'Not recorded — do not send',
  'leadDetail.consentBasisWithdrawn': 'Withdrawn — never send again',
  'leadDetail.contactHidden': 'Contact details and consent are hidden — you see this lead in aggregate only, not attached to an owner.',
  'leadDetail.categories': 'Categories',
  'leadDetail.region': 'Region',
  'leadDetail.purpose': 'Purpose',
  'leadDetail.relationship': 'Relationship',
  'leadDetail.source': 'Source',
  'leadDetail.owner': 'Owner',
  'leadDetail.scoreBreakdown': 'Score breakdown',
  'leadDetail.noScoringSignals': 'No scoring signals yet.',
  'leadDetail.timeline': 'Timeline',
  'leadDetail.channels': 'Channels',
  'leadDetail.noChannels': 'No channels recorded.',
  'leadDetail.firstTouch': 'first touch',
  'leadDetail.replies': 'Replies',
  'leadDetail.loadingReplies': 'Loading…',
  'leadDetail.notReal': 'not real',
  'leadDetail.replied': 'replied',
  'leadDetail.aiReply': '✨ AI reply',
  'leadDetail.voiceNotes': 'Voice notes',
  'leadDetail.actions': 'Actions',
  'leadDetail.editDetails': 'Edit details',
  'leadDetail.moveStage': 'Move stage',
  'leadDetail.markWantsToMeet': 'Mark: wants to meet (+30)',
  'leadDetail.assignOwner': 'Assign owner',
  'leadDetail.noActions': 'You can view this lead but have no actions available on it with your role.',
  'leadDetail.notifyRep': 'Notify rep',
  'leadDetail.showroomVisit': 'Showroom visit',
  'leadDetail.siteInspection': 'Site inspection',
  'leadDetail.setContactDate': 'Set contact date',
  'leadDetail.follow': 'Follow',
  'leadDetail.notifyRepReason': 'Notify rep about {name}',
  'leadDetail.notifyRepSuccess': 'Rep notified',
  'leadDetail.showroomVisitReason': 'Showroom visit — {name}',
  'leadDetail.showroomVisitSuccess': 'Showroom visit logged',
  'leadDetail.siteInspectionReason': 'Site inspection — {name}',
  'leadDetail.siteInspectionSuccess': 'Inspection task created',
  'leadDetail.followReason': 'Follow up — {name}',
  'leadDetail.followSuccess': 'Follow-up task created',
  'leadDetail.moveToStage': 'Move to stage',
  'leadDetail.stageChanged': 'Stage changed to {stage}',
  'leadDetail.assignTo': 'Assign to',
  'leadDetail.dubaiDesk': 'Dubai desk',
  'leadDetail.tokyoOffice': 'Tokyo office',
  'leadDetail.assignedTo': 'Assigned to {name}',
  'leadDetail.editLead': 'Edit lead',
  'leadDetail.name': 'Name',
  'leadDetail.company': 'Company',
  'leadDetail.nameRequired': 'Name is required.',
  'leadDetail.wantsToMeetTitle': 'Record "wants to meet in person"',
  'leadDetail.wantsToMeetBody': 'For anything said outside the system — WhatsApp, LINE, a phone call. This is attributed to you.',
  'leadDetail.wantsToMeetPlaceholder': 'Note (optional) — e.g. asked to visit the Dubai office',
  'leadDetail.record30': 'Record +30',
  'leadDetail.wantsToMeetSuccess': '+30 recorded — wants to meet in person',
  'leadDetail.setContactDateTitle': 'Set contact date',
  'leadDetail.today': 'Today',
  'leadDetail.tomorrow': 'Tomorrow',
  'leadDetail.plus3Days': '+3 days',
  'leadDetail.plus1Week': '+1 week',
  'leadDetail.contactDateReason': 'Contact date set — {label}',
  'leadDetail.contactDateSuccess': 'Contact date set',
  'leadDetail.consentGranted': 'Granted',
  'leadDetail.consentWithdrawn': 'Withdrawn',
  'leadDetail.consentUnknown': 'Unknown',

  // ---------------------------------------------------------------------
  // pipeline
  // ---------------------------------------------------------------------
  'pipeline.title': 'Pipeline',
  'pipeline.subtitle': '{count} active · {scope}',
  'pipeline.scopeAll': 'Everyone’s pipeline',
  'pipeline.scopeMine': 'Your own pipeline only',
  'pipeline.loadFailed': 'Could not load the pipeline.',
  'pipeline.emptyTitle': 'Nothing in the pipeline yet',
  'pipeline.emptyBody': 'Active leads will appear here by stage. Pull down on any column to refresh.',
  'pipeline.noLeadsAtStage': 'No leads at this stage.',
  'pipeline.noActivity': 'No activity yet',
  'pipeline.ownerLine': 'OWNER · {name}',
  'pipeline.moveStage': 'Move stage',
  'pipeline.moveTitle': 'Move "{name}"',

  // ---------------------------------------------------------------------
  // dashboard
  // ---------------------------------------------------------------------
  'dashboard.title': 'Dashboard',
  'dashboard.subtitle': 'Sales overview',
  'dashboard.loadFailed': 'Could not load the dashboard.',
  'dashboard.emptyTitle': 'No activity yet',
  'dashboard.emptyBody': 'Once leads start coming in, KPIs, trend, funnel and hot leads will appear here. Pull down to refresh.',
  'dashboard.scoreDetail': 'Score detail →',
  'dashboard.noTrendData': 'No trend data yet.',
  'dashboard.noRegionData': 'No region data yet.',
  'dashboard.noFunnelData': 'No funnel data yet.',
  'dashboard.noHotLeads': 'No hot leads right now.',
  'dashboard.noPermissionPerRep': "You don't have permission to see per-rep numbers.",
  'dashboard.noRepData': 'No rep data yet.',
  'dashboard.noSourceData': 'No source data yet.',
  'dashboard.pipelineWeighted': 'Pipeline-weighted',
  'dashboard.leadsWithEmail': 'Leads with a valid email',
  'dashboard.allTime': 'All time',
  'dashboard.cumulative': 'Cumulative',
  'dashboard.recentWindowDelta': '{arrow} last {window}d {sign}{delta}',
  'dashboard.trendFootnote': "The API's trend covers the last {days} days of daily data (the demo's own \"past 8 weeks\" view uses a different period unit).",
  'dashboard.regionNote': 'Lead distribution by region (a booked-only regional breakdown is not yet implemented on the API).',
  'dashboard.funnelNote': 'Bar width is a log scale for readability; the percentage is each stage’s share of the total across all stages. Real pipeline-stage lead counts (send/open/click email metrics are not implemented on the API).',
  'dashboard.reserved': 'Reserved',
  'dashboard.needsFollowUp': 'Needs follow-up',
  'dashboard.noActivityNote': 'No activity',
  'dashboard.aiPrefix': '✨ AI: ',
  'dashboard.repHeaderName': 'Rep',
  'dashboard.repHeaderBooked': 'Booked',
  'dashboard.repHeaderNegotiation': 'Negotiating',
  'dashboard.repHeaderWon': 'Won',
  'dashboard.repHeaderRevenue': 'Revenue',
  'dashboard.officeTokyo': 'Tokyo',
  'dashboard.officeDubai': 'Dubai',
  'dashboard.repNote': 'Per-rep negotiation count and revenue breakdowns are not yet on the API.',
  'dashboard.sourceNote': 'Every lead can be traced back to its first touchpoint (source).',
  'dashboard.hintTrend': 'Trend to date (cumulative)',
  'dashboard.hintRegionTotal': '{count} total',
  'dashboard.hintFunnel': 'Funnel by stage',
  'dashboard.legendMeetingsBooked': 'Meetings booked',
  'dashboard.legendInNegotiation': 'In negotiation',
  'dashboard.legendCumulativeCount': ' (cumulative {count})',
  'dashboard.donutCenterLabel': 'Leads',
  'dashboard.countSuffix': '{count}',

  // ---------------------------------------------------------------------
  // tracking
  // ---------------------------------------------------------------------
  'tracking.title': 'Tracking',
  'tracking.subtitle': '{count} crossed 40+ this week',
  'tracking.thresholdLabel': 'THRESHOLD',
  'tracking.thresholdExplainEn': 'Only leads scoring at or above this line notify a rep. It is the same threshold scoring.explain() checks server-side.',
  'tracking.thresholdExplainJa': 'この数値以上のリードだけが営業に通知されます。サーバー側の scoring.explain() と同じしきい値です。',
  'tracking.thresholdNote': 'Only leads at or above this score notify a rep.{extra}',
  'tracking.thresholdNoteExtra': ' {count} lead{s} crossed it this week.',
  'tracking.scoringModel': 'Scoring model',
  'tracking.loadModelFailed': 'Could not load the scoring model.',
  'tracking.behaviourGroup': 'Behaviour · fades over time',
  'tracking.factGroup': 'Facts · permanent',
  'tracking.ruleExplainEn': '"{label}" adds +{points} points {decay}.',
  'tracking.ruleExplainDecayBehaviour': 'and fades over time (halves at 60 days, zero at 120)',
  'tracking.ruleExplainDecayFact': 'permanently — this fact never decays',
  'tracking.ruleExplainJa': '「{label}」は+{points}点。{decay}',
  'tracking.ruleExplainDecayBehaviourJa': '60日で半減、120日でゼロに減衰します。',
  'tracking.ruleExplainDecayFactJa': '事実データのため減衰しません。',
  'tracking.liveActivity': 'Live activity',
  'tracking.noActivityYet': 'No activity yet',
  'tracking.noActivityBody': 'Opens, clicks and replies will show up here as they happen.',
  'tracking.loadFeedFailed': 'Could not load the activity feed.',
  // SPEC-V2 §11 master-detail (iPad regular width) — empty-detail-pane state before a lead is selected.
  'tracking.selectLead': 'Select a lead',
  'tracking.selectLeadBody': 'Choose an activity row on the left to see that lead’s full detail here.',

  // ---------------------------------------------------------------------
  // nurture
  // ---------------------------------------------------------------------
  'nurture.title': 'Nurture',
  'nurture.subtitle': '{count} sequence{s}',
  'nurture.forbidden': "Nurture sequences aren't part of your role.",
  'nurture.loadFailed': 'Could not load sequences.',
  'nurture.emptyTitle': 'No sequences yet',
  'nurture.emptyBody': 'Nurture sequences will appear here once one is created.',
  'nurture.stepsSent': '{steps} steps · {sent} sent',
  'nurture.active': 'Active',
  'nurture.paused': 'Paused',
  // SPEC-V2 §11 master-detail (iPad regular width) — empty-detail-pane state before a sequence is selected.
  'nurture.selectSequence': 'Select a sequence',
  'nurture.selectSequenceBody': 'Choose a sequence on the left to see its steps here.',

  // ---------------------------------------------------------------------
  // sns
  // ---------------------------------------------------------------------
  'sns.title': 'SNS',
  'sns.forbidden': "SNS content planning isn't part of your role.",
  'sns.loadFailed': 'Could not load SNS content.',
  'sns.notTracked': 'entered by hand',
  'sns.funnel': 'Funnel',
  'sns.funnelExplainEn': '"{label}" — {count} leads at this stage of the SNS funnel, computed from real fixture leads (source = sns), not invented.',
  'sns.funnelExplainJa': '「{label}」— {count}件。SNS由来リード（source = sns）から算出。',
  'sns.pattern': 'Pattern {key}',
  'sns.leadsProducedUnknown': 'Leads produced: not tracked per pattern yet',
  'sns.leadsProduced': 'Leads produced: {count}',
  'sns.totalLeads': '{count} lead{s} sourced from SNS in total.',

  // ---------------------------------------------------------------------
  // settings (NotificationSettingsScreen)
  // ---------------------------------------------------------------------
  'settings.notificationsTitle': 'Notifications',
  'settings.loadFailed': 'Could not load notification settings.',
  'settings.registered': 'Registered for push on this device',
  'settings.notRegistered': 'Not registered for push yet',
  'settings.registerDevice': 'Register this device',
  'settings.registering': 'Registering…',
  'settings.permissionDenied': 'Notification permission was denied — enable it in Settings to receive alerts.',
  'settings.noProjectId': 'No EAS project ID is configured — cannot register for remote push in this build.',
  'settings.registerSuccess': 'Registered for push.',
  'settings.registerFailed': 'Could not register for push: {error} — this is expected on a simulator.',
  'settings.permissionNotGranted': 'Notification permission is not granted — register first.',
  'settings.testSent': 'Sent — a local notification was scheduled on this device just now.',
  'settings.testSendFailed': 'Could not send: {error}',
  'settings.eventsThatNotify': 'Events that notify',
  'settings.managerOnly': ' · manager only',
  'settings.test': 'Test',
  'settings.testNote': "This sends a real local notification to this device right now. Remote push to other people's phones needs EAS push credentials, which are not configured in this build.",
  'settings.sendTest': 'Send test notification',
  'settings.sending': 'Sending…',
  'settings.language': 'Language',
  'settings.languageNote': 'Switches the whole app instantly — no restart needed.',
  'settings.languageEnglish': 'English',
  'settings.languageJapanese': '日本語',

  // ---------------------------------------------------------------------
  // demo banner
  // ---------------------------------------------------------------------
  'demo.banner': 'DEMO DATA — not connected to a real backend',

  // ---------------------------------------------------------------------
  // state views (shared chrome)
  // ---------------------------------------------------------------------
  'state.retryDefault': 'Retry',

  // ---------------------------------------------------------------------
  // explain mode
  // ---------------------------------------------------------------------
  'explain.toggle': 'Explain',

  // ---------------------------------------------------------------------
  // task card
  // ---------------------------------------------------------------------
  'task.typeCall': 'Call',
  'task.typeEmail': 'Email',
  'task.typeMeeting': 'Meeting',
  'task.typeFollowUp': 'Follow up',
  'task.typeShowroomVisit': 'Showroom visit',
  'task.typeOther': 'Task',
  'task.reassign': 'Reassign',
  'task.snooze': 'Snooze',
  'task.done': 'Done',

  // ---------------------------------------------------------------------
  // lead list item / badges
  // ---------------------------------------------------------------------
  'lead.unassigned': 'Unassigned',
  'lead.noActivity': 'No activity yet',
  'lead.ownerLine': 'OWNER · {name}',
  'lead.ownerUnassigned': 'OWNER · UNASSIGNED',
  'badge.roleAdmin': 'Admin',
  'badge.roleMarketing': 'Marketing',
  'badge.roleOfficeManager': 'Office manager',
  'badge.roleSales': 'Sales',
  'badge.exitLost': 'Lost',
  'badge.exitTooEarly': 'Too early',
  'badge.exitUnreachable': 'Unreachable',
  'badge.exitUnsubscribed': 'Unsubscribed',

  // ---------------------------------------------------------------------
  // sidebar / compact tab bar
  // ---------------------------------------------------------------------
  'sidebar.openSettings': '{name}, open Settings',

  // ---------------------------------------------------------------------
  // voice memo
  // ---------------------------------------------------------------------
  'voiceMemo.micDenied': 'Microphone permission was denied — enable it in Settings to record a voice memo.',
  'voiceMemo.tooShort': 'Recording was too short to save.',
  'voiceMemo.record': 'Record a voice memo',
  'voiceMemo.stop': 'Stop · {duration}',
  'voiceMemo.saving': 'Saving…',
  'voiceMemo.loading': 'Loading notes…',
  'voiceMemo.loadFailed': 'Could not load voice memos.',
  'voiceMemo.empty': 'No voice memos on this lead yet.',
  'voiceMemo.transcriptionUnavailable': 'Transcription not available',

  // ---------------------------------------------------------------------
  // AI reply modal
  // ---------------------------------------------------------------------
  'aiReply.title': 'AI reply',
  'aiReply.modelNotConnected': 'model not connected',
  'aiReply.received': 'Received {date}{voided}',
  'aiReply.markedNotReal': ' · marked not real',
  'aiReply.isHuman': 'Human?',
  'aiReply.wantsToMeet': 'Wants to meet?',
  'aiReply.partnership': 'Partnership?',
  'aiReply.hasBudget': 'Budget?',
  'aiReply.draftLabel': 'DRAFT',
  'aiReply.notConnectedNote': 'No AI model is connected — nothing was generated. Type the reply yourself below.',
  'aiReply.placeholder': 'Type a reply…',
  'aiReply.nothingToSave': 'Nothing to save — type a reply first.',
  'aiReply.typeBeforeSend': 'Type a reply before sending — no AI model is connected to draft one for you.',
  'aiReply.sentLabel': 'Sent: "{text}"',
  'aiReply.saveDraft': '✏️ Save draft',
  'aiReply.saving': 'Saving…',
  'aiReply.approveAndSend': 'Approve and send',
  'aiReply.sending': 'Sending…',
  'aiReply.notReal': "This wasn't real — remove the points",
  'aiReply.removing': 'Removing…',
  'aiReply.voidedNote': 'Points removed — this reply is marked not real.',

  // ---------------------------------------------------------------------
  // config error screen
  // ---------------------------------------------------------------------
  'configError.title': "This build isn't configured",
  'configError.body': 'No API server address was set (EXPO_PUBLIC_API_URL) and demo mode is off, so this app has nothing to talk to. It will not guess a local address — on a real device that would mean the phone calling itself.',
  'configError.bodySecondary': 'Contact whoever built this release and ask them to set EXPO_PUBLIC_API_URL.',

  // ---------------------------------------------------------------------
  // auth
  // ---------------------------------------------------------------------
  'auth.enterPassword': 'Enter a password.',
  'auth.unknownDemoUser': 'No demo account for {email}. Try admin@, marketing@, manager@ or sales@exceed-re.ae.',
  'auth.emailNotConnected': 'Email sign-in needs Supabase configured for this build — missing: {vars}. Use mock mode to demo the app (EXPO_PUBLIC_USE_MOCKS=1) until then.',
  'auth.googleNotConnected': 'Google Sign-In needs Supabase configured for this build — missing: {vars}.',

  // ---------------------------------------------------------------------
  // team
  // ---------------------------------------------------------------------
  'team.title': 'Team',
  'team.subtitle': '{count} rep{s} · accountability',
  'team.loadFailed': 'Could not load the team.',
  'team.emptyTitle': 'No team members yet',
  'team.emptyBody': 'Add people in Admin.',
  'team.escalated': '{count} escalated',
  'team.officeTokyo': 'Tokyo office',
  'team.officeDubai': 'Dubai desk',
  'team.inactive': ' · inactive',
  'team.statLeads': 'Leads',
  'team.statOpenTasks': 'Open tasks',
  'team.statOverdue': 'Overdue',
  'team.statBooked': 'Booked',
  'team.statWon': 'Won',
  'team.wonOverOwned': 'Won / owned',

  // ---------------------------------------------------------------------
  // memberTasks
  // ---------------------------------------------------------------------
  'memberTasks.title': 'Rep tasks',
  'memberTasks.subtitle': '{count} open task{s}',
  'memberTasks.loadFailed': 'Could not load this rep.',
  'memberTasks.notFound': 'This team member could not be found.',
  'memberTasks.emptyTitle': 'Nothing open',
  'memberTasks.emptyBody': '{name} · all clear',
  'memberTasks.reassignTo': 'Reassign to',

  // ---------------------------------------------------------------------
  // admin (AdminUsersScreen)
  // ---------------------------------------------------------------------
  'admin.title': 'Admin · Users',
  'admin.subtitle': '{count} account{s}',
  'admin.invite': 'Invite',
  'admin.loadFailed': 'Could not load users.',
  'admin.emptyTitle': 'No one has access yet',
  'admin.emptyBody': 'Invite the first staff account.',
  'admin.inviteSomeone': 'Invite someone',
  'admin.roleFor': 'Role for {name}',
  'admin.selectRole': 'Select a role',
  'admin.active': 'Active',
  'admin.disabled': 'Disabled',
  'admin.inviteTitle': 'Invite a user',
  'admin.nameFieldLabel': 'Name',
  'admin.emailFieldLabel': 'Email',
  'admin.roleFieldLabel': 'Role',
  'admin.officeFieldLabel': 'Office',
  'admin.nameEmailRequired': 'Name and email are required.',
  'admin.inviting': 'Inviting…',
  'admin.sendInvite': 'Send invite',
  'admin.role': 'Role',
  'admin.fullNamePlaceholder': 'Full name',

  // ---------------------------------------------------------------------
  // assign
  // ---------------------------------------------------------------------
  'assign.title': 'Assign',
  'assign.subtitleShort': 'Auto-assign',
  'assign.subtitleFull': 'Auto-assign & sales calendar',
  'assign.forbidden': "Assignment rules aren't part of your role.",
  'assign.loadFailed': 'Could not load assignment rules.',
  'assign.rulesTitle': 'Assignment rules',
  'assign.emptyTitle': 'No rules yet',
  'assign.emptyBody': 'Every lead falls through to the fallback rep until a rule exists.',
  'assign.fallbackRep': 'Fallback rep: {name}',
  'assign.calendarTitle': 'Calendar — {name}',
  'assign.switchRep': 'Switch rep',
  'assign.loadCalendarFailed': 'Could not load the calendar.',
  'assign.gcalSynced': 'Synced with Google Calendar',
  'assign.gcalNotConnected': 'No Google Calendar connection — reads our own database only',
  'assign.emptyWeekTitle': 'No meetings this week',
  'assign.emptyWeekBody': 'Booked meetings for this rep will appear here.',
  'assign.assignTo': 'Assign to',
  'assign.viewCalendarFor': 'View calendar for',
  'assign.dubaiDesk': 'Dubai desk',
  'assign.tokyoOffice': 'Tokyo office',

  // ---------------------------------------------------------------------
  // booking
  // ---------------------------------------------------------------------
  'booking.title': 'Booking',
  'booking.subtitle': 'Booking flow',
  'booking.forbidden': "Booking settings aren't part of your role.",
  'booking.loadFailed': 'Could not load booking settings.',
  'booking.whatClientsSee': 'What clients see',
  'booking.previewNote': 'Read-only preview of the 3-step flow rendered inside the app — nothing here is a live public page.',
  'booking.stepEmailCta': 'Email CTA',
  'booking.stepPickTime': 'Pick a time',
  'booking.stepConfirmed': 'Confirmed',
  'booking.emailHeadline': 'Dubai is, surprisingly, easy to live in 🇦🇪',
  'booking.emailBody': 'This week we compared tourist prices to resident prices — most people are surprised by the gap. If anything here is relevant, get in touch. No pressure.',
  'booking.ctaRelocate': 'Talk about relocating to Dubai',
  'booking.ctaRelocateSub': 'Cost of living · visas · areas · schools',
  'booking.ctaInvest': 'Talk about property investment',
  'booking.ctaInvestSub': 'Dubai & Lombok: yield, management, exit',
  'booking.ctaLombok': 'Ask about the Lombok inspection',
  'booking.ctaLombokSub': 'The development story next to the special economic zone',
  'booking.confirmedTitle': 'Booking confirmed',
  'booking.confirmedBody': "On confirmation: the rep's calendar entry is created in our DB, the rep gets a push notification, lead score +20 and stage → Meeting booked, and the client gets a confirmation email.",
  'booking.notConfigured': 'The public-facing booking page is out of scope — it needs its own domain and public hosting. This preview shows the flow; nothing here is reachable by a client yet.',
  'booking.meetingTypes': 'Meeting types',
  'booking.durationMinutes': '{count} min',
  'booking.change': 'Change',
  'booking.jstGapNote': 'JST is {hours} hours ahead of GST (Dubai). Slot times below are shown in JST.',
  'booking.openSlots': 'Open slots this week',
  'booking.emptySlotsTitle': 'No open slots',
  'booking.emptySlotsBody': 'Reps have no availability configured for this week.',
  'booking.assignRep': 'Assign rep',

  // ---------------------------------------------------------------------
  // cardScan
  // ---------------------------------------------------------------------
  'cardScan.title': 'Card scan',
  'cardScan.subtitle': 'Card scan (AI-OCR)',
  'cardScan.forbidden': "Card scanning isn't part of your role.",
  'cardScan.cameraDenied': 'Camera permission was denied. You can still fill in the card fields by hand below, or enable the camera in Settings and try again.',
  'cardScan.libraryDenied': 'Photo library permission was denied. You can still fill in the card fields by hand below, or enable library access in Settings.',
  'cardScan.nameRequired': 'Name is required — automatic extraction is not connected, so type at least the name.',
  'cardScan.imageRequired': 'A photo of the card is required — take one or choose from your library before creating the lead.',
  'cardScan.consentRequired': 'Consent must be captured before this becomes a lead.',
  'cardScan.matchedExisting': 'Matched an existing lead',
  'cardScan.leadCreated': 'Lead created',
  'cardScan.matchedBody': 'This card matched an existing lead by {matchedOn} — nothing was duplicated. The card image and consent were attached to the existing lead.',
  'cardScan.contactInfo': 'contact info',
  'cardScan.openLead': 'Open lead',
  'cardScan.scanAnother': 'Scan another card',
  'cardScan.takePhoto': '📷 Take photo',
  'cardScan.chooseLibrary': '🖼 Choose from library',
  'cardScan.ocrReady': 'Text is read on the device when you take a photo. Nothing is sent anywhere.',
  'cardScan.ocrReading': 'Reading the card…',
  'cardScan.ocrFilled': 'Filled {n} field(s) from the card. Check them — anything unclear was left blank on purpose.',
  'cardScan.ocrNothing': 'Could not read anything reliably. Type the details below.',
  'cardScan.ocrUnavailable': 'On-device text recognition is not available here. Type the details below.',
  'cardScan.ocrNotWired': 'No OCR provider is wired — nothing is extracted automatically. Type what you can read off the card below; leave anything unclear blank rather than guess.',
  'cardScan.fieldName': 'Name',
  'cardScan.fieldReading': 'Reading',
  'cardScan.fieldCompany': 'Company',
  'cardScan.fieldTitle': 'Title',
  'cardScan.fieldEmail': 'Email',
  'cardScan.fieldPhone': 'Phone',
  'cardScan.fieldAddress': 'Address',
  'cardScan.consentText': 'They agreed to be contacted about Dubai / Lombok real estate.',
  'cardScan.creating': 'Creating…',
  'cardScan.createLead': 'Create lead',

  // ---------------------------------------------------------------------
  // import
  // ---------------------------------------------------------------------
  'import.title': 'Import',
  'import.subtitle': 'CSV / Excel import',
  'import.forbidden': "CSV import isn't part of your role.",
  'import.noRows': 'This file has no readable rows. Confirm it is a CSV with a header row.',
  'import.completeTitle': 'Import complete',
  'import.newLeads': 'New leads',
  'import.duplicatesSkipped': 'Duplicates skipped',
  'import.consentRecorded': 'Consent recorded as: {state}',
  'import.importAnother': 'Import another file',
  'import.emptyTitle': 'No file selected',
  'import.emptyBody': 'Pick a CSV or Excel file — headers and ambiguous columns will be interrogated before anything is imported.',
  'import.sheetTitle': 'Which sheet?',
  'import.sheetBody': 'This workbook has more than one sheet. Nothing is read until you pick one.',
  'import.sheetCount': '{count} sheets',
  'import.chooseDifferentFile': 'Choose a different file',
  'import.chooseFile': 'Choose file',
  'import.working': 'Working…',
  'import.readingFile': 'Reading the file…',
  'import.analyzingColumns': 'Analyzing columns…',
  'import.rowCount': '{count} rows',
  'import.columns': 'Columns',
  'import.sampleValues': 'e.g. {values}',
  'import.mappedTo': 'Mapped to {target}',
  'import.ignore': 'ignore',
  'import.preview': 'Preview',
  'import.previewEmpty': 'Answer the column questions above to see a mapped preview.',
  'import.consent': 'Consent',
  'import.consentWarning': 'Set consent explicitly for this batch. Rows imported as "unknown" cannot be emailed until consent is confirmed — this is the largest legal exposure in the project.',
  'import.consentUnknown': 'Unknown',
  'import.consentGranted': 'Granted',
  'import.consentWithdrawn': 'Withdrawn',
  'import.blockedNote': 'Answer {count} more column question{s} before importing.',
  'import.importing': 'Importing…',
  'import.importRows': 'Import {count} rows',

  // ---------------------------------------------------------------------
  // integrations
  // ---------------------------------------------------------------------
  'integrations.title': 'Integrations',
  'integrations.forbidden': "Integrations aren't part of your role.",
  'integrations.loadFailed': 'Could not load integration status.',
  'integrations.connectedTools': 'Connected tools',
  'integrations.needs': 'Needs: {what}',
  'integrations.readOnly': 'read-only',
  'integrations.recordsCount': '{count} records · ',
  'integrations.lastSynced': 'last synced {date}',
  'integrations.neverSynced': 'never synced',
  'integrations.connected': 'Connected',
  'integrations.notConnected': 'Not connected',
  'integrations.syncTitle': 'GoHighLevel sync',
  'integrations.syncNote': 'Sync pulls records from GoHighLevel into Exceed Box. It stays read-only until an audit and a conflict rule exist.',
  'integrations.syncing': 'Syncing…',
  'integrations.syncNow': 'Sync now',
  'integrations.syncGated': 'Only admin can trigger a sync.',

  // ---------------------------------------------------------------------
  // nurtureSequenceDetail
  // ---------------------------------------------------------------------
  'nurtureDetail.title': 'Sequence',
  'nurtureDetail.forbidden': "Nurture sequences aren't part of your role.",
  'nurtureDetail.loadFailed': 'Could not load this sequence.',
  'nurtureDetail.subtitle': '{sent} sent · {steps} steps',
  'nurtureDetail.dedupeNote': 'Nobody ever receives the same email twice — enforced against the sends table.',
  'nurtureDetail.steps': 'Steps',
  'nurtureDetail.theRealQuestion': 'THE REAL QUESTION',
  'nurtureDetail.questionExplainEn': 'D9: every step-mail in this sequence is really asking one question in disguise. This one asks: "{question}"',
  'nurtureDetail.questionExplainJa': '各ステップメールは「質問」を隠して届けています（D9）。この回の意図：{question}',
  'nurtureDetail.cta': 'CTA · {cta}',
  'nurtureDetail.statSent': 'Sent',
  'nurtureDetail.statOpened': 'Opened',
  'nurtureDetail.statClicked': 'Clicked',
  'nurtureDetail.viewOnly': 'View only — Nurture editing needs admin or marketing.',
  'nurtureDetail.exitConditions': 'Exit conditions',
  'nurtureDetail.provisional': 'provisional',

  // ---------------------------------------------------------------------
  // dates
  // ---------------------------------------------------------------------
  'dates.overdueByMinutes': 'Overdue by {n}m',
  'dates.dueInMinutes': 'Due in {n}m',
  'dates.overdueByHours': 'Overdue by {n}h',
  'dates.dueInHours': 'Due in {n}h',
  'dates.overdueByDays': 'Overdue by {n}d',
  'dates.dueInDays': 'Due in {n}d',
  'dates.relativeMinutes': '{n}m ago',
  'dates.relativeHours': '{n}h ago',
  'dates.relativeDays': '{n}d ago',
} as const;

export type TranslationKey = keyof typeof en;
