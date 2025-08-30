// Background service worker for Focuser extension

class FocuserBackground {
  constructor() {
    this.blockingManager = null;
    this.pomodoroTimer = null;
    this.taskManager = null;
    this.storageManager = null;
    
    this.init();
  }

  async init() {
    try {
      // Dynamically import modules
      const [
        { BlockingManager },
        { PomodoroTimer },
        { TaskManager },
        { StorageManager }
      ] = await Promise.all([
        import('./modules/blocking.js'),
        import('./modules/pomodoro.js'),
        import('./modules/tasks.js'),
        import('./modules/storage.js')
      ]);

      // Initialize instances
      this.blockingManager = new BlockingManager();
      this.pomodoroTimer = new PomodoroTimer();
      this.taskManager = new TaskManager();
      this.storageManager = new StorageManager();

      // Initialize extension
      await this.storageManager.init();
      await this.blockingManager.init();
      
      // Set up event listeners
      this.setupEventListeners();
      
      console.log('Focuser background service worker initialized');
    } catch (error) {
      console.error('Failed to initialize Focuser background:', error);
    }
  }

  setupEventListeners() {
    // Listen for tab updates to check blocked websites
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url && this.blockingManager) {
        this.blockingManager.checkAndBlockUrl(tab.url, tabId);
      }
    });

    // Listen for alarm events (for pomodoro timer)
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (this.pomodoroTimer) {
        this.pomodoroTimer.handleAlarm(alarm);
      }
    });

    // Listen for messages from popup and content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep the message channel open for async responses
    });

    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.handleInstall();
      }
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      // Ensure modules are loaded
      if (!this.storageManager || !this.blockingManager || !this.pomodoroTimer || !this.taskManager) {
        sendResponse({ success: false, error: 'Extension modules not yet loaded' });
        return;
      }

      switch (message.action) {
        case 'getStatus':
          const status = await this.getExtensionStatus();
          sendResponse({ success: true, data: status });
          break;

        case 'toggleBlocking':
          await this.blockingManager.toggleBlocking();
          sendResponse({ success: true });
          break;

        case 'updateBlockedSites':
          await this.blockingManager.updateBlockedSites(message.sites);
          sendResponse({ success: true });
          break;

        case 'startPomodoro':
          await this.pomodoroTimer.start(message.duration);
          sendResponse({ success: true });
          break;

        case 'pausePomodoro':
          await this.pomodoroTimer.pause();
          sendResponse({ success: true });
          break;

        case 'stopPomodoro':
          await this.pomodoroTimer.stop();
          sendResponse({ success: true });
          break;

        case 'addTask':
          const task = await this.taskManager.addTask(message.task);
          sendResponse({ success: true, data: task });
          break;

        case 'updateTask':
          await this.taskManager.updateTask(message.taskId, message.updates);
          sendResponse({ success: true });
          break;

        case 'deleteTask':
          await this.taskManager.deleteTask(message.taskId);
          sendResponse({ success: true });
          break;

        case 'getTasks':
          const tasks = await this.taskManager.getTasks();
          sendResponse({ success: true, data: tasks });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async getExtensionStatus() {
    if (!this.blockingManager || !this.pomodoroTimer || !this.taskManager) {
      return {
        blocking: { enabled: false },
        pomodoro: { running: false },
        tasks: []
      };
    }

    const [blockingStatus, pomodoroStatus, tasks] = await Promise.all([
      this.blockingManager.getStatus(),
      this.pomodoroTimer.getStatus(),
      this.taskManager.getTasks()
    ]);

    return {
      blocking: blockingStatus,
      pomodoro: pomodoroStatus,
      tasks: tasks
    };
  }

  async handleInstall() {
    // Ensure modules are loaded before handling install
    if (!this.storageManager || !this.blockingManager) {
      console.error('Cannot handle install: modules not yet loaded');
      return;
    }

    // Set up default settings
    await this.storageManager.setDefaults();
    
    // Create default blocking rules
    await this.blockingManager.setupDefaultRules();
    
    console.log('Focuser extension installed successfully');
  }
}

// Initialize the background service worker
new FocuserBackground();
