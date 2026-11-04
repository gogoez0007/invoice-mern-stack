import React, { useEffect, useState } from 'react';
import { Modal, Spin, Button, Typography, Tag, Divider, Row, Col, Alert, Space, message } from 'antd';
import {
  PrinterOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { exportHtmlElementToPdf } from '@/utils/htmlToPdfExport';
import { jobService } from '@/request/jobService';

const { Title, Text, Paragraph } = Typography;

export default function OfficialApplicationModal({ visible, onClose, applicantId, applicantName }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(null);
  const [applicantInfo, setApplicantInfo] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (visible && applicantId) {
      loadFullForm(applicantId);
    } else {
      setFormData(null);
      setApplicantInfo(null);
    }
  }, [visible, applicantId]);

  const loadFullForm = async (id) => {
    setLoading(true);
    try {
      const res = await jobService.getApplicantFullForm(id);
      if (res?.success) {
        setApplicantInfo(res.applicant);
        setFormData(res.fullForm);
      }
    } catch (err) {
      console.error('Error fetching full form:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const contentEl = document.getElementById('delmar-printable-official-form');
    if (!contentEl) {
      message.error('Dokumen formulir belum siap untuk diunduh.');
      return;
    }

    setGeneratingPdf(true);
    const hideLoading = message.loading('Sedang membuat file PDF Formulir (Smart Pagination)...', 0);

    try {
      const cleanName = (applicantName || applicantInfo?.full_name || 'Pelamar')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      const fileName = `Form_Pelamar_${cleanName}.pdf`;

      await exportHtmlElementToPdf(contentEl, fileName, {
        padding: '24px 32px',
        targetWidth: 794,
      });

      message.success(`File PDF formulir berhasil diunduh: ${fileName}`);
    } catch (err) {
      console.error('Download PDF error:', err);
      message.error('Gagal mengunduh file PDF: ' + err.message);
    } finally {
      hideLoading();
      setGeneratingPdf(false);
    }
  };

  const bio = formData?.biodata || {};
  const famOrigin = formData?.family_origin || {};
  const famCore = formData?.family_core || {};
  const edu = formData?.education_history || {};
  const langs = formData?.languages || {};
  const skills = formData?.skills || {};
  const courses = Array.isArray(formData?.courses) ? formData.courses : [];
  const workExp = Array.isArray(formData?.work_experiences) ? formData.work_experiences : [];
  const quest = formData?.questionnaire || {};
  const refs = Array.isArray(formData?.references) ? formData.references : [];
  const emergency = Array.isArray(formData?.emergency_contacts) ? formData.emergency_contacts : [];
  const socmed = formData?.social_media || {};

  return (
    <Modal
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24 }}>
          <Space>
            <SafetyCertificateOutlined style={{ color: '#0284c7', fontSize: 20 }} />
            <span>Form Pelamar (Formulir Resmi)</span>
            {applicantName && <Tag color="blue">{applicantName}</Tag>}
          </Space>
          <Space className="no-print">
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              loading={generatingPdf}
              onClick={handleDownloadPDF}
              style={{ background: '#0284c7', borderColor: '#0284c7', fontWeight: 700 }}
            >
              Print PDF
            </Button>
          </Space>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1050}
      footer={[
        <Button key="close" onClick={onClose} className="no-print">
          Tutup
        </Button>,
        <Button
          key="print-pdf"
          type="primary"
          icon={<PrinterOutlined />}
          loading={generatingPdf}
          onClick={handleDownloadPDF}
          className="no-print"
          style={{ background: '#0284c7', borderColor: '#0284c7', fontWeight: 700 }}
        >
          Print PDF
        </Button>,
      ]}
      bodyStyle={{ maxHeight: '80vh', overflowY: 'auto', padding: '24px 32px' }}
    >
      <style>{`
        @page {
          size: A4 portrait;
          margin: 12mm 15mm;
        }
        @media print {
          body * { visibility: hidden !important; }
          .printable-official-form, .printable-official-form * { visibility: visible !important; }
          .printable-official-form {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 11pt !important;
            background: #fff !important;
          }
          .no-print { display: none !important; }

          /* Mencegah tabel & baris terpotong di tengah halaman */
          tr, .form-table-official tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          thead {
            display: table-header-group !important;
          }
          tfoot {
            display: table-footer-group !important;
          }
          .section-header-box {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .keep-together, [data-no-break="true"] {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
        .printable-official-form {
          font-family: 'Times New Roman', Times, serif !important;
          color: #0f172a;
          line-height: 1.45;
        }
        .printable-official-form * {
          font-family: 'Times New Roman', Times, serif !important;
        }
        .form-table-official {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 11pt;
          page-break-inside: auto;
        }
        .form-table-official tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .form-table-official th, .form-table-official td {
          border: 1px solid #334155;
          padding: 5px 8px;
          vertical-align: top;
          font-size: 11pt;
        }
        .form-table-official th {
          background-color: #f8fafc;
          font-weight: bold;
          color: #0f172a;
        }
        .section-header-box {
          background: #0b2545;
          color: #ffffff;
          padding: 5px 10px;
          font-size: 11.5pt;
          font-weight: bold;
          margin: 14px 0 8px;
          border-radius: 2px;
          letter-spacing: 0.3px;
          page-break-after: avoid;
          break-after: avoid;
        }
        .keep-together, [data-no-break="true"] {
          page-break-inside: avoid;
          break-inside: avoid;
        }
      `}</style>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" tip="Memuat berkas formulir lengkap..." />
        </div>
      ) : !formData ? (
        <Alert
          type="info"
          showIcon
          message="Form Pelamar Belum Diisi / Masih Dalam Proses"
          description={`Kandidat ${applicantName || ''} belum menyelesaikan pengisian Form Pelamar di Portal Rekrutmen. Anda dapat mengirimkan ulang undangan email portal ke kandidat.`}
        />
      ) : (
        <div id="delmar-printable-official-form" className="printable-official-form">
          {/* Header Lembar Formulir Resmi */}
          <div style={{ borderBottom: '3px double #0b2545', paddingBottom: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0b2545', letterSpacing: 0.5 }}>
                DELTA MARINE GROUP
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#595959' }}>
                HRD & TALENT ACQUISITION DEPARTMENT &bull; FORMULIR LAMARAN KERJA
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Tag color="blue" style={{ fontSize: 13, fontWeight: 800, padding: '4px 10px' }}>
                {applicantInfo?.application_code || 'DMG-REG'}
              </Tag>
              <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>
                Posisi: <strong>{applicantInfo?.job_title}</strong> ({applicantInfo?.department})
              </div>
            </div>
          </div>

          {/* 1. Biodata Pelamar */}
          <div className="section-header-box">1. BIODATA PELAMAR</div>
          <table className="form-table-official">
            <tbody>
              <tr>
                <td style={{ width: '20%', fontWeight: 600 }}>Nama Lengkap</td>
                <td style={{ width: '30%' }}><strong>{applicantInfo?.full_name}</strong></td>
                <td style={{ width: '20%', fontWeight: 600 }}>Nama Panggilan</td>
                <td style={{ width: '30%' }}>{bio.nickname || '-'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>No. KTP (NIK)</td>
                <td>{applicantInfo?.nik || bio.nik || '-'} (Masa Berlaku: {bio.ktp_validity || 'Seumur Hidup'})</td>
                <td style={{ fontWeight: 600 }}>No. NPWP</td>
                <td>{bio.npwp || '-'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Alamat KTP</td>
                <td colSpan={3}>{bio.address_ktp || '-'} {bio.postal_code_ktp ? `(Kode Pos: ${bio.postal_code_ktp})` : ''}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Alamat Domisili</td>
                <td colSpan={3}>{bio.address_domicile || '-'} {bio.postal_code_domicile ? `(Kode Pos: ${bio.postal_code_domicile})` : ''}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>No. HP / WhatsApp</td>
                <td>{applicantInfo?.phone || bio.phone}</td>
                <td style={{ fontWeight: 600 }}>No. Telp Rumah</td>
                <td>{bio.phone_home || '-'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Email</td>
                <td>{applicantInfo?.email || bio.email}</td>
                <td style={{ fontWeight: 600 }}>Tempat, Tgl Lahir / Usia</td>
                <td>{bio.birth_place || applicantInfo?.city || '-'}, {bio.birth_date ? String(bio.birth_date).substring(0, 10) : '-'} ({bio.age || '-'} Thn)</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Jenis Kelamin</td>
                <td>{bio.gender === 'L' ? 'Laki-laki' : bio.gender === 'P' ? 'Perempuan' : '-'}</td>
                <td style={{ fontWeight: 600 }}>Tinggi / Berat Badan</td>
                <td>{bio.height_cm ? `${bio.height_cm} cm` : '-'} / {bio.weight_kg ? `${bio.weight_kg} kg` : '-'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Agama & Suku</td>
                <td>{bio.religion || '-'} / {bio.ethnicity || '-'}</td>
                <td style={{ fontWeight: 600 }}>Kewarganegaraan</td>
                <td>{bio.nationality || 'Indonesia (WNI)'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Pendidikan Terakhir</td>
                <td>{bio.last_education || applicantInfo?.education} (Lulus {bio.grad_year || '-'})</td>
                <td style={{ fontWeight: 600 }}>Status Pernikahan</td>
                <td><Tag color="geekblue">{bio.marital_status || 'Belum Menikah'}</Tag></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>SIM Dimiliki</td>
                <td colSpan={3}>{bio.driving_license || '-'}</td>
              </tr>
            </tbody>
          </table>

          {/* 2. Tempat Tinggal */}
          <div className="section-header-box">2. STATUS TEMPAT TINGGAL</div>
          <table className="form-table-official">
            <tbody>
              <tr>
                <td style={{ width: '25%', fontWeight: 600 }}>Status Kepemilikan</td>
                <td style={{ width: '75%' }}><strong>{bio.residence_status || '-'}</strong> {bio.residence_notes ? `(${bio.residence_notes})` : ''}</td>
              </tr>
            </tbody>
          </table>

          {/* 3. Data Keluarga Asal */}
          <div className="section-header-box">3. DATA KELUARGA ASAL (ORANG TUA & SAUDARA KANDUNG)</div>
          <table className="form-table-official">
            <thead>
              <tr>
                <th>Hubungan</th>
                <th>Nama Lengkap</th>
                <th>Usia</th>
                <th>Pendidikan</th>
                <th>Pekerjaan / Jabatan</th>
                <th>Alamat Lengkap</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Ayah Kandung</strong></td>
                <td>{famOrigin.father?.name || '-'}</td>
                <td>{famOrigin.father?.age || '-'}</td>
                <td>{famOrigin.father?.education || '-'}</td>
                <td>{famOrigin.father?.job || '-'}</td>
                <td>{famOrigin.father?.address || '-'}</td>
              </tr>
              <tr>
                <td><strong>Ibu Kandung</strong></td>
                <td>{famOrigin.mother?.name || '-'}</td>
                <td>{famOrigin.mother?.age || '-'}</td>
                <td>{famOrigin.mother?.education || '-'}</td>
                <td>{famOrigin.mother?.job || '-'}</td>
                <td>{famOrigin.mother?.address || '-'}</td>
              </tr>
              {Array.isArray(famOrigin.siblings) && famOrigin.siblings.map((sib, i) => (
                <tr key={i}>
                  <td>Saudara #{i + 1} ({sib.gender})</td>
                  <td>{sib.name || '-'}</td>
                  <td>{sib.age || '-'}</td>
                  <td>{sib.education || '-'}</td>
                  <td>{sib.job || '-'}</td>
                  <td>{sib.address || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 4. Data Keluarga Inti */}
          <div className="section-header-box">4. DATA KELUARGA INTI (PASANGAN & ANAK)</div>
          <table className="form-table-official">
            <thead>
              <tr>
                <th>Hubungan</th>
                <th>Nama Lengkap</th>
                <th>Usia</th>
                <th>Pendidikan</th>
                <th>Pekerjaan / Perusahaan</th>
                <th>Alamat</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Suami / Istri</strong></td>
                <td>{famCore.spouse?.name || '-'}</td>
                <td>{famCore.spouse?.age || '-'}</td>
                <td>{famCore.spouse?.education || '-'}</td>
                <td>{famCore.spouse?.job || '-'}</td>
                <td>{famCore.spouse?.address || '-'}</td>
              </tr>
              {Array.isArray(famCore.children) && famCore.children.map((ch, i) => (
                <tr key={i}>
                  <td>Anak #{i + 1} ({ch.gender})</td>
                  <td>{ch.name || '-'}</td>
                  <td>{ch.birth_age || '-'}</td>
                  <td>{ch.education || '-'}</td>
                  <td colSpan={2}>{ch.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 5. Riwayat Pendidikan Formal */}
          <div className="section-header-box">5. RIWAYAT PENDIDIKAN FORMAL</div>
          <table className="form-table-official">
            <thead>
              <tr>
                <th>Tingkat</th>
                <th>Nama Sekolah / Universitas</th>
                <th>Kota</th>
                <th>Tahun</th>
                <th>Jurusan</th>
                <th>IPK / Nilai</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>SD</td><td>{edu.sd?.school || '-'}</td><td>{edu.sd?.city || '-'}</td><td>{edu.sd?.years || '-'}</td><td>{edu.sd?.major || 'Umum'}</td><td>{edu.sd?.gpa || '-'}</td></tr>
              <tr><td>SMP</td><td>{edu.smp?.school || '-'}</td><td>{edu.smp?.city || '-'}</td><td>{edu.smp?.years || '-'}</td><td>{edu.smp?.major || 'Umum'}</td><td>{edu.smp?.gpa || '-'}</td></tr>
              <tr><td>SMA/SMK</td><td>{edu.sma?.school || '-'}</td><td>{edu.sma?.city || '-'}</td><td>{edu.sma?.years || '-'}</td><td>{edu.sma?.major || '-'}</td><td>{edu.sma?.gpa || '-'}</td></tr>
              {edu.d3?.school && <tr><td>D3</td><td>{edu.d3.school}</td><td>{edu.d3.city}</td><td>{edu.d3.years}</td><td>{edu.d3.major}</td><td>{edu.d3.gpa}</td></tr>}
              {edu.s1?.school && <tr><td>S1/D4</td><td>{edu.s1.school}</td><td>{edu.s1.city}</td><td>{edu.s1.years}</td><td>{edu.s1.major}</td><td>{edu.s1.gpa}</td></tr>}
              {edu.s2?.school && <tr><td>S2/S3</td><td>{edu.s2.school}</td><td>{edu.s2.city}</td><td>{edu.s2.years}</td><td>{edu.s2.major}</td><td>{edu.s2.gpa}</td></tr>}
            </tbody>
          </table>

          {/* 6. Bahasa & 8. Keterampilan */}
          <Row gutter={16}>
            <Col span={12}>
              <div className="section-header-box">6. BAHASA YANG DIKUASAI</div>
              <table className="form-table-official">
                <thead>
                  <tr><th>Bahasa</th><th>Membaca</th><th>Menulis</th><th>Bicara</th></tr>
                </thead>
                <tbody>
                  <tr><td>Indonesia</td><td>{langs.indonesia?.read || 'Baik'}</td><td>{langs.indonesia?.write || 'Baik'}</td><td>{langs.indonesia?.speak || 'Baik'}</td></tr>
                  <tr><td>Inggris</td><td>{langs.english?.read || '-'}</td><td>{langs.english?.write || '-'}</td><td>{langs.english?.speak || '-'}</td></tr>
                  {langs.other?.read && <tr><td>Lainnya</td><td>{langs.other.read}</td><td>{langs.other.write}</td><td>{langs.other.speak}</td></tr>}
                </tbody>
              </table>
            </Col>
            <Col span={12}>
              <div className="section-header-box">8. KETERAMPILAN KERJA</div>
              <table className="form-table-official">
                <tbody>
                  <tr><td style={{ fontWeight: 600 }}>Komputer / Software</td><td>{skills.computer || '-'}</td></tr>
                  <tr><td style={{ fontWeight: 600 }}>Mesin / Alat Kerja</td><td>{skills.tools || '-'}</td></tr>
                  <tr><td style={{ fontWeight: 600 }}>Keahlian Lainnya</td><td>{skills.other || '-'}</td></tr>
                </tbody>
              </table>
            </Col>
          </Row>

          {/* 9. Kursus & Pelatihan */}
          <div className="section-header-box">9. KURSUS / PELATIHAN / SERTIFIKASI</div>
          <table className="form-table-official">
            <thead>
              <tr><th>Topik Pelatihan</th><th>Lembaga</th><th>Tahun</th><th>Sertifikasi</th></tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#8c8c8c' }}>Tidak ada data kursus</td></tr>
              ) : (
                courses.map((crs, i) => (
                  <tr key={i}>
                    <td>{crs.title}</td>
                    <td>{crs.institution}</td>
                    <td>{crs.year}</td>
                    <td>{crs.certificate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* 10. Riwayat Pekerjaan */}
          <div className="section-header-box">10. RIWAYAT PENGALAMAN KERJA</div>
          {workExp.length === 0 ? (
            <div style={{ padding: '8px 12px', border: '1px solid #d9d9d9', color: '#8c8c8c', marginBottom: 16 }}>
              Fresh Graduate (Belum memiliki pengalaman kerja formal).
            </div>
          ) : (
            workExp.map((exp, i) => (
              <div key={i} style={{ border: '1px solid #d9d9d9', padding: '10px 14px', marginBottom: 12, borderRadius: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#0284c7', marginBottom: 6 }}>
                  <span>{i + 1}. {exp.company_name} ({exp.city || '-'})</span>
                  <span>{exp.start_date} s/d {exp.end_date || 'Sekarang'}</span>
                </div>
                <table className="form-table-official" style={{ marginBottom: 4 }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '20%', fontWeight: 600 }}>Jabatan Terakhir</td>
                      <td style={{ width: '30%' }}><strong>{exp.final_position}</strong></td>
                      <td style={{ width: '20%', fontWeight: 600 }}>Gaji Terakhir</td>
                      <td style={{ width: '30%' }}>Rp {Number(exp.salary_final || 0).toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Atasan Langsung</td>
                      <td>{exp.supervisor_name} ({exp.supervisor_title})</td>
                      <td style={{ fontWeight: 600 }}>Bawahan</td>
                      <td>{exp.subordinates_count || 0} orang</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Deskripsi Kerja</td>
                      <td colSpan={3}>{exp.job_description}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Alasan Keluar</td>
                      <td colSpan={3} style={{ color: '#d97706' }}>{exp.reason_leaving}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))
          )}

          {/* 11 & 12. Kuesioner & Info Tambahan */}
          <div className="section-header-box">11 & 12. KUESIONER LAIN-LAIN & INFORMASI TAMBAHAN</div>
          <table className="form-table-official">
            <tbody>
              <tr><td style={{ width: '70%' }}>Pernah diskors / diberhentikan dari pekerjaan sebelumnya?</td><td><Tag color={quest.q1_suspended === 'Ya' ? 'red' : 'green'}>{quest.q1_suspended || 'Tidak'}</Tag> {quest.q1_suspended_notes || ''}</td></tr>
              <tr><td>Memiliki usaha sampingan di luar pekerjaan?</td><td><Tag color={quest.q2_side_business === 'Ya' ? 'orange' : 'green'}>{quest.q2_side_business || 'Tidak'}</Tag> {quest.q2_side_business_notes || ''}</td></tr>
              <tr><td>Sedang dalam proses seleksi di tempat lain?</td><td><Tag>{quest.q3_other_applications || 'Tidak'}</Tag> {quest.q3_other_applications_notes || ''}</td></tr>
              <tr><td>Pernah berurusan dengan kepolisian / tindak pidana?</td><td><Tag color={quest.q6_police_record === 'Ya' ? 'red' : 'green'}>{quest.q6_police_record || 'Tidak'}</Tag></td></tr>
              <tr><td>Pernah menyalahgunakan narkoba / zat adiktif?</td><td><Tag color={quest.q7_substance_abuse === 'Ya' ? 'red' : 'green'}>{quest.q7_substance_abuse || 'Tidak'}</Tag></td></tr>
              <tr><td>Kondisi kesehatan saat ini</td><td><strong>{quest.q9_fit_to_work || 'Prima'}</strong></td></tr>
              <tr><td>Kapan dapat mulai aktif bekerja?</td><td><strong>{quest.available_date || '-'}</strong></td></tr>
              <tr><td>Ekspektasi Gaji Bersih Minimum</td><td><strong>Rp {Number(quest.expected_salary_min || 0).toLocaleString('id-ID')} / bulan</strong></td></tr>
              <tr><td>Kesediaan Penempatan</td><td>{quest.willing_relocate || '-'}</td></tr>
              <tr><td>Motivasi Bergabung di Delmar Group</td><td>{quest.motivation_joining || '-'}</td></tr>
            </tbody>
          </table>

          {/* 13, 14, 15. Referensi & Kontak Darurat */}
          <div className="keep-together" data-no-break="true" style={{ marginBottom: 18 }}>
            <Row gutter={16}>
              <Col span={12}>
                <div className="section-header-box">13. REFERENSI PROFESIONAL (3 ORANG)</div>
                <table className="form-table-official">
                  <thead><tr><th>Nama</th><th>Perusahaan & Jabatan</th><th>No. Telp</th></tr></thead>
                  <tbody>
                    {refs.map((r, i) => (
                      <tr key={i}>
                        <td><strong>{r.name}</strong> ({r.relationship})</td>
                        <td>{r.company_title}</td>
                        <td>{r.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Col>
              <Col span={12}>
                <div className="section-header-box">14. KONTAK DARURAT (2 ORANG)</div>
                <table className="form-table-official">
                  <thead><tr><th>Nama</th><th>Hubungan</th><th>No. Telp</th></tr></thead>
                  <tbody>
                    {emergency.map((em, i) => (
                      <tr key={i}>
                        <td><strong>{em.name}</strong></td>
                        <td>{em.relation}</td>
                        <td>{em.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Col>
            </Row>
          </div>

          {/* 16. Evaluasi Diri */}
          <div className="keep-together" data-no-break="true" style={{ marginBottom: 18 }}>
            <div className="section-header-box">16. EVALUASI DIRI (PRESTASI, KELEBIHAN, KEKURANGAN)</div>
            <table className="form-table-official">
              <tbody>
                <tr><td style={{ width: '25%', fontWeight: 600 }}>Prestasi Terbaik</td><td>{quest.self_achievements || '-'}</td></tr>
                <tr><td style={{ fontWeight: 600 }}>Kelebihan Diri</td><td>{quest.self_strengths || '-'}</td></tr>
                <tr><td style={{ fontWeight: 600 }}>Kekurangan Diri</td><td>{quest.self_weaknesses || '-'}</td></tr>
              </tbody>
            </table>
          </div>

          {/* 17 & 18. Pernyataan & Tanda Tangan */}
          <div className="keep-together" data-no-break="true">
            <div className="section-header-box" style={{ background: '#0b2545' }}>
              17 & 18. PERNYATAAN KEBENARAN DATA & TANDA TANGAN RESMI
            </div>
            <div style={{ border: '1px solid #334155', padding: '16px 20px', background: '#ffffff', borderRadius: 4, marginBottom: 16 }}>
              <p style={{ fontSize: '11pt', lineHeight: 1.5, color: '#0f172a', margin: 0, textAlign: 'justify', fontFamily: "'Times New Roman', Times, serif" }}>
                "Saya menyatakan dengan sesungguhnya bahwa seluruh data, keterangan, dan berkas yang saya berikan dalam Form Pelamar ini adalah benar dan lengkap. Saya juga menyatakan bahwa saya <strong>tidak pernah dan tidak sedang terlibat dalam aktivitas perjudian online (judi online/slot), penyalahgunaan narkotika/obat terlarang, minuman keras, maupun tindak pidana</strong>. Apabila di kemudian hari terbukti keterangan ini palsu atau ada hal penting yang sengaja disembunyikan, saya bersedia menerima pembatalan proses seleksi atau <strong>Pemutusan Hubungan Kerja (PHK) seketika tanpa kompensasi/pesangon</strong> serta diproses sesuai hukum yang berlaku di Republik Indonesia."
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16, paddingTop: 14, borderTop: '1px dashed #cbd5e1', fontFamily: "'Times New Roman', Times, serif" }}>
                {/* Sisi Kiri: Electronic Validation Info */}
                <div style={{ maxWidth: 360 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 4, padding: '5px 12px', color: '#166534', fontSize: '10.5pt', fontWeight: 'bold', marginBottom: 8 }}>
                    <CheckCircleOutlined style={{ color: '#16a34a', fontSize: 14 }} />
                    <span>Tervalidasi & Ditandatangani Secara Elektronik</span>
                  </div>
                  <div style={{ fontSize: '10pt', color: '#475569', lineHeight: 1.45 }}>
                    <div>Terverifikasi di Server Rekrutmen Delta Marine Group.</div>
                    <div>Kode: <strong>{applicantInfo?.application_code || 'DMG-REG'}</strong> &bull; NIK: <strong>{applicantInfo?.nik || '-'}</strong></div>
                    <div>Waktu Submit: <strong>{formData?.submitted_at ? dayjs(formData.submitted_at).format('DD/MM/YYYY HH:mm [WIB]') : dayjs().format('DD/MM/YYYY [WIB]')}</strong></div>
                  </div>
                </div>

                {/* Sisi Kanan: Area Tanda Tangan Resmi Lengkap */}
                <div style={{ textAlign: 'center', minWidth: 240, fontFamily: "'Times New Roman', Times, serif" }}>
                  <div style={{ fontSize: '11pt', color: '#0f172a', marginBottom: 2 }}>
                    {bio.sign_city || applicantInfo?.city || 'Jakarta'}, {bio.sign_date ? dayjs(bio.sign_date).format('DD MMMM YYYY') : dayjs().format('DD MMMM YYYY')}
                  </div>
                  <div style={{ fontSize: '11pt', color: '#475569' }}>
                    Yang membuat pernyataan,
                  </div>

                  {/* Ruang Tanda Tangan Fisik / Digital */}
                  <div style={{ height: 65, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
                    {formData?.declaration_signature ? (
                      <img
                        src={formData.declaration_signature}
                        alt="Tanda Tangan Pelamar"
                        style={{ maxHeight: 60, maxWidth: 180, objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ border: '1px dashed #94a3b8', borderRadius: 4, padding: '6px 12px', background: '#f8fafc', width: '100%' }}>
                        <div style={{ fontSize: 9.5, color: '#0284c7', fontWeight: 'bold', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                          Digitally Signed & Verified
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 'bold', color: '#0f172a', margin: '2px 0' }}>
                          {bio.sign_name || applicantInfo?.full_name}
                        </div>
                        <div style={{ fontSize: 9, color: '#64748b' }}>
                          Delta Marine Talent Acquisition
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ fontWeight: 'bold', fontSize: '12pt', color: '#0f172a', textDecoration: 'underline' }}>
                    ( {bio.sign_name || applicantInfo?.full_name} )
                  </div>
                  <div style={{ fontSize: '10pt', color: '#64748b', marginTop: 2 }}>
                    Nama Terang & Tanda Tangan Pelamar
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

