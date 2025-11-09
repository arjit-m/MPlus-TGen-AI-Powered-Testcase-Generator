const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  selectRequirementFile: () => ipcRenderer.invoke('select-requirement-file'),
  saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog', options),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  getDefaultRequirements: () => ipcRenderer.invoke('get-default-requirements'),

  // Test case generation
  generateTestCases: (requirementText, testType, testCategory) => 
    ipcRenderer.invoke('generate-test-cases', requirementText, testType, testCategory),
  
  // Requirement enhancement
  enhanceRequirement: (requirementText, testCategory, testType, enhancementType) =>
    ipcRenderer.invoke('enhance-requirement', requirementText, testCategory, testType, enhancementType),

  // UI operations
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Configuration management
  getConfiguration: () => ipcRenderer.invoke('get-configuration'),
  saveConfiguration: (config) => ipcRenderer.invoke('save-configuration', config),
  testLLMConnection: (testConfig) => ipcRenderer.invoke('test-llm-connection', testConfig),
  testJiraConnection: (jiraConfig) => ipcRenderer.invoke('test-jira-connection', jiraConfig),
  checkFirstRun: () => ipcRenderer.invoke('check-first-run'),
  getOllamaModels: (ollamaHost) => ipcRenderer.invoke('get-ollama-models', ollamaHost),

  // JIRA integration
  fetchJiraSprintIssues: (projectKey) => ipcRenderer.invoke('fetch-jira-sprint-issues', projectKey),
  fetchJiraIssue: (issueKey) => ipcRenderer.invoke('fetch-jira-issue', issueKey),

  // Event listeners
  onMessage: (callback) => {
    ipcRenderer.on('message', callback);
    return () => ipcRenderer.removeListener('message', callback);
  }
});