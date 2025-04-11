import dayjs from 'dayjs';
import { Tag } from 'antd';
import useLanguage from '@/locale/useLanguage';
import { tagColor } from '@/utils/statusTagColor';

import { useMoney, useDate } from '@/settings';
import PanenDataTableModule from '@/modules/PanenModule/PanenDataTableModule';

export default function Panen() {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const entity = 'panen';
  const { moneyFormatter } = useMoney();

  const searchConfig = {
    entity: 'tambak',
    displayLabels: ['name'],
    searchFields: 'name',
  };
  const deleteModalLabels = ['number', 'tambak.name'];
  const dataTableColumns = [
    {
      title: translate('Receipt Number'),
      dataIndex: 'receipt_number',
    },
    {
      title: translate('Tambak'),
      dataIndex: 'tambak',
    },
    {
      title: translate('Driver'),
      dataIndex: 'driver',
    },
    {
      title: translate('Staff'),
      dataIndex: 'staff',
    },
    {
      title: translate('Nopol'),
      dataIndex: 'nopol',
    },
    {
      title: translate('Tanggal'),
      dataIndex: 'tanggal_angkut',
      render: (date) => {
        return dayjs(date).format(dateFormat);
      },
    },
  ];

  const Labels = {
    PANEL_TITLE: translate('panen'),
    DATATABLE_TITLE: translate('panen_list'),
    ADD_NEW_ENTITY: translate('add_new_panen'),
    ENTITY_NAME: translate('panen'),

    RECORD_ENTITY: translate('detail_panen'),
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

  return <PanenDataTableModule config={config} />;
}
