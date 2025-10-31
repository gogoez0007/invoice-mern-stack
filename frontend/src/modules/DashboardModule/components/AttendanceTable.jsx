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

  // === HOLIDAY META (dari backend) ===
  const [holidayMeta, setHolidayMeta] = useState([]); // [{date,isHoliday,codes,names}]
  const holidayIndex = useMemo(() => {
    const idx = {};
    for (const h of holidayMeta || []) {
      const d = dayjs(h.date);
      if (!d.isValid()) continue;
      if (d.isSame(date, "month")) idx[d.date()] = h; // key = tanggal (1..n)
    }
    return idx;
  }, [holidayMeta, date]);

  // ====== SCALE 1.2x untuk cell absensi ======
  const SCALE = 1.2;
  const DAY_CELL_WIDTH = Math.round(54 * SCALE);
  const DAY_HEADER_PAD = Math.round(6 * SCALE);
  const DAY_CELL_PAD_Y = Math.round(8 * SCALE);
  const DAY_HEADER_FSIZE_DOW = Math.round(12 * SCALE);
  const DAY_HEADER_FSIZE_DATE = Math.round(13 * SCALE);

  // --- helpers untuk leave/holiday ---
  const getBracketCodes = (val) => {
    const m = /^\s*\[([^\]]+)\]/.exec(String(val || ""));
    return m ? m[1].split("+").map((s) => s.trim()) : [];
  };
  // LEAVE = bracket TAPI buka KECUALI jika kodenya LN/CB
  const isLeaveCell = (val) => {
    const m = /^\s*\[([^\]]+)\]\s*$/.exec(String(val || ""));
    if (!m) return false;
    const codes = m[1].split("+").map((s) => s.trim());
    return !codes.every((c) => c === "LN" || c === "CB"); // kalau semua LN/CB → bukan leave
  };
  const hasHolidayCode = (val) => {
    const codes = getBracketCodes(val);
    return codes.some((c) => c === "LN" || c === "CB");
  };

  // filter state
  const [nameFilter, setNameFilter] = useState("");
  const [entitasFilter, setEntitasFilter] = useState(undefined);
  const [positionFilter, setPositionFilter] = useState(undefined);

  const daysInMonth = useMemo(() => date.daysInMonth(), [date]);

  const fetchData = async (selectedDate) => {
    setLoading(true);
    try {
      const resp = await request.attendance_summary({
        entity: "attendance",
        options: { bulan: selectedDate.format("MM"), tahun: selectedDate.format("YYYY") },
      });

      // robust terhadap bentuk respons: bisa {data: {...}} atau langsung {...}
      const payload = resp?.data ?? resp;

      const rowsSrc =
        Array.isArray(payload) ? payload
          : Array.isArray(payload?.data) ? payload.data
            : [];

      const holSrc = payload?.holidayDates ?? []; // [{date,isHoliday,codes,names}]
      setHolidayMeta(holSrc);

      const transformedData =
        rowsSrc.map((item) => {
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
      setRawData([]);
      setHolidayMeta([]);
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

  // warna header hari (ditambah: libur LN/CB override)
  const getHeaderStyleByDay = (d) => {
    const hol = holidayIndex[d.date()];
    if (hol?.isHoliday) {
      // LN/CB: colorful lembut dengan border tipis
      return {
        background: hol.codes?.includes("LN") && hol.codes?.includes("CB")
          ? "linear-gradient(180deg,#fff0f6,#fffbe6)"      // LN+CB
          : hol.codes?.includes("LN")
            ? "linear-gradient(180deg,#fff0f6,#fff7f3)"    // LN
            : "linear-gradient(180deg,#fffbe6,#fff7e6)",   // CB
        color: "#1f1f1f",
        borderBottom: "1px solid #ffd666",
      };
    }
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

  // kolom hari: 1.2x lebih besar + styling: LEAVE > HOLIDAY > Weekend/Normal
  const dayColumns = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = date.date(i + 1);
      const isWeekend = d.day() === 0 || d.day() === 6;
      const hol = holidayIndex[d.date()];
      const headStyle = getHeaderStyleByDay(d);

      const titleContent = (
        <div style={{ lineHeight: 1.1, textAlign: "center" }}>
          <div
            style={{
              fontSize: DAY_HEADER_FSIZE_DOW,
              fontWeight: 700,
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            {d.format("ddd")}
          </div>
          <div style={{ fontSize: DAY_HEADER_FSIZE_DATE }}>{d.format("D")}</div>
          {hol?.isHoliday && (
            <div style={{ marginTop: 2 }}>
              {hol.codes?.map((c) => (
                <Tag
                  key={c}
                  color={c === "LN" ? "magenta" : "gold"}
                  style={{ padding: "0 6px", margin: "2px 2px 0", fontSize: 11, lineHeight: "18px" }}
                >
                  {c}
                </Tag>
              ))}
            </div>
          )}
        </div>
      );

      return {
        title: hol?.isHoliday && hol?.names?.length
          ? <Tooltip title={hol.names.join(", ")}>{titleContent}</Tooltip>
          : titleContent,
        dataIndex: `day_${i + 1}`,
        key: `day_${i + 1}`,
        width: DAY_CELL_WIDTH,
        align: "center",
        onHeaderCell: () => ({
          style: { ...headStyle, borderInline: "1px solid #f0f0f0", padding: DAY_HEADER_PAD },
        }),
        onCell: (record) => {
          const raw = record[`day_${i + 1}`];
          const leave = isLeaveCell(raw);
          const holidayDay = !!hol?.isHoliday || hasHolidayCode(raw);

          // base style
          const base = {
            paddingTop: DAY_CELL_PAD_Y,
            paddingBottom: DAY_CELL_PAD_Y,
            background: isWeekend ? "#fafafa" : "#ffffff",
          };

          // priority: leave > holiday > base
          if (leave) {
            return {
              style: {
                ...base,
                background: "linear-gradient(180deg,#fffbe6,#fff1b8)",
                color: "#ad6800",
                fontWeight: 700,
                borderInline: "1px solid #ffe58f",
              },
            };
          }
          if (holidayDay) {
            return {
              style: {
                ...base,
                background: "linear-gradient(180deg,#f6ffed,#e6fffb)",
                color: "#135200",
                fontWeight: 600,
                borderInline: "1px solid #b7eb8f",
              },
            };
          }
          return { style: base };
        },
        render: (text) => {
          const leave = isLeaveCell(text);
          const isHoliday = hasHolidayCode(text);
          // tampilkan tanpa bracket bila leave/holiday-only
          if (leave || isHoliday) {
            const codes = getBracketCodes(text).join("+");
            // jika ada jam sesudah prefix, tetap render semuanya
            const after = String(text || "").replace(/^\s*\[[^\]]+\]\s*/, "").trim();
            return (
              <span style={{ fontWeight: 700 }}>
                {codes}
                {after ? ` ${after}` : ""}
              </span>
            );
          }
          const display = text || "-";
          return <span style={{ fontWeight: display !== "-" ? 600 : 400 }}>{display}</span>;
        },
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    daysInMonth,
    date,
    holidayIndex,
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
          background: "linear-gradient(135deg, #1677ff 0%, #69b1ff 40%, #95de64 100%)",
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
          <Tooltip title="Hari Sabtu & Minggu ditandai berbeda. Libur LN/CB juga disorot.">
            <span>Weekend & Holiday highlighted</span>
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
          <Tag color="magenta">LN</Tag>
          <Tag color="gold">CB</Tag>
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
