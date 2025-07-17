import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import Avatar from "./components/Avatar";

const CATEGORY_OPTIONS = ["Rent", "Food", "Utilities", "Groceries", "Internet", "Others"];

function AddExpense({ groupId }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [paidBy, setPaidBy] = useState(auth.currentUser.uid);
  const [members, setMembers] = useState([]);
  const [sharedWith, setSharedWith] = useState([]);
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (!groupId) return;

    const fetchMembers = async () => {
      const groupSnap = await getDoc(doc(db, "groups", groupId));
      const uids = groupSnap.data()?.members || [];

      const emails = await Promise.all(
        uids.map(async (uid) => {
          const userSnap = await getDoc(doc(db, "users", uid));
          return {
            uid,
            email: userSnap.exists() ? userSnap.data().email : uid,
          };
        })
      );

      setMembers(emails);
      setSharedWith(uids); // default: all
    };

    fetchMembers();
  }, [groupId]);

  const toggleSharedWith = (uid) => {
    setSharedWith((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleAddExpense = async () => {
    if (!description || !amount || !groupId || !paidBy || sharedWith.length === 0 || !category) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const expenseData = {
        description,
        amount: parseFloat(amount),
        createdAt: serverTimestamp(),
        createdBy: paidBy,
        sharedWith,
        category,
      };

      if (date) {
        expenseData.expenseDate = Timestamp.fromDate(new Date(date));
      }

      await addDoc(collection(db, "groups", groupId, "expenses"), expenseData);

      // Reset
      setDescription("");
      setAmount("");
      setDate("");
      setPaidBy(auth.currentUser.uid);
      setCategory("");
      setSharedWith(members.map(m => m.uid));
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Failed to add expense.");
    }
  };

  return (
    <div className="space-y-3 p-4 rounded border bg-white shadow-sm">
      <input
        type="text"
        placeholder="Expense description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full px-3 py-2 border rounded text-sm"
      />
      <input
        type="number"
        placeholder="Amount (₹)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full px-3 py-2 border rounded text-sm"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full px-3 py-2 border rounded text-sm"
      />

      {/* 🆕 Category Dropdown */}
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full px-3 py-2 border rounded text-sm"
      >
        <option disabled value="">
          Select category
        </option>
        {CATEGORY_OPTIONS.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      {/* 🆕 Who Paid */}
      <select
        value={paidBy}
        onChange={(e) => setPaidBy(e.target.value)}
        className="w-full px-3 py-2 border rounded text-sm"
      >
        <option disabled value="">
          Select who paid
        </option>
        {members.map((m) => (
          <option key={m.uid} value={m.uid}>
            {m.email}
          </option>
        ))}
      </select>

      {/* ✅ Split With — Avatars + Checkboxes */}
      <div className="space-y-1 text-sm">
        <p className="font-medium mb-1">Split With:</p>
        {members.map((m, index) => (
          <label
            key={m.uid}
            className="flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100"
          >
            <input
              type="checkbox"
              checked={sharedWith.includes(m.uid)}
              onChange={() => toggleSharedWith(m.uid)}
            />
            <Avatar email={m.email} index={index} />
            <span className="truncate" title={m.email}>
              {m.email}
            </span>
          </label>
        ))}
      </div>

      <button
        onClick={handleAddExpense}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
      >
        ➕ Add Expense
      </button>
    </div>
  );
}

export default AddExpense;
