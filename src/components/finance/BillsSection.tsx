import { Building2, CalendarDays, Car, Check, CreditCard, Droplets, FileText, Fuel, HeartPulse, Home, Landmark, Pencil, ReceiptText, ShieldCheck, ShoppingCart, Trash2, Tv, Utensils, Wifi, Wrench, Zap } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/lib/i18n";
import { billStatus, financeActions, formatCurrency, type Bill } from "@/lib/finance";
import { BillDialog, ConfirmDeleteDialog } from "./dialogs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";



function getBillIcon(description: string) {
  const value = description.toLowerCase();
  if (/internet|wifi|wi-fi|fibra/.test(value)) return Wifi;
  if (/água|agua|saneamento/.test(value)) return Droplets;
  if (/luz|energia|elétrica|eletrica/.test(value)) return Zap;
  if (/cartão|cartao|crédito|credito/.test(value)) return CreditCard;
  if (/aluguel|aluguel/.test(value)) return Home;
  if (/condomínio|condominio/.test(value)) return Building2;
  if (/iptu|imposto|tributo/.test(value)) return Landmark;
  if (/carro|veículo|veiculo|moto|estacionamento/.test(value)) return Car;
  if (/combustível|combustivel|gasolina|posto/.test(value)) return Fuel;
  if (/telefone|celular|móvel|movel/.test(value)) return FileText;
  if (/tv|televisão|televisao/.test(value)) return Tv;
  if (/mercado|supermercado|compras/.test(value)) return ShoppingCart;
  if (/saúde|saude|médico|medico|farmácia|farmacia/.test(value)) return HeartPulse;
  if (/seguro/.test(value)) return ShieldCheck;
  if (/restaurante|comida|alimentação|alimentacao/.test(value)) return Utensils;
  if (/manutenção|manutencao|reparo|conserto/.test(value)) return Wrench;
  if (/fatura|boleto|conta/.test(value)) return ReceiptText;
  return ReceiptText;
}

export function BillDetailScreen({
  bill,
  monthKey,
  onClose,
  onDelete,
}: {
  bill: Bill;
  monthKey: string;
  onClose: () => void;
  onDelete: () => void;
}) {
  const { t } = useLanguage();
  const status = billStatus(bill, monthKey);
  const statusClass = status === "overdue" ? "text-neg bg-neg/10" : "text-warn bg-warn/10";
  const statusLabel = status === "overdue" ? t("overdue") : t("pending");

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[340px] overflow-hidden rounded-[2rem] border-border/70 bg-popover p-0 shadow-2xl">
        <div className="p-5 sm:p-6">
          <DialogHeader className="relative pr-10">
            <div className="flex items-center gap-3">
              <div className={"grid size-12 shrink-0 place-items-center rounded-2xl " + (status === "overdue" ? "bg-neg/10 text-neg" : "bg-warn/10 text-warn")}>
                {(() => { const Icon = getBillIcon(bill.description); return <Icon className="size-6" />; })()}
              </div>
              <DialogTitle className="min-w-0 font-display text-xl font-bold leading-tight tracking-tight sm:text-2xl">
                {bill.description}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-border/60 bg-background/45 p-4">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mut">{t("amount")}</p>
                  <p className={"num mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl " + (status === "overdue" ? "text-neg" : "text-warn")}>
                    {formatCurrency(bill.amount)}
                  </p>
                </div>
                <span className={"shrink-0 rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider " + statusClass}>
                  {statusLabel}
                </span>
              </div>
            </div>

            <div className="divide-y divide-border/50 rounded-2xl border border-border/60 bg-background/30">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted/40">
                  <CalendarDays className="size-5 text-mut" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mut">{t("dueDate")}</p>
                  <p className="mt-0.5 text-base font-semibold">{t("day")} {bill.dueDay}</p>
                </div>
              </div>
              {bill.recurrent && (
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted/40 text-mut">
                    <ReceiptText className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mut">{t("recurring")}</p>
                    <p className="mt-0.5 text-base font-semibold">{t("recurring")}</p>
                  </div>
                </div>
              )}
            </div>

          <div className="flex justify-end gap-2 border-t border-border/50 pt-4">
            <BillDialog
              monthKey={monthKey}
              initial={bill}
              onSave={(data) => financeActions.updateBill(monthKey, bill.id, data)}
              trigger={
                <button
                  type="button"
                  aria-label={t("edit")}
                  className="grid size-11 place-items-center rounded-full bg-brand/10 text-brand transition-colors hover:bg-brand/15"
                >
                  <Pencil className="size-4" />
                </button>
              }
            />
            <ConfirmDeleteDialog
              onConfirm={onDelete}
              trigger={
                <button
                  type="button"
                  aria-label={t("delete")}
                  className="grid size-11 place-items-center rounded-full bg-neg/10 text-neg transition-colors hover:bg-neg/15"
                >
                  <Trash2 className="size-4" />
                </button>
              }
            />
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export function BillsSection({ monthKey, bills }: { monthKey: string; bills: Bill[] }) {
  const { t } = useLanguage();
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const selectedBill = selectedBillId ? bills.find((bill) => bill.id === selectedBillId) : undefined;

  const sorted = bills.filter((bill) => billStatus(bill, monthKey) !== "paid").sort((a, b) => {
    const aPending = billStatus(a, monthKey) !== "paid";
    const bPending = billStatus(b, monthKey) !== "paid";

    if (aPending !== bPending) return aPending ? -1 : 1;
    return a.dueDay - b.dueDay;
  });

  const renderBillsList = () => (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-mut">
          {t("billsMonth")}
        </h2>
        <Link
          to="/historico"
          className="shrink-0 border-b border-transparent pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-mut transition-colors hover:border-brand/40 hover:text-brand"
        >
          {t("fullHistory")}
        </Link>
      </div>

      <div className="mb-5 space-y-2.5">
        {sorted.length === 0 && (
          <p className="glass-soft rounded-2xl p-4 text-center text-xs text-mut">{t("noBills")}</p>
        )}
        {sorted.map((bill) => {
          const status = billStatus(bill, monthKey);
          return (
            <div
              key={bill.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedBillId(bill.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedBillId(bill.id);
                }
              }}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 bg-background/80 p-3.5 shadow-sm backdrop-blur-md ${
                status === "overdue" ? "border-neg/25" : status === "pending" ? "border-warn/30 bg-warn/5" : ""
              }`}
            >
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  financeActions.toggleBillPaid(monthKey, bill.id);
                }}
                aria-label={bill.paid ? t("markPending") : t("markPaid")}
                className={`grid size-6 shrink-0 place-items-center rounded-full border transition-colors ${
                  status === "paid"
                    ? "border-pos/40 bg-pos/20 text-pos"
                    : status === "overdue"
                      ? "border-neg/30 bg-neg/5 hover:border-pos/50 hover:bg-pos/10"
                      : status === "pending"
                        ? "border-warn/40 bg-warn/10 text-warn hover:border-pos/50 hover:bg-pos/10"
                        : "border-border hover:border-pos/50 hover:bg-pos/10"
                }`}
              >
                {status === "paid" && <Check className="size-3" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{bill.description}</p>
                <p className={`text-[11px] ${status === "overdue" ? "text-neg" : status === "pending" ? "text-warn" : "text-mut"}`}>
                  {status === "paid"
                    ? `${t("paid")} · ${t("day")} ${bill.dueDay}`
                    : status === "overdue"
                      ? `${t("overdue")} ${t("day")} ${bill.dueDay}`
                      : `${t("due")} ${t("day")} ${bill.dueDay}`}
                  {bill.recurrent ? ` · ${t("recurring")}` : ""}
                </p>
              </div>
              <span
                className={`num font-display text-sm font-semibold ${
                  status === "overdue" ? "text-neg" : status === "pending" ? "text-warn" : status === "paid" ? "text-pos" : ""
                }`}
              >
                {formatCurrency(bill.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );

  if (selectedBill) {
    return (
      <>
        <BillDetailScreen
          bill={selectedBill}
          monthKey={monthKey}
          onClose={() => setSelectedBillId(null)}
          onDelete={() => {
            financeActions.removeBill(monthKey, selectedBill.id);
            setSelectedBillId(null);
          }}
        />
        {renderBillsList()}
      </>
    );
  }

  return renderBillsList();
}
