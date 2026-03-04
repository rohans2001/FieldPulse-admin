"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import s from "./landing.module.css";

/* ─── Tiny SVG Icons ──────────────────────────────────────────────────────── */
const IconGeo = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#2563EB" }}>
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconChart = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#10B981" }}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const IconAudit = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#6366F1" }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const IconArrow = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconPlay = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

/* ─── Logo Icon ───────────────────────────────────────────────────────────── */
const LogoIcon = () => (
  <div className={s.navLogoIcon}>
    <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" fill="rgba(255,255,255,0.3)" />
    </svg>
  </div>
);

/* ─── Feature Cards Data ──────────────────────────────────────────────────── */
const features = [
  {
    icon: <IconGeo />,
    iconClass: s.iconBlue,
    title: "Geo-Fenced Check-Ins",
    desc: "Ensure employees check in only within approved geographic zones. Configurable radius per site with real-time verification.",
  },
  {
    icon: <IconChart />,
    iconClass: s.iconGreen,
    title: "Real-Time Dashboard",
    desc: "Monitor your entire workforce at a glance. Live status, location pings, and activity feeds update as events happen.",
  },
  {
    icon: <IconAudit />,
    iconClass: s.iconPurple,
    title: "Audit Logs",
    desc: "Every check-in, update, and admin action is timestamped and stored. Immutable records for full operational accountability.",
  },
];

/* ─── Steps Data ──────────────────────────────────────────────────────────── */
const steps = [
  {
    num: "1",
    title: "Add Employees & Sites",
    desc: "Onboard your team and configure geo-fenced site locations in minutes. No technical expertise required.",
  },
  {
    num: "2",
    title: "Employees Check In via Mobile",
    desc: "Field staff check in from the mobile app. Location is verified against approved site boundaries automatically.",
  },
  {
    num: "3",
    title: "Monitor Activity Live",
    desc: "Watch check-ins, compliance rates, and alerts in real time from your admin dashboard. Act instantly.",
  },
];

/* ─── Pricing Data ────────────────────────────────────────────────────────── */
const plans = [
  {
    tier: "Starter",
    price: "$29",
    sub: "per month · up to 25 employees",
    featured: false,
    features: ["25 field employees", "3 geo-fenced sites", "Real-time dashboard", "Email support"],
  },
  {
    tier: "Professional",
    price: "$79",
    sub: "per month · up to 150 employees",
    featured: true,
    features: ["150 field employees", "Unlimited sites", "Advanced audit logs", "Priority support", "API access"],
  },
  {
    tier: "Enterprise",
    price: "Custom",
    sub: "volume pricing · unlimited scale",
    featured: false,
    features: ["Unlimited employees", "Custom geo rules", "SSO & SAML", "Dedicated CSM", "SLA guarantee"],
  },
];

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function LandingPage() {
  const revealRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(s.visible);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addReveal = (el: HTMLElement | null) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  return (
    <div className={s.landing}>
      {/* ── Navbar ────────────────────────────────────────────────────── */}
      <nav className={s.nav}>
        <Link href="/" className={s.navLogo}>
          <LogoIcon />
          <span className={s.navBrand}>
            Field<span className={s.navBrandAccent}>Pulse</span>
          </span>
        </Link>

        <div className={s.navLinks}>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#pricing">Pricing</a>
          <a href="#contact">Contact</a>
        </div>

        <div className={s.navCtas}>
          <Link href="/login" className={s.navLoginBtn}>Log In</Link>
          <Link href="/signup" className={s.navPrimaryBtn}>Start Free Trial</Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className={s.hero}>
        <div className={s.heroBlob1} />
        <div className={s.heroBlob2} />

        <div className={`${s.heroBadge} ${s.fadeUp}`}>
          <span className={s.heroBadgeDot} />
          Now in General Availability
        </div>

        <h1 className={`${s.heroTitle} ${s.fadeUp} ${s.fadeUp1}`}>
          Smarter{" "}
          <span className={s.heroTitleAccent}>Field Workforce</span>
          <br />Management
        </h1>

        <p className={`${s.heroSub} ${s.fadeUp} ${s.fadeUp2}`}>
          Track employee check-ins, enforce geo-fencing, and monitor your
          workforce in real time — all in one powerful dashboard.
        </p>

        <div className={`${s.heroCtas} ${s.fadeUp} ${s.fadeUp3}`}>
          <Link href="/signup" className={s.btnPrimary}>
            Start Free Trial <IconArrow />
          </Link>
          <Link href="/login" className={s.btnSecondary}>
            <IconPlay /> Watch Demo
          </Link>
        </div>

        <div className={`${s.heroDashboardWrapper} ${s.fadeUp} ${s.fadeUp4}`}>
          <div className={s.heroDashboardGlow} />
          <Image
            src="/dashboard-preview.png"
            alt="FieldPulse Admin Dashboard"
            width={1200}
            height={700}
            className={s.heroDashboardImg}
            priority
            onError={(e) => {
              // Fallback: hide broken image, show styled placeholder
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent) {
                const placeholder = document.createElement("div");
                placeholder.style.cssText =
                  "width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,#1E293B 0%,#0F172A 100%);border-radius:20px;display:flex;align-items:center;justify-content:center;border:1px solid #334155;";
                placeholder.innerHTML = `
                  <div style="text-align:center;color:#475569;padding:40px;">
                    <div style="font-size:48px;margin-bottom:16px;">📊</div>
                    <div style="font-size:1.1rem;font-weight:600;color:#94A3B8;margin-bottom:8px;">FieldPulse Admin Dashboard</div>
                    <div style="font-size:0.85rem;color:#64748B;">Real-time workforce monitoring · Geo-fenced check-ins · Audit logs</div>
                    <div style="margin-top:32px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;max-width:600px;">
                      ${["👥 128 Employees", "✅ 94 Active", "📍 312 Check-ins", "📈 98.2% Compliance"].map(t => `<div style="background:#1E293B;border:1px solid #334155;border-radius:10px;padding:14px 10px;font-size:0.78rem;color:#94A3B8;">${t}</div>`).join("")}
                    </div>
                  </div>
                `;
                parent.appendChild(placeholder);
              }
            }}
          />
        </div>
      </section>

      {/* ── Social Proof ──────────────────────────────────────────────── */}
      <div className={s.socialProof} ref={addReveal as React.Ref<HTMLDivElement>}>
        <div className={s.socialProofInner}>
          <p className={s.socialProofLabel}>Trusted by field teams across industries</p>
          <div className={s.socialProofLogos}>
            {["BuildCo", "TechServe", "GridPower", "MetroField", "SiteForce", "RapidRes"].map((name) => (
              <span key={name} className={s.socialProofLogo}>{name}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="features" className={s.section}>
        <div className={s.sectionInner}>
          <div className={`${s.reveal}`} ref={addReveal as React.Ref<HTMLDivElement>}>
            <span className={s.sectionLabel}>Features</span>
            <h2 className={s.sectionTitle}>Everything your operations need</h2>
            <p className={s.sectionSub}>
              Purpose-built for companies that manage distributed field teams.
              Powerful enough for enterprise. Simple enough for day one.
            </p>
          </div>
          <div className={s.featuresGrid}>
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`${s.featureCard} ${s.reveal} ${i === 1 ? s.revealDelay1 : i === 2 ? s.revealDelay2 : ""}`}
                ref={addReveal as React.Ref<HTMLDivElement>}
              >
                <div className={`${s.featureIconWrap} ${f.iconClass}`}>{f.icon}</div>
                <h3 className={s.featureTitle}>{f.title}</h3>
                <p className={s.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <section id="how-it-works" className={`${s.section} ${s.howItWorks}`}>
        <div className={s.sectionInner}>
          <div className={`${s.reveal}`} ref={addReveal as React.Ref<HTMLDivElement>}>
            <span className={s.sectionLabel}>How It Works</span>
            <h2 className={s.sectionTitle}>Up and running in minutes</h2>
            <p className={s.sectionSub}>
              No lengthy onboarding. No complex integrations. Three steps to a
              fully tracked, geo-compliant field operation.
            </p>
          </div>
          <div className={s.stepsGrid}>
            {steps.map((step, i) => (
              <div
                key={step.num}
                className={`${s.step} ${s.reveal} ${i === 1 ? s.revealDelay1 : i === 2 ? s.revealDelay2 : ""}`}
                ref={addReveal as React.Ref<HTMLDivElement>}
              >
                <div className={s.stepNum}>{step.num}</div>
                <h3 className={s.stepTitle}>{step.title}</h3>
                <p className={s.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product Preview ───────────────────────────────────────────── */}
      <section className={s.previewSection}>
        <div className={s.previewContainer}>
          <div className={`${s.reveal}`} ref={addReveal as React.Ref<HTMLDivElement>}>
            <span className={s.sectionLabel}>Product Preview</span>
            <h2 className={s.sectionTitle}>See your workforce, in real time</h2>
            <p className={s.sectionSub} style={{ margin: "0 auto" }}>
              One unified dashboard. All your employees, sites, and compliance
              metrics — visible the moment you log in.
            </p>
          </div>
          <div
            className={`${s.previewFrame} ${s.reveal}`}
            ref={addReveal as React.Ref<HTMLDivElement>}
          >
            <div className={s.previewBar}>
              <span className={`${s.previewDot} ${s.previewDotR}`} />
              <span className={`${s.previewDot} ${s.previewDotY}`} />
              <span className={`${s.previewDot} ${s.previewDotG}`} />
              <span className={s.previewUrl}>app.fieldpulse.io/dashboard</span>
            </div>
            {/* Inline dashboard mockup — no external image dependency */}
            <div
              style={{
                background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                padding: "32px",
                minHeight: "420px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {/* KPI Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
                {[
                  { label: "Total Employees", value: "128", delta: "+3 this week", color: "#2563EB" },
                  { label: "Active Today", value: "94", delta: "73.4% workforce", color: "#10B981" },
                  { label: "Check-ins Today", value: "312", delta: "+12 from yesterday", color: "#6366F1" },
                  { label: "Compliance Rate", value: "98.2%", delta: "▲ 1.4% this week", color: "#F59E0B" },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      padding: "20px 18px",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", color: "#64748B", marginBottom: "8px", fontWeight: 500 }}>{kpi.label}</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#F1F5F9", marginBottom: "4px" }}>{kpi.value}</div>
                    <div style={{ fontSize: "0.72rem", color: kpi.color }}>{kpi.delta}</div>
                  </div>
                ))}
              </div>
              {/* Activity Table */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#94A3B8" }}>Recent Check-ins</span>
                  <span style={{ fontSize: "0.75rem", color: "#475569" }}>Live · updating now</span>
                </div>
                {[
                  { name: "Marcus Rivera", site: "Downtown HQ", time: "09:02 AM", status: "On-Site", statusColor: "#10B981", bg: "rgba(16,185,129,0.1)" },
                  { name: "Sarah Chen", site: "North Depot", time: "09:18 AM", status: "En Route", statusColor: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
                  { name: "James Okafor", site: "East Yard", time: "09:31 AM", status: "On-Site", statusColor: "#10B981", bg: "rgba(16,185,129,0.1)" },
                  { name: "Priya Sharma", site: "West Zone B", time: "09:44 AM", status: "Absent", statusColor: "#EF4444", bg: "rgba(239,68,68,0.1)" },
                ].map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 120px 100px",
                      padding: "12px 20px",
                      borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#CBD5E1" }}>{row.name}</span>
                    <span style={{ fontSize: "0.8rem", color: "#64748B" }}>{row.site}</span>
                    <span style={{ fontSize: "0.78rem", color: "#475569" }}>{row.time}</span>
                    <span style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: row.statusColor,
                      background: row.bg,
                      padding: "4px 10px",
                      borderRadius: "6px",
                      display: "inline-block",
                      textAlign: "center",
                    }}>{row.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────── */}
      <section id="pricing" className={s.section}>
        <div className={s.sectionInner}>
          <div className={`${s.reveal}`} ref={addReveal as React.Ref<HTMLDivElement>}>
            <span className={s.sectionLabel}>Pricing</span>
            <h2 className={s.sectionTitle}>Simple, transparent pricing</h2>
            <p className={s.sectionSub}>
              Start free. Scale as you grow. No hidden fees, no setup costs.
              Cancel anytime.
            </p>
          </div>
          <div className={s.pricingGrid}>
            {plans.map((plan, i) => (
              <div
                key={plan.tier}
                className={`${s.pricingCard} ${plan.featured ? s.pricingCardFeatured : ""} ${s.reveal} ${i === 1 ? s.revealDelay1 : i === 2 ? s.revealDelay2 : ""}`}
                ref={addReveal as React.Ref<HTMLDivElement>}
              >
                {plan.featured && <div className={s.pricingBadge}>Most Popular</div>}
                <div className={`${s.pricingTier} ${plan.featured ? s.pricingTierFeatured : ""}`}>{plan.tier}</div>
                <div className={s.pricingPrice}>{plan.price}</div>
                <div className={s.pricingPriceSub}>{plan.sub}</div>
                <div className={s.pricingDivider} />
                <ul className={s.pricingFeatures}>
                  {plan.features.map((f) => (
                    <li key={f}>
                      <span className={s.checkIcon}><IconCheck /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`${s.pricingBtn} ${plan.featured ? s.pricingBtnSolid : s.pricingBtnOutline}`}
                >
                  {plan.tier === "Enterprise" ? "Contact Sales" : "Get Started"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className={s.ctaSection}>
        <div className={`${s.ctaBlob} ${s.ctaBlob1}`} />
        <div className={`${s.ctaBlob} ${s.ctaBlob2}`} />
        <div className={s.ctaInner}>
          <h2 className={s.ctaTitle}>
            Ready to modernize your field operations?
          </h2>
          <p className={s.ctaSub}>
            Join hundreds of companies already running smarter, more accountable
            field teams on FieldPulse.
          </p>
          <div className={s.ctaButtons}>
            <Link href="/signup" className={s.ctaBtnPrimary}>
              Create Your Company <IconArrow />
            </Link>
            <a href="mailto:demo@fieldpulse.io" className={s.ctaBtnSecondary}>
              Book a Demo
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer id="contact" className={s.footer}>
        <div className={s.footerInner}>
          <div className={s.footerTop}>
            {/* Brand */}
            <div>
              <Link href="/" className={s.footerBrand}>
                <LogoIcon />
                <span className={s.footerBrandText}>
                  Field<span style={{ color: "#2563EB" }}>Pulse</span>
                </span>
              </Link>
              <p className={s.footerDesc}>
                The enterprise field workforce management platform — geo-fenced
                check-ins, real-time monitoring, full audit compliance.
              </p>
            </div>

            {/* Product */}
            <div>
              <div className={s.footerColTitle}>Product</div>
              <ul className={s.footerLinks}>
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><Link href="/login">Login</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <div className={s.footerColTitle}>Company</div>
              <ul className={s.footerLinks}>
                <li><a href="#">About</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="mailto:demo@fieldpulse.io">Contact</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <div className={s.footerColTitle}>Legal</div>
              <ul className={s.footerLinks}>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Security</a></li>
                <li><a href="#">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className={s.footerBottom}>
            <span className={s.footerCopyright}>
              © {new Date().getFullYear()} FieldPulse. All rights reserved.
            </span>
            <div className={s.footerBottomLinks}>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="mailto:demo@fieldpulse.io">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}