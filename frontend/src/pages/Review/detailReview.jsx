if (typeof window !== 'undefined') {
  window.QUOTE = '"'; // Atau '\'' jika menggunakan single quote di Excel
}
import useLanguage from '@/locale/useLanguage';
import ReviewDetailModule from '@/modules/ReviewModule/DetailReview';

export default function bongkar() {
  const translate = useLanguage();
  return <ReviewDetailModule />;
}

