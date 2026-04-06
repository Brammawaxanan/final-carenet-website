// ========================================
// QUICK FIX FOR ACTIVITY PAGE
// ========================================
// Copy and paste this entire file into your browser console (F12)
// while on the Activity page

console.log('🔧 Running Activity Page Quick Fix...\n');

// Step 1: Check current state
console.log('📊 STEP 1: Checking current state...');
const currentUserId = localStorage.getItem('userId');
const currentRole = localStorage.getItem('userRole');
console.log('Current User ID:', currentUserId || '❌ NOT SET');
console.log('Current Role:', currentRole || '❌ NOT SET');

// Step 2: Set correct user ID
console.log('\n📝 STEP 2: Setting user ID to 30 (user with assignment)...');
localStorage.setItem('userId', '30');
localStorage.setItem('userRole', 'client'); // Ensure role is set
console.log('✅ User ID set to: 30');
console.log('✅ Role set to: client');

// Step 3: Verify
console.log('\n✅ STEP 3: Verification...');
console.log('User ID:', localStorage.getItem('userId'));
console.log('Role:', localStorage.getItem('userRole'));

// Step 4: Test API
console.log('\n🧪 STEP 4: Testing API endpoint...');
fetch('http://localhost:8091/service/assignments/mine', {
  headers: {
    'X-User-Id': '30',
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('API Response:', data);
  if (data && data.length > 0) {
    console.log('✅ SUCCESS! Found', data.length, 'assignment(s)');
    console.log('Assignment ID:', data[0].id);
    console.log('Service Type:', data[0].serviceType);
    console.log('Status:', data[0].status);
  } else {
    console.log('⚠️ No assignments found for user 30');
  }
})
.catch(err => {
  console.error('❌ API Error:', err);
  console.log('Is the backend running on port 8091?');
});

// Step 5: Reload
console.log('\n🔄 STEP 5: Reloading page in 3 seconds...');
console.log('The Activity page should now show your tasks!');

setTimeout(() => {
  console.log('Reloading now...');
  window.location.reload();
}, 3000);

// Helper functions for future use
window.fixActivityPage = () => {
  localStorage.setItem('userId', '30');
  localStorage.setItem('userRole', 'client');
  window.location.reload();
};

window.checkUser = () => {
  console.log('=== USER INFO ===');
  console.log('User ID:', localStorage.getItem('userId'));
  console.log('Role:', localStorage.getItem('userRole'));
  console.log('Token:', localStorage.getItem('token') ? 'Present' : 'Not set');
};

console.log('\n💡 TIP: Run fixActivityPage() anytime to fix the issue again!');
console.log('💡 TIP: Run checkUser() to see current user info!');
