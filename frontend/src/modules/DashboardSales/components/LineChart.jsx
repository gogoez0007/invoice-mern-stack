import { Card, Empty } from 'antd';
import { Column } from '@ant-design/plots';

export default function LineChart({ data, title }) {
    if (!data || data.length === 0) {
        return <Empty description="No data available" />;
    }

    const config = {
        data,
        xField: 'name',
        yField: 'visits',
        style: {
            fill: '#1677ff',
            radiusTopLeft: 6,
            radiusTopRight: 6,
        },
        label: {
            text: 'visits',
            position: 'inside', // Mengganti 'middle' ke 'inside'
            style: {
                fill: '#ffffff',
                opacity: 0.6,
            },
        },
        axis: {
            x: { labelAutoHide: true, labelAutoRotate: false },
        },
        tooltip: {
            channel: 'y',
            valueFormatter: (v) => `${v} Visits`,
        },
    };

    return (
        <Card title={title}>
            <Column {...config} />
        </Card>
    );
}