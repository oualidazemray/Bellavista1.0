"use client";

import React, { useState, useEffect } from "react";
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

  // Check for remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setFormData((prev) => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true,
      }));
    }
  }, []);

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
        redirect: false, // IMPORTANT: Keep redirect: false
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
      } else if (result?.ok) {
        // Check if signIn was successful (result.ok is true)
        // Handle "Remember Me"
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

        // Instead of redirecting to a specific dashboard,
        // redirect to the root or a generic post-login landing page.
        // The middleware will then intercept this and redirect based on role.
        // Using router.replace('/') is often good practice after login to prevent
        // the login page from being in the browser history.
        setTimeout(() => router.replace("/"), 1000); // Redirect to root, middleware handles the rest
        // Or, if you have a specific "login success" page that middleware also checks:
        // setTimeout(() => router.replace("/login-success"), 1000);
      } else {
        // Handle cases where result is not an error but also not explicitly ok (should be rare with redirect:false)
        toast.error("Login failed. Please check your credentials.", {
          style: {
            /* your styles */
          },
        });
      }
    } catch (error) {
      // Catch network errors or other unexpected issues from signIn
      console.error("Login error:", error);
      toast.error("An unexpected error occurred during login.", {
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
        <div className="relative z-10 flex justify-center items-center min-h-screen px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 rounded-3xl overflow-hidden backdrop-blur-md"
          >
            {/* Left Content - Branding Panel */}
            <div className="relative overflow-hidden bg-black/40 border-r border-[#E3C08D]/30 p-8 flex flex-col justify-between lg:min-h-[600px]">
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
                  New to Bellavista? Experience luxury and relaxation like never
                  before.
                </p>
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E3C08D]/10 border border-[#E3C08D] text-[#E3C08D] font-seasons text-lg hover:bg-[#E3C08D]/20 transition-all duration-300"
                >
                  Create an account
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
            </div>

            {/* Right Content - Login Form */}
            <div className="bg-black/70 border-l border-[#E3C08D]/30 p-8 lg:p-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <h2 className="text-[#E3C08D] text-3xl font-seasons mb-8">
                  Welcome Back
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[#E3C08D] block font-seasons">
                      E-mail
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      className="w-full bg-[#1A1A1A] border border-[#E3C08D]/50 rounded-lg px-4 py-3 text-[#E3C08D] placeholder-[#E3C08D]/40 focus:border-[#E3C08D] focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[#E3C08D] block font-seasons">
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-[#E3C08D]/70 text-sm hover:text-[#E3C08D] transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••••••••"
                      className="w-full bg-[#1A1A1A] border border-[#E3C08D]/50 rounded-lg px-4 py-3 text-[#E3C08D] focus:border-[#E3C08D] focus:outline-none transition-all"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      className="accent-[#E3C08D] w-4 h-4 mr-2"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-[#E3C08D] font-seasons"
                    >
                      Remember me
                    </label>
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
                        Logging in...
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </motion.button>
                </form>

                <div className="mt-8">
                  <div className="flex items-center">
                    <div className="flex-grow h-px bg-[#E3C08D]/30" />
                    <span className="px-4 text-[#E3C08D]/70 text-sm">
                      Or continue with
                    </span>
                    <div className="flex-grow h-px bg-[#E3C08D]/30" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <SocialLoginButton icon="/google-icon.png" label="Google" />
                    <SocialLoginButton
                      icon="/facebook-icon.png"
                      label="Facebook"
                    />
                  </div>
                </div>

                <div className="mt-10 text-center text-[#E3C08D]/50 text-xs">
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
                    <Link
                      href="/media"
                      className="hover:text-[#E3C08D]/80 transition-colors"
                    >
                      Media Policy
                    </Link>
                    <Link
                      href="/accessibility"
                      className="hover:text-[#E3C08D]/80 transition-colors"
                    >
                      Accessibility
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

const SocialLoginButton = ({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A1A1A] border border-[#E3C08D]/30 rounded-lg hover:border-[#E3C08D]/80 transition-all"
  >
    <Image src={icon} alt={label} width={20} height={20} />
    <span className="text-[#E3C08D]">{label}</span>
  </motion.button>
);

export default LoginPage;
