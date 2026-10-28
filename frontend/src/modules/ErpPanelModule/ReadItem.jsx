import { useState, useEffect } from 'react';
import { Divider } from 'antd';

import { Button, Row, Col, Descriptions, Statistic, Tag } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import {
  EditOutlined,
  FilePdfOutlined,
  CloseCircleOutlined,
  RetweetOutlined,
  MailOutlined,
} from '@ant-design/icons';

import { useSelector, useDispatch } from 'react-redux';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import dayjs from 'dayjs';

import { generate as uniqueId } from 'shortid';

import { selectCurrentItem } from '@/redux/erp/selectors';

import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';
import { useMoney, useDate } from '@/settings';
import useMail from '@/hooks/useMail';
import { useNavigate } from 'react-router-dom';

const Item = ({ item, currentErp }) => {
  const {dateFormat} = useDate();
  const formatNumber = (number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2 }).format(number);
  return (
    <Row gutter={[12, 0]} key={item.id}>
      <Col className="gutter-row" span={4}>
        <p style={{ marginBottom: 5 }}>
          <strong>{item.posisi}</strong>
        </p>
      </Col>
      <Col className="gutter-row" span={4}>
        <p
          style={{
            textAlign: 'right',
          }}
        >
          {formatNumber(item.berat)}
        </p>
      </Col>
      <Col className="gutter-row" span={4}>
        <p
          style={{
            textAlign: 'right',
          }}
        >
          {item.size}
        </p>
      </Col>
      {/* Tampilkan Kualitas */}
      <Col className="gutter-row" span={5}>
        <p
          style={{
            textAlign: 'right',
          }}
        >
          {item.kualitas} {/* Menampilkan data kualitas */}
        </p>
      </Col>
      <Col className="gutter-row" span={5}>
        <p
          style={{
            textAlign: 'right',
          }}
        >
          {
            item.created_date
              ? dayjs(item.created_date).format(dateFormat)
              : '-' // Menangani kasus jika tanggal_angkut null atau undefined
          }
        </p>
      </Col>
      <Divider dashed style={{ marginTop: 0, marginBottom: 15 }} />
    </Row>
  );
};

export default function ReadItem({ config, selectedItem }) {
  const translate = useLanguage();
  const { entity, ENTITY_NAME } = config;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { dateFormat } = useDate();

  const { moneyFormatter } = useMoney();
  const { send, isLoading: mailInProgress } = useMail({ entity });

  const { result: currentResult } = useSelector(selectCurrentItem);

  const resetErp = {
    status: '',
    client: {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
    subTotal: 0,
    taxTotal: 0,
    taxRate: 0,
    total: 0,
    credit: 0,
    number: 0,
    year: 0,
  };

  const [itemslist, setItemsList] = useState([]);
  const [currentErp, setCurrentErp] = useState(selectedItem ?? resetErp);
  const [client, setClient] = useState({});
  // Hitung total berat dari semua item dalam itemslist
  const formatNumber = (number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2 }).format(number);
  const totalBerat = itemslist.reduce((sum, item) => sum + (parseFloat(item.berat) || 0), 0);


  useEffect(() => {
    if (currentResult) {
      const { detail, invoice, ...others } = currentResult;

      if (detail) {
        setItemsList(detail);
        setCurrentErp(currentResult);
      } else if (invoice.detail) {
        setItemsList(invoice.detail);
        setCurrentErp({ ...invoice.detail, ...others, ...invoice });
      }
    }
    return () => {
      setItemsList([]);
      setCurrentErp(resetErp);
    };
  }, [currentResult]);


  return (
    <>
      <PageHeader
        onBack={() => {
          navigate(`/${entity.toLowerCase()}`);
        }}
        title={`${ENTITY_NAME} # ${currentErp.receipt_number}`}
        ghost={false}
        tags={[
          <span key="status">{currentErp.status && translate(currentErp.status)}</span>,
          currentErp.paymentStatus && (
            <span key="paymentStatus">
              {currentErp.paymentStatus && translate(currentErp.paymentStatus)}
            </span>
          ),
        ]}
        extra={[
          <Button
            key={`${uniqueId()}`}
            onClick={() => {
              navigate(`/${entity.toLowerCase()}`);
            }}
            icon={<CloseCircleOutlined />}
          >
            {translate('Close')}
          </Button>,
          <Button
            key={`${uniqueId()}`}
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
        style={{
          padding: '20px 0px',
        }}
      >
        
        <Row gutter={[16, 8]}>
          <Col className="gutter-row" xs={12} sm={8} md={6}>
            <p style={{ textAlign: 'left', margin: 0 }}><strong>{translate('Tambak')} :</strong> {currentErp.tambak}</p>
          </Col>
          <Col className="gutter-row" xs={12} sm={8} md={6}>
            <p style={{ textAlign: 'left', margin: 0 }}><strong>{translate('Staff')} :</strong> {currentErp.staff}</p>
          </Col>
          <Col className="gutter-row" xs={12} sm={8} md={6}>
            <p style={{ textAlign: 'left', margin: 0 }}><strong>{translate('Driver')} :</strong> {currentErp.driver}</p>
          </Col>
          <Col className="gutter-row" xs={12} sm={8} md={6}>
            <p style={{ textAlign: 'left', margin: 0 }}><strong>{translate('Nopol')} :</strong> {currentErp.nopol}</p>
          </Col>
          <Col className="gutter-row" xs={12} sm={8} md={6}>
            <p style={{ textAlign: 'left', margin: 0 }}><strong>{translate('Nama perusahaan')} :</strong> {currentErp.nama_perusahaan}</p>
          </Col>
          <Col className="gutter-row" xs={12} sm={8} md={6}>
            <p style={{ textAlign: 'left', margin: 0 }}><strong>{translate('Petambak')} :</strong> {currentErp.petambak}</p>
          </Col>
          <Col className="gutter-row" xs={12} sm={8} md={6}>
            <p style={{ textAlign: 'left', margin: 0 }}><strong>{translate('Lokasi')} :</strong> {currentErp.lokasi}</p>
          </Col>
        </Row>

      </PageHeader>
      
      <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: 600 }}>
          <Row gutter={[12, 0]}>
            <Col className="gutter-row" span={4}>
              <p>
                <strong>{translate('Posisi')}</strong>
              </p>
            </Col>
            <Col className="gutter-row" span={4}>
              <p
                style={{
                  textAlign: 'right',
                }}
              >
                <strong>{translate('Berat')}</strong>
              </p>
            </Col>
            <Col className="gutter-row" span={4}>
              <p
                style={{
                  textAlign: 'right',
                }}
              >
                <strong>{translate('Size')}</strong>
              </p>
            </Col>
            {/* Header Kualitas */}
            <Col className="gutter-row" span={5}>
              <p
                style={{
                  textAlign: 'right',
                }}
              >
                <strong>{translate('Kualitas')}</strong>
              </p>
            </Col>
            <Col className="gutter-row" span={5}>
              <p
                style={{
                  textAlign: 'right',
                }}
              >
                <strong>{translate('Tanggal Angkut')}</strong>
              </p>
            </Col>
            <Divider />
          </Row>
          {itemslist.map((item) => (
            <Item key={item.id} item={item} currentErp={currentErp}></Item>
          ))}
          <div
            style={{
              width: '300px',
              float: 'right',
              textAlign: 'right',
              fontWeight: '700',
              paddingRight: 12,
            }}
          >
            <Row gutter={[12, -5]}>
              <Col className="gutter-row" span={12}>
                <p>{translate('Total')} :</p>
              </Col>

              <Col className="gutter-row" span={12}>
                <p>
                  {formatNumber(totalBerat)} Kg
                </p>
              </Col>
            </Row>
          </div>
        </div>
      </div>

    </>
  );
}