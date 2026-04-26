/**
 * Avatar — generates initials-based avatar from display_name or username
 */
const PALETTE = [
  ['#8069BF', '#3D3060'],
  ['#C9A74D', '#5A4820'],
  ['#7C7296', '#3A3456'],
  ['#4ADE80', '#1A5C35'],
  ['#F87171', '#6B2525'],
  ['#60A5FA', '#1E3A6B'],
];

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function Avatar({ name = '', size = 36, className = '' }) {
  const initials = getInitials(name);
  const [fg, bg] = getColor(name);

  return (
    <div
      className={`avatar ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: bg,
        color: fg,
        border: `2px solid ${fg}30`,
      }}
    >
      {initials}
    </div>
  );
}
