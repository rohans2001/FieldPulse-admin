"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
    collection,
    addDoc,
    query,
    where,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    onSnapshot,
    getDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

/* ── Audit log writer ───────────────────────────────────────────── */
async function writeAuditLog({
    companyId, adminId, adminEmail, action, targetId, targetName, targetType
}: { companyId: string; adminId: string; adminEmail: string; action: string; targetId: string; targetName: string; targetType: string }) {
    if (!adminId) { console.warn("[AuditLog] No adminId — skipping log"); return; }
    try {
        await addDoc(collection(db, "audit_logs"), {
            companyId,
            adminId,
            adminEmail,
            action,
            targetId,
            targetName,
            targetType,
            timestamp: serverTimestamp(),
        });
    } catch (err) {
        console.error("[AuditLog] Failed to write audit entry:", err);
    }
}

/* ── Icons ──────────────────────────────────────────────────────── */
const IconEdit = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);
const IconTrash = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

/* ── Spinner ────────────────────────────────────────────────────── */
function Spinner() {
    return (
        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    );
}

/* ── Status badge ───────────────────────────────────────────────── */
function StatusBadge({ status, onClick }: { status: string; onClick: () => void }) {
    const isActive = status === "Active";
    return (
        <button
            onClick={onClick}
            title="Click to toggle status"
            className="status-badge"
            style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "4px 10px", borderRadius: "9999px", fontSize: "12px",
                fontWeight: 500, cursor: "pointer", border: "none",
                transition: "all 0.2s ease",
                backgroundColor: isActive ? "#D1FAE5" : "#FEE2E2",
                color: isActive ? "#065F46" : "#991B1B",
            }}
        >
            <span style={{
                width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0, display: "inline-block",
                backgroundColor: isActive ? "#10B981" : "#EF4444",
            }} />
            {status || "Active"}
        </button>
    );
}

/* ── Page ───────────────────────────────────────────────────────── */
export default function EmployeesPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: "", email: "", role: "Sales" });
    const [isSaving, setIsSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [adminId, setAdminId] = useState("");
    const [adminEmail, setAdminEmail] = useState("");

    useEffect(() => { setMounted(true); }, []);

    // 🔥 Get companyId
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) return;
            setAdminId(user.uid);
            setAdminEmail(user.email || "");
            const userSnap = await getDoc(doc(db, "users", user.uid));
            if (userSnap.exists()) setCompanyId(userSnap.data().companyId);
        });
        return () => unsubscribe();
    }, []);

    // 🔥 Real-time listener
    useEffect(() => {
        if (!companyId) return;
        const q = query(collection(db, "employees"), where("companyId", "==", companyId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setEmployees(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }, [companyId]);

    // 🔥 Search + Filter + Pagination
    const PAGE_SIZE = 10;
    const [page, setPage] = useState(1);

    const filteredEmployees = useMemo(() => {
        return employees.filter((emp) => {
            const name = (emp.name || "").toString().toLowerCase();
            const email = (emp.email || "").toString().toLowerCase();
            const status = emp.status || "Active";
            const search = searchTerm.trim().toLowerCase();
            const matchesSearch = search === "" || name.includes(search) || email.includes(search);
            const matchesStatus = statusFilter === "All" || status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [employees, searchTerm, statusFilter]);

    // Reset to page 1 whenever filter/search changes
    useEffect(() => { setPage(1); }, [searchTerm, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));
    const paginatedEmployees = filteredEmployees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const startEntry = filteredEmployees.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const endEntry = Math.min(page * PAGE_SIZE, filteredEmployees.length);

    // 🔥 Add / Update
    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!companyId) return;
        setIsSaving(true);
        try {
            if (editingId) {
                await updateDoc(doc(db, "employees", editingId), { ...formData });
                await writeAuditLog({ companyId, adminId, adminEmail, action: "updated", targetId: editingId, targetName: formData.name, targetType: "Employee" });
            } else {
                const newDoc = await addDoc(collection(db, "employees"), {
                    ...formData, companyId, status: "Active", createdAt: serverTimestamp(),
                });
                await writeAuditLog({ companyId, adminId, adminEmail, action: "created", targetId: newDoc.id, targetName: formData.name, targetType: "Employee" });
            }
            setIsOpen(false);
            setFormData({ name: "", email: "", role: "Sales" });
            setEditingId(null);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (emp: any) => {
        setDeleteTarget({ id: emp.id, name: emp.name || "this employee" });
    };

    const confirmDelete = async () => {
        if (!deleteTarget || !companyId) return;
        setIsDeleting(true);
        try {
            await writeAuditLog({ companyId, adminId, adminEmail, action: "deleted", targetId: deleteTarget.id, targetName: deleteTarget.name, targetType: "Employee" });
            await deleteDoc(doc(db, "employees", deleteTarget.id));
            setDeleteTarget(null);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEdit = (emp: any) => {
        setFormData({ name: emp.name, email: emp.email, role: emp.role });
        setEditingId(emp.id);
        setIsOpen(true);
    };

    const toggleStatus = async (emp: any) => {
        if (!companyId) return;
        await updateDoc(doc(db, "employees", emp.id), {
            status: emp.status === "Active" ? "Inactive" : "Active",
        });
        await writeAuditLog({
            companyId, adminId, adminEmail, action: "status_changed",
            targetId: emp.id, targetName: emp.name || "", targetType: "Employee"
        });
    };

    const isLoading = !companyId && employees.length === 0;

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "10px 14px", border: "1px solid var(--border)",
        borderRadius: "10px", fontSize: "13.5px", outline: "none",
        backgroundColor: "#F8FAFC", color: "var(--foreground)",
        transition: "all 0.15s ease", boxSizing: "border-box",
    };

    /* ── Modal JSX ─────────────────────────────────────────────── */
    const modalJsx = (
        <div
            style={{
                position: "fixed", top: 0, left: 0,
                width: "100vw", height: "100vh",
                backgroundColor: "rgba(15,23,42,0.55)",
                backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 9999, padding: "16px", boxSizing: "border-box",
            }}
            className="animate-fade-in"
            onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
            <div
                className="animate-scale-in"
                style={{
                    backgroundColor: "var(--card)", borderRadius: "18px",
                    width: "100%", maxWidth: "440px",
                    boxShadow: "0 25px 60px rgba(15,23,42,0.25), 0 0 0 1px var(--border)",
                    padding: "28px",
                }}
            >
                {/* Header */}
                <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--foreground)", margin: 0, letterSpacing: "-0.01em" }}>
                            {editingId ? "Edit Employee" : "Add New Employee"}
                        </h3>
                        <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>
                            {editingId ? "Update employee details below." : "Fill in the details to add a new employee."}
                        </p>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="modal-close"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", transition: "all 0.12s ease" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--foreground)", marginBottom: "6px" }}>Full Name</label>
                        <input type="text" placeholder="e.g. Jane Doe" value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="form-input" style={inputStyle} required />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--foreground)", marginBottom: "6px" }}>Email Address</label>
                        <input type="email" placeholder="jane@example.com" value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="form-input" style={inputStyle} required />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--foreground)", marginBottom: "6px" }}>Role</label>
                        <select value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="form-input"
                            style={{
                                ...inputStyle, cursor: "pointer",
                                appearance: "none",
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                                backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px",
                            }}>
                            <option>Sales</option>
                            <option>Technician</option>
                            <option>Supervisor</option>
                        </select>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "8px" }}>
                        <button type="button" onClick={() => setIsOpen(false)} className="cancel-btn"
                            style={{ padding: "10px 18px", borderRadius: "10px", fontSize: "13.5px", fontWeight: 500, color: "var(--muted)", background: "none", border: "1px solid var(--border)", cursor: "pointer", transition: "all 0.12s ease" }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={isSaving} className="submit-btn"
                            style={{
                                padding: "10px 22px", borderRadius: "10px", fontSize: "13.5px", fontWeight: 600, color: "#fff",
                                backgroundColor: isSaving ? "#60A5FA" : "var(--primary)", border: "none",
                                cursor: isSaving ? "not-allowed" : "pointer",
                                boxShadow: isSaving ? "none" : "0 1px 3px rgba(37,99,235,0.35), 0 4px 12px rgba(37,99,235,0.2)",
                                transition: "all 0.15s ease", display: "flex", alignItems: "center", gap: "8px", minWidth: "100px", justifyContent: "center",
                            }}>
                            {isSaving ? (<><Spinner />Saving...</>) : (editingId ? "Update" : "Save Employee")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ maxWidth: "1200px", margin: "0 auto" }}>

            {/* ── Header ─────────────────────────────────────────── */}
            <div style={{ marginBottom: "32px" }}>
                <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "6px", letterSpacing: "0.02em" }}>
                    Admin / <span style={{ color: "var(--foreground)" }}>Employees</span>
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                    <div>
                        <h2 style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--foreground)", margin: 0, lineHeight: 1.2 }}>
                            Employees
                        </h2>
                        <p style={{ fontSize: "13.5px", color: "var(--muted)", marginTop: "4px" }}>
                            Manage your workforce and team members
                        </p>
                    </div>
                    <button
                        onClick={() => { setEditingId(null); setFormData({ name: "", email: "", role: "Sales" }); setIsOpen(true); }}
                        className="add-btn"
                        style={{
                            display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px",
                            borderRadius: "10px", backgroundColor: "var(--primary)", color: "#fff",
                            fontSize: "13.5px", fontWeight: 600, border: "none", cursor: "pointer",
                            boxShadow: "0 1px 3px rgba(37,99,235,0.35), 0 4px 12px rgba(37,99,235,0.2)",
                            transition: "all 0.15s ease", whiteSpace: "nowrap", flexShrink: 0,
                        }}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Employee
                    </button>
                </div>
            </div>

            {/* ── Loading skeleton ────────────────────────────────── */}
            {isLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", gap: "12px" }}>
                        <div className="skeleton" style={{ height: "42px", flex: "1", maxWidth: "400px" }} />
                        <div className="skeleton" style={{ height: "42px", width: "140px" }} />
                    </div>
                    <div style={{ backgroundColor: "var(--card)", borderRadius: "14px", border: "1px solid var(--border)", overflow: "hidden" }}>
                        <div className="skeleton" style={{ height: "48px", borderRadius: 0, borderBottom: "1px solid var(--border)" }} />
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} style={{ height: "60px", borderBottom: i < 5 ? "1px solid var(--border)" : "none", padding: "0 24px", display: "flex", alignItems: "center", gap: "24px" }}>
                                <div className="skeleton" style={{ height: "14px", width: "120px" }} />
                                <div className="skeleton" style={{ height: "14px", width: "80px" }} />
                                <div className="skeleton" style={{ height: "14px", width: "160px" }} />
                                <div className="skeleton" style={{ height: "22px", width: "64px", marginLeft: "auto" }} />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in">
                    {/* ── Search + Filter ─────────────────────────── */}
                    <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
                        <div style={{ position: "relative", flex: "1", minWidth: "200px", maxWidth: "400px" }}>
                            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </span>
                            <input type="text" placeholder="Search by name or email…" value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input" style={{ ...inputStyle, paddingLeft: "38px" }} />
                        </div>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            className="filter-select"
                            style={{
                                ...inputStyle, width: "auto", minWidth: "148px", cursor: "pointer",
                                appearance: "none",
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                                backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px",
                            }}>
                            <option value="All">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>

                    {/* ── Table ───────────────────────────────────── */}
                    <div style={{ backgroundColor: "var(--card)", borderRadius: "14px", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "0 1px 3px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.04)" }}>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid var(--border)" }}>
                                        {["Name", "Role", "Email", "Status", "Actions"].map((col, i) => (
                                            <th key={col} style={{ padding: "13px 20px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--muted)", textAlign: i === 3 ? "center" : i === 4 ? "right" : "left", whiteSpace: "nowrap" }}>
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedEmployees.map((emp, idx) => (
                                        <tr key={emp.id} className="table-row"
                                            style={{ borderBottom: idx < paginatedEmployees.length - 1 ? "1px solid var(--border)" : "none", backgroundColor: idx % 2 === 0 ? "var(--card)" : "rgba(248,250,252,0.6)", transition: "background-color 0.12s ease" }}>
                                            <td style={{ padding: "16px 20px", fontSize: "13.5px", fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap" }}>{emp.name}</td>
                                            <td style={{ padding: "16px 20px", fontSize: "13.5px", color: "var(--muted)", whiteSpace: "nowrap" }}>{emp.role}</td>
                                            <td style={{ padding: "16px 20px", fontSize: "13.5px", color: "var(--muted)" }}>{emp.email}</td>
                                            <td style={{ padding: "16px 20px", textAlign: "center" }}>
                                                <StatusBadge status={emp.status || "Active"} onClick={() => toggleStatus(emp)} />
                                            </td>
                                            <td style={{ padding: "16px 20px", textAlign: "right", whiteSpace: "nowrap" }}>
                                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                                    <button onClick={() => handleEdit(emp)} className="action-btn hover-blue" title="Edit Employee">
                                                        <IconEdit size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(emp)} className="action-btn hover-red" title="Delete Employee">
                                                        <IconTrash size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredEmployees.length === 0 && (
                                        <tr>
                                            <td colSpan={5} style={{ padding: "56px 24px", textAlign: "center", color: "var(--muted)" }}>
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
                                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                    </svg>
                                                    <p style={{ fontSize: "14px" }}>No matching employees found.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Pagination footer ──────────────────── */}
                        {filteredEmployees.length > 0 && (
                            <div style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "14px 20px", borderTop: "1px solid var(--border)",
                                backgroundColor: "#F8FAFC",
                            }}>
                                <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
                                    Showing <strong style={{ color: "var(--foreground)" }}>{startEntry}–{endEntry}</strong> of <strong style={{ color: "var(--foreground)" }}>{filteredEmployees.length}</strong> employees
                                </p>
                                <div style={{ display: "flex", gap: "6px" }}>
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                        className="page-btn"
                                        style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, border: "1px solid var(--border)", backgroundColor: "var(--card)", color: page === 1 ? "var(--muted)" : "var(--foreground)", cursor: page === 1 ? "default" : "pointer", transition: "all 0.12s ease", opacity: page === 1 ? 0.45 : 1 }}>
                                        ← Prev
                                    </button>
                                    <span style={{ padding: "6px 12px", fontSize: "13px", fontWeight: 500, color: "var(--foreground)", display: "flex", alignItems: "center" }}>
                                        {page} / {totalPages}
                                    </span>
                                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                        className="page-btn"
                                        style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, border: "1px solid var(--border)", backgroundColor: "var(--card)", color: page === totalPages ? "var(--muted)" : "var(--foreground)", cursor: page === totalPages ? "default" : "pointer", transition: "all 0.12s ease", opacity: page === totalPages ? 0.45 : 1 }}>
                                        Next →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Micro-interaction styles ─────────────────────────── */}
            <style>{`
                .add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(37,99,235,0.35) !important; }
                .add-btn:active { transform: scale(0.97); }
                .search-input:focus { outline: none; border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
                .filter-select:focus { outline: none; border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
                .table-row:hover { background-color: #EFF6FF !important; }
                .status-badge:hover { transform: scale(1.04); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
                .status-badge:active { transform: scale(0.97); }
                .action-btn { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 8px; transition: all 0.15s ease; color: var(--muted); display: inline-flex; }
                .hover-blue:hover { color: #2563EB; background-color: rgba(37,99,235,0.1); }
                .hover-red:hover { color: #DC2626; background-color: rgba(220,38,38,0.1); }
                .form-input:focus { outline: none; border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); background-color: #fff !important; }
                .cancel-btn:hover { background-color: #F1F5F9 !important; color: var(--foreground) !important; }
                .submit-btn:not(:disabled):hover { transform: translateY(-1px); }
                .submit-btn:not(:disabled):active { transform: scale(0.97); }
                .modal-close:hover { background-color: #F1F5F9; color: var(--foreground) !important; }
                .delete-confirm-btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(239,68,68,0.4) !important; }
                .delete-confirm-btn:not(:disabled):active { transform: scale(0.97); }
                @media (prefers-color-scheme: dark) {
                  .table-row:hover { background-color: rgba(37,99,235,0.07) !important; }
                  .cancel-btn:hover { background-color: rgba(255,255,255,0.05) !important; }
                  .modal-close:hover { background-color: rgba(255,255,255,0.06) !important; }
                  .form-input:focus { background-color: #0F172A !important; }
                }
            `}</style>

            {/* ── Modal – portalled so overlay covers full page ───── */}
            {isOpen && mounted && createPortal(modalJsx, document.body)}

            {/* ── Delete Confirmation Modal ─────────────────────────── */}
            {deleteTarget && mounted && createPortal(
                <div
                    style={{
                        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                        backgroundColor: "rgba(15,23,42,0.55)",
                        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 9999, padding: "16px", boxSizing: "border-box",
                    }}
                    className="animate-fade-in"
                    onClick={(e) => e.target === e.currentTarget && !isDeleting && setDeleteTarget(null)}
                >
                    <div
                        className="animate-scale-in"
                        style={{
                            backgroundColor: "var(--card)", borderRadius: "18px",
                            width: "100%", maxWidth: "400px",
                            boxShadow: "0 25px 60px rgba(15,23,42,0.25), 0 0 0 1px var(--border)",
                            padding: "28px",
                        }}
                    >
                        {/* Icon */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                            <div style={{
                                width: "48px", height: "48px", borderRadius: "12px",
                                backgroundColor: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center"
                            }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                    <path d="M10 11v6" /><path d="M14 11v6" />
                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                </svg>
                            </div>
                        </div>

                        {/* Text */}
                        <div style={{ textAlign: "center", marginBottom: "24px" }}>
                            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--foreground)", margin: "0 0 8px", letterSpacing: "-0.01em" }}>
                                Delete Employee?
                            </h3>
                            <p style={{ fontSize: "13.5px", color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
                                <strong style={{ color: "var(--foreground)" }}>{deleteTarget.name}</strong> will be permanently removed.
                                This action cannot be undone.
                            </p>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={isDeleting}
                                className="cancel-btn"
                                style={{
                                    flex: 1, padding: "10px 18px", borderRadius: "10px",
                                    fontSize: "13.5px", fontWeight: 500, color: "var(--muted)",
                                    background: "none", border: "1px solid var(--border)",
                                    cursor: isDeleting ? "not-allowed" : "pointer",
                                    transition: "all 0.12s ease",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="delete-confirm-btn"
                                style={{
                                    flex: 1, padding: "10px 18px", borderRadius: "10px",
                                    fontSize: "13.5px", fontWeight: 600, color: "#fff",
                                    backgroundColor: isDeleting ? "#FCA5A5" : "#EF4444",
                                    border: "none",
                                    cursor: isDeleting ? "not-allowed" : "pointer",
                                    boxShadow: isDeleting ? "none" : "0 1px 3px rgba(239,68,68,0.35), 0 4px 12px rgba(239,68,68,0.2)",
                                    transition: "all 0.15s ease",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                }}
                            >
                                {isDeleting ? (<><Spinner />Deleting...</>) : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
                , document.body)}
        </div>
    );
}
