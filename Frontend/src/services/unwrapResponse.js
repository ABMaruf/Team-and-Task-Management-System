export const unwrapResponse = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload.data;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'user')) {
    return payload.user;
  }

  return payload;
};
