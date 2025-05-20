"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Navbar from "@/components/ui/navbar";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

const WelcomeToast = () => (
  <div className="flex items-center gap-3 px-4">
    <div className="text-[#E3C08D] border-2 border-[#E3C08D] rounded-full p-1">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
    <span className="text-[#E3C08D] font-seasons text-lg flex items-center gap-1">
      Welcome to Paradise!
      <Image src="/palme.png" alt="Palm" width={20} height={20} />
    </span>
  </div>
);

const LoginPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginForm>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Please enter both email and password", {
        style: {
          background: "#000",
          color: "#E3C08D",
          border: "1px solid #E3C08D",
        },
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        toast.error(result.error, {
          style: {
            background: "#000",
            color: "#E3C08D",
            border: "1px solid #E3C08D",
          },
        });
      } else {
        formData.rememberMe
          ? localStorage.setItem("rememberedEmail", formData.email)
          : localStorage.removeItem("rememberedEmail");

        toast.custom((t) => (
          <div
            className={`max-w-md w-full bg-black/90 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-[#E3C08D]/10 backdrop-blur-sm ${
              t.visible ? "animate-enter" : "animate-leave"
            }`}
          >
            <WelcomeToast />
          </div>
        ));

        setTimeout(() => router.push("/dashboard"), 1000);
      }
    } catch {
      toast.error("An unexpected error occurred", {
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
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-center min-h-screen p-6 gap-10">
          {/* Left Section */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center md:text-left md:w-1/2 max-w-md space-y-6"
          >
            <h1 className="text-[#E3C08D] text-5xl font-seasons">BELLAVISTA</h1>
            <p className="text-[#E3C08D] text-2xl font-seasons">
              Where Your Vacation Story Begins
            </p>
            <Link
              href="/signup"
              className="text-[#E3C08D] flex items-center gap-2 font-seasons text-xl hover:underline"
            >
              Sign up now
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>

          {/* Right Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full md:w-1/2 max-w-lg bg-black/80 border border-[#E3C08D] backdrop-blur-md rounded-3xl p-8"
          >
            <div className="flex justify-center items-center gap-2 mb-6">
              <Image
                src="/logo.png"
                alt="Logo"
                width={50}
                height={50}
                className="object-contain"
              />
              <h1 className="text-[#E3C08D] text-3xl font-seasons">
                Log in to your account
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[#E3C08D] block mb-2 font-seasons">
                  E-mail
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  className="w-full bg-[#1A1A1A] border border-[#E3C08D] rounded-md px-4 py-2 text-[#E3C08D] placeholder-[#E3C08D]/60"
                />
              </div>
              <div>
                <label className="text-[#E3C08D] block mb-2 font-seasons">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••••••••"
                  className="w-full bg-[#1A1A1A] border border-[#E3C08D] rounded-md px-4 py-2 text-[#E3C08D]"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="accent-[#E3C08D] mr-2"
                />
                <label
                  htmlFor="rememberMe"
                  className="text-[#E3C08D] font-seasons"
                >
                  Remember me
                </label>
              </div>

              <div className="flex flex-col items-center gap-6 mt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-32 py-2 rounded-full border border-[#E3C08D] text-[#E3C08D] hover:bg-[#E3C08D]/10 transition-all"
                >
                  {isLoading ? "Logging in..." : "Log in"}
                </motion.button>

                <div className="flex items-center w-full">
                  <div className="flex-grow h-px bg-[#E3C08D]" />
                  <span className="px-3 text-[#E3C08D]">Or</span>
                  <div className="flex-grow h-px bg-[#E3C08D]" />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                  <LoginButton src="/google-icon.png" label="Google" />
                  <LoginButton src="/facebook-icon.png" label="Facebook" />
                </div>
              </div>
            </form>

            <div className="mt-6 text-center text-[#E3C08D]/60 text-xs">
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/terms">Terms</Link>
                <Link href="/privacy">Privacy</Link>
                <Link href="/cookies">Cookies</Link>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                <Link href="/media">Media Policy</Link>
                <Link href="/accessibility">Accessibility</Link>
                <Link href="/signup">
                  © {new Date().getFullYear()} Bellavista
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

const LoginButton = ({ src, label }: { src: string; label: string }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="flex items-center gap-2 px-4 py-2 w-full justify-center bg-[#1A1A1A] border border-[#E3C08D] rounded-md"
  >
    <Image src={src} alt={label} width={20} height={20} />
    <span className="text-[#E3C08D]">{label}</span>
  </motion.button>
);
export default LoginPage;
