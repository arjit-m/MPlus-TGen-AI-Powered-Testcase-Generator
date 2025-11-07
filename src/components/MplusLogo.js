import React from 'react';
import { Box } from '@mui/material';
import logoImage from '../assets/logo.png';

const MplusLogo = ({ size = 32, sx = {} }) => {
  return (
    <Box 
      component="img"
      src={logoImage}
      alt="M+ TGen Logo"
      sx={{ 
        width: size, 
        height: size, 
        display: 'inline-block',
        verticalAlign: 'middle',
        objectFit: 'contain',
        ...sx 
      }}
    />
  );
};

export default MplusLogo;