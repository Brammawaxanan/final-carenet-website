// Test User Helper - Use this to quickly switch between users
// PASTE THIS IN BROWSER CONSOLE (F12) TO SET USER ID

export const setTestUser = (userId) => {
  localStorage.setItem('userId', userId.toString());
  console.log(`✅ User ID set to: ${userId}`);
  console.log('Reloading page...');
  setTimeout(() => window.location.reload(), 500);
};

export const getUserInfo = () => {
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const token = localStorage.getItem('token');
  
  console.log('=== Current User Info ===');
  console.log('User ID:', userId || 'NOT SET ❌');
  console.log('User Role:', userRole || 'NOT SET ❌');
  console.log('Token:', token ? 'Present ✅' : 'NOT SET ❌');
  console.log('========================');
  
  return { userId, userRole, token };
};

// Quick switch functions
export const switchToUserWithAssignment = () => setTestUser(30);
export const switchToUserWithoutAssignment = () => setTestUser(1);
export const switchToCaregiver = () => {
  localStorage.setItem('userId', '33'); // peter (caregiver)
  localStorage.setItem('userRole', 'caregiver');
  setTimeout(() => window.location.reload(), 500);
};

// For browser console - make these available globally
if (typeof window !== 'undefined') {
  window.setUser = setTestUser;
  window.getUserInfo = getUserInfo;
  window.userWithAssignment = switchToUserWithAssignment;
  window.userWithoutAssignment = switchToUserWithoutAssignment;
  window.switchToCaregiver = switchToCaregiver;
  
  console.log('🔧 Test User Helper Loaded!');
  console.log('Available commands:');
  console.log('  setUser(30)           - Set specific user ID');
  console.log('  getUserInfo()         - Show current user info');
  console.log('  userWithAssignment()  - Switch to user 30 (has assignment)');
  console.log('  userWithoutAssignment() - Switch to user 1 (no assignment)');
  console.log('  switchToCaregiver()   - Switch to caregiver view');
}

export default {
  setTestUser,
  getUserInfo,
  switchToUserWithAssignment,
  switchToUserWithoutAssignment,
  switchToCaregiver
};
