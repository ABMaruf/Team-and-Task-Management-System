import React from 'react';
import { getInitials, getAvatarColor } from '../../utils/helpers';

const Avatar = ({ user, size = 'md', className = '' }) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };

  if (!user) return null;

  if (user.profile_picture) {
    return (
      <img
        src={user.profile_picture}
        alt={user.name}
        className={`${sizes[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`${sizes[size]} ${getAvatarColor(user.name)} rounded-full flex items-center justify-center text-white font-semibold ${className}`}>
      {getInitials(user.name)}
    </div>
  );
};

export default Avatar;