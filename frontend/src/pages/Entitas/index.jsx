import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Popconfirm,
  Typography,
  Tag,
  message,
  Tooltip,
} from 'antd';
import {
  ApartmentOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';
import useResponsive from '@/hooks/useResponsive';

const { Title, Text } = Typography;

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

export default function EntitasPage() {
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null if new
  const [form] = Form.useForm();

  const fetchEntitas = async () => {
    setLoading(true);
    includeToken();
    try {
      const res = await axios.get('/entitas');
      const list = Array.isArray(res.data) ? res.data : (res.data?.result || []);
      setData(list);
    } catch (err) {
      console.error('Failed to fetch entitas:', err);
      message.error('Gagal mengambil data entitas: ' + (err.response?.data?.message || err.message));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntitas();
  }, []);

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase().trim();
    return data.filter(
      (item) =>
        (item.name && item.name.toLowerCase().includes(q)) ||
        String(item.id).includes(q)
    );
  }, [data, search]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleOpenEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue({
      name: record.name,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    includeToken();
    try {
      if (editingItem) {
        // Update
        const res = await axios.put(`/entitas/${editingItem.id}`, values);
        message.success(res.data?.message || 'Entitas berhasil diperbarui');
        setModalVisible(false);
        fetchEntitas();
      } else {
        // Create
        const res = await axios.post('/entitas', values);
        message.success(res.data?.message || 'Entitas baru berhasil ditambahkan');
        setModalVisible(false);
        fetchEntitas();
      }
    } catch (err) {
      console.error('Submit error:', err);
      message.error('Gagal menyimpan data: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    includeToken();
    try {
      const res = await axios.delete(`/entitas/${id}`);
      message.success(res.data?.message || `Entitas ${name} berhasil dihapus`);
      fetchEntitas();
    } catch (err) {
      console.error('Delete error:', err);
      message.error('Gagal menghapus entitas: ' + (err.response?.data?.message || err.message));
    }
  };

  const columns = [
    {
      title: 'No',
      width: 60,
      align: 'center',
      render: (_, __, i) => i + 1,
    },
    {
      title: 'Kode / ID',
      dataIndex: 'id',
      key: 'id',
      width: 90,
      align: 'center',
      render: (id) => <Tag color="blue">#{id}</Tag>,
    },
    {
      title: 'Nama Entitas / Unit Bisnis',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <ApartmentOutlined style={{ color: '#0284C7' }} />
          <Text strong style={{ color: '#0F172A', fontSize: 14 }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Tanggal Dibuat',
      dataIndex: 'created_date',
      key: 'created_date',
      width: 150,
      render: (d) => {
        if (!d || d === '0000-00-00') return '-';
        return dayjs(d).format('YYYY-MM-DD');
      },
    },
    {
      title: 'Terakhir Diperbarui',
      dataIndex: 'modified_date',
      key: 'modified_date',
      width: 170,
      render: (d) => (d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 140,
      align: 'center',
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Ubah Entitas">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Hapus Entitas">
            <Popconfirm
              title="Hapus Entitas?"
              description={`Yakin ingin menghapus entitas "${record.name}"? Pastikan tidak ada karyawan aktif yang terikat.`}
              onConfirm={() => handleDelete(record.id, record.name)}
              okText="Ya, Hapus"
              okType="danger"
              cancelText="Batal"
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      {/* Banner Card */}
      <Card
        className="shadow-sm"
        style={{
          marginBottom: 16,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #0284C7 0%, #0D9488 100%)',
          color: '#ffffff',
        }}
        bodyStyle={{ padding: 20 }}
      >
        <Space orientation="vertical" size={4}>
          <Space align="center" size={10}>
            <ApartmentOutlined style={{ fontSize: 24, color: '#fff' }} />
            <Title level={3} style={{ margin: 0, color: '#fff' }}>
              Master Entitas (Cabang / Unit Bisnis)
            </Title>
          </Space>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
            Kelola daftar unit kerja, cabang operasional, dan entitas bisnis Delta Marine Group
          </Text>
        </Space>
      </Card>

      {/* Main Table Card */}
      <Card className="shadow-sm" style={{ borderRadius: 12 }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
          <Space wrap size={10}>
            <Input.Search
              placeholder="Cari nama entitas atau ID..."
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: isMobile ? '100%' : 280 }}
              onSearch={setSearch}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchEntitas}>
              Refresh
            </Button>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: '#0284C7', borderColor: '#0284C7' }}
            onClick={handleOpenCreate}
          >
            Tambah Entitas
          </Button>
        </Space>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          size="middle"
          scroll={{ x: 700 }}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} entitas cabang`,
          }}
        />
      </Card>

      {/* Form Modal (Create / Edit) */}
      <Modal
        title={
          <Space>
            <ApartmentOutlined style={{ color: '#0284C7' }} />
            <span>{editingItem ? 'Edit Data Entitas' : 'Tambah Entitas Baru'}</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="Simpan"
        cancelText="Batal"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 12 }}>
          <Form.Item
            name="name"
            label="Nama Entitas / Unit Bisnis"
            rules={[{ required: true, message: 'Nama entitas wajib diisi!' }]}
          >
            <Input placeholder="Contoh: DM, CBAN, DMI, NUSEA, RDM..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
