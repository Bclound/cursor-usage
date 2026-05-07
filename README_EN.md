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