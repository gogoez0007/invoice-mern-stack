import { lazy } from 'react';

import { Navigate } from 'react-router-dom';

const Logout = lazy(() => import('@/pages/Logout.jsx'));
const NotFound = lazy(() => import('@/pages/NotFound.jsx'));

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const DashboardPanen = lazy(() => import('@/pages/DashboardPanen'));
const DashboardBongkar = lazy(() => import('@/pages/DashboardBongkar'));
const DashboardProductivity = lazy(() => import('@/pages/DashboarProductivity'));
const DashboardPonds = lazy(() => import('@/pages/DashboardPonds'));
const Customer = lazy(() => import('@/pages/Customer'));
const Invoice = lazy(() => import('@/pages/Invoice'));
const InvoiceCreate = lazy(() => import('@/pages/Invoice/InvoiceCreate'));

const InvoiceRead = lazy(() => import('@/pages/Invoice/InvoiceRead'));
const InvoiceUpdate = lazy(() => import('@/pages/Invoice/InvoiceUpdate'));
const InvoiceRecordPayment = lazy(() => import('@/pages/Invoice/InvoiceRecordPayment'));
const Quote = lazy(() => import('@/pages/Quote/index'));
const QuoteCreate = lazy(() => import('@/pages/Quote/QuoteCreate'));
const QuoteRead = lazy(() => import('@/pages/Quote/QuoteRead'));
const QuoteUpdate = lazy(() => import('@/pages/Quote/QuoteUpdate'));
const Payment = lazy(() => import('@/pages/Payment/index'));
const PaymentRead = lazy(() => import('@/pages/Payment/PaymentRead'));
const PaymentUpdate = lazy(() => import('@/pages/Payment/PaymentUpdate'));

const Settings = lazy(() => import('@/pages/Settings/Settings'));
const PaymentMode = lazy(() => import('@/pages/PaymentMode'));
const Taxes = lazy(() => import('@/pages/Taxes'));

const Profile = lazy(() => import('@/pages/Profile'));

const About = lazy(() => import('@/pages/About'));

//Tambak
const Tambak = lazy(() => import('@/pages/Tambak'));
//Supir
const Supir = lazy(() => import('@/pages/Supir'));
const Kualitas = lazy(() => import('@/pages/Kualitas'));
const Lokasi = lazy(() => import('@/pages/Lokasi'));
const Shift = lazy(() => import('@/pages/Shift'));
const Karyawan = lazy(() => import('@/pages/Karyawan'));
//Panen
const Panen = lazy(() => import('@/pages/Panen'));
const PanenRead = lazy(() => import('@/pages/Panen/PanenRead'));

//Bongkar
const Bongkar = lazy(() => import('@/pages/Bongkar'));
const BongkarCreate = lazy(() => import('@/pages/Bongkar/BongkarCreate'));
const BongkarRead = lazy(() => import('@/pages/Bongkar/BongkarRead'));
const BongkarUpdate = lazy(() => import('@/pages/Bongkar/BongkarUpdate'));

const ReviewTrade = lazy(() => import('@/pages/Review'));
const ReviewTradeDetail = lazy(() => import('@/pages/Review/detailReview'));
const SummaryPercentage = lazy(() => import('@/pages/Review/summaryPercentage'));

//KPI
const Kpi = lazy(() => import('@/pages/Kpi'));
const KpiCreate = lazy(() => import('@/pages/Kpi/KpiCreate'));
const KpiUpdate = lazy(() => import('@/pages/Kpi/KpiUpdate'));

//Spb
const Spb = lazy(() => import('@/pages/Spb'));
const SpbCreate = lazy(() => import('@/pages/Spb/SpbCreate'));
const SpbUpdate = lazy(() => import('@/pages/Spb/SpbUpdate'));
const SpbRead = lazy(() => import('@/pages/Spb/SPBRead'));
const SPBAnalytics = lazy(() => import('@/pages/Spb/SPBAnalytics'));
const ManageAttendance = lazy(() => import('@/pages/ManageAttendance'));

let routes = {
  expense: [],
  default: [
    {
      path: '/login',
      element: <Navigate to="/" />,
    },
    {
      path: '/logout',
      element: <Logout />,
    },
    {
      path: '/about',
      element: <About />,
    },
    {
      path: '/dashboard_panen',
      element: <DashboardPanen />,
    },
    {
      path: '/dashboard_bongkar',
      element: <DashboardBongkar />,
    },
    {
      path: '/',
      element: <Dashboard />,
    },
    {
      path: '/dashboard_productivity',
      element: <DashboardProductivity />,
    },
    {
      path: '/dashboard_ponds',
      element: <DashboardPonds />,
    },
    {
      path: '/customer',
      element: <Customer />,
    },

    {
      path: '/invoice',
      element: <Invoice />,
    },
    {
      path: '/invoice/create',
      element: <InvoiceCreate />,
    },
    {
      path: '/invoice/read/:id',
      element: <InvoiceRead />,
    },
    {
      path: '/invoice/update/:id',
      element: <InvoiceUpdate />,
    },
    {
      path: '/invoice/pay/:id',
      element: <InvoiceRecordPayment />,
    },
    {
      path: '/quote',
      element: <Quote />,
    },
    {
      path: '/quote/create',
      element: <QuoteCreate />,
    },
    {
      path: '/quote/read/:id',
      element: <QuoteRead />,
    },
    {
      path: '/quote/update/:id',
      element: <QuoteUpdate />,
    },
    {
      path: '/payment',
      element: <Payment />,
    },
    {
      path: '/payment/read/:id',
      element: <PaymentRead />,
    },
    {
      path: '/payment/update/:id',
      element: <PaymentUpdate />,
    },

    {
      path: '/settings',
      element: <Settings />,
    },
    {
      path: '/settings/edit/:settingsKey',
      element: <Settings />,
    },
    {
      path: '/payment/mode',
      element: <PaymentMode />,
    },
    {
      path: '/taxes',
      element: <Taxes />,
    },

    {
      path: '/profile',
      element: <Profile />,
    },
    {
      path: '/tambak',
      element: <Tambak />,
    },
    {
      path: '/driver',
      element: <Supir />,
    },
    {
      path: '/kualitas',
      element: <Kualitas />,
    },
    {
      path: '/lokasi',
      element: <Lokasi />,
    },
    {
      path: '/shift',
      element: <Shift />,
    },
    {
      path: '/karyawan',
      element: <Karyawan />,
    },
    {
      path: '/kpi',
      element: <Kpi />,
    },
    {
      path: '/kpi/create',
      element: <KpiCreate />,
    },
    {
      path: '/kpi/update/:id',
      element: <KpiUpdate />,
    },
    {
      path: '/panen',
      element: <Panen />,
    },
    {
      path: '/panen/read/:id',
      element: <PanenRead />,
    },
    {
      path: '/bongkar',
      element: <Bongkar />,
    },
    {
      path: '/bongkar/create',
      element: <BongkarCreate />,
    },
    {
      path: '/bongkar/read/:id',
      element: <BongkarRead />,
    },
    {
      path: '/bongkar/update/:id',
      element: <BongkarUpdate />,
    },
    {
      path: '/review',
      element: <ReviewTrade />,
    },
    {
      path: '/review/process',
      element: <ReviewTradeDetail />,
    },
    {
      path: '/review/summary_percentage',
      element: <SummaryPercentage />,
    },
    {
      path: '/spb',
      element: <Spb />,
    },
    {
      path: '/spb/create',
      element: <SpbCreate />,
    },
    {
      path: '/spb/update/:id',
      element: <SpbUpdate />,
    },
    {
      path: '/spb/read/:id',
      element: <SpbRead />,
    },
    {
      path: '/spb/analytics',
      element: <SPBAnalytics />,
    },
    {
      path: '/attendance/manage',
      element: <ManageAttendance />,
    },
    {
      path: '*',
      element: <NotFound />,
    },
  ],
};

export default routes;
