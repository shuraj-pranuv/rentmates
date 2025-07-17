import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { auth } from "./firebase";
import Avatar from "./components/ui/Avatar"; // ✅ avatar still uses email hash

export default function ExpenseList({ groupId }) {
  const [expenses, setExpenses] = useState([]);
  const [userMap, setUserMap] = useState({}); // uid → displayName

  useEffect(() => {
    const fetchUsers = async () => {
      const nameMap = {};
      const groupRef = await getDoc(doc(db, "groups", groupId));
      const uids = groupRef.data()?.members || [];

      await Promise.all(
        uids.map(async (uid) => {
          const snap = await getDoc(doc(db, "users", uid));
          if (snap.exists()) {
            const { displayName, email } = snap.data();
            nameMap[uid] = { name: displayName || "Unknown", email };
          }
        })
      );

      setUserMap(nameMap);
    };

    fetchUsers();
  }, [groupId]);

  useEffect(() => {
    const q = query(
      collection(db, "groups", groupId, "expenses"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExpenses(list);
    });

    return () => unsubscribe();
  }, [groupId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    await deleteDoc(doc(db, "groups", groupId, "expenses", id));
  };

  return (
    <div className="space-y-4">
      {expenses.length === 0 && (
        <p className="text-gray-500 text-sm">No expenses yet.</p>
      )}

      {expenses.map((exp, idx) => (
        <div
          key={exp.id}
          className="bg-white border border-gray-200 p-4 rounded-lg shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          {/* 📄 Expense Details */}
          <div className="flex-1">
            <p className="text-md font-semibold text-gray-800">
              {exp.description}
            </p>
            <p className="text-sm text-gray-600 mt-1">₹ {exp.amount}</p>
            {exp.expenseDate && (
              <p className="text-xs text-gray-400">
                {exp.expenseDate.toDate().toLocaleDateString()}
              </p>
            )}
          </div>

          {/* 🙋 Paid by */}
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500">Paid by</span>
            <Avatar
              email={userMap[exp.createdBy]?.email || "?"}
              index={idx}
            />
            <span className="text-[10px] text-gray-700 mt-1">
              {userMap[exp.createdBy]?.name || "Unknown"}
            </span>
          </div>

          {/* 🧍 Split With */}
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500">Split With</span>
            <div className="flex -space-x-2 mt-1">
              {exp.sharedWith?.map((uid, i) => (
                <div key={i} className="flex flex-col items-center">
                  <Avatar
                    email={userMap[uid]?.email || "?"}
                    index={i + idx}
                  />
                  <span className="text-[10px] text-gray-700">
                    {userMap[uid]?.name || "?"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 🗑️ Delete button (if owned) */}
          {exp.createdBy === auth.currentUser.uid && (
            <button
              onClick={() => handleDelete(exp.id)}
              className="text-red-500 text-sm underline hover:font-semibold"
            >
              Delete
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
