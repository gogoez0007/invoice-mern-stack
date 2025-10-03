import React from 'react';
import { Form, message, Card } from 'antd';
import SPBForm from '@/modules/SPBModule/Forms/SPBForm';
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

export default function SPBCreate() {
    const [form] = Form.useForm();

    const onSubmit = async (payload) => {
        try {
            includeToken();
            await axios.post('spb/create', payload);
            message.success('SPB berhasil dibuat');
            form.resetFields();
        } catch (e) {
            message.error(e?.response?.data?.message || 'Gagal membuat SPB');
        }
    };

    return (
        <Card className="shadow-sm">
            <SPBForm form={form} onSubmit={onSubmit} submitText="Simpan" title="Permintaan Barang (SPB) - Buat Baru" />
        </Card>
    );
}
