import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";

function BalanceSheet({ groupId }) {
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);

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
        setMembers(groupSnap.data().members || []);
      }
    };

    fetchMembers();

    return () => unsubscribe();
  }, [groupId]);

  const totals = {};
  let grandTotal = 0;

  expenses.forEach((exp) => {
    const sharedWith = exp.sharedWith || members;
    const splitAmount = (parseFloat(exp.amount) || 0) / sharedWith.length;

    grandTotal += parseFloat(exp.amount) || 0;

    // Creditor (who paid)
    totals[exp.createdBy] = (totals[exp.createdBy] || 0) + parseFloat(exp.amount);

    // Debtors (sharedWith)
    sharedWith.forEach((uid) => {
      totals[uid] = (totals[uid] || 0) - splitAmount;
    });
  });

  const netBalances = members.map((uid) => ({
    uid,
    net: (totals[uid] || 0).toFixed(2),
  }));

  const creditors = netBalances.filter((u) => u.net > 0).sort((a, b) => b.net - a.net);
  const debtors = netBalances.filter((u) => u.net < 0).sort((a, b) => a.net - b.net);

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
    <div className="mt-4 bg-blue-50 border border-blue-200 p-4 rounded text-center">
      <h2 className="text-lg font-semibold text-blue-800 mb-2">Balance Sheet</h2>
      <p className="text-blue-700 mb-2">Total Spent: ₹{grandTotal.toFixed(2)}</p>

      {settlements.length === 0 ? (
        <p className="text-green-700 font-semibold">All settled up!</p>
      ) : (
        <div className="text-left text-sm mt-2">
          {settlements.map((s, i) => (
            <p key={i}>
              <span className="font-medium">{s.from}</span> pays{" "}
              <span className="font-medium">{s.to}</span>: ₹{s.amount}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default BalanceSheet;
