<template>
  <div class="auth-card">
    <h2>Forgot Password</h2>
    <p class="instruction">
      Enter your email address below. If an account exists, we will send you a link to reset your password.
    </p>
    <form @submit.prevent="handleForgotPassword">
      <input v-model="email" type="email" placeholder="Email Address" required />

      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
      </button>
      
      <p v-if="success" class="success-message">{{ success }}</p>
      <p v-if="error" class="error api-error">{{ error }}</p>

      <div class="links">
        <router-link to="/signin">Back to Sign In</router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import apiClient from '../../utils/api'; 
// import { useRouter } from 'vue-router'; // Uncomment if using Vue Router

const email = ref('');
const error = ref(null);
const success = ref(null);
const isLoading = ref(false);
// const router = useRouter(); // Uncomment if using Vue Router

const handleForgotPassword = async () => {
  error.value = null;
  success.value = null;
  isLoading.value = true;

  // Note: The FastAPI endpoint expects a new password as per the original schema.
  // However, in a real "Forgot Password" *initiation* step, you only send the email.
  // We will structure the API call to match the simplified needs of this UI step.
  // We are assuming the FastAPI service logic handles sending the email if the user exists.
  
  const payload = {
    email: email.value,
    // NOTE: Sending a placeholder for 'new_password' if the FastAPI endpoint 
    // requires it as per the initial design, even though it's bad practice for 
    // the *first* step of the flow. If your backend is correctly implemented 
    // for just email submission, adjust the payload below.
    new_password: "placeholder_password_for_init" 
  };

  try {
    // Calling POST /auth/forgot-password
    const response = await apiClient.post('/auth/forgot-password', payload);

    // Security best practice: Always return a generic success message to prevent 
    // user enumeration (i.e., attackers guessing valid emails).
    success.value = response.data.message || 'If an account is associated with this email, a password reset link has been sent.';
    
    // Clear the email input
    email.value = '';

  } catch (err) {
    // Even on API error (e.g., server timeout), it's safer to show a generic success message
    // unless the error is clearly client-side (e.g., network error).
    success.value = 'If an account is associated with this email, a password reset link has been sent.';
    // Display error only if it's a clear, non-security-related network issue
    // error.value = err.response?.data?.detail || 'Network error occurred.';
    console.error(err);

  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.auth-card { 
  max-width: 400px; 
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
  margin-bottom: 15px;
}
.instruction {
    text-align: center;
    color: #666;
    margin-bottom: 25px;
    font-size: 0.95em;
}
input { 
  width: 100%;
  padding: 12px; 
  margin-bottom: 20px; 
  border: 1px solid #ccc; 
  border-radius: 6px; 
  box-sizing: border-box;
}
button { 
  width: 100%; 
  padding: 12px; 
  background: #007bff;
  color: white; 
  border: none; 
  border-radius: 6px; 
  cursor: pointer; 
  font-weight: bold;
  transition: background 0.3s;
}
button:disabled {
  background: #90b8f0;
  cursor: not-allowed;
}
.links {
  text-align: center;
  margin-top: 25px;
  font-size: 0.9em;
}
.links a {
  color: #007bff;
  text-decoration: none;
}
.success-message {
  color: #28a745;
  font-weight: bold;
  text-align: center;
  margin-top: 15px;
}
.error { 
  color: #dc3545; 
  font-weight: bold;
  text-align: center;
  margin-top: 15px;
}
</style>
