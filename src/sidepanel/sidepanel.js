/**
 * Front-End Testing Agent Side Panel
 * Main UI controller with testing features
 */

import { getDrafts, getHistory, getSettings, updateSettings, resetSettings } from '../lib/storage.js';
import { formatRelativeTime, getDestinationIcon, truncateText } from '../utils/helpers.js';
import { TranscriptionService } from '../lib/transcription-service.js';
import { GitHubOAuth } from '../lib/github-oauth.js';
import { GitHubService } from '../lib/github-service.js';
import { GitHubCache } from '../lib/github-cache.js';
import { NotionOAuth } from '../lib/notion-oauth.js';
import { NotionService } from '../lib/notion-service.js';
import { VisionService } from '../lib/vision-service.js';
import { VISION_PROVIDERS, getProviderModels } from '../config/vision-config.js';
import { IssueBuilder } from '../lib/issue-builder.js';
import NanoProvider from '../lib/nano-provider.js';
import DifficultyEstimator from '../lib/difficulty-estimator.js';

console.log('[Side Panel] Loading...');

// Initialize services
let transcriptionService = null;
let visionService = null;
let issueBuilder = null;

// AI Analysis services
const nanoProvider = new NanoProvider();
const difficultyEstimator = new DifficultyEstimator();

// ============================================================================
// Screen Management
// ============================================================================

const screens = {
  RECORDING: 'recordingScreen',
  DESTINATION: 'destinationScreen',
  GITHUB_ISSUE: 'githubIssueScreen',
  GITHUB_PROJECT: 'githubProjectScreen',
  HISTORY: 'historyScreen',
  SETTINGS: 'settingsScreen',
  TESTING_DASHBOARD: 'testingDashboardScreen',
  ELEMENT_INSPECTOR: 'elementInspectorScreen',
  CONSOLE_LOGS: 'consoleLogsScreen',
  AI_ANALYSIS: 'aiAnalysisScreen',
  TESTING_GITHUB_ISSUE: 'testingGitHubIssueScreen',
};

let currentScreen = screens.TESTING_DASHBOARD;
let previousScreen = screens.TESTING_DASHBOARD;

function showScreen(screenId) {
  try {
    // Validate screenId
    if (!screenId) {
      console.error('[Side Panel] showScreen called with invalid screenId:', screenId);
      return;
    }

    // Hide all screens
    Object.values(screens).forEach(id => {
      const screen = document.getElementById(id);
      if (screen) {
        screen.classList.remove('active');
      }
    });

    // Show requested screen
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.classList.add('active');
      currentScreen = screenId;
      console.log('[Side Panel] Showing screen:', screenId);
    } else {
      console.error('[Side Panel] Screen not found:', screenId);
      showToast('Error: Screen not found', 'error');
    }
  } catch (error) {
    console.error('[Side Panel] Error showing screen:', error);
    showToast('Error displaying screen', 'error');
  }
}

// ============================================================================
// Mode State
// ============================================================================

let currentMode = 'recording'; // 'recording' or 'testing'

// ============================================================================
// Recording State
// ============================================================================

let isRecording = false;
let recordingStartTime = null;
let timerInterval = null;
let currentTranscription = '';

// ============================================================================
// UI Elements
// ============================================================================

// Buttons
const recordBtn = document.getElementById('recordBtn');
const recordBtnText = document.getElementById('recordBtnText');
const settingsBtn = document.getElementById('settingsBtn');
const modeSwitcherBtn = document.getElementById('modeSwitcherBtn');
const modeSwitcherText = document.getElementById('modeSwitcherText');
const viewAllHistoryBtn = document.getElementById('viewAllHistoryBtn');
const backToRecordingBtn = document.getElementById('backToRecordingBtn');
const backFromHistoryBtn = document.getElementById('backFromHistoryBtn');
const backFromSettingsBtn = document.getElementById('backFromSettingsBtn');
const editTranscriptionBtn = document.getElementById('editTranscriptionBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');

// Containers
const recordingStatus = document.getElementById('recordingStatus');
const recordingTimer = document.getElementById('recordingTimer');
const transcriptionContainer = document.getElementById('transcriptionContainer');
const transcriptionText = document.getElementById('transcriptionText');
const recentNotesList = document.getElementById('recentNotesList');
const historyList = document.getElementById('historyList');
const destinationTranscriptionPreview = document.getElementById('destinationTranscriptionPreview');

// Forms
const githubTokenInput = document.getElementById('githubToken');
const maxDurationInput = document.getElementById('maxDuration');

// GitHub OAuth elements
const githubOAuthSection = document.getElementById('githubOAuthSection');
const githubNotConnected = document.getElementById('githubNotConnected');
const githubConnected = document.getElementById('githubConnected');
const githubSignInBtn = document.getElementById('githubSignInBtn');
const githubSignOutBtn = document.getElementById('githubSignOutBtn');
const githubUsername = document.getElementById('githubUsername');
const githubAvatar = document.getElementById('githubAvatar');
const developerModeToggle = document.getElementById('developerModeToggle');
const githubDeveloperSection = document.getElementById('githubDeveloperSection');

// Notion OAuth elements
const notionOAuthSection = document.getElementById('notionOAuthSection');
const notionNotConnected = document.getElementById('notionNotConnected');
const notionConnected = document.getElementById('notionConnected');
const notionSignInBtn = document.getElementById('notionSignInBtn');
const notionSignOutBtn = document.getElementById('notionSignOutBtn');
const notionWorkspaceName = document.getElementById('notionWorkspaceName');
const notionWorkspaceIcon = document.getElementById('notionWorkspaceIcon');

// Vision Provider elements
const visionProviderSelect = document.getElementById('visionProviderSelect');
const visionModelSection = document.getElementById('visionModelSection');
const visionModelSettingsSelect = document.getElementById('visionModelSelect');
const visionApiKeySection = document.getElementById('visionApiKeySection');
const visionApiKey = document.getElementById('visionApiKey');
const testVisionApiKeyBtn = document.getElementById('testVisionApiKeyBtn');
const visionProviderHelp = document.getElementById('visionProviderHelp');
const visionProviderHelpText = document.getElementById('visionProviderHelpText');
const visionProviderDocsLink = document.getElementById('visionProviderDocsLink');

// GitHub Issue form elements
const backFromGitHubIssueBtn = document.getElementById('backFromGitHubIssueBtn');
const githubRepoSearch = document.getElementById('githubRepoSearch');
const repoList = document.getElementById('repoList');
const recentReposList = document.getElementById('recentReposList');
const allReposList = document.getElementById('allReposList');
const selectedRepoId = document.getElementById('selectedRepoId');
const issueTitle = document.getElementById('issueTitle');
const issueBody = document.getElementById('issueBody');
const issueLabels = document.getElementById('issueLabels');
const createIssueBtn = document.getElementById('createIssueBtn');
const cancelIssueBtn = document.getElementById('cancelIssueBtn');

// GitHub Project form elements
const backFromGitHubProjectBtn = document.getElementById('backFromGitHubProjectBtn');
const githubProjectSearch = document.getElementById('githubProjectSearch');
const projectList = document.getElementById('projectList');
const recentProjectsList = document.getElementById('recentProjectsList');
const allProjectsList = document.getElementById('allProjectsList');
const selectedProjectId = document.getElementById('selectedProjectId');
const projectItemTitle = document.getElementById('projectItemTitle');
const projectItemBody = document.getElementById('projectItemBody');
const createProjectItemBtn = document.getElementById('createProjectItemBtn');
const cancelProjectItemBtn = document.getElementById('cancelProjectItemBtn');

// History Detail Modal elements
const historyDetailModal = document.getElementById('historyDetailModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const closeModalBtnFooter = document.getElementById('closeModalBtnFooter');
const modalTitle = document.getElementById('modalTitle');
const modalTranscription = document.getElementById('modalTranscription');
const modalDestination = document.getElementById('modalDestination');
const modalLink = document.getElementById('modalLink');
const modalLinkSection = document.getElementById('modalLinkSection');

// ============================================================================
// Testing Dashboard Elements
// ============================================================================

// Dashboard elements
const refreshDashboardBtn = document.getElementById('refreshDashboardBtn');
const tabIconImg = document.getElementById('tabIconImg');
const tabTitle = document.getElementById('tabTitle');
const tabUrl = document.getElementById('tabUrl');
const selectElementBtn = document.getElementById('selectElementBtn');
const captureScreenshotBtn = document.getElementById('captureScreenshotBtn');
const viewConsoleLogsBtn = document.getElementById('viewConsoleLogsBtn');
const voiceNoteBtn = document.getElementById('voiceNoteBtn');
const errorCountValue = document.getElementById('errorCountValue');
const recentErrors = document.getElementById('recentErrors');
const recentTests = document.getElementById('recentTests');

// AI Status & Quick Analyze elements
const aiStatusDot = document.getElementById('aiStatusDot');
const aiStatusText = document.getElementById('aiStatusText');
const quickAnalyzeBtn = document.getElementById('quickAnalyzeBtn');
const analysisResultsPanel = document.getElementById('analysisResultsPanel');
const analysisDifficultyBadge = document.getElementById('analysisDifficultyBadge');
const analysisProviderBadge = document.getElementById('analysisProviderBadge');
const analysisProgress = document.getElementById('analysisProgress');
const analysisProgressBar = document.getElementById('analysisProgressBar');
const analysisProgressText = document.getElementById('analysisProgressText');
const analysisSummary = document.getElementById('analysisSummary');
const analysisDetails = document.getElementById('analysisDetails');

// Element Inspector elements
const backToDashboardBtn = document.getElementById('backToDashboardBtn');
const elementScreenshot = document.getElementById('elementScreenshot');
const elementTag = document.getElementById('elementTag');
const elementId = document.getElementById('elementId');
const elementClass = document.getElementById('elementClass');
const elementSize = document.getElementById('elementSize');
const elementHtmlCode = document.getElementById('elementHtmlCode');
const elementStylesList = document.getElementById('elementStylesList');
const analyzeWithAIBtn = document.getElementById('analyzeWithAIBtn');
const generateTestCasesBtn = document.getElementById('generateTestCasesBtn');
const createIssueFromInspectorBtn = document.getElementById('createIssueFromInspectorBtn');

// Console Logs elements
const backToDashboardFromLogsBtn = document.getElementById('backToDashboardFromLogsBtn');
const filterLogsBtn = document.getElementById('filterLogsBtn');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const logList = document.getElementById('logList');

// AI Analysis elements
const backToInspectorBtn = document.getElementById('backToInspectorBtn');
const visionProvider = document.getElementById('visionProvider');
const visionModelSelect = document.getElementById('visionModel');
const analysisType = document.getElementById('analysisType');
const customPrompt = document.getElementById('customPrompt');
const runAnalysisBtn = document.getElementById('runAnalysisBtn');
const analysisResults = document.getElementById('analysisResults');

// Testing GitHub Issue elements
const backToInspectorFromIssueBtn = document.getElementById('backToInspectorFromIssueBtn');
const testingIssueRepo = document.getElementById('testingIssueRepo');
const testingIssueTitle = document.getElementById('testingIssueTitle');
const testingIssueBody = document.getElementById('testingIssueBody');
const testingIssueLabels = document.getElementById('testingIssueLabels');
const attachScreenshot = document.getElementById('attachScreenshot');
const attachElementInfo = document.getElementById('attachElementInfo');
const attachConsoleLogs = document.getElementById('attachConsoleLogs');
const attachAIAnalysis = document.getElementById('attachAIAnalysis');
const testingIssuePreviewContent = document.getElementById('testingIssuePreviewContent');
const submitTestingIssueBtn = document.getElementById('submitTestingIssueBtn');

// ============================================================================
// Event Listeners
// ============================================================================

// Navigation
modeSwitcherBtn.addEventListener('click', handleModeSwitch);

settingsBtn.addEventListener('click', () => {
  previousScreen = currentScreen;
  showScreen(screens.SETTINGS);
  loadSettings();
});

viewAllHistoryBtn.addEventListener('click', () => {
  showScreen(screens.HISTORY);
  loadHistory();
});

backToRecordingBtn.addEventListener('click', () => showScreen(screens.RECORDING));
backFromHistoryBtn.addEventListener('click', () => showScreen(screens.RECORDING));
backFromSettingsBtn.addEventListener('click', () => showScreen(previousScreen));

// Recording
recordBtn.addEventListener('click', handleRecordButtonClick);

// Transcription editing
editTranscriptionBtn.addEventListener('click', () => {
  const isEditable = transcriptionText.getAttribute('contenteditable') === 'true';
  transcriptionText.setAttribute('contenteditable', !isEditable);
  editTranscriptionBtn.textContent = isEditable ? 'Edit' : 'Done';

  if (!isEditable) {
    transcriptionText.focus();
  } else {
    currentTranscription = transcriptionText.textContent.trim();
  }
});

// Destination options
document.querySelectorAll('.destination-option').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const destination = e.currentTarget.getAttribute('data-destination');
    await handleDestinationSelected(destination);
  });
});

// Settings
saveSettingsBtn.addEventListener('click', handleSaveSettings);
resetSettingsBtn.addEventListener('click', handleResetSettings);

// GitHub OAuth
githubSignInBtn.addEventListener('click', handleGitHubSignIn);
githubSignOutBtn.addEventListener('click', handleGitHubSignOut);
developerModeToggle.addEventListener('change', handleDeveloperModeToggle);

// Notion OAuth
notionSignInBtn.addEventListener('click', handleNotionSignIn);
notionSignOutBtn.addEventListener('click', handleNotionSignOut);

// Vision Provider
visionProviderSelect.addEventListener('change', handleVisionProviderChange);
testVisionApiKeyBtn.addEventListener('click', handleTestVisionApiKey);

// GitHub Issue form
backFromGitHubIssueBtn.addEventListener('click', () => showScreen(screens.DESTINATION));
cancelIssueBtn.addEventListener('click', () => showScreen(screens.DESTINATION));
createIssueBtn.addEventListener('click', handleCreateIssue);
githubRepoSearch.addEventListener('input', handleRepoSearch);
githubRepoSearch.addEventListener('focus', () => showRepoDropdown());
githubRepoSearch.addEventListener('blur', () => {
  // Delay to allow click on repo item
  setTimeout(() => hideRepoDropdown(), 300);
});

// GitHub Project form
backFromGitHubProjectBtn.addEventListener('click', () => showScreen(screens.DESTINATION));
cancelProjectItemBtn.addEventListener('click', () => showScreen(screens.DESTINATION));
createProjectItemBtn.addEventListener('click', handleCreateProjectItem);
githubProjectSearch.addEventListener('input', handleProjectSearch);
githubProjectSearch.addEventListener('focus', () => showProjectDropdown());
githubProjectSearch.addEventListener('blur', () => {
  setTimeout(() => hideProjectDropdown(), 300);
});

// Note: OAuth callback is now handled directly by chrome.identity.launchWebAuthFlow
// No need for message listeners

// History Detail Modal
closeModalBtn.addEventListener('click', hideHistoryDetailModal);
closeModalBtnFooter.addEventListener('click', hideHistoryDetailModal);
historyDetailModal.addEventListener('click', (e) => {
  // Close if clicking overlay (outside modal content)
  if (e.target === historyDetailModal || e.target.classList.contains('modal-overlay')) {
    hideHistoryDetailModal();
  }
});

// ============================================================================
// Testing Dashboard Event Listeners
// ============================================================================

// Dashboard
refreshDashboardBtn.addEventListener('click', loadTestingDashboard);
quickAnalyzeBtn.addEventListener('click', handleQuickAnalyze);
selectElementBtn.addEventListener('click', handleSelectElement);
captureScreenshotBtn.addEventListener('click', handleCaptureScreenshot);
viewConsoleLogsBtn.addEventListener('click', () => {
  showScreen(screens.CONSOLE_LOGS);
  loadConsoleLogs();
});
voiceNoteBtn.addEventListener('click', handleRecordButtonClick);

// Element Inspector
backToDashboardBtn.addEventListener('click', () => showScreen(screens.TESTING_DASHBOARD));
analyzeWithAIBtn.addEventListener('click', () => {
  showScreen(screens.AI_ANALYSIS);
  setupAIAnalysis('general');
});
generateTestCasesBtn.addEventListener('click', () => {
  showScreen(screens.AI_ANALYSIS);
  setupAIAnalysis('test');
});
createIssueFromInspectorBtn.addEventListener('click', () => {
  showScreen(screens.TESTING_GITHUB_ISSUE);
  setupTestingGitHubIssue();
});

// Console Logs
backToDashboardFromLogsBtn.addEventListener('click', () => showScreen(screens.TESTING_DASHBOARD));
filterLogsBtn.addEventListener('click', toggleLogFilters);
clearLogsBtn.addEventListener('click', handleClearLogs);

// Log filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    filterLogs(e.target.getAttribute('data-level'));
  });
});

// AI Analysis
backToInspectorBtn.addEventListener('click', () => showScreen(screens.ELEMENT_INSPECTOR));
runAnalysisBtn.addEventListener('click', handleRunAnalysis);
visionProvider.addEventListener('change', () => {
  populateModelDropdown(visionProvider.value, visionModelSelect);
});
// Initialize AI Analysis model dropdown with default provider
populateModelDropdown(visionProvider.value, visionModelSelect);

// Testing GitHub Issue
backToInspectorFromIssueBtn.addEventListener('click', () => showScreen(screens.ELEMENT_INSPECTOR));
submitTestingIssueBtn.addEventListener('click', handleSubmitTestingIssue);

// Update preview on input changes
testingIssueTitle.addEventListener('input', updateIssuePreview);
testingIssueBody.addEventListener('input', updateIssuePreview);
testingIssueLabels.addEventListener('input', updateIssuePreview);

// Listen for messages from content scripts and service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Side Panel] Received message:', message.type);

  switch (message.type) {
    case 'ELEMENT_SELECTED':
      handleElementSelected(message.data);
      break;
    case 'NEW_CONSOLE_LOG':
      handleNewConsoleLog(message.log);
      break;
    case 'SCREENSHOT_CAPTURED':
      handleScreenshotCaptured(message.dataUrl, message.elementData);
      break;
    case 'CONSOLE_LOGS':
      handleConsoleLogsReceived(message.logs);
      break;
    case 'VISION_ANALYSIS_RESULT':
      handleVisionAnalysisResult(message.result);
      break;
    case 'GITHUB_ISSUE_CREATED':
      handleGitHubIssueCreated(message.issue);
      break;
  }
});

// ============================================================================
// Mode Switching Functions
// ============================================================================

function handleModeSwitch() {
  console.log('[Side Panel] Switching mode from:', currentMode);
  
  if (currentMode === 'recording') {
    // Switch to testing mode
    currentMode = 'testing';
    modeSwitcherText.textContent = '🎤 Voice';
    showScreen(screens.TESTING_DASHBOARD);
    loadTestingDashboard();
  } else {
    // Switch to recording mode
    currentMode = 'recording';
    modeSwitcherText.textContent = '🧪 Testing';
    showScreen(screens.RECORDING);
  }
}

// ============================================================================
// Recording Functions
// ============================================================================

async function handleRecordButtonClick() {
  if (!isRecording) {
    await startRecording();
  } else {
    await stopRecording();
  }
}

async function startRecording() {
  console.log('[Side Panel] Starting recording...');

  try {
    // Check if Web Speech API is supported
    if (!TranscriptionService.isSupported()) {
      throw new Error('Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.');
    }

    // Open permission popup window to request microphone access
    // Side panels cannot show permission prompts, so we need a popup
    const permissionUrl = chrome.runtime.getURL('src/permission/permission.html');
    await chrome.windows.create({
      url: permissionUrl,
      type: 'popup',
      width: 450,
      height: 350,
      focused: true
    });

    showToast('Please grant microphone permission in the popup window', 'info');
    // The permission popup will notify us when permission is granted

  } catch (error) {
    console.error('[Side Panel] Error opening permission popup:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
}

// Listen for permission granted message
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'PERMISSION_GRANTED') {
    console.log('[Side Panel] Permission granted, starting recording');
    actuallyStartRecording();
  }
});

async function actuallyStartRecording() {
  try {
    // Get settings for language
    const settings = await getSettings();

    // Initialize transcription service with error boundary
    try {
      transcriptionService = new TranscriptionService({
        language: settings.transcriptionLanguage || 'en-US',
        continuous: true,
        interimResults: true
      });
      console.log('[Side Panel] Transcription service initialized successfully');
    } catch (error) {
      console.error('[Side Panel] Error initializing transcription service:', error);
      showToast('Error initializing transcription service', 'error');
      throw error;
    }

    // Set up event handlers
    transcriptionService.onInterimTranscript = (text, confidence) => {
      // Show interim results in lighter color
      const interim = document.createElement('span');
      interim.className = 'interim-text';
      interim.style.color = '#9ca3af';
      interim.textContent = text;

      // Replace previous interim text
      const existingInterim = transcriptionText.querySelector('.interim-text');
      if (existingInterim) {
        existingInterim.remove();
      }
      transcriptionText.appendChild(interim);
    };

    transcriptionService.onFinalTranscript = (text, confidence) => {
      console.log('[Side Panel] Final transcript:', text, 'confidence:', confidence);

      // Remove interim text
      const existingInterim = transcriptionText.querySelector('.interim-text');
      if (existingInterim) {
        existingInterim.remove();
      }

      // Add final text
      if (transcriptionText.textContent) {
        transcriptionText.textContent += ' ' + text;
      } else {
        transcriptionText.textContent = text;
      }

      // Update current transcription
      currentTranscription = transcriptionText.textContent.trim();
    };

    transcriptionService.onError = (error, type) => {
      console.error('[Side Panel] Transcription error:', error, type);

      // Stop recording on error
      if (isRecording) {
        stopRecording();
      }

      if (type === 'not-allowed') {
        showToast('Microphone access denied. Please allow microphone access in your browser settings or site permissions.', 'error');
      } else if (type === 'no-speech') {
        // Check if Brave - this often happens in Brave due to privacy blocking
        if (TranscriptionService.isBrave()) {
          showToast('Brave blocks Web Speech API. Fix: brave://settings/shields → Allow Google login for this extension.', 'error', 10000);
        } else {
          showToast('No speech detected. Please speak clearly and try again.', 'warning');
        }
      } else if (type === 'network') {
        if (TranscriptionService.isBrave()) {
          showToast('Network blocked by Brave. Fix: brave://settings/shields → Allow Google login. Or use Chrome/Edge.', 'error', 10000);
        } else {
          showToast('Network error. Web Speech API requires internet connection.', 'error');
        }
      } else {
        showToast(`Error: ${error.message}`, 'error');
      }
    };

    transcriptionService.onStart = () => {
      console.log('[Side Panel] Transcription started');
      isRecording = true;
      recordingStartTime = Date.now();

      // Update UI
      recordBtn.classList.remove('btn-primary');
      recordBtn.classList.add('btn-danger');
      recordBtnText.textContent = 'Stop Recording';

      recordingStatus.className = 'status-recording';
      recordingStatus.querySelector('.status-text').textContent = 'Recording... Speak now!';

      recordingTimer.style.display = 'block';
      transcriptionContainer.style.display = 'block';
      transcriptionText.textContent = '';

      // Start timer
      startTimer();

      showToast('Recording started - speak now!', 'success');
    };

    transcriptionService.onStop = () => {
      console.log('[Side Panel] Transcription stopped');
    };

    // Start transcription
    await transcriptionService.start();

  } catch (error) {
    console.error('[Side Panel] Error starting recording:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
}

async function stopRecording() {
  console.log('[Side Panel] Stopping recording...');

  try {
    // Stop transcription service
    if (transcriptionService) {
      if (transcriptionService.isListening()) {
        transcriptionService.stop();
      }
      transcriptionService.dispose();
      transcriptionService = null;
    }

    isRecording = false;
    stopTimer();

    // Update UI
    recordBtn.classList.remove('btn-danger');
    recordBtn.classList.add('btn-primary');
    recordBtnText.textContent = 'Start Recording';

    recordingStatus.className = 'status-idle';
    recordingStatus.querySelector('.status-text').textContent = 'Recording Complete';

    recordingTimer.style.display = 'none';

    // Remove any interim text
    const existingInterim = transcriptionText.querySelector('.interim-text');
    if (existingInterim) {
      existingInterim.remove();
    }

    // Get final transcription
    currentTranscription = transcriptionText.textContent.trim();

    if (!currentTranscription) {
      showToast('No speech detected. Please try again.', 'warning');
      return;
    }

    showToast('Recording stopped', 'success');

    // Show destination chooser
    await showDestinationChooser();

  } catch (error) {
    console.error('[Side Panel] Error stopping recording:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
}

function startTimer() {
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    recordingTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// ============================================================================
// Destination Chooser
// ============================================================================

async function showDestinationChooser() {
  destinationTranscriptionPreview.textContent = truncateText(currentTranscription, 200);

  // Enable/disable destination options based on OAuth authentication
  const isGitHubAuthenticated = await GitHubOAuth.isAuthenticated();
  const isNotionAuthenticated = await NotionOAuth.isAuthenticated();
  const settings = await getSettings();

  document.querySelector('[data-destination="github-issue"]').disabled = !isGitHubAuthenticated;
  document.querySelector('[data-destination="github-project"]').disabled = !isGitHubAuthenticated;
  document.querySelector('[data-destination="notion"]').disabled = !isNotionAuthenticated;
  document.querySelector('[data-destination="onenote"]').disabled = !settings.onenoteToken;

  showScreen(screens.DESTINATION);
}

async function handleDestinationSelected(destination) {
  console.log('[Side Panel] Destination selected:', destination);

  if (destination === 'draft') {
    await saveDraft();
  } else if (destination === 'github-issue') {
    await showGitHubIssueForm();
  } else if (destination === 'github-project') {
    await showGitHubProjectForm();
  } else if (destination === 'notion') {
    await handleNotionDestination();
  } else {
    showToast(`${destination} integration coming in later phases`, 'warning');
  }
}

async function saveDraft() {
  try {
    const { generateUUID } = await import('../utils/helpers.js');
    const { saveDraft: saveDraftToStorage } = await import('../lib/storage.js');

    const draft = {
      id: generateUUID(),
      timestamp: Date.now(),
      transcription: currentTranscription,
    };

    // Save directly to chrome.storage
    const success = await saveDraftToStorage(draft);

    if (success) {
      showToast('Draft saved!', 'success');

      // Reset recording state
      currentTranscription = '';
      transcriptionText.textContent = '';
      transcriptionContainer.style.display = 'none';
      recordingStatus.querySelector('.status-text').textContent = 'Ready to Record';

      // Show recording screen
      showScreen(screens.RECORDING);

      // Refresh recent notes
      await loadRecentNotes();
    } else {
      throw new Error('Failed to save draft');
    }
  } catch (error) {
    console.error('[Side Panel] Error saving draft:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
}

// ============================================================================
// History Functions
// ============================================================================

async function loadHistory() {
  try {
    const drafts = await getDrafts();
    const history = await getHistory();

    // Combine drafts and history
    const allItems = [
      ...drafts.map(d => ({ ...d, status: 'draft', destination: 'draft' })),
      ...history
    ];

    // Sort by timestamp (most recent first)
    allItems.sort((a, b) => b.timestamp - a.timestamp);

    if (allItems.length === 0) {
      historyList.innerHTML = '<p class="empty-state">No history yet.</p>';
      return;
    }

    historyList.innerHTML = allItems.map(item => `
      <div class="note-card" data-id="${item.id}">
        <div class="note-header">
          <span class="note-icon">${getDestinationIcon(item.destination)}</span>
          <span class="note-title">${truncateText(item.transcription, 50)}</span>
        </div>
        <div class="note-meta">
          ${formatRelativeTime(item.timestamp)}
          ${item.status === 'draft' ? '• Draft' : ''}
        </div>
      </div>
    `).join('');

    // Add click handlers
    historyList.querySelectorAll('.note-card').forEach(card => {
      card.addEventListener('click', () => {
        const itemId = card.getAttribute('data-id');
        handleHistoryItemClick(itemId, allItems);
      });
    });
  } catch (error) {
    console.error('[Side Panel] Error loading history:', error);
    historyList.innerHTML = '<p class="empty-state text-danger">Error loading history</p>';
  }
}

async function loadRecentNotes() {
  try {
    const drafts = await getDrafts();
    const history = await getHistory();

    const allItems = [
      ...drafts.map(d => ({ ...d, status: 'draft', destination: 'draft' })),
      ...history
    ];

    allItems.sort((a, b) => b.timestamp - a.timestamp);
    const recent = allItems.slice(0, 3);

    if (recent.length === 0) {
      recentNotesList.innerHTML = '<p class="empty-state">No notes yet. Start recording to create your first note!</p>';
      return;
    }

    recentNotesList.innerHTML = recent.map(item => `
      <div class="note-card" data-id="${item.id}">
        <div class="note-header">
          <span class="note-icon">${getDestinationIcon(item.destination)}</span>
          <span class="note-title">${truncateText(item.transcription, 40)}</span>
        </div>
        <div class="note-meta">${formatRelativeTime(item.timestamp)}</div>
      </div>
    `).join('');

    recentNotesList.querySelectorAll('.note-card').forEach(card => {
      card.addEventListener('click', () => {
        const itemId = card.getAttribute('data-id');
        handleHistoryItemClick(itemId, allItems);
      });
    });
  } catch (error) {
    console.error('[Side Panel] Error loading recent notes:', error);
  }
}

function handleHistoryItemClick(itemId, allItems) {
  const item = allItems.find(i => i.id === itemId);
  if (!item) return;

  if (item.status === 'draft') {
    // TODO: Show draft promotion UI in Phase 3
    showToast('Draft promotion coming in Phase 3', 'info');
  } else {
    // Show detail modal with transcription and link
    showHistoryDetailModal(item);
  }
}

// ============================================================================
// Settings Functions
// ============================================================================

async function loadSettings() {
  try {
    const settings = await getSettings();

    githubTokenInput.value = settings.githubToken || '';
    maxDurationInput.value = settings.maxRecordingDuration || 300;

    // Load vision settings
    const visionSettings = settings.visionSettings || {};
    if (visionSettings.provider) {
      visionProviderSelect.value = visionSettings.provider;
      const apiKeyKey = `${visionSettings.provider}ApiKey`;
      visionApiKey.value = visionSettings[apiKeyKey] || '';

      // Populate and select model
      populateModelDropdown(visionSettings.provider, visionModelSettingsSelect);
      if (visionSettings.model && visionModelSettingsSelect) {
        visionModelSettingsSelect.value = visionSettings.model;
      }
      visionModelSection.style.display = 'block';

      // Show API key section and help text
      visionApiKeySection.style.display = 'block';
      visionProviderHelp.style.display = 'block';

      // Update help text and docs link
      const info = VISION_PROVIDER_INFO[visionSettings.provider];
      if (info) {
        visionProviderHelpText.textContent = info.helpText;
        visionProviderDocsLink.href = info.docsUrl;
      }

      // Also sync model to AI Analysis screen
      populateModelDropdown(visionSettings.provider, visionModelSelect);
      if (visionSettings.model && visionModelSelect) {
        visionModelSelect.value = visionSettings.model;
      }
      visionProvider.value = visionSettings.provider;
    }

    // Update OAuth UIs
    await updateGitHubConnectionUI();
    await updateNotionConnectionUI();
  } catch (error) {
    console.error('[Side Panel] Error loading settings:', error);
    showToast('Error loading settings', 'error');
  }
}

async function handleSaveSettings() {
  try {
    const updates = {
      githubToken: githubTokenInput.value.trim() || null,
      maxRecordingDuration: parseInt(maxDurationInput.value) || 300,
    };

    // Save vision settings if provider is selected
    const selectedProvider = visionProviderSelect.value;
    if (selectedProvider) {
      const visionSettings = {
        provider: selectedProvider,
        model: visionModelSettingsSelect ? visionModelSettingsSelect.value : null,
        [`${selectedProvider}ApiKey`]: visionApiKey.value.trim() || '',
      };
      updates.visionSettings = visionSettings;
    }

    const success = await updateSettings(updates);

    if (success) {
      showToast('Settings saved!', 'success');
    } else {
      throw new Error('Failed to save settings');
    }
  } catch (error) {
    console.error('[Side Panel] Error saving settings:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
}

async function handleResetSettings() {
  if (!confirm('Are you sure you want to reset all settings to defaults?')) {
    return;
  }

  try {
    const success = await resetSettings();

    if (success) {
      showToast('Settings reset to defaults', 'success');
      await loadSettings();
    } else {
      throw new Error('Failed to reset settings');
    }
  } catch (error) {
    console.error('[Side Panel] Error resetting settings:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
}

// ============================================================================
// Vision Provider Functions
// ============================================================================

const VISION_PROVIDER_INFO = {
  zai: {
    name: 'Zai (Zhipu AI)',
    apiKeyEnv: 'ZAI_API_KEY',
    helpText: 'Get your API key from https://open.bigmodel.cn/usercenter/apikeys',
    docsUrl: 'https://open.bigmodel.cn/'
  },
  openrouter: {
    name: 'OpenRouter',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    helpText: 'Get your API key from https://openrouter.ai/keys',
    docsUrl: 'https://openrouter.ai/'
  },
  claude: {
    name: 'Claude Code (Anthropic)',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    helpText: 'Get your API key from https://console.anthropic.com/',
    docsUrl: 'https://docs.anthropic.com/'
  }
};

/**
 * Populate a model dropdown based on the selected provider
 * @param {string} providerKey - Provider key ('zai', 'openrouter', 'claude')
 * @param {HTMLSelectElement} selectElement - The select element to populate
 */
function populateModelDropdown(providerKey, selectElement) {
  if (!selectElement) return;
  selectElement.innerHTML = '';

  const models = getProviderModels(providerKey);
  const providerConfig = VISION_PROVIDERS[providerKey];

  if (models.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'No models available';
    selectElement.appendChild(opt);
    return;
  }

  models.forEach(model => {
    const opt = document.createElement('option');
    opt.value = model.key;
    opt.textContent = model.name;
    if (providerConfig && model.key === providerConfig.defaultModel) {
      opt.selected = true;
    }
    selectElement.appendChild(opt);
  });
}

function handleVisionProviderChange() {
  const selectedProvider = visionProviderSelect.value;
  console.log('[Side Panel] Vision provider changed to:', selectedProvider);

  if (selectedProvider) {
    // Show model selector and API key input
    visionModelSection.style.display = 'block';
    visionApiKeySection.style.display = 'block';
    visionProviderHelp.style.display = 'block';

    // Populate model dropdown for settings
    populateModelDropdown(selectedProvider, visionModelSettingsSelect);

    // Update help text and docs link
    const info = VISION_PROVIDER_INFO[selectedProvider];
    visionProviderHelpText.textContent = info.helpText;
    visionProviderDocsLink.href = info.docsUrl;

    // Load existing API key for this provider
    loadVisionApiKey(selectedProvider);
  } else {
    // Hide model selector, API key input and help text
    visionModelSection.style.display = 'none';
    visionApiKeySection.style.display = 'none';
    visionProviderHelp.style.display = 'none';
    visionApiKey.value = '';
  }
}

async function loadVisionApiKey(provider) {
  try {
    const settings = await getSettings();
    const visionSettings = settings.visionSettings || {};
    const apiKey = visionSettings[`${provider}ApiKey`] || '';
    visionApiKey.value = apiKey;
  } catch (error) {
    console.error('[Side Panel] Error loading vision API key:', error);
  }
}

async function handleTestVisionApiKey() {
  const provider = visionProviderSelect.value;
  const apiKey = visionApiKey.value.trim();

  if (!provider) {
    showToast('Please select a provider first', 'error');
    return;
  }

  if (!apiKey) {
    showToast('Please enter an API key', 'error');
    return;
  }

  try {
    testVisionApiKeyBtn.disabled = true;
    testVisionApiKeyBtn.textContent = 'Testing...';

    // Save API key and provider
    const settings = await getSettings();
    const visionSettings = settings.visionSettings || {};
    visionSettings.provider = provider;
    visionSettings[`${provider}ApiKey`] = apiKey;
    await updateSettings({ visionSettings });

    // Test the connection by initializing the vision service with error boundary
    try {
      if (!visionService) {
        visionService = new VisionService();
      }

      // Update the provider configuration
      visionService.setProvider(provider, apiKey);

      showToast('API key saved! You can now use AI analysis.', 'success');
    } catch (visionError) {
      console.error('[Side Panel] Error initializing vision service:', visionError);
      showToast('Error initializing vision service', 'error');
      throw visionError;
    }
  } catch (error) {
    console.error('[Side Panel] Error testing vision API key:', error);
    showToast(`Error: ${error.message}`, 'error');
  } finally {
    testVisionApiKeyBtn.disabled = false;
    testVisionApiKeyBtn.textContent = 'Test Connection';
  }
}

// ============================================================================
// GitHub OAuth Functions
// ============================================================================

async function handleGitHubSignIn() {
  try {
    console.log('[Side Panel] Initiating GitHub OAuth flow');
    githubSignInBtn.disabled = true;
    githubSignInBtn.textContent = 'Opening GitHub...';

    // Launch OAuth flow - this now completes the full flow and returns user data
    const result = await GitHubOAuth.authorize();

    // Update UI with success
    await handleGitHubAuthSuccess(result.user.login);
  } catch (error) {
    console.error('[Side Panel] GitHub sign-in error:', error);
    showToast(`Failed to sign in: ${error.message}`, 'error');
    githubSignInBtn.disabled = false;
    githubSignInBtn.innerHTML = `
      <svg class="oauth-icon" viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
      </svg>
      Sign in with GitHub
    `;
  }
}

async function handleGitHubAuthSuccess(username) {
  console.log('[Side Panel] GitHub auth successful:', username);

  // Reset sign in button
  githubSignInBtn.disabled = false;
  githubSignInBtn.innerHTML = `
    <svg class="oauth-icon" viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
    </svg>
    Sign in with GitHub
  `;

  // Update UI to show connected state
  await updateGitHubConnectionUI();

  // Enable GitHub destination options
  updateDestinationOptions();

  showToast(`Connected to GitHub as @${username}`, 'success');
}

async function handleGitHubSignOut() {
  if (!confirm('Are you sure you want to sign out of GitHub?')) {
    return;
  }

  try {
    await GitHubOAuth.signOut();
    await updateGitHubConnectionUI();
    updateDestinationOptions();
    showToast('Signed out of GitHub', 'success');
  } catch (error) {
    console.error('[Side Panel] GitHub sign-out error:', error);
    showToast(`Failed to sign out: ${error.message}`, 'error');
  }
}

function handleDeveloperModeToggle(e) {
  const isDeveloperMode = e.target.checked;

  if (isDeveloperMode) {
    githubOAuthSection.style.display = 'none';
    githubDeveloperSection.style.display = 'block';
  } else {
    githubOAuthSection.style.display = 'block';
    githubDeveloperSection.style.display = 'none';
  }
}

// ============================================================================
// Notion OAuth Functions
// ============================================================================

async function handleNotionSignIn() {
  try {
    console.log('[Side Panel] Initiating Notion OAuth flow');
    notionSignInBtn.disabled = true;
    notionSignInBtn.textContent = 'Opening Notion...';

    const result = await NotionOAuth.authorize();
    await handleNotionAuthSuccess(result.workspace.name);
  } catch (error) {
    console.error('[Side Panel] Notion sign-in error:', error);
    showToast(`Failed to sign in: ${error.message}`, 'error');
  } finally {
    notionSignInBtn.disabled = false;
    notionSignInBtn.innerHTML = `
      <svg class="oauth-icon" viewBox="0 0 100 100" width="20" height="20" fill="currentColor">
        <path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z"/>
      </svg>
      Sign in with Notion
    `;
  }
}

async function handleNotionAuthSuccess(workspaceName) {
  console.log('[Side Panel] Notion auth successful:', workspaceName);
  await updateNotionConnectionUI();
  updateDestinationOptions();
  showToast(`Connected to Notion workspace: ${workspaceName}`, 'success');
}

async function handleNotionSignOut() {
  if (!confirm('Are you sure you want to sign out of Notion?')) {
    return;
  }

  try {
    await NotionOAuth.signOut();
    await updateNotionConnectionUI();
    updateDestinationOptions();
    showToast('Signed out of Notion', 'success');
  } catch (error) {
    console.error('[Side Panel] Notion sign-out error:', error);
    showToast(`Failed to sign out: ${error.message}`, 'error');
  }
}

// ============================================================================
// Notion Integration Functions
// ============================================================================

async function handleNotionDestination() {
  try {
    console.log('[Side Panel] Handling Notion destination');

    // Get list of databases and pages from Notion
    const databases = await NotionService.getDatabases();
    const pages = await NotionService.searchPages();

    if (databases.length === 0 && pages.length === 0) {
      showToast('No databases or pages found in your Notion workspace. Please create a database or page first.', 'error');
      return;
    }

    // For MVP: Simple flow - create a new page in the first available database
    // TODO: Add UI for database/page picker in future iteration
    let parent;
    let parentName;

    if (databases.length > 0) {
      // Use first database
      parent = { database_id: databases[0].id };
      parentName = databases[0].title?.[0]?.plain_text || 'Database';
    } else {
      // Use first page
      parent = { page_id: pages[0].id };
      parentName = pages[0].properties?.title?.title?.[0]?.plain_text || 'Page';
    }

    await sendToNotion(parent, parentName);
  } catch (error) {
    console.error('[Side Panel] Error handling Notion destination:', error);
    showToast(`Failed to send to Notion: ${error.message}`, 'error');
  }
}

async function sendToNotion(parent, parentName) {
  try {
    console.log('[Side Panel] Sending note to Notion');

    // Generate title from first line of transcription
    const lines = currentTranscription.trim().split('\n');
    const title = truncateText(lines[0], 100) || 'Voice Note';
    const content = currentTranscription;

    let createdPage;

    if (parent.database_id) {
      // Create database entry with content
      const properties = {
        Name: {
          title: [
            {
              text: {
                content: title
              }
            }
          ]
        }
      };

      // Add content as child blocks
      const children = [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: content
                }
              }
            ]
          }
        }
      ];

      createdPage = await NotionService.createDatabaseEntry(parent.database_id, properties, children);
    } else {
      // Create child page
      const pageData = {
        parent: parent,
        properties: {
          title: {
            title: [
              {
                text: {
                  content: title
                }
              }
            ]
          }
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: content
                  }
                }
              ]
            }
          }
        ]
      };

      createdPage = await NotionService.createPage(pageData);
    }

    console.log('[Side Panel] Notion page created:', createdPage);

    // Save to history
    const { generateUUID } = await import('../utils/helpers.js');
    const { addToHistory } = await import('../lib/storage.js');

    const historyItem = {
      id: generateUUID(),
      timestamp: Date.now(),
      transcription: content,
      destination: 'notion',
      status: 'success',
      artifactUrl: createdPage.url,
      artifactTitle: title,
      metadata: {
        notion: {
          pageId: createdPage.id,
          parentName: parentName
        }
      }
    };

    await addToHistory(historyItem);

    // Show success message
    showToast(`Note sent to Notion (${parentName})!`, 'success');

    // Reset recording state
    currentTranscription = '';
    transcriptionText.textContent = '';

    // Return to recording screen
    showScreen(screens.RECORDING);

    // Reload recent notes
    await loadRecentNotes();
  } catch (error) {
    console.error('[Side Panel] Error sending to Notion:', error);
    throw error;
  }
}

async function updateNotionConnectionUI() {
  const isAuth = await NotionOAuth.isAuthenticated();

  if (isAuth) {
    // Get workspace info from storage
    const workspaceInfo = await NotionOAuth.getWorkspaceInfo();

    if (workspaceInfo) {
      notionWorkspaceName.textContent = workspaceInfo.name;
      notionWorkspaceIcon.textContent = workspaceInfo.icon || '📝';
    }

    notionNotConnected.style.display = 'none';
    notionConnected.style.display = 'block';
  } else {
    notionNotConnected.style.display = 'block';
    notionConnected.style.display = 'none';
  }
}

async function updateGitHubConnectionUI() {
  const isAuth = await GitHubOAuth.isAuthenticated();

  if (isAuth) {
    // Get user info from storage
    const { githubUsername: username } = await chrome.storage.local.get('githubUsername');

    if (username) {
      // Fetch user data for avatar
      try {
        const user = await GitHubService.getUser();
        githubUsername.textContent = `@${user.login}`;
        githubAvatar.src = user.avatar_url;
        githubAvatar.alt = `${user.login}'s avatar`;
      } catch (error) {
        console.error('[Side Panel] Error fetching user data:', error);
        githubUsername.textContent = `@${username}`;
        githubAvatar.src = `https://github.com/${username}.png`;
      }
    }

    githubNotConnected.style.display = 'none';
    githubConnected.style.display = 'block';
  } else {
    githubNotConnected.style.display = 'block';
    githubConnected.style.display = 'none';
  }
}

function updateDestinationOptions() {
  // Update GitHub destination buttons
  GitHubOAuth.isAuthenticated().then(isAuth => {
    const githubIssueBtn = document.querySelector('[data-destination="github-issue"]');
    const githubProjectBtn = document.querySelector('[data-destination="github-project"]');

    if (githubIssueBtn) {
      if (isAuth) {
        githubIssueBtn.disabled = false;
        const badge = githubIssueBtn.querySelector('.destination-badge');
        if (badge) badge.remove();
      } else {
        githubIssueBtn.disabled = true;
        if (!githubIssueBtn.querySelector('.destination-badge')) {
          const badge = document.createElement('div');
          badge.className = 'destination-badge';
          badge.textContent = 'Not configured';
          githubIssueBtn.appendChild(badge);
        }
      }
    }

    if (githubProjectBtn) {
      if (isAuth) {
        githubProjectBtn.disabled = false;
        const badge = githubProjectBtn.querySelector('.destination-badge');
        if (badge) badge.remove();
      } else {
        githubProjectBtn.disabled = true;
        if (!githubProjectBtn.querySelector('.destination-badge')) {
          const badge = document.createElement('div');
          badge.className = 'destination-badge';
          badge.textContent = 'Not configured';
          githubProjectBtn.appendChild(badge);
        }
      }
    }
  });

  // Update Notion destination button
  NotionOAuth.isAuthenticated().then(isAuth => {
    const notionBtn = document.querySelector('[data-destination="notion"]');

    if (notionBtn) {
      if (isAuth) {
        notionBtn.disabled = false;
        const badge = notionBtn.querySelector('.destination-badge');
        if (badge) badge.remove();
      } else {
        notionBtn.disabled = true;
        if (!notionBtn.querySelector('.destination-badge')) {
          const badge = document.createElement('div');
          badge.className = 'destination-badge';
          badge.textContent = 'Not configured';
          notionBtn.appendChild(badge);
        }
      }
    }
  });
}

// ============================================================================
// Toast Notifications
// ============================================================================

function showToast(message, type = 'info', duration = 3000) {
  const toastContainer = document.getElementById('toastContainer');

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  // Support HTML content for links
  if (message.includes('<a')) {
    toast.innerHTML = message;
  } else {
    toast.textContent = message;
  }

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, duration);
}

// ============================================================================
// Initialization
// ============================================================================

async function init() {
  console.log('[Side Panel] Initializing...');

  try {
    // Check if running in Brave and show warning
    if (TranscriptionService.isBrave()) {
      showToast('⚠️ Brave may block Web Speech API. To enable: brave://settings/shields → Allow Google login. Or use Chrome/Edge.', 'warning', 10000);
    }

    // Load initial data with error boundary
    try {
      await loadRecentNotes();
    } catch (error) {
      console.error('[Side Panel] Error loading recent notes:', error);
      showToast('Error loading recent notes', 'error');
    }

    // Update OAuth connection UIs with error boundaries
    try {
      await updateGitHubConnectionUI();
    } catch (error) {
      console.error('[Side Panel] Error updating GitHub connection UI:', error);
    }

    try {
      await updateNotionConnectionUI();
    } catch (error) {
      console.error('[Side Panel] Error updating Notion connection UI:', error);
    }

    // Update destination button states based on auth
    updateDestinationOptions();

    // Check Gemini Nano availability (non-blocking)
    checkAndDisplayAIStatus().catch(err => {
      console.warn('[Side Panel] AI status check failed (non-fatal):', err.message);
    });

    // Show testing dashboard screen and load its data
    showScreen(screens.TESTING_DASHBOARD);
    try {
      await loadTestingDashboard();
    } catch (dashError) {
      console.warn('[Side Panel] Dashboard load error (non-fatal):', dashError.message);
    }

    console.log('[Side Panel] Ready');
  } catch (error) {
    console.error('[Side Panel] Fatal initialization error:', error);
    showToast('Error initializing side panel', 'error');
    // Try to show testing dashboard screen anyway
    try {
      showScreen(screens.TESTING_DASHBOARD);
    } catch (fallbackError) {
      console.error('[Side Panel] Error showing fallback screen:', fallbackError);
    }
  }
}

// ============================================================================
// GitHub Issue Form Functions
// ============================================================================

let repositories = [];
let selectedRepo = null;

async function showGitHubIssueForm() {
  try {
    // Pre-fill issue body with transcription
    issueBody.value = currentTranscription;

    // Load repositories
    showToast('Loading repositories...', 'info');
    repositories = await GitHubService.fetchRepositories();
    console.log(`[GitHub Issue] Loaded ${repositories.length} repositories`);

    // Show the form
    showScreen(screens.GITHUB_ISSUE);

    // Focus title input
    issueTitle.focus();
  } catch (error) {
    console.error('[GitHub Issue] Error loading repositories:', error);
    showToast(`Failed to load repositories: ${error.message}`, 'error');
  }
}

function showRepoDropdown() {
  renderRepoList();
  repoList.style.display = 'block';
}

function hideRepoDropdown() {
  repoList.style.display = 'none';
}

async function handleRepoSearch(e) {
  const query = e.target.value.trim();
  renderRepoList(query);
}

async function renderRepoList(query = '') {
  // Get recently used repos
  const recentRepos = await GitHubCache.getRecentlyUsedRepos();
  const recentRepoFullNames = recentRepos.map(r => r.fullName);

  // Filter all repositories
  const filteredRepos = query
    ? GitHubService.searchRepositories(query, repositories)
    : repositories;

  // If we have recently used AND no search query, show them
  if (recentRepos.length > 0 && !query) {
    recentReposList.parentElement.style.display = 'block';
    recentReposList.innerHTML = recentRepos.map(repo =>
      createRepoItem(repo.fullName, repo.description, true)
    ).join('');
  } else {
    // Hide recently used section if empty or searching
    recentReposList.parentElement.style.display = 'none';
  }

  // Always show "All Repositories" section with available repos
  const reposToShow = query
    ? filteredRepos
    : filteredRepos.filter(repo => !recentRepoFullNames.includes(repo.full_name));

  // Update section title
  const allReposSection = allReposList.parentElement;
  const sectionTitle = allReposSection.querySelector('.dropdown-section-title');
  sectionTitle.textContent = query ? 'Search Results' : (recentRepos.length > 0 ? 'All Repositories' : 'Your Repositories');

  if (reposToShow.length > 0) {
    allReposSection.style.display = 'block';
    allReposList.innerHTML = reposToShow
      .slice(0, 20) // Limit to 20 results
      .map(repo => createRepoItem(repo.full_name, repo.description, false))
      .join('');
  } else if (repositories.length === 0) {
    allReposSection.style.display = 'block';
    allReposList.innerHTML = '<div class="repo-empty">No repositories found. Create one on GitHub first.</div>';
  } else {
    allReposSection.style.display = 'block';
    allReposList.innerHTML = '<div class="repo-empty">No matching repositories</div>';
  }

  // Add click handlers (use mousedown to fire before blur)
  document.querySelectorAll('.repo-item').forEach(item => {
    item.addEventListener('mousedown', (e) => {
      e.preventDefault(); // Prevent input blur
      handleRepoSelected(e);
    });
  });
}

function createRepoItem(fullName, description, isRecent) {
  return `
    <div class="repo-item" data-repo="${fullName}">
      <div class="repo-name">${fullName}${isRecent ? ' ⭐' : ''}</div>
      ${description ? `<div class="repo-description">${description}</div>` : ''}
    </div>
  `;
}

function handleRepoSelected(e) {
  const repoFullName = e.currentTarget.getAttribute('data-repo');
  selectedRepo = repositories.find(r => r.full_name === repoFullName);

  if (selectedRepo) {
    githubRepoSearch.value = selectedRepo.full_name;
    selectedRepoId.value = selectedRepo.full_name;

    // Update UI
    document.querySelectorAll('.repo-item').forEach(item => {
      item.classList.remove('selected');
    });
    e.currentTarget.classList.add('selected');

    hideRepoDropdown();
  }
}

async function handleCreateIssue() {
  try {
    // Validate inputs
    if (!selectedRepo) {
      showToast('Please select a repository', 'error');
      githubRepoSearch.focus();
      return;
    }

    if (!issueTitle.value.trim()) {
      showToast('Please enter an issue title', 'error');
      issueTitle.focus();
      return;
    }

    // Disable button and show loading
    createIssueBtn.disabled = true;
    createIssueBtn.textContent = 'Creating...';

    // Parse repository owner and name
    const [owner, repo] = selectedRepo.full_name.split('/');

    // Parse labels (comma-separated)
    const labels = issueLabels.value
      .split(',')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    // Create issue data
    const issueData = {
      title: issueTitle.value.trim(),
      body: issueBody.value.trim(),
      labels: labels.length > 0 ? labels : undefined
    };

    console.log('[GitHub Issue] Creating issue:', issueData);

    // Create the issue
    const createdIssue = await GitHubService.createIssue(owner, repo, issueData);

    console.log('[GitHub Issue] Issue created:', createdIssue.html_url);

    // Save to history
    const { generateUUID } = await import('../utils/helpers.js');
    const { addToHistory } = await import('../lib/storage.js');

    await addToHistory({
      id: generateUUID(),
      timestamp: Date.now(),
      transcription: currentTranscription,
      destination: 'github-issue',
      metadata: {
        issueNumber: createdIssue.number,
        issueUrl: createdIssue.html_url,
        repository: selectedRepo.full_name,
        title: createdIssue.title
      }
    });

    // Show success with clickable link
    showToast(
      `✓ Issue #${createdIssue.number} created! <a href="${createdIssue.html_url}" target="_blank" style="color: inherit; text-decoration: underline;">View on GitHub →</a>`,
      'success',
      5000 // Show for 5 seconds
    );

    // Reset form
    resetIssueForm();

    // Go back to recording screen
    showScreen(screens.RECORDING);

  } catch (error) {
    console.error('[GitHub Issue] Error creating issue:', error);
    showToast(`Failed to create issue: ${error.message}`, 'error');
  } finally {
    createIssueBtn.disabled = false;
    createIssueBtn.textContent = 'Create Issue';
  }
}

function resetIssueForm() {
  githubRepoSearch.value = '';
  selectedRepoId.value = '';
  issueTitle.value = '';
  issueBody.value = '';
  issueLabels.value = '';
  selectedRepo = null;
}

// ============================================================================
// History Detail Modal Functions
// ============================================================================

function showHistoryDetailModal(item) {
  // Set modal content
  modalTranscription.textContent = item.transcription;

  // Set destination
  const destinationNames = {
    'github-issue': 'GitHub Issue',
    'github-project': 'GitHub Project',
    'notion': 'Notion',
    'onenote': 'OneNote',
    'draft': 'Draft'
  };
  modalDestination.textContent = destinationNames[item.destination] || item.destination;

  // Set link if available
  const linkUrl = item.metadata?.issueUrl || item.metadata?.projectUrl || item.artifactUrl;
  if (linkUrl) {
    modalLink.href = linkUrl;

    // Set link text based on destination
    if (item.destination === 'github-issue') {
      modalLink.textContent = `Issue #${item.metadata.issueNumber} on GitHub →`;
    } else if (item.destination === 'github-project') {
      modalLink.textContent = `View on GitHub Projects →`;
    } else {
      modalLink.textContent = `View →`;
    }

    modalLinkSection.style.display = 'block';
  } else {
    modalLinkSection.style.display = 'none';
  }

  // Show modal
  historyDetailModal.style.display = 'flex';
}

function hideHistoryDetailModal() {
  historyDetailModal.style.display = 'none';
}

// ============================================================================
// GitHub Project Form Functions
// ============================================================================

let projects = [];
let selectedProject = null;

async function showGitHubProjectForm() {
  try {
    // Pre-fill item body with transcription
    projectItemBody.value = currentTranscription;

    // Load projects
    showToast('Loading projects...', 'info');
    projects = await GitHubService.fetchProjects();
    console.log(`[GitHub Project] Loaded ${projects.length} projects`);

    // Show the form
    showScreen(screens.GITHUB_PROJECT);

    // Focus title input
    projectItemTitle.focus();
  } catch (error) {
    console.error('[GitHub Project] Error loading projects:', error);
    showToast(`Failed to load projects: ${error.message}`, 'error');
  }
}

function showProjectDropdown() {
  renderProjectList();
  projectList.style.display = 'block';
}

function hideProjectDropdown() {
  projectList.style.display = 'none';
}

async function handleProjectSearch(e) {
  const query = e.target.value.trim();
  renderProjectList(query);
}

async function renderProjectList(query = '') {
  // Get recently used projects
  const recentProjects = await GitHubCache.getRecentlyUsedProjects();
  const recentProjectIds = recentProjects.map(p => p.id);

  // Filter all projects
  const filteredProjects = query
    ? GitHubService.searchProjects(query, projects)
    : projects;

  // If we have recently used AND no search query, show them
  if (recentProjects.length > 0 && !query) {
    recentProjectsList.parentElement.style.display = 'block';
    recentProjectsList.innerHTML = recentProjects.map(project =>
      createProjectItem(project.id, project.title, project.description, true)
    ).join('');
  } else {
    // Hide recently used section if empty or searching
    recentProjectsList.parentElement.style.display = 'none';
  }

  // Always show "All Projects" section with available projects
  const projectsToShow = query
    ? filteredProjects
    : filteredProjects.filter(project => !recentProjectIds.includes(project.id));

  // Update section title
  const allProjectsSection = allProjectsList.parentElement;
  const sectionTitle = allProjectsSection.querySelector('.dropdown-section-title');
  sectionTitle.textContent = query ? 'Search Results' : (recentProjects.length > 0 ? 'All Projects' : 'Your Projects');

  if (projectsToShow.length > 0) {
    allProjectsSection.style.display = 'block';
    allProjectsList.innerHTML = projectsToShow
      .slice(0, 20)
      .map(project => createProjectItem(project.id, project.title, project.description, false))
      .join('');
  } else if (projects.length === 0) {
    allProjectsSection.style.display = 'block';
    allProjectsList.innerHTML = '<div class="repo-empty">No projects found. Create one on GitHub first.</div>';
  } else {
    allProjectsSection.style.display = 'block';
    allProjectsList.innerHTML = '<div class="repo-empty">No matching projects</div>';
  }

  // Add click handlers (use mousedown to fire before blur)
  document.querySelectorAll('.project-item').forEach(item => {
    item.addEventListener('mousedown', (e) => {
      e.preventDefault(); // Prevent input blur
      handleProjectSelected(e);
    });
  });
}

function createProjectItem(id, title, description, isRecent) {
  return `
    <div class="project-item repo-item" data-project-id="${id}">
      <div class="repo-name">${title}${isRecent ? ' ⭐' : ''}</div>
      ${description ? `<div class="repo-description">${description}</div>` : ''}
    </div>
  `;
}

function handleProjectSelected(e) {
  const projectId = e.currentTarget.getAttribute('data-project-id');
  selectedProject = projects.find(p => p.id === projectId);

  if (selectedProject) {
    githubProjectSearch.value = selectedProject.title;
    selectedProjectId.value = selectedProject.id;

    // Update UI
    document.querySelectorAll('.project-item').forEach(item => {
      item.classList.remove('selected');
    });
    e.currentTarget.classList.add('selected');

    hideProjectDropdown();
  }
}

async function handleCreateProjectItem() {
  try {
    // Validate inputs
    if (!selectedProject) {
      showToast('Please select a project', 'error');
      githubProjectSearch.focus();
      return;
    }

    if (!projectItemTitle.value.trim()) {
      showToast('Please enter a title', 'error');
      projectItemTitle.focus();
      return;
    }

    // Disable button and show loading
    createProjectItemBtn.disabled = true;
    createProjectItemBtn.textContent = 'Adding...';

    // Create draft issue data
    const itemData = {
      title: projectItemTitle.value.trim(),
      body: projectItemBody.value.trim()
    };

    console.log('[GitHub Project] Creating draft issue:', itemData);

    // Create the draft issue
    const createdItem = await GitHubService.createProjectDraftIssue(selectedProject.id, itemData);

    console.log('[GitHub Project] Draft issue created');

    // Save to history
    const { generateUUID } = await import('../utils/helpers.js');
    const { addToHistory } = await import('../lib/storage.js');

    await addToHistory({
      id: generateUUID(),
      timestamp: Date.now(),
      transcription: currentTranscription,
      destination: 'github-project',
      metadata: {
        projectId: selectedProject.id,
        projectTitle: selectedProject.title,
        projectUrl: selectedProject.url,
        itemTitle: itemData.title
      }
    });

    // Show success
    showToast(
      `✓ Added to project! <a href="${selectedProject.url}" target="_blank" style="color: inherit; text-decoration: underline;">View Project →</a>`,
      'success',
      5000
    );

    // Reset form
    resetProjectForm();

    // Go back to recording screen
    showScreen(screens.RECORDING);

  } catch (error) {
    console.error('[GitHub Project] Error creating draft issue:', error);
    showToast(`Failed to add to project: ${error.message}`, 'error');
  } finally {
    createProjectItemBtn.disabled = false;
    createProjectItemBtn.textContent = 'Add to Project';
  }
}

function resetProjectForm() {
  githubProjectSearch.value = '';
  selectedProjectId.value = '';
  projectItemTitle.value = '';
  projectItemBody.value = '';
  selectedProject = null;
}

// ============================================================================
// Testing Dashboard Functions
// ============================================================================

// State for testing features
let currentElement = null;
let currentScreenshot = null;
let currentAIAnalysis = null;
let consoleLogs = [];
let currentLogFilter = 'all';
let lastAnalysisResult = null;

// ============================================================================
// AI Status & Quick Analyze Functions
// ============================================================================

/**
 * Check Gemini Nano availability and update the status bar.
 */
async function checkAndDisplayAIStatus() {
  try {
    const { available, status } = await nanoProvider.checkAvailability();

    // Update dot class
    aiStatusDot.className = 'ai-status-dot';
    if (status === 'available') {
      aiStatusDot.classList.add('ai-status-available');
      aiStatusText.textContent = 'Gemini Nano ready';
    } else if (status === 'downloading') {
      aiStatusDot.classList.add('ai-status-downloading');
      aiStatusText.textContent = 'Downloading AI model...';
    } else {
      aiStatusDot.classList.add('ai-status-unavailable');
      aiStatusText.textContent = 'On-device AI unavailable (cloud fallback)';
    }

    console.log(`[AI Status] Nano available: ${available}, status: ${status}, shape: ${nanoProvider.apiShape}`);
  } catch (err) {
    console.warn('[AI Status] Check failed:', err);
    aiStatusDot.className = 'ai-status-dot ai-status-unavailable';
    aiStatusText.textContent = 'AI status unknown';
  }
}

/**
 * Update the analysis progress UI.
 */
function updateAnalysisProgress(percent, message) {
  analysisProgress.style.display = 'block';
  analysisProgressBar.style.width = `${percent}%`;
  analysisProgressText.textContent = message;
}

/**
 * Handle the Quick Analyze button click.
 * Captures screenshot + console logs → estimates difficulty → analyzes with Nano.
 */
async function handleQuickAnalyze() {
  console.log('[Quick Analyze] Starting...');

  // Disable button during analysis
  quickAnalyzeBtn.disabled = true;
  quickAnalyzeBtn.innerHTML = '<span>🧠</span> Analyzing...';

  // Show results panel with progress
  analysisResultsPanel.style.display = 'block';
  analysisDifficultyBadge.textContent = '';
  analysisProviderBadge.textContent = '';
  analysisSummary.innerHTML = '';
  analysisDetails.innerHTML = '';
  updateAnalysisProgress(5, 'Gathering data...');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error('No active tab found');
    }

    // Step 1: Capture screenshot
    updateAnalysisProgress(10, 'Capturing screenshot...');
    let screenshotDataUrl = null;
    try {
      screenshotDataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
    } catch (ssErr) {
      console.warn('[Quick Analyze] Screenshot capture failed:', ssErr.message);
    }

    // Step 2: Get console logs
    updateAnalysisProgress(20, 'Reading console logs...');
    let tabLogs = [];
    try {
      const logsResponse = await chrome.tabs.sendMessage(tab.id, { type: 'GET_CONSOLE_LOGS' });
      tabLogs = logsResponse?.logs || [];
    } catch {
      // Content script may not be injected on restricted pages
      console.warn('[Quick Analyze] Could not get console logs');
    }

    // Step 3: Estimate difficulty (instant, no LLM)
    updateAnalysisProgress(30, 'Estimating bug complexity...');
    const difficulty = difficultyEstimator.estimateFromSignals(tabLogs, currentElement);

    // Display difficulty badge
    analysisDifficultyBadge.textContent = `${difficulty.level} · ${difficulty.estimate}`;
    analysisDifficultyBadge.style.backgroundColor = difficulty.color;

    console.log(`[Quick Analyze] Difficulty: ${difficulty.level} (score: ${difficulty.score}), model: ${difficulty.model}`);

    // Step 4: Run analysis with Nano (or fall back)
    updateAnalysisProgress(40, `Analyzing with ${difficulty.model}...`);

    const nanoAvailable = nanoProvider.available;

    if (nanoAvailable && (difficulty.model === 'nano' || difficulty.model === 'cloud-fast')) {
      // Use Nano for analysis
      analysisProviderBadge.textContent = 'gemini-nano';

      try {
        updateAnalysisProgress(50, 'AI analyzing console + screenshot...');
        const result = await runNanoQuickAnalysis(tab, tabLogs, screenshotDataUrl);
        lastAnalysisResult = result;
        displayAnalysisResults(result, difficulty);
        updateAnalysisProgress(100, 'Analysis complete');
      } catch (nanoErr) {
        console.warn('[Quick Analyze] Nano failed, attempting cloud fallback:', nanoErr.message);
        nanoProvider.destroySession(); // Reset session on error
        updateAnalysisProgress(60, 'On-device failed, trying cloud...');
        await runCloudQuickAnalysis(tab, tabLogs, screenshotDataUrl, difficulty);
      }
    } else if (nanoAvailable && difficulty.model === 'cloud-deep') {
      // Complex issue — try Nano first anyway (it's free), escalate if needed
      analysisProviderBadge.textContent = 'gemini-nano';
      try {
        updateAnalysisProgress(50, 'Quick analysis with on-device AI...');
        const result = await runNanoQuickAnalysis(tab, tabLogs, screenshotDataUrl);
        lastAnalysisResult = result;
        displayAnalysisResults(result, difficulty);
        updateAnalysisProgress(100, 'Analysis complete (cloud recommended for deeper insight)');
      } catch {
        await runCloudQuickAnalysis(tab, tabLogs, screenshotDataUrl, difficulty);
      }
    } else {
      // Nano unavailable — fall back to cloud
      await runCloudQuickAnalysis(tab, tabLogs, screenshotDataUrl, difficulty);
    }

  } catch (err) {
    console.error('[Quick Analyze] Error:', err);
    analysisSummary.innerHTML = `<p style="color: var(--color-danger);">Analysis failed: ${escapeHtml(err.message)}</p>`;
    updateAnalysisProgress(100, 'Failed');
  } finally {
    quickAnalyzeBtn.disabled = false;
    quickAnalyzeBtn.innerHTML = '<span>🧠</span> Quick Analyze';
    // Hide progress bar after a short delay
    setTimeout(() => {
      analysisProgress.style.display = 'none';
    }, 2000);
  }
}

/**
 * Run analysis using Gemini Nano on-device.
 */
async function runNanoQuickAnalysis(tab, tabLogs, screenshotDataUrl) {
  // Build compact log text
  const errors = tabLogs.filter(l => l.level === 'error');
  const warnings = tabLogs.filter(l => l.level === 'warn');

  let logsText = '';
  if (errors.length > 0) {
    logsText += `ERRORS (${errors.length}):\n`;
    const seen = new Set();
    errors.forEach((e, i) => {
      const key = (e.message || '').slice(0, 100);
      if (seen.has(key) || i >= 5) return;
      seen.add(key);
      logsText += `${i + 1}. ${(e.message || '').slice(0, 200)}\n`;
      if (e.source?.file) logsText += `   at ${e.source.file}:${e.source.line || '?'}\n`;
    });
  }
  if (warnings.length > 0) {
    logsText += `\nWARNINGS (${warnings.length}):\n`;
    warnings.slice(0, 3).forEach((w, i) => {
      logsText += `${i + 1}. ${(w.message || '').slice(0, 150)}\n`;
    });
  }
  if (!logsText) {
    logsText = 'No errors or warnings in console.\n';
  }

  const prompt = `You are a front-end debugging assistant. Analyze the console logs and screenshot from ${tab.url} and respond with ONLY valid JSON (no markdown, no backticks).

${logsText}

Respond:
{
  "summary": "1-2 sentence plain English overview of what is wrong (or 'No issues detected')",
  "errors": [
    {
      "message": "the error",
      "file": "filename.js",
      "line": 42,
      "severity": "critical|high|medium|low",
      "cause": "likely root cause",
      "fix": "suggested fix"
    }
  ],
  "visualIssues": [
    {
      "type": "visual|accessibility|usability",
      "title": "short title",
      "suggestion": "how to fix"
    }
  ],
  "tags": ["bug", "error"],
  "priority": "critical|high|medium|low"
}

For tags choose 1-3 from: bug, enhancement, UI, performance, error, accessibility, styling, API, security, network.
If no errors, set summary to "No issues detected" and errors to empty array.`;

  const raw = await nanoProvider.prompt(prompt, screenshotDataUrl);
  const parsed = NanoProvider.parseJSON(raw);

  if (parsed) {
    return { status: 'done', provider: 'gemini-nano', ...parsed };
  }
  // Couldn't parse JSON — return raw text
  return { status: 'partial', provider: 'gemini-nano', summary: raw, errors: [], visualIssues: [], tags: [], priority: 'unknown' };
}

/**
 * Fall back to cloud analysis via existing VisionService/ANALYZE_IMAGE.
 */
async function runCloudQuickAnalysis(tab, tabLogs, screenshotDataUrl, difficulty) {
  analysisProviderBadge.textContent = 'cloud';
  updateAnalysisProgress(70, 'Analyzing with cloud AI...');

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'ANALYZE_IMAGE',
      screenshotData: screenshotDataUrl,
      options: {
        consoleLogs: tabLogs.slice(0, 10),
        pageUrl: tab.url,
        pageTitle: tab.title
      }
    });

    const result = {
      status: 'done',
      provider: response?.provider || 'cloud',
      summary: response?.analysis || 'Cloud analysis complete.',
      errors: [],
      visualIssues: [],
      tags: [],
      priority: 'medium'
    };

    lastAnalysisResult = result;
    displayAnalysisResults(result, difficulty);
    updateAnalysisProgress(100, 'Complete (cloud)');
  } catch (cloudErr) {
    console.error('[Quick Analyze] Cloud fallback failed:', cloudErr);
    const result = {
      status: 'fallback',
      provider: 'none',
      summary: 'Analysis unavailable. Console logs and screenshot captured for manual review.',
      errors: [],
      visualIssues: [],
      tags: [],
      priority: 'unknown'
    };
    lastAnalysisResult = result;
    displayAnalysisResults(result, difficulty);
    updateAnalysisProgress(100, 'Cloud unavailable');
  }
}

/**
 * Display analysis results in the results panel.
 */
function displayAnalysisResults(result, difficulty) {
  // Summary
  analysisSummary.innerHTML = `<p>${escapeHtml(result.summary || 'Analysis complete.')}</p>`;

  // Build details
  let detailsHtml = '';

  // Error details
  if (result.errors && result.errors.length > 0) {
    detailsHtml += '<div style="margin-bottom: 8px; font-weight: 600; font-size: 13px;">Errors Found:</div>';
    result.errors.forEach(err => {
      detailsHtml += `<div class="analysis-error-item">`;
      detailsHtml += `<div class="error-title">${escapeHtml(err.message || '')}</div>`;
      if (err.file) {
        detailsHtml += `<div class="error-location">${escapeHtml(err.file)}${err.line ? ':' + err.line : ''}</div>`;
      }
      if (err.cause) {
        detailsHtml += `<div class="error-location">Cause: ${escapeHtml(err.cause)}</div>`;
      }
      if (err.fix) {
        detailsHtml += `<div class="error-fix">Fix: ${escapeHtml(err.fix)}</div>`;
      }
      detailsHtml += `</div>`;
    });
  }

  // Visual issues
  if (result.visualIssues && result.visualIssues.length > 0) {
    detailsHtml += '<div style="margin-bottom: 8px; font-weight: 600; font-size: 13px;">Visual Issues:</div>';
    result.visualIssues.forEach(issue => {
      detailsHtml += `<div class="analysis-issue-item">`;
      detailsHtml += `<div style="font-weight: 600;">${escapeHtml(issue.title || issue.type || '')}</div>`;
      if (issue.suggestion) {
        detailsHtml += `<div>${escapeHtml(issue.suggestion)}</div>`;
      }
      detailsHtml += `</div>`;
    });
  }

  // Tags
  if (result.tags && result.tags.length > 0) {
    detailsHtml += '<div class="analysis-tag-list">';
    result.tags.forEach(tag => {
      detailsHtml += `<span class="analysis-tag">${escapeHtml(tag)}</span>`;
    });
    detailsHtml += '</div>';
  }

  // Difficulty signals
  if (difficulty && difficulty.signals.length > 0) {
    detailsHtml += '<div style="margin-top: 8px; font-size: 11px; color: var(--text-secondary);">';
    detailsHtml += `<strong>Signals:</strong> `;
    detailsHtml += `<ul class="signal-list">`;
    difficulty.signals.forEach(s => {
      detailsHtml += `<li class="signal-tag">${escapeHtml(s)}</li>`;
    });
    detailsHtml += '</ul>';
    detailsHtml += `<div style="margin-top: 4px;">Model recommendation: ${escapeHtml(difficulty.modelReason)}</div>`;
    detailsHtml += '</div>';
  }

  analysisDetails.innerHTML = detailsHtml;
}

async function loadTestingDashboard() {
  console.log('[Testing Dashboard] Loading dashboard...');

  try {
    // Initialize VisionService with saved settings
    const settings = await getSettings();
    const visionSettings = settings.visionSettings || {};
    
    if (visionSettings.provider && visionSettings[`${visionSettings.provider}ApiKey`]) {
      try {
        if (!visionService) {
          visionService = new VisionService();
        }
        visionService.setProvider(visionSettings.provider, visionSettings[`${visionSettings.provider}ApiKey`]);
        console.log('[Testing Dashboard] VisionService initialized with provider:', visionSettings.provider);
      } catch (visionError) {
        console.error('[Testing Dashboard] Error initializing vision service:', visionError);
        showToast('Error initializing vision service', 'error');
      }
    } else {
      console.warn('[Testing Dashboard] No vision provider configured');
    }

    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab) {
      // Update tab info
      tabTitle.textContent = tab.title || 'Loading...';
      tabUrl.textContent = tab.url || '';
      
      // Get favicon
      if (tab.favIconUrl) {
        tabIconImg.src = tab.favIconUrl;
      } else {
        // Use default icon
        tabIconImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><text y="14" font-size="14">🌐</text></svg>';
      }

      // Inject content script if needed (skip for chrome:// and other restricted pages)
      if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://') && !tab.url.startsWith('about:')) {
        try {
          await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
        } catch {
          // Content script not injected, inject all files in dependency order
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: [
                'src/content-scripts/namespace.js',
                'src/content-scripts/element-inspector.js',
                'src/content-scripts/element-selector.js',
                'src/content-scripts/console-interceptor.js',
                'src/content-scripts/main.js'
              ]
            });
          } catch (injectError) {
            console.warn('[Testing Dashboard] Cannot inject content script into this page:', injectError.message);
          }
        }

        // Get console logs
        await loadConsoleLogs();
      } else {
        console.warn('[Testing Dashboard] Cannot inject content scripts into restricted page:', tab.url);
      }
    }
  } catch (error) {
    console.error('[Testing Dashboard] Error loading dashboard:', error);
    showToast('Error loading dashboard', 'error');
  }
}

async function handleSelectElement() {
  console.log('[Testing Dashboard] Enabling element selection...');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      showToast('No active tab found', 'error');
      return;
    }

    // Check if this is a restricted page
    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:'))) {
      showToast('Cannot select elements on this page. Navigate to a website first.', 'warning');
      return;
    }

    // Ensure content script is injected before sending message
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
    } catch {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [
          'src/content-scripts/namespace.js',
          'src/content-scripts/element-inspector.js',
          'src/content-scripts/element-selector.js',
          'src/content-scripts/console-interceptor.js',
          'src/content-scripts/main.js'
        ]
      });
    }

    // Send message to enable element selection
    await chrome.tabs.sendMessage(tab.id, {
      type: 'START_ELEMENT_SELECTION'
    });

    showToast('Click on an element to select it', 'info');
  } catch (error) {
    console.error('[Testing Dashboard] Error enabling element selection:', error);
    showToast('Error enabling element selection', 'error');
  }
}

async function handleCaptureScreenshot() {
  console.log('[Testing Dashboard] Capturing screenshot...');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      showToast('No active tab found', 'error');
      return;
    }

    // Capture visible tab
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
      quality: 100
    });

    currentScreenshot = dataUrl;

    showToast('Screenshot captured!', 'success');

    // If we have a selected element, show element inspector
    if (currentElement) {
      showElementInspector(currentElement, dataUrl);
    }
  } catch (error) {
    console.error('[Testing Dashboard] Error capturing screenshot:', error);
    if (error.message && error.message.includes('chrome://')) {
      showToast('Cannot capture screenshots of chrome:// pages. Navigate to a website first.', 'warning');
    } else {
      showToast('Error capturing screenshot', 'error');
    }
  }
}

function handleElementSelected(elementData) {
  console.log('[Testing Dashboard] Element selected:', elementData);

  currentElement = elementData;

  // Show element inspector
  showElementInspector(elementData);
}

function showElementInspector(elementData, screenshot = null) {
  console.log('[Element Inspector] Showing element inspector...');

  // Update element info
  elementTag.textContent = elementData.tagName || 'N/A';
  elementId.textContent = elementData.idAttribute || 'N/A';
  elementClass.textContent = elementData.className || 'N/A';
  elementSize.textContent = `${Math.round(elementData.position?.width || 0)} × ${Math.round(elementData.position?.height || 0)}`;

  // Update HTML code
  elementHtmlCode.textContent = elementData.outerHTML || 'N/A';

  // Update computed styles
  if (elementData.computedStyles) {
    elementStylesList.innerHTML = Object.entries(elementData.computedStyles)
      .map(([property, value]) => `
        <div class="style-row">
          <span class="style-property">${property}:</span>
          <span class="style-value">${value}</span>
        </div>
      `)
      .join('');
  } else {
    elementStylesList.innerHTML = '<p class="empty-state">No styles available</p>';
  }

  // Update screenshot
  if (screenshot) {
    elementScreenshot.src = screenshot;
    currentScreenshot = screenshot;
  } else if (currentScreenshot) {
    elementScreenshot.src = currentScreenshot;
  } else {
    elementScreenshot.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f5f5f5"/><text x="50" y="50" text-anchor="middle" dy=".3em" font-size="12" fill="%23666">No screenshot</text></svg>';
  }

  // Show inspector screen
  showScreen(screens.ELEMENT_INSPECTOR);
}

// ============================================================================
// Console Logs Functions
// ============================================================================

async function loadConsoleLogs() {
  console.log('[Console Logs] Loading console logs...');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab) {
      // Request logs from content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_CONSOLE_LOGS'
      });

      if (response && response.logs) {
        consoleLogs = response.logs;
        updateConsoleLogsUI();
        updateErrorCount();
      }
    }
  } catch (error) {
    console.error('[Console Logs] Error loading logs:', error);
  }
}

function handleNewConsoleLog(log) {
  console.log('[Console Logs] New log:', log);

  // Add to logs
  consoleLogs.push(log);

  // Limit logs
  if (consoleLogs.length > 1000) {
    consoleLogs.shift();
  }

  // Update UI
  updateConsoleLogsUI();
  updateErrorCount();
}

function handleConsoleLogsReceived(logs) {
  console.log('[Console Logs] Logs received:', logs.length);

  consoleLogs = logs || [];
  updateConsoleLogsUI();
  updateErrorCount();
}

function updateConsoleLogsUI() {
  // Filter logs
  const filteredLogs = currentLogFilter === 'all'
    ? consoleLogs
    : consoleLogs.filter(log => log.level === currentLogFilter);

  if (filteredLogs.length === 0) {
    logList.innerHTML = '<p class="empty-state">No logs captured</p>';
    return;
  }

  logList.innerHTML = filteredLogs
    .slice(-100) // Show last 100 logs
    .reverse()
    .map(log => `
      <div class="log-entry ${log.level}">
        <div class="log-entry-header">
          <span class="log-level ${log.level}">${log.level}</span>
          <span class="log-timestamp">${new Date(log.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="log-message">${escapeHtml(log.message)}</div>
        ${log.stackTrace ? `<div class="log-stack-trace">${escapeHtml(log.stackTrace)}</div>` : ''}
      </div>
    `)
    .join('');
}

function updateErrorCount() {
  const errorCount = consoleLogs.filter(log => log.level === 'error').length;
  errorCountValue.textContent = errorCount;

  // Update recent errors
  const recentErrorsList = consoleLogs
    .filter(log => log.level === 'error')
    .slice(-5)
    .reverse();

  if (recentErrorsList.length === 0) {
    recentErrors.innerHTML = '<p class="empty-state">No errors detected</p>';
  } else {
    recentErrors.innerHTML = recentErrorsList
      .map(log => `
        <div class="log-entry error">
          <div class="log-entry-header">
            <span class="log-level error">ERROR</span>
            <span class="log-timestamp">${new Date(log.timestamp).toLocaleTimeString()}</span>
          </div>
          <div class="log-message">${escapeHtml(truncateText(log.message, 100))}</div>
        </div>
      `)
      .join('');
  }
}

function filterLogs(level) {
  console.log('[Console Logs] Filtering logs:', level);
  currentLogFilter = level;
  updateConsoleLogsUI();
}

function toggleLogFilters() {
  const filters = document.querySelector('.console-filters');
  filters.style.display = filters.style.display === 'none' ? 'flex' : 'none';
}

async function handleClearLogs() {
  console.log('[Console Logs] Clearing logs...');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab) {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'CLEAR_CONSOLE_LOGS'
      });

      consoleLogs = [];
      updateConsoleLogsUI();
      updateErrorCount();

      showToast('Console logs cleared', 'success');
    }
  } catch (error) {
    console.error('[Console Logs] Error clearing logs:', error);
    showToast('Error clearing logs', 'error');
  }
}

// ============================================================================
// AI Analysis Functions
// ============================================================================

function setupAIAnalysis(type) {
  console.log('[AI Analysis] Setting up analysis:', type);

  // Set analysis type
  analysisType.value = type;

  // Set default prompt based on type
  const prompts = {
    general: 'Analyze this UI component and provide insights about its design, accessibility, and potential issues.',
    accessibility: 'Evaluate this UI component for accessibility issues. Check for proper ARIA labels, keyboard navigation, color contrast, and screen reader compatibility.',
    performance: 'Analyze this UI component for performance issues. Look for inefficient DOM structure, large images, unnecessary reflows, and optimization opportunities.',
    bug: 'Identify any bugs, visual issues, or functional problems in this UI component.',
    test: 'Generate comprehensive test cases for this UI component. Include positive tests, negative tests, edge cases, and accessibility tests.'
  };

  customPrompt.value = prompts[type] || '';
}

async function handleRunAnalysis() {
  console.log('[AI Analysis] Running analysis...');

  if (!currentScreenshot) {
    showToast('Please capture a screenshot first', 'error');
    return;
  }

  try {
    // Show loading state
    runAnalysisBtn.disabled = true;
    runAnalysisBtn.textContent = 'Analyzing...';
    analysisResults.innerHTML = '<p class="empty-state">Analyzing...</p>';

    // Initialize vision service with error boundary
    try {
      if (!visionService) {
        visionService = new VisionService();
      }
    } catch (visionError) {
      console.error('[AI Analysis] Error initializing vision service:', visionError);
      showToast('Error initializing vision service', 'error');
      runAnalysisBtn.disabled = false;
      runAnalysisBtn.textContent = 'Run Analysis';
      return;
    }

    // Get provider, model, and prompt
    const provider = visionProvider.value;
    const selectedModel = visionModelSelect ? visionModelSelect.value : null;
    const prompt = customPrompt.value || analysisType.value;

    console.log('[AI Analysis] Running with provider:', provider, 'model:', selectedModel, 'prompt:', prompt);

    // Set the selected model on the provider instance
    if (selectedModel) {
      const providerInstance = visionService.getProvider(provider);
      if (providerInstance) {
        providerInstance.model = selectedModel;
      }
    }

    // Run analysis
    const result = await visionService.analyzeImage(currentScreenshot, prompt, provider);

    console.log('[AI Analysis] Result:', result);

    // Display result
    displayAnalysisResult(result);

    // Store result
    currentAIAnalysis = result;

    showToast('Analysis complete!', 'success');

  } catch (error) {
    console.error('[AI Analysis] Error running analysis:', error);
    showToast(`Error: ${error.message}`, 'error');
    analysisResults.innerHTML = `<p class="empty-state" style="color: var(--color-danger);">Error: ${error.message}</p>`;
  } finally {
    runAnalysisBtn.disabled = false;
    runAnalysisBtn.innerHTML = '<span>🤖</span> Run Analysis';
  }
}

function displayAnalysisResult(result) {
  if (!result) {
    analysisResults.innerHTML = '<p class="empty-state">No results</p>';
    return;
  }

  // Format result based on type
  let content = '';

  if (typeof result === 'string') {
    content = `<p>${escapeHtml(result)}</p>`;
  } else if (result.content) {
    content = `<p>${escapeHtml(result.content)}</p>`;
  } else if (result.analysis) {
    content = `<p>${escapeHtml(result.analysis)}</p>`;
  } else if (Array.isArray(result)) {
    content = result.map(item => `
      <div style="margin-bottom: 16px; padding: 12px; background-color: var(--bg-primary); border-radius: 8px; border: 1px solid var(--border-color);">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${escapeHtml(item.title || item.name || 'Item')}</h4>
        <p style="margin: 0; font-size: 13px; line-height: 1.6;">${escapeHtml(item.description || item.content || '')}</p>
      </div>
    `).join('');
  } else {
    content = `<pre>${escapeHtml(JSON.stringify(result, null, 2))}</pre>`;
  }

  analysisResults.innerHTML = `<div class="analysis-content">${content}</div>`;
}

function handleVisionAnalysisResult(result) {
  console.log('[AI Analysis] Analysis result received:', result);
  currentAIAnalysis = result;
  displayAnalysisResult(result);
}

// ============================================================================
// Testing GitHub Issue Functions
// ============================================================================

async function setupTestingGitHubIssue() {
  console.log('[Testing GitHub Issue] Setting up issue form...');

  try {
    // Initialize issue builder with error boundary
    try {
      if (!issueBuilder) {
        issueBuilder = new IssueBuilder();
      }
    } catch (error) {
      console.error('[Side Panel] Error initializing issue builder:', error);
      showToast('Error initializing issue builder', 'error');
      throw error;
    }

    // Load repositories
    const isGitHubAuthenticated = await GitHubOAuth.isAuthenticated();

    if (isGitHubAuthenticated) {
      showToast('Loading repositories...', 'info');
      repositories = await GitHubService.fetchRepositories();
      console.log(`[Testing GitHub Issue] Loaded ${repositories.length} repositories`);

      // Populate repository dropdown
      testingIssueRepo.innerHTML = '<option value="">Select repository...</option>' +
        repositories.map(repo => `<option value="${repo.full_name}">${repo.full_name}</option>`).join('');
    } else {
      testingIssueRepo.innerHTML = '<option value="">Please sign in to GitHub first</option>';
      testingIssueRepo.disabled = true;
    }

    // Pre-fill title with element info
    if (currentElement) {
      const elementDesc = `${currentElement.tagName}${currentElement.idAttribute ? '#' + currentElement.idAttribute : ''}${currentElement.className ? '.' + currentElement.className.split(' ').join('.') : ''}`;
      testingIssueTitle.value = `Issue with ${elementDesc}`;
    }

    // Update preview
    updateIssuePreview();

  } catch (error) {
    console.error('[Testing GitHub Issue] Error setting up form:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
}

function updateIssuePreview() {
  console.log('[Testing GitHub Issue] Updating preview...');

  const title = testingIssueTitle.value.trim();
  const body = testingIssueBody.value.trim();
  const labels = testingIssueLabels.value.trim();

  // Build issue content
  let content = '';

  if (title) {
    content += `<h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">${escapeHtml(title)}</h3>`;
  }

  if (body) {
    content += `<div style="margin-bottom: 16px; line-height: 1.6;">${escapeHtml(body).replace(/\n/g, '<br>')}</div>`;
  }

  // Add attachments
  const attachments = [];

  if (attachScreenshot.checked && currentScreenshot) {
    attachments.push('📸 Screenshot');
  }

  if (attachElementInfo.checked && currentElement) {
    attachments.push('🎯 Element Information');
  }

  if (attachConsoleLogs.checked && consoleLogs.length > 0) {
    attachments.push('📋 Console Logs');
  }

  if (attachAIAnalysis.checked && currentAIAnalysis) {
    attachments.push('🤖 AI Analysis');
  }

  if (attachments.length > 0) {
    content += `<div style="padding: 12px; background-color: var(--bg-secondary); border-radius: 8px; margin-bottom: 16px;">
      <strong>Attachments:</strong><br>
      ${attachments.map(a => escapeHtml(a)).join('<br>')}
    </div>`;
  }

  if (labels) {
    content += `<div style="margin-bottom: 16px;">
      <strong>Labels:</strong> ${escapeHtml(labels)}
    </div>`;
  }

  if (!content) {
    content = '<p class="empty-state">Start filling out the form to see a preview</p>';
  }

  testingIssuePreviewContent.innerHTML = content;
}

async function handleSubmitTestingIssue() {
  console.log('[Testing GitHub Issue] Submitting issue...');

  try {
    // Validate inputs
    const repoFullName = testingIssueRepo.value;
    if (!repoFullName) {
      showToast('Please select a repository', 'error');
      return;
    }

    const title = testingIssueTitle.value.trim();
    if (!title) {
      showToast('Please enter an issue title', 'error');
      return;
    }

    // Disable button and show loading
    submitTestingIssueBtn.disabled = true;
    submitTestingIssueBtn.textContent = 'Creating...';

    // Parse repository owner and name
    const [owner, repo] = repoFullName.split('/');

    // Parse labels
    const labels = testingIssueLabels.value
      .split(',')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    // Build issue body
    let body = testingIssueBody.value.trim() || '';

    // Add attachments
    if (attachScreenshot.checked && currentScreenshot) {
      body += '\n\n## Screenshot\n\n';
      body += '![Screenshot](data:image/png;base64,' + currentScreenshot.split(',')[1] + ')\n\n';
    }

    if (attachElementInfo.checked && currentElement) {
      body += '\n\n## Element Information\n\n';
      body += '- **Tag:** ' + currentElement.tagName + '\n';
      body += `- **ID:** ${currentElement.idAttribute || 'N/A'}\n`;
      body += `- **Class:** ${currentElement.className || 'N/A'}\n`;
      body += `- **Size:** ${Math.round(currentElement.position?.width || 0)} × ${Math.round(currentElement.position?.height || 0)}\n`;
      body += `- **XPath:** ${currentElement.xpath || 'N/A'}\n\n`;
    }

    if (attachConsoleLogs.checked && consoleLogs.length > 0) {
      body += '\n\n## Console Logs\n\n';
      const errors = consoleLogs.filter(log => log.level === 'error');
      const warnings = consoleLogs.filter(log => log.level === 'warn');
      
      body += '**Errors:** ' + errors.length + '\n';
      body += '**Warnings:** ' + warnings.length + '\n\n';
      
      if (errors.length > 0) {
        body += '### Recent Errors\n\n';
        errors.slice(-5).forEach(log => {
          body += '- ' + log.message + '\n';
        });
        body += '\n';
      }
    }

    if (attachAIAnalysis.checked && currentAIAnalysis) {
      body += '\n\n## AI Analysis\n\n';
      body += "```\n";
      body += typeof currentAIAnalysis === 'string' ? currentAIAnalysis : JSON.stringify(currentAIAnalysis, null, 2);
      body += '\n```\n\n';
    }

    // Create issue data
    const issueData = {
      title,
      body,
      labels: labels.length > 0 ? labels : undefined
    };

    console.log('[Testing GitHub Issue] Creating issue:', issueData);

    // Create issue
    const createdIssue = await GitHubService.createIssue(owner, repo, issueData);

    console.log('[Testing GitHub Issue] Issue created:', createdIssue.html_url);

    // Show success
    showToast(
      '✓ Issue #' + createdIssue.number + ' created! <a href="' + createdIssue.html_url + '" target="_blank" style="color: inherit; text-decoration: underline;">View on GitHub →</a>',
      'success',
      5000
    );

    // Go back to dashboard
    showScreen(screens.TESTING_DASHBOARD);

  } catch (error) {
    console.error('[Testing GitHub Issue] Error creating issue:', error);
    showToast('Failed to create issue: ' + error.message, 'error');
  } finally {
    submitTestingIssueBtn.disabled = false;
    submitTestingIssueBtn.innerHTML = '<span>🐙</span> Create Issue';
  }
}

function handleGitHubIssueCreated(issue) {
  console.log('[Testing GitHub Issue] Issue created:', issue);
  showToast('Issue #' + issue.number + ' created!', 'success');
}

// ============================================================================
// Utility Functions
// ============================================================================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================================
// Initialization
// ============================================================================

// Start when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
