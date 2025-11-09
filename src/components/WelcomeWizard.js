import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Paper,
  Divider,
  CircularProgress,
  FormHelperText,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon,
  Rocket as RocketIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const steps = ['Welcome', 'LLM Configuration', 'Finish'];

const WelcomeWizard = ({ open, onClose, onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [config, setConfig] = useState({
    provider: 'openai',
    model: 'gpt-4o-mini',
    openaiApiKey: '',
    anthropicApiKey: '',
    googleApiKey: '',
    ollamaHost: 'http://localhost:11434',
  });
  const [errors, setErrors] = useState({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [ollamaModels, setOllamaModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState(null);

  // Fetch Ollama models when provider is ollama or host changes
  useEffect(() => {
    if (config.provider === 'ollama') {
      fetchOllamaModels();
    } else {
      // For non-ollama providers, set default model if not already set
      const defaultModels = {
        openai: 'gpt-4o-mini',
        anthropic: 'claude-3-sonnet',
        google: 'gemini-1.5-pro',
      };
      
      if (!config.model || config.model === '' || config.model === 'mistral:latest') {
        setConfig(prev => ({
          ...prev,
          model: defaultModels[prev.provider]
        }));
      }
    }
  }, [config.provider, config.ollamaHost]);

  // Debug: log model changes
  useEffect(() => {
    console.log('📝 Current model state:', config.model);
    console.log('📝 Current provider:', config.provider);
    console.log('📝 Ollama models:', ollamaModels.map(m => m.name));
  }, [config.model]);

  const fetchOllamaModels = async () => {
    console.log('🔍 Fetching Ollama models...');
    setLoadingModels(true);
    setModelsError(null);
    
    try {
      const result = await window.electronAPI.getOllamaModels(config.ollamaHost);
      console.log('📦 Ollama models result:', result);
      
      if (result.success && result.models && result.models.length > 0) {
        console.log('✅ Models found:', result.models.map(m => m.name));
        setOllamaModels(result.models);
        
        // If current model is not in the list or is empty, set to first available model
        const modelNames = result.models.map(m => m.name);
        console.log('🔍 Current model:', config.model, '| Available:', modelNames);
        
        if (!config.model || !modelNames.includes(config.model)) {
          const newModel = result.models[0].name;
          console.log('🔄 Setting model to:', newModel);
          setConfig(prev => ({
            ...prev,
            model: newModel
          }));
        }
      } else {
        console.log('⚠️ No models found');
        setOllamaModels([]);
        setModelsError(result.error || 'No models found. Run "ollama pull <model-name>" to download a model.');
        // Set a default fallback model
        setConfig(prev => ({
          ...prev,
          model: 'mistral:latest'
        }));
      }
    } catch (error) {
      console.error('❌ Error fetching models:', error);
      setOllamaModels([]);
      setModelsError(`Failed to fetch models: ${error.message}`);
      // Set a default fallback model
      setConfig(prev => ({
        ...prev,
        model: 'mistral:latest'
      }));
    } finally {
      setLoadingModels(false);
      console.log('✅ Fetch complete');
    }
  };

  const handleNext = () => {
    if (activeStep === 1) {
      // Validate before moving to finish
      const newErrors = validateConfig();
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setErrors({});
    setTestResult(null);
  };

  const validateConfig = () => {
    const newErrors = {};
    
    if (config.provider === 'openai' && !config.openaiApiKey) {
      newErrors.openaiApiKey = 'OpenAI API key is required';
    }
    if (config.provider === 'anthropic' && !config.anthropicApiKey) {
      newErrors.anthropicApiKey = 'Anthropic API key is required';
    }
    if (config.provider === 'google' && !config.googleApiKey) {
      newErrors.googleApiKey = 'Google API key is required';
    }
    if (config.provider === 'ollama' && !config.ollamaHost) {
      newErrors.ollamaHost = 'Ollama host is required';
    }
    
    return newErrors;
  };

  const handleTestConnection = async () => {
    const newErrors = validateConfig();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const testConfig = {
        provider: config.provider,
        model: config.model,
        apiKey: config.provider === 'openai' ? config.openaiApiKey :
                config.provider === 'anthropic' ? config.anthropicApiKey :
                config.provider === 'google' ? config.googleApiKey : '',
        host: config.ollamaHost
      };

      const result = await window.electronAPI.testLLMConnection(testConfig);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: `Test failed: ${error.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleFinish = async () => {
    try {
      const result = await window.electronAPI.saveConfiguration(config);
      if (result.success) {
        onComplete();
      } else {
        alert(`Failed to save configuration: ${result.error}`);
      }
    } catch (error) {
      alert(`Error saving configuration: ${error.message}`);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <RocketIcon sx={{ fontSize: 60, color: 'primary.main', mb: 1.5 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 0.5 }}>
              Welcome to M+ TGen!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              AI-Powered Test Case Generator
            </Typography>
            
            <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5', textAlign: 'left', maxWidth: 700, mx: 'auto' }}>
              <Typography variant="body2" sx={{ mb: 1.5, fontSize: '0.9rem' }}>
                🎯 <strong>What is M+ TGen?</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.85rem' }}>
                An intelligent test case generator that leverages AI to automatically create comprehensive test cases from your requirements.
              </Typography>
              
              <Divider sx={{ my: 1.5 }} />
              
              <Typography variant="body2" sx={{ mb: 1, fontSize: '0.9rem' }}>
                ✨ <strong>Key Features:</strong>
              </Typography>
              <Box sx={{ pl: 1.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.82rem' }}>
                  <strong>🤖 AI Generation:</strong> Create test cases from plain text
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.82rem' }}>
                  <strong>📊 Quality Scores:</strong> Real-time quality assessment
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.82rem' }}>
                  <strong>🎯 Multiple Types:</strong> Smoke, Sanity, Unit, and API testing
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.82rem' }}>
                  <strong>🔗 JIRA Integration:</strong> Fetch and sync with JIRA
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.82rem' }}>
                  <strong>📝 Manual JIRA Entry:</strong> Fetch individual issues (In Development)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.82rem' }}>
                  <strong>✍️ AI Enhancement:</strong> Fix grammar, spelling, and improve requirements
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.82rem' }}>
                  <strong>📤 Export Options:</strong> CSV, Excel, and Zephyr formats
                </Typography>
              </Box>
              
              <Divider sx={{ my: 1.5 }} />
              
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                💡 Let's configure your AI provider to get started!
              </Typography>
            </Paper>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <SettingsIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h6">Configure AI Provider</Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose your preferred LLM provider and enter your API credentials
                </Typography>
              </Box>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Your API keys are stored securely on your local machine and never sent anywhere except to your chosen provider.
            </Alert>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>AI Provider</InputLabel>
              <Select
                value={config.provider}
                label="AI Provider"
                onChange={(e) => {
                  const newProvider = e.target.value;
                  const defaultModels = {
                    openai: 'gpt-4o-mini',
                    anthropic: 'claude-3-sonnet',
                    google: 'gemini-1.5-pro',
                    ollama: 'mistral:latest'
                  };
                  setConfig({ 
                    ...config, 
                    provider: newProvider,
                    model: defaultModels[newProvider]
                  });
                  setErrors({});
                  setTestResult(null);
                }}
              >
                <MenuItem value="openai">OpenAI (GPT-4, GPT-3.5)</MenuItem>
                <MenuItem value="anthropic">Anthropic (Claude)</MenuItem>
                <MenuItem value="google">Google (Gemini)</MenuItem>
                <MenuItem value="ollama">Ollama (Local)</MenuItem>
              </Select>
              <FormHelperText>
                {config.provider === 'ollama' 
                  ? 'Run AI models locally on your machine' 
                  : 'API-based service - requires an API key'}
              </FormHelperText>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Model</InputLabel>
              <Select
                value={config.model || ''}
                label="Model"
                onChange={(e) => {
                  console.log('Model selected:', e.target.value);
                  setConfig({ ...config, model: e.target.value });
                }}
                disabled={config.provider === 'ollama' && loadingModels}
              >
                {config.provider === 'openai' && (
                  <MenuItem value="gpt-4o-mini">GPT-4o Mini (Fast and cost-effective)</MenuItem>
                )}
                {config.provider === 'anthropic' && (
                  <MenuItem value="claude-3-sonnet">Claude 3 Sonnet (Balanced performance)</MenuItem>
                )}
                {config.provider === 'google' && (
                  <MenuItem value="gemini-1.5-pro">Gemini 1.5 Pro (Most capable)</MenuItem>
                )}
                {config.provider === 'ollama' && (
                  <>
                    {loadingModels ? (
                      <MenuItem value={config.model || 'loading'} disabled>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={16} />
                          <span>Loading models...</span>
                        </Box>
                      </MenuItem>
                    ) : ollamaModels.length > 0 ? (
                      ollamaModels.map((model) => (
                        <MenuItem key={model.name} value={model.name}>
                          {model.name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="mistral:latest">
                        mistral:latest (Default - needs to be pulled)
                      </MenuItem>
                    )}
                  </>
                )}
              </Select>
              <FormHelperText>
                {config.provider === 'ollama' && modelsError && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    {modelsError}
                  </Alert>
                )}
                {config.provider === 'ollama' && !loadingModels && ollamaModels.length === 0 && !modelsError && (
                  <Typography variant="caption" color="text.secondary">
                    No models found. Run "ollama pull mistral" to download a model.
                  </Typography>
                )}
              </FormHelperText>
            </FormControl>

            {config.provider === 'openai' && (
              <TextField
                fullWidth
                label="OpenAI API Key"
                type="password"
                value={config.openaiApiKey}
                onChange={(e) => {
                  setConfig({ ...config, openaiApiKey: e.target.value });
                  setErrors({ ...errors, openaiApiKey: null });
                  setTestResult(null);
                }}
                error={!!errors.openaiApiKey}
                helperText={errors.openaiApiKey || 'Get your API key from https://platform.openai.com/api-keys'}
                sx={{ mb: 2 }}
              />
            )}

            {config.provider === 'anthropic' && (
              <TextField
                fullWidth
                label="Anthropic API Key"
                type="password"
                value={config.anthropicApiKey}
                onChange={(e) => {
                  setConfig({ ...config, anthropicApiKey: e.target.value });
                  setErrors({ ...errors, anthropicApiKey: null });
                  setTestResult(null);
                }}
                error={!!errors.anthropicApiKey}
                helperText={errors.anthropicApiKey || 'Get your API key from https://console.anthropic.com/'}
                sx={{ mb: 2 }}
              />
            )}

            {config.provider === 'google' && (
              <TextField
                fullWidth
                label="Google API Key"
                type="password"
                value={config.googleApiKey}
                onChange={(e) => {
                  setConfig({ ...config, googleApiKey: e.target.value });
                  setErrors({ ...errors, googleApiKey: null });
                  setTestResult(null);
                }}
                error={!!errors.googleApiKey}
                helperText={errors.googleApiKey || 'Get your API key from https://makersuite.google.com/app/apikey'}
                sx={{ mb: 2 }}
              />
            )}

            {config.provider === 'ollama' && (
              <TextField
                fullWidth
                label="Ollama Host"
                value={config.ollamaHost}
                onChange={(e) => {
                  setConfig({ ...config, ollamaHost: e.target.value });
                  setErrors({ ...errors, ollamaHost: null });
                  setTestResult(null);
                }}
                error={!!errors.ollamaHost}
                helperText={errors.ollamaHost || 'Default: http://localhost:11434'}
                sx={{ mb: 2 }}
              />
            )}

            {config.provider === 'ollama' && (
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="outlined"
                  onClick={fetchOllamaModels}
                  disabled={loadingModels}
                  startIcon={loadingModels ? <CircularProgress size={20} /> : <RefreshIcon />}
                  fullWidth
                >
                  {loadingModels ? 'Fetching Models...' : 'Refresh Models'}
                </Button>
              </Box>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="outlined"
                onClick={handleTestConnection}
                disabled={testing}
                startIcon={testing ? <CircularProgress size={20} /> : null}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>

              {testResult && (
                <Alert 
                  severity={testResult.success ? 'success' : 'error'} 
                  sx={{ flex: 1 }}
                  icon={testResult.success ? <CheckCircleIcon /> : null}
                >
                  {testResult.success ? '✓ Connection successful!' : (testResult.message || testResult.error || 'Connection test failed')}
                </Alert>
              )}
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mr: 1.5 }}>
                Setup Complete!
              </Typography>
              <CheckCircleIcon sx={{ fontSize: 32, color: 'success.main' }} />
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              You're all set to start generating test cases with AI
            </Typography>

            <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f5f5f5', textAlign: 'left', maxWidth: 800, mx: 'auto' }}>
              <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                🎉 What's Next?
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" paragraph>
                  1. <strong>Enter Requirements:</strong> Type or load requirements from a file
                </Typography>
                <Typography variant="body2" paragraph>
                  2. <strong>Enhance with AI (Optional):</strong> Let AI fix grammar, spelling, and improve requirement clarity
                </Typography>
                <Typography variant="body2" paragraph>
                  3. <strong>Select Test Type:</strong> Choose category (Functional) and type (Smoke, Sanity, Unit, API)
                </Typography>
                <Typography variant="body2" paragraph>
                  4. <strong>Generate Test Cases:</strong> Click generate and let AI create comprehensive test cases
                </Typography>
                <Typography variant="body2" paragraph>
                  5. <strong>Review Quality Report:</strong> Check quality scores and insights for each test case
                </Typography>
                <Typography variant="body2" paragraph>
                  6. <strong>Export & Integrate:</strong> Download as CSV/Excel or export to JIRA via Zephyr format
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                💡 <strong>Pro Tips:</strong>
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  • Use <strong>JIRA Integration</strong> to fetch requirements directly from your projects
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  • <strong>Manual JIRA Entry</strong> feature coming soon to fetch individual issues
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  • Try <strong>Enhance Requirements</strong> to improve clarity and fix errors before generation
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  • Check the <strong>Quality Assessment</strong> to improve low-scoring test cases
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Access <strong>Settings</strong> anytime from the top-right corner icon
                </Typography>
              </Box>
            </Paper>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Dialog 
      open={open} 
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Getting Started</Typography>
          <Stepper activeStep={activeStep} sx={{ flex: 1, ml: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3, overflow: 'hidden' }}>
        {getStepContent(activeStep)}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        <Box sx={{ flex: 1 }} />
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleFinish}
            size="large"
          >
            Get Started
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default WelcomeWizard;
