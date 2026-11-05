import { useState, useEffect, useMemo } from "react";
import {
  DatePicker,
  Select,
  Spin,
  Row,
  Col,
  Typography,
  Space,
  Tooltip as AntTooltip,
  Empty,
  Modal,
  Table,
  Tag,
  Input,
  Button,
  Segmented,
  Badge,
  Grid,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LogoutOutlined,
  CalendarOutlined,
  ApartmentOutlined,
  RiseOutlined,
  TeamOutlined,
  EyeOutlined,
  SearchOutlined,
  PieChartOutlined,
  LineChartOutlined,
  FilterOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { request } from "@/request";

dayjs.locale("id");
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

// Konfigurasi Kategori & Warna Semantik (Tanpa kata "cuti")
const CATEGORY_CONFIGS = [
  {
    key: "hadir",
    label: "Hadir",
    color: "#10B981", // Emerald
    bgColor: "rgba(16, 185, 129, 0.12)",
    icon: <CheckCircleOutlined />,
  },
  {
    key: "telat",
    label: "Telat",
    color: "#F59E0B", // Amber
    bgColor: "rgba(245, 158, 11, 0.12)",
    icon: <ClockCircleOutlined />,
  },
  {
    key: "izin",
    label: "Izin",
    color: "#8B5CF6", // Purple
    bgColor: "rgba(139, 92, 246, 0.12)",
    icon: <CalendarOutlined />,
  },
  {
    key: "tidak_absen",
    label: "Tidak Absen",
    color: "#EF4444", // Rose / Red
    bgColor: "rgba(239, 68, 68, 0.12)",
    icon: <CloseCircleOutlined />,
  },
  {
    key: "pulang",
    label: "Absen Pulang",
    color: "#0EA5E9", // Sky Blue
    bgColor: "rgba(14, 165, 233, 0.12)",
    icon: <LogoutOutlined />,
  },
];

// Presets rentang tanggal
const RANGE_PRESETS = [
  { label: "Bulan Ini (s/d Hari Ini)", value: [dayjs().startOf("month"), dayjs()] },
  { label: "Bulan Penuh Ini", value: [dayjs().startOf("month"), dayjs().endOf("month")] },
  { label: "7 Hari Terakhir", value: [dayjs().subtract(6, "day"), dayjs()] },
  { label: "14 Hari Terakhir", value: [dayjs().subtract(13, "day"), dayjs()] },
  { label: "Bulan Lalu", value: [dayjs().subtract(1, "month").startOf("month"), dayjs().subtract(1, "month").endOf("month")] },
];

// Offsets vertikal pintar per kategori agar data badge antar garis tidak saling menimpa
const LABEL_OFFSETS = {
  hadir: -22,      // Di atas titik garis
  telat: 10,       // Di bawah titik garis
  izin: -40,       // Lebih tinggi di atas titik garis
  pulang: 26,      // Lebih rendah di bawah titik garis
  tidak_absen: -58 // Tingkat teratas
};

// Custom Label di atas titik garis dengan warna semantik & anti-tumpang tindih
const renderCustomDataLabel = (props) => {
  const { x, y, value, stroke, dataKey } = props;
  if (value === undefined || value === null || value === 0) return null;
  const strVal = String(value);
  const width = Math.max(22, strVal.length * 7 + 10);
  const height = 15;
  const yOffset = LABEL_OFFSETS[dataKey] || -22;
  const badgeY = y + yOffset;
  const textY = badgeY + (height / 2);

  return (
    <g style={{ pointerEvents: "none" }}>
      <rect
        x={x - width / 2}
        y={badgeY}
        width={width}
        height={height}
        rx={4}
        ry={4}
        fill="#ffffff"
        stroke={stroke || "#cbd5e1"}
        strokeWidth={1.2}
        style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.08))" }}
      />
      <text
        x={x}
        y={textY}
        fill={stroke || "#1e293b"}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={9.5}
        fontWeight={700}
        fontFamily="sans-serif"
      >
        {value}
      </text>
    </g>
  );
};

// Custom Tooltip Modern Glassmorphism dengan Tombol Klik Detail
function CustomLineTooltip({ active, payload, label, onOpenDetail }) {
  if (!active || !payload || !payload.length) return null;

  const rowData = payload[0]?.payload || {};
  const total = rowData.total_karyawan || 0;
  const rawDate = rowData.tanggal || label;
  const dateStr = dayjs(rawDate).isValid()
    ? dayjs(rawDate).format("dddd, DD MMMM YYYY")
    : label;

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.98)",
        backdropFilter: "blur(8px)",
        borderRadius: 14,
        padding: "12px 16px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e2e8f0",
        minWidth: 215,
        fontSize: 12.5,
        pointerEvents: "auto",
      }}
    >
      <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 4, borderBottom: "1px solid #f1f5f9", paddingBottom: 4 }}>
        📅 {dateStr}
      </div>
      {total > 0 && (
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
          Basis Terdata: <b>{total} Karyawan</b>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
        {payload.map((entry) => {
          const cfg = CATEGORY_CONFIGS.find((c) => c.key === entry.dataKey);
          const val = Number(entry.value) || 0;
          const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
          return (
            <div
              key={entry.dataKey}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: entry.color,
                    display: "inline-block",
                  }}
                />
                <span style={{ color: "#334155", fontWeight: 500 }}>
                  {cfg?.label || entry.name}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{val}</span>
                {total > 0 && (
                  <span style={{ fontSize: 10.5, color: "#94a3b8" }}>
                    ({pct}%)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Button di Tooltip untuk Membuka Modal Detail Absensi */}
      <Button
        type="primary"
        size="small"
        icon={<EyeOutlined />}
        onClick={(e) => {
          e.stopPropagation();
          onOpenDetail(rawDate);
        }}
        style={{
          width: "100%",
          borderRadius: 8,
          fontSize: 11.5,
          fontWeight: 600,
          background: "linear-gradient(135deg, #0284c7, #0369a1)",
          borderColor: "#0284c7",
          boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)",
        }}
      >
        Lihat Detail Absensi
      </Button>
    </div>
  );
}

export default function AttendanceAnalyticsSection({ onEntitasChange }) {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.xs || !screens.md;

  // 1. FILTER TERPADU: Default Range Tanggal 1 bulan s/d Hari ini
  const [dateRange, setDateRange] = useState([dayjs().startOf("month"), dayjs()]);
  // 2. DEFAULT KATEGORI: HADIR, TELAT, dan IZIN (Sesuai Permintaan Pengguna)
  const [selectedCategories, setSelectedCategories] = useState(["hadir", "telat", "izin"]);
  const [selectedEntitasIds, setSelectedEntitasIds] = useState([]);
  const [showLabels, setShowLabels] = useState(true);

  const [statistics, setStatistics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [entitasList, setEntitasList] = useState([]);
  const [mobileTabKey, setMobileTabKey] = useState("line");

  // Detail Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData] = useState({ summary: {}, employees: [] });
  const [modalFilterStatus, setModalFilterStatus] = useState("SEMUA");
  const [modalSearch, setModalSearch] = useState("");

  // Fetch Master Entitas
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await request.get_entitas();
        if (isMounted && Array.isArray(res)) {
          setEntitasList(res);
        }
      } catch (err) {
        console.warn("Gagal mengambil master entitas:", err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Data Tren & Statistik Terpadu (Single Source of Truth)
  const fetchData = async (range = dateRange, entIds = selectedEntitasIds) => {
    setIsLoading(true);
    try {
      const startDate = range?.[0] ? range[0].format("YYYY-MM-DD") : dayjs().startOf("month").format("YYYY-MM-DD");
      const endDate = range?.[1] ? range[1].format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");

      const options = { startDate, endDate };
      if (entIds && entIds.length > 0) {
        options.entitas_ids = entIds.join(",");
      }

      const response = await request.line_stats({
        entity: "attendance",
        options,
      });

      setStatistics(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Error fetching attendance analytics:", error);
      setStatistics([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(dateRange, selectedEntitasIds);
  }, [dateRange, selectedEntitasIds]);

  // Helper fetch data detail harian untuk modal
  const fetchDetailForDate = async (targetDate) => {
    if (!targetDate) return;
    const formattedDate = dayjs(targetDate).isValid() ? dayjs(targetDate).format("YYYY-MM-DD") : targetDate;
    setModalDate(formattedDate);
    setModalLoading(true);

    try {
      const res = await request.attendance_daily_detail({
        date: formattedDate,
        entitas_ids: selectedEntitasIds.length > 0 ? selectedEntitasIds.join(",") : undefined,
      });
      setModalData(res || { summary: {}, employees: [] });
    } catch (err) {
      console.error("Gagal mengambil detail absensi:", err);
    } finally {
      setModalLoading(false);
    }
  };

  // Handler Buka Modal Detail dari Tooltip / Titik Garis
  const handleOpenDetailModal = (targetDate) => {
    if (!targetDate) return;
    setIsModalOpen(true);
    setModalSearch("");
    setModalFilterStatus("SEMUA");
    fetchDetailForDate(targetDate);
  };

  // Handler Navigasi Tanggal di Modal: Previous (-1), Next (+1), Today (0)
  const handleNavigateModalDate = (offset) => {
    let nextDate;
    if (offset === 0) {
      nextDate = dayjs().format("YYYY-MM-DD");
    } else {
      const base = modalDate ? dayjs(modalDate) : dayjs();
      nextDate = base.add(offset, "day").format("YYYY-MM-DD");
    }
    fetchDetailForDate(nextDate);
  };

  // Toggle kategori presensi (sinkron untuk Line Chart & Pie Chart)
  const handleToggleCategory = (key) => {
    setSelectedCategories((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev; // Minimal 1 kategori tetap aktif
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  // KPI Akumulasi Periode
  const periodTotals = useMemo(() => {
    const totals = {
      hadir: 0,
      telat: 0,
      izin: 0,
      tidak_absen: 0,
      pulang: 0,
      total_karyawan: 0,
    };

    statistics.forEach((row) => {
      totals.hadir += Number(row.hadir) || 0;
      totals.telat += Number(row.telat) || 0;
      totals.izin += Number(row.izin) || 0;
      totals.tidak_absen += Number(row.tidak_absen) || 0;
      totals.pulang += Number(row.pulang) || 0;
      if (row.total_karyawan > totals.total_karyawan) {
        totals.total_karyawan = row.total_karyawan;
      }
    });

    const activeSum = selectedCategories.reduce((sum, key) => sum + (totals[key] || 0), 0);
    const hasHadir = selectedCategories.includes("hadir");
    const presenceRate = hasHadir && activeSum > 0 ? ((totals.hadir / activeSum) * 100).toFixed(1) : "0.0";

    return {
      ...totals,
      activeSum,
      presenceRate,
      dayCount: statistics.length,
    };
  }, [statistics, selectedCategories]);

  // Data Agregat untuk Pie / Donut Chart (SAMA PERSIS dengan filter Line Chart)
  const pieStatistics = useMemo(() => {
    return selectedCategories.map((key) => {
      const cfg = CATEGORY_CONFIGS.find((c) => c.key === key) || {};
      const val = periodTotals[key] || 0;
      const pct = periodTotals.activeSum > 0 ? ((val / periodTotals.activeSum) * 100).toFixed(1) : "0.0";
      return {
        key,
        name: cfg.label || key,
        value: val,
        color: cfg.color || "#64748b",
        pct,
      };
    });
  }, [selectedCategories, periodTotals]);

  // Metrik utama yang ditampilkan di tengah Donut Chart dan label ringkasan
  const primaryDonutMetric = useMemo(() => {
    if (!pieStatistics || pieStatistics.length === 0 || periodTotals.activeSum === 0) {
      return {
        rate: "0.0",
        label: "Presensi",
        badgeText: "Proporsi Presensi",
        color: "#64748b",
      };
    }

    // Jika Hadir dipilih, jadikan Hadir sebagai metrik acuan
    const hadirItem = pieStatistics.find((p) => p.key === "hadir");
    if (hadirItem) {
      return {
        rate: hadirItem.pct,
        label: "Rasio Hadir",
        badgeText: "Proporsi Hadir",
        color: hadirItem.color || "#10B981",
      };
    }

    // Jika Hadir tidak dipilih, tampilkan kategori dominan atau kategori tunggal yang dipilih
    const topItem = [...pieStatistics].sort((a, b) => b.value - a.value)[0];
    return {
      rate: topItem.pct,
      label: `Rasio ${topItem.name}`,
      badgeText: `Proporsi ${topItem.name}`,
      color: topItem.color || "#8B5CF6",
    };
  }, [pieStatistics, periodTotals.activeSum]);

  // Formatter data untuk grafik garis harian
  const lineChartData = useMemo(() => {
    return statistics.map((item) => {
      const d = dayjs(item.tanggal);
      return {
        ...item,
        labelDate: d.isValid() ? d.format("D MMM") : item.tanggal,
      };
    });
  }, [statistics]);

  // Filter Karyawan pada Modal Detail
  const filteredEmployees = useMemo(() => {
    let list = modalData.employees || [];

    if (modalFilterStatus !== "SEMUA") {
      list = list.filter((emp) => {
        const status = (emp.status_kategori || emp.status_presensi || "").toUpperCase();
        return status === modalFilterStatus.toUpperCase();
      });
    }

    if (modalSearch.trim()) {
      const q = modalSearch.toLowerCase().trim();
      list = list.filter((emp) => {
        const reason = String(emp.alasan_izin || emp.leave_reason || emp.leave_type || emp.off_reason || "");
        return (
          (emp.name && emp.name.toLowerCase().includes(q)) ||
          (emp.position && emp.position.toLowerCase().includes(q)) ||
          (emp.entitas && emp.entitas.toLowerCase().includes(q)) ||
          reason.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [modalData.employees, modalFilterStatus, modalSearch]);

  const modalColumns = [
    {
      title: "No",
      key: "no",
      width: 44,
      align: "center",
      render: (_, __, idx) => <span style={{ color: "#94a3b8", fontWeight: 600 }}>{idx + 1}</span>,
    },
    {
      title: "Nama Karyawan",
      dataIndex: "name",
      key: "name",
      width: 150,
      render: (name, record) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 700, color: "#0f172a" }}>{name}</span>
          <span style={{ fontSize: 11, color: "#64748b" }}>
            {record.department !== "-" ? record.department : "Umum"}
          </span>
        </div>
      ),
    },
    {
      title: "Entitas & Posisi",
      key: "entitas_posisi",
      width: 140,
      render: (_, record) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Tag color="cyan" style={{ margin: 0, fontSize: 11, fontWeight: 600, width: "fit-content" }}>
            {record.entitas || "-"}
          </Tag>
          <span style={{ fontSize: 11, color: "#64748b" }}>{record.position || "-"}</span>
        </div>
      ),
    },
    {
      title: "Absen Masuk",
      key: "check_in",
      width: 110,
      render: (_, record) => {
        if (!record.check_in_time) {
          return <span style={{ color: "#94a3b8" }}>-</span>;
        }
        const status = (record.status_kategori || record.status_presensi || "").toUpperCase();
        const isLate = status === "TELAT" || Boolean(record.is_late) || Number(record.menit_telat) > 0;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontWeight: 700, color: isLate ? "#d97706" : "#059669" }}>
              {record.check_in_time}
            </span>
            {isLate ? (
              <Tag color="warning" style={{ fontSize: 10, margin: 0, padding: "0 4px" }}>
                Telat +{record.menit_telat || 1}m
              </Tag>
            ) : (
              <Tag color="success" style={{ fontSize: 10, margin: 0, padding: "0 4px" }}>
                Tepat Waktu
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: "Absen Pulang",
      key: "check_out",
      width: 95,
      render: (_, record) => {
        if (!record.check_out_time) {
          return <span style={{ color: "#94a3b8" }}>-</span>;
        }
        return <span style={{ fontWeight: 600, color: "#0284c7" }}>{record.check_out_time}</span>;
      },
    },
    {
      title: "Keterangan / Alasan Izin",
      key: "keterangan",
      render: (_, record) => {
        const status = (record.status_kategori || record.status_presensi || "").toUpperCase();
        const reason = record.alasan_izin || record.leave_reason || record.leave_type || record.off_reason;
        if (status === "IZIN") {
          return (
            <Tag
              color="purple"
              style={{
                margin: 0,
                whiteSpace: "normal",
                wordBreak: "break-word",
                lineHeight: 1.45,
                padding: "4px 8px",
                height: "auto",
                fontWeight: 600,
                display: "inline-block",
                maxWidth: "100%",
                borderRadius: 6,
              }}
            >
              {reason || "Izin Disetujui"}
            </Tag>
          );
        }
        if (status === "OFF") {
          return (
            <Tag
              color="default"
              style={{
                margin: 0,
                whiteSpace: "normal",
                wordBreak: "break-word",
                lineHeight: 1.45,
                padding: "4px 8px",
                height: "auto",
                display: "inline-block",
                maxWidth: "100%",
                borderRadius: 6,
              }}
            >
              {reason || "Jadwal Off Resmi"}
            </Tag>
          );
        }
        if (status === "TIDAK_ABSEN") {
          return <Tag color="error">Tidak Ada Presensi</Tag>;
        }
        return <span style={{ color: "#94a3b8" }}>-</span>;
      },
    },
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      {/* ============================================================== */}
      {/* 🌟 1. MASTER UNIFIED FILTER BAR (SINKRON UNTUK LINE & PIE)    */}
      {/* ============================================================== */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "18px",
          padding: "18px 22px",
          marginBottom: 16,
          boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
          border: "1px solid #f1f5f9",
        }}
      >
        {/* Top Header Row with Date Range & Entitas Select */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 14,
            paddingBottom: 14,
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                <RiseOutlined />
              </div>
              <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 700, color: "#0f172a" }}>
                Analisis & Tren Presensi
              </h3>
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              Periode Terpilih: <b style={{ color: "#0284c7" }}>{dateRange[0]?.format("DD MMMM YYYY")}</b> s/d{" "}
              <b style={{ color: "#0284c7" }}>{dateRange[1]?.format("DD MMMM YYYY")}</b> ({periodTotals.dayCount} Hari)
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* Filter Date Range Picker (Default: Tanggal 1 s/d Hari ini) */}
            <RangePicker
              allowClear={false}
              presets={RANGE_PRESETS}
              value={dateRange}
              format="DD/MM/YYYY"
              onChange={(val) => {
                if (val && val[0] && val[1]) setDateRange(val);
              }}
              style={{ width: screens.xs ? "100%" : 260 }}
              size="middle"
            />

            {/* Filter Entitas Multi-Select */}
            <Select
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              placeholder={
                <span>
                  <ApartmentOutlined style={{ marginRight: 5 }} />
                  Semua Entitas
                </span>
              }
              value={selectedEntitasIds}
              onChange={(val) => { setSelectedEntitasIds(val); onEntitasChange?.(val); }}
              style={{ minWidth: screens.xs ? "100%" : 190, maxWidth: 280 }}
              size="middle"
            >
              {entitasList.map((e) => (
                <Option key={e.id} value={e.id}>
                  {e.name}
                </Option>
              ))}
            </Select>

            {/* Toggle Label Nilai di Atas Titik Chart */}
            <Button
              size="middle"
              onClick={() => setShowLabels((prev) => !prev)}
              style={{
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: showLabels ? "#0284c7" : "#64748b",
                borderColor: showLabels ? "#bae6fd" : "#cbd5e1",
                backgroundColor: showLabels ? "#f0f9ff" : "#ffffff",
              }}
            >
              {showLabels ? "🏷️ Label Nilai (On)" : "🏷️ Sembunyi Label"}
            </Button>
          </div>
        </div>

        {/* Bottom Interactive Chips: Filter Kategori Bersama untuk Line & Pie Chart */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
              Tampilkan Kategori:
            </span>
            {CATEGORY_CONFIGS.map((cat) => {
              const active = selectedCategories.includes(cat.key);
              const count = periodTotals[cat.key] || 0;
              return (
                <div
                  key={cat.key}
                  onClick={() => handleToggleCategory(cat.key)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 12px",
                    borderRadius: 20,
                    cursor: "pointer",
                    userSelect: "none",
                    fontSize: 12,
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                    background: active ? cat.bgColor : "#f8fafc",
                    color: active ? cat.color : "#94a3b8",
                    border: `1.5px solid ${active ? cat.color : "#e2e8f0"}`,
                    boxShadow: active ? `0 2px 6px ${cat.bgColor}` : "none",
                  }}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                  <span
                    style={{
                      background: active ? cat.color : "#cbd5e1",
                      color: "#ffffff",
                      borderRadius: 10,
                      padding: "0 6px",
                      fontSize: 10.5,
                      fontWeight: 700,
                    }}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick Summary Rate */}
          <div style={{ fontSize: 12, color: "#64748b" }}>
            {primaryDonutMetric.badgeText}: <b style={{ color: primaryDonutMetric.color }}>{primaryDonutMetric.rate}%</b> dari {periodTotals.activeSum} data
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 📊 2. KONTEN GRAFIK (LINE CHART & PIE CHART TERSINKRONISASI)   */}
      {/* ============================================================== */}
      {isMobile ? (
        <div style={{ marginBottom: 16 }}>
          <Segmented
            block
            value={mobileTabKey}
            onChange={setMobileTabKey}
            options={[
              { label: "📈 Tren Garis", value: "line" },
              { label: "🥧 Donut Proporsi", value: "pie" },
            ]}
            style={{
              padding: 4,
              backgroundColor: "#ffffff",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              borderRadius: 12,
              fontWeight: 600,
              marginBottom: 12,
            }}
          />

          <div style={{ display: mobileTabKey === "line" ? "block" : "none" }}>
            <LineChartCard
              chartData={lineChartData}
              selectedCategories={selectedCategories}
              showLabels={showLabels}
              isLoading={isLoading}
              onOpenDetail={handleOpenDetailModal}
            />
          </div>

          <div style={{ display: mobileTabKey === "pie" ? "block" : "none" }}>
            <PieChartCard
              pieStatistics={pieStatistics}
              periodTotals={periodTotals}
              primaryDonutMetric={primaryDonutMetric}
              isLoading={isLoading}
              dateRange={dateRange}
            />
          </div>
        </div>
      ) : (
        <Row gutter={[20, 20]} align="stretch">
          {/* Kolom Kiri (16 Span): Tren Absensi Line Chart */}
          <Col xs={24} lg={16}>
            <LineChartCard
              chartData={lineChartData}
              selectedCategories={selectedCategories}
              showLabels={showLabels}
              isLoading={isLoading}
              onOpenDetail={handleOpenDetailModal}
            />
          </Col>

          {/* Kolom Kanan (8 Span): Proporsi Absensi Donut Chart */}
          <Col xs={24} lg={8}>
            <PieChartCard
              pieStatistics={pieStatistics}
              periodTotals={periodTotals}
              primaryDonutMetric={primaryDonutMetric}
              isLoading={isLoading}
              dateRange={dateRange}
            />
          </Col>
        </Row>
      )}

      {/* ============================================================== */}
      {/* 📋 3. MODAL DETAIL PRESENSI KARYAWAN (DARI KLIK TITIK/TOOLTIP) */}
      {/* ============================================================== */}
      <Modal
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
              paddingRight: 28,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CalendarOutlined style={{ color: "#0284c7" }} />
              <span style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a" }}>
                Detail Presensi:{" "}
                <b style={{ color: "#0284c7" }}>
                  {modalDate ? dayjs(modalDate).format("dddd, DD MMMM YYYY") : "-"}
                </b>
              </span>
            </div>

            {/* Tombol Navigasi Tanggal: Previous, Today, Next */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Button
                size="small"
                icon={<LeftOutlined />}
                onClick={() => handleNavigateModalDate(-1)}
                loading={modalLoading}
                style={{ borderRadius: 6, fontWeight: 500, fontSize: 12 }}
              >
                Previous
              </Button>
              <Button
                size="small"
                onClick={() => handleNavigateModalDate(0)}
                loading={modalLoading}
                style={{
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 12,
                  borderColor: dayjs(modalDate).isSame(dayjs(), "day") ? "#0284c7" : undefined,
                  color: dayjs(modalDate).isSame(dayjs(), "day") ? "#0284c7" : undefined,
                }}
              >
                Today
              </Button>
              <Button
                size="small"
                onClick={() => handleNavigateModalDate(1)}
                loading={modalLoading}
                style={{ borderRadius: 6, fontWeight: 500, fontSize: 12 }}
              >
                Next <RightOutlined style={{ fontSize: 11 }} />
              </Button>
            </div>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsModalOpen(false)}>
            Tutup
          </Button>,
        ]}
        width={screens.xs ? "95%" : 880}
        style={{ top: 30 }}
        styles={{
          body: {
            maxHeight: "calc(100vh - 160px)",
            overflowY: "auto",
            overflowX: "hidden",
            paddingRight: 4,
          },
        }}
      >
        <div style={{ padding: "4px 0" }}>
          {/* Summary Mini Ribbon */}
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 14,
              padding: "10px 14px",
              background: "#f8fafc",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 12, color: "#334155" }}>
              Total Basis: <b>{modalData.summary?.total || 0} Karyawan</b>
            </div>
            <span style={{ color: "#cbd5e1" }}>•</span>
            <Tag color="success">Hadir: {modalData.summary?.hadir || 0}</Tag>
            <Tag color="warning">Telat: {modalData.summary?.telat || 0}</Tag>
            <Tag color="purple">Izin: {modalData.summary?.izin || 0}</Tag>
            <Tag color="default">Libur / OFF: {modalData.summary?.off || 0}</Tag>
            <Tag color="error">Tidak Absen: {modalData.summary?.tidak_absen || 0}</Tag>
          </div>

          {/* Filter Bar & Search di Modal */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Segmented
              value={modalFilterStatus}
              onChange={setModalFilterStatus}
              options={[
                { label: "Semua", value: "SEMUA" },
                { label: "Hadir", value: "HADIR" },
                { label: "Telat", value: "TELAT" },
                { label: "Izin", value: "IZIN" },
                { label: "Libur/OFF", value: "OFF" },
                { label: "Tidak Absen", value: "TIDAK_ABSEN" },
              ]}
              size="small"
              style={{ padding: 3, backgroundColor: "#f1f5f9", fontWeight: 600 }}
            />

            <Input
              allowClear
              placeholder="Cari nama / posisi…"
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              style={{ width: screens.xs ? "100%" : 220 }}
              size="small"
            />
          </div>

          {modalLoading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Spin size="default" />
              <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>Memuat rincian presensi...</div>
            </div>
          ) : (
            <Table
              dataSource={filteredEmployees}
              columns={modalColumns}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 8, showSizeChanger: false }}
              locale={{ emptyText: "Tidak ada data presensi pada status ini" }}
              scroll={{ x: 740 }}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}

// Sub-komponen Kartu Line Chart
function LineChartCard({ chartData, selectedCategories, showLabels, isLoading, onOpenDetail }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        padding: "20px 22px",
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
        border: "1px solid #f1f5f9",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
          📈 Tren Presensi Harian
        </h4>
        <span style={{ fontSize: 11.5, color: "#94a3b8" }}>
          Klik pada titik atau tombol di tooltip untuk melihat daftar karyawan
        </span>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin tip="Memuat tren absensi..." />
        </div>
      ) : chartData.length === 0 ? (
        <div style={{ padding: "80px 0", textAlign: "center" }}>
          <Empty description="Tidak ada data absensi pada rentang tanggal ini" />
        </div>
      ) : (
        <div style={{ width: "100%", height: 320, marginTop: 10 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 24, right: 15, left: -15, bottom: 5 }}
              onClick={(e) => {
                if (e && e.activePayload && e.activePayload.length) {
                  const targetDate = e.activePayload[0].payload.tanggal;
                  onOpenDetail(targetDate);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="labelDate"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                interval="preserveStartEnd"
                minTickGap={26}
                tickMargin={8}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <RechartsTooltip
                wrapperStyle={{ pointerEvents: "auto", outline: "none" }}
                content={<CustomLineTooltip onOpenDetail={onOpenDetail} />}
              />

              {CATEGORY_CONFIGS.map((cfg) => {
                if (!selectedCategories.includes(cfg.key)) return null;
                return (
                  <Line
                    key={cfg.key}
                    type="monotone"
                    dataKey={cfg.key}
                    name={cfg.label}
                    stroke={cfg.color}
                    strokeWidth={2.5}
                    dot={{
                      r: 4.5,
                      fill: "#ffffff",
                      stroke: cfg.color,
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 7,
                      fill: cfg.color,
                      stroke: "#ffffff",
                      strokeWidth: 2.5,
                    }}
                    label={showLabels ? renderCustomDataLabel : false}
                    animationDuration={600}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// Sub-komponen Kartu Pie / Donut Chart
function PieChartCard({ pieStatistics, periodTotals, primaryDonutMetric, isLoading, dateRange }) {
  const metric = primaryDonutMetric || {
    rate: "0.0",
    label: "Presensi",
    color: "#64748b",
  };

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        padding: "20px 22px",
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
        border: "1px solid #f1f5f9",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            🥧 Proporsi Presensi
          </h4>
          <Tag color="purple" style={{ borderRadius: 6, fontWeight: 600 }}>
            Akumulasi Periode
          </Tag>
        </div>
        <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
          {dateRange[0]?.format("D MMM")} s/d {dateRange[1]?.format("D MMM YYYY")}
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin size="default" />
          <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>Memuat proporsi absensi...</div>
        </div>
      ) : periodTotals.activeSum === 0 ? (
        <div style={{ padding: "80px 0", textAlign: "center" }}>
          <Empty description="Tidak ada data absensi untuk kategori terpilih" />
        </div>
      ) : (
        <>
          {/* Donut Chart with Center Metric */}
          <div style={{ position: "relative", width: "100%", height: 210, margin: "10px 0" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieStatistics}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={3}
                  cornerRadius={6}
                  animationDuration={600}
                >
                  {pieStatistics.map((entry) => (
                    <Cell
                      key={`cell-${entry.key}`}
                      fill={entry.color}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(val, name, item) => [
                    `${val} org (${item.payload.pct}%)`,
                    item.payload.name,
                  ]}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Metric di Tengah Donut */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
                {metric.rate}%
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {metric.label}
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>
                Total: {periodTotals.activeSum}
              </div>
            </div>
          </div>

          {/* Interactive Legend List */}
          <div
            style={{
              padding: "10px 12px",
              background: "#f8fafc",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {pieStatistics.map((item) => (
              <div
                key={item.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: item.color,
                      display: "inline-block",
                    }}
                  />
                  <span style={{ fontWeight: 600, color: "#334155" }}>{item.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{item.value} org</span>
                  <Tag
                    style={{
                      margin: 0,
                      fontSize: 10.5,
                      fontWeight: 700,
                      backgroundColor: "#ffffff",
                      borderColor: "#e2e8f0",
                      padding: "0 5px",
                    }}
                  >
                    {item.pct}%
                  </Tag>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

