# Style Redesign, i18n, Debug Removal, README Rewrite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Cursor Usage Viewer extension from a purple-dark AI-tech style to a clean restrained look, add Chinese/English i18n with auto-detection and manual toggle, remove raw data display, and rewrite READMEs in plain style.

**Architecture:** Single-file Chrome extension (popup.html/css/js). i18n via an in-file `i18n` map + `t()` function with localStorage persistence. All changes are local to the 3 popup files + 2 READMEs + manifest.json.

**Tech Stack:** Vanilla JS, Chrome Extension Manifest V3, no build tools.

---

## File Structure

| File | Responsibility | Action |
|------|---------------|--------|
| `popup.html` | Extension popup markup | Modify: remove debug elements, restructure header row, add lang toggle |
| `popup.css` | All styles | Rewrite: new palette and layout |
| `popup.js` | All logic + i18n | Rewrite: add i18n map, t(), locale-aware formatting, remove debug code |
| `manifest.json` | Extension metadata | Modify: bilingual description |
| `README.md` | Chinese docs | Rewrite: plain style |
| `README_EN.md` | English docs | Rewrite: plain style |

---

### Task 1: HTML — Remove debug elements, restructure header

**Files:**
- Modify: `popup.html`

Replace the entire `popup.html` with this version. Changes:
- `<html lang="zh-CN">` → `<html>` (lang set dynamically by JS)
- Removed `monthly-debug-toggle`, `monthly-debug-json`, `daily-debug-toggle`, `daily-debug-json`
- Title row: h1 left + language toggle right side
- Tab buttons use `data-i18n` attributes for i18n
- Table headers use `data-i18n` attributes

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="container">
    <div class="header-row">
      <h1>Cursor Usage</h1>
      <button id="lang-toggle" class="lang-toggle">EN</button>
    </div>
    <div class="tabs">
      <button class="tab active" data-tab="monthly" data-i18n="tabMonthly">月度</button>
      <button class="tab" data-tab="daily" data-i18n="tabDaily">天维度</button>
    </div>

    <div id="monthly-panel">
      <div id="cycle-info" class="cycle-info"></div>
      <select id="month-select" class="month-select"></select>
      <div id="monthly-loading" class="loading" data-i18n="loading">加载中...</div>
      <div id="monthly-error" class="error" style="display:none"></div>
      <div id="monthly-tier-label" class="tier-label" style="display:none">Pro 计划包含</div>
      <table id="monthly-table" style="display:none">
        <thead><tr>
          <th data-i18n="thModel">模型</th>
          <th data-i18n="thTokens">Tokens</th>
          <th data-i18n="thRequests">请求数</th>
        </tr></thead>
        <tbody id="monthly-body"></tbody>
        <tfoot id="monthly-foot"></tfoot>
      </table>
    </div>

    <div id="daily-panel" style="display:none">
      <div class="date-range">
        <input type="date" id="daily-start">
        <span class="date-sep" data-i18n="dateSep">至</span>
        <input type="date" id="daily-end">
        <button id="daily-query" class="query-btn" data-i18n="queryBtn">查询</button>
      </div>
      <div id="daily-loading" class="loading" style="display:none" data-i18n="loading">加载中...</div>
      <div id="daily-error" class="error" style="display:none"></div>
      <div id="daily-tier-label" class="tier-label" style="display:none">Pro 计划包含</div>
      <table id="daily-table" style="display:none">
        <thead><tr>
          <th data-i18n="thModel">模型</th>
          <th data-i18n="thTokens">Tokens</th>
          <th data-i18n="thRequests">请求数</th>
        </tr></thead>
        <tbody id="daily-body"></tbody>
        <tfoot id="daily-foot"></tfoot>
      </table>
    </div>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

- [ ] **Step 1: Write the new popup.html** — paste the HTML above, replacing the entire file content.

- [ ] **Step 2: Commit**

```bash
git add popup.html
git commit -m "refactor: restructure header, remove debug elements from HTML"
```

---

### Task 2: CSS — Complete rewrite to clean restrained style

**Files:**
- Modify: `popup.css`

Replace the entire `popup.css`. Changes:
- Light background (`#fafafa`) instead of dark purple
- Deep blue accent (`#1d4ed8`) instead of purple
- Neutral text colors (`#333`, `#666`, `#999`)
- `.debug-toggle` and `.debug-json` rules removed
- `.lang-toggle` and `.header-row` styles added

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  width: 440px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #fafafa;
  color: #333;
}

.container {
  padding: 16px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

h1 {
  font-size: 15px;
  color: #333;
  font-weight: 600;
}

.lang-toggle {
  font-size: 12px;
  color: #666;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.lang-toggle:hover {
  border-color: #999;
}

/* Tabs */
.tabs {
  display: flex;
  margin-bottom: 12px;
}

.tab {
  flex: 1;
  padding: 8px;
  background: #e5e5e5;
  color: #666;
  border: 1px solid #e5e5e5;
  cursor: pointer;
  font-size: 13px;
  text-align: center;
  transition: all 0.2s;
}

.tab:first-child {
  border-radius: 6px 0 0 6px;
  border-right: none;
}

.tab:last-child {
  border-radius: 0 6px 6px 0;
}

.tab.active {
  background: #1d4ed8;
  color: #fff;
  border-color: #1d4ed8;
}

/* Common */
.cycle-info {
  font-size: 12px;
  color: #666;
  text-align: center;
  margin-bottom: 8px;
}

.month-select {
  width: 100%;
  padding: 6px 8px;
  background: #fff;
  color: #333;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 12px;
  cursor: pointer;
}

.month-select:focus {
  outline: none;
  border-color: #1d4ed8;
}

.loading {
  text-align: center;
  color: #999;
  padding: 20px;
  font-size: 14px;
}

.error {
  color: #dc2626;
  text-align: center;
  padding: 10px;
  font-size: 13px;
  background: rgba(220, 38, 38, 0.08);
  border-radius: 6px;
}

.tier-label {
  font-size: 12px;
  color: #1d4ed8;
  margin-bottom: 6px;
  font-weight: 600;
}

/* Date range */
.date-range {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.date-range input[type="date"] {
  flex: 1;
  padding: 6px 4px;
  background: #fff;
  color: #333;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 12px;
}

.date-range input[type="date"]:focus {
  outline: none;
  border-color: #1d4ed8;
}

.date-range input[type="date"]::-webkit-calendar-picker-indicator {
  filter: none;
}

.date-sep {
  color: #999;
  font-size: 12px;
}

.query-btn {
  padding: 6px 14px;
  background: #1d4ed8;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

.query-btn:hover {
  background: #1e40af;
}

/* Table */
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

thead th {
  background: #fff;
  color: #666;
  padding: 8px 6px;
  font-weight: 600;
  border-bottom: 2px solid #1d4ed8;
}

thead th:first-child {
  text-align: left;
}

thead th:nth-child(2),
thead th:nth-child(3) {
  text-align: right;
}

tbody td {
  padding: 6px;
  border-bottom: 1px solid #e5e5e5;
  background: #fff;
}

tbody td:first-child {
  text-align: left;
}

tbody td:nth-child(2),
tbody td:nth-child(3) {
  text-align: right;
}

tbody td.model-name {
  font-weight: 500;
  color: #333;
}

tbody tr:hover {
  background: #f5f5f5;
}

tfoot td {
  padding: 8px 6px;
  font-weight: 600;
  border-top: 2px solid #e5e5e5;
  background: #fff;
}

tfoot td:first-child {
  text-align: left;
}

tfoot td:nth-child(2),
tfoot td:nth-child(3) {
  text-align: right;
}
```

- [ ] **Step 1: Write the new popup.css** — paste the CSS above, replacing the entire file content.

- [ ] **Step 2: Commit**

```bash
git add popup.css
git commit -m "style: rewrite CSS to clean restrained light theme"
```

---

### Task 3: JS — Add i18n, remove debug code, locale-aware formatting

**Files:**
- Modify: `popup.js`

This is the biggest task. Replace the entire `popup.js`. Key changes:
- Added `i18n` map with `zh` and `en` translations
- Added `getLocale()`, `setLocale()`, `t()` functions
- `formatTokensCN()` → locale-aware `formatTokens()`
- `formatDateCN()` → locale-aware `formatDate()`
- Removed `setupDebugToggle()` and all debug references
- Added `renderAll()` for full UI re-render on language change
- Added language toggle click handler
- `renderTable()` uses `t()` for "合计"/"Total" and no debug output
- `buildMonthSelector()` uses `formatDate()` and `t('currentMonth')`
- Error messages use `t()`
- `init()` detects locale, sets lang attribute, calls renderAll()

```js
const MONTHS_BACK = 24;

// --- i18n ---
const i18n = {
  zh: {
    tabMonthly: '月度',
    tabDaily: '天维度',
    loading: '加载中...',
    thModel: '模型',
    thTokens: 'Tokens',
    thRequests: '请求数',
    total: '合计',
    dateSep: '至',
    queryBtn: '查询',
    selectDateRange: '请选择日期范围',
    noData: '所选日期范围内无数据',
    openCursorFirst: '请先打开 cursor.com 页面后再使用此插件',
    requestFailed: '请求失败',
    currentMonth: '（当前）',
    tierLabel: 'Pro 计划包含',
  },
  en: {
    tabMonthly: 'Monthly',
    tabDaily: 'Daily',
    loading: 'Loading...',
    thModel: 'Model',
    thTokens: 'Tokens',
    thRequests: 'Requests',
    total: 'Total',
    dateSep: 'to',
    queryBtn: 'Query',
    selectDateRange: 'Please select a date range',
    noData: 'No data for the selected date range',
    openCursorFirst: 'Please open cursor.com before using this extension',
    requestFailed: 'Request failed',
    currentMonth: '(current)',
    tierLabel: 'Pro plan includes',
  }
};

let currentLocale = 'zh';

function getLocale() {
  const stored = localStorage.getItem('locale');
  if (stored) return stored;
  return navigator.language.startsWith('zh') ? 'zh' : 'en';
}

function setLocale(locale) {
  currentLocale = locale;
  localStorage.setItem('locale', locale);
}

function t(key) {
  return i18n[currentLocale][key] || key;
}

// --- State ---
let currentBillingStart = null;
let dailyLoaded = false;

// --- Utility Functions ---
function formatTokens(num) {
  if (currentLocale === 'zh') {
    if (num >= 100000000) {
      const yi = num / 100000000;
      const formatted = yi.toFixed(1);
      return (formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted) + '亿';
    }
    if (num >= 10000) {
      const wan = num / 10000;
      const formatted = wan.toFixed(1);
      return (formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted) + '万';
    }
    return num.toString();
  } else {
    if (num >= 1000000000) {
      const b = num / 1000000000;
      const formatted = b.toFixed(1);
      return (formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted) + 'B';
    }
    if (num >= 1000000) {
      const m = num / 1000000;
      const formatted = m.toFixed(1);
      return (formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted) + 'M';
    }
    if (num >= 1000) {
      const k = num / 1000;
      const formatted = k.toFixed(1);
      return (formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted) + 'K';
    }
    return num.toString();
  }
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (currentLocale === 'zh') {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  } else {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
}

function subtractMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dateToStartTimestamp(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return String(new Date(y, m - 1, d, 0, 0, 0).getTime());
}

function dateToEndTimestamp(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return String(new Date(y, m - 1, d, 23, 59, 59, 999).getTime());
}

function calcModelTotalTokens(agg) {
  return parseInt(agg.inputTokens || '0')
    + parseInt(agg.outputTokens || '0')
    + parseInt(agg.cacheWriteTokens || '0')
    + parseInt(agg.cacheReadTokens || '0');
}

// --- API Fetch Functions ---
async function findCursorTab() {
  const tabs = await chrome.tabs.query({ url: '*://cursor.com/*' });
  if (tabs.length === 0) throw new Error(t('openCursorFirst'));
  return tabs[0];
}

async function fetchAggregatedUsage(startDateMs) {
  const tab = await findCursorTab();
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async (startMs) => {
      try {
        const resp = await fetch('https://cursor.com/api/dashboard/get-aggregated-usage-events', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId: -1, startDate: startMs })
        });
        if (!resp.ok) return { error: `请求失败: ${resp.status}` };
        return { usageData: await resp.json() };
      } catch (e) { return { error: e.message }; }
    },
    args: [startDateMs]
  });
  return results[0].result;
}

async function fetchBillingCycle() {
  const tab = await findCursorTab();
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async () => {
      try {
        const resp = await fetch('https://cursor.com/api/usage-summary', { credentials: 'include' });
        if (!resp.ok) return { error: `usage-summary 请求失败: ${resp.status}` };
        return await resp.json();
      } catch (e) { return { error: e.message }; }
    }
  });
  return results[0].result;
}

async function fetchFilteredEvents(startDate, endDate) {
  const tab = await findCursorTab();
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async (start, end) => {
      try {
        let allEvents = [];
        let page = 1;
        const pageSize = 100;

        while (true) {
          const resp = await fetch('https://cursor.com/api/dashboard/get-filtered-usage-events', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamId: 0, startDate: start, endDate: end, page, pageSize })
          });
          if (!resp.ok) return { error: `请求失败: ${resp.status}` };
          const data = await resp.json();
          allEvents.push(...(data.usageEventsDisplay || []));
          if (allEvents.length >= data.totalUsageEventsCount || page > 50) break;
          page++;
        }

        return { events: allEvents };
      } catch (e) { return { error: e.message }; }
    },
    args: [startDate, endDate]
  });
  return results[0].result;
}

// --- Data Processing ---
function subtractUsageData(thisData, nextData) {
  const aggregations = [];
  const nextMap = {};
  for (const agg of (nextData.aggregations || [])) {
    nextMap[agg.modelIntent] = agg;
  }

  for (const agg of (thisData.aggregations || [])) {
    const next = nextMap[agg.modelIntent];
    if (!next) {
      aggregations.push(agg);
      continue;
    }
    aggregations.push({
      modelIntent: agg.modelIntent,
      inputTokens: String(parseInt(agg.inputTokens || '0') - parseInt(next.inputTokens || '0')),
      outputTokens: String(parseInt(agg.outputTokens || '0') - parseInt(next.outputTokens || '0')),
      cacheWriteTokens: String(parseInt(agg.cacheWriteTokens || '0') - parseInt(next.cacheWriteTokens || '0')),
      cacheReadTokens: String(parseInt(agg.cacheReadTokens || '0') - parseInt(next.cacheReadTokens || '0')),
      totalCents: parseInt(agg.totalCents || '0') - parseInt(next.totalCents || '0'),
      requestCost: parseInt(agg.requestCost || '0') - parseInt(next.requestCost || '0'),
      tier: agg.tier
    });
  }

  return {
    aggregations,
    totalInputTokens: String(parseInt(thisData.totalInputTokens || '0') - parseInt(nextData.totalInputTokens || '0')),
    totalOutputTokens: String(parseInt(thisData.totalOutputTokens || '0') - parseInt(nextData.totalOutputTokens || '0')),
    totalCacheWriteTokens: String(parseInt(thisData.totalCacheWriteTokens || '0') - parseInt(nextData.totalCacheWriteTokens || '0')),
    totalCacheReadTokens: String(parseInt(thisData.totalCacheReadTokens || '0') - parseInt(nextData.totalCacheReadTokens || '0')),
    totalCostCents: parseInt(thisData.totalCostCents || '0') - parseInt(nextData.totalCostCents || '0'),
    totalRequestCost: parseInt(thisData.totalRequestCost || '0') - parseInt(nextData.totalRequestCost || '0'),
  };
}

function aggregateEventsByModel(events) {
  const modelMap = {};
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheWriteTokens = 0;
  let totalCacheReadTokens = 0;
  let totalRequestCost = 0;

  for (const event of events) {
    const model = event.model;
    const tu = event.tokenUsage || {};
    if (!modelMap[model]) {
      modelMap[model] = {
        modelIntent: model,
        inputTokens: 0,
        outputTokens: 0,
        cacheWriteTokens: 0,
        cacheReadTokens: 0,
        requestCost: 0,
        tier: event.kind === 'USAGE_EVENT_KIND_INCLUDED_IN_PRO' ? 1 : 0
      };
    }
    const m = modelMap[model];
    m.inputTokens += tu.inputTokens || 0;
    m.outputTokens += tu.outputTokens || 0;
    m.cacheWriteTokens += tu.cacheWriteTokens || 0;
    m.cacheReadTokens += tu.cacheReadTokens || 0;
    m.requestCost += event.requestsCosts || 0;

    totalInputTokens += tu.inputTokens || 0;
    totalOutputTokens += tu.outputTokens || 0;
    totalCacheWriteTokens += tu.cacheWriteTokens || 0;
    totalCacheReadTokens += tu.cacheReadTokens || 0;
    totalRequestCost += event.requestsCosts || 0;
  }

  return {
    aggregations: Object.values(modelMap).map(a => ({
      ...a,
      inputTokens: String(Math.round(a.inputTokens)),
      outputTokens: String(Math.round(a.outputTokens)),
      cacheWriteTokens: String(Math.round(a.cacheWriteTokens)),
      cacheReadTokens: String(Math.round(a.cacheReadTokens)),
    })),
    totalInputTokens: String(Math.round(totalInputTokens)),
    totalOutputTokens: String(Math.round(totalOutputTokens)),
    totalCacheWriteTokens: String(Math.round(totalCacheWriteTokens)),
    totalCacheReadTokens: String(Math.round(totalCacheReadTokens)),
    totalRequestCost: Math.round(totalRequestCost),
  };
}

// --- Rendering ---
function renderTable(panel, usageData) {
  const tbody = document.getElementById(`${panel}-body`);
  const tfoot = document.getElementById(`${panel}-foot`);
  const tierLabel = document.getElementById(`${panel}-tier-label`);
  const table = document.getElementById(`${panel}-table`);

  tbody.innerHTML = '';
  tfoot.innerHTML = '';

  const aggregations = usageData.aggregations || [];
  aggregations.sort((a, b) => calcModelTotalTokens(b) - calcModelTotalTokens(a));

  for (const agg of aggregations) {
    const totalTokens = calcModelTotalTokens(agg);
    const requests = parseInt(agg.requestCost || '0');
    if (totalTokens === 0 && requests === 0) continue;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="model-name">${agg.modelIntent}</td>
      <td>${formatTokens(totalTokens)}</td>
      <td>${requests}</td>
    `;
    tbody.appendChild(tr);
  }

  const totalTokens = parseInt(usageData.totalInputTokens || '0')
    + parseInt(usageData.totalOutputTokens || '0')
    + parseInt(usageData.totalCacheWriteTokens || '0')
    + parseInt(usageData.totalCacheReadTokens || '0');
  const totalRequests = parseInt(usageData.totalRequestCost || '0');

  const footTr = document.createElement('tr');
  footTr.innerHTML = `
    <td>${t('total')}</td>
    <td>${formatTokens(totalTokens)}</td>
    <td>${totalRequests}</td>
  `;
  tfoot.appendChild(footTr);

  tierLabel.textContent = t('tierLabel');
  tierLabel.style.display = 'block';
  table.style.display = 'table';
}

// --- Monthly Logic ---
function buildMonthSelector(billingStart) {
  const select = document.getElementById('month-select');
  select.innerHTML = '';

  for (let i = 0; i <= MONTHS_BACK; i++) {
    const start = new Date(subtractMonths(billingStart, i));
    const end = new Date(addMonths(start.toISOString(), 1));
    const label = `${formatDate(start.toISOString())} - ${formatDate(end.toISOString())}`;
    const option = document.createElement('option');
    option.value = start.getTime();
    option.textContent = label;
    if (i === 0) option.textContent = label + ' ' + t('currentMonth');
    select.appendChild(option);
  }
}

async function loadMonthlyUsage(startDateMs) {
  const loadingEl = document.getElementById('monthly-loading');
  const errorEl = document.getElementById('monthly-error');
  const tableEl = document.getElementById('monthly-table');
  const tierLabelEl = document.getElementById('monthly-tier-label');

  loadingEl.textContent = t('loading');
  loadingEl.style.display = 'block';
  errorEl.style.display = 'none';
  tableEl.style.display = 'none';
  tierLabelEl.style.display = 'none';

  try {
    const currentCycleMs = new Date(currentBillingStart).getTime();
    const data = await fetchAggregatedUsage(startDateMs);
    if (data.error) throw new Error(data.error);

    let usageData = data.usageData;

    if (startDateMs !== currentCycleMs) {
      const cycleDuration = currentCycleMs - new Date(subtractMonths(currentBillingStart, 1)).getTime();
      const nextCycleMs = startDateMs + cycleDuration;
      const nextData = await fetchAggregatedUsage(nextCycleMs);
      if (!nextData.error) {
        usageData = subtractUsageData(data.usageData, nextData.usageData);
      }
    }

    renderTable('monthly', usageData);
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  } finally {
    loadingEl.style.display = 'none';
  }
}

// --- Daily Logic ---
async function loadDailyData() {
  const startDateStr = document.getElementById('daily-start').value;
  const endDateStr = document.getElementById('daily-end').value;

  if (!startDateStr || !endDateStr) {
    const errorEl = document.getElementById('daily-error');
    errorEl.textContent = t('selectDateRange');
    errorEl.style.display = 'block';
    return;
  }

  const loadingEl = document.getElementById('daily-loading');
  const errorEl = document.getElementById('daily-error');
  const tableEl = document.getElementById('daily-table');
  const tierLabelEl = document.getElementById('daily-tier-label');

  loadingEl.textContent = t('loading');
  loadingEl.style.display = 'block';
  errorEl.style.display = 'none';
  tableEl.style.display = 'none';
  tierLabelEl.style.display = 'none';

  try {
    const startTs = dateToStartTimestamp(startDateStr);
    const endTs = dateToEndTimestamp(endDateStr);

    const data = await fetchFilteredEvents(startTs, endTs);
    if (data.error) throw new Error(data.error);

    const events = data.events || [];
    if (events.length === 0) {
      errorEl.textContent = t('noData');
      errorEl.style.display = 'block';
      loadingEl.style.display = 'none';
      return;
    }

    const usageData = aggregateEventsByModel(events);
    renderTable('daily', usageData);
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  } finally {
    loadingEl.style.display = 'none';
  }
}

// --- Language Toggle & Re-render ---
function renderAll() {
  document.documentElement.lang = currentLocale === 'zh' ? 'zh-CN' : 'en';

  // Update language toggle button label
  const langBtn = document.getElementById('lang-toggle');
  langBtn.textContent = currentLocale === 'zh' ? 'EN' : '中';

  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });

  // Re-build month selector
  if (currentBillingStart) {
    buildMonthSelector(currentBillingStart);
  }

  // Re-render current monthly data if table is visible
  // (Table content uses formatTokens/formatDate which depend on locale,
  //  so we need to reload data when locale changes)
  if (currentBillingStart) {
    const monthSelect = document.getElementById('month-select');
    if (monthSelect.value) {
      loadMonthlyUsage(parseInt(monthSelect.value));
    }
  }

  // Re-load daily if it was loaded
  if (dailyLoaded) {
    loadDailyData();
  }
}

document.getElementById('lang-toggle').addEventListener('click', () => {
  setLocale(currentLocale === 'zh' ? 'en' : 'zh');
  renderAll();
});

// --- Tab Switching ---
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const tab = btn.dataset.tab;
    document.getElementById('monthly-panel').style.display = tab === 'monthly' ? 'block' : 'none';
    document.getElementById('daily-panel').style.display = tab === 'daily' ? 'block' : 'none';

    if (tab === 'daily' && !dailyLoaded) {
      dailyLoaded = true;
      loadDailyData();
    }
  });
});

document.getElementById('daily-query').addEventListener('click', loadDailyData);

document.getElementById('month-select').addEventListener('change', (e) => {
  loadMonthlyUsage(parseInt(e.target.value));
});

// --- Init ---
async function init() {
  setLocale(getLocale());
  document.documentElement.lang = currentLocale === 'zh' ? 'zh-CN' : 'en';

  const loadingEl = document.getElementById('monthly-loading');
  const errorEl = document.getElementById('monthly-error');
  const cycleInfoEl = document.getElementById('cycle-info');

  loadingEl.textContent = t('loading');
  loadingEl.style.display = 'block';
  errorEl.style.display = 'none';
  cycleInfoEl.textContent = '';

  // Apply i18n to static elements
  renderAll();

  // Default daily dates to today
  const today = getTodayStr();
  document.getElementById('daily-start').value = today;
  document.getElementById('daily-end').value = today;

  try {
    const summaryData = await fetchBillingCycle();
    if (summaryData.error) throw new Error(summaryData.error);

    currentBillingStart = summaryData.billingCycleStart;
    cycleInfoEl.textContent = `${formatDate(summaryData.billingCycleStart)} - ${formatDate(summaryData.billingCycleEnd)}`;

    buildMonthSelector(summaryData.billingCycleStart);
    await loadMonthlyUsage(new Date(summaryData.billingCycleStart).getTime());
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
    loadingEl.style.display = 'none';
  }
}

init();
```

- [ ] **Step 1: Write the new popup.js** — paste the JS above, replacing the entire file content.

- [ ] **Step 2: Verify extension loads** — open `chrome://extensions`, reload the extension, click the icon. Expect: light background, blue accent, no purple, no debug section, language toggle visible.

- [ ] **Step 3: Commit**

```bash
git add popup.js
git commit -m "feat: add i18n with auto-detect and manual toggle, remove debug display, locale-aware formatting"
```

---

### Task 4: manifest.json — Bilingual description

**Files:**
- Modify: `manifest.json`

Change the `description` field to bilingual:

```json
{
  "manifest_version": 3,
  "name": "Cursor Usage Viewer",
  "version": "1.0",
  "description": "查看 Cursor 各模型用量统计 / View Cursor per-model usage statistics",
  "permissions": ["storage", "scripting", "tabs"],
  "host_permissions": ["*://cursor.com/*"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

- [ ] **Step 1: Edit manifest.json description field** — change from `"查看 Cursor 各模型用量统计"` to `"查看 Cursor 各模型用量统计 / View Cursor per-model usage statistics"`

- [ ] **Step 2: Commit**

```bash
git add manifest.json
git commit -m "chore: bilingual description in manifest.json"
```

---

### Task 5: README.md — Rewrite in plain Chinese style

**Files:**
- Modify: `README.md`

Replace entire `README.md`:

```markdown
# Cursor Usage Viewer

非官方工具，与 Cursor 官方无任何关联。

Chrome 浏览器扩展，查看 Cursor 各 AI 模型的用量统计。支持月度和天维度切换、历史月份查看——解决了官方面板无法切换月份的问题。

## 功能

- 月度视图：查看当前及过去 24 个月的计费周期用量，按模型汇总
- 天维度视图：选择任意日期范围，查看逐日用量明细（默认当天）
- 表格展示：与官方格式一致的模型 / Tokens / 请求数表格
- 差值计算：自动处理 API 返回的累积数据，精确展示单月用量

## 安装

1. 下载或克隆本项目
2. 打开 Chrome，访问 `chrome://extensions/`
3. 开启右上角「开发者模式」
4. 点击「加载已解压的扩展程序」，选择本项目根目录
5. 确保**已登录 cursor.com**（扩展需要借助 cursor.com 页面的登录状态）
6. 点击扩展图标即可查看用量

## 注意事项

- 使用前必须有一个已登录 cursor.com 的浏览器标签页
- 扩展通过注入脚本到 cursor.com 页面来获取数据，请求的 Origin 为 cursor.com 自身
- 扩展不会收集、存储或传输任何数据到第三方
- 仅读取用户有权查看的用量信息

## 法律声明

- 本项目为个人开源工具，与 Cursor 官方无任何隶属、授权或代言关系
- 仅帮助用户查看自己的用量数据，通过浏览器登录态访问，不绕过任何安全机制
- 使用的 API 为用户在 cursor.com 正常登录后即可访问的公开接口
- 不以任何形式商业化 Cursor 的数据或服务
- 使用者应遵守 Cursor 的服务条款

## License

MIT License
```

- [ ] **Step 1: Write the new README.md** — paste the markdown above, replacing the entire file content.

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: rewrite Chinese README in plain style"
```

---

### Task 6: README_EN.md — Rewrite in plain English style

**Files:**
- Modify: `README_EN.md`

Replace entire `README_EN.md`:

```markdown
# Cursor Usage Viewer

Unofficial tool. Not affiliated with Cursor.

A Chrome extension for viewing per-model AI usage statistics on Cursor. Supports monthly and daily views, with historical month navigation — solves the problem that the official dashboard cannot switch months.

## Features

- Monthly view: current and past 24 billing cycles, aggregated by model
- Daily view: select any date range for per-day usage details (defaults to today)
- Table display: model / tokens / requests matching the official format
- Delta calculation: handles cumulative API data to show accurate single-month usage

## Installation

1. Download or clone this project
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the project root directory
5. Make sure you **have logged into cursor.com** (the extension relies on the cursor.com login session)
6. Click the extension icon to view your usage

## Notes

- You must have a browser tab logged into cursor.com before using this extension
- The extension injects scripts into cursor.com pages to fetch data — requests originate from cursor.com itself
- The extension does not collect, store, or transmit any data to third parties
- It only reads usage information you are authorized to view

## Legal Disclaimer

- This is an independent open-source tool, not affiliated with, authorized by, or endorsed by Cursor
- It only helps users view their own usage data through their browser session — no security mechanisms are bypassed
- The APIs used are publicly accessible to any logged-in cursor.com user
- This project does not commercialize Cursor's data or services in any form
- Users should comply with Cursor's Terms of Service

## License

MIT License
```

- [ ] **Step 1: Write the new README_EN.md** — paste the markdown above, replacing the entire file content.

- [ ] **Step 2: Commit**

```bash
git add README_EN.md
git commit -m "docs: rewrite English README in plain style"
```