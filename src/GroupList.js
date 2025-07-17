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

          const memberDetails = await Promise.all(
            members.map(async (uid) => {
              try {
                const userDoc = await getDoc(doc(db, "users", uid));
                if (userDoc.exists()) {
                  const { displayName, email } = userDoc.data();
                  return {
                    name: displayName || "Unknown",
                    email,
                  };
                } else {
                  return { name: "Unknown", email: "?" };
                }
              } catch (err) {
                console.error("Error fetching user:", err);
                return { name: "Error", email: "?" };
              }
            })
          );

          return {
            id: docSnap.id,
            groupName: data.groupName,
            members: memberDetails,
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
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this group?"
    );
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
        <p className="text-sm text-gray-500">
          No groups found. Create one or get invited.
        </p>
      ) : (
        groups.map((group, groupIdx) => (
          <div
            key={group.id}
            className="bg-indigo-100 p-3 rounded-lg shadow-sm"
          >
            <button
              className="text-indigo-900 font-semibold hover:underline"
              onClick={() => onSelectGroup(group.id)}
            >
              {group.groupName}
            </button>

            {/* Avatars + Names */}
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {group.members.map((member, i) => (
                <div key={i} className="flex flex-col items-center">
                  <Avatar email={member.email} index={i + groupIdx} />
                  <span className="text-[10px] text-gray-700">
                    {member.name}
                  </span>
                </div>
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
