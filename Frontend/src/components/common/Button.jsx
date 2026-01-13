import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  icon = null
}) => {
  const { darkMode } = useTheme();
  const baseClasses = 'font-medium rounded-lg transition-all flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg disabled:opacity-50',
    secondary: darkMode
      ? 'bg-gray-700 text-gray-100 hover:bg-gray-600 disabled:opacity-50'
      : 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50',
    danger: 'bg-red-500 text-white hover:bg-red-600 disabled:opacity-50',
    ghost: darkMode
      ? 'bg-transparent border-2 border-gray-600 text-gray-200 hover:bg-gray-700 disabled:opacity-50'
      : 'bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50',
    success: 'bg-green-500 text-white hover:bg-green-600 disabled:opacity-50'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
