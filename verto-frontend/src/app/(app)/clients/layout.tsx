import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clients — Verto",
  description: "Manage your client relationships and track invoicing history.",
};

export default function ClientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
