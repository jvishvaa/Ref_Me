"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import GradualText from "@/app/animation/gradualText";
import { setDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/app/lib/firebase";
import Loader from "@/app/Loader/loader";
import Toast from "@/app/components/toast";

export default function SignUp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<{
    username?: string;
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

    setSignupData((prev) => ({
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

    if (!signupData?.username.trim()) {
      newErrors.username = "Username is required";
    } else if (signupData?.username.length < 3) {
      newErrors.username = "Username must be more than 3 characters";
    }

    if (!signupData?.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(signupData.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!signupData?.password.trim()) {
      newErrors.password = "Password is required";
    } else if (signupData?.password.length < 8) {
      newErrors.password = "Password must be more than 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signupData?.email,
        signupData?.password,
      );
      const user = userCredential.user;
      showToast("Account created successfully 💖", "success");

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: signupData?.username,
        email: user.email,
        provider: "Email",
        createdAt: serverTimestamp(),
      });
      setLoading(false);
      router.push("/auth/signIn");
      console.log("User stored in Firestore");
    } catch (error: any) {
      showToast(error.message || "Something went wrong", "error");
    }
  };

  return (
    <div className="min-h-screen flex justify-center px-4 items-center bg-gradient-to-r from-emerald-700 to-emerald-900">
      <Toast show={toast.show} message={toast.message} type={toast.type} />
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
        <div className="w-full sm:w-1/2 p-6 sm:p-8 relative">
          <h1 className="text-center text-xl sm:text-2xl font-semibold mb-6">
            <GradualText text="Register your HEART" highlight="HEART" />
          </h1>
          <div className="mb-5">
            <div className="mb-2 text-md text-gray-700">User Name</div>
            <input
              name="username"
              placeholder="Enter your name"
              className={`bg-white border rounded-xl p-1 pl-3 w-full mb-1 text-gray-700 placeholder-gray-400 ${
                errors.username ? "border-red-300" : "border-gray-300"
              }`}
              value={signupData?.username}
              onChange={handleChange}
            />
            {errors.username && (
              <motion.div
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeIn" }}
                className="text-red-500 text-sm mt-2"
              >
                {errors.username}
              </motion.div>
            )}
          </div>
          <div className="mb-5">
            <div className="mb-2 text-md text-gray-700">Email</div>
            <input
              name="email"
              placeholder="Enter your email"
              type="email"
              className={`bg-white border rounded-xl p-1 pl-3 w-full mb-1 text-gray-700 placeholder-gray-400 ${
                errors.email ? "border-red-300" : "border-gray-300"
              }`}
              value={signupData?.email}
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
              value={signupData?.password}
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
                active:scale-[0.98]"
              onClick={handleSignup}
            >
              Sign up
            </button>
          </div>
          <div className="flex flex-wrap mt-3 justify-center text-sm">
            <span className="text-gray-700">Already have an account?</span>
            <div
              className="text-red-500 font-semibold ml-2 cursor-pointer"
              onClick={() => router.push("/auth/signIn")}
            >
              Login
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
              src="/auth/panda-nature.jpg"
              alt="Signup"
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
