import { useState, useEffect, useMemo } from "react";
import { Table, DatePicker, Spin, message, Input, Select, Space, Button, Tag, Tooltip } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { request } from "@/request";

dayjs.locale("id");

export default function AttendanceTable() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(dayjs()); // default: bulan ini

  // ====== SCALE 1.2x untuk cell absensi ======
  const SCALE = 1.2;
  const DAY_CELL_WIDTH = Math.round(54 * SCALE);         // sebelumnya 54
  const DAY_HEADER_PAD = Math.round(6 * SCALE);          // padding header kolom hari
  const DAY_CELL_PAD_Y = Math.round(8 * SCALE);          // padding vertikal sel harian
  const DAY_HEADER_FSIZE_DOW = Math.round(12 * SCALE);   // font-size "Sen/Min"
  const DAY_HEADER_FSIZE_DATE = Math.round(13 * SCALE);  // font-size tanggal

  // --- helpers untuk leave ---
  const isLeaveCell = (val) => /^\s*\[[^\]]+\]\s*$/.test(String(val || ""));
  const stripBrackets = (val) => String(val || "").replace(/^\s*\[|\]\s*$/g, "");

  // filter state
  const [nameFilter, setNameFilter] = useState("");
  const [entitasFilter, setEntitasFilter] = useState(undefined);
  const [positionFilter, setPositionFilter] = useState(undefined);

  const daysInMonth = useMemo(() => date.daysInMonth(), [date]);

  const fetchData = async (selectedDate) => {
    setLoading(true);
    try {
      const response = await request.attendance_summary({
        entity: "attendance",
        options: { bulan: selectedDate.format("MM"), tahun: selectedDate.format("YYYY") },
      });

      const transformedData =
        response?.data?.map((item) => {
          const attendanceDays = (item.attendance || []).reduce((acc, value, index) => {
            acc[`day_${index + 1}`] = value ?? "-";
            return acc;
          }, {});
          return {
            no: item.no,
            name: item.name,
            department: item.department,
            entitas: item.entitas,
            position: item.position,
            ...attendanceDays,
          };
        }) ?? [];

      setRawData(transformedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Gagal mengambil data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(date);
    // reset filter saat ganti bulan
    setNameFilter("");
    setEntitasFilter(undefined);
    setPositionFilter(undefined);
  }, [date]);

  // opsi dropdown dari data
  const entitasOptions = useMemo(() => {
    const set = new Set(rawData.map((d) => d.entitas).filter(Boolean));
    return Array.from(set).sort().map((v) => ({ label: v, value: v }));
  }, [rawData]);

  const positionOptions = useMemo(() => {
    const set = new Set(rawData.map((d) => d.position).filter(Boolean));
    return Array.from(set).sort().map((v) => ({ label: v, value: v }));
  }, [rawData]);

  // apply filter
  const data = useMemo(() => {
    const byName = (row) =>
      !nameFilter || (row.name || "").toString().toLowerCase().includes(nameFilter.toLowerCase());
    const byEntitas = (row) => !entitasFilter || row.entitas === entitasFilter;
    const byPosition = (row) => !positionFilter || row.position === positionFilter;
    return rawData.filter((row) => byName(row) && byEntitas(row) && byPosition(row));
  }, [rawData, nameFilter, entitasFilter, positionFilter]);

  const resetFilters = () => {
    setNameFilter("");
    setEntitasFilter(undefined);
    setPositionFilter(undefined);
  };

  // ===== Helpers (wrap 2 kata per baris) =====
  const chunkWords = (text, chunkSize = 2) => {
    const words = String(text || "").trim().split(/\s+/).filter(Boolean);
    const lines = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      lines.push(words.slice(i, i + chunkSize).join(" "));
    }
    return lines.length ? lines : ["-"];
  };

  const StackedText = ({ value, weight = 600 }) => {
    const lines = chunkWords(value, 2);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 2, lineHeight: 1.15 }}>
        {lines.map((ln, idx) => (
          <span key={idx} style={{ fontWeight: weight }}>{ln}</span>
        ))}
      </div>
    );
  };

  const StackedChip = ({ value, color = "blue" }) => {
    const lines = chunkWords(value, 2);
    const bg =
      color === "green"
        ? "linear-gradient(180deg,#f6ffed,#e6fffb)"
        : "linear-gradient(180deg,#f0f5ff,#e6f4ff)";
    const fg = color === "green" ? "#135200" : "#10239E";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {lines.map((ln, idx) => (
          <span
            key={idx}
            style={{
              display: "inline-block",
              padding: "2px 6px",
              borderRadius: 8,
              background: bg,
              color: fg,
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.2,
              border: "1px solid #f0f0f0",
              maxWidth: "100%",
              whiteSpace: "normal",
              wordBreak: "break-word",
            }}
          >
            {ln}
          </span>
        ))}
      </div>
    );
  };

  // warna header hari
  const getHeaderStyleByDay = (d) => {
    if (d.day() === 0) {
      return { background: "linear-gradient(180deg,#ffeaea, #fff5f5)", color: "#d4380d" }; // Minggu
    }
    if (d.day() === 6) {
      return { background: "linear-gradient(180deg,#eef3ff, #f5f8ff)", color: "#1d39c4" }; // Sabtu
    }
    return { background: "linear-gradient(180deg,#f7faff,#ffffff)", color: "#1f1f1f" }; // Sen–Jum
  };

  // ===== Columns =====
  const baseColumns = [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
      width: 56,
      align: "center",
      fixed: "left",
      onHeaderCell: () => ({
        style: { background: "linear-gradient(180deg,#e6f4ff,#ffffff)", fontWeight: 700 },
      }),
    },
    {
      title: "Nama",
      dataIndex: "name",
      key: "name",
      width: 140,
      fixed: "left",
      onHeaderCell: () => ({
        style: { background: "linear-gradient(180deg,#e6f4ff,#ffffff)", fontWeight: 700 },
      }),
      onCell: () => ({
        style: {
          whiteSpace: "normal",
          wordBreak: "break-word",
          lineHeight: 1.15,
          paddingTop: 6,
          paddingBottom: 6,
        },
      }),
      render: (text) => <StackedText value={text} />,
    },
    {
      title: "Entitas",
      dataIndex: "entitas",
      key: "entitas",
      width: 130,
      fixed: "left",
      onHeaderCell: () => ({
        style: { background: "linear-gradient(180deg,#e6f4ff,#ffffff)", fontWeight: 700 },
      }),
      onCell: () => ({
        style: {
          whiteSpace: "normal",
          wordBreak: "break-word",
          lineHeight: 1.15,
          paddingTop: 6,
          paddingBottom: 6,
        },
      }),
      render: (text) => <StackedChip value={text} color="green" />,
    },
    {
      title: "Posisi",
      dataIndex: "position",
      key: "position",
      width: 130,
      fixed: "left",
      onHeaderCell: () => ({
        style: { background: "linear-gradient(180deg,#e6f4ff,#ffffff)", fontWeight: 700 },
      }),
      onCell: () => ({
        style: {
          whiteSpace: "normal",
          wordBreak: "break-word",
          lineHeight: 1.15,
          paddingTop: 6,
          paddingBottom: 6,
        },
      }),
      render: (text) => <StackedChip value={text} color="blue" />,
    },
  ];

  // kolom hari: 1.2x lebih besar + styling khusus untuk leave
  const dayColumns = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = date.date(i + 1);
      const isWeekend = d.day() === 0 || d.day() === 6;
      const headStyle = getHeaderStyleByDay(d);

      return {
        title: (
          <div style={{ lineHeight: 1.1, textAlign: "center" }}>
            <div
              style={{
                fontSize: DAY_HEADER_FSIZE_DOW, // 1.2x
                fontWeight: 700,
                textTransform: "uppercase",
                opacity: 0.85,
              }}
            >
              {d.format("ddd")}
            </div>
            <div style={{ fontSize: DAY_HEADER_FSIZE_DATE }}>{d.format("D")}</div>
          </div>
        ),
        dataIndex: `day_${i + 1}`,
        key: `day_${i + 1}`,
        width: DAY_CELL_WIDTH,      // 1.2x
        align: "center",
        onHeaderCell: () => ({
          style: { ...headStyle, borderInline: "1px solid #f0f0f0", padding: DAY_HEADER_PAD }, // 1.2x
        }),
        // gunakan record agar bisa baca nilai cell untuk styling leave
        onCell: (record) => {
          const raw = record[`day_${i + 1}`];
          const leave = isLeaveCell(raw);
          const base = {
            paddingTop: DAY_CELL_PAD_Y,    // 1.2x
            paddingBottom: DAY_CELL_PAD_Y, // 1.2x
            background: isWeekend ? "#fafafa" : "#ffffff",
          };
          return {
            style: leave
              ? {
                ...base,
                background: "linear-gradient(180deg,#fffbe6,#fff1b8)", // kuning lembut
                color: "#ad6800", // teks kecokelatan
                fontWeight: 700,
                borderInline: "1px solid #ffe58f",
              }
              : base,
          };
        },
        render: (text) => {
          const leave = isLeaveCell(text);
          const display = leave ? stripBrackets(text) : (text || "-");
          return (
            <span style={{ fontWeight: display && display !== "-" ? 600 : 400 }}>
              {display}
            </span>
          );
        },
      };
    });
  }, [
    daysInMonth,
    date,
    DAY_CELL_WIDTH,
    DAY_CELL_PAD_Y,
    DAY_HEADER_PAD,
    DAY_HEADER_FSIZE_DOW,
    DAY_HEADER_FSIZE_DATE,
  ]);

  const columns = [...baseColumns, ...dayColumns];

  return (
    <div style={{ padding: 12 }}>
      {/* Header berwarna */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #1677ff 0%, #69b1ff 40%, #95de64 100%)",
          color: "#fff",
          padding: "14px 16px",
          borderRadius: 14,
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 6px 18px rgba(22,119,255,0.25)",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          Ringkasan Absensi — {date.format("MMMM YYYY")}
        </div>
        <div style={{ opacity: 0.9, fontSize: 12 }}>
          <Tooltip title="Hari Sabtu & Minggu ditandai berbeda">
            <span>Weekend highlighted</span>
          </Tooltip>
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          marginBottom: 12,
          display: "grid",
          gridTemplateColumns: "auto 1fr auto auto auto auto",
          gap: 8,
          alignItems: "center",
        }}
      >
        <DatePicker
          allowClear={false}
          picker="month"
          value={date}
          onChange={(value) => value && setDate(value)}
          style={{ width: 200 }}
        />

        <div />

        <Input
          allowClear
          placeholder="Filter Nama…"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          style={{ width: 200 }}
        />
        <Select
          allowClear
          showSearch
          placeholder="Filter Entitas"
          optionFilterProp="label"
          value={entitasFilter}
          onChange={(v) => setEntitasFilter(v)}
          options={entitasOptions}
          style={{ width: 180 }}
        />
        <Select
          allowClear
          showSearch
          placeholder="Filter Posisi"
          optionFilterProp="label"
          value={positionFilter}
          onChange={(v) => setPositionFilter(v)}
          options={positionOptions}
          style={{ width: 180 }}
        />
        <Button onClick={resetFilters}>Reset</Button>
      </div>

      {/* Legend kecil */}
      <div style={{ marginBottom: 10 }}>
        <Space size="small" wrap>
          <Tag color="red">Minggu</Tag>
          <Tag color="geekblue">Sabtu</Tag>
          <Tag color="gold">Leave Request</Tag>
        </Space>
      </div>

      {/* Tabel */}
      {loading ? (
        <Spin style={{ display: "block", textAlign: "center" }} />
      ) : (
        <Table
          dataSource={data}
          columns={columns}
          rowKey="no"
          bordered
          size="small"
          pagination={false}
          sticky
          scroll={{ x: "max-content", y: 520 }}
          style={{
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
            background: "#ffffff",
          }}
          locale={{ emptyText: "Tidak ada data" }}
        />
      )}
    </div>
  );
}
