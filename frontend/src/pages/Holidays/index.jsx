// src/pages/HolidayCalendarYear.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    Badge, Button, Card, Calendar, ConfigProvider, DatePicker, Divider, Empty, Form, Input, Modal, Popconfirm, Select, Space, Spin, Table, Tag, Tooltip, Typography, message
} from "antd";
import {
    AimOutlined, CalendarOutlined, CoffeeOutlined, DeleteOutlined, DoubleLeftOutlined, DoubleRightOutlined, EditOutlined, FilterOutlined, FlagOutlined, LeftOutlined, PlusOutlined, ReloadOutlined, RightOutlined, SaveOutlined, SearchOutlined
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import "dayjs/locale/id"; // <-- locale Indonesia untuk dayjs
import idID from "antd/locale/id_ID";
import { API_BASE_URL } from "@/config/serverApiConfig";
import storePersist from "@/redux/storePersist";

// ================== KONFIGURASI LOKAL DAY.JS (SIMPLE & STABIL) ==================
dayjs.extend(updateLocale);
dayjs.locale("id"); // Set locale untuk nama bulan
dayjs.updateLocale("id", {
    weekStart: 1, // Paling penting untuk alignment kalender
    // Paksa nama hari full agar konsisten di seluruh format custom
    weekdays: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
    weekdaysShort: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
    weekdaysMin: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
});
// =================================================================================

// ✅ SOLUSI PASTI: BUAT FUNGSI FORMAT MANUAL
const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function formatTanggalLengkap(tanggal) {
    const d = dayjs(tanggal);
    const namaHari = NAMA_HARI[d.day()]; // Ambil nama hari dari array kita
    return `${namaHari}, ${d.format("DD MMMM YYYY")}`;
}

const { Title, Text } = Typography;
const fmt = (d) => dayjs(d).format("YYYY-MM-DD");

const JENIS_META = {
    LIBUR_NASIONAL: { label: "Libur Nasional", color: "magenta", icon: <FlagOutlined /> },
    CUTI_BERSAMA: { label: "Cuti Bersama", color: "gold", icon: <CoffeeOutlined /> },
};
const JENIS_OPTIONS = Object.entries(JENIS_META).map(([value, { label }]) => ({ value, label }));

function includeToken() {
    axios.defaults.baseURL = API_BASE_URL;
    axios.defaults.withCredentials = true;
    const auth = storePersist.get("auth");
    if (auth?.current?.token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${auth.current.token}`;
    } else {
        delete axios.defaults.headers.common["Authorization"];
    }
}

export default function HolidayCalendarYear() {
    const [loading, setLoading] = useState(false);
    const [monthVal, setMonthVal] = useState(dayjs());
    const [yearRows, setYearRows] = useState([]);
    const [mapByDate, setMapByDate] = useState({});
    const [modalOpen, setModalOpen] = useState(false);
    const [modalBusy, setModalBusy] = useState(false);
    const [editing, setEditing] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [form] = Form.useForm();
    const [filterJenis, setFilterJenis] = useState(null);
    const [search, setSearch] = useState("");

    const currentYear = monthVal.year();
    const rangeYear = useMemo(() => ({
        from: dayjs(`${currentYear}-01-01`).format("YYYY-MM-DD"),
        to: dayjs(`${currentYear}-12-31`).format("YYYY-MM-DD"),
    }), [currentYear]);

    // ====== Override locale AntD supaya header hari = FULL ======
    const antdLocaleWithFullWeekdays = useMemo(() => {
        const FULL = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        return {
            ...idID,
            Calendar: {
                ...(idID.Calendar || {}),
                lang: {
                    ...((idID.Calendar && idID.Calendar.lang) || {}),
                    shortWeekDays: FULL, // rc-picker pakai ini untuk header hari
                    weekDays: FULL,       // fallback tambahan
                },
            },
            DatePicker: {
                ...(idID.DatePicker || {}),
                lang: {
                    ...((idID.DatePicker && idID.DatePicker.lang) || {}),
                    shortWeekDays: FULL,
                    weekDays: FULL,
                },
            },
        };
    }, []);
    // ============================================================

    const fetchYear = useCallback(async () => {
        setLoading(true);
        try {
            includeToken();
            const { data } = await axios.get("hari-libur", { params: { from: rangeYear.from, to: rangeYear.to, sort: "asc" } });
            const rows = Array.isArray(data) ? data : [];
            setYearRows(rows);
            const dateMap = {};
            for (const r of rows) {
                const key = fmt(r.tanggal);
                if (!dateMap[key]) dateMap[key] = [];
                dateMap[key].push(r);
            }
            setMapByDate(dateMap);
        } catch (e) {
            console.error(e);
            message.error(e?.response?.data?.message || "Gagal memuat data hari libur");
        } finally {
            setLoading(false);
        }
    }, [rangeYear.from, rangeYear.to]);

    useEffect(() => {
        fetchYear();
    }, [fetchYear]);

    const showModal = (date, holidayToEdit = null) => {
        setSelectedDate(date);
        setEditing(holidayToEdit);
        setModalOpen(true);
        form.setFieldsValue(holidayToEdit ? {
            tanggal: dayjs(holidayToEdit.tanggal),
            jenis: holidayToEdit.jenis,
            nama: holidayToEdit.nama,
            keterangan: holidayToEdit.keterangan || "",
        } : {
            tanggal: date,
            jenis: undefined,
            nama: "",
            keterangan: "",
        });
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        form.resetFields();
    };

    const onFormSubmit = async () => {
        try {
            const values = await form.validateFields();
            const payload = {
                tanggal: fmt(values.tanggal),
                jenis: values.jenis,
                nama: values.nama?.trim(),
                keterangan: values.keterangan?.trim() || null,
            };
            setModalBusy(true);
            includeToken();
            if (editing) {
                await axios.put(`hari-libur/${editing.id}`, payload);
                message.success("Hari libur berhasil diperbarui");
            } else {
                await axios.post("hari-libur", payload);
                message.success("Hari libur berhasil ditambahkan");
            }
            await fetchYear();
            if (!editing) {
                form.setFieldsValue({ nama: "", keterangan: "" });
            } else {
                closeModal();
            }
        } catch (e) {
            if (e?.errorFields) return;
            message.error(e?.response?.data?.message || "Gagal menyimpan data");
        } finally {
            setModalBusy(false);
        }
    };

    const onDeleteRow = async (row) => {
        try {
            includeToken();
            await axios.delete(`hari-libur/${row.id}`);
            message.success(`"${row.nama}" berhasil dihapus.`);
            await fetchYear();
        } catch (e) {
            console.error(e);
            message.error(e?.response?.data?.message || "Gagal menghapus data");
        }
    };

    const handleDateClick = (date) => {
        if (!date.isSame(monthVal, "month")) return;
        const holidaysOnDate = mapByDate[fmt(date)] || [];
        if (holidaysOnDate.length === 1) {
            showModal(date, holidaysOnDate[0]);
        } else {
            showModal(date, null);
        }
    };

    const dateFullCellRender = (value) => {
        if (!value?.isValid?.()) return null;
        const isToday = value.isSame(dayjs(), "day");
        const isWeekend = [0, 6].includes(value.day());
        const isCurrentMonth = value.isSame(monthVal, "month");
        const holidays = mapByDate[fmt(value)] || [];
        const hasHoliday = holidays.length > 0;
        const cellClasses = ["custom-date-cell", isToday && "is-today", isWeekend && "is-weekend", hasHoliday && "is-holiday", !isCurrentMonth && "is-outside"].filter(Boolean).join(" ");
        return (
            <div className={cellClasses} onClick={() => handleDateClick(value)}>
                <div className="date-number">{value.date()}</div>
                <div className="date-content">
                    {holidays.slice(0, 2).map((r) => (
                        <Tooltip key={r.id} title={r.nama}>
                            <Tag color={JENIS_META[r.jenis]?.color || "blue"} className="holiday-tag">
                                {JENIS_META[r.jenis]?.label}
                            </Tag>
                        </Tooltip>
                    ))}
                    {holidays.length > 2 && <Text type="secondary" className="more-holidays-text">+ {holidays.length - 2} lagi</Text>}
                </div>
            </div>
        );
    };

    const filteredRows = useMemo(() => {
        let rows = [...yearRows];
        if (filterJenis) rows = rows.filter((r) => r.jenis === filterJenis);
        if (search?.trim()) {
            const q = search.trim().toLowerCase();
            rows = rows.filter((r) => r.nama?.toLowerCase().includes(q) || r.keterangan?.toLowerCase().includes(q));
        }
        return rows;
    }, [yearRows, filterJenis, search]);

    const columns = [
        {
            title: "Tanggal",
            dataIndex: "tanggal",
            width: 240,
            // ✅ PANGGIL FUNGSI MANUAL KITA DI SINI
            render: (v) => formatTanggalLengkap(v),
            sorter: (a, b) => dayjs(a.tanggal).valueOf() - dayjs(b.tanggal).valueOf(),
            defaultSortOrder: "ascend",
        },
        {
            title: "Jenis",
            dataIndex: "jenis",
            width: 180,
            render: (v) => <Tag color={JENIS_META[v]?.color || "blue"} icon={JENIS_META[v]?.icon}>{JENIS_META[v]?.label || v}</Tag>,
            filters: JENIS_OPTIONS.map((o) => ({ text: o.label, value: o.value })),
            onFilter: (val, r) => r.jenis === val,
        },
        { title: "Nama", dataIndex: "nama" },
        {
            title: "Aksi",
            width: 120,
            align: "center",
            render: (_, r) => (
                <Space>
                    <Tooltip title="Edit">
                        <Button size="small" icon={<EditOutlined />} onClick={() => showModal(dayjs(r.tanggal), r)} />
                    </Tooltip>
                    <Popconfirm title="Hapus libur ini?" onConfirm={() => onDeleteRow(r)} okText="Ya" cancelText="Batal">
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <ConfigProvider locale={antdLocaleWithFullWeekdays}>
            <>
                <Card
                    style={{ marginBottom: 16, borderRadius: 12, background: "linear-gradient(135deg, #1677ff 0%, #00b96b 100%)", color: "#fff", boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                    bodyStyle={{ padding: "16px 24px" }}
                >
                    <Space style={{ width: "100%", justifyContent: "space-between" }} align="center">
                        <Space>
                            <CalendarOutlined style={{ fontSize: 24 }} />
                            <Title level={4} style={{ margin: 0, color: "#fff" }}>Manage Hari Libur</Title>
                        </Space>
                        <Space>
                            <DatePicker
                                picker="month"
                                allowClear={false}
                                value={monthVal}
                                onChange={(v) => setMonthVal(v || dayjs())}
                                format="MMMM YYYY"
                                style={{ width: 180 }}
                            />
                            <Tooltip title="Muat Ulang Data">
                                <Button ghost icon={<ReloadOutlined />} onClick={fetchYear} loading={loading} />
                            </Tooltip>
                        </Space>
                    </Space>
                </Card>

                <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <Spin spinning={loading} tip="Memuat kalender…">
                        <Calendar
                            mode="month"
                            value={monthVal}
                            onPanelChange={(val) => setMonthVal(val)}
                            dateFullCellRender={dateFullCellRender}
                            headerRender={({ value, onChange }) => (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px 16px" }}>
                                    <Title level={4} style={{ margin: 0 }}>{value.format("MMMM YYYY")}</Title>
                                    <Space.Compact>
                                        <Tooltip title="Tahun Sebelumnya"><Button icon={<DoubleLeftOutlined />} onClick={() => onChange(value.add(-1, "year"))} /></Tooltip>
                                        <Tooltip title="Bulan Sebelumnya"><Button icon={<LeftOutlined />} onClick={() => onChange(value.add(-1, "month"))} /></Tooltip>
                                        <Button onClick={() => onChange(dayjs())}>Hari Ini</Button>
                                        <Tooltip title="Bulan Berikutnya"><Button icon={<RightOutlined />} onClick={() => onChange(value.add(1, "month"))} /></Tooltip>
                                        <Tooltip title="Tahun Berikutnya"><Button icon={<DoubleRightOutlined />} onClick={() => onChange(value.add(1, "year"))} /></Tooltip>
                                    </Space.Compact>
                                </div>
                            )}
                        />
                    </Spin>
                </Card>

                <Card style={{ borderRadius: 12, marginTop: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <Space align="center" style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
                        <Space wrap>
                            <Title level={5} style={{ margin: 0 }}>Daftar Libur Tahun {currentYear}</Title>
                            <Select allowClear placeholder="Filter jenis" value={filterJenis} onChange={setFilterJenis} options={JENIS_OPTIONS} style={{ width: 180 }} />
                            <Input allowClear placeholder="Cari nama libur…" prefix={<SearchOutlined style={{ opacity: 0.5 }} />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 240 }} />
                        </Space>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal(monthVal)}>Tambah Libur</Button>
                    </Space>
                    <Table rowKey="id" dataSource={filteredRows} columns={columns} loading={loading} pagination={{ pageSize: 10, showSizeChanger: true }} />
                </Card>

                <Modal open={modalOpen} title={editing ? "Edit Hari Libur" : "Tambah Hari Libur"} onCancel={closeModal} footer={null} destroyOnClose>
                    <Form form={form} layout="vertical" onFinish={onFormSubmit} style={{ marginTop: 24 }}>
                        <Form.Item label="Tanggal" name="tanggal" rules={[{ required: true, message: "Tanggal wajib diisi" }]}>
                            <DatePicker style={{ width: "100%" }} format="DD MMMM YYYY" />
                        </Form.Item>
                        <Form.Item label="Jenis" name="jenis" rules={[{ required: true, message: "Jenis wajib dipilih" }]}>
                            <Select options={JENIS_OPTIONS} placeholder="Pilih jenis libur" />
                        </Form.Item>
                        <Form.Item label="Nama" name="nama" rules={[{ required: true, message: "Nama libur wajib diisi" }]}>
                            <Input placeholder="Contoh: Hari Kemerdekaan RI" />
                        </Form.Item>
                        <Form.Item label="Keterangan (Opsional)" name="keterangan">
                            <Input.TextArea rows={2} placeholder="Keterangan tambahan jika ada" />
                        </Form.Item>
                        <Space>
                            <Button icon={<SaveOutlined />} type="primary" htmlType="submit" loading={modalBusy}>Simpan</Button>
                            <Button onClick={closeModal} disabled={modalBusy}>Batal</Button>
                        </Space>
                    </Form>
                </Modal>

                <style>{`
          .ant-picker-calendar .ant-picker-cell-inner { padding: 0 !important; }
          .ant-picker-calendar .ant-picker-content th { font-weight: 500; text-align: center; padding-bottom: 8px; }
          /* Pastikan full names muat rapi */
          .ant-picker-calendar .ant-picker-content th,
          .ant-picker-panel   .ant-picker-content th {
            white-space: nowrap;
            font-size: 12px;
          }
          .custom-date-cell { display: flex; flex-direction: column; height: 100%; min-height: 110px; padding: 4px 8px; border-radius: 6px; border: 1px solid #f0f0f0; transition: all 0.2s ease; cursor: pointer; }
          .custom-date-cell:hover { background-color: #e6f4ff; border-color: #91caff; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .custom-date-cell .date-number { text-align: right; font-weight: 600; font-size: 14px; color: #595959; margin-bottom: 4px; }
          .custom-date-cell .date-content { flex-grow: 1; }
          .custom-date-cell .holiday-tag { width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 4px; font-size: 12px; }
          .custom-date-cell .more-holidays-text { font-size: 12px; text-align: center; display: block; }
          .custom-date-cell.is-outside { opacity: 0.35; pointer-events: none; background-color: #f5f5f5; }
          .custom-date-cell.is-weekend:not(.is-holiday) { background-color: #fafafa; }
          .custom-date-cell.is-weekend .date-number { color: #ff4d4f; }
          .custom-date-cell.is-holiday { background-color: #fffbe6; }
          .custom-date-cell.is-today { border: 1px solid #1677ff; }
          .custom-date-cell.is-today .date-number { background-color: #1677ff; color: #fff; border-radius: 50%; width: 24px; height: 24px; line-height: 24px; text-align: center; display: inline-block; float: right; }
        `}</style>
            </>
        </ConfigProvider>
    );
}
