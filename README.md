# M+ TGen AI-Powered TestCase Generator

An Electron-based desktop application for AI-powered test case generation with JIRA integration.

## 🚀 Quick Start

### Prerequisites

1. **Python 3.8+** - [Download here](https://www.python.org/downloads/)
   - ⚠️ **Windows users**: Check "Add Python to PATH" during installation!
2. **Node.js 16+** - [Download here](https://nodejs.org/)

### Installation & Setup

**Step 1: Install Python Dependencies**
```cmd
# Windows
setup-windows.bat

# The application will create a Python virtual environment and install required packages
```

**Step 2: Install Node.js Dependencies**
```cmd
npm install
```

**Step 3: Build React Application**
```cmd
npm run react:build
```

**Step 4: Run the Application**
```cmd
# Development mode
npm run electron:dev

# Or simply
electron .
```

## ✨ Features

- **Modern Desktop UI**: Built with Electron, React, and Material-UI
- **AI-Powered Generation**: Multiple LLM provider support (OpenAI, Anthropic, Google, Ollama)
- **JIRA Integration**: Seamlessly fetch and export test cases to JIRA
- **Quality Assessment**: AI-powered quality scoring and recommendations
- **Export Options**: Export test cases as CSV or Zephyr-compatible format
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Real-time Logging**: Activity logs with progress tracking
- **File Management**: Load requirements from files or enter manually
- **Requirement Enhancement**: AI-powered requirement improvement
- **TestRail Integration**: Automatic test case synchronization

## 📋 Prerequisites

1. **Node.js**: Version 16 or higher
2. **Python Environment**: The existing Python backend from the parent project
3. **JIRA Setup**: Configure JIRA integration in the configuration page

## 🛠️ Installation & Setup

### 1. Install Node.js Dependencies

```bash
npm install
```

### 2. Setup Python Environment

```bash
# Windows
setup-windows.bat

# This will:
# - Create a Python virtual environment in backend/.venv
# - Install all required Python packages
# - Set up the necessary directory structure
```

### 3. Build the React Application

```bash
npm run react:build
```

This creates the production build in the `build/` folder.

### 4. Run the Application

```bash
# Development mode
npm run electron:dev

# Or directly with Electron
electron .
```

### 5. Configuration

On first run, configure your LLM provider and JIRA settings:
- Click the ⚙️ Configuration button
- Select your LLM provider (OpenAI, Anthropic, Google, or Ollama)
- Enter your API key or configure Ollama host
- Optionally configure JIRA integration

### 6. Building Distributables

```bash
# Build for current platform
npm run dist

# Windows
npm run dist:win

# macOS
npm run dist:mac

# All platforms
npm run dist:all
```

The built application will be available in the `dist/` directory.

## 🏗️ Architecture

### Frontend (React)
- **React 18**: Modern React with hooks and functional components
- **Material-UI v5**: Google's Material Design components
- **MUI DataGrid**: Advanced data table for test case display
- **MUI Icons**: Comprehensive icon library

### Backend Integration (Node.js/Electron)
- **Electron Main Process**: Handles system operations and Python subprocess
- **IPC Communication**: Secure communication between frontend and backend
- **Python Integration**: Spawns Python processes for test case generation
- **File System Access**: Handles file operations and exports

### Python Backend
- Reuses existing Python agents and integrations
- JIRA API integration
- LLM-powered test case generation
- Quality assessment algorithms

## 📁 Project Structure

```
AI-Test-Case-Generator/
├── package.json              # Dependencies and scripts
├── setup-windows.bat         # Windows setup script
├── src/
│   ├── main/                 # Electron main process
│   │   ├── main.js          # Main Electron process & IPC handlers
│   │   └── preload.js       # Preload script for security
│   ├── components/          # React components
│   │   ├── RequirementInput.js
│   │   ├── TestCaseGeneration.js
│   │   ├── TestCasePreview.js
│   │   ├── QualityAssessment.js
│   │   ├── ActionButtons.js
│   │   ├── ActivityLog.js
│   │   ├── ConfigurationPage.js
│   │   ├── JiraIntegration.js
│   │   ├── WelcomeWizard.js
│   │   ├── LoadingOverlay.js
│   │   └── MplusLogo.js
│   ├── utils/               # Utility functions
│   │   ├── csvParser.js     # CSV parsing utilities
│   │   └── zephyrExporter.js # Zephyr export utilities
│   ├── App.js               # Main React application
│   └── index.js             # React entry point
├── backend/                 # Python backend
│   ├── src/
│   │   ├── agents/          # AI agents
│   │   │   ├── simple_requirement_enhancer.py
│   │   │   └── testcase_agent.py
│   │   ├── core/            # Core modules
│   │   │   ├── llm_client.py
│   │   │   ├── utils.py
│   │   │   ├── quality_scorer.py
│   │   │   └── requirement_enhancer.py
│   │   ├── drivers/         # Integration drivers
│   │   │   └── fetch_jira_issues.py
│   │   └── integrations/    # External integrations
│   │       ├── jira.py
│   │       └── testrail.py
│   ├── data/                # Sample data
│   │   └── requirements/    # Sample requirement files
│   └── outputs/             # Generated outputs
├── build/                   # React production build
├── config/                  # Configuration storage
├── public/                  # Static assets
└── README.md               # This file
```

## 🎯 Usage

### 1. Load Requirements
- **From File**: Click "📁 Load from File" to browse and select requirement files
- **Manual Entry**: Type requirements directly in the text area
- **Examples**: Use "📋 Load Example" to load pre-built examples

### 2. Select Test Category & Type
Choose test category and type:

**Categories:**
- **Functional**: Business logic and feature testing
- **Non-Functional**: Performance, security, usability testing

**Types:**
- **Smoke Tests**: Critical functionality verification
- **Sanity Tests**: Focused testing after changes
- **Unit Tests**: Code-level function testing
- **API Tests**: API endpoint and integration testing

### 3. Generate Test Cases
- Click "🚀 Generate Test Cases" to start AI generation
- Monitor progress in the activity log
- Review generated test cases in the data grid

### 4. Quality Assessment
- View overall quality score and distribution
- Access detailed quality metrics per test case
- Get improvement recommendations

### 5. Actions
- **Export CSV**: Download test cases as CSV
- **Export Zephyr**: Download in Zephyr-compatible CSV format
- **Copy to Clipboard**: Copy test cases for pasting
- **Clear**: Clear current test cases and start over

## 🔧 Configuration

### LLM Provider Configuration

The application supports multiple LLM providers:

**OpenAI:**
- Provider: `openai`
- Models: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, etc.
- API Key: Get from https://platform.openai.com/api-keys

**Anthropic:**
- Provider: `anthropic`
- Models: `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`, etc.
- API Key: Get from https://console.anthropic.com/

**Google:**
- Provider: `google`
- Models: `gemini-1.5-pro`, `gemini-1.5-flash`, etc.
- API Key: Get from https://makersuite.google.com/app/apikey

**Ollama (Local, Free):**
- Provider: `ollama`
- Models: `mistral`, `llama2`, `codellama`, etc.
- Host: Default `http://localhost:11434`
- Install from: https://ollama.ai

### JIRA Integration (Optional)

Configure JIRA to fetch requirements and export test cases:
- **JIRA Base URL**: Your JIRA instance URL
- **JIRA Email**: Your JIRA account email
- **JIRA API Token**: Generate from JIRA account settings
- **Project Key**: Your JIRA project key
- **Board ID**: Your JIRA board ID

### Configuration Storage

Configuration is stored in:
- **Development**: `config/settings.json`
- **Production**: Next to executable or in user data directory

The application automatically creates and manages the `.env` file for Python backend.

## 🚀 Building for Distribution

### Build Commands

```bash
# Build React app and create distributable
npm run dist

# Platform-specific builds
npm run dist:win     # Windows
npm run dist:mac     # macOS
npm run dist:all     # All platforms

# Just build React (no packaging)
npm run react:build
```

### Output

Built applications will be in the `dist/` directory:
- **Windows**: `.exe` installer
- **macOS**: `.dmg` installer
- **Linux**: `.AppImage` or `.deb` package

## 🐛 Troubleshooting

### Common Issues

1. **Python Not Found**
   - Ensure Python 3.8+ is installed and in PATH
   - Run `setup-windows.bat` to create virtual environment
   - Check that `backend/.venv` exists

2. **Module Not Found Errors**
   - Run `setup-windows.bat` to install Python dependencies
   - Ensure virtual environment is activated correctly

3. **API Key Errors**
   - Configure your LLM provider in the Configuration page
   - Test connection using the "Test Connection" button
   - Check API key validity and quotas

4. **JIRA Connection Failed**
   - Verify JIRA configuration in the Configuration page
   - Check JIRA Base URL format (no trailing slash)
   - Ensure API token is valid and has correct permissions

5. **Build Folder Missing**
   - Run `npm run react:build` to create the build folder
   - The app loads from `build/index.html` (not dev server)

6. **File Loading Issues**
   - Ensure requirement files are in UTF-8 encoding
   - Check file permissions

### Debug Mode

Run in development mode for detailed logging:
```bash
npm run electron:dev
```

This will:
- Enable verbose console logging
- Show detailed error messages
- Allow inspection with DevTools (Ctrl+Shift+I)

## 🔄 Development Workflow

### Making Changes

1. **Frontend (React) Changes**: 
   - Edit files in `src/components/` or `src/`
   - Run `npm run react:build` to rebuild
   - Restart Electron to see changes

2. **Backend (Electron) Changes**: 
   - Edit `src/main/main.js` or `src/main/preload.js`
   - Restart the application to reload

3. **Python Backend Changes**: 
   - Edit files in `backend/src/`
   - No restart needed - Python scripts are called fresh each time

### Development Tips

- Use `npm run electron:dev` for development mode
- Check console logs in terminal for Electron process logs
- Use Ctrl+Shift+I in the app to open DevTools for frontend debugging
- Python logs are shown in the Activity Log within the app

## 📦 Dependencies

### Core Dependencies
- `electron`: Desktop application framework
- `react` & `react-dom`: Frontend framework
- `@mui/material`: UI component library
- `@mui/x-data-grid`: Advanced data table
- `@mui/icons-material`: Material Design icons
- `react-dropzone`: File upload component
- `uuid`: Unique ID generation

### Python Dependencies
- `langchain-openai`, `langchain-anthropic`, `langchain-google-genai`, `langchain-ollama`: LLM integrations
- `requests`: HTTP client for JIRA integration
- `python-dotenv`: Environment variable management

### Development Dependencies
- `electron-builder`: Package for distribution
- `react-scripts`: Build tools and development server
- `cross-env`: Cross-platform environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the parent project for details.

## 🆘 Support

For support and questions:
1. Check the troubleshooting section above
2. Review the [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) and [RELEASE_NOTES.md](RELEASE_NOTES.md)
3. Check the GitHub issues for similar problems
4. Create a new issue with detailed information including:
   - Operating system and version
   - Python version (`python --version`)
   - Node.js version (`node --version`)
   - Error messages from logs
   - Steps to reproduce

## 🎯 Use Cases

- **QA Teams**: Generate comprehensive test cases from requirements
- **Business Analysts**: Enhance and validate requirements
- **Test Managers**: Create test plans with quality assessment
- **Developers**: Generate unit and API test cases
- **Agile Teams**: Integrate with JIRA for seamless workflow

## 🔮 Future Enhancements

- AI-powered test execution
- Advanced test case deduplication
- Slack notifications
- TestRail deeper integration
- Multi-language support
- Custom test templates

---

**Built with ❤️ using Electron, React, Material-UI, and AI**