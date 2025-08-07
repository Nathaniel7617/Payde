import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high';
  timestamp: string;
  read: boolean;
  category?: 'transaction' | 'security' | 'account' | 'promotional';
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  action: 'navigate' | 'api_call' | 'dismiss';
  params?: Record<string, any>;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  settings: {
    push: boolean;
    email: boolean;
    sms: boolean;
    categories: {
      transaction: boolean;
      security: boolean;
      account: boolean;
      promotional: boolean;
    };
  };
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  settings: {
    push: true,
    email: true,
    sms: false,
    categories: {
      transaction: true,
      security: true,
      account: true,
      promotional: false,
    },
  },
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },
    
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    
    updateSettings: (state, action: PayloadAction<Partial<NotificationState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    updateCategorySettings: (state, action: PayloadAction<Partial<NotificationState['settings']['categories']>>) => {
      state.settings.categories = { ...state.settings.categories, ...action.payload };
    },
    
    // Real-time notification handler
    addRealTimeNotification: (state, action: PayloadAction<{
      id: string;
      title: string;
      message: string;
      type: 'info' | 'success' | 'warning' | 'error';
      priority: 'low' | 'medium' | 'high';
      timestamp: string;
      read: boolean;
    }>) => {
      const notification: Notification = {
        ...action.payload,
        category: 'transaction', // Default category for real-time notifications
      };
      
      state.notifications.unshift(notification);
      if (!notification.read) {
        state.unreadCount += 1;
      }
    },
    
    // Bulk operations for performance
    addMultipleNotifications: (state, action: PayloadAction<Notification[]>) => {
      const newNotifications = action.payload;
      state.notifications.unshift(...newNotifications);
      
      const unreadCount = newNotifications.filter(n => !n.read).length;
      state.unreadCount += unreadCount;
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearAllNotifications,
  updateSettings,
  updateCategorySettings,
  addRealTimeNotification,
  addMultipleNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;

// Selectors
export const selectUnreadNotifications = (state: { notifications: NotificationState }) => 
  state.notifications.notifications.filter(n => !n.read);

export const selectNotificationsByCategory = (state: { notifications: NotificationState }, category: string) =>
  state.notifications.notifications.filter(n => n.category === category);

export const selectHighPriorityNotifications = (state: { notifications: NotificationState }) =>
  state.notifications.notifications.filter(n => n.priority === 'high' && !n.read);