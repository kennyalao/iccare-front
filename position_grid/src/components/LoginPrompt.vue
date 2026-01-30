<script setup>
import { ref, computed } from 'vue'

const email = ref('admin5@iccare.com')
const password = ref('AdminSecurePass123!')
const isTokenSet = ref(!!localStorage.getItem('access_token'))
const isLoading = ref(false)
const errorMessage = ref('')

const signIn = async () => {
  if (!email.value.trim() || !password.value.trim()) {
    errorMessage.value = 'Please enter both email and password'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch('https://iccare.desmarttrader.com/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value.trim(),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Login failed: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.access_token) {
      throw new Error('No access token received from server')
    }

    localStorage.setItem('access_token', data.access_token)
    isTokenSet.value = true
    email.value = ''
    password.value = ''

    // Reload page to refresh all components
    window.location.reload()
  } catch (error) {
    errorMessage.value = error.message || 'Login failed. Please try again.'
    console.error('Login error:', error)
  } finally {
    isLoading.value = false
  }
}

const clearToken = () => {
  localStorage.removeItem('access_token')
  isTokenSet.value = false
}

const currentToken = computed(() => {
  const t = localStorage.getItem('access_token')
  if (!t) return null
  return t.length > 20 ? `${t.substring(0, 20)}...` : t
})
</script>

<template>
  <div class="login-prompt">
    <!-- Token Already Set -->
    <div v-if="isTokenSet" class="token-status success">
      <div class="flex items-center justify-between">
        <div>
          <div>
            <span class="font-semibold text-green-800">Authenticated</span>
          </div>
          <p class="text-xs text-gray-600 mt-1 font-mono">{{ currentToken }}</p>
        </div>
        <button
          @click="clearToken"
          class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>

    <!-- Token Not Set -->
    <div v-else class="token-status warning">
      <div class="mb-3">
        <span class="font-semibold text-yellow-800">Authentication Required</span>
      </div>

      <p class="text-sm text-gray-700 mb-3">
        Please sign in to access the biospecimen management system.
      </p>

      <div v-if="errorMessage" class="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="signIn" class="space-y-2">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="Enter your email"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            :disabled="isLoading"
            required
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter your password"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            :disabled="isLoading"
            required
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {{ isLoading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-prompt {
  margin-bottom: 1.5rem;
}

.token-status {
  padding: 1rem;
  border-radius: 0.5rem;
  border: 2px solid;
}

.token-status.success {
  background-color: #f0fdf4;
  border-color: #86efac;
}

.token-status.warning {
  background-color: #fffbeb;
  border-color: #fcd34d;
}
</style>
