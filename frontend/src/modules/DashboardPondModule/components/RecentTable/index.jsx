import { Table } from 'antd';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';

export default function RecentTable({ dataTableColumns = [], types }) {
  const productivity = useSelector((state) => state.erp.productivity);
  const result = productivity?.result ?? [];
  const isLoading = productivity?.isLoading;
  const isSuccess = productivity?.isSuccess;

  const sortedData = useMemo(() => {
    if (!isSuccess || !Array.isArray(result)) return [];

    const data = [...result];

    switch (types) {
      case 'topFrekuensi':
        return data
          .filter(item => item.status_kendaraan === "Delmar Group")
          .sort((a, b) => b.frekuensi - a.frekuensi)
          .slice(0, 5);
      case 'lowFrekuensi':
        return data
          .filter(item => item.status_kendaraan === "Delmar Group")
          .sort((a, b) => a.frekuensi - b.frekuensi)
          .slice(0, 5);
      case 'topVolume':
        return data
          .filter(item => item.status_kendaraan === "Delmar Group")
          .sort((a, b) =>
            (Number(b.volume_panen) + Number(b.volume_bongkar)) -
            (Number(a.volume_panen) + Number(a.volume_bongkar))
          )
          .slice(0, 5);

      case 'lowVolume':
        return data
          .filter(item => item.status_kendaraan === "Delmar Group")
          .sort((a, b) =>
            (Number(a.volume_panen) + Number(a.volume_bongkar)) -
            (Number(b.volume_panen) + Number(b.volume_bongkar))
          )
          .slice(0, 5);

      default:
        return data.slice(0, 5);
    }
  }, [result, types, isSuccess]);

  return (
    <Table
      columns={dataTableColumns}
      rowKey={(item) => item.id || item.key || JSON.stringify(item)}
      dataSource={sortedData}
      pagination={false}
      loading={isLoading}
      scroll={{ x: true }}
    />
  );
}
