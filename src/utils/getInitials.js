// src/utils/getInitials.js
export default function getInitials(email) {
  if (!email) return "?";
  const namePart = email.split("@")[0];
  return namePart[0].toUpperCase();
}
