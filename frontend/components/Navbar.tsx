"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BookOpen, GraduationCap, BarChart3, Menu, X, ArrowRight, UserCheck } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isTeacherView = pathname?.startsWith("/teacher");
  const isStudentView = pathname?.startsWith("/student");
  const isDashboard = isTeacherView || isStudentView;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-navy-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-navy-900 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-200">
              <Activity className="w-5 h-5 text-brand-200" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-navy-900 flex items-center gap-1.5">
                Concept <span className="text-brand-600 font-serif italic">X-Ray</span>
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-navy-400 font-semibold -mt-1">
                Root-Cause Learning Engine
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                pathname === "/" ? "text-brand-600 font-semibold" : "text-navy-600 hover:text-navy-900"
              }`}
            >
              Home
            </Link>
            <Link
              href="/#how-it-works"
              className="text-sm font-medium text-navy-600 hover:text-navy-900 transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/student/concepts"
              className={`text-sm font-medium transition-colors ${
                pathname?.startsWith("/student/concepts") ? "text-brand-600 font-semibold" : "text-navy-600 hover:text-navy-900"
              }`}
            >
              Concepts
            </Link>
            <Link
              href="/student/dashboard"
              className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${
                isStudentView ? "text-brand-600 font-semibold" : "text-navy-600 hover:text-navy-900"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              For Students
            </Link>
            <Link
              href="/teacher/dashboard"
              className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${
                isTeacherView ? "text-brand-600 font-semibold" : "text-navy-600 hover:text-navy-900"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              For Teachers
            </Link>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isDashboard ? (
              <div className="flex items-center gap-3 bg-navy-50 px-3 py-1.5 rounded-full border border-navy-200 text-xs text-navy-700">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                <span>Demo Mode</span>
                <span className="text-navy-300">|</span>
                <Link
                  href={isTeacherView ? "/student/dashboard" : "/teacher/dashboard"}
                  className="font-medium text-brand-700 hover:underline flex items-center gap-1"
                >
                  Switch to {isTeacherView ? "Student" : "Teacher"} View
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/student/dashboard"
                  className="text-sm font-medium text-navy-700 hover:text-navy-900 px-3 py-2 transition-colors"
                >
                  Student Login
                </Link>
                <Link
                  href="/student/dashboard"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg shadow-sm hover:shadow transition-all group"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-navy-600 hover:text-navy-900 hover:bg-navy-100 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-navy-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-navy-800 hover:bg-navy-50"
          >
            Home
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-navy-800 hover:bg-navy-50"
          >
            How It Works
          </Link>
          <Link
            href="/student/concepts"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-navy-800 hover:bg-navy-50"
          >
            Concept Explorer
          </Link>
          <Link
            href="/student/dashboard"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-brand-700 bg-brand-50"
          >
            Student Dashboard
          </Link>
          <Link
            href="/teacher/dashboard"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-navy-900 bg-navy-50"
          >
            Teacher Analytics
          </Link>
        </div>
      )}
    </header>
  );
}
