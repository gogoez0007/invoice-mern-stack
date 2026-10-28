import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Radio,
  Select,
  Checkbox,
  Divider,
  Typography,
  message,
  Popconfirm,
  Row,
  Col,
  Tooltip,
  Badge,
  Avatar,
  Spin,
  Alert,
} from 'antd';
import {
  SafetyCertificateTwoTone,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  AppstoreOutlined,
  ApartmentOutlined,
  CheckCircleTwoTone,
  ReloadOutlined,
  SearchOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { API_BASE_URL } from '@/config/serverApiConfig';
import { useSelector } from 'react-redux';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import storePersist from '@/redux/storePersist';

const authFetch = (url, options = {}) => {
  const localAuth = storePersist.get('auth');
  const token = localAuth?.current?.token;
  const username = localAuth?.current?.username || localAuth?.current?.name;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(username ? { 'x-auth-user': username } : {}),
    ...(options.headers || {}),
  };
  return fetch(url, { ...options, headers });
};

const { Title, Text, Paragraph } = Typography;

const ROLE_COLORS = {
  SUPER_ADMIN: 'magenta',
  REVIEWER: 'purple',
  ADMIN_OPERASIONAL: 'blue',
  HR_OFFICER: 'cyan',
  ADMIN_CBAN: 'gold',
};

export default function RoleAccessPage() {
  const currentAdmin = useSelector(selectCurrentAdmin);
  const isSuperAdmin = currentAdmin?.role_group?.code === 'SUPER_ADMIN' || currentAdmin?.username === 'taufik3301';

  const [activeTab, setActiveTab] = useState('roles');
  const [loading, setLoading] = useState(false);
  const [roleGroups, setRoleGroups] = useState([]);
  const [backofficeMenus, setBackofficeMenus] = useState([]);
  const [entities, setEntities] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [filterRole, setFilterRole] = useState(null);

  // Modal / Drawer state for Role Edit/Create
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingRole, setEditingRole] = useState(null); // null if creating new
  const [form] = Form.useForm();
  const [selectedEntityScope, setSelectedEntityScope] = useState('ALL');
  const [selectedMenuIds, setSelectedMenuIds] = useState([]);
  const [selectedEntityIds, setSelectedEntityIds] = useState([]);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRoles, resMenus, resEntities, resUsers] = await Promise.all([
        authFetch(`${API_BASE_URL}employees/role-groups`).then((r) => r.json()),
        authFetch(`${API_BASE_URL}employees/backoffice-menus`).then((r) => r.json()),
        authFetch(`${API_BASE_URL}entitas`).then((r) => r.json()),
        authFetch(`${API_BASE_URL}employees/users-roles`).then((r) => r.json()),
      ]);

      if (resRoles.success) setRoleGroups(resRoles.result || []);
      if (resMenus.success) setBackofficeMenus(resMenus.result || []);
      if (Array.isArray(resEntities)) setEntities(resEntities);
      if (resUsers.success) setUsers(resUsers.result || []);
    } catch (err) {
      console.error('Error fetching role data:', err);
      message.error('Gagal mengambil data hak akses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group menus by parent or category
  const menuGroups = useMemo(() => {
    const parentMap = {};
    const standalone = [];

    // Separate parents and children
    const parents = backofficeMenus.filter((m) => !m.parent_id);
    const children = backofficeMenus.filter((m) => m.parent_id);

    parents.forEach((p) => {
      parentMap[p.id] = {
        parent: p,
        children: [],
      };
    });

    children.forEach((c) => {
      if (parentMap[c.parent_id]) {
        parentMap[c.parent_id].children.push(c);
      } else {
        standalone.push(c);
      }
    });

    return { parentMap, standalone };
  }, [backofficeMenus]);

  // Open Edit Role modal
  const handleEditRole = async (role) => {
    setModalLoading(true);
    setEditingRole(role);
    setModalVisible(true);

    try {
      const res = await authFetch(`${API_BASE_URL}employees/role-groups/${role.id}`).then((r) => r.json());
      if (res.success && res.result) {
        const details = res.result;
        form.setFieldsValue({
          code: details.code,
          name: details.name,
          description: details.description,
          entity_scope_type: details.entity_scope_type || 'ALL',
        });
        setSelectedEntityScope(details.entity_scope_type || 'ALL');
        setSelectedMenuIds(details.menu_ids || []);
        setSelectedEntityIds(details.entity_ids || []);
      }
    } catch (err) {
      message.error('Gagal memuat detail role group.');
    } finally {
      setModalLoading(false);
    }
  };

  // Open Create Role modal
  const handleCreateRole = () => {
    setEditingRole(null);
    form.resetFields();
    form.setFieldsValue({
      entity_scope_type: 'ALL',
    });
    setSelectedEntityScope('ALL');
    setSelectedMenuIds([]);
    setSelectedEntityIds([]);
    setModalVisible(true);
  };

  // Save Role (Create or Update)
  const handleSaveRole = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);

      const payload = {
        code: values.code,
        name: values.name,
        description: values.description,
        entity_scope_type: selectedEntityScope,
        menu_ids: selectedMenuIds,
        entity_ids: selectedEntityScope === 'CUSTOM' ? selectedEntityIds : [],
      };

      let res;
      if (editingRole) {
        // Update
        res = await authFetch(`${API_BASE_URL}employees/role-groups/${editingRole.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        }).then((r) => r.json());
      } else {
        // Create
        res = await authFetch(`${API_BASE_URL}employees/role-groups`, {
          method: 'POST',
          body: JSON.stringify(payload),
        }).then((r) => r.json());
      }

      if (res.success) {
        message.success(editingRole ? 'Role Group berhasil diperbarui!' : 'Role Group baru berhasil dibuat!');
        setModalVisible(false);
        fetchData();
      } else {
        message.error(res.message || 'Gagal menyimpan role group.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  // Delete Role
  const handleDeleteRole = async (roleId) => {
    try {
      const res = await authFetch(`${API_BASE_URL}employees/role-groups/${roleId}`, {
        method: 'DELETE',
      }).then((r) => r.json());

      if (res.success) {
        message.success('Role Group berhasil dihapus.');
        fetchData();
      } else {
        message.error(res.message || 'Gagal menghapus role group.');
      }
    } catch (err) {
      message.error('Gagal menghubungi server.');
    }
  };

  // Quick user role assignment
  const handleAssignUserRole = async (userId, roleGroupId) => {
    try {
      const res = await authFetch(`${API_BASE_URL}employees/${userId}/role-group`, {
        method: 'PUT',
        body: JSON.stringify({ role_group_id: roleGroupId }),
      }).then((r) => r.json());

      if (res.success) {
        message.success('Role pengguna berhasil diperbarui!');
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id === userId) {
              const rg = roleGroups.find((g) => g.id === roleGroupId);
              return {
                ...u,
                role_group_id: roleGroupId,
                role_group_name: rg?.name || null,
                role_group_code: rg?.code || null,
              };
            }
            return u;
          })
        );
      } else {
        message.error(res.message || 'Gagal mengubah role pengguna.');
      }
    } catch (err) {
      message.error('Terjadi kesalahan koneksi.');
    }
  };

  // Menu selection helpers
  const toggleMenu = (menuId) => {
    setSelectedMenuIds((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const selectAllMenus = () => {
    setSelectedMenuIds(backofficeMenus.map((m) => m.id));
  };

  const clearAllMenus = () => {
    setSelectedMenuIds([]);
  };

  const toggleGroupMenus = (groupData) => {
    const parentId = groupData.parent.id;
    const childIds = groupData.children.map((c) => c.id);
    const allGroupIds = [parentId, ...childIds];

    const isAllSelected = allGroupIds.every((id) => selectedMenuIds.includes(id));
    if (isAllSelected) {
      setSelectedMenuIds((prev) => prev.filter((id) => !allGroupIds.includes(id)));
    } else {
      setSelectedMenuIds((prev) => Array.from(new Set([...prev, ...allGroupIds])));
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        searchUser.trim() === '' ||
        (u.name && u.name.toLowerCase().includes(searchUser.toLowerCase())) ||
        (u.username && u.username.toLowerCase().includes(searchUser.toLowerCase())) ||
        (u.entitas_name && u.entitas_name.toLowerCase().includes(searchUser.toLowerCase()));

      const matchRole = !filterRole || u.role_group_id === filterRole;

      return matchSearch && matchRole;
    });
  }, [users, searchUser, filterRole]);

  // Columns for Role Groups Table
  const roleColumns = [
    {
      title: 'Nama Role & Kode',
      key: 'name',
      render: (_, record) => (
        <div>
          <Space>
            <Text strong style={{ fontSize: 15 }}>
              {record.name}
            </Text>
            <Tag color={ROLE_COLORS[record.code] || 'default'} style={{ fontWeight: 600 }}>
              {record.code}
            </Tag>
          </Space>
          <div style={{ color: '#8c8c8c', fontSize: 13, marginTop: 4 }}>
            {record.description || 'Tidak ada deskripsi'}
          </div>
        </div>
      ),
    },
    {
      title: 'Cakupan Entitas',
      key: 'scope',
      width: 220,
      render: (_, record) => {
        if (record.entity_scope_type === 'ALL') {
          return (
            <Tag color="success" style={{ padding: '4px 8px', fontSize: 12 }}>
              <ApartmentOutlined /> Seluruh Entitas (ALL)
            </Tag>
          );
        }
        return (
          <Tag color="warning" style={{ padding: '4px 8px', fontSize: 12 }}>
            <ApartmentOutlined /> Entitas Terbatas (CUSTOM)
          </Tag>
        );
      },
    },
    {
      title: 'Izin Menu',
      key: 'menus',
      width: 140,
      align: 'center',
      render: (_, record) => (
        <Badge
          count={`${record.total_menus || 0} Menu`}
          style={{
            backgroundColor: '#e6f7ff',
            color: '#1890ff',
            boxShadow: 'none',
            border: '1px solid #91d5ff',
            fontSize: 12,
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      title: 'Jumlah Pengguna',
      key: 'users',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Tag icon={<UserOutlined />} color="blue">
          {record.total_users || 0} User
        </Tag>
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditRole(record)}
            style={{ borderRadius: 6 }}
          >
            Atur Akses
          </Button>

          {record.id !== 1 && (
            <Popconfirm
              title="Hapus Role Group ini?"
              description="Pengguna yang memiliki role ini akan menjadi tidak memiliki role."
              onConfirm={() => handleDeleteRole(record.id)}
              okText="Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
            >
              <Button danger size="small" icon={<DeleteOutlined />} style={{ borderRadius: 6 }} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Columns for Users Table
  const userColumns = [
    {
      title: 'Pengguna',
      key: 'name',
      render: (_, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff' }}>
            {record.name ? record.name.charAt(0).toUpperCase() : 'U'}
          </Avatar>
          <div>
            <Text strong>{record.name}</Text>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>@{record.username}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Entitas Asal',
      dataIndex: 'entitas_name',
      key: 'entitas_name',
      render: (text) => (
        <Tag color="geekblue" style={{ fontWeight: 600 }}>
          {text || 'Tanpa Entitas'}
        </Tag>
      ),
    },
    {
      title: 'Role Group Terpasang',
      key: 'role_group',
      render: (_, record) => {
        if (!record.role_group_code) {
          return <Tag color="default">Belum Memiliki Role</Tag>;
        }
        return (
          <Tag color={ROLE_COLORS[record.role_group_code] || 'blue'} style={{ fontWeight: 600 }}>
            {record.role_group_name || record.role_group_code}
          </Tag>
        );
      },
    },
    {
      title: 'Ubah Role Group',
      key: 'assign',
      width: 260,
      render: (_, record) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Pilih Role Group"
          value={record.role_group_id || null}
          onChange={(newVal) => handleAssignUserRole(record.id, newVal)}
          options={[
            { label: '-- Tanpa Role Group --', value: null },
            ...roleGroups.map((rg) => ({
              label: `${rg.name} (${rg.code})`,
              value: rg.id,
            })),
          ]}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Page Header */}
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          marginBottom: 20,
          background: 'linear-gradient(135deg, #ffffff 0%, #f0f5ff 100%)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
          border: '1px solid #e6f0ff',
        }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Space align="start" size={14}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#e6f7ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  color: '#1890ff',
                  boxShadow: '0 2px 8px rgba(24, 144, 255, 0.15)',
                }}
              >
                <SafetyCertificateTwoTone twoToneColor="#1890ff" />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#1f1f1f' }}>
                  Manajemen Hak Akses & Role Group
                </Title>
                <Paragraph style={{ margin: '4px 0 0', color: '#595959', fontSize: 13 }}>
                  Atur hak akses menu backoffice secara dinamis dan tetapkan cakupan entitas (entity scoping) untuk setiap peran karyawan.
                </Paragraph>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
                Refresh Data
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateRole}>
                Role Group Baru
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Tabs */}
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          border: '1px solid #f0f0f0',
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="line"
          tabBarStyle={{ marginBottom: 20 }}
          items={[
            {
              key: 'roles',
              label: (
                <span style={{ fontSize: 15, fontWeight: 600 }}>
                  <AppstoreOutlined /> Daftar Role Groups & Hak Akses
                </span>
              ),
              children: (
                <Table
                  dataSource={roleGroups}
                  columns={roleColumns}
                  rowKey="id"
                  loading={loading}
                  pagination={false}
                  bordered
                />
              ),
            },
            {
              key: 'users',
              label: (
                <span style={{ fontSize: 15, fontWeight: 600 }}>
                  <UserOutlined /> Penugasan Role ke User ({users.length})
                </span>
              ),
              children: (
                <div>
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }} justify="space-between">
                    <Col xs={24} sm={12} md={8}>
                      <Input
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder="Cari user (nama, username, entitas)..."
                        value={searchUser}
                        onChange={(e) => setSearchUser(e.target.value)}
                        allowClear
                      />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Select
                        placeholder="Filter Role Group"
                        style={{ width: '100%' }}
                        allowClear
                        value={filterRole}
                        onChange={setFilterRole}
                        options={roleGroups.map((rg) => ({
                          label: rg.name,
                          value: rg.id,
                        }))}
                      />
                    </Col>
                  </Row>

                  <Table
                    dataSource={filteredUsers}
                    columns={userColumns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, showTotal: (total) => `Total ${total} user` }}
                    bordered
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Modal Configure Role Group & Permissions */}
      <Modal
        title={
          <Space>
            <SafetyCertificateTwoTone twoToneColor="#1890ff" />
            <span style={{ fontWeight: 700, fontSize: 16 }}>
              {editingRole ? `Konfigurasi Akses: ${editingRole.name}` : 'Buat Role Group Baru'}
            </span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSaveRole}
        confirmLoading={modalLoading}
        width={860}
        okText="Simpan Perubahan"
        cancelText="Batal"
        style={{ top: 20 }}
      >
        <Spin spinning={modalLoading}>
          <Form form={form} layout="vertical" style={{ marginTop: 14 }}>
            <Row gutter={16}>
              <Col xs={24} sm={10}>
                <Form.Item
                  label="Kode Role (Identifier)"
                  name="code"
                  rules={[{ required: true, message: 'Kode role wajib diisi' }]}
                  tooltip="Huruf kapital dan underscore, misal: ADMIN_GUDANG"
                >
                  <Input
                    placeholder="CONTOH: ADMIN_OPERASIONAL"
                    disabled={!!editingRole && editingRole.id === 1}
                    style={{ textTransform: 'uppercase' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={14}>
                <Form.Item
                  label="Nama Role Group"
                  name="name"
                  rules={[{ required: true, message: 'Nama role wajib diisi' }]}
                >
                  <Input placeholder="Nama tampilan role" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Deskripsi Tugas & Wewenang" name="description">
              <Input.TextArea rows={2} placeholder="Penjelasan singkat modul apa saja yang dapat diakses oleh peran ini..." />
            </Form.Item>

            <Divider orientation="left" style={{ margin: '14px 0', fontSize: 14, fontWeight: 600 }}>
              <ApartmentOutlined /> Cakupan Entitas (Entity Scoping)
            </Divider>

            <Alert
              message="Batasan Data Entitas"
              description="Menentukan apakah pengguna dalam role ini dapat melihat data semua entitas atau hanya entitas tertentu (misal: hanya entitas CBAN)."
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
            />

            <Radio.Group
              value={selectedEntityScope}
              onChange={(e) => setSelectedEntityScope(e.target.value)}
              style={{ marginBottom: 14 }}
            >
              <Radio.Button value="ALL" style={{ padding: '0 16px', fontWeight: 600 }}>
                Semua Entitas (ALL)
              </Radio.Button>
              <Radio.Button value="CUSTOM" style={{ padding: '0 16px', fontWeight: 600 }}>
                Entitas Tertentu (CUSTOM)
              </Radio.Button>
            </Radio.Group>

            {selectedEntityScope === 'CUSTOM' && (
              <div
                style={{
                  padding: 14,
                  backgroundColor: '#fafafa',
                  borderRadius: 10,
                  border: '1px solid #f0f0f0',
                  marginBottom: 16,
                }}
              >
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ fontSize: 13 }}>Pilih Entitas yang Diizinkan:</Text>
                  <Space size="small">
                    <Button
                      type="link"
                      size="small"
                      onClick={() => setSelectedEntityIds(entities.map((e) => e.id))}
                    >
                      Pilih Semua
                    </Button>
                    <Button type="link" size="small" onClick={() => setSelectedEntityIds([])}>
                      Bersihkan
                    </Button>
                  </Space>
                </div>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  placeholder="Pilih satu atau beberapa entitas..."
                  value={selectedEntityIds}
                  onChange={setSelectedEntityIds}
                  options={entities.map((ent) => ({
                    label: ent.name,
                    value: ent.id,
                  }))}
                />
              </div>
            )}

            <Divider orientation="left" style={{ margin: '18px 0 10px', fontSize: 14, fontWeight: 600 }}>
              <AppstoreOutlined /> Izin Menu Backoffice ({selectedMenuIds.length} / {backofficeMenus.length} Terpilih)
            </Divider>

            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Centang menu yang boleh diakses dan tampil di sidebar pengguna.
              </Text>
              <Space>
                <Button size="small" onClick={selectAllMenus}>
                  Pilih Semua Menu
                </Button>
                <Button size="small" onClick={clearAllMenus}>
                  Kosongkan Pilihan
                </Button>
              </Space>
            </div>

            {/* Menu Group Checkboxes */}
            <div
              style={{
                maxHeight: 380,
                overflowY: 'auto',
                padding: '12px 16px',
                border: '1px solid #f0f0f0',
                borderRadius: 10,
                backgroundColor: '#fafafa',
              }}
            >
              {Object.entries(menuGroups.parentMap).map(([parentId, groupData]) => {
                const parent = groupData.parent;
                const children = groupData.children;
                const allGroupIds = [parent.id, ...children.map((c) => c.id)];
                const isAllGroupSelected = allGroupIds.every((id) => selectedMenuIds.includes(id));
                const isSomeGroupSelected = allGroupIds.some((id) => selectedMenuIds.includes(id));

                return (
                  <Card
                    key={parent.id}
                    size="small"
                    style={{
                      marginBottom: 10,
                      borderRadius: 8,
                      border: isSomeGroupSelected ? '1px solid #91d5ff' : '1px solid #f0f0f0',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: children.length > 0 ? '1px solid #f5f5f5' : 'none',
                        paddingBottom: children.length > 0 ? 8 : 0,
                        marginBottom: children.length > 0 ? 8 : 0,
                      }}
                    >
                      <Checkbox
                        checked={selectedMenuIds.includes(parent.id)}
                        onChange={() => toggleMenu(parent.id)}
                      >
                        <Text strong style={{ fontSize: 14 }}>
                          {parent.label}
                        </Text>
                        {parent.path && (
                          <Tag style={{ marginLeft: 8, fontSize: 11 }} color="default">
                            {parent.path}
                          </Tag>
                        )}
                      </Checkbox>

                      {children.length > 0 && (
                        <Button
                          type="text"
                          size="small"
                          style={{ fontSize: 12, color: '#1890ff' }}
                          onClick={() => toggleGroupMenus(groupData)}
                        >
                          {isAllGroupSelected ? 'Uncheck Submenu' : 'Pilih Semua Submenu'}
                        </Button>
                      )}
                    </div>

                    {children.length > 0 && (
                      <Row gutter={[12, 8]} style={{ paddingLeft: 24 }}>
                        {children.map((child) => (
                          <Col xs={24} sm={12} key={child.id}>
                            <Checkbox
                              checked={selectedMenuIds.includes(child.id)}
                              onChange={() => toggleMenu(child.id)}
                            >
                              <span style={{ fontSize: 13 }}>{child.label}</span>
                              {child.path && (
                                <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>
                                  ({child.path})
                                </Text>
                              )}
                            </Checkbox>
                          </Col>
                        ))}
                      </Row>
                    )}
                  </Card>
                );
              })}

              {/* Standalone menus */}
              {menuGroups.standalone.length > 0 && (
                <Card size="small" style={{ borderRadius: 8, backgroundColor: '#ffffff' }}>
                  <Text strong style={{ fontSize: 14, marginBottom: 8, display: 'block' }}>
                    Menu Lainnya
                  </Text>
                  <Row gutter={[12, 8]}>
                    {menuGroups.standalone.map((m) => (
                      <Col xs={24} sm={12} key={m.id}>
                        <Checkbox
                          checked={selectedMenuIds.includes(m.id)}
                          onChange={() => toggleMenu(m.id)}
                        >
                          <span style={{ fontSize: 13 }}>{m.label}</span>
                          {m.path && (
                            <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>
                              ({m.path})
                            </Text>
                          )}
                        </Checkbox>
                      </Col>
                    ))}
                  </Row>
                </Card>
              )}
            </div>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
}
