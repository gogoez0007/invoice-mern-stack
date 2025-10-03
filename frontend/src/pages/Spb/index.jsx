import React, { useEffect, useMemo, useState } from "react";
import {
    Button, Input, Space, Table, Popconfirm, message, Card, Tag, Typography
} from "antd";
import {
    PlusOutlined, ReloadOutlined, SearchOutlined,
    FileTextOutlined, ArrowLeftOutlined, BarChartOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "@/config/serverApiConfig";
import storePersist from "@/redux/storePersist";
import dayjs from "dayjs";
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

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

// === formatter angka (tanpa currency) ===
const nfID = new Intl.NumberFormat("id-ID");
const fmtInt = (v) => {
    const n = Number(v || 0);
    return nfID.format(Number.isFinite(n) ? n : 0);
};

export default function SPBIndex() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0 });
    const [q, setQ] = useState("");

    const fetchData = async (page = meta.page, pageSize = meta.pageSize, keyword = q) => {
        try {
            setLoading(true);
            includeToken();
            const { data } = await axios.get("spb", {
                params: { page, limit: pageSize, q: keyword || undefined },
            });
            const payload = data.result || data;
            const list = payload.rows || payload.data || [];
            setRows(Array.isArray(list) ? list : []);
            setMeta({
                page: payload.page || page,
                pageSize: payload.limit || pageSize,
                total: payload.total ?? list.length,
            });
        } catch (e) {
            console.error(e);
            message.error("Gagal memuat data SPB");
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
                width: 70,
                render: (_v, _r, i) => (meta.page - 1) * meta.pageSize + i + 1,
            },
            {
                title: "No SPB",
                dataIndex: "no_spb",
                render: (v, r) => (
                    <a onClick={() => navigate(`/spb/read/${r.id}`)}>
                        <strong>{v}</strong>
                    </a>
                ),
            },
            {
                title: "Perusahaan",
                dataIndex: "perusahaan_nama",
                render: (v) => (v ? <Tag color="blue">{v}</Tag> : <Tag>—</Tag>),
            },
            {
                title: "Total Qty",
                dataIndex: "total_qty_kontrak",
                align: "right",
                render: (v) => fmtInt(v), // format ribuan tanpa currency
            },
            {
                title: "Tanggal Kirim",
                key: "tgl",
                render: (_, r) => (
                    <span>
                        {r.tanggal_kirim_awal} — {r.tanggal_kirim_akhir}
                    </span>
                ),
            },
            {
                title: "Dibuat",
                dataIndex: "created_date",
                render: (v) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "-"),
                responsive: ["lg"],
            },
            {
                title: "Aksi",
                width: 260,
                render: (_, r) => (
                    <Space>
                        <Button size="small" onClick={() => navigate(`/spb/read/${r.id}`)}>
                            Lihat
                        </Button>
                        <Button size="small" onClick={() => navigate(`/spb/update/${r.id}`)}>
                            Edit
                        </Button>
                        <Popconfirm
                            title="Hapus SPB ini?"
                            okText="Ya"
                            cancelText="Batal"
                            onConfirm={async () => {
                                try {
                                    includeToken();
                                    await axios.delete(`spb/delete/${r.id}`);
                                    message.success("SPB terhapus");
                                    fetchData(meta.page, meta.pageSize, q);
                                } catch {
                                    message.error("Gagal menghapus SPB");
                                }
                            }}
                        >
                            <Button size="small" danger>
                                Hapus
                            </Button>
                        </Popconfirm>
                    </Space>
                ),
            },
        ],
        [navigate, meta.page, meta.pageSize, q]
    );

    return (
        <>
            {/* Page Header (judul + ikon, colorful) */}
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
                            Permintaan Barang (SPB)
                        </Title>
                    </Space>
                    <Button
                        ghost
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate(-1)}
                    >
                        Kembali
                    </Button>
                </Space>
            </Card>

            {/* Toolbar + Tabel */}
            <Card className="shadow-sm" style={{ borderRadius: 12 }}>
                <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
                    <Space>
                        <Input.Search
                            placeholder="Cari No SPB atau Perusahaan…"
                            allowClear
                            prefix={<SearchOutlined />}
                            onSearch={(val) => {
                                setQ(val);
                                fetchData(1, meta.pageSize, val);
                            }}
                            style={{ width: 320 }}
                        />
                        <Button icon={<ReloadOutlined />} onClick={() => fetchData(meta.page, meta.pageSize, q)}>
                            Reload
                        </Button>
                    </Space>
                    <Link to="/spb/analytics">
                        <Button icon={<BarChartOutlined />}>Analitik Kontrak</Button>
                    </Link>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/spb/create")}>
                        Tambah SPB
                    </Button>
                </Space>

                <Table
                    rowKey="id"
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
                />
            </Card>
        </>
    );
}
