import React from 'react';

const AnimatedCard = ({ className = '', children, variant = '', ...props }) => {
  const glow = variant === 'glow' ? 'ring-1 ring-orange-300/30 dark:ring-orange-700/30' : '';
  return (
    <div
      className={`transform transition-all duration-300 hover:scale-105 hover:shadow-lg ${glow} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default AnimatedCard;
