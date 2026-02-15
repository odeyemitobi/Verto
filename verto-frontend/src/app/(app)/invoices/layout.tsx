import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoices — Verto",
  description:
    "Create, manage, and track Bitcoin invoices with automatic payment detection.",
};

export default function InvoicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
