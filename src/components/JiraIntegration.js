import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const JiraIntegration = ({ onRequirementLoad, projectKey }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0); // 0 = Sprint Issues, 1 = Manual Entry
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sprintIssues, setSprintIssues] = useState([]);
  const [sprintInfo, setSprintInfo] = useState(null);
  const [manualIssueKey, setManualIssueKey] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setError(null);
    // Auto-fetch sprint issues when dialog opens if we're on that tab
    if (tabValue === 0) {
      fetchSprintIssues();
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setError(null);
    setSprintIssues([]);
    setSprintInfo(null);
    setManualIssueKey('');
    setSelectedIssue(null);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError(null);
    // Auto-fetch when switching to sprint tab
    if (newValue === 0 && sprintIssues.length === 0) {
      fetchSprintIssues();
    }
  };

  const fetchSprintIssues = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await window.electronAPI.fetchJiraSprintIssues(projectKey);
      
      if (result.success) {
        setSprintIssues(result.issues || []);
        setSprintInfo(result.sprint);
      } else {
        // Provide helpful error message for connection issues
        let errorMessage = result.error || 'Failed to fetch sprint issues';
        
        if (errorMessage.includes('Connection refused') || errorMessage.includes('Failed to establish')) {
          errorMessage = '⚠️ Cannot connect to JIRA server. Please check:\n\n' +
            '1. JIRA Base URL is correct (e.g., https://your-company.atlassian.net)\n' +
            '2. JIRA server is accessible from this machine\n' +
            '3. Update settings in Configuration tab and save\n\n' +
            'Original error: ' + result.error;
        } else if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('Unauthorized')) {
          errorMessage = '🔐 Authentication failed. Please check:\n\n' +
            '1. JIRA Bearer Token is valid and not expired\n' +
            '2. Token has required permissions (read issues, boards, sprints)\n' +
            '3. Update token in Configuration tab\n\n' +
            'Original error: ' + result.error;
        } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          errorMessage = '🔍 Resource not found. Please check:\n\n' +
            '1. JIRA Project Key is correct\n' +
            '2. Project exists and you have access to it\n' +
            '3. Board is configured for the project\n\n' +
            'Original error: ' + result.error;
        }
        
        setError(errorMessage);
        setSprintIssues([]);
      }
    } catch (err) {
      setError('An error occurred: ' + (err.message || 'Unknown error'));
      setSprintIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssueByKey = async () => {
    if (!manualIssueKey.trim()) {
      setError('Please enter an issue key');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await window.electronAPI.fetchJiraIssue(manualIssueKey.trim());
      
      if (result.success && result.issue) {
        // Load the issue directly
        loadIssueToRequirement(result.issue);
      } else {
        // Provide helpful error message
        let errorMessage = result.error || 'Failed to fetch issue';
        
        if (errorMessage.includes('Connection refused') || errorMessage.includes('Failed to establish')) {
          errorMessage = '⚠️ Cannot connect to JIRA server. Please verify your JIRA configuration in Settings.';
        } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
          errorMessage = '🔐 Authentication failed. Please check your JIRA Bearer Token in Settings.';
        } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          errorMessage = `🔍 Issue "${manualIssueKey}" not found. Please check:\n\n` +
            '• Issue key is correct (e.g., QA-101)\n' +
            '• You have permission to view this issue\n' +
            '• Issue exists in the configured JIRA project';
        }
        
        setError(errorMessage);
      }
    } catch (err) {
      setError('An error occurred: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const loadIssueToRequirement = (issue) => {
    // Format the requirement text from JIRA issue
    const requirementText = formatIssueToRequirement(issue);
    onRequirementLoad(requirementText);
    setSelectedIssue(issue);
    handleCloseDialog();
  };

  const formatIssueToRequirement = (issue) => {
    const parts = [];
    
    // Title
    parts.push(`Issue: ${issue.key} - ${issue.summary}\n`);
    
    // Type and Priority
    const metadata = [];
    if (issue.type) metadata.push(`Type: ${issue.type}`);
    if (issue.priority) metadata.push(`Priority: ${issue.priority}`);
    if (issue.status) metadata.push(`Status: ${issue.status}`);
    
    if (metadata.length > 0) {
      parts.push(`\n${metadata.join(' | ')}\n`);
    }
    
    // Description
    if (issue.description) {
      parts.push(`\nDescription:\n${issue.description.trim()}`);
    } else {
      parts.push(`\nDescription: ${issue.summary}`);
    }
    
    return parts.join('');
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={handleOpenDialog}
        size="medium"
        color="primary"
      >
        Fetch from JIRA
      </Button>

      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6"> Fetch JIRA Issue</Typography>
            <Button 
              onClick={handleCloseDialog}
              size="small"
              color="inherit"
            >
              <CloseIcon />
            </Button>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="📋 Recent Issues" />
            <Tab label="🔍 Manual Entry" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Tab 0: Recent Issues */}
          {tabValue === 0 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  {sprintInfo && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2">{sprintInfo.name}</Typography>
                      {sprintInfo.state !== 'N/A' && (
                        <Chip label={sprintInfo.state} size="small" variant="outlined" />
                      )}
                    </Stack>
                  )}
                </Box>
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={fetchSprintIssues}
                  disabled={loading}
                  size="small"
                >
                  Refresh
                </Button>
              </Box>

              {loading && (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              )}

              {!loading && sprintIssues.length === 0 && !error && (
                <Alert severity="info">
                  No issues found. Try refreshing or check your JIRA configuration.
                </Alert>
              )}

              {!loading && sprintIssues.length > 0 && (
                <List sx={{ 
                  maxHeight: 400, 
                  overflow: 'auto',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}>
                  {sprintIssues.map((issue, index) => (
                    <React.Fragment key={issue.key}>
                      <ListItem disablePadding>
                        <ListItemButton onClick={() => loadIssueToRequirement(issue)}>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Chip 
                                  label={issue.key} 
                                  size="small" 
                                  color="primary"
                                  variant="outlined"
                                />
                                <Typography variant="body1">{issue.summary}</Typography>
                              </Box>
                            }
                            secondary={
                              <Stack direction="row" spacing={1} mt={0.5}>
                                {issue.type && (
                                  <Chip label={issue.type} size="small" variant="outlined" />
                                )}
                                {issue.priority && (
                                  <Chip 
                                    label={issue.priority} 
                                    size="small" 
                                    color={
                                      issue.priority === 'High' ? 'error' : 
                                      issue.priority === 'Medium' ? 'warning' : 
                                      'default'
                                    }
                                    variant="outlined"
                                  />
                                )}
                                {issue.status && (
                                  <Chip label={issue.status} size="small" />
                                )}
                              </Stack>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                      {index < sprintIssues.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Tab 1: Manual Entry */}
          {tabValue === 1 && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              py: 8,
              opacity: 0.6
            }}>
              <Typography variant="h6" gutterBottom color="text.secondary">
                🚧 Under Development
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manual entry feature is currently being developed
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default JiraIntegration;
