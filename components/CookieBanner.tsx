"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const COOKIE_KEY = "greentrack_cookies_accepted";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const acceptRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) setVisible(true);
  }, []);

  useEffect(() => {
    if (visible) acceptRef.current?.focus();
  }, [visible]);

  function accept() {
    localStorage.setItem(COOKIE_KEY, "1");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(COOKIE_KEY, "0");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cookie consent"
      aria-describedby="cookie-banner-desc"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center pointer-events-none"
    >
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-5 max-w-xl w-full pointer-events-auto flex flex-col gap-3">
        <p id="cookie-banner-desc" className="text-sm text-gray-700">
          We use essential cookies to keep you signed in and analytics cookies to improve GreenTrack AI.
          See our{" "}
          <Link href="/privacy" className="text-green-600 underline">
            Privacy Policy
          </Link>.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={decline}
            className="px-4 py-2 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
          >
            Essential only
          </button>
          <button
            ref={acceptRef}
            type="button"
            onClick={accept}
            className="px-4 py-2 text-xs rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
