import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, message, Alert, Steps, Space } from 'antd';
import { SafetyCertificateOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { jobService } from '@/request/jobService';

const { TextArea } = Input;

export default function HiringRequestModal({ visible, onClose, applicant, onSuccess }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        notes: values.notes,
        offered_salary: values.offered_salary,
        join_date: values.join_date ? values.join_date.format('YYYY-MM-DD') : undefined,
      };

      const res = await jobService.requestHireApproval(applicant.id, payload);
      if (res?.success) {
        message.success('Pengajuan approval hiring berhasil dikirim ke Approver Step 1!');
        form.resetFields();
        if (onSuccess) onSuccess();
        onClose();
      } else {
        message.error(res?.message || 'Gagal mengajukan approval hiring');
      }
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || err.message || 'Gagal mengajukan approval');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: '#0284c7' }} />
          <span>Ajukan Persetujuan Pengangkatan Karyawan (Hiring Approval)</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Kirim Pengajuan Approval"
      cancelText="Batal"
      confirmLoading={submitting}
      width={680}
    >
      <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Pengajuan hiring akan diproses melalui tahapan persetujuan." />

      <Steps
        size="small"
        current={0}
        style={{ marginBottom: 24 }}
        items={[
          { title: 'Step 1', description: 'User / Dept Head' },
          { title: 'Step 2', description: 'HR Manager' },
          { title: 'Step 3', description: 'Direktur' },
        ]}
      />

      <Form form={form} layout="vertical" initialValues={{ notes: 'Kandidat direkomendasikan untuk diterima bekerja (Hired).' }}>
        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Kandidat:</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{applicant?.full_name}</div>
          <div style={{ fontSize: 13, color: '#0284c7', marginTop: 2 }}>
            Posisi: <strong>{applicant?.job_title}</strong> ({applicant?.job_department})
          </div>
        </div>

        <Form.Item
          name="offered_salary"
          label="Gaji Pokok yang Ditawarkan (Rp / Bulan)"
          rules={[{ required: true, message: 'Gaji pokok wajib diisi' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            formatter={(val) => `Rp ${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(val) => val.replace(/Rp\s?|(,*)/g, '')}
            placeholder="Nominal gaji"
          />
        </Form.Item>

        <Form.Item name="join_date" label="Estimasi Tanggal Mulai Bekerja (Join Date)">
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="Pilih tanggal" />
        </Form.Item>

        <Form.Item
          name="notes"
          label="Catatan Rekomendasi HR untuk Para Approver"
          rules={[{ required: true, message: 'Catatan pengajuan wajib diisi' }]}
        >
          <TextArea rows={3} placeholder="Catatan rekomendasi hiring..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}

