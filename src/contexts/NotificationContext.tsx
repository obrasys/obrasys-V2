"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NotificationContextType {
  notificationCount: number;
  hasNotifications: boolean;
  setNotificationState: (count: number, has: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [hasNotifications, setHasNotifications] = useState(false);

  const setNotificationState = (count: number, has: boolean) => {
    setNotificationCount(count);
    setHasNotifications(has);
  };

  return (
    <NotificationContext.Provider value={{ notificationCount, hasNotifications, setNotificationState }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};