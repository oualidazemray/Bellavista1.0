"use client";

import * as React from "react";
import {
  Home,
  Hotel,
  Phone,
  LogIn,
  Menu,
  X,
  Coffee,
  UserRoundPlus,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-gradient-to-b from-black to-transparent">
      <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <div className="hidden sm:flex items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Bellavista Logo"
              width={150}
              height={50}
              className="object-contain"
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex font-seasons items-start gap-2 lg:gap-6">
          <NavLink href="/" icon={<Home size={18} />}>
            Home
          </NavLink>
          <NavLink href="/facilities" icon={<Coffee size={18} />}>
            Facilities
          </NavLink>
          <NavLink href="/rooms" icon={<Hotel size={18} />}>
            Rooms
          </NavLink>
          <NavLink href="/contact-us" icon={<Phone size={18} />}>
            Contact
          </NavLink>
          <NavLink href="/auth/signup" icon={<UserRoundPlus size={18} />}>
            Sign up
          </NavLink>
          <NavLink href="/auth/login" icon={<LogIn size={18} />}>
            Sign in
          </NavLink>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-amber-500 focus:outline-none p-2 rounded-full hover:bg-white/10 transition-colors duration-300"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="font-seasons absolute top-full left-0 w-full bg-black bg-opacity-50 text-amber-500 flex flex-col justify-start items-start py-4 space-y-4 md:hidden"
            >
              <NavLink href="/" onClick={toggleMenu} icon={<Home size={20} />}>
                Home
              </NavLink>
              <NavLink
                href="/facilities"
                onClick={toggleMenu}
                icon={<Coffee size={20} />}
              >
                Facilities
              </NavLink>
              <NavLink
                href="/rooms"
                onClick={toggleMenu}
                icon={<Hotel size={20} />}
              >
                Rooms
              </NavLink>
              <NavLink
                href="/contact-us"
                onClick={toggleMenu}
                icon={<Phone size={20} />}
              >
                Contact
              </NavLink>
              <NavLink
                href="/auth/signup"
                onClick={toggleMenu}
                icon={<UserRoundPlus size={20} />}
              >
                Sign up
              </NavLink>
              <NavLink
                href="/auth/login"
                onClick={toggleMenu}
                icon={<LogIn size={20} />}
              >
                Login
              </NavLink>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

// NavLink component
function NavLink({ href, children, icon, onClick }: any) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="relative group flex items-center gap-2 px-4 py-2 text-amber-500 transition-colors duration-300 hover:text-amber-500"
    >
      {icon}
      <span>{children}</span>
      <span className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 -z-10"></span>
    </Link>
  );
}
