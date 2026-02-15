import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Escrow — Verto",
  description:
    "Manage trustless escrow contracts for your projects on the Stacks blockchain.",
};

export default function EscrowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
