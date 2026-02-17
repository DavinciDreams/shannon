# Shannon Installation Guide

This guide provides step-by-step instructions for installing and setting up Shannon - Front-End Testing Agent.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Methods](#installation-methods)
3. [API Key Setup](#api-key-setup)
4. [Building the Extension](#building-the-extension)
5. [Loading into Chrome](#loading-into-chrome)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before installing Shannon, ensure you have the following:

### Required Software

- **Google Chrome** (version 114 or later) or **Microsoft Edge** (version 114 or later)
  - Download Chrome: https://www.google.com/chrome/
  - Download Edge: https://www.microsoft.com/edge

- **Node.js** (version 16 or later) - for development installation only
  - Download Node.js: https://nodejs.org/
  - Verify installation: `node --version`

- **npm** (comes with Node.js) - for development installation only
  - Verify installation: `npm --version`

### Required Accounts

- **GitHub Account** (for creating issues)
  - Sign up: https://github.com/signup

- **AI Provider Account** (at least one required for AI analysis):
  - Zai (Zhipu AI): https://open.bigmodel.cn/
  - OpenRouter: https://openrouter.ai/
  - Claude Code (Anthropic): https://console.anthropic.com/

### System Requirements

- **Operating System**: Windows, macOS, or Linux
- **Memory**: 4GB RAM minimum (8GB recommended)
- **Disk Space**: 50MB free space
- **Internet Connection**: Required for AI analysis and GitHub integration

---

## Installation Methods

Shannon can be installed in two ways:

### Method 1: Chrome Web Store (Recommended)

**Coming Soon** - Shannon will be available on the Chrome Web Store for easy installation.

### Method 2: Manual Installation (Development)

For developers or users who want to use the latest development version.

---

## Building the Extension

This section applies to Manual Installation only.

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/DavinciDreams/shannon.git

# Navigate to the shannon directory
cd shannon
```

### Step 2: Install Dependencies

```bash
# Install npm dependencies
npm install
```

This will install:
- `atlas-agents` - Agent framework for AI integration
- `html2canvas` - Screenshot capture library

### Step 3: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Edit the `.env` file with your API credentials:

```env
# GitHub OAuth Configuration (Required for GitHub Issues)
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Vision AI Providers (At least one required for AI Analysis)
ZAI_API_KEY=your_zai_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Note:** You can also configure API keys through the Shannon UI after installation. The `.env` file is used for development builds.

### Step 4: Build the Extension

```bash
# Build runtime configuration
npm run build:config
```

This generates the `src/config/runtime-config.js` file with your environment variables.

### Step 5: Verify Build

Ensure the following files exist:
- `manifest.json`
- `src/config/runtime-config.js`
- `src/service-worker/service-worker.js`
- `src/sidepanel/sidepanel.html`
- `icons/` directory with icon files

---

## Loading into Chrome

### Step 1: Open Extensions Page

1. Open Google Chrome
2. Navigate to `chrome://extensions/` in the address bar
3. Or go to Chrome menu (⋮) → More tools → Extensions

### Step 2: Enable Developer Mode

1. Look for the "Developer mode" toggle in the top-right corner
2. Click the toggle to enable it
3. Additional options will appear

### Step 3: Load the Extension

1. Click the "Load unpacked" button (top-left)
2. A file dialog will open
3. Navigate to the `shannon` directory
4. Select the folder and click "Select Folder"

### Step 4: Verify Installation

1. Shannon should appear in your extensions list
2. The extension card should show:
   - Name: "Shannon - Front-End Testing Agent"
   - Version: 1.0.0
   - ID: A unique extension ID

### Step 5: Pin to Toolbar (Recommended)

1. Click the puzzle piece icon (🧩) in Chrome's toolbar
2. Find "Shannon - Front-End Testing Agent" in the list
3. Click the pin icon (📌) next to it
4. Shannon will now appear in your toolbar for easy access

### Step 6: Grant Permissions

When you first use Shannon, you may need to grant permissions:

1. Click the Shannon icon in your toolbar
2. Chrome may ask for permissions:
   - **Access your data for all websites** - Required for element inspection and console monitoring
   - **Display notifications** - Optional, for issue creation notifications
3. Review the permissions and click "Allow"

---

## API Key Setup

You can set up API keys either through the `.env` file (development) or through the Shannon UI.

### Option 1: Through Shannon UI (Recommended)

1. Click the Shannon icon in your toolbar
2. Click the Settings icon (⚙️) in the side panel
3. Scroll to "🤖 Vision AI Providers"
4. Enter your API keys:
   - **Zai API Key**: Your Zhipu AI API key
   - **OpenRouter API Key**: Your OpenRouter API key
   - **Claude API Key**: Your Anthropic API key
5. Click "Save"

### Option 2: Through .env File (Development)

Edit the `.env` file in the shannon directory:

```env
# Zai (Zhipu AI)
ZAI_API_KEY=your_zai_api_key_here

# OpenRouter
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Claude Code (Anthropic)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Then rebuild the extension:

```bash
npm run build:config
```

Reload the extension in Chrome:
1. Go to `chrome://extensions/`
2. Find Shannon
3. Click the reload icon (🔄)

### Getting API Keys

#### Zai (Zhipu AI) API Key

1. Visit [https://open.bigmodel.cn/](https://open.bigmodel.cn/)
2. Sign up or log in
3. Navigate to the API Keys section
4. Click "Create API Key"
5. Copy the generated key
6. Add it to Shannon settings

**Pricing:** Free tier available with rate limits. Paid plans start at ¥0.005/1K tokens.

#### OpenRouter API Key

1. Visit [https://openrouter.ai/keys](https://openrouter.ai/keys)
2. Sign up or log in
3. Click "Create New Key"
4. Give it a name (e.g., "Shannon")
5. Copy the generated key
6. Add it to Shannon settings

**Pricing:** Pay-as-you-go. Prices vary by model. Most models cost $0.001-$0.01 per 1K tokens.

#### Claude Code (Anthropic) API Key

1. Visit [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys
4. Click "Create Key"
5. Copy the generated key (starts with `sk-ant-`)
6. Add it to Shannon settings

**Pricing:** Free tier: $5 credit. Paid plans start at $0.003 per 1K input tokens, $0.015 per 1K output tokens.

### GitHub OAuth Setup (Optional)

For creating GitHub issues, you can either:
1. Use Shannon's built-in OAuth flow (recommended)
2. Use a personal access token

#### Option 1: Built-in OAuth Flow (Recommended)

1. Open Shannon
2. Click Settings (⚙️)
3. Scroll to "🐙 GitHub Integration"
4. Click "Sign in with GitHub"
5. Authorize the application
6. You're ready to create issues!

#### Option 2: Personal Access Token

1. Visit [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name (e.g., "Shannon")
4. Select scopes:
   - `repo` (Full control of private repositories)
   - OR `public_repo` (Access to public repositories only)
5. Click "Generate token"
6. Copy the token
7. Add it to Shannon settings

**Note:** Personal access tokens are stored securely in Chrome's local storage.

---

## Verification

After installation, verify Shannon is working correctly:

### Test 1: Extension Loads

1. Go to `chrome://extensions/`
2. Find Shannon in the list
3. Verify no errors are shown
4. Status should be "Enabled"

### Test 2: Side Panel Opens

1. Click the Shannon icon in your toolbar
2. The side panel should open on the right
3. You should see the main interface

### Test 3: Element Selection Works

1. Navigate to any website (e.g., https://example.com)
2. Open Shannon
3. Click "Select Element"
4. Move your cursor over elements
5. Elements should highlight as you hover
6. Click an element to select it

### Test 4: Console Monitoring Works

1. Open Shannon
2. Navigate to the "Console" tab
3. Open the browser's developer console (F12)
4. Type `console.error("Test error")` and press Enter
5. The error should appear in Shannon's console tab

### Test 5: Screenshot Capture Works

1. Open Shannon on any webpage
2. Click "Capture Full Page"
3. A screenshot should appear in the gallery
4. Click the screenshot to view it full-size

### Test 6: AI Analysis Works (Requires API Key)

1. Set up at least one AI provider API key
2. Select an element or capture a screenshot
3. Click "Analyze with AI"
4. Choose your AI provider
5. Wait for analysis to complete
6. Results should appear in the side panel

### Test 7: GitHub Issue Creation Works

1. Set up GitHub OAuth or personal access token
2. Capture a screenshot or select an element
3. Click "Create GitHub Issue"
4. Select a repository
5. Fill in title and description
6. Click "Create Issue"
7. Issue should be created and link should appear

---

## Troubleshooting

### Extension Won't Load

**Problem:** Extension shows errors in `chrome://extensions/`

**Solutions:**

1. **Check Chrome Version**
   ```bash
   # Check Chrome version
   chrome://version/
   ```
   Ensure you're using Chrome 114 or later

2. **Verify Manifest Syntax**
   - Open `manifest.json` in a text editor
   - Ensure it's valid JSON (no trailing commas)
   - Use a JSON validator if needed

3. **Check File Permissions**
   - Ensure all files in the `shannon` directory are readable
   - On Windows: Right-click → Properties → Security
   - On macOS/Linux: `chmod -R +r shannon/`

4. **Reload Extension**
   - Go to `chrome://extensions/`
   - Find Shannon
   - Click the reload icon (🔄)

### API Key Errors

**Problem:** "Invalid API key" or authentication errors

**Solutions:**

1. **Verify API Key**
   - Check that the API key is correct
   - Ensure no extra spaces or characters
   - Try regenerating the key

2. **Check API Key Permissions**
   - Ensure the key has necessary permissions
   - Some providers require specific scopes

3. **Check API Credit Balance**
   - Log in to your AI provider's dashboard
   - Verify you have available credits
   - Add credits if needed

4. **Try Different Provider**
   - If one provider doesn't work, try another
   - Each provider has different rate limits and pricing

### Console Logs Not Capturing

**Problem:** Console logs don't appear in Shannon

**Solutions:**

1. **Refresh the Page**
   - Navigate to a new page
   - Refresh after opening Shannon

2. **Check Content Scripts**
   - Open browser console (F12)
   - Look for errors related to content scripts
   - Ensure scripts are injected

3. **Verify Permissions**
   - Go to `chrome://extensions/`
   - Click "Details" for Shannon
   - Check "Site access" permissions
   - Ensure "Allow on all sites" is selected

### Element Selection Not Working

**Problem:** Can't select or highlight elements

**Solutions:**

1. **Check Page Type**
   - Ensure you're on a regular webpage (not chrome://, about:, etc.)
   - Try on https://example.com

2. **Refresh the Page**
   - Navigate to a new page
   - Refresh after opening Shannon

3. **Check Content Scripts**
   - Open browser console (F12)
   - Look for element inspector errors
   - Ensure `element-inspector.js` is loaded

4. **Reload Extension**
   - Go to `chrome://extensions/`
   - Click reload icon (🔄) for Shannon

### Screenshot Capture Fails

**Problem:** Screenshots are blank or don't capture

**Solutions:**

1. **Check Permissions**
   - Ensure `activeTab` permission is granted
   - Go to `chrome://extensions/` → Details → Permissions

2. **Check Page Type**
   - Some pages block screenshot capture
   - Try on a different website

3. **Verify html2canvas**
   - Open browser console (F12)
   - Check for html2canvas errors
   - Ensure library is loaded

4. **Reduce Page Size**
   - Very large pages may fail to capture
   - Try capturing individual elements instead

### GitHub Issues Not Creating

**Problem:** Can't create GitHub issues

**Solutions:**

1. **Check GitHub OAuth**
   - Go to Shannon Settings
   - Verify GitHub is connected
   - Re-authenticate if needed

2. **Check Repository Access**
   - Ensure you have write access to the repository
   - Try a different repository

3. **Verify Token Permissions**
   - If using personal access token, ensure it has `repo` scope
   - Regenerate token if needed

4. **Check Rate Limits**
   - GitHub has API rate limits
   - Wait a few minutes and try again

### Extension Updates

**Problem:** How to update Shannon after code changes

**Solutions:**

1. **For Development:**
   ```bash
   # Pull latest changes
   git pull origin main

   # Rebuild
   npm run build:config
   ```

2. **Reload Extension:**
   - Go to `chrome://extensions/`
   - Click reload icon (🔄) for Shannon

3. **Clear Cache (if needed):**
   - Go to Shannon Settings
   - Click "Clear All Data"
   - Reload extension

---

## Uninstallation

To remove Shannon from Chrome:

1. Go to `chrome://extensions/`
2. Find Shannon in the list
3. Click "Remove"
4. Confirm removal

**Note:** This will remove Shannon but will not delete any GitHub issues you created.

---

## Support

If you encounter issues not covered in this guide:

1. Check the [README.md](README.md) for additional information
2. Review the [Troubleshooting section](README.md#troubleshooting) in the README
3. Open an issue on GitHub: https://github.com/DavinciDreams/shannon/issues
4. Include:
   - Chrome version
   - Shannon version
   - Steps to reproduce
   - Error messages (if any)
   - Screenshots (if applicable)

---

## Next Steps

After successful installation:

1. Read the [README.md](README.md) for usage instructions
2. Explore the features:
   - Element selection and highlighting
   - Console monitoring
   - Screenshot capture
   - AI analysis
   - GitHub issue creation
3. Customize settings to your preferences
4. Start testing websites with Shannon!

---

**Happy Testing! 🚀**
