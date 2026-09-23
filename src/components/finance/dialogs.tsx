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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { formatCurrency, type Bill, type Income, type Saving } from "@/lib/finance";
import { daysInMonth } from "@/lib/finance";

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
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass max-w-[340px] rounded-3xl bg-popover">
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
              Cancelar
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-brand text-background text-xs font-semibold uppercase tracking-widest hover:bg-brand/90"
            >
              Salvar
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
    setDay(initial?.date?.split("-")[2] ?? "1");
  }, [dialogOpen, initial, monthKey]);

  return (
    <FormDialog
      trigger={trigger}
      title={initial ? "Editar receita" : "Nova receita"}
      open={dialogOpen}
      setOpen={setDialogOpen}
      onSubmit={() => {
        const [year, month] = monthKey.split("-").map(Number);
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
        <Label className={labelClass}>Descrição</Label>
        <Input
          className={fieldClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Salário"
        />
      </div>
      <div className="space-y-1.5">
        <Label className={labelClass}>Valor (R$)</Label>
        <Input
          className={fieldClass}
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="3500,00"
        />
      </div>
      <div className="space-y-1.5">
        <Label className={labelClass}>Dia da receita</Label>
        <Input
          className={fieldClass}
          type="number"
          min={1}
          max={daysInMonth(Number(monthKey.split("-")[0]), Number(monthKey.split("-")[1]))}
          inputMode="numeric"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          placeholder="1"
        />
        <p className="text-[10px] text-mut">Mês e ano: {monthKey.split("-").reverse().join("/")}</p>
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
    setDueDay(String(initial?.dueDay ?? 5));
    setPaid(initial?.paid ?? false);
    setRecurrent(initial?.recurrent ?? true);
  }, [dialogOpen, initial]);

  const parts = monthKey.split("-");
  const maxDay = daysInMonth(Number(parts[0] ?? 0), Number(parts[1] ?? 1));

  return (
    <FormDialog
      trigger={trigger}
      title={initial ? "Editar conta" : "Nova conta"}
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
        <Label className={labelClass}>Descrição</Label>
        <Input
          className={fieldClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Energia elétrica"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className={labelClass}>Valor (R$)</Label>
          <Input
            className={fieldClass}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="240,00"
          />
        </div>
        <div className="space-y-1.5">
          <Label className={labelClass}>Vencimento</Label>
          <Input
            className={fieldClass}
            inputMode="numeric"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            placeholder="10"
          />
        </div>
      </div>
      <div className="glass-soft flex items-center justify-between rounded-xl px-3 py-2.5">
        <span className="text-xs">Conta paga</span>
        <Switch checked={paid} onCheckedChange={setPaid} />
      </div>
      <div className="glass-soft flex items-center justify-between rounded-xl px-3 py-2.5">
        <span className="text-xs">Recorrente</span>
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
              Nenhum item cadastrado neste mês.
            </p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="glass-soft flex items-center gap-2 rounded-xl px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{item.description}</p>
                  <p className="num text-xs font-semibold text-foreground">{formatCurrency(item.amount)}</p>
                </div>
                <button
                  type="button"
                  aria-label="Editar item"
                  onClick={() => { setOpen(false); onEdit(item.id); }}
                  className="grid size-7 place-items-center rounded-full text-mut transition-colors hover:text-brand"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Excluir item"
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
      title={initial ? "Editar valor guardado" : "Novo valor guardado"}
      open={dialogOpen}
      setOpen={setDialogOpen}
      onSubmit={() => {
        if (!description.trim() || parseAmount(amount) <= 0) return false;
        onSave({ description: description.trim(), amount: parseAmount(amount) });
        return true;
      }}
    >
      <div className="space-y-1.5">
        <Label className={labelClass}>Descrição</Label>
        <Input
          className={fieldClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Reserva de emergência"
        />
      </div>
      <div className="space-y-1.5">
        <Label className={labelClass}>Valor (R$)</Label>
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
