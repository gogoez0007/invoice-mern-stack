import useLanguage from '@/locale/useLanguage';

import { useMoney, useDate } from '@/settings';
import KpiDataTableModule from '@/modules/KpiModule/KPIDataTableModule';

export default function bongkar() {
  const translate = useLanguage();
  const entity = 'kpi';


  const searchConfig = {
    entity: 'kpi',
    displayLabels: ['name'],
    searchFields: 'name',
  };

  const deleteModalLabels = ['number', 'tambak.name'];
  const dataTableColumns = [
    {
      title: translate('Nama'),
      dataIndex: 'name',
    },
    {
      title: translate('Bulan'),
      dataIndex: 'bulan',
    },
    {
      title: translate('Tahun'),
      dataIndex: 'tahun',
    },
  ];

  const Labels = {
    PANEL_TITLE: translate('Daftar KPI Karyawan'),
    DATATABLE_TITLE: translate('Daftar KPI'),
    ADD_NEW_ENTITY: translate('add_new_kpi'),
    ENTITY_NAME: translate('kpi'),

    RECORD_ENTITY: translate('detail_kpi'),
  };

  const configPage = {
    entity,
    ...Labels,
  };
  const config = {
    ...configPage,
    dataTableColumns,
    searchConfig,
    deleteModalLabels,
  };

  return <KpiDataTableModule config={config} />;
}
