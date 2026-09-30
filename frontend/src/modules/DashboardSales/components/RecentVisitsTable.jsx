import { Card, Table, Tag, Avatar, Space, Tooltip, Button, Tabs } from 'antd';
import {
    EnvironmentOutlined,
    ClockCircleOutlined,
    UserOutlined,
    DeploymentUnitOutlined,
    DownloadOutlined
} from '@ant-design/icons';

import dayjs from 'dayjs';
import 'dayjs/locale/id';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

dayjs.locale('id');

export default function RecentVisitsTable({
    visits = [],
    title
}) {

    // =========================
    // SORT TERLAMA -> TERBARU
    // =========================

    const sortedVisits = [...visits].sort((a, b) => {
        return dayjs(a.time).valueOf() - dayjs(b.time).valueOf();
    });

    // =========================
    // GROUP BY SALES
    // =========================

    const groupedBySales = sortedVisits.reduce((acc, item) => {
        const salesName = item.salesName || 'Tanpa Sales';

        if (!acc[salesName]) {
            acc[salesName] = [];
        }

        acc[salesName].push(item);

        return acc;
    }, {});

    const salesNames = Object.keys(groupedBySales);

    // =========================
    // AMBIL PERIODE DARI DATA
    // =========================

    const getPeriodText = (data = sortedVisits) => {

        if (!data.length) return '-';

        const validDates = data
            .map(v => v.time)
            .filter(Boolean)
            .map(date => dayjs(date))
            .filter(date => date.isValid());

        if (!validDates.length) return '-';

        const latestDate = validDates.reduce((latest, current) =>
            current.isAfter(latest) ? current : latest
        );

        const now = dayjs();

        const isCurrentMonth =
            latestDate.month() === now.month() &&
            latestDate.year() === now.year();

        if (isCurrentMonth) {
            return `1 - ${now.format('DD MMMM YYYY')}`;
        }

        return `1 - ${latestDate.endOf('month').format('DD MMMM YYYY')}`;
    };

    // =========================
    // HEADER PDF PER SALES
    // =========================

    const drawPDFHeader = (doc, salesName, data) => {

        doc.setFontSize(18);

        doc.text(
            title || 'Recent Visits',
            14,
            15
        );

        doc.setFontSize(12);

        doc.text(
            `Sales : ${salesName}`,
            14,
            24
        );

        doc.setFontSize(11);

        doc.text(
            `Periode : ${getPeriodText(data)}`,
            14,
            31
        );

        doc.text(
            `Dicetak : ${dayjs().format('DD MMMM YYYY HH:mm:ss')}`,
            14,
            38
        );

        doc.text(
            `Total Data : ${data.length}`,
            14,
            45
        );
    };

    // =========================
    // EXPORT PDF PER SALES
    // =========================

    const exportPDF = () => {

        salesNames.forEach((salesName) => {

            const salesData = groupedBySales[salesName];

            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4',
            });

            drawPDFHeader(doc, salesName, salesData);

            autoTable(doc, {
                startY: 52,

                head: [[
                    'No',
                    'Sales',
                    'Nama Pemilik',
                    'Nama Tambak',
                    'Tanggal Kunjungan',
                    'Benur Asal',
                    'DOC'
                ]],

                body: salesData.map((item, index) => [
                    index + 1,
                    item.salesName || '-',
                    item.customerName || '-',
                    item.location || '-',
                    item.time
                        ? dayjs(item.time).format('DD MMM YYYY HH:mm')
                        : '-',
                    item.benur_asal || '-',
                    item.notes ? `DOC ${item.notes}` : '-'
                ]),

                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    overflow: 'linebreak',
                    valign: 'middle',
                },

                headStyles: {
                    fillColor: [22, 119, 255],
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'center',
                },

                bodyStyles: {
                    textColor: 50,
                },

                alternateRowStyles: {
                    fillColor: [245, 245, 245],
                },

                columnStyles: {
                    0: {
                        cellWidth: 12,
                        halign: 'center'
                    },
                    1: {
                        cellWidth: 38
                    },
                    2: {
                        cellWidth: 50
                    },
                    3: {
                        cellWidth: 65
                    },
                    4: {
                        cellWidth: 45
                    },
                    5: {
                        cellWidth: 45
                    },
                    6: {
                        cellWidth: 25,
                        halign: 'center'
                    },
                },

                margin: {
                    top: 52,
                    left: 10,
                    right: 10,
                },

                didDrawPage: function (data) {

                    const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
                    const pageCount = doc.internal.getNumberOfPages();

                    doc.setFontSize(10);

                    doc.text(
                        `Page ${pageNumber} of ${pageCount}`,
                        data.settings.margin.left,
                        doc.internal.pageSize.height - 10
                    );
                }
            });

            const safeSalesName = salesName
                .replace(/[\\/:*?"<>|]/g, '-')
                .replace(/\s+/g, ' ')
                .trim();

            doc.save(
                `Rekap Kunjungan Sales - ${safeSalesName} - ${dayjs().format('YYYY-MM-DD-HHmmss')}.pdf`
            );
        });
    };

    // =========================
    // TABLE COLUMNS
    // =========================

    const columns = [

        {
            title: 'No',
            render: (_, __, index) => index + 1,
            width: 60,
            align: 'center',
        },

        {
            title: 'Sales',
            dataIndex: 'salesName',

            render: (text) => (
                <Space>
                    <Avatar icon={<UserOutlined />} />
                    {text || '-'}
                </Space>
            ),
        },

        {
            title: 'Nama Pemilik',
            dataIndex: 'customerName',
            render: (text) => text || '-',
        },

        {
            title: 'Nama Tambak',
            dataIndex: 'location',

            render: (text) => (
                <Space>
                    <EnvironmentOutlined />
                    {text || '-'}
                </Space>
            ),
        },

        {
            title: 'Tanggal Kunjungan',
            dataIndex: 'time',

            render: (text) => {

                if (!text) return '-';

                const dateObj = dayjs(text);

                return (
                    <Tooltip title={dateObj.format('DD MMMM YYYY HH:mm:ss')}>
                        <Space direction="vertical" size={0}>
                            <Space>
                                <ClockCircleOutlined
                                    style={{ color: '#1677ff' }}
                                />

                                <span style={{ fontWeight: 500 }}>
                                    {dateObj.format('DD MMM YYYY')}
                                </span>
                            </Space>
                        </Space>
                    </Tooltip>
                );
            },
        },

        {
            title: 'Benur Asal',
            dataIndex: 'benur_asal',

            render: (text) => (
                <Space>
                    <DeploymentUnitOutlined
                        style={{ color: '#fa8c16' }}
                    />

                    {text || '-'}
                </Space>
            ),
        },

        {
            title: 'DOC',
            dataIndex: 'notes',

            render: (text) => (
                text
                    ? <Tag color="blue">DOC {text}</Tag>
                    : <Tag>-</Tag>
            ),

            ellipsis: true,
            align: 'center',
        },
    ];

    // =========================
    // TABS PER SALES
    // =========================

    const tabItems = salesNames.map((salesName) => ({
        key: salesName,
        label: `${salesName} (${groupedBySales[salesName].length})`,
        children: (
            <Table
                columns={columns}
                dataSource={groupedBySales[salesName]}
                rowKey={(record, index) => record.id || `${salesName}-${index}`}
                pagination={false}
                scroll={{ x: true }}
            />
        )
    }));

    return (
        <Card
            title={title}

            extra={
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={exportPDF}
                    disabled={!sortedVisits.length}
                >
                    Export PDF
                </Button>
            }
        >
            <Tabs
                items={tabItems}
                type="card"
            />
        </Card>
    );
}