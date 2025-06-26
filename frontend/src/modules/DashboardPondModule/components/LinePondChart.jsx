import React, { useMemo } from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';

// Fungsi untuk format angka dengan koma dan 2 desimal
const formatNumber = (value) => {
    if (isNaN(value)) return '-';
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export default function LinePondChart({ data, selectedKey, selectedBlok }) {
    const filteredData = useMemo(() => {
        if (!data || !selectedBlok || !selectedKey) return [];
        return data
            .filter(item => item.pond && item.pond.trim().charAt(0).toUpperCase() === selectedBlok)
            .map(item => ({
                pond: item.pond,
                value: Number(item[selectedKey]) || 0,
                stocking_date: item.stocking_date || '-',
                doc: item.doc || '-',
                pl_source: item.pl_source || '-',
            }));
    }, [data, selectedKey, selectedBlok]);

    if (filteredData.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: 20 }}>
                Tidak ada data untuk blok dan parameter yang dipilih.
            </div>
        );
    }

    const axisStyle = {
        fontSize: 12,
        fill: '#22075e',
        fontWeight: 'bold',
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length > 0) {
            const item = payload[0].payload;
            return (
                <div
                    style={{
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        padding: '10px',
                        fontSize: 12,
                        boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
                    }}
                >
                    <p style={{ marginBottom: 4 }}>
                        <strong style={{ color: '#22075e' }}>📍 Pond:</strong>{' '}
                        <span style={{ color: '#595959' }}>{label}</span>
                    </p>
                    <p style={{ marginBottom: 4 }}>
                        <strong style={{ color: '#22075e' }}>🕓 Stocking Date:</strong>{' '}
                        <span style={{ color: '#595959' }}>{item.stocking_date}</span>
                    </p>
                    <p style={{ marginBottom: 4 }}>
                        <strong style={{ color: '#22075e' }}>🐣 DOC:</strong>{' '}
                        <span style={{ color: '#595959' }}>{item.doc}</span>
                    </p>
                    <p style={{ marginBottom: 4 }}>
                        <strong style={{ color: '#22075e' }}>🧬 PL Source:</strong>{' '}
                        <span style={{ color: '#595959' }}>{item.pl_source}</span>
                    </p>
                    <p style={{ marginBottom: 0 }}>
                        <strong style={{ color: '#22075e' }}>
                            📈 {selectedKey.replace(/_/g, ' ').toUpperCase()}:
                        </strong>{' '}
                        <span style={{ color: '#1890ff' }}>{formatNumber(item.value)}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="pond"
                    style={{ fontSize: 12, fill: '#22075e', fontWeight: 'bold' }}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    dy={10}
                />
                <YAxis style={axisStyle} tickFormatter={formatNumber} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="value" stroke="#05143b" strokeWidth={2} />
            </LineChart>
        </ResponsiveContainer>
    );
}
