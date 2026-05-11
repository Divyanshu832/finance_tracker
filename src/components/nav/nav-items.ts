import {
  LayoutDashboard, ArrowDownToLine, Receipt, CreditCard, Repeat,
  HandCoins, Briefcase, PiggyBank, type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; accent: string };

export const NAV: NavItem[] = [
  { href: "/",              label: "Dashboard",     icon: LayoutDashboard, accent: "" },
  { href: "/income",        label: "Income",        icon: ArrowDownToLine, accent: "text-positive" },
  { href: "/expenses",      label: "Expenses",      icon: Receipt,         accent: "text-negative" },
  { href: "/bills",         label: "Bills & EMIs",  icon: CreditCard,      accent: "text-warning" },
  { href: "/subscriptions", label: "Subscriptions", icon: Repeat,          accent: "text-foreground" },
  { href: "/lending",       label: "Lending",       icon: HandCoins,       accent: "text-lending" },
  { href: "/ventures",      label: "Ventures",      icon: Briefcase,       accent: "text-venture" },
  { href: "/investments",   label: "Investments",   icon: PiggyBank,       accent: "text-invest" },
];

// First 4 + More button = 5 slots on mobile.
export const MOBILE_PRIMARY = NAV.slice(0, 4);
