"use client";

import { useState, useEffect } from "react";
import {
  Leaf, CheckCircle, AlertCircle, ArrowRight, ArrowLeft,
  Eye, EyeOff, ShieldCheck, BarChart3, FileText, Users, Building2, Clock,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/* ── Constants ──────────────────────────────────────────────── */
const UK_INDUSTRIES = [
  "Agriculture & Forestry", "Construction & Property", "Education",
  "Energy & Utilities", "Finance & Insurance", "Food & Beverage",
  "Healthcare & Social Care", "Hospitality & Tourism", "IT & Technology",
  "Legal & Professional Services", "Manufacturing", "Media & Communications",
  "Retail & Wholesale", "Transport & Logistics", "Other",
];

/* ── Types ──────────────────────────────────────────────────── */
type OrgData = {
  companyName: string; companyNumber: string; vatNumber: string; industry: string;
  orgEmail: string; phone: string; website: string;
  addressLine1: string; addressLine2: string; city: string;
  county: string; postcode: string; country: string;
};
type UserData = {
  firstName: string; lastName: string; jobTitle: string;
  email: string; phone: string; password: string; confirmPassword: string;
};

const INIT_ORG: OrgData = {
  companyName: "", companyNumber: "", vatNumber: "", industry: "", orgEmail: "",
  phone: "", website: "", addressLine1: "", addressLine2: "", city: "",
  county: "", postcode: "", country: "GB",
};
const INIT_USER: UserData = {
  firstName: "", lastName: "", jobTitle: "", email: "", phone: "", password: "", confirmPassword: "",
};

/* ── Shared styles ──────────────────────────────────────────── */
const inp =
  "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-900 " +
  "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all";
const sel = inp + " cursor-pointer";

function F({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
        {label}{req && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function SignupPage() {
  const supabase = createClient();
  const [step, setStep]           = useState<1 | 2 | "done">(1);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [doneEmail, setDoneEmail] = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [org, setOrg]             = useState<OrgData>(INIT_ORG);
  const [user, setUser]           = useState<UserData>(INIT_USER);

  // Discovery State
  const [discoveredOrg, setDiscoveredOrg] = useState<{ id: string, name: string } | null>(null);
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [requestStatus, setRequestStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const setO = (f: keyof OrgData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setOrg(p => ({ ...p, [f]: e.target.value }));
  const setU = (f: keyof UserData) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setUser(p => ({ ...p, [f]: e.target.value }));

  function handleStep1() {
    setError(null);
    if (!discoveredOrg) {
      if (!/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(org.postcode.trim())) {
        setError("Enter a valid UK postcode — e.g. SW1A 1AA");
        return;
      }
    }
    setStep(2);
  }

  // Domain Discovery Effect
  useEffect(() => {
    const emailToCheck = org.orgEmail || user.email;
    if (!emailToCheck.includes("@")) {
      setDiscoveredOrg(null);
      return;
    }

    const timer = setTimeout(async () => {
      const domain = emailToCheck.split("@")[1].toLowerCase();
      // Skip common generic domains (Temporarily disabled for testing)
      // const generic = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com"];
      // if (generic.includes(domain)) return;

      setCheckingDomain(true);
      try {
        const res = await fetch(`/api/org/discovery?email=${encodeURIComponent(emailToCheck)}`);
        const data = await res.json();
        if (data.found) {
          setDiscoveredOrg({ id: data.orgId, name: data.orgName });
        } else {
          setDiscoveredOrg(null);
        }
      } catch (e) {
        console.error("Discovery error", e);
      } finally {
        setCheckingDomain(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [org.orgEmail, user.email, step]);

  async function handleRequestJoin() {
    if (!discoveredOrg) return;
    console.log("DEBUG: Starting handleRequestJoin for org:", discoveredOrg.id);
    setError(null);
    setRequestStatus("loading");

    // 1. Sign up the user first (auth only)
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          full_name: `${user.firstName} ${user.lastName}`,
          job_title: user.jobTitle,
        }
      }
    });

    if (signUpErr) {
      console.error("DEBUG: signUp error in handleRequestJoin:", signUpErr);
      setError(signUpErr.message);
      setRequestStatus("error");
      return;
    }

    console.log("DEBUG: signUp success in handleRequestJoin. User ID:", data.user?.id);

    // 2. Create the join request
    try {
      const res = await fetch("/api/org/request-join", {
        method: "POST",
        body: JSON.stringify({ 
          orgId: discoveredOrg.id,
          userId: data.user?.id 
        }),
      });

      const resData = await res.json();
      console.log("DEBUG: Join Request API Response:", resData);

      if (!res.ok) {
        setError(resData.error || "Failed to submit request");
        setRequestStatus("error");
        return;
      }

      console.log("DEBUG: Join Request successful!");
      setRequestStatus("done");
      setDoneEmail(user.email);
      setStep("done");
    } catch (err) {
      console.error("DEBUG: Fetch error in handleRequestJoin:", err);
      setError("Network error. Please try again.");
      setRequestStatus("error");
    }
  }

  async function handleStep2() {
    setError(null);
    if (user.password !== user.confirmPassword) { setError("Passwords do not match."); return; }
    if (user.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    
    // If we found an existing org, use the Join Request flow instead of New Org flow
    if (discoveredOrg) {
      console.log("DEBUG: Redirecting handleStep2 to handleRequestJoin");
      await handleRequestJoin();
      return;
    }

    setLoading(true);

    const { data, error: err } = await supabase.auth.signUp({
      email: user.email, password: user.password,
      options: {
        data: {
          full_name: `${user.firstName} ${user.lastName}`.trim(),
          job_title: user.jobTitle,
          org_name: org.companyName.trim(),
          org_email: org.orgEmail,
          org_phone: org.phone,
          org_website: org.website,
          org_industry: org.industry,
          org_company_number: org.companyNumber,
          org_vat_number: org.vatNumber,
          org_address_line1: org.addressLine1,
          org_address_line2: org.addressLine2,
          org_city: org.city,
          org_county: org.county,
          org_postcode: org.postcode,
          org_country: org.country,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      },
    });

    console.log("DEBUG: signUp attempt in handleStep2 finished.");
    setLoading(false);
    
    if (err) { 
      console.error("DEBUG: signUp error in handleStep2:", err);
      setError(err.message); 
      return; 
    }
    
    if (data.user) { 
      console.log("DEBUG: signUp success in handleStep2. User ID:", data.user.id);
      setDoneEmail(user.email); 
      setStep("done"); 
    }
  }

  return (
    <div className="h-screen flex overflow-hidden">

      {/* ── Left branding panel ─────────────────────────────── */}
      <div className="hidden lg:flex w-[380px] shrink-0 bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex-col justify-between p-10">
        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-green-400 rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-green-900" />
            </div>
            <span className="text-white font-bold text-lg">GreenTrack AI</span>
          </div>
          <h2 className="text-white text-2xl font-black leading-snug mb-3">
            Carbon management<br />for UK businesses
          </h2>
          <p className="text-green-300 text-sm leading-relaxed mb-10">
            Track, report, and reduce your carbon footprint using real UK DEFRA emission factors.
          </p>
          <div className="space-y-4">
            {[
              { Icon: BarChart3,  text: "Automatic CO₂ calculation from bills" },
              { Icon: FileText,   text: "SECR-compliant PDF carbon reports" },
              { Icon: Users,      text: "Team management & role-based access" },
              { Icon: ShieldCheck, text: "UK GDPR compliant · Data in London" },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-green-700 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-green-300" />
                </div>
                <p className="text-green-200 text-xs">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-green-500 text-[10px]">© 2025 GreenTrack AI · Free to start</p>
      </div>

      {/* ── Right form panel ────────────────────────────────── */}
      <div className="flex-1 bg-white overflow-y-auto flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-2 px-6 pt-6 pb-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">GreenTrack AI</span>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 lg:px-14 py-6 max-w-xl w-full mx-auto lg:mx-0 lg:max-w-none">

          {/* ── Done ──────────────────────────────────────── */}
          {step === "done" && (
            <div className="text-center max-w-sm mx-auto">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {requestStatus === "done" ? "Request Submitted" : "Check your email"}
              </h2>
              <p className="text-gray-500 text-sm mb-1">
                {requestStatus === "done" 
                  ? `Your request to join ${discoveredOrg?.name} has been sent to their admins.`
                  : `Verification link sent to ${doneEmail}`
                }
              </p>
              {requestStatus !== "done" && (
                <p className="text-gray-500 text-sm mb-6">
                  Welcome email sent to <strong className="text-gray-800">{org.orgEmail}</strong>
                </p>
              )}
              {requestStatus === "done" && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-left">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-widest mb-2">
                    <Clock className="w-3.5 h-3.5" /> Next Steps
                  </div>
                  <ul className="text-xs text-blue-600 space-y-2">
                    <li>1. Verify your email (check your inbox)</li>
                    <li>2. Wait for an admin to approve your request</li>
                    <li>3. You'll be notified once you have access</li>
                  </ul>
                </div>
              )}
              <div className="mt-8">
                <Link href="/login" className="text-green-600 text-sm font-semibold hover:underline">
                  Back to Sign In →
                </Link>
              </div>
            </div>
          )}

          {step !== "done" && (
            <>
              {/* Step indicator */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? "bg-green-600 text-white" : "bg-green-100 text-green-600"}`}>
                    {step === 2 ? <CheckCircle className="w-3.5 h-3.5" /> : "1"}
                  </div>
                  <span className={`text-xs font-bold ${step === 1 ? "text-green-600" : "text-gray-400"}`}>Organisation</span>
                </div>
                <div className="flex-1 h-px bg-gray-200 relative">
                  <div className={`absolute inset-y-0 left-0 bg-green-500 transition-all duration-500 ${step === 2 ? "w-full" : "w-0"}`} />
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? "bg-green-600 text-white" : "bg-gray-100 text-gray-400"}`}>2</div>
                  <span className={`text-xs font-bold ${step === 2 ? "text-green-600" : "text-gray-400"}`}>Admin User</span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2.5 rounded-lg mb-4">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}

              {/* ── STEP 1 ──────────────────────────────────── */}
              {step === 1 && (
                <form action={handleStep1} className="space-y-3">
                  <div className="mb-1">
                    <h2 className="text-lg font-bold text-gray-900">Organisation Details</h2>
                    <p className="text-gray-400 text-xs mt-0.5">Tell us about your company</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <F label="Organisation Email" req>
                      <input className={inp} required type="email" autoComplete="off" placeholder="hello@acme.co.uk" value={org.orgEmail} onChange={setO("orgEmail")} />
                    </F>
                    <F label="Phone" req>
                      <input className={inp} required={!discoveredOrg} disabled={!!discoveredOrg} type="tel" placeholder="+44 20 7946 0958" value={org.phone} onChange={setO("phone")} />
                    </F>
                  </div>

                  {discoveredOrg ? (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-4 animate-in zoom-in-95">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                          <Building2 className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900">Found: {discoveredOrg.name}</p>
                          <p className="text-[11px] text-green-700 leading-relaxed mt-1">
                            This organisation is already registered. Continue to request your personal access.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <F label="Company Name" req>
                          <input className={inp} required placeholder="Acme Ltd" value={org.companyName} onChange={setO("companyName")} />
                        </F>
                        <F label="Companies House No." req>
                          <input className={inp} required placeholder="12345678" maxLength={8} value={org.companyNumber} onChange={setO("companyNumber")} />
                        </F>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <F label="VAT Number">
                          <input className={inp} placeholder="GB123456789" value={org.vatNumber} onChange={setO("vatNumber")} />
                        </F>
                        <F label="Industry" req>
                          <select className={sel} required value={org.industry} onChange={setO("industry")}>
                            <option value="">Select...</option>
                            {UK_INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                          </select>
                        </F>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <F label="Website">
                          <input className={inp} type="url" placeholder="https://acme.co.uk" value={org.website} onChange={setO("website")} />
                        </F>
                        <F label="Address Line 1" req>
                          <input className={inp} required placeholder="123 High Street" value={org.addressLine1} onChange={setO("addressLine1")} />
                        </F>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <F label="Address Line 2">
                          <input className={inp} placeholder="Suite 4" value={org.addressLine2} onChange={setO("addressLine2")} />
                        </F>
                        <F label="City" req>
                          <input className={inp} required placeholder="London" value={org.city} onChange={setO("city")} />
                        </F>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <F label="County">
                          <input className={inp} placeholder="Surrey" value={org.county} onChange={setO("county")} />
                        </F>
                        <F label="Postcode" req>
                          <input className={inp} required placeholder="SW1A 1AA" value={org.postcode} onChange={setO("postcode")} style={{ textTransform: "uppercase" }} />
                        </F>
                        <F label="Country" req>
                          <select className={sel} required value={org.country} onChange={setO("country")}>
                            <option value="GB">United Kingdom</option>
                            <option value="IE">Ireland</option>
                          </select>
                        </F>
                      </div>
                    </>
                  )}

                  <button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    {discoveredOrg ? "Continue to Request Access" : "Continue to Admin User"} <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-center text-xs text-gray-400 pt-1">
                    Already have an account?{" "}
                    <Link href="/login" className="text-green-600 font-semibold hover:underline">Sign in</Link>
                  </p>
                </form>
              )}

              {/* ── STEP 2 ──────────────────────────────────── */}
              {step === 2 && (
                <form action={handleStep2} className="space-y-3">
                  <div className="mb-1">
                    <h2 className="text-lg font-bold text-gray-900">Admin User</h2>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {discoveredOrg ? (
                        <>Request access to join <span className="text-green-600 font-semibold">{discoveredOrg.name}</span></>
                      ) : (
                        <>This person will manage <span className="text-green-600 font-semibold">{org.companyName}</span></>
                      )}
                    </p>
                  </div>

                  {discoveredOrg && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{discoveredOrg.name} found!</p>
                          <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                            This organisation is already registered. Instead of creating a duplicate, 
                            you can request to join their existing workspace.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <F label="First Name" req>
                      <input className={inp} required placeholder="James" value={user.firstName} onChange={setU("firstName")} />
                    </F>
                    <F label="Last Name" req>
                      <input className={inp} required placeholder="Mitchell" value={user.lastName} onChange={setU("lastName")} />
                    </F>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <F label="Job Title" req>
                      <input className={inp} required placeholder="Operations Manager" value={user.jobTitle} onChange={setU("jobTitle")} />
                    </F>
                    <F label="Direct Phone">
                      <input className={inp} type="tel" placeholder="+44 7700 900000" value={user.phone} onChange={setU("phone")} />
                    </F>
                  </div>

                  <F label="Admin Email" req>
                    <input className={inp} required type="email" autoComplete="off" placeholder="james@acme.co.uk" value={user.email} onChange={setU("email")} />
                  </F>

                  <div className="grid grid-cols-2 gap-3">
                    <F label="Password" req>
                      <div className="relative">
                        <input className={inp + " pr-9"} required autoComplete="new-password" type={showPass ? "text" : "password"} minLength={8} placeholder="Min. 8 chars" value={user.password} onChange={setU("password")} />
                        <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </F>
                    <F label="Confirm Password" req>
                      <div className="relative">
                        <input className={inp + " pr-9"} required autoComplete="new-password" type={showConf ? "text" : "password"} minLength={8} placeholder="Re-enter" value={user.confirmPassword} onChange={setU("confirmPassword")} />
                        <button type="button" onClick={() => setShowConf(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showConf ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </F>
                  </div>

                  {/* Email routing summary */}
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 text-[11px] text-green-700 space-y-0.5">
                    <p><span className="font-bold">Welcome email</span> → {org.orgEmail}</p>
                    <p><span className="font-bold">Verification & reset</span> → {user.email || "your admin email"}</p>
                  </div>

                  <label className="flex items-start gap-2 text-xs text-gray-500 cursor-pointer">
                    <input type="checkbox" required className="mt-0.5 rounded shrink-0 accent-green-600" />
                    <span>
                      I agree to the{" "}
                      <Link href="/terms" className="text-green-600 underline">Terms</Link>
                      {" "}and{" "}
                      <Link href="/privacy" className="text-green-600 underline">Privacy Policy</Link>
                    </span>
                  </label>

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => { setStep(1); setError(null); }}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    
                    {discoveredOrg ? (
                      <button type="button" onClick={handleRequestJoin} disabled={requestStatus === "loading"}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                        {requestStatus === "loading" ? "Submitting..." : "Request to Join Organisation"}
                      </button>
                    ) : (
                      <button type="submit" disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors">
                        {loading ? "Creating account..." : "Create Account"}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
