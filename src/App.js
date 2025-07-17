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

// Icons
import {
  LogOut,
  Users,
  Plus,
  List,
  BarChart2,
  UserCircle,
} from "lucide-react";

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
    <main className="min-h-screen py-6 px-2 sm:px-4 bg-gradient-to-br from-blue-50 via-purple-100 to-white">
      <div className="max-w-7xl mx-auto bg-white text-gray-900 shadow-xl rounded-3xl p-4 sm:p-6 border border-gray-100">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-indigo-700 mb-6">
          RentMates
        </h1>

        {user ? (
          <ProtectedRoute>
            <div className="flex flex-col md:flex-row gap-6">
              {/* 🧭 Sidebar */}
              <aside className="w-full md:w-1/4 bg-gray-50 rounded-xl shadow-md p-4 space-y-6 h-fit">
                {/* User Info */}
                <div className="flex items-center gap-2 text-gray-700">
                  <UserCircle className="w-6 h-6 text-indigo-600" />
                  <span className="text-sm font-medium">{user.email}</span>
                </div>

                {/* Group Section */}
                <div>
                  <CreateGroup />
                  <hr className="my-3 border-gray-300" />
                  <GroupList onSelectGroup={setSelectedGroupId} />
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-white bg-red-500 hover:bg-red-600 font-semibold py-2 px-4 rounded-full w-full justify-center transition"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </aside>

              {/* 📦 Main Content */}
              <section className="flex-1 space-y-6">
                {selectedGroupId ? (
                  <>
                    {/* ➕ Add Expense & Invite */}
                    <div className="p-4 sm:p-6 bg-gray-50 rounded-xl shadow space-y-6">
                      <h2 className="text-xl font-semibold text-indigo-600 flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Add Expense
                      </h2>
                      <AddExpense groupId={selectedGroupId} />
                      <InviteMember groupId={selectedGroupId} />
                    </div>

                    {/* 📋 Expense List */}
                    <div className="p-4 sm:p-6 bg-gray-50 rounded-xl shadow">
                      <h2 className="text-xl font-semibold text-indigo-600 flex items-center gap-2 mb-3">
                        <List className="w-5 h-5" /> Your Expenses
                      </h2>
                      <ExpenseList groupId={selectedGroupId} />
                    </div>

                    {/* 📊 Balance & Settlement */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 sm:p-6 bg-blue-50 rounded-xl shadow text-center">
                        <h3 className="font-semibold text-blue-800 mb-2">
                          <BarChart2 className="inline w-5 h-5 mr-1" />
                          Balance Sheet
                        </h3>
                        <BalanceSheet groupId={selectedGroupId} />
                      </div>
                      <div className="p-4 sm:p-6 bg-green-50 rounded-xl shadow text-center">
                        <h3 className="font-semibold text-green-800 mb-2">
                          <Users className="inline w-5 h-5 mr-1" />
                          Settlement Sheet
                        </h3>
                        <SettlementSheet groupId={selectedGroupId} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 font-medium text-lg mt-10">
                    Select a group to manage expenses.
                  </div>
                )}
              </section>
            </div>
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
