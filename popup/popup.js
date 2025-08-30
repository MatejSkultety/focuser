// Focuser Extension Popup JavaScript
class FocuserPopup {
  constructor() {
    this.currentTab = 'focus';
    this.currentTaskId = null;
    this.timerInterval = null;
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadExtensionStatus();
    this.startUIUpdates();
  }

  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Website blocking toggle
    document.getElementById('blockingToggle').addEventListener('change', (e) => {
      this.toggleBlocking(e.target.checked);
    });

    // Pomodoro timer controls
    document.getElementById('startTimer').addEventListener('click', () => {
      this.startTimer();
    });

    document.getElementById('pauseTimer').addEventListener('click', () => {
      this.pauseTimer();
    });

    document.getElementById('stopTimer').addEventListener('click', () => {
      this.stopTimer();
    });

    // Quick task
    document.getElementById('addTaskBtn').addEventListener('click', () => {
      this.addQuickTask();
    });

    document.getElementById('quickTaskInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addQuickTask();
      }
    });

    // Task management
    document.getElementById('addDetailedTask').addEventListener('click', () => {
      this.openTaskModal();
    });

    document.getElementById('taskFilter').addEventListener('change', (e) => {
      this.filterTasks(e.target.value);
    });

    // Modal controls
    document.getElementById('modalClose').addEventListener('click', () => {
      this.closeTaskModal();
    });

    document.getElementById('cancelTask').addEventListener('click', () => {
      this.closeTaskModal();
    });

    document.getElementById('saveTask').addEventListener('click', () => {
      this.saveTask();
    });

    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', () => {
      this.openSettings();
    });

    // Close modal when clicking outside
    document.getElementById('taskModal').addEventListener('click', (e) => {
      if (e.target.id === 'taskModal') {
        this.closeTaskModal();
      }
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');

    this.currentTab = tabName;

    // Load tab-specific data
    if (tabName === 'tasks') {
      this.loadTasks();
    } else if (tabName === 'stats') {
      this.loadStatistics();
    }
  }

  async loadExtensionStatus() {
    try {
      const response = await this.sendMessage({ action: 'getStatus' });
      if (response.success) {
        this.updateUI(response.data);
      }
    } catch (error) {
      console.error('Error loading extension status:', error);
    }
  }

  updateUI(status) {
    // Update blocking status
    const blockingToggle = document.getElementById('blockingToggle');
    const blockingStatus = document.getElementById('blockingStatus');
    
    blockingToggle.checked = status.blocking.enabled;
    blockingStatus.innerHTML = `
      <span class="status-text">${status.blocking.enabled ? 'Enabled' : 'Disabled'}</span>
      <span class="sites-count">${status.blocking.blockedSites.length} sites blocked</span>
    `;

    // Update timer status
    this.updateTimerUI(status.pomodoro);
  }

  updateTimerUI(pomodoroStatus) {
    const timerDisplay = document.getElementById('timerDisplay');
    const timerSession = document.getElementById('timerSession');
    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');
    const stopBtn = document.getElementById('stopTimer');

    if (pomodoroStatus.isRunning) {
      const timeRemaining = Math.max(0, pomodoroStatus.timeRemaining);
      const minutes = Math.floor(timeRemaining / (60 * 1000));
      const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);
      
      timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      timerSession.textContent = pomodoroStatus.currentSession?.type === 'work' ? 'Work Session' : 'Break Time';
      
      startBtn.style.display = 'none';
      pauseBtn.style.display = pomodoroStatus.isPaused ? 'none' : 'inline-flex';
      stopBtn.style.display = 'inline-flex';
      
      if (pomodoroStatus.isPaused) {
        pauseBtn.textContent = 'Resume';
        pauseBtn.style.display = 'inline-flex';
      }
    } else {
      const defaultTime = pomodoroStatus.currentSession?.duration || 25;
      timerDisplay.textContent = `${defaultTime}:00`;
      timerSession.textContent = 'Ready to Focus';
      
      startBtn.style.display = 'inline-flex';
      pauseBtn.style.display = 'none';
      stopBtn.style.display = 'none';
    }
  }

  async toggleBlocking(enabled) {
    try {
      await this.sendMessage({ action: 'toggleBlocking' });
      this.loadExtensionStatus();
    } catch (error) {
      console.error('Error toggling blocking:', error);
      // Revert toggle state
      document.getElementById('blockingToggle').checked = !enabled;
    }
  }

  async startTimer() {
    try {
      await this.sendMessage({ action: 'startPomodoro' });
      this.loadExtensionStatus();
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  }

  async pauseTimer() {
    try {
      const pauseBtn = document.getElementById('pauseTimer');
      if (pauseBtn.textContent === 'Resume') {
        await this.sendMessage({ action: 'startPomodoro' }); // Resume
      } else {
        await this.sendMessage({ action: 'pausePomodoro' });
      }
      this.loadExtensionStatus();
    } catch (error) {
      console.error('Error pausing/resuming timer:', error);
    }
  }

  async stopTimer() {
    try {
      await this.sendMessage({ action: 'stopPomodoro' });
      this.loadExtensionStatus();
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  }

  async addQuickTask() {
    const input = document.getElementById('quickTaskInput');
    const title = input.value.trim();
    
    if (!title) return;

    try {
      await this.sendMessage({
        action: 'addTask',
        task: { title }
      });
      
      input.value = '';
      
      // Refresh tasks if on tasks tab
      if (this.currentTab === 'tasks') {
        this.loadTasks();
      }
      
      this.showNotification('Task added successfully!');
    } catch (error) {
      console.error('Error adding task:', error);
      this.showNotification('Error adding task', 'error');
    }
  }

  async loadTasks() {
    try {
      const response = await this.sendMessage({ action: 'getTasks' });
      if (response.success) {
        this.renderTasks(response.data);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }

  renderTasks(tasks) {
    const tasksList = document.getElementById('tasksList');
    const filter = document.getElementById('taskFilter').value;
    
    // Filter tasks
    let filteredTasks = tasks;
    if (filter !== 'all') {
      filteredTasks = tasks.filter(task => task.status === filter);
    }

    if (filteredTasks.length === 0) {
      tasksList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="m9 12 2 2 4-4"></path>
          </svg>
          <h4>No tasks found</h4>
          <p>Add a task to get started with your productivity journey.</p>
        </div>
      `;
      return;
    }

    // Use the more secure DOM creation method
    tasksList.innerHTML = '';
    filteredTasks.forEach(task => {
      const taskElement = this.createTaskElement(task);
      tasksList.appendChild(taskElement);
    });

    // Add event delegation for task interactions
    this.setupTaskEventListeners(tasksList);
  }

  setupTaskEventListeners(tasksList) {
    // Remove existing listeners to prevent duplicates
    if (this.handleTaskClick) {
      tasksList.removeEventListener('click', this.handleTaskClick);
    }
    if (this.handleTaskChange) {
      tasksList.removeEventListener('change', this.handleTaskChange);
    }
    
    // Add new listeners
    this.handleTaskClick = this.handleTaskClick.bind(this);
    this.handleTaskChange = this.handleTaskChange.bind(this);
    
    tasksList.addEventListener('click', this.handleTaskClick);
    tasksList.addEventListener('change', this.handleTaskChange);
  }

  handleTaskClick(event) {
    const action = event.target.getAttribute('data-action');
    const taskId = event.target.getAttribute('data-task-id');
    
    if (!action || !taskId) return;
    
    switch (action) {
      case 'edit-task':
        this.editTask(taskId);
        break;
      case 'delete-task':
        this.deleteTask(taskId);
        break;
    }
  }

  handleTaskChange(event) {
    const action = event.target.getAttribute('data-action');
    const taskId = event.target.getAttribute('data-task-id');
    
    if (action === 'toggle-complete' && taskId) {
      this.toggleTaskComplete(taskId, event.target.checked);
    }
  }

  async toggleTaskComplete(taskId, completed) {
    try {
      await this.sendMessage({
        action: 'updateTask',
        taskId,
        updates: { status: completed ? 'completed' : 'pending' }
      });
      
      this.loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }

  async deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await this.sendMessage({
          action: 'deleteTask',
          taskId
        });
        
        this.loadTasks();
        this.showNotification('Task deleted');
      } catch (error) {
        console.error('Error deleting task:', error);
        this.showNotification('Error deleting task', 'error');
      }
    }
  }

  editTask(taskId) {
    // TODO: Implement task editing
    console.log('Edit task:', taskId);
  }

  filterTasks(filter) {
    this.loadTasks();
  }

  openTaskModal(taskId = null) {
    this.currentTaskId = taskId;
    const modal = document.getElementById('taskModal');
    const modalTitle = document.getElementById('modalTitle');
    
    modalTitle.textContent = taskId ? 'Edit Task' : 'Add Task';
    
    // Reset form
    document.getElementById('taskForm').reset();
    
    // TODO: If editing, populate form with task data
    
    modal.style.display = 'block';
  }

  closeTaskModal() {
    document.getElementById('taskModal').style.display = 'none';
    this.currentTaskId = null;
  }

  async saveTask() {
    const form = document.getElementById('taskForm');
    const formData = new FormData(form);
    
    const task = {
      title: document.getElementById('taskTitle').value.trim(),
      description: document.getElementById('taskDescription').value.trim(),
      priority: document.getElementById('taskPriority').value,
      category: document.getElementById('taskCategory').value.trim(),
      estimatedTime: parseInt(document.getElementById('estimatedTime').value) || null,
      tags: document.getElementById('taskTags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
    };

    if (!task.title) {
      this.showNotification('Task title is required', 'error');
      return;
    }

    try {
      if (this.currentTaskId) {
        // Update existing task
        await this.sendMessage({
          action: 'updateTask',
          taskId: this.currentTaskId,
          updates: task
        });
      } else {
        // Add new task
        await this.sendMessage({
          action: 'addTask',
          task
        });
      }
      
      this.closeTaskModal();
      this.loadTasks();
      this.showNotification('Task saved successfully!');
    } catch (error) {
      console.error('Error saving task:', error);
      this.showNotification('Error saving task', 'error');
    }
  }

  async loadStatistics() {
    try {
      const response = await this.sendMessage({ action: 'getStatus' });
      if (response.success) {
        // Update statistics display
        // TODO: Get actual statistics from storage
        document.getElementById('statSessions').textContent = '0';
        document.getElementById('statFocusTime').textContent = '0h';
        document.getElementById('statTasksCompleted').textContent = '0';
        document.getElementById('statSitesBlocked').textContent = '0';
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  startUIUpdates() {
    // Update timer display every second
    this.timerInterval = setInterval(() => {
      if (this.currentTab === 'focus') {
        this.loadExtensionStatus();
      }
    }, 1000);
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

  showNotification(message, type = 'success') {
    // Simple notification system
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ef4444' : '#10b981'};
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      z-index: 1000;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  // More secure method: create DOM elements programmatically
  createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item priority-${task.priority} ${task.status === 'completed' ? 'task-completed' : ''}`;
    taskDiv.setAttribute('data-task-id', task.id);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.status === 'completed';
    checkbox.setAttribute('data-action', 'toggle-complete');
    checkbox.setAttribute('data-task-id', task.id);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'task-content';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'task-title';
    titleDiv.textContent = task.title;

    const metaDiv = document.createElement('div');
    metaDiv.className = 'task-meta';

    const prioritySpan = document.createElement('span');
    prioritySpan.className = 'priority';
    prioritySpan.textContent = task.priority;
    metaDiv.appendChild(prioritySpan);

    if (task.category) {
      const categorySpan = document.createElement('span');
      categorySpan.className = 'category';
      categorySpan.textContent = task.category;
      metaDiv.appendChild(categorySpan);
    }

    if (task.estimatedTime) {
      const timeSpan = document.createElement('span');
      timeSpan.className = 'time';
      timeSpan.textContent = `${task.estimatedTime}min`;
      metaDiv.appendChild(timeSpan);
    }

    contentDiv.appendChild(titleDiv);
    contentDiv.appendChild(metaDiv);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'task-action-btn';
    editBtn.setAttribute('data-action', 'edit-task');
    editBtn.setAttribute('data-task-id', task.id);
    editBtn.title = 'Edit';
    editBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="m18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
    `;

    // Delete button  
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-action-btn';
    deleteBtn.setAttribute('data-action', 'delete-task');
    deleteBtn.setAttribute('data-task-id', task.id);
    deleteBtn.title = 'Delete';
    deleteBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <polyline points="3,6 5,6 21,6"></polyline>
        <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
      </svg>
    `;

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    taskDiv.appendChild(checkbox);
    taskDiv.appendChild(contentDiv);
    taskDiv.appendChild(actionsDiv);

    return taskDiv;
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new FocuserPopup();
});
