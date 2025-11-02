import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Lightbulb as LightbulbIcon,
  PriorityHigh as PriorityIcon,
  Build as BuildIcon,
} from '@mui/icons-material';

const QualityAssessment = ({ qualityReport }) => {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  if (!qualityReport) {
    return null;
  }

  const overallScore = qualityReport.overall_score || 0;
  const individualScores = qualityReport.individual_scores || [];

  // Calculate quality distribution
  const getQualityDistribution = () => {
    const high = individualScores.filter(s => s.total_score >= 8.0).length;
    const medium = individualScores.filter(s => s.total_score >= 6.0 && s.total_score < 8.0).length;
    const low = individualScores.filter(s => s.total_score < 6.0).length;
    return { high, medium, low };
  };

  const distribution = getQualityDistribution();

  // Get score color and icon
  const getScoreColorAndIcon = (score) => {
    if (score >= 8.0) return { color: 'success', icon: <CheckCircleIcon /> };
    if (score >= 6.0) return { color: 'warning', icon: <WarningIcon /> };
    return { color: 'error', icon: <ErrorIcon /> };
  };

  const { color: overallColor, icon: overallIcon } = getScoreColorAndIcon(overallScore);

  // DataGrid columns for detailed scores
  const columns = [
    {
      field: 'test_id',
      headerName: 'Test ID',
      width: 100,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'clarity',
      headerName: 'Clarity',
      width: 100,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.scores?.clarity?.toFixed(1) || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'completeness',
      headerName: 'Completeness',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.scores?.completeness?.toFixed(1) || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'specificity',
      headerName: 'Specificity',
      width: 110,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.scores?.specificity?.toFixed(1) || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'testability',
      headerName: 'Testability',
      width: 110,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.scores?.testability?.toFixed(1) || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'coverage',
      headerName: 'Coverage',
      width: 100,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.scores?.coverage?.toFixed(1) || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'total_score',
      headerName: 'Total Score',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const score = params.value || 0;
        const { color } = getScoreColorAndIcon(score);
        return (
          <Chip 
            label={`${score.toFixed(1)}/10`}
            color={color}
            size="small"
            variant="filled"
          />
        );
      },
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          📊 Quality Assessment
        </Typography>
      </Box>

      <Grid container spacing={3} alignItems="center">
        {/* Overall Score */}
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 2, textAlign: 'center', backgroundColor: `${overallColor}.50` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
              {overallIcon}
              <Typography variant="h4" fontWeight="bold" color={`${overallColor}.main`}>
                {overallScore.toFixed(1)}/10
              </Typography>
            </Box>
            <Typography variant="subtitle1" fontWeight="bold">
              Overall Quality Score
            </Typography>
          </Paper>
        </Grid>

        {/* Quality Distribution */}
        <Grid item xs={12} md={5}>
          <Box>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              Quality Distribution:
            </Typography>
            
            {/* High Quality */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Chip 
                icon={<CheckCircleIcon />}
                label={`High Quality (8.0+): ${distribution.high} tests`}
                color="success"
                variant="outlined"
                size="small"
              />
            </Box>
            
            {/* Medium Quality */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Chip 
                icon={<WarningIcon />}
                label={`Medium Quality (6.0-7.9): ${distribution.medium} tests`}
                color="warning"
                variant="outlined"
                size="small"
              />
            </Box>
            
            {/* Low Quality */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                icon={<ErrorIcon />}
                label={`Low Quality (<6.0): ${distribution.low} tests`}
                color="error"
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
        </Grid>

        {/* View Report Button */}
        <Grid item xs={12} md={3}>
          <Button
            variant="contained"
            onClick={() => setReportDialogOpen(true)}
            fullWidth
            size="large"
          >
            📋 View Quality Report
          </Button>
        </Grid>
      </Grid>

      {/* Quality Report Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AssessmentIcon />
            <Typography variant="h6">
              Test Case Quality Report
            </Typography>
            <Chip 
              label={`Overall: ${overallScore.toFixed(1)}/10`}
              color={overallColor}
              variant="filled"
            />
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ width: '100%' }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="📊 Summary" />
              <Tab label="📝 Detailed Scores" />
              <Tab label="💡 Recommendations" />
            </Tabs>

            {/* Summary Tab */}
            {activeTab === 0 && (
              <Box sx={{ mt: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        🎯 Assessment Overview
                      </Typography>
                      <Typography variant="body1" paragraph>
                        <strong>Overall Quality Score:</strong> {overallScore.toFixed(1)}/10
                      </Typography>
                      <Typography variant="body1" paragraph>
                        <strong>Total Test Cases Evaluated:</strong> {individualScores.length}
                      </Typography>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Quality Distribution:
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleIcon color="success" fontSize="small" />
                            <Typography variant="body2">
                              High Quality (8.0+): {distribution.high} tests
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WarningIcon color="warning" fontSize="small" />
                            <Typography variant="body2">
                              Medium Quality (6.0-7.9): {distribution.medium} tests
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ErrorIcon color="error" fontSize="small" />
                            <Typography variant="body2">
                              Low Quality (&lt;6.0): {distribution.low} tests
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        📈 Quality Metrics
                      </Typography>
                      
                      {/* Average scores by category */}
                      {individualScores.length > 0 && (
                        <Box>
                          {['clarity', 'completeness', 'specificity', 'testability', 'coverage'].map(metric => {
                            const avg = individualScores.reduce((sum, score) => 
                              sum + (score.scores?.[metric] || 0), 0) / individualScores.length;
                            const percentage = (avg / 10) * 100;
                            
                            return (
                              <Box key={metric} sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                    {metric}:
                                  </Typography>
                                  <Typography variant="body2" fontWeight="bold">
                                    {avg.toFixed(1)}/10
                                  </Typography>
                                </Box>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={percentage} 
                                  sx={{ height: 8, borderRadius: 4 }}
                                />
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Detailed Scores Tab */}
            {activeTab === 1 && (
              <Box sx={{ mt: 3, height: 400 }}>
                <DataGrid
                  rows={individualScores}
                  columns={columns}
                  pageSize={10}
                  rowsPerPageOptions={[5, 10, 25]}
                  checkboxSelection={false}
                  disableSelectionOnClick
                  getRowId={(row) => row.test_id}
                  sx={{
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid rgba(224, 224, 224, 1)',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      borderBottom: '2px solid rgba(25, 118, 210, 0.2)',
                    },
                  }}
                />
              </Box>
            )}

            {/* Recommendations Tab */}
            {activeTab === 2 && (
              <Box sx={{ mt: 3 }}>
                <ContextualRecommendations 
                  qualityReport={qualityReport}
                  distribution={distribution}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Contextual Recommendations Component
const ContextualRecommendations = ({ qualityReport, distribution }) => {
  const testContext = qualityReport?.metadata?.test_category && qualityReport?.metadata?.test_type
    ? `${qualityReport.metadata.test_category.toLowerCase()}_${qualityReport.metadata.test_type.toLowerCase()}`
    : 'functional_smoke';

  // Get contextual recommendations based on test type and actual quality data
  const getContextualRecommendations = () => {
    // First try to use backend recommendations if available
    const backendRecs = qualityReport?.quality_insights?.contextual_recommendations;
    if (backendRecs) {
      const hasBackendData = Object.values(backendRecs).some(arr => 
        Array.isArray(arr) && arr.length > 0 && arr !== backendRecs.requirement_enhancement_suggestions
      );
      
      if (hasBackendData) {
        return {
          title: `🎯 ${qualityReport?.quality_insights?.test_context || 'Quality'} Recommendations`,
          focus: 'Based on AI analysis of your test cases',
          clarity: backendRecs.clarity_improvements || [],
          completeness: backendRecs.completeness_improvements || [],
          specificity: backendRecs.specificity_improvements || [],
          testability: backendRecs.testability_improvements || [],
          coverage: backendRecs.coverage_improvements || []
        };
      }
    }

    // Extract real suggestions from individual test case feedback
    const getRealSuggestions = (category) => {
      if (!qualityReport?.individual_scores) return [];
      
      const suggestions = new Set();
      qualityReport.individual_scores.forEach(test => {
        if (test.suggestions && Array.isArray(test.suggestions)) {
          test.suggestions.forEach(suggestion => {
            // Categorize suggestions based on keywords
            const lower = suggestion.toLowerCase();
            switch(category) {
              case 'clarity':
                if (lower.includes('clear') || lower.includes('specific') || lower.includes('define') || lower.includes('describe')) {
                  suggestions.add(suggestion);
                }
                break;
              case 'completeness':
                if (lower.includes('add') || lower.includes('include') || lower.includes('missing') || lower.includes('cover')) {
                  suggestions.add(suggestion);
                }
                break;
              case 'specificity':
                if (lower.includes('exact') || lower.includes('precise') || lower.includes('detail') || lower.includes('format')) {
                  suggestions.add(suggestion);
                }
                break;
              case 'testability':
                if (lower.includes('test') || lower.includes('validate') || lower.includes('verify') || lower.includes('check')) {
                  suggestions.add(suggestion);
                }
                break;
              case 'coverage':
                if (lower.includes('scenario') || lower.includes('case') || lower.includes('edge') || lower.includes('error')) {
                  suggestions.add(suggestion);
                }
                break;
            }
          });
        }
      });
      
      return Array.from(suggestions).slice(0, 4); // Limit to 4 per category
    };

    // Fallback to contextual static recommendations
    const contextMap = {
      'functional_api': {
        title: '🔌 API Testing Recommendations',
        focus: 'REST API endpoints, HTTP methods, and service layer functionality',
        clarity: [
          'Include specific HTTP methods (GET, POST, PUT, DELETE) in test steps',
          'Specify exact API endpoints and request/response formats', 
          'Use clear parameter names and expected status codes'
        ],
        completeness: [
          'Add authentication/authorization test scenarios',
          'Include request validation and error response testing',
          'Test different content types and payload sizes'
        ],
        specificity: [
          'Specify exact JSON schema validation rules',
          'Include precise HTTP status codes and error messages',
          'Define exact response time thresholds and payload sizes'
        ],
        testability: [
          'Include sample request payloads and cURL commands',
          'Provide test data setup scripts and database states',
          'Add API client configuration and authentication setup'
        ],
        coverage: [
          'Add performance testing under different load conditions',
          'Include security testing for injection and authentication',
          'Test API versioning and backward compatibility'
        ]
      },
      'functional_unit': {
        title: '🧩 Unit Testing Recommendations',
        focus: 'Individual components, business logic validation, and isolated functionality',
        clarity: [
          'Specify exact function names and input parameters',
          'Include data types and expected return values',
          'Use precise variable names and mock object descriptions'
        ],
        completeness: [
          'Add boundary value testing with min/max inputs',
          'Include null, empty, and invalid parameter tests',
          'Test exception handling and error conditions'
        ],
        specificity: [
          'Include exact expected return values and data types',
          'Specify precise error messages and exception types',
          'Define exact computational results and formulas'
        ],
        testability: [
          'Include mock object setup and test fixture creation',
          'Provide sample input data and expected outputs',
          'Add test environment configuration details'
        ],
        coverage: [
          'Add concurrent execution and thread safety tests',
          'Include memory usage and performance benchmarks',
          'Test integration with external dependencies and services'
        ]
      },
      'functional_smoke': {
        title: '💨 Smoke Testing Recommendations', 
        focus: 'Critical user workflows and core system functionality',
        clarity: [
          'Focus on end-to-end user workflows with clear navigation steps',
          'Use business language that stakeholders can understand',
          'Include specific UI elements and user actions'
        ],
        completeness: [
          'Include user login/logout flows in critical path tests',
          'Add data persistence verification across key workflows',
          'Test core business rules and validations'
        ],
        specificity: [
          'Include specific success messages and UI states',
          'Define exact page redirects and navigation outcomes',
          'Specify visible UI elements after actions'
        ],
        testability: [
          'Include test user credentials and data setup',
          'Provide browser configuration and environment details',
          'Add screenshot checkpoints for visual validation'
        ],
        coverage: [
          'Add cross-browser and device compatibility tests',
          'Include accessibility and usability validation',
          'Test offline scenarios and network interruptions'
        ]
      },
      'functional_sanity': {
        title: '🔍 Sanity Testing Recommendations',
        focus: 'Specific functionality and regression scenarios',
        clarity: [
          'Clearly state what specific functionality is being regression tested',
          'Reference the recent changes or fixes being validated',
          'Include before/after behavior expectations'
        ],
        completeness: [
          'Add rollback scenarios if new changes fail',
          'Include integration points affected by recent changes',
          'Test dependencies and downstream impacts'
        ],
        specificity: [
          'Define measurable criteria for regression testing',
          'Include specific metrics to validate fix effectiveness',
          'Specify exact behavior changes from previous version'
        ],
        testability: [
          'Include version information and deployment details',
          'Provide rollback procedures and environment restoration',
          'Add monitoring and logging checkpoint verification'
        ],
        coverage: [
          'Add performance regression testing',
          'Include security impact assessment of changes',
          'Test scalability with increased data volumes'
        ]
      }
    };

    // Get the base context recommendations
    const baseRecs = contextMap[testContext] || contextMap['functional_smoke'];
    
    // Merge real suggestions from quality report with static fallbacks
    const mergedRecs = { ...baseRecs };
    ['clarity', 'completeness', 'specificity', 'testability', 'coverage'].forEach(category => {
      const realSuggestions = getRealSuggestions(category);
      if (realSuggestions.length > 0) {
        // Use real suggestions, but supplement with static ones if needed
        const combined = [...realSuggestions, ...baseRecs[category]];
        // Remove duplicates and limit to 5 items
        mergedRecs[category] = [...new Set(combined)].slice(0, 5);
      }
    });
    
    return mergedRecs;
  };

  // Calculate weak areas based on actual quality report data
  const getWeakAreas = () => {
    if (!qualityReport?.individual_scores || qualityReport.individual_scores.length === 0) {
      // Fallback to analyzing distribution if no individual scores
      if (distribution.low > 0) return ['clarity', 'completeness'];
      if (distribution.medium > 0) return ['specificity'];
      return [];
    }

    // Calculate average scores for each metric across all test cases
    const metrics = ['clarity', 'completeness', 'specificity', 'testability', 'coverage'];
    const averageScores = {};
    
    metrics.forEach(metric => {
      const scores = qualityReport.individual_scores
        .map(test => test.scores?.[metric])
        .filter(score => score !== undefined && score !== null);
      
      if (scores.length > 0) {
        averageScores[metric] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      } else {
        averageScores[metric] = 7.0; // default if no data
      }
    });
    
    // Find areas with scores below 7.5 (need improvement)
    const weakAreas = metrics.filter(metric => averageScores[metric] < 7.5);
    
    // Sort by severity (lowest scores first)
    weakAreas.sort((a, b) => averageScores[a] - averageScores[b]);
    
    return weakAreas;
  };

  const recommendations = getContextualRecommendations();
  const weakAreas = getWeakAreas();
  const testCategory = qualityReport?.metadata?.test_category || 'Functional';
  const testType = qualityReport?.metadata?.test_type || 'Smoke';

  // Helper function to format test type labels
  const formatTestTypeLabel = (type) => {
    if (type.toLowerCase() === 'api') return 'API';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BuildIcon />
            {recommendations.title}
          </Box>
        </AlertTitle>
        <Typography variant="body2">
          <strong>Test Context:</strong> {testCategory} {formatTestTypeLabel(testType)} Testing<br/>
          <strong>Focus Area:</strong> {recommendations.focus}
        </Typography>
      </Alert>

      {/* Priority Improvement Areas */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PriorityIcon color="warning" />
          🎯 Priority Improvement Areas
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {weakAreas.length > 0 
            ? 'Based on analysis of your test cases, these areas need the most attention:'
            : 'Great job! No significant weak areas identified. Your test cases maintain good quality across all metrics.'
          }
        </Typography>
        
        {weakAreas.length > 0 ? (
          <Grid container spacing={2}>
            {(() => {
              // Calculate actual average scores for display
              const getAreaScore = (area) => {
                if (!qualityReport?.individual_scores) return 'N/A';
                const scores = qualityReport.individual_scores
                  .map(test => test.scores?.[area])
                  .filter(score => score !== undefined && score !== null);
                if (scores.length === 0) return 'N/A';
                return (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1);
              };

              return weakAreas.map((area, index) => (
                <Grid item xs={12} md={6} key={area}>
                  <Alert 
                    severity="warning" 
                    sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
                    icon={<PriorityIcon />}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <Typography variant="body2" fontWeight="bold">
                        {area.charAt(0).toUpperCase() + area.slice(1)} Issues
                      </Typography>
                      <Chip 
                        label={`Avg: ${getAreaScore(area)}/10`}
                        color="warning"
                        size="small"
                        variant="filled"
                      />
                    </Box>
                  </Alert>
                </Grid>
              ));
            })()}
          </Grid>
        ) : (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              🎉 All quality metrics are performing well! Consider the detailed recommendations below for further optimization.
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Detailed Recommendations by Metric */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LightbulbIcon color="primary" />
          💡 Detailed Improvement Recommendations
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {qualityReport?.individual_scores?.length > 0 
            ? 'Recommendations based on AI analysis of your actual test cases:'
            : 'General recommendations to improve test case quality:'
          }
        </Typography>
        
        {Object.entries(recommendations).filter(([key]) => !['title', 'focus'].includes(key)).map(([metric, tips]) => {
          // Calculate metric-specific data
          const getMetricData = (metricName) => {
            if (!qualityReport?.individual_scores) return null;
            const scores = qualityReport.individual_scores
              .map(test => test.scores?.[metricName])
              .filter(score => score !== undefined && score !== null);
            if (scores.length === 0) return null;
            const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            const min = Math.min(...scores);
            const max = Math.max(...scores);
            return { avg, min, max, count: scores.length };
          };

          const metricData = getMetricData(metric);
          const isWeakArea = weakAreas.includes(metric);
          const hasRealSuggestions = tips.some(tip => 
            qualityReport?.individual_scores?.some(test => 
              test.suggestions?.includes(tip)
            )
          );

          return (
            <Accordion 
              key={metric} 
              sx={{ 
                mb: 1,
                border: isWeakArea ? '2px solid' : '1px solid',
                borderColor: isWeakArea ? 'warning.main' : 'divider'
              }}
              defaultExpanded={isWeakArea}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Typography variant="subtitle1" sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}>
                    📋 {metric.charAt(0).toUpperCase() + metric.slice(1)} Improvements
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                    {isWeakArea && (
                      <Chip label="Priority" color="warning" size="small" />
                    )}
                    {hasRealSuggestions && (
                      <Chip label="AI-Generated" color="primary" size="small" variant="outlined" />
                    )}
                    {metricData && (
                      <Chip 
                        label={`Avg: ${metricData.avg.toFixed(1)}/10`}
                        color={metricData.avg >= 8 ? 'success' : metricData.avg >= 6 ? 'warning' : 'error'}
                        size="small"
                        variant="filled"
                      />
                    )}
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {metricData && (
                  <Alert 
                    severity={metricData.avg >= 8 ? 'success' : metricData.avg >= 6 ? 'warning' : 'error'}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="body2">
                      <strong>Current Performance:</strong> Average {metricData.avg.toFixed(1)}/10 
                      (Range: {metricData.min.toFixed(1)} - {metricData.max.toFixed(1)}) 
                      across {metricData.count} test cases
                    </Typography>
                  </Alert>
                )}
                
                <List dense>
                  {tips.map((tip, index) => {
                    const isFromAnalysis = qualityReport?.individual_scores?.some(test => 
                      test.suggestions?.includes(tip)
                    );
                    
                    return (
                      <ListItem key={index} sx={{ pl: 0 }}>
                        <ListItemIcon>
                          <Typography variant="body2" color="primary" fontWeight="bold">
                            {isFromAnalysis ? '🤖' : '💡'}
                          </Typography>
                        </ListItemIcon>
                        <ListItemText 
                          primary={tip}
                          primaryTypographyProps={{ 
                            variant: 'body2',
                            fontWeight: isFromAnalysis ? 'medium' : 'normal'
                          }}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>

      {/* Quality Distribution Insights */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📊 Quality Distribution Insights
        </Typography>
        
        {distribution.low > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>{distribution.low} test case(s)</strong> scored below 6.0. These need immediate attention for clarity and completeness.
            </Typography>
          </Alert>
        )}
        
        {distribution.medium > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>{distribution.medium} test case(s)</strong> in medium range (6.0-7.9). Small improvements could boost these to high quality.
            </Typography>
          </Alert>
        )}
        
        {distribution.high > 0 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>{distribution.high} test case(s)</strong> already high quality (8.0+). Use these as templates for improving others.
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Requirement Enhancement Suggestions */}
      {(() => {
        const contextualRecs = qualityReport?.quality_insights?.contextual_recommendations;
        const requirementSuggestions = contextualRecs?.requirement_enhancement_suggestions || [];
        const hasBackendSuggestions = requirementSuggestions.length > 0;
        
        // Fallback static suggestions if backend doesn't provide any
        const staticSuggestions = [
          "Add specific acceptance criteria and business rules",
          "Include error handling and exception scenarios",
          testType.toLowerCase() === 'api' ? 
            'Add API endpoint details, request/response formats' :
            testType.toLowerCase() === 'unit' ?
            'Include function signatures, data types, and business logic' :
            'Add user interface details and workflow steps',
          "Include performance and scalability requirements"
        ];
        
        const suggestionsToShow = hasBackendSuggestions ? requirementSuggestions : staticSuggestions;
        
        return (
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              📄 Requirement Enhancement Suggestions
              {hasBackendSuggestions && (
                <Chip 
                  label="AI-Generated" 
                  color="primary" 
                  size="small" 
                  variant="outlined"
                />
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {hasBackendSuggestions 
                ? 'Based on AI analysis of your current requirement, these enhancements would improve test case quality:'
                : 'To generate higher quality test cases in the future, consider enhancing your requirements with:'
              }
            </Typography>
            
            <List dense>
              {suggestionsToShow.map((suggestion, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Typography variant="body2" color="primary" fontWeight="bold">
                      {hasBackendSuggestions ? '🤖' : '💡'}
                    </Typography>
                  </ListItemIcon>
                  <ListItemText 
                    primary={suggestion}
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      sx: { fontWeight: hasBackendSuggestions ? 'medium' : 'normal' }
                    }}
                  />
                </ListItem>
              ))}
            </List>
            
            {hasBackendSuggestions && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  💡 <strong>Tip:</strong> These suggestions are AI-generated based on analyzing gaps and vague areas in your current requirement. 
                  Implementing these improvements will help generate more comprehensive and specific test cases.
                </Typography>
              </Alert>
            )}
          </Paper>
        );
      })()}
    </Box>
  );
};

export default QualityAssessment;