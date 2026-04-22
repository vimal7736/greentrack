"use client";

import { useState } from "react";
import { Leaf, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const supabase = createClient();

  const [step, setStep] = useState<"form" | "verify">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");

  async function handleSignup(formData: FormData) {
    setLoading(true);
    setError(null);

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const company = formData.get("company") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // 1. Create the auth user in Supabase
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // This data gets saved to the profile after email confirmation
        data: {
          full_name: `${firstName} ${lastName}`,
          company_name: company,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    // 2. If signup succeeded, show the verify email step
    if (data.user) {
      setUserEmail(email);
      setStep("verify");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-green-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Leaf className="w-8 h-8 text-green-900" />
          </div>
          <h1 className="text-2xl font-bold text-white">GreenTrack AI</h1>
          <p className="text-green-300 text-sm mt-1">Start tracking your carbon footprint</p>
        </div>

        {step === "form" ? (
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Create your account</h2>
            <p className="text-gray-500 text-sm mb-6">Free to start — no credit card required</p>

            {error && (
              <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form action={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    First name
                  </label>
                  <input
                    name="firstName"
                    required
                    placeholder="James"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Last name
                  </label>
                  <input
                    name="lastName"
                    required
                    placeholder="Mitchell"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Company name
                </label>
                <input
                  name="company"
                  required
                  placeholder="Acme Ltd"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Work email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="james@acmeltd.co.uk"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <label className="flex items-start gap-2 text-xs text-gray-500 cursor-pointer">
                <input type="checkbox" required className="mt-0.5 rounded" />
                I agree to the{" "}
                <Link href="/terms" className="text-green-600 underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-green-600 underline">Privacy Policy</Link>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-lg font-semibold text-sm transition-colors"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-green-600 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        ) : (
          /* Email verification step */
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-500 text-sm mb-6">
              We sent a verification link to{" "}
              <strong className="text-gray-800">{userEmail}</strong>.
              <br />
              Click the link to activate your account.
            </p>
            <p className="text-xs text-gray-400">
              Didn&apos;t get it? Check your spam folder, or{" "}
              <button
                onClick={() => setStep("form")}
                className="text-green-600 underline"
              >
                try again
              </button>
              .
            </p>
          </div>
        )}

        <p className="text-center text-green-400 text-xs mt-6">
          UK GDPR compliant · PECR Cookie consent · Data stored in London
        </p>
      </div>
    </div>
  );
}
