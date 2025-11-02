const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const isDev = process.env.ELECTRON_IS_DEV === 'true' || !app.isPackaged;
const fs = require('fs').promises;
const fsSync = require('fs');
const { spawn } = require('child_process');

// Keep a global reference of the window object
let mainWindow;

// Configuration file path - store next to app executable with fallback
let configDir, configPath;

function getConfigPath() {
  if (isDev) {
    // During development, store in project root
    configDir = path.join(__dirname, '../../config');
    configPath = path.join(configDir, 'settings.json');
  } else {
    // When packaged, try to store next to app executable
    const appDir = path.dirname(app.getPath('exe'));
    configDir = path.join(appDir, 'config');
    configPath = path.join(configDir, 'settings.json');
    
    // Test if we can write to this location
    try {
      if (!fsSync.existsSync(configDir)) {
        fsSync.mkdirSync(configDir, { recursive: true });
      }
      // Test write permissions
      const testFile = path.join(configDir, '.write-test');
      fsSync.writeFileSync(testFile, 'test');
      fsSync.unlinkSync(testFile);
      console.log('✅ Using config directory:', configDir);
    } catch (error) {
      // Fallback to user data directory if we don't have write permissions
      console.log('⚠️  No write permission to app directory, falling back to userData');
      configDir = path.join(app.getPath('userData'), 'config');
      configPath = path.join(configDir, 'settings.json');
      if (!fsSync.existsSync(configDir)) {
        fsSync.mkdirSync(configDir, { recursive: true });
      }
      console.log('✅ Using config directory (fallback):', configDir);
    }
  }
  
  return { configDir, configPath };
}

// Initialize config paths
const { configDir: CONFIG_DIR, configPath: CONFIG_PATH } = getConfigPath();

// Helper function to get Python executable path
function getPythonPath() {
  const isWindows = process.platform === 'win32';
  const pythonExecutable = isWindows ? 'python.exe' : 'python';
  const venvBinDir = isWindows ? 'Scripts' : 'bin';
  
  // Always prioritize the virtual environment in the backend folder
  const backendPath = getBackendPath();
  const venvPath = path.join(backendPath, '.venv', venvBinDir, pythonExecutable);
  
  console.log('🔍 Checking venv Python path:', venvPath);
  if (fsSync.existsSync(venvPath)) {
    // Verify the virtual environment
    try {
      // Run a quick test to ensure the virtual environment is working
      const testResult = require('child_process').spawnSync(venvPath, ['-c', 'import dotenv']);
      if (testResult.status === 0) {
        console.log('✅ Virtual environment verified:', venvPath);
        return venvPath;
      }
      console.warn('⚠️  Virtual environment exists but python-dotenv test failed');
    } catch (error) {
      console.warn('⚠️  Virtual environment test failed:', error.message);
    }
    
    // If the test failed, try to repair the virtual environment
    console.log('🔧 Attempting to repair virtual environment...');
    try {
      // Run setup-windows.bat to repair the environment
      const setupScript = path.join(path.dirname(backendPath), 'setup-windows.bat');
      if (fsSync.existsSync(setupScript)) {
        require('child_process').spawnSync(setupScript, [], { stdio: 'inherit' });
        console.log('✅ Virtual environment repaired');
        return venvPath;
      }
    } catch (error) {
      console.error('❌ Failed to repair virtual environment:', error.message);
    }
  }
  
  // If venv not found or repair failed, throw an error
  throw new Error('Python virtual environment is not properly set up. Please run setup-windows.bat manually.');
}

// Helper function to get backend path
function getBackendPath() {
  if (isDev) {
    return path.join(__dirname, '../../backend');
  } else {
    // Production: check multiple possible locations
    const appDir = path.dirname(app.getPath('exe'));
    
    // Try relative to app executable
    const backend1 = path.join(appDir, 'backend');
    if (fsSync.existsSync(backend1)) {
      return backend1;
    }
    
    // Try in Resources folder (Mac app bundle)
    const backend2 = path.join(process.resourcesPath, 'backend');
    if (fsSync.existsSync(backend2)) {
      return backend2;
    }
    
    // Fallback to development path (shouldn't happen in production)
    return path.join(__dirname, '../../backend');
  }
}

// Helper function to get writable output directory
function getOutputDir() {
  if (isDev) {
    return path.join(__dirname, '../../backend/outputs');
  } else {
    // In production, use writable location in user data
    const outputDir = path.join(app.getPath('userData'), 'outputs');
    if (!fsSync.existsSync(outputDir)) {
      fsSync.mkdirSync(outputDir, { recursive: true });
    }
    return outputDir;
  }
}

// Helper function to get temp directory
function getTempDir() {
  const outputDir = getOutputDir();
  const tempDir = path.join(outputDir, 'temp');
  if (!fsSync.existsSync(tempDir)) {
    fsSync.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

// Check if this is first run
function isFirstRun() {
  return !fsSync.existsSync(CONFIG_PATH);
}

// Save configuration to JSON file
async function saveConfig(config) {
  try {
    if (!fsSync.existsSync(CONFIG_DIR)) {
      await fs.mkdir(CONFIG_DIR, { recursive: true });
    }
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    console.log('✅ Configuration saved to:', CONFIG_PATH);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to save configuration:', error);
    return { success: false, error: error.message };
  }
}

// Load configuration from JSON file
async function loadConfig() {
  try {
    if (fsSync.existsSync(CONFIG_PATH)) {
      const content = await fs.readFile(CONFIG_PATH, 'utf-8');
      const config = JSON.parse(content);
      console.log('✅ Configuration loaded from:', CONFIG_PATH);
      
      // CRITICAL: Remove isConfigured flag - let frontend validate based on actual API keys
      delete config.isConfigured;
      
      return config;
    }
  } catch (error) {
    console.error('⚠️  Failed to load configuration:', error);
  }
  
  // Return default configuration
  return {
    provider: 'openai',
    model: 'gpt-4o-mini',
    openaiApiKey: '',
    anthropicApiKey: '',
    googleApiKey: '',
    ollamaHost: 'http://localhost:11434',
    logLevel: 'INFO',
    jiraBase: 'http://localhost:4001',
    jiraEmail: '',
    jiraProjectKey: 'QA',
    jiraBoardId: '3968',
    jiraBearer: ''
  };
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../../assets/icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  // Load the app - always use build folder
  const startUrl = `file://${path.join(__dirname, '../../build/index.html')}`;
  
  console.log('isDev:', isDev);
  console.log('startUrl:', startUrl);
  
  mainWindow.loadURL(startUrl);

  // Show when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Maximize the window on startup for better space utilization
    mainWindow.maximize();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App event listeners
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers for file operations
ipcMain.handle('select-requirement-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Requirement File',
    defaultPath: path.join(__dirname, '../../backend/data/requirements'),
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        success: true,
        filePath,
        fileName: path.basename(filePath),
        content: content.trim()
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to read file: ${error.message}`
      };
    }
  }
  
  return { success: false, canceled: true };
});

// Save file dialog
ipcMain.handle('save-file-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: options.title || 'Save File',
    defaultPath: options.defaultPath,
    filters: options.filters || [{ name: 'All Files', extensions: ['*'] }]
  });

  return result;
});

// Write file
ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Read default requirements
ipcMain.handle('get-default-requirements', async () => {
  try {
    const reqDir = path.join(__dirname, '../../backend/data/requirements');
    const files = await fs.readdir(reqDir);
    const txtFiles = files.filter(file => file.endsWith('.txt')).sort();
    
    if (txtFiles.length > 0) {
      const firstFile = path.join(reqDir, txtFiles[0]);
      const content = await fs.readFile(firstFile, 'utf-8');
      return {
        success: true,
        filePath: firstFile,
        fileName: txtFiles[0],
        content: content.trim(),
        availableFiles: txtFiles
      };
    }
    
    return { success: false, error: 'No requirement files found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Enhance requirement by calling Python backend
ipcMain.handle('enhance-requirement', async (event, requirementText, testCategory = 'functional', testType = 'smoke', enhancementType = 'improvise') => {
  console.log('✨ IPC: enhance-requirement called with:', { 
    requirementLength: requirementText.length, 
    testCategory,
    testType,
    enhancementType,
    enhancementTypeType: typeof enhancementType,
    firstChars: requirementText.substring(0, 100)
  });
  
  console.log('🔍 CRITICAL: Enhancement Type Parameter =', enhancementType);
  console.log('🔍 CRITICAL: Is fix-grammar?', enhancementType === 'fix-grammar');
  
  return new Promise((resolve) => {
    try {
      // Path to the Python environment and script
      const pythonPath = getPythonPath();
      const backendPath = getBackendPath();
      
      console.log('🐍 Python paths:', { pythonPath, backendPath });
      
      // Create temporary requirement file in writable location
      const tempDir = getTempDir();
      const tempFile = path.join(tempDir, `temp_requirement_${Date.now()}.txt`);
      
      // Write temporary requirement file
      fs.writeFile(tempFile, requirementText, 'utf-8').then(() => {
        console.log('📁 Temp file created:', tempFile);
        console.log('⚙️ Spawn args:', ['-m', 'src.agents.simple_requirement_enhancer', '--input', tempFile, '--category', testCategory, '--type', testType, '--enhancement-type', enhancementType]);
        console.log('📂 CWD:', backendPath);
        
        // Set environment variables including OUTPUT_DIR and Python paths
        const isWindows = process.platform === 'win32';
        const venvPath = path.join(backendPath, '.venv');
        const venvBinDir = isWindows ? 'Scripts' : 'bin';
        const venvBinPath = path.join(venvPath, venvBinDir);
        
        // Prepare environment variables
        const envVars = {
          ...process.env,
          OUTPUT_DIR: getOutputDir(),
          DOTENV_PATH: getEnvFilePath(),
          PYTHONPATH: backendPath,
          // Add virtual environment paths to PATH
          PATH: `${venvBinPath}${path.delimiter}${process.env.PATH}`,
          VIRTUAL_ENV: venvPath
        };
        
        console.log('🔧 Environment setup:', {
          PYTHONPATH: envVars.PYTHONPATH,
          DOTENV_PATH: envVars.DOTENV_PATH,
          VIRTUAL_ENV: envVars.VIRTUAL_ENV
        });
        
        // Spawn Python process
        const pythonProcess = spawn(pythonPath, ['-m', 'src.agents.simple_requirement_enhancer', '--input', tempFile, '--category', testCategory, '--type', testType, '--enhancement-type', enhancementType], {
          cwd: backendPath,
          stdio: ['pipe', 'pipe', 'pipe'],
          env: envVars
        });

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        pythonProcess.on('close', async (code) => {
          console.log('🐍 Python process closed with code:', code);
          console.log('📤 Python stdout:', stdout);
          console.log('📤 Python stderr:', stderr);

          // Clean up temp file
          try {
            await fs.unlink(tempFile);
            console.log('🗑️ Cleaned up temp file:', tempFile);
          } catch (error) {
            console.warn('⚠️ Could not clean up temp file:', error.message);
          }

          if (code === 0) {
            try {
              // Parse the JSON output from Python
              const result = JSON.parse(stdout);
              console.log('✅ Enhancement result:', { success: result.success, enhanced: !!result.enhanced_requirement });
              resolve(result);
            } catch (parseError) {
              console.error('❌ Failed to parse Python output:', parseError);
              resolve({
                success: false,
                error: `Failed to parse enhancement result: ${parseError.message}`,
                stdout,
                stderr
              });
            }
          } else {
            console.error('❌ Python process failed with code:', code);
            
            // Detect specific error conditions
            let errorMessage = `Enhancement failed with code ${code}`;
            
            if (code === 9009 || stderr.includes('Python was not found') || stderr.includes('not recognized')) {
              errorMessage = 'Python is not installed or not found in PATH.\n\n' +
                'Please install Python 3.8+ from https://www.python.org/downloads/\n' +
                'Make sure to check "Add Python to PATH" during installation!\n\n' +
                'Then run setup-windows.bat (Windows) or ./setup-macos.sh (Mac/Linux)';
            } else if (stderr.includes('No module named')) {
              errorMessage = 'Python dependencies are not installed.\n\n' +
                'Please run setup-windows.bat (Windows) or ./setup-macos.sh (Mac/Linux)';
            } else if (stderr.includes('ModuleNotFoundError')) {
              errorMessage = 'Required Python modules are missing.\n\n' +
                'Please run the setup script for your platform.';
            } else if (stderr.includes('exceeded your current quota') || stderr.includes('insufficient_quota')) {
              errorMessage = 'OpenAI API quota exceeded.\n\n' +
                'Your OpenAI API key has insufficient credits or quota.\n' +
                'Please:\n' +
                '1. Check your billing at https://platform.openai.com/account/billing\n' +
                '2. Add credits to your OpenAI account, OR\n' +
                '3. Use a different API key, OR\n' +
                '4. Switch to a different provider (Ollama, Anthropic, Google) in Configuration';
            } else if (stderr.includes('RateLimitError') || stderr.includes('Rate limit')) {
              errorMessage = 'API rate limit exceeded.\n\n' +
                'Too many requests to the API. Please wait a moment and try again.';
            } else if (stderr.includes('AuthenticationError') || stderr.includes('invalid API key')) {
              errorMessage = 'Invalid API key.\n\n' +
                'Please check your API key in the Configuration page.';
            }
            
            resolve({
              success: false,
              error: errorMessage,
              stderr: stderr || 'Unknown error'
            });
          }
        });

        pythonProcess.on('error', (error) => {
          console.error('❌ Python process error:', error);
          resolve({
            success: false,
            error: `Process error: ${error.message}`
          });
        });
        
      }).catch((fsError) => {
        console.error('❌ File system error:', fsError);
        resolve({
          success: false,
          error: `File system error: ${fsError.message}`
        });
      });

    } catch (error) {
      console.error('❌ Enhancement error:', error);
      resolve({
        success: false,
        error: error.message
      });
    }
  });
});

// Generate test cases by calling Python backend
ipcMain.handle('generate-test-cases', async (event, requirementText, testType = 'smoke', testCategory = 'functional') => {
  console.log('🚀 IPC: generate-test-cases called with:', { 
    requirementLength: requirementText.length, 
    testType,
    testCategory,
    firstChars: requirementText.substring(0, 100)
  });
  
  return new Promise((resolve) => {
    try {
      // Path to the Python environment and script
      const pythonPath = getPythonPath();
      const backendPath = getBackendPath();
      
      console.log('🐍 Python paths:', { pythonPath, backendPath });
      
      // Create temporary requirement file in writable location
      const tempDir = getTempDir();
      const tempFile = path.join(tempDir, `temp_requirement_${Date.now()}.txt`);
      
      // Write temporary requirement file
      fs.writeFile(tempFile, requirementText, 'utf-8').then(() => {
        console.log('📁 Temp file created:', tempFile);
        console.log('⚙️ Spawn args:', ['-m', 'src.agents.testcase_agent', '--input', tempFile, '--category', testCategory, '--type', testType]);
        console.log('📂 CWD:', backendPath);
        
        // Set environment variables including configuration paths
        const envVars = {
          ...process.env,
          OUTPUT_DIR: getOutputDir(),
          CONFIG_PATH: CONFIG_PATH // Use settings.json path
        };
        
        // Spawn Python process
        const pythonProcess = spawn(pythonPath, ['-m', 'src.agents.testcase_agent', '--input', tempFile, '--category', testCategory, '--type', testType], {
          cwd: backendPath,
          stdio: ['pipe', 'pipe', 'pipe'],
          env: envVars
        });

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        pythonProcess.on('close', async (code) => {
          console.log('🐍 Python process closed with code:', code);
          console.log('📤 Python stdout:', stdout);
          console.log('📤 Python stderr:', stderr);
          
          // Clean up temp file
          try {
            await fs.unlink(tempFile);
          } catch (e) {
            // Ignore cleanup errors
          }

          if (code === 0) {
            try {
              // Read generated CSV file from writable output directory
              const outputDir = getOutputDir();
              const outputCsv = path.join(outputDir, 'testcase_generated/test_cases.csv');
              console.log('📄 Reading CSV from:', outputCsv);
              const csvContent = await fs.readFile(outputCsv, 'utf-8');
              console.log('📄 CSV content length:', csvContent.length);
              
              // Read raw JSON file if available
              let rawJson = null;
              try {
                const rawJsonPath = path.join(outputDir, 'testcase_generated/last_raw.json');
                const rawContent = await fs.readFile(rawJsonPath, 'utf-8');
                rawJson = JSON.parse(rawContent);
                console.log('📄 Raw JSON loaded successfully');
              } catch (e) {
                console.log('📄 Raw JSON not available:', e.message);
                // Raw JSON not available, continue without it
              }

              // Read quality report if available
              let qualityReport = null;
              try {
                const qualityReportPath = path.join(outputDir, 'testcase_generated/quality_report.json');
                const qualityContent = await fs.readFile(qualityReportPath, 'utf-8');
                qualityReport = JSON.parse(qualityContent);
                console.log('📊 Quality report loaded successfully');
              } catch (e) {
                console.log('📊 Quality report not available:', e.message);
                // Quality report not available, continue without it
              }

              const result = {
                success: true,
                csvContent,
                rawJson,
                qualityReport,
                stdout,
                message: 'Test cases generated successfully!'
              };
              console.log('✅ Resolving with success result:', {
                success: result.success,
                csvContentLength: result.csvContent?.length,
                hasRawJson: !!result.rawJson,
                hasQualityReport: !!result.qualityReport,
                message: result.message
              });
              resolve(result);
            } catch (error) {
              console.error('❌ Error reading generated files:', error);
              resolve({
                success: false,
                error: `Failed to read generated files: ${error.message}`,
                stderr
              });
            }
          } else {
            // Detect specific error conditions - TEST CASE GENERATION
            let errorMessage = `Python script failed with code ${code}`;
            
            if (code === 9009 || stderr.includes('Python was not found') || stderr.includes('not recognized')) {
              errorMessage = 'Python is not installed or not found in PATH.\n\n' +
                'Please install Python 3.8+ from https://www.python.org/downloads/\n' +
                'Make sure to check "Add Python to PATH" during installation!\n\n' +
                'Then run setup-windows.bat (Windows) or ./setup-macos.sh (Mac/Linux)';
            } else if (stderr.includes('No module named')) {
              errorMessage = 'Python dependencies are not installed.\n\n' +
                'Please run setup-windows.bat (Windows) or ./setup-macos.sh (Mac/Linux)';
            } else if (stderr.includes('ModuleNotFoundError')) {
              errorMessage = 'Required Python modules are missing.\n\n' +
                'Please run the setup script for your platform.';
            } else if (stderr.includes('model') && stderr.includes('not found') && stderr.includes('try pulling it first')) {
              // Extract model name from error message
              const modelMatch = stderr.match(/model "([^"]+)" not found/);
              const modelName = modelMatch ? modelMatch[1] : 'the model';
              errorMessage = `Ollama model "${modelName}" not found.\n\n` +
                `The Ollama server is running, but the model hasn't been downloaded yet.\n\n` +
                `To fix this, run in your terminal:\n` +
                `  ollama pull ${modelName}\n\n` +
                `Or choose a different model that you've already pulled.\n` +
                `To see available models, run: ollama list`;
            } else if (stderr.includes('OPENAI_API_KEY is missing') || (stderr.includes('RuntimeError') && stderr.includes('API'))) {
              errorMessage = 'API key is not configured.\n\n' +
                'Please configure your LLM provider and API key in the Configuration page.\n\n' +
                'Options:\n' +
                '1. OpenAI: Get API key from https://platform.openai.com/api-keys\n' +
                '2. Anthropic: Get API key from https://console.anthropic.com/\n' +
                '3. Google: Get API key from https://makersuite.google.com/app/apikey\n' +
                '4. Ollama (FREE): Install from https://ollama.ai and run locally';
            } else if (stderr.includes('exceeded your current quota') || stderr.includes('insufficient_quota')) {
              errorMessage = 'OpenAI API quota exceeded.\n\n' +
                'Your OpenAI API key has insufficient credits or quota.\n' +
                'Please:\n' +
                '1. Check your billing at https://platform.openai.com/account/billing\n' +
                '2. Add credits to your OpenAI account, OR\n' +
                '3. Use a different API key, OR\n' +
                '4. Switch to a different provider (Ollama, Anthropic, Google) in Configuration';
            } else if (stderr.includes('RateLimitError') || stderr.includes('Rate limit')) {
              errorMessage = 'API rate limit exceeded.\n\n' +
                'Too many requests to the API. Please wait a moment and try again.';
            } else if (stderr.includes('AuthenticationError') || stderr.includes('invalid API key')) {
              errorMessage = 'Invalid API key.\n\n' +
                'Please check your API key in the Configuration page.';
            }
            
            resolve({
              success: false,
              error: errorMessage,
              stderr,
              stdout
            });
          }
        });

        pythonProcess.on('error', (error) => {
          console.error('🚨 Python process error:', error);
          resolve({
            success: false,
            error: `Failed to start Python process: ${error.message}`
          });
        });

      }).catch((error) => {
        resolve({
          success: false,
          error: `Failed to create temp file: ${error.message}`
        });
      });

    } catch (error) {
      resolve({
        success: false,
        error: `Unexpected error: ${error.message}`
      });
    }
  });
});

// Show message box
ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

// Open external link
ipcMain.handle('open-external', async (event, url) => {
  shell.openExternal(url);
});

// Get app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Configuration management
ipcMain.handle('get-configuration', async () => {
  try {
    // Load from JSON config file
    const config = await loadConfig();
    console.log('✅ Configuration loaded:', JSON.stringify(config, null, 2));
    return { success: true, config };
  } catch (error) {
    console.error('❌ Failed to load configuration:', error);
    return { success: false, error: error.message };
  }
});

// Check if first run
ipcMain.handle('check-first-run', async () => {
  const firstRun = isFirstRun();
  console.log('🔍 First run check:', firstRun);
  return { isFirstRun: firstRun, configPath: CONFIG_PATH };
});

ipcMain.handle('save-configuration', async (event, config) => {
  try {
    console.log('💾 Saving configuration:', JSON.stringify(config, null, 2));
    
    // Check if the SELECTED provider is properly configured
    let isProviderConfigured = false;
    
    if (config.provider === 'openai') {
      isProviderConfigured = config.openaiApiKey && config.openaiApiKey.trim() !== '' && config.openaiApiKey !== 'your-openai-api-key-here';
    } else if (config.provider === 'anthropic') {
      isProviderConfigured = config.anthropicApiKey && config.anthropicApiKey.trim() !== '';
    } else if (config.provider === 'google') {
      isProviderConfigured = config.googleApiKey && config.googleApiKey.trim() !== '';
    } else if (config.provider === 'ollama') {
      // For Ollama, check if host is configured (no API key needed)
      isProviderConfigured = config.ollamaHost && config.ollamaHost.trim() !== '';
    }
    
    // Mark as configured only if the selected provider is properly set up
    config.isConfigured = isProviderConfigured;
    console.log('🔍 Configuration status:', { 
      isConfigured: config.isConfigured, 
      selectedProvider: config.provider,
      isProviderConfigured 
    });
    
    // Save to JSON file
    const result = await saveConfig(config);
    if (!result.success) {
      return result;
    }
    
    // Also update backend .env file for Python scripts
    // Use a writable location outside the app bundle
    const envPath = getEnvFilePath();
    
    console.log('📝 .env path:', envPath);
    
    // Create parent directory if it doesn't exist
    const envDir = path.dirname(envPath);
    if (!fsSync.existsSync(envDir)) {
      fsSync.mkdirSync(envDir, { recursive: true });
    }
    
    // Read current .env file
    let envContent = '';
    try {
      envContent = await fs.readFile(envPath, 'utf-8');
    } catch (error) {
      // File doesn't exist, start with empty content
      console.log('Creating new .env file');
    }
    
    // Update configuration values
    const updates = {
      'PROVIDER': config.provider,
      'MODEL': config.model,
      'OPENAI_API_KEY': config.openaiApiKey || '',
      'ANTHROPIC_API_KEY': config.anthropicApiKey || '',
      'GOOGLE_API_KEY': config.googleApiKey || '',
      'OLLAMA_HOST': config.ollamaHost || 'http://localhost:11434',
      'LOG_LEVEL': config.logLevel || 'INFO',
      'JIRA_BASE': (config.jiraBase || 'http://localhost:4001').replace(/\/+$/, ''), // Remove trailing slashes
      'JIRA_EMAIL': config.jiraEmail || '',
      'JIRA_PROJECT_KEY': config.jiraProjectKey || 'QA',
      'JIRA_BOARD_ID': config.jiraBoardId || '3968',
      'JIRA_BEARER': config.jiraBearer || '',
    };
    
    console.log('🔧 Updates to apply:', JSON.stringify(updates, null, 2));
    
    let newEnvContent = envContent;
    
    // Update existing keys or add new ones
    for (const [key, value] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const newLine = `${key}=${value}`;
      
      if (regex.test(newEnvContent)) {
        console.log(`✏️  Updating existing key: ${key}`);
        newEnvContent = newEnvContent.replace(regex, newLine);
      } else {
        console.log(`➕ Adding new key: ${key}`);
        // Add new key at the end
        if (newEnvContent && !newEnvContent.endsWith('\n')) {
          newEnvContent += '\n';
        }
        newEnvContent += newLine + '\n';
      }
    }
    
    // Write updated .env file
    await fs.writeFile(envPath, newEnvContent, 'utf-8');
    console.log('✅ Configuration saved successfully to:', envPath);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to save configuration:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('test-llm-connection', async (event, testConfig) => {
  try {
    console.log('🧪 Testing LLM connection:', { 
      provider: testConfig.provider, 
      model: testConfig.model,
      hasApiKey: !!testConfig.apiKey,
      apiKeyLength: testConfig.apiKey ? testConfig.apiKey.length : 0,
      apiKeyPrefix: testConfig.apiKey ? testConfig.apiKey.substring(0, 10) : 'none'
    });

    // Get Python path and backend path
    const pythonPath = getPythonPath();
    const backendPath = getBackendPath();
    
    console.log('🐍 Python path:', pythonPath);
    console.log('📁 Backend path:', backendPath);
    
    // Check Python environment
    try {
      // First, check if Python exists and get its version
      const versionProcess = spawn(pythonPath, ['--version'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const versionResult = await new Promise((resolve) => {
        let stdout = '';
        let stderr = '';
        
        versionProcess.stdout.on('data', (data) => stdout += data.toString());
        versionProcess.stderr.on('data', (data) => stderr += data.toString());
        
        versionProcess.on('close', (code) => {
          if (code === 0) {
            resolve({ success: true, version: stdout.trim() });
          } else {
            resolve({ 
              success: false, 
              error: 'Python is not properly installed.\n\n' +
                     'Please:\n' +
                     '1. Install Python 3.8+ from https://www.python.org/downloads/\n' +
                     '2. Check "Add Python to PATH" during installation\n' +
                     '3. Run setup-windows.bat to complete the setup'
            });
          }
        });
      });
      
      if (!versionResult.success) {
        return { success: false, message: versionResult.error };
      }
      
      // Now check for required packages
      const checkPackages = `
import sys
import json

required = ['langchain', 'python-dotenv', 'requests', 'pandas', 'openpyxl']
missing = []

for package in required:
    try:
        __import__(package)
    except ImportError:
        missing.append(package)

result = {
    'success': len(missing) == 0,
    'python_version': sys.version,
    'missing_packages': missing
}

print(json.dumps(result))
      `;
      
      const checkProcess = spawn(pythonPath, ['-c', checkPackages], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const checkResult = await new Promise((resolveCheck) => {
        let stdout = '';
        let stderr = '';

        checkProcess.stdout.on('data', (data) => stdout += data.toString());
        checkProcess.stderr.on('data', (data) => stderr += data.toString());

        checkProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(stdout.trim());
              if (!result.success) {
                result.error = `Missing required packages: ${result.missing_packages.join(', ')}\n\n` +
                              'Please run setup-windows.bat to install all dependencies';
              }
              resolveCheck(result);
            } catch (e) {
              resolveCheck({ 
                success: false, 
                error: 'Failed to check Python packages. Please run setup-windows.bat to fix the environment.'
              });
            }
          } else {
            resolveCheck({ 
              success: false, 
              error: stderr || 'Python environment check failed.\n\nPlease run setup-windows.bat to fix the environment.'
            });
          }
        });
      });

      if (!checkResult.success) {
        return {
          success: false,
          message: `Python environment error: ${checkResult.error}`
        };
      }

      if (checkResult.missing_packages && checkResult.missing_packages.length > 0) {
        const missingList = checkResult.missing_packages.join(', ');
        return {
          success: false,
          message: `Missing required Python packages: ${missingList}\n\nPlease run:\npip install ${missingList}`
        };
      }

      // If using system Python without venv, show warning
      if (!checkResult.is_venv && pythonPath === 'python' || pythonPath === 'python3') {
        console.warn('⚠️ Using system Python without virtual environment');
      }
    } catch (error) {
      return {
        success: false,
        message: 'Python is not properly installed or configured.\n\n' +
                'Please ensure:\n' +
                '1. Python 3.8 or higher is installed (https://www.python.org/downloads/)\n' +
                '2. "Add Python to PATH" was checked during installation\n' +
                '3. Run setup-windows.bat (Windows) or setup-macos.sh (Mac/Linux)\n\n' +
                `Error details: ${error.message}`
      };
    }
    
    return new Promise((resolve) => {
      const testScript = `
import sys
import os
sys.path.insert(0, '${backendPath.replace(/\\/g, '\\\\')}')

try:
    provider = os.getenv('PROVIDER', '')
    model = os.getenv('MODEL', '')
    
    print(f"DEBUG: Provider: {provider}", file=sys.stderr)
    print(f"DEBUG: Model: {model}", file=sys.stderr)
    
    # For Ollama, test connection to the server
    if provider == 'ollama':
        import requests
        import json
        ollama_host = os.getenv('OLLAMA_HOST', 'http://localhost:11434')
        print(f"DEBUG: Testing Ollama at {ollama_host}", file=sys.stderr)
        
        try:
            # Test if Ollama server is running and get available models
            response = requests.get(f"{ollama_host}/api/tags", timeout=5)
            if response.status_code == 200:
                print(f"DEBUG: Ollama server is running", file=sys.stderr)
                
                # Check if the requested model exists
                data = response.json()
                models = data.get('models', [])
                model_names = [m.get('name') for m in models]
                
                print(f"DEBUG: Available models: {model_names}", file=sys.stderr)
                print(f"DEBUG: Looking for model: {model}", file=sys.stderr)
                
                # Check if model exists (with or without :latest tag)
                model_found = False
                for model_name in model_names:
                    if model_name == model or model_name == f"{model}:latest" or f"{model_name}:latest" == model:
                        model_found = True
                        break
                
                if model_found:
                    print(f"SUCCESS: Ollama server is running and model '{model}' is available")
                else:
                    print(f"ERROR: Model '{model}' not found. Available models: {', '.join(model_names) if model_names else 'none'}. Run 'ollama pull {model}' to download it.")
                    sys.exit(1)
            else:
                print(f"ERROR: Ollama server returned status code {response.status_code}")
                sys.exit(1)
        except requests.exceptions.ConnectionError:
            print("ERROR: Cannot connect to Ollama server. Make sure Ollama is running.")
            sys.exit(1)
        except requests.exceptions.Timeout:
            print("ERROR: Connection to Ollama server timed out.")
            sys.exit(1)
    else:
        # For API-based providers, test with a simple chat request
        api_key = os.getenv('OPENAI_API_KEY') or os.getenv('ANTHROPIC_API_KEY') or os.getenv('GOOGLE_API_KEY', '')
        print(f"DEBUG: API key length: {len(api_key)}", file=sys.stderr)
        
        from src.core.llm_client import chat
        
        # Try a simple test prompt
        messages = [{"role": "user", "content": "Say 'hello' if you can read this."}]
        response = chat(messages)
        
        if response and len(response.strip()) > 0:
            print("SUCCESS: Connection test successful")
        else:
            print("ERROR: No response from LLM")
            sys.exit(1)
except Exception as e:
    import traceback
    print(f"ERROR: Connection test failed: {str(e)}")
    traceback.print_exc()
    sys.exit(1)
`;
      
      // Build environment variables
      // DO NOT spread process.env - it may contain corrupted values
      // Only pass the specific variables we need
      const testEnv = {
        PATH: process.env.PATH, // Keep PATH for finding Python
        HOME: process.env.HOME, // Keep HOME for user directory
        PROVIDER: testConfig.provider,
        MODEL: testConfig.model,
        SKIP_DOTENV: '1'  // Skip loading .env file during test connection
      };
      
      // Set API key based on provider - directly from testConfig
      if (testConfig.provider === 'openai' && testConfig.apiKey) {
        testEnv.OPENAI_API_KEY = testConfig.apiKey;
        console.log('🔑 Setting OPENAI_API_KEY, length:', testConfig.apiKey.length);
      } else if (testConfig.provider === 'anthropic' && testConfig.apiKey) {
        testEnv.ANTHROPIC_API_KEY = testConfig.apiKey;
        console.log('🔑 Setting ANTHROPIC_API_KEY, length:', testConfig.apiKey.length);
      } else if (testConfig.provider === 'google' && testConfig.apiKey) {
        testEnv.GOOGLE_API_KEY = testConfig.apiKey;
        console.log('🔑 Setting GOOGLE_API_KEY, length:', testConfig.apiKey.length);
      }
      
      if (testConfig.host) {
        testEnv.OLLAMA_HOST = testConfig.host;
      }
      
      console.log('🌍 Test environment keys:', Object.keys(testEnv));
      
      const pythonProcess = spawn(pythonPath, ['-c', testScript], {
        cwd: backendPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: testEnv
      });
      
      let stdout = '';
      let stderr = '';
      
      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('Python stdout:', output);
        stdout += output;
      });
      
      pythonProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.log('Python stderr:', output);
        stderr += output;
      });
      
      pythonProcess.on('close', (code) => {
        console.log('Python process closed with code:', code);
        console.log('Python stdout:', stdout);
        console.log('Python stderr:', stderr);
        
        if (code === 0 && stdout.includes('SUCCESS')) {
          resolve({ success: true, message: 'Connection successful!' });
        } else {
          // Extract error message from output - prefer stdout where our ERROR messages are
          let errorMsg = 'Connection test failed';
          
          // Look for ERROR: pattern in stdout first (where we print our messages)
          const stdoutErrorMatch = stdout.match(/ERROR: (.+)/);
          if (stdoutErrorMatch) {
            errorMsg = stdoutErrorMatch[1].trim();
          } else {
            // Try stderr for other errors
            const stderrErrorMatch = stderr.match(/Error: (.+)/i);
            if (stderrErrorMatch) {
              errorMsg = stderrErrorMatch[1].trim();
            } else if (stderr) {
              // Filter out debug messages and warnings, show actual errors
              const errorLines = stderr.split('\n')
                .filter(line => line.trim() && 
                        !line.includes('DEBUG:') && 
                        !line.includes('Warning') &&
                        !line.includes('DeprecationWarning'))
                .join(' ')
                .substring(0, 500);
              if (errorLines) {
                errorMsg = errorLines;
              }
            }
          }
          
          resolve({ success: false, message: errorMsg });
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('Python process error:', error);
        resolve({ success: false, message: `Failed to start Python: ${error.message}` });
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        pythonProcess.kill();
        resolve({ success: false, message: 'Connection test timed out after 30 seconds' });
      }, 30000);
    });
  } catch (error) {
    console.error('Test connection error:', error);
    return { success: false, message: error.message };
  }
});

// Test JIRA connection
ipcMain.handle('test-jira-connection', async (event, jiraConfig) => {
  try {
    console.log('🧪 Testing JIRA connection:', {
      jiraBase: jiraConfig.jiraBase,
      jiraEmail: jiraConfig.jiraEmail,
      hasToken: !!jiraConfig.jiraBearer,
      projectKey: jiraConfig.jiraProjectKey
    });

    const pythonPath = getPythonPath();
    const backendPath = getBackendPath();
    
    if (pythonPath !== 'python3' && !fsSync.existsSync(pythonPath)) {
      return {
        success: false,
        message: 'Python interpreter not found. Please ensure Python is installed.'
      };
    }
    
    return new Promise((resolve) => {
      const testScript = `
import sys
import os
sys.path.insert(0, '${backendPath.replace(/\\/g, '\\\\')}')

try:
    import requests
    from requests.auth import HTTPBasicAuth
    
    jira_base = os.getenv('JIRA_BASE', '')
    jira_email = os.getenv('JIRA_EMAIL', '')
    jira_token = os.getenv('JIRA_BEARER', '')
    project_key = os.getenv('JIRA_PROJECT_KEY', '')
    
    print(f"DEBUG: Testing connection to {jira_base}", file=sys.stderr)
    
    # Test connection by fetching project info
    url = f"{jira_base}/rest/api/2/project/{project_key}"
    
    auth = HTTPBasicAuth(jira_email, jira_token) if jira_email else None
    headers = {'Authorization': f'Bearer {jira_token}'} if not jira_email else {}
    
    response = requests.get(url, auth=auth, headers=headers, timeout=10)
    
    if response.status_code == 200:
        project_data = response.json()
        print(f"SUCCESS: Connected to JIRA project '{project_data.get('name', project_key)}'")
    elif response.status_code == 401:
        print("ERROR: Authentication failed. Check your email and API token.")
        sys.exit(1)
    elif response.status_code == 404:
        print(f"ERROR: Project '{project_key}' not found or you don't have access.")
        sys.exit(1)
    else:
        print(f"ERROR: JIRA returned status code {response.status_code}: {response.text[:100]}")
        sys.exit(1)
        
except ImportError as e:
    print(f"ERROR: Missing required package: {str(e)}. Please run: pip install requests")
    sys.exit(1)
except requests.exceptions.Timeout:
    print("ERROR: Connection timeout. Please check your JIRA Base URL.")
    sys.exit(1)
except requests.exceptions.ConnectionError:
    print("ERROR: Cannot connect to JIRA. Please check your JIRA Base URL.")
    sys.exit(1)
except Exception as e:
    import traceback
    print(f"ERROR: JIRA connection test failed: {str(e)}")
    traceback.print_exc()
    sys.exit(1)
`;
      
      const testEnv = {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        JIRA_BASE: jiraConfig.jiraBase,
        JIRA_EMAIL: jiraConfig.jiraEmail || '',
        JIRA_BEARER: jiraConfig.jiraBearer,
        JIRA_PROJECT_KEY: jiraConfig.jiraProjectKey,
        SKIP_DOTENV: '1'
      };
      
      const pythonProcess = spawn(pythonPath, ['-c', testScript], {
        cwd: backendPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: testEnv
      });
      
      let stdout = '';
      let stderr = '';
      
      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('Python stdout:', output);
        stdout += output;
      });
      
      pythonProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.log('Python stderr:', output);
        stderr += output;
      });
      
      pythonProcess.on('close', (code) => {
        console.log('Python process closed with code:', code);
        
        if (code === 0 && stdout.includes('SUCCESS')) {
          const match = stdout.match(/Connected to JIRA project '([^']+)'/);
          const projectName = match ? match[1] : 'Unknown';
          resolve({ success: true, message: `Connected to project: ${projectName}` });
        } else {
          let errorMsg = 'JIRA connection test failed';
          const errorMatch = stdout.match(/ERROR: (.+)/) || stderr.match(/Error: (.+)/i);
          if (errorMatch) {
            errorMsg = errorMatch[1];
          } else if (stderr) {
            errorMsg = stderr.split('\\n').filter(line => line.trim() && !line.includes('Warning')).join(' ').substring(0, 200);
          }
          
          resolve({ success: false, message: errorMsg });
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('Python process error:', error);
        resolve({ success: false, message: `Failed to start Python: ${error.message}` });
      });
      
      setTimeout(() => {
        pythonProcess.kill();
        resolve({ success: false, message: 'JIRA connection test timed out after 30 seconds' });
      }, 30000);
    });
  } catch (error) {
    console.error('Test JIRA connection error:', error);
    return { success: false, message: error.message };
  }
});

// Fetch JIRA issues from active sprint
ipcMain.handle('fetch-jira-sprint-issues', async (event, projectKey) => {
  console.log('🎯 IPC: fetch-jira-sprint-issues called with project:', projectKey);
  
  return new Promise((resolve) => {
    try {
      const pythonPath = path.join(__dirname, '../../backend/.venv/bin/python');
      const scriptPath = path.join(__dirname, '../../backend/src/drivers/fetch_jira_issues.py');
      
      const args = ['--mode', 'sprint'];
      if (projectKey) {
        args.push('--project-key', projectKey);
      }
      
      console.log('🐍 Spawning Python:', pythonPath, args);
      
      const pythonProcess = spawn(pythonPath, [scriptPath, ...args], {
        cwd: path.join(__dirname, '../../backend'),
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        console.log('🔚 Python process closed with code:', code);
        console.log('📤 stdout:', stdout);
        if (stderr) console.log('❌ stderr:', stderr);
        
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          resolve({ 
            success: false, 
            error: `Failed to parse response: ${error.message}`,
            details: stdout || stderr
          });
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('❌ Python process error:', error);
        resolve({ success: false, error: error.message });
      });
    } catch (error) {
      console.error('❌ Exception in fetch-jira-sprint-issues:', error);
      resolve({ success: false, error: error.message });
    }
  });
});

// Fetch a specific JIRA issue by key
ipcMain.handle('fetch-jira-issue', async (event, issueKey) => {
  console.log('🎯 IPC: fetch-jira-issue called with key:', issueKey);
  
  return new Promise((resolve) => {
    try {
      const pythonPath = path.join(__dirname, '../../backend/.venv/bin/python');
      const scriptPath = path.join(__dirname, '../../backend/src/drivers/fetch_jira_issues.py');
      
      const args = ['--mode', 'issue', '--issue-key', issueKey];
      
      console.log('🐍 Spawning Python:', pythonPath, args);
      
      const pythonProcess = spawn(pythonPath, [scriptPath, ...args], {
        cwd: path.join(__dirname, '../../backend'),
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        console.log('🔚 Python process closed with code:', code);
        console.log('📤 stdout:', stdout);
        if (stderr) console.log('❌ stderr:', stderr);
        
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          resolve({ 
            success: false, 
            error: `Failed to parse response: ${error.message}`,
            details: stdout || stderr
          });
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('❌ Python process error:', error);
        resolve({ success: false, error: error.message });
      });
    } catch (error) {
      console.error('❌ Exception in fetch-jira-issue:', error);
      resolve({ success: false, error: error.message });
    }
  });
});
