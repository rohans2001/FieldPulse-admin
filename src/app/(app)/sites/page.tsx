"use client";

import { useState, useEffect } from "react";
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    getDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

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

/* ── Icons ──────────────────────────────────────────── */
const IconPlus = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);
const IconSearch = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);
const IconMapPin = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);
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
const IconX = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const IconLocate = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <circle cx="12" cy="12" r="7" />
    </svg>
);

function Spinner({ color = "currentColor" }) {
    return (
        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="4" opacity="0.25" />
            <path fill={color} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75" />
        </svg>
    );
}

/* ── Types ────────────────────────────────────────────── */
interface Site {
    id: string;
    companyId: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    radius: number;
    status: "Active" | "Inactive";
    createdAt?: any;
    createdBy: string;
}

export default function SitesPage() {
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [adminEmail, setAdminEmail] = useState("");
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);

    // Tools
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Inactive">("All");

    // Auth & Init
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                setAdminEmail(user.email || "");
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setCompanyId(userSnap.data().companyId);
                }
            } else {
                setUserId(null);
                setAdminEmail("");
                setCompanyId(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Real-time synchronization
    useEffect(() => {
        if (!companyId) return;

        const q = query(collection(db, "sites"), where("companyId", "==", companyId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedSites: Site[] = [];
            snapshot.forEach((docSnap) => {
                fetchedSites.push({ id: docSnap.id, ...docSnap.data() } as Site);
            });

            // Client-side sort by newest
            fetchedSites.sort((a, b) => {
                const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return timeB - timeA;
            });

            setSites(fetchedSites);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching sites:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [companyId]);

    // Derived state
    const filteredSites = sites.filter(site => {
        const matchesSearch = site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            site.address.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === "All" || site.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSite, setEditingSite] = useState<Site | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [latitude, setLatitude] = useState<string>("");
    const [longitude, setLongitude] = useState<string>("");
    const [radius, setRadius] = useState<string>("");
    const [status, setStatus] = useState<"Active" | "Inactive">("Active");
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setIsFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(position.coords.latitude.toFixed(6));
                setLongitude(position.coords.longitude.toFixed(6));
                setIsFetchingLocation(false);
            },
            (error) => {
                console.error("Error getting location:", error);
                alert("Unable to retrieve your location. Please check your browser permissions.");
                setIsFetchingLocation(false);
            }
        );
    };

    const openAddModal = () => {
        setEditingSite(null);
        setName("");
        setAddress("");
        setLatitude("");
        setLongitude("");
        setRadius("100");
        setStatus("Active");
        setIsModalOpen(true);
    };

    const openEditModal = (site: Site) => {
        setEditingSite(site);
        setName(site.name);
        setAddress(site.address);
        setLatitude(site.latitude.toString());
        setLongitude(site.longitude.toString());
        setRadius(site.radius.toString());
        setStatus(site.status);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        if (!isSaving) setIsModalOpen(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyId || !userId) return;

        setIsSaving(true);

        try {
            const siteData = {
                companyId,
                name,
                address,
                latitude: parseFloat(latitude) || 0,
                longitude: parseFloat(longitude) || 0,
                radius: parseInt(radius, 10) || 100,
                status
            };

            if (editingSite) {
                const siteRef = doc(db, "sites", editingSite.id);
                await updateDoc(siteRef, siteData);
                await writeAuditLog({ companyId, adminId: userId, adminEmail, action: "updated", targetId: editingSite.id, targetName: name, targetType: "Site" });
            } else {
                const newDoc = await addDoc(collection(db, "sites"), {
                    ...siteData,
                    createdAt: serverTimestamp(),
                    createdBy: userId
                });
                await writeAuditLog({ companyId, adminId: userId, adminEmail, action: "created", targetId: newDoc.id, targetName: name, targetType: "Site" });
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving site:", error);
            alert("Failed to save site. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    // Delete State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const confirmDelete = (site: Site) => {
        setSiteToDelete(site);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!siteToDelete || !companyId || !userId) return;
        setIsDeleting(true);
        try {
            await writeAuditLog({ companyId, adminId: userId, adminEmail, action: "deleted", targetId: siteToDelete.id, targetName: siteToDelete.name, targetType: "Site" });
            await deleteDoc(doc(db, "sites", siteToDelete.id));
            setIsDeleteModalOpen(false);
            setSiteToDelete(null);
        } catch (error) {
            console.error("Error deleting site:", error);
            alert("Failed to delete site.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Quick Status Toggle
    const toggleStatus = async (site: Site) => {
        if (!companyId || !userId) return;
        try {
            const newStatus = site.status === "Active" ? "Inactive" : "Active";
            await updateDoc(doc(db, "sites", site.id), { status: newStatus });
            await writeAuditLog({ companyId, adminId: userId, adminEmail, action: "status_changed", targetId: site.id, targetName: site.name, targetType: "Site" });
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: "1200px", margin: "0 auto", color: "var(--foreground)" }}>

            {/* ── Page Header ─────────────────────────────────────── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", gap: "16px", flexWrap: "wrap" }}>
                <div>
                    <h2 style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--foreground)", margin: 0 }}>
                        Sites & Locations
                    </h2>
                    <p style={{ fontSize: "14px", color: "var(--muted)", margin: "4px 0 0" }}>
                        Manage geo-fenced boundaries for employee check-ins.
                    </p>
                </div>

                <button
                    onClick={openAddModal}
                    className="add-btn"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 18px",
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#fff",
                        backgroundColor: "#2563EB",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 1px 3px rgba(37,99,235,0.3)",
                        transition: "all 0.15s ease",
                    }}
                >
                    <IconPlus size={16} /> Add Site
                </button>
            </div>

            {/* ── Search & Filter ─────────────────────────────────── */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
                    <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}>
                        <IconSearch size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search sites by name or address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "10px 14px 10px 38px",
                            border: "1px solid var(--border)",
                            borderRadius: "10px",
                            fontSize: "14px",
                            outline: "none",
                            backgroundColor: "var(--card)",
                            color: "var(--foreground)",
                            boxSizing: "border-box",
                        }}
                        className="search-input"
                    />
                </div>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    style={{
                        padding: "10px 14px",
                        border: "1px solid var(--border)",
                        borderRadius: "10px",
                        fontSize: "14px",
                        outline: "none",
                        backgroundColor: "var(--card)",
                        color: "var(--foreground)",
                        minWidth: "150px",
                        cursor: "pointer",
                    }}
                    className="search-input"
                >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>

            {/* ── Sites Table ─────────────────────────────────────── */}
            <div
                style={{
                    backgroundColor: "var(--card)",
                    borderRadius: "14px",
                    border: "1px solid var(--border)",
                    overflow: "hidden",
                    boxShadow: "0 1px 3px rgba(15,23,42,0.04)"
                }}
            >
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
                        <thead>
                            <tr style={{ backgroundColor: "rgba(0,0,0,0.02)", borderBottom: "1px solid var(--border)" }}>
                                <th style={{ padding: "16px 20px", fontWeight: 600, color: "var(--muted)" }}>Site Name</th>
                                <th style={{ padding: "16px 20px", fontWeight: 600, color: "var(--muted)" }}>Address</th>
                                <th style={{ padding: "16px 20px", fontWeight: 600, color: "var(--muted)" }}>Radius</th>
                                <th style={{ padding: "16px 20px", fontWeight: 600, color: "var(--muted)" }}>Status</th>
                                <th style={{ padding: "16px 20px", fontWeight: 600, color: "var(--muted)", textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                                        <td style={{ padding: "16px 20px" }}><div className="skeleton" style={{ height: "16px", width: "120px" }} /></td>
                                        <td style={{ padding: "16px 20px" }}><div className="skeleton" style={{ height: "16px", width: "200px" }} /></td>
                                        <td style={{ padding: "16px 20px" }}><div className="skeleton" style={{ height: "16px", width: "60px" }} /></td>
                                        <td style={{ padding: "16px 20px" }}><div className="skeleton" style={{ height: "24px", width: "70px", borderRadius: "12px" }} /></td>
                                        <td style={{ padding: "16px 20px" }}><div className="skeleton" style={{ height: "16px", width: "60px", marginLeft: "auto" }} /></td>
                                    </tr>
                                ))
                            ) : filteredSites.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: "50px 20px", textAlign: "center", color: "var(--muted)" }}>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                                            <IconMapPin size={32} />
                                            <p style={{ margin: 0, fontSize: "15px", fontWeight: 500, color: "var(--foreground)" }}>No sites found</p>
                                            <p style={{ margin: 0, fontSize: "14px" }}>
                                                {searchQuery ? "Try adjusting your search criteria" : "Add your first geo-fenced site to get started"}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredSites.map((site) => (
                                    <tr key={site.id} className="table-row" style={{ borderBottom: "1px solid var(--border)", transition: "background-color 0.15s" }}>
                                        <td style={{ padding: "16px 20px", fontWeight: 600, color: "var(--foreground)" }}>
                                            {site.name}
                                        </td>
                                        <td style={{ padding: "16px 20px", color: "var(--muted)" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <IconMapPin size={14} />
                                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "250px" }}>
                                                    {site.address}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "16px 20px" }}>
                                            <span style={{ color: "var(--muted)", fontWeight: 500 }}>{site.radius}m</span>
                                        </td>
                                        <td style={{ padding: "16px 20px" }}>
                                            <span
                                                onClick={() => toggleStatus(site)}
                                                className="status-badge"
                                                title="Click to toggle status"
                                                style={{
                                                    display: "inline-block",
                                                    padding: "4px 10px",
                                                    borderRadius: "12px",
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                    backgroundColor: site.status === "Active" ? "rgba(16,185,129,0.12)" : "rgba(220,38,38,0.12)",
                                                    color: site.status === "Active" ? "#059669" : "#DC2626",
                                                    transition: "opacity 0.2s"
                                                }}
                                            >
                                                {site.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: "16px 20px", textAlign: "right" }}>
                                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                                <button onClick={() => openEditModal(site)} className="action-btn hover-blue" title="Edit Site">
                                                    <IconEdit size={16} />
                                                </button>
                                                <button onClick={() => confirmDelete(site)} className="action-btn hover-red" title="Delete Site">
                                                    <IconTrash size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Add / Edit Modal ─────────────────────────────────── */}
            {isModalOpen && (
                <div
                    className="modal-backdrop"
                    style={{
                        position: "fixed", inset: 0, zIndex: 100,
                        backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "20px"
                    }}
                    onClick={closeModal}
                >
                    <div
                        className="modal-content"
                        style={{
                            width: "100%", maxWidth: "500px",
                            backgroundColor: "var(--card)", borderRadius: "16px",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                            display: "flex", flexDirection: "column",
                            overflow: "hidden"
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--foreground)" }}>
                                {editingSite ? "Edit Site" : "Add New Site"}
                            </h3>
                            <button onClick={closeModal} className="action-btn hover-red" style={{ margin: "-8px", padding: "8px" }}>
                                <IconX size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSave} style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>

                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--foreground)", marginBottom: "6px" }}>Site Name</label>
                                <input
                                    type="text" required value={name} onChange={e => setName(e.target.value)}
                                    className="form-input" placeholder="e.g. Downtown HQ"
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--foreground)", marginBottom: "6px" }}>Street Address</label>
                                <input
                                    type="text" required value={address} onChange={e => setAddress(e.target.value)}
                                    className="form-input" placeholder="123 Corporate Blvd"
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--foreground)", marginBottom: "6px" }}>Latitude</label>
                                    <input
                                        type="number" step="any" required value={latitude} onChange={e => setLatitude(e.target.value)}
                                        className="form-input" placeholder="e.g. 40.7128"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--foreground)", marginBottom: "6px" }}>Longitude</label>
                                    <input
                                        type="number" step="any" required value={longitude} onChange={e => setLongitude(e.target.value)}
                                        className="form-input" placeholder="e.g. -74.0060"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGetLocation}
                                disabled={isFetchingLocation}
                                className="action-btn hover-blue"
                                style={{
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                    width: "100%", padding: "10px", borderRadius: "8px",
                                    border: "1px dashed #2563EB", color: "#2563EB",
                                    fontSize: "13px", fontWeight: 600, backgroundColor: "rgba(37,99,235,0.05)"
                                }}
                            >
                                {isFetchingLocation ? (
                                    <><Spinner color="#2563EB" /> Fetching location...</>
                                ) : (
                                    <><IconLocate size={16} /> Get Current Location</>
                                )}
                            </button>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--foreground)", marginBottom: "6px" }}>Radius (meters)</label>
                                    <input
                                        type="number" min="10" required value={radius} onChange={e => setRadius(e.target.value)}
                                        className="form-input"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--foreground)", marginBottom: "6px" }}>Status</label>
                                    <select
                                        value={status} onChange={e => setStatus(e.target.value as any)}
                                        className="form-input cursor-pointer"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{ padding: "24px 0 0", marginTop: "8px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                                <button type="button" onClick={closeModal} className="btn-cancel" disabled={isSaving}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit" disabled={isSaving}>
                                    {isSaving ? <><Spinner color="#fff" /> Saving...</> : "Save Site"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ───────────────────────── */}
            {isDeleteModalOpen && siteToDelete && (
                <div
                    className="modal-backdrop"
                    style={{
                        position: "fixed", inset: 0, zIndex: 110,
                        backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "20px"
                    }}
                    onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
                >
                    <div
                        className="modal-content"
                        style={{
                            width: "100%", maxWidth: "400px",
                            backgroundColor: "var(--card)", borderRadius: "16px",
                            padding: "24px", textAlign: "center",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ width: "48px", height: "48px", borderRadius: "24px", backgroundColor: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#DC2626" }}>
                            <IconTrash size={24} />
                        </div>
                        <h3 style={{ margin: "0 0 10px", fontSize: "18px", fontWeight: 700, color: "var(--foreground)" }}>Delete Site</h3>
                        <p style={{ margin: "0 0 24px", fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}>
                            Are you sure you want to delete <strong>{siteToDelete.name}</strong>? This action cannot be undone.
                        </p>

                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button onClick={() => setIsDeleteModalOpen(false)} className="btn-cancel" style={{ flex: 1 }} disabled={isDeleting}>
                                Cancel
                            </button>
                            <button onClick={executeDelete} className="btn-danger" style={{ flex: 1 }} disabled={isDeleting}>
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Scoped CSS Styles ───────────────────────────────── */}
            <style>{`
                .add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.25) !important; }
                .add-btn:active { transform: scale(0.98); }
                .search-input:hover { border-color: #94A3B8; }
                .search-input:focus { border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.12) !important; }
                .table-row:hover { background-color: rgba(37,99,235,0.02) !important; }
                .status-badge:hover { opacity: 0.8; transform: scale(0.98); }
                
                .action-btn { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 8px; transition: all 0.15s ease; color: var(--muted); display: inline-flex; }
                .hover-blue:hover { color: #2563EB; background-color: rgba(37,99,235,0.1); }
                .hover-red:hover { color: #DC2626; background-color: rgba(220,38,38,0.1); }
                
                .form-input { 
                    width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: 8px; 
                    font-size: 14px; outline: none; background-color: #F8FAFC; color: var(--foreground); 
                    transition: all 0.15s ease; box-sizing: border-box; font-family: inherit;
                }
                .form-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); background-color: #fff; }
                .cursor-pointer { cursor: pointer; }
                
                .btn-cancel {
                    padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600;
                    color: var(--muted); background: transparent; border: 1px solid var(--border);
                    cursor: pointer; transition: all 0.15s ease; font-family: inherit;
                }
                .btn-cancel:hover:not(:disabled) { background: rgba(0,0,0,0.03); color: var(--foreground); }
                
                .btn-submit {
                    padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600;
                    color: #fff; background: #2563EB; border: none; cursor: pointer; 
                    transition: all 0.15s ease; font-family: inherit; display: flex; align-items: center; gap: 8px;
                }
                .btn-submit:hover:not(:disabled) { background: #1D4ED8; box-shadow: 0 4px 12px rgba(37,99,235,0.2); }
                .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
                
                .btn-danger {
                    padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600;
                    color: #fff; background: #DC2626; border: none; cursor: pointer; 
                    transition: all 0.15s ease; font-family: inherit;
                }
                .btn-danger:hover:not(:disabled) { background: #B91C1C; box-shadow: 0 4px 12px rgba(220,38,38,0.2); }

                .modal-backdrop { animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .modal-content { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
                
                @media (prefers-color-scheme: dark) {
                    .form-input { background-color: rgba(0,0,0,0.2) !important; border-color: var(--border) !important; }
                    .form-input:focus { background-color: var(--card) !important; border-color: #2563EB !important; }
                    .btn-cancel:hover:not(:disabled) { background: rgba(255,255,255,0.05); }
                    .table-row:hover { background-color: rgba(255,255,255,0.02) !important; }
                }
            `}</style>
        </div>
    );
}
