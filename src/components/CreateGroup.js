import { useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "firebase/firestore";
import { db, auth } from "../firebase";

export default function CreateGroup({ onGroupCreated }) {
  const [groupName, setGroupName] = useState("");
  const [roommateEmails, setRoommateEmails] = useState("");

  const handleCreate = async () => {
    if (!groupName.trim()) return;

    const currentUID = auth.currentUser.uid;
    const members = [currentUID];

    try {
      // 🔎 Get UIDs for entered roommate emails
      const emails = roommateEmails
        .split(",")
        .map(email => email.trim().toLowerCase())
        .filter(email => email && email !== auth.currentUser.email);

      for (const email of emails) {
        const q = query(collection(db, "users"), where("email", "==", email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const uid = snap.docs[0].id;
          if (!members.includes(uid)) members.push(uid);
        } else {
          alert(`No user found for email: ${email}`);
          return;
        }
      }

      // 🚫 Check if same group with same members exists
      const groupQuery = query(
        collection(db, "groups"),
        where("createdBy", "==", currentUID),
        where("groupName", "==", groupName.trim())
      );
      const existingGroups = await getDocs(groupQuery);
      const duplicate = existingGroups.docs.find(doc => {
        const existingMembers = doc.data().members || [];
        return (
          existingMembers.length === members.length &&
          members.every(m => existingMembers.includes(m))
        );
      });

      if (duplicate) {
        alert("A group with the same name and members already exists!");
        return;
      }

      // ✅ Add group
      await addDoc(collection(db, "groups"), {
        groupName: groupName.trim(),
        createdBy: currentUID,
        members,
        createdAt: serverTimestamp(),
      });

      setGroupName("");
      setRoommateEmails("");
      if (onGroupCreated) onGroupCreated();
      alert("Group created successfully!");
    } catch (err) {
      console.error("Error creating group", err);
      alert("Failed to create group");
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow w-full max-w-md space-y-3">
      <h2 className="text-xl font-semibold">Create a Group</h2>

      <input
        className="border p-2 rounded w-full"
        type="text"
        placeholder="Group Name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />

      <input
        className="border p-2 rounded w-full"
        type="text"
        placeholder="Invite Roommates (comma-separated emails)"
        value={roommateEmails}
        onChange={(e) => setRoommateEmails(e.target.value)}
      />

      <button
        className="bg-blue-500 text-white px-4 py-2 rounded w-full"
        onClick={handleCreate}
      >
        Create Group
      </button>
    </div>
  );
}
