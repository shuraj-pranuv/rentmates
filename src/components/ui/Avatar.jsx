// src/components/ui/Avatar.jsx
const colors = [
  "bg-indigo-500", "bg-pink-500", "bg-green-500", "bg-yellow-500", "bg-purple-500"
];

function getInitials(email) {
  if (!email) return "?";
  return email[0].toUpperCase(); // You can use name.split('@')[0] too
}

export default function Avatar({ email, index = 0 }) {
  const initials = getInitials(email);
  const color = colors[index % colors.length];

  return (
    <div
      className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-bold shadow ${color}`}
      title={email} // tooltip
    >
      {initials}
    </div>
  );
}
