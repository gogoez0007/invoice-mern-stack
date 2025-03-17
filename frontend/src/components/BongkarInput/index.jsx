import React from 'react';
import { Form, Input, InputNumber, Button, Row, Col } from 'antd';
import { MinusCircleOutlined } from '@ant-design/icons';

const BongkarInput = ({ inputDetail, posisi, index, handleDetailChange, handleRemoveDetailBongkar, translate }) => {
    return (
        <Row gutter={16} key={index} align="middle">
            <Col span={5}>
                <Form.Item>
                    <InputNumber
                        style={{ width: '100%' }}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        value={inputDetail.berat_bongkar}
                        onChange={(value) => handleDetailChange(posisi, index, 'berat_bongkar', value)}
                        addonAfter="Kg"
                    />
                </Form.Item>
            </Col>
            <Col span={4}>
                <Form.Item>
                    <InputNumber
                        style={{ width: '100%' }}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        value={inputDetail.size}
                        onChange={(value) => handleDetailChange(posisi, index, 'size', value)}
                    />
                </Form.Item>
            </Col>
            <Col span={3}>
                <Form.Item>
                    <InputNumber
                        style={{ width: '100%' }}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        value={inputDetail.persen_molting}
                        onChange={(value) => handleDetailChange(posisi, index, 'persen_molting', value)}
                    />
                </Form.Item>
            </Col>
            <Col span={4}>
                <Form.Item>
                    <InputNumber
                        style={{ width: '100%' }}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        value={inputDetail.harga}
                        onChange={(value) => handleDetailChange(posisi, index, 'harga', value)}
                    />
                </Form.Item>
            </Col>
            <Col span={2} style={{ paddingLeft: 8, paddingRight: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Button
                    icon={<MinusCircleOutlined />}
                    onClick={() => handleRemoveDetailBongkar(posisi, index)}
                    type="text"
                    style={{ height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '-20px' }}
                />
            </Col>
        </Row>
    );
};

export default BongkarInput;