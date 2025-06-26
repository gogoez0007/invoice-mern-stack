import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Sector,
} from "recharts";

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

// Render slice aktif dengan efek custom (bisa dimodifikasi sesuai kebutuhan)
const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const {
        cx,
        cy,
        midAngle,
        innerRadius,
        outerRadius,
        startAngle,
        endAngle,
        fill,
        payload,
        percent,
        value,
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";
    const formatNumber = (num) => {
        return new Intl.NumberFormat("id-ID").format(num);
    };

    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
                {payload.name}
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
            <text
                x={ex + (cos >= 0 ? 1 : -1) * 12}
                y={ey}
                textAnchor={textAnchor}
                fill="#333"
            >
                {`${payload.name} `}
            </text>
            <text
                x={ex + (cos >= 0 ? 1 : -1) * 12}
                y={ey}
                dy={18}
                textAnchor={textAnchor}
                fill="#333"
            >
                {` ${formatNumber(value)}`}
            </text>
            <text
                x={ex + (cos >= 0 ? 1 : -1) * 12}
                y={ey}
                dy={36}
                textAnchor={textAnchor}
                fill="#999"
            >
                {(percent * 100).toFixed(2)}%
            </text>
        </g>
    );
};

// Fungsi custom legend dengan formatting number
const renderLegend = (props) => {
    const { payload, type } = props;

    const formatNumber = (num) => {
        return new Intl.NumberFormat("id-ID").format(num);
    };

    return (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, textAlign: "center" }}>
            {payload.map((entry, index) => (
                <li
                    key={`item-${index}`}
                    style={{
                        display: "inline-block",
                        marginRight: 20,
                        cursor: "default",
                        fontSize: 14,
                        color: "#333",
                    }}
                >
                    <span
                        style={{
                            display: "inline-block",
                            backgroundColor: entry.color,
                            width: 12,
                            height: 12,
                            marginRight: 6,
                            verticalAlign: "middle",
                        }}
                    />
                    {entry.value}:{" "}
                    <strong>
                        {formatNumber(entry.payload.value)}{" "}
                        {type === "unit" ? "unit" : type === "frekuensi" ? "frekuensi" : "kg"}
                    </strong>
                </li>
            ))}
        </ul>
    );
};


export default function OwnershipPieChart({ type = "unit", title = "Ownership Chart" }) {
    const productivity = useSelector((state) => state.erp.productivity);
    const result = productivity?.result ?? [];
    const isLoading = productivity?.isLoading;

    const [activeIndex, setActiveIndex] = useState(0);

    if (isLoading) return <p>Loading...</p>;
    if (!result || result.length === 0) return <p>No data available</p>;

    // Hitung jumlah masing-masing jenis kepemilikan berdasarkan tipe
    const kepemilikanCount = result.reduce(
        (acc, curr) => {
            const key = curr.status_kendaraan?.toLowerCase() === "delmar group" ? "Delmar Group" : "Sewa";

            if (type === "unit") {
                acc[key] = (acc[key] || 0) + 1;
            } else if (type === "frekuensi") {
                const freq = Number(curr.frekuensi) || 0;
                acc[key] = (acc[key] || 0) + freq;
            } else if (type === "volume") {
                const volume = Number(curr.volume_panen) || 0;
                acc[key] = (acc[key] || 0) + volume;
            }

            return acc;
        },
        { "Delmar Group": 0, Sewa: 0 }
    );

    const chartData = Object.entries(kepemilikanCount).map(([name, value]) => ({
        name,
        value,
    }));

    const onPieEnter = (_, index) => {
        setActiveIndex(index);
    };

    return (
        <>
            <ResponsiveContainer width="100%" height={500}>
                <PieChart>
                    <Pie
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        fill="#8884d8"
                        onMouseEnter={onPieEnter}
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${entry.name}`}
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Legend content={(props) => renderLegend({ ...props, type })} verticalAlign="bottom" height={60} />
                </PieChart>
            </ResponsiveContainer>
        </>
    );
}
