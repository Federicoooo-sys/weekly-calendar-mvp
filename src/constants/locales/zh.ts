import type { LocaleStrings } from "./en";

const zh: LocaleStrings = {
  appName: "周计划",

  // Navigation
  navWeek: "本周",
  navHistory: "历史",
  navNotifications: "通知",
  navSettings: "设置",

  // Current week page
  weekPageTitle: "本周",

  // History page
  historyPageTitle: "历史",

  // Settings page
  settingsPageTitle: "设置",

  // Event categories
  categoryWork: "工作",
  categoryPersonal: "个人",
  categoryHealth: "健康",
  categoryErrand: "杂事",
  categoryOther: "其他",

  // Event statuses
  statusPlanned: "计划中",
  statusCompleted: "已完成",
  statusSkipped: "已跳过",

  // Days of week (full)
  dayMon: "星期一",
  dayTue: "星期二",
  dayWed: "星期三",
  dayThu: "星期四",
  dayFri: "星期五",
  daySat: "星期六",
  daySun: "星期日",

  // Days of week (short)
  dayMonShort: "周一",
  dayTueShort: "周二",
  dayWedShort: "周三",
  dayThuShort: "周四",
  dayFriShort: "周五",
  daySatShort: "周六",
  daySunShort: "周日",

  // Days of week (single letter — mobile week strip)
  dayMonLetter: "一",
  dayTueLetter: "二",
  dayWedLetter: "三",
  dayThuLetter: "四",
  dayFriLetter: "五",
  daySatLetter: "六",
  daySunLetter: "日",

  // Common UI
  add: "添加",
  edit: "编辑",
  delete: "删除",
  save: "保存",
  cancel: "取消",
  done: "完成",
  noEvents: "暂无事件",
  emptyWeekTitle: "你的一周还是空的",
  emptyWeekHint: "点击 + 添加你的第一个计划",
  addEvent: "添加事件",
  editEvent: "编辑事件",
  confirmDelete: "再次点击以删除",
  today: "今天",
  allDay: "全天",

  // Event form fields
  fieldTitle: "标题",
  fieldTitlePlaceholder: "计划做什么？",
  fieldDay: "日期",
  fieldStartTime: "开始",
  fieldEndTime: "结束",
  fieldCategory: "分类",
  fieldNote: "备注",
  fieldNotePlaceholder: "可选备注...",
  fieldStatus: "状态",
  reschedule: "改期",
  validationEndTimeAfterStart: "结束时间必须晚于开始时间",
  validationTitleRequired: "请输入标题",

  // Week page
  weekDateRange: "{start} 这一周",
  eventCount: "{count} 个事件",
  eventCountPlural: "{count} 个事件",

  // History page
  historyDescription: "完成一周后，它将作为只读摘要显示在此处，供您回顾。",
  historyNoWeeks: "暂无过往周记录。完成第一周后将显示在此。",
  historyBack: "返回",
  historyReadOnly: "只读模式 — 过往周不可编辑",
  historySummaryTotal: "{count} 个事件",
  historySummaryCompleted: "{count} 已完成",
  historySummarySkipped: "{count} 已跳过",
  historySummaryUnresolved: "{count} 未处理",
  historySummaryRate: "{rate}% 执行率",
  historyNoEventsDay: "无事件",
  historyNoEventsWeek: "本周无事件",

  // Settings page
  settingsTheme: "主题",
  settingsLanguage: "语言",
  settingsThemeLight: "浅色",
  settingsThemeDark: "深色",
  settingsThemeBlue: "蓝色",
  settingsThemeLavender: "薰衣草",
  settingsThemeMist: "雾蓝",
  settingsThemeCosmic: "暖橙",
  settingsLanguageEn: "English",
  settingsLanguageZh: "简体中文",
  settingsAppearance: "外观",
  settingsTimezone: "时区",
  settingsTimezoneSearch: "搜索城市...",
  settingsAccount: "账户",
  settingsTimezoneDetected: "自动检测",

  // Circle page
  navCircle: "圈子",
  circlePageTitle: "你的圈子",

  // Auth
  authSignIn: "登录",
  authSignUp: "创建账户",
  authEmail: "邮箱",
  authPassword: "密码",
  authDisplayName: "显示名称",
  authInviteCode: "邀请码",
  authInviteCodePlaceholder: "WEEKLY-XXXX-XXXX",
  authNoAccount: "没有账户？",
  authHaveAccount: "已有账户？",
  authSignOut: "退出登录",
  authWelcome: "欢迎使用周计划",
  authWelcomeDescription: "一个安静、专注的地方来规划你的一周。",
  authInviteRequired: "创建账户需要邀请码。",
  authInviteCodeHint: "粘贴邀请消息中的邀请码",
  authWelcomeSignUp: "开始使用",
  authSignUpDescription: "按天规划你的一周。使用邀请码开始。",
  authLoading: "加载中...",
  authCheckEmail: "请查收邮件",
  authCheckEmailDescription: "我们已向 {email} 发送了确认链接。请查看收件箱并点击链接激活账户。",
  authBackToSignIn: "返回登录",

  // Circle — management
  circleCreateTitle: "创建圈子",
  circleCreateDescription: "创建一个私密群组，与信任的人分享每周计划。",
  circleName: "圈子名称",
  circleNamePlaceholder: "例如：家人、好友",
  circleCreate: "创建",
  circleJoinTitle: "加入圈子",
  circleJoinDescription: "输入别人分享给你的邀请码。",
  circleJoinPlaceholder: "CIR-XXXX-XXXX",
  circleJoin: "加入",
  circleMembers: "成员",
  circleNoOtherMembers: "还没有其他成员，分享邀请码吧！",
  circleYou: "你",
  circleOwner: "创建者",
  circleLeave: "退出圈子",
  circleLeaveConfirm: "再次点击以退出",
  circleDeleteCircle: "删除圈子",
  circleDeleteConfirm: "再次点击以删除圈子",
  circleInviteTitle: "邀请加入圈子",
  circleInviteDescription: "将此邀请码分享给你信任的人。",
  circleGenerateCode: "生成邀请码",
  circleCopied: "已复制！",
  circleOr: "或",

  // Circle — shared view
  sharedWeekTitle: "{name}的本周",
  sharedEventsOnly: "仅显示共享事件",
  sharedNoEvents: "本周没有共享事件",
  sharedBack: "返回",

  // Event visibility
  visibilityLabel: "可见性",
  visibilityPrivate: "私密",
  visibilityCircle: "共享",

  // Comments
  commentThread: "评论",
  commentPlaceholder: "留下评论...",
  commentSend: "发送",
  commentEmpty: "暂无评论",
  commentDeleteConfirm: "删除评论？",

  // Notifications
  notificationsTitle: "通知",
  notificationComment: "{name}评论了\"{event}\"",
  notificationReaction: "{name}对\"{event}\"做出了反应",
  notificationMemberJoined: "{name}加入了{circle}",
  notificationSummaryShared: "{name}分享了他们的一周",
  notificationUnread: "{count} 条未读",
  notificationMarkAllRead: "全部标为已读",
  notificationEmpty: "暂无通知",
  notificationToday: "今天",
  notificationEarlier: "更早",

  // Reactions
  reactionLabel: "反应",

  // Weekly shares
  shareSummary: "分享",
  shareWithCircle: "分享给圈子",
  shareReflectionPlaceholder: "添加反思（可选）...",
  shareButton: "分享",
  shareAlreadyShared: "已分享",
  shareSelectCircle: "分享给",

  // Activity feed
  feedTitle: "动态",
  feedEmpty: "暂无动态",
  feedSummaryShared: "分享了他们的一周",
  feedFollowThrough: "{rate}%执行率",
  feedMemberJoined: "加入了",
  feedTimeAgo: "{time}前",

  // Coordination — participants
  participantsLabel: "参与者",
  participantInvited: "已邀请",
  participantRequested: "已申请",
  participantAccepted: "已加入",
  participantDeclined: "已拒绝",
  participantYou: "你",

  // Coordination — invite to event
  inviteToEvent: "邀请",
  inviteToEventTitle: "邀请参加活动",
  inviteSelectMember: "选择圈子成员",
  inviteNoEligible: "没有可邀请的成员",
  inviteSent: "邀请已发送",
  inviteAlready: "已经邀请过了",

  // Coordination — ask to join
  askToJoin: "感兴趣",
  askToJoinSent: "请求已发送",
  askToJoinAlready: "已经请求过了",

  // Coordination — respond
  accept: "接受",
  decline: "拒绝",
  accepted: "已接受",
  declined: "已拒绝",

  // Coordination — notifications
  notificationEventInvite: "{name}邀请你参加\"{event}\"",
  notificationJoinRequest: "{name}想加入\"{event}\"",
  notificationParticipantAccepted: "{name}接受了：\"{event}\"",
  notificationParticipantDeclined: "{name}拒绝了：\"{event}\"",

  // Coordination — shared event indicator
  sharedEventLabel: "共享",
  participantCount: "{count}人已加入",

  // Auth — password reset
  authForgotPassword: "忘记密码？",
  authResetPassword: "重置密码",
  authResetSent: "请查收邮件",
  authResetSentDescription: "如果 {email} 对应的账户存在，我们已发送了密码重置链接。",
  authNewPassword: "新密码",
  authUpdatePassword: "更新密码",
  authPasswordUpdated: "密码已更新，现在可以登录了。",
  authPasswordHint: "至少6个字符",

  // Invite request modal
  inviteRequestTitle: "活动邀请",
  inviteRequestFrom: "来自 {name}",
  inviteRequestDay: "日期",
  inviteRequestTime: "时间",
  inviteRequestNote: "备注",
  inviteRequestNoTime: "未设定时间",
  inviteRequestConflict: "日程冲突",
  inviteRequestConflictWith: "与\"{event}\"时间重叠",
  inviteRequestNoConflict: "无冲突",
  inviteRequestAccepted: "已接受！活动已添加到你的日历。",
  inviteRequestDeclined: "已拒绝邀请。",
  inviteRequestReadOnly: "共享活动 — 只有组织者可以编辑",

  // Schedule comparison
  coordinateSelectMembersHint: "最多选择4位成员",
  coordinateCompare: "比较",
  coordinateCompareCount: "比较 ({count})",
  coordinateBack: "返回",
  coordinateNoSharedEvents: "没有共享事件",
  coordinateFree: "空闲",
  coordinateBusy: "忙碌",
  coordinateCreateGroup: "创建群组活动",
  coordinatePrivateEvent: "忙碌",

  // Circle join code
  circleJoinCode: "圈子代码",
  circleJoinCodeHint: "任何人都可以用此代码加入",
  circleJoinCodeEdit: "编辑代码",
  circleJoinCodeSave: "保存",
  circleJoinCodeEmpty: "未设置代码",
  circleJoinCodeSet: "设置加入代码",

  // Circle detail tabs
  circleTabMembers: "成员",
  circleTabSchedules: "日程",
  circleTabChat: "聊天",
  circleDetailBack: "圈子",
  circleManage: "管理",
  circleViewWeek: "本周",

  // Chat
  chatGroupTitle: "群聊",
  chatDirectTitle: "私信",
  chatPlaceholder: "输入消息...",
  chatSendError: "发送失败，点击重试。",
  chatSend: "发送",
  chatEmpty: "暂无消息",
  chatGroupEmpty: "和你的圈子开始对话吧",
  chatDirectEmpty: "开始对话",
  chatMessageLabel: "消息",
  chatViewDirect: "私信",

  // Notification — chat
  notificationChatGroup: "{name}在{circle}",
  notificationChatDm: "{name}：\"{message}\"",

  // Error states
  errorGeneric: "出了点问题，请稍后重试。",
  errorLoadFailed: "无法加载数据，请下拉刷新或稍后重试。",
  errorOffline: "似乎处于离线状态。",
  errorRefresh: "刷新",
};

export default zh;
