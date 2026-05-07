# Style Redesign, i18n, Debug Removal, README Rewrite

Date: 2026-05-07

## Context

Cursor Usage Viewer is a Chrome extension for viewing per-model AI usage statistics. Current UI has purple/dark AI-tech aesthetic, Chinese-only text, debug raw-data toggle, and emoji-heavy READMEs. User wants a cleaner, more restrained look with internationalization and simplified docs.

## 1. Style: Clean & Restrained

Replace purple-dark AI-tech theme with a light, macOS-system-prefs-like aesthetic.

**Palette:**
- Background: `#fafafa` (page) / `#fff` (cards/tables)
- Primary accent: `#1d4ed8` (deep blue) — only for tab active state and table header bottom border
- Text: `#333` (primary), `#666` (secondary), `#999` (muted/loading)
- Borders/dividers: `#e5e5e5`
- Table hover: `#f5f5f5`
- Error: `#dc2626` (red)

**Layout changes:**
- Same 440px width, padding 16px
- Title left-aligned (no center), font 15px `#333`
- Language toggle on title row right side, small `中/EN` button, `#666` text, `#e5e5e5` border, rounded
- Tabs: `#e5e5e5` background, `#666` text; active = `#1d4ed8` bg + `#fff` text; border radius 6px
- Table: white bg, `#e5e5e5` dividers, `#333` body text, `#666` header text, `#1d4ed8` header bottom border
- Select/inputs: `#fff` bg, `#e5e5e5` border, `#333` text, `#1d4ed8` focus ring
- Loading: `#999` text, no accent color
- Error: `#dc2626` text, light red bg `rgba(220,38,38,0.08)`

## 2. Internationalization

**Approach:** i18n object table + `t()` function (no framework).

**Implementation:**
- Define `i18n` map at top of `popup.js`: `{ zh: {...}, en: {...} }`
- Keys cover: tab names, table headers, buttons, loading text, error messages, totals, date format strings, month selector labels
- `t(key)` function reads current locale from `localStorage('locale')` and returns string
- On first load: detect `navigator.language.startsWith('zh')` → `'zh'`, else → `'en'`; write to localStorage
- Language toggle button: displays opposite locale label (e.g. shows `EN` when current is `zh`); click → toggle localStorage + call `renderAll()` to re-render entire UI
- Number formatting: Chinese uses `万/亿`, English uses `K/M/B` abbreviations; `formatTokens()` takes locale parameter
- Date formatting: Chinese `2026年5月7日`, English `May 7, 2026`
- `manifest.json` description stays bilingual: "查看 Cursor 各模型用量统计 / View Cursor per-model usage statistics"
- HTML `lang` attribute updated dynamically based on locale

## 3. Remove Raw Data Display

Remove all debug/raw-data UI:

- HTML: remove `monthly-debug-toggle`, `monthly-debug-json`, `daily-debug-toggle`, `daily-debug-json`
- CSS: remove `.debug-toggle`, `.debug-json` rules
- JS: remove `setupDebugToggle()` function and calls; remove debug toggle/json references in `renderTable()` and `loadMonthlyUsage()` / `loadDailyData()`
- README: remove "原始数据" feature line

## 4. README Rewrite

Rewrite both `README.md` (Chinese) and `README_EN.md` (English) in plain, restrained style:

- Remove all emoji heading prefixes
- Remove decorative dashes (——) in feature list
- Plain markdown headings and bullet points
- Functional descriptions: factual, no marketing tone
- Keep legal disclaimer section but simplify language
- Remove Star History chart
- Keep installation steps unchanged (they're already plain)