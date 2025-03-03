import { ErpLayout } from '@/layout';
import CreateItem from '@/modules/ErpPanelModule/CreateItem';
import PanenForm from '@/modules/PanenModule/Forms/PanenForm';

export default function CreatePanenModule({ config }) {
  return (
    <ErpLayout>
      <CreateItem config={config} CreateForm={PanenForm} />
    </ErpLayout>
  );
}
