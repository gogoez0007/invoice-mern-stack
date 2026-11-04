import React, { useEffect, useState } from 'react';
import {
  Modal,
  Tabs,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Row,
  Col,
  Card,
  Space,
  Typography,
  Divider,
  Spin,
  Tag,
  message,
} from 'antd';
import {
  PrinterOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { exportHtmlElementToPdf } from '@/utils/htmlToPdfExport';
import { jobService } from '@/request/jobService';

const { Title, Text } = Typography;
const { Option } = Select;

export default function OfferingContractModal({ visible, onClose, applicant }) {
  const [loading, setLoading] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState('offering');
  const [fullForm, setFullForm] = useState(null);

  // Configurable Document Parameters
  const [companyName, setCompanyName] = useState('PT Delta Marine Group');
  const [offeringNo, setOfferingNo] = useState('');
  const [pkwtNo, setPkwtNo] = useState('');
  const [joinDate, setJoinDate] = useState(dayjs().add(7, 'day'));
  const [contractMonths, setContractMonths] = useState(12);
  const [baseSalary, setBaseSalary] = useState(8000000);
  const [allowance, setAllowance] = useState(1500000);
  const [placementLocation, setPlacementLocation] = useState('Sidoarjo / Site Tambak');
  const [hrSignerName, setHrSignerName] = useState('Budi Santoso, S.Psi., M.M.');
  const [hrSignerTitle, setHrSignerTitle] = useState('HRD & Talent Acquisition Manager');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (visible && applicant) {
      const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
      const rm = romanMonths[dayjs().month()];
      const yr = dayjs().year();
      const padId = String(applicant.id || 1).padStart(3, '0');

      setOfferingNo(`${padId}/DMG-HRD/OL/${rm}/${yr}`);
      setPkwtNo(`${padId}/DMG-HRD/PKWT/${rm}/${yr}`);
      setBaseSalary(Number(applicant.expected_salary) || 8000000);
      setPlacementLocation(applicant.location || 'Sidoarjo / Site Operasional Tambak');

      loadCandidateBiodata(applicant.id);
    }
  }, [visible, applicant]);

  const loadCandidateBiodata = async (applicantId) => {
    setLoading(true);
    try {
      const res = await jobService.getApplicantFullForm(applicantId);
      if (res?.success && res.fullForm) {
        setFullForm(res.fullForm);
        const minSal = res.fullForm.part12_additional?.min_salary_expectation;
        if (minSal && !applicant?.expected_salary) {
          setBaseSalary(Number(minSal) || 8000000);
        }
      }
    } catch (err) {
      console.warn('Could not load extended full form for contract:', err);
    } finally {
      setLoading(false);
    }
  };

  const p1 = fullForm?.part1_personal || {};
  const p2 = fullForm?.part2_residence || {};

  const candidateName = p1.full_name || applicant?.full_name || '-';
  const candidateNik = p1.nik || applicant?.nik || '-';
  const candidateBirthPlace = p1.birth_place || applicant?.city || '-';
  const candidateBirthDate = p1.birth_date || applicant?.birth_date
    ? dayjs(p1.birth_date || applicant?.birth_date).format('DD MMMM YYYY')
    : '-';
  const candidateGender = p1.gender || '-';
  const candidateReligion = p1.religion || '-';
  const candidateMarital = p1.marital_status || '-';
  const candidateAddress = p2.ktp_address || applicant?.address || applicant?.city || '-';
  const candidatePhone = p1.mobile_phone || applicant?.phone || '-';
  const candidateEmail = p1.email || applicant?.email || '-';
  const jobTitle = applicant?.job_title || p1.position_applied || '-';
  const jobDept = applicant?.job_department || 'Aquaculture Operations';

  const totalTakeHome = Number(baseSalary || 0) + Number(allowance || 0);
  const startDateFormatted = joinDate ? joinDate.format('DD MMMM YYYY') : '-';
  const endDateFormatted = joinDate
    ? joinDate.add(Number(contractMonths || 12), 'month').subtract(1, 'day').format('DD MMMM YYYY')
    : '-';

  const handleDownloadPDF = async () => {
    const contentEl = document.getElementById('delmar-printable-legal-doc');
    if (!contentEl) {
      message.error('Dokumen belum siap untuk diunduh.');
      return;
    }

    setGeneratingPdf(true);
    const hideLoading = message.loading('Sedang membuat file PDF (Smart Pagination)...', 0);

    try {
      const cleanName = (candidateName || 'Kandidat')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      const docType = activeDocTab === 'offering' ? 'Offering_Letter' : 'Kontrak_PKWT';
      const fileName = `${docType}_${cleanName}.pdf`;

      await exportHtmlElementToPdf(contentEl, fileName, {
        padding: '24px 36px',
        targetWidth: 794,
        fitSinglePage: activeDocTab === 'offering',
      });

      message.success(`File PDF berhasil diunduh: ${fileName}`);
    } catch (err) {
      console.error('Download PDF error:', err);
      message.error('Gagal mengunduh file PDF: ' + err.message);
    } finally {
      hideLoading();
      setGeneratingPdf(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: '#0284c7', fontSize: 20 }} />
          <span>Generator Offering Letter & Kontrak Kerja PKWT Otomatis</span>
          <Tag color="blue">{candidateName}</Tag>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={980}
      footer={[
        <Button key="close" onClick={onClose}>
          Tutup
        </Button>,
        <Button
          key="print-pdf"
          type="primary"
          icon={<PrinterOutlined />}
          loading={generatingPdf}
          onClick={handleDownloadPDF}
          style={{ background: '#0284c7', borderColor: '#0284c7', fontWeight: 700 }}
        >
          Print PDF
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        {/* Parameter Configuration Card */}
        <Card
          size="small"
          title="Parameter Dokumen & Kompensasi (Otomatis Update ke Dokumen di Bawah)"
          style={{ marginBottom: 16, background: '#f8fafc', borderColor: '#e2e8f0' }}
        >
          <Row gutter={[12, 10]}>
            <Col xs={24} sm={8}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Entitas Perusahaan:</Text>
              <Select value={companyName} onChange={setCompanyName} style={{ width: '100%', marginTop: 4 }} size="small">
                <Option value="PT Delta Marine Group">PT Delta Marine Group</Option>
                <Option value="PT Delta Marine Indonesia">PT Delta Marine Indonesia</Option>
                <Option value="PT Cipta Bahari Nusantara">PT Cipta Bahari Nusantara</Option>
              </Select>
            </Col>
            <Col xs={12} sm={8}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Nomor Offering Letter:</Text>
              <Input value={offeringNo} onChange={(e) => setOfferingNo(e.target.value)} size="small" style={{ marginTop: 4 }} />
            </Col>
            <Col xs={12} sm={8}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Nomor Kontrak PKWT:</Text>
              <Input value={pkwtNo} onChange={(e) => setPkwtNo(e.target.value)} size="small" style={{ marginTop: 4 }} />
            </Col>

            <Col xs={12} sm={6}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Gaji Pokok (Rp/Bulan):</Text>
              <InputNumber
                size="small"
                style={{ width: '100%', marginTop: 4 }}
                value={baseSalary}
                onChange={(val) => setBaseSalary(val || 0)}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Tunjangan Tetap (Rp/Bulan):</Text>
              <InputNumber
                size="small"
                style={{ width: '100%', marginTop: 4 }}
                value={allowance}
                onChange={(val) => setAllowance(val || 0)}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Tanggal Mulai (Join Date):</Text>
              <DatePicker
                size="small"
                style={{ width: '100%', marginTop: 4 }}
                value={joinDate}
                onChange={setJoinDate}
                format="YYYY-MM-DD"
              />
            </Col>
            <Col xs={12} sm={6}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Durasi PKWT (Bulan):</Text>
              <InputNumber
                size="small"
                min={1}
                max={60}
                style={{ width: '100%', marginTop: 4 }}
                value={contractMonths}
                onChange={(val) => setContractMonths(val || 12)}
              />
            </Col>

            <Col xs={24} sm={8}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Lokasi Penempatan:</Text>
              <Input
                size="small"
                style={{ marginTop: 4 }}
                value={placementLocation}
                onChange={(e) => setPlacementLocation(e.target.value)}
              />
            </Col>
            <Col xs={12} sm={8}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Pejabat Penandatangan HRD:</Text>
              <Input
                size="small"
                style={{ marginTop: 4 }}
                value={hrSignerName}
                onChange={(e) => setHrSignerName(e.target.value)}
              />
            </Col>
            <Col xs={12} sm={8}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Jabatan Penandatangan:</Text>
              <Input
                size="small"
                style={{ marginTop: 4 }}
                value={hrSignerTitle}
                onChange={(e) => setHrSignerTitle(e.target.value)}
              />
            </Col>
          </Row>
        </Card>

        {/* Document Switcher Tabs */}
        <div className="no-print">
          <Tabs
            activeKey={activeDocTab}
            onChange={setActiveDocTab}
            items={[
              {
                key: 'offering',
                label: (
                  <span>
                    <FileTextOutlined /> 1. Surat Penawaran Kerja (Offering Letter)
                  </span>
                ),
              },
              {
                key: 'pkwt',
                label: (
                  <span>
                    <SafetyCertificateOutlined /> 2. Draft Kontrak Kerja (PKWT)
                  </span>
                ),
              },
            ]}
          />
        </div>

        <style>{`
          @page {
            size: A4 portrait;
            margin: 15mm 20mm;
          }
          @media print {
            body * { visibility: hidden !important; }
            #delmar-printable-legal-doc, #delmar-printable-legal-doc * { visibility: visible !important; }
            #delmar-printable-legal-doc {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              font-size: 11pt !important;
              background: #fff !important;
            }
            .no-print, .ant-modal-close, .ant-modal-header, .ant-modal-footer { display: none !important; }

            /* Cegah tabel & blok tanda tangan terpotong / terpisah di halaman lain */
            tr, .meta-table tr, .comp-table tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .signature-grid, .keep-together, [data-no-break="true"], .pasal-block {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .pasal-title {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
          }
          #delmar-printable-legal-doc * {
            font-family: 'Times New Roman', Times, serif !important;
          }
          .signature-grid, .keep-together, [data-no-break="true"], .pasal-block {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        `}</style>

        {/* Printable Document Preview Area */}
        <div
          id="delmar-printable-legal-doc"
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            padding: '24px 36px',
            maxHeight: '58vh',
            overflowY: 'auto',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.03)',
            fontFamily: "'Times New Roman', Times, serif",
            color: '#0f172a',
            lineHeight: 1.45,
          }}
        >
          {/* Letterhead */}
          <div
            className="letterhead"
            style={{
              borderBottom: '3px double #0f172a',
              paddingBottom: 10,
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                className="company-title"
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: 22,
                  fontWeight: 900,
                  color: '#0b2545',
                  letterSpacing: '0.5px',
                }}
              >
                {companyName.toUpperCase()}
              </div>
              <div
                className="company-sub"
                style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 11, color: '#475569' }}
              >
                Human Resources &amp; Talent Acquisition Department &bull; Integrated Aquaculture &amp; Cold Chain Logistics
              </div>
            </div>
            <div
              className="doc-badge"
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                border: '1.5px solid #0f172a',
                padding: '4px 12px',
                fontSize: 10.5,
                fontWeight: 700,
              }}
            >
              {activeDocTab === 'offering' ? 'DOKUMEN: OFFERING LETTER' : 'DOKUMEN: KONTRAK PKWT'}
            </div>
          </div>

          {activeDocTab === 'offering' ? (
            /* ============================================================
               TAB 1: SURAT PENAWARAN KERJA (OFFERING LETTER)
               ============================================================ */
            <div>
              <table className="meta-table" style={{ width: '100%', marginBottom: 10, fontFamily: "'Times New Roman', Times, serif" }}>
                <tbody>
                  <tr>
                    <td style={{ width: 90 }}>Nomor</td>
                    <td style={{ width: 12 }}>:</td>
                    <td><strong>{offeringNo}</strong></td>
                    <td style={{ textAlign: 'right' }}>Sidoarjo, {dayjs().format('DD MMMM YYYY')}</td>
                  </tr>
                  <tr>
                    <td>Lampiran</td>
                    <td>:</td>
                    <td colSpan={2}>1 (Satu) Berkas Ketentuan Kepegawaian</td>
                  </tr>
                  <tr>
                    <td>Perihal</td>
                    <td>:</td>
                    <td colSpan={2}>
                      <strong>Surat Penawaran Kerja (Offering Letter) &mdash; {jobTitle}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>

              <p style={{ marginTop: 8, marginBottom: 8, fontSize: 13, lineHeight: 1.4 }}>
                Kepada Yth.<br />
                <strong>Sdr/i. {candidateName}</strong><br />
                NIK: {candidateNik}<br />
                {candidateAddress}<br />
                Telp/WA: {candidatePhone} | Email: {candidateEmail}
              </p>

              <p style={{ margin: '6px 0', fontSize: 13 }}>Dengan hormat,</p>
              <p style={{ textAlign: 'justify', margin: '6px 0', fontSize: 13, lineHeight: 1.45 }}>
                Menindaklanjuti rangkaian proses seleksi, verifikasi Form Pelamar, serta evaluasi wawancara yang telah Saudara/i ikuti di <strong>{companyName}</strong>, dengan gembira kami menyampaikan bahwa Saudara/i dinyatakan <strong>LULUS SELEKSI</strong>. Sehubungan dengan hal tersebut, Manajemen menawarkan posisi pekerjaan kepada Saudara/i dengan rincian ketentuan sebagai berikut:
              </p>

              <table
                className="terms-table"
                style={{ width: '100%', borderCollapse: 'collapse', margin: '10px 0', fontFamily: "'Times New Roman', Times, serif" }}
              >
                <tbody>
                  <tr>
                    <th style={{ border: '1px solid #334155', padding: '5px 8px', background: '#f8fafc', width: '35%', textAlign: 'left', fontSize: 12 }}>
                      Jabatan / Posisi
                    </th>
                    <td style={{ border: '1px solid #334155', padding: '5px 8px', fontSize: 12 }}>
                      <strong>{jobTitle}</strong>
                    </td>
                  </tr>
                  <tr>
                    <th style={{ border: '1px solid #334155', padding: '5px 8px', background: '#f8fafc', textAlign: 'left', fontSize: 12 }}>
                      Departemen / Divisi
                    </th>
                    <td style={{ border: '1px solid #334155', padding: '5px 8px', fontSize: 12 }}>{jobDept}</td>
                  </tr>
                  <tr>
                    <th style={{ border: '1px solid #334155', padding: '5px 8px', background: '#f8fafc', textAlign: 'left', fontSize: 12 }}>
                      Status Kepegawaian
                    </th>
                    <td style={{ border: '1px solid #334155', padding: '5px 8px', fontSize: 12 }}>
                      Perjanjian Kerja Waktu Tertentu (PKWT) &mdash; {contractMonths} Bulan
                    </td>
                  </tr>
                  <tr>
                    <th style={{ border: '1px solid #334155', padding: '5px 8px', background: '#f8fafc', textAlign: 'left', fontSize: 12 }}>
                      Lokasi Penempatan
                    </th>
                    <td style={{ border: '1px solid #334155', padding: '5px 8px', fontSize: 12 }}>{placementLocation}</td>
                  </tr>
                  <tr>
                    <th style={{ border: '1px solid #334155', padding: '5px 8px', background: '#f8fafc', textAlign: 'left', fontSize: 12 }}>
                      Tanggal Mulai Bergabung
                    </th>
                    <td style={{ border: '1px solid #334155', padding: '5px 8px', fontSize: 12 }}>
                      <strong>{startDateFormatted}</strong>
                    </td>
                  </tr>
                  <tr>
                    <th style={{ border: '1px solid #334155', padding: '5px 8px', background: '#f8fafc', textAlign: 'left', fontSize: 12 }}>
                      Gaji Pokok
                    </th>
                    <td style={{ border: '1px solid #334155', padding: '5px 8px', fontSize: 12 }}>
                      Rp {Number(baseSalary || 0).toLocaleString('id-ID')} / bulan
                    </td>
                  </tr>
                  <tr>
                    <th style={{ border: '1px solid #334155', padding: '5px 8px', background: '#f8fafc', textAlign: 'left', fontSize: 12 }}>
                      Tunjangan Jabatan &amp; Operasional
                    </th>
                    <td style={{ border: '1px solid #334155', padding: '5px 8px', fontSize: 12 }}>
                      Rp {Number(allowance || 0).toLocaleString('id-ID')} / bulan
                    </td>
                  </tr>
                  <tr>
                    <th style={{ border: '1px solid #334155', padding: '5px 8px', background: '#f8fafc', textAlign: 'left', fontSize: 12 }}>
                      Total Kompensasi Bruto (THP)
                    </th>
                    <td style={{ border: '1px solid #334155', padding: '5px 8px', fontWeight: 'bold', color: '#0b2545', fontSize: 12 }}>
                      Rp {totalTakeHome.toLocaleString('id-ID')} / bulan
                    </td>
                  </tr>
                  <tr>
                    <th style={{ border: '1px solid #334155', padding: '5px 8px', background: '#f8fafc', textAlign: 'left', fontSize: 12 }}>
                      Fasilitas &amp; Jaminan Sosial
                    </th>
                    <td style={{ border: '1px solid #334155', padding: '5px 8px', fontSize: 12 }}>
                      BPJS Kesehatan, BPJS Ketenagakerjaan (JKK, JKM, JHT, JP), Cuti Tahunan, &amp; Fasilitas Operasional Site.
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Blok Penutup dan Tanda Tangan: Dijaga Utuh (Keep-Together) */}
              <div className="keep-together" data-no-break="true" style={{ marginTop: 10 }}>
                <p style={{ textAlign: 'justify', margin: '6px 0', fontSize: 12.5, lineHeight: 1.45 }}>
                  Apabila Saudara/i menyetujui penawaran kerja ini, mohon menandatangani kolom persetujuan di bawah ini dan mengembalikannya kepada Departemen HRD paling lambat 3 (tiga) hari kerja sejak surat ini diterbitkan.
                </p>

                <table className="signature-grid" style={{ width: '100%', marginTop: 16, fontFamily: "'Times New Roman', Times, serif" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top', fontSize: 12.5 }}>
                        <div>Hormat kami,</div>
                        <div><strong>{companyName}</strong></div>
                        <div style={{ height: 48 }} />
                        <div><strong><u>{hrSignerName}</u></strong></div>
                        <div>{hrSignerTitle}</div>
                      </td>
                      <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top', fontSize: 12.5 }}>
                        <div>Menyetujui &amp; Menerima Penawaran,</div>
                        <div>Kandidat / Calon Karyawan</div>
                        <div style={{ height: 48 }} />
                        <div><strong><u>{candidateName}</u></strong></div>
                        <div>NIK: {candidateNik}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ============================================================
               TAB 2: DRAFT PERJANJIAN KERJA WAKTU TERTENTU (PKWT)
               ============================================================ */
            <div>
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <div style={{ fontSize: 16, fontWeight: 'bold', textDecoration: 'underline' }}>
                  PERJANJIAN KERJA WAKTU TERTENTU (PKWT)
                </div>
                <div style={{ fontSize: 13, fontWeight: 'bold', marginTop: 2 }}>
                  Nomor: {pkwtNo}
                </div>
              </div>

              <p style={{ textAlign: 'justify' }}>
                Pada hari ini, tanggal <strong>{dayjs().format('DD MMMM YYYY')}</strong>, bertempat di Kantor Operasional {companyName}, telah dibuat dan ditandatangani Perjanjian Kerja Waktu Tertentu oleh dan antara:
              </p>

              <table className="meta-table" style={{ width: '100%', marginBottom: 12 }}>
                <tbody>
                  <tr>
                    <td style={{ width: 25 }}><strong>I.</strong></td>
                    <td style={{ width: 150 }}>Nama Pejabat</td>
                    <td style={{ width: 15 }}>:</td>
                    <td><strong>{hrSignerName}</strong></td>
                  </tr>
                  <tr>
                    <td />
                    <td>Jabatan</td>
                    <td>:</td>
                    <td>{hrSignerTitle}</td>
                  </tr>
                  <tr>
                    <td />
                    <td>Bertindak untuk</td>
                    <td>:</td>
                    <td><strong>{companyName}</strong> (Selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong>)</td>
                  </tr>
                </tbody>
              </table>

              <table className="meta-table" style={{ width: '100%', marginBottom: 14 }}>
                <tbody>
                  <tr>
                    <td style={{ width: 25 }}><strong>II.</strong></td>
                    <td style={{ width: 150 }}>Nama Lengkap</td>
                    <td style={{ width: 15 }}>:</td>
                    <td><strong>{candidateName}</strong></td>
                  </tr>
                  <tr>
                    <td />
                    <td>NIK (No. KTP)</td>
                    <td>:</td>
                    <td>{candidateNik}</td>
                  </tr>
                  <tr>
                    <td />
                    <td>Tempat, Tgl Lahir</td>
                    <td>:</td>
                    <td>{candidateBirthPlace}, {candidateBirthDate}</td>
                  </tr>
                  <tr>
                    <td />
                    <td>Jenis Kelamin / Agama</td>
                    <td>:</td>
                    <td>{candidateGender} / {candidateReligion} ({candidateMarital})</td>
                  </tr>
                  <tr>
                    <td />
                    <td>Alamat Sesuai KTP</td>
                    <td>:</td>
                    <td>{candidateAddress}</td>
                  </tr>
                  <tr>
                    <td />
                    <td>No. Telepon / Email</td>
                    <td>:</td>
                    <td>{candidatePhone} / {candidateEmail}</td>
                  </tr>
                  <tr>
                    <td />
                    <td>Bertindak untuk</td>
                    <td>:</td>
                    <td>Diri sendiri (Selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong>)</td>
                  </tr>
                </tbody>
              </table>

              <p style={{ textAlign: 'justify' }}>
                PIHAK PERTAMA dan PIHAK KEDUA secara bersama-sama disebut sebagai <strong>PARA PIHAK</strong>, sepakat untuk mengikatkan diri dalam Perjanjian Kerja Waktu Tertentu (PKWT) dengan ketentuan dan syarat-syarat sebagai berikut:
              </p>

              <div className="pasal-block keep-together" data-no-break="true">
                <div className="pasal-title" style={{ textAlign: 'center', fontWeight: 'bold', margin: '14px 0 4px' }}>
                  PASAL 1<br />JABATAN DAN LOKASI PENEMPATAN
                </div>
                <p style={{ textAlign: 'justify', margin: '4px 0' }}>
                  PIHAK PERTAMA menerima dan mempekerjakan PIHAK KEDUA sebagai <strong>{jobTitle}</strong> pada Departemen <strong>{jobDept}</strong> dengan lokasi penempatan di <strong>{placementLocation}</strong>. PIHAK KEDUA bersedia ditempatkan atau dimutasikan ke seluruh unit operasional/cabang {companyName} sesuai kebutuhan operasional perusahaan.
                </p>
              </div>

              <div className="pasal-block keep-together" data-no-break="true">
                <div className="pasal-title" style={{ textAlign: 'center', fontWeight: 'bold', margin: '14px 0 4px' }}>
                  PASAL 2<br />JANGKA WAKTU PERJANJIAN KERJA
                </div>
                <p style={{ textAlign: 'justify', margin: '4px 0' }}>
                  Perjanjian Kerja Waktu Tertentu ini berlaku selama <strong>{contractMonths} (Dua Belas) Bulan</strong>, terhitung mulai tanggal <strong>{startDateFormatted}</strong> sampai dengan tanggal <strong>{endDateFormatted}</strong>, dan dapat diperpanjang sesuai evaluasi kinerja serta kesepakatan PARA PIHAK.
                </p>
              </div>

              <div className="pasal-block keep-together" data-no-break="true">
                <div className="pasal-title" style={{ textAlign: 'center', fontWeight: 'bold', margin: '14px 0 4px' }}>
                  PASAL 3<br />KOMPENSASI UPAH DAN TUNJANGAN
                </div>
                <p style={{ textAlign: 'justify', margin: '4px 0' }}>
                  PIHAK KEDUA berhak menerima kompensasi bulanan yang terdiri dari Gaji Pokok sebesar <strong>Rp {Number(baseSalary || 0).toLocaleString('id-ID')}</strong> dan Tunjangan Tetap/Operasional sebesar <strong>Rp {Number(allowance || 0).toLocaleString('id-ID')}</strong> (Total Bruto: <strong>Rp {totalTakeHome.toLocaleString('id-ID')}</strong> per bulan), yang dibayarkan setiap akhir bulan melalui transfer rekening bank yang ditunjuk perusahaan, serta diikutsertakan dalam program BPJS Kesehatan dan BPJS Ketenagakerjaan.
                </p>
              </div>

              <div className="pasal-block keep-together" data-no-break="true">
                <div className="pasal-title" style={{ textAlign: 'center', fontWeight: 'bold', margin: '14px 0 4px' }}>
                  PASAL 4<br />PAKTA INTEGRITAS, TATA TERTIB, &amp; LARANGAN KERAS
                </div>
                <p style={{ textAlign: 'justify', margin: '4px 0' }}>
                  PIHAK KEDUA wajib mematuhi Peraturan Perusahaan, SOP biosecurity tambak/logistik, menjaga kerahasiaan data perusahaan, serta <strong>dilarang keras terlibat dalam aktivitas perjudian online maupun konvensional, penyalahgunaan narkotika/obat terlarang, tindakan manipulasi data/pencurian aset (fraud)</strong>. Pelanggaran atas ketentuan integritas ini mengakibatkan pengakhiran hubungan kerja seketika tanpa kompensasi sesuai peraturan perundang-undangan yang berlaku.
                </p>
              </div>

              <div className="pasal-block keep-together" data-no-break="true">
                <div className="pasal-title" style={{ textAlign: 'center', fontWeight: 'bold', margin: '14px 0 4px' }}>
                  PASAL 5<br />PENUTUP
                </div>
                <p style={{ textAlign: 'justify', margin: '4px 0' }}>
                  Demikian Perjanjian Kerja Waktu Tertentu (PKWT) ini dibuat dalam rangkap 2 (dua) bermeterai cukup yang masing-masing memiliki kekuatan hukum yang sama, ditandatangani secara sadar tanpa paksaan dari pihak manapun.
                </p>
              </div>

              <div className="keep-together" data-no-break="true">
                <table className="signature-grid" style={{ width: '100%', marginTop: 28, fontFamily: "'Times New Roman', Times, serif" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top' }}>
                        <div><strong>PIHAK PERTAMA</strong></div>
                        <div>{companyName}</div>
                        <div style={{ height: 60 }} />
                        <div><strong><u>{hrSignerName}</u></strong></div>
                        <div>{hrSignerTitle}</div>
                      </td>
                      <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top' }}>
                        <div><strong>PIHAK KEDUA</strong></div>
                        <div>Karyawan</div>
                        <div
                          className="materai-box"
                          style={{
                            border: '1px dashed #64748b',
                            width: 85,
                            height: 42,
                            margin: '8px auto',
                            fontSize: 10,
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          Meterai Rp 10.000
                        </div>
                        <div><strong><u>{candidateName}</u></strong></div>
                        <div>NIK: {candidateNik}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Spin>
    </Modal>
  );
}

