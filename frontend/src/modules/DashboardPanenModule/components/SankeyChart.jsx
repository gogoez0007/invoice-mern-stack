import { useState, useEffect } from "react";
import { DatePicker, Spin, Card, Statistic, Row, Col } from "antd";
import { ResponsiveSankey } from "@nivo/sankey";
import { BarChartOutlined, ShoppingCartOutlined } from '@ant-design/icons'; // Import Ant Design icons
import dayjs from "dayjs";

export default function SankeyDiagram({ title, filterMode = "tahun" }) {
    const [date, setDate] = useState(dayjs());
    const [sankeyData, setSankeyData] = useState({ nodes: [], links: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [totalLeft, setTotalLeft] = useState(0);
    const [totalRight, setTotalRight] = useState(0);

    const fetchData = async (selectedDate = date) => {
        setIsLoading(true);
        try {
            const tahun = selectedDate.year();
            const bulan = filterMode === "tahun" ? null : selectedDate.month() + 1;

            const query = filterMode === "tahun"
                ? `tahun=${tahun}`
                : `tahun=${tahun}&bulan=${bulan.toString().padStart(2, "0")}`;

            const response = await fetch(`http://123.255.202.38/api/sankey?${query}`);
            if (!response.ok) throw new Error("Failed to fetch Sankey data");

            const rawData = await response.json();

            const nodeTotals = {};
            rawData.links.forEach(link => {
                const source = link.source.trim();
                const target = link.target.trim();
                const value = link.value;

                nodeTotals[source] = (nodeTotals[source] || 0) + value;
                nodeTotals[target] = (nodeTotals[target] || 0) - value;
            });

            const allNodeNames = new Set();
            rawData.nodes.forEach(n => allNodeNames.add(n.name.trim()));
            rawData.links.forEach(l => {
                allNodeNames.add(l.source.trim());
                allNodeNames.add(l.target.trim());
            });

            const nodeList = Array.from(allNodeNames);
            const transformedNodes = nodeList.map(name => {
                // Ambil total nilai untuk node tersebut
                const nodeValue = nodeTotals[name] || 0;

                // Jika nama bukan 'Delta Marine Group' dan nilai negatif, kalikan dengan -1 untuk menjadikannya positif
                const adjustedValue = name !== 'Delta Marine Group' && nodeValue < 0 ? nodeValue * -1 : nodeValue;

                return {
                    id: name,
                    label: `${name} (${(adjustedValue / 1000).toFixed(1)} ton)`, // Pastikan nilai diubah menjadi ton dan diformat
                };
            });


            const transformedLinks = rawData.links.map((l) => ({
                source: l.source.trim(),
                target: l.target.trim(),
                value: l.value,
            }));

            setSankeyData({ nodes: transformedNodes, links: transformedLinks });

            const allSources = new Set(transformedLinks.map(l => l.source));
            const allTargets = new Set(transformedLinks.map(l => l.target));

            const leftNodes = Array.from(allSources).filter(source => !allTargets.has(source));
            const rightNodes = Array.from(allTargets).filter(target => !allSources.has(target));

            const totalLeftValue = transformedLinks
                .filter(link => leftNodes.includes(link.source))
                .reduce((acc, curr) => acc + curr.value, 0);

            const totalRightValue = transformedLinks
                .filter(link => rightNodes.includes(link.target))
                .reduce((acc, curr) => acc + curr.value, 0);

            setTotalLeft((totalLeftValue / 1000).toFixed(1));
            setTotalRight((totalRightValue / 1000).toFixed(1));
        } catch (error) {
            console.error("Error loading Sankey data:", error);
            setSankeyData({ nodes: [], links: [] });
            setTotalLeft(0);
            setTotalRight(0);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [date]);

    return (
        <div
            className="whiteBox shadow"
            style={{
                background: "#f4f7fa", // Soft light gray background
                borderRadius: 16,
                padding: 30,
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                margin: "20px 0",
            }}
        >
            <h3
                style={{
                    color: "#1f2d3d", // Darker text color for better contrast
                    marginBottom: 20,
                    fontSize: 26,
                    fontWeight: 700,
                    textAlign: "center",
                    letterSpacing: "0.5px", // Slight letter spacing for more refined look
                }}
            >
                {title}
            </h3>

            <div style={{ display: "flex", justifyContent: "center", gap: 15, marginBottom: 25 }}>
                <DatePicker
                    picker={filterMode === "tahun" ? "year" : "month"}
                    value={date}
                    onChange={(value) => {
                        setDate(value);
                        fetchData(value);
                    }}
                    allowClear={false}
                    style={{ width: 250, borderRadius: 8 }} // Rounded borders for input box
                />
            </div>

            {isLoading ? (
                <div style={{ textAlign: "center", marginTop: 50 }}>
                    <Spin size="large" />
                </div>
            ) : sankeyData.nodes.length === 0 || sankeyData.links.length === 0 ? (
                <div style={{ textAlign: "center", marginTop: 50 }}>
                    Tidak ada data Sankey untuk ditampilkan.
                </div>
            ) : (
                <>
                    <div style={{ height: 450, marginBottom: 30 }}>
                        <ResponsiveSankey
                            data={sankeyData}
                            margin={{ top: 20, right: 170, bottom: 30, left: 170 }}
                            nodeWidth={20}
                            nodePadding={18}
                            layout="horizontal"
                            colors={{ scheme: "category10" }}
                            enableLabels={true}
                            label={(node) => node.label}
                            labelPosition="outside"
                            labelOrientation="horizontal"
                            labelPadding={16}
                            nodeOpacity={1}
                            linkOpacity={0.4}
                            linkBlendMode="multiply"
                            tooltip={(d) => (
                                <div style={{ padding: 8 }}>
                                    <strong>{d.source} → {d.target}</strong><br />
                                    {(d.value / 1000).toFixed(1)} ton
                                </div>
                            )}
                            theme={{
                                labels: {
                                    text: {
                                        fontSize: 12,
                                        fill: "#333",
                                        fontWeight: 500,
                                    },
                                },
                            }}
                            onClick={(node) => console.log("Clicked node:", node)}
                        />
                    </div>

                    <Row gutter={16} style={{ marginTop: 20 }}>
                        <Col span={12}>
                            <Card
                                bordered={false}
                                style={{
                                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)", // Soft shadow for card
                                    borderRadius: 8,
                                }}
                            >
                                <Statistic
                                    title="Total Panen"
                                    value={totalLeft}
                                    suffix="ton"
                                    precision={1}
                                    valueStyle={{
                                        fontSize: 26,
                                        fontWeight: "700",
                                        color: "#1890ff",
                                    }}
                                    prefix={<BarChartOutlined style={{ fontSize: 32, color: "#1890ff" }} />}
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card
                                bordered={false}
                                style={{
                                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)", // Soft shadow for card
                                    borderRadius: 8,
                                }}
                            >
                                <Statistic
                                    title="Total Bongkar / Jual"
                                    value={totalRight}
                                    suffix="ton"
                                    precision={1}
                                    valueStyle={{
                                        fontSize: 26,
                                        fontWeight: "700",
                                        color: "#52c41a",
                                    }}
                                    prefix={<ShoppingCartOutlined style={{ fontSize: 32, color: "#52c41a" }} />}
                                />
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </div>
    );
}
