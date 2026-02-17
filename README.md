# Shannon - Front-End Testing Agent 🔍

**Intelligent UI Testing & Analysis**

A Chrome extension that empowers developers to test websites with AI-powered visual analysis, console monitoring, and seamless GitHub issue reporting. Capture, analyze, and report bugs with unprecedented efficiency.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/DavinciDreams/shannon/releases/tag/v1.0.0)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎯 Element Selection & Highlighting
- **Interactive element picker** - Click to select any DOM element
- **Visual highlighting** - Clear visual feedback on selected components
- **Component extraction** - Get HTML, CSS, and attributes
- **Screenshot capture** - Capture individual components or full pages

<p align="center">
<img src="assets/Screenshot%202026-02-14%20063750.png" width="70%" />
</p>

</td>
<td width="50%">

### 📊 Console Monitoring
- **Real-time console capture** - Capture errors, warnings, and logs
- **Error categorization** - Automatic filtering and categorization
- **Error history** - Persistent storage of console events
- **Contextual information** - Stack traces and source locations

<p align="center">
<img src="assets/Screenshot%202026-02-14%20063601.png" width="70%" />
</p>

</td>
</tr>
</table>

### 🤖 AI-Powered Analysis

Shannon integrates with multiple vision AI providers to analyze your UI components:

#### Zai (Zhipu AI)
- Advanced Chinese and English language support
- High-accuracy visual recognition
- Detailed component analysis and suggestions

#### OpenRouter
- Access to multiple AI models
- Flexible model selection
- Competitive pricing

#### Claude Code (Anthropic)
- State-of-the-art vision capabilities
- Detailed technical analysis
- Code-aware suggestions

### 🐙 GitHub Integration

- **Create GitHub Issues** with screenshots and analysis
- **Attach console logs** automatically
- **Include AI insights** in issue reports
- **OAuth authentication** - secure, no tokens to manage
- **Repository selection** - choose from all your repos

## 🌐 Browser Compatibility

**✅ Fully Supported:**
- Google Chrome (recommended)
- Microsoft Edge

**⚠️ Limited Support:**
- Brave Browser - May require additional permissions

**❌ Not Supported:**
- Firefox - Manifest V3 limitations
- Safari - Limited extension API support

## 🚀 Quick Start

### Installation

**From Chrome Web Store (Recommended):**
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) (link coming soon)
2. Click "Add to Chrome"
3. Confirm the permissions
4. Pin the extension to your toolbar

**For Development:**
1. Clone this repository
2. Install dependencies: `npm install`
3. Build the extension: `npm run build:config`
4. Open Chrome and go to `chrome://extensions/`
5. Enable "Developer mode" (toggle in top-right)
6. Click "Load unpacked"
7. Select the `shannon` directory
8. Pin the extension to your toolbar

### First Run

1. Click the Shannon icon in your toolbar (or press `Alt+Shift+S`)
2. Grant necessary permissions when prompted
3. Set up your AI provider API keys (see Configuration below)
4. Navigate to any website to start testing!

## ⚙️ Configuration

### API Key Setup

Shannon requires API keys for AI vision providers. You can use one or multiple providers:

#### 1. Zai (Zhipu AI)

1. Visit [https://open.bigmodel.cn/](https://open.bigmodel.cn/)
2. Sign up or log in
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the key and add it to Shannon settings

#### 2. OpenRouter

1. Visit [https://openrouter.ai/keys](https://openrouter.ai/keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key and add it to Shannon settings

#### 3. Claude Code (Anthropic)

1. Visit [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key (should start with `sk-ant-`)
5. Copy the key and add it to Shannon settings

#### Adding API Keys in Shannon

1. Open Shannon side panel
2. Click the Settings icon (⚙️)
3. Scroll to "🤖 Vision AI Providers"
4. Enter your API keys for the providers you want to use
5. Click "Save"

**Note:** API keys are stored securely in Chrome's local storage and never shared with third parties.

### GitHub Integration Setup

1. Click the Settings icon (⚙️) in Shannon
2. Scroll to "🐙 GitHub Integration"
3. Click "Sign in with GitHub"
4. Authorize the application
5. You can now create GitHub Issues with screenshots and analysis!

**Note:** Your GitHub OAuth credentials are stored securely in Chrome's storage and never shared.

## 📋 Usage Guide

### Element Selection & Highlighting

1. **Open Shannon** on any webpage
2. Click the "Select Element" button in the side panel
3. Move your cursor over elements to see them highlighted
4. Click on any element to select it
5. The selected element will be outlined in the side panel with:
   - Element tag and class information
   - CSS properties
   - HTML structure
   - Screenshot of the element

### Console Monitoring

1. **Open Shannon** on any webpage
2. Navigate to the "Console" tab in the side panel
3. Console events are automatically captured and displayed:
   - Errors (red)
   - Warnings (yellow)
   - Info logs (blue)
4. Click on any log entry to see:
   - Full stack trace
   - Source location
   - Timestamp
5. Use filters to show/hide specific log types

### Screenshot Capture

1. **Capture Full Page:**
   - Click "Capture Full Page" button
   - Shannon will capture the entire visible page
   - Screenshot is saved to the gallery

2. **Capture Selected Element:**
   - Select an element using the element picker
   - Click "Capture Element" button
   - Only the selected element is captured

3. **Screenshot Gallery:**
   - All screenshots are saved in the gallery
   - Click to view full-size
   - Right-click to download or delete

### AI Analysis

1. **Analyze with AI:**
   - Select an element or capture a screenshot
   - Click "Analyze with AI" button
   - Choose your preferred AI provider (Zai, OpenRouter, or Claude)
   - Wait for the analysis to complete

2. **Analysis Results:**
   - Visual component description
   - Potential accessibility issues
   - UX improvement suggestions
   - Code optimization tips
   - Bug detection

3. **Using Analysis in Issues:**
   - After analysis, click "Create GitHub Issue"
   - The AI analysis is automatically included
   - Add your own comments if needed
   - Select repository and create the issue

### Creating GitHub Issues

1. **Prepare Your Report:**
   - Select an element or capture a screenshot
   - Optionally run AI analysis
   - Check console logs for relevant errors

2. **Create Issue:**
   - Click "Create GitHub Issue" button
   - Select repository from dropdown
   - Edit title and description
   - Review attached content:
     - Screenshots
     - Console logs
     - AI analysis
     - Element information
   - Click "Create Issue"

3. **Track Your Issues:**
   - Created issues appear in Shannon history
   - Click to open directly in GitHub
   - Status is updated automatically

## ⚙️ Settings

### General Settings
- **Default AI Provider** - Choose your preferred vision AI
- **Screenshot Format** - PNG or JPEG
- **Console Log Retention** - Days to keep logs (default: 7)

### AI Provider Settings
- **Zai API Key** - Your Zhipu AI API key
- **OpenRouter API Key** - Your OpenRouter API key
- **Claude API Key** - Your Anthropic API key
- **Model Selection** - Choose specific models for each provider

### GitHub Settings
- **OAuth Status** - View connection status and workspace
- **Default Repository** - Set a default repo for issues
- **Sign Out** - Disconnect GitHub integration

### Advanced Settings
- **Console Log Filtering** - Customize log level filters
- **Element Inspector Mode** - Hover vs click selection
- **Clear All Data** - Reset extension (deletes all data and settings)

## 🛠️ Development

### Project Structure

```
shannon/
├── manifest.json              # Extension configuration (Manifest V3)
├── .env.example              # API credentials template
├── package.json              # Dependencies and scripts
├── scripts/
│   └── build-config.js       # Runtime config generator
├── icons/                    # Extension icons (16x16, 48x48, 128x128)
├── src/
│   ├── config/
│   │   ├── oauth-config.js   # OAuth credential management
│   │   └── vision-config.js  # Vision model provider configs
│   ├── lib/
│   │   ├── github-oauth.js   # GitHub OAuth 2.0 flow
│   │   ├── github-service.js # GitHub API wrappers
│   │   ├── github-cache.js   # Repository caching
│   │   ├── storage.js        # Chrome storage wrappers
│   │   ├── vision-service.js # Vision model integration
│   │   ├── console-monitor.js # Console log capture
│   │   ├── element-selector.js # DOM element selection
│   │   ├── screenshot-capture.js # Screenshot capture
│   │   ├── issue-builder.js  # GitHub issue construction
│   │   └── providers/
│   │       ├── zai-provider.js      # Zai API integration
│   │       ├── openrouter-provider.js # OpenRouter API
│   │       └── claude-provider.js   # Claude API integration
│   ├── content-scripts/
│   │   ├── main.js           # Main content script entry
│   │   ├── element-inspector.js # DOM inspection
│   │   ├── console-interceptor.js # Console log interception
│   │   └── element-selector.js # Element selection UI
│   ├── service-worker/
│   │   └── service-worker.js # Background task management
│   ├── sidepanel/
│   │   ├── sidepanel.html    # Side panel UI
│   │   ├── sidepanel.css     # Side panel styles
│   │   └── sidepanel.js      # Side panel logic
│   └── oauth/
│       ├── oauth-callback.html # OAuth callback page
│       └── oauth-callback.js   # OAuth callback handler
```

### Building for Development

```bash
# Install dependencies
npm install

# Build runtime configuration
npm run build:config

# Load extension in Chrome
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select the shannon directory
```

### Environment Variables

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# GitHub OAuth (for issue creation)
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Vision AI Providers (for analysis)
ZAI_API_KEY=your_zai_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## 🔧 Troubleshooting

### Extension Not Loading

**Problem:** Extension won't load in Chrome

**Solutions:**
- Ensure you're using Chrome 114 or later
- Check that Developer mode is enabled
- Verify the manifest.json is valid JSON
- Check Chrome console for error messages

### API Key Errors

**Problem:** "Invalid API key" or authentication errors

**Solutions:**
- Verify your API key is correct
- Check that the key has necessary permissions
- Ensure you haven't exceeded rate limits
- Try generating a new API key

### Console Logs Not Capturing

**Problem:** Console logs not appearing in Shannon

**Solutions:**
- Refresh the page after opening Shannon
- Check that content scripts are injected
- Verify console interceptor is initialized
- Check browser console for errors

### Element Selection Not Working

**Problem:** Can't select or highlight elements

**Solutions:**
- Ensure you're on a valid webpage (not chrome:// pages)
- Refresh the page
- Check that content scripts are loaded
- Try clicking "Reload Extension" in chrome://extensions/

### Screenshot Capture Fails

**Problem:** Screenshots not capturing or appearing blank

**Solutions:**
- Check activeTab permission is granted
- Ensure you're not on a restricted page (chrome://, etc.)
- Verify html2canvas library is loaded
- Try capturing a different element

### GitHub Issues Not Creating

**Problem:** Can't create GitHub issues

**Solutions:**
- Verify GitHub OAuth is connected
- Check you have write access to the repository
- Ensure your GitHub token has necessary permissions
- Check GitHub API rate limits

### AI Analysis Not Working

**Problem:** AI analysis fails or times out

**Solutions:**
- Verify your API key is valid and active
- Check your API credit balance
- Try a different AI provider
- Reduce image size if analysis times out
- Check your internet connection

## 📚 Additional Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Zhipu AI Documentation](https://open.bigmodel.cn/dev/api)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on the foundation of the "Duly Noted" extension
- Uses [html2canvas](https://html2canvas.hertzen.com/) for screenshot capture
- Integrates with multiple AI vision providers
- Powered by Chrome Extension Manifest V3

---

**Made with ❤️ for developers who care about quality**
