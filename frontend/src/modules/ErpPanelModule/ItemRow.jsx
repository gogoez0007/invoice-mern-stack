import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Row, Col, Button } from 'antd';

import { DeleteOutlined } from '@ant-design/icons';
import { useMoney, useDate } from '@/settings';
import calculate from '@/utils/calculate';
import useResponsive from '@/hooks/useResponsive';

export default function ItemRow({ field, remove, current = null }) {
  const { isMobile } = useResponsive();
  const [totalState, setTotal] = useState(undefined);
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);

  const money = useMoney();
  const updateQt = (value) => {
    setQuantity(value);
  };
  const updatePrice = (value) => {
    setPrice(value);
  };

  useEffect(() => {
    if (current) {
      // When it accesses the /payment/ endpoint,
      // it receives an invoice.item instead of just item
      // and breaks the code, but now we can check if items exists,
      // and if it doesn't we can access invoice.items.

      const { items, invoice } = current;

      if (invoice) {
        const item = invoice[field.fieldKey];

        if (item) {
          setQuantity(item.quantity);
          setPrice(item.price);
        }
      } else {
        const item = items[field.fieldKey];

        if (item) {
          setQuantity(item.quantity);
          setPrice(item.price);
        }
      }
    }
  }, [current]);

  useEffect(() => {
    const currentTotal = calculate.multiply(price, quantity);

    setTotal(currentTotal);
  }, [price, quantity]);

  if (isMobile) {
    return (
      <div
        style={{
          border: '1px solid #edf0f5',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
          background: '#fafafa',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: '#595959' }}>Item #{field.name + 1}</span>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => remove(field.name)}
          >
            Hapus
          </Button>
        </div>
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Form.Item
              name={[field.name, 'itemName']}
              rules={[
                {
                  required: true,
                  message: 'Missing itemName name',
                },
                {
                  pattern: /^(?!\s*$)[\s\S]+$/,
                  message: 'Item Name must contain alphanumeric or special characters',
                },
              ]}
              style={{ marginBottom: 8 }}
            >
              <Input placeholder="Nama Item" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name={[field.name, 'description']} style={{ marginBottom: 8 }}>
              <Input placeholder="Deskripsi" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name={[field.name, 'quantity']}
              rules={[{ required: true }]}
              label="Qty"
              style={{ marginBottom: 8 }}
            >
              <InputNumber style={{ width: '100%' }} min={0} onChange={updateQt} placeholder="Qty" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name={[field.name, 'price']}
              rules={[{ required: true }]}
              label="Harga"
              style={{ marginBottom: 8 }}
            >
              <InputNumber
                className="moneyInput"
                onChange={updatePrice}
                min={0}
                controls={false}
                style={{ width: '100%' }}
                addonAfter={money.currency_position === 'after' ? money.currency_symbol : undefined}
                addonBefore={money.currency_position === 'before' ? money.currency_symbol : undefined}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Total" style={{ marginBottom: 0 }}>
              <InputNumber
                readOnly
                className="moneyInput"
                value={totalState}
                min={0}
                controls={false}
                style={{ width: '100%' }}
                addonAfter={money.currency_position === 'after' ? money.currency_symbol : undefined}
                addonBefore={money.currency_position === 'before' ? money.currency_symbol : undefined}
                formatter={(value) =>
                  money.amountFormatter({ amount: value, currency_code: money.currency_code })
                }
              />
            </Form.Item>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <Row gutter={[12, 12]} style={{ position: 'relative' }}>
      <Col className="gutter-row" span={5}>
        <Form.Item
          name={[field.name, 'itemName']}
          rules={[
            {
              required: true,
              message: 'Missing itemName name',
            },
            {
              pattern: /^(?!\s*$)[\s\S]+$/, // Regular expression to allow spaces, alphanumeric, and special characters, but not just spaces
              message: 'Item Name must contain alphanumeric or special characters',
            },
          ]}
        >
          <Input placeholder="Item Name" />
        </Form.Item>
      </Col>
      <Col className="gutter-row" span={7}>
        <Form.Item name={[field.name, 'description']}>
          <Input placeholder="description Name" />
        </Form.Item>
      </Col>
      <Col className="gutter-row" span={3}>
        <Form.Item name={[field.name, 'quantity']} rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} onChange={updateQt} />
        </Form.Item>
      </Col>
      <Col className="gutter-row" span={4}>
        <Form.Item name={[field.name, 'price']} rules={[{ required: true }]}>
          <InputNumber
            className="moneyInput"
            onChange={updatePrice}
            min={0}
            controls={false}
            addonAfter={money.currency_position === 'after' ? money.currency_symbol : undefined}
            addonBefore={money.currency_position === 'before' ? money.currency_symbol : undefined}
          />
        </Form.Item>
      </Col>
      <Col className="gutter-row" span={5}>
        <Form.Item name={[field.name, 'total']}>
          <Form.Item>
            <InputNumber
              readOnly
              className="moneyInput"
              value={totalState}
              min={0}
              controls={false}
              addonAfter={money.currency_position === 'after' ? money.currency_symbol : undefined}
              addonBefore={money.currency_position === 'before' ? money.currency_symbol : undefined}
              formatter={(value) =>
                money.amountFormatter({ amount: value, currency_code: money.currency_code })
              }
            />
          </Form.Item>
        </Form.Item>
      </Col>

      <div style={{ position: 'absolute', right: '-20px', top: ' 5px' }}>
        <DeleteOutlined onClick={() => remove(field.name)} />
      </div>
    </Row>
  );
}

