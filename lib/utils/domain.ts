const PUBLIC_DOMAINS = new Set([
  "gmail.com", "googlemail.com",
  "yahoo.com", "yahoo.co.uk", "yahoo.in",
  "hotmail.com", "hotmail.co.uk",
  "outlook.com", "outlook.in",
  "live.com", "msn.com",
  "icloud.com", "me.com", "mac.com",
  "aol.com", "protonmail.com", "proton.me",
  "mail.com", "ymail.com", "zoho.com",
]);

export function isPublicDomain(domain: string): boolean {
  return PUBLIC_DOMAINS.has(domain.toLowerCase().trim());
}
