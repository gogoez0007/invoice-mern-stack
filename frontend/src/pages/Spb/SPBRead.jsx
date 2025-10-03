import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Table, Button, Typography, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';

const { Title, Text } = Typography;

const nfID = new Intl.NumberFormat('id-ID');
const formatInt = (v) => {
    if (v === undefined || v === null || v === '') return '';
    const n = Number(v);
    return nfID.format(Number.isFinite(n) ? n : 0);
};
const format2 = (v) => {
    const n = Number(v || 0);
    return nfID.format(Number.isFinite(n) ? Number(n.toFixed(2)) : 0);
};

function includeToken() {
    axios.defaults.baseURL = API_BASE_URL;
    axios.defaults.withCredentials = true;
    const auth = storePersist.get('auth');
    if (auth?.current?.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${auth.current.token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
}

export default function SPBRead() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState({ items: [] });

    useEffect(() => {
        (async () => {
            includeToken();
            const { data } = await axios.get(`spb/read/${id}`);
            const res = data.result || data.data;
            setData({ ...res, items: res.items || [] });
        })();
    }, [id]);

    return (
        <>
            {/* Header Halaman + Tombol Back */}
            <Card className="shadow-sm" style={{ marginBottom: 16, borderRadius: 12 }}>
                <Space align="center" size={12}>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                        Kembali
                    </Button>
                    <Title level={4} style={{ margin: 0 }}>
                        Detail Permintaan Barang (SPB)
                    </Title>
                </Space>
            </Card>

            {/* Informasi SPB */}
            <Card
                className="shadow-sm"
                style={{ marginBottom: 16, borderRadius: 12 }}
                title={<Text strong>Informasi SPB</Text>}
            >
                <Descriptions bordered size="small" column={2}>
                    <Descriptions.Item label="No SPB">
                        <strong>{data.no_spb || '-'}</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Qty Kontrak">
                        {formatInt(data.total_qty_kontrak)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tanggal Kirim" span={2}>
                        {data.tanggal_kirim_awal} — {data.tanggal_kirim_akhir}
                    </Descriptions.Item>
                    <Descriptions.Item label="Perusahaan" span={2}>
                        <div><strong>{data.perusahaan_nama || '-'}</strong></div>
                        {data.perusahaan_telp || data.perusahaan_fax ? (
                            <div>
                                {data.perusahaan_telp ? `Telp: ${data.perusahaan_telp}` : ''}{' '}
                                {data.perusahaan_fax ? ` | Fax: ${data.perusahaan_fax}` : ''}
                            </div>
                        ) : null}
                        {data.perusahaan_alamat ? (
                            <div style={{ whiteSpace: 'pre-wrap' }}>{data.perusahaan_alamat}</div>
                        ) : null}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            {/* Detail Barang */}
            <Card
                className="shadow-sm"
                style={{ borderRadius: 12 }}
                title={<Text strong>Detail Barang</Text>}
            >
                <Table
                    rowKey="id"
                    dataSource={data.items}
                    pagination={false}
                    size="middle"
                    columns={[
                        { title: 'Nama Barang', dataIndex: 'nama_barang' },
                        {
                            title: 'Harga',
                            dataIndex: 'harga_barang',
                            align: 'right',
                            render: (v) => format2(v), // TANPA currency, 2 desimal
                        },
                    ]}
                />
            </Card>
        </>
    );
}
