import useLanguage from '@/locale/useLanguage';
import UpdateKPIModule from '@/modules/KpiModule/UpdateKPIModule';

export default function KpiUpdate() {
  const entity = 'kpi';
  const translate = useLanguage();
  const Labels = {
    PANEL_TITLE: translate('KPI'),
    DATATABLE_TITLE: translate('KPI_list'),
    ADD_NEW_ENTITY: translate('add_new_KPI'),
    ENTITY_NAME: translate('kpi'),

    RECORD_ENTITY: translate('record_payment'),
  };

  const configPage = {
    entity,
    ...Labels,
  };
  return <UpdateKPIModule config={configPage} />;
}
