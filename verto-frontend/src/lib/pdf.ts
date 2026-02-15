/**
 * PDF Invoice Generation using jsPDF
 * Generates professional PDF invoices client-side
 *
 * jsPDF and qrcode are dynamically imported to avoid Turbopack SSR module‑eval failures.
 */
import type { Invoice } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatBtcAmount } from "@/lib/price";

/**
 * Generate a QR code as a data URL for embedding in PDFs
 */
async function generateQrDataUrl(text: string): Promise<string | null> {
  try {
    const QRCode = await import("qrcode");
    return await QRCode.toDataURL(text, {
      width: 200,
      margin: 1,
      color: { dark: "#1f2937", light: "#ffffff" },
    });
  } catch {
    return null;
  }
}

export async function generateInvoicePdf(
  invoice: Invoice,
  businessName?: string,
  businessEmail?: string,
  logo?: string,
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ── Colors ──
  const primaryColor: [number, number, number] = [234, 88, 12]; // Orange-600
  const darkColor: [number, number, number] = [17, 24, 39]; // Gray-900
  const grayColor: [number, number, number] = [107, 114, 128]; // Gray-500
  const lightGray: [number, number, number] = [243, 244, 246]; // Gray-100

  // ── Header ──
  let headerTextX = margin;

  // Add logo if available (base64 data URL from settings)
  if (logo) {
    try {
      doc.addImage(logo, "PNG", margin, y - 2, 14, 14);
      headerTextX = margin + 18; // Shift text right of logo
    } catch {
      // Silently skip if image fails
    }
  }

  doc.setFontSize(28);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", headerTextX, y + 8);

  // Invoice number (right-aligned)
  doc.setFontSize(12);
  doc.setTextColor(...darkColor);
  doc.text(invoice.invoiceNumber, pageWidth - margin, y + 4, {
    align: "right",
  });
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text(
    `Created: ${formatDate(invoice.createdAt)}`,
    pageWidth - margin,
    y + 10,
    { align: "right" },
  );
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, pageWidth - margin, y + 15, {
    align: "right",
  });

  y += 28;

  // ── Divider ──
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // ── From / To section ──
  const colMid = margin + contentWidth / 2;

  // From
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "normal");
  doc.text("FROM", margin, y);
  y += 5;
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.text(businessName || "Verto User", margin, y);
  y += 5;
  if (businessEmail) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayColor);
    doc.text(businessEmail, margin, y);
  }

  // To (same vertical position)
  const toY = y - 10;
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "normal");
  doc.text("BILL TO", colMid, toY);
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.clientName, colMid, toY + 5);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayColor);
  doc.text(invoice.description, colMid, toY + 10);

  y += 12;

  // ── Line Items Table ──
  // Header
  doc.setFillColor(...lightGray);
  doc.rect(margin, y, contentWidth, 8, "F");
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", margin + 3, y + 5.5);
  doc.text("QTY", margin + contentWidth * 0.55, y + 5.5, { align: "center" });
  doc.text("RATE", margin + contentWidth * 0.72, y + 5.5, { align: "right" });
  doc.text("AMOUNT", pageWidth - margin - 3, y + 5.5, { align: "right" });
  y += 12;

  // Items
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...darkColor);
  doc.setFontSize(9);

  for (const item of invoice.items) {
    doc.setTextColor(...darkColor);
    doc.text(item.description, margin + 3, y);
    doc.setTextColor(...grayColor);
    doc.text(String(item.quantity), margin + contentWidth * 0.55, y, {
      align: "center",
    });
    doc.text(formatCurrency(item.rate), margin + contentWidth * 0.72, y, {
      align: "right",
    });
    doc.setTextColor(...darkColor);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(item.amount), pageWidth - margin - 3, y, {
      align: "right",
    });
    doc.setFont("helvetica", "normal");

    y += 7;

    // Light separator line between items
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
  }

  y += 4;

  // ── Totals ──
  doc.setFillColor(...lightGray);
  doc.rect(margin + contentWidth * 0.5, y, contentWidth * 0.5, 10, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkColor);
  doc.text("TOTAL", margin + contentWidth * 0.55, y + 7);
  doc.setFontSize(13);
  doc.setTextColor(...primaryColor);
  doc.text(formatCurrency(invoice.amountUsd), pageWidth - margin - 3, y + 7, {
    align: "right",
  });

  y += 16;

  // BTC equivalent
  if (invoice.amountBtc > 0) {
    doc.setFontSize(9);
    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "normal");
    doc.text(
      `≈ ${formatBtcAmount(invoice.amountBtc)} BTC`,
      pageWidth - margin - 3,
      y,
      { align: "right" },
    );
    y += 8;
  }

  y += 6;

  // ── Payment Section ──
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Address", margin, y);
  y += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayColor);

  // Payment address in a box
  const addrBoxY = y - 1;
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, addrBoxY, contentWidth, 10, 2, 2, "FD");
  doc.setTextColor(...darkColor);
  doc.setFontSize(8);
  doc.text(invoice.paymentAddress, margin + 3, y + 5);

  y += 14;

  // QR Code
  const btcUri =
    invoice.amountBtc > 0
      ? `bitcoin:${invoice.paymentAddress}?amount=${invoice.amountBtc}`
      : `bitcoin:${invoice.paymentAddress}`;
  const qrDataUrl = await generateQrDataUrl(btcUri);
  if (qrDataUrl) {
    const qrSize = 35;
    const qrX = margin + (contentWidth - qrSize) / 2;
    doc.addImage(qrDataUrl, "PNG", qrX, y, qrSize, qrSize);
    y += qrSize + 3;
    doc.setFontSize(7);
    doc.setTextColor(...grayColor);
    doc.text("Scan with any Bitcoin wallet", pageWidth / 2, y, {
      align: "center",
    });
    y += 6;
  } else {
    y += 4;
  }

  // ── Notes ──
  if (invoice.notes) {
    doc.setFontSize(9);
    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "italic");
    doc.text("Notes:", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const splitNotes = doc.splitTextToSize(invoice.notes, contentWidth);
    doc.text(splitNotes, margin, y);
    y += splitNotes.length * 4 + 4;
  }

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  doc.setFontSize(7);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Generated by Verto — Invoicing for Sovereign Workers",
    margin,
    footerY,
  );
  doc.text("verto.io", pageWidth - margin, footerY, { align: "right" });

  return doc;
}

/**
 * Generate and download a PDF invoice
 */
export async function downloadInvoicePdf(
  invoice: Invoice,
  businessName?: string,
  businessEmail?: string,
  logo?: string,
) {
  const doc = await generateInvoicePdf(
    invoice,
    businessName,
    businessEmail,
    logo,
  );
  doc.save(`${invoice.invoiceNumber}.pdf`);
}
