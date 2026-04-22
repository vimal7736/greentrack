export const mockUser = {
  id: "user_1",
  name: "James Mitchell",
  email: "james@acmeltd.co.uk",
  role: "owner",
  avatar: "JM",
};

export const mockOrg = {
  id: "org_1",
  name: "Acme Ltd",
  logo: null,
  tier: "business" as "free" | "starter" | "business",
  seats_used: 3,
  seats_limit: 5,
};

export const mockBills = [
  { id: "b1", type: "Electricity", date: "2025-03-01", usage: 1240, unit: "kWh", co2_kg: 219.48, cost: 312.4, status: "processed" },
  { id: "b2", type: "Gas", date: "2025-03-01", usage: 890, unit: "kWh", co2_kg: 161.98, cost: 98.2, status: "processed" },
  { id: "b3", type: "Electricity", date: "2025-02-01", usage: 1380, unit: "kWh", co2_kg: 244.26, cost: 347.5, status: "processed" },
  { id: "b4", type: "Gas", date: "2025-02-01", usage: 1100, unit: "kWh", co2_kg: 200.2, cost: 121.0, status: "processed" },
  { id: "b5", type: "Fuel", date: "2025-01-01", usage: 85, unit: "litre", co2_kg: 218.54, cost: 127.5, status: "processed" },
  { id: "b6", type: "Electricity", date: "2025-01-01", usage: 1560, unit: "kWh", co2_kg: 276.12, cost: 392.4, status: "processed" },
  { id: "b7", type: "Gas", date: "2024-12-01", usage: 1450, unit: "kWh", co2_kg: 263.9, cost: 159.5, status: "processed" },
  { id: "b8", type: "Water", date: "2024-12-01", usage: 42, unit: "m³", co2_kg: 14.7, cost: 62.1, status: "processed" },
  { id: "b9", type: "Electricity", date: "2024-11-01", usage: 1190, unit: "kWh", co2_kg: 210.63, cost: 299.7, status: "processed" },
  { id: "b10", type: "Fuel", date: "2024-11-01", usage: 110, unit: "litre", co2_kg: 282.81, cost: 165.0, status: "processed" },
];

export const mockMonthlyData = [
  { month: "Oct", co2: 420, kwh: 2100 },
  { month: "Nov", co2: 493, kwh: 2390 },
  { month: "Dec", co2: 478, kwh: 2640 },
  { month: "Jan", co2: 495, kwh: 2645 },
  { month: "Feb", co2: 444, kwh: 2480 },
  { month: "Mar", co2: 381, kwh: 2130 },
];

export const mockTeamMembers = [
  { id: "u1", name: "James Mitchell", email: "james@acmeltd.co.uk", role: "Owner", joined: "2024-10-01", avatar: "JM" },
  { id: "u2", name: "Sarah Chen", email: "sarah@acmeltd.co.uk", role: "Member", joined: "2024-11-15", avatar: "SC" },
  { id: "u3", name: "Tom Hughes", email: "tom@acmeltd.co.uk", role: "Member", joined: "2025-01-08", avatar: "TH" },
];

export const mockAdminStats = {
  total_orgs: 142,
  total_users: 389,
  mrr: 4821,
  bills_today: 34,
  ocr_error_rate: 2.4,
};

export const mockAdminOrgs = [
  { id: "o1", name: "Acme Ltd", tier: "business", users: 3, bills: 48, joined: "2024-10-01", status: "active" },
  { id: "o2", name: "BlueWave Tech", tier: "starter", users: 1, bills: 22, joined: "2024-11-12", status: "active" },
  { id: "o3", name: "GreenFields Farm", tier: "free", users: 1, bills: 3, joined: "2025-01-20", status: "active" },
  { id: "o4", name: "Metro Builders", tier: "starter", users: 1, bills: 15, joined: "2025-02-03", status: "suspended" },
  { id: "o5", name: "Swift Logistics", tier: "business", users: 4, bills: 67, joined: "2024-09-15", status: "active" },
];

export const emissionFactors = [
  { id: "ef1", fuel: "UK Electricity", unit: "kWh", factor: 0.177, scope: 2, valid_from: "2025-01-01", valid_to: "2025-12-31" },
  { id: "ef2", fuel: "Natural Gas", unit: "kWh", factor: 0.182, scope: 1, valid_from: "2025-01-01", valid_to: "2025-12-31" },
  { id: "ef3", fuel: "Natural Gas", unit: "m³", factor: 2.066, scope: 1, valid_from: "2025-01-01", valid_to: "2025-12-31" },
  { id: "ef4", fuel: "Diesel", unit: "litre", factor: 2.571, scope: 1, valid_from: "2025-01-01", valid_to: "2025-12-31" },
  { id: "ef5", fuel: "Petrol", unit: "litre", factor: 2.31, scope: 1, valid_from: "2025-01-01", valid_to: "2025-12-31" },
];
