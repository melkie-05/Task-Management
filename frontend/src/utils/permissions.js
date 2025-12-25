export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
  } catch { return null; }
};

export const hasPermission = (user, permission) => {
  if (!user || !user.permissions) return false;
  return user.permissions.includes(permission);
};

export const hasAnyPermission = (user, permissions = []) => {
  if (!user || !user.permissions) return false;
  return permissions.some(p => user.permissions.includes(p));
};
