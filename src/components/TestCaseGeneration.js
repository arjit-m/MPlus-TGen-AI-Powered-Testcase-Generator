import React from 'react';
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Stack,
  Chip,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  AutoFixHigh as AutoFixHighIcon,
} from '@mui/icons-material';

const TestCaseGeneration = ({
  isGenerating,
  onGenerate,
  disabled
}) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        🚀 Test Case Generation
      </Typography>

      <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 3 }}>
        {/* Primary Generate Button */}
        <Button
          variant="contained"
          size="large"
          startIcon={isGenerating ? <AutoFixHighIcon /> : <PlayArrowIcon />}
          onClick={onGenerate}
          disabled={disabled || isGenerating}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            minWidth: 220,
          }}
        >
          {isGenerating ? 'Generating...' : '🚀 Generate Test Cases'}
        </Button>

        {/* Status Indicators */}
        {disabled && (
          <Chip 
            label="Enter requirements first" 
            color="warning" 
            variant="outlined"
            size="medium"
          />
        )}
        
        {!disabled && !isGenerating && (
          <Chip 
            label="Ready to generate" 
            color="success" 
            variant="outlined"
            size="medium"
          />
        )}
        
        {isGenerating && (
          <Chip 
            label="AI is analyzing..." 
            color="primary" 
            variant="filled"
            size="medium"
          />
        )}
      </Stack>

      {/* Progress Bar */}
      {isGenerating && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress 
            variant="indeterminate" 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
              }
            }} 
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            This may take a few moments while our AI analyzes your requirements...
          </Typography>
        </Box>
      )}

      {/* Generation Info */}
      {!isGenerating && (
        <Box sx={{ 
          backgroundColor: 'rgba(25, 118, 210, 0.04)', 
          borderRadius: 2, 
          p: 2,
          border: '1px solid rgba(25, 118, 210, 0.12)'
        }}>
          <Typography variant="body2" color="text.secondary">
            💡 <strong>How it works:</strong> Our AI will analyze your requirements and generate comprehensive test cases including:
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 2 }}>
            • Test case titles and descriptions<br/>
            • Step-by-step test procedures<br/>
            • Expected results and validations<br/>
            • Priority levels and quality scoring<br/>
            • Coverage for different scenarios
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TestCaseGeneration;