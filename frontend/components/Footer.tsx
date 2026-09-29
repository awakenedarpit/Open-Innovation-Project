import React from "react";
import Link from "next/link";
import { Activity, ShieldCheck, Cpu, ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-navy-950 text-navy-300 border-t border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
          
          {/* Brand info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center text-navy-950 font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Concept <span className="font-serif italic text-brand-400">X-Ray</span>
              </span>
            </div>
            <p className="text-sm text-navy-400 leading-relaxed">
              Don't just know what students got wrong. Discover why. An intelligent diagnostic technology tracing prerequisite misconceptions.
            </p>
            <div className="pt-2 flex items-center space-x-2 text-xs text-navy-400">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span>k-Anonymity Privacy Protected</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-200 mb-4">
              Platform
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-white transition-colors">
                  Diagnostic Workflow
                </Link>
              </li>
              <li>
                <Link href="/student/concepts" className="hover:text-white transition-colors">
                  Concept Explorer
                </Link>
              </li>
              <li>
                <Link href="/student/dashboard" className="hover:text-white transition-colors">
                  Student Portal
                </Link>
              </li>
              <li>
                <Link href="/teacher/dashboard" className="hover:text-white transition-colors">
                  Teacher Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-200 mb-4">
              Technology Stack
            </h3>
            <ul className="space-y-2.5 text-sm text-navy-400">
              <li className="flex items-center justify-between">
                <span>Frontend Framework</span>
                <span className="text-navy-200 font-mono text-xs">Next.js 14</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Diagnostic Engine</span>
                <span className="text-navy-200 font-mono text-xs">NetworkX DAG</span>
              </li>
              <li className="flex items-center justify-between">
                <span>API Layer</span>
                <span className="text-navy-200 font-mono text-xs">FastAPI</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Persistence</span>
                <span className="text-navy-200 font-mono text-xs">PostgreSQL</span>
              </li>
            </ul>
          </div>

          {/* Educational Impact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-200 mb-4">
              SIH / Open Innovation
            </h3>
            <p className="text-xs text-navy-400 leading-relaxed mb-4">
              Built for high-impact educational assessment, providing actionable micro-lessons and dynamic prerequisite repairs.
            </p>
            <a
              href="https://github.com/vashu-13-coder/Open-Innovation-Project"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-brand-400 hover:text-brand-300 font-medium group"
            >
              GitHub Repository
              <ArrowUpRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>

        </div>

        <div className="pt-8 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between text-xs text-navy-400">
          <p>© {new Date().getFullYear()} Concept X-Ray. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 font-serif italic text-navy-300">
            "Find the misconception. Fix the concept."
          </p>
        </div>
      </div>
    </footer>
  );
}
