// Task manager for Focuser extension

export class TaskManager {
  constructor() {
    this.storageManager = null;
  }

  async ensureStorageManager() {
    if (!this.storageManager) {
      const { StorageManager } = await import('./storage.js');
      this.storageManager = new StorageManager();
    }
  }

  async addTask(taskData) {
    await this.ensureStorageManager();
    
    const tasks = await this.storageManager.getTasks();
    
    const newTask = {
      id: this.generateId(),
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || 'medium', // low, medium, high
      status: 'pending', // pending, in-progress, completed
      category: taskData.category || 'general',
      estimatedTime: taskData.estimatedTime || null, // in minutes
      actualTime: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      completedAt: null,
      tags: taskData.tags || [],
      pomodoroSessions: 0
    };

    tasks.push(newTask);
    await this.storageManager.setTasks(tasks);
    
    console.log('Task added:', newTask);
    return newTask;
  }

  async updateTask(taskId, updates) {
    await this.ensureStorageManager();
    
    const tasks = await this.storageManager.getTasks();
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    const task = tasks[taskIndex];
    
    // Update fields
    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'createdAt') {
        task[key] = updates[key];
      }
    });

    task.updatedAt = Date.now();

    // Handle status changes
    if (updates.status === 'completed' && task.status !== 'completed') {
      task.completedAt = Date.now();
      await this.storageManager.incrementStatistic('tasksCompleted');
    } else if (updates.status !== 'completed' && task.status === 'completed') {
      task.completedAt = null;
      await this.storageManager.incrementStatistic('tasksCompleted', -1);
    }

    tasks[taskIndex] = task;
    await this.storageManager.setTasks(tasks);
    
    console.log('Task updated:', task);
    return task;
  }

  async deleteTask(taskId) {
    await this.ensureStorageManager();
    
    const tasks = await this.storageManager.getTasks();
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    const deletedTask = tasks.splice(taskIndex, 1)[0];
    
    // Update statistics if completed task is deleted
    if (deletedTask.status === 'completed') {
      await this.storageManager.incrementStatistic('tasksCompleted', -1);
    }

    await this.storageManager.setTasks(tasks);
    
    console.log('Task deleted:', deletedTask);
    return deletedTask;
  }

  async getTasks(filter = {}) {
    await this.ensureStorageManager();
    
    const allTasks = await this.storageManager.getTasks();
    
    let filteredTasks = allTasks;

    // Apply filters
    if (filter.status) {
      filteredTasks = filteredTasks.filter(task => task.status === filter.status);
    }

    if (filter.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filter.priority);
    }

    if (filter.category) {
      filteredTasks = filteredTasks.filter(task => task.category === filter.category);
    }

    if (filter.tag) {
      filteredTasks = filteredTasks.filter(task => task.tags.includes(filter.tag));
    }

    // Apply sorting
    const sortBy = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder || 'desc';

    filteredTasks.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle priority sorting
      if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[aValue] || 0;
        bValue = priorityOrder[bValue] || 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filteredTasks;
  }

  async getTask(taskId) {
    await this.ensureStorageManager();
    
    const tasks = await this.storageManager.getTasks();
    return tasks.find(task => task.id === taskId);
  }

  async startTask(taskId) {
    return await this.updateTask(taskId, { 
      status: 'in-progress',
      startedAt: Date.now()
    });
  }

  async completeTask(taskId) {
    return await this.updateTask(taskId, { 
      status: 'completed'
    });
  }

  async addPomodoroSession(taskId, duration) {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    return await this.updateTask(taskId, {
      pomodoroSessions: task.pomodoroSessions + 1,
      actualTime: task.actualTime + duration
    });
  }

  async getTaskStats() {
    await this.ensureStorageManager();
    
    const tasks = await this.storageManager.getTasks();
    
    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      totalEstimatedTime: tasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0),
      totalActualTime: tasks.reduce((sum, t) => sum + t.actualTime, 0),
      totalPomodoroSessions: tasks.reduce((sum, t) => sum + t.pomodoroSessions, 0),
      categories: {},
      priorities: { high: 0, medium: 0, low: 0 }
    };

    // Count by category
    tasks.forEach(task => {
      stats.categories[task.category] = (stats.categories[task.category] || 0) + 1;
      stats.priorities[task.priority] = (stats.priorities[task.priority] || 0) + 1;
    });

    return stats;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async exportTasks() {
    const tasks = await this.getTasks();
    return JSON.stringify(tasks, null, 2);
  }

  async importTasks(tasksJson) {
    await this.ensureStorageManager();
    
    try {
      const importedTasks = JSON.parse(tasksJson);
      const existingTasks = await this.getTasks();
      
      // Add imported tasks with new IDs to avoid conflicts
      const newTasks = importedTasks.map(task => ({
        ...task,
        id: this.generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));

      const allTasks = [...existingTasks, ...newTasks];
      await this.storageManager.setTasks(allTasks);
      
      return newTasks.length;
    } catch (error) {
      throw new Error('Invalid task data format');
    }
  }
}
