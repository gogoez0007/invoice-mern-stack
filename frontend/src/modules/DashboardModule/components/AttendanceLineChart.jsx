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
  FileTextOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { request } from "@/request";

dayjs.locale("id");
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

// Opsi garis & warna modern (Tanpa kata "cuti")
const LINE_CONFIGS = [
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
  {
    key: "izin",
    label: "Izin",
    color: "#8B5CF6", // Purple
    bgColor: "rgba(139, 92, 246, 0.12)",
    icon: <CalendarOutlined />,
  },
];

// Custom Label di atas titik garis (sesuai contoh gambar pengguna)
const renderCustomDataLabel = (props) => {
  const { x, y, value } = props;
  if (value === undefined || value === null || value === 0) return null;
  const strVal = String(value);
  const width = Math.max(26, strVal.length * 8 + 12);
  return (
    <g>
      <rect
        x={x - width / 2}
        y={y - 22}
        width={width}
        height={17}
        rx={5}
        ry={5}
        fill="#ffffff"
        stroke="#cbd5e1"
        strokeWidth={1}
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.08))" }}
      />
      <text
        x={x}
        y={y - 13.5}
        fill="#1e293b"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
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
          const cfg = LINE_CONFIGS.find((c) => c.key === entry.dataKey);
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

export default function AttendanceLineChart({ title = "Tren Absensi" }) {
  // Default Range Date: Tanggal 1 bulan berjalan s/d Hari ini
  const [dateRange, setDateRange] = useState([dayjs().startOf("month"), dayjs()]);
  const [statistics, setStatistics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLines, setSelectedLines] = useState(LINE_CONFIGS.map((opt) => opt.key));
  const [showLabels, setShowLabels] = useState(true);
  const [entitasList, setEntitasList] = useState([]);
  const [selectedEntitasIds, setSelectedEntitasIds] = useState([]);

  // Detail Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData] = useState({ summary: {}, employees: [] });
  const [modalFilterStatus, setModalFilterStatus] = useState("SEMUA");
  const [modalSearch, setModalSearch] = useState("");

  // Fetch Entitas Master
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

  // Fetch Attendance Line Stats with Date Range & Entitas
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
      console.error("Error fetching line stats data:", error);
      setStatistics([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(dateRange, selectedEntitasIds);
  }, [dateRange, selectedEntitasIds]);

  // Handler Buka Modal Detail dari Tooltip / Titik
  const handleOpenDetailModal = async (targetDate) => {
    if (!targetDate) return;
    const formattedDate = dayjs(targetDate).isValid() ? dayjs(targetDate).format("YYYY-MM-DD") : targetDate;
    setModalDate(formattedDate);
    setIsModalOpen(true);
    setModalLoading(true);
    setModalSearch("");
    setModalFilterStatus("SEMUA");

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

  // Toggle metric pill
  const handleToggleLine = (key) => {
    setSelectedLines((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  // KPI Calculations
  const kpiData = useMemo(() => {
    if (!statistics.length) {
      return { totalHadir: 0, avgHadirDaily: 0, sumTelat: 0, sumIzin: 0, baseKaryawan: 0, attendanceRate: 0 };
    }

    let sumHadir = 0;
    let sumTelat = 0;
    let sumIzin = 0;
    let validDays = 0;
    const baseKaryawan = statistics[0]?.total_karyawan || 0;

    statistics.forEach((d) => {
      const h = Number(d.hadir) || 0;
      const t = Number(d.telat) || 0;
      const i = Number(d.izin) || 0;
      sumHadir += h;
      sumTelat += t;
      sumIzin += i;
      if (h > 0 || t > 0) validDays++;
    });

    const avgHadirDaily = validDays > 0 ? (sumHadir / validDays).toFixed(0) : 0;
    const attendanceRate =
      baseKaryawan > 0 && validDays > 0
        ? ((sumHadir / (baseKaryawan * validDays)) * 100).toFixed(1)
        : 0;

    return {
      sumHadir,
      avgHadirDaily,
      sumTelat,
      sumIzin,
      baseKaryawan,
      attendanceRate,
    };
  }, [statistics]);

  // Filtered employees di dalam Modal Detail
  const filteredModalEmployees = useMemo(() => {
    const list = modalData?.employees || [];
    return list.filter((emp) => {
      const matchSearch =
        !modalSearch ||
        (emp.name || "").toLowerCase().includes(modalSearch.toLowerCase()) ||
        (emp.position || "").toLowerCase().includes(modalSearch.toLowerCase()) ||
        (emp.entitas || "").toLowerCase().includes(modalSearch.toLowerCase());

      const matchStatus =
        modalFilterStatus === "SEMUA" || emp.status_presensi === modalFilterStatus;

      return matchSearch && matchStatus;
    });
  }, [modalData, modalSearch, modalFilterStatus]);

  // Modal Table Columns
  const modalColumns = [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
      width: 50,
      align: "center",
      render: (_, __, idx) => idx + 1,
    },
    {
      title: "Nama Karyawan",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <Space direction="vertical" size={1}>
          <Text strong style={{ color: "#0f172a", fontSize: 13 }}>
            {name}
          </Text>
          <Space size={4}>
            <Tag color="cyan" style={{ fontSize: 10.5, margin: 0, padding: "0 5px" }}>
              {record.entitas}
            </Tag>
            <Tag color="default" style={{ fontSize: 10.5, margin: 0, padding: "0 5px" }}>
              {record.position}
            </Tag>
          </Space>
        </Space>
      ),
    },
    {
      title: "Absen Masuk",
      dataIndex: "check_in_time",
      key: "check_in_time",
      width: 140,
      align: "center",
      render: (time, record) => {
        if (!time || time === "00:00") {
          return <Text type="secondary">-</Text>;
        }
        if (record.status_presensi === "TELAT") {
          return (
            <Space direction="vertical" size={2}>
              <Text strong style={{ color: "#d97706" }}>{time}</Text>
              <Tag color="warning" style={{ margin: 0, fontSize: 10.5 }}>
                Telat {record.menit_telat} mnt
              </Tag>
            </Space>
          );
        }
        return (
          <Space direction="vertical" size={2}>
            <Text strong style={{ color: "#16a34a" }}>{time}</Text>
            <Tag color="success" style={{ margin: 0, fontSize: 10.5 }}>
              Tepat Waktu
            </Tag>
          </Space>
        );
      },
    },
    {
      title: "Absen Pulang",
      dataIndex: "check_out_time",
      key: "check_out_time",
      width: 120,
      align: "center",
      render: (time) => {
        if (!time || time === "00:00") {
          return <Text type="secondary">-</Text>;
        }
        return <Text strong style={{ color: "#0284c7" }}>{time}</Text>;
      },
    },
    {
      title: "Keterangan",
      key: "keterangan",
      width: 220,
      render: (_, record) => {
        if (record.status_presensi === "IZIN") {
          return (
            <Space direction="vertical" size={2}>
              <Tag color="purple" style={{ margin: 0, fontWeight: 600 }}>
                {record.leave_type || "IZIN"}
              </Tag>
              {record.leave_reason && (
                <Text type="secondary" style={{ fontSize: 11.5 }}>
                  {record.leave_reason}
                </Text>
              )}
            </Space>
          );
        }
        if (record.status_presensi === "OFF") {
          return (
            <Space direction="vertical" size={2}>
              <Tag color="default" style={{ margin: 0, fontWeight: 600 }}>
                LIBUR / OFF
              </Tag>
              {record.off_reason && (
                <Text type="secondary" style={{ fontSize: 11.5 }}>
                  {record.off_reason}
                </Text>
              )}
            </Space>
          );
        }
        if (record.status_presensi === "TIDAK_ABSEN") {
          return <Tag color="error">Tidak Hadir (Alpa)</Tag>;
        }
        return <Tag color="success">Hadir Bekerja</Tag>;
      },
    },
  ];

  return (
    <div
      className="whiteBox shadow"
      style={{
        padding: 22,
        borderRadius: "18px",
        background: "#ffffff",
        border: "1px solid #f1f5f9",
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Header & Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <h3
            style={{
              color: "#0f172a",
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <RiseOutlined style={{ color: "#0ea5e9" }} />
            {title}
          </h3>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Pantau fluktuasi kehadiran harian. Klik titik grafik atau tombol di tooltip untuk melihat daftar karyawan.
          </Text>
        </div>

        {/* Filters: Entitas & Date Range Picker */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {/* Multi-Select Entitas */}
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
            onChange={(val) => setSelectedEntitasIds(val)}
            style={{ minWidth: 180, maxWidth: 260 }}
            size="middle"
          >
            {entitasList.map((e) => (
              <Option key={e.id} value={e.id}>
                {e.name}
              </Option>
            ))}
          </Select>

          {/* Date Range Picker (Default: Tanggal 1 s/d Hari ini) */}
          <RangePicker
            value={dateRange}
            onChange={(vals) => vals && setDateRange(vals)}
            format="DD MMM YYYY"
            allowClear={false}
            size="middle"
            style={{ width: 245 }}
            presets={[
              {
                label: "Bulan Ini (s/d Hari Ini)",
                value: [dayjs().startOf("month"), dayjs()],
              },
              {
                label: "7 Hari Terakhir",
                value: [dayjs().subtract(6, "day"), dayjs()],
              },
              {
                label: "30 Hari Terakhir",
                value: [dayjs().subtract(29, "day"), dayjs()],
              },
              {
                label: "Bulan Lalu",
                value: [
                  dayjs().subtract(1, "month").startOf("month"),
                  dayjs().subtract(1, "month").endOf("month"),
                ],
              },
            ]}
          />
        </div>
      </div>

      {/* Top Quick KPI Ribbon (Tanpa kata "cuti") */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 12,
              padding: "8px 12px",
            }}
          >
            <div style={{ fontSize: 11, color: "#166534", fontWeight: 600 }}>
              Kehadiran Rata-rata
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#15803d", marginTop: 2 }}>
              {kpiData.attendanceRate}%
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: 12,
              padding: "8px 12px",
            }}
          >
            <div style={{ fontSize: 11, color: "#1e40af", fontWeight: 600 }}>
              Hadir Harian (Avg)
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#1d4ed8", marginTop: 2 }}>
              {kpiData.avgHadirDaily} <span style={{ fontSize: 11, fontWeight: 500 }}>org</span>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 12,
              padding: "8px 12px",
            }}
          >
            <div style={{ fontSize: 11, color: "#92400e", fontWeight: 600 }}>
              Total Kasus Telat
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#b45309", marginTop: 2 }}>
              {kpiData.sumTelat} <span style={{ fontSize: 11, fontWeight: 500 }}>kali</span>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div
            style={{
              background: "#faf5ff",
              border: "1px solid #e9d5ff",
              borderRadius: 12,
              padding: "8px 12px",
            }}
          >
            <div style={{ fontSize: 11, color: "#6b21a8", fontWeight: 600 }}>
              Total Izin
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#7e22ce", marginTop: 2 }}>
              {kpiData.sumIzin} <span style={{ fontSize: 11, fontWeight: 500 }}>kali</span>
            </div>
          </div>
        </Col>
      </Row>

      {/* Modern Interactive Colored Pills / Chips + Label Switcher */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 16,
          padding: "8px 14px",
          background: "#f8fafc",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600, marginRight: 2 }}>
            Pilih Garis:
          </span>
          {LINE_CONFIGS.map((opt) => {
            const isActive = selectedLines.includes(opt.key);
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleToggleLine(opt.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
                  borderRadius: 999,
                  cursor: "pointer",
                  border: `1.5px solid ${isActive ? opt.color : "#cbd5e1"}`,
                  background: isActive ? opt.bgColor : "#ffffff",
                  color: isActive ? opt.color : "#64748b",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 12,
                  transition: "all 0.18s ease-in-out",
                  boxShadow: isActive ? `0 2px 8px -1px ${opt.color}35` : "none",
                  outline: "none",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: isActive ? opt.color : "#94a3b8",
                    transition: "background 0.2s ease",
                  }}
                />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Toggle Tampilkan Label Angka pada Titik (seperti di contoh gambar) */}
        <Button
          size="small"
          type={showLabels ? "primary" : "default"}
          ghost={showLabels}
          onClick={() => setShowLabels(!showLabels)}
          style={{ fontSize: 11.5, borderRadius: 8 }}
        >
          {showLabels ? "🏷️ Sembunyikan Angka Titik" : "🏷️ Tampilkan Angka Titik"}
        </Button>
      </div>

      {/* Chart Canvas */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <Spin tip="Memuat tren absensi..." />
        </div>
      ) : statistics.length === 0 ? (
        <Empty description="Tidak ada data absensi pada periode ini" style={{ padding: "40px 0" }} />
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={statistics}
            margin={{ top: 25, right: 20, left: -10, bottom: 5 }}
            onClick={(e) => {
              if (e && e.activePayload && e.activePayload.length > 0) {
                const clickedDate = e.activePayload[0].payload.tanggal;
                handleOpenDetailModal(clickedDate);
              }
            }}
          >
            <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />

            {/* X-Axis: Tanggal */}
            <XAxis
              dataKey="tanggal"
              type="category"
              tickFormatter={(tick) => (dayjs(tick).isValid() ? dayjs(tick).format("DD") : tick)}
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={26}
              tickMargin={8}
            />

            {/* Y-Axis: Jumlah Karyawan */}
            <YAxis
              type="number"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
              allowDecimals={false}
            />

            <RechartsTooltip
              wrapperStyle={{ pointerEvents: "auto" }}
              content={<CustomLineTooltip onOpenDetail={handleOpenDetailModal} />}
            />

            {/* Render Garis Berdasarkan Pills yang Aktif + Label Angka Titik */}
            {LINE_CONFIGS.filter((opt) => selectedLines.includes(opt.key)).map((opt) => (
              <Line
                key={opt.key}
                type="monotone"
                dataKey={opt.key}
                stroke={opt.color}
                name={opt.label}
                strokeWidth={2.6}
                dot={{ r: 3, fill: "#ffffff", stroke: opt.color, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: opt.color, stroke: "#ffffff", strokeWidth: 2 }}
                label={showLabels ? renderCustomDataLabel : false}
                animationDuration={600}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* MODAL DETAIL ATTENDANCE PADA TANGGAL YANG DIKLIK */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileTextOutlined style={{ color: "#0284c7" }} />
            <span>
              Detail Presensi Karyawan:{" "}
              <b>
                {modalDate ? dayjs(modalDate).format("dddd, DD MMMM YYYY") : "-"}
              </b>
            </span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={920}
        destroyOnClose
      >
        <div style={{ marginTop: 12 }}>
          {/* Quick Summary Pill Bar di Dalam Modal */}
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: 16,
              padding: "10px 14px",
              background: "#f8fafc",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
            }}
          >
            <Tag color="blue" style={{ fontSize: 12, padding: "3px 8px" }}>
              Total Basis: <b>{modalData?.summary?.total || 0}</b>
            </Tag>
            <Tag color="success" style={{ fontSize: 12, padding: "3px 8px" }}>
              Hadir: <b>{modalData?.summary?.hadir || 0}</b>
            </Tag>
            <Tag color="warning" style={{ fontSize: 12, padding: "3px 8px" }}>
              Telat: <b>{modalData?.summary?.telat || 0}</b>
            </Tag>
            <Tag color="purple" style={{ fontSize: 12, padding: "3px 8px" }}>
              Izin: <b>{modalData?.summary?.izin || 0}</b>
            </Tag>
            <Tag color="default" style={{ fontSize: 12, padding: "3px 8px" }}>
              Off: <b>{modalData?.summary?.off || 0}</b>
            </Tag>
            <Tag color="error" style={{ fontSize: 12, padding: "3px 8px" }}>
              Tidak Absen: <b>{modalData?.summary?.tidak_absen || 0}</b>
            </Tag>
          </div>

          {/* Filter Status & Search Input */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 14,
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
                { label: "Off", value: "OFF" },
                { label: "Tidak Absen", value: "TIDAK_ABSEN" },
              ]}
              size="middle"
            />

            <Input
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Cari nama, posisi, entitas..."
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              allowClear
              style={{ width: 250 }}
            />
          </div>

          {/* Table Detail */}
          {modalLoading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <Spin tip="Memuat rincian absensi..." />
            </div>
          ) : (
            <Table
              dataSource={filteredModalEmployees}
              columns={modalColumns}
              rowKey="id"
              size="small"
              bordered
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Total ${total} karyawan`,
                size: "small",
              }}
              locale={{ emptyText: "Tidak ada data presensi yang sesuai filter" }}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
