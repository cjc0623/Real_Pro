import React from 'react';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useMediaQuery, useTheme } from '@mui/material';

const getBtnStyle = (isMobile) => ({
  width: isMobile ? '52px' : '64px', 
  height: isMobile ? '52px' : '64px', 
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 10px 20px rgba(239, 68, 68, 0.3)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 0,
  transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
  outline: 'none'
});

const FloatingButtons = ({ isOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return ( // Added return statement
    <div className="flex flex-col items-center">
      {/* 가이드 버튼 */}
      <button 
        onClick={() => window.location.href = '/guide'} 
        style={{...getBtnStyle(isMobile), background: isOpen ? '#334155' : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', transform: isOpen ? 'scale(0.9)' : 'scale(1)'}}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <MenuBookIcon style={{ fontSize: isMobile ? '20px' : '24px', marginBottom: '1px' }} />
          <span style={{ fontSize: isMobile ? '8px' : '11px', fontWeight: '900', letterSpacing: '-0.2px' }}>가이드</span>
        </div>
      </button>
    </div>
  );
};


export default FloatingButtons;