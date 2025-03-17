import { useState, useEffect } from "react";
import { DatePicker, Spin } from "antd";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import dayjs from "dayjs";
import { request } from "@/request"; // Import request API
const COLORS = [  "#4E79A7",  "#F28E2B",  "#E15759",  "#76B7B2",  "#59A14F",  "#EDC949",  "#AF7AA1",  "#FF9DA7",  "#9C755F",  "#BAB0AC",];

export default function PanenPieChart({ title, filterMode = "tahun" }) {
  const [date, setDate] = useState(dayjs()); // Default hari ini
  const [statistics, setStatistics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async (selectedDate = date) => {
    setIsLoading(true);
    try {
      const response = await request.panen_stats({
        entity: "panen",
        filterMode,
        options: filterMode === "tahun"
          ? { tahun: selectedDate.year() }
          : { tahun: selectedDate.year(), bulan: selectedDate.month() + 1 },
      });

      setStatistics([]);

      // Konversi response API ke format Pie Chart
      const formattedData = response.map((item) => ({
        tag: item.tambak,
        value: Number(item.total_berat),
      }));

      setStatistics(formattedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [date]); // Panggil ulang saat `date` berubah

  // Hitung total dari semua kategori untuk persentase
  const totalValue = statistics.reduce((sum, entry) => sum + entry.value, 0);

  // Fungsi custom label untuk menampilkan persentase di dalam pie chart
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, index }) => {
    if (totalValue === 0) return null; // Jika total 0, tidak tampilkan label

    const percentage = ((statistics[index].value / totalValue) * 100).toFixed(1); // Format persen
    if (percentage <= 0) return null; // Sembunyikan label jika 0.0%

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight="bold">
        {percentage}%
      </text>
    );
  };

  return (
    <div className="whiteBox shadow" style={{ height: 500, padding: 20, borderRadius: 8 }}>
      <h3 style={{ color: "#333", marginBottom: 20, fontSize: "large", textAlign: "center" }}>
        {title}
      </h3>

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
        <DatePicker
          value={date}
          onChange={(value) => {
            setDate(value);
            fetchData(value);
          }}
          picker={filterMode === "tahun" ? "year" : "month"}
        />
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center" }}>
          <Spin />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={310}>
          <PieChart>
            <Pie
              data={statistics}
              dataKey="value"
              nameKey="tag"
              cx="50%"
              cy="45%"
              outerRadius={120}
              label={renderLabel} // Gunakan custom label untuk persentase
              labelLine={false} // Nonaktifkan garis label luar
            >
              {statistics.map((entry, index) => (
                <Cell key={`cell-${entry.tag}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value} (${((value / totalValue) * 100).toFixed(1)}%)`} />
            <Legend verticalAlign="bottom" height={40} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
