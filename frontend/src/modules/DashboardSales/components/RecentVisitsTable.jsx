import { Card, Table, Tag, Avatar, Space, Tooltip, Button } from 'antd';
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
    // AMBIL PERIODE DARI DATA
    // =========================

    const getPeriodText = () => {

        if (!sortedVisits.length) return '-';

        // Ambil semua tanggal valid
        const validDates = sortedVisits
            .map(v => v.time)
            .filter(Boolean)
            .map(date => dayjs(date));

        if (!validDates.length) return '-';

        // Cari tanggal terbaru
        const latestDate = validDates.reduce((latest, current) =>
            current.isAfter(latest) ? current : latest
        );

        const now = dayjs();

        // Cek apakah bulan data = bulan sekarang
        const isCurrentMonth =
            latestDate.month() === now.month() &&
            latestDate.year() === now.year();

        // Kalau bulan berjalan
        if (isCurrentMonth) {
            return `1 - ${now.format('DD MMMM YYYY')}`;
        }

        // Kalau bulan lama/full month
        return `1 - ${latestDate.endOf('month').format('DD MMMM YYYY')}`;
    };

    // =========================
    // EXPORT PDF
    // =========================

    const exportPDF = () => {

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        });

        // =========================
        // HEADER
        // =========================

        doc.setFontSize(18);

        doc.text(
            title || 'Recent Visits',
            14,
            15
        );

        doc.setFontSize(11);

        // PERIODE
        doc.text(
            `Periode : ${getPeriodText()}`,
            14,
            24
        );

        // JAM CETAK
        doc.text(
            `Dicetak : ${dayjs().format('DD MMMM YYYY HH:mm:ss')}`,
            14,
            31
        );

        // TOTAL DATA
        doc.text(
            `Total Data : ${sortedVisits.length}`,
            14,
            38
        );

        // =========================
        // TABLE
        // =========================

        autoTable(doc, {
            startY: 45,

            head: [[
                'No',
                'Sales',
                'Nama Pemilik',
                'Nama Tambak',
                'Tanggal Kunjungan',
                'Benur Asal',
                'DOC'
            ]],

            body: sortedVisits.map((item, index) => [
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

                // No
                0: {
                    cellWidth: 12,
                    halign: 'center'
                },

                // Sales
                1: {
                    cellWidth: 38
                },

                // Nama Pemilik
                2: {
                    cellWidth: 50
                },

                // Tambak
                3: {
                    cellWidth: 65
                },

                // Tanggal
                4: {
                    cellWidth: 45
                },

                // Benur
                5: {
                    cellWidth: 45
                },

                // DOC
                6: {
                    cellWidth: 25,
                    halign: 'center'
                },
            },

            margin: {
                top: 45,
                left: 10,
                right: 10,
            },

            didDrawPage: function (data) {

                const pageCount = doc.internal.getNumberOfPages();

                doc.setFontSize(10);

                doc.text(
                    `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
                    data.settings.margin.left,
                    doc.internal.pageSize.height - 10
                );
            }
        });

        // =========================
        // SAVE PDF
        // =========================

        doc.save(
            `Rekap Kunjungan Sales-${dayjs().format('YYYY-MM-DD-HHmmss')}.pdf`
        );
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
                    {text}
                </Space>
            ),
        },

        {
            title: 'Nama Pemilik',
            dataIndex: 'customerName',
        },

        {
            title: 'Nama Tambak',
            dataIndex: 'location',

            render: (text) => (
                <Space>
                    <EnvironmentOutlined />
                    {text}
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
                <Tag color="blue">
                    DOC {text}
                </Tag>
            ),

            ellipsis: true,
            align: 'center',
        },
    ];

    return (
        <Card
            title={title}

            extra={
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={exportPDF}
                >
                    Export PDF
                </Button>
            }
        >
            <Table
                columns={columns}
                dataSource={sortedVisits}
                rowKey="id"
                pagination={false}
                scroll={{ x: true }}
            />
        </Card>
    );
}