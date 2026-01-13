// Validate email format
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const allowedEmailDomains = [
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'yahoo.com',
  'ymail.com'
];

const isAllowedEmailDomain = (email) => {
  if (!email) return false;
  const domain = String(email).split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return allowedEmailDomains.includes(domain);
};

// Validate password strength
export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return re.test(password);
};

// Validate required field
export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

// Validate task form
export const validateTaskForm = (formData) => {
  const errors = {};

  if (!validateRequired(formData.title)) {
    errors.title = 'Title is required';
  }

  if (!validateRequired(formData.priority)) {
    errors.priority = 'Priority is required';
  }

  if (!validateRequired(formData.status)) {
    errors.status = 'Status is required';
  }

  if (formData.deadline) {
    const deadline = new Date(formData.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (deadline < today) {
      errors.deadline = 'Deadline cannot be in the past';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate project form
export const validateProjectForm = (formData) => {
  const errors = {};

  if (!validateRequired(formData.name)) {
    errors.name = 'Project name is required';
  }

  if (formData.name && formData.name.length < 3) {
    errors.name = 'Project name must be at least 3 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate login form
export const validateLoginForm = (formData) => {
  const errors = {};

  if (!validateRequired(formData.email)) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Invalid email format';
  } else if (!isAllowedEmailDomain(formData.email)) {
    errors.email = 'Use a Gmail, Hotmail, Outlook, or Yahoo address';
  }

  if (!validateRequired(formData.password)) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate register form
export const validateRegisterForm = (formData) => {
  const errors = {};

  if (!validateRequired(formData.name)) {
    errors.name = 'Name is required';
  } else if (formData.name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!validateRequired(formData.email)) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Invalid email format';
  }

  if (!validateRequired(formData.password)) {
    errors.password = 'Password is required';
  } else if (!validatePassword(formData.password)) {
    errors.password = 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number';
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
