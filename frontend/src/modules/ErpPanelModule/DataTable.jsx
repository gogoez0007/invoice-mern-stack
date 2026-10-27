import { useEffect, useState } from 'react';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  RedoOutlined,
  PlusOutlined,
  EllipsisOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { Dropdown, Table, Button, Input } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';

import AutoCompleteAsync from '@/components/AutoCompleteAsync';
import { useSelector, useDispatch } from 'react-redux';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import { selectListItems } from '@/redux/erp/selectors';
import { useErpContext } from '@/context/erp';
import { generate as uniqueId } from 'shortid';
import { useNavigate } from 'react-router-dom';

import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';
import useResponsive from '@/hooks/useResponsive';

function AddNewItem({ config }) {
  const navigate = useNavigate();
  const { ADD_NEW_ENTITY, entity } = config;

  const handleClick = () => {
    navigate(`/${entity.toLowerCase()}/create`);
  };

  return (
    <Button onClick={handleClick} type="primary" icon={<PlusOutlined />}>
      {ADD_NEW_ENTITY}
    </Button>
  );
}

export default function DataTable({ config, extra = [] }) {
  const { isMobile } = useResponsive();
  const translate = useLanguage();
  let { entity, dataTableColumns, disableAdd = false, searchConfig } = config;

  const { DATATABLE_TITLE } = config;

  const { result: listResult, isLoading: listIsLoading } = useSelector(selectListItems);

  const { pagination, items: dataSource } = listResult;

  const { erpContextAction } = useErpContext();
  const { modal } = erpContextAction;
  const [currentPagination, setCurrentPagination] = useState({ current: 1, pageSize: 10 });

  const items = [
    {
      label: translate('Show'),
      key: 'read',
      icon: <EyeOutlined />,
    },
    {
      label: translate('Edit'),
      key: 'edit',
      icon: <EditOutlined />,
    },
    {
      label: translate('Download'),
      key: 'download',
      icon: <FilePdfOutlined />,
    },
    ...extra,
    {
      type: 'divider',
    },

    {
      label: translate('Delete'),
      key: 'delete',
      icon: <DeleteOutlined />,
    },
  ];

  const navigate = useNavigate();

  const handleRead = (record) => {
    dispatch(erp.currentItem({ data: record }));
    navigate(`/${entity}/read/${record.id}`);
  };
  const handleEdit = (record) => {
    const data = { ...record };
    dispatch(erp.currentAction({ actionType: 'update', data }));
    navigate(`/${entity}/update/${record.id}`);
  };
  const handleDownload = (record) => {
    window.open(`${DOWNLOAD_BASE_URL}${entity}/${entity}-${record.id}.pdf`, '_blank');
  };

  const handleDelete = (record) => {
    dispatch(erp.currentAction({ actionType: 'delete', data: record }));
    modal.open();
  };

  const handleRecordPayment = (record) => {
    dispatch(erp.currentItem({ data: record }));
    navigate(`/invoice/pay/${record.id}`);
  };

  dataTableColumns = [
    ...dataTableColumns,
    {
      title: '',
      key: 'action',
      fixed: 'right',
      render: (_, record) => (
        <Dropdown
          menu={{
            items,
            onClick: ({ key }) => {
              switch (key) {
                case 'read':
                  handleRead(record);
                  break;
                case 'edit':
                  handleEdit(record);
                  break;
                case 'download':
                  handleDownload(record);
                  break;
                case 'delete':
                  handleDelete(record);
                  break;
                case 'recordPayment':
                  handleRecordPayment(record);
                  break;
                default:
                  break;
              }
            },
          }}
          trigger={['click']}
        >
          <EllipsisOutlined
            style={{ cursor: 'pointer', fontSize: '24px' }}
            onClick={(e) => e.preventDefault()}
          />
        </Dropdown>
      ),
    },
  ];

  const dispatch = useDispatch();

  const handelDataTableLoad = (pagination) => {
    const options = { page: pagination?.current || 1, items: pagination?.pageSize || 10 };
    dispatch(erp.list({ entity, options }));
  };

  const dispatcher = () => {
    dispatch(erp.list({ entity }));
  };

  useEffect(() => {
    const controller = new AbortController();
    dispatcher();
    return () => {
      controller.abort();
    };
  }, []);

  const filterTable = (e) => {
    const value = e.target.value;
    setCurrentPagination({ current: 1, pageSize: currentPagination.pageSize });
    const options = { q: value, fields: searchConfig?.searchFields || '', page: 1, items: currentPagination.pageSize };
    dispatch(erp.list({ entity, options }));
  };

  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      {isMobile ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()} />
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{DATATABLE_TITLE}</h3>
            </div>
            {!disableAdd && <AddNewItem config={config} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Input
              key="searchFilterDataTable"
              onChange={filterTable}
              placeholder={translate('search')}
              allowClear
              style={{ width: '100%' }}
            />
            <Button
              onClick={() => handelDataTableLoad(currentPagination)}
              icon={<RedoOutlined />}
              style={{ width: '100%' }}
            >
              {translate('Refresh')}
            </Button>
          </div>
        </div>
      ) : (
        <PageHeader
          title={DATATABLE_TITLE}
          ghost={true}
          onBack={() => window.history.back()}
          backIcon={<ArrowLeftOutlined />}
          extra={[
            <Input
              key={`searchFilterDataTable}`}
              onChange={filterTable}
              placeholder={translate('search')}
              allowClear
            />,
            <Button onClick={() => handelDataTableLoad(currentPagination)} key={`${uniqueId()}`} icon={<RedoOutlined />}>
              {translate('Refresh')}
            </Button>,

            !disableAdd && <AddNewItem config={config} key={`${uniqueId()}`} />,
          ]}
          style={{
            padding: '20px 0px',
          }}
        />
      )}

      <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <Table
          columns={dataTableColumns}
          rowKey={(item) => item.id}
          dataSource={dataSource}
          pagination={pagination}
          loading={listIsLoading}
          onChange={handelDataTableLoad}
          scroll={{ x: 'max-content' }}
        />
      </div>
    </div>
  );
}

