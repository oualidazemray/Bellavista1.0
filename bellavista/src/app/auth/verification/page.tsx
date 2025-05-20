"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import Image from "next/image";

const VerificationPage = () => {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const savedEmail = localStorage.getItem("verificationEmail");
    if (!savedEmail) {
      router.push("/signup"); // Redirect if accessed directly
    } else {
      setEmail(savedEmail);
    }
  }, [router]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-black bg-opacity-90 text-[#E3C08D] p-4 text-center">
      <Image src="/logo.png" alt="Logo" width={150} height={60} />
      <MailCheck className="w-16 h-16 my-6" />
      <h1 className="text-3xl font-seasons mb-4">Verify Your Email</h1>
      <p className="mb-4 text-lg">
        We’ve sent a verification link to{" "}
        <span className="font-bold text-white">{email}</span>.
      </p>
      <p className="text-sm text-[#E3C08D]/70">
        Please check your inbox and follow the instructions to complete your
        registration.
      </p>
    </div>
  );
};

export default VerificationPage;
