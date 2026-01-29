"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase";

interface AuthUser {
  uid: string;
  email: string | null;
  username: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: snap.data().username,
          });
        } else {
          // fallback safety
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: "",
          });
        }
      } catch (err) {
        console.error("Error fetching user profile", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};
