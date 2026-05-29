import { Card, List, Avatar, Typography, Space, Tag } from 'antd';
import {
    TrophyOutlined,
    RiseOutlined,
    UserOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

export default function TopPerformersCard({ performers, title }) {
    return (
        <Card
            title={
                <Space>
                    <TrophyOutlined style={{ color: '#faad14' }} />
                    {title}
                </Space>
            }
        >
            <List
                itemLayout="horizontal"
                dataSource={performers}
                renderItem={(item, index) => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={
                                <Avatar
                                    style={{
                                        backgroundColor:
                                            index === 0
                                                ? '#faad14'
                                                : index === 1
                                                    ? '#bfbfbf'
                                                    : index === 2
                                                        ? '#d48806'
                                                        : '#1677ff',
                                    }}
                                    icon={<UserOutlined />}
                                />
                            }
                            title={
                                <Space>
                                    <Text strong>{item.name}</Text>
                                    {index < 3 && (
                                        <Tag color="gold">#{index + 1}</Tag>
                                    )}
                                </Space>
                            }
                            description={
                                <Space size="small">
                                    <Text type="secondary">
                                        {item.visits} visits
                                    </Text>
                                    <Text type="secondary">•</Text>
                                    <Text style={{ color: '#52c41a' }}>
                                        {item.conversions}% Foto kunjungan
                                    </Text>
                                </Space>
                            }
                        />

                        <Space>
                            <RiseOutlined style={{ color: '#1677ff' }} />
                            <Text strong style={{ color: '#1677ff' }}>
                                {item.revenue}
                            </Text>
                        </Space>
                    </List.Item>
                )}
            />
        </Card>
    );
}
