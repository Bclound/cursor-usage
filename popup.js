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
        if (!resp.ok) return { errorStatus: resp.status };
        return { usageData: await resp.json() };
      } catch (e) { return { error: e.message }; }
    },
    args: [startDateMs]
  });
  const result = results[0].result;
  if (result.errorStatus) throw new Error(`${t('requestFailed')}: ${result.errorStatus}`);
  if (result.error) throw new Error(result.error);
  return result;
}

async function fetchBillingCycle() {
  const tab = await findCursorTab();
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async () => {
      try {
        const resp = await fetch('https://cursor.com/api/usage-summary', { credentials: 'include' });
        if (!resp.ok) return { errorStatus: resp.status };
        return await resp.json();
      } catch (e) { return { error: e.message }; }
    }
  });
  const result = results[0].result;
  if (result.errorStatus) throw new Error(`${t('requestFailed')}: ${result.errorStatus}`);
  if (result.error) throw new Error(result.error);
  return result;
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
          if (!resp.ok) return { errorStatus: resp.status };
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
  const result = results[0].result;
  if (result.errorStatus) throw new Error(`${t('requestFailed')}: ${result.errorStatus}`);
  if (result.error) throw new Error(result.error);
  return result;
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
    const tdModel = document.createElement('td');
    tdModel.className = 'model-name';
    tdModel.textContent = agg.modelIntent;
    const tdTokens = document.createElement('td');
    tdTokens.textContent = formatTokens(totalTokens);
    const tdRequests = document.createElement('td');
    tdRequests.textContent = requests;
    tr.appendChild(tdModel);
    tr.appendChild(tdTokens);
    tr.appendChild(tdRequests);
    tbody.appendChild(tr);
  }

  const totalTokens = parseInt(usageData.totalInputTokens || '0')
    + parseInt(usageData.totalOutputTokens || '0')
    + parseInt(usageData.totalCacheWriteTokens || '0')
    + parseInt(usageData.totalCacheReadTokens || '0');
  const totalRequests = parseInt(usageData.totalRequestCost || '0');

  const footTr = document.createElement('tr');
  const footTdLabel = document.createElement('td');
  footTdLabel.textContent = t('total');
  const footTdTokens = document.createElement('td');
  footTdTokens.textContent = formatTokens(totalTokens);
  const footTdRequests = document.createElement('td');
  footTdRequests.textContent = totalRequests;
  footTr.appendChild(footTdLabel);
  footTr.appendChild(footTdTokens);
  footTr.appendChild(footTdRequests);
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