import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Signup from "./Signup";
import Login from "./Login";
import AddExpense from "./AddExpense";
import ExpenseList from "./ExpenseList";
import BalanceSheet from "./BalanceSheet";

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-white px-4 py-12">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8 space-y-6 border border-gray-200">
        <h1 className="text-4xl font-extrabold text-center text-indigo-600">
          RentMates
        </h1>

        {user ? (
          <>
            <div className="text-center text-gray-600">Welcome, {user.email}</div>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white font-semibold py-2 rounded-lg hover:bg-red-600 transition"
            >
              Log Out
            </button>
            <AddExpense />
            <ExpenseList />
            <BalanceSheet totalPeople={3} />
          </>
        ) : (
          <>
            {showLogin ? (
              <Login onLogin={() => setShowLogin(false)} />
            ) : (
              <Signup />
            )}
            <button
              onClick={() => setShowLogin(!showLogin)}
              className="w-full text-blue-600 font-medium underline"
            >
              {showLogin
                ? "Don't have an account? Sign Up"
                : "Already have an account? Log In"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
