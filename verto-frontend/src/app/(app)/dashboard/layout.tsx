import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Verto",
  description: "Overview of your invoicing and escrow activity on Verto.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
