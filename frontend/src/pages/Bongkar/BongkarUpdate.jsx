import useLanguage from '@/locale/useLanguage';
import UpdateBongkarModule from '@/modules/BongkarModule/UpdateBongkarModule';

export default function BongkarUpdate() {
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
  return <UpdateBongkarModule config={configPage} />;
}
