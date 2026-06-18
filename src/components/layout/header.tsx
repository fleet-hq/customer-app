'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTenant } from '@/lib/tenant-context';
import { cn } from '@/lib/utils';
import { DEMO_USER } from '@/lib/mock-data';
import { paths } from '@/lib/paths';
import { BookmarkList, ChevronDown, Logout, User } from '@/components/ui/icons';

interface HeaderProps {
  active?: string;
  signedIn?: boolean;
  userName?: string;
  userEmail?: string;
}

export function Header({
  active = '',
  signedIn = false,
  userName = DEMO_USER.name,
  userEmail = DEMO_USER.email,
}: HeaderProps) {
  const tenant = useTenant();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const initials = userName
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-hairline bg-white/92 backdrop-blur-md backdrop-saturate-180">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-6 py-[11px]">
        <div className="flex items-center gap-[34px]">
          <Link href={paths.home} className="flex flex-shrink-0 items-center">
            <Image src={tenant.logo} alt={tenant.name} width={412} height={412} className="h-9 w-auto" priority />
          </Link>
          <nav className="hidden items-center gap-6 min-[840px]:flex">
            {tenant.navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-xs transition-colors',
                  link.label === active ? 'font-semibold text-primary' : 'font-medium text-ink hover:text-primary',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center justify-end gap-[14px]">
          <Link
            href={paths.manage}
            className="hidden whitespace-nowrap text-xs font-medium text-ink-2 min-[560px]:block"
          >
            {signedIn ? 'My Bookings' : 'Manage Bookings'}
          </Link>
          <div className="hidden h-[22px] w-px bg-card-border min-[560px]:block" />

          {!signedIn ? (
            <>
              <Link
                href={paths.signIn}
                className="whitespace-nowrap rounded-[7px] border border-line px-[18px] py-[9px] text-xs font-semibold text-ink-2"
              >
                Sign in
              </Link>
              <Link
                href={paths.register}
                className="whitespace-nowrap rounded-[7px] border border-primary bg-primary px-[18px] py-[9px] text-xs font-semibold text-white"
              >
                Register
              </Link>
            </>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-[9px] rounded-full border border-line bg-white py-1 pr-3 pl-1"
              >
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-secondary text-[11px] font-bold tracking-wide text-white">
                  {initials}
                </span>
                <span className="hidden whitespace-nowrap text-[12.5px] font-semibold text-ink min-[560px]:block">
                  {userName}
                </span>
                <ChevronDown size={14} className="text-faint" />
              </button>

              {menuOpen && (
                <div className="absolute top-[calc(100%+10px)] right-0 z-[60] w-[226px] rounded-xl border border-card-border bg-white p-2 shadow-[var(--shadow-menu)]">
                  <div className="px-3 pt-[10px] pb-3">
                    <div className="text-[13px] font-semibold text-ink">{userName}</div>
                    <div className="mt-0.5 text-[11.5px] text-faint">{userEmail}</div>
                  </div>
                  <div className="mx-1 mb-1.5 h-px bg-hairline" />
                  <Link
                    href={paths.manage}
                    className="flex items-center gap-[10px] rounded-lg px-3 py-[9px] text-[13px] font-medium text-ink hover:bg-hover"
                  >
                    <BookmarkList size={15} className="text-primary" /> My bookings
                  </Link>
                  <Link
                    href={paths.manage}
                    className="flex items-center gap-[10px] rounded-lg px-3 py-[9px] text-[13px] font-medium text-ink hover:bg-hover"
                  >
                    <User size={15} className="text-primary" /> Account settings
                  </Link>
                  <div className="mx-1 my-1.5 h-px bg-hairline" />
                  <Link
                    href={paths.home}
                    className="flex items-center gap-[10px] rounded-lg px-3 py-[9px] text-[13px] font-semibold text-signout hover:bg-signout-bg"
                  >
                    <Logout size={15} /> Sign out
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
