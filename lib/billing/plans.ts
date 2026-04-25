import type { Tier } from "@/types";

export interface PlanDefinition {
  id: Tier;
  name: string;
  price: number;
  vatRate?: number;
  features: string[];
  popular?: boolean;
}

export const PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    features: [
      "3 electricity bills/month",
      "Basic dashboard",
      "No PDF reports",
      "1 user seat",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: 24,
    vatRate: 0.2,
    features: [
      "Unlimited bills (all types)",
      "Full dashboard & charts",
      "PDF SECR reports",
      "12-month history",
      "5 user seats",
    ],
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    price: 99,
    vatRate: 0.2,
    features: [
      "Everything in Starter",
      "Up to 20 user seats",
      "Branded PDF reports",
      "CSV export",
      "Priority support",
    ],
  },
];
