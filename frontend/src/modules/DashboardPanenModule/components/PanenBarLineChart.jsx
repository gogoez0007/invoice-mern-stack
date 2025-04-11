import { useState, useEffect } from "react";
import { DatePicker, Spin, Checkbox, Switch } from "antd";
import {
  LineChart,
  Line,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import { request } from "@/request";

const { RangePicker } = DatePicker;

export default function PanenChart({ title }) {
  const [year, setYear] = useState(dayjs().year());
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allTambak, setAllTambak] = useState([]);
  const [selectedTambak, setSelectedTambak] = useState([]);
  const [isMerged, setIsMerged] = useState(false);

  // Daftar nama bulan dalam bahasa Indonesia
  const bulanNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const customTooltip = ({ active, payload }) => {
    console.log(payload);
    if (active && payload && payload.length) {
      // Gabungkan data dengan nama yang sama
      const mergedData = payload.reduce((acc, entry) => {
        if (!acc[entry.name]) {
          acc[entry.name] = { ...entry, value: 0 };
        }
        acc[entry.name].value += entry.value; // Menjumlahkan value jika key sama
        return acc;
      }, {});

      return (
        <div className="custom-tooltip" style={{ background: "#fff", padding: 10, border: "1px solid #ccc" }}>
          {Object.values(mergedData).map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: 0 }}>
              {entry.name}: {new Intl.NumberFormat("id-ID").format(entry.value)} Ton
            </p>
          ))}
        </div>
      );
    }
    return null;
  };


  // Fungsi untuk fetch data
  const fetchData = async (selectedYear = year) => {
    setIsLoading(true);
    try {
      const response = await request.barchart({
        entity: "panen",
        options: { tahun: selectedYear },
      });

      // Buat array dengan semua bulan (12 bulan)
      const months = Array.from({ length: 12 }, (_, i) => ({
        bulan: `${selectedYear}-${String(i + 1).padStart(2, "0")}`,
        namaBulan: bulanNames[i], // Nama bulan
      }));

      // Gabungkan data yang ada ke dalam bulan yang sudah dibuat
      const formattedData = months.map((monthData) => {
        const monthEntries = response.filter(item => item.bulan === monthData.bulan);
        
        if (isMerged) {
          // Jika mode merge aktif, gabungkan semua panen dalam bulan tersebut
          const totalPanen = monthEntries.reduce((sum, item) => sum + parseFloat(item.total_berat), 0);
          return { ...monthData, total: totalPanen / 1000 }; // Konversi ke ton
        } else {
          // Jika tidak di-merge, tampilkan per tambak
          const tambakValues = Object.fromEntries(
            monthEntries.map(item => [item.tambak, parseFloat(item.total_berat) / 1000])
          );
          return { ...monthData, ...tambakValues };
        }
      });
console.log(formattedData);
      setData(formattedData);

      // Ambil daftar tambak dari response
      const tambakList = [...new Set(response.map((item) => item.tambak))];
      setAllTambak(tambakList);
      setSelectedTambak(tambakList); // Default: semua tambak dipilih
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [year, isMerged]);

  // Warna unik untuk setiap tambak
  const tambakColors = {};
  allTambak.forEach((tambak, index) => {
    tambakColors[tambak] = `hsl(${(index * 137) % 360}, 70%, 50%)`;
  });

  const handleYearChange = (date, dateString) => {
    if (date) {
      const selectedYear = date.year();
      setYear(selectedYear);
      fetchData(selectedYear);
    }
  };

  return (
    <div>
      <h3 style={{ color: "#333", marginBottom: 20, fontSize: "large", textAlign: "center" }}>
        {title}
      </h3>

      {/* Filter Tahun & Switch Merge */}
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 20 }}>
        <DatePicker
            picker="year"
            value={dayjs(`${year}-01-01`, 'YYYY-MM-DD')}
            onChange={handleYearChange}
          />
        
        {/* Tombol Merge/Unmerge */}
        <Switch 
          checked={isMerged} 
          onChange={() => setIsMerged(!isMerged)} 
          checkedChildren="Merge" 
          unCheckedChildren="Unmerge" 
        />
      </div>

      {/* Checkbox Pilihan Tambak atau Placeholder */}
      <div style={{ textAlign: "center", marginBottom: 20, minHeight: 40 }}>
        {isMerged ? (
          <div style={{ height: 40 }}></div> // Placeholder agar tinggi tetap
        ) : (
          <Checkbox.Group
            options={allTambak.map((tambak, index) => ({
              label: tambak,
              value: tambak,
              key: `checkbox-${tambak}-${index}` // Tambahkan key unik
            }))}
            value={selectedTambak}
            onChange={setSelectedTambak}
          />
        )}
      </div>


      {isLoading ? (
        <div style={{ textAlign: "center" }}>
          <Spin />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 80, bottom: 5 }} barCategoryGap="10%">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="namaBulan" />
            <YAxis 
              label={{ 
                value: "Total Panen (Ton)", 
                angle: -90, 
                position: "insideLeft", 
                dx: -60 // Lebih ke kiri
              }}
              tickFormatter={(value) => new Intl.NumberFormat("id-ID").format(value) + " Ton"}
            />
            <Tooltip/>
            <Legend />

            {/* Jika merge aktif, tampilkan total panen sebagai satu bar */}
            {isMerged ? (
              <>
                <Bar key="bar-total" dataKey="total" fill="#8884d8" name="Total Panen" barSize={50} />
                <Line key="line-total" type="monotone" dataKey="total" stroke="#ff7300" strokeWidth={2} name="Total Panen" />
              </>
            ) : (
              // Jika tidak merge, tampilkan setiap tambak
              selectedTambak.map((tambak, index) => (
                <Bar 
                  key={`bar-${tambak}-${index}`} 
                  dataKey={tambak} 
                  fill={tambakColors[tambak]} 
                  name={tambak} 
                  barSize={50}
                />
              ))
            )}

            {/* Jika tidak merge, tampilkan garis untuk setiap tambak */}
            {!isMerged && selectedTambak.map((tambak, index) => (
              <Line 
                key={`line-${tambak}-${index}`} 
                type="monotone" 
                dataKey={tambak} 
                stroke={tambakColors[tambak]} 
                strokeWidth={2} 
                legendType="none"
              />
            ))}
          </ComposedChart>

        </ResponsiveContainer>
      )}
    </div>
  );
}