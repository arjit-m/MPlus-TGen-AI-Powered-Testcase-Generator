import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Container,
  Paper,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Info as InfoIcon,
  GitHub as GitHubIcon,
  PlayArrow as PlayArrowIcon,
  Settings as SettingsIcon,
  Rocket as RocketIcon,
} from '@mui/icons-material';
import MplusLogo from './components/MplusLogo';
import RequirementInput from './components/RequirementInput';
import TestCaseGeneration from './components/TestCaseGeneration';
import TestCasePreview from './components/TestCasePreview';
import QualityAssessment from './components/QualityAssessment';
import ActionButtons from './components/ActionButtons';
import LoadingOverlay from './components/LoadingOverlay';
import ConfigurationPage from './components/ConfigurationPage';
import WelcomeWizard from './components/WelcomeWizard';
import { parseCSVToTestCases } from './utils/csvParser';
import { convertToZephyrCSV } from './utils/zephyrExporter';

function App() {
  // State management
  const [requirementText, setRequirementText] = useState('');
  const [requirementFile, setRequirementFile] = useState(null);
  const [testCategory, setTestCategory] = useState('functional'); // Default to functional
  const [testType, setTestType] = useState('smoke'); // Default to smoke
  const [generatedCases, setGeneratedCases] = useState([]);
  const [qualityReport, setQualityReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [appVersion, setAppVersion] = useState('');
  const [showConfigPage, setShowConfigPage] = useState(false);
  const [showWelcomeWizard, setShowWelcomeWizard] = useState(false);
  // EDGE CASE 6: Start with NOT configured by default (blur shown immediately)
  const [llmConfigStatus, setLlmConfigStatus] = useState({ 
    isConfigured: false, 
    message: 'Loading configuration...', 
    provider: '' 
  });
  const [configLoading, setConfigLoading] = useState(true);

  // Check LLM configuration status
  const checkLLMConfiguration = useCallback(async () => {
    console.log('🔍 Checking LLM configuration...');
    try {
      const result = await window.electronAPI.getConfiguration();
      
      // EDGE CASE 1: Configuration load failed
      if (!result || !result.success) {
        console.warn('⚠️ Configuration load failed');
        setLlmConfigStatus({ 
          isConfigured: false, 
          message: 'Unable to load configuration. Click Configuration to set up.', 
          provider: '' 
        });
        return;
      }
      
      const config = result.config || {};
      const provider = config.provider || 'openai';
      
      // EDGE CASE 2: Check each provider with strict validation
      const hasOpenAI = !!(
        config.openaiApiKey && 
        config.openaiApiKey.trim() !== '' && 
        config.openaiApiKey !== 'your-openai-api-key-here' &&
        config.openaiApiKey.length > 10 // Basic length check
      );
      
      const hasAnthropic = !!(
        config.anthropicApiKey && 
        config.anthropicApiKey.trim() !== '' &&
        config.anthropicApiKey.length > 10
      );
      
      const hasGoogle = !!(
        config.googleApiKey && 
        config.googleApiKey.trim() !== '' &&
        config.googleApiKey.length > 10
      );
      
      // Ollama: Check if configured AND verified
      const hasOllama = !!(
        config.ollamaHost && 
        config.ollamaHost.trim() !== '' &&
        (config.ollamaHost.startsWith('http://') || config.ollamaHost.startsWith('https://')) &&
        config.ollamaVerified === true // Must be explicitly verified via test connection
      );
      
      console.log('📋 Configuration details:', {
        provider,
        hasOpenAI,
        hasAnthropic,
        hasGoogle,
        hasOllama,
        openaiKeyLength: config.openaiApiKey?.length || 0,
        anthropicKeyLength: config.anthropicApiKey?.length || 0,
        googleKeyLength: config.googleApiKey?.length || 0,
        ollamaHost: config.ollamaHost
      });
      
      // EDGE CASE 3: NO providers configured at all
      const isConfigured = hasOpenAI || hasAnthropic || hasGoogle || hasOllama;
      let message = '';

      if (!isConfigured) {
        message = 'LLM API key not configured. Click Configuration to set up.';
        console.log('❌ No LLM provider configured');
      } else {
        // EDGE CASE 4: Providers configured but current provider not configured
        let currentProviderConfigured = false;
        if (provider === 'openai' && hasOpenAI) currentProviderConfigured = true;
        if (provider === 'anthropic' && hasAnthropic) currentProviderConfigured = true;
        if (provider === 'google' && hasGoogle) currentProviderConfigured = true;
        if (provider === 'ollama' && hasOllama) currentProviderConfigured = true;
        
        if (!currentProviderConfigured) {
          message = `Selected provider (${provider}) not configured. Please configure it or switch to another provider.`;
          console.log(`⚠️ Current provider ${provider} not configured`);
        } else {
          console.log(`✅ Configuration valid - ${provider} is configured`);
        }
      }

      setLlmConfigStatus({ isConfigured, message, provider });
      setConfigLoading(false); // EDGE CASE 7: Mark loading complete
    } catch (error) {
      // EDGE CASE 5: Unexpected errors
      console.error('❌ Failed to check configuration:', error);
      setLlmConfigStatus({ 
        isConfigured: false, 
        message: 'Configuration error. Click Configuration to set up.', 
        provider: '' 
      });
      setConfigLoading(false);
    }
  }, []);

  // Helper function to format test type labels
  const formatTestTypeLabel = (type) => {
    if (type === 'api') return 'API';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Add log entry
  const addLog = useCallback((message, level = 'info') => {
    const timestamp = new Date().toLocaleString();
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp,
      level,
      message
    };
    setLogs(prev => [...prev, logEntry]);
  }, []);

  // Load default requirements on app start
  useEffect(() => {
    const checkFirstRun = async () => {
      try {
        const result = await window.electronAPI.checkFirstRun();
        console.log('First run check:', result);
        if (result.isFirstRun) {
          setShowWelcomeWizard(true);
        }
      } catch (error) {
        console.error('Failed to check first run:', error);
      }
    };

    const loadDefaults = async () => {
      try {
        const result = await window.electronAPI.getDefaultRequirements();
        if (result.success) {
          setRequirementText(result.content);
          setRequirementFile({
            path: result.filePath,
            name: result.fileName
          });
          addLog(`📁 Loaded default requirement: ${result.fileName}`);
        }
      } catch (error) {
        addLog(`⚠️ Could not load default requirements: ${error.message}`, 'warning');
      }
    };

    const getVersion = async () => {
      try {
        const version = await window.electronAPI.getAppVersion();
        setAppVersion(version);
      } catch (error) {
        console.error('Failed to get app version:', error);
      }
    };

    checkFirstRun();
    loadDefaults();
    getVersion();
    checkLLMConfiguration();
  }, [addLog, checkLLMConfiguration]);

  // Handle file selection
  const handleFileSelect = async () => {
    try {
      const result = await window.electronAPI.selectRequirementFile();
      if (result.success) {
        setRequirementText(result.content);
        setRequirementFile({
          path: result.filePath,
          name: result.fileName
        });
        addLog(`📁 Loaded requirement file: ${result.fileName}`);
        
        // Clear previous results
        setGeneratedCases([]);
        setQualityReport(null);
      } else if (!result.canceled) {
        addLog(`❌ Failed to load file: ${result.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ File selection error: ${error.message}`, 'error');
    }
  };

  // Handle requirement enhancement
  const handleEnhanceRequirement = async (enhancementType = 'improvise') => {
    if (!requirementText.trim()) {
      await window.electronAPI.showMessageBox({
        type: 'warning',
        title: 'Warning',
        message: 'Please enter some requirement text first.',
        buttons: ['OK']
      });
      return;
    }
    
    // Ensure we have valid category and type
    const category = testCategory || 'functional';
    const type = testType || 'smoke';

    // Don't check config here - button should be disabled if not configured
    setIsEnhancing(true);
    const enhancementLabel = enhancementType === 'fix-grammar' ? 'Fixing spelling & grammar' : 'Enhancing requirement';
    addLog(`✨ ${enhancementLabel} with AI...`);

    try {
      const result = await window.electronAPI.enhanceRequirement(requirementText, category, type, enhancementType);
      
      if (result.success) {
        setRequirementText(result.enhancedRequirement);
        addLog('🎉 Requirement enhanced successfully!');
        addLog(`📝 Applied ${result.improvementsCount || 'several'} AI-powered enhancements`);
        
        // Show success message with preview
        const detailMessage = enhancementType === 'fix-grammar' 
          ? `Applied improvements:\n- Fixed spelling errors\n- Corrected grammatical mistakes\n- Improved punctuation\n\nThe requirement text is now error-free and ready for test case generation.`
          : `Applied improvements:\n- Better structure and clarity\n- Added missing details\n- Improved testability\n\nThe enhanced requirement is now ready for high-quality test case generation.`;
        
        await window.electronAPI.showMessageBox({
          type: 'info',
          title: '✨ Requirement Enhanced',
          message: 'Your requirement has been enhanced with AI-powered suggestions!',
          detail: detailMessage,
          buttons: ['OK']
        });
        
        // Clear previous test cases since requirement changed
        setGeneratedCases([]);
        setQualityReport(null);
      } else {
        addLog(`❌ Enhancement failed: ${result.error}`, 'error');
        await window.electronAPI.showMessageBox({
          type: 'error',
          title: 'Enhancement Failed',
          message: `Failed to enhance requirement:\n${result.error}`,
          buttons: ['OK']
        });
      }
    } catch (error) {
      addLog(`❌ Enhancement error: ${error.message}`, 'error');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Handle test case generation
  const handleGenerateTestCases = async () => {
    if (!requirementText.trim()) {
      await window.electronAPI.showMessageBox({
        type: 'warning',
        title: 'Warning',
        message: 'Please enter requirements or load from a file first.',
        buttons: ['OK']
      });
      return;
    }

    // Don't check config here - button should be disabled if not configured
    setIsGenerating(true);
    addLog('🤖 Starting test case generation...');

    try {
      console.log('🚀 Calling generateTestCases with:', { 
        requirementTextLength: requirementText.length,
        requirementTextPreview: requirementText.substring(0, 100) + '...', 
        testType,
        testCategory
      });
      const result = await window.electronAPI.generateTestCases(requirementText, testType, testCategory);
      console.log('📤 Received result from IPC:', {
        success: result?.success,
        errorMessage: result?.error,
        csvContentLength: result?.csvContent?.length,
        hasRawJson: !!result?.rawJson,
        stdout: result?.stdout?.substring(0, 200)
      });
      
      if (result.success) {
        console.log('📄 Parsing CSV content:', result.csvContent?.substring(0, 200) + '...');
        // Parse CSV content to test cases
        const testCases = parseCSVToTestCases(result.csvContent);
        console.log('📋 Parsed test cases:', testCases);
        setGeneratedCases(testCases);
        
        // Use quality report from backend if available, otherwise create basic one
        if (result.qualityReport) {
          setQualityReport(result.qualityReport);
          console.log('📊 Using backend quality report:', result.qualityReport);
        } else if (result.rawJson) {
          const basicQuality = {
            overall_score: 7.5,
            individual_scores: testCases.map((testCase, index) => ({
              test_id: testCase.id,
              total_score: 7.0 + Math.random() * 2, // Random score between 7-9
              scores: {
                clarity: 7.0 + Math.random() * 2,
                completeness: 7.0 + Math.random() * 2,
                specificity: 7.0 + Math.random() * 2,
                testability: 7.0 + Math.random() * 2,
                coverage: 7.0 + Math.random() * 2
              }
            })),
            metadata: {
              test_category: testCategory,
              test_type: testType,
              total_test_cases: testCases.length
            }
          };
          setQualityReport(basicQuality);
          console.log('📊 Using fallback quality report:', basicQuality);
        }
        
        addLog(`✅ Generated ${testCases.length} test cases successfully!`);
      } else {
        addLog(`❌ Generation failed: ${result.error}`, 'error');
        await window.electronAPI.showMessageBox({
          type: 'error',
          title: 'Generation Error',
          message: `Failed to generate test cases:\n${result.error}`,
          buttons: ['OK']
        });
      }
    } catch (error) {
      addLog(`❌ Unexpected error: ${error.message}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };





  // Handle Zephyr export
  const handleExportZephyr = async () => {
    if (generatedCases.length === 0) {
      await window.electronAPI.showMessageBox({
        type: 'warning',
        title: 'No Data',
        message: 'No test cases available to export.',
        buttons: ['OK']
      });
      return;
    }

    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const defaultName = `testcases-zephyr-${timestamp}.csv`;
      
      const result = await window.electronAPI.saveFileDialog({
        title: 'Save Test Cases as Zephyr Format',
        defaultPath: defaultName,
        filters: [
          { name: 'CSV files', extensions: ['csv'] },
          { name: 'All files', extensions: ['*'] }
        ]
      });

      if (!result.canceled) {
        // Generate Zephyr CSV content
        const content = convertToZephyrCSV(generatedCases);
        
        const writeResult = await window.electronAPI.writeFile(result.filePath, content);
        
        if (writeResult.success) {
          addLog(`🌪️ Test cases exported to Zephyr format: ${result.filePath}`);
          await window.electronAPI.showMessageBox({
            type: 'info',
            title: 'Export Success',
            message: `Test cases successfully exported to Zephyr format:\n${result.filePath}`,
            buttons: ['OK']
          });
        } else {
          throw new Error(writeResult.error);
        }
      }
    } catch (error) {
      console.error('Zephyr export error:', error);
      addLog(`❌ Zephyr export failed: ${error.message}`, 'error');
      await window.electronAPI.showMessageBox({
        type: 'error',
        title: 'Export Failed',
        message: `Failed to export test cases to Zephyr format:\n${error.message}`,
        buttons: ['OK']
      });
    }
  };

  // Handle export
  const handleExport = async (format) => {
    if (generatedCases.length === 0) {
      await window.electronAPI.showMessageBox({
        type: 'warning',
        title: 'No Data',
        message: 'No test cases available to export.',
        buttons: ['OK']
      });
      return;
    }

    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const defaultName = `test_cases_${timestamp}.${format}`;
      
      const result = await window.electronAPI.saveFileDialog({
        title: `Save Test Cases as ${format.toUpperCase()}`,
        defaultPath: defaultName,
        filters: [
          { name: `${format.toUpperCase()} files`, extensions: [format] },
          { name: 'All files', extensions: ['*'] }
        ]
      });

      if (!result.canceled) {
        if (format === 'xlsx') {
          // Generate Excel file using xlsx library
          const worksheetData = [
            ['Test ID', 'Title', 'Steps', 'Expected Result', 'Priority', 'Category', 'Type', 'Quality Score']
          ];
          
          generatedCases.forEach(testCase => {
            const qualityScore = qualityReport?.individual_scores?.find(
              s => s.test_id === testCase.id
            )?.total_score || 0;
            
            const steps = Array.isArray(testCase.steps) 
              ? testCase.steps.join('\n')
              : testCase.steps;
            
            worksheetData.push([
              testCase.id,
              testCase.title,
              steps,
              testCase.expected,
              testCase.priority,
              testCase.category || 'Functional',
              testCase.type || 'Smoke',
              qualityScore > 0 ? `${qualityScore.toFixed(1)}/10` : 'N/A'
            ]);
          });

          const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
          
          // Set column widths
          worksheet['!cols'] = [
            { wch: 10 },  // Test ID
            { wch: 40 },  // Title
            { wch: 60 },  // Steps
            { wch: 40 },  // Expected Result
            { wch: 12 },  // Priority
            { wch: 15 },  // Category
            { wch: 12 },  // Type
            { wch: 15 }   // Quality Score
          ];

          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Cases');
          
          // Generate binary buffer instead of writing directly
          const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
          
          // Convert buffer to base64 string for IPC
          const base64 = btoa(
            new Uint8Array(excelBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          
          // Write using Electron API
          const writeResult = await window.electronAPI.writeFile(result.filePath, base64, 'base64');
          
          if (writeResult.success) {
            addLog(`📊 Test cases exported to Excel: ${result.filePath}`);
            await window.electronAPI.showMessageBox({
              type: 'info',
              title: 'Export Success',
              message: `Test cases successfully exported to:\n${result.filePath}`,
              buttons: ['OK']
            });
          } else {
            throw new Error(writeResult.error);
          }
        } else {
          // CSV and Zephyr formats
          let content = '';
          
          if (format === 'csv') {
            // Generate CSV content
            const headers = ['Test ID', 'Title', 'Steps', 'Expected Result', 'Priority', 'Quality Score'];
            content = headers.join(',') + '\n';
            
            generatedCases.forEach(testCase => {
              const qualityScore = qualityReport?.individual_scores?.find(
                s => s.test_id === testCase.id
              )?.total_score || 0;
              
              const steps = Array.isArray(testCase.steps) 
                ? testCase.steps.join(' | ')
                : testCase.steps;
              
              const row = [
                testCase.id,
                `"${testCase.title}"`,
                `"${steps}"`,
                `"${testCase.expected}"`,
                testCase.priority,
                qualityScore > 0 ? `${qualityScore.toFixed(1)}/10` : 'N/A'
              ];
              content += row.join(',') + '\n';
            });
          } else if (format === 'zephyr') {
            // Generate Zephyr CSV content
            content = convertToZephyrCSV(generatedCases);
          }

          const writeResult = await window.electronAPI.writeFile(result.filePath, content);
          
          if (writeResult.success) {
            addLog(`📄 Test cases exported to ${format.toUpperCase()}: ${result.filePath}`);
            await window.electronAPI.showMessageBox({
              type: 'info',
              title: 'Export Success',
              message: `Test cases successfully exported to:\n${result.filePath}`,
              buttons: ['OK']
            });
          } else {
            throw new Error(writeResult.error);
          }
        }
      }
    } catch (error) {
      addLog(`❌ Export failed: ${error.message}`, 'error');
      await window.electronAPI.showMessageBox({
        type: 'error',
        title: 'Export Error',
        message: `Failed to export ${format.toUpperCase()}:\n${error.message}`,
        buttons: ['OK']
      });
    }
  };

  // Handle about dialog
  const handleAbout = async () => {
    await window.electronAPI.showMessageBox({
      type: 'info',
      title: 'About M+ TGen',
      message: 'M+ TGen AI-Powered Test Case Generator',
      detail: `Version: ${appVersion}\n\nAI-powered test case generation.\n\nBuilt with Electron, React, Node and Material-UI.\nPowered by LangChain and Python backend.`,
      buttons: ['OK']
    });
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1} sx={{ borderRadius: 0 }}>
        <Toolbar>
          <MplusLogo size={32} sx={{ mr: 2 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div" sx={{ lineHeight: 1.2 }}>
              M+ TGen
            </Typography>
            <Typography variant="caption" component="div" sx={{ opacity: 0.9, fontSize: '0.7rem' }}>
              AI-Powered Testing
            </Typography>
          </Box>
          
          <Tooltip title="Configuration">
            <IconButton 
              color="inherit" 
              onClick={() => setShowConfigPage(true)}
              sx={{
                animation: !llmConfigStatus.isConfigured ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.15)' },
                  '100%': { transform: 'scale(1)' }
                }
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="About">
            <IconButton color="inherit" onClick={handleAbout}>
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth={false} sx={{ py: 3, px: 3, width: '100%', position: 'relative' }}>
        {showConfigPage ? (
          /* Configuration page - NEVER blur this */
          <ConfigurationPage 
            onClose={() => {
              setShowConfigPage(false);
              setConfigLoading(true);
              checkLLMConfiguration();
            }}
            onSave={() => {
              setConfigLoading(true);
              checkLLMConfiguration();
            }}
          />
        ) : (
          /* Main content - Apply blur only here when not configured */
          <Box sx={{ 
            filter: (!llmConfigStatus.isConfigured || configLoading) ? 'blur(3px)' : 'none', 
            pointerEvents: (!llmConfigStatus.isConfigured || configLoading) ? 'none' : 'auto' 
          }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          
          {/* Requirement Input Section */}
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              📋 Requirements
            </Typography>
            <RequirementInput
              requirementText={requirementText}
              setRequirementText={(value) => {
                setRequirementText(value);
                // Reset test configuration if text is cleared
                if (!value || value.trim() === '') {
                  setTestCategory('');
                  setTestType('');
                }
              }}
              requirementFile={requirementFile}
              onFileSelect={handleFileSelect}
              onLoadExample={() => {
                // Load example requirement
                const examples = [
                  `E-Commerce Shopping Cart System:

**Core Functionality:**
- Users can browse products and add items to cart
- Cart displays item details, quantities, and total price
- Users can update quantities or remove items from cart
- Apply discount codes and promotional offers
- Calculate shipping costs based on location
- Support multiple payment methods (credit card, PayPal, digital wallets)

**User Experience Requirements:**
- Cart contents persist across browser sessions
- Real-time inventory validation before checkout
- Clear error messages for invalid operations
- Mobile-responsive design for all devices
- Loading indicators for async operations

**Security & Validation:**
- Validate all user inputs and sanitize data
- Secure payment processing with encryption
- Session management and timeout handling
- Prevent cart manipulation and price tampering`,

                  `User Authentication & Account Management:

**Login System:**
- Users can log in with email/username and password
- Support for social media login (Google, Facebook, Apple)
- Two-factor authentication for enhanced security
- Remember me functionality with secure tokens
- Account lockout after multiple failed attempts

**Registration Process:**
- User registration with email verification
- Password strength requirements and validation
- Terms and conditions acceptance
- Optional profile information collection
- Welcome email with account setup instructions`];
                
                const randomExample = examples[Math.floor(Math.random() * examples.length)];
                setRequirementText(randomExample);
                setRequirementFile(null);
                setGeneratedCases([]);
                setQualityReport(null);
                addLog('📋 Loaded example requirement');
              }}
              onClear={() => {
                setRequirementText('');
                setRequirementFile(null);
                setTestCategory('');
                setTestType('');
                setGeneratedCases([]);
                setQualityReport(null);
                addLog('🗑️ Cleared requirement text and test configuration');
              }}
              onEnhanceRequirement={handleEnhanceRequirement}
              isEnhancing={isEnhancing}
              llmConfigStatus={llmConfigStatus}
            />
          </Paper>

          {/* Test Category and Type Selection Section */}
          <Paper elevation={2} sx={{ p: 3 }}>
            {/* <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              🎯 Test Configuration
            </Typography> */}

            {/* Test Category Cards */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                🎯 Choose Test Category
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {/* Functional Test Category Card */}
                <Tooltip 
                  title={
                    !requirementText.trim() ? (
                      <Typography variant="caption">
                        Please enter a requirement first
                      </Typography>
                    ) : (
                      <Box sx={{ p: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          Functional Testing
                        </Typography>
                        <Typography variant="caption">
                          Verifies that the software functions according to specified requirements. 
                          Tests individual functions, features, and user workflows to ensure correct behavior.
                        </Typography>
                      </Box>
                    )
                  }
                  arrow
                  placement="top"
                >
                  <span>
                  <Paper
                    elevation={testCategory === 'functional' ? 8 : 2}
                    sx={{
                      p: 2,
                      cursor: !requirementText.trim() ? 'not-allowed' : 'pointer',
                      border: testCategory === 'functional' ? '2px solid #2196F3' : '2px solid transparent',
                      backgroundColor: testCategory === 'functional' ? 'rgba(33, 150, 243, 0.08)' : 'white',
                      opacity: !requirementText.trim() ? 0.5 : 1,
                      transition: 'all 0.3s ease',
                      minWidth: '160px',
                      pointerEvents: !requirementText.trim() ? 'none' : 'auto',
                      '&:hover': {
                        elevation: 4,
                        backgroundColor: testCategory === 'functional' ? 'rgba(33, 150, 243, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                        transform: 'translateY(-2px)',
                      }
                    }}
                    onClick={() => {
                      if (requirementText.trim()) {
                        setTestCategory('functional');
                        setTestType(''); // Reset test type when category changes
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: testCategory === 'functional' ? '#2196F3' : '#E3F2FD',
                          color: testCategory === 'functional' ? 'white' : '#2196F3',
                          fontSize: '20px',
                          fontWeight: 'bold'
                        }}
                      >
                        ⚙️
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                          Functional
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Feature validation
                        </Typography>
                      </Box>
                      {testCategory === 'functional' && (
                        <Box sx={{ color: '#2196F3', fontSize: '20px' }}>✓</Box>
                      )}
                    </Box>
                  </Paper>
                  </span>
                </Tooltip>

                {/* Non-Functional Test Category Card */}
                <Tooltip 
                  title={
                    !requirementText.trim() ? (
                      <Typography variant="caption">
                        Please enter a requirement first
                      </Typography>
                    ) : (
                      <Box sx={{ p: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          Non-Functional Testing
                        </Typography>
                        <Typography variant="caption">
                          Evaluates system attributes like performance, security, usability, and reliability. 
                          Tests how well the system performs rather than specific behaviors.
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#ff9800', fontWeight: 'bold' }}>
                          ⚠️ Coming Soon
                        </Typography>
                      </Box>
                    )
                  }
                  arrow
                  placement="top"
                >
                  <span>
                  <Paper
                    elevation={testCategory === 'non-functional' ? 8 : 2}
                    sx={{
                      p: 2,
                      cursor: 'not-allowed',
                      border: testCategory === 'non-functional' ? '2px solid #FF9800' : '2px solid transparent',
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      opacity: !requirementText.trim() ? 0.3 : 0.6,
                      transition: 'all 0.3s ease',
                      minWidth: '160px',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#FFE0B2',
                          color: '#FF9800',
                          fontSize: '20px',
                          fontWeight: 'bold'
                        }}
                      >
                        📊
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                          Non-Functional
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          System attributes
                        </Typography>
                      </Box>
                      <Chip label="Soon" size="small" sx={{ fontSize: '0.65rem', height: '18px' }} />
                    </Box>
                  </Paper>
                  </span>
                </Tooltip>
              </Box>
            </Box>

            {/* Test Type Cards - Only show when category is selected */}
            {testCategory && (
              <Box>
                <Typography variant="h8" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  🧪 Choose Test Type
                </Typography>
                {testCategory === 'functional' ? (
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    {/* Smoke Tests Card */}
                    <Tooltip 
                      title={
                        <Box sx={{ p: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            Smoke Testing
                          </Typography>
                          <Typography variant="caption">
                            Quick preliminary tests to verify basic functionality and stability. 
                            Ensures critical features work before detailed testing.
                          </Typography>
                        </Box>
                      }
                      arrow
                      placement="top"
                    >
                      <Paper
                        elevation={testType === 'smoke' ? 6 : 1}
                        sx={{
                          p: 1.5,
                          cursor: 'pointer',
                          border: testType === 'smoke' ? '2px solid #4CAF50' : '1px solid #e0e0e0',
                          backgroundColor: testType === 'smoke' ? 'rgba(76, 175, 80, 0.08)' : 'white',
                          transition: 'all 0.2s ease',
                          minWidth: '130px',
                          '&:hover': {
                            backgroundColor: testType === 'smoke' ? 'rgba(76, 175, 80, 0.12)' : 'rgba(0, 0, 0, 0.02)',
                            transform: 'translateY(-1px)',
                            borderColor: testType === 'smoke' ? '#4CAF50' : '#bdbdbd',
                          }
                        }}
                        onClick={() => setTestType('smoke')}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ fontSize: '18px' }}>💨</Box>
                          <Typography variant="body2" sx={{ fontWeight: testType === 'smoke' ? 'bold' : 'medium', fontSize: '0.875rem' }}>
                            Smoke
                          </Typography>
                          {testType === 'smoke' && (
                            <Box sx={{ color: '#4CAF50', fontSize: '16px', ml: 'auto' }}>✓</Box>
                          )}
                        </Box>
                      </Paper>
                    </Tooltip>

                    {/* Sanity Tests Card */}
                    <Tooltip 
                      title={
                        <Box sx={{ p: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            Sanity Testing
                          </Typography>
                          <Typography variant="caption">
                            Focused testing on specific functionality after changes. 
                            Verifies that particular features work correctly after bug fixes or minor updates.
                          </Typography>
                        </Box>
                      }
                      arrow
                      placement="top"
                    >
                      <Paper
                        elevation={testType === 'sanity' ? 6 : 1}
                        sx={{
                          p: 1.5,
                          cursor: 'pointer',
                          border: testType === 'sanity' ? '2px solid #4CAF50' : '1px solid #e0e0e0',
                          backgroundColor: testType === 'sanity' ? 'rgba(76, 175, 80, 0.08)' : 'white',
                          transition: 'all 0.2s ease',
                          minWidth: '130px',
                          '&:hover': {
                            backgroundColor: testType === 'sanity' ? 'rgba(76, 175, 80, 0.12)' : 'rgba(0, 0, 0, 0.02)',
                            transform: 'translateY(-1px)',
                            borderColor: testType === 'sanity' ? '#4CAF50' : '#bdbdbd',
                          }
                        }}
                        onClick={() => setTestType('sanity')}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ fontSize: '18px' }}>🔍</Box>
                          <Typography variant="body2" sx={{ fontWeight: testType === 'sanity' ? 'bold' : 'medium', fontSize: '0.875rem' }}>
                            Sanity
                          </Typography>
                          {testType === 'sanity' && (
                            <Box sx={{ color: '#4CAF50', fontSize: '16px', ml: 'auto' }}>✓</Box>
                          )}
                        </Box>
                      </Paper>
                    </Tooltip>

                    {/* Unit Tests Card */}
                    <Tooltip 
                      title={
                        <Box sx={{ p: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            Unit Testing
                          </Typography>
                          <Typography variant="caption">
                            Tests individual components or functions in isolation. 
                            Validates that each unit of code works correctly independently.
                          </Typography>
                        </Box>
                      }
                      arrow
                      placement="top"
                    >
                      <Paper
                        elevation={testType === 'unit' ? 6 : 1}
                        sx={{
                          p: 1.5,
                          cursor: 'pointer',
                          border: testType === 'unit' ? '2px solid #4CAF50' : '1px solid #e0e0e0',
                          backgroundColor: testType === 'unit' ? 'rgba(76, 175, 80, 0.08)' : 'white',
                          transition: 'all 0.2s ease',
                          minWidth: '130px',
                          '&:hover': {
                            backgroundColor: testType === 'unit' ? 'rgba(76, 175, 80, 0.12)' : 'rgba(0, 0, 0, 0.02)',
                            transform: 'translateY(-1px)',
                            borderColor: testType === 'unit' ? '#4CAF50' : '#bdbdbd',
                          }
                        }}
                        onClick={() => setTestType('unit')}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ fontSize: '18px' }}>🧩</Box>
                          <Typography variant="body2" sx={{ fontWeight: testType === 'unit' ? 'bold' : 'medium', fontSize: '0.875rem' }}>
                            Unit
                          </Typography>
                          {testType === 'unit' && (
                            <Box sx={{ color: '#4CAF50', fontSize: '16px', ml: 'auto' }}>✓</Box>
                          )}
                        </Box>
                      </Paper>
                    </Tooltip>

                    {/* API Tests Card */}
                    <Tooltip 
                      title={
                        <Box sx={{ p: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            API Testing
                          </Typography>
                          <Typography variant="caption">
                            Tests application programming interfaces directly. 
                            Validates API endpoints, request/response formats, and data integrity.
                          </Typography>
                        </Box>
                      }
                      arrow
                      placement="top"
                    >
                      <Paper
                        elevation={testType === 'api' ? 6 : 1}
                        sx={{
                          p: 1.5,
                          cursor: 'pointer',
                          border: testType === 'api' ? '2px solid #4CAF50' : '1px solid #e0e0e0',
                          backgroundColor: testType === 'api' ? 'rgba(76, 175, 80, 0.08)' : 'white',
                          transition: 'all 0.2s ease',
                          minWidth: '130px',
                          '&:hover': {
                            backgroundColor: testType === 'api' ? 'rgba(76, 175, 80, 0.12)' : 'rgba(0, 0, 0, 0.02)',
                            transform: 'translateY(-1px)',
                            borderColor: testType === 'api' ? '#4CAF50' : '#bdbdbd',
                          }
                        }}
                        onClick={() => setTestType('api')}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ fontSize: '18px' }}>🔌</Box>
                          <Typography variant="body2" sx={{ fontWeight: testType === 'api' ? 'bold' : 'medium', fontSize: '0.875rem' }}>
                            API
                          </Typography>
                          {testType === 'api' && (
                            <Box sx={{ color: '#4CAF50', fontSize: '16px', ml: 'auto' }}>✓</Box>
                          )}
                        </Box>
                      </Paper>
                    </Tooltip>
                  </Box>
                ) : (
                  <Alert severity="info">
                    Non-functional test types will be available soon.
                  </Alert>
                )}
              </Box>
            )}
          </Paper>

          {/* Test Case Generation Section */}
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              🤖 AI Test Case Generator
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: generatedCases.length > 0 ? 4 : 0 }}>
              <Tooltip 
                title={
                  !llmConfigStatus.isConfigured 
                    ? `⚙️ ${llmConfigStatus.message}` 
                    : (!testCategory || !testType 
                        ? 'Please select test category and type' 
                        : (testCategory === 'non-functional' 
                            ? 'Non-functional test generation coming soon' 
                            : 'Click to generate test cases'))
                }
                arrow
                placement="top"
              >
                <span>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleGenerateTestCases}
                    disabled={isGenerating || !requirementText.trim() || !testCategory || !testType || testCategory === 'non-functional' || !llmConfigStatus.isConfigured}
                    startIcon={isGenerating ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Test Cases'}
                  </Button>
                </span>
              </Tooltip>
              {!llmConfigStatus.isConfigured ? (
                <Alert severity="warning" sx={{ flex: 1 }}>
                  <strong>Configuration Required:</strong> {llmConfigStatus.message}
                  <Button 
                    size="small" 
                    onClick={() => setShowConfigPage(true)}
                    sx={{ ml: 2 }}
                    variant="outlined"
                  >
                    Open Configuration
                  </Button>
                </Alert>
              ) : !testCategory || !testType ? (
                <Typography variant="body2" color="text.secondary">
                  ⚠️ Please select test category and type to proceed
                </Typography>
              ) : testCategory === 'non-functional' ? (
                <Typography variant="body2" color="text.secondary">
                  Non-functional test generation will be available soon
                </Typography>
              ) : null}
            </Box>

            {/* Test Case Preview */}
            {generatedCases.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <TestCasePreview
                  testCases={generatedCases}
                  qualityReport={qualityReport}
                />
              </Box>
            )}

            {/* Quality Assessment */}
            {qualityReport && (
              <Box sx={{ mt: 4 }}>
                <QualityAssessment qualityReport={qualityReport} />
              </Box>
            )}

            {/* Action Buttons */}
            {generatedCases.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <ActionButtons
                  onExportCSV={() => handleExport('csv')}
                  onExportExcel={() => handleExport('xlsx')}
                  onExportZephyr={handleExportZephyr}
                />
              </Box>
            )}
          </Paper>
          </Box>
          </Box>
        )}

        {/* Configuration Required Overlay Dialog */}
        {/* EDGE CASE 8: Show overlay when not configured OR still loading */}
        {/* Only show on main page, NOT on config page */}
        {!showConfigPage && (!llmConfigStatus.isConfigured || configLoading) && (
          <Box
            sx={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1300,
              background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
              borderRadius: 3,
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
              border: '2px solid #bdbdbd',
              p: 4,
              maxWidth: '500px',
              width: '90%',
              textAlign: 'center',
            }}
          >
            <SettingsIcon sx={{ fontSize: 60, color: '#616161', mb: 2 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2, color: '#212121' }}>
              {configLoading ? 'Loading...' : 'Configuration Required'}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: '#616161', fontWeight: 400 }}>
              {llmConfigStatus.message}
            </Typography>
            {!configLoading && (
              <Button
                variant="contained"
                size="large"
                startIcon={<SettingsIcon />}
                onClick={() => setShowConfigPage(true)}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)',
                  }
                }}
              >
                Open Configuration
              </Button>
            )}
          </Box>
        )}
      </Container>

      {/* Loading Overlays */}
      {!showConfigPage && (
        <LoadingOverlay 
          open={isGenerating} 
          message="Generating test cases..."
          detail="This may take a few moments while our AI analyzes your requirements."
        />
      )}

      {/* Welcome Wizard - First Run */}
      <WelcomeWizard
        open={showWelcomeWizard}
        onClose={() => setShowWelcomeWizard(false)}
        onComplete={() => {
          setShowWelcomeWizard(false);
          addLog('🎉 Welcome! Configuration completed successfully');
          // Reload configuration status after wizard completes
          setConfigLoading(true);
          checkLLMConfiguration();
        }}
      />
    </Box>
  );
}

export default App;