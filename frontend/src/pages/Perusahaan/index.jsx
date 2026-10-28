import React, { useEffect, useState } from 'react';
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
  message,
  Tooltip,
} from 'antd';
import {
  ShopOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  PhoneOutlined,
  PrinterOutlined,
  EnvironmentOutlined,
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

export default function PerusahaanPage() {
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [search, setSearch] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null if new
  const [form] = Form.useForm();

  const fetchPerusahaan = async (page = 1, pageSize = 10, q = search) => {
    setLoading(true);
    includeToken();
    try {
      const res = await axios.get('/perusahaan', {
        params: {
          page,
          limit: pageSize,
          q: q ? q.trim() : undefined,
        },
      });
      if (res.data?.success) {
        setData(res.data.data || []);
        setPagination({
          current: res.data.page || page,
          pageSize: res.data.limit || pageSize,
          total: res.data.total || 0,
        });
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch perusahaan:', err);
      message.error('Gagal mengambil data perusahaan: ' + (err.response?.data?.message || err.message));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerusahaan(1, pagination.pageSize, search);
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleOpenEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue({
      nama: record.nama,
      alamat: record.alamat,
      telp: record.telp,
      fax: record.fax,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    includeToken();
    try {
      if (editingItem) {
        // Update
        const res = await axios.put(`/perusahaan/update/${editingItem.id}`, values);
        if (res.data?.success) {
          message.success('Data perusahaan berhasil diperbarui');
          setModalVisible(false);
          fetchPerusahaan(pagination.current, pagination.pageSize, search);
        }
      } else {
        // Create
        const res = await axios.post('/perusahaan/create', values);
        if (res.data?.success) {
          message.success('Perusahaan baru berhasil ditambahkan');
          setModalVisible(false);
          fetchPerusahaan(1, pagination.pageSize, search);
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      message.error('Gagal menyimpan data: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    includeToken();
    try {
      const res = await axios.delete(`/perusahaan/delete/${id}`);
      if (res.data?.success) {
        message.success('Perusahaan berhasil dihapus');
        fetchPerusahaan(pagination.current, pagination.pageSize, search);
      }
    } catch (err) {
      console.error('Delete error:', err);
      message.error('Gagal menghapus perusahaan: ' + (err.response?.data?.message || err.message));
    }
  };

  const columns = [
    {
      title: 'No',
      width: 60,
      align: 'center',
      render: (_, __, i) => (pagination.current - 1) * pagination.pageSize + i + 1,
    },
    {
      title: 'Nama Perusahaan (PT/Legal)',
      dataIndex: 'nama',
      key: 'nama',
      render: (text) => <Text strong style={{ color: '#1E40AF', fontSize: 14 }}>{text}</Text>,
    },
    {
      title: 'Alamat',
      dataIndex: 'alamat',
      key: 'alamat',
      render: (text) => (
        <span>
          <EnvironmentOutlined style={{ color: '#8c8c8c', marginRight: 6 }} />
          {text || '-'}
        </span>
      ),
    },
    {
      title: 'No. Telepon',
      dataIndex: 'telp',
      key: 'telp',
      width: 160,
      render: (text) => (
        <span>
          {text ? <><PhoneOutlined style={{ color: '#52c41a', marginRight: 6 }} />{text}</> : '-'}
        </span>
      ),
    },
    {
      title: 'Fax',
      dataIndex: 'fax',
      key: 'fax',
      width: 140,
      render: (text) => (
        <span>
          {text ? <><PrinterOutlined style={{ color: '#1890ff', marginRight: 6 }} />{text}</> : '-'}
        </span>
      ),
    },
    {
      title: 'Tgl Dibuat',
      dataIndex: 'created_date',
      key: 'created_date',
      width: 140,
      render: (d) => (d ? dayjs(d).format('YYYY-MM-DD') : '-'),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 140,
      align: 'center',
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Ubah Perusahaan">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Hapus Perusahaan">
            <Popconfirm
              title="Hapus Perusahaan?"
              description={`Yakin ingin menghapus ${record.nama}?`}
              onConfirm={() => handleDelete(record.id)}
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
          background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
          color: '#ffffff',
        }}
        bodyStyle={{ padding: 20 }}
      >
        <Space orientation="vertical" size={4}>
          <Space align="center" size={10}>
            <ShopOutlined style={{ fontSize: 24, color: '#fff' }} />
            <Title level={3} style={{ margin: 0, color: '#fff' }}>
              Master Perusahaan (PT / Legal Entity)
            </Title>
          </Space>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
            Kelola data legalitas perusahaan, alamat kantor pusat, telepon, dan kontak resmi organisasi
          </Text>
        </Space>
      </Card>

      {/* Main Table Card */}
      <Card className="shadow-sm" style={{ borderRadius: 12 }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
          <Space wrap size={10}>
            <Input.Search
              placeholder="Cari nama perusahaan, telepon..."
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: isMobile ? '100%' : 280 }}
              onSearch={(v) => {
                setSearch(v);
                fetchPerusahaan(1, pagination.pageSize, v);
              }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchPerusahaan(pagination.current, pagination.pageSize, search)}
            >
              Refresh
            </Button>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: '#1E3A8A', borderColor: '#1E3A8A' }}
            onClick={handleOpenCreate}
          >
            Tambah Perusahaan
          </Button>
        </Space>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          size="middle"
          scroll={{ x: 800 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} perusahaan`,
            onChange: (p, ps) => fetchPerusahaan(p, ps, search),
          }}
        />
      </Card>

      {/* Form Modal (Create / Edit) */}
      <Modal
        title={
          <Space>
            <ShopOutlined style={{ color: '#1E3A8A' }} />
            <span>{editingItem ? 'Edit Data Perusahaan' : 'Tambah Perusahaan Baru'}</span>
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
            name="nama"
            label="Nama Perusahaan (PT)"
            rules={[{ required: true, message: 'Nama perusahaan wajib diisi!' }]}
          >
            <Input placeholder="Contoh: PT. Delta Marine Group" />
          </Form.Item>

          <Form.Item name="alamat" label="Alamat Kantor">
            <Input.TextArea rows={3} placeholder="Alamat lengkap perusahaan..." />
          </Form.Item>

          <Form.Item name="telp" label="Nomor Telepon">
            <Input prefix={<PhoneOutlined />} placeholder="Contoh: 031-1234567" />
          </Form.Item>

          <Form.Item name="fax" label="Nomor Fax">
            <Input prefix={<PrinterOutlined />} placeholder="Contoh: 031-7654321" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
