<template>
  <div class="admin-panel">
    <h2>Role Management (Admin)</h2>
    <form @submit.prevent="createRole">
      <div class="form-group">
        <label for="roleType">Role Type (e.g., Lab Manager)</label>
        <input id="roleType" v-model="role.role_type" required />
      </div>
      
      <div class="form-group">
        <label for="roleFunction">Function Description</label>
        <textarea id="roleFunction" v-model="role.role_function"></textarea>
      </div>

      <div class="form-group">
        <label for="rights">Function Rights (JSON format)</label>
        <textarea id="rights" v-model="rightsInput"></textarea>
      </div>
      
      <div class="form-group">
        <label for="status">Status</label>
        <select id="status" v-model="role.status">
          <option value="Enabled">Enabled</option>
          <option value="Disabled">Disabled</option>
        </select>
      </div>
      
      <button type="submit">Create New Role</button>
      <p v-if="message" class="message">{{ message }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import apiClient from '../../utils/api';

const role = ref({
  role_type: '',
  role_function: '',
  expiration_date: null,
  status: 'Enabled',
});

const rightsInput = ref('{"function_name": "samples", "rights": ["read", "create"]}'); 
const message = ref(null);
const error = ref(null);

const createRole = async () => {
  message.value = null;
  error.value = null;

  // Prepare data, parsing rights JSON
  let roleData = { ...role.value };
  try {
    roleData.role_function_rights = JSON.parse(rightsInput.value);
  } catch (e) {
    error.value = "Invalid JSON format for Function Rights.";
    return;
  }
  
  try {
    const response = await apiClient.post('/user/roles', roleData);
    message.value = response.data.message || `Role ${role.value.role_type} created successfully!`;
    
    // Clear form
    role.value = { role_type: '', role_function: '', expiration_date: null, status: 'Enabled' };
    rightsInput.value = '{"function_name": "samples", "rights": ["read", "create"]}';
    
  } catch (err) {
    error.value = err.response?.data?.detail || 'Failed to create role.';
    console.error(err);
  }
};
</script>

<style scoped>
.admin-panel { max-width: 600px; margin: 50px auto; padding: 20px; border: 1px solid #007bff; border-radius: 8px; }
.form-group { margin-bottom: 15px; }
label { display: block; margin-bottom: 5px; font-weight: bold; }
input[type="text"], textarea, select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
button { padding: 10px 20px; background: #28a745; color: white; border: none; cursor: pointer; border-radius: 4px; }
.error { color: red; margin-top: 10px; }
.message { color: green; margin-top: 10px; }
</style>
