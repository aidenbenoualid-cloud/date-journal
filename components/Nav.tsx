'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/map', label: 'Map', emoji: '🗺️' },
  { href: '/journal', label: 'Journal', emoji: '📖' },
  { href: '/place/add', label: 'Add', emoji: '＋', isAdd: true },
  { href: '/wishlist', label: 'Wishlist', emoji: '🌟' },
  { href: '/stats', label: 'Us', emoji: '💌' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-rose-100 flex items-end justify-around px-2 pb-safe z-50 shadow-up">
        {links.map(({ href, label, emoji, isAdd }) =>
          isAdd ? (
            <Link key={href} href={href} className="flex flex-col items-center -mt-4">
              <span className="w-14 h-14 rounded-full bg-primary text-white text-3xl font-light flex items-center justify-center shadow-lg leading-none">
                +
              </span>
              <span className="text-[10px] text-brown-mid mt-1 font-medium">{label}</span>
            </Link>
          ) : (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center py-2 gap-0.5 min-w-[52px]"
            >
              <span className={`text-2xl transition-opacity ${pathname === href ? 'opacity-100' : 'opacity-40'}`}>
                {emoji}
              </span>
              <span className={`text-[10px] font-semibold ${pathname === href ? 'text-primary' : 'text-brown-light'}`}>
                {label}
              </span>
            </Link>
          ),
        )}
      </nav>

      {/* Desktop sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 bg-white border-r border-rose-100 flex-col p-6 z-50 shadow-sm">
        <div className="mb-8">
          <div className="text-3xl mb-1">💕</div>
          <h1 className="text-lg font-extrabold text-brown-dark leading-tight">Our Food Journal</h1>
        </div>
        <div className="flex flex-col gap-1">
          {links.map(({ href, label, emoji, isAdd }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                isAdd
                  ? 'bg-primary text-white hover:bg-primary-dark mt-2'
                  : pathname === href
                  ? 'bg-rose-50 text-primary'
                  : 'text-brown-mid hover:bg-rose-50'
              }`}
            >
              <span className="text-xl">{emoji}</span>
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
