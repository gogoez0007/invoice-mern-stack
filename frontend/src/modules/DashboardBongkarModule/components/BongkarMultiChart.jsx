import { useState, useEffect } from "react";
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
import { DatePicker, Select, Spin, Checkbox, Button } from 'antd';
import dayjs from "dayjs";
import { request } from "@/request";

const { Option } = Select;

export default function BongkarChart({ title }) {
  const [year, setYear] = useState(dayjs());
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [groupByPabrik, setGroupByPabrik] = useState(false);
  const [groupByTambak, setGroupByTambak] = useState(false);
  const [kriteria, setKriteria] = useState('berat_bongkar'); // Default kriteria
  const [groupBy, setGroupBy] = useState('bulanan'); // Default group by

  const kriteriaOptions = [
    { label: 'Berat Bongkar', value: 'berat_bongkar' },
    { label: 'Size', value: 'size' },
    { label: 'Harga', value: 'harga' },
    { label: 'Sub Total', value: 'sub_total' },
  ];

  const groupByOptions = [
    { label: 'Harian', value: 'harian' },
    { label: 'Bulanan', value: 'bulanan' },
    { label: 'Tahunan', value: 'tahunan' },
  ];

  const bulanNames = [
    {label: "Januari", value: 1},
     {label: "Februari", value: 2},
      {label: "Maret", value: 3},
       {label: "April", value: 4},
        {label: "Mei", value: 5},
         {label: "Juni", value: 6},
          {label: "Juli", value: 7},
           {label: "Agustus", value: 8},
            {label: "September", value: 9},
             {label: "Oktober", value: 10},
              {label: "November", value: 11},
               {label: "Desember", value: 12}
  ];

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ background: "#fff", padding: 10, border: "1px solid #ccc" }}>
          <p><strong>{label}</strong></p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: 0 }}>
              {entry.name}: {new Intl.NumberFormat("id-ID").format(entry.value)} {kriteria === 'size' ? 'mm' : kriteria === 'harga' ? '' : 'Kg'}
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
      let params = {
        tahun: dayjs(selectedYear).format('YYYY'),
        kriteria: kriteria,
        groupBy: groupBy,
      };

      if (groupByPabrik) {
        params.groupByPabrik = 'true';
        delete params.groupByTambak;
      } else if (groupByTambak) {
        params.groupByTambak = 'true';
         delete params.groupByPabrik;
      }else{
            delete params.groupByPabrik;
            delete params.groupByTambak;
      }

      if (groupBy === 'harian') {
        params.bulan = dayjs(selectedYear).format('MM');
      }
 console.log("params: ",params)
      const response = await request.bongkarBarchart({
         entity: "bongkar",
         options : params
        });

      let formattedData = [];
      if (kriteria === 'size' || kriteria === 'harga') {
          formattedData = response.flatMap(item => { // Use flatMap to create multiple data points
              const period = item.bulan || item.tanggal || item.tahun;
              return item.pabrik.map(pabrik => {
                  const namaPabrik = pabrik.nama_pabrik || pabrik.nama_grup_tambak;
                  const record = { name: namaPabrik }; // Use pabrik name for xAxis

                  pabrik[kriteria].forEach(sizeData => {
                      const range = Object.keys(sizeData)[0];
                      record[range] = sizeData[range];
                  });

                  return record;
              });
          });
      } else {
          formattedData = response.map(item => ({
              period: item.bulan || item.tanggal || item.tahun,
              [item.nama_pabrik]: item[`total_${kriteria}`],
          }));
      }

      console.log("formattedData: ",formattedData);
      setData(formattedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year, kriteria, groupByPabrik, groupByTambak, groupBy]);

  const allKeys = [...new Set(data.flatMap(item => Object.keys(item).filter(key => key !== 'name')))];
  const pabrikColors = {};
  allKeys.forEach((key, index) => {
      pabrikColors[key] = `hsl(${(index * 77) % 360}, 70%, 50%)`;
  });

  const handleGroupByPabrikChange = (e) => {
    setGroupByPabrik(e.target.checked);
    if (e.target.checked) {
      setGroupByTambak(false);
    }
  };

  const handleGroupByTambakChange = (e) => {
    setGroupByTambak(e.target.checked);
    if (e.target.checked) {
      setGroupByPabrik(false);
    }
  };

  return (
    <div>
      <h3 style={{ color: "#333", marginBottom: 20, fontSize: "large", textAlign: "center" }}>
        {title}
      </h3>

      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 20 }}>
       
      {/* DatePicker yang Disesuaikan */}
      {groupBy !== 'tahunan' ? (
          <DatePicker
            picker={groupBy === 'bulanan' ? "year" : "month"}
            value={year} // Gunakan dayjs() object sebagai value
             onChange={(date) => {
              setYear(date)
              }}
            disabled={groupBy === 'tahunan'}
        />
        ) : null}

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

        <Checkbox 
            checked={groupByPabrik}
            onChange={handleGroupByPabrikChange}
          >
            Group by Pabrik
          </Checkbox>

          <Checkbox
            checked={groupByTambak}
            onChange={handleGroupByTambakChange}
          >
            Group by Tambak
          </Checkbox>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center" }}>
          <Spin />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            width={500}
            height={300}
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={customTooltip} />
            <Legend />
            {allKeys.map(key => (
              <Area key={key} type="monotone" dataKey={key} stackId="a" fill={pabrikColors[key]} name={key} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}