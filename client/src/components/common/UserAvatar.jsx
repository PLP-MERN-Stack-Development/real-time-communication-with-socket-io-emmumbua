const initials = (name = '') => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};

const UserAvatar = ({ name, color = '#b07456', size = '40px', isOnline = false }) => {
  return (
    <div
      className="relative flex items-center justify-center rounded-full text-sm font-semibold text-white shadow"
      style={{ width: size, height: size, background: color }}
    >
      {initials(name)}
      <span
        className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white transition ${
          isOnline ? 'bg-emerald-400' : 'bg-gray-300'
        }`}
      />
    </div>
  );
};

export default UserAvatar;

