import useLanguage from '@/locale/useLanguage';

import { useMoney, useDate } from '@/settings';
import BongkarDataTableModule from '@/modules/BongkarModule/BongkarDataTableModule';

export default function bongkar() {
  const translate = useLanguage();
  const entity = 'bongkar';


  const searchConfig = {
    entity: 'bongkar',
    displayLabels: ['nama_pabrik', 'nopol', 'tanggal_bongkar'],
    searchFields: ['nama_pabrik'],
  };

  const deleteModalLabels = ['number', 'tambak.name'];
  const dataTableColumns = [
    {
      title: translate('Tanggal Bongkar'),
      dataIndex: 'tanggal_bongkar',
    },
    {
      title: translate('Pabrik'),
      dataIndex: 'nama_pabrik',
    },
    {
      title: translate('Tambak'),
      dataIndex: 'tambak',
    },
    {
      title: translate('Lokasi Panen'),
      dataIndex: 'lokasi',
    },
    {
      title: translate('Nopol'),
      dataIndex: 'nopol',
    },
  ];

  const Labels = {
    PANEL_TITLE: translate('bongkar'),
    DATATABLE_TITLE: translate('bongkar_list'),
    ADD_NEW_ENTITY: translate('add_new_bongkar'),
    ENTITY_NAME: translate('bongkar'),

    RECORD_ENTITY: translate('detail_bongkar'),
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

  return <BongkarDataTableModule config={config} />;
}
