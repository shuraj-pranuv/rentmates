// src/components/InviteMember.js
import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export default function InviteMember({ groupId }) {
  const [email, setEmail] = useState("");
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const checkCreator = async () => {
      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        const groupData = groupSnap.data();
        setIsCreator(groupData.createdBy === auth.currentUser.uid);
      }
    };
    checkCreator();
  }, [groupId]);

  const handleInvite = async () => {
    if (!email.trim()) return;

    try {
      const q = query(
        collection(db, "users"),
        where("email", "==", email.trim())
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        alert("No user found with that email.");
        return;
      }

      const userDoc = snap.docs[0];
      const userId = userDoc.id;

      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);
      const existing = groupSnap.data().members || [];

      if (existing.includes(userId)) {
        alert("This user is already in the group.");
        return;
      }

      await updateDoc(groupRef, {
        members: arrayUnion(userId),
      });

      alert("User invited successfully!");
      setEmail("");
    } catch (err) {
      console.error("Error inviting member:", err);
      alert("Error inviting member.");
    }
  };

  if (!isCreator) return null; // 👈 hide for non-creators

  return (
    <div className="mt-4 bg-white p-4 rounded shadow space-y-2">
      <h3 className="text-md font-semibold">Invite Member</h3>
      <input
        className="border p-2 rounded w-full"
        type="email"
        placeholder="Enter email to invite"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full"
        onClick={handleInvite}
      >
        Invite
      </button>
    </div>
  );
}
