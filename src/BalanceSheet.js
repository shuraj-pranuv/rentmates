import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";

function BalanceSheet({ groupId }) {
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [userMap, setUserMap] = useState({});

  // 🔄 Fetch expenses + members
  useEffect(() => {
    if (!groupId) return;

    const unsubscribe = onSnapshot(
      collection(db, "groups", groupId, "expenses"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => doc.data());
        setExpenses(data);
      }
    );

    const fetchMembers = async () => {
      const groupSnap = await getDoc(doc(db, "groups", groupId));
      if (groupSnap.exists()) {
        const memberUIDs = groupSnap.data().members || [];
        setMembers(memberUIDs);
      }
    };

    fetchMembers();

    return () => unsubscribe();
  }, [groupId]);

  // 👥 Fetch user display names
  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const map = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        map[data.uid] = data.displayName || data.email || "Unknown";
      });
      setUserMap(map);
    };

    fetchUsers();
  }, []);

  // 💰 Balance calculation
  const totals = {};
  let grandTotal = 0;

  expenses.forEach((exp) => {
    const amount = parseFloat(exp.amount) || 0;
    const sharedWith = exp.sharedWith && exp.sharedWith.length > 0 ? exp.sharedWith : members;
    const paidBy = exp.paidBy || exp.createdBy;

    if (sharedWith.length === 0) return; // prevent division by zero

    const splitAmount = amount / sharedWith.length;
    grandTotal += amount;

    // Credit full amount to payer
    totals[paidBy] = (totals[paidBy] || 0) + amount;

    // Debit split from sharedWith members
    sharedWith.forEach((uid) => {
      totals[uid] = (totals[uid] || 0) - splitAmount;
    });

    // Re-credit payer their share if they are part of sharedWith
    if (sharedWith.includes(paidBy)) {
      totals[paidBy] += splitAmount;
    }
  });

  const netBalances = members.map((uid) => ({
    uid,
    net: parseFloat((totals[uid] || 0).toFixed(2)),
  }));

  const creditors = netBalances
    .filter((u) => u.net > 0.01)
    .sort((a, b) => b.net - a.net);
  const debtors = netBalances
    .filter((u) => u.net < -0.01)
    .sort((a, b) => a.net - b.net);

  const settlements = [];

  while (creditors.length && debtors.length) {
    const creditor = creditors[0];
    const debtor = debtors[0];
    const amount = Math.min(creditor.net, -debtor.net);

    settlements.push({
      from: debtor.uid,
      to: creditor.uid,
      amount: amount.toFixed(2),
    });

    creditor.net -= amount;
    debtor.net += amount;

    if (creditor.net < 0.01) creditors.shift();
    if (debtor.net > -0.01) debtors.shift();
  }

  return (
    <div className="mt-6 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Balance Sheet</h2>
      <p className="text-gray-600 mb-4 text-sm">
        Total Group Spending:{" "}
        <span className="font-semibold text-blue-600">
          ₹{grandTotal.toFixed(2)}
        </span>
      </p>

      {settlements.length === 0 ? (
        <p className="text-green-700 font-medium">✅ All settled up!</p>
      ) : (
        <div className="text-sm space-y-2">
          {settlements.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-blue-50 p-2 rounded"
            >
              <div>
                <span
                  className="font-medium text-gray-800"
                  title={userMap[s.from]}
                >
                  {userMap[s.from] || "Unknown"}
                </span>{" "}
                owes{" "}
                <span
                  className="font-medium text-gray-800"
                  title={userMap[s.to]}
                >
                  {userMap[s.to] || "Unknown"}
                </span>
              </div>
              <span className="text-blue-600 font-semibold">
                ₹{s.amount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BalanceSheet;
