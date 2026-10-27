import React from "react";
import {
  Building2,
  UtensilsCrossed,
  UserCheck,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Clock,
  Star,
  LogIn,
  ChevronRight,
  Sparkles,
  Bed,
  Check,
} from "lucide-react";

interface LandingPageProps {
  onOpenAuth: (defaultType?: "student" | "admin") => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24 py-2 sm:py-6">
      {/* 1. HERO SECTION (Split Layout) */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 lg:p-14 shadow-xs">
        {/* Soft ambient color accents */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-indigo-50/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-blue-50/60 blur-3xl" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Heading, Tagline, Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3.5 py-1 text-xs font-semibold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>NESTORA &bull; Modern Living Solutions</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
              A Better Way to Experience{" "}
              <span className="text-indigo-600">Hostel Living.</span>
            </h1>

            <p className="text-sm sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Manage accommodation, room allocation, payments, and everyday mess services through
              one simple platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <button
                onClick={() => onOpenAuth("student")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 hover:shadow-md transition active:scale-[0.98] min-h-[48px]"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>

              <button
                onClick={() => scrollToSection("features")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition active:scale-[0.98] min-h-[48px]"
              >
                <span>Explore Features</span>
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-slate-500 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Verified Room Allocations</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Transparent Dues Tracking</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Daily Mess Management</span>
              </span>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-100 group">
              <img
                src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80"
                alt="Modern student living room accommodation"
                className="w-full h-[280px] sm:h-[380px] lg:h-[440px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3.5 shadow-sm text-xs">
                <div className="flex items-center justify-between text-slate-900 font-bold mb-1">
                  <span>Smart Living Experience</span>
                  <span className="text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Comfort &amp; Care
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Clean rooms, scheduled dining, and digital accounts designed for modern campus life.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION A — EXPLORE HOSTEL FEATURES */}
      <section id="features" className="space-y-8 scroll-mt-24">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Explore Hostel Features
          </h2>
          <h3 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Designed for Everyday Student Comfort &amp; Staff Efficiency
          </h3>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Every feature in NESTORA is built to make campus accommodation straightforward,
            transparent, and reliable.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Feature 1 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Bed className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Smart Room Allocation</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Bed assignments, room categories, floor distribution, and occupancy tracking without
                scheduling conflicts.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <UserCheck className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Student Profiles &amp; Details</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Verified student directory, roll numbers, contact information, emergency contacts,
                and active residency records.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <FileText className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Hostel Contracts &amp; Stay Info</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Transparent lease tenure dates, monthly rent agreements, and registered security
                deposit records.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <CreditCard className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Fee Payments &amp; Dues</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Structured rent schedules, verified digital receipts, and automatic real-time
                balance calculations.
              </p>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Daily Mess Menus</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Scheduled multi-meal daily menus for breakfast, lunch, evening snacks, and dinner
                updated dynamically.
              </p>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Clock className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Tiffin &amp; Dine-in Selection</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Flexible lunch preference selection between packed Tiffin and dining hall Dine-in
                with an automated 09:30 AM cutoff.
              </p>
            </div>
          </div>

          {/* Feature 7 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center mb-4">
                <Star className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Food Ratings &amp; Feedback</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Direct student feedback with 1–5 star ratings and comments to help supervisors
                maintain culinary quality.
              </p>
            </div>
          </div>

          {/* Feature 8 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-4">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Administration &amp; Reports</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Comprehensive administrative oversight, room occupancy metrics, and instant CSV
                report exports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION B — HOSTEL LIFESTYLE GALLERY */}
      <section className="space-y-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Hostel Lifestyle Gallery
          </h2>
          <h3 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Spaces Crafted for Community, Study &amp; Rest
          </h3>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            A glimpse into representative living, dining, and shared spaces in modern hostel
            environments.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Gallery Item 1 */}
          <div className="group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs hover:shadow-md transition">
            <div className="h-52 overflow-hidden bg-slate-100">
              <img
                src="https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80"
                alt="Modern hostel accommodation room"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
            <div className="p-4 space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Modern Living Quarters</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Comfortable, well-lit spaces designed for rest and academic focus.
              </p>
            </div>
          </div>

          {/* Gallery Item 2 */}
          <div className="group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs hover:shadow-md transition">
            <div className="h-52 overflow-hidden bg-slate-100">
              <img
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80"
                alt="Quiet study spaces and student library desks"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
            <div className="p-4 space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Dedicated Study Areas</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Collaborative and quiet zones equipped for productive learning sessions.
              </p>
            </div>
          </div>

          {/* Gallery Item 3 */}
          <div className="group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs hover:shadow-md transition">
            <div className="h-52 overflow-hidden bg-slate-100">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
                alt="Clean mess hall and dining area"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
            <div className="p-4 space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Hygienic Dining Facilities</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Spacious dining areas serving scheduled daily meals and packed tiffins.
              </p>
            </div>
          </div>

          {/* Gallery Item 4 */}
          <div className="group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs hover:shadow-md transition">
            <div className="h-52 overflow-hidden bg-slate-100">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80"
                alt="Student common room lounge"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
            <div className="p-4 space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Community Social Lounges</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Welcoming community spaces for student interaction and downtime.
              </p>
            </div>
          </div>

          {/* Gallery Item 5 */}
          <div className="group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs hover:shadow-md transition">
            <div className="h-52 overflow-hidden bg-slate-100">
              <img
                src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
                alt="Well-maintained accommodation facilities"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
            <div className="p-4 space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Well-Maintained Facilities</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Managed residential amenities prioritizing hygiene, security, and comfort.
              </p>
            </div>
          </div>

          {/* Gallery Item 6 */}
          <div className="group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs hover:shadow-md transition">
            <div className="h-52 overflow-hidden bg-slate-100">
              <img
                src="https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80"
                alt="Peaceful green campus setting"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
            <div className="p-4 space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Campus Surroundings</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Peaceful, secure residential environment close to academic halls.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 italic">
          * Representative images of modern student accommodation and shared lifestyle amenities.
        </p>
      </section>

      {/* 4. SECTION C — EVERYDAY HOSTEL MANAGEMENT */}
      <section className="space-y-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Everyday Hostel Management
          </h2>
          <h3 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Streamlined Daily Operations at a Glance
          </h3>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Experience how NESTORA simplifies the core pillars of campus living.
          </p>
        </div>

        <div className="space-y-6">
          {/* Block 1: Accommodation */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 lg:p-10 shadow-xs flex flex-col md:flex-row items-center gap-6 sm:gap-10">
            <div className="w-full md:w-1/2 space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600">
                <Building2 className="h-4 w-4" />
                <span>Accommodation &amp; Rooms</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-slate-900">
                Organized Room Assignments &amp; Living Spaces
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Clear block inventories, single-occupancy bed mapping, and transparent residency
                contracts prevent double-bookings and provide residents peace of mind from day one.
              </p>
            </div>
            <div className="w-full md:w-1/2 rounded-2xl overflow-hidden border border-slate-200 h-56 sm:h-64 bg-slate-100">
              <img
                src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"
                alt="Room allocation and comfortable bed setup"
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
            </div>
          </div>

          {/* Block 2: Mess & Dining */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 lg:p-10 shadow-xs flex flex-col md:flex-row-reverse items-center gap-6 sm:gap-10">
            <div className="w-full md:w-1/2 space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600">
                <UtensilsCrossed className="h-4 w-4" />
                <span>Mess &amp; Dining Choices</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-slate-900">
                Flexible Meal Preferences with Cutoff Rules
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Students can choose between a packed Tiffin or sit-down Dine-in lunch before the daily
                09:30 AM cutoff, giving mess supervisors exact cooking headcounts and reducing food waste.
              </p>
            </div>
            <div className="w-full md:w-1/2 rounded-2xl overflow-hidden border border-slate-200 h-56 sm:h-64 bg-slate-100">
              <img
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
                alt="Nutritious dining meal preparation"
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
            </div>
          </div>

          {/* Block 3: Financials */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 lg:p-10 shadow-xs flex flex-col md:flex-row items-center gap-6 sm:gap-10">
            <div className="w-full md:w-1/2 space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600">
                <CreditCard className="h-4 w-4" />
                <span>Financial Transparency</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-slate-900">
                Clear Rent Schedules &amp; Verified Statements
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Transparent rent ledgers, security deposits, and real-time dues calculations ensure
                both students and administrators maintain accurate, auditable records.
              </p>
            </div>
            <div className="w-full md:w-1/2 rounded-2xl overflow-hidden border border-slate-200 h-56 sm:h-64 bg-slate-100">
              <img
                src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80"
                alt="Financial accounting and verified receipts"
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION D — FINAL CALL TO ACTION */}
      <section className="rounded-3xl bg-indigo-600 p-8 sm:p-12 lg:p-14 text-center text-white shadow-sm relative overflow-hidden">
        <div className="relative max-w-2xl mx-auto space-y-4">
          <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Experience Smarter Hostel Living?
          </h3>
          <p className="text-sm sm:text-base text-indigo-100 leading-relaxed">
            Sign in with your campus account to access your accommodation, meals, and statements on NESTORA.
          </p>
          <div className="pt-3">
            <button
              onClick={() => onOpenAuth("student")}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-indigo-600 shadow-sm hover:bg-indigo-50 transition active:scale-[0.98] min-h-[48px]"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In to NESTORA</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
