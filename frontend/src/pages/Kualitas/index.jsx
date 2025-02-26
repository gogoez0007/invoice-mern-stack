import CrudModule from '@/modules/CrudModule/CrudModule';
import DynamicForm from '@/forms/DynamicForm';
import { fields } from './config';

import useLanguage from '@/locale/useLanguage';

export default function Kualitas() {
  const translate = useLanguage();
  const entity = 'kualitas';
  const searchConfig = {
    displayLabels: ['keterangan'],
    searchFields: 'keterangan',
  };
  const deleteModalLabels = ['keterangan'];

  const Labels = {
    PANEL_TITLE: translate('kualitas'),
    DATATABLE_TITLE: translate('kualitas_list'),
    ADD_NEW_ENTITY: translate('add_new_kualitas'),
    ENTITY_NAME: translate('kualitas'),
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
