import React from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
} from '@mui/material';
import {
  Download as DownloadIcon,
  TableChart as TableChartIcon,
} from '@mui/icons-material';

const ActionButtons = ({
  onExportCSV,
  onExportExcel,
  onExportZephyr
}) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        🔗 Actions
      </Typography>

      {/* Export Options */}
      <Box>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Export Test Cases:
        </Typography>
        
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={onExportCSV}
            size="large"
          >
            📄 Download as CSV
          </Button>
          
          <Button
            variant="outlined"
            onClick={onExportExcel}
            size="large"
          >
            📊 Download as Excel
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={onExportZephyr}
            size="large"
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' }
            }}
          >
            Download as Zephyr Format
          </Button>
        </Stack>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
          Export your test cases in various formats for easy integration with your testing tools.
        </Typography>
      </Box>
    </Box>
  );
};

export default ActionButtons;