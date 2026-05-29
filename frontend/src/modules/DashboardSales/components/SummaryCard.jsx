import { Card, Statistic, Typography, Space } from 'antd';
import {
    ArrowUpOutlined,
    ArrowDownOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

export default function SummaryCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
}) {
    return (
        <Card hoverable>
            <Space direction="vertical" style={{ width: '100%' }}>

                <Statistic
                    title={title}
                    value={value}
                    prefix={Icon ? <Icon /> : null}
                />

                {subtitle && (
                    <Text type="secondary">
                        {subtitle}
                    </Text>
                )}

                {trend && (
                    <Text
                        style={{
                            color: trend.isPositive ? '#52c41a' : '#ff4d4f',
                            fontWeight: 500,
                        }}
                    >
                        {trend.isPositive ? (
                            <ArrowUpOutlined />
                        ) : (
                            <ArrowDownOutlined />
                        )}{' '}
                        {trend.value}
                    </Text>
                )}
            </Space>
        </Card>
    );
}
