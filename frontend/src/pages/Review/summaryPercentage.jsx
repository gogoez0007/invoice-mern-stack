import useLanguage from '@/locale/useLanguage';
import SummaryBobot from '@/modules/ReviewModule/SummaryBobot';

export default function summaryBobot() {
  const translate = useLanguage();
  return <SummaryBobot />;
}

