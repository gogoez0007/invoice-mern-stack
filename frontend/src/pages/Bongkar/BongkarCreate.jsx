import useLanguage from '@/locale/useLanguage';
import CreateBongkarModule from '@/modules/BongkarModule/CreateBongkarModule';

export default function BongkarCreate() {
  const entity = 'bongkar';
  const translate = useLanguage();
  const Labels = {
    PANEL_TITLE: translate('bongkar'),
    DATATABLE_TITLE: translate('bongkar_list'),
    ADD_NEW_ENTITY: translate('add_new_bongkar'),
    ENTITY_NAME: translate('bongkar'),
  };

  const configPage = {
    entity,
    ...Labels,
  };
  return <CreateBongkarModule config={configPage} />;
}
