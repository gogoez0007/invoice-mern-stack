import { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Table,
  Row,
  Col,
  Tag,
  Button,
} from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import {
  FileAddOutlined,
  EditOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import dayjs from 'dayjs';
import { selectCurrentItem } from '@/redux/erp/selectors';
import { useNavigate } from 'react-router-dom';
import { useMoney, useDate } from '@/settings';

const { Text } = Typography;

const positionColors = {
  "Depan": "#2980B9",
  "Tengah": "#27AE60",
  "Belakang": "#F39C12"
};

const cardStyle = {
  marginBottom: 16,
  borderRadius: 8,
  border: '1px solid #ddd',
};

const ReadItemBongkar = ({ config, selectedItem }) => {
  const translate = useLanguage();
  const { entity, ENTITY_NAME } = config;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { dateFormat } = useDate();
  const formatNumber = (number) =>
    new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2 }).format(number);
  const { result: currentResult } = useSelector(selectCurrentItem);

  const [itemsByPosition, setItemsByPosition] = useState({});
  const [currentErp, setCurrentErp] = useState(selectedItem ?? {
    nama_pabrik: '',
    lokasi: '',
    staff: '',
    nama_perusahaan: '',
    nopol: '',
    status: ''
  });

  useEffect(() => {
    if (currentResult) {
      const { detail, invoice, ...others } = currentResult;
      let data = detail;
      if (!detail && invoice && invoice.detail) {
        data = invoice.detail;
        setCurrentErp({ ...invoice.detail, ...others, ...invoice });
      } else {
        setCurrentErp(currentResult);
      }

      if (data) {
        // Group items by posisi
        const groupedItems = data.reduce((acc, item) => {
          const position = item.posisi || 'Unknown Position';
          if (!acc[position]) {
            acc[position] = [];
          }
          acc[position].push(item);
          return acc;
        }, {});
        setItemsByPosition(groupedItems);
      }
    }
  }, [currentResult]);

  // Table Columns
  const columns = [
    {
      title: translate('Tanggal'),
      dataIndex: 'tanggal',
      key: 'tanggal',
      render: (date) => (date ? dayjs(date).format(dateFormat) : '-'),
    },
    {
      title: translate('Berat (Kg)'),
      dataIndex: 'berat_bongkar',
      key: 'berat_bongkar',
      render: (text, record) => {
        const berat_bongkar = record.berat_bongkar;
        return formatNumber(berat_bongkar);
      },
    },
    {
      title: translate('Size'),
      dataIndex: 'size',
      key: 'size',
    },
    // Kolom Kualitas Ditambahkan Di Sini
    {
      title: translate('Kualitas'),
      dataIndex: 'kualitas',
      key: 'kualitas',
    },
    {
      title: translate('Molting (%)'),
      dataIndex: 'persen_molting',
      key: 'persen_molting',
    },
    {
      title: translate('Harga'),
      dataIndex: 'harga',
      key: 'harga',
      render: (text, record) => {
        const harga = record.harga;
        return formatNumber(harga);
      },
    },
    {
      title: translate('Subtotal'),
      dataIndex: '',
      key: 'subtotal',
      render: (text, record) => {
        const subtotal = record.sub_total;
        return formatNumber(subtotal);
      },
    },
  ];

  return (
    <>
      <PageHeader
        onBack={() => {
          navigate(`/${entity.toLowerCase()}`);
        }}
        title={`${ENTITY_NAME} # ${currentErp.nama_pabrik || 'N/A'}`}
        ghost={false}
        tags={[
          <Tag key="status">{currentErp.status && translate(currentErp.status)}</Tag>,
        ]}
        extra={[
          <Button
            key="close"
            onClick={() => navigate(`/${entity.toLowerCase()}`)}
            icon={<CloseCircleOutlined />}
          >
            {translate('Close')}
          </Button>,
          <Button
            key="add"
            onClick={() => {
              dispatch(
                erp.currentAction({
                  actionType: 'create',
                  data: null,
                })
              );
              navigate(`/${entity.toLowerCase()}/create`);
            }}
            type="dashed"
            icon={<FileAddOutlined />}
          >
            {translate('New')}
          </Button>,
          <Button
            key="edit"
            onClick={() => {
              dispatch(
                erp.currentAction({
                  actionType: 'update',
                  data: currentErp,
                })
              );
              navigate(`/${entity.toLowerCase()}/update/${currentErp.id}`);
            }}
            type="primary"
            icon={<EditOutlined />}
          >
            {translate('Edit')}
          </Button>,
        ]}
        style={{ padding: '20px 0' }}
      >
        <Row gutter={16} style={{ fontWeight: 'bold', background: '#f0f0f0', padding: '10px', borderBottom: '1px solid #ddd' }}>
          <Col span={3}>{translate('Lokasi')}</Col>
          <Col span={4}>{translate('Perusahaan')}</Col>
          <Col span={2}>{translate('Petambak')}</Col>
          <Col span={2}>{translate('Pabrik')}</Col>
          <Col span={3}>{translate('Tanggal Bongkar')}</Col>
          <Col span={2}>{translate('No Polisi')}</Col>
          <Col span={2}>{translate('Staff')}</Col>
          <Col span={2}>{translate('Potongan (%)')}</Col>
          <Col span={2}>{translate('Subtotal (Nota)')}</Col>
        </Row>
        <Row gutter={16} style={{ padding: '10px' }}>
          <Col span={3}>{currentErp.lokasi}</Col>
          <Col span={4}>{currentErp.nama_perusahaan}</Col>
          <Col span={2}>{currentErp.petambak}</Col>
          <Col span={2}>{currentErp.nama_pabrik}</Col>
          <Col span={3}>{currentErp.tanggal_bongkar}</Col>
          <Col span={2}>{currentErp.nopol}</Col>
          <Col span={2}>{currentErp.staff}</Col>
          <Col span={2}>{formatNumber(currentErp.persen_potongan)}</Col>
          <Col span={2}>{currentErp.sub_total > 0 ?formatNumber(currentErp.sub_total) : '-'} </Col>
        </Row>

      </PageHeader>
      <div style={{ padding: '0 16px' }}>
        {Object.keys(itemsByPosition).map(posisi => {
          const details = itemsByPosition[posisi] || [];
          const totalBerat = details.reduce((sum, item) => sum + (parseFloat(item.berat_bongkar) || 0), 0);

          // Calculate total subtotal for this card
          const totalSubtotal = details.reduce((sum, item) => {
            const subtotal = parseFloat(item.sub_total) || 0;
            return sum + subtotal;
          }, 0);

          return (
            <Card
              key={posisi}
              style={{
                ...cardStyle,
                backgroundColor: "#f0f0f0",
              }}
              title={
                <Row justify="space-between" align="middle">
                  <Col>
                    <span
                      style={{
                        textAlign: 'center',
                        fontWeight: 'bold',
                        padding: '8px',
                        backgroundColor: positionColors[posisi] || "#f0f0f0",
                        borderRadius: '5px',
                        display: "block",
                        color: '#ffffff'
                      }}
                    >
                      {translate(posisi)}
                    </span>
                  </Col>
                </Row>
              }
            >
              <Row gutter={16}>
                <Col span={24}>
                  <p><strong>Data Bongkar:</strong></p>
                  <Table
                    dataSource={details}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                  />
                </Col>
              </Row>

              {/* Footer Card untuk Total  Bongkar */}
              <div style={{
                borderTop: "2px solid #ccc",
                paddingTop: "10px",
                marginTop: "15px",
                fontWeight: "bold",
                textAlign: "center"
              }}>
                Total Berat: {formatNumber(totalBerat)} Kg   |   Total : Rp {formatNumber(totalSubtotal)}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
};

export default ReadItemBongkar;