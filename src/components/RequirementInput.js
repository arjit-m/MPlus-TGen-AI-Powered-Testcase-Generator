import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  Divider,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  FolderOpen as FolderOpenIcon,
  Description as DescriptionIcon,
  Clear as ClearIcon,
  AutoFixHigh as AutoFixHighIcon,
  Psychology as PsychologyIcon,
  Spellcheck as SpellcheckIcon,
} from '@mui/icons-material';
import JiraIntegration from './JiraIntegration';

// Helper function to parse markdown and return styled components
const parseMarkdown = (text) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  const elements = [];
  
  lines.forEach((line, lineIndex) => {
    // Handle bold and italic patterns
    const parts = [];
    let lastIndex = 0;
    
    // Match **bold**, *italic*, __bold__, _italic_
    const regex = /(\*\*(.+?)\*\*)|(__(.+?)__)|(\*(.+?)\*)|(_(.+?)_)/g;
    let match;
    
    while ((match = regex.exec(line)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lineIndex}-${lastIndex}`}>
            {line.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      // Add formatted text
      if (match[2] || match[4]) {
        // Bold: **text** or __text__
        parts.push(
          <strong key={`bold-${lineIndex}-${match.index}`}>
            {match[2] || match[4]}
          </strong>
        );
      } else if (match[6] || match[8]) {
        // Italic: *text* or _text_
        parts.push(
          <em key={`italic-${lineIndex}-${match.index}`}>
            {match[6] || match[8]}
          </em>
        );
      }
      
      lastIndex = regex.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < line.length) {
      parts.push(
        <span key={`text-${lineIndex}-${lastIndex}`}>
          {line.substring(lastIndex)}
        </span>
      );
    }
    
    // If no formatting found, add plain line
    if (parts.length === 0) {
      parts.push(<span key={`text-${lineIndex}`}>{line}</span>);
    }
    
    elements.push(
      <div key={`line-${lineIndex}`} style={{ minHeight: '1.5em' }}>
        {parts}
      </div>
    );
  });
  
  return elements;
};

const RequirementInput = ({
  requirementText,
  setRequirementText,
  requirementFile,
  onFileSelect,
  onLoadExample,
  onClear,
  onEnhanceRequirement,
  isEnhancing,
  llmConfigStatus = { isConfigured: true, message: '', provider: '' }
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const enhanceMenuOpen = Boolean(anchorEl);
  const [isEditing, setIsEditing] = useState(true);
  const textareaRef = useRef(null);

  const handleEnhanceClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleEnhanceClose = () => {
    setAnchorEl(null);
  };

  const handleEnhanceOption = (enhanceType) => {
    handleEnhanceClose();
    onEnhanceRequirement(enhanceType);
  };


  return (
    <Box>
      {/* Enhancement Menu - Positioned outside text area for proper z-index */}
      <Menu
        anchorEl={anchorEl}
        open={enhanceMenuOpen}
        onClose={handleEnhanceClose}
        MenuListProps={{
          'aria-labelledby': 'enhance-button',
        }}
      >
        <MenuItem onClick={() => handleEnhanceOption('improvise')}>
          <ListItemIcon>
            <PsychologyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Improvise" 
            secondary="Enhance clarity, add details, improve structure"
          />
        </MenuItem>
        <MenuItem onClick={() => handleEnhanceOption('fix-grammar')}>
          <ListItemIcon>
            <SpellcheckIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Fix Spelling & Grammar" 
            secondary="Correct spelling and grammatical errors only"
          />
        </MenuItem>
      </Menu>

      {/* Requirement Text Area with integrated actions */}
      <Box sx={{ position: 'relative' }}>
        {/* Action Buttons Bar - Inside textarea at top */}
        <Stack 
          direction="row" 
          spacing={1} 
          sx={{ 
            position: 'absolute', 
            top: 8, 
            left: 8,
            right: 8,
            zIndex: 10,
            flexWrap: 'wrap',
            gap: 1
          }}
        >
          <Button
            variant="outlined"
            size="small"
            startIcon={<FolderOpenIcon />}
            onClick={onFileSelect}
            sx={{ 
              fontSize: '0.75rem',
              backgroundColor: 'white',
              '&:hover': { backgroundColor: '#f5f5f5' }
            }}
          >
            Load File
          </Button>
          
          <Box sx={{ '& > button': { fontSize: '0.75rem' } }}>
            <JiraIntegration 
              onRequirementLoad={setRequirementText}
              projectKey={null}
            />
          </Box>
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<DescriptionIcon />}
            onClick={onLoadExample}
            sx={{ 
              fontSize: '0.75rem',
              backgroundColor: 'white',
              '&:hover': { backgroundColor: '#f5f5f5' }
            }}
          >
            Example
          </Button>
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<ClearIcon />}
            onClick={onClear}
            color="secondary"
            sx={{ 
              fontSize: '0.75rem',
              backgroundColor: 'white',
              '&:hover': { backgroundColor: '#ffebee' }
            }}
          >
            Clear
          </Button>

          {/* Spacer to push right-side buttons */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Right-side buttons - Only show when there's text */}
          {requirementText && (
            <>
              {/* Enhance with AI Button */}
              <Tooltip 
                title={
                  !llmConfigStatus.isConfigured ? (
                    `⚙️ ${llmConfigStatus.message}`
                  ) : (
                    <Box sx={{ p: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        ✨ Enhance with AI
                      </Typography>
                      <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
                        <strong>🧠 Improvise:</strong> Enhance clarity, add missing details, improve structure
                      </Typography>
                      <Typography variant="caption" component="div">
                        <strong>✍️ Fix Spelling & Grammar:</strong> Correct errors only
                      </Typography>
                    </Box>
                  )
                }
                arrow
                placement="bottom-end"
                enterDelay={500}
              >
                <span>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={isEnhancing ? <CircularProgress size={14} color="inherit" /> : <AutoFixHighIcon />}
                    onClick={handleEnhanceClick}
                    disabled={!requirementText.trim() || isEnhancing || !llmConfigStatus.isConfigured}
                    sx={{ 
                      fontSize: '0.75rem',
                      background: llmConfigStatus.isConfigured 
                        ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                        : 'linear-gradient(45deg, #9E9E9E 30%, #BDBDBD 90%)',
                      '&:hover': {
                        background: llmConfigStatus.isConfigured
                          ? 'linear-gradient(45deg, #1976D2 30%, #0288D1 90%)'
                          : 'linear-gradient(45deg, #9E9E9E 30%, #BDBDBD 90%)',
                      },
                      boxShadow: 2,
                    }}
                  >
                    {isEnhancing ? 'Enhancing...' : '✨ Enhance'}
                  </Button>
                </span>
              </Tooltip>
              
              {/* Preview/Edit Toggle */}
              <Chip
                label={isEditing ? "👁️ Preview" : "✏️ Edit"}
                size="small"
                onClick={() => setIsEditing(!isEditing)}
                sx={{ 
                  cursor: 'pointer',
                  backgroundColor: 'white',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: 1,
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  }
                }}
              />
            </>
          )}
        </Stack>

        {/* Text Area / Preview */}
        {isEditing ? (
          <TextField
            multiline
            fullWidth
            value={requirementText}
            onChange={(e) => setRequirementText(e.target.value)}
            onFocus={() => setIsEditing(true)}
            inputRef={textareaRef}
            placeholder="Enter your requirements here...

Example:
User Login System:
- Users can log in with email and password
- Dashboard loads after successful login
- Critical navigation menu is accessible
- User can log out successfully
- Basic user profile information displays correctly

Focus on clear, testable requirements."
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '14px',
                lineHeight: 1.5,
                paddingTop: '48px',
                alignItems: 'flex-start',
                overflow: 'hidden',
              },
              '& .MuiInputBase-input': {
                minHeight: '250px',
                maxHeight: '550px',
                overflowY: 'auto !important',
                resize: 'vertical',
                boxSizing: 'border-box',
              }
            }}
          />
        ) : (
          <Box
            onClick={() => setIsEditing(true)}
            sx={{
              border: '1px solid',
              borderColor: 'rgba(0, 0, 0, 0.23)',
              borderRadius: 1,
              padding: 2,
              paddingTop: '56px', // Space for buttons
              minHeight: '288px',
              maxHeight: '600px',
              overflowY: 'auto',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '14px',
              lineHeight: 1.5,
              cursor: 'text',
              backgroundColor: '#fafafa',
              '&:hover': {
                borderColor: 'rgba(0, 0, 0, 0.87)',
                backgroundColor: '#f5f5f5',
              }
            }}
          >
            {requirementText ? parseMarkdown(requirementText) : (
              <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Click to edit or use buttons above to load requirements...
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Word Count */}
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {requirementText.trim().split(/\s+/).filter(word => word.length > 0).length} words, {requirementText.length} characters
        </Typography>
        
        {requirementText.trim() && (
          <Chip 
            label="Ready to generate" 
            color="success" 
            size="small" 
            variant="outlined"
          />
        )}
      </Box>
    </Box>
  );
};

export default RequirementInput;