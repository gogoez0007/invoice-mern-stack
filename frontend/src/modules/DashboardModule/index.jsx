import { useEffect, useState } from 'react';

import { Tag, Row, Col, Tabs, Segmented } from 'antd';
import { CloseCircleOutlined, ClockCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import useResponsive from '@/hooks/useResponsive';

import { useMoney } from '@/settings';

import { request } from '@/request';
import useFetch from '@/hooks/useFetch';
import useOnFetch from '@/hooks/useOnFetch';

import RecentTable from './components/RecentTable';

import SummaryCard from './components/SummaryCard';
import PreviewCard from './components/PreviewCard';
import CustomerPreviewCard from './components/CustomerPreviewCard';
import AttendanceAnalyticsSection from './components/AttendanceAnalyticsSection';
import SummaryAttendance from './components/AttendanceTable';

import { selectMoneyFormat } from '@/redux/settings/selectors';
import { useSelector } from 'react-redux';

export default function DashboardModule() {
  const translate = useLanguage();
  const { isMobile } = useResponsive();
  const [chartTabKey, setChartTabKey] = useState('line');
  const [recentTabKey, setRecentTabKey] = useState('absen_today');
  const [selectedEntitasIds, setSelectedEntitasIds] = useState([]);
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
        <AttendanceAnalyticsSection onEntitasChange={setSelectedEntitasIds} />
        <div className="space30"></div>
        {isMobile ? (
          <div
            className="whiteBox shadow pad15"
            style={{
              borderRadius: '16px',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
              marginBottom: 20,
            }}
          >
            <div style={{ marginBottom: 14 }}>
              <Segmented
                block
                value={recentTabKey}
                onChange={setRecentTabKey}
                options={[
                  { label: '❌ Tidak Hadir', value: 'absen_today' },
                  { label: '⚠️ Telat (Today)', value: 'telat_today' },
                  { label: '🏆 Top Telat', value: 'top_telat_monthly' },
                ]}
                style={{
                  padding: 4,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 12,
                }}
              />
            </div>

            <div style={{ padding: '0 4px' }}>
              <div style={{ display: recentTabKey === 'absen_today' ? 'block' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 14 }}>
                    ❌ {translate('Karyawan Tidak Hadir')}
                  </span>
                  <Tag color="error">Hari Ini</Tag>
                </div>
                <RecentTable entity={'absen_today'} entitasIds={selectedEntitasIds} dataTableColumns={dataTableColumnsAbsen} />
              </div>

              <div style={{ display: recentTabKey === 'telat_today' ? 'block' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 14 }}>
                    ⚠️ {translate('Karyawan Telat')}
                  </span>
                  <Tag color="warning">Hari Ini</Tag>
                </div>
                <RecentTable entity={'telat_today'} entitasIds={selectedEntitasIds} dataTableColumns={dataTableColumns} />
              </div>

              <div style={{ display: recentTabKey === 'top_telat_monthly' ? 'block' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: '#3b82f6', fontWeight: 700, fontSize: 14 }}>
                    🏆 {translate('Top Telat Absen')}
                  </span>
                  <Tag color="processing">Bulan Ini</Tag>
                </div>
                <RecentTable entity={'top_telat_monthly'} entitasIds={selectedEntitasIds} dataTableColumns={dataTableColumnsTop} />
              </div>
            </div>
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            <Col className="gutter-row w-full" sm={{ span: 24 }} lg={{ span: 8 }}>
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 18,
                  padding: '20px',
                  boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                  border: '1px solid #f1f5f9',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                    paddingBottom: 14,
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: '#fef2f2',
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                      }}
                    >
                      <CloseCircleOutlined />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14.5, color: '#0f172a', lineHeight: 1.2 }}>
                        {translate('Karyawan Tidak Hadir')}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                        Belum check-in hari ini
                      </div>
                    </div>
                  </div>
                  <Tag color="error" style={{ margin: 0, borderRadius: 6, fontWeight: 600, fontSize: 11 }}>
                    Hari Ini
                  </Tag>
                </div>

                <div style={{ flex: 1 }}>
                  <RecentTable entity={'absen_today'} entitasIds={selectedEntitasIds} dataTableColumns={dataTableColumnsAbsen} />
                </div>
              </div>
            </Col>

            <Col className="gutter-row w-full" sm={{ span: 24 }} lg={{ span: 8 }}>
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 18,
                  padding: '20px',
                  boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                  border: '1px solid #f1f5f9',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                    paddingBottom: 14,
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: '#fffbeb',
                        color: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                      }}
                    >
                      <ClockCircleOutlined />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14.5, color: '#0f172a', lineHeight: 1.2 }}>
                        {translate('Karyawan Telat')}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                        Masuk setelah jam kerja
                      </div>
                    </div>
                  </div>
                  <Tag color="warning" style={{ margin: 0, borderRadius: 6, fontWeight: 600, fontSize: 11 }}>
                    Hari Ini
                  </Tag>
                </div>

                <div style={{ flex: 1 }}>
                  <RecentTable entity={'telat_today'} entitasIds={selectedEntitasIds} dataTableColumns={dataTableColumns} />
                </div>
              </div>
            </Col>

            <Col className="gutter-row w-full" sm={{ span: 24 }} lg={{ span: 8 }}>
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 18,
                  padding: '20px',
                  boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                  border: '1px solid #f1f5f9',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                    paddingBottom: 14,
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: '#eff6ff',
                        color: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                      }}
                    >
                      <TrophyOutlined />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14.5, color: '#0f172a', lineHeight: 1.2 }}>
                        {translate('Top Telat Absen')}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                        Akumulasi bulan berjalan
                      </div>
                    </div>
                  </div>
                  <Tag color="processing" style={{ margin: 0, borderRadius: 6, fontWeight: 600, fontSize: 11 }}>
                    Bulan Ini
                  </Tag>
                </div>

                <div style={{ flex: 1 }}>
                  <RecentTable entity={'top_telat_monthly'} entitasIds={selectedEntitasIds} dataTableColumns={dataTableColumnsTop} />
                </div>
              </div>
            </Col>
          </Row>
        )}
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
