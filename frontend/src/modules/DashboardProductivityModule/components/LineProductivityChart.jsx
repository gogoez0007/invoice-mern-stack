import React from 'react';
import { useSelector } from 'react-redux';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

export default function ProductivityLineChart({ types = 'single' }) {
    const productivity = useSelector((state) => state.erp.productivity);
    const result = productivity?.result ?? [];
    const isLoading = productivity?.isLoading;

    if (isLoading) return <p>Loading...</p>;
    if (!result || result.length === 0) return <p>No data available</p>;

    const chartData = result.slice(0, 30).map((item, index) => ({
        ...item,
        label: item.nopol || item.nama || `Unit-${index + 1}`,
        frekuensi: parseFloat(item.frekuensi) || 0,
        volume_panen: parseFloat(item.volume_panen) || 0,
        volume_bongkar: parseFloat(item.volume_bongkar) || 0
    }));

    const dataKeys = [];
    if (types === 'dual') {
        dataKeys.push('volume_panen', 'volume_bongkar');
    } else {
        dataKeys.push('frekuensi');
    }

    let maxYValue = 0; // Inisialisasi di sini

    if (types === 'dual') {
        const allPanen = chartData.map(item => item.volume_panen);
        const allBongkar = chartData.map(item => item.volume_bongkar);
        const validPanen = allPanen.filter(value => typeof value === 'number' && !isNaN(value));
        const validBongkar = allBongkar.filter(value => typeof value === 'number' && !isNaN(value));

        const maxPanen = validPanen.length > 0 ? Math.max(...validPanen) : 0;
        const maxBongkar = validBongkar.length > 0 ? Math.max(...validBongkar) : 0;
        maxYValue = Math.max(maxPanen, maxBongkar);
    } else {
        const allFrek = chartData.map(item => item.frekuensi);
        const validFrek = allFrek.filter(value => typeof value === 'number' && !isNaN(value));
        maxYValue = validFrek.length > 0 ? Math.max(...validFrek) : 0;
    }

    const chartWidth = Math.max(chartData.length * 100, 600);
    const xAxisTicks = chartData.map(item => item.label);

    return (
        <div > {/* Coba atur minWidth */}
            <ResponsiveContainer width="100%" height={500}>
                <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                    width={chartWidth}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="label"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        style={{ fontSize: '14px' }}
                        ticks={xAxisTicks}
                        interval={0} // Paksa menampilkan semua label (HATI-HATI!)
                    />
                    <YAxis
                        //domain={[0, maxYValue * 1.2]} // Biarkan Recharts menangani penskalaan otomatis
                        tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip />
                    <Legend />
                    {types === 'single' && (
                        <Line
                            type="monotone"
                            dataKey="frekuensi"
                            stroke="#ff7300"
                            name="Frekuensi"
                        />
                    )}
                    {types === 'dual' && (
                        <>
                            <Line
                                type="monotone"
                                dataKey="volume_panen"
                                stroke="#82ca9d"
                                name="Volume Panen"
                            />
                            <Line
                                type="monotone"
                                dataKey="volume_bongkar"
                                stroke="#ff7300"
                                name="Volume Bongkar"
                            />
                        </>
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}