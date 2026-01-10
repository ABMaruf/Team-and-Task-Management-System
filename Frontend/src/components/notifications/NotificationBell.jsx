import React, { useState } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import Loader from '../common/Loader';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative rounded-xl bg-indigo-50 px-3 py-2 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-200"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</p>
            {unreadCount > 0 && (
              <button
                className="text-xs font-semibold text-indigo-500 hover:text-indigo-600"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader size="sm" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-xl bg-gray-50 py-6 text-center text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                You're all caught up!
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`rounded-2xl border p-3 text-sm transition-all hover:border-indigo-200 dark:border-gray-700 ${
                    notification.is_read ? 'bg-white dark:bg-gray-800' : 'bg-indigo-50/80 dark:bg-indigo-500/10'
                  }`}
                >
                  <p className="font-medium text-gray-900 dark:text-white">{notification.title}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{notification.message}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                    <span>{new Date(notification.created_at).toLocaleString()}</span>
                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600"
                        >
                          <CheckCheck size={14} /> Done
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-rose-500 hover:text-rose-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
