import { useEffect, useState, type ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { formatCurrency, type Bill, type Income, type Saving } from "@/lib/finance";
import { daysInMonth } from "@/lib/finance";
import { useLanguage } from "@/lib/i18n";

function parseAmount(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

type Shell = {
  trigger: ReactNode;
  title: string;
  children: ReactNode;
  onSubmit: () => boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
};

function FormDialog({ trigger, title, children, onSubmit, open, setOpen }: Shell) {
  const { t, currency } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[340px] rounded-3xl border-border/70 bg-popover shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-base">{title}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (onSubmit()) setOpen(false);
          }}
        >
          {children}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-mut text-xs uppercase tracking-widest"
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-brand text-background text-xs font-semibold uppercase tracking-widest hover:bg-brand/90"
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const fieldClass = "glass-soft rounded-xl border-0 h-11 text-sm";
const labelClass = "text-[10px] uppercase tracking-widest text-mut";

export function IncomeDialog({
  trigger,
  monthKey,
  initial,
  onSave,
  open,
  onOpenChange,
}: {
  trigger: ReactNode;
  monthKey: string;
  initial?: Income;
  onSave: (data: Omit<Income, "id">) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { t, currency } = useLanguage();
  const [internalOpen, setInternalOpen] = useState(false);
  const dialogOpen = open ?? internalOpen;
  const setDialogOpen = onOpenChange ?? setInternalOpen;
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount).replace(".", ",") : "");
  const [day, setDay] = useState(() => initial?.date?.split("-")[2] ?? "1");

  useEffect(() => {
    if (!dialogOpen) return;
    setDescription(initial?.description ?? "");
    setAmount(initial ? String(initial.amount).replace(".", ",") : "");
    const [year = 0, month = 1] = monthKey.split("-").map(Number);
    const maxDay = daysInMonth(year, month);
    setDay(String(Math.min(Math.max(Number(initial?.date?.split("-")[2]) || 1, 1), maxDay)));
  }, [dialogOpen, initial, monthKey]);

  return (
    <FormDialog
      trigger={trigger}
      title={initial ? t("editIncome") : t("newIncome")}
      open={dialogOpen}
      setOpen={setDialogOpen}
      onSubmit={() => {
        const [year = 0, month = 1] = monthKey.split("-").map(Number);
        const maxDay = daysInMonth(year, month);
        const selectedDay = Math.min(Math.max(Number(day) || 1, 1), maxDay);
        if (!description.trim() || parseAmount(amount) <= 0) return false;
        onSave({
          description: description.trim(),
          amount: parseAmount(amount),
          date: `${monthKey}-${String(selectedDay).padStart(2, "0")}`,
        });
        return true;
      }}
    >
      <div className="space-y-1.5">
        <Label className={labelClass}>{t("description")}</Label>
        <Input
          className={fieldClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("salary")}
        />
      </div>
      <div className="space-y-1.5">
        <Label className={labelClass}>{t("amountCurrency").replace("{currency}", currency)}</Label>
        <Input
          className={fieldClass}
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="3500,00"
        />
      </div>
      <div className="space-y-1.5">
        <Label className={labelClass}>{t("incomeDay")}</Label>
        <Select value={day} onValueChange={setDay}>
          <SelectTrigger className={fieldClass}>
            <SelectValue placeholder={t("selectDay")} />
          </SelectTrigger>
          <SelectContent className="max-h-64 rounded-xl border-border/60 bg-popover/95 p-1 shadow-xl backdrop-blur-xl">
            {Array.from(
              {
                length: daysInMonth(Number(monthKey.split("-")[0]), Number(monthKey.split("-")[1])),
              },
              (_, index) => {
                const value = String(index + 1);
                return (
                  <SelectItem key={value} value={value} className="rounded-lg py-2.5 text-sm">
                    {t("day")} {value}
                  </SelectItem>
                );
              },
            )}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-mut">
          {t("monthYear")}: {monthKey.split("-").reverse().join("/")}
        </p>
      </div>
    </FormDialog>
  );
}

export function BillDialog({
  trigger,
  monthKey,
  initial,
  onSave,
  open,
  onOpenChange,
}: {
  trigger: ReactNode;
  monthKey: string;
  initial?: Bill;
  onSave: (data: Omit<Bill, "id">) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { t, currency } = useLanguage();
  const [internalOpen, setInternalOpen] = useState(false);
  const dialogOpen = open ?? internalOpen;
  const setDialogOpen = onOpenChange ?? setInternalOpen;
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount).replace(".", ",") : "");
  const [dueDay, setDueDay] = useState(String(initial?.dueDay ?? 5));
  const [paid, setPaid] = useState(initial?.paid ?? false);
  const [recurrent, setRecurrent] = useState(initial?.recurrent ?? true);

  useEffect(() => {
    if (!dialogOpen) return;
    setDescription(initial?.description ?? "");
    setAmount(initial ? String(initial.amount).replace(".", ",") : "");
    const [year = 0, month = 1] = monthKey.split("-").map(Number);
    const maxDay = daysInMonth(year, month);
    setDueDay(String(Math.min(Math.max(Number(initial?.dueDay) || 5, 1), maxDay)));
    setPaid(initial?.paid ?? false);
    setRecurrent(initial?.recurrent ?? true);
  }, [dialogOpen, initial]);

  const parts = monthKey.split("-");
  const maxDay = daysInMonth(Number(parts[0] ?? 0), Number(parts[1] ?? 1));

  return (
    <FormDialog
      trigger={trigger}
      title={initial ? t("editBill") : t("newBill")}
      open={dialogOpen}
      setOpen={setDialogOpen}
      onSubmit={() => {
        const day = Math.min(Math.max(Number(dueDay) || 1, 1), maxDay);
        if (!description.trim() || parseAmount(amount) <= 0) return false;
        onSave({
          description: description.trim(),
          amount: parseAmount(amount),
          dueDay: day,
          paid,
          recurrent,
        });
        return true;
      }}
    >
      <div className="space-y-1.5">
        <Label className={labelClass}>{t("description")}</Label>
        <Input
          className={fieldClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("electricity")}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className={labelClass}>
            {t("amountCurrency").replace("{currency}", currency)}
          </Label>
          <Input
            className={fieldClass}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="240,00"
          />
        </div>
        <div className="space-y-1.5">
          <Label className={labelClass}>{t("dueDate")}</Label>
          <Select value={dueDay} onValueChange={setDueDay}>
            <SelectTrigger className={fieldClass}>
              <SelectValue placeholder={t("selectDay")} />
            </SelectTrigger>
            <SelectContent className="max-h-64 rounded-xl border-border/60 bg-popover/95 p-1 shadow-xl backdrop-blur-xl">
              {Array.from({ length: maxDay }, (_, index) => {
                const value = String(index + 1);
                return (
                  <SelectItem key={value} value={value} className="rounded-lg py-2.5 text-sm">
                    {t("day")} {value}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="glass-soft flex items-center justify-between rounded-xl px-3 py-2.5">
        <span className="text-xs">{t("paidAccount")}</span>
        <Switch checked={paid} onCheckedChange={setPaid} />
      </div>
      <div className="glass-soft flex items-center justify-between rounded-xl px-3 py-2.5">
        <span className="text-xs">{t("recurringAccount")}</span>
        <Switch checked={recurrent} onCheckedChange={setRecurrent} />
      </div>
    </FormDialog>
  );
}

export function ManageEntriesDialog({
  trigger,
  title,
  items,
  onEdit,
  onDelete,
}: {
  trigger: ReactNode;
  title: string;
  items: { id: string; description: string; amount: number }[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { t, currency } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass max-w-[340px] rounded-3xl bg-popover">
        <DialogHeader>
          <DialogTitle className="font-display text-base">{title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/70 px-3 py-5 text-center text-xs text-mut">
              {t("noItems")}
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="glass-soft flex items-center gap-2 rounded-xl px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{item.description}</p>
                  <p className="num text-xs font-semibold text-foreground">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={t("manageItem")}
                  onClick={() => {
                    setOpen(false);
                    onEdit(item.id);
                  }}
                  className="grid size-7 place-items-center rounded-full text-mut transition-colors hover:text-brand"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`${t("delete")} ${t("item")}`}
                  onClick={() => onDelete(item.id)}
                  className="grid size-7 place-items-center rounded-full text-mut transition-colors hover:text-neg"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SavingDialog({
  trigger,
  initial,
  onSave,
  open,
  onOpenChange,
}: {
  trigger: ReactNode;
  initial?: Saving;
  onSave: (data: Omit<Saving, "id">) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { t, currency } = useLanguage();
  const [internalOpen, setInternalOpen] = useState(false);
  const dialogOpen = open ?? internalOpen;
  const setDialogOpen = onOpenChange ?? setInternalOpen;
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount).replace(".", ",") : "");

  useEffect(() => {
    if (!dialogOpen) return;
    setDescription(initial?.description ?? "");
    setAmount(initial ? String(initial.amount).replace(".", ",") : "");
  }, [dialogOpen, initial]);

  return (
    <FormDialog
      trigger={trigger}
      title={initial ? t("editSaving") : t("newSaving")}
      open={dialogOpen}
      setOpen={setDialogOpen}
      onSubmit={() => {
        if (!description.trim() || parseAmount(amount) <= 0) return false;
        onSave({ description: description.trim(), amount: parseAmount(amount) });
        return true;
      }}
    >
      <div className="space-y-1.5">
        <Label className={labelClass}>{t("description")}</Label>
        <Input
          className={fieldClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("emergencyReserve")}
        />
      </div>
      <div className="space-y-1.5">
        <Label className={labelClass}>{t("amountCurrency").replace("{currency}", currency)}</Label>
        <Input
          className={fieldClass}
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="500,00"
        />
      </div>
    </FormDialog>
  );
}
