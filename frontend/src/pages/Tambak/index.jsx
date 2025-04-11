import CrudModule from '@/modules/CrudModule/CrudModule';
import DynamicForm from '@/forms/DynamicForm';
import { fields } from './config';

import useLanguage from '@/locale/useLanguage';

export default function Tambak() {
  const translate = useLanguage();
  const entity = 'tambak';
  const searchConfig = {
    displayLabels: ['nama_perusahaan'],
    searchFields: 'nama_perusahaan',
  };
  const deleteModalLabels = ['nama_perusahaan'];

  const Labels = {
    PANEL_TITLE: translate('tambak'),
    DATATABLE_TITLE: translate('daftar tambak'),
    ADD_NEW_ENTITY: translate('add_new_tambak'),
    ENTITY_NAME: translate('tambak'),
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
