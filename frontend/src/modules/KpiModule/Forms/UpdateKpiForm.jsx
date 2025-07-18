import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
    Input,
    Select,
    Button,
    Table,
    InputNumber,
    message,
    Space,
    Card,
    Typography,
    Divider,
    Descriptions,
    Tooltip,
    Statistic, // <-- Impor komponen Statistic
    Row,        // <-- Impor Row
    Col,        // <-- Impor Col
} from 'antd';

import {
    PlusOutlined,
    DeleteOutlined,
    UserOutlined,
    CalendarOutlined,
    SaveOutlined,
    EditOutlined,
    QuestionCircleOutlined,
    CloseCircleOutlined,
    CheckCircleOutlined, // <-- Impor ikon yang dibutuhkan
    WarningOutlined,     // <-- Impor ikon yang dibutuhkan
    FrownOutlined,       // <-- Impor ikon yang dibutuhkan
} from '@ant-design/icons';
import { PageHeader } from '@ant-design/pro-layout';

import dayjs from 'dayjs';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import './UpdateKpiForm.css'; // Import file CSS
import { API_BASE_URL } from '@/config/serverApiConfig';

const { Title } = Typography;

// Fungsi debounce tidak digunakan di file ini, bisa dihapus jika tidak ada rencana penggunaan
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

const UpdateKpiForm = ({ initialKpiId }) => {
    const [kpiDetails, setKpiDetails] = useState([]);
    const [kpiId, setKpiId] = useState(initialKpiId);
    const [catatanList, setCatatanList] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [kpiInfo, setKpiInfo] = useState(null);
    const navigate = useNavigate();

    const [detailsToDelete, setDetailsToDelete] = useState([]);
    const [catatanToDelete, setCatatanToDelete] = useState([]);

    const fetchKpiDetails = useCallback(async (id) => {
        if (!id) return;

        setLoadingDetails(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/kpi/${id}`);
            const kpiData = response.data.result.master;
            setKpiInfo({
                bulan: kpiData?.bulan || null,
                tahun: kpiData?.tahun || null,
                name: kpiData?.name || null
            });

            const details = Array.isArray(response.data.result.detail) ? response.data.result.detail : [];
            const catatan = Array.isArray(response.data.result.catatan) ? response.data.result.catatan : [];

            setKpiDetails(details);
            setCatatanList(catatan);

        } catch (error) {
            console.error('Gagal mengambil detail KPI:', error);
            message.error('Gagal mengambil detail KPI.');
            setKpiDetails([]);
            setCatatanList([]);
        } finally {
            setLoadingDetails(false);
        }
    }, []);

    const isTemporaryId = (id) => typeof id === 'number' && id > 1000000000000;

    const handleUpdateKPI = async () => {
        try {
            const detailsToAdd = kpiDetails.filter(detail => detail.action === 'add' || isTemporaryId(detail.id));
            const detailsToEdit = kpiDetails.filter(detail => detail.action === 'edit' && !isTemporaryId(detail.id));
            const catatanToAdd = catatanList.filter(catatan => catatan.action === 'add' || isTemporaryId(catatan.id));
            const catatanToEdit = catatanList.filter(catatan => catatan.action === 'edit' && !isTemporaryId(catatan.id));

            const details = [
                ...detailsToAdd.map(detail => ({ action: 'add', deskripsi: detail.deskripsi, parameter: detail.parameter, target: detail.target, bobot: detail.bobot, realisassi: detail.realisassi, score: detail.score, catatan: detail.catatan })),
                ...detailsToEdit.map(detail => ({ action: 'edit', id: detail.id, deskripsi: detail.deskripsi, parameter: detail.parameter, target: detail.target, bobot: detail.bobot, realisassi: detail.realisassi, score: detail.score, catatan: detail.catatan })),
                ...detailsToDelete.map(id => ({ action: 'delete', id: id }))
            ];

            const catatan = [
                ...catatanToAdd.map(catatan => ({ action: 'add', isi_catatan: catatan.isi_catatan })),
                ...catatanToEdit.map(catatan => ({ action: 'edit', id: catatan.id, isi_catatan: catatan.isi_catatan })),
                ...catatanToDelete.map(id => ({ action: 'delete', id: id }))
            ];

            const payload = { details, catatan };
            await axios.put(`${API_BASE_URL}/kpi/update/${kpiId}`, payload);
            message.success('KPI berhasil diperbarui!');
            setDetailsToDelete([]);
            setCatatanToDelete([]);
            fetchKpiDetails(kpiId);
        } catch (error) {
            console.error('Gagal memperbarui KPI:', error);
            message.error('Gagal memperbarui KPI.');
        }
    };

    const handleAddDetail = () => {
        const newDetail = { id: new Date().getTime(), deskripsi: '', parameter: '', target: '', bobot: 0, realisassi: 0, score: 0, catatan: '', action: 'add' };
        setKpiDetails([...kpiDetails, newDetail]);
    };

    const handleDeleteDetail = (record) => {
        if (!isTemporaryId(record.id)) {
            setDetailsToDelete([...detailsToDelete, record.id]);
        }
        setKpiDetails(kpiDetails.filter(item => item.id !== record.id));
    };

    const handleDetailChange = (record, field, value) => {
        const newDetails = [...kpiDetails];
        const index = newDetails.findIndex(item => item.id === record.id);
        newDetails[index][field] = value;
        if (!isTemporaryId(record.id) && newDetails[index].action !== 'add') {
            newDetails[index].action = 'edit';
        }
        setKpiDetails(newDetails);
    };

    const handleAddCatatan = () => {
        const newCatatan = { id: new Date().getTime(), isi_catatan: '', action: 'add' };
        setCatatanList([...catatanList, newCatatan]);
    };

    const handleDeleteCatatan = (record) => {
        if (!isTemporaryId(record.id)) {
            setCatatanToDelete([...catatanToDelete, record.id]);
        }
        setCatatanList(catatanList.filter(item => item.id !== record.id));
    };

    const handleCatatanChange = (record, value) => {
        const newCatatanList = [...catatanList];
        const index = newCatatanList.findIndex(item => item.id === record.id);
        newCatatanList[index].isi_catatan = value;
        if (!isTemporaryId(record.id) && newCatatanList[index].action !== 'add') {
            newCatatanList[index].action = 'edit';
        }
        setCatatanList(newCatatanList);
    };

    // --- PENAMBAHAN LOGIKA SUMMARY ---
    const totalScore = useMemo(() =>
        kpiDetails.reduce((sum, item) => {
            const score = parseFloat(item.score);
            return isNaN(score) ? sum : sum + score;
        }, 0), [kpiDetails]);

    const grade = useMemo(() => {
        if (totalScore >= 90) return 'A';
        if (totalScore >= 70) return 'B';
        if (totalScore >= 50) return 'C';
        if (totalScore >= 30) return 'D';
        return 'E';
    }, [totalScore]);

    const gradeStyle = useMemo(() => {
        switch (grade) {
            case 'A': return { color: '#52c41a', icon: <CheckCircleOutlined /> };
            case 'B': return { color: '#87d068', icon: <CheckCircleOutlined /> };
            case 'C': return { color: '#faad14', icon: <WarningOutlined /> };
            case 'D': return { color: '#f5222d', icon: <FrownOutlined /> };
            case 'E': return { color: '#cf1322', icon: <FrownOutlined /> };
            default: return { color: '#000000', icon: null };
        }
    }, [grade]);
    // --- AKHIR PENAMBAHAN LOGIKA SUMMARY ---

    const columns = useMemo(() => [
        // Definisi kolom tidak berubah
        { title: 'Deskripsi', dataIndex: 'deskripsi', key: 'deskripsi', width: '15%', ellipsis: true, render: (text, record) => (<Input.TextArea value={text} onChange={(e) => handleDetailChange(record, 'deskripsi', e.target.value)} autoSize={{ minRows: 3, maxRows: 5 }} style={{ width: '100%', margin: 0, padding: '8px', fontSize: '14px', border: '1px solid #d9d9d9', borderRadius: '6px', }} />), }, { title: 'Parameter', dataIndex: 'parameter', key: 'parameter', width: '15%', ellipsis: true, render: (text, record) => (<Input.TextArea value={text} onChange={(e) => handleDetailChange(record, 'parameter', e.target.value)} autoSize={{ minRows: 3, maxRows: 5 }} style={{ width: '100%', margin: 0, padding: '8px', fontSize: '14px', border: '1px solid #d9d9d9', borderRadius: '6px', }} />), }, { title: (<>Target<Tooltip title="Target yang ingin dicapai."><QuestionCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} /></Tooltip></>), dataIndex: 'target', key: 'target', width: '15%', ellipsis: true, render: (text, record) => (<Input.TextArea value={text} onChange={(e) => handleDetailChange(record, 'target', e.target.value)} autoSize={{ minRows: 3, maxRows: 10 }} style={{ width: '100%', margin: 0, padding: '8px', fontSize: '14px', border: '1px solid #d9d9d9', borderRadius: '6px', }} />), }, { title: 'Bobot %', dataIndex: 'bobot', key: 'bobot', width: '8%', render: (text, record) => (<InputNumber value={text} onChange={(value) => handleDetailChange(record, 'bobot', value)} style={{ width: '100%', margin: 0, padding: '8px', fontSize: '14px', border: '1px solid #d9d9d9', borderRadius: '6px', }} min={0} max={100} formatter={value => `${value}%`} parser={value => value.replace('%', '')} />), }, { title: 'Realisasi', dataIndex: 'realisassi', key: 'realisassi', width: '8%', render: (text, record) => (<InputNumber value={text} onChange={(value) => handleDetailChange(record, 'realisassi', value)} style={{ width: '100%', margin: 0, padding: '8px', fontSize: '14px', border: '1px solid #d9d9d9', borderRadius: '6px', }} />), }, { title: 'Score', dataIndex: 'score', key: 'score', width: '8%', render: (text, record) => (<InputNumber value={text} onChange={(value) => handleDetailChange(record, 'score', value)} style={{ width: '100%', margin: 0, padding: '8px', fontSize: '14px', border: '1px solid #d9d9d9', borderRadius: '6px', }} />), }, { title: 'Catatan', dataIndex: 'catatan', key: 'catatan', width: '15%', ellipsis: true, render: (text, record) => (<Input.TextArea value={text} onChange={(e) => handleDetailChange(record, 'catatan', e.target.value)} style={{ width: '100%', margin: 0, padding: '8px', fontSize: '14px', border: '1px solid #d9d9d9', borderRadius: '6px', }} />), }, { title: 'Aksi', key: 'action', width: '5%', render: (text, record) => (<Tooltip title="Hapus Detail"><Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteDetail(record)} /></Tooltip>), },
    ], [handleDetailChange, handleDeleteDetail, detailsToDelete]);

    const catatanColumns = useMemo(() => [
        // Definisi kolom catatan tidak berubah
        { title: 'Catatan', dataIndex: 'isi_catatan', key: 'isi_catatan', render: (text, record) => (<Input.TextArea value={text} onChange={(e) => handleCatatanChange(record, e.target.value)} autoSize={{ minRows: 3, maxRows: 5 }} style={{ width: '100%', margin: 0, padding: '8px', fontSize: '14px', border: '1px solid #d9d9d9', borderRadius: '6px', }} />), }, { title: 'Aksi', key: 'action', render: (text, record) => (<Tooltip title="Hapus Catatan"><Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteCatatan(record)} /></Tooltip>), },
    ], [handleCatatanChange, handleDeleteCatatan, catatanToDelete]);

    useEffect(() => {
        if (initialLoad && initialKpiId) {
            fetchKpiDetails(initialKpiId);
            setKpiId(initialKpiId);
            setInitialLoad(false);
        }
    }, [initialKpiId, fetchKpiDetails, initialLoad]);

    return (
        <div style={{ padding: 10 }}>
            <PageHeader
                onBack={() => navigate(`/kpi`)}
                title={`Ubah data KPI`}
                ghost={false}
                extra={[<Button key="close" onClick={() => navigate(`/kpi`)} icon={<CloseCircleOutlined />}>{'Close'}</Button>]}
                style={{ padding: '20px 0' }}
            />
            {kpiInfo && (
                <Card title={<Title level={3} style={{ margin: 0, color: '#262626', fontWeight: 500 }}><EditOutlined style={{ marginRight: 8 }} /> Informasi Umum</Title>} bordered={false} style={{ marginTop: 12, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    <Descriptions column={1} size="middle" labelStyle={{ fontWeight: 600, color: '#434343' }}>
                        <Descriptions.Item label={<><UserOutlined style={{ marginRight: 8 }} /> Nama</>}><Typography.Text strong>{kpiInfo?.name}</Typography.Text></Descriptions.Item>
                        <Descriptions.Item label={<><CalendarOutlined style={{ marginRight: 8 }} /> Bulan</>}><Typography.Text strong>{kpiInfo?.bulan ? dayjs().month(kpiInfo.bulan - 1).format('MMMM') : ''}</Typography.Text></Descriptions.Item>
                        <Descriptions.Item label={<><CalendarOutlined style={{ marginRight: 8 }} /> Tahun</>}><Typography.Text strong>{kpiInfo?.tahun}</Typography.Text></Descriptions.Item>
                    </Descriptions>
                </Card>
            )}

            {initialKpiId && (
                <Card
                    title={<Title level={3} style={{ margin: 0, color: '#262626', fontWeight: 500 }}><EditOutlined style={{ marginRight: 8 }} /> Detail KPI</Title>}
                    bordered={false}
                    style={{ marginTop: 24, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                >
                    <Table
                        className="custom-table"
                        columns={columns}
                        dataSource={kpiDetails}
                        rowKey="id"
                        loading={loadingDetails}
                        pagination={false}
                    />

                    {/* --- PERUBAHAN TATA LETAK DI SINI --- */}
                    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button onClick={handleAddDetail} icon={<PlusOutlined />} type="dashed" style={{ fontWeight: 500 }}>
                            Tambah Detail
                        </Button>

                        <Row gutter={32}>
                            <Col>
                                <Card>
                                    <Statistic
                                        title="Total Score"
                                        value={totalScore}
                                        precision={2}
                                        valueStyle={{ color: gradeStyle.color, fontWeight: 'bold' }}
                                    />
                                </Card>
                            </Col>
                            <Col>
                                <Card>
                                    <Statistic
                                        title="Grade"
                                        value={grade}
                                        valueStyle={{ color: gradeStyle.color, fontWeight: 'bold' }}
                                        prefix={gradeStyle.icon}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </div>

                    <Divider orientation="left" style={{ fontWeight: 500 }}>Catatan</Divider>

                    <Table
                        className="custom-table"
                        columns={catatanColumns}
                        dataSource={catatanList}
                        rowKey="id"
                        pagination={false}
                        style={{ marginTop: 16 }}
                    />

                    <Space style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                        <Button onClick={handleAddCatatan} icon={<PlusOutlined />} type="dashed" style={{ fontWeight: 500 }}>
                            Tambah Catatan
                        </Button>
                        <Button type="primary" icon={<SaveOutlined />} onClick={handleUpdateKPI} style={{ fontWeight: 500 }}>
                            Simpan Perubahan
                        </Button>
                    </Space>
                </Card>
            )}
        </div>
    );
};

export default UpdateKpiForm;