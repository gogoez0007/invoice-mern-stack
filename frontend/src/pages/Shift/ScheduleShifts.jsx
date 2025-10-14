import React, { useEffect, useMemo, useState } from "react";
import {
    Button, Space, Table, Popconfirm, message, Card, Tag, Typography,
    Select, DatePicker, Tooltip, Divider
} from "antd";
import {
    SaveOutlined, ReloadOutlined, ArrowLeftOutlined, DeleteOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "@/config/serverApiConfig";
import storePersist from "@/redux/storePersist";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

const { Title, Text } = Typography;
const { MonthPicker } = DatePicker;

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

const DOW_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]; // dayjs: 0..6
const isWeekendDow = (dow) => dow === 0 || dow === 6;
const pad2 = (n) => String(n).padStart(2, "0");

// palet warna shift (HSL)
const BASE_PALETTE = [
    { h: 210, s: 85, l: 55 }, // blue
    { h: 265, s: 65, l: 60 }, // purple
    { h: 345, s: 70, l: 60 }, // pink
    { h: 15, s: 85, l: 60 }, // orange
    { h: 160, s: 55, l: 45 }, // teal
    { h: 45, s: 90, l: 55 }, // yellow
    { h: 190, s: 60, l: 45 }, // cyan
    { h: 320, s: 55, l: 50 }, // magenta
];
const hsl = (o) => `hsl(${o.h} ${o.s}% ${o.l}%)`;
const hsla = (o, a) => `hsl(${o.h} ${o.s}% ${o.l}% / ${a})`;

export default function ShiftScheduleMonthlyEditor() {
    const navigate = useNavigate();

    // filter
    const [entitasId, setEntitasId] = useState();
    const [month, setMonth] = useState(dayjs().month() + 1);
    const [year, setYear] = useState(dayjs().year());

    // master entitas
    const [entitasOptions, setEntitasOptions] = useState([]);
    const [entitasMap, setEntitasMap] = useState({});
    const [entitasLoading, setEntitasLoading] = useState(false);

    // master shifts
    const [shifts, setShifts] = useState([]); // [{id, name, start_time, end_time}]
    const [shiftColorMap, setShiftColorMap] = useState({}); // {id: {h,s,l}}

    // data grid
    const [rows, setRows] = useState([]);     // hasil GET monthly
    const [origRows, setOrigRows] = useState([]);
    const [changes, setChanges] = useState({}); // {"userId|YYYY-MM-DD": shift_id}

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const dim = dayjs(`${year}-${pad2(month)}-01`).daysInMonth();

    // ===== styles: diperkecil =====
    const styles = `
    .sched-root { --cellPad: 4px; --radius: 8px; --tiny: 10.5px; --micro: 9.5px; }
    .sched-root .ant-typography, .sched-root .ant-table, .sched-root .ant-select, .sched-root .ant-btn {
      font-size: 11px;
    }
    .sched-toolbar .ant-select-selector { border-radius: 10px !important; }

    .cal-header { display:flex; flex-direction:column; align-items:center; gap:2px; line-height:1; }
    .cal-pill {
      width: 20px; height: 20px; line-height: 20px;
      text-align:center; border-radius: 6px;
      background: #EEF2FF; color: #1D4ED8; font-weight: 700; font-size: 11px;
    }
    .cal-week { font-size: var(--tiny); color:#667085; letter-spacing: .2px; }
    .cal-header-cell { text-align:center; padding: 6px 4px; }

    .sticky-left { position: sticky; left: 0; background: #fff; z-index: 2; }
    /* offset sticky kolom entitas mengikuti lebar kolom Staff = 140px */
    .sticky-left-2 { position: sticky; left: 140px; background: #fff; z-index: 2; }

    .cal-cell {
      padding: var(--cellPad);
      border-radius: var(--radius);
      border: 1px solid #f1f1f1;
      background: #fff;
      transition: box-shadow .15s ease, background .2s ease;
    }
    .cal-cell.weekend { background: #fafafa; }
    .cal-cell:hover { box-shadow: 0 0 0 2px rgba(99,102,241,.10) inset; }

    .pill-source {
      display:inline-block; font-size: var(--micro); padding: 1px 6px; border-radius: 999px;
      background: #f4f4f5; color:#3f3f46; margin-bottom: 3px;
    }
    .pill-default { background: #eef2ff; color:#1e3a8a; }
    .pill-schedule { background: #ecfeff; color:#155e75; }
    .pill-empty { background: #fff7ed; color:#9a3412; }

    .cal-cell .ant-select { width: 100%; }
    /* tinggi select dibuat ~24px */
    .cal-cell .ant-select-single .ant-select-selector {
      border-radius: 8px !important; padding: 0 4px !important; min-height: 24px; height: 24px;
    }
    .cal-cell .ant-select-selection-item { line-height: 24px; }
    .cal-cell .ant-select-arrow { inset-inline-end: 4px; }

    /* Opsi dropdown 2 baris + dot warna & teks kecil */
    .shift-opt { line-height: 1.05; display:flex; align-items:center; gap:6px; }
    .shift-dot { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 8px; }
    .shift-opt .t { font-size: var(--tiny); font-weight: 600; }
    .shift-opt .s { font-size: var(--micro); opacity: 0.8; }

    .staff-cell { line-height: 1.05; max-width: 130px; }
    .staff-name {
      font-weight: 600; font-size: 11px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .staff-pos {
      font-size: var(--micro); color:#6b7280;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .tiny { font-size: var(--tiny); color:#667085; }
    .micro { font-size: var(--micro); color:#6b7280; }
  `;

    // header kolom tanggal
    const dayHeaders = useMemo(() => {
        const arr = [];
        for (let d = 1; d <= dim; d++) {
            const date = dayjs(`${year}-${pad2(month)}-${pad2(d)}`);
            arr.push({
                day: d,
                dateStr: date.format("YYYY-MM-DD"),
                dow: date.day(),
                label: DOW_SHORT[date.day()],
                isWeekend: isWeekendDow(date.day()),
            });
        }
        return arr;
    }, [month, year, dim]);

    // shift by id untuk helper
    const shiftById = useMemo(() => {
        const m = new Map();
        shifts.forEach(s => m.set(s.id, s));
        return m;
    }, [shifts]);

    // opsi dropdown shift (2 baris + dot warna)
    const shiftOptions = useMemo(() => {
        return shifts.map((s, idx) => {
            const time = `${(s.start_time || "").slice(0, 5)}–${(s.end_time || "").slice(0, 5)}`;
            const clr = shiftColorMap[s.id] || BASE_PALETTE[idx % BASE_PALETTE.length];
            return {
                value: s.id,
                rawLabel: s.name,
                rawTime: time,
                color: clr,
                label: (
                    <div className="shift-opt">
                        <span className="shift-dot" style={{ background: hsl(clr) }} />
                        <span>
                            <div className="t">{s.name}</div>
                            <div className="s">{time}</div>
                        </span>
                    </div>
                ),
            };
        });
    }, [shifts, shiftColorMap]);

    const cellKey = (userId, date) => `${userId}|${date}`;

    // ===== loaders =====
    const loadEntitas = async () => {
        try {
            setEntitasLoading(true);
            includeToken();
            const { data } = await axios.get("entitas");
            const list = Array.isArray(data) ? data : [];
            setEntitasOptions(list.map(e => ({ value: e.id, label: e.name })));
            const map = {};
            list.forEach(e => { map[e.id] = e.name; });
            setEntitasMap(map);
        } catch (e) {
            console.error(e);
            message.error("Gagal memuat entitas");
        } finally {
            setEntitasLoading(false);
        }
    };

    const loadShifts = async () => {
        try {
            includeToken();
            const { data } = await axios.get("shifts");
            const list = Array.isArray(data) ? data : [];
            setShifts(list);
            // warna konsisten
            const map = {};
            list.forEach((s, i) => { map[s.id] = BASE_PALETTE[i % BASE_PALETTE.length]; });
            setShiftColorMap(map);
        } catch (e) {
            console.error(e);
            message.error("Gagal memuat master shifts");
        }
    };

    const loadMonthly = async () => {
        if (!entitasId || !month || !year) {
            message.warning("Pilih entitas, bulan, dan tahun terlebih dahulu");
            return;
        }
        try {
            setLoading(true);
            includeToken();
            const { data } = await axios.get("shifts/schedules/monthly", {
                params: { entitas_id: entitasId, month, year }
            });
            const list = Array.isArray(data) ? data : [];
            setRows(list);
            setOrigRows(list);
            setChanges({});
        } catch (e) {
            console.error(e);
            message.error("Gagal memuat jadwal bulanan");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEntitas();
        loadShifts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ===== actions =====
    const resetChanges = () => {
        setRows(origRows);
        setChanges({});
    };

    const saveChanges = async () => {
        const items = Object.entries(changes).map(([k, shift_id]) => {
            const [user_id, date] = k.split("|");
            return { user_id: Number(user_id), date, shift_id: Number(shift_id) };
        });
        if (!items.length) {
            message.info("Tidak ada perubahan untuk disimpan");
            return;
        }
        try {
            setSaving(true);
            includeToken();
            await axios.post("shifts/schedules/monthly/bulk-upsert", { month, year, items });
            message.success(`Berhasil menyimpan ${items.length} perubahan`);
            await loadMonthly();
        } catch (e) {
            console.error(e);
            message.error("Gagal menyimpan perubahan");
        } finally {
            setSaving(false);
        }
    };

    const clearMonth = async () => {
        if (!entitasId) {
            message.warning("Pilih entitas terlebih dahulu");
            return;
        }
        try {
            includeToken();
            await axios.post("shifts/schedules/monthly/bulk-clear", {
                entitas_id: entitasId, month, year
            });
            message.success("Jadwal bulan ini dikosongkan");
            await loadMonthly();
        } catch (e) {
            console.error(e);
            message.error("Gagal mengosongkan jadwal bulan ini");
        }
    };

    const filterShiftOption = (input, option) => {
        const a = option?.rawLabel?.toLowerCase() || "";
        const b = option?.rawTime?.toLowerCase() || "";
        return a.includes(input.toLowerCase()) || b.includes(input.toLowerCase());
    };

    // update 1 sel
    const updateCell = (user_id, dObj, newShiftId) => {
        const s = shiftById.get(newShiftId);
        setRows(prev => prev.map(r => {
            if (r.user_id !== user_id) return r;
            const days = r.days.map(dayCell => {
                if (dayCell.date === dObj.dateStr) {
                    return {
                        ...dayCell,
                        shift_id: newShiftId,
                        shift_name: s?.name ?? dayCell.shift_name,
                        start_time: s?.start_time ?? dayCell.start_time,
                        end_time: s?.end_time ?? dayCell.end_time,
                        source: "schedule"
                    };
                }
                return dayCell;
            });
            return { ...r, days };
        }));
        setChanges(prev => ({ ...prev, [cellKey(user_id, dObj.dateStr)]: newShiftId }));
    };

    // ===== columns =====
    const columns = useMemo(() => {
        const base = [
            {
                title: <div className="cal-header-cell"><Text strong>Staff</Text></div>,
                key: "staff",
                fixed: "left",
                width: 140,                 // lebih sempit
                className: "sticky-left",
                render: (_, r) => (
                    <div className="staff-cell" title={`${r.name}${r.position ? " · " + r.position : ""}`}>
                        <div className="staff-name">{r.name}</div>
                        <div className="staff-pos">{r.position || "-"}</div>
                    </div>
                ),
            },
            {
                title: <div className="cal-header-cell"><Text strong>Entitas</Text></div>,
                dataIndex: "entitas_id",
                fixed: "left",
                width: 110,                 // diperkecil
                className: "sticky-left-2",
                render: (v) => (
                    <Tag color="blue" style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {entitasMap[v] ?? "-"}
                    </Tag>
                ),
            },
        ];

        const dayCols = dayHeaders.map(dObj => ({
            title: (
                <div className="cal-header" style={{ background: dObj.isWeekend ? "#fafafa" : "transparent" }}>
                    <div className="cal-pill">{dObj.day}</div>
                    <div className="cal-week">{dObj.label}</div>
                </div>
            ),
            dataIndex: `d_${dObj.day}`,
            width: 108,                  // cell shift diperkecil
            align: "center",
            render: (_, record) => {
                const cell = record.days[dObj.day - 1];
                const value = cell?.shift_id ?? null;
                const k = cellKey(record.user_id, dObj.dateStr);
                const isChanged = changes[k] !== undefined;

                const usedShiftId = value;
                const clr = usedShiftId ? (shiftColorMap[usedShiftId] || BASE_PALETTE[0]) : null;

                const bgTint = clr ? hsla({ ...clr, l: Math.min(96, clr.l + 40) }, 0.65) : undefined;
                const borderTint = clr ? hsla({ ...clr, l: Math.max(35, clr.l - 10) }, 0.30) : "#f1f1f1";
                const wrapStyle = {
                    background: dObj.isWeekend ? (bgTint || "#fafafa") : (bgTint || "#fff"),
                    borderColor: borderTint
                };

                const pillCls =
                    cell?.source === "schedule" ? "pill-source pill-schedule" :
                        cell?.source === "default" ? "pill-source pill-default" :
                            "pill-source pill-empty";

                return (
                    <div className={`cal-cell ${dObj.isWeekend ? "weekend" : ""}`} style={wrapStyle}>
                        <div style={{ marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {clr ? <span className="shift-dot" style={{ background: hsl(clr) }} /> : null}
                            <span className={pillCls}>{cell?.source || "empty"}</span>
                        </div>
                        <Tooltip
                            title={
                                <>
                                    <div><strong style={{ fontSize: 11 }}>{cell?.dayofName || ""}</strong> • {cell?.date}</div>
                                    {cell?.start_time && cell?.end_time && (
                                        <div className="micro">Jam: {cell.start_time?.slice(0, 5)}–{cell.end_time?.slice(0, 5)}</div>
                                    )}
                                </>
                            }
                        >
                            <Select
                                size="small"
                                value={value}
                                onChange={(val) => updateCell(record.user_id, dObj, val)}
                                options={shiftOptions}
                                placeholder={<span className="micro">Pilih…</span>}
                                dropdownMatchSelectWidth={false}
                                listHeight={220}
                                filterOption={(input, opt) => {
                                    const a = opt?.rawLabel?.toLowerCase() || "";
                                    const b = opt?.rawTime?.toLowerCase() || "";
                                    return a.includes(input.toLowerCase()) || b.includes(input.toLowerCase());
                                }}
                                showSearch
                                status={isChanged ? "warning" : undefined}
                            />
                        </Tooltip>
                    </div>
                );
            }
        }));

        return [...base, ...dayCols];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dayHeaders, shifts, shiftOptions, changes, entitasMap, shiftColorMap]);

    return (
        <div className="sched-root">
            <style>{styles}</style>

            {/* Header */}
            <Card
                className="shadow-sm"
                style={{
                    marginBottom: 10,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
                    color: "#fff",
                }}
                bodyStyle={{ padding: 10 }}
            >
                <Space align="center" size={10} style={{ width: "100%", justifyContent: "space-between" }}>
                    <Space size={10}>
                        <Title level={4} style={{ margin: 0, color: "#fff" }}>
                            Create / Edit Shift Schedule (Bulanan)
                        </Title>
                    </Space>
                    <Button ghost icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                        Kembali
                    </Button>
                </Space>
            </Card>

            {/* Toolbar */}
            <Card className="shadow-sm sched-toolbar" style={{ borderRadius: 12, marginBottom: 10 }}>
                <Space wrap align="center">
                    <div>
                        <div className="tiny">Entitas</div>
                        <Select
                            allowClear
                            showSearch
                            placeholder="Pilih Entitas"
                            options={entitasOptions}
                            loading={entitasLoading}
                            value={entitasId}
                            onChange={setEntitasId}
                            style={{ width: 220 }}
                            optionFilterProp="label"
                        />
                    </div>

                    <div>
                        <div className="tiny">Bulan & Tahun</div>
                        <MonthPicker
                            value={dayjs(`${year}-${pad2(month)}-01`)}
                            onChange={(val) => {
                                if (!val) return;
                                setMonth(val.month() + 1);
                                setYear(val.year());
                            }}
                            format="MMMM YYYY"
                            style={{ width: 180 }}
                        />
                    </div>

                    <Button icon={<ReloadOutlined />} onClick={loadMonthly}>
                        Load Jadwal
                    </Button>

                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={saveChanges}>
                        Simpan
                    </Button>
                    <Button onClick={resetChanges}>Batalkan</Button>

                    {/* <Popconfirm
                        title="Kosongkan semua jadwal bulan ini untuk entitas ini?"
                        okText="Ya, kosongkan"
                        cancelText="Batal"
                        onConfirm={clearMonth}
                    >
                        <Button danger icon={<DeleteOutlined />}>Kosongkan Bulan Ini</Button>
                    </Popconfirm> */}
                </Space>

                <div style={{ marginTop: 8 }}>
                    <Tag className="pill-default">default</Tag>{" "}
                    <span className="micro"> : Jadwal shift </span> <em className="micro">default (data karyawan)</em>{" "}
                    <Tag className="pill-schedule">schedule</Tag>{" "}
                    <span className="micro"> : Jadwal shift </span> <em className="micro">input</em>{" "}
                    <Tag className="pill-empty">empty</Tag>{" "}
                    <span className="micro">: tidak ada default & belum dijadwalkan</span>
                </div>
            </Card>

            {/* Grid */}
            <Card className="shadow-sm" style={{ borderRadius: 12 }}>
                <Table
                    rowKey="user_id"
                    dataSource={rows}
                    columns={columns}
                    loading={loading}
                    size="small"
                    pagination={false}
                    scroll={{ x: "max-content", y: 560 }}
                    sticky
                />
            </Card>
        </div>
    );
}
