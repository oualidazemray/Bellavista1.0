"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/ui/navbar";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  LogIn,
  ChevronRight,
} from "lucide-react";
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
      toast.error("Please enter your full name");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!/^\+?[\d\s-]{8,}$/.test(formData.phone)) {
      toast.error("Please enter a valid phone number");
      return false;
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }
    if (formData.password !== formData.verifyPassword) {
      toast.error("Passwords do not match");
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
      toast.error(error.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch {
      toast.error(`Failed to sign in with ${provider}`);
    }
  };

  return (
    <>
      <Navbar />
      <div
        className="relative min-h-screen bg-cover bg-center"
        style={{ backgroundImage: "url(/beachBack.jpg)" }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-0" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center min-h-screen p-6 gap-8">
          {/* Branding */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2 text-center lg:text-left"
          >
            <h1 className="text-[#E3C08D] text-4xl md:text-5xl font-seasons mb-4">
              BELLAVISTA
            </h1>
            <p className="text-[#E3C08D] text-xl md:text-2xl font-seasons mb-6">
              Where Your Vacation Story Begins
            </p>
            <motion.button
              whileHover={{ x: 10 }}
              onClick={() => router.push("/login")}
              className="text-[#E3C08D] text-lg font-seasons flex items-center mx-auto lg:mx-0"
            >
              Log in now <LogIn className="ml-2" />
            </motion.button>
          </motion.div>

          {/* Signup Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-lg bg-black bg-opacity-30 rounded-3xl border border-[#E3C08D] p-8 backdrop-blur-md"
          >
            <div className="flex justify-center mb-6">
              <Link href="/">
                <Image
                  src="/bellavistaIcon.png"
                  alt="Logo"
                  width={150}
                  height={60}
                />
              </Link>
            </div>
            <h2 className="text-[#E3C08D] font-seasons text-center text-xl mb-6">
              Create your Bellavista account
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {["firstName", "lastName"].map((field, i) => (
                  <div key={field}>
                    <label className="text-[#E3C08D] block mb-1 font-seasons capitalize">
                      {field.replace("Name", " name")}
                    </label>
                    <div className="relative">
                      <User
                        className="absolute top-3 left-3 text-[#E3C08D]"
                        size={18}
                      />
                      <input
                        type="text"
                        name={field}
                        value={(formData as any)[field]}
                        onChange={handleInputChange}
                        placeholder={
                          field === "firstName" ? "ex: azemray" : "ex: oualid"
                        }
                        className="pl-10 p-2 w-full bg-[#1A1A1A] text-[#E3C08D] placeholder-[#E3C08D]/50 border border-[#E3C08D] rounded-md"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Email */}
              <div>
                <label className="text-[#E3C08D] block mb-1 font-seasons">
                  E-mail
                </label>
                <div className="relative">
                  <Mail
                    className="absolute top-3 left-3 text-[#E3C08D]"
                    size={18}
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    className="pl-10 p-2 w-full bg-[#1A1A1A] text-[#E3C08D] placeholder-[#E3C08D]/50 border border-[#E3C08D] rounded-md"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-[#E3C08D] block mb-1 font-seasons">
                  Phone
                </label>
                <div className="relative">
                  <Phone
                    className="absolute top-3 left-3 text-[#E3C08D]"
                    size={18}
                  />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+212 600000000"
                    className="pl-10 p-2 w-full bg-[#1A1A1A] text-[#E3C08D] placeholder-[#E3C08D]/50 border border-[#E3C08D] rounded-md"
                  />
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: "password", icon: Lock, label: "Password" },
                  {
                    name: "verifyPassword",
                    icon: ShieldCheck,
                    label: "Confirm",
                  },
                ].map(({ name, icon: Icon, label }) => (
                  <div key={name}>
                    <label className="text-[#E3C08D] block mb-1 font-seasons">
                      {label}
                    </label>
                    <div className="relative">
                      <Icon
                        className="absolute top-3 left-3 text-[#E3C08D]"
                        size={18}
                      />
                      <input
                        type="password"
                        name={name}
                        value={(formData as any)[name]}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className="pl-10 p-2 w-full bg-[#1A1A1A] text-[#E3C08D] placeholder-[#E3C08D]/50 border border-[#E3C08D] rounded-md"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit & Socials */}
              <div className="flex flex-col items-center space-y-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 bg-transparent border border-[#E3C08D] text-[#E3C08D] px-8 py-2 rounded-full hover:bg-[#E3C08D]/10 transition"
                >
                  {isLoading ? "Signing up..." : "Sign Up"}
                  <ChevronRight size={20} />
                </button>

                <div className="w-full flex items-center text-[#E3C08D]">
                  <hr className="flex-grow border-[#E3C08D]" />
                  <span className="px-2">Or</span>
                  <hr className="flex-grow border-[#E3C08D]" />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {["google", "facebook"].map((provider) => (
                    <button
                      key={provider}
                      type="button"
                      onClick={() => handleSocialLogin(provider)}
                      className="flex items-center gap-2 border border-[#E3C08D] px-4 py-2 rounded-md bg-[#1A1A1A] text-[#E3C08D]"
                    >
                      <Image
                        src={`/${provider}-icon.png`}
                        alt={`${provider} logo`}
                        width={20}
                        height={20}
                      />
                      {provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default SignupPage;
