import { useState, useEffect } from "react";
import { Select, Spin, Checkbox } from "antd";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import dayjs from "dayjs";
import { request } from "@/request";

const { Option } = Select;

// Opsi garis yang bisa dipilih
const lineOptions = [
  { key: "hadir", color: "#4E79A7", label: "Hadir" },
  { key: "telat", color: "#F28E2B", label: "Telat" },
  { key: "tidak_absen", color: "#E15759", label: "Tidak Absen" },
  { key: "pulang", color: "#2CA02C", label: "Absen Pulang" },
  { key: "tidak_absen_pulang", color: "#76B7B2", label: "Tidak Absen Pulang" },
];

export default function AttendanceLineChart({ title }) {
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [year, setYear] = useState(dayjs().year());
  const [statistics, setStatistics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLines, setSelectedLines] = useState(lineOptions.map(opt => opt.key)); // Default semua dipilih

  const fetchData = async (selectedMonth = month, selectedYear = year) => {
    setIsLoading(true);
    try {
      const response = await request.line_stats({
        entity: "attendance",
        options: { bulan: selectedMonth, tahun: selectedYear },
      });

      setStatistics(response || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  return (
    <div className="whiteBox shadow" style={{ padding: 20 }}>
      <h3 style={{ color: "#333", marginBottom: 20, fontSize: "large", textAlign: "center" }}>
        {title}
      </h3>

      {/* Filter Bulan & Tahun */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
        <Select value={month} onChange={(value) => { setMonth(value); fetchData(value, year); }} style={{ width: 120 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <Option key={i + 1} value={i + 1}>{dayjs().month(i).format("MMMM")}</Option>
          ))}
        </Select>
        <Select value={year} onChange={(value) => { setYear(value); fetchData(month, value); }} style={{ width: 120 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <Option key={year - i} value={year - i}>{year - i}</Option>
          ))}
        </Select>
      </div>

      {/* Checkbox untuk memilih garis */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <Checkbox.Group 
          options={lineOptions.map(opt => ({ label: opt.label, value: opt.key }))}
          value={selectedLines}
          onChange={setSelectedLines}
        />
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center" }}>
          <Spin />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart 
            data={statistics}
            margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            {/* X-Axis: Tanggal */}
            <XAxis 
              dataKey="tanggal" 
              type="category"
              tickFormatter={(tick) => dayjs(tick).format("DD")}
            />

            {/* Y-Axis: Jumlah Karyawan */}
            <YAxis 
              type="number"
              label={{ value: "Jumlah Karyawan", angle: -90, position: "insideLeft" }}
            />

            <Tooltip />
            <Legend />

            {/* Render Garis Berdasarkan yang Dipilih */}
            {lineOptions
              .filter(opt => selectedLines.includes(opt.key))
              .map(opt => (
                <Line 
                  key={opt.key} 
                  type="monotone" 
                  dataKey={opt.key} 
                  stroke={opt.color} 
                  name={opt.label} 
                  strokeWidth={2} 
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
