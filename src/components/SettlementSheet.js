// src/components/SettlementSheet.js
import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
} from "firebase/firestore";

const SettlementSheet = ({ groupId }) => {
  const [settlements, setSettlements] = useState([]);

  useEffect(() => {
    if (!groupId) return;

    const unsubscribeExpenses = onSnapshot(
      collection(db, "groups", groupId, "expenses"),
      async (snapshot) => {
        const expenses = snapshot.docs.map((d) => d.data());

        const groupSnap = await getDoc(doc(db, "groups", groupId));
        const members = groupSnap.data().members;

        const uidToEmail = {};
        for (let uid of members) {
          const userSnap = await getDoc(doc(db, "users", uid));
          uidToEmail[uid] = userSnap.exists() ? userSnap.data().email : uid;
        }

        const netMap = {};

        expenses.forEach((exp) => {
          const amount = parseFloat(exp.amount) || 0;
          const sharedWith = exp.sharedWith || members;
          const split = amount / sharedWith.length;

          // Creditor
          netMap[exp.createdBy] = (netMap[exp.createdBy] || 0) + amount;

          // Debtors
          sharedWith.forEach((uid) => {
            netMap[uid] = (netMap[uid] || 0) - split;
          });
        });

        const balances = members.map((uid) => ({
          uid,
          balance: parseFloat(netMap[uid] || 0),
        }));

        const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
        const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);

        const result = [];
        let i = 0, j = 0;

        while (i < debtors.length && j < creditors.length) {
          const debtor = debtors[i];
          const creditor = creditors[j];
          const amount = Math.min(Math.abs(debtor.balance), Math.abs(creditor.balance));

          if (amount > 0) {
            result.push({
              from: uidToEmail[debtor.uid],
              to: uidToEmail[creditor.uid],
              amount: amount.toFixed(2),
            });

            debtor.balance += amount;
            creditor.balance -= amount;
          }

          if (Math.abs(debtor.balance) < 0.01) i++;
          if (Math.abs(creditor.balance) < 0.01) j++;
        }

        setSettlements(result);
      }
    );

    return () => unsubscribeExpenses();
  }, [groupId]);

  return (
    <div className="mt-4 bg-green-50 p-4 rounded shadow text-center">
      <h2 className="text-lg font-semibold text-green-800 mb-3">Settlement Sheet</h2>
      {settlements.length === 0 ? (
        <p className="text-gray-600">All settled up! 🎉</p>
      ) : (
        <ul className="space-y-2 text-sm text-gray-800 text-left">
          {settlements.map((s, i) => (
            <li key={i}>
              <span className="font-semibold">{s.from}</span> owes{" "}
              <span className="font-semibold">{s.to}</span> ₹{s.amount}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SettlementSheet;
