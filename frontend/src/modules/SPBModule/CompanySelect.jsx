import React, { useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, Modal, Row, Col, Select, Space, message, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';

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

export default function CompanySelect({ value, onChange, style }) {
    const [opts, setOpts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();

    const fetch = async (q = '') => {
        try {
            setLoading(true);
            includeToken();
            const { data } = await axios.get('perusahaan/search', { params: { q } });
            const list = (data.data || []).map((d) => ({ label: d.nama, value: d.id }));
            setOpts(list);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetch(''); }, []);

    const onCreate = async () => {
        const payload = await form.validateFields();
        includeToken();
        const { data } = await axios.post('perusahaan/create', payload);
        message.success('Perusahaan ditambahkan');
        setOpen(false);
        form.resetFields();
        await fetch('');
        onChange?.(data?.result?.id);
    };

    const suffix = useMemo(() => (
        <Tooltip title="Tambah perusahaan baru">
            <Button size="small" icon={<PlusOutlined />} onClick={() => setOpen(true)} />
        </Tooltip>
    ), []);

    return (
        <>
            <Space.Compact style={style}>
                <Select
                    showSearch
                    allowClear
                    placeholder="Pilih perusahaan…"
                    value={value}
                    options={opts}
                    loading={loading}
                    filterOption={false}
                    onSearch={fetch}
                    onChange={(v) => onChange?.(v)}
                    style={{ minWidth: 280 }}
                />
                {suffix}
            </Space.Compact>

            <Modal
                title="Tambah Perusahaan"
                open={open}
                onOk={onCreate}
                onCancel={() => setOpen(false)}
                okText="Simpan"
                destroyOnClose
            >
                <Form layout="vertical" form={form}>
                    <Row gutter={12}>
                        <Col span={24}>
                            <Form.Item
                                name="nama"
                                label="Nama Perusahaan"
                                rules={[{ required: true, message: 'Nama wajib' }]}
                            >
                                <Input placeholder="PT Contoh Jaya" />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="alamat" label="Alamat">
                                <Input.TextArea rows={3} placeholder="Alamat lengkap" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="telp" label="Telp">
                                <Input placeholder="021-xxxxxxx" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="fax" label="Fax">
                                <Input placeholder="021-xxxxxxx" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </>
    );
}
