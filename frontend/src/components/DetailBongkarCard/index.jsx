import React from 'react';
import { Card, Row, Col, Input, Button } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

const cardStyle = {
    marginBottom: '20px',
    border: '1px solid #e8e8e8',
    borderRadius: '40',
};
const positionColors = {
    Depan: "#E6C200",   // Soft Gold (lebih elegan dari emas terang)
    Tengah: "#A4D0A4",  // Pastel Green (lebih lembut)
    Belakang: "#A4C7E6" // Soft Blue (lebih kalem)
};

const DetailBongkarCard = ({
    posisi,
    detailBongkarPosisi, // Data detail bongkar untuk posisi ini
    handleDetailChange,
    handleRemoveDetailBongkar,
    handleAddDetailBongkar,
    panenData,
    getTotals,
    calculateTotalSubtotal,
    translate
}) => {
    const totalSubtotal = calculateTotalSubtotal(posisi);

    return (
        <Card
            style={{
                ...cardStyle,
                backgroundColor: "#f0f0f0",
                body: { paddingBottom: "10px" }
            }}

            title={ // Judul sebagai Card Header
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
            }
        >
            <Row gutter={16}>
                {/* Data Panen di Kiri */}
                <Col span={7}>
                    <p><strong>Data Panen:</strong></p>
                    <Row gutter={8} style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '5px', fontWeight: 'bold' }}>
                        <Col span={8}>Tanggal</Col>
                        <Col span={8}>Berat (Kg)</Col>
                        <Col span={8}>Size</Col>
                    </Row>
                    {panenData && panenData.detail && panenData.detail
                        .filter(d => d.posisi === posisi)
                        .map((detailPanen, index) => (
                            <Row key={index} gutter={8} style={{ borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '3px' }}>
                                <Col span={8}>{detailPanen.created_date}</Col>
                                <Col span={8}>{detailPanen.berat}</Col>
                                <Col span={8}>{detailPanen.size}</Col>
                            </Row>
                        ))}
                </Col>

                {/* Divider Dashed di Tengah */}
                <Col span={1} style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                        borderRight: '2px dashed #999',
                        height: '100%',
                        minHeight: '120px'
                    }} />
                </Col>

                {/* Data Bongkar di Kanan */}
                <Col span={16}>
                    <p><strong>Data Bongkar:</strong></p>
                    <Row gutter={16} style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        <Col span={5}>{translate('Berat')}</Col>
                        <Col span={4}>{translate('Size')}</Col>
                        <Col span={3}>{translate('Molting (%)')}</Col>
                        <Col span={4}>{translate('Harga')}</Col>
                        <Col span={4}>{translate('Subtotal')}</Col>
                    </Row>
                    {detailBongkarPosisi?.map((inputDetail, index) => {
                        const subtotal = new Intl.NumberFormat('id-ID', {
                            style: 'decimal',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }).format(inputDetail.berat_bongkar * inputDetail.harga * (inputDetail.persen_molting / 100));

                        return (
                            <Row gutter={16} key={index} align="middle">
                                <Col span={5}>
                                    <Input
                                        type="number"
                                        value={inputDetail.berat_bongkar}
                                        onChange={(e) => handleDetailChange(posisi, index, 'berat_bongkar', e.target.value)}
                                        addonAfter="Kg"
                                    />
                                </Col>
                                <Col span={4}>
                                    <Input
                                        type="number"
                                        value={inputDetail.size}
                                        onChange={(e) => handleDetailChange(posisi, index, 'size', e.target.value)}
                                    />
                                </Col>
                                <Col span={3}>
                                    <Input
                                        type="number"
                                        value={inputDetail.persen_molting}
                                        onChange={(e) => handleDetailChange(posisi, index, 'persen_molting', e.target.value)}
                                    />
                                </Col>
                                <Col span={4}>
                                    <Input
                                        type="number"
                                        value={inputDetail.harga}
                                        onChange={(e) => handleDetailChange(posisi, index, 'harga', e.target.value)}
                                    />
                                </Col>
                                <Col span={4} style={{ textAlign: 'center', fontWeight: 'bold', marginTop: '-20px' }}>
                                    {subtotal}
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
                    })}

                    <Button type="dashed" onClick={() => handleAddDetailBongkar(posisi)} icon={<PlusOutlined />}>
                        {translate('Add Detail')}
                    </Button>
                </Col>
            </Row>

            {/* Footer Card untuk Total Panen & Bongkar */}
            <div style={{
                borderTop: "2px solid #ccc",
                paddingTop: "10px",
                marginTop: "15px",
                fontWeight: "bold",
                textAlign: "center"
            }}>
                <Row>
                    <Col span={8} style={{ textAlign: "left" }}>Total Panen: {getTotals(posisi)} Kg</Col>
                    <Col span={3} style={{ textAlign: "left" }}>Total Bongkar </Col>
                    <Col span={1} style={{ textAlign: "left" }}> : </Col>
                    <Col span={8} style={{ textAlign: "left" }}> {getTotals(posisi, true)} Kg</Col>
                </Row>
                <Row>
                    <Col span={8} />
                    <Col span={3} style={{ textAlign: "left" }}>Total Harga </Col>
                    <Col span={1} style={{ textAlign: "left" }}> : </Col>
                    <Col span={8} style={{ textAlign: "left", fontWeight: "bold" }}>
                        {new Intl.NumberFormat('id-ID', {
                            style: 'decimal',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }).format(totalSubtotal)}
                    </Col>
                </Row>
            </div>
        </Card>
    );
};

export default DetailBongkarCard;