import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

// Core Pages
import Signup from "./Signup";
import Login from "./Login";

// Expense Modules
import AddExpense from "./AddExpense";
import ExpenseList from "./ExpenseList";
import BalanceSheet from "./BalanceSheet";
import SettlementSheet from "./components/SettlementSheet";

// Group Modules
import CreateGroup from "./components/CreateGroup";
import GroupList from "./GroupList";
import InviteMember from "./components/InviteMember";

// Route Protection
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth);
    setSelectedGroupId(null);
  };

  return (
    <main className="min-h-screen py-10 px-4 bg-gradient-to-br from-blue-50 via-purple-100 to-white">
      <div className="max-w-6xl mx-auto bg-white text-gray-900 shadow-xl rounded-3xl p-6 sm:p-10 border border-gray-100">
        <h1 className="text-4xl sm:text-5xl font-bold text-center text-indigo-700 mb-8">
          RentMates
        </h1>

        {user ? (
          <ProtectedRoute>
            <>
              {/* 🔐 User Info + Logout */}
              <div className="text-center text-gray-600 mb-4">
                Welcome, <span className="font-semibold">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="block mx-auto mb-8 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full shadow-sm transition"
              >
                Log Out
              </button>

              {/* 🌐 Sidebar Layout */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* 🧭 Sidebar */}
                <div className="w-full md:w-1/4 bg-gray-50 p-4 sm:p-6 rounded-xl shadow-md h-fit">
                  <CreateGroup />
                  <hr className="my-4 border-gray-300" />
                  <GroupList onSelectGroup={setSelectedGroupId} />
                </div>

                {/* 📦 Main Content */}
                <div className="flex-1 space-y-6">
                  {selectedGroupId ? (
                    <>
                      {/* ➕ Add Expense + Invite */}
                      <div className="p-4 sm:p-6 bg-gray-50 rounded-xl shadow-md space-y-6">
                        <h2 className="text-xl font-semibold text-indigo-600 mb-3">
                          Add Expense
                        </h2>
                        <AddExpense groupId={selectedGroupId} />
                        <InviteMember groupId={selectedGroupId} />
                      </div>

                      {/* 📋 Expense List */}
                      <div className="p-4 sm:p-6 bg-gray-50 rounded-xl shadow-md">
                        <h2 className="text-xl font-semibold text-indigo-600 mb-3">
                          Your Expenses
                        </h2>
                        <ExpenseList groupId={selectedGroupId} />
                      </div>

                      {/* 📊 Balance & Settlement */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 sm:p-6 bg-blue-50 rounded-xl shadow text-center">
                          <BalanceSheet groupId={selectedGroupId} />
                        </div>
                        <div className="p-4 sm:p-6 bg-green-50 rounded-xl shadow text-center">
                          <SettlementSheet groupId={selectedGroupId} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-500 font-medium text-lg">
                      Select a group to manage expenses.
                    </div>
                  )}
                </div>
              </div>
            </>
          </ProtectedRoute>
        ) : (
          <>
            {showLogin ? (
              <Login onLogin={() => setShowLogin(false)} />
            ) : (
              <Signup />
            )}
            <button
              onClick={() => setShowLogin(!showLogin)}
              className="w-full mt-4 text-blue-600 font-medium underline"
            >
              {showLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default App;
