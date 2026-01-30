import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

const API_BASE_URL = 'https://iccare.desmarttrader.com/notification';
const POLLING_INTERVAL = 15000; // 15 seconds

export function useNotifications(token) {
  const notifications = ref([]);
  const unreadCount = ref(0);
  const loading = ref(false);
  const error = ref(null);
  let intervalId = null;

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    if (!token.value) return;

    try {
      loading.value = true;
      const response = await axios.get(`${API_BASE_URL}/feed`, {
        headers: { Authorization: `Bearer ${token.value}` },
        params: {
          limit: 50,
          unread_only: false
        }
      });

      notifications.value = response.data;
      unreadCount.value = response.data.filter(n => !n.read).length;
      error.value = null;
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      error.value = err.response?.data?.detail || err.message;
    } finally {
      loading.value = false;
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!token.value) return;

    try {
      await axios.post(
        `${API_BASE_URL}/feed/${notificationId}/mark-read`,
        {},
        { headers: { Authorization: `Bearer ${token.value}` } }
      );

      // Update local state optimistically
      notifications.value = notifications.value.map(n =>
        n.notification_id === notificationId
          ? { ...n, read: true }
          : n
      );
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    } catch (err) {
      console.error('Failed to mark as read:', err);
      // Refetch to ensure sync with server on error
      await fetchNotifications();
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const unreadIds = notifications.value
      .filter(n => !n.read)
      .map(n => n.notification_id);

    for (const id of unreadIds) {
      await markAsRead(id);
    }
  };

  // Set up polling on mount
  onMounted(() => {
    // Initial fetch
    fetchNotifications();

    // Set up polling interval
    intervalId = setInterval(fetchNotifications, POLLING_INTERVAL);
  });

  // Clean up on unmount
  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
}
