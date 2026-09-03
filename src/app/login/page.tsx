"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wrench,
  ShieldCheck,
  User,
  Mic,
  Phone,
  Lock,
  Mail,
  ArrowRight,
  ChevronRight,
  Compass,
  Sparkles,
  Zap,
  Building,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import {
  sendPhoneOtp,
  verifyPhoneOtp,
  signInWithPassword,
  signUpWithPassword,
  normalizeUserRole,
  AuthSessionUser,
} from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [authFlowStep, setAuthFlowStep] = useState<
    "CHOICE" | "CUSTOMER_AUTH" | "WORKER_AUTH" | "ADMIN_AUTH"
  >("CHOICE");

  // Mode: Sign In vs Sign Up
  const [authMode, setAuthMode] = useState<"SIGN_IN" | "SIGN_UP">("SIGN_IN");
  const [authMethod, setAuthMethod] = useState<"OTP" | "PASSWORD">("OTP");

  // Form fields
  const [fullName, setFullName] = useState("");
  const [phoneNum, setPhoneNum] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workerSkill, setWorkerSkill] = useState("Electrician");

  // OTP State
  const [otpStep, setOtpStep] = useState<"PHONE" | "OTP">("PHONE");
  const [otpInput, setOtpInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRedirectByRole = (role?: string) => {
    const canonical = normalizeUserRole(role);
    if (canonical === "worker") {
      router.push("/?section=WORKER_PORTAL");
    } else if (canonical === "cooperative_admin" || canonical === "super_admin") {
      router.push("/?section=COOPERATIVE_ADMIN");
    } else {
      router.push("/?section=MARKETPLACE");
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthNotice(null);

    if (authMode === "SIGN_UP" && !fullName.trim()) {
      setAuthError("Please enter your full name");
      return;
    }
    if (phoneNum.length < 10) {
      setAuthError("Please enter a valid 10-digit mobile number");
      return;
    }

    setIsSubmitting(true);
    const res = await sendPhoneOtp(phoneNum);
    setIsSubmitting(false);

    if (res.success) {
      setOtpStep("OTP");
      setResendTimer(60);
      setAuthNotice(res.message);
    } else {
      setAuthError(res.message);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (otpInput.trim().length < 4) {
      setAuthError("Enter the 6-digit OTP code");
      return;
    }

    setIsSubmitting(true);
    const targetRole =
      authFlowStep === "WORKER_AUTH"
        ? "worker"
        : authFlowStep === "ADMIN_AUTH"
        ? "cooperative_admin"
        : "customer";

    const res = await verifyPhoneOtp(
      phoneNum,
      otpInput,
      fullName || (authFlowStep === "WORKER_AUTH" ? "Technician" : "Customer"),
      targetRole
    );
    setIsSubmitting(false);

    if (res.success && res.user) {
      handleRedirectByRole(res.user.role);
    } else {
      setAuthError(res.message || "Failed to verify OTP");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthNotice(null);

    if (!email || !password) {
      setAuthError("Please enter email and password");
      return;
    }

    setIsSubmitting(true);
    const targetRole =
      authFlowStep === "WORKER_AUTH"
        ? "worker"
        : authFlowStep === "ADMIN_AUTH"
        ? "cooperative_admin"
        : "customer";

    let res;
    if (authMode === "SIGN_UP") {
      if (!fullName.trim()) {
        setIsSubmitting(false);
        setAuthError("Please enter your full name for registration");
        return;
      }
      res = await signUpWithPassword(
        email,
        password,
        fullName,
        targetRole,
        phoneNum ? `+91${phoneNum}` : undefined
      );
    } else {
      res = await signInWithPassword(email, password);
    }

    setIsSubmitting(false);

    if (res.success && res.user) {
      handleRedirectByRole(res.user.role);
    } else {
      setAuthError(res.message || "Authentication failed. Please check your credentials.");
    }
  };

  const handleGuestLogin = () => {
    const guestObj: AuthSessionUser = {
      id: "guest-user",
      name: "Guest Explorer",
      role: "customer",
      token: "guest-token",
    };
    localStorage.setItem("skilllink_user", JSON.stringify(guestObj));
    router.push("/?section=MARKETPLACE");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900">
      {/* Top Navbar */}
      <header className="w-full bg-white border-b border-slate-200 py-3.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Skill-Link
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Supabase Verified
                </span>
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGuestLogin}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              Skip &amp; Browse as Guest →
            </button>
          </div>
        </div>
      </header>

      {/* Main Sign-In Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto shadow-sm">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Welcome to Skill-Link
              </h1>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                Sign in to book verified local technicians, manage jobs, or oversee cooperative society dispatches.
              </p>
            </div>
          </div>

          {/* Role Choice */}
          {authFlowStep === "CHOICE" && (
            <div className="space-y-3 pt-2">
              {/* Customer */}
              <button
                onClick={() => {
                  setAuthFlowStep("CUSTOMER_AUTH");
                  setAuthError(null);
                }}
                className="w-full p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-all text-left group shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      I am a Customer
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Book Pro
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Book verified plumbers, electricians, AC repair, carpenters, and emergency mechanics.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              {/* Worker */}
              <button
                onClick={() => {
                  setAuthFlowStep("WORKER_AUTH");
                  setAuthError(null);
                }}
                className="w-full p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-all text-left group shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      I am a Skilled Technician / Worker
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Worker Portal
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Receive job dispatches, track daily earnings passbook, and manage cooperative welfare schemes.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              {/* Cooperative Admin */}
              <button
                onClick={() => {
                  setAuthFlowStep("ADMIN_AUTH");
                  setAuthError(null);
                }}
                className="w-full p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-all text-left group shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      Cooperative Administrator
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        Admin Hub
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Worker KYC verification, 3% welfare fund audits, and AI seasonal demand forecasting.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <Link
                  href="/register"
                  className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                >
                  <Mic className="w-3.5 h-3.5" /> Sahayak 2-Way Voice Onboarding →
                </Link>
                <button
                  onClick={handleGuestLogin}
                  className="text-slate-500 hover:text-blue-600 font-semibold flex items-center gap-1"
                >
                  <Compass className="w-3.5 h-3.5" /> Guest Mode →
                </button>
              </div>
            </div>
          )}

          {/* Customer / Worker / Admin Auth Form */}
          {authFlowStep !== "CHOICE" && (
            <div className="space-y-4">
              {/* Header with back button */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  {authFlowStep === "CUSTOMER_AUTH" && (
                    <>
                      <User className="w-4 h-4 text-blue-600" />
                      {authMode === "SIGN_IN" ? "Customer Sign In" : "Customer Registration"}
                    </>
                  )}
                  {authFlowStep === "WORKER_AUTH" && (
                    <>
                      <Briefcase className="w-4 h-4 text-emerald-600" />
                      {authMode === "SIGN_IN" ? "Technician Sign In" : "Technician Registration"}
                    </>
                  )}
                  {authFlowStep === "ADMIN_AUTH" && (
                    <>
                      <Building className="w-4 h-4 text-purple-600" />
                      Cooperative Administrator Portal
                    </>
                  )}
                </h2>
                <button
                  onClick={() => {
                    setAuthFlowStep("CHOICE");
                    setAuthError(null);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-blue-600"
                >
                  Change Role
                </button>
              </div>

              {/* Mode Switcher: Sign In vs Sign Up (except Admin which is sign-in) */}
              {authFlowStep !== "ADMIN_AUTH" && (
                <div className="flex border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("SIGN_IN");
                      setAuthError(null);
                    }}
                    className={`pb-2 px-4 text-xs font-bold transition-all border-b-2 ${
                      authMode === "SIGN_IN"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("SIGN_UP");
                      setAuthError(null);
                    }}
                    className={`pb-2 px-4 text-xs font-bold transition-all border-b-2 ${
                      authMode === "SIGN_UP"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Method Switcher */}
              <div className="flex p-1 bg-slate-100 border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod("OTP");
                    setAuthError(null);
                  }}
                  className={`w-1/2 py-2 text-xs font-bold rounded-lg transition-all ${
                    authMethod === "OTP"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 inline mr-1 text-blue-600" /> Phone OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod("PASSWORD");
                    setAuthError(null);
                  }}
                  className={`w-1/2 py-2 text-xs font-bold rounded-lg transition-all ${
                    authMethod === "PASSWORD"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 inline mr-1 text-blue-600" /> Email &amp; Password
                </button>
              </div>

              {/* Notice & Error banners */}
              {authNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800">
                  {authNotice}
                </div>
              )}
              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {/* OTP Form */}
              {authMethod === "OTP" && (
                <>
                  {otpStep === "PHONE" ? (
                    <form onSubmit={handleSendOtp} className="space-y-3.5">
                      {authMode === "SIGN_UP" && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Ramanand Sharma"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white min-h-[44px]"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          10-Digit Mobile Number
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-500">
                            +91
                          </span>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            value={phoneNum}
                            onChange={(e) => setPhoneNum(e.target.value.replace(/\D/g, ""))}
                            placeholder="9876543210"
                            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white min-h-[44px]"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 min-h-[44px]"
                      >
                        <span>{isSubmitting ? "Sending OTP..." : "Send Verification Code"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700">
                            Enter 6-Digit OTP Code
                          </label>
                          <span className="text-xs font-bold text-blue-600">
                            +91 {phoneNum}
                          </span>
                        </div>

                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                          placeholder="123456"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center tracking-widest text-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white min-h-[48px]"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setOtpStep("PHONE")}
                          className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-2/3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
                        >
                          {isSubmitting ? "Verifying..." : "Verify & Sign In"}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* Password Form */}
              {authMethod === "PASSWORD" && (
                <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
                  {authMode === "SIGN_UP" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Ramanand Sharma"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white min-h-[44px]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white min-h-[44px]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <span>
                      {isSubmitting
                        ? "Processing..."
                        : authMode === "SIGN_UP"
                        ? "Create Account"
                        : "Sign In"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <p>© 2026 Skill-Link Technologies. Connected to Supabase Backend &amp; Cooperative Gig Network.</p>
      </footer>
    </div>
  );
}
