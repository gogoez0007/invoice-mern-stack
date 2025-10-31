// src/pages/HolidayCalendarYear.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
    Badge,
    Button,
    Card,
    Calendar,
    DatePicker,
    Divider,
    Empty,
    Form,
    Input,
    Modal,
    Popconfirm,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Tooltip,
    Typography,
    message,
} from "antd";
import {
    CalendarOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    SaveOutlined,
    SearchOutlined,
    FilterOutlined,
    LeftOutlined,
    RightOutlined,
    DoubleLeftOutlined,
    DoubleRightOutlined,
    AimOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import { API_BASE_URL } from "@/config/serverApiConfig";
import storePersist from "@/redux/storePersist";

const { Title, Text } = Typography;

// ====== Auth header helper ======
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

const JENIS_META = {
    LIBUR_NASIONAL: { label: "Libur Nasional", color: "magenta" },
    CUTI_BERSAMA: { label: "Cuti Bersama", color: "gold" },
};
const JENIS_OPTIONS = Object.entries(JENIS_META).map(([value, { label }]) => ({
    value,
    label,
}));

const fmt = (d) => dayjs(d).format("YYYY-MM-DD");

export default function HolidayCalendarYear() {
    // Kalender (panel) yang ditampilkan
    const [monthVal, setMonthVal] = useState(dayjs());

    // Data libur (1 tahun penuh dari year pada monthVal)
    const [loading, setLoading] = useState(false);
    const [yearRows, setYearRows] = useState([]); // seluruh libur dalam tahun
    const [mapByDate, setMapByDate] = useState({}); // { 'YYYY-MM-DD': [rows] }

    // Modal form/create-edit
    const [modalOpen, setModalOpen] = useState(false);
    const [modalBusy, setModalBusy] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null); // dayjs
    const [editing, setEditing] = useState(null); // row object
    const [form] = Form.useForm();

    // Filter list tahunan (✅ hanya dideklarasikan sekali)
    const [filterJenis, setFilterJenis] = useState(null);
    const [search, setSearch] = useState("");

    const currentYear = monthVal.year();
    const rangeYear = useMemo(
        () => ({
            from: dayjs(`${currentYear}-01-01`).format("YYYY-MM-DD"),
            to: dayjs(`${currentYear}-12-31`).format("YYYY-MM-DD"),
        }),
        [currentYear]
    );

    const buildMap = (rows) => {
        const m = {};
        for (const r of rows || []) {
            const key = fmt(r.tanggal);
            if (!m[key]) m[key] = [];
            m[key].push(r);
        }
        return m;
    };

    const fetchYear = async () => {
        try {
            setLoading(true);
            includeToken();
            const { data } = await axios.get("hari-libur", {
                params: { from: rangeYear.from, to: rangeYear.to, sort: "asc" },
            });
            const rows = Array.isArray(data) ? data : [];
            setYearRows(rows);
            setMapByDate(buildMap(rows));
        } catch (e) {
            console.error(e);
            message.error(e?.response?.data?.message || "Gagal memuat hari libur");
            setYearRows([]);
            setMapByDate({});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchYear();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rangeYear.from, rangeYear.to]);

    // ===== Kalender (atas) =====
    const dateBadges = (date) => {
        const rows = mapByDate[fmt(date)] || [];
        if (!rows.length) return null;
        return (
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
                {rows.slice(0, 3).map((r) => (
                    <Tag
                        key={r.id}
                        color={JENIS_META[r.jenis]?.color || "blue"}
                        style={{ width: "100%" }}
                    >
                        <Tooltip title={r.nama + (r.keterangan ? ` — ${r.keterangan}` : "")}>
                            {JENIS_META[r.jenis]?.label || r.jenis}
                        </Tooltip>
                    </Tag>
                ))}
                {rows.length > 3 && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        +{rows.length - 3} lagi
                    </Text>
                )}
            </Space>
        );
    };

    const dateFullCellRender = (value) => {
        const rows = mapByDate[fmt(value)] || [];
        const has = rows.length > 0;
        const isToday = value.isSame(dayjs(), "day");
        return (
            <div
                className={`custom-date-cell ${has ? "is-holiday" : ""} ${isToday ? "is-today" : ""}`}
                onClick={() => onDateClick(value)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") onDateClick(value); }}
            >
                <div className="date-top">
                    <span className="date-text">{value.date()}</span>
                    {isToday && <Badge status="processing" />}
                </div>
                <div className="date-content">{dateBadges(value)}</div>
            </div>
        );
    };

    const onDateClick = (value) => {
        setSelectedDate(value);
        setEditing(null);
        setModalOpen(true);
        // preload form defaults
        form.setFieldsValue({
            tanggal: value,
            jenis: undefined,
            nama: "",
            keterangan: "",
        });
    };

    // ===== Modal Create/Edit =====
    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        form.resetFields();
    };

    const onSubmit = async () => {
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
                message.success("Hari libur diperbarui");
            } else {
                await axios.post("hari-libur", payload);
                message.success("Hari libur ditambahkan");
            }
            await fetchYear();
            setEditing(null);
            // tetap buka modal (biar bisa tambah lagi cepat)
            form.setFieldsValue({
                tanggal: dayjs(payload.tanggal),
                jenis: undefined,
                nama: "",
                keterangan: "",
            });
        } catch (e) {
            if (e?.errorFields) return; // form validation error
            if (e?.response?.status === 409) {
                message.warning("Tanggal & jenis sudah terdaftar");
            } else if (e?.response?.data?.message) {
                message.error(e.response.data.message);
            } else {
                console.error(e);
                message.error("Gagal menyimpan");
            }
        } finally {
            setModalBusy(false);
        }
    };

    const onEditRow = (row) => {
        setSelectedDate(dayjs(row.tanggal));
        setEditing(row);
        setModalOpen(true);
        form.setFieldsValue({
            tanggal: dayjs(row.tanggal),
            jenis: row.jenis,
            nama: row.nama,
            keterangan: row.keterangan || "",
        });
    };

    const onDeleteRow = async (row) => {
        try {
            setModalBusy(true);
            includeToken();
            await axios.delete(`hari-libur/${row.id}`);
            message.success("Berhasil dihapus");
            await fetchYear();
        } catch (e) {
            console.error(e);
            message.error(e?.response?.data?.message || "Gagal menghapus");
        } finally {
            setModalBusy(false);
        }
    };

    // ===== List (bawah) =====
    const filteredRows = useMemo(() => {
        let rows = [...yearRows];
        if (filterJenis) rows = rows.filter((r) => r.jenis === filterJenis);
        if (search?.trim()) {
            const q = search.trim().toLowerCase();
            rows = rows.filter(
                (r) =>
                    r.nama?.toLowerCase().includes(q) ||
                    r.keterangan?.toLowerCase().includes(q)
            );
        }
        return rows.sort(
            (a, b) => dayjs(a.tanggal).valueOf() - dayjs(b.tanggal).valueOf()
        );
    }, [yearRows, filterJenis, search]);

    const columns = [
        {
            title: "Tanggal",
            dataIndex: "tanggal",
            width: 140,
            render: (v) => <Tag color="geekblue">{dayjs(v).format("YYYY-MM-DD")}</Tag>,
            sorter: (a, b) => dayjs(a.tanggal).valueOf() - dayjs(b.tanggal).valueOf(),
            defaultSortOrder: "ascend",
        },
        {
            title: "Jenis",
            dataIndex: "jenis",
            width: 180,
            render: (v) => (
                <Tag color={JENIS_META[v]?.color || "blue"}>
                    {JENIS_META[v]?.label || v}
                </Tag>
            ),
            filters: JENIS_OPTIONS.map((o) => ({ text: o.label, value: o.value })),
            onFilter: (val, r) => r.jenis === val,
        },
        { title: "Nama", dataIndex: "nama" },
        {
            title: "Keterangan",
            dataIndex: "keterangan",
            ellipsis: true,
            render: (v) => v || <span style={{ opacity: 0.5 }}>—</span>,
        },
        {
            title: "Aksi",
            width: 160,
            render: (_, r) => (
                <Space>
                    <Tooltip title="Edit">
                        <Button size="small" icon={<EditOutlined />} onClick={() => onEditRow(r)} />
                    </Tooltip>
                    <Popconfirm title="Hapus libur ini?" onConfirm={() => onDeleteRow(r)} okText="Ya" cancelText="Batal">
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            {/* HEADER / HERO */}
            <Card
                style={{
                    marginBottom: 16,
                    borderRadius: 16,
                    background:
                        "linear-gradient(135deg, rgba(59,130,246,1) 0%, rgba(16,185,129,1) 50%, rgba(249,115,22,1) 100%)",
                    color: "#fff",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                }}
                bodyStyle={{ padding: 18 }}
            >
                <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <Space>
                        <CalendarOutlined style={{ color: "#fff" }} />
                        <Title level={4} style={{ margin: 0, color: "#fff" }}>
                            Manajer Hari Libur — Kalender & Daftar Tahunan
                        </Title>
                    </Space>
                    <Space>
                        <DatePicker
                            picker="month"
                            allowClear={false}
                            value={monthVal}
                            onChange={(v) => setMonthVal(v || dayjs())}
                            format="MMMM YYYY"
                            style={{ width: 220 }}
                        />
                        <Button ghost icon={<ReloadOutlined />} onClick={fetchYear} style={{ borderColor: "#fff", color: "#fff" }}>
                            Refresh
                        </Button>
                    </Space>
                </Space>
            </Card>

            {/* KALENDER (ATAS) + custom header prev/next */}
            <Card style={{ borderRadius: 14 }} className="shadow-sm">
                <Spin spinning={loading} tip="Memuat kalender…">
                    <Calendar
                        value={monthVal}
                        onPanelChange={(val) => setMonthVal(val)}
                        dateFullCellRender={dateFullCellRender}
                        headerRender={({ value, onChange }) => {
                            const curr = value.clone();
                            const go = (unit, step) => {
                                const v = curr.add(step, unit);
                                onChange(v);
                                setMonthVal(v);
                            };
                            const goToday = () => {
                                onChange(dayjs());
                                setMonthVal(dayjs());
                            };
                            return (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 8px 16px" }}>
                                    <Space>
                                        <Button size="small" icon={<DoubleLeftOutlined />} onClick={() => go("year", -1)}>
                                            Prev Year
                                        </Button>
                                        <Button size="small" icon={<LeftOutlined />} onClick={() => go("month", -1)}>
                                            Prev
                                        </Button>
                                    </Space>
                                    <Space>
                                        <Title level={5} style={{ margin: 0 }}>
                                            {curr.format("MMMM YYYY")}
                                        </Title>
                                        <Button size="small" icon={<AimOutlined />} onClick={goToday}>
                                            Today
                                        </Button>
                                    </Space>
                                    <Space>
                                        <Button size="small" onClick={() => go("month", 1)}>
                                            Next <RightOutlined />
                                        </Button>
                                        <Button size="small" onClick={() => go("year", 1)}>
                                            Next Year <DoubleRightOutlined />
                                        </Button>
                                    </Space>
                                </div>
                            );
                        }}
                    />
                </Spin>
            </Card>

            {/* LIST TAHUNAN (BAWAH) */}
            <Card style={{ borderRadius: 14, marginTop: 12 }} className="shadow-sm">
                <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
                    <Space wrap>
                        <Tag color="processing" icon={<FilterOutlined />}>
                            Tahun {currentYear}
                        </Tag>
                        <Select
                            allowClear
                            placeholder="Filter jenis"
                            value={filterJenis}
                            onChange={setFilterJenis}
                            options={JENIS_OPTIONS}
                            style={{ width: 200 }}
                        />
                        <Input
                            allowClear
                            style={{ width: 260 }}
                            placeholder="Cari nama/keterangan…"
                            prefix={<SearchOutlined />}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </Space>

                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setSelectedDate(monthVal);
                            setEditing(null);
                            setModalOpen(true);
                            form.setFieldsValue({
                                tanggal: monthVal,
                                jenis: undefined,
                                nama: "",
                                keterangan: "",
                            });
                        }}
                    >
                        Add Hari Libur
                    </Button>
                </Space>

                <Divider style={{ margin: "12px 0" }} />

                <Table
                    rowKey="id"
                    dataSource={filteredRows}
                    columns={columns}
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    locale={{
                        emptyText: (
                            <Empty description={`Tidak ada libur di tahun ${currentYear}`} imageStyle={{ height: 64 }} />
                        ),
                    }}
                />
            </Card>

            {/* MODAL CREATE/EDIT */}
            <Modal open={modalOpen} title={editing ? "Edit Hari Libur" : "Tambah Hari Libur"} onCancel={closeModal} footer={null} destroyOnClose>
                <Form form={form} layout="vertical" initialValues={{ tanggal: selectedDate || monthVal }} onFinish={onSubmit}>
                    <Form.Item
                        label="Tanggal"
                        name="tanggal"
                        rules={[{ required: true, message: "Tanggal wajib" }]}
                        tooltip="Klik untuk ganti tanggal jika perlu"
                    >
                        <DatePicker style={{ width: 220 }} />
                    </Form.Item>
                    <Form.Item label="Jenis" name="jenis" rules={[{ required: true, message: "Jenis wajib" }]}>
                        <Select options={JENIS_OPTIONS} placeholder="Pilih jenis" />
                    </Form.Item>
                    <Form.Item label="Nama" name="nama" rules={[{ required: true, message: "Nama libur wajib" }]}>
                        <Input placeholder="Mis. Hari Raya Idul Fitri" />
                    </Form.Item>
                    <Form.Item label="Keterangan" name="keterangan">
                        <Input.TextArea rows={3} placeholder="Opsional" />
                    </Form.Item>
                    <Space>
                        <Button icon={<SaveOutlined />} type="primary" htmlType="submit" loading={modalBusy}>
                            Simpan
                        </Button>
                        <Button onClick={closeModal} disabled={modalBusy}>
                            Tutup
                        </Button>
                    </Space>
                </Form>

                <Divider />
                <Title level={5} style={{ marginTop: 0 }}>
                    {dayjs(selectedDate || monthVal).format("dddd, DD MMMM YYYY")}
                </Title>
                {(mapByDate[fmt(selectedDate || monthVal)] || []).length === 0 ? (
                    <Text type="secondary">Belum ada libur pada tanggal ini.</Text>
                ) : (
                    <Space direction="vertical" style={{ width: "100%" }}>
                        {(mapByDate[fmt(selectedDate || monthVal)] || []).map((r) => (
                            <Card key={r.id} size="small" style={{ borderRadius: 12, background: "#fafafa" }} bodyStyle={{ padding: 12 }}>
                                <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
                                    <Space>
                                        <Tag color={JENIS_META[r.jenis]?.color || "blue"}>{JENIS_META[r.jenis]?.label || r.jenis}</Tag>
                                        <Text strong>{r.nama}</Text>
                                    </Space>
                                    <Space>
                                        <Tooltip title="Edit">
                                            <Button size="small" icon={<EditOutlined />} onClick={() => onEditRow(r)} />
                                        </Tooltip>
                                        <Popconfirm title="Hapus libur ini?" onConfirm={() => onDeleteRow(r)} okText="Ya" cancelText="Batal">
                                            <Button size="small" danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                    </Space>
                                </Space>
                                {r.keterangan ? (
                                    <Text type="secondary" style={{ display: "block", marginTop: 6 }}>
                                        {r.keterangan}
                                    </Text>
                                ) : null}
                            </Card>
                        ))}
                    </Space>
                )}
            </Modal>

            {/* Styles */}
            <style>{`
        .ant-card.shadow-sm { box-shadow: 0 6px 18px rgba(0,0,0,0.08); }
        .custom-date-cell { cursor: pointer; min-height: 90px; border-radius: 10px; padding: 6px; transition: all .2s ease; display: flex; flex-direction: column; }
        .custom-date-cell:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
        .custom-date-cell .date-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .custom-date-cell .date-text { font-weight: 600; }
        .custom-date-cell.is-today { outline: 2px dashed #60a5fa; outline-offset: 2px; }
        .custom-date-cell.is-holiday { background: linear-gradient(135deg, rgba(253,186,116,0.15), rgba(190,242,100,0.18)); }
        .ant-picker-cell-inner { padding: 2px !important; }
      `}</style>
        </>
    );
}
