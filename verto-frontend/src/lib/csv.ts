import type { Invoice } from "@/types";
import { formatBtc } from "@/lib/utils";

/**
 * Exports an array of invoices as a downloadable CSV file.
 */
export function exportInvoicesCsv(
  invoices: Invoice[],
  filename = "verto-invoices.csv",
) {
  const headers = [
    "Invoice Number",
    "Client",
    "Description",
    "Amount (USD)",
    "Amount (BTC)",
    "Status",
    "Due Date",
    "Created",
    "Paid At",
    "Payment Address",
    "TX Hash",
  ];

  const rows = invoices.map((inv) => [
    inv.invoiceNumber,
    inv.clientName,
    `"${inv.description.replace(/"/g, '""')}"`,
    inv.amountUsd.toFixed(2),
    inv.amountBtc > 0 ? formatBtc(inv.amountBtc) : "",
    inv.status,
    inv.dueDate,
    inv.createdAt,
    inv.paidAt || "",
    inv.paymentAddress,
    inv.txHash || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
