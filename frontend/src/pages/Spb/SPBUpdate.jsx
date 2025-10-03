import React, { useEffect, useState } from 'react';
import { Form, message, Card, Spin } from 'antd';
import { useParams } from 'react-router-dom';
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

export default function SPBUpdate() {
    const { id } = useParams();
    const [form] = Form.useForm();
    const [initialValues, setInitialValues] = useState();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                includeToken();
                const { data } = await axios.get(`spb/read/${id}`);
                setInitialValues(data.result || data.data);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const onSubmit = async (payload) => {
        try {
            includeToken();
            await axios.put(`spb/update/${id}`, payload);
            message.success('SPB berhasil diupdate');
        } catch (e) {
            message.error(e?.response?.data?.message || 'Gagal update SPB');
        }
    };

    if (loading) return <Spin />;

    return (
        <Card className="shadow-sm">
            <SPBForm form={form} initialValues={initialValues} onSubmit={onSubmit} submitText="Update" title="Permintaan Barang (SPB) - Ubah" />
        </Card>
    );
}
