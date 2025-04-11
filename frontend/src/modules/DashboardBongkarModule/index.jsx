import { useState, useEffect } from "react";
import {
  DatePicker,
  Spin,
  Button, Select,
} from "antd";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import { request } from "@/request";

const { Option } = Select;

export default function BongkarChart({ title }) {
  const [year, setYear] = useState(dayjs());
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [groupBy, setGroupBy] = useState('bulanan'); // Default group by adalah bulanan
  const [kriteria, setKriteria] = useState('berat_bongkar');

  // Daftar nama bulan dalam bahasa Indonesia
  const bulanNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ background: "#fff", padding: 10, border: "1px solid #ccc" }}>
          <p><strong>{label}</strong></p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: 0 }}>
              {entry.name}: {new Intl.NumberFormat("id-ID").format(entry.value)}
               {kriteria === 'berat_bongkar' ? 'Kg' : 'Rp'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

    const kriteriaOptions = [
        { label: 'Berat Bongkar', value: 'berat_bongkar' },
        { label: 'Sub Total', value: 'sub_total' },
    ];

    const groupByOptions = [
        { label: 'Harian', value: 'harian' },
        { label: 'Bulanan', value: 'bulanan' },
        { label: 'Tahunan', value: 'tahunan' },
    ];

  const fetchData = async (selectedYear = year) => {
    setIsLoading(true);
    try {
      let params = {
        tahun: dayjs(selectedYear).format('YYYY'),
        kriteria: kriteria,
        groupBy: groupBy,
        groupByPabrik: 'true' // Default: Group by Pabrik selalu aktif
      };

      if (groupBy === 'harian') {
        params.bulan = dayjs(selectedYear).format('MM');
      }

      const response = await request.bongkarBarchart({
        entity: "bongkar",
        options: params,
      });

        let formattedData = [];
        let allPabrik = [];

        if (groupBy === 'harian') {
            const daysInMonth = dayjs(selectedYear).month(dayjs(selectedYear).format('MM') - 1).daysInMonth();
            formattedData = Array.from({ length: daysInMonth }, (_, i) => ({ name: String(i + 1).padStart(2, '0') }));

             response.forEach(item => {
               if (!allPabrik.includes(item.nama_pabrik)) {
                 allPabrik.push(item.nama_pabrik);
               }

               const day = dayjs(item.tanggal).format('DD');
               const record = formattedData.find(d => d.name === day);
               if (record) {
                 record[item.nama_pabrik] = parseFloat(item[`total_${kriteria}`]);
               }
             });

            formattedData.forEach(item => {
              allPabrik.forEach(key => {
                if (!item[key]) {
                  item[key] = 0;
                }
              });
            });

        } else if (groupBy === 'bulanan') {
            formattedData = bulanNames.map(bulan => ({ name: bulan }));

            response.forEach(item => {
              if (!allPabrik.includes(item.nama_pabrik)) {
                allPabrik.push(item.nama_pabrik);
              }
                const monthIndex = parseInt(item.bulan.split('-')[1]) - 1;
                const record = formattedData.find((_, i) => i === monthIndex);
                if (record) {
                    record[item.nama_pabrik] = parseFloat(item[`total_${kriteria}`]);
                }
            });

            formattedData.forEach(item => {
                allPabrik.forEach(key => {
                    if (!item[key]) {
                        item[key] = 0;
                    }
                });
            });
        } else {
            formattedData = response.map(item => {
                const record = { name: item.tahun };
                record[item.nama_pabrik] = parseFloat(item[`total_${kriteria}`]);
                return record;
            });
        }

        /// Urutkan setiap bulan berdasarkan nilai terkecil ke terbesar
        formattedData = formattedData.map(item => {
          const sortedKeys = Object.keys(item)
            .filter(key => key !== "name") // Jangan urutkan key "name"
            .sort((a, b) => item[a] - item[b]); // Urutkan berdasarkan nilai

          // Buat objek baru dengan urutan yang sudah benar
          const sortedItem = { name: item.name };
          sortedKeys.forEach(key => {
            sortedItem[key] = item[key];
          });

          return sortedItem;
        });
        setData(formattedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [year, groupBy,kriteria]);

 const allKeys = data.length > 0 ? Object.keys(data[0]).filter(key => key !== 'name') : [];
  const pabrikColors = {};

  allKeys.forEach((key, index) => {
    const pabrikIndex = allKeys.indexOf(key); // Cari indeks pabrik saat ini di allKeys
    pabrikColors[key] = `hsl(${(pabrikIndex * 77) % 360}, 70%, 50%)`; // Gunakan indeks pabrik untuk menghasilkan warna
  });

  const handleYearChange = (date) => {
    setYear(date);
  };

  return (
    <div>
      <h3 style={{ color: "#333", marginBottom: 20, fontSize: "large", textAlign: "center" }}>
        {title}
      </h3>

      {/* Filter Tahun & Bulan */}
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 20 }}>
        <DatePicker
          picker={groupBy === 'bulanan' ? "year" : "month"}
          value={year}
          onChange={handleYearChange}
        />

          <Select
              value={kriteria}
              style={{ width: 150 }}
              onChange={setKriteria}
          >
              {kriteriaOptions.map(option => (
                  <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
          </Select>

          {/* Tombol GroupBy */}
          <div style={{ display: 'flex', gap: 8 }}>
              {groupByOptions.map(option => (
                  <Button
                      key={option.value}
                      type={groupBy === option.value ? 'primary' : 'default'}
                      onClick={() => setGroupBy(option.value)}
                  >
                      {option.label}
                  </Button>
              ))}
          </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center" }}>
          <Spin />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={customTooltip} />
            <Legend formatter={(value, entry, index) => {
                // Gunakan allKeys untuk menentukan urutan yang benar
                return allKeys[index];
            }}/>
            {allKeys.map(key => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                 stroke={pabrikColors[key]}
                fill={pabrikColors[key]}
                name={key}
                connectNulls={true}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}