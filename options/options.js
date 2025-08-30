// Focuser Extension Options JavaScript
class FocuserOptions {
  constructor() {
    this.settings = {};
    this.blockedSites = [];
    this.saveTimeout = null;
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadSettings();
    await this.loadBlockedSites();
    await this.loadStatistics();
    
    console.log('Focuser options page initialized');
  }

  setupEventListeners() {
    // Settings toggles and inputs
    document.getElementById('blockingEnabled').addEventListener('change', (e) => {
      this.updateSetting('blockingEnabled', e.target.checked);
    });

    document.getElementById('strictMode').addEventListener('change', (e) => {
      this.updateSetting('strictMode', e.target.checked);
    });

    document.getElementById('notificationsEnabled').addEventListener('change', (e) => {
      this.updateSetting('notifications', e.target.checked);
    });

    document.getElementById('soundEnabled').addEventListener('change', (e) => {
      this.updateSetting('soundEnabled', e.target.checked);
    });

    document.getElementById('blockingNotifications').addEventListener('change', (e) => {
      this.updateSetting('blockingNotifications', e.target.checked);
    });

    document.getElementById('autoStartBreaks').addEventListener('change', (e) => {
      this.updateSetting('autoStartBreaks', e.target.checked);
    });

    document.getElementById('autoStartWork').addEventListener('change', (e) => {
      this.updateSetting('autoStartWork', e.target.checked);
    });

    document.getElementById('showCompletedTasks').addEventListener('change', (e) => {
      this.updateSetting('showCompletedTasks', e.target.checked);
    });

    document.getElementById('taskReminders').addEventListener('change', (e) => {
      this.updateSetting('taskReminders', e.target.checked);
    });

    // Timer settings
    document.getElementById('workDuration').addEventListener('input', (e) => {
      this.updateSetting('pomodoroWorkDuration', parseInt(e.target.value));
    });

    document.getElementById('breakDuration').addEventListener('input', (e) => {
      this.updateSetting('pomodoroBreakDuration', parseInt(e.target.value));
    });

    document.getElementById('longBreakDuration').addEventListener('input', (e) => {
      this.updateSetting('pomodoroLongBreakDuration', parseInt(e.target.value));
    });

    document.getElementById('sessionsUntilLongBreak').addEventListener('input', (e) => {
      this.updateSetting('pomodoroSessionsUntilLongBreak', parseInt(e.target.value));
    });

    // Task settings
    document.getElementById('defaultTaskPriority').addEventListener('change', (e) => {
      this.updateSetting('defaultTaskPriority', e.target.value);
    });

    document.getElementById('defaultTaskCategory').addEventListener('input', (e) => {
      this.updateSetting('defaultTaskCategory', e.target.value);
    });

    // Blocked sites management
    document.getElementById('addSiteBtn').addEventListener('click', () => {
      this.addBlockedSite();
    });

    document.getElementById('newSiteInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addBlockedSite();
      }
    });

    // Data management
    document.getElementById('exportDataBtn').addEventListener('click', () => {
      this.exportData();
    });

    document.getElementById('importDataBtn').addEventListener('click', () => {
      document.getElementById('importFileInput').click();
    });

    document.getElementById('importFileInput').addEventListener('change', (e) => {
      this.importData(e.target.files[0]);
    });

    document.getElementById('resetDataBtn').addEventListener('click', () => {
      this.resetAllData();
    });

    document.getElementById('resetStatsBtn').addEventListener('click', () => {
      this.resetStatistics();
    });

    // Save settings button
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
      this.saveAllSettings();
    });
  }

  async loadSettings() {
    try {
      const data = await this.sendMessage({ action: 'getSettings' });
      if (data && data.settings) {
        this.settings = data.settings;
        this.populateSettingsForm();
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Load from storage directly if messaging fails
      const result = await chrome.storage.local.get(['settings']);
      if (result.settings) {
        this.settings = result.settings;
        this.populateSettingsForm();
      }
    }
  }

  populateSettingsForm() {
    // Populate form fields with current settings
    document.getElementById('blockingEnabled').checked = this.settings.blockingEnabled || false;
    document.getElementById('strictMode').checked = this.settings.strictMode || false;
    document.getElementById('notificationsEnabled').checked = this.settings.notifications !== false;
    document.getElementById('soundEnabled').checked = this.settings.soundEnabled || false;
    document.getElementById('blockingNotifications').checked = this.settings.blockingNotifications || false;
    document.getElementById('autoStartBreaks').checked = this.settings.autoStartBreaks || false;
    document.getElementById('autoStartWork').checked = this.settings.autoStartWork || false;
    document.getElementById('showCompletedTasks').checked = this.settings.showCompletedTasks !== false;
    document.getElementById('taskReminders').checked = this.settings.taskReminders || false;

    // Timer settings
    document.getElementById('workDuration').value = this.settings.pomodoroWorkDuration || 25;
    document.getElementById('breakDuration').value = this.settings.pomodoroBreakDuration || 5;
    document.getElementById('longBreakDuration').value = this.settings.pomodoroLongBreakDuration || 15;
    document.getElementById('sessionsUntilLongBreak').value = this.settings.pomodoroSessionsUntilLongBreak || 4;

    // Task settings
    document.getElementById('defaultTaskPriority').value = this.settings.defaultTaskPriority || 'medium';
    document.getElementById('defaultTaskCategory').value = this.settings.defaultTaskCategory || '';
  }

  async loadBlockedSites() {
    try {
      const result = await chrome.storage.local.get(['blockedSites']);
      this.blockedSites = result.blockedSites || [
        'facebook.com',
        'twitter.com',
        'instagram.com',
        'youtube.com',
        'reddit.com',
        'tiktok.com'
      ];
      this.renderBlockedSites();
    } catch (error) {
      console.error('Error loading blocked sites:', error);
    }
  }

  renderBlockedSites() {
    const sitesList = document.getElementById('blockedSitesList');
    
    if (this.blockedSites.length === 0) {
      sitesList.innerHTML = `
        <div class="empty-sites">
          <p>No blocked websites configured.</p>
          <p>Add websites above to start blocking distracting content.</p>
        </div>
      `;
      return;
    }

    sitesList.innerHTML = this.blockedSites.map(site => `
      <div class="site-item">
        <span class="site-url">${this.escapeHtml(site)}</span>
        <button class="remove-site-btn" data-action="remove-site" data-site="${this.escapeHtml(site)}">
          Remove
        </button>
      </div>
    `).join('');

    // Add event delegation for site removal
    this.setupSiteEventListeners(sitesList);
  }

  setupSiteEventListeners(sitesList) {
    // Remove existing listener to prevent duplicates
    sitesList.removeEventListener('click', this.handleSiteClick);
    
    // Add new listener
    this.handleSiteClick = this.handleSiteClick.bind(this);
    sitesList.addEventListener('click', this.handleSiteClick);
  }

  handleSiteClick(event) {
    const action = event.target.getAttribute('data-action');
    const site = event.target.getAttribute('data-site');
    
    if (action === 'remove-site' && site) {
      this.removeBlockedSite(site);
    }
  }

  async addBlockedSite() {
    const input = document.getElementById('newSiteInput');
    const site = input.value.trim().toLowerCase();
    
    if (!site) {
      this.showStatus('Please enter a website URL', 'error');
      return;
    }

    // Clean up the URL
    const cleanSite = site.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    
    if (this.blockedSites.includes(cleanSite)) {
      this.showStatus('Website already blocked', 'error');
      return;
    }

    this.blockedSites.push(cleanSite);
    await this.saveBlockedSites();
    
    input.value = '';
    this.renderBlockedSites();
    this.showStatus('Website added to blocked list');
  }

  async removeBlockedSite(site) {
    const index = this.blockedSites.indexOf(site);
    if (index > -1) {
      this.blockedSites.splice(index, 1);
      await this.saveBlockedSites();
      this.renderBlockedSites();
      this.showStatus('Website removed from blocked list');
    }
  }

  async saveBlockedSites() {
    try {
      await chrome.storage.local.set({ blockedSites: this.blockedSites });
      
      // Update blocking rules in background script
      await this.sendMessage({
        action: 'updateBlockedSites',
        sites: this.blockedSites
      });
    } catch (error) {
      console.error('Error saving blocked sites:', error);
      this.showStatus('Error saving blocked sites', 'error');
    }
  }

  updateSetting(key, value) {
    this.settings[key] = value;
    this.debouncedSave();
  }

  debouncedSave() {
    this.showStatus('Saving...', 'saving');
    
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.saveSettings();
    }, 1000);
  }

  async saveSettings() {
    try {
      await chrome.storage.local.set({ settings: this.settings });
      this.showStatus('Settings saved automatically');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showStatus('Error saving settings', 'error');
    }
  }

  async saveAllSettings() {
    this.showStatus('Saving all settings...', 'saving');
    
    try {
      await chrome.storage.local.set({ 
        settings: this.settings,
        blockedSites: this.blockedSites
      });
      
      // Update background script
      await this.sendMessage({
        action: 'updateSettings',
        settings: this.settings
      });
      
      this.showStatus('All settings saved successfully');
    } catch (error) {
      console.error('Error saving all settings:', error);
      this.showStatus('Error saving settings', 'error');
    }
  }

  async loadStatistics() {
    try {
      const result = await chrome.storage.local.get(['statistics']);
      const stats = result.statistics || {
        sessionsCompleted: 0,
        totalFocusTime: 0,
        tasksCompleted: 0,
        sitesBlocked: 0
      };

      document.getElementById('totalSessions').textContent = stats.sessionsCompleted;
      document.getElementById('totalFocusTime').textContent = this.formatTime(stats.totalFocusTime);
      document.getElementById('totalTasksCompleted').textContent = stats.tasksCompleted;
      document.getElementById('totalSitesBlocked').textContent = stats.sitesBlocked;
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }

  async exportData() {
    try {
      const data = await chrome.storage.local.get(null);
      const exportData = {
        settings: data.settings || {},
        blockedSites: data.blockedSites || [],
        tasks: data.tasks || [],
        statistics: data.statistics || {},
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `focuser-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showStatus('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      this.showStatus('Error exporting data', 'error');
    }
  }

  async importData(file) {
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate import data
      if (!importData.version) {
        throw new Error('Invalid backup file format');
      }

      // Import data
      const dataToImport = {};
      
      if (importData.settings) dataToImport.settings = importData.settings;
      if (importData.blockedSites) dataToImport.blockedSites = importData.blockedSites;
      if (importData.tasks) dataToImport.tasks = importData.tasks;
      if (importData.statistics) dataToImport.statistics = importData.statistics;

      await chrome.storage.local.set(dataToImport);

      // Reload UI
      await this.loadSettings();
      await this.loadBlockedSites();
      await this.loadStatistics();

      this.showStatus('Data imported successfully');
    } catch (error) {
      console.error('Error importing data:', error);
      this.showStatus('Error importing data: ' + error.message, 'error');
    }
  }

  async resetAllData() {
    if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      try {
        await chrome.storage.local.clear();
        
        // Reload with defaults
        this.settings = {};
        this.blockedSites = [];
        
        await this.loadSettings();
        await this.loadBlockedSites();
        await this.loadStatistics();

        this.showStatus('All data has been reset');
      } catch (error) {
        console.error('Error resetting data:', error);
        this.showStatus('Error resetting data', 'error');
      }
    }
  }

  async resetStatistics() {
    if (confirm('Are you sure you want to reset all statistics?')) {
      try {
        const resetStats = {
          sessionsCompleted: 0,
          totalFocusTime: 0,
          tasksCompleted: 0,
          sitesBlocked: 0
        };

        await chrome.storage.local.set({ statistics: resetStats });
        await this.loadStatistics();

        this.showStatus('Statistics have been reset');
      } catch (error) {
        console.error('Error resetting statistics:', error);
        this.showStatus('Error resetting statistics', 'error');
      }
    }
  }

  formatTime(minutes) {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  showStatus(message, type = 'success') {
    const statusElement = document.getElementById('saveStatus');
    statusElement.textContent = message;
    statusElement.className = `save-status ${type}`;

    if (type !== 'saving') {
      setTimeout(() => {
        statusElement.textContent = 'Settings saved automatically';
        statusElement.className = 'save-status';
      }, 3000);
    }
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

  escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new FocuserOptions();
});
