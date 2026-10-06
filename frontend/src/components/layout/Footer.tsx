import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-base">CIMS Portal</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              The centralized college internship, recruitment, evaluation, and career intelligence platform connecting students, academic coordinators, and premier industry partners.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>AICTE & UGC Placement Guidelines Compliant</span>
            </div>
          </div>

          {/* Column 2: Students */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Students
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/internships" className="hover:text-brand-600 dark:hover:text-white transition-colors">
                  Explore Active Internships
                </Link>
              </li>
              <li>
                <Link to="/companies" className="hover:text-brand-600 dark:hover:text-white transition-colors">
                  Corporate Directory
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-600 dark:hover:text-white transition-colors">
                  Candidate Dashboard
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-brand-600 dark:hover:text-white transition-colors">
                  Register Institutional Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Coordinators & Partners */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Faculty & Industry
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/login" className="hover:text-brand-600 dark:hover:text-white transition-colors">
                  Faculty Coordinator Login
                </Link>
              </li>
              <li>
                <Link to="/companies" className="hover:text-brand-600 dark:hover:text-white transition-colors">
                  Recruiter Partnerships
                </Link>
              </li>
              <li>
                <span className="text-slate-400">AICTE 7-Criteria Rubrics</span>
              </li>
              <li>
                <span className="text-slate-400">Placement Cell MoUs</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Support & Standards */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Training & Placement Office
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-slate-400">AICTE Internship Policy v3</span>
              </li>
              <li>
                <span className="text-slate-400">Semester Internship Credits</span>
              </li>
              <li>
                <span className="text-slate-400">tpo@sanjivani.edu.in</span>
              </li>
              <li>
                <span className="text-slate-400">+91 (02423) 222862 / +91 98220 12345</span>
              </li>
              <li>
                <span className="text-slate-400">Kopargaon, Maharashtra 423603</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 Sanjivani University. All rights reserved.</p>
          <div className="flex items-center gap-1 text-[11px]">
            <span>Official Training & Placement Cell (TPO) • Sanjivani University • AICTE & UGC Approved</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
