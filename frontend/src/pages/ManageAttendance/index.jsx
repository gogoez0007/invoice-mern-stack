// src/pages/AttendanceFix.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Badge, Button, Card, DatePicker, Divider, message, Popconfirm, Row, Col,
    Select, Space, Spin, Statistic, Table, Tag, Typography, Tooltip
} from "antd";
import {
    CalendarOutlined, ClearOutlined, DeleteOutlined, ReloadOutlined, UserOutlined
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { API_BASE_URL } from "@/config/serverApiConfig";
import storePersist from "@/redux/storePersist";

dayjs.extend(relativeTime);
const { Title, Text } = Typography;

function includeToken() {
    axios.defaults.baseURL = API_BASE_URL;
    axios.defaults.withCredentials = true;
    const auth = storePersist.get("auth");
    if (auth?.current?.token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${auth.current.token}`;
    } else {
        delete axios.defaults.headers.common["Authorization"];
    }
}

const PAGE_SIZE = 10;

// =============================
// Reverse Geocode (Frontend) — async & non-blocking
// =============================
const MAX_CONCURRENT = 2;
const REQUEST_GAP_MS = 300;
const makeCoordKey = (lat, lon) => `${lat},${lon}`;

async function fetchNominatimName(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1&accept-language=id`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("reverse geocode failed");
    const data = await res.json();
    const name =
        data?.display_name ||
        data?.name ||
        [
            data?.address?.amenity,
            data?.address?.road,
            data?.address?.neighbourhood || data?.address?.village || data?.address?.town || data?.address?.city,
        ].filter(Boolean).join(", ");
    return name || "Lokasi tidak diketahui";
}

export default function AttendanceFix() {
    // ===== filters =====
    const [userId, setUserId] = useState(null);
    const [monthVal, setMonthVal] = useState(dayjs()); // bulan ini

    // ===== employees select (only fetch when typing) =====
    const [empOpen, setEmpOpen] = useState(false);
    const [empOptions, setEmpOptions] = useState([]);
    const [empLoading, setEmpLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [hasMore, setHasMore] = useState(false);
    const pageRef = useRef(0);
    const totalRef = useRef(0);
    const debounceRef = useRef(null);

    // ===== attendance =====
    const [rows, setRows] = useState([]);
    const [summary, setSummary] = useState({ late_count: 0 });
    const [attLoading, setAttLoading] = useState(false);
    const [busy, setBusy] = useState(false);

    // ===== place names (frontend reverse geocoding) =====
    const [placeNames, setPlaceNames] = useState({});  // placeNames[rowId] = { in, out }
    const placeCacheRef = useRef(new Map());
    const queueRef = useRef([]);
    const activeRef = useRef(0);

    const pumpQueue = () => {
        while (activeRef.current < MAX_CONCURRENT && queueRef.current.length > 0) {
            const task = queueRef.current.shift();
            activeRef.current += 1;
            task()
                .catch(() => { })
                .finally(() => {
                    activeRef.current -= 1;
                    setTimeout(pumpQueue, REQUEST_GAP_MS);
                });
        }
    };

    const queueReverseGeocode = (lat, lon) => {
        const key = makeCoordKey(lat, lon);
        const cached = placeCacheRef.current.get(key);
        if (cached) return Promise.resolve(cached);

        return new Promise((resolve) => {
            const run = async () => {
                try {
                    const name = await fetchNominatimName(lat, lon);
                    placeCacheRef.current.set(key, name);
                    resolve(name);
                } catch {
                    const fallback = "Lokasi tidak diketahui";
                    placeCacheRef.current.set(key, fallback);
                    resolve(fallback);
                }
            };
            queueRef.current.push(run);
            pumpQueue();
        });
    };

    // Jadwalkan resolve nama tempat saat rows berubah (non-blocking)
    useEffect(() => {
        setPlaceNames({});
        if (!rows?.length) return;
        rows.forEach((r) => {
            const inLat = parseFloat(r.check_in_latitude);
            const inLon = parseFloat(r.check_in_longitude);
            if (Number.isFinite(inLat) && Number.isFinite(inLon)) {
                queueReverseGeocode(inLat, inLon).then((name) => {
                    setPlaceNames((prev) => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), in: name } }));
                });
            }
            const outLat = parseFloat(r.check_out_latitude);
            const outLon = parseFloat(r.check_out_longitude);
            if (Number.isFinite(outLat) && Number.isFinite(outLon)) {
                queueReverseGeocode(outLat, outLon).then((name) => {
                    setPlaceNames((prev) => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), out: name } }));
                });
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows]);

    // ---------- EMPLOYEES (server search, no initial fetch) ----------
    const fetchEmployees = async ({ page = 1, q = "" }, append = false) => {
        try {
            setEmpLoading(true);
            includeToken();
            const { data } = await axios.get("employees/list", {
                params: { page, items: PAGE_SIZE, q, sortBy: "id", sortValue: "DESC" },
            });
            const list = data?.result || [];
            const total = data?.pagination?.count ?? list.length;
            const opts = list.map((e) => ({
                value: e.id,
                label: e.name || e.full_name || e.nama || `#${e.id}`,
                desc: e.position || e.jabatan || "",
            }));
            setEmpOptions((prev) => (append ? [...prev, ...opts] : opts));
            totalRef.current = total;
            pageRef.current = page;
            setHasMore(page * PAGE_SIZE < total);
        } catch (e) {
            console.error(e);
            message.error("Gagal memuat karyawan");
        } finally {
            setEmpLoading(false);
        }
    };

    const onSearchEmp = (val) => {
        setSearchText(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!val?.trim()) {
            setEmpOptions([]); setHasMore(false); pageRef.current = 0; totalRef.current = 0;
            return;
        }
        debounceRef.current = setTimeout(async () => {
            pageRef.current = 1;
            await fetchEmployees({ page: 1, q: val.trim() }, false);
        }, 500);
    };

    const onPopupScroll = async (e) => {
        if (!hasMore || empLoading || empOptions.length === 0) return;
        const el = e.target;
        const threshold = 40;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
            const next = pageRef.current + 1;
            if (next <= Math.ceil((totalRef.current || 0) / PAGE_SIZE)) {
                await fetchEmployees({ page: next, q: searchText.trim() }, true);
            } else setHasMore(false);
        }
    };

    useEffect(() => () => debounceRef.current && clearTimeout(debounceRef.current), []);

    // ---------- ATTENDANCE (GET attendance/:userId?month=&year=) ----------
    const fetchAttendance = async () => {
        if (!userId || !monthVal) return;
        try {
            setAttLoading(true);
            includeToken();
            const { data } = await axios.get(`attendance/${userId}`, {
                params: { month: monthVal.format("MM"), year: monthVal.format("YYYY") },
            });
            setRows(Array.isArray(data?.attendance) ? data.attendance : []);
            setSummary(data?.summary || { late_count: 0 });
        } catch (e) {
            console.error(e);
            message.error("Gagal memuat attendance");
            setRows([]); setSummary({ late_count: 0 });
        } finally {
            setAttLoading(false);
        }
    };
    useEffect(() => { fetchAttendance(); }, [userId, monthVal]);

    // ---------- ACTIONS (pakai id attendance) ----------
    // Hapus Datang = DELETE /attendance/:id (backup → delete) — ENABLE kalau TIDAK ada checkout
    const deleteDatang = async (record) => {
        setBusy(true);
        try {
            includeToken();
            await axios.delete(`attendance/${record.id}`);
            message.success(`Datang ${record.date} dihapus (backup → delete).`);
            await fetchAttendance(); // refresh
        } catch (e) {
            console.error(e);
            message.error(e?.response?.data?.error || "Gagal menghapus datang");
        } finally {
            setBusy(false);
        }
    };

    // Hapus Pulang = PUT /attendance/:id (NULL check-out)
    const clearPulang = async (record) => {
        setBusy(true);
        try {
            includeToken();
            await axios.put(`attendance/${record.id}`); // body tidak diperlukan
            message.success(`Pulang ${record.date} dihapus (NULL).`);
            await fetchAttendance(); // refresh
        } catch (e) {
            console.error(e);
            message.error(e?.response?.data?.error || "Gagal menghapus pulang");
        } finally {
            setBusy(false);
        }
    };

    // ---------- RENDER helpers (jam + nama tempat di bawahnya; di-resolve async) ----------
    const renderIn = (r) => {
        if (!r.check_in_time) return <Tag>—</Tag>;
        const name = placeNames[r.id]?.in;
        return (
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                <Tag color="green" style={{ alignSelf: "flex-start", marginBottom: 4 }}>
                    {r.check_in_time}
                </Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {name ? name : (Number.isFinite(parseFloat(r.check_in_latitude)) ? "mencari lokasi…" : "—")}
                </Text>
            </div>
        );
    };

    const renderOut = (r) => {
        if (!r.check_out_time) return <Tag>—</Tag>;
        const name = placeNames[r.id]?.out;
        return (
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                <Tag color="volcano" style={{ alignSelf: "flex-start", marginBottom: 4 }}>
                    {r.check_out_time}
                </Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {name ? name : (Number.isFinite(parseFloat(r.check_out_latitude)) ? "mencari lokasi…" : "—")}
                </Text>
            </div>
        );
    };

    // ---------- COLUMNS (kondisi tombol: Hapus Datang disabled jika ADA checkout) ----------
    const columns = useMemo(() => [
        {
            title: "Tanggal",
            dataIndex: "date",
            width: 120,
            render: (v) => <Tag color="geekblue">{dayjs(v).format("YYYY-MM-DD")}</Tag>,
            sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
        },
        { title: "Datang", key: "in", render: (_, r) => renderIn(r) },
        { title: "Pulang", key: "out", render: (_, r) => renderOut(r) },
        {
            title: "Aksi",
            width: 380,
            render: (_, r) => {
                const datangDisabled = !!r.check_out_time || busy; // <-- DISABLE kalau ADA checkout
                const datangBtn = (
                    <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        loading={busy}
                        disabled={datangDisabled}
                    >
                        Hapus Absen Datang
                    </Button>
                );

                return (
                    <Space wrap>
                        {datangDisabled ? (
                            // Tooltip tidak bekerja pada button disabled, jadi bungkus dengan span
                            <Tooltip title={r.check_out_time ? "Tidak bisa hapus datang bila sudah ada pulang" : "Sedang proses"}>
                                <span>{datangBtn}</span>
                            </Tooltip>
                        ) : (
                            <Popconfirm
                                title={`Hapus absen datang ${r.date}? (backup → delete)`}
                                okText="Ya"
                                cancelText="Batal"
                                onConfirm={() => deleteDatang(r)}
                            >
                                {datangBtn}
                            </Popconfirm>
                        )}

                        <Tooltip title={!r.check_out_time ? "Tidak ada data pulang" : "Set NULL check-out"}>
                            <Button
                                size="small"
                                icon={<ClearOutlined />}
                                disabled={!r.check_out_time || busy}
                                loading={busy}
                                onClick={() => clearPulang(r)}
                            >
                                Hapus Absen Pulang
                            </Button>
                        </Tooltip>
                    </Space>
                );
            },
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [busy, placeNames]);

    // ---------- Option renderer ----------
    const empOptionRender = useMemo(
        () => (opt) => (
            <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontWeight: 600 }}>{opt.label}</div>
                {opt.desc ? <small style={{ opacity: 0.7 }}>{opt.desc}</small> : null}
            </div>
        ),
        []
    );

    return (
        <>
            {/* HERO HEADER */}
            <Card
                style={{
                    marginBottom: 16,
                    borderRadius: 16,
                    background:
                        "linear-gradient(135deg, rgba(59,130,246,1) 0%, rgba(16,185,129,1) 50%, rgba(249,115,22,1) 100%)",
                    color: "#fff",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                }}
                bodyStyle={{ padding: 18 }}
            >
                <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <Space>
                        <CalendarOutlined />
                        <Title level={4} style={{ margin: 0, color: "#fff" }}>
                            Attendance Manager — Bulanan
                        </Title>
                    </Space>
                    <Button
                        ghost
                        icon={<ReloadOutlined />}
                        onClick={() => {
                            setUserId(null);
                            setMonthVal(dayjs());
                            setRows([]);
                            setSummary({ late_count: 0 });
                            // reset select state
                            setEmpOptions([]); setSearchText(""); setHasMore(false);
                            pageRef.current = 0; totalRef.current = 0;
                            // reset place cache
                            placeCacheRef.current.clear(); setPlaceNames({});
                        }}
                        style={{ borderColor: "#fff", color: "#fff" }}
                    >
                        Reset
                    </Button>
                </Space>
            </Card>

            {/* FILTER BAR + KPI */}
            <Card style={{ borderRadius: 14, marginBottom: 12 }} className="shadow-sm">
                <Space wrap size={16} align="start">
                    <div>
                        <Text strong style={{ display: "block", marginBottom: 6 }}>
                            <UserOutlined /> Karyawan
                        </Text>
                        <Select
                            showSearch
                            allowClear
                            placeholder="Ketik untuk mencari karyawan…"
                            value={userId}
                            onChange={setUserId}
                            style={{ width: 360 }}
                            filterOption={false}
                            onSearch={onSearchEmp}             // fetch hanya saat ketik
                            onDropdownVisibleChange={(v) => setEmpOpen(v)}
                            open={empOpen}
                            onPopupScroll={onPopupScroll}
                            options={empOptions}
                            loading={empLoading}
                            optionRender={empOptionRender}
                            dropdownStyle={{ borderRadius: 12 }}
                            dropdownRender={(menu) => (
                                <div>
                                    {!empLoading && empOptions.length === 0 && (!searchText || !searchText.trim()) ? (
                                        <div style={{ textAlign: "center", padding: 12, opacity: 0.75 }}>
                                            Ketik nama atau posisi untuk mencari…
                                        </div>
                                    ) : (
                                        <>
                                            {menu}
                                            {empLoading && (
                                                <div style={{ textAlign: "center", padding: 8 }}>
                                                    <Spin size="small" />
                                                </div>
                                            )}
                                            {!empLoading && empOptions.length === 0 && searchText?.trim() && (
                                                <div style={{ textAlign: "center", padding: 12, opacity: 0.75 }}>
                                                    Tidak ada hasil untuk “{searchText}”
                                                </div>
                                            )}
                                            {!empLoading && hasMore && empOptions.length > 0 && (
                                                <div style={{ textAlign: "center", padding: 8, opacity: 0.65 }}>
                                                    Gulir ke bawah untuk memuat lagi…
                                                </div>
                                            )}
                                            {!empLoading && !hasMore && empOptions.length > 0 && (
                                                <div style={{ textAlign: "center", padding: 8, opacity: 0.65 }}>
                                                    — semua data tampil —
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    <div>
                        <Text strong style={{ display: "block", marginBottom: 6 }}>
                            <CalendarOutlined /> Bulan
                        </Text>
                        <DatePicker
                            picker="month"
                            allowClear={false}
                            value={monthVal}
                            onChange={(v) => setMonthVal(v || dayjs())}
                            format="MMMM YYYY"
                            style={{ width: 220 }}
                        />
                    </div>
                </Space>

                <Divider style={{ margin: "12px 0" }} />

                <Row gutter={16}>
                    <Col xs={12} sm={8} md={6} lg={4}>
                        <Card
                            size="small"
                            style={{
                                borderRadius: 12,
                                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                color: "#fff",
                            }}
                            bodyStyle={{ padding: 12 }}
                        >
                            <Statistic
                                title={<span style={{ color: "#eafbe7" }}>Total Hari</span>}
                                value={rows.length}
                                valueStyle={{ color: "#fff" }}
                            />
                        </Card>
                    </Col>
                    <Col xs={12} sm={8} md={6} lg={4}>
                        <Card
                            size="small"
                            style={{
                                borderRadius: 12,
                                background: "linear-gradient(135deg, #f97316, #ea580c)",
                                color: "#fff",
                            }}
                            bodyStyle={{ padding: 12 }}
                        >
                            <Statistic
                                title={<span style={{ color: "#fff7ed" }}>Terlambat</span>}
                                value={summary?.late_count ?? 0}
                                valueStyle={{ color: "#fff" }}
                            />
                        </Card>
                    </Col>
                </Row>
            </Card>

            {/* TABLE */}
            <Card style={{ borderRadius: 14 }} className="shadow-sm">
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={rows}
                    loading={attLoading}
                    pagination={false}
                    size="middle"
                    bordered={false}
                    rowClassName={(_r, i) => (i % 2 === 0 ? "row-alt-even" : "row-alt-odd")}
                    locale={{
                        emptyText: userId ? "Tidak ada data untuk bulan ini" : "Pilih karyawan & bulan terlebih dulu",
                    }}
                />
            </Card>

            {/* styling baris */}
            <style>{`
        .row-alt-even td { background: #fafafa; }
        .row-alt-odd  td { background: #ffffff; }
        .ant-card.shadow-sm { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
      `}</style>
        </>
    );
}
