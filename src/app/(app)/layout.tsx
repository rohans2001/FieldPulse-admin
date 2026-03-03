"use client";

import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

/* ── Nav icon helpers ──────────────────────────────────────────── */
function IconDashboard({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconEmployees({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconSites({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IconVisits({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconSettings({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function IconActivity({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
function IconLogout({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", Icon: IconDashboard },
  { name: "Employees", href: "/employees", Icon: IconEmployees },
  { name: "Sites", href: "/sites", Icon: IconSites },
  { name: "Visits", href: "/visits", Icon: IconVisits },
  { name: "Settings", href: "/settings", Icon: IconSettings },
  { name: "Activity", href: "/audit", Icon: IconActivity },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("Loading...");

  // 🔥 Step 1: Get user + companyId
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      setEmail(user.email || "");

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setCompanyId(userSnap.data().companyId);
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔥 Step 2: Attach real-time listener separately
  useEffect(() => {
    if (!companyId) return;

    const companyRef = doc(db, "companies", companyId);

    const unsubscribe = onSnapshot(companyRef, (snapshot) => {
      if (snapshot.exists()) {
        setCompanyName(snapshot.data().name);
      }
    });

    return () => unsubscribe();
  }, [companyId]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <AuthGuard>
      <div
        style={{ minHeight: "100vh", display: "flex", backgroundColor: "var(--background)" }}
        className="transition-colors duration-200"
      >
        {/* ── Sidebar ──────────────────────────────────────────── */}
        <aside
          style={{
            width: "var(--sidebar-width)",
            flexShrink: 0,
            backgroundColor: "var(--card)",
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "1px 0 0 0 var(--border), 4px 0 16px 0 rgba(15,23,42,0.04)",
            position: "sticky",
            top: 0,
            height: "100vh",
            overflowY: "auto",
          }}
          className="animate-fade-in"
        >
          {/* Top: brand + nav */}
          <div style={{ padding: "28px 20px 20px" }}>
            {/* Brand */}
            <div style={{ marginBottom: "32px" }}>
              {companyName === "Loading..." ? (
                <div className="skeleton" style={{ height: "22px", width: "70%", marginBottom: "4px" }} />
              ) : (
                <div>
                  <p
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      marginBottom: "4px",
                    }}
                  >
                    Workspace
                  </p>
                  <h1
                    title={companyName}
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "var(--foreground)",
                      letterSpacing: "-0.01em",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      cursor: "default",
                    }}
                  >
                    {companyName}
                  </h1>
                </div>
              )}
            </div>

            {/* Nav */}
            <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {NAV_ITEMS.map(({ name, href, Icon }) => {
                const isActive = pathname.startsWith(href);
                return (
                  <Link
                    key={name}
                    href={href}
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      fontSize: "13.5px",
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? "var(--primary)" : "var(--muted)",
                      backgroundColor: isActive ? "#EFF6FF" : "transparent",
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                      cursor: "pointer",
                    }}
                    className={`sidebar-link${isActive ? " active" : ""}`}
                  >
                    {/* Active accent bar */}
                    {isActive && (
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "6px",
                          bottom: "6px",
                          width: "3px",
                          borderRadius: "0 4px 4px 0",
                          backgroundColor: "var(--primary)",
                        }}
                      />
                    )}
                    <Icon size={16} />
                    {name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom: user + logout */}
          <div
            style={{
              padding: "16px 20px 20px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "8px",
              }}
            >
              {/* Avatar circle */}
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>
                  {email ? email[0].toUpperCase() : "?"}
                </span>
              </div>
              <p
                title={email}
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  cursor: "default",
                }}
              >
                {email}
              </p>
            </div>

            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                padding: "8px 10px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--muted)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
                textAlign: "left",
              }}
              className="logout-btn"
            >
              <IconLogout size={14} />
              Sign out
            </button>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────── */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "32px",
            color: "var(--foreground)",
          }}
          className="animate-fade-in"
        >
          {children}
        </main>
      </div>

      {/* Sidebar hover/active styles injected via style tag */}
      <style>{`
        .sidebar-link:hover:not(.active) {
          background-color: #F1F5F9 !important;
          color: var(--foreground) !important;
        }
        .logout-btn:hover {
          background-color: #FEF2F2 !important;
          color: #DC2626 !important;
        }
        @media (prefers-color-scheme: dark) {
          aside {
            background-color: #1E293B !important;
            border-color: #334155 !important;
          }
          .sidebar-link.active {
            background-color: rgba(37,99,235,0.12) !important;
          }
          .sidebar-link:hover:not(.active) {
            background-color: rgba(255,255,255,0.05) !important;
            color: #F1F5F9 !important;
          }
          .logout-btn:hover {
            background-color: rgba(239,68,68,0.1) !important;
            color: #F87171 !important;
          }
        }
      `}</style>
    </AuthGuard>
  );
}