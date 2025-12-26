
<script setup>
import { ref } from 'vue';
import apiClient from '../../utils/api';
// import { useRouter } from 'vue-router'; // Placeholder for actual routing

const email = ref('');
const password = ref('');
const error = ref(null);
// const router = useRouter();

const handleSignIn = async () => {
  error.value = null;
  try {
    const response = await apiClient.post('/auth/signin', {
      email: email.value,
      password: password.value,
    });

    const token = response.data.access_token;
    
    // Store the JWT token for subsequent API calls
    localStorage.setItem('auth_token', token);
    
    alert('Sign in successful! Token stored.');
    
    // Redirect to the protected dashboard or home page
    // router.push('/dashboard'); 
    
  } catch (err) {
    error.value = err.response?.data?.detail || 'Sign In failed. Check credentials.';
    console.error(err);
  }
};
</script>

<style scoped>
.auth-card { max-width: 400px; margin: 50px auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px; }
input { width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; }
button { width: 100%; padding: 10px; background: #007bff; color: white; border: none; cursor: pointer; }
.error { color: red; margin-top: 10px; }
.links a { margin-right: 15px; font-size: 0.9em; }
</style>
