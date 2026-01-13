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
  if (!email || typeof email !== 'string') return false;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return allowedEmailDomains.includes(domain);
};

export { allowedEmailDomains, isAllowedEmailDomain };
