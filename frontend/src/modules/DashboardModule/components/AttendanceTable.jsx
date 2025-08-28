import { useState, useEffect } from "react";
import { Table, DatePicker, Button, Spin, message } from "antd";
import dayjs from "dayjs";
import { request } from "@/request"; // Import request API

export default function AttendanceTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(dayjs()); // Default bulan ini


  const fetchData = async (selectedDate) => {
    setLoading(true);
    try {
      const response = await request.attendance_summary({
        entity: "attendance",
        options: { bulan: selectedDate.format("MM"), tahun: selectedDate.format("YYYY") },
      });

      // Transformasi data agar sesuai dengan format tabel
      const transformedData = response?.data?.map((item) => {
        const attendanceDays = item.attendance.reduce((acc, value, index) => {
          acc[`day_${index + 1}`] = value || "-"; // Jika kosong, tampilkan "-"
          return acc;
        }, {});

        return {
          no: item.no,
          name: item.name,
          department: item.department,
          entitas: item.entitas,
          position: item.position,
          ...attendanceDays, // Gabungkan data absensi
        };
      });

      setData(transformedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Gagal mengambil data.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData(date);
  }, [date]);

  const columns = [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
      width: 60,
      align: "center",
      fixed: "left",
    },
    {
      title: "Nama",
      dataIndex: "name",
      key: "name",
      width: 200,
      fixed: "left",
    },
    {
      title: "Ent.",
      dataIndex: "entitas",
      key: "entitas",
      width: 150,
      fixed: "left",
    },
    {
      title: "Posisi",
      dataIndex: "position",
      key: "position",
      width: 150,
      fixed: "left",
    },
    ...Array.from({ length: 31 }, (_, i) => ({
      title: (i + 1).toString(),
      dataIndex: `day_${i + 1}`,
      key: `day_${i + 1}`,
      width: 50,
      align: "center",
      fixed: "top",
      render: (text) => text || "-",
    })),
  ];


  return (
    <div className="whiteBox shadow" style={{ border: "1px solid #ddd", padding: "10px" }}>
      <h3 style={{ marginBottom: 20, textAlign: "center" }}>Ringkasan Absensi</h3>

      <div style={{ marginBottom: 20, display: "flex", justifyContent: "center", gap: 10 }}>
        <DatePicker picker="month" value={date} onChange={(value) => setDate(value)} />
      </div>

      {loading ? (
        <Spin style={{ display: "block", textAlign: "center" }} />
      ) : (
        <Table
          dataSource={data}
          columns={columns}
          rowKey="no"
          bordered
          pagination={false}
          scroll={{ x: "max-content", y: 500 }} // 🚀 Scroll di dalam Table, bukan parent
        />
      )}
    </div>
  );

}
