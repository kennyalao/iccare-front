<template>
  <div class="auth-card">
    <h2>Create User Account (Sign Up)</h2>
    <form @submit.prevent="handleSignUp">
      <div class="input-group">
        <input v-model="form.first_name" type="text" placeholder="First Name" required />
        <input v-model="form.last_name" type="text" placeholder="Last Name" required />
      </div>

      <input v-model="form.email" type="email" placeholder="Email Address" required />

      <input v-model="form.password" type="password" placeholder="Password (Min 8 characters)" minlength="8" required />
      <input v-model="form.password_confirm" type="password" placeholder="Confirm Password" required />
      
      <p v-if="passwordsMismatch" class="error">
        ⚠️ Passwords do not match.
      </p>

      <button type="submit" :disabled="passwordsMismatch">Sign Up</button>
      
      <div class="links">
        <p>Already have an account? <router-link to="/signin">Sign In</router-link></p>
      </div>

      <p v-if="success" class="success-message">{{ success }}</p>
      <p v-if="error" class="error api-error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import apiClient from '../../utils/api'; 
// import { useRouter } from 'vue-router'; // Uncomment if using Vue Router

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  password_confirm: '',
});

const error = ref(null);
const success = ref(null);
// const router = useRouter(); // Uncomment if using Vue Router

// Computed property to check if passwords match
const passwordsMismatch = computed(() => {
  return form.value.password !== form.value.password_confirm;
});

const handleSignUp = async () => {
  error.value = null;
  success.value = null;

  if (passwordsMismatch.value) {
    return; // Already handled by UI/disabled button
  }
  
  // Exclude password_confirm as it's not needed by the backend endpoint
  const payload = {
    first_name: form.value.first_name,
    last_name: form.value.last_name,
    email: form.value.email,
    password: form.value.password,
    password_confirm: form.value.password_confirm, // Send confirmation for FastAPI Pydantic validation
  };

  try {
    const response = await apiClient.post('/auth/signup', payload);

    success.value = `Account created successfully for ${response.data.email}! Please proceed to sign in.`;
    
    // Clear form after success
    form.value = { first_name: '', last_name: '', email: '', password: '', password_confirm: '' };
    
    // Optional: Redirect to login page
    // setTimeout(() => router.push('/signin'), 2000); 

  } catch (err) {
    // Handle API validation errors (e.g., email already exists, password too short)
    error.value = err.response?.data?.detail || 'Sign Up failed due to a server error.';
    console.error(err);
  }
};
</script>

<style scoped>
.auth-card { 
  max-width: 450px; 
  margin: 50px auto; 
  padding: 30px; 
  border: 1px solid #ddd; 
  border-radius: 10px; 
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  background-color: #fff;
}
h2 {
  text-align: center;
  color: #333;
  margin-bottom: 25px;
}
.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
input { 
  flex-grow: 1;
  padding: 12px; 
  margin-bottom: 15px; 
  border: 1px solid #ccc; 
  border-radius: 6px; 
  box-sizing: border-box;
}
button { 
  width: 100%; 
  padding: 12px; 
  background: #28a745; /* Green for creation */
  color: white; 
  border: none; 
  border-radius: 6px; 
  cursor: pointer; 
  font-weight: bold;
  transition: background 0.3s;
}
button:disabled {
  background: #90ee90;
  cursor: not-allowed;
}
.error { 
  color: #dc3545; 
  font-size: 0.9em;
  margin-top: -10px;
  margin-bottom: 15px;
}
.api-error {
  margin-top: 15px;
  font-weight: bold;
  text-align: center;
}
.success-message {
  color: #28a745;
  font-weight: bold;
  text-align: center;
  margin-top: 15px;
}
.links p {
  text-align: center;
  margin-top: 20px;
  font-size: 0.9em;
}
.links a {
  color: #007bff;
  text-decoration: none;
}
</style>
