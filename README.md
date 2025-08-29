# Focuser - Productivity & Focus Browser Extension

Focuser is a comprehensive browser extension designed to help you stay focused and productive by blocking distracting websites, managing tasks, and using proven productivity techniques like the Pomodoro timer.

## 🚀 Features

### 🚫 Website Blocking
- **Smart Blocking**: Block access to distracting websites during focus sessions
- **Customizable Lists**: Add or remove websites from your blocked list
- **Strict Mode**: Prevent disabling blocking during active sessions
- **Temporary Access**: Request temporary access with justification

### ⏰ Pomodoro Timer
- **Customizable Intervals**: Set work and break durations to your preference
- **Session Management**: Track work sessions, short breaks, and long breaks
- **Notifications**: Get notified when sessions start and end
- **Auto-progression**: Automatically move between work and break sessions

### 📋 Task Management
- **Quick Add**: Rapidly add tasks from the popup
- **Detailed Tasks**: Create tasks with descriptions, categories, priorities, and time estimates
- **Priority Levels**: Organize tasks by Low, Medium, and High priority
- **Categories & Tags**: Organize tasks with custom categories and tags
- **Progress Tracking**: Monitor task completion and time spent

### 📊 Productivity Analytics
- **Session Statistics**: Track completed focus sessions and total focus time
- **Task Analytics**: Monitor task completion rates and productivity trends
- **Blocking Statistics**: See how many distracting websites were blocked
- **Productivity Score**: Get an overall productivity score based on your activities

### ⚙️ Customization
- **Flexible Settings**: Customize all aspects of the extension to fit your workflow
- **Theme Support**: Automatic dark/light mode support
- **Notification Control**: Choose when and how to be notified
- **Data Management**: Export and import your data for backup or migration

## 🛠️ Installation

### Development Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MatejSkultety/focuser.git
   cd focuser
   ```

2. **Load the extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked" and select the `focuser` folder

3. **Start using Focuser**:
   - The extension icon will appear in your browser toolbar
   - Click it to open the popup and start managing your focus

### Production Installation
*Coming soon to Chrome Web Store*

## 📖 Usage

### Getting Started

1. **Set up website blocking**:
   - Click the Focuser icon in your toolbar
   - Navigate to the Focus tab
   - Toggle website blocking on/off
   - Customize blocked sites in Settings

2. **Start a focus session**:
   - Use the Pomodoro timer in the Focus tab
   - Click "Start" to begin a 25-minute work session
   - Take breaks when the timer alerts you

3. **Manage tasks**:
   - Add quick tasks directly from the popup
   - Create detailed tasks with the "Add Detailed Task" button
   - Track progress in the Tasks tab

4. **Monitor productivity**:
   - Check your statistics in the Stats tab
   - Review your productivity score and trends
   - Adjust your workflow based on insights

### Advanced Features

#### Custom Pomodoro Settings
- Access Settings → Pomodoro Timer
- Customize work duration (default: 25 minutes)
- Set break duration (default: 5 minutes)
- Configure long break duration (default: 15 minutes)
- Set sessions until long break (default: 4)

#### Task Categories and Priorities
- Organize tasks by category (Work, Personal, etc.)
- Set priorities (High, Medium, Low)
- Add tags for better organization
- Estimate time for better planning

#### Data Management
- Export your data for backup
- Import data to restore from backup
- Reset statistics when starting fresh

## 🔧 Technical Details

### Architecture
- **Manifest V3**: Built for modern Chrome extension standards
- **Service Worker**: Efficient background processing
- **Storage API**: Local data storage with sync capabilities
- **Declarative Net Request**: Modern website blocking approach

### Key Components
- `background.js`: Service worker handling core functionality
- `popup/`: User interface for quick access
- `options/`: Comprehensive settings page
- `content/`: Scripts for website interaction
- `modules/`: Modular functionality (blocking, timer, tasks, storage)

### Permissions
- `activeTab`: Access current tab for blocking
- `storage`: Store settings and data locally
- `declarativeNetRequest`: Block websites
- `alarms`: Timer functionality
- `notifications`: User notifications

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow the existing code style
4. **Test thoroughly**: Ensure all features work as expected
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**: Describe your changes and their benefits

### Development Guidelines
- Follow existing code style and patterns
- Add comments for complex functionality
- Test across different browsers and screen sizes
- Ensure accessibility compliance
- Update documentation as needed

## 🙏 Acknowledgments

- **Pomodoro Technique** by Francesco Cirillo
- **Chrome Extension Documentation** by Google
- **Open Source Community** for inspiration and resources

## 🌟 Support

If you find Focuser helpful:
- ⭐ Star the repository on GitHub
- 🐛 Report bugs and suggest features
- 🤝 Contribute to the project
- 📢 Share with friends and colleagues

---

**Stay focused, stay productive! 🎯**

For more information, visit our [GitHub repository](https://github.com/MatejSkultety/focuser).