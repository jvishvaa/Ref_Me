"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import GradualText from "@/app/animation/gradualText";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { CircleArrowRight } from "lucide-react";
import Loader from "@/app/Loader/loader";
import Toast from "@/app/components/toast";

export default function SignIn() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [signinData, setSigninData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
    duration = 3000,
  ) => {
    setToast({ show: true, message, type });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, duration);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setSigninData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!signinData?.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(signinData.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!signinData?.password.trim()) {
      newErrors.password = "Password is required";
    } else if (signinData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignin = async () => {
    if (!validate()) return;

    setLoading(true);

    const { email, password } = signinData;

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      setLoading(false);

      const user = userCredential.user;
      router.push("/");

      console.log("Login successful:", user.uid);
      showToast(`Login successful 👍`, "success");
    } catch (error: any) {
      console.error(error.code);
      showToast(error.message || "Something went wrong", "error");

      switch (error.code) {
        case "auth/user-not-found":
          showToast("No account found with this email", "error");
          // alert("No account found with this email");
          break;

        case "auth/wrong-password":
          showToast("Incorrect password", "error");
          // alert("Incorrect password");
          break;

        case "auth/invalid-email":
          showToast("Invalid email address", "error");
          // alert("Invalid email address");
          break;

        default:
          showToast("Login failed. Please try again.", "error");
        // alert("Login failed. Please try again.");
      }
    }
  };

  const handleBackToDashboard = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex justify-center px-4 items-center bg-gradient-to-r from-slate-900 to-slate-700">
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-xl">
          <Loader />
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-4xl z-10 shadow-md rounded-xl overflow-hidden bg-[#F8F8F8] flex flex-col sm:flex-row"
      >
        <div className="w-full sm:w-1/2 p-6 sm:p-8">
          <h1 className="text-center text-xl sm:text-2xl font-semibold mb-6">
            <GradualText text="Login with YOURS" highlight="YOURS" />
          </h1>
          <div className="mb-5">
            <div className="mb-2 text-md text-gray-700">Email</div>
            <input
              name="email"
              placeholder="Enter your email"
              className={`bg-white border rounded-xl p-1 pl-3 w-full mb-1 text-gray-700 placeholder-gray-400 ${
                errors.password ? "border-red-300" : "border-gray-300"
              }`}
              value={signinData?.email}
              type="email"
              onChange={handleChange}
            />
            {errors.email && (
              <motion.div
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeIn" }}
                className="text-red-500 text-sm mt-2"
              >
                {errors.email}
              </motion.div>
            )}
          </div>
          <div className="mb-5">
            <div className="mb-2 text-md text-gray-700">Password</div>
            <input
              name="password"
              placeholder="Enter your password"
              type="password"
              className={`bg-white border rounded-xl p-1 pl-3 w-full mb-1 text-gray-700 placeholder-gray-400 ${
                errors.password ? "border-red-300" : "border-gray-300"
              }`}
              value={signinData?.password}
              onChange={handleChange}
            />
            {errors.password && (
              <motion.div
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeIn" }}
                className="text-red-500 text-sm mt-2"
              >
                {errors.password}
              </motion.div>
            )}
          </div>
          <div>
            <button
              className="
                bg-red-500 w-full rounded-xl 
                p-1 text-white mb-4 
                cursor-pointer
                transition-all duration-200 ease-out
                hover:bg-red-600
                hover:text-white
                hover:shadow-md
                hover:border-gray-400
                active:scale-[0.98] 
            "
              onClick={handleSignin}
            >
              Sign in
            </button>
          </div>

          <div>
            <button
              className="
                bg-neutral-700 w-full rounded-xl 
                p-1 text-white mb-4 
                cursor-pointer
                transition-all duration-200 ease-out
                hover:bg-neutral-900
                hover:text-white
                hover:shadow-md
                hover:border-gray-400
                active:scale-[0.98]
                gap-2
                flex items-center justify-center
            "
              onClick={handleBackToDashboard}
            >
              Back to Dashboard
              <CircleArrowRight />
            </button>
          </div>
          <div className="flex flex-wrap mt-3 justify-center text-sm">
            <span className="text-gray-700">Create new account?</span>
            <div
              className="text-red-500 font-semibold ml-2 cursor-pointer"
              onClick={() => router.push("/auth/signUp")}
            >
              Sign up
            </div>
          </div>
        </div>

        <div className="hidden sm:block sm:w-1/2 relative overflow-hidden rounded-xl">
          {/* Gradient fallback */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700" />

          <motion.div
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 1.8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="absolute inset-0"
          >
            <Image
              src="/auth/dark_panda.jpg"
              alt="Login"
              fill
              priority
              className="object-cover"
            />
          </motion.div>

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/25" />
        </div>
      </motion.div>
    </div>
  );
}
