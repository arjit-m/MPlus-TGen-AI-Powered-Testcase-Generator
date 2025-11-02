import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Visibility as VisibilityIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';

const TestCasePreview = ({ testCases, qualityReport }) => {
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Helper function to format test type labels
  const formatTestTypeLabel = (type) => {
    if (!type) return 'Smoke';
    if (type.toLowerCase() === 'api') return 'API';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Get quality score for a test case
  const getQualityScore = (testId) => {
    if (!qualityReport?.individual_scores) return 0;
    const scoreInfo = qualityReport.individual_scores.find(s => s.test_id === testId);
    return scoreInfo?.total_score || 0;
  };

  // Get quality color
  const getQualityColor = (score) => {
    if (score >= 8.0) return 'success';
    if (score >= 6.0) return 'warning';
    if (score > 0) return 'error';
    return 'default';
  };

  // Format steps for display - no longer needed as we'll render directly
  const formatSteps = (steps) => {
    if (Array.isArray(steps)) {
      return steps;
    }
    // If it's a string, try to split by common delimiters
    if (typeof steps === 'string') {
      // Try splitting by pipe, newline, or numbered list patterns
      if (steps.includes('|')) {
        return steps.split('|').map(s => s.trim()).filter(s => s);
      }
      if (steps.includes('\n')) {
        return steps.split('\n').map(s => s.trim()).filter(s => s);
      }
      // If it looks like a numbered list (1., 2., etc), split by numbers
      const numberedPattern = /\d+\.\s+/;
      if (numberedPattern.test(steps)) {
        return steps.split(numberedPattern).map(s => s.trim()).filter(s => s);
      }
    }
    return steps ? [steps] : [''];
  };

  // DataGrid columns
  const columns = [
    {
      field: 'id',
      headerName: 'Test ID',
      width: 100,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      minWidth: 200,
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ 
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          lineHeight: 1.5,
          py: 1
        }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'steps',
      headerName: 'Steps',
      flex: 1.5,
      minWidth: 250,
      headerAlign: 'center',
      renderCell: (params) => {
        const stepsArray = formatSteps(params.value);
        return (
          <Box sx={{ py: 1 }}>
            {Array.isArray(stepsArray) ? (
              stepsArray.map((step, index) => (
                <Typography 
                  key={index} 
                  variant="body2" 
                  sx={{ 
                    mb: index < stepsArray.length - 1 ? 0.5 : 0,
                    lineHeight: 1.5,
                  }}
                >
                  <strong>{index + 1}.</strong> {step}
                </Typography>
              ))
            ) : (
              <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                {stepsArray}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: 'expected',
      headerName: 'Expected Result',
      flex: 1,
      minWidth: 200,
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ 
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          lineHeight: 1.5,
          py: 1
        }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const color = params.value?.toLowerCase() === 'high' ? 'error' : 
                     params.value?.toLowerCase() === 'low' ? 'default' : 'warning';
        return (
          <Chip 
            label={params.value} 
            color={color} 
            size="small" 
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 110,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const color = params.value?.toLowerCase() === 'functional' ? 'primary' : 'secondary';
        return (
          <Chip 
            label={params.value || 'Functional'} 
            color={color} 
            size="small" 
            variant="filled"
          />
        );
      },
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 100,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const getTypeColor = (type) => {
          switch(type?.toLowerCase()) {
            case 'smoke': return 'success';
            case 'sanity': return 'info';
            case 'unit': return 'warning';
            case 'api': return 'error';
            default: return 'default';
          }
        };
        return (
          <Chip 
            label={formatTestTypeLabel(params.value)} 
            color={getTypeColor(params.value)} 
            size="small" 
            variant="filled"
          />
        );
      },
    },
    {
      field: 'quality',
      headerName: 'Quality Score',
      width: 130,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const score = getQualityScore(params.row.id);
        const display = score > 0 ? `${score.toFixed(1)}/10` : 'N/A';
        const color = getQualityColor(score);
        return (
          <Chip 
            label={display} 
            color={color} 
            size="small" 
            variant="filled"
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={() => {
            setSelectedTestCase(params.row);
            setDetailDialogOpen(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  // Handle row double-click
  const handleRowDoubleClick = (params) => {
    setSelectedTestCase(params.row);
    setDetailDialogOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          📝 Generated Test Cases ({testCases.length})
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          💡 Double-click any row for detailed view
        </Typography>
      </Box>

      {/* Data Grid */}
      <Box sx={{ 
        height: 'calc(100vh - 400px)', 
        minHeight: 400, 
        maxHeight: 800,
        width: '100%' 
      }}>
        <DataGrid
          rows={testCases}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          checkboxSelection={false}
          disableSelectionOnClick
          onRowDoubleClick={handleRowDoubleClick}
          getRowHeight={() => 'auto'}
          sx={{
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid rgba(224, 224, 224, 1)',
              py: 1.5,
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
              borderBottom: '2px solid rgba(25, 118, 210, 0.2)',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
            },
          }}
        />
      </Box>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Test Case Details - {selectedTestCase?.id}
          </Typography>
          <Chip 
            label={`${getQualityScore(selectedTestCase?.id).toFixed(1)}/10`}
            color={getQualityColor(getQualityScore(selectedTestCase?.id))}
            variant="filled"
          />
        </DialogTitle>
        
        <DialogContent>
          {selectedTestCase && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Title */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Title:
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  value={selectedTestCase.title}
                  variant="outlined"
                  InputProps={{ readOnly: true }}
                  sx={{ backgroundColor: '#f5f5f5' }}
                />
              </Box>

              {/* Priority */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Priority:
                </Typography>
                <Chip 
                  label={selectedTestCase.priority} 
                  color={selectedTestCase.priority?.toLowerCase() === 'high' ? 'error' : 
                         selectedTestCase.priority?.toLowerCase() === 'low' ? 'default' : 'warning'}
                  variant="outlined"
                />
              </Box>

              {/* Test Steps */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Test Steps:
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  value={Array.isArray(selectedTestCase.steps) 
                    ? selectedTestCase.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')
                    : selectedTestCase.steps
                  }
                  variant="outlined"
                  InputProps={{ readOnly: true }}
                  sx={{ backgroundColor: '#f5f5f5' }}
                />
              </Box>

              {/* Expected Results */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Expected Results:
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={selectedTestCase.expected}
                  variant="outlined"
                  InputProps={{ readOnly: true }}
                  sx={{ backgroundColor: '#f5f5f5' }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestCasePreview;