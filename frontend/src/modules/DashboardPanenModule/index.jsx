import { useEffect, useState } from 'react';
import { Tag, Row, Col } from 'antd';
import useLanguage from '@/locale/useLanguage';
import { useMoney } from '@/settings';
import { request } from '@/request';
import useOnFetch from '@/hooks/useOnFetch';

import RecentTable from './components/RecentTable';
import CustomerPreviewCard from './components/CustomerPreviewCard';
import PanenPieChart from './components/PanenPieChart';
import PanenBarLineChart from './components/PanenBarLineChart';
import SummaryAttendance from './components/AttendanceTable';
import SankeyChart from './components/SankeyChart';  // Import SankeyChart

import { selectMoneyFormat } from '@/redux/settings/selectors';
import { useSelector } from 'react-redux';

export default function DashboardPanenModule() {
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();
  const money_format_settings = useSelector(selectMoneyFormat);

  const getStatsData = async ({ entity, currency }) => {
    return await request.summary({
      entity,
      options: { currency },
    });
  };

  const {
    result: invoiceResult,
    isLoading: invoiceLoading,
    onFetch: fetchInvoicesStats,
  } = useOnFetch();

  const { result: quoteResult, isLoading: quoteLoading, onFetch: fetchQuotesStats } = useOnFetch();

  const {
    result: paymentResult,
    isLoading: paymentLoading,
    onFetch: fetchPayemntsStats,
  } = useOnFetch();

  const {
    result: attendanceResult,
    isLoading: attendanceLoading,
    onFetch: fetchAttendanceStats,
  } = useOnFetch();

  const {
    result: attendanceLineResult,
    isLoading: attendanceLineLoading,
    onFetch: fetchAttendanceLineStats,
  } = useOnFetch();

  const {
    result: attendanceSummaryResult,
    isLoading: attendanceSummaryLoading,
    onFetch: fetchAttendanceSummary,
  } = useOnFetch();

  useEffect(() => {
    const currency = money_format_settings.default_currency_code || null;

    if (currency) {
    }
  }, [money_format_settings.default_currency_code]);

  const dataTableColumns = [
    {
      title: translate('Nama Karyawan'),
      dataIndex: 'name',
    },
    {
      title: translate('Jam'),
      dataIndex: 'check_in_time',
    },
  ];

  const dataTableColumnsAbsen = [
    {
      title: translate('Nama Karyawan'),
      dataIndex: 'name',
    },
    {
      title: translate('Posisi'),
      dataIndex: 'position',
    },
  ];

  const dataTableColumnsTop = [
    {
      title: translate('Nama Karyawan'),
      dataIndex: 'name',
    },
    {
      title: translate('Posisi'),
      dataIndex: 'position',
    },
    {
      title: translate('Jumlah Telat'),
      dataIndex: 'late_count',
    },
  ];

  const attendanceStatistics =
    !attendanceLoading &&
    attendanceResult?.performance?.map((item) => ({
      name: item?.status,
      value: item?.count,
    }));

  const attendanceLineStatistics =
    !attendanceLineLoading &&
    attendanceLineResult?.trend?.map((item) => ({
      date: item?.date, // Format tanggal yang diambil
      present: item?.present || 0,
      absent: item?.absent || 0,
      late: item?.late || 0,
    }));

  const attendanceSummary =
    !attendanceSummaryLoading &&
    attendanceSummaryResult?.summary?.map((item) => ({
      name: item?.name,
      department: item?.department,
      position: item?.position,
      attendance: item?.attendance || [],
    }));

  if (money_format_settings) {
    return (
      <>
        <Row gutter={[32, 32]}>
          <Col className="gutter-row w-full" sm={{ span: 24 }} md={{ span: 24 }} lg={{ span: 24 }}>
            <div >
              <PanenBarLineChart
                title="Tren Panen"
              />
            </div>
          </Col>
        </Row>
        {/* Tambahkan Sankey Chart */}
        <Row gutter={[32, 32]}>
          <Col className="gutter-row w-full" sm={{ span: 24 }} md={{ span: 24 }} lg={{ span: 24 }}>
            <div >
              <SankeyChart
                title="Sankey Diagram"
              />
            </div>
          </Col>
        </Row>
        <Row gutter={[32, 32]}>
          <Col className="gutter-row w-full" sm={{ span: 24 }} md={{ span: 24 }} lg={{ span: 12 }}>
            <div>
              <PanenPieChart
                title="Statistik Panen (Bulan)"
                filterMode='Bulan'
                isLoading={attendanceLoading}
                statistics={attendanceStatistics}
              />
            </div>
          </Col>
          <Col className="gutter-row w-full" sm={{ span: 24 }} md={{ span: 24 }} lg={{ span: 12 }}>
            <div >
              <PanenPieChart
                title="Statistik Panen (Tahun)"
                isLoading={attendanceLoading}
                statistics={attendanceStatistics}
              />
            </div>
          </Col>
        </Row>
      </>
    );
  } else {
    return <></>;
  }
}
