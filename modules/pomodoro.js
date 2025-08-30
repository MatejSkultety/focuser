// Pomodoro timer manager for Focuser extension

export class PomodoroTimer {
  constructor() {
    this.storageManager = null;
    this.isRunning = false;
    this.isPaused = false;
    this.currentSession = null;
    this.sessionCount = 0;
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
      delayInMinutes: Math.floor(workDuration)
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
    
    this.isPaused = true;
    const now = Date.now();
    const remainingTime = Math.max(0, this.currentSession.endTime - now);
    
    this.currentSession.pausedAt = now;
    this.currentSession.remainingTime = remainingTime;

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

    console.log('Pomodoro timer resumed');
    return this.currentSession;
  }

  async stop() {
    await chrome.alarms.clear('pomodoroTimer');
    
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
}
