import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import Avatar from "./components/Avatar";

const GroupList = ({ onSelectGroup }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "groups"),
      where("members", "array-contains", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const groupDocs = snapshot.docs;

      const groupData = await Promise.all(
        groupDocs.map(async (docSnap) => {
          const data = docSnap.data();
          const members = data.members || [];

          const memberEmails = await Promise.all(
            members.map(async (uid) => {
              try {
                const userDoc = await getDoc(doc(db, "users", uid));
                return userDoc.exists() ? userDoc.data().email : "Unknown";
              } catch (err) {
                console.error("Error fetching user:", err);
                return "Error";
              }
            })
          );

          return {
            id: docSnap.id,
            groupName: data.groupName,
            memberEmails,
            createdBy: data.createdBy,
          };
        })
      );

      setGroups(groupData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (groupId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this group?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "groups", groupId));
      alert("Group deleted.");
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Failed to delete group.");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-indigo-700">Your Groups</h2>

      {loading ? (
        <p className="text-sm text-gray-400">Loading groups...</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-gray-500">No groups found. Create one or get invited.</p>
      ) : (
        groups.map((group, groupIdx) => (
          <div key={group.id} className="bg-indigo-100 p-3 rounded-lg shadow-sm">
            {/* Group name click handler */}
            <button
              className="text-indigo-900 font-semibold hover:underline"
              onClick={() => onSelectGroup(group.id)}
            >
              {group.groupName}
            </button>

            {/* Avatars row */}
            <div className="flex flex-wrap items-center gap-1 mt-2">
              {group.memberEmails.map((email, i) => (
                <Avatar key={i} email={email} index={i + groupIdx} />
              ))}
            </div>

            {/* Delete group (only if you're the creator) */}
            {group.createdBy === auth.currentUser.uid && (
              <button
                className="mt-2 text-sm text-red-600 hover:underline"
                onClick={() => handleDelete(group.id)}
              >
                Delete Group
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default GroupList;
