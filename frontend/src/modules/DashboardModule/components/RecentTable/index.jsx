import { useMemo } from 'react';
import { Table, Tag, Typography, Space, Empty, Spin, Avatar } from 'antd';
import { request } from '@/request';
import useFetch from '@/hooks/useFetch';
import {
  CheckCircleTwoTone,
  ClockCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

// Helper generate initials avatar
const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export default function RecentTable({ entity, dataTableColumns }) {
  const asyncList = () => {
    return request.summaryAbsen({ entity });
  };

  const { result, isLoading, isSuccess } = useFetch(asyncList);

  const dataList = useMemo(() => {
    if (isSuccess && Array.isArray(result)) {
      return result.slice(0, 8); // Tampilkan 8 data teratas
    }
    return [];
  }, [result, isSuccess]);

  // Kolom Khusus Sesuai Tipe Entitas
  const columns = useMemo(() => {
    if (entity === 'absen_today') {
      return [
        {
          title: 'Karyawan',
          dataIndex: 'name',
          key: 'name',
          render: (name, record) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar
                size={34}
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  fontWeight: 700,
                  fontSize: 12,
                  border: '1px solid #fecaca',
                }}
              >
                {getInitials(name)}
              </Avatar>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text strong style={{ fontSize: 13, color: '#0f172a', lineHeight: 1.2 }}>
                  {name}
                </Text>
                <Space size={4} style={{ marginTop: 2 }}>
                  {record.entitas && record.entitas !== '-' && (
                    <Tag color="cyan" style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '16px' }}>
                      {record.entitas}
                    </Tag>
                  )}
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {record.position || '-'}
                  </Text>
                </Space>
              </div>
            </div>
          ),
        },
      ];
    }

    if (entity === 'telat_today') {
      return [
        {
          title: 'Karyawan',
          dataIndex: 'name',
          key: 'name',
          render: (name, record) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar
                size={34}
                style={{
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  fontWeight: 700,
                  fontSize: 12,
                  border: '1px solid #fde68a',
                }}
              >
                {getInitials(name)}
              </Avatar>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text strong style={{ fontSize: 13, color: '#0f172a', lineHeight: 1.2 }}>
                  {name}
                </Text>
                <Space size={4} style={{ marginTop: 2 }}>
                  {record.entitas && record.entitas !== '-' && (
                    <Tag color="cyan" style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '16px' }}>
                      {record.entitas}
                    </Tag>
                  )}
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {record.position || '-'}
                  </Text>
                </Space>
              </div>
            </div>
          ),
        },
        {
          title: 'Jam & Durasi',
          key: 'telat_info',
          width: 140,
          align: 'right',
          render: (_, record) => (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <Text strong style={{ fontSize: 12.5, color: '#d97706' }}>
                {record.check_in_time || '-'}
              </Text>
              <Tag color="warning" style={{ margin: 0, fontSize: 10.5, padding: '0 6px', fontWeight: 600 }}>
                +{record.menit_telat || 1} mnt
              </Tag>
            </div>
          ),
        },
      ];
    }

    if (entity === 'top_telat_monthly') {
      return [
        {
          title: 'Rank & Karyawan',
          dataIndex: 'name',
          key: 'name',
          render: (name, record, idx) => {
            const rank = idx + 1;
            let rankBadge = (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  color: '#64748b',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {rank}
              </span>
            );

            if (rank === 1) rankBadge = <span style={{ fontSize: 18 }}>🥇</span>;
            if (rank === 2) rankBadge = <span style={{ fontSize: 18 }}>🥈</span>;
            if (rank === 3) rankBadge = <span style={{ fontSize: 18 }}>🥉</span>;

            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {rankBadge}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <Text strong style={{ fontSize: 13, color: '#0f172a', lineHeight: 1.2 }}>
                    {name}
                  </Text>
                  <Space size={4} style={{ marginTop: 2 }}>
                    {record.entitas && record.entitas !== '-' && (
                      <Tag color="cyan" style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '16px' }}>
                        {record.entitas}
                      </Tag>
                    )}
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {record.position || '-'}
                    </Text>
                  </Space>
                </div>
              </div>
            );
          },
        },
        {
          title: 'Frekuensi',
          dataIndex: 'late_count',
          key: 'late_count',
          width: 110,
          align: 'right',
          render: (count) => (
            <Tag color="blue" style={{ margin: 0, fontSize: 12, padding: '2px 8px', fontWeight: 700 }}>
              {count}x Telat
            </Tag>
          ),
        },
      ];
    }

    return dataTableColumns || [];
  }, [entity, dataTableColumns]);

  // Empty state custom per entity
  const renderEmpty = () => {
    if (entity === 'telat_today') {
      return (
        <div style={{ padding: '30px 10px', textAlign: 'center' }}>
          <CheckCircleTwoTone twoToneColor="#10b981" style={{ fontSize: 32, marginBottom: 8 }} />
          <div style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>
            Semua Hadir Tepat Waktu!
          </div>
          <Text type="secondary" style={{ fontSize: 11.5 }}>
            Belum ada karyawan yang terlambat hari ini.
          </Text>
        </div>
      );
    }
    if (entity === 'absen_today') {
      return (
        <div style={{ padding: '30px 10px', textAlign: 'center' }}>
          <CheckCircleTwoTone twoToneColor="#10b981" style={{ fontSize: 32, marginBottom: 8 }} />
          <div style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>
            Seluruh Karyawan Telah Masuk!
          </div>
          <Text type="secondary" style={{ fontSize: 11.5 }}>
            Tidak ada karyawan yang absen hari ini.
          </Text>
        </div>
      );
    }
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Tidak ada data" />;
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="small" />
      </div>
    );
  }

  return (
    <Table
      showHeader={false}
      columns={columns}
      rowKey={(item) => item.id || item.employee_id || item.name}
      dataSource={dataList}
      pagination={false}
      size="small"
      scroll={{ x: true }}
      locale={{ emptyText: renderEmpty() }}
    />
  );
}
