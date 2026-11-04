import { useState, useEffect, useMemo } from "react";
import { DatePicker, Select, Spin, Empty, Typography, Space, Tooltip as AntTooltip, Tag } from "antd";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  PieChartOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { request } from "@/request";

dayjs.locale("id");
const { Option } = Select;
const { Text } = Typography;

// Semantic Color & Meta for each Attendance Status
const STATUS_META = {
  ontime: { label: "Tepat Waktu", color: "#10B981", order: 1 },
  early_checkin: { label: "Lebih Awal", color: "#06B6D4", order: 2 },
  absen: { label: "Hadir", color: "#10B981", order: 1 },
  absen_pulang: { label: "Pulang Tepat", color: "#10B981", order: 1 },
  overtime: { label: "Lembur / Overtime", color: "#3B82F6", order: 2 },
  telat: { label: "Terlambat", color: "#F59E0B", order: 3 },
  tidak_absen_pulang: { label: "Belum Absen Pulang", color: "#F97316", order: 4 },
  tidak_absen: { label: "Tidak Absen", color: "#EF4444", order: 5 },
  izin: { label: "Izin", color: "#8B5CF6", order: 6 },
  off: { label: "Libur / Off", color: "#94A3B8", order: 7 },
};

export default function AttendancePieChart({ title = "Distribusi Absensi Harian" }) {
  const [date, setDate] = useState(dayjs());
  const [type, setType] = useState("datang"); // Default fokus ke datang agar insightful
  const [statistics, setStatistics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [entitasList, setEntitasList] = useState([]);
  const [selectedEntitasIds, setSelectedEntitasIds] = useState([]);

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

  const fetchData = async (
    selectedDate = date,
    selectedType = type,
    entIds = selectedEntitasIds
  ) => {
    setIsLoading(true);
    try {
      const options = {
        tanggal: selectedDate.format("YYYY-MM-DD"),
        type: selectedType,
      };
      if (entIds && entIds.length > 0) {
        options.entitas_ids = entIds.join(",");
      }

      const response = await request.attendance_stats({
        entity: "attendance",
        options,
      });

      // Konversi response object ke array terurut dengan meta semantik
      const formatted = Object.entries(response || {})
        .map(([rawKey, val]) => {
          const num = Number(val) || 0;
          const meta = STATUS_META[rawKey] || {
            label: rawKey.replace(/_/g, " "),
            color: "#64748b",
            order: 99,
          };
          return {
            key: rawKey,
            tag: meta.label,
            value: num,
            color: meta.color,
            order: meta.order,
          };
        })
        .filter((entry) => entry.value > 0) // Hanya tampilkan yang bernilai > 0 pada donut
        .sort((a, b) => a.order - b.order);

      setStatistics(formatted);
    } catch (error) {
      console.error("Error fetching pie stats:", error);
      setStatistics([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(date, type, selectedEntitasIds);
  }, [date, type, selectedEntitasIds]);

  // Total karyawan terhitung pada hari ini
  const totalValue = useMemo(() => {
    return statistics.reduce((sum, entry) => sum + entry.value, 0);
  }, [statistics]);

  // Hitung persentase kehadiran positif (Hadir/Ontime/Early/Overtime)
  const presenceRate = useMemo(() => {
    if (totalValue === 0) return 0;
    const hadirCount = statistics
      .filter((s) => ["ontime", "early_checkin", "absen", "absen_pulang", "overtime"].includes(s.key))
      .reduce((acc, cur) => acc + cur.value, 0);
    return ((hadirCount / totalValue) * 100).toFixed(1);
  }, [statistics, totalValue]);

  return (
    <div
      className="whiteBox shadow"
      style={{
        padding: 22,
        borderRadius: "18px",
        background: "#ffffff",
        border: "1px solid #f1f5f9",
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Title & Filters */}
      <div>
        <div style={{ marginBottom: 14 }}>
          <h3
            style={{
              color: "#0f172a",
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <PieChartOutlined style={{ color: "#8b5cf6" }} />
            {title}
          </h3>
          <Text type="secondary" style={{ fontSize: 11.5 }}>
            Proporsi kehadiran pada {date ? date.format("DD MMMM YYYY") : "hari ini"}
          </Text>
        </div>

        {/* Filter Controls Row */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
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
            style={{ width: "100%" }}
            size="middle"
          >
            {entitasList.map((e) => (
              <Option key={e.id} value={e.id}>
                {e.name}
              </Option>
            ))}
          </Select>

          {/* Date Picker & Mode Switcher */}
          <div style={{ display: "flex", gap: 8 }}>
            <DatePicker
              value={date}
              onChange={(val) => val && setDate(val)}
              format="DD MMM YYYY"
              allowClear={false}
              style={{ flex: 1 }}
              size="middle"
            />
            <Select
              value={type}
              onChange={(v) => setType(v)}
              style={{ width: 145 }}
              size="middle"
            >
              <Option value="datang">Presensi Datang</Option>
              <Option value="pulang">Presensi Pulang</Option>
              <Option value="semua">Status Umum</Option>
            </Select>
          </div>
        </div>
      </div>

      {/* Modern Donut Chart with Center Metric */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <Spin tip="Memuat proporsi absensi..." />
        </div>
      ) : totalValue === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <Empty description="Tidak ada data absensi untuk tanggal ini" />
        </div>
      ) : (
        <div style={{ position: "relative", width: "100%", height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statistics}
                dataKey="value"
                nameKey="tag"
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={100}
                paddingAngle={3}
                cornerRadius={6}
                animationDuration={600}
              >
                {statistics.map((entry) => (
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
                  `${val} org (${((val / totalValue) * 100).toFixed(1)}%)`,
                  item.payload.tag,
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

          {/* Centered Donut KPI Typography */}
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
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
              {presenceRate}%
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Tingkat Hadir
            </div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>
              Total: {totalValue}
            </div>
          </div>
        </div>
      )}

      {/* Modern Interactive Legend Card */}
      {!isLoading && statistics.length > 0 && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 12px",
            background: "#f8fafc",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            maxHeight: 140,
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {statistics.map((item) => {
              const pct = ((item.value / totalValue) * 100).toFixed(1);
              return (
                <div
                  key={item.key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: item.color,
                        display: "inline-block",
                      }}
                    />
                    <span style={{ color: "#334155", fontWeight: 500 }}>{item.tag}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>{item.value}</span>
                    <span
                      style={{
                        fontSize: 10.5,
                        color: item.color,
                        background: `${item.color}15`,
                        padding: "1px 6px",
                        borderRadius: 6,
                        fontWeight: 600,
                      }}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
