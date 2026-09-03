"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckCircle2,
  Calendar,
  Truck,
  MapPin,
  ShieldCheck,
  Zap,
  Clock,
  UserCheck,
  X,
  CheckCheck,
  Sparkles,
  Info,
} from "lucide-react";
import {
  AppNotification,
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToRealtimeNotifications,
} from "@/lib/notificationService";

interface NotificationBellProps {
  userId?: string;
  userRole?: "customer" | "worker" | "cooperative_admin" | "super_admin";
}

export default function NotificationBell({
  userId,
  userRole = "customer",
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD">("ALL");
  const [incomingToast, setIncomingToast] = useState<AppNotification | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load notifications on mount or when user/role changes
  useEffect(() => {
    fetchUserNotifications(userId, userRole).then((data) => {
      setNotifications(data);
    });

    // Subscribe to live Supabase Realtime notifications
    const unsubscribe = subscribeToRealtimeNotifications(userId, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      showToastBanner(newNotif);
    });

    // Listen for custom in-app event dispatch
    const handleInAppNotif = (e: any) => {
      if (e.detail) {
        setNotifications((prev) => [e.detail, ...prev]);
        showToastBanner(e.detail);
      }
    };
    window.addEventListener("skill-link-notification", handleInAppNotif);

    return () => {
      unsubscribe();
      window.removeEventListener("skill-link-notification", handleInAppNotif);
    };
  }, [userId, userRole]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showToastBanner = (notif: AppNotification) => {
    setIncomingToast(notif);
    setTimeout(() => {
      setIncomingToast((prev) => (prev?.id === notif.id ? null : prev));
    }, 5000);
  };

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications =
    activeTab === "UNREAD" ? notifications.filter((n) => !n.isRead) : notifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking_created":
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case "worker_en_route":
        return <Truck className="w-4 h-4 text-amber-600" />;
      case "worker_arrived":
        return <MapPin className="w-4 h-4 text-emerald-600" />;
      case "service_completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "welfare_credit":
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case "new_job_request":
        return <Zap className="w-4 h-4 text-blue-600" />;
      case "worker_registered":
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all flex items-center justify-center"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[9px] font-extrabold text-white shadow-sm">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative">{unreadCount > 9 ? "9+" : unreadCount}</span>
          </span>
        )}
      </button>

      {/* Realtime Toast Pop-up when a notification arrives */}
      {incomingToast && (
        <div className="fixed bottom-5 right-5 z-[999] max-w-sm w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-100">{incomingToast.title}</div>
              <div className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">
                {incomingToast.message}
              </div>
            </div>
            <button
              onClick={() => setIncomingToast(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-900 animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  {unreadCount} New
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-100 px-3 pt-2 gap-2 text-xs font-bold text-slate-500">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`pb-2 px-2 transition-all border-b-2 ${
                activeTab === "ALL"
                  ? "text-blue-600 border-blue-600"
                  : "border-transparent hover:text-slate-700"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("UNREAD")}
              className={`pb-2 px-2 transition-all border-b-2 ${
                activeTab === "UNREAD"
                  ? "text-blue-600 border-blue-600"
                  : "border-transparent hover:text-slate-700"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                <span>No notifications in this tab</span>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id)}
                  className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${
                    !notif.isRead ? "bg-blue-50/40" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs truncate ${
                          !notif.isRead
                            ? "font-extrabold text-slate-900"
                            : "font-semibold text-slate-700"
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
