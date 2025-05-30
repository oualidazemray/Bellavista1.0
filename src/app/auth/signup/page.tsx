"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/ui/navbar";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, Phone, Lock, ShieldCheck, LogIn } from "lucide-react";
import { signIn } from "next-auth/react";

interface SignupForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  verifyPassword: string;
}

const SignupPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<SignupForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    verifyPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.firstName || !formData.lastName) {
      toast.error("Please enter your full name", {
        style: {
          background: "#000",
          color: "#E3C08D",
          border: "1px solid #E3C08D",
        },
      });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address", {
        style: {
          background: "#000",
          color: "#E3C08D",
          border: "1px solid #E3C08D",
        },
      });
      return false;
    }
    if (!/^\+?[\d\s-]{8,}$/.test(formData.phone)) {
      toast.error("Please enter a valid phone number", {
        style: {
          background: "#000",
          color: "#E3C08D",
          border: "1px solid #E3C08D",
        },
      });
      return false;
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters", {
        style: {
          background: "#000",
          color: "#E3C08D",
          border: "1px solid #E3C08D",
        },
      });
      return false;
    }
    if (formData.password !== formData.verifyPassword) {
      toast.error("Passwords do not match", {
        style: {
          background: "#000",
          color: "#E3C08D",
          border: "1px solid #E3C08D",
        },
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Signup failed");

      localStorage.setItem("verificationEmail", formData.email);
      router.push("/auth/verification");
    } catch (error: any) {
      toast.error(error.message || "Signup failed", {
        style: {
          background: "#000",
          color: "#E3C08D",
          border: "1px solid #E3C08D",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch {
      toast.error(`Failed to sign in with ${provider}`, {
        style: {
          background: "#000",
          color: "#E3C08D",
          border: "1px solid #E3C08D",
        },
      });
    }
  };

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen w-full overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/beachBack.jpg"
            alt="Background"
            fill
            style={{ objectFit: "cover" }}
            priority
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex justify-center items-center min-h-screen px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 rounded-3xl overflow-hidden backdrop-blur-md"
          >
            {/* Left Content - Branding Panel */}
            <div className="relative overflow-hidden bg-black/40 border-r border-[#E3C08D]/30 p-8 flex flex-col justify-between lg:min-h-[680px]">
              <div className="absolute inset-0 z-0 opacity-20">
                <Image
                  src="/beachBack.jpg"
                  alt="Background"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>

              <div className="relative z-10">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={80}
                    height={80}
                    className="mb-6"
                  />
                  <h1 className="text-[#E3C08D] text-6xl font-seasons mb-3">
                    BELLAVISTA
                  </h1>
                  <div className="w-16 h-1 bg-[#E3C08D] my-6" />
                  <p className="text-[#E3C08D] text-xl font-seasons leading-relaxed">
                    Where Your Vacation Story Begins
                  </p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="relative z-10 mt-16"
              >
                <p className="text-[#E3C08D]/80 mb-6">
                  Already have an account? Sign in to access your bookings and
                  preferences.
                </p>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E3C08D]/10 border border-[#E3C08D] text-[#E3C08D] font-seasons text-lg hover:bg-[#E3C08D]/20 transition-all duration-300"
                >
                  <LogIn className="w-5 h-5" />
                  Sign in to your account
                </Link>
              </motion.div>
            </div>

            {/* Right Content - Signup Form */}
            <div className="bg-black/70 border-l border-[#E3C08D]/30 p-8 lg:p-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <h2 className="text-[#E3C08D] text-3xl font-seasons mb-6">
                  Create Your Account
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Names Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[#E3C08D] block font-seasons">
                        First Name
                      </label>
                      <div className="relative">
                        <User
                          className="absolute top-3 left-3 text-[#E3C08D]/70"
                          size={18}
                        />
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="ex: John"
                          className="w-full bg-[#1A1A1A] border border-[#E3C08D]/50 rounded-lg pl-10 px-4 py-3 text-[#E3C08D] placeholder-[#E3C08D]/40 focus:border-[#E3C08D] focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[#E3C08D] block font-seasons">
                        Last Name
                      </label>
                      <div className="relative">
                        <User
                          className="absolute top-3 left-3 text-[#E3C08D]/70"
                          size={18}
                        />
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="ex: Smith"
                          className="w-full bg-[#1A1A1A] border border-[#E3C08D]/50 rounded-lg pl-10 px-4 py-3 text-[#E3C08D] placeholder-[#E3C08D]/40 focus:border-[#E3C08D] focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-[#E3C08D] block font-seasons">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute top-3 left-3 text-[#E3C08D]/70"
                        size={18}
                      />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="you@example.com"
                        className="w-full bg-[#1A1A1A] border border-[#E3C08D]/50 rounded-lg pl-10 px-4 py-3 text-[#E3C08D] placeholder-[#E3C08D]/40 focus:border-[#E3C08D] focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-[#E3C08D] block font-seasons">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone
                        className="absolute top-3 left-3 text-[#E3C08D]/70"
                        size={18}
                      />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 123-4567"
                        className="w-full bg-[#1A1A1A] border border-[#E3C08D]/50 rounded-lg pl-10 px-4 py-3 text-[#E3C08D] placeholder-[#E3C08D]/40 focus:border-[#E3C08D] focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Passwords Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[#E3C08D] block font-seasons">
                        Password
                      </label>
                      <div className="relative">
                        <Lock
                          className="absolute top-3 left-3 text-[#E3C08D]/70"
                          size={18}
                        />
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="••••••••"
                          className="w-full bg-[#1A1A1A] border border-[#E3C08D]/50 rounded-lg pl-10 px-4 py-3 text-[#E3C08D] placeholder-[#E3C08D]/40 focus:border-[#E3C08D] focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[#E3C08D] block font-seasons">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <ShieldCheck
                          className="absolute top-3 left-3 text-[#E3C08D]/70"
                          size={18}
                        />
                        <input
                          type="password"
                          name="verifyPassword"
                          value={formData.verifyPassword}
                          onChange={handleInputChange}
                          placeholder="••••••••"
                          className="w-full bg-[#1A1A1A] border border-[#E3C08D]/50 rounded-lg pl-10 px-4 py-3 text-[#E3C08D] placeholder-[#E3C08D]/40 focus:border-[#E3C08D] focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-lg bg-[#E3C08D]/10 border border-[#E3C08D] text-[#E3C08D] font-seasons text-lg hover:bg-[#E3C08D]/20 transition-all"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Creating account...
                      </span>
                    ) : (
                      "Create Account"
                    )}
                  </motion.button>

                  <div className="mt-6">
                    <div className="flex items-center">
                      <div className="flex-grow h-px bg-[#E3C08D]/30" />
                      <span className="px-4 text-[#E3C08D]/70 text-sm">
                        Or sign up with
                      </span>
                      <div className="flex-grow h-px bg-[#E3C08D]/30" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <SocialSignupButton
                        icon="/google-icon.png"
                        label="Google"
                        onClick={() => handleSocialLogin("google")}
                      />
                      <SocialSignupButton
                        icon="/facebook-icon.png"
                        label="Facebook"
                        onClick={() => handleSocialLogin("facebook")}
                      />
                    </div>
                  </div>
                </form>

                <div className="mt-8 text-center text-[#E3C08D]/50 text-xs">
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                    <Link
                      href="/terms"
                      className="hover:text-[#E3C08D]/80 transition-colors"
                    >
                      Terms
                    </Link>
                    <Link
                      href="/privacy"
                      className="hover:text-[#E3C08D]/80 transition-colors"
                    >
                      Privacy
                    </Link>
                    <Link
                      href="/cookies"
                      className="hover:text-[#E3C08D]/80 transition-colors"
                    >
                      Cookies
                    </Link>
                  </div>
                  <div className="mt-2">
                    © {new Date().getFullYear()} Bellavista. All rights
                    reserved.
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

const SocialSignupButton = ({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    type="button"
    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A1A1A] border border-[#E3C08D]/30 rounded-lg hover:border-[#E3C08D]/80 transition-all"
  >
    <Image src={icon} alt={label} width={20} height={20} />
    <span className="text-[#E3C08D]">{label}</span>
  </motion.button>
);

export default SignupPage;
