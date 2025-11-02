import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  CircularProgress,
  Backdrop,
} from '@mui/material';

const LoadingOverlay = ({ open, message, detail }) => {
  return (
    <Dialog
      open={open}
      PaperProps={{
        style: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
          overflow: 'hidden',
        },
      }}
      BackdropComponent={Backdrop}
      BackdropProps={{
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        },
      }}
    >
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            py: 4,
            px: 6,
            backgroundColor: 'white',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          }}
        >
          {/* Loading Spinner */}
          <CircularProgress 
            size={60} 
            sx={{ 
              mb: 3,
              color: 'primary.main',
            }} 
          />
          
          {/* Main Message */}
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              fontWeight: 'bold',
              color: 'text.primary',
              mb: 1
            }}
          >
            {message}
          </Typography>
          
          {/* Detail Message */}
          {detail && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                maxWidth: 300,
                lineHeight: 1.5
              }}
            >
              {detail}
            </Typography>
          )}
          
          {/* Animated dots */}
          <Box sx={{ mt: 2, display: 'flex', gap: 0.5 }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`,
                  '@keyframes pulse': {
                    '0%, 80%, 100%': {
                      opacity: 0.3,
                      transform: 'scale(0.8)',
                    },
                    '40%': {
                      opacity: 1,
                      transform: 'scale(1)',
                    },
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LoadingOverlay;