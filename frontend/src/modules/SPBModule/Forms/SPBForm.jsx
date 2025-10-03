import React, { useEffect } from 'react';
import {
    Form, Input, InputNumber, DatePicker, Row, Col, Card,
    Button, Space, Divider, Typography
} from 'antd';
import {
    ArrowLeftOutlined, FileTextOutlined, HomeOutlined,
    BarcodeOutlined, CalendarOutlined, PlusOutlined, DeleteOutlined, InboxOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import CompanySelect from '../CompanySelect';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// === Formatting angka (tanpa currency) ===
const nfID = new Intl.NumberFormat('id-ID');
const numberFormatter = (value) => {
    if (value === undefined || value === null || value === '') return '';
    const num = typeof value === 'number' ? value : Number(String(value).replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(num) ? nfID.format(num) : '';
};
const numberParser = (value) => {
    if (value === undefined || value === null || value === '') return '';
    const cleaned = String(value).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    const num = Number(cleaned);
    return Number.isNaN(num) ? '' : num;
};

export default function SPBForm({
    form,
    initialValues,
    onSubmit,
    submitText = 'Simpan',
    title = 'Permintaan Barang (SPB)'
}) {
    const navigate = useNavigate();

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue({
                ...initialValues,
                tanggal_range:
                    initialValues.tanggal_kirim_awal && initialValues.tanggal_kirim_akhir
                        ? [dayjs(initialValues.tanggal_kirim_awal), dayjs(initialValues.tanggal_kirim_akhir)]
                        : undefined,
                items: initialValues.items?.length ? initialValues.items : [{ nama_barang: '', harga_barang: '' }],
            });
        } else {
            form.setFieldsValue({
                items: [{ nama_barang: '', harga_barang: '' }],
            });
        }
    }, [initialValues, form]);

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={(v) => {
                const [awal, akhir] = v.tanggal_range || [];
                onSubmit({
                    perusahaan_id: v.perusahaan_id || null,
                    no_spb: v.no_spb?.trim(),
                    total_qty_kontrak: Number(v.total_qty_kontrak || 0),
                    tanggal_kirim_awal: awal ? dayjs(awal).format('YYYY-MM-DD') : null,
                    tanggal_kirim_akhir: akhir ? dayjs(akhir).format('YYYY-MM-DD') : null,
                    items: (v.items || []).map((it) => ({
                        nama_barang: it.nama_barang,
                        harga_barang: Number(it.harga_barang || 0),
                    })),
                });
            }}
        >
            {/* ===== PAGE HEADER (Colorful) ===== */}
            <Card
                className="shadow-sm"
                style={{
                    marginBottom: 16,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
                    color: '#fff',
                }}
                bodyStyle={{ padding: 16 }}
            >
                <Row justify="space-between" align="middle">
                    <Col>
                        <Space size={12} align="center">
                            <Button
                                ghost
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate(-1)}
                            >
                                Kembali
                            </Button>
                            <Space size={10}>
                                <FileTextOutlined />
                                <Title level={4} style={{ margin: 0, color: '#fff' }}>{title}</Title>
                            </Space>
                        </Space>
                    </Col>
                    <Col>
                        <Button type="primary" htmlType="submit" size="large">
                            {submitText}
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* ===== HEADER INFORMASI SPB ===== */}
            <Card
                className="shadow-sm"
                style={{ marginBottom: 16, borderRadius: 12, borderTop: '3px solid #22d3ee' }}
                title={
                    <Space>
                        <FileTextOutlined style={{ color: '#0ea5e9' }} />
                        <Text strong>Header Informasi</Text>
                    </Space>
                }
            >
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="perusahaan_id"
                            label={
                                <Space size={6}><HomeOutlined />Perusahaan</Space>
                            }
                            rules={[{ required: true, message: 'Perusahaan wajib dipilih' }]}
                        >
                            <CompanySelect style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={12} md={6}>
                        <Form.Item
                            name="no_spb"
                            label={<Space size={6}><FileTextOutlined />No SPB</Space>}
                            rules={[{ required: true, message: 'No SPB wajib' }]}
                        >
                            <Input placeholder="SPB-2025-001" maxLength={50} />
                        </Form.Item>
                    </Col>
                    <Col xs={12} md={6}>
                        <Form.Item
                            name="total_qty_kontrak"
                            label={<Space size={6}><BarcodeOutlined />Total Qty Kontrak</Space>}
                            rules={[{ required: true, message: 'Total qty wajib' }]}
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                min={0}
                                formatter={numberFormatter}
                                parser={numberParser}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="tanggal_range"
                            label={<Space size={6}><CalendarOutlined />Tanggal Kirim (Awal–Akhir)</Space>}
                            rules={[{ required: true, message: 'Tanggal kirim wajib' }]}
                        >
                            <RangePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            {/* ===== DETAIL PERMINTAAN BARANG ===== */}
            <Card
                className="shadow-sm"
                style={{ borderRadius: 12, borderTop: '3px solid #34d399' }}
                title={
                    <Space>
                        <InboxOutlined style={{ color: '#10b981' }} />
                        <Text strong>Detail Permintaan Barang</Text>
                    </Space>
                }
                extra={
                    <Form.List name="items">
                        {(fields, { add }) => (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => add({ nama_barang: '', harga_barang: '' })}
                            >
                                Tambah Baris
                            </Button>
                        )}
                    </Form.List>
                }
            >
                <Form.List name="items">
                    {(fields, { remove }) => (
                        <>
                            {fields.map(({ key, name }) => (
                                <Row key={key} gutter={12} style={{ marginBottom: 8 }}>
                                    <Col span={14}>
                                        <Form.Item
                                            name={[name, 'nama_barang']}
                                            label="Nama Barang"
                                            rules={[{ required: true, message: 'Wajib' }]}
                                        >
                                            <Input placeholder="Nama barang" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            name={[name, 'harga_barang']}
                                            label="Harga"
                                            rules={[{ required: true, message: 'Wajib' }]}
                                        >
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                min={0}
                                                // tanpa currency:
                                                formatter={numberFormatter}
                                                parser={numberParser}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={4} style={{ display: 'flex', alignItems: 'center' }}>
                                        <Button
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => remove(name)}
                                        >
                                            Hapus
                                        </Button>
                                    </Col>
                                </Row>
                            ))}
                        </>
                    )}
                </Form.List>
            </Card>

            {/* ===== STICKY ACTIONS ===== */}
            <div
                style={{
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 9,
                    background: '#ffffffcc',
                    backdropFilter: 'saturate(180%) blur(6px)',
                    borderTop: '1px solid #f0f0f0',
                    padding: 12,
                    marginTop: 16,
                    textAlign: 'right',
                }}
            >
                <Space>
                    <Button onClick={() => navigate(-1)} icon={<ArrowLeftOutlined />}>
                        Kembali
                    </Button>
                    <Button htmlType="submit" type="primary" size="large">
                        {submitText}
                    </Button>
                </Space>
            </div>
        </Form>
    );
}
