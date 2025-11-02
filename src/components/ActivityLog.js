import React, { useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
} from '@mui/material';

const ActivityLog = ({ logs }) => {
  const logEndRef = useRef(null);
  const logContainerRef = useRef(null);

  // Auto-scroll to bottom within the log container only
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const getLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      default:
        return 'primary';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        📊 Activity Log
      </Typography>

      <Paper 
        ref={logContainerRef}
        variant="outlined" 
        sx={{ 
          height: 'auto',
          maxHeight: 400,
          minHeight: 200,
          overflow: 'auto', 
          p: 2,
          backgroundColor: '#fafafa',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        }}
      >
        {logs.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Activity logs will appear here...
          </Typography>
        ) : (
          <Box>
            {logs.map((log) => (
              <Box key={log.id} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                {/* Timestamp */}
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    minWidth: 160, 
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: '0.75rem',
                    mt: 0.2
                  }}
                >
                  {log.timestamp}
                </Typography>
                
                {/* Level Badge */}
                <Chip
                  label={log.level.toUpperCase()}
                  color={getLevelColor(log.level)}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    minWidth: 70,
                    fontSize: '0.7rem',
                    height: 20,
                    '& .MuiChip-label': {
                      px: 1
                    }
                  }}
                />
                
                {/* Message */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    flex: 1,
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: '0.85rem',
                    lineHeight: 1.4,
                    wordBreak: 'break-word'
                  }}
                >
                  {getLevelIcon(log.level)} {log.message}
                </Typography>
              </Box>
            ))}
            <div ref={logEndRef} />
          </Box>
        )}
      </Paper>
      
      {logs.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {logs.length} log entries • Auto-scrolling enabled
        </Typography>
      )}
    </Box>
  );
};

export default ActivityLog;