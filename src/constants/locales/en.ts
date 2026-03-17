const en = {
  appName: "Weekly Planner",

  // Navigation
  navWeek: "This Week",
  navHistory: "History",
  navSettings: "Settings",

  // Current week page
  weekPageTitle: "This Week",

  // History page
  historyPageTitle: "History",
  historyComingSoon: "Past week summaries will appear here.",

  // Settings page
  settingsPageTitle: "Settings",
  settingsComingSoon: "Settings will be available once the core planner is complete.",

  // Event categories
  categoryWork: "Work",
  categoryPersonal: "Personal",
  categoryHealth: "Health",
  categoryErrand: "Errand",
  categoryOther: "Other",

  // Event statuses
  statusPlanned: "Planned",
  statusCompleted: "Completed",
  statusSkipped: "Skipped",

  // Days of week (full)
  dayMon: "Monday",
  dayTue: "Tuesday",
  dayWed: "Wednesday",
  dayThu: "Thursday",
  dayFri: "Friday",
  daySat: "Saturday",
  daySun: "Sunday",

  // Days of week (short)
  dayMonShort: "Mon",
  dayTueShort: "Tue",
  dayWedShort: "Wed",
  dayThuShort: "Thu",
  dayFriShort: "Fri",
  daySatShort: "Sat",
  daySunShort: "Sun",

  // Days of week (single letter — mobile week strip)
  dayMonLetter: "M",
  dayTueLetter: "T",
  dayWedLetter: "W",
  dayThuLetter: "T",
  dayFriLetter: "F",
  daySatLetter: "S",
  daySunLetter: "S",

  // Common UI
  add: "Add",
  edit: "Edit",
  delete: "Delete",
  save: "Save",
  cancel: "Cancel",
  done: "Done",
  noEvents: "No events yet",
  addEvent: "Add event",
  today: "Today",
  allDay: "All day",

  // Week page
  weekDateRange: "Week of {start}",
  eventCount: "{count} event",
  eventCountPlural: "{count} events",

  // History page
  historyDescription: "Once you complete a week, it will appear here as a read-only summary you can look back on.",

  // Settings page
  settingsDescription: "Theme, language, and preferences will live here once the core planner is ready.",
  settingsTheme: "Theme",
  settingsLanguage: "Language",
} as const;

/** Keys are fixed, values are any string — so other locales can provide translations. */
export type LocaleStrings = { [K in keyof typeof en]: string };
export default en;
