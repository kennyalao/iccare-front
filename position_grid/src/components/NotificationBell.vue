<template>
  <div class="notification-bell-container" ref="dropdownRef">
    <button
      class="notification-bell-button"
      @click="toggleDropdown"
      aria-label="Notifications"
      title="Notifications"
    >
      🔔
      <span v-if="unreadCount > 0" class="notification-badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <div v-if="isOpen" class="notification-dropdown">
      <div class="notification-header">
        <h3>Notifications</h3>
        <button
          v-if="unreadCount > 0"
          @click="markAllAsRead"
          class="mark-all-read"
        >
          Mark all read
        </button>
      </div>

      <div class="notification-list">
        <!-- Loading State -->
        <div v-if="loading && notifications.length === 0" class="notification-loading">
          Loading...
        </div>

        <!-- Error State -->
        <div v-if="error" class="notification-error">
          Failed to load notifications: {{ error }}
        </div>

        <!-- Empty State -->
        <div v-if="!loading && notifications.length === 0" class="no-notifications">
          <span class="no-notifications-icon">🔕</span>
          <p>No notifications</p>
        </div>

        <!-- Notification Items -->
        <div
          v-for="notification in notifications"
          :key="notification.notification_id"
          :class="[
            'notification-item',
            { 'unread': !notification.read },
            `priority-${notification.priority}`
          ]"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon">
            {{ getPriorityIcon(notification.priority) }}
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">
              {{ formatTimestamp(notification.timestamp) }}
            </div>
          </div>
          <div v-if="!notification.read" class="unread-dot"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useNotifications } from '../composables/useNotifications';

const props = defineProps({
  token: {
    type: String,
    required: true
  }
});

const isOpen = ref(false);
const dropdownRef = ref(null);

const tokenRef = computed(() => props.token);
const {
  notifications,
  unreadCount,
  loading,
  error,
  markAsRead,
  markAllAsRead
} = useNotifications(tokenRef);

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const handleNotificationClick = async (notification) => {
  // Mark as read if not already read
  if (!notification.read) {
    await markAsRead(notification.notification_id);
  }

  // Navigate to relevant page if action_url exists
  if (notification.action_url) {
    window.location.href = notification.action_url;
  }

  // Close dropdown
  isOpen.value = false;
};

const getPriorityIcon = (priority) => {
  switch (priority) {
    case 'urgent': return '🚨';
    case 'high': return '⚠️';
    case 'normal': return '📢';
    default: return '📌';
  }
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString();
};

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});
</script>

<style scoped>
/* Container */
.notification-bell-container {
  position: relative;
  display: inline-block;
}

/* Bell Button */
.notification-bell-button {
  position: relative;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.notification-bell-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* Badge */
.notification-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ff4444;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: bold;
  min-width: 18px;
  text-align: center;
}

/* Dropdown */
.notification-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 420px;
  max-height: 600px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  overflow: hidden;
}

/* Header */
.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.notification-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.mark-all-read {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.mark-all-read:hover {
  background-color: rgba(0, 123, 255, 0.1);
}

/* Notification List */
.notification-list {
  max-height: 500px;
  overflow-y: auto;
}

.notification-list::-webkit-scrollbar {
  width: 8px;
}

.notification-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.notification-list::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.notification-list::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* Notification Item */
.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.notification-item:hover {
  background: #f8f9fa;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item.unread {
  background: #e3f2fd;
}

.notification-item.unread:hover {
  background: #d1e7f9;
}

/* Priority Colors */
.notification-item.priority-urgent {
  border-left: 4px solid #ff0000;
}

.notification-item.priority-high {
  border-left: 4px solid #ff9800;
}

.notification-item.priority-normal {
  border-left: 4px solid #2196f3;
}

/* Notification Icon */
.notification-icon {
  font-size: 24px;
  flex-shrink: 0;
  margin-top: 2px;
}

/* Notification Content */
.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: #333;
  font-size: 14px;
}

.notification-message {
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

/* Unread Dot */
.unread-dot {
  width: 8px;
  height: 8px;
  background: #007bff;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 8px;
}

/* Empty State */
.no-notifications {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.no-notifications-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.no-notifications p {
  margin: 0;
  font-size: 14px;
}

/* Loading State */
.notification-loading {
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

/* Error State */
.notification-error {
  padding: 20px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  margin: 12px;
  color: #856404;
  font-size: 14px;
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .notification-dropdown {
    width: 100vw;
    max-width: 420px;
    right: -20px;
  }
}
</style>
