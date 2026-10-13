import { Switch, Tag, message, Popconfirm, Space } from 'antd';
import CrudModule from '@/modules/CrudModule/CrudModule';
import DynamicForm from '@/forms/DynamicForm';
import { fields } from './config';
import useLanguage from '@/locale/useLanguage';
import { useDispatch } from 'react-redux';
import { crud } from '@/redux/crud/actions';
import axios from 'axios';
import { API_BASE_URL } from '@/config/serverApiConfig';

export default function Karyawan() {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const entity = 'employees';

  const searchConfig = {
    displayLabels: ['name'],
    searchFields: 'name',
  };
  const deleteModalLabels = ['name'];

  const handleToggleActive = async (record, checked) => {
    try {
      const res = await axios.patch(`${API_BASE_URL}employees/${record.id}/toggle-status`, {
        is_active: checked ? 1 : 0,
      });
      if (res.data?.success) {
        message.success(
          res.data.message ||
            `Status karyawan ${record.name} berhasil diubah menjadi ${checked ? 'Aktif' : 'Non-Aktif'}.`
        );
        dispatch(crud.list({ entity: 'employees' }));
      }
    } catch (err) {
      message.error(
        'Gagal mengubah status karyawan: ' + (err.response?.data?.message || err.message)
      );
    }
  };

  const dataTableColumns = [
    {
      title: 'Nama Karyawan',
      dataIndex: 'name',
      render: (text, record) => (
        <Space>
          <span style={{ fontWeight: 600 }}>{text}</span>
          {(record.is_active === 0 || record.is_active === false) && (
            <Tag color="error">OFF</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Posisi / Jabatan',
      dataIndex: 'position',
    },
    {
      title: 'Lokasi',
      dataIndex: 'lokasi',
    },
    {
      title: 'Shift',
      dataIndex: 'shift',
    },
    {
      title: 'Status Karyawan (ON / OFF)',
      dataIndex: 'is_active',
      align: 'center',
      render: (status, record) => {
        const isActive = status === 1 || status === true || status === '1' || status === undefined || status === null;
        return (
          <Popconfirm
            title={isActive ? 'Non-aktifkan Karyawan?' : 'Aktifkan Karyawan Kembali?'}
            description={
              isActive
                ? 'Karyawan ini tidak akan lagi muncul di monitoring dashboard absensi & absen harian.'
                : 'Karyawan ini akan aktif kembali di sistem absensi harian.'
            }
            onConfirm={() => handleToggleActive(record, !isActive)}
            okText="Ya, Ubah"
            cancelText="Batal"
          >
            <Space direction="vertical" size={2} align="center">
              <Switch
                checked={isActive}
                checkedChildren="ON"
                unCheckedChildren="OFF"
                style={{ backgroundColor: isActive ? '#52c41a' : '#ff4d4f' }}
              />
              <Tag color={isActive ? 'success' : 'error'} style={{ margin: 0, fontSize: 11 }}>
                {isActive ? 'Aktif Bekerja' : 'Non-Aktif / OFF'}
              </Tag>
            </Space>
          </Popconfirm>
        );
      },
    },
  ];

  const Labels = {
    PANEL_TITLE: translate('karyawan'),
    DATATABLE_TITLE: translate('karyawan_list'),
    ADD_NEW_ENTITY: translate('add_new_karyawan'),
    ENTITY_NAME: translate('karyawan'),
  };
  const configPage = {
    entity,
    ...Labels,
  };
  const config = {
    ...configPage,
    dataTableColumns,
    fields: null, // Mengarahkan DataTable menggunakan kolom kustom berfitur switch status ON/OFF
    searchConfig,
    deleteModalLabels,
  };

  return (
    <CrudModule
      createForm={<DynamicForm fields={fields} />}
      updateForm={<DynamicForm fields={fields} />}
      config={config}
    />
  );
}
