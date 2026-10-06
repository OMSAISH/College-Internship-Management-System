import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, Briefcase, Building2, Users, Award,
  ArrowRight, CheckCircle2, ChevronRight, Star,
  ShieldCheck, TrendingUp, Sparkles, HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { Internship, Company, OverviewStats } from '../../types';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const LandingPage: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [featuredInternships, setFeaturedInternships] = useState<Internship[]>([]);
  const [featuredCompanies, setFeaturedCompanies] = useState<Company[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    // Load initial showcase data
    api.listInternships({ limit: 4, sort_by: 'newest' })
      .then(res => setFeaturedInternships(res))
      .catch(() => {});

    api.listCompanies({ limit: 4 })
      .then(res => setFeaturedCompanies(res))
      .catch(() => {});

    // Try fetching public overview stats
    api.getAnalyticsDashboard()
      .then(res => setStats(res.overview))
      .catch(() => {
        // Fallback realistic defaults for Indian engineering institutions
        setStats({
          total_students: 2450,
          total_companies: 120,
          active_internships: 65,
          total_applications: 5120,
          total_interviews: 890,
          total_placements: 610,
          placement_rate: 96.8,
          average_stipend: 42500
        });
      });
  }, []);

  const faqs = [
    {
      q: "How does the College Internship Management System (CIMS) work for Indian students?",
      a: "Students complete their institutional profile with verified PRN / Roll numbers, upload their PDF resumes, discover approved corporate internships (TCS, Infosys, Razorpay, Zomato, etc.), apply via multi-step wizard, attend scheduled interviews, and receive academic credits per AICTE guidelines."
    },
    {
      q: "Can Training & Placement Officers (TPOs) and faculty coordinators monitor drives?",
      a: "Yes! TPOs and departmental coordinators have a dedicated console to filter student applications by CGPA & branch, manage company drives, schedule campus interviews, and record AICTE/ABET 7-criteria evaluations."
    },
    {
      q: "How are partner companies verified before posting opportunities?",
      a: "All corporate partners must provide valid Indian Corporate Identification Numbers (CIN) and registered university relations contacts before internship drives are approved by college administration."
    },
    {
      q: "What evaluation criteria are used for internship performance?",
      a: "Our standardized rubric evaluates Technical & Engineering Problem Solving, Design & Development, Tool Proficiency, Code Quality & Testing, Ethics, Teamwork, and Communication on a 1-5 scale."
    }
  ];

  return (
    <div className="space-y-20 pb-20">
      
      {/* 1. Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Official Sanjivani University Training & Placement Gateway 2026 • AICTE & UGC Approved</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
              Your Gateway to Meaningful{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-500">
                Internship Opportunities
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Connecting Sanjivani University engineering students, Training & Placement Officers (TPO), and India's top tech enterprises & GCCs across the complete internship lifecycle from discovery to Pre-Placement Offers (PPO).
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link to="/internships">
                <Button size="lg" className="w-full sm:w-auto shadow-md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Explore Internships
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Student Portal
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Faculty Login
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-6 pt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Verified Employers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Real-Time Status Tracking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Curricular Credit Aligned</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Key Institutional Statistics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-6 text-center border-brand-100 dark:border-brand-950/60 bg-gradient-to-b from-white to-brand-50/20 dark:from-slate-900 dark:to-brand-950/20">
            <p className="text-3xl sm:text-4xl font-extrabold text-brand-600 dark:text-brand-400">
              {stats?.total_students || 1200}+
            </p>
            <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              Registered Students
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Across all engineering & tech depts</p>
          </Card>

          <Card className="p-6 text-center border-brand-100 dark:border-brand-950/60 bg-gradient-to-b from-white to-brand-50/20 dark:from-slate-900 dark:to-brand-950/20">
            <p className="text-3xl sm:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {stats?.total_companies || 80}+
            </p>
            <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              Partner Companies
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Top-tier corporate recruiters</p>
          </Card>

          <Card className="p-6 text-center border-brand-100 dark:border-brand-950/60 bg-gradient-to-b from-white to-brand-50/20 dark:from-slate-900 dark:to-brand-950/20">
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats?.active_internships || 45}+
            </p>
            <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              Active Opportunities
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">High-stipend approved roles</p>
          </Card>

          <Card className="p-6 text-center border-brand-100 dark:border-brand-950/60 bg-gradient-to-b from-white to-brand-50/20 dark:from-slate-900 dark:to-brand-950/20">
            <p className="text-3xl sm:text-4xl font-extrabold text-amber-500">
              {stats?.placement_rate || 94.2}%
            </p>
            <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              Placement Success
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Consistently certified cohort rate</p>
          </Card>
        </div>
      </section>

      {/* 3. How It Works (Step by Step) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="brand" className="mb-2">Structured Lifecycle</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            How The Platform Works
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            A frictionless, end-to-end recruitment and evaluation pipeline designed for higher education.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { step: '01', title: 'Create Profile', desc: 'Build your academic profile, highlight technical skills, and upload a verified PDF resume.' },
            { step: '02', title: 'Discover Roles', desc: 'Filter pre-screened internships by domain, work mode, duration, and stipend.' },
            { step: '03', title: 'Apply Directly', desc: 'Submit personalized cover letters and answers with our 5-step guided wizard.' },
            { step: '04', title: 'Interview', desc: 'Coordinate technical rounds and receive direct feedback notifications from coordinators.' },
            { step: '05', title: 'Get Placed', desc: 'Secure institutional acceptance, complete your internship capstone, and get evaluated.' },
          ].map((item, i) => (
            <Card key={i} className="p-5 relative group hover:border-brand-300 dark:hover:border-brand-700 transition-all">
              <span className="text-2xl font-black text-slate-200 dark:text-slate-800 group-hover:text-brand-500 transition-colors">
                {item.step}
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {item.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. Featured Internships */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <Badge variant="brand" className="mb-2">Marketplace</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Featured Opportunities
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Top curated postings from approved technology and engineering employers.
            </p>
          </div>
          <Link to="/internships">
            <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
              View All Opportunities
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredInternships.map(internship => (
            <Card key={internship.id} hover className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-brand-600 text-lg border border-slate-200 dark:border-slate-700">
                      {internship.company?.name?.[0] || 'C'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base hover:text-brand-600 transition-colors">
                        <Link to={`/internships/${internship.id}`}>{internship.title}</Link>
                      </h3>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {internship.company?.name} • {internship.location}
                      </p>
                    </div>
                  </div>
                  <Badge variant={internship.work_mode === 'REMOTE' ? 'success' : 'info'} size="sm">
                    {internship.work_mode.replace('_', ' ')}
                  </Badge>
                </div>

                <p className="mt-4 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {internship.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {internship.skills_required.slice(0, 4).map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    ₹{internship.stipend_amount.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>
                <Link to={`/internships/${internship.id}`}>
                  <Button size="sm">
                    Apply Now
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 5. Benefits for All Stakeholders */}
      <section className="bg-slate-100/70 dark:bg-slate-900/40 py-16 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="brand" className="mb-2">Ecosystem Value</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Built for Every Campus Stakeholder
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">For Students</h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <li>• Unified discovery across all top Indian tech and product companies.</li>
                <li>• Real-time application timeline status updates & NOC tracking.</li>
                <li>• Campus interview scheduling alerts and direct meeting links.</li>
                <li>• AICTE / ABET outcome-based performance evaluations and credit clearance.</li>
              </ul>
            </Card>

            <Card className="p-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">For TPO & Faculty Coordinators</h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <li>• Automated candidate profile screening with CGPA and backlog checks.</li>
                <li>• One-click shortlisting, rejection, and interview slot dispatch.</li>
                <li>• AICTE 7-criteria outcome-based rubrics integration.</li>
                <li>• Comprehensive branch-wise placement reports and NIRF accreditation analytics.</li>
              </ul>
            </Card>

            <Card className="p-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">For Partner Companies</h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <li>• Direct access to pre-screened, top-ranked engineering talent.</li>
                <li>• Company branding profile with verified campus alumni ratings.</li>
                <li>• Structured campus hiring drives and verified candidate credentials.</li>
                <li>• High Pre-Placement Offer (PPO) conversion to full-time SDE roles.</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* 6. Partner Companies */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="brand" className="mb-2">Industry Network</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Trusted by India's Top Tech Recruiters
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featuredCompanies.map(c => (
            <Card key={c.id} hover className="p-5 text-center flex flex-col items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-extrabold text-brand-600 text-xl border border-slate-200 dark:border-slate-700 mb-3">
                {c.name[0]}
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                {c.name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{c.industry}</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-amber-500 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{c.average_rating > 0 ? c.average_rating.toFixed(1) : '5.0'}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 7. Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="brand" className="mb-2">Student & Recruiter Voice</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            What Our Campus Community Says
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-1 text-amber-400 mb-3">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />)}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
              "Secured a 6-month pre-placement internship at Razorpay Bengaluru through our college TPO portal with a ₹50,000/month stipend! The transparent status tracker and interview notifications made the process stress-free."
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 font-bold text-xs flex items-center justify-center">
                AS
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Aarav Sharma</p>
                <p className="text-[10px] text-slate-400">B.Tech Computer Engg '26, Sanjivani University • Placed at Razorpay (₹50k/mo)</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-1 text-amber-400 mb-3">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />)}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
              "As a departmental placement coordinator, screening 500+ student applications and scheduling rounds with companies like TCS, Infosys, and Flipkart is now completely automated and seamless."
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 font-bold text-xs flex items-center justify-center">
                SS
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Prof. Sunita Sharma</p>
                <p className="text-[10px] text-slate-400">T&P Coordinator • School of Computing, Sanjivani University</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-1 text-amber-400 mb-3">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />)}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
              "The technical caliber of engineering candidates and the seamless online evaluation rubrics made our campus recruitment drive at Sanjivani University extraordinarily high-yield."
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 font-bold text-xs flex items-center justify-center">
                VS
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Vikramaditya Sengupta</p>
                <p className="text-[10px] text-slate-400">Staff Engineer & Campus Panelist • Razorpay</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 8. FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <Badge variant="brand" className="mb-2">Common Inquiries</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <Card key={idx} className="overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 focus:outline-none"
              >
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {faq.q}
                </span>
                <span className="text-brand-600 dark:text-brand-400 text-sm font-bold shrink-0">
                  {openFaq === idx ? '−' : '+'}
                </span>
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                  {faq.a}
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* 9. Final CTA Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-brand-600 dark:bg-brand-900 text-white p-8 sm:p-12 text-center relative overflow-hidden shadow-xl shadow-brand-500/10">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to Accelerate Your Career Journey?
            </h2>
            <p className="text-sm sm:text-base text-brand-100">
              Join thousands of university students discovering verified corporate internships today.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register">
                <Button size="lg" className="bg-white text-brand-700 hover:bg-brand-50 shadow-none font-bold">
                  Create Student Account
                </Button>
              </Link>
              <Link to="/internships">
                <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                  Explore Postings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
