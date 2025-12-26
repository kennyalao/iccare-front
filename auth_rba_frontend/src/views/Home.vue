<template>
  <div class="home-page">
    <div class="hero-section">
      <h1>Welcome to the Auth & RBA Microservice Frontend</h1>
      <p class="tagline">Your secure gateway for biospecimen data management, featuring robust authentication and compliance controls.</p>
    </div>

    <div class="action-section">
      <h2>Start Your Secure Session</h2>
      <p>This microservice handles all aspects of **User Authentication**, **Role-Based Access (RBA)**, and **Account Security** (including lockouts and auditing).</p>
      
      <div class="button-group">
        <router-link to="/signin" class="btn btn-primary">
          Sign In to Access Data
        </router-link>
        <router-link to="/signup" class="btn btn-secondary">
          Create New Account
        </router-link>
      </div>

      <div class="admin-link">
        <p>Are you an Administrator? Access the <router-link to="/admin">Admin Dashboard</router-link>.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Placeholder for logic to check if the user is already logged in
const isLoggedIn = computed(() => {
  return !!localStorage.getItem('auth_token');
});
</script>

<style scoped>
.home-page {
  text-align: center;
  padding: 40px 20px;
  max-width: 1000px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

/* --- Hero Section --- */
.hero-section {
  padding: 80px 0;
  background-color: #f4f6f8;
  border-radius: 12px;
  margin-bottom: 40px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
}

.hero-section h1 {
  font-size: 3em;
  color: #007bff;
  margin-bottom: 15px;
}

.tagline {
  font-size: 1.2em;
  color: #6c757d;
  max-width: 600px;
  margin: 0 auto;
}

/* --- Action Section --- */
.action-section {
  padding: 30px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background-color: white;
}

.action-section h2 {
  color: #343a40;
  margin-bottom: 20px;
}

.button-group {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 20px;
}

.btn {
  padding: 12px 25px;
  font-size: 1.1em;
  text-decoration: none;
  border-radius: 6px;
  font-weight: bold;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: transparent;
  color: #007bff;
  border-color: #007bff;
}

.btn-secondary:hover {
  background-color: #e9ecef;
  color: #0056b3;
}

.admin-link {
  margin-top: 40px;
  font-size: 0.9em;
  color: #495057;
}

.admin-link a {
  color: #28a745; /* Green color for admin link */
  text-decoration: none;
  font-weight: bold;
}
</style>
