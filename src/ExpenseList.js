import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

function ExpenseList({ groupId }) {
  const [expenses, setExpenses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [editing, setEditing] = useState(null); // holds the expense being edited

  const [filterUser, setFilterUser] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  useEffect(() => {
    if (!groupId) return;

    const q = query(
      collection(db, "groups", groupId, "expenses"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const enriched = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const userSnap = await getDoc(doc(db, "users", data.createdBy));
          const email = userSnap.exists() ? userSnap.data().email : "Unknown";

          const sharedWithEmails = await Promise.all(
            (data.sharedWith || []).map(async (uid) => {
              const userSnap = await getDoc(doc(db, "users", uid));
              return userSnap.exists() ? userSnap.data().email : uid;
            })
          );

          return {
            id: docSnap.id,
            ...data,
            email,
            expenseDate: data.expenseDate?.toDate?.() || null,
            sharedWithEmails,
          };
        })
      );

      setExpenses(enriched);
      setFiltered(enriched);
    });

    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    let result = [...expenses];
    if (filterUser.trim()) {
      result = result.filter((exp) =>
        exp.email.toLowerCase().includes(filterUser.toLowerCase())
      );
    }
    if (filterCategory.trim()) {
      result = result.filter(
        (exp) =>
          exp.category?.toLowerCase() === filterCategory.toLowerCase()
      );
    }
    if (filterDateFrom) {
      const from = new Date(filterDateFrom);
      result = result.filter((exp) => exp.expenseDate >= from);
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo);
      result = result.filter((exp) => exp.expenseDate <= to);
    }
    setFiltered(result);
  }, [filterUser, filterCategory, filterDateFrom, filterDateTo, expenses]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      await deleteDoc(doc(db, "groups", groupId, "expenses", id));
    }
  };

  const handleEdit = (exp) => {
    setEditing({ ...exp }); // open modal
  };

  const handleEditChange = (field, value) => {
    setEditing((prev) => ({ ...prev, [field]: value }));
  };

  const saveEditedExpense = async () => {
    if (!editing.description || !editing.amount) return alert("Fields can't be empty");

    const ref = doc(db, "groups", groupId, "expenses", editing.id);
    const payload = {
      description: editing.description,
      amount: parseFloat(editing.amount),
      note: editing.note || "",
      category: editing.category || "",
    };

    await updateDoc(ref, payload);
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-indigo-700">Expenses</h2>

      {/* 🔍 Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <input
          type="text"
          placeholder="Filter by user email"
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="border p-2 rounded text-sm"
        />
        <input
          type="text"
          placeholder="Filter by category"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border p-2 rounded text-sm"
        />
        <input
          type="date"
          value={filterDateFrom}
          onChange={(e) => setFilterDateFrom(e.target.value)}
          className="border p-2 rounded text-sm"
        />
        <input
          type="date"
          value={filterDateTo}
          onChange={(e) => setFilterDateTo(e.target.value)}
          className="border p-2 rounded text-sm"
        />
      </div>

      {/* 📋 Expenses */}
      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">No expenses found.</p>
      ) : (
        filtered.map((exp) => (
          <div
            key={exp.id}
            className="border p-3 rounded bg-white shadow-sm space-y-1"
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800">
                {exp.description}
              </span>
              <span className="text-green-700 font-bold">₹{exp.amount}</span>
            </div>

            <div className="text-xs text-gray-500 flex justify-between items-center">
              <span>
                By: {exp.email} |{" "}
                {exp.expenseDate?.toLocaleDateString() || "No Date"}
              </span>
              {exp.category && (
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                  {exp.category}
                </span>
              )}
            </div>

            {exp.sharedWithEmails?.length > 0 && (
              <div className="text-xs text-gray-600">
                Split with:{" "}
                {exp.sharedWithEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-block bg-gray-100 px-2 py-0.5 rounded mr-1 text-xs"
                  >
                    {email}
                  </span>
                ))}
              </div>
            )}

            {exp.note && (
              <div className="text-xs text-gray-600 italic">Note: {exp.note}</div>
            )}

            {exp.createdBy === auth.currentUser?.uid && (
              <div className="mt-1 text-right space-x-2">
                <button
                  onClick={() => handleEdit(exp)}
                  className="text-blue-500 text-xs hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(exp.id)}
                  className="text-red-500 text-xs hover:underline"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))
      )}

      {/* ✨ Popup Modal for Edit */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Edit Expense</h3>

            <input
              className="w-full border p-2 mb-2 rounded"
              value={editing.description}
              onChange={(e) => handleEditChange("description", e.target.value)}
              placeholder="Description"
            />
            <input
              className="w-full border p-2 mb-2 rounded"
              value={editing.amount}
              onChange={(e) => handleEditChange("amount", e.target.value)}
              placeholder="Amount"
              type="number"
            />
            <input
              className="w-full border p-2 mb-2 rounded"
              value={editing.note || ""}
              onChange={(e) => handleEditChange("note", e.target.value)}
              placeholder="Note (optional)"
            />
            <input
              className="w-full border p-2 mb-4 rounded"
              value={editing.category || ""}
              onChange={(e) => handleEditChange("category", e.target.value)}
              placeholder="Category (optional)"
            />

            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded"
                onClick={saveEditedExpense}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpenseList;
