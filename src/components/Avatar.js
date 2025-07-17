// src/components/Avatar.js
import getInitials from "../utils/getInitials";
import stringHash from "../utils/stringHash";

const colors = [
  "bg-indigo-500", "bg-pink-500", "bg-green-500",
  "bg-yellow-500", "bg-purple-500", "bg-blue-500",
  "bg-teal-500", "bg-rose-500"
];

function Avatar({ email, name = "", size = "md" }) {
  const displayText = name || email;
  const initials = getInitials(displayText);

  // Pick color based on consistent hash of email
  const colorIndex = stringHash(email) % colors.length;
  const color = colors[colorIndex];

  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base"
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`rounded-full text-white flex items-center justify-center font-bold shadow ${selectedSize} ${color}`}
      title={name ? `${name} (${email})` : email}
    >
      {initials}
    </div>
  );
}

export default Avatar;
