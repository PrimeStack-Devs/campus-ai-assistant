'use client';

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <div className="flex items-center gap-4">
        <button className="text-gray-600 hover:text-gray-900 transition-colors">
          🔔
        </button>
        <button className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold">
          👤
        </button>
      </div>
    </nav>
  );
}
