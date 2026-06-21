import React from 'react';

const AnimatedCard = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`transform transition-all duration-300 hover:scale-105 hover:shadow-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default AnimatedCard;
