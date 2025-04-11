import { ErpLayout } from '@/layout';
import CreateItem from '@/modules/ErpPanelModule/CreateItem';
import BongkarForm from '@/modules/BongkarModule/Forms/BongkarForm';

export default function CreateBongkarModule({ config }) {
  return (
    <ErpLayout>
      <CreateItem config={config} CreateForm={BongkarForm} />
    </ErpLayout>
  );
}
