# M+ TGen TestCase Generator
## Release Notes


## Version 2.5 - UI/UX & Integration Enhancements
*Released: November 7, 2025*

**🖼️ Branding & Appearance**
- Updated application logo to custom image (React and Electron)
- Moved logo asset to `src/assets` for build compatibility
- AppBar styling: removed rounded corners for a modern look
- Global scrollbars hidden for cleaner UI
- Electron menu bar hidden for distraction-free experience

**📋 JIRA Integration**
- Added dividers between JIRA issues for improved readability

**📊 DataGrid Improvements**
- DataGrid pagination options restricted to [5, 10, 15, 20] rows per page
- Default rows per page set to 5 for both Test Case and Quality Assessment tables
- Enabled `autoHeight` so tables expand to fit content, eliminating unnecessary scrollbars

**🐍 Backend & Platform Fixes**
- Fixed Python path handling for Electron spawn (Windows compatibility)
- Improved process management and cache clearing for reliable builds

**📝 Documentation**
- Release notes updated to reflect all major changes since v2.4

## Version 2.4 - Codebase Cleanup & Optimization
*Released: November 1, 2025*

**📝 Documentation Updates**
- **Updated README.md**: Complete rewrite to reflect:
  - Cleaned-up project structure
  - Accurate installation instructions
  - Multi-LLM provider documentation (OpenAI, Anthropic, Google, Ollama)
  - Build folder approach
  - Current feature set and configuration
  - Proper troubleshooting guide

**🔧 .gitignore Enhancements**
- **Comprehensive Python Ignores**: Added 50+ Python-specific entries
  - Virtual environments (.venv, venv/, ENV/)
  - Python cache (__pycache__/, *.pyc, *.pyo)
  - Test coverage (.pytest_cache/, .coverage)
  - Package metadata (*.egg-info/, dist/)
  - IDE files (.idea/, .vscode/)
- **Backend Protection**: 
  - Ignore backend/outputs/ (generated files)
  - Ignore backend/.env (API keys)
  - Ignore config/settings.json (user configuration)

---

## Version 2.3 - First-Run Experience & Polish
*Released: October 31, 2025*

**🚀 Welcome Wizard**
- **First-Run Setup**: Interactive 3-step wizard for new users
  - Welcome screen with feature overview
  - AI provider configuration with test connection
  - Setup completion with workflow guidance
- **Test Connection**: Real-time validation of API keys before saving
- **Comprehensive Onboarding**: 6 key features highlighted including:
  - AI-powered test generation
  - Quality assessment scores
  - JIRA integration
  - AI requirement enhancement (grammar, spelling, improvements)
  - Multiple test types (Smoke, Sanity, Unit, API)
  - Export options (CSV, Excel, Zephyr)

**🎨 UI Refinements**
- **Two-Line Title**: "M+ TGen" with "AI-Powered Testing" subtitle
- **Optimized Wizard Layout**: 
  - Eliminated scrolling on intro page
  - Compact spacing and typography
  - Larger content areas for better readability
  - Inline success indicator on setup complete

**🔧 Technical Fixes**
- **API Key Handling**: Fixed test connection issues
  - Changed `load_dotenv(override=True)` to `override=False`
  - Environment variables from UI now take precedence over .env file
  - Explicit API key passing to ChatOpenAI constructor
- **Import Fixes**: Corrected Python imports (chat function vs LLMClient class)
- **Debug Logging**: Enhanced logging for troubleshooting connection issues

**📋 JIRA Integration Updates**
- Manual entry marked as "Under Development" with clean UI
- Focus on Recent Issues tab for stable functionality

**✨ Enhanced Workflow Guidance**
- 6-step workflow in Welcome Wizard finish page
- 4 pro tips for advanced features
- Emphasis on AI enhancement, quality reports, and JIRA integration

---

## Version 2.2 - JIRA Integration & UI Refinements
*Released: November 5, 2025*

**🎯 JIRA Integration**
- Fetch requirements directly from JIRA boards
- Support for both Recent Issues and Manual Entry modes
- Automatic issue formatting with metadata
- Configurable Board ID in settings
- API v3 endpoint support with Basic Authentication for Atlassian Cloud
- Improved error handling and fallback mechanisms

**🎨 Major UI Improvements**
- **Compact Requirement Input**: All action buttons integrated into textarea toolbar
  - Load File, JIRA Fetch, Example, Clear buttons in one row
  - Removed separate heading and labels for space efficiency
  - Enhance AI and Preview/Edit controls always visible
- **Smart Test Configuration**: Category selection disabled until requirement is entered
  - Visual feedback with reduced opacity for disabled state
  - Auto-reset on text clear (button or manual deletion)
  - Helpful tooltips guide user workflow
- **Removed Activity Log**: Cleaner interface with more focus on core functionality
- **Removed Selection Summary**: Streamlined test configuration section
- **Fixed Page Scroll**: No more unwanted scrolling when clicking buttons

**🔧 Technical Updates**
- Dynamic textarea sizing with proper overflow handling
- Configuration persistence for JIRA Board ID
- Enhanced state management for requirement text changes
- Version number corrected to 2.2.0 in app info

---

## Version 2.1 - UX Enhancement Update
*Released: October 30, 2025*

**✨ Major UI/UX Improvements**
- **Smart Enhancement Modes**: "Enhance with AI" now offers two options:
  - **Improvise**: Full AI-powered requirement enhancement with context enrichment
  - **Fix Spelling & Grammar**: Language-only corrections without content changes
- **Rich Text Editor**: Markdown support with bold/italic formatting in preview mode
- **Card-Based Configuration**: Intuitive card layout for test category and test type selection with tooltips
- **Progressive Disclosure**: Test types only appear after selecting a category
- **Full-Screen Layout**: Dynamic, responsive design that expands with window size
- **Improved Table Readability**: 
  - Word wrap enabled for all columns (no more truncated text)
  - Steps displayed as numbered list (1., 2., 3.) instead of paragraph format
  - Auto-adjusting row heights based on content
- **Consistent Terminology**: "API" capitalization standardized across entire app

**🎨 Interface Enhancements**
- Tooltip-based help system (replaced alert boxes)
- Enhanced with AI button moved inside text area for better layout
- Maximized window on startup for optimal viewing
- Selection summary showing current configuration
- Better visual hierarchy and spacing

**🔧 Technical Improvements**
- Fixed grammar-only enhancement not working correctly
- Improved IPC communication between frontend and backend
- Better parameter passing for enhancement types
- Optimized Python prompt system for more accurate results

---

## Version 2.0 - Standalone Edition
*Released: October 29, 2025*

**📦 What's New**
- **Portable App**: Copy and run anywhere - no setup required
- **Self-contained**: All Python dependencies bundled locally
- **Easy Launch**: Single script startup (`./start-standalone.sh`)

**🔧 Improvements**
- Faster startup time (3-5 seconds)
- No external dependencies needed
- Works offline (except AI API calls)

---

## Version 1.8 - Configuration Update
*Released: October 28, 2025*

- Updated config page to match .env file
- Removed unused settings
- Cleaner interface

---

## Version 1.7 - JIRA Only
*Released: October 28, 2025*

- Removed TestRail integration
- JIRA-only workflow
- Simplified codebase

---

## Version 1.6 - Zephyr Export
*Released: October 27, 2025*

- Added Zephyr CSV export format
- Atlassian integration support
- BDD script generation

---

## Version 1.5 - UI Fixes
*Released: October 27, 2025*

- Fixed duplicate columns bug
- Improved table display
- Better responsive design

---

## Version 1.4 - M+ Branding
*Released: October 27, 2025*

- Added M+ logo to header
- Professional appearance
- Brand consistency

---

## Version 1.3 - AI Enhancement
*Released: October 26, 2025*

- "Enhance Requirement" button
- AI-powered requirement improvement
- 12x average improvement ratio
- Context-aware processing

---

## Version 1.2 - Desktop App
*Released: October 25, 2025*

- Electron + React interface
- Material-UI components
- Python backend integration
- Multi-format export (CSV, Excel)
- Quality assessment scoring

---

## Version 1.1 - AI Engine
*Released: October 24, 2025*

- GPT-4o-mini test generation
- LangGraph workflows
- JIRA integration
- Log analysis capabilities
- Quality scoring (7.8-8.2/10)

---

## Version 1.0 - Pilot
*Released: October 23, 2025*

- Basic test case generation
- Command-line interface
- OpenAI integration
- CSV output

---

## Summary

**Current Version:** 2.3.0 - First-Run Experience & Polish  
**Key Features:** Welcome Wizard with test connection, rocket branding, optimized onboarding, JIRA integration, dual AI enhancement modes, quality scoring  
**Platform:** Cross-platform desktop app (Windows, macOS, Linux)  
**Requirements:** Node.js (bundled Python included)

*© 2025 M+ TGen TestCase Generator*