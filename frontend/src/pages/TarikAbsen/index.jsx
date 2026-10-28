import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  DatePicker,
  Button,
  Typography,
  Divider,
  Tag,
  Alert,
  message,
  Tooltip,
} from 'antd';
import {
  FileExcelOutlined,
  DownloadOutlined,
  CalendarOutlined,
  CloudDownloadOutlined,
  CopyOutlined,
  CheckOutlined,
  InfoCircleOutlined,
  TableOutlined,
  BarChartOutlined,
  CheckCircleTwoTone,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import useResponsive from '@/hooks/useResponsive';

const { Title, Text, Paragraph } = Typography;

const BULAN_INDONESIA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const BASE_TARIK_ABSEN_URL = 'https://attendance-report.delmargroup.co.id';

export default function TarikAbsenPage() {
  const { isMobile } = useResponsive();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const getTargetUrl = (dateObj) => {
    const d = dateObj || dayjs();
    const monthIndex = d.month(); // 0 - 11
    const monthName = BULAN_INDONESIA[monthIndex];
    const year = d.year();
    return `${BASE_TARIK_ABSEN_URL}/getsummaryabsen/${monthName}-${year}`;
  };

  const currentTargetUrl = getTargetUrl(selectedDate);
  const currentMonthYearLabel = `${BULAN_INDONESIA[selectedDate.month()]} ${selectedDate.year()}`;

  const handleDownload = () => {
    setDownloading(true);
    message.loading({ content: `Memproses download laporan ${currentMonthYearLabel}...`, key: 'download' });

    try {
      const win = window.open(currentTargetUrl, '_blank');
      if (!win) {
        const a = document.createElement('a');
        a.href = currentTargetUrl;
        a.target = '_blank';
        a.download = `Laporan_Absensi_Jam_Kerja_${BULAN_INDONESIA[selectedDate.month()]}-${selectedDate.year()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      message.success({ content: `Download laporan ${currentMonthYearLabel} dimulai!`, key: 'download' });
    } catch (err) {
      console.error('Download error:', err);
      message.error({ content: 'Gagal mendownload laporan: ' + err.message, key: 'download' });
    } finally {
      setTimeout(() => setDownloading(false), 1200);
    }
  };

  const handleQuickSelect = (monthsBack) => {
    setSelectedDate(dayjs().subtract(monthsBack, 'month'));
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentTargetUrl);
    setCopied(true);
    message.success('URL endpoint berhasil disalin ke clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: isMobile ? 12 : 20, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header Banner */}
      <Card
        className="shadow-sm"
        style={{
          marginBottom: 20,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #047857 0%, #0d9488 50%, #0284c7 100%)',
          border: 'none',
          boxShadow: '0 8px 24px rgba(4, 120, 87, 0.18)',
        }}
        bodyStyle={{ padding: isMobile ? '16px 18px' : '24px 28px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 14,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 28,
              flexShrink: 0,
            }}
          >
            <FileExcelOutlined />
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Title level={3} style={{ margin: 0, color: '#ffffff', fontWeight: 700 }}>
                Tarik Absen & Generate Laporan Excel
              </Title>
              <Tag color="green" style={{ fontWeight: 600, border: 'none', background: '#ecfdf5', color: '#047857' }}>
                Service Aktif
              </Tag>
            </div>
            <Text style={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: 13, marginTop: 4, display: 'block' }}>
              Ekspor rekapitulasi data absensi, jam kerja efektif harian, dan kehadiran karyawan langsung dari service Tarik Absen.
            </Text>
          </div>
        </div>
      </Card>

      <Row gutter={[20, 20]}>
        {/* Kolom Kiri: Form Download & Periode */}
        <Col xs={24} lg={13} xl={14}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CloudDownloadOutlined style={{ color: '#059669', fontSize: 18 }} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>Pilih Periode & Download</span>
              </div>
            }
            className="shadow-sm"
            style={{ borderRadius: 12, height: '100%', border: '1px solid #e2e8f0' }}
            bodyStyle={{ padding: isMobile ? 16 : 24 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22, width: '100%' }}>
              {/* Bagian 1: Pemilihan Periode */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#334155', marginBottom: 8 }}>
                  Bulan & Tahun Laporan:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <DatePicker
                    picker="month"
                    allowClear={false}
                    value={selectedDate}
                    onChange={(val) => val && setSelectedDate(val)}
                    style={{ minWidth: 220, height: 42, borderRadius: 8, fontSize: 14 }}
                    format="MMMM YYYY"
                  />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button
                      size="middle"
                      style={{ borderRadius: 6, fontWeight: 500 }}
                      onClick={() => handleQuickSelect(0)}
                    >
                      Bulan Ini
                    </Button>
                    <Button
                      size="middle"
                      style={{ borderRadius: 6, fontWeight: 500 }}
                      onClick={() => handleQuickSelect(1)}
                    >
                      Bulan Lalu
                    </Button>
                    <Button
                      size="middle"
                      style={{ borderRadius: 6, fontWeight: 500 }}
                      onClick={() => handleQuickSelect(2)}
                    >
                      2 Bulan Lalu
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bagian 2: Target URL Endpoint Box */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                    Target Endpoint Generator:
                  </span>
                  <Tooltip title="Salin URL Endpoint">
                    <Button
                      type="text"
                      size="small"
                      icon={copied ? <CheckOutlined style={{ color: '#059669' }} /> : <CopyOutlined />}
                      onClick={handleCopyUrl}
                      style={{ fontSize: 12, color: copied ? '#059669' : '#64748b' }}
                    >
                      {copied ? 'Tersalin' : 'Salin URL'}
                    </Button>
                  </Tooltip>
                </div>
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    padding: '8px 12px',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    fontSize: 13,
                    color: '#047857',
                    fontWeight: 500,
                  }}
                >
                  {currentTargetUrl}
                </div>
              </div>

              {/* Bagian 3: Tombol Download Utama */}
              <div>
                <Button
                  type="primary"
                  size="large"
                  icon={<DownloadOutlined style={{ fontSize: 18 }} />}
                  loading={downloading}
                  onClick={handleDownload}
                  style={{
                    width: '100%',
                    height: 50,
                    fontSize: 15,
                    fontWeight: 700,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    borderColor: '#059669',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
                  }}
                >
                  Download Laporan Excel ({currentMonthYearLabel})
                </Button>
                <Text
                  type="secondary"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    fontSize: 12,
                    marginTop: 10,
                    color: '#64748b',
                  }}
                >
                  *File (.xlsx) di-generate secara real-time langsung dari engine ExcelJS server Tarik Absen.
                </Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* Kolom Kanan: Panduan & Informasi Laporan */}
        <Col xs={24} lg={11} xl={10}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <InfoCircleOutlined style={{ color: '#0284c7', fontSize: 18 }} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>Struktur Spreadsheet Laporan</span>
              </div>
            }
            className="shadow-sm"
            style={{ borderRadius: 12, height: '100%', border: '1px solid #e2e8f0' }}
            bodyStyle={{ padding: isMobile ? 16 : 24 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
              {/* Sheet 1 Info */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Tag color="success" style={{ fontWeight: 600, borderRadius: 4, margin: 0 }}>
                    Sheet 1
                  </Tag>
                  <Text strong style={{ fontSize: 14, color: '#166534' }}>
                    Laporan Absensi Jam Kerja Harian
                  </Text>
                </div>
                <Paragraph style={{ fontSize: 12.5, color: '#14532d', margin: 0, lineHeight: 1.6 }}>
                  Menampilkan matriks tanggal harian per karyawan: Jam Masuk (In), Jam Pulang (Out), dan Durasi Jam Kerja yang otomatis dikurangi 1 jam waktu istirahat, serta penandaan hari Libur Nasional dan Cuti.
                </Paragraph>
              </div>

              {/* Sheet 2 Info */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Tag color="processing" style={{ fontWeight: 600, borderRadius: 4, margin: 0 }}>
                    Sheet 2
                  </Tag>
                  <Text strong style={{ fontSize: 14, color: '#075985' }}>
                    Rekapitulasi Kehadiran & Jam Kerja
                  </Text>
                </div>
                <Paragraph style={{ fontSize: 12.5, color: '#0c4a6e', margin: 0, lineHeight: 1.6 }}>
                  Ringkasan total kehadiran per karyawan: akumulasi hari hadir, kehadiran lengkap, total izin/cuti/sakit, dan total jam kerja efektif desimal untuk kalkulasi payroll.
                </Paragraph>
              </div>

              {/* Server Info Alert */}
              <Alert
                type="info"
                showIcon
                message={<span style={{ fontWeight: 600, fontSize: 13 }}>Koneksi Langsung Service Tarik Absen</span>}
                description={
                  <span style={{ fontSize: 12, color: '#334155', lineHeight: 1.5, display: 'block', marginTop: 4 }}>
                    Laporan ini membaca data absensi dan persetujuan izin secara langsung dari database production tanpa proses caching, sehingga data selalu mutakhir.
                  </span>
                }
                style={{ borderRadius: 10, border: '1px solid #bae6fd', background: '#f8fafc' }}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
