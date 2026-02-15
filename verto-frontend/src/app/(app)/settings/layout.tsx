import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings — Verto",
  description:
    "Configure your Verto workspace, business details, and wallet settings.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
