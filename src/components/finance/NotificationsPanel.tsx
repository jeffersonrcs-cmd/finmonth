import { AlertCircle, ArrowLeft, Bell, CalendarClock, Check, ChevronRight, X } from "lucide-react";
import {
  billDueDateLabel,
  billStatus,
  financeActions,
  formatCurrency,
  monthLabel,
  useFinanceState,
  type BillNotification,
} from "@/lib/finance";
import { useLanguage } from "@/lib/i18n";
import { useState } from "react";

export function NotificationsPanel({
  notifications,
  onClose,
}: {
  notifications: BillNotification[];
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const financeState = useFinanceState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedNotification = selectedId
    ? (notifications.find((item) => item.id === selectedId) ?? null)
    : null;
  const selectedBill = selectedNotification
    ? (financeState.months[selectedNotification.monthKey]?.bills.find(
        (bill) => bill.id === selectedNotification.billId,
      ) ?? null)
    : null;

  return (
    <div className="fixed inset-0 z-[90] bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <section
        className="absolute inset-x-3 top-3 mx-auto max-w-[440px] overflow-hidden rounded-3xl border border-border bg-popover shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {selectedNotification && selectedBill ? (
          <>
            <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label={t("back")}
                className="grid size-8 place-items-center rounded-full text-mut hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-sm font-semibold">{selectedBill.description}</h2>
                <p className="text-[10px] text-mut">{monthLabel(selectedNotification.monthKey)}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("closeNotifications")}
                className="grid size-8 place-items-center rounded-full text-mut hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3 p-4">
              <div className="glass-soft rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-widest text-mut">
                    {t("amount")}
                  </span>
                  <span className="num font-display text-lg font-semibold">
                    {formatCurrency(selectedBill.amount)}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-mut">{t("dueDate")}</p>
                    <p className="mt-1 text-sm font-medium">
                      {billDueDateLabel(selectedNotification.monthKey, selectedBill.dueDay)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-mut">{t("status")}</p>
                    <p
                      className={`mt-1 text-sm font-medium ${billStatus(selectedBill, selectedNotification.monthKey) === "overdue" ? "text-neg" : "text-warn"}`}
                    >
                      {t(billStatus(selectedBill, selectedNotification.monthKey))}
                    </p>
                  </div>
                </div>
                {selectedBill.recurrent && (
                  <p className="mt-3 text-[10px] text-mut">{t("recurring")}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  financeActions.toggleBillPaid(selectedNotification.monthKey, selectedBill.id);
                  setSelectedId(null);
                }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-pos px-4 text-xs font-semibold uppercase tracking-widest text-background"
              >
                <Check className="size-4" /> {t("markPaid")}
              </button>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="flex h-11 w-full items-center justify-center rounded-xl border border-border/70 px-4 text-xs font-semibold uppercase tracking-widest text-mut"
              >
                {t("back")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3.5">
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-full bg-brand/10 text-brand">
                  <Bell className="size-4" />
                </div>
                <div>
                  <h2 className="font-display text-sm font-semibold">{t("notifications")}</h2>
                  <p className="text-[10px] text-mut">
                    {notifications.length
                      ? `${notifications.length} ${t("notificationsCount")}${notifications.length === 1 ? "" : "s"}`
                      : t("allGood")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("closeNotifications")}
                className="grid size-8 place-items-center rounded-full text-mut hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="max-h-[70vh] space-y-2 overflow-y-auto p-3">
              {notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Check className="mx-auto size-8 text-pos" />
                  <p className="mt-2 text-sm font-medium">{t("noAttention")}</p>
                  <p className="mt-1 text-xs text-mut">{t("notificationHint")}</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const Icon =
                    notification.kind === "overdue"
                      ? AlertCircle
                      : notification.kind === "today"
                        ? CalendarClock
                        : Bell;
                  const tone =
                    notification.kind === "overdue"
                      ? "text-neg bg-neg/10"
                      : notification.kind === "today"
                        ? "text-warn bg-warn/10"
                        : "text-brand bg-brand/10";
                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => setSelectedId(notification.id)}
                      className="glass-soft flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-foreground/5"
                    >
                      <div
                        className={`grid size-9 shrink-0 place-items-center rounded-full ${tone}`}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{notification.title}</p>
                        <p className="mt-0.5 text-[11px] text-mut">{notification.message}</p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-mut" />
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
