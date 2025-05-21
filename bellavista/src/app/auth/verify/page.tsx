"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, MailCheck } from "lucide-react";
import Image from "next/image";

const VerificationPage = () => {
  const params = useSearchParams();
  const [email, setEmail] = useState<string | null>(null);
  const success = params.get("success");

  useEffect(() => {
    const savedEmail = localStorage.getItem("verificationEmail");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-black bg-opacity-90 text-[#E3C08D] p-4 text-center">
      <Image src="/bellavistaIcon.png" alt="Logo" width={150} height={60} />
      {success === "true" ? (
        <>
          <CheckCircle className="w-16 h-16 text-green-500 my-6" />
          <h1 className="text-3xl font-seasons mb-4">Email Verified!</h1>
          <p className="text-lg">
            Your account has been successfully activated.
          </p>
        </>
      ) : success === "false" ? (
        <>
          <XCircle className="w-16 h-16 text-red-500 my-6" />
          <h1 className="text-3xl font-seasons mb-4">Verification Failed</h1>
          <p className="text-lg">This token is invalid or has expired.</p>
        </>
      ) : (
        <>
          <MailCheck className="w-16 h-16 my-6" />
          <h1 className="text-3xl font-seasons mb-4">Verify Your Email</h1>
          <p className="mb-4 text-lg">
            We’ve sent a verification link to{" "}
            <span className="font-bold text-white">{email}</span>.
          </p>
          <p className="text-sm text-[#E3C08D]/70">
            Please check your inbox and follow the instructions.
          </p>
        </>
      )}
    </div>
  );
};

export default VerificationPage;
