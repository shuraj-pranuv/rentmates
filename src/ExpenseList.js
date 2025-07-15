// ExpenseList.js
import { useState, useEffect } from "react";

function ExpenseList() {
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const storedExpenses = JSON.parse(localStorage.getItem("expenses")) || [];
    setExpenses(storedExpenses);
  }, []);

  const handleDelete = (id) => {
    const updated = expenses.filter((expense) => expense.id !== id);
    setExpenses(updated);
    localStorage.setItem("expenses", JSON.stringify(updated));
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4 text-gray-700">Your Expenses</h2>
      {expenses.length === 0 ? (
        <p className="text-gray-500">No expenses added.</p>
      ) : (
        <ul className="space-y-3">
          {expenses.map((expense) => (
            <li
              key={expense.id}
              className="flex justify-between items-center bg-gray-100 px-4 py-2 rounded shadow-sm"
            >
              <span>
                {expense.description} - ₹{expense.amount}
              </span>
              <button
                onClick={() => handleDelete(expense.id)}
                className="text-red-500 hover:text-red-700"
              >
                🗑️
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ExpenseList;
