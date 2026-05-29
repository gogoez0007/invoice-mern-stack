import { Card, Empty } from 'antd';
import { Pie } from '@ant-design/plots';

export default function PieChart({ data, title }) {
    if (!data || data.length === 0) {
        return <Empty description="No data available" />;
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);

    const config = {
        data,
        angleField: 'value',
        colorField: 'name',
        radius: 0.8,
        innerRadius: 0.6,
        label: {
            text: 'value',
            position: 'outside', // Mengganti type: 'outer' ke position: 'outside'
        },
        legend: {
            color: {
                title: false,
                position: 'bottom',
                rowPadding: 5,
            },
        },
        annotations: [
            {
                type: 'text',
                style: {
                    text: `${total}\nTotal`,
                    x: '50%',
                    y: '50%',
                    textAlign: 'center',
                    fontSize: 18,
                    fontWeight: 'bold',
                },
            },
        ],
    };

    return (
        <Card title={title}>
            <Pie {...config} />
        </Card>
    );
}