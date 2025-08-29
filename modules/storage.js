// Storage manager for Focuser extension
export class StorageManager {
  constructor() {
    this.defaults = {
      settings: {
        blockingEnabled: false,
        strictMode: false,
        notifications: true,
        pomodoroWorkDuration: 25,
        pomodoroBreakDuration: 5,
        pomodoroLongBreakDuration: 15,
        pomodoroSessionsUntilLongBreak: 4
      },
      blockedSites: [
        'facebook.com',
        'twitter.com',
        'instagram.com',
        'youtube.com',
        'reddit.com',
        'tiktok.com'
      ],
      tasks: [],
      statistics: {
        sessionsCompleted: 0,
        totalFocusTime: 0,
        sitesBlocked: 0,
        tasksCompleted: 0
      }
    };
  }

  async init() {
    console.log('Storage manager initialized');
  }

  async setDefaults() {
    const existingData = await this.getAll();
    
    // Only set defaults for missing keys
    const updates = {};
    Object.keys(this.defaults).forEach(key => {
      if (!existingData.hasOwnProperty(key)) {
        updates[key] = this.defaults[key];
      }
    });

    if (Object.keys(updates).length > 0) {
      await this.set(updates);
      console.log('Default settings applied:', updates);
    }
  }

  async get(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, resolve);
    });
  }

  async set(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, resolve);
    });
  }

  async getAll() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, resolve);
    });
  }

  async clear() {
    return new Promise((resolve) => {
      chrome.storage.local.clear(resolve);
    });
  }

  async getSetting(key) {
    const data = await this.get(['settings']);
    return data.settings?.[key] ?? this.defaults.settings[key];
  }

  async setSetting(key, value) {
    const data = await this.get(['settings']);
    const settings = data.settings || {};
    settings[key] = value;
    await this.set({ settings });
  }

  async getBlockedSites() {
    const data = await this.get(['blockedSites']);
    return data.blockedSites || this.defaults.blockedSites;
  }

  async setBlockedSites(sites) {
    await this.set({ blockedSites: sites });
  }

  async getTasks() {
    const data = await this.get(['tasks']);
    return data.tasks || this.defaults.tasks;
  }

  async setTasks(tasks) {
    await this.set({ tasks });
  }

  async getStatistics() {
    const data = await this.get(['statistics']);
    return { ...this.defaults.statistics, ...data.statistics };
  }

  async updateStatistic(key, value) {
    const statistics = await this.getStatistics();
    statistics[key] = value;
    await this.set({ statistics });
  }

  async incrementStatistic(key, amount = 1) {
    const statistics = await this.getStatistics();
    statistics[key] = (statistics[key] || 0) + amount;
    await this.set({ statistics });
  }
}
