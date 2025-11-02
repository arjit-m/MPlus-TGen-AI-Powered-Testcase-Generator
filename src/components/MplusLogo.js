import React from 'react';
import { Box } from '@mui/material';

const MplusLogo = ({ size = 32, color = 'currentColor', sx = {} }) => {
  return (
    <Box 
      component="svg" 
      sx={{ 
        width: size, 
        height: size, 
        display: 'inline-block',
        verticalAlign: 'middle',
        ...sx 
      }}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* M+ Logo matching the provided design */}
      <g fill={color}>
        {/* M Letter - Bold, clean design */}
        <path d="M40 150 L40 330 L80 330 L80 225 L140 300 L160 300 L220 225 L220 330 L260 330 L260 150 L210 150 L150 240 L90 150 Z"/>
        
        {/* Plus Sign - Clean, modern style */}
        <rect x="300" y="150" width="40" height="180"/>
        <rect x="270" y="210" width="100" height="40"/>
      </g>
    </Box>
  );
};

export default MplusLogo;