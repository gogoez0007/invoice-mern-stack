import { useEffect, useState } from 'react';

import { Tag, Row, Col } from 'antd';
import useLanguage from '@/locale/useLanguage';

import { useMoney } from '@/settings';

import { request } from '@/request';
import useFetch from '@/hooks/useFetch';
import useOnFetch from '@/hooks/useOnFetch';

import RecentTable from './components/RecentTable';

import SummaryCard from './components/SummaryCard';
import PreviewCard from './components/PreviewCard';
import CustomerPreviewCard from './components/CustomerPreviewCard';
import AttendancePieChart from './components/AttendancePieChart';
import AttendanceLineChart from './components/AttendanceLineChart';
import SummaryAttendance  from './components/AttendanceTable';

import { selectMoneyFormat } from '@/redux/settings/selectors';
import { useSelector } from 'react-redux';

export default function DashboardModule() {
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

  // const { result: clientResult, isLoading: clientLoading } = useFetch(() =>
  //   request.summary({ entity: 'client' })
  // );

  // useEffect(() => {
  //   fetchAttendanceStats(request.attendance_stats({ entity: "attendance" }));
  //   fetchAttendanceLineStats(request.line_stats({ entity: "attendance" }));
  //   fetchAttendanceSummary(request.attendance_summary({ entity: "attendance" }));
  // }, []);


  useEffect(() => {
    const currency = money_format_settings.default_currency_code || null;

    if (currency) {
      // fetchInvoicesStats(getStatsData({ entity: 'invoice', currency }));
      // fetchQuotesStats(getStatsData({ entity: 'quote', currency }));
      // fetchPayemntsStats(getStatsData({ entity: 'payment', currency }));
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
          <Col className="gutter-row w-full" sm={{ span: 24 }} md={{ span: 24 }} lg={{ span: 18 }}>
            <div className="whiteBox shadow" style={{ height: 500, borderRadius: '16px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }}>
                <AttendanceLineChart
                  title="Tren Absensi Bulanan"
                  isLoading={attendanceLineLoading}
                  data={attendanceLineStatistics}
                />
            </div>
          </Col>
          <Col className="gutter-row w-full" sm={{ span: 24 }} md={{ span: 24 }} lg={{ span: 6 }}>
            <AttendancePieChart
              title="Statistik Absensi"
              isLoading={attendanceLoading}
              statistics={attendanceStatistics}
            />
          </Col>
        </Row>
        <div className="space30"></div>
        <Row gutter={[32, 32]}>
          <Col className="gutter-row w-full" sm={{ span: 24 }} lg={{ span: 8 }}>
            <div className="whiteBox shadow pad20" style={{ height: '100%', borderRadius: '16px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }}>
              <h3 style={{ color: '#22075e', marginBottom: 5, padding: '0 20px 20px' }}>
                {translate('Karyawan Tidak Hadir (Today)')}
              </h3>

              <RecentTable entity={'absen_today'} dataTableColumns={dataTableColumnsAbsen} />
            </div>
          </Col>

          <Col className="gutter-row w-full" sm={{ span: 24 }} lg={{ span: 8 }}>
            <div className="whiteBox shadow pad20" style={{ height: '100%', borderRadius: '16px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }}>
              <h3 style={{ color: '#22075e', marginBottom: 5, padding: '0 20px 20px' }}>
                {translate('Karyawan Telat (Today)')}
              </h3>
              <RecentTable entity={'telat_today'} dataTableColumns={dataTableColumns} />
            </div>
          </Col>

          <Col className="gutter-row w-full" sm={{ span: 24 }} lg={{ span: 8 }}>
            <div className="whiteBox shadow pad20" style={{ height: '100%' , borderRadius: '16px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }}>
              <h3 style={{ color: '#22075e', marginBottom: 5, padding: '0 20px 20px' }}>
                {translate('Top Telat Absen Bulan ini')}
              </h3>
              <RecentTable entity={'top_telat_monthly'} dataTableColumns={dataTableColumnsTop} />
            </div>
          </Col>
        </Row>
        <div className="space30"></div>
        <Row gutter={[32, 32]}>
          <Col className="gutter-row w-full" sm={{ span: 24 }} md={{ span: 24 }}>
              <SummaryAttendance 
                attendanceSummary={attendanceSummary} 
                isLoading={attendanceSummaryLoading} 
              />
          </Col>
        </Row>
      </>
    );
  } else {
    return <></>;
  }
}
