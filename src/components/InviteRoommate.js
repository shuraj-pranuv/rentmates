import { useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

export default function InviteRoommate({ groupId }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleInvite = async () => {
    setMessage("");
    if (!email.trim()) return;

    const userQuery = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(userQuery);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const uid = userDoc.id;

      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        members: [...userDoc.data().members, uid],
      });

      setMessage(`✅ ${email} has been added!`);
      setEmail("");
    } else {
      setMessage("❌ No user found with this email.");
    }
  };

  return (
    <div className="mt-4">
      <input
        className="border p-2 rounded w-full mb-2"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Invite roommate by email"
      />
      <button
        className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded"
        onClick={handleInvite}
      >
        Invite
      </button>
      {message && <div className="mt-2 text-sm text-gray-700">{message}</div>}
    </div>
  );
}
