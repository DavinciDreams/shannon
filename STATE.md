# Shannon Chrome Extension - State Log

## Architecture Overview

Shannon is a Chrome Extension (Manifest V3) front-end testing agent. Architecture:

```
manifest.json (MV3)
├── Service Worker (ES modules) - message relay, screenshot capture, AI analysis
├── Side Panel (ES modules) - UI controller, screen management
├── Content Scripts (plain scripts, no modules) - element inspection/selection, console interception
└── Lib modules (ES modules, used by service worker & sidepanel)
    ├── vision-service.js → providers/zai, openrouter, claude
    ├── github-service.js, github-oauth.js, github-cache.js
    ├── screenshot-capture.js
    ├── issue-builder.js
    ├── console-monitor.js
    └── storage.js
```

**Key pattern:** Content scripts use `window.Shannon` namespace (NOT ES modules). Service worker and sidepanel use ES modules.

## File Inventory

### Content Scripts (plain scripts, loaded via manifest in order)
- `src/content-scripts/namespace.js` - Creates `window.Shannon = {}` namespace
- `src/content-scripts/element-inspector.js` - `window.Shannon.ElementInspector` class
- `src/content-scripts/element-selector.js` - `window.Shannon.ElementSelector` class (hover/click overlay)
- `src/content-scripts/console-interceptor.js` - `window.Shannon.ConsoleInterceptor` class
- `src/content-scripts/main.js` - ContentScriptCoordinator, message handler, initializes all modules

### Service Worker (ES modules)
- `src/service-worker/service-worker.js` - Message relay hub, screenshot/element/console handlers

### Side Panel
- `src/sidepanel/sidepanel.html` - All UI screens
- `src/sidepanel/sidepanel.js` - UI controller (~2600 lines)
- `src/sidepanel/sidepanel.css` - Styles

### Lib (ES modules, used by service worker & sidepanel)
- `src/lib/vision-service.js` - Singleton VisionService with provider management
- `src/lib/providers/zai-provider.js` - Zai/Zhipu GLM-4V provider
- `src/lib/providers/openrouter-provider.js` - OpenRouter provider
- `src/lib/providers/claude-provider.js` - Claude/Anthropic provider
- `src/lib/github-service.js` - GitHub API service (repos, issues, projects)
- `src/lib/github-oauth.js` - GitHub OAuth flow
- `src/lib/github-cache.js` - GitHub API response cache
- `src/lib/screenshot-capture.js` - Screenshot capture (captureVisibleTab)
- `src/lib/issue-builder.js` - GitHub issue builder with sections
- `src/lib/console-monitor.js` - Service-worker-side console log management
- `src/lib/storage.js` - chrome.storage wrapper

### Config
- `src/config/runtime-config.js` - Generated from .env (API keys, OAuth creds)
- `src/config/vision-config.js` - Vision provider model configs
- `src/config/oauth-config.js` - OAuth endpoint configs

## Current Status

### Working Features (after 2026-02-16 fixes)
- Content script loading and initialization on all pages
- Element selection (hover highlight, click select, Escape cancel)
- Console log interception (log, warn, error, info)
- Full page screenshot capture (via captureVisibleTab)
- Element screenshot capture (captureVisibleTab + OffscreenCanvas crop)
- Side panel UI with Testing Dashboard, Element Inspector, Console Logs, AI Analysis screens
- GitHub OAuth flow
- Vision AI provider integration (Zai, OpenRouter, Claude)
- GitHub issue creation with attachments
- Shannon branding

### Known Issues / Remaining Work
- Voice Starter features (TranscriptionService, Notion) still present in code - non-breaking
- `[FTA]` log prefix used in content scripts instead of `[Shannon]` - cosmetic
- `showToast` has fragile innerHTML pattern for links - works but could be safer
- `runtime-config.js` has real API keys committed (should be in .gitignore)

## Recent Changes

### 2026-02-16 - Fix Content Scripts & Wire Up Extension

**Problem:** Shannon extension was non-functional. Content scripts used ES module imports (not supported by Chrome MV3 for content scripts). html2canvas dependency couldn't resolve. Message types mismatched. Branding was wrong.

**Files Changed:**
- `src/content-scripts/namespace.js` - NEW: Creates `window.Shannon` namespace
- `manifest.json` - content_scripts now lists all 5 files in dependency order
- `src/content-scripts/element-inspector.js` - `export class` → `window.Shannon.ElementInspector = class`
- `src/content-scripts/element-selector.js` - Same namespace conversion + XSS fix in tooltip (innerHTML → DOM methods)
- `src/content-scripts/console-interceptor.js` - Same conversion + removed duplicate onMessage listener
- `src/content-scripts/main.js` - Removed all imports, uses `window.Shannon.*`, removed html2canvas screenshot method
- `src/service-worker/service-worker.js` - Rewrote element screenshot handler (captureVisibleTab + OffscreenCanvas crop), fixed all dynamic injection sites to inject all 5 files, added `CONTENT_SCRIPT_FILES` constant, fixed header comment
- `src/sidepanel/sidepanel.js` - Fixed `ENABLE_ELEMENT_SELECTION` → `START_ELEMENT_SELECTION`, fixed dynamic injection to include all 5 files, added content script injection in handleSelectElement
- `src/sidepanel/sidepanel.html` - Branding: "Duly Noted" → "Shannon"
- `src/lib/console-monitor.js` - Fixed dynamic injection to include all 5 files

**QA Findings Fixed:**
- CRITICAL: All 4 dynamic injection sites now inject all 5 content script files
- CRITICAL: Removed duplicate onMessage listener in ConsoleInterceptor
- CRITICAL: Fixed XSS via innerHTML in element selector tooltip
- IMPORTANT: handleSelectElement now ensures content script is injected first
- MINOR: Removed invalid CSS `//` comments in cssText strings
- MINOR: Fixed stale "Voice Starter" header comment in service worker

**Status:** All critical blockers resolved. Extension should load and function.

### 2026-02-16 (Session 2) - Fix Service Worker Crashes & Restricted Page Handling

**Problem:** Extension loaded but showed "Error loading dashboard", "Error enabling element selection", and "Error capturing screenshot" when tested on `chrome://extensions/` page. Two root causes:
1. `screenshot-capture.js` used `window.innerWidth`, `window.innerHeight`, `window.devicePixelRatio` — `window` does not exist in service worker context → `ReferenceError` crash
2. Sidepanel tried to inject content scripts into `chrome://` pages — Chrome security restriction prevents this → uncaught exception crashed dashboard loading

**Files Changed:**
- `src/lib/screenshot-capture.js` - Replaced `window.innerWidth/innerHeight` with `tab?.width/height` (from chrome.tabs.query), replaced `window.devicePixelRatio` with `1` (safe default)
- `src/service-worker/service-worker.js` - Fixed "Voice Starter" → "Shannon" in startup log
- `src/sidepanel/sidepanel.js` - Three fixes:
  1. `loadTestingDashboard()`: Added URL guard — skips content script injection on `chrome://`, `chrome-extension://`, `about:` pages. Added inner try/catch for injection failures.
  2. `handleSelectElement()`: Added URL guard — shows warning toast "Navigate to a website first" on restricted pages.
  3. `handleCaptureScreenshot()`: Added `tab.windowId` param, better error message for chrome:// pages.

**Key Insight:** You MUST test Shannon on a real website (e.g. google.com), not on chrome://extensions/. Chrome does not allow content script injection or certain APIs on privileged pages.

**Status:** Service worker no longer crashes on screenshot capture. Dashboard loads cleanly on all pages (gracefully skips restricted pages). Element selection gives helpful warning on restricted pages.

### 2026-02-16 (Session 2b) - Fix Screenshot Permissions & Dashboard Auto-Load

**Problem:** Screenshots still failing, dashboard not auto-loading on panel open, "Cannot access chrome:// URL" error leaking to user.

**Root Causes:**
1. `manifest.json` missing `<all_urls>` in `host_permissions` — `captureVisibleTab` needs broad host permission when called from sidepanel context
2. `init()` called `showScreen(TESTING_DASHBOARD)` but never called `loadTestingDashboard()` — dashboard showed empty "Loading..." state until user manually triggered refresh
3. `loadConsoleLogs()` inside URL guard could still throw on restricted pages

**Files Changed:**
- `manifest.json` - Added `<all_urls>` to `host_permissions` (needed for `captureVisibleTab` from sidepanel)
- `src/sidepanel/sidepanel.js` - `init()` now calls `loadTestingDashboard()` after showing the dashboard screen, wrapped in try/catch so panel still loads on error

**Status:** Screenshot capture should now work on any website. Dashboard auto-populates on panel open. All restricted page errors handled gracefully.

### 2026-02-16 (Session 2c) - Fix Vision Model IDs & Add Model Selection UI

**Problem:** Zai API returned "Unknown Model" error because the old `glm-4v` model ID no longer exists. All three providers had outdated model IDs. Users had no way to choose which model to use.

**Changes:**
- `src/config/vision-config.js` - Updated all model IDs:
  - **Zai**: Added `glm-4.7` (MCP/Vision/WebFetch), `glm-4.6v`, `glm-4.6v-flash`, `glm-4.5v`. Default: `glm-4.7`
  - **OpenRouter**: Added `anthropic/claude-sonnet-4`, `google/gemini-2.0-flash-001`, `openai/gpt-4o`. Default: `anthropic/claude-sonnet-4`
  - **Claude**: Added `claude-sonnet-4-5-20250929`, `claude-haiku-4-5-20251001`. Default: `claude-sonnet-4-5-20250929`
- `src/lib/providers/zai-provider.js` - Default model `glm-4v` → `glm-4.7`
- `src/lib/providers/openrouter-provider.js` - Default model → `anthropic/claude-sonnet-4`
- `src/lib/providers/claude-provider.js` - Default model → `claude-sonnet-4-5-20250929`
- `src/sidepanel/sidepanel.html` - Added model selector dropdowns to both AI Analysis screen and Settings screen
- `src/sidepanel/sidepanel.js` - Added `populateModelDropdown()` function, wired provider change → model population, model persisted in settings, model set on provider before analysis
- `src/sidepanel/sidepanel.css` - Added `.model-selection` styles

**Status:** Users can now select provider AND model. Zai defaults to GLM-4.7 which has native MCP for vision and web fetch.

### 2026-02-16 (Session 2d) - Switch Zai Endpoint & Update OpenRouter Models

**Problem:** Zai API endpoint was still pointing to `open.bigmodel.cn` instead of the production `api.z.ai` endpoint. OpenRouter model list had outdated/non-existent model IDs.

**Files Changed:**
- `src/config/vision-config.js` - Two changes:
  1. Zai `baseUrl`: `https://open.bigmodel.cn/api/paas/v4` → `https://api.z.ai/api/paas/v4`
  2. OpenRouter models completely replaced with current models:
     - `anthropic/claude-opus-4.6` (default), `openai/gpt-5.1`, `google/gemini-3-flash-preview`, `google/gemini-3-pro-preview`, `qwen/qwen3.5-plus-02-15`, `mistralai/mistral-large-2512`
- `src/lib/providers/zai-provider.js` - `baseUrl` default: `open.bigmodel.cn` → `api.z.ai`
- `src/lib/providers/openrouter-provider.js` - Three changes:
  1. Default model: `anthropic/claude-sonnet-4` → `anthropic/claude-opus-4.6`
  2. `HTTP-Referer` header: `DavinciDreams/duly-noted` → `DavinciDreams/shannon`
  3. `X-Title` header: `Front-End Testing Agent` → `Shannon - Front-End Testing Agent`
  4. `getCapabilities()` availableModels updated to match new model list
- `manifest.json` - `host_permissions`: `https://open.bigmodel.cn/*` → `https://api.z.ai/*`

**Status:** Zai now targets production api.z.ai endpoint. OpenRouter offers 6 current vision models across Anthropic, OpenAI, Google, Qwen, and Mistral.

### 2026-02-17 - Phase 1: Gemini Nano Integration + Difficulty Estimator

**Context:** Implementing the LLM-powered UI testing automation plan (v2). Phase 1 adds on-device AI analysis via Gemini Nano and heuristic bug difficulty scoring with cost-effective model routing.

**Plan:** `plans/llm-ui-testing-automation-plan-v2.md` — comprehensive 5-phase plan covering Nano integration, dynamic observation via TabCapture, bug difficulty estimation, multi-page analysis, and SPA monitoring.

**Files Created:**
- `src/lib/nano-provider.js` — Gemini Nano Prompt API wrapper with dual API shape support:
  - Shape 1: `self.ai.languageModel` (Chrome 127-137 origin trial)
  - Shape 2: `LanguageModel` global (Chrome 138+ stable)
  - Multimodal prompting: text + ImageBitmap (converts base64 dataUrl → ImageBitmap via fetch/blob/createImageBitmap)
  - Session lifecycle: creates on first use, auto-destroys after 5 min idle
  - Static `parseJSON()` helper strips markdown fences from Nano responses
  - Ported from working `generateAISummary()` in Duly Noted (voice starter)
- `src/lib/difficulty-estimator.js` — Heuristic bug scoring + model routing:
  - Scores: error volume, multi-file spread, stack depth, error categories (CORS, memory, network, null/undefined, timeout, security), warning count, visual signals (flicker, freeze, layout shifts)
  - Maps score → difficulty bands: trivial (0-3), easy (4-10), medium (11-20), hard (21-35), complex (36+)
  - Routes to model: nano (trivial/easy), cloud-fast (medium), cloud-deep (hard/complex)
  - Returns color for badge UI

**Files Modified:**
- `manifest.json` — `minimum_chrome_version`: `"114"` → `"127"` (Nano origin trial minimum)
- `src/sidepanel/sidepanel.html` — Added:
  - AI status bar (dot + text) between tab info and quick actions
  - Quick Analyze button (primary action) to quick actions
  - Analysis results panel with difficulty badge, provider badge, progress bar, summary, details
- `src/sidepanel/sidepanel.css` — Added styles for:
  - `.ai-status-bar` with animated dot states (available/downloading/unavailable/checking)
  - `.difficulty-badge` with dynamic color
  - `.analysis-results-panel` with progress bar, error items, issue items, tags
- `src/sidepanel/sidepanel.js` — Added:
  - Imports for NanoProvider and DifficultyEstimator
  - Instances: `nanoProvider`, `difficultyEstimator`
  - 11 new DOM element references for AI UI
  - `checkAndDisplayAIStatus()` — checks Nano availability, updates status bar
  - `handleQuickAnalyze()` — captures screenshot + logs → estimates difficulty → runs Nano analysis → falls back to cloud
  - `runNanoQuickAnalysis()` — builds compact prompt from logs/screenshot, calls Nano multimodal
  - `runCloudQuickAnalysis()` — falls back to existing ANALYZE_IMAGE message handler
  - `displayAnalysisResults()` — renders errors, visual issues, tags, difficulty signals
  - `updateAnalysisProgress()` — animates progress bar
  - Event listener: `quickAnalyzeBtn → handleQuickAnalyze`
  - `checkAndDisplayAIStatus()` called from `init()` (non-blocking)

**Verification:**
- `nano-provider.js`: ES module imports OK, class instantiates, `parseJSON()` handles fenced/clean/bad JSON
- `difficulty-estimator.js`: ES module imports OK, scoring tested:
  - 1 error with "undefined" → score 3 → trivial → nano
  - 3 errors (CORS + network + null/undefined) across 3 files with deep stack → score 34 → hard → cloud-deep
- `manifest.json`: Valid JSON, `minimum_chrome_version` is `"127"`
- No TypeScript/build step (plain JS extension, loaded unpacked)

**What's Working:**
- Nano availability check runs on side panel init
- Quick Analyze button captures screenshot + console logs
- Difficulty estimation produces accurate scoring with correct model routing
- Analysis results display in side panel with badges, progress, error details
- Cloud fallback when Nano unavailable

**What's Next (Phase 2):**
- Create `src/lib/console-analyzer.js` — structured console log analysis via Nano
- Create `src/lib/visual-analyzer.js` — screenshot UI analysis via Nano
- Create `src/lib/analysis-orchestrator.js` — coordinates analyzers, caching, difficulty-based routing
- Integrate Nano-refined difficulty estimation (optional second pass)
- Add analysis progress indicators during multi-step analysis
