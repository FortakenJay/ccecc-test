// app/not-found.tsx
import Link from 'next/link';
import { FaArrowLeft } from "react-icons/fa6";
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('NotFound');

  return (
    <div className="h-screen w-full flex justify-center items-center bg-linear-to-br pb-20 from-primary-50 to-secondary-100 px-4">
      <div className="flex flex-col items-center gap-y-6 p-10 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full text-center animate-fadeIn">
        
        {/* Big 404 */}
        <h1 className="text-7xl font-extrabold text-primary-600 tracking-widest drop-shadow-sm">
          404
        </h1>

        {/* Message */}
        <p className="text-lg text-gray-700">
          {t('message')}
        </p>

        {/* Link */}
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-black font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 active:scale-95"
        >
          <FaArrowLeft className="w-5 h-5" />
          {t('backHome')}
        </Link>
      </div>
    </div>
  );
}
