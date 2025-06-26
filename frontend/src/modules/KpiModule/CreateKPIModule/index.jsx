import { ErpLayout } from '@/layout';
import CreateItem from '@/modules/ErpPanelModule/CreateItem';
import KpiForm from '@/modules/KpiModule/Forms/KpiForm';

export default function CreateKpiModule({ config }) {
  return (
    <ErpLayout>
      <CreateItem config={config} CreateForm={KpiForm} />
    </ErpLayout>
  );
}
