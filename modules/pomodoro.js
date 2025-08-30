// Pomodoro timer manager for Focuser extension

export class PomodoroTimer {
  constructor() {
    this.storageManager = null;
    this.isRunning = false;
    this.isPaused = false;
    this.currentSession = null;
    this.sessionCount = 0;
    this.updateInterval = null;
    this.backgroundScript = null;
  }

  async ensureStorageManager() {
    if (!this.storageManager) {
      const { StorageManager } = await import('./storage.js');
      this.storageManager = new StorageManager();
    }
  }

  async start(customDuration = null) {
    await this.ensureStorageManager();
    
    if (this.isRunning && !this.isPaused) {
      console.log('Timer is already running');
      return;
    }

    const workDuration = customDuration || await this.storageManager.getSetting('pomodoroWorkDuration');
    const alarmName = 'pomodoroTimer';

    // Clear any existing alarms
    await chrome.alarms.clear(alarmName);

    // Create new alarm
    await chrome.alarms.create(alarmName, {
      delayInMinutes: workDuration
    });

    this.isRunning = true;
    this.isPaused = false;
    this.currentSession = {
      type: 'work',
      duration: workDuration,
      startTime: Date.now(),
      endTime: Date.now() + (workDuration * 60 * 1000)
    };

    console.log(`Pomodoro timer started for ${workDuration} minutes`);
    
    // Show timer on all tabs first
    const initialStatus = await this.getStatus();
    await this.showTimerOnAllTabs(initialStatus);
    
    // Then start broadcasting timer updates
    this.startUpdateBroadcasting();
    
    // Notify user
    if (await this.storageManager.getSetting('notifications')) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icons/icon48.png',
        title: 'Focuser',
        message: `Focus session started! ${workDuration} minutes of focused work ahead.`
      });
    }

    return this.currentSession;
  }

  async pause() {
    if (!this.isRunning || this.isPaused) {
      console.log('Timer is not running or already paused');
      return;
    }

    // Clear the alarm
    await chrome.alarms.clear('pomodoroTimer');
    
    // Stop broadcasting while paused
    this.stopUpdateBroadcasting();
    
    this.isPaused = true;
    const now = Date.now();
    const remainingTime = Math.max(0, this.currentSession.endTime - now);
    
    this.currentSession.pausedAt = now;
    this.currentSession.remainingTime = remainingTime;

    // Send one update to show paused state
    const pausedStatus = await this.getStatus();
    await this.broadcastTimerUpdate(pausedStatus);

    console.log('Pomodoro timer paused');
    return this.currentSession;
  }

  async resume() {
    if (!this.isRunning || !this.isPaused) {
      console.log('Timer is not paused');
      return;
    }

    const remainingMinutes = this.currentSession.remainingTime / (60 * 1000);
    
    // Create new alarm with remaining time
    await chrome.alarms.create('pomodoroTimer', {
      delayInMinutes: remainingMinutes
    });

    this.isPaused = false;
    this.currentSession.endTime = Date.now() + this.currentSession.remainingTime;
    delete this.currentSession.pausedAt;
    delete this.currentSession.remainingTime;

    // Resume broadcasting timer updates
    this.startUpdateBroadcasting();

    console.log('Pomodoro timer resumed');
    return this.currentSession;
  }

  async stop() {
    await chrome.alarms.clear('pomodoroTimer');
    
    // Stop broadcasting updates
    this.stopUpdateBroadcasting();
    
    // Hide timer on all tabs
    await this.hideTimerOnAllTabs();
    
    this.isRunning = false;
    this.isPaused = false;
    this.currentSession = null;

    console.log('Pomodoro timer stopped');
  }

  async handleAlarm(alarm) {
    if (alarm.name === 'pomodoroTimer') {
      await this.completeSession();
    }
  }

  async completeSession() {
    await this.ensureStorageManager();
    
    if (!this.currentSession) return;

    const sessionType = this.currentSession.type;
    this.sessionCount++;

    // Update statistics
    if (sessionType === 'work') {
      await this.storageManager.incrementStatistic('sessionsCompleted');
      await this.storageManager.incrementStatistic('totalFocusTime', this.currentSession.duration);
    }

    // Determine next session type
    let nextSessionType = 'work';
    let nextDuration;

    if (sessionType === 'work') {
      const sessionsUntilLongBreak = await this.storageManager.getSetting('pomodoroSessionsUntilLongBreak');
      
      if (this.sessionCount % sessionsUntilLongBreak === 0) {
        nextSessionType = 'longBreak';
        nextDuration = await this.storageManager.getSetting('pomodoroLongBreakDuration');
      } else {
        nextSessionType = 'break';
        nextDuration = await this.storageManager.getSetting('pomodoroBreakDuration');
      }
    } else {
      nextSessionType = 'work';
      nextDuration = await this.storageManager.getSetting('pomodoroWorkDuration');
    }

    // Notify user
    if (await this.storageManager.getSetting('notifications')) {
      const messages = {
        work: 'Great work! Time for a break.',
        break: 'Break time is over. Ready to focus?',
        longBreak: 'Long break time! You\'ve earned it.'
      };

      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icons/icon48.png',
        title: 'Focuser',
        message: messages[nextSessionType],
        buttons: [
          { title: `Start ${nextSessionType === 'work' ? 'Work' : 'Break'}` },
          { title: 'Skip' }
        ]
      });
    }

    // Reset current session
    this.isRunning = false;
    this.isPaused = false;
    
    // Stop broadcasting updates and hide timer
    this.stopUpdateBroadcasting();
    await this.hideTimerOnAllTabs();
    
    this.currentSession = {
      type: nextSessionType,
      duration: nextDuration,
      suggestedNext: true
    };

    console.log(`Session completed. Next: ${nextSessionType} for ${nextDuration} minutes`);
  }

  async getStatus() {
    let timeRemaining = 0;
    
    if (this.isRunning && this.currentSession) {
      if (this.isPaused) {
        timeRemaining = this.currentSession.remainingTime || 0;
      } else {
        timeRemaining = Math.max(0, this.currentSession.endTime - Date.now());
      }
    }

    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentSession: this.currentSession,
      timeRemaining: timeRemaining,
      sessionCount: this.sessionCount
    };
  }

  async getSettings() {
    await this.ensureStorageManager();
    
    return {
      workDuration: await this.storageManager.getSetting('pomodoroWorkDuration'),
      breakDuration: await this.storageManager.getSetting('pomodoroBreakDuration'),
      longBreakDuration: await this.storageManager.getSetting('pomodoroLongBreakDuration'),
      sessionsUntilLongBreak: await this.storageManager.getSetting('pomodoroSessionsUntilLongBreak')
    };
  }

  // Start broadcasting timer updates to all content scripts
  startUpdateBroadcasting() {
    // Clear any existing interval
    this.stopUpdateBroadcasting();
    
    // Broadcast updates every second while timer is running
    this.updateInterval = setInterval(async () => {
      if (this.isRunning && !this.isPaused) {
        try {
          const status = await this.getStatus();
          await this.broadcastTimerUpdate(status);
        } catch (error) {
          console.error('Error broadcasting timer update:', error);
        }
      }
    }, 1000);
  }

  // Stop broadcasting timer updates
  stopUpdateBroadcasting() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Broadcast timer updates to all content scripts
  async broadcastTimerUpdate(timerData) {
    try {
      const tabs = await chrome.tabs.query({});
      const message = {
        action: 'updateTimer',
        data: {
          sessionType: timerData.currentSession?.type === 'work' ? 'Work Session' : 
                      timerData.currentSession?.type === 'break' ? 'Break Time' : 
                      timerData.currentSession?.type === 'longBreak' ? 'Long Break' : 'Session',
          timeRemaining: this.formatTime(timerData.timeRemaining),
          progress: this.calculateProgress(timerData),
          isPaused: timerData.isPaused,
          isRunning: timerData.isRunning
        }
      };

      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          // Ignore errors for tabs without content scripts
        }
      }
    } catch (error) {
      console.error('Error broadcasting timer update:', error);
    }
  }

  formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  calculateProgress(timerData) {
    if (!timerData.currentSession || !timerData.isRunning) return 0;
    
    const totalDuration = timerData.currentSession.duration * 60 * 1000; // Convert to milliseconds
    const elapsed = totalDuration - timerData.timeRemaining;
    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
  }

  // Show timer overlay on all tabs when timer starts
  async showTimerOnAllTabs(timerData) {
    try {
      const tabs = await chrome.tabs.query({});
      const message = {
        action: 'showTimer',
        data: {
          sessionType: timerData.currentSession?.type === 'work' ? 'Work Session' : 
                      timerData.currentSession?.type === 'break' ? 'Break Time' : 
                      timerData.currentSession?.type === 'longBreak' ? 'Long Break' : 'Session',
          timeRemaining: this.formatTime(timerData.timeRemaining),
          progress: this.calculateProgress(timerData),
          isPaused: timerData.isPaused
        }
      };

      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          // Ignore errors for tabs without content scripts
        }
      }
    } catch (error) {
      console.error('Error showing timer on all tabs:', error);
    }
  }

  // Hide timer overlay on all tabs when timer stops
  async hideTimerOnAllTabs() {
    try {
      const tabs = await chrome.tabs.query({});
      const message = { action: 'hideTimer' };

      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          // Ignore errors for tabs without content scripts
        }
      }
    } catch (error) {
      console.error('Error hiding timer on all tabs:', error);
    }
  }
}
