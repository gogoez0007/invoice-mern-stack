import useLanguage from '@/locale/useLanguage';
import CreateKpiModule from '@/modules/KpiModule/CreateKpiModule';

export default function KpiCreate() {
    const entity = 'kpi';
    const translate = useLanguage();
    const Labels = {
        PANEL_TITLE: translate('kpi'),
        DATATABLE_TITLE: translate('kpi_list'),
        ADD_NEW_ENTITY: translate('add_new_kpi'),
        ENTITY_NAME: translate('kpi'),
    };

    const configPage = {
        entity,
        ...Labels,
    };
    return <CreateKpiModule config={configPage} />;
}
