import useLanguage from '@/locale/useLanguage';
import ReadBongkarModule from '@/modules/BongkarModule/ReadBongkarModule';

export default function BongkarRead() {
  const entity = 'bongkar';
  const translate = useLanguage();
  const Labels = {
    PANEL_TITLE: translate('bongkar'),
    DATATABLE_TITLE: translate('bongkar_list'),
    ADD_NEW_ENTITY: translate('add_new_bongkar'),
    ENTITY_NAME: translate('bongkar'),

    RECORD_ENTITY: translate('record_payment'),
  };

  const configPage = {
    entity,
    ...Labels,
  };
  return <ReadBongkarModule config={configPage} />;
}
