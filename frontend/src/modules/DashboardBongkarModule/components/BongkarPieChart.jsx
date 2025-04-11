import { useState, useEffect } from "react";
import { DatePicker, Spin } from "antd";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector } from "recharts";
import dayjs from "dayjs";
import { request } from "@/request"; // Import request API

const COLORS = [
    "#4E79A7",
    "#F28E2B",
    "#E15759",
    "#76B7B2",
    "#59A14F",
    "#EDC949",
    "#AF7AA1",
    "#FF9DA7",
    "#9C755F",
    "#BAB0AC",
];

const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    // Konversi value dari kg ke ton
    const valueInTon = (value / 1000).toFixed(2);

    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
                {payload.tag}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 6}
                outerRadius={outerRadius + 10}
                fill={fill}
            />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${payload.tag} ${valueInTon} Ton`}</text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
                {`${(percent * 100).toFixed(2)}%`}
            </text>
        </g>
    );
};

export default function PanenPieChart({ title, filterMode = "tahun" }) {
    const [date, setDate] = useState(dayjs()); // Default hari ini
    const [statistics, setStatistics] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const fetchData = async (selectedDate = date) => {
        setIsLoading(true);
        try {
            const response = await request.panen_stats({
                entity: "panen",
                filterMode,
                options: filterMode === "tahun"
                    ? { tahun: selectedDate.year() }
                    : { tahun: selectedDate.year(), bulan: selectedDate.month() + 1 },
            });

            setStatistics([]);

            // Konversi response API ke format Pie Chart
            const formattedData = response.map((item) => ({
                tag: item.tambak,
                value: Number(item.total_berat),
            }));

            setStatistics(formattedData);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [date]); // Panggil ulang saat `date` berubah

    // Hitung total dari semua kategori untuk persentase
    const totalValue = statistics.reduce((sum, entry) => sum + entry.value, 0);

    const onPieEnter = (_, index) => {
        setActiveIndex(index);
    };


    return (
        <div className="whiteBox shadow" style={{ height: 550, padding: 10 }}>
            <h3 style={{ color: "#333", marginBottom: 20, fontSize: "large", textAlign: "center" }}>
                {title}
            </h3>

            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
                <DatePicker
                    value={date}
                    onChange={(value) => {
                        setDate(value);
                        fetchData(value);
                    }}
                    picker={filterMode === "tahun" ? "year" : "month"}
                />
            </div>

            {isLoading ? (
                <div style={{ textAlign: "center" }}>
                    <Spin />
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                        <Pie
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={statistics}
                            dataKey="value"
                            nameKey="tag"
                            cx="50%"
                            cy="45%"
                            innerRadius={60}
                            outerRadius={120}
                            fill="#8884d8"
                            onMouseEnter={onPieEnter}
                        >
                            {statistics.map((entry, index) => (
                                <Cell key={`cell-${entry.tag}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        {/* <Tooltip formatter={(value) => `${value} (${((value / totalValue) * 100).toFixed(1)}%)`} /> */}
                        <Legend verticalAlign="bottom" height={40} />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}