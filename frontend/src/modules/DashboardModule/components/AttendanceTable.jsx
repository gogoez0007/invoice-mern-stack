import { useState, useEffect, useMemo } from "react";
import {
  Table,
  DatePicker,
  Spin,
  message,
  Input,
  Select,
  Space,
  Button,
  Tag,
  Tooltip,
  Tabs,
  Popconfirm,
  Badge,
  Card,
  Empty,
} from "antd";
import {
  PoweroffOutlined,
  CheckCircleOutlined,
  UserOutlined,
  StopOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
import axios from "axios";
import { request } from "@/request";
import { API_BASE_URL } from "@/config/serverApiConfig";
import storePersist from "@/redux/storePersist";

dayjs.locale("id");

export default function AttendanceTable() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [activeTab, setActiveTab] = useState("active");
  const [date, setDate] = useState(dayjs()); // default: bulan ini

  // === HOLIDAY META (dari backend) ===
  const [holidayMeta, setHolidayMeta] = useState([]); // [{date,isHoliday,codes,names}]
  const holidayIndex = useMemo(() => {
    const idx = {};
    for (const h of holidayMeta || []) {
      const d = dayjs(h.date);
      if (!d.isValid()) continue;
      if (d.isSame(date, "month")) idx[d.date()] = h; // key = tanggal (1..n)
    }
    return idx;
  }, [holidayMeta, date]);

  // ====== SCALE 1.2x untuk cell absensi ======
  const SCALE = 1.2;
  const DAY_CELL_WIDTH = Math.round(54 * SCALE);
  const DAY_HEADER_PAD = Math.round(6 * SCALE);
  const DAY_CELL_PAD_Y = Math.round(8 * SCALE);
  const DAY_HEADER_FSIZE_DOW = Math.round(12 * SCALE);
  const DAY_HEADER_FSIZE_DATE = Math.round(13 * SCALE);

  // --- helpers untuk leave/holiday ---
  const getBracketCodes = (val) => {
    const m = /^\s*\[([^\]]+)\]/.exec(String(val || ""));
    return m ? m[1].split("+").map((s) => s.trim()) : [];
  };
  // LEAVE = bracket TAPI buka KECUALI jika kodenya LN/CB
  const isLeaveCell = (val) => {
    const m = /^\s*\[([^\]]+)\]\s*$/.exec(String(val || ""));
    if (!m) return false;
    const codes = m[1].split("+").map((s) => s.trim());
    return !codes.every((c) => c === "LN" || c === "CB"); // kalau semua LN/CB → bukan leave
  };
  const hasHolidayCode = (val) => {
    const codes = getBracketCodes(val);
    return codes.some((c) => c === "LN" || c === "CB");
  };

  // filter state
  const [nameFilter, setNameFilter] = useState("");
  const [entitasFilter, setEntitasFilter] = useState(undefined);
  const [positionFilter, setPositionFilter] = useState(undefined);

  const daysInMonth = useMemo(() => date.daysInMonth(), [date]);

  const fetchData = async (selectedDate) => {
    setLoading(true);
    try {
      // 1. Ambil summary absensi bulanan
      const resp = await request.attendance_summary({
        entity: "attendance",
        options: { bulan: selectedDate.format("MM"), tahun: selectedDate.format("YYYY") },
      });

      // 2. Ambil list karyawan untuk memastikan ID & is_active selalu terisi akurat
      let allEmpList = [];
      try {
        const auth = storePersist.get("auth");
        const headers = auth?.current?.token ? { Authorization: `Bearer ${auth.current.token}` } : {};
        const empResp = await axios.get(`${API_BASE_URL}employees?items=1000`, {
          headers,
          withCredentials: true,
        });
        allEmpList = empResp?.data?.result || empResp?.data || [];
      } catch (e) {
        console.warn("Could not fetch full employee directory fallback:", e?.message);
      }

      const empMap = new Map();
      allEmpList.forEach((e) => {
        if (e?.id) empMap.set(Number(e.id), e);
        if (e?.name) empMap.set(String(e.name).toLowerCase().trim(), e);
      });

      // robust terhadap bentuk respons: bisa {data: {...}} atau langsung {...}
      const payload = resp?.data ?? resp;

      const rowsSrc =
        Array.isArray(payload) ? payload
          : Array.isArray(payload?.data) ? payload.data
            : [];

      const holSrc = payload?.holidayDates ?? []; // [{date,isHoliday,codes,names}]
      setHolidayMeta(holSrc);

      const transformedData =
        rowsSrc.map((item, index) => {
          const attendanceDays = (item.attendance || []).reduce((acc, value, idx) => {
            acc[`day_${idx + 1}`] = value ?? "-";
            return acc;
          }, {});

          const normName = String(item.name || "").toLowerCase().trim();
          const emp = (item.id ? empMap.get(Number(item.id)) : null) || empMap.get(normName);
          const empId = item.id || emp?.id;
          const isActive =
            item.is_active !== undefined
              ? Number(item.is_active)
              : emp?.is_active !== undefined
                ? Number(emp.is_active)
                : 1;

          return {
            no: index + 1,
            id: empId,
            name: item.name,
            department: item.department || emp?.department || "-",
            entitas: item.entitas || emp?.entitas || "-",
            position: item.position || emp?.position || "-",
            is_active: isActive,
            ...attendanceDays,
          };
        }) ?? [];

      // Cek apakah ada karyawan non-aktif dari allEmpList yang belum ada di rowsSrc
      const existingNames = new Set(rowsSrc.map((r) => String(r.name || "").toLowerCase().trim()));
      allEmpList.forEach((e) => {
        const normName = String(e.name || "").toLowerCase().trim();
        if (e.is_active === 0 && !existingNames.has(normName)) {
          transformedData.push({
            no: transformedData.length + 1,
            id: e.id,
            name: e.name,
            department: e.department || "-",
            entitas: e.entitas || "-",
            position: e.position || "-",
            is_active: 0,
          });
        }
      });

      setRawData(transformedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Gagal mengambil data absensi.");
      setRawData([]);
      setHolidayMeta([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(date);
    // reset filter saat ganti bulan
    setNameFilter("");
    setEntitasFilter(undefined);
    setPositionFilter(undefined);
  }, [date]);

  // Handler untuk mengaktifkan / menonaktifkan status karyawan (Action ON/OFF)
  const handleToggleActive = async (record, nextStatus) => {
    const targetId = record.id;
    if (!targetId) {
      message.error(`ID untuk karyawan ${record.name} tidak ditemukan.`);
      return;
    }

    try {
      setTogglingId(targetId);
      const auth = storePersist.get("auth");
      const headers = auth?.current?.token
        ? { Authorization: `Bearer ${auth.current.token}` }
        : {};

      const res = await axios.patch(
        `${API_BASE_URL}employees/${targetId}/toggle-status`,
        { is_active: nextStatus ? 1 : 0 },
        { headers, withCredentials: true }
      );

      if (res.data?.success) {
        message.success(
          res.data.message ||
            `Karyawan ${record.name} berhasil di-${nextStatus ? "aktifkan kembali" : "nonaktifkan"}.`
        );
        // Refresh data absensi
        await fetchData(date);
      } else {
        message.error(res.data?.message || "Gagal mengubah status karyawan.");
      }
    } catch (err) {
      console.error("Toggle status error:", err);
      message.error(
        "Gagal mengubah status karyawan: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setTogglingId(null);
    }
  };

  // Split data Karyawan Aktif vs Karyawan Tidak Aktif
  const activeRows = useMemo(() => {
    return rawData.filter((row) => row.is_active !== 0);
  }, [rawData]);

  const inactiveRows = useMemo(() => {
    return rawData.filter((row) => row.is_active === 0);
  }, [rawData]);

  // opsi dropdown filter dari keseluruhan data
  const entitasOptions = useMemo(() => {
    const set = new Set(rawData.map((d) => d.entitas).filter(Boolean));
    return Array.from(set).sort().map((v) => ({ label: v, value: v }));
  }, [rawData]);

  const positionOptions = useMemo(() => {
    const set = new Set(rawData.map((d) => d.position).filter(Boolean));
    return Array.from(set).sort().map((v) => ({ label: v, value: v }));
  }, [rawData]);

  // Apply filter untuk Tab 1 (Karyawan Aktif)
  const filteredActiveData = useMemo(() => {
    const byName = (row) =>
      !nameFilter || (row.name || "").toString().toLowerCase().includes(nameFilter.toLowerCase());
    const byEntitas = (row) => !entitasFilter || row.entitas === entitasFilter;
    const byPosition = (row) => !positionFilter || row.position === positionFilter;
    return activeRows
      .filter((row) => byName(row) && byEntitas(row) && byPosition(row))
      .map((row, idx) => ({ ...row, no: idx + 1 }));
  }, [activeRows, nameFilter, entitasFilter, positionFilter]);

  // Apply filter untuk Tab 2 (Karyawan Tidak Aktif)
  const filteredInactiveData = useMemo(() => {
    const byName = (row) =>
      !nameFilter || (row.name || "").toString().toLowerCase().includes(nameFilter.toLowerCase());
    const byEntitas = (row) => !entitasFilter || row.entitas === entitasFilter;
    const byPosition = (row) => !positionFilter || row.position === positionFilter;
    return inactiveRows
      .filter((row) => byName(row) && byEntitas(row) && byPosition(row))
      .map((row, idx) => ({ ...row, no: idx + 1 }));
  }, [inactiveRows, nameFilter, entitasFilter, positionFilter]);

  const resetFilters = () => {
    setNameFilter("");
    setEntitasFilter(undefined);
    setPositionFilter(undefined);
  };

  // ===== Helpers (wrap 2 kata per baris) =====
  const chunkWords = (text, chunkSize = 2) => {
    const words = String(text || "").trim().split(/\s+/).filter(Boolean);
    const lines = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      lines.push(words.slice(i, i + chunkSize).join(" "));
    }
    return lines.length ? lines : ["-"];
  };

  const StackedText = ({ value, weight = 600 }) => {
    const lines = chunkWords(value, 2);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 2, lineHeight: 1.15 }}>
        {lines.map((ln, idx) => (
          <span key={idx} style={{ fontWeight: weight }}>{ln}</span>
        ))}
      </div>
    );
  };

  const StackedChip = ({ value, color = "blue" }) => {
    const lines = chunkWords(value, 2);
    const bg =
      color === "green"
        ? "linear-gradient(180deg,#f6ffed,#e6fffb)"
        : "linear-gradient(180deg,#f0f5ff,#e6f4ff)";
    const fg = color === "green" ? "#135200" : "#10239E";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {lines.map((ln, idx) => (
          <span
            key={idx}
            style={{
              display: "inline-block",
              padding: "2px 6px",
              borderRadius: 8,
              background: bg,
              color: fg,
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.2,
              border: "1px solid #f0f0f0",
              maxWidth: "100%",
              whiteSpace: "normal",
              wordBreak: "break-word",
            }}
          >
            {ln}
          </span>
        ))}
      </div>
    );
  };

  // warna header hari (ditambah: libur LN/CB override)
  const getHeaderStyleByDay = (d) => {
    const hol = holidayIndex[d.date()];
    if (hol?.isHoliday) {
      return {
        background:
          hol.codes?.includes("LN") && hol.codes?.includes("CB")
            ? "linear-gradient(180deg,#fff0f6,#fffbe6)" // LN+CB
            : hol.codes?.includes("LN")
              ? "linear-gradient(180deg,#fff0f6,#fff7f3)" // LN
              : "linear-gradient(180deg,#fffbe6,#fff7e6)", // CB
        color: "#1f1f1f",
        borderBottom: "1px solid #ffd666",
      };
    }
    if (d.day() === 0) {
      return { background: "linear-gradient(180deg,#ffeaea, #fff5f5)", color: "#d4380d" }; // Minggu
    }
    if (d.day() === 6) {
      return { background: "linear-gradient(180deg,#eef3ff, #f5f8ff)", color: "#1d39c4" }; // Sabtu
    }
    return { background: "linear-gradient(180deg,#f7faff,#ffffff)", color: "#1f1f1f" }; // Sen–Jum
  };

  // ===== Columns Tab 1: Karyawan Aktif dengan Action OFF =====
  const baseColumns = [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
      width: 52,
      align: "center",
      fixed: "left",
      onHeaderCell: () => ({
        style: { background: "linear-gradient(180deg,#e6f4ff,#ffffff)", fontWeight: 700 },
      }),
    },
    {
      title: "Aksi",
      key: "action_off",
      width: 110,
      align: "center",
      fixed: "left",
      onHeaderCell: () => ({
        style: { background: "linear-gradient(180deg,#e6f4ff,#ffffff)", fontWeight: 700 },
      }),
      render: (_, record) => (
        <Popconfirm
          title="Nonaktifkan Karyawan?"
          description={
            <div style={{ maxWidth: 220 }}>
              Yakin ingin menonaktifkan <b>{record.name}</b>?
              <div style={{ color: "#8c8c8c", fontSize: 12, marginTop: 4 }}>
                Karyawan akan dipindahkan ke tab <b>Karyawan Tidak Aktif</b>.
              </div>
            </div>
          }
          onConfirm={() => handleToggleActive(record, false)}
          okText="Ya, Nonaktifkan"
          cancelText="Batal"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="Klik untuk menonaktifkan karyawan">
            <Button
              size="small"
              danger
              type="primary"
              icon={<PoweroffOutlined />}
              loading={togglingId === (record.id || record.no)}
              style={{
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                padding: "0 8px",
                height: 25,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                boxShadow: "0 2px 6px rgba(255, 77, 79, 0.25)",
              }}
            >
              Nonaktifkan
            </Button>
          </Tooltip>
        </Popconfirm>
      ),
    },
    {
      title: "Nama",
      dataIndex: "name",
      key: "name",
      width: 140,
      fixed: "left",
      onHeaderCell: () => ({
        style: { background: "linear-gradient(180deg,#e6f4ff,#ffffff)", fontWeight: 700 },
      }),
      onCell: () => ({
        style: {
          whiteSpace: "normal",
          wordBreak: "break-word",
          lineHeight: 1.15,
          paddingTop: 6,
          paddingBottom: 6,
        },
      }),
      render: (text) => <StackedText value={text} />,
    },
    {
      title: "Entitas",
      dataIndex: "entitas",
      key: "entitas",
      width: 120,
      fixed: "left",
      onHeaderCell: () => ({
        style: { background: "linear-gradient(180deg,#e6f4ff,#ffffff)", fontWeight: 700 },
      }),
      onCell: () => ({
        style: {
          whiteSpace: "normal",
          wordBreak: "break-word",
          lineHeight: 1.15,
          paddingTop: 6,
          paddingBottom: 6,
        },
      }),
      render: (text) => <StackedChip value={text} color="green" />,
    },
    {
      title: "Posisi",
      dataIndex: "position",
      key: "position",
      width: 120,
      fixed: "left",
      onHeaderCell: () => ({
        style: { background: "linear-gradient(180deg,#e6f4ff,#ffffff)", fontWeight: 700 },
      }),
      onCell: () => ({
        style: {
          whiteSpace: "normal",
          wordBreak: "break-word",
          lineHeight: 1.15,
          paddingTop: 6,
          paddingBottom: 6,
        },
      }),
      render: (text) => <StackedChip value={text} color="blue" />,
    },
  ];

  // kolom hari: 1.2x lebih besar + styling: LEAVE > HOLIDAY > Weekend/Normal
  const dayColumns = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = date.date(i + 1);
      const isWeekend = d.day() === 0 || d.day() === 6;
      const hol = holidayIndex[d.date()];
      const headStyle = getHeaderStyleByDay(d);

      const titleContent = (
        <div style={{ lineHeight: 1.1, textAlign: "center" }}>
          <div
            style={{
              fontSize: DAY_HEADER_FSIZE_DOW,
              fontWeight: 700,
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            {d.format("ddd")}
          </div>
          <div style={{ fontSize: DAY_HEADER_FSIZE_DATE }}>{d.format("D")}</div>
          {hol?.isHoliday && (
            <div style={{ marginTop: 2 }}>
              {hol.codes?.map((c) => (
                <Tag
                  key={c}
                  color={c === "LN" ? "magenta" : "gold"}
                  style={{ padding: "0 6px", margin: "2px 2px 0", fontSize: 11, lineHeight: "18px" }}
                >
                  {c}
                </Tag>
              ))}
            </div>
          )}
        </div>
      );

      return {
        title: hol?.isHoliday && hol?.names?.length
          ? <Tooltip title={hol.names.join(", ")}>{titleContent}</Tooltip>
          : titleContent,
        dataIndex: `day_${i + 1}`,
        key: `day_${i + 1}`,
        width: DAY_CELL_WIDTH,
        align: "center",
        onHeaderCell: () => ({
          style: { ...headStyle, borderInline: "1px solid #f0f0f0", padding: DAY_HEADER_PAD },
        }),
        onCell: (record) => {
          const raw = record[`day_${i + 1}`];
          const leave = isLeaveCell(raw);
          const holidayDay = !!hol?.isHoliday || hasHolidayCode(raw);

          // base style
          const base = {
            paddingTop: DAY_CELL_PAD_Y,
            paddingBottom: DAY_CELL_PAD_Y,
            background: isWeekend ? "#fafafa" : "#ffffff",
          };

          // priority: leave > holiday > base
          if (leave) {
            return {
              style: {
                ...base,
                background: "linear-gradient(180deg,#fffbe6,#fff1b8)",
                color: "#ad6800",
                fontWeight: 700,
                borderInline: "1px solid #ffe58f",
              },
            };
          }
          if (holidayDay) {
            return {
              style: {
                ...base,
                background: "linear-gradient(180deg,#f6ffed,#e6fffb)",
                color: "#135200",
                fontWeight: 600,
                borderInline: "1px solid #b7eb8f",
              },
            };
          }
          return { style: base };
        },
        render: (text) => {
          const leave = isLeaveCell(text);
          const isHoliday = hasHolidayCode(text);
          if (leave || isHoliday) {
            const codes = getBracketCodes(text).join("+");
            const after = String(text || "").replace(/^\s*\[[^\]]+\]\s*/, "").trim();
            return (
              <span style={{ fontWeight: 700 }}>
                {codes}
                {after ? ` ${after}` : ""}
              </span>
            );
          }
          const display = text || "-";
          return <span style={{ fontWeight: display !== "-" ? 600 : 400 }}>{display}</span>;
        },
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    daysInMonth,
    date,
    holidayIndex,
    DAY_CELL_WIDTH,
    DAY_CELL_PAD_Y,
    DAY_HEADER_PAD,
    DAY_HEADER_FSIZE_DOW,
    DAY_HEADER_FSIZE_DATE,
  ]);

  const activeColumns = [...baseColumns, ...dayColumns];

  // ===== Columns Tab 2: Karyawan Tidak Aktif dengan Action Aktifkan (ON) =====
  const inactiveColumns = [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
      width: 56,
      align: "center",
      onHeaderCell: () => ({
        style: { background: "linear-gradient(180deg,#fff1f0,#ffffff)", fontWeight: 700 },
      }),
    },
    {
      title: "Nama Karyawan",
      dataIndex: "name",
      key: "name",
      onHeaderCell: () => ({
        style: { background: "linear-gradient(180deg,#fff1f0,#ffffff)", fontWeight: 700 },
      }),
      render: (text) => (
        <Space>
          <UserOutlined style={{ color: "#ff4d4f" }} />
          <span style={{ fontWeight: 600, color: "#262626" }}>{text}</span>
        </Space>
      ),
    },
    {
      title: "Entitas",
      dataIndex: "entitas",
      key: "entitas",
      width: 160,
      onHeaderCell: () => ({
        style: { background: "linear-gradient(180deg,#fff1f0,#ffffff)", fontWeight: 700 },
      }),
      render: (text) => <StackedChip value={text} color="green" />,
    },
    {
      title: "Posisi / Jabatan",
      dataIndex: "position",
      key: "position",
      width: 180,
      onHeaderCell: () => ({
        style: { background: "linear-gradient(180deg,#fff1f0,#ffffff)", fontWeight: 700 },
      }),
      render: (text) => <StackedChip value={text} color="blue" />,
    },
    {
      title: "Status",
      key: "status",
      width: 150,
      align: "center",
      onHeaderCell: () => ({
        style: { background: "linear-gradient(180deg,#fff1f0,#ffffff)", fontWeight: 700 },
      }),
      render: () => (
        <Tag color="error" style={{ borderRadius: 6, fontWeight: 600, padding: "2px 8px" }}>
          Tidak Aktif
        </Tag>
      ),
    },
    {
      title: "Aksi",
      key: "action_on",
      width: 140,
      align: "center",
      onHeaderCell: () => ({
        style: { background: "linear-gradient(180deg,#fff1f0,#ffffff)", fontWeight: 700 },
      }),
      render: (_, record) => (
        <Popconfirm
          title="Aktifkan Karyawan Kembali?"
          description={
            <div style={{ maxWidth: 240 }}>
              Aktifkan kembali <b>{record.name}</b>?
              <div style={{ color: "#8c8c8c", fontSize: 12, marginTop: 4 }}>
                Karyawan akan kembali muncul di daftar <b>Data Absensi Karyawan Aktif</b>.
              </div>
            </div>
          }
          onConfirm={() => handleToggleActive(record, true)}
          okText="Ya, Aktifkan"
          cancelText="Batal"
        >
          <Button
            size="small"
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={togglingId === (record.id || record.no)}
            style={{
              background: "#52c41a",
              borderColor: "#52c41a",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 12,
              boxShadow: "0 2px 6px rgba(82, 196, 26, 0.25)",
            }}
          >
            Aktifkan
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: 12 }}>
      {/* Header berwarna */}
      <div
        style={{
          background: "linear-gradient(135deg, #1677ff 0%, #69b1ff 40%, #95de64 100%)",
          color: "#fff",
          padding: "14px 16px",
          borderRadius: 14,
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 6px 18px rgba(22,119,255,0.25)",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          Ringkasan Absensi — {date.format("MMMM YYYY")}
        </div>
        <div style={{ opacity: 0.9, fontSize: 12 }}>
          <Tooltip title="Hari Sabtu & Minggu ditandai berbeda. Libur LN/CB juga disorot.">
            <span>Weekend & Holiday highlighted</span>
          </Tooltip>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div
        style={{
          marginBottom: 14,
          display: "grid",
          gridTemplateColumns: "auto 1fr auto auto auto auto",
          gap: 8,
          alignItems: "center",
        }}
      >
        <DatePicker
          allowClear={false}
          picker="month"
          value={date}
          onChange={(value) => value && setDate(value)}
          style={{ width: 190 }}
        />

        <div />

        <Input
          allowClear
          placeholder="Filter Nama…"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          style={{ width: 190 }}
        />
        <Select
          allowClear
          showSearch
          placeholder="Filter Entitas"
          optionFilterProp="label"
          value={entitasFilter}
          onChange={(v) => setEntitasFilter(v)}
          options={entitasOptions}
          style={{ width: 160 }}
        />
        <Select
          allowClear
          showSearch
          placeholder="Filter Posisi"
          optionFilterProp="label"
          value={positionFilter}
          onChange={(v) => setPositionFilter(v)}
          options={positionOptions}
          style={{ width: 160 }}
        />
        <Button onClick={resetFilters}>Reset</Button>
      </div>

      {/* Tabs untuk 2 Kategori: Data Absen Aktif vs Karyawan Tidak Aktif */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        size="middle"
        style={{ marginBottom: 10 }}
        items={[
          {
            key: "active",
            label: (
              <Space size={6}>
                <TeamOutlined style={{ color: activeTab === "active" ? "#1677ff" : "inherit" }} />
                <span style={{ fontWeight: 600 }}>List Data Absen (Karyawan Aktif)</span>
                <Badge
                  count={filteredActiveData.length}
                  style={{
                    backgroundColor: activeTab === "active" ? "#1677ff" : "#8c8c8c",
                    boxShadow: activeTab === "active" ? "0 2px 4px rgba(22,119,255,0.25)" : "none",
                  }}
                  overflowCount={999}
                />
              </Space>
            ),
            children: (
              <>
                {/* Legend kecil */}
                <div
                  style={{
                    marginBottom: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <Space size="small" wrap>
                    <Tag color="red">Minggu</Tag>
                    <Tag color="geekblue">Sabtu</Tag>
                    <Tag color="gold">Leave Request</Tag>
                    <Tag color="magenta">LN</Tag>
                    <Tag color="gold">CB</Tag>
                  </Space>
                  <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                    💡 Klik tombol{" "}
                    <Tag color="error" style={{ margin: "0 2px", fontWeight: 600 }}>
                      Nonaktifkan
                    </Tag>{" "}
                    pada kolom Aksi untuk menonaktifkan karyawan secara langsung.
                  </div>
                </div>

                {/* Tabel Absen Karyawan Aktif */}
                {loading ? (
                  <Spin style={{ display: "block", textAlign: "center", padding: "60px 0" }} />
                ) : (
                  <Table
                    dataSource={filteredActiveData}
                    columns={activeColumns}
                    rowKey="no"
                    bordered
                    size="small"
                    pagination={false}
                    sticky
                    scroll={{ x: "max-content", y: 520 }}
                    style={{
                      borderRadius: 14,
                      overflow: "hidden",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
                      background: "#ffffff",
                    }}
                    locale={{ emptyText: "Tidak ada data absensi aktif" }}
                  />
                )}
              </>
            ),
          },
          {
            key: "inactive",
            label: (
              <Space size={6}>
                <StopOutlined style={{ color: activeTab === "inactive" ? "#ff4d4f" : "inherit" }} />
                <span style={{ fontWeight: 600 }}>Karyawan Tidak Aktif</span>
                <Badge
                  count={filteredInactiveData.length}
                  style={{
                    backgroundColor: filteredInactiveData.length > 0 ? "#ff4d4f" : "#d9d9d9",
                    boxShadow:
                      filteredInactiveData.length > 0
                        ? "0 2px 4px rgba(255,77,79,0.25)"
                        : "none",
                  }}
                  overflowCount={999}
                />
              </Space>
            ),
            children: (
              <Card
                bordered={false}
                style={{
                  borderRadius: 14,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
                  background: "#ffffff",
                }}
                bodyStyle={{ padding: 16 }}
              >
                <div
                  style={{
                    marginBottom: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 13, color: "#595959" }}>
                    Daftar karyawan yang berstatus tidak aktif dari sistem absensi. Klik tombol{" "}
                    <b>Aktifkan</b> untuk mengembalikan karyawan ke daftar absensi aktif.
                  </div>
                </div>

                {loading ? (
                  <Spin style={{ display: "block", textAlign: "center", padding: "60px 0" }} />
                ) : (
                  <Table
                    dataSource={filteredInactiveData}
                    columns={inactiveColumns}
                    rowKey="no"
                    bordered
                    size="middle"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} karyawan tidak aktif`,
                    }}
                    locale={{
                      emptyText: (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description="Tidak ada karyawan yang tidak aktif. Semua karyawan berstatus aktif."
                        />
                      ),
                    }}
                  />
                )}
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
