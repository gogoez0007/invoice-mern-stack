import useLanguage from '@/locale/useLanguage';
import ReadPanenModule from '@/modules/PanenModule/ReadPanenModule';

export default function PanenRead() {
  const entity = 'panen';
  const translate = useLanguage();
  const Labels = {
    PANEL_TITLE: translate('panen'),
    DATATABLE_TITLE: translate('panen_list'),
    ADD_NEW_ENTITY: translate('add_new_panen'),
    ENTITY_NAME: translate('panen'),

    RECORD_ENTITY: translate('record_payment'),
  };

  const configPage = {
    entity,
    ...Labels,
  };
  return <ReadPanenModule config={configPage} />;
}
