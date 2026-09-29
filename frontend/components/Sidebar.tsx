"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Network, 
  HelpCircle, 
  Award, 
  BookOpen, 
  BarChart3, 
  Users, 
  AlertTriangle,
  Flame,
  Settings
} from "lucide-react";

interface SidebarProps {
  mode: "student" | "teacher";
}

export function Sidebar({ mode }: SidebarProps) {
  const pathname = usePathname();

  const studentLinks = [
    { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { name: "Concept Map", href: "/student/concepts", icon: Network },
    { name: "Take Quiz", href: "/student/quiz/q_ptr_01", icon: HelpCircle },
    { name: "Learning Streak", href: "/student/dashboard#streak", icon: Flame },
  ];

  const teacherLinks = [
    { name: "Class Overview", href: "/teacher/dashboard", icon: LayoutDashboard },
    { name: "Concept Heatmap", href: "/teacher/dashboard#heatmap", icon: BarChart3 },
    { name: "Common Misconceptions", href: "/teacher/dashboard#misconceptions", icon: AlertTriangle },
    { name: "Prerequisite DAG", href: "/teacher/dashboard#graph", icon: Network },
  ];

  const links = mode === "student" ? studentLinks : teacherLinks;

  return (
    <aside className="w-64 bg-white border-r border-navy-200 min-h-[calc(100vh-5rem)] flex flex-col justify-between p-4 shrink-0 hidden md:flex">
      <div className="space-y-6">
        <div>
          <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-navy-400 block mb-2">
            {mode === "student" ? "Student Workspace" : "Educator Portal"}
          </span>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-700 font-semibold border-l-4 border-brand-600"
                      : "text-navy-700 hover:bg-navy-50 hover:text-navy-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-brand-600" : "text-navy-400"}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick status callout */}
        {mode === "student" ? (
          <div className="mx-1 p-3.5 bg-gradient-to-br from-brand-50 to-emerald-50 rounded-xl border border-brand-200 text-xs space-y-2">
            <div className="flex items-center justify-between font-medium text-brand-900">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-brand-600" />
                Active Streak
              </span>
              <span className="font-bold text-brand-700">4 Days</span>
            </div>
            <p className="text-navy-600 text-[11px] leading-tight">
              2 concepts targeted for repair today.
            </p>
          </div>
        ) : (
          <div className="mx-1 p-3.5 bg-navy-50 rounded-xl border border-navy-200 text-xs space-y-2">
            <div className="flex items-center justify-between font-medium text-navy-900">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-navy-600" />
                Class Cohort
              </span>
              <span className="font-bold text-navy-800">24 Students</span>
            </div>
            <p className="text-navy-600 text-[11px] leading-tight">
              k-Anonymity active (n ≥ 3 floor).
            </p>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-navy-100">
        <Link
          href={mode === "student" ? "/teacher/dashboard" : "/student/dashboard"}
          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-navy-500 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-colors"
        >
          <span>Switch Mode</span>
          <span className="px-2 py-0.5 rounded bg-navy-100 text-navy-700 font-mono text-[10px]">
            {mode === "student" ? "Teacher" : "Student"}
          </span>
        </Link>
      </div>
    </aside>
  );
}
