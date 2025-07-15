// BalanceSheet.js
import { useState, useEffect } from "react";

function BalanceSheet({ totalPeople }) {
  const [balances, setBalances] = useState([]);

  useEffect(() => {
    const storedExpenses = JSON.parse(localStorage.getItem("expenses")) || [];
    const totalAmount = storedExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const individualShare = totalAmount / totalPeople;

    const balanceArray = Array(totalPeople).fill(individualShare);
    setBalances(balanceArray);
  }, [totalPeople]);

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4 text-gray-700">Balance Sheet</h2>
      <ul className="space-y-2">
        {balances.map((balance, index) => (
          <li key={index} className="bg-blue-50 p-2 rounded shadow-sm">
            Person {index + 1}: ₹{balance.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BalanceSheet;
