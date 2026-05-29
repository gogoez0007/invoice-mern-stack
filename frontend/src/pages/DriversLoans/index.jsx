import React, { useEffect, useMemo, useState } from "react"
import {
    Button,
    Input,
    Space,
    Table,
    Card,
    Tag,
    Typography,
    message,
    Dropdown,
    Modal,
    Descriptions,
    Divider,
} from "antd"
import {
    ReloadOutlined,
    SearchOutlined,
    FileTextOutlined,
    ArrowLeftOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    DownOutlined,
} from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import dayjs from "dayjs"
import { useSelector } from "react-redux"
import { selectCurrentAdmin } from "@/redux/auth/selectors"


const { Title, Text } = Typography
const DRIVER_LOAN_API = "https://apimitra.delmargroup.co.id/api/driversLoans"


export default function DriverLoanIndex() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [rows, setRows] = useState([])
    const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0 })
    const [q, setQ] = useState("")

    // ===== DETAIL MODAL =====
    const [openDetail, setOpenDetail] = useState(false)
    const [detail, setDetail] = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const currentAdmin = useSelector(selectCurrentAdmin)
    const isAdminCban = ["dewi3515"]

    const isCban = isAdminCban.includes(currentAdmin?.username)

    // ================= FETCH LIST =================
    const fetchData = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get(DRIVER_LOAN_API)
            setRows(Array.isArray(data) ? data : [])
            setMeta(m => ({ ...m, total: data.length }))
        } catch {
            message.error("Gagal memuat data pinjaman")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // ================= DETAIL =================
    const openDetailModal = async (loanId) => {
        try {
            setDetailLoading(true)
            setOpenDetail(true)
            const { data } = await axios.get(`${DRIVER_LOAN_API}/${loanId}`)
            setDetail(data)
        } catch {
            message.error("Gagal memuat detail pinjaman")
            setOpenDetail(false)
        } finally {
            setDetailLoading(false)
        }
    }

    // ================= ACTION =================
    const handleApprove = async (row) => {
        if (row.status !== "draft") return message.warning("Sudah diproses")
        await axios.post(`${DRIVER_LOAN_API}/${row.loan_id}/approve`)
        message.success("Pinjaman di-approve")
        fetchData()
    }

    const handleReject = (row) => {
        Modal.confirm({
            title: "Reject pinjaman?",
            okType: "danger",
            onOk: async () => {
                await axios.delete(`${DRIVER_LOAN_API}/${row.loan_id}`)
                message.success("Pinjaman direject")
                fetchData()
            },
        })
    }

    const handleRowAction = (key, row) => {
        if (key === "detail") openDetailModal(row.loan_id)
        if (key === "approve") handleApprove(row)
        if (key === "reject") handleReject(row)
    }

    // ================= COLUMNS =================
    const columns = useMemo(() => [
        { title: "No", render: (_, __, i) => i + 1, width: 60 },
        {
            title: "No Pinjaman",
            dataIndex: "loan_number",
            render: v => <Tag color="blue">{v}</Tag>,
        },
        {
            title: "Driver",
            dataIndex: "driver_name",
            render: v => <Text strong>{v}</Text>,
        },
        {
            title: "NIK",
            dataIndex: "driver_ktp",
            render: v => <Text code>{v}</Text>,
        },
        {
            title: "Nominal",
            dataIndex: "loan_amount",
            render: v => `Rp ${Number(v).toLocaleString("id-ID")}`,
        },
        {
            title: "Status",
            dataIndex: "status",
            render: v =>
                v === "draft" ? <Tag color="gold">Draft</Tag> :
                    v === "running" ? <Tag color="green">Running</Tag> :
                        v === "paid" ? <Tag color="blue">Lunas</Tag> :
                            <Tag color="red">{v}</Tag>,
        },
        {
            title: "Aksi",
            render: (_, r) => {
                const disabled = r.status !== "draft" || isCban
                return (
                    <Dropdown
                        trigger={["click"]}
                        menu={{
                            onClick: ({ key }) => handleRowAction(key, r),
                            items: [
                                { key: "detail", label: "Lihat Detail", icon: <EyeOutlined /> },
                                { key: "approve", label: "Approve", disabled, icon: <CheckCircleOutlined /> },
                                { type: "divider" },
                                { key: "reject", label: "Reject", danger: true, disabled, icon: <CloseCircleOutlined /> },
                            ],
                        }}
                    >
                        <Button size="small">Aksi <DownOutlined /></Button>
                    </Dropdown>
                )
            },
        },
    ], [])

    return (
        <>
            {/* HEADER */}
            <Card style={{ marginBottom: 16, borderRadius: 12 }}>
                <Space style={{ justifyContent: "space-between", width: "100%" }}>
                    <Title level={4}>Approval Pinjaman Driver</Title>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Kembali</Button>
                </Space>
            </Card>

            {/* TABLE */}
            <Card>
                <Space style={{ marginBottom: 16 }}>
                    <Input.Search
                        placeholder="Cari No Pinjaman / NIK / Nama"
                        onSearch={setQ}
                        style={{ width: 300 }}
                    />
                    <Button icon={<ReloadOutlined />} onClick={fetchData}>Reload</Button>
                </Space>

                <Table
                    rowKey="loan_id"
                    columns={columns}
                    dataSource={rows}
                    loading={loading}
                />
            </Card>

            {/* ================= DETAIL MODAL ================= */}
            <Modal
                open={openDetail}
                title="Detail Pinjaman Driver"
                width={1000}
                footer={null}
                onCancel={() => setOpenDetail(false)}
            >
                {detailLoading || !detail ? null : (
                    <>
                        {/* ================= INFO UTAMA ================= */}
                        <Descriptions bordered size="small" column={2}>
                            <Descriptions.Item label="No Pinjaman">
                                {detail.loan_number}
                            </Descriptions.Item>

                            <Descriptions.Item label="Tanggal Pinjaman">
                                {dayjs(detail.loan_date).format("YYYY-MM-DD")}
                            </Descriptions.Item>

                            <Descriptions.Item label="Nama Driver">
                                {detail.driver_name}
                            </Descriptions.Item>

                            <Descriptions.Item label="NIK">
                                <Text code>{detail.driver_ktp}</Text>
                            </Descriptions.Item>

                            <Descriptions.Item label="Alamat" span={2}>
                                {detail.driver_address}
                            </Descriptions.Item>

                            <Descriptions.Item label="No HP">
                                {detail.driver_phone}
                            </Descriptions.Item>

                            <Descriptions.Item label="Perusahaan">
                                {detail.company_name}
                            </Descriptions.Item>

                            <Descriptions.Item label="Nominal Pinjaman">
                                Rp {Number(detail.loan_amount).toLocaleString("id-ID")}
                            </Descriptions.Item>

                            <Descriptions.Item label="Tenor">
                                {detail.installment_count} bulan
                            </Descriptions.Item>

                            <Descriptions.Item label="Cicilan / Bulan">
                                Rp {Number(detail.installment_amount).toLocaleString("id-ID")}
                            </Descriptions.Item>

                            <Descriptions.Item label="Metode Pembayaran">
                                {detail.payment_method}
                            </Descriptions.Item>

                            <Descriptions.Item label="Bank">
                                {detail.bank_name}
                            </Descriptions.Item>

                            <Descriptions.Item label="No Rekening">
                                {detail.bank_account}
                            </Descriptions.Item>

                            <Descriptions.Item label="Atas Nama">
                                {detail.bank_account_name}
                            </Descriptions.Item>

                            <Descriptions.Item label="Status">
                                <Tag color={detail.status === "running" ? "green" : "gold"}>
                                    {detail.status}
                                </Tag>
                            </Descriptions.Item>

                            <Descriptions.Item label="Dibuat">
                                {dayjs(detail.created_at).format("YYYY-MM-DD HH:mm")}
                            </Descriptions.Item>

                            <Descriptions.Item label="Update Terakhir">
                                {dayjs(detail.updated_at).format("YYYY-MM-DD HH:mm")}
                            </Descriptions.Item>
                        </Descriptions>

                        {/* ================= PERNYATAAN ================= */}
                        <Divider />

                        <div className="border rounded-xl p-4 text-sm leading-relaxed">
                            <h3 className="text-center font-bold mb-3">
                                PENGAJUAN PINJAM UANG
                            </h3>

                            <p>Yang bertanda tangan di bawah ini:</p>

                            <table className="w-full mb-3">
                                <tbody>
                                    <tr>
                                        <td className="w-40">Nama</td>
                                        <td>: {detail.driver_name}</td>
                                    </tr>
                                    <tr>
                                        <td>NIK</td>
                                        <td>: {detail.driver_ktp}</td>
                                    </tr>
                                    <tr>
                                        <td>Alamat</td>
                                        <td>: {detail.driver_address}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <p>
                                mengajukan peminjaman uang sebesar{" "}
                                <b>Rp {Number(detail.loan_amount).toLocaleString("id-ID")}</b>{" "}
                                yang akan dilunasi dengan cara potong ongkos rit sebesar{" "}
                                <b>
                                    Rp {Number(detail.installment_amount).toLocaleString("id-ID")}
                                </b>{" "}
                                dari periode bulan{" "}
                                <b>
                                    {detail.first_payment_month}/{detail.first_payment_year}
                                </b>{" "}
                                sampai bulan{" "}
                                <b>
                                    {
                                        detail.installments?.[detail.installments.length - 1]
                                            ?.period_month
                                    }
                                    /
                                    {
                                        detail.installments?.[detail.installments.length - 1]
                                            ?.period_year
                                    }
                                </b>.
                            </p>

                            <p>
                                Uang pinjaman akan ditransfer ke Bank{" "}
                                <b>{detail.bank_name}</b>, nomor rekening{" "}
                                <b>{detail.bank_account}</b> atas nama{" "}
                                <b>{detail.bank_account_name}</b>.
                            </p>
                        </div>

                        {/* ================= CICILAN ================= */}
                        {/* <Divider />
                        <Title level={5}>Jadwal Cicilan</Title>

                        <Table
                            size="small"
                            rowKey="installment_id"
                            dataSource={detail.installments || []}
                            pagination={false}
                            columns={[
                                {
                                    title: "Periode",
                                    render: r => `${r.period_month}/${r.period_year}`,
                                },
                                {
                                    title: "Nominal",
                                    render: r =>
                                        `Rp ${Number(r.amount).toLocaleString("id-ID")}`,
                                },
                                {
                                    title: "Status",
                                    render: r =>
                                        r.is_paid ? (
                                            <Tag color="green">Lunas</Tag>
                                        ) : (
                                            <Tag>Belum</Tag>
                                        ),
                                },
                            ]}
                        /> */}

                        {/* ================= LAMPIRAN ================= */}
                        <Divider />
                        <Title level={5}>Lampiran</Title>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                                gap: 12,
                            }}
                        >
                            {detail.attachments?.map(a => (
                                <div
                                    key={a.attachment_id}
                                    style={{
                                        border: "1px solid #eee",
                                        borderRadius: 8,
                                        padding: 8,
                                        textAlign: "center",
                                    }}
                                >
                                    <img
                                        src={a.file_url}
                                        alt={a.file_type}
                                        style={{
                                            width: "100%",
                                            height: 160,
                                            objectFit: "cover",
                                            borderRadius: 6,
                                        }}
                                    />
                                    <div style={{ marginTop: 6 }}>
                                        <Tag>{a.file_type}</Tag>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Modal>

        </>
    )
}
