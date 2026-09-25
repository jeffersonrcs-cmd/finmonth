import { getBillNotifications, useFinanceState } from "@/lib/finance";

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch {
    return "denied";
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission;
}

/**
 * Triggers a test or immediate push/local notification for pending or overdue bills
 */
export async function sendNativeBillNotification(title: string, body: string, url = "/") {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return false;
  }

  // Use ServiceWorkerRegistration if available (works on mobile Android PWA too)
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          data: url,
          tag: "finmonth-bill-alert",
        });
        return true;
      }
    } catch {
      // Fallback to standard Notification constructor
    }
  }

  try {
    new Notification(title, {
      body,
      icon: "/icon-192.png",
      tag: "finmonth-bill-alert",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Automatically checks bill notifications and notifies via browser notification if permitted
 */
export async function checkAndSendDueAlerts(
  state: ReturnType<typeof useFinanceState>,
  t: (key: any) => string,
) {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;
  if (!state.notificationPreferences.enabled) return;

  const notifications = getBillNotifications(state);
  if (notifications.length === 0) return;

  const todayKey = new Date().toISOString().slice(0, 10);
  const lastAlertKey = "finmonth.last-notified-date";
  const lastNotified = localStorage.getItem(lastAlertKey);

  // Send maximum once per day automatically to not overwhelm the user
  if (lastNotified === todayKey) return;

  const overdueCount = notifications.filter((n) => n.kind === "overdue").length;
  const todayCount = notifications.filter((n) => n.kind === "today").length;

  let title = "FinMonth";
  let body = "";

  if (overdueCount > 0 && todayCount > 0) {
    title = `⚠️ FinMonth: ${overdueCount + todayCount} ${t("notificationsCount") || "avisos"}`;
    body = `${overdueCount} vencida(s) e ${todayCount} vencendo hoje. Toque para conferir!`;
  } else if (overdueCount > 0) {
    title = `⚠️ FinMonth: ${overdueCount} conta(s) vencida(s)`;
    body = notifications[0]?.title ?? "Você tem contas vencidas aguardando pagamento.";
  } else if (todayCount > 0) {
    title = `🔔 FinMonth: ${todayCount} conta(s) vencem hoje`;
    body = notifications[0]?.title ?? "Lembrete: contas vencendo hoje.";
  }

  if (body) {
    const sent = await sendNativeBillNotification(title, body, "/");
    if (sent) {
      localStorage.setItem(lastAlertKey, todayKey);
    }
  }
}
