import React, { useEffect, useState, useRef } from 'react';
import { Button, Badge } from 'antd';
import {
  ReloadOutlined, CommentOutlined, CheckOutlined, LeftOutlined, RightOutlined, InfoCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  CloseCircleOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import { Modal, Input, List, Avatar } from 'antd';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import { useSelector } from 'react-redux';

const Review = () => {
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [sheets, setSheets] = useState([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [fetchResult, setFetchResult] = useState('');
  const [commentUser, setCommentUser] = useState('');
  const isInitialRender = useRef(true);
  const [isModalCommentVisible, setIsModalCommentVisible] = useState(false);
  const currentAdmin = useSelector(selectCurrentAdmin);

  const showModalComment = () => setIsModalCommentVisible(true);
  const handleCloseComment = () => setIsModalCommentVisible(false);


  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircleOutlined style={{ marginRight: 8 }} />;
      case 'proses':
        return <ClockCircleOutlined style={{ marginRight: 8 }} />;
      case 'revisi':
        return <EditOutlined style={{ marginRight: 8 }} />;
      default:
        return <CloseCircleOutlined style={{ marginRight: 8 }} />;
    }
  };


  const months = [
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  const isReviewer = ['taufik3301', 'cynthia', 'welli'];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const currentSheetName = sheets[activeSheetIndex]?.name;

  const submitReview = async (status) => {
    if (!status) return;
    try {
      const response = await fetch(`http://123.255.202.38:5000/api/review/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: currentSheetName,
          comment: commentText,
          commented_by: currentAdmin?.name,
          action: status
        }),
      });

      const result = await response.json();
      setIsModalVisible(false);
      setCommentText('');
    } catch (error) {
      console.error('Gagal submit komentar:', error);
    } finally {
      fetchReview();
    }
  };

  const fetchReview = async () => {
    try {
      const response = await fetch(`http://123.255.202.38:5000/api/review/detail?name=${encodeURIComponent(currentSheetName)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success) {

        const data = result.data;
        if (data) {
          setReviewStatus(data.status.toLowerCase());
          setCommentUser(data.comments);
        }
        else {
          setReviewStatus('')
          setCommentUser('');
        }
      } else {
        console.warn(result.message);
      }

      setIsModalVisible(false);

    } catch (error) {
      console.error('Gagal mengambil data review:', error);
    } finally {
      setFetchResult(true);
    }
  };

  const exportToExcel = async (selectedMonth, selectedYear) => {
    if (!selectedMonth || !selectedYear) return;

    try {
      const uri = `http://123.255.202.38:7000/report/generate_bongkar/${selectedMonth}/${selectedYear}`;
      console.log(uri);
      const response = await fetch(uri, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil file Excel');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Buat dan klik anchor download
      const a = document.createElement('a');
      a.style.display = 'none'; // supaya tidak terlihat
      a.href = url;
      a.download = `Report_${selectedMonth}_${selectedYear}.xlsx`;

      document.body.appendChild(a);
      a.click();

      // Hapus elemen & revoke URL
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saat mendownload file:', error);
    }
  };

  const fetchReport = async (selectedMonth, selectedYear) => {
    if (!selectedMonth || !selectedYear) return;

    setLoading(true);
    setFetchResult(false);
    try {
      const response = await fetch(`http://123.255.202.38:7000/report/generate_bongkar_html/${selectedMonth}/${selectedYear}`);
      const html = await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const newSheets = [];
      let currentSheet = null;
      const children = Array.from(doc.body.children);

      children.forEach(child => {
        if (child.tagName === 'H3') {
          if (currentSheet) newSheets.push(currentSheet);
          currentSheet = {
            name: child.textContent,
            content: ''
          };
        } else if (currentSheet) {
          currentSheet.content += child.outerHTML;
        }
      });

      if (currentSheet) newSheets.push(currentSheet);
      setSheets(newSheets);
      setActiveSheetIndex(0);
    } catch (error) {
      console.error('Gagal memuat laporan:', error);
      setSheets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (month && year) {
      fetchReport(month, year);
    }
  }, [month, year]);

  useEffect(() => {
    if (currentSheetName) {
      setReviewStatus('');
      fetchReview();
    }
  }, [currentSheetName])

  useEffect(() => {

    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    if (reviewStatus !== '') {
      submitReview();
    }
  }, [reviewStatus]);


  const selectStyle = {
    padding: '0.5rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '0.9rem'
  };

  return (
    <div style={{ padding: '1rem', fontFamily: 'Arial, sans-serif', marginLeft: '4rem' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor: '#ffffff',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          padding: '1rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          zIndex: 100,
          marginBottom: '1.5rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Grup 1: Bulan & Tahun */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={month} onChange={(e) => setMonth(e.target.value)} style={selectStyle}>
                <option value="">Pilih Bulan</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>

              <select value={year} onChange={(e) => setYear(e.target.value)} style={selectStyle}>
                <option value="">Pilih Tahun</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Divider */}
            <div style={{ borderLeft: '1px solid #ddd', height: '2rem' }} />

            {/* Grup 2: Navigasi Sheet */}
            {sheets.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Button
                  size="small"
                  icon={<LeftOutlined />}
                  onClick={() => {
                    setActiveSheetIndex((prev) => Math.max(prev - 1, 0))
                  }}
                  disabled={activeSheetIndex === 0}
                >
                  Previous
                </Button>

                <select
                  value={activeSheetIndex}
                  onChange={(e) => setActiveSheetIndex(Number(e.target.value))}
                  style={selectStyle}
                >
                  {sheets.map((sheet, idx) => (
                    <option key={idx} value={idx}>{sheet.name}</option>
                  ))}
                </select>

                <Button
                  size="small"
                  icon={<RightOutlined />}
                  onClick={() => {
                    setActiveSheetIndex((prev) => Math.min(prev + 1, sheets.length - 1));
                  }}
                  disabled={activeSheetIndex === sheets.length - 1}
                >
                  Next
                </Button>
              </div>
            )}

            {/* Divider */}
            <div style={{ borderLeft: '1px solid #ddd', height: '2rem' }} />
          </div>

          {/* KANAN: Tombol-tombol */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button
              type="dashed"
              icon={<ReloadOutlined />}
              onClick={() => fetchReport(month, year)}
            >
              Refresh
            </Button>
            <Button
              onClick={() => exportToExcel(month, year)}
              icon={<FileExcelOutlined style={{ color: '#217346' }} />}
              style={{ borderColor: '#b7eb8f', color: '#217346' }}
            >
              Export to Excel
            </Button>

          </div>
        </div>

        {/* STATUS & TOMBOL REVIEW */}
        {(fetchResult &&

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}
          >
            {/* Status Label */}
            <div
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '999px',
                fontWeight: 600,
                backgroundColor:
                  reviewStatus === 'approved' ? '#f6ffed' :
                    reviewStatus === 'proses' ? '#fff7e6' :
                      reviewStatus === 'revisi' ? '#e6f7ff' :
                        '#fdecea',
                color:
                  reviewStatus === 'approved' ? '#389e0d' :
                    reviewStatus === 'proses' ? '#d48806' :
                      reviewStatus === 'revisi' ? '#1890ff' :
                        '#d93025',
                border:
                  reviewStatus === 'approved' ? '1px solid  #b7eb8f' :
                    reviewStatus === 'proses' ? '1px solid #ffe58f' :
                      reviewStatus === 'revisi' ? '1px solid #91d5ff' :
                        '1px solid #f5c6cb',
                fontSize: '0.9rem',
              }}
            >

              {getStatusIcon(reviewStatus)}
              {
                reviewStatus === 'approved' ? 'Approved' :
                  reviewStatus === 'proses' ? 'On Review' :
                    reviewStatus === 'revisi' ? 'Revisi' :
                      'Belum Direview'
              }
            </div>

            {/* Tombol Review */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {isReviewer.includes(currentAdmin?.username) && (
                <>
                  {reviewStatus !== 'proses' && reviewStatus !== 'approved' && (
                    <Button onClick={() => submitReview('proses')}>On Review</Button>
                  )}
                  {reviewStatus !== 'revisi' && reviewStatus !== 'approved' && (
                    <Button type="dashed" onClick={() => submitReview('revisi')}>Revisi</Button>
                  )}
                  {reviewStatus !== 'approved' && (
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={() => submitReview('approved')}>
                      Approve
                    </Button>
                  )}

                  {reviewStatus !== 'approved' && (
                    <Button
                      type="default"
                      icon={<CommentOutlined />}
                      onClick={() => setIsModalVisible(true)}
                      style={{
                        backgroundColor: 'rgb(217, 247, 190)',
                        borderColor: 'rgb(183, 235, 143)',
                        color: 'rgb(33, 115, 70)',
                      }}
                    >
                      Add Comment
                    </Button>
                  )}
                </>
              )}

              <Badge count={commentUser.length > 0 ? commentUser.length : 0} offset={[-2, 2]}>
                <div
                  onClick={showModalComment}
                  style={{
                    backgroundColor: '#FFA500', // orange
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                  }}
                  title="Info terbaru"
                >
                  <InfoCircleOutlined style={{ color: 'black', fontSize: '16px' }} />
                </div>
              </Badge>

            </div>
          </div>

        )}

        {/* HTML content */}
      </div>


      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ fontStyle: 'italic' }}>Loading...</p>
        </div>
      )}

      {/* Konten */}

      {!loading && sheets.length > 0 && (
        <div
          className="sheet-wrapper"
          style={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '10px',
            padding: '1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div
            className="sheet-card"
            style={{
              overflowX: 'auto'
            }}
            dangerouslySetInnerHTML={{ __html: sheets[activeSheetIndex]?.content }}
          />
        </div>
      )}

      {!loading && sheets.length === 0 && month && year && (
        <p>Tidak ada data untuk bulan dan tahun yang dipilih.</p>
      )}
      <Modal
        title="Add Comment"
        open={isModalVisible}
        onOk={() => {
          submitReview(reviewStatus);
          setIsModalVisible(false);
          setCommentText('');
        }}
        onCancel={() => setIsModalVisible(false)}
        okText="Submit"
        cancelText="Cancel"
      >
        <Input.TextArea
          rows={4}
          placeholder="Tulis komentar kamu di sini..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
      </Modal>
      <Modal
        title="Komentar Terbaru"
        open={isModalCommentVisible}
        onCancel={handleCloseComment}
        footer={null}
      >
        {commentUser.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={commentUser}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar style={{ backgroundColor: '#87d068' }}>{item.user_name.charAt(0).toUpperCase()}</Avatar>}
                  title={
                    <span>
                      {item.user_name} • {item.comment_created_at.replace('T', ' ').replace('.000Z', '').toLocaleString('id-ID')}
                    </span>
                  }
                  description={item.comment_text}
                />
              </List.Item>
            )}
          />
        ) : (
          <p>Tidak ada komentar.</p>
        )}
      </Modal>


    </div>
  );

};

export default Review;
