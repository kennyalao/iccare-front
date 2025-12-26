<template>
  <div class="admin-dashboard">
    <div class="header-section">
      <h1>Admin & Compliance Dashboard</h1>
      <p class="welcome-message">Manage user roles, access control, and security features.</p>
    </div>

    <div class="dashboard-grid">
      
      <section class="admin-card">
        <h2>🔒 User Lockout & Status</h2>
        <p class="section-description">
          Search for users by ID to view their current lockout status, failed login attempts, 
          and manually lock or unlock accounts (Authentication::LockUnlock).
        </p>
        <UserLockManager />
      </section>

      <section class="admin-card">
        <h2>🛡️ Role Definition & Assignment</h2>
        <p class="section-description">
          Define new roles (e.g., FieldCollector, Lab Manager) with specific function rights, 
          and assign them to existing users (User::RoleManagement).
        </p>
        <RoleManager />
      </section>

    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
// Import the specialized admin components
import RoleManager from '../components/admin/RoleManager.vue';
import UserLockManager from '../components/admin/UserLockManager.vue';

// In a real application, you would load admin-specific data here.
onMounted(() => {
  // Example: Verify the user's token and role again on mount
  console.log('AdminDashboard mounted. Verifying user role...');
  // const userRole = store.getUserRole();
  // if (userRole !== 'Admin') {
  //   // router.push('/403');
  // }
});
</script>

<style scoped>
.admin-dashboard {
  padding: 30px;
  max-width: 1400px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.header-section {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

h1 {
  color: #007bff;
  font-size: 2.5em;
  margin-bottom: 10px;
}

.welcome-message {
  color: #6c757d;
  font-size: 1.1em;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Two columns for the main components */
  gap: 30px;
}

.admin-card {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border-top: 5px solid #007bff; /* Accent color on top */
}

.admin-card h2 {
  color: #343a40;
  font-size: 1.7em;
  margin-top: 0;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.section-description {
  color: #6c757d;
  margin-bottom: 25px;
  font-style: italic;
  line-height: 1.5;
}

/* Responsive adjustments for smaller screens */
@media (max-width: 992px) {
  .dashboard-grid {
    grid-template-columns: 1fr; /* Stack components on smaller screens */
  }
}
</style>
