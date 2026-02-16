"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RiAddLine, RiDeleteBinLine } from "react-icons/ri";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import { useClientStore } from "@/stores/useClientStore";
import { useInvoiceStore } from "@/stores/useInvoiceStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { generateId, generateInvoiceNumber } from "@/lib/utils";
import { fetchBtcPrice, formatBtcAmount } from "@/lib/price";
import type { Invoice } from "@/types";

const lineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Min 1"),
  rate: z.number().min(0, "Min 0"),
  amount: z.number(),
});

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Select a client"),
  description: z.string().min(1, "Description is required"),
  items: z.array(lineItemSchema).min(1, "Add at least one item"),
  paymentAddress: z.string().min(1, "Payment address is required"),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  onSuccess: (invoice: Invoice) => void;
  initialData?: Partial<Invoice>;
}

export default function InvoiceForm({
  onSuccess,
  initialData,
}: InvoiceFormProps) {
  const { clients } = useClientStore();
  const { invoices } = useInvoiceStore();
  const { settings } = useSettingsStore();
  const [btcPrice, setBtcPrice] = useState<number>(0);

  // Fetch BTC price on mount
  useEffect(() => {
    fetchBtcPrice().then(setBtcPrice);
  }, []);

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: c.company ? `${c.name} (${c.company})` : c.name,
  }));

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(invoiceSchema) as any,
    defaultValues: {
      clientId: initialData?.clientId || "",
      description: initialData?.description || "",
      items: initialData?.items || [
        { id: generateId(), description: "", quantity: 1, rate: 0, amount: 0 },
      ],
      paymentAddress:
        initialData?.paymentAddress || settings.defaultPaymentAddress || "",
      dueDate: initialData?.dueDate || "",
      notes: initialData?.notes || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = useWatch({ control, name: "items" });

  const updateAmount = (index: number) => {
    const qty = watchedItems[index]?.quantity || 0;
    const rate = watchedItems[index]?.rate || 0;
    setValue(`items.${index}.amount`, qty * rate);
  };

  const totalUsd = watchedItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.rate || 0),
    0,
  );

  const totalBtc = btcPrice > 0 ? totalUsd / btcPrice : 0;

  const onSubmit = (data: InvoiceFormData) => {
    const client = clients.find((c) => c.id === data.clientId);
    const items = data.items.map((item) => ({
      ...item,
      amount: item.quantity * item.rate,
    }));

    const invoice: Invoice = {
      id: initialData?.id || generateId(),
      invoiceNumber:
        initialData?.invoiceNumber ||
        generateInvoiceNumber(settings.invoicePrefix, invoices.length),
      clientId: data.clientId,
      clientName: client?.name || "Unknown",
      description: data.description,
      items,
      amountUsd: totalUsd,
      amountBtc: totalBtc,
      paymentAddress: data.paymentAddress,
      status: "pending",
      dueDate: data.dueDate,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      notes: data.notes,
    };

    onSuccess(invoice);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Client & Description */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Client"
          options={clientOptions}
          placeholder="Select a client"
          error={errors.clientId?.message}
          {...register("clientId")}
        />
        <Input
          label="Due Date"
          type="date"
          error={errors.dueDate?.message}
          {...register("dueDate")}
        />
      </div>

      <Input
        label="Project Description"
        placeholder="e.g. Website redesign project"
        error={errors.description?.message}
        {...register("description")}
      />

      {/* Line Items */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Line Items
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<RiAddLine className="h-4 w-4" />}
            onClick={() =>
              append({
                id: generateId(),
                description: "",
                quantity: 1,
                rate: 0,
                amount: 0,
              })
            }
          >
            Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-12 items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/50"
            >
              <div className="col-span-12 sm:col-span-5">
                <Input
                  placeholder="e.g. UI Design"
                  error={errors.items?.[index]?.description?.message}
                  {...register(`items.${index}.description`)}
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Input
                  type="number"
                  placeholder="1"
                  min={1}
                  {...register(`items.${index}.quantity`, {
                    valueAsNumber: true,
                    onChange: () => updateAmount(index),
                  })}
                />
              </div>
              <div className="col-span-5 sm:col-span-3">
                <Input
                  type="number"
                  placeholder="500.00"
                  min={0}
                  step="0.01"
                  {...register(`items.${index}.rate`, {
                    valueAsNumber: true,
                    onChange: () => updateAmount(index),
                  })}
                />
              </div>
              <div className="col-span-3 flex items-center justify-end gap-2 pt-2 sm:col-span-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  $
                  {(
                    (watchedItems[index]?.quantity || 0) *
                    (watchedItems[index]?.rate || 0)
                  ).toFixed(2)}
                </span>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label="Remove item"
                    className="text-gray-400 transition-colors hover:text-red-500"
                  >
                    <RiDeleteBinLine className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {errors.items && typeof errors.items.message === "string" && (
          <p className="mt-1 text-xs text-red-500">{errors.items.message}</p>
        )}

        {/* Total */}
        <div className="mt-4 flex items-center justify-end gap-4 rounded-lg bg-gray-100 px-4 py-3 dark:bg-neutral-800">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total
          </span>
          <div className="text-right">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              ${totalUsd.toFixed(2)}
            </span>
            {totalBtc > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ≈ {formatBtcAmount(totalBtc)} BTC
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Payment address */}
      <Input
        label="Bitcoin Payment Address"
        placeholder="bc1q... or your STX address"
        error={errors.paymentAddress?.message}
        {...register("paymentAddress")}
      />

      {/* Notes */}
      <Textarea
        label="Notes (optional)"
        placeholder="Additional notes for the client..."
        {...register("notes")}
      />

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="submit" isLoading={isSubmitting}>
          {initialData ? "Update Invoice" : "Create Invoice"}
        </Button>
      </div>
    </form>
  );
}
