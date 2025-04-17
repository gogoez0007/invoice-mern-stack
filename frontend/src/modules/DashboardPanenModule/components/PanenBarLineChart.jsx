import { useState, useEffect } from "react";
import { DatePicker, Spin, Checkbox, Switch, Select } from "antd";
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
const { Option } = Select;

export default function PanenChart({ title }) {
  const [year, setYear] = useState(dayjs().year());
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allTambak, setAllTambak] = useState([]);
  const [selectedTambak, setSelectedTambak] = useState([]);
  const [isMerged, setIsMerged] = useState(false);
  const [selectAllTambak, setSelectAllTambak] = useState(true);  // Untuk mengatur pilih semua tambak

  const bulanNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const mergedData = payload.reduce((acc, entry) => {
        if (!acc[entry.name]) {
          acc[entry.name] = { ...entry, value: 0 };
        }
        acc[entry.name].value += entry.value;
        return acc;
      }, {});

      return (
        <div className="custom-tooltip" style={{ background: "#fff", padding: 10, border: "1px solid #ccc", borderRadius: 5 }}>
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

  const fetchData = async (selectedYear = year) => {
    setIsLoading(true);
    try {
      const response = await request.barchart({
        entity: "panen",
        options: { tahun: selectedYear },
      });

      const months = Array.from({ length: 12 }, (_, i) => ({
        bulan: `${selectedYear}-${String(i + 1).padStart(2, "0")}`,
        namaBulan: bulanNames[i],
      }));

      const formattedData = months.map((monthData) => {
        const monthEntries = response.filter(item => item.bulan === monthData.bulan);

        if (isMerged) {
          const totalPanen = monthEntries.reduce((sum, item) => sum + parseFloat(item.total_berat), 0);
          return { ...monthData, total: totalPanen / 1000 };
        } else {
          const tambakValues = Object.fromEntries(
            monthEntries.map(item => [item.tambak, parseFloat(item.total_berat) / 1000])
          );
          return { ...monthData, ...tambakValues };
        }
      });

      setData(formattedData);

      const tambakList = [...new Set(response.map((item) => item.tambak))];
      setAllTambak(tambakList);
      if (selectAllTambak) {
        setSelectedTambak(tambakList);  // Pilih semua tambak secara default
      }

    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [year, isMerged, selectAllTambak]);

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

  const handleSelectAllTambak = (checked) => {
    setSelectAllTambak(checked);
    setSelectedTambak(checked ? allTambak : []);
  };

  const handleTambakChange = (value) => {
    setSelectedTambak(value);
  };

  return (
    <div
      className="whiteBox shadow"
      style={{
        background: "#f4f7fa", // Ubah warna latar belakang menjadi abu-abu terang
        borderRadius: 16,
        padding: 30,
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
        margin: "20px 0",
      }}>
      <h3 style={{ color: "#333", marginBottom: 20, fontSize: "large", textAlign: "center", fontWeight: "bold" }}>
        {title}
      </h3>

      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 20 }}>
        <DatePicker
          picker="year"
          value={dayjs(`${year}-01-01`, 'YYYY-MM-DD')}
          onChange={handleYearChange}
          style={{ width: 120 }}
        />

        <Switch
          checked={isMerged}
          onChange={() => setIsMerged(!isMerged)}
          checkedChildren="Merge"
          unCheckedChildren="Unmerge"
          style={{ marginTop: 3 }}
        />
      </div>

      {/* Switch untuk Pilih Semua Tambak */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <Switch
          checked={selectAllTambak}
          onChange={handleSelectAllTambak}
          checkedChildren="Pilih Semua Tambak"
          unCheckedChildren="Pilih Beberapa Tambak"
        />
      </div>

      {/* Dropdown untuk memilih tambak jika tidak memilih semua */}
      {!selectAllTambak && (
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Select
            mode="multiple"
            style={{ width: "100%", maxWidth: 500 }}
            placeholder="Pilih Tambak"
            value={selectedTambak}
            onChange={handleTambakChange}
          >
            {allTambak.map((tambak, index) => (
              <Option key={index} value={tambak}>
                {tambak}
              </Option>
            ))}
          </Select>
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Spin size="large" />
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
            <Tooltip content={customTooltip} />
            <Legend verticalAlign="top" height={36} />

            {isMerged ? (
              <>
                <Bar key="bar-total" dataKey="total" fill="#8884d8" name="Total Panen" barSize={50} />
                <Line key="line-total" type="monotone" dataKey="total" stroke="#ff7300" strokeWidth={2} name="Total Panen" />
              </>
            ) : (
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
