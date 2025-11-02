import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Alert,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Chip,
  Stack,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

const ConfigurationPage = ({ onClose, onSave }) => {
  // State for configuration - matching .env file structure
  const [config, setConfig] = useState({
    provider: 'openai',
    model: 'gpt-4o-mini',
    openaiApiKey: '',
    anthropicApiKey: '',
    googleApiKey: '',
    ollamaHost: 'http://localhost:11434',
    jiraBase: 'http://localhost:4001',
    jiraEmail: '',
    jiraProjectKey: 'QA',
    jiraBoardId: '3968',
    jiraBearer: '',
  });

  const [showApiKeys, setShowApiKeys] = useState({
    openai: false,
    anthropic: false,
    google: false,
    jira: false,
  });

  const [editMode, setEditMode] = useState({
    openai: true,  // Start in edit mode if no key
    anthropic: true,
    google: true,
    jira: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({});
  const [connectionError, setConnectionError] = useState({});

  // Model options for each provider - based on .env file examples
  const modelOptions = {
    ollama: [
      { value: 'mistral:latest', label: 'Mistral Latest', description: 'Good general purpose model' }
    ],
    openai: [
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast and cost-effective' }
    ],
    anthropic: [
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', description: 'Latest and most capable' },
    ],
    google: [
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', description: 'Most capable Gemini model' },
    ],
  };

  // Load configuration on component mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const result = await window.electronAPI.getConfiguration();
      if (result.success) {
        const loadedConfig = result.config;
        
        // Ensure model matches the provider - fix mismatches
        const defaultModels = {
          openai: 'gpt-4o-mini',
          anthropic: 'claude-3-5-sonnet-20241022',
          google: 'gemini-1.5-pro',
          ollama: 'mistral:latest',
        };
        
        // Check if the current model is valid for the selected provider
        const validModels = modelOptions[loadedConfig.provider]?.map(m => m.value) || [];
        if (!validModels.includes(loadedConfig.model)) {
          // Model doesn't match provider, use default for this provider
          loadedConfig.model = defaultModels[loadedConfig.provider];
        }
        
        setConfig(loadedConfig);
        
        // Set edit mode based on whether keys are already configured
        setEditMode({
          openai: !loadedConfig.openaiApiKey || loadedConfig.openaiApiKey.trim() === '',
          anthropic: !loadedConfig.anthropicApiKey || loadedConfig.anthropicApiKey.trim() === '',
          google: !loadedConfig.googleApiKey || loadedConfig.googleApiKey.trim() === '',
          jira: !loadedConfig.jiraBearer || loadedConfig.jiraBearer.trim() === '',
        });
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  };

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setSaveStatus(null);
  };

  const handleProviderChange = (newProvider) => {
    const defaultModels = {
      openai: 'gpt-4o-mini',
      anthropic: 'claude-3-5-sonnet-20241022',
      google: 'gemini-1.5-pro',
      ollama: 'mistral:latest',
    };

    setConfig(prev => ({
      ...prev,
      provider: newProvider,
      model: defaultModels[newProvider]
    }));
    
    // Clear connection status when changing provider
    setConnectionStatus({});
    setConnectionError({});
    setSaveStatus(null);
  };

  const toggleApiKeyVisibility = (provider) => {
    setShowApiKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const testConnection = async (provider) => {
    setConnectionStatus(prev => ({
      ...prev,
      [provider]: 'testing'
    }));
    
    // Clear previous error for this provider
    setConnectionError(prev => ({
      ...prev,
      [provider]: null
    }));

    try {
      // Use the current provider and model from config
      const testProvider = provider || config.provider;
      const testModel = config.model;
      
      const result = await window.electronAPI.testLLMConnection({
        provider: testProvider,
        model: testModel,
        apiKey: config[`${testProvider}ApiKey`],
        host: testProvider === 'ollama' ? config.ollamaHost : undefined
      });

      setConnectionStatus(prev => ({
        ...prev,
        [provider]: result.success ? 'success' : 'error'
      }));

      if (result.success) {
        // If Ollama test succeeds, mark it as verified in config
        if (testProvider === 'ollama') {
          setConfig(prev => ({
            ...prev,
            ollamaVerified: true
          }));
        }
        
        // Clear any previous error
        setConnectionError(prev => ({
          ...prev,
          [provider]: null
        }));
      } else {
        // Store error message for this provider
        setConnectionError(prev => ({
          ...prev,
          [provider]: result.message || 'Connection test failed'
        }));
      }

      setTimeout(() => {
        setConnectionStatus(prev => ({
          ...prev,
          [provider]: null
        }));
      }, 3000);
    } catch (error) {
      setConnectionStatus(prev => ({
        ...prev,
        [provider]: 'error'
      }));
      
      // Store error message for this provider
      setConnectionError(prev => ({
        ...prev,
        [provider]: error.message || 'Connection test failed'
      }));
    }
  };

  const testJiraConnection = async () => {
    setConnectionStatus(prev => ({
      ...prev,
      jira: 'testing'
    }));
    
    // Clear previous error
    setConnectionError(prev => ({
      ...prev,
      jira: null
    }));

    try {
      const result = await window.electronAPI.testJiraConnection({
        jiraBase: config.jiraBase,
        jiraEmail: config.jiraEmail,
        jiraBearer: config.jiraBearer,
        jiraProjectKey: config.jiraProjectKey,
      });

      setConnectionStatus(prev => ({
        ...prev,
        jira: result.success ? 'success' : 'error'
      }));

      if (!result.success) {
        // Store error message for JIRA
        setConnectionError(prev => ({
          ...prev,
          jira: result.message || 'Connection test failed'
        }));
      } else {
        // Clear error on success
        setConnectionError(prev => ({
          ...prev,
          jira: null
        }));
      }

      setTimeout(() => {
        setConnectionStatus(prev => ({
          ...prev,
          jira: null
        }));
      }, 3000);
    } catch (error) {
      setConnectionStatus(prev => ({
        ...prev,
        jira: 'error'
      }));
      
      // Store error message
      setConnectionError(prev => ({
        ...prev,
        jira: error.message || 'Connection test failed'
      }));
    }
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const result = await window.electronAPI.saveConfiguration(config);
      if (result.success) {
        setSaveStatus({ type: 'success', message: 'Configuration saved successfully!' });
        
        // Exit edit mode for all fields that have values
        setEditMode({
          openai: !config.openaiApiKey || config.openaiApiKey.trim() === '',
          anthropic: !config.anthropicApiKey || config.anthropicApiKey.trim() === '',
          google: !config.googleApiKey || config.googleApiKey.trim() === '',
          jira: !config.jiraBearer || config.jiraBearer.trim() === '',
        });
        
        // Notify parent component that configuration was saved
        if (onSave) {
          onSave();
        }
      } else {
        setSaveStatus({ type: 'error', message: result.error || 'Failed to save configuration' });
      }
    } catch (error) {
      setSaveStatus({ type: 'error', message: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setConfig({
      provider: 'openai',
      model: 'gpt-4o-mini',
      openaiApiKey: '',
      anthropicApiKey: '',
      googleApiKey: '',
      ollamaHost: 'http://localhost:11434',
      jiraBase: 'http://localhost:4001',
      jiraEmail: '',
      jiraProjectKey: 'QA',
      jiraBoardId: '3968',
      jiraBearer: '',
    });
    setOllamaVerified(false);
    setEditMode({
      openai: true,
      anthropic: true,
      google: true,
      jira: true
    });
    setSaveStatus(null);
  };

  const getConnectionStatusIcon = (provider) => {
    const status = connectionStatus[provider];
    switch (status) {
      case 'testing':
        return <RefreshIcon className="animate-spin" />;
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        ⚙️ Configuration Settings
      </Typography>

      {saveStatus && (
        <Alert 
          severity={saveStatus.type} 
          sx={{ mb: 3 }}
          onClose={() => setSaveStatus(null)}
        >
          {saveStatus.message}
        </Alert>
      )}

      {/* LLM Provider Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🤖 LLM Provider & Model
        </Typography>
        
        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend">Select Provider</FormLabel>
          <RadioGroup
            row
            value={config.provider}
            onChange={(e) => handleProviderChange(e.target.value)}
          >
            <FormControlLabel value="openai" control={<Radio />} label="OpenAI" />
            <FormControlLabel value="anthropic" control={<Radio />} label="Anthropic (Claude)" />
            <FormControlLabel value="google" control={<Radio />} label="Google (Gemini)" />
            <FormControlLabel value="ollama" control={<Radio />} label="Ollama (Local)" />
          </RadioGroup>
        </FormControl>

        {/* Model Selection */}
        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend">Select Model</FormLabel>
          <RadioGroup
            value={config.model}
            onChange={(e) => handleConfigChange('model', e.target.value)}
          >
            {modelOptions[config.provider]?.map((model) => (
              <Box key={model.value} sx={{ mb: 1 }}>
                <FormControlLabel 
                  value={model.value} 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body1">{model.label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {model.description}
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            ))}
          </RadioGroup>
        </FormControl>

        {/* Custom Model Input for Ollama */}
        {config.provider === 'ollama' && config.model === 'custom' && (
          <TextField
            fullWidth
            label="Custom Model Name"
            value={config.customModel || ''}
            onChange={(e) => handleConfigChange('customModel', e.target.value)}
            sx={{ mb: 2 }}
            placeholder="e.g., llama3:8b, mistral:7b-instruct"
          />
        )}
      </Paper>

      {/* API Keys Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🔐 API Configuration
        </Typography>

        {/* OpenAI API Key */}
        {config.provider === 'openai' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              OpenAI API Key
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                fullWidth
                type={showApiKeys.openai ? 'text' : 'password'}
                value={config.openaiApiKey}
                onChange={(e) => handleConfigChange('openaiApiKey', e.target.value)}
                placeholder="sk-proj-..."
                variant="outlined"
                disabled={!editMode.openai}
              />
              <IconButton onClick={() => toggleApiKeyVisibility('openai')}>
                {showApiKeys.openai ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
              {editMode.openai ? (
                <Button
                  variant="outlined"
                  onClick={() => testConnection('openai')}
                  disabled={!config.openaiApiKey || connectionStatus.openai === 'testing'}
                  startIcon={getConnectionStatusIcon('openai')}
                  sx={{ minWidth: '80px' }}
                >
                  {connectionStatus.openai === 'testing' ? 'Testing...' : 'Test'}
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  onClick={() => setEditMode(prev => ({ ...prev, openai: true }))}
                  sx={{ minWidth: '80px' }}
                >
                  Edit
                </Button>
              )}
            </Box>
            {connectionError.openai && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {connectionError.openai}
              </Alert>
            )}
          </Box>
        )}

        {/* Anthropic API Key */}
        {config.provider === 'anthropic' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Anthropic API Key
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                fullWidth
                type={showApiKeys.anthropic ? 'text' : 'password'}
                value={config.anthropicApiKey}
                onChange={(e) => handleConfigChange('anthropicApiKey', e.target.value)}
                placeholder="sk-ant-..."
                variant="outlined"
                disabled={!editMode.anthropic}
              />
              <IconButton onClick={() => toggleApiKeyVisibility('anthropic')}>
                {showApiKeys.anthropic ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
              {editMode.anthropic ? (
                <Button
                  variant="outlined"
                  onClick={() => testConnection('anthropic')}
                  disabled={!config.anthropicApiKey || connectionStatus.anthropic === 'testing'}
                  startIcon={getConnectionStatusIcon('anthropic')}
                  sx={{ minWidth: '80px' }}
                >
                  {connectionStatus.anthropic === 'testing' ? 'Testing...' : 'Test'}
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  onClick={() => setEditMode(prev => ({ ...prev, anthropic: true }))}
                  sx={{ minWidth: '80px' }}
                >
                  Edit
                </Button>
              )}
            </Box>
            {connectionError.anthropic && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {connectionError.anthropic}
              </Alert>
            )}
          </Box>
        )}

        {/* Google API Key */}
        {config.provider === 'google' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Google Gemini API Key
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                fullWidth
                type={showApiKeys.google ? 'text' : 'password'}
                value={config.googleApiKey}
                onChange={(e) => handleConfigChange('googleApiKey', e.target.value)}
                placeholder="AIza..."
                variant="outlined"
                disabled={!editMode.google}
              />
              <IconButton onClick={() => toggleApiKeyVisibility('google')}>
                {showApiKeys.google ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
              {editMode.google ? (
                <Button
                  variant="outlined"
                  onClick={() => testConnection('google')}
                  disabled={!config.googleApiKey || connectionStatus.google === 'testing'}
                  startIcon={getConnectionStatusIcon('google')}
                  sx={{ minWidth: '80px' }}
                >
                  {connectionStatus.google === 'testing' ? 'Testing...' : 'Test'}
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  onClick={() => setEditMode(prev => ({ ...prev, google: true }))}
                  sx={{ minWidth: '80px' }}
                >
                  Edit
                </Button>
              )}
            </Box>
            {connectionError.google && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {connectionError.google}
              </Alert>
            )}
          </Box>
        )}

        {/* Ollama Host */}
        {config.provider === 'ollama' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Ollama Host URL
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                fullWidth
                value={config.ollamaHost}
                onChange={(e) => handleConfigChange('ollamaHost', e.target.value)}
                placeholder="http://localhost:11434"
                variant="outlined"
              />
              <Button
                variant="outlined"
                onClick={() => testConnection('ollama')}
                disabled={connectionStatus.ollama === 'testing'}
                startIcon={getConnectionStatusIcon('ollama')}
                sx={{ minWidth: '80px' }}
              >
                {connectionStatus.ollama === 'testing' ? 'Testing...' : 'Test'}
              </Button>
            </Box>
            {connectionError.ollama && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {connectionError.ollama}
              </Alert>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Make sure Ollama is running locally. Visit <a href="https://ollama.ai" target="_blank" rel="noopener">ollama.ai</a> to download.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* JIRA Integration */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🎯 JIRA Integration
        </Typography>
        
        <Stack spacing={3}>
          <TextField
            fullWidth
            label="JIRA Base URL"
            value={config.jiraBase}
            onChange={(e) => handleConfigChange('jiraBase', e.target.value)}
            placeholder="e.g., https://your-company.atlassian.net"
            helperText="Enter your JIRA instance URL (without trailing slash)"
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            fullWidth
            label="JIRA Email"
            value={config.jiraEmail}
            onChange={(e) => handleConfigChange('jiraEmail', e.target.value)}
            placeholder="e.g., your-email@company.com"
            helperText="Your Atlassian account email (required for Cloud JIRA)"
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            fullWidth
            label="JIRA Project Key"
            value={config.jiraProjectKey}
            onChange={(e) => handleConfigChange('jiraProjectKey', e.target.value)}
            placeholder="e.g., QA, TEST, PROJECT"
            helperText="The project key where test cases will be created"
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            fullWidth
            label="JIRA Board ID"
            value={config.jiraBoardId}
            onChange={(e) => handleConfigChange('jiraBoardId', e.target.value)}
            placeholder="e.g., 3968"
            helperText="The board ID to fetch issues from (found in board URL)"
            InputLabelProps={{
              shrink: true,
            }}
          />
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
              JIRA API Token
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                fullWidth
                type={showApiKeys.jira ? 'text' : 'password'}
                value={config.jiraBearer}
                onChange={(e) => handleConfigChange('jiraBearer', e.target.value)}
                placeholder="ATATT3xFfGF0... (Cloud) or PAT (Server)"
                helperText="API token from JIRA Settings > Security > API Tokens (for Cloud) or Personal Access Token (for Server)"
                InputLabelProps={{
                  shrink: true,
                }}
                disabled={!editMode.jira}
              />
              <IconButton 
                onClick={() => toggleApiKeyVisibility('jira')}
                size="small"
              >
                {showApiKeys.jira ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
              {editMode.jira ? (
                <Button
                  variant="outlined"
                  onClick={() => testJiraConnection()}
                  disabled={!config.jiraBase || !config.jiraBearer || connectionStatus.jira === 'testing'}
                  startIcon={getConnectionStatusIcon('jira')}
                  sx={{ minWidth: '80px' }}
                >
                  {connectionStatus.jira === 'testing' ? 'Testing...' : 'Test'}
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  onClick={() => setEditMode(prev => ({ ...prev, jira: true }))}
                  sx={{ minWidth: '80px' }}
                >
                  Edit
                </Button>
              )}
            </Box>
            {connectionError.jira && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {connectionError.jira}
              </Alert>
            )}
          </Box>
        </Stack>
      </Paper>



      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={resetToDefaults}
          disabled={isSaving}
        >
          Reset to Defaults
        </Button>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={saveConfiguration}
          disabled={isSaving}
          startIcon={isSaving ? <RefreshIcon className="animate-spin" /> : <SaveIcon />}
        >
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </Box>

      {/* Success/Error Message at Bottom */}
      {saveStatus && (
        <Alert 
          severity={saveStatus.type} 
          sx={{ mt: 3 }}
          onClose={() => setSaveStatus(null)}
          icon={saveStatus.type === 'success' ? <CheckCircleIcon /> : <ErrorIcon />}
        >
          {saveStatus.message}
        </Alert>
      )}
    </Box>
  );
};

export default ConfigurationPage;