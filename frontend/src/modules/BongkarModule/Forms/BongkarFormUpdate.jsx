import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Card,
    Typography,
    Table,
    Row,
    Col,
    Input,
    DatePicker,
    Form,
    Button,
    Popconfirm,
    message  // Import message dari antd
} from 'antd';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { EditOutlined, CloseOutlined, SaveOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

const { Text } = Typography;

const positionColors = {
    "Depan": "#2980B9",
    "Tengah": "#27AE60",
    "Belakang": "#F39C12"
};

const cardStyle = {
    marginBottom: 16,
    borderRadius: 8,
    border: '1px solid #ddd',
};

dayjs.extend(utc);
dayjs.extend(timezone);

// Set zona waktu default aplikasi Anda (misalnya, 'Asia/Jakarta')
const timezoneName = 'Asia/Jakarta';
dayjs.tz.setDefault(timezoneName);

const BongkarFormUpdate = ({
    translate,
    itemsByPosition,
    currentErp,
    dateFormat,
    formatNumber,
    onSubmit
}) => {
    const [form] = Form.useForm();
    const [editingKey, setEditingKey] = useState('');
    const [modifiedDetail, setModifiedDetail] = useState([]);
    const [dataSource, setDataSource] = useState([]);
    const [editCache, setEditCache] = useState({});
    const inputRef = useRef(null);

    const [potPercentage, setPotPercentage] = useState('');
    const [subtotal, setSubtotal] = useState('');
    const [potPercentageDisabled, setPotPercentageDisabled] = useState(true);
    const [subtotalDisabled, setSubtotalDisabled] = useState(true);

    const updateFormValue = useCallback((fieldName, value) => {
        if (value !== form.getFieldValue(fieldName)) {
            form.setFieldsValue({ [fieldName]: value });
        }
    }, [form]);

    useEffect(() => {
        setPotPercentageDisabled(subtotal.length > 0);
        setSubtotalDisabled(potPercentage.length > 0);
    }, [potPercentage, subtotal]);


    const handlePotPercentageChange = useCallback((e) => {
        const val = e.target.value;
        setPotPercentage(val);
        updateFormValue('persen_potongan', val);
    }, [updateFormValue]);

    const handleSubtotalChange = useCallback((e) => {
        const val = e.target.value;
        setSubtotal(val);
        updateFormValue('sub_total', val);
    }, [updateFormValue]);

    useEffect(() => {
        form.setFieldsValue({
            nama_pabrik: currentErp?.nama_pabrik,
            tanggal_bongkar: currentErp?.tanggal_bongkar ? dayjs(currentErp?.tanggal_bongkar) : null,
            nopol: currentErp?.nopol,
            staff: currentErp?.staff,
            lokasi: currentErp?.lokasi,
            nama_perusahaan: currentErp?.nama_perusahaan,
            petambak: currentErp?.petambak,
            persen_potongan: currentErp?.persen_potongan,
            sub_total: currentErp.sub_total
        });
    }, [currentErp, form]);

    useEffect(() => {
        const newDataSource = [];
        Object.keys(itemsByPosition).forEach(posisi => {
            const details = itemsByPosition[posisi] || [];
            details.forEach(item => {
                newDataSource.push({ ...item, key: item.id });
            });
        });
        setDataSource(newDataSource);
    }, [itemsByPosition]);

    useEffect(() => {
        if (editingKey && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingKey]);

    const isEditing = (record) => record.key === editingKey;

    const edit = (record) => {
        form.setFieldsValue({
            ...record,
            tanggal: record.tanggal ? dayjs(record.tanggal) : null,
        });
        setEditCache({...record})
        setEditingKey(record.key);
    };

   const cancel = () => {
        const newData = [...dataSource];
        const index = newData.findIndex((item) => editCache.key === item.key);
        if (index > -1) {
            newData.splice(index, 1, editCache);
            setDataSource(newData);
            setEditingKey('');
        } else {
            setEditingKey('');
        }

    };

    const save = async (key) => {
        try {
            const row = await form.validateFields();
            const newData = [...dataSource];
            const index = newData.findIndex((item) => key === item.key);

            if (index > -1) {
                const item = newData[index];
                newData.splice(index, 1, {
                    ...item,
                    ...row,
                });

                setModifiedDetail(prev => {
                    const existingIndex = prev.findIndex(item => item.key === key);
                    if (existingIndex > -1) {
                        const updated = [...prev];
                        const { key, posisi, action, nama_pabrik, tanggal, nopol, staff, lokasi, nama_perusahaan, petambak, ...detailData } = { ...item, ...row };
                        updated[existingIndex] = { ...detailData, tanggal : row.tanggal, action: prev[existingIndex].action || 'edit', key: key, posisi: item.posisi, id: item.id };
                        return updated;
                    } else {
                        const { key, action, nama_pabrik, tanggal, nopol, staff, lokasi, nama_perusahaan, petambak, ...detailData } = { ...item, ...row };
                        return [...prev, { ...detailData, tanggal : row.tanggal, action: 'edit', key: key, posisi: item.posisi, id: item.id }];
                    }
                });
                setDataSource(newData);
                setEditingKey('');

            } else {
                newData.push(row);

                setModifiedDetail(prev => {
                    const { key, action, nama_pabrik, tanggal, nopol, staff, lokasi, nama_perusahaan, petambak, ...detailData } = newData;
                    return [...prev, { ...detailData, tanggal : newData.tanggal, posisi : posisi, key : key, action : action}];
                });
                setDataSource(newData);
                setEditingKey('');

            }
        } catch (errInfo) {
            console.log('Validate Failed:', errInfo);
        }
    };

    const handleDelete = (key) => {
        const newData = dataSource.filter(item => item.key !== key);
        setDataSource(newData);
        setModifiedDetail(prev => {
            const existingIndex = prev.findIndex(item => item.key === key);
            if (existingIndex > -1) {
                return prev.map(item => (item.key === key ? { ...item, action: 'delete' } : item));
            } else {
                const deletedItem = dataSource.find(item => item.key === key);
                return [...prev, { ...deletedItem, action: 'delete' }];
            }
        });
    };

    const getMaxDetailPanenId = (posisi) => {
        const filteredDataSource = dataSource.filter(item => item.posisi === posisi);
        if (filteredDataSource.length === 0) {
            return 0; // Atau nilai default lain yang sesuai
        }
        const maxId = Math.max(...filteredDataSource.map(item => item.detail_panen_id || 0));
        return maxId;
    };

    const handleAdd = (posisi) => {
        const maxDetailPanenId = getMaxDetailPanenId(posisi);
        const newDetailPanenId = maxDetailPanenId + 1;

        const newKey = Date.now();
        const newData = {
            key: newKey,
            tanggal: dayjs(),
            berat_bongkar: '',
            size: '',
            kualitas: '', // Tambahkan field kualitas
            persen_molting: '',
            harga: '',
            sub_total: '',
            posisi: posisi,
            action: 'add',
            id: currentErp.id, // Tambahkan di sini
            detail_panen_id: newDetailPanenId
        };
        const newDataSource = [...dataSource, newData];
        setDataSource(newDataSource);
        const { key, action, nama_pabrik, tanggal, nopol, staff, lokasi, nama_perusahaan, petambak, ...detailData } = newData;
        setModifiedDetail(prev => [...prev, {...detailData, tanggal : newData.tanggal, posisi : posisi, key : key, action : action}]);
        edit(newData);
    };

    const handleDeleteNew = (key) => {
        const newData = dataSource.filter(item => item.key !== key);
        setDataSource(newData);
        setModifiedDetail(prev => prev.filter(item => item.key !== key));
    };

    // Fungsi Validasi
    const validateBeforeSubmit = () => {
        if (editingKey) {
            message.error(translate('Selesaikan atau batalkan edit baris sebelum menyimpan.'));
            return false;
        }
        return true;
    };

    const handleSubmit = () => {
        // Validasi sebelum submit
        if (!validateBeforeSubmit()) {
            return;
        }

        form.validateFields().then(values => {
            const formattedFormData = {
                ...values,
                tanggal_bongkar: values.tanggal_bongkar ? dayjs(values.tanggal_bongkar).tz(timezoneName).format('YYYY-MM-DD') : null,
                id: currentErp.id, // Tambahkan currentErp.id di sini
            };

            const formattedModifiedDetail = modifiedDetail.map(item => ({
                ...item,
                tanggal: item.tanggal ? dayjs(item.tanggal).tz(timezoneName).format('YYYY-MM-DD') : null,
            }));

            const payload = {
                ...formattedFormData,
                details: formattedModifiedDetail
            };

            if (onSubmit) {
                onSubmit(payload);
            }
        }).catch(errorInfo => {
            console.log('Failed:', errorInfo);
        });
    };
    const columns = [
        {
            title: translate('Tanggal'),
            dataIndex: 'tanggal',
            key: 'tanggal',
            editable: true,
            width: '150px',
            render: (date) => (date ? dayjs(date).format(dateFormat) : '-'),
        },
        {
            title: translate('Berat (Kg)'),
            dataIndex: 'berat_bongkar',
            key: 'berat_bongkar',
            editable: true,
        },
        {
            title: translate('Size'),
            dataIndex: 'size',
            key: 'size',
            editable: true,
        },
        // Kolom Kualitas Ditambahkan Di Sini
        {
            title: translate('Kualitas'),
            dataIndex: 'kualitas',
            key: 'kualitas',
            editable: true,
        },
        {
            title: translate('Molting (%)'),
            dataIndex: 'persen_molting',
            key: 'persen_molting',
            editable: true,
        },
        {
            title: translate('Harga'),
            dataIndex: 'harga',
            key: 'harga',
            editable: true,
        },
        {
            title: translate('Subtotal'),
            dataIndex: 'sub_total',
            key: 'sub_total',
            editable: true,
            render: (text, record) => {
                const subtotal = record.sub_total;
                return formatNumber(subtotal);
            },
        },
        {
            title: 'Action',
            dataIndex: 'Action',
            width: '100px',
            render: (_, record) => {
                const editable = isEditing(record);
                const isNew = record.action === 'add';
                return editable ? (
                    <span>
                        <Button
                            onClick={() => save(record.key)}
                            style={{ marginRight: 8 }}
                            type="primary"
                            icon={<SaveOutlined />}
                            size="small"
                        />
                        <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
                            <Button icon={<CloseOutlined />} size="small" danger />
                        </Popconfirm>
                    </span>
                ) : (
                    <span>
                        <Button
                            disabled={editingKey !== ''}
                            onClick={() => edit(record)}
                            style={{ marginRight: 8 }}
                            icon={<EditOutlined />}
                            size="small"
                        />
                        <Popconfirm title="Sure to delete?" onConfirm={() => (isNew ? handleDeleteNew(record.key) : handleDelete(record.key))}>
                            <Button icon={<MinusCircleOutlined />} size="small" danger />
                        </Popconfirm>
                    </span>
                );
            },
        },
    ];

   const mergedColumns = columns.map((col) => {
    if (!col.editable) {
        return col;
    }

    return {
        ...col,
        render: (text, record) => {
            const editing = isEditing(record);
            return editing ? (
                <Form.Item
                    style={{ margin: 0 }}
                    name={col.dataIndex}
                    rules={[{ required: true, message: `Please Input ${col.title}!` }]}
                    getValueProps={(value) => {
                        if (col.dataIndex === 'tanggal' && value) {
                            return { value: dayjs(value) };
                        }
                        return { value };
                    }}
                >
                    {col.dataIndex === 'tanggal' ? (
                        <DatePicker style={{ width: '100%' }} format={dateFormat} />
                    ) : (
                        <Input
                            ref={inputRef}
                            type={col.dataIndex === 'berat_bongkar' || col.dataIndex === 'harga' || col.dataIndex === 'sub_total' ? 'number' : 'text'}
                            style={{ width: col.dataIndex === 'size' || col.dataIndex === 'persen_molting' || col.dataIndex === 'harga' ? '80px' : '100%' }}
                        />
                    )}
                </Form.Item>
            ) : (
                col.render ? col.render(text, record) : text
            );
        },
    };
});

    const totalsByPosition = useMemo(() => {
        const totals = {};
        Object.keys(itemsByPosition).forEach(posisi => {
            const filteredDataSource = dataSource.filter(item => item.posisi === posisi);
            const totalBerat = filteredDataSource.reduce((sum, item) => sum + (parseFloat(item.berat_bongkar) || 0), 0);
            const totalSubtotal = filteredDataSource.reduce((sum, item) => sum + (parseFloat(item.sub_total) || 0), 0);
            totals[posisi] = { totalBerat, totalSubtotal };
        });
        return totals;
    }, [dataSource, itemsByPosition]);

    return (
        <div style={{ padding: '0 10px' }}>
            <Form
                form={form}
                layout="vertical"
            >
                <Row gutter={16} style={{ fontWeight: 'bold', background: '#f0f0f0', padding: '10px', borderBottom: '1px solid #ddd' }}>
                    <Col span={3}>{translate('Pabrik')}</Col>
                    <Col span={3}>{translate('Tanggal Bongkar')}</Col>
                    <Col span={2}>{translate('Potongan (%)')}</Col>
                    <Col span={3}>{translate('Subtotal (Nota)')}</Col>
                    <Col span={3}>{translate('Lokasi')}</Col>
                    <Col span={4}>{translate('Perusahaan')}</Col>
                    <Col span={2}>{translate('Petambak')}</Col>
                    <Col span={2}>{translate('No Polisi')}</Col>
                    <Col span={2}>{translate('Staff')}</Col>
                </Row>
                <Row gutter={16} style={{ padding: '10px' }}>
                    <Col span={3}>
                        <Form.Item name="nama_pabrik" >
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={3}>
                        <Form.Item name="tanggal_bongkar">
                            <DatePicker style={{ width: '100%' }} format={dateFormat} />
                        </Form.Item>
                    </Col>
                    <Col span={2}>
                        <Form.Item name="persen_potongan" >
                            <Input
                                disabled={potPercentageDisabled}
                                onChange={handlePotPercentageChange}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={3}>
                        <Form.Item name="sub_total" >
                            <Input
                                disabled={subtotalDisabled}
                                onChange={handleSubtotalChange}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={3}>{currentErp.lokasi}</Col>
                    <Col span={4}>{currentErp.nama_perusahaan}</Col>
                    <Col span={2}>{currentErp.petambak}</Col>
                    <Col span={2}>{currentErp.nopol}</Col>
                    <Col span={2}>{currentErp.staff}</Col>
                </Row>

                {Object.keys(itemsByPosition).map(posisi => {
                    const { totalBerat, totalSubtotal } = totalsByPosition[posisi] || { totalBerat: 0, totalSubtotal: 0 };

                    return (
                        <Card
                            key={posisi}
                            style={{
                                ...cardStyle,
                                backgroundColor: "#f0f0f0",
                            }}
                            title={
                                <Row justify="space-between" align="middle">
                                    <Col>
                                        <span
                                            style={{
                                                textAlign: 'center',
                                                fontWeight: 'bold',
                                                padding: '10px',
                                                backgroundColor: positionColors[posisi] || "#f0f0f0",
                                                borderRadius: '5px',
                                                display: "block",
                                                color: '#ffffff'
                                            }}
                                        >
                                            {translate(posisi)}
                                        </span>
                                    </Col>
                                </Row>
                            }
                        >
                            <Row gutter={16} align="middle" justify="space-between">
                                <Col>
                                    <p><strong>Data Bongkar:</strong></p>
                                </Col>
                                <Col>
                                    <Button type='dashed' icon={<PlusOutlined />} size="small" onClick={() => handleAdd(posisi)}>
                                        Add data
                                    </Button>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Table
                                        components={{
                                            body: {
                                                cell: ({ children, ...restProps }) => {
                                                    return <td {...restProps}>{children}</td>;
                                                },
                                            },
                                        }}
                                        bordered
                                        dataSource={dataSource.filter(item => item.posisi === posisi)}
                                        columns={mergedColumns}
                                        rowClassName="editable-row"
                                        pagination={false}
                                    />
                                </Col>
                            </Row>

                            <div style={{
                                borderTop: "2px solid #ccc",
                                paddingTop: "10px",
                                marginTop: "15px",
                                fontWeight: "bold",
                                textAlign: "center"
                            }}>
                                TotalBerat: {formatNumber(totalBerat)} Kg   |   Total : Rp {formatNumber(totalSubtotal)}
                            </div>
                        </Card>
                    );
                })}
                <Form.Item>
                    <Button type="primary" onClick={handleSubmit}>
                        {translate('Simpan')}
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default BongkarFormUpdate;