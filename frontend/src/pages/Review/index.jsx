if (typeof window !== 'undefined') {
  window.QUOTE = '"'; // Atau '\'' jika menggunakan single quote di Excel
}
import useLanguage from '@/locale/useLanguage';
import ReviewModule from '@/modules/ReviewModule';

export default function bongkar() {
  const translate = useLanguage();
  return <ReviewModule />;
}
