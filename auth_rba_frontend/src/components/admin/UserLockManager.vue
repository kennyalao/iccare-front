<template>
  <div class="admin-panel">
    <h2>User Lockout Manager (Admin)</h2>
    
    <div class="search-form">
      <input v-model="searchUserId" type="text" placeholder="Enter User ID to Search" />
      <button @click="fetchLockStatus">Search Status</button>
    </div>

    <div v-if="lockStatus" class="status-card">
      <h3>Status for User: {{ lockStatus.user_id }}</h3>
      <p :class="{ 'locked-status': lockStatus.is_locked }">
        **Lock Status:** {{ lockStatus.is_locked ? 'LOCKED' : 'UNLOCKED' }}
      </p>
      <p>Failed Attempts: {{ lockStatus.failed_login_attempts }}</p>
      <p v-if="lockStatus.lockout_until">Lockout Until: {{ new Date(lockStatus.lockout_until).toLocaleString() }}</p>
      
      <button 
        @click="toggleLock(lockStatus.user_id, !lockStatus.is_locked)"
        :class="lockStatus.is_locked ? 'btn-unlock' : 'btn-lock'"
      >
        {{ lockStatus.is_locked ? 'Unlock User' : 'Lock User' }}
      </button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import apiClient from '../../utils/api';

const searchUserId = ref('');
const lockStatus = ref(null);
const error = ref(null);

const fetchLockStatus = async () => {
  error.value = null;
  lockStatus.value = null;
  if (!searchUserId.value) return;

  try {
    const response = await apiClient.get(`/user/lock-status/${searchUserId.value}`);
    lockStatus.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.detail || 'Could not fetch user lock status.';
    console.error(err);
  }
};

const toggleLock = async (userId, newStatus) => {
  error.value = null;
  try {
    await apiClient.put('/user/lock-status', {
      user_id: userId,
      lu_status: newStatus,
    });
    alert(`User ${userId} status updated to ${newStatus ? 'LOCKED' : 'UNLOCKED'}.`);
    // Refresh status after successful update
    fetchLockStatus(); 
  } catch (err) {
    error.value = err.response?.data?.detail || 'Failed to change lock status.';
    console.error(err);
  }
};
</script>

<style scoped>
.search-form { display: flex; gap: 10px; margin-bottom: 20px; }
.status-card { border: 1px solid #f0ad4e; padding: 15px; border-radius: 4px; margin-top: 20px; }
.locked-status { color: red; font-weight: bold; }
.btn-lock { background: #dc3545; color: white; padding: 8px 15px; border: none; cursor: pointer; border-radius: 4px; margin-top: 10px; }
.btn-unlock { background: #007bff; color: white; padding: 8px 15px; border: none; cursor: pointer; border-radius: 4px; margin-top: 10px; }
.error { color: red; }
</style>
