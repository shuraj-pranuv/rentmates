// src/components/ProtectedRoute.js
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthed(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p className="text-center text-gray-500">Checking authentication...</p>;

  if (!authed) {
    return (
      <div className="text-center text-red-500 font-semibold">
        Access denied. Please login or sign up.
      </div>
    );
  }

  return children;
}
