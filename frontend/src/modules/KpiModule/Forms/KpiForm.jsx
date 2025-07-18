import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
    Form,
    Input,
    Select,
    Upload,
    Button,
    Table,
    InputNumber,
    message,
    AutoComplete,
    DatePicker,
    Space,
    Card,
    Typography,
    Row,
    Col,
    Divider,
    Statistic,
} from 'antd';
import {
    UploadOutlined,
    PlusOutlined,
    DeleteOutlined,
    UserOutlined,
    CalendarOutlined,
    FileExcelOutlined,
    SaveOutlined,
    EditOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    FrownOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import './UpdateKpiForm.css'; // Pastikan Anda memiliki file CSS ini jika diperlukan

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;
import { API_BASE_URL } from '@/config/serverApiConfig';

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

const KPIForm = () => {
    const [form] = Form.useForm();
    const [karyawanOptions, setKaryawanOptions] = useState([]);
    const [selectedKaryawan, setSelectedKaryawan] = useState(null);
    const [kpiId, setKpiId] = useState(null);
    const [kpiDetails, setKpiDetails] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [catatanList, setCatatanList] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [sheetNames, setSheetNames] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState(null);

    // --- PERUBAHAN DI SINI: useEffect untuk mengatur nilai default form ---
    useEffect(() => {
        // Dapatkan objek tanggal saat ini menggunakan dayjs
        const now = dayjs();

        // Dapatkan bulan saat ini (1-12) dan format dengan '0' di depan jika perlu
        const currentMonth = now.month() + 1; // .month() adalah 0-indexed
        const formattedMonth = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;

        // Atur nilai default untuk field 'tahun' dan 'bulan'
        form.setFieldsValue({
            tahun: now, // DatePicker menerima objek dayjs secara langsung
            bulan: formattedMonth,
        });
    }, [form]); // Jalankan hook ini sekali saat komponen dimuat

    const fetchKaryawan = useCallback(async (query) => {
        try {
            const response = await axios.get(`${API_BASE_URL}employees/list?q=${query}&fields=name&page=1&items=10`);
            const data = response.data.result.map(item => ({
                value: item.name,
                label: item.name,
                id: item.id
            }));
            setKaryawanOptions(data);
        } catch (error) {
            console.error('Gagal mengambil data karyawan:', error);
            message.error('Gagal mengambil data karyawan.');
        }
    }, []);

    const debouncedFetchKaryawan = useRef(debounce(fetchKaryawan, 300)).current;

    const handleSearchKaryawan = (value) => {
        if (value) {
            debouncedFetchKaryawan(value);
        } else {
            setKaryawanOptions([]);
        }
    };

    const handleKaryawanSelect = (value, option) => {
        const selected = karyawanOptions.find(item => item.value === value);
        setSelectedKaryawan(selected);
    };

    const handleFileChange = (info) => {
        setFileList(info.fileList);
        if (info.fileList.length > 0) {
            const file = info.fileList[0].originFileObj;
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                setSheetNames(workbook.SheetNames);
                if (workbook.SheetNames.length > 0) {
                    form.setFieldsValue({ sheet: workbook.SheetNames[0] });
                    setSelectedSheet(workbook.SheetNames[0]);
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            setSheetNames([]);
            setSelectedSheet(null);
            form.setFieldsValue({ sheet: undefined });
        }
    };

    const handleFileUpload = async () => {
        try {
            await form.validateFields();
            const formData = new FormData();
            formData.append('user_id', selectedKaryawan?.id);
            formData.append('bulan', form.getFieldValue('bulan'));
            formData.append('tahun', dayjs(form.getFieldValue('tahun')).format('YYYY'));
            formData.append('kpi_file', fileList[0]?.originFileObj);
            formData.append('sheet_name', selectedSheet);

            setUploading(true);

            const response = await axios.post(`${API_BASE_URL}kpi/create`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setKpiId(response.data.result.master_kpi_id);
            message.success('KPI berhasil dibuat!');
            fetchKpiDetails(response.data.result.master_kpi_id);

        } catch (errorInfo) {
            console.error('Validasi Gagal:', errorInfo);
            message.error('Validasi Gagal, periksa form anda.');
        } finally {
            setUploading(false);
        }
    };

    const fetchKpiDetails = async (id) => {
        setLoadingDetails(true);
        try {
            const response = await axios.get(`${API_BASE_URL}kpi/${id}`);
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
    };

    const isTemporaryId = (id) => typeof id === 'number' && id > 1000000000000;

    const handleUpdateKPI = async () => {
        try {
            const details = kpiDetails.map(detail => ({
                action: isTemporaryId(detail.id) ? 'add' : 'edit',
                id: detail.id, deskripsi: detail.deskripsi, parameter: detail.parameter,
                target: detail.target, bobot: detail.bobot, realisassi: detail.realisassi,
                score: detail.score, catatan: detail.catatan
            }));

            const catatan = catatanList.map(cat => ({
                action: isTemporaryId(cat.id) ? 'add' : 'edit',
                id: cat.id, isi_catatan: cat.isi_catatan
            }));

            const payload = { details, catatan };
            await axios.put(`${API_BASE_URL}kpi/update/${kpiId}`, payload);
            message.success('KPI berhasil diperbarui!');
            fetchKpiDetails(kpiId);

        } catch (error) {
            console.error('Gagal memperbarui KPI:', error);
            message.error('Gagal memperbarui KPI.');
        }
    };

    const handleAddDetail = () => {
        const newDetail = {
            id: new Date().getTime(), deskripsi: '', parameter: '', target: '',
            bobot: 0, realisassi: 0, score: 0, catatan: ''
        };
        setKpiDetails([...kpiDetails, newDetail]);
    };

    const handleDeleteDetail = (record) => setKpiDetails(kpiDetails.filter(item => item.id !== record.id));

    const handleDetailChange = (record, field, value) => {
        const newDetails = [...kpiDetails];
        const index = newDetails.findIndex(item => item.id === record.id);
        newDetails[index][field] = value;
        setKpiDetails(newDetails);
    };

    const handleAddCatatan = () => setCatatanList([...catatanList, { id: new Date().getTime(), isi_catatan: '' }]);

    const handleDeleteCatatan = (record) => setCatatanList(catatanList.filter(item => item.id !== record.id));

    const handleCatatanChange = (record, value) => {
        const newCatatanList = [...catatanList];
        const index = newCatatanList.findIndex(item => item.id === record.id);
        newCatatanList[index].isi_catatan = value;
        setCatatanList(newCatatanList);
    };

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

    const columns = useMemo(() => [
        { title: 'Deskripsi', dataIndex: 'deskripsi', key: 'deskripsi', width: '15%', ellipsis: true, render: (text, record) => (<Input.TextArea value={text} onChange={(e) => handleDetailChange(record, 'deskripsi', e.target.value)} autoSize={{ minRows: 3, maxRows: 5 }} style={{ width: '100%', margin: 0, padding: '4px', fontSize: '12px', border: '1px solid #d9d9d9', borderRadius: '6px' }} />), },
        { title: 'Parameter', dataIndex: 'parameter', key: 'parameter', width: '15%', ellipsis: true, render: (text, record) => (<Input.TextArea value={text} onChange={(e) => handleDetailChange(record, 'parameter', e.target.value)} autoSize={{ minRows: 3, maxRows: 5 }} style={{ width: '100%', margin: 0, padding: '4px', fontSize: '12px', border: '1px solid #d9d9d9', borderRadius: '6px' }} />), },
        { title: 'Target', dataIndex: 'target', key: 'target', width: '15%', ellipsis: true, render: (text, record) => (<Input.TextArea value={text} onChange={(e) => handleDetailChange(record, 'target', e.target.value)} autoSize={{ minRows: 3, maxRows: 10 }} style={{ width: '100%', margin: 0, padding: '4px', fontSize: '12px', border: '1px solid #d9d9d9', borderRadius: '6px' }} />), },
        { title: 'Bobot %', dataIndex: 'bobot', key: 'bobot', width: '8%', render: (text, record) => (<InputNumber value={text} onChange={(value) => handleDetailChange(record, 'bobot', value)} style={{ width: '100%', margin: 0, padding: '4px', fontSize: '12px', border: '1px solid #d9d9d9', borderRadius: '6px' }} />), },
        { title: 'Realisasi', dataIndex: 'realisassi', key: 'realisassi', width: '8%', render: (text, record) => (<InputNumber value={text} onChange={(value) => handleDetailChange(record, 'realisassi', value)} style={{ width: '100%', margin: 0, padding: '4px', fontSize: '12px', border: '1px solid #d9d9d9', borderRadius: '6px' }} />), },
        { title: 'Score', dataIndex: 'score', key: 'score', width: '8%', render: (text, record) => (<InputNumber value={text} onChange={(value) => handleDetailChange(record, 'score', value)} style={{ width: '100%', margin: 0, padding: '4px', fontSize: '12px', border: '1px solid #d9d9d9', borderRadius: '6px' }} />), },
        { title: 'Catatan', dataIndex: 'catatan', key: 'catatan', width: '15%', ellipsis: true, render: (text, record) => (<Input.TextArea value={text} onChange={(e) => handleDetailChange(record, 'catatan', e.target.value)} style={{ width: '100%', margin: 0, padding: '4px', fontSize: '12px', border: '1px solid #d9d9d9', borderRadius: '6px' }} />), },
        { title: 'Action', key: 'action', width: '5%', render: (text, record) => (<Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteDetail(record)} />), },
    ], [handleDetailChange]);

    const catatanColumns = useMemo(() => [
        { title: 'Catatan', dataIndex: 'isi_catatan', key: 'isi_catatan', render: (text, record) => (<Input.TextArea value={text} onChange={(e) => handleCatatanChange(record, e.target.value)} autoSize={{ minRows: 3, maxRows: 5 }} style={{ width: '100%', margin: 0, padding: '4px', fontSize: '12px', border: '1px solid #d9d9d9', borderRadius: '6px' }} />), },
    ], [handleCatatanChange]);

    return (
        <div style={{ padding: 24 }}>
            <Card title={<Title level={3}><EditOutlined /> Form KPI</Title>}>
                <Form form={form} layout="vertical" onFinish={handleFileUpload}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label={<span><UserOutlined /> Karyawan</span>} name="karyawan" rules={[{ required: true, message: 'Pilih karyawan' }]}>
                                <AutoComplete style={{ width: '100%' }} options={karyawanOptions.map(item => ({ value: item.value, label: item.label }))} onSearch={handleSearchKaryawan} onSelect={handleKaryawanSelect} placeholder="Cari karyawan" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label={<span><CalendarOutlined /> Bulan</span>} name="bulan" rules={[{ required: true, message: 'Pilih bulan' }]}>
                                <Select>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(bulan => (<Option key={bulan} value={bulan < 10 ? `0${bulan}` : `${bulan}`}>{dayjs().month(bulan - 1).format('MMMM')}</Option>))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label="Tahun" name="tahun" rules={[{ required: true, message: 'Pilih tahun' }]}>
                                <DatePicker picker="year" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label={<span><FileExcelOutlined /> File Excel</span>} name="excelFile" rules={[{ required: true, message: 'Upload file Excel' }]}>
                                <Upload beforeUpload={() => false} onChange={handleFileChange} fileList={fileList} multiple={false}>
                                    <Button icon={<UploadOutlined />}>Pilih File</Button>
                                </Upload>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Pilih Sheet" name="sheet" rules={[{ required: true, message: 'Pilih sheet yang akan diimpor' }]}>
                                <Select placeholder="Pilih sheet" onChange={(value) => setSelectedSheet(value)} disabled={fileList.length === 0}>
                                    {sheetNames.map(sheet => (<Option key={sheet} value={sheet}>{sheet}</Option>))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" disabled={uploading} loading={uploading} icon={<CheckCircleOutlined />}>Buat KPI</Button>
                    </Form.Item>
                </Form>
            </Card>

            {kpiId && (
                <Card title={<Title level={4}> <EditOutlined /> Detail KPI</Title>} style={{ marginTop: 24 }}>
                    <Table className="custom-table" columns={columns} dataSource={kpiDetails} rowKey="id" loading={loadingDetails} pagination={false} />

                    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button onClick={handleAddDetail} icon={<PlusOutlined />}>
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

                    <Divider orientation="middle">Catatan</Divider>
                    <Table columns={catatanColumns} dataSource={catatanList} rowKey="id" pagination={false} />
                    <Space style={{ marginTop: 16, marginBottom: 16 }}>
                        <Button onClick={handleAddCatatan} icon={<PlusOutlined />}>Tambah Catatan</Button>
                        <Button type="primary" onClick={handleUpdateKPI} icon={<SaveOutlined />}>Simpan Perubahan</Button>
                    </Space>
                </Card>
            )}
        </div>
    );
};

export default KPIForm;