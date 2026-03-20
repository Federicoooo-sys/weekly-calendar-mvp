import type { LocaleStrings } from "./en";

const zh: LocaleStrings = {
  appName: "周计划",

  // Navigation
  navWeek: "本周",
  navHistory: "历史",
  navSettings: "设置",

  // Current week page
  weekPageTitle: "本周",

  // History page
  historyPageTitle: "历史",
  historyComingSoon: "过往周记录将在此显示。",

  // Settings page
  settingsPageTitle: "设置",
  settingsComingSoon: "核心计划功能完成后，设置将可用。",

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
  settingsDescription: "主题、语言和偏好设置将在核心计划功能完成后在此提供。",
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

  // Circle page (placeholder)
  navCircle: "圈子",
  circlePageTitle: "你的圈子",
  circleEmptyTitle: "私密互助",
  circleEmptyDescription: "与家人或好友分享每周总结，了解彼此的一周 — 私密、自主。",
  circleComingSoon: "即将推出",
};

export default zh;
