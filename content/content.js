// Focuser Extension Content Script
class FocuserContent {
  constructor() {
    this.isBlocked = false;
    this.overlayElement = null;
    this.timerOverlay = null;
    this.settings = {};
    
    this.init();
  }

  async init() {
    // Check if current site should be blocked
    await this.checkBlockingStatus();
    
    // Set up message listener
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
    });

    // Monitor for timer updates
    this.startTimerMonitoring();
    
    console.log('Focuser content script initialized');
  }

  async checkBlockingStatus() {
    try {
      const response = await this.sendMessage({ action: 'getStatus' });
      if (response.success && response.data.blocking.enabled) {
        const currentUrl = window.location.hostname.replace(/^www\./, '');
        const blockedSites = response.data.blocking.blockedSites;
        
        this.isBlocked = blockedSites.some(site => {
          const cleanSite = site.replace(/^https?:\/\//, '').replace(/^www\./, '');
          return currentUrl.includes(cleanSite);
        });

        if (this.isBlocked) {
          this.showBlockedOverlay();
        }
      }
    } catch (error) {
      console.error('Error checking blocking status:', error);
    }
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case 'blockSite':
        this.showBlockedOverlay();
        sendResponse({ success: true });
        break;
        
      case 'unblockSite':
        this.hideBlockedOverlay();
        sendResponse({ success: true });
        break;
        
      case 'showTimer':
        this.showTimerOverlay(message.data);
        sendResponse({ success: true });
        break;
        
      case 'hideTimer':
        this.hideTimerOverlay();
        sendResponse({ success: true });
        break;
        
      case 'updateTimer':
        this.updateTimerDisplay(message.data);
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  }

  showBlockedOverlay() {
    if (this.overlayElement) return;

    // Create overlay
    this.overlayElement = document.createElement('div');
    this.overlayElement.id = 'focuser-blocked-overlay';
    this.overlayElement.innerHTML = `
      <div class="focuser-blocked-content">
        <div class="focuser-blocked-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
          </svg>
        </div>
        <h1 class="focuser-blocked-title">Website Blocked</h1>
        <p class="focuser-blocked-message">
          This website is blocked to help you stay focused and productive.
        </p>
        <div class="focuser-blocked-actions">
          <button class="focuser-btn focuser-btn-primary" data-action="go-back">
            Go Back
          </button>
          <button class="focuser-btn focuser-btn-secondary" data-action="request-unblock">
            Request Access
          </button>
        </div>
        <div class="focuser-blocked-tips">
          <h3>Stay Focused Tips:</h3>
          <ul>
            <li>Take a deep breath and refocus on your current task</li>
            <li>Use the Pomodoro timer to structure your work</li>
            <li>Review your task list and prioritize important items</li>
            <li>Consider taking a short break if you're feeling distracted</li>
          </ul>
        </div>
        <div class="focuser-blocked-footer">
          <small>Blocked by Focuser Extension</small>
        </div>
      </div>
    `;

    // Add event listeners
    this.overlayElement.addEventListener('click', this.handleBlockedOverlayClick.bind(this));

    document.body.appendChild(this.overlayElement);
    document.body.style.overflow = 'hidden';
  }

  handleBlockedOverlayClick(event) {
    const action = event.target.getAttribute('data-action');
    
    switch (action) {
      case 'go-back':
        history.back();
        break;
      case 'request-unblock':
        this.requestUnblock();
        break;
    }
  }

  hideBlockedOverlay() {
    if (this.overlayElement) {
      this.overlayElement.remove();
      this.overlayElement = null;
      document.body.style.overflow = '';
    }
  }

  async requestUnblock() {
    const reason = prompt('Please provide a reason for accessing this website:');
    if (reason && reason.trim()) {
      try {
        // Log the bypass request
        await this.sendMessage({
          action: 'logBypassRequest',
          url: window.location.href,
          reason: reason.trim()
        });

        // Temporarily allow access (for 5 minutes)
        await this.sendMessage({
          action: 'temporaryUnblock',
          url: window.location.hostname,
          duration: 5 * 60 * 1000 // 5 minutes
        });

        this.hideBlockedOverlay();
        window.location.reload();
      } catch (error) {
        console.error('Error requesting unblock:', error);
        alert('Unable to process unblock request. Please try again.');
      }
    }
  }

  showTimerOverlay(timerData) {
    if (this.timerOverlay) {
      this.updateTimerDisplay(timerData);
      return;
    }

    this.timerOverlay = document.createElement('div');
    this.timerOverlay.id = 'focuser-timer-overlay';
    this.timerOverlay.innerHTML = `
      <div class="focuser-timer-content">
        <div class="focuser-timer-header">
          <span class="focuser-timer-session">${timerData.sessionType}</span>
          <button class="focuser-timer-close" data-action="close-timer">×</button>
        </div>
        <div class="focuser-timer-display">${timerData.timeRemaining}</div>
        <div class="focuser-timer-progress">
          <div class="focuser-timer-progress-bar" style="width: ${timerData.progress}%"></div>
        </div>
        <div class="focuser-timer-controls">
          <button class="focuser-timer-btn" data-action="pause-timer">
            ${timerData.isPaused ? 'Resume' : 'Pause'}
          </button>
          <button class="focuser-timer-btn" data-action="stop-timer">
            Stop
          </button>
        </div>
      </div>
    `;

    // Add event listeners
    this.timerOverlay.addEventListener('click', this.handleTimerOverlayClick.bind(this));

    document.body.appendChild(this.timerOverlay);
  }

  handleTimerOverlayClick(event) {
    const action = event.target.getAttribute('data-action');
    
    switch (action) {
      case 'close-timer':
        this.hideTimerOverlay();
        break;
      case 'pause-timer':
        this.pauseTimer();
        break;
      case 'stop-timer':
        this.stopTimer();
        break;
    }
  }

  hideTimerOverlay() {
    if (this.timerOverlay) {
      this.timerOverlay.remove();
      this.timerOverlay = null;
    }
  }

  updateTimerDisplay(timerData) {
    if (!this.timerOverlay) return;

    const sessionElement = this.timerOverlay.querySelector('.focuser-timer-session');
    const displayElement = this.timerOverlay.querySelector('.focuser-timer-display');
    const progressElement = this.timerOverlay.querySelector('.focuser-timer-progress-bar');
    const pauseButton = this.timerOverlay.querySelector('[data-action="pause-timer"]');

    if (sessionElement) sessionElement.textContent = timerData.sessionType;
    if (displayElement) displayElement.textContent = timerData.timeRemaining;
    if (progressElement) progressElement.style.width = `${timerData.progress}%`;
    if (pauseButton) pauseButton.textContent = timerData.isPaused ? 'Resume' : 'Pause';
  }

  async pauseTimer() {
    try {
      await this.sendMessage({ action: 'pausePomodoro' });
    } catch (error) {
      console.error('Error pausing timer:', error);
    }
  }

  async stopTimer() {
    try {
      await this.sendMessage({ action: 'stopPomodoro' });
      this.hideTimerOverlay();
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  }

  startTimerMonitoring() {
    // Check for timer updates every 10 seconds
    setInterval(async () => {
      try {
        const response = await this.sendMessage({ action: 'getTimerStatus' });
        if (response.success && response.data.isRunning) {
          const timerData = {
            sessionType: response.data.sessionType || 'Work Session',
            timeRemaining: this.formatTime(response.data.timeRemaining),
            progress: response.data.progress || 0,
            isPaused: response.data.isPaused || false
          };
          
          if (!this.timerOverlay) {
            this.showTimerOverlay(timerData);
          } else {
            this.updateTimerDisplay(timerData);
          }
        } else if (this.timerOverlay) {
          this.hideTimerOverlay();
        }
      } catch (error) {
        // Silent fail for timer monitoring
      }
    }, 10000);
  }

  formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Initialize content script
const focuserContent = new FocuserContent();
