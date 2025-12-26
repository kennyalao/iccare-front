<template>
  <header class="main-header">
    <div class="logo">
      <router-link to="/">🔐 Auth&RBA System</router-link>
    </div>
    <nav class="main-nav">
      <router-link to="/" class="nav-link">Home</router-link>

      <template v-if="isLoggedIn">
        <router-link to="/admin" class="nav-link">Admin Dashboard</router-link>
        <button @click="handleSignOut" class="btn-signout">Sign Out</button>
      </template>

      <template v-else>
        <router-link to="/signin" class="nav-link">Sign In</router-link>
        <router-link to="/signup" class="nav-link">Sign Up</router-link>
      </template>
    </nav>
  </header>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue';
// import { useRouter } from 'vue-router'; // Uncomment if using Vue Router 

// const router = useRouter(); // Uncomment if using Vue Router

// --- State Management Placeholder ---
// In a real application, you would replace this computed property 
// with a getter from your Pinia/Vuex store that verifies the JWT.
const isLoggedIn = computed(() => {
  // Check if a token exists in localStorage
  return !!localStorage.getItem('auth_token');
});

// Optional: Use watchEffect to force component refresh when token changes
watchEffect(() => {
  // This watches the reactive value of isLoggedIn and can trigger
  // updates if authentication state changes outside of this component.
  console.log('Auth state:', isLoggedIn.value ? 'Logged In' : 'Logged Out');
});


// --- Methods ---

const handleSignOut = () => {
  // 1. Remove the JWT token
  localStorage.removeItem('auth_token');

  // 2. Optionally, clear any user data from global store
  // store.clearUser();

  // 3. Inform the user and redirect to the home page or login page
  alert("You have been signed out.");
  
  // Use a router navigation for seamless redirect (uncomment import/const above)
  // router.push('/'); 
};
</script>

<style scoped>
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background-color: #343a40; /* Dark background */
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.logo a {
  color: white;
  text-decoration: none;
  font-size: 1.5em;
  font-weight: bold;
}

.main-nav {
  display: flex;
  gap: 20px;
  align-items: center;
}

.nav-link {
  color: #adb5bd; /* Light gray text */
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.nav-link:hover {
  color: white;
}

.btn-signout {
  background-color: #dc3545; /* Red for signout */
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-signout:hover {
  background-color: #c82333;
}
</style>
