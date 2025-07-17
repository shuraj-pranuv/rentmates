import { useEffect, useState } from "react";
import { db, auth } from "./firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import Avatar from "./components/ui/Avatar";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1", "#d0ed57"];

export default function ExpenseList({ groupId }) {
  const [expenses, setExpenses] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [editing, setEditing] = useState(null);
  const [filterCategory, setFilterCategory] = useState("");

  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "General",
    paidBy: "",
    sharedWith: [],
  });

  const categoryOptions = ["Rent", "Food", "Utilities", "Transport", "Groceries", "Internet", "Others", "General"];

  useEffect(() => {
    const fetchUsers = async () => {
      const map = {};
      const groupSnap = await getDoc(doc(db, "groups", groupId));
      const uids = groupSnap.data()?.members || [];
      await Promise.all(
        uids.map(async (uid) => {
          const userSnap = await getDoc(doc(db, "users", uid));
          if (userSnap.exists()) {
            const { displayName, email } = userSnap.data();
            map[uid] = { name: displayName || "Unknown", email };
          }
        })
      );
      setUserMap(map);
    };
    fetchUsers();
  }, [groupId]);

  useEffect(() => {
    const q = query(
      collection(db, "groups", groupId, "expenses"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setExpenses(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [groupId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    await deleteDoc(doc(db, "groups", groupId, "expenses", id));
  };

  const openEdit = (expense) => {
    setForm({
      description: expense.description,
      amount: expense.amount,
      category: expense.category || "General",
      paidBy: expense.paidBy || expense.createdBy,
      sharedWith: expense.sharedWith || [],
    });
    setEditing(expense);
  };

  const saveEdit = async () => {
    const ref = doc(db, "groups", groupId, "expenses", editing.id);
    await updateDoc(ref, {
      description: form.description,
      amount: Number(form.amount),
      category: form.category,
      paidBy: form.paidBy,
      sharedWith: form.sharedWith,
    });
    setEditing(null);
  };

  const filteredExpenses = filterCategory
    ? expenses.filter((exp) => exp.category === filterCategory)
    : expenses;

  const categoryData = Object.values(
    filteredExpenses.reduce((acc, exp) => {
      if (!acc[exp.category]) acc[exp.category] = { name: exp.category, value: 0 };
      acc[exp.category].value += Number(exp.amount);
      return acc;
    }, {})
  );

  const memberData = Object.values(
    filteredExpenses.reduce((acc, exp) => {
      const name = userMap[exp.paidBy]?.name || "Unknown";
      if (!acc[name]) acc[name] = { name, total: 0 };
      acc[name].total += Number(exp.amount);
      return acc;
    }, {})
  );

  return (
    <div className="bg-white text-black p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Expenses</h2>
      </div>

      <div className="mb-4">
        <label className="font-semibold mr-2">Filter by Category:</label>
        <select
          className="border p-1 rounded text-black"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All</option>
          {[...new Set(expenses.map((e) => e.category))].map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <ul className="space-y-3 mb-6">
        {filteredExpenses.map((exp, idx) => (
          <li
            key={exp.id}
            className="p-4 border rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-100 gap-4"
          >
            <div className="flex-1">
              <p className="font-semibold">{exp.description}</p>
              <p className="text-sm">₹{exp.amount} — {exp.category}</p>
              {exp.expenseDate && (
                <p className="text-xs text-gray-400">
                  {exp.expenseDate.toDate().toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">Paid by</span>
              <Avatar email={userMap[exp.paidBy || exp.createdBy]?.email || "?"} index={idx} />
              <span className="text-[10px] text-gray-700 mt-1">
                {userMap[exp.paidBy || exp.createdBy]?.name || "?"}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">Split With</span>
              <div className="flex -space-x-2 mt-1">
                {exp.sharedWith?.map((uid, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <Avatar email={userMap[uid]?.email || "?"} index={i + idx} />
                    <span className="text-[10px] text-gray-700">
                      {userMap[uid]?.name || "?"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-2 sm:mt-0">
              {exp.createdBy === auth.currentUser.uid && (
                <>
                  <button
                    onClick={() => openEdit(exp)}
                    className="text-sm text-blue-500 underline hover:font-semibold"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="text-sm text-red-500 underline hover:font-semibold"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      <h3 className="text-lg font-bold mb-2">Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-100 p-4 rounded-lg">
        <div>
          <h4 className="text-md font-semibold mb-2">Expense by Category (Pie Chart)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label
              >
                {categoryData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="text-md font-semibold mb-2">Total Spent per Member (Bar Chart)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={memberData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-[90%] max-w-md shadow-md space-y-4">
            <h3 className="text-lg font-semibold">Edit Expense</h3>
            <input
              type="text"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full border p-2 rounded"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border p-2 rounded"
            >
              <option disabled value="">Select category</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div>
              <label className="text-sm font-medium">Paid By</label>
              <select
                value={form.paidBy}
                onChange={(e) => setForm({ ...form, paidBy: e.target.value })}
                className="w-full border p-2 rounded mt-1"
              >
                {Object.entries(userMap).map(([uid, u]) => (
                  <option key={uid} value={uid}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Shared With</label>
              <div className="flex flex-col mt-1">
                {Object.entries(userMap).map(([uid, u]) => (
                  <label key={uid} className="text-sm">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={form.sharedWith.includes(uid)}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...form.sharedWith, uid]
                          : form.sharedWith.filter((id) => id !== uid);
                        setForm({ ...form, sharedWith: updated });
                      }}
                    />
                    {u.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 border rounded text-sm">Cancel</button>
              <button onClick={saveEdit} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
