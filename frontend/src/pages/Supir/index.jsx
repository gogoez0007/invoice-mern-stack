import CrudModule from '@/modules/CrudModule/CrudModule';
import DynamicForm from '@/forms/DynamicForm';
import { fields } from './config';

import useLanguage from '@/locale/useLanguage';

export default function Supir() {
  const translate = useLanguage();
  const entity = 'driver';
  const searchConfig = {
    displayLabels: ['nama_driver'],
    searchFields: 'nama_driver',
  };
  const deleteModalLabels = ['nama_driver'];

  const Labels = {
    PANEL_TITLE: translate('driver'),
    DATATABLE_TITLE: translate('driver_list'),
    ADD_NEW_ENTITY: translate('add_new_driver'),
    ENTITY_NAME: translate('driver'),
  };
  const configPage = {
    entity,
    ...Labels,
  };
  const config = {
    ...configPage,
    fields,
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
