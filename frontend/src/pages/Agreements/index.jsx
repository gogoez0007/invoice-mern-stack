// AgreementIndex.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
    Button, Input, Space, Table, Card, Tag, Typography, message,
} from "antd";
import {
    ReloadOutlined, SearchOutlined, FileTextOutlined, ArrowLeftOutlined, EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";

const { Title, Text } = Typography;

// SESUAIKAN: endpoint backend kamu yang balikin array seperti contoh
const AGREEMENT_API_URL = "http://mitra.delmargroup.id:1088/api/agreements";
// URL portal mitra
const AGREEMENT_PORTAL_URL = "http://mitra.delmargroup.id:1077";

// === buka portal berdasarkan NIK (driver_ktp) DI TAB BARU ===
function openAgreementPortal(row) {
    const nik = row?.driver_ktp;
    if (!nik) {
        message.warning("NIK (driver_ktp) tidak tersedia untuk baris ini.");
        return;
    }

    const base = AGREEMENT_PORTAL_URL.replace(/\/+$/, "");
    const url = `${base}/?nik=${encodeURIComponent(nik)}`;

    // Buka tab baru (aman: noopener/noreferrer). Fallback jika popup diblok.
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) {
        try {
            const a = document.createElement("a");
            a.href = url;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch {
            // terakhir, paksa pindah tab yang sama
            window.location.href = url;
        }
    }
}

export default function AgreementIndex() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0 });
    const [q, setQ] = useState("");

    const fetchData = async (page = meta.page, pageSize = meta.pageSize, keyword = q) => {
        try {
            setLoading(true);

            const { data } = await axios.get(AGREEMENT_API_URL);

            // response = array langsung
            let list = Array.isArray(data) ? data : [];

            if (keyword) {
                const kw = keyword.toLowerCase();
                list = list.filter((item) => {
                    return (
                        (item.agreement_number || "").toLowerCase().includes(kw) ||
                        (item.driver_name || "").toLowerCase().includes(kw) ||
                        (item.company_name || "").toLowerCase().includes(kw) ||
                        (item.driver_ktp || "").toLowerCase().includes(kw)
                    );
                });
            }

            setRows(list);
            setMeta({ page, pageSize, total: list.length });
        } catch (e) {
            console.error(e);
            message.error("Gagal memuat data Agreement");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(1, meta.pageSize, "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const columns = useMemo(
        () => [
            {
                title: "No",
                width: 60,
                render: (_v, _r, i) => (meta.page - 1) * meta.pageSize + i + 1,
            },
            {
                title: "No Agreement",
                dataIndex: "agreement_number",
                width: 220,
                render: (v) => (v ? <Tag color="blue">{v}</Tag> : <Tag>—</Tag>),
            },
            {
                title: "Nama Driver",
                dataIndex: "driver_name",
                render: (v) => (v ? <Text strong>{v}</Text> : <Text type="secondary">-</Text>),
            },
            {
                title: "NIK (KTP)",
                dataIndex: "driver_ktp",
                width: 180,
                render: (v) => (v ? <Text code>{v}</Text> : <Text type="secondary">-</Text>),
            },
            {
                title: "Tgl Agreement",
                dataIndex: "agreement_date",
                width: 150,
                render: (v) => (v ? dayjs(v).format("YYYY-MM-DD") : "-"),
            },
            {
                title: "Status",
                dataIndex: "status",
                width: 120,
                render: (v) => {
                    const val = (v || "").toString().toLowerCase();
                    if (val === "active" || val === "aktif") return <Tag color="green">Aktif</Tag>;
                    if (val === "pending") return <Tag color="gold">Pending</Tag>;
                    if (val === "terminated" || val === "nonaktif") return <Tag color="red">Nonaktif</Tag>;
                    return <Tag>{v || "—"}</Tag>;
                },
            },
            {
                title: "Aksi",
                width: 170,
                fixed: "right",
                render: (_, r) => (
                    <Space>
                        <Button
                            size="small"
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={() => openAgreementPortal(r)} // <-- tetap panggil fungsi yang sudah new-tab
                        >
                            Lihat Perjanjian
                        </Button>
                    </Space>
                ),
            },
        ],
        [meta.page, meta.pageSize]
    );

    return (
        <>
            {/* Header */}
            <Card
                className="shadow-sm"
                style={{
                    marginBottom: 16,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)",
                    color: "#fff",
                }}
                bodyStyle={{ padding: 16 }}
            >
                <Space align="center" size={12} style={{ width: "100%", justifyContent: "space-between" }}>
                    <Space size={12}>
                        <FileTextOutlined />
                        <Title level={4} style={{ margin: 0, color: "#fff" }}>
                            Daftar Agreement Mitra
                        </Title>
                    </Space>
                    <Button ghost icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                        Kembali
                    </Button>
                </Space>
            </Card>

            {/* Toolbar + Table */}
            <Card className="shadow-sm" style={{ borderRadius: 12 }}>
                <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
                    <Space>
                        <Input.Search
                            placeholder="Cari No Agreement, NIK, Nama Driver, atau Perusahaan…"
                            allowClear
                            prefix={<SearchOutlined />}
                            onSearch={(val) => {
                                setQ(val);
                                fetchData(1, meta.pageSize, val);
                            }}
                            style={{ width: 400 }}
                        />
                        <Button icon={<ReloadOutlined />} onClick={() => fetchData(meta.page, meta.pageSize, q)}>
                            Reload
                        </Button>
                    </Space>
                </Space>

                <Table
                    rowKey={(r) => r.agreement_id || r.agreement_number}
                    columns={columns}
                    dataSource={rows}
                    loading={loading}
                    pagination={{
                        current: meta.page,
                        pageSize: meta.pageSize,
                        total: meta.total,
                        showSizeChanger: true,
                        onChange: (p, ps) => fetchData(p, ps, q),
                    }}
                    size="middle"
                    scroll={{ x: 900 }}
                />
            </Card>
        </>
    );
}
