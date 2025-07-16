import { useState, useEffect } from "react";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

const EditExpenseModal = ({ isOpen, onClose, expense, groupId }) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    if (expense) {
      setDescription(expense.description || "");
      setAmount(expense.amount || "");
      setDate(
        expense.expenseDate
          ? new Date(expense.expenseDate.toDate?.()).toISOString().split("T")[0]
          : ""
      );
    }
  }, [expense]);

  const handleUpdate = async () => {
    if (!description || !amount || !expense?.id || !groupId) return;

    const updatedData = {
      description,
      amount: parseFloat(amount),
    };

    if (date) {
      updatedData.expenseDate = Timestamp.fromDate(new Date(date));
    }

    await updateDoc(
      doc(db, "groups", groupId, "expenses", expense.id),
      updatedData
    );

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Edit Expense</h2>

        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded"
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded"
        />

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded border hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditExpenseModal;
