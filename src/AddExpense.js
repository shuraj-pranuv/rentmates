// AddExpense.js
import { useState } from "react";

function AddExpense({ onAdd }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const handleAdd = () => {
    if (!description || !amount) return;
    const newExpense = {
      id: Date.now(),
      description,
      amount: parseFloat(amount),
    };
    onAdd?.(newExpense);
    setDescription("");
    setAmount("");
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Expense Description"
        className="w-full px-3 py-2 border rounded"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount"
        className="w-full px-3 py-2 border rounded"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button
        onClick={handleAdd}
        className="w-full bg-blue-500 text-white font-semibold py-2 rounded"
      >
        Add Expense
      </button>
    </div>
  );
}

export default AddExpense;
