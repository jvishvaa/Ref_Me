"use client";

import { Menu, X, Search, Bell, User, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Dashboard from "./dashboard/page";
import { useRouter } from "next/navigation";
import { useAuth } from "./lib/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "./lib/firebase";

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setProfileDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignIn = () => {
    router.push("auth/signIn");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setProfileDropdown(false);
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header Nav bar */}
      {/* Header Nav bar */}
      <header className="bg-black/90 backdrop-blur border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Logo and Menu */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition"
              >
                {isSidebarOpen ? (
                  <X size={24} className="text-white" />
                ) : (
                  <Menu size={24} className="text-white" />
                )}
              </button>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg" />
                <span className="text-xl font-bold hidden sm:block text-white">
                  RefMe
                </span>
              </div>
            </div>

            {/* Search and Profile */}
            <div className="flex items-center gap-4 relative" ref={dropdownRef}>
              {/* Search */}
              <div className="hidden md:flex items-center gap-2 bg-white/10 border border-white/10 rounded-lg px-4 py-2">
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent outline-none text-sm w-32 lg:w-48 text-gray-200 placeholder-gray-400"
                />
              </div>

              {/* Notification */}
              <button className="p-2 rounded-lg hover:bg-white/10 transition relative">
                <Bell size={20} className="text-gray-200" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {!user ? (
                <button
                  onClick={handleSignIn}
                  className="px-3 py-1 rounded-lg hover:bg-red-700 bg-red-500 text-white cursor-pointer transition relative"
                >
                  Signin
                </button>
              ) : (
                <>
                  {/* Profile Avatar */}
                  <div
                    className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full cursor-pointer ring-2 ring-transparent hover:ring-white/20 transition"
                    onClick={() => setProfileDropdown((prev) => !prev)}
                  />
                  <h3 className="text-xl text-white font-sans">{`Hello ${user.username}`}</h3>

                  {/* Dropdown */}
                  {profileDropdown && (
                    <div className="absolute right-0 top-14 w-44 bg-[#111] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                      <button className="w-full px-4 py-3 flex items-center gap-2 text-sm text-gray-200 hover:bg-white/10 transition">
                        <User size={16} />
                        Profile
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 flex items-center gap-2 text-sm text-red-400 hover:bg-red-500/10 transition"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="p-4">
        <Dashboard />
      </main>
    </div>
  );
}
