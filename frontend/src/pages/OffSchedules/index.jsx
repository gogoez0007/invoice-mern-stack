import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Badge,
    Button,
    Card,
    Checkbox,
    ConfigProvider,
    DatePicker,
    Empty,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Spin,
    Table,
    Tooltip,
    Typography,
    message
} from "antd";
import {
    CalendarOutlined,
    ReloadOutlined,
    PlusOutlined,
    SwapOutlined,
    SaveOutlined,
    SearchOutlined,
    LeftOutlined,
    RightOutlined,
    DoubleLeftOutlined,
    DoubleRightOutlined
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import "dayjs/locale/id";
import idID from "antd/locale/id_ID";
import { API_BASE_URL } from "@/config/serverApiConfig";
import storePersist from "@/redux/storePersist";

dayjs.extend(updateLocale);
dayjs.locale("id");
dayjs.updateLocale("id", {
    weekStart: 1,
    weekdays: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
    weekdaysShort: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
    weekdaysMin: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
});

const { Title, Text } = Typography;

const fmt = (d) => dayjs(d).format("YYYY-MM-DD");

const HARI_OPTIONS = [
    { value: 1, label: "Senin" },
    { value: 2, label: "Selasa" },
    { value: 3, label: "Rabu" },
    { value: 4, label: "Kamis" },
    { value: 5, label: "Jumat" },
    { value: 6, label: "Sabtu" },
    { value: 0, label: "Minggu" }
];

const NAMA_HARI_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function includeToken() {
    axios.defaults.baseURL = API_BASE_URL;
    axios.defaults.withCredentials = true;

    const auth = storePersist.get("auth");

    if (auth?.current?.token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${auth.current.token}`;
    } else {
        delete axios.defaults.headers.common["Authorization"];
    }
}

function getMonthRange(monthVal) {
    const start = monthVal.startOf("month");
    const end = monthVal.endOf("month");

    return {
        start,
        end,
        start_date: start.format("YYYY-MM-DD"),
        end_date: end.format("YYYY-MM-DD"),
        days: Array.from({ length: end.date() }, (_, i) => start.date(i + 1))
    };
}

function generateDatesByWeekdays(days, weekdays) {
    const selected = new Set((weekdays || []).map(Number));
    return days.filter((d) => selected.has(d.day())).map((d) => d.format("YYYY-MM-DD"));
}

export default function EmployeeOffCalendar() {
    const [loading, setLoading] = useState(false);
    const [monthVal, setMonthVal] = useState(dayjs());
    const [employees, setEmployees] = useState([]);
    const [visibleEmployeeIds, setVisibleEmployeeIds] = useState([]);
    const [offMap, setOffMap] = useState({});
    const [addOpen, setAddOpen] = useState(false);
    const [swapOpen, setSwapOpen] = useState(false);
    const [modalBusy, setModalBusy] = useState(false);
    const [search, setSearch] = useState("");
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [previewDates, setPreviewDates] = useState([]);
    const [selectedDates, setSelectedDates] = useState([]);

    const [empOptions, setEmpOptions] = useState([]);
    const [empLoading, setEmpLoading] = useState(false);
    const [hasMoreEmp, setHasMoreEmp] = useState(false);

    const empTotalRef = useRef(0);
    const empPageRef = useRef(1);
    const empSearchRef = useRef("");
    const empSearchTimerRef = useRef(null);

    const [addForm] = Form.useForm();
    const [swapForm] = Form.useForm();

    const range = useMemo(() => getMonthRange(monthVal), [monthVal]);

    const visibleEmployees = useMemo(() => {
        const ids = new Set(visibleEmployeeIds.map(Number));
        return employees.filter((e) => ids.has(Number(e.id)));
    }, [employees, visibleEmployeeIds]);

    const filteredEmployees = useMemo(() => {
        if (!search.trim()) return visibleEmployees;
        const q = search.trim().toLowerCase();
        return visibleEmployees.filter((e) => e.name.toLowerCase().includes(q));
    }, [visibleEmployees, search]);

    const antdLocaleWithFullWeekdays = useMemo(() => {
        const FULL = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

        return {
            ...idID,
            Calendar: {
                ...(idID.Calendar || {}),
                lang: {
                    ...((idID.Calendar && idID.Calendar.lang) || {}),
                    shortWeekDays: FULL,
                    weekDays: FULL
                }
            },
            DatePicker: {
                ...(idID.DatePicker || {}),
                lang: {
                    ...((idID.DatePicker && idID.DatePicker.lang) || {}),
                    shortWeekDays: FULL,
                    weekDays: FULL
                }
            }
        };
    }, []);

    const addEmployeeToLocal = useCallback((id, name) => {
        if (!id) return;

        setEmployees((prev) => {
            const map = new Map();

            for (const e of prev) {
                map.set(Number(e.id), e);
            }

            map.set(Number(id), {
                id: Number(id),
                name: name || `#${id}`
            });

            return [...map.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)));
        });
    }, []);

    const fetchEmployees = useCallback(async ({ page = 1, q = "" }, append = false) => {
        try {
            setEmpLoading(true);
            includeToken();

            const { data } = await axios.get("employees/list", {
                params: {
                    page,
                    items: 10,
                    q,
                    sortBy: "id",
                    sortValue: "DESC"
                }
            });

            const list = Array.isArray(data?.result) ? data.result : [];
            const total = data?.pagination?.count || list.length || 0;

            const opts = list.map((e) => ({
                value: Number(e.id),
                label: e.name || `#${e.id}`
            }));

            setEmpOptions((prev) => {
                const map = new Map();

                if (append) {
                    for (const item of prev) {
                        map.set(Number(item.value), item);
                    }
                }

                for (const item of opts) {
                    map.set(Number(item.value), item);
                }

                return [...map.values()];
            });

            setEmployees((prev) => {
                const map = new Map();

                for (const e of prev) {
                    map.set(Number(e.id), e);
                }

                for (const e of list) {
                    map.set(Number(e.id), {
                        id: Number(e.id),
                        name: e.name || `#${e.id}`
                    });
                }

                return [...map.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)));
            });

            empTotalRef.current = total;
            empPageRef.current = page;
            empSearchRef.current = q;

            setHasMoreEmp(page * 10 < total);
        } catch (e) {
            console.error(e);
            message.error("Gagal memuat karyawan");
        } finally {
            setEmpLoading(false);
        }
    }, []);

    const handleSearchEmployees = useCallback((q) => {
        if (empSearchTimerRef.current) {
            clearTimeout(empSearchTimerRef.current);
        }

        empSearchTimerRef.current = setTimeout(() => {
            const keyword = String(q || "").trim();

            if (keyword.length < 2) {
                setEmpOptions([]);
                setHasMoreEmp(false);
                empSearchRef.current = "";
                empPageRef.current = 1;
                empTotalRef.current = 0;
                return;
            }

            fetchEmployees({ page: 1, q: keyword }, false);
        }, 350);
    }, [fetchEmployees]);

    const handlePopupScrollEmployees = useCallback((e) => {
        const target = e.target;

        if (!hasMoreEmp || empLoading) return;

        if (target.scrollTop + target.offsetHeight >= target.scrollHeight - 24) {
            const nextPage = empPageRef.current + 1;
            fetchEmployees({ page: nextPage, q: empSearchRef.current }, true);
        }
    }, [fetchEmployees, hasMoreEmp, empLoading]);

    const getSelectOptions = useCallback((employee = null) => {
        const map = new Map();

        for (const item of empOptions) {
            map.set(Number(item.value), item);
        }

        if (employee?.id) {
            map.set(Number(employee.id), {
                value: Number(employee.id),
                label: employee.name || `#${employee.id}`
            });
        }

        return [...map.values()];
    }, [empOptions]);

    const handleEmployeeSelected = useCallback((userId) => {
        const selected = empOptions.find((e) => Number(e.value) === Number(userId));

        if (selected) {
            addEmployeeToLocal(selected.value, selected.label);
        }

        const existingDates = Object.keys(offMap[Number(userId)] || {}).sort();

        setSelectedDates(existingDates);
        setPreviewDates(existingDates);

        addForm.setFieldsValue({
            weekdays: [],
            dates: existingDates
        });
    }, [empOptions, addEmployeeToLocal, offMap, addForm]);

    const handleSwapEmployeeSelected = useCallback((fieldEmployee, fieldDate, userId) => {
        const selected = empOptions.find((e) => Number(e.value) === Number(userId));

        if (selected) {
            addEmployeeToLocal(selected.value, selected.label);
        }

        swapForm.setFieldsValue({
            [fieldEmployee]: userId,
            [fieldDate]: undefined
        });
    }, [empOptions, addEmployeeToLocal, swapForm]);

    const fetchOffDays = useCallback(async () => {
        setLoading(true);

        try {
            includeToken();

            const { data } = await axios.get("attendance/employee-off-days", {
                params: {
                    start_date: range.start_date,
                    end_date: range.end_date
                }
            });

            const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
            const userMap = new Map();
            const nextOffMap = {};

            for (const row of rows) {
                const userId = Number(row.user_id);

                if (!userMap.has(userId)) {
                    userMap.set(userId, {
                        id: userId,
                        name: row.employee_name || row.name || row.nama || `User ${userId}`
                    });
                }

                if (!nextOffMap[userId]) nextOffMap[userId] = {};

                nextOffMap[userId][fmt(row.off_date)] = {
                    ...row,
                    user_id: userId,
                    off_date: fmt(row.off_date)
                };
            }

            const usersWithOff = [...userMap.values()];

            setOffMap(nextOffMap);
            setVisibleEmployeeIds(usersWithOff.map((u) => u.id));

            setEmployees((prev) => {
                const merged = new Map();

                for (const u of prev) merged.set(Number(u.id), u);
                for (const u of usersWithOff) merged.set(Number(u.id), u);

                return [...merged.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)));
            });
        } catch (e) {
            console.error(e);
            message.error(e?.response?.data?.message || "Gagal memuat jadwal OFF");
        } finally {
            setLoading(false);
        }
    }, [range.start_date, range.end_date]);

    useEffect(() => {
        fetchOffDays();
    }, [fetchOffDays]);

    const openAddModal = (employee = null) => {
        const userId = employee?.id ? Number(employee.id) : null;
        const existingDates = userId ? Object.keys(offMap[userId] || {}).sort() : [];

        setEditingEmployee(employee || null);
        setSelectedDates(existingDates);
        setPreviewDates(existingDates);

        addForm.setFieldsValue({
            user_id: userId,
            weekdays: [],
            dates: existingDates,
            reason: "OFF Kalender"
        });

        setEmpOptions(employee?.id ? [{ value: Number(employee.id), label: employee.name }] : []);
        setHasMoreEmp(false);
        empSearchRef.current = "";
        empPageRef.current = 1;
        empTotalRef.current = 0;

        setAddOpen(true);
    };

    const closeAddModal = () => {
        setAddOpen(false);
        setEditingEmployee(null);
        setPreviewDates([]);
        setSelectedDates([]);
        addForm.resetFields();
    };

    const closeSwapModal = () => {
        setSwapOpen(false);
        swapForm.resetFields();
    };

    const openSwapModal = () => {
        setEmpOptions([]);
        setHasMoreEmp(false);
        empSearchRef.current = "";
        empPageRef.current = 1;
        empTotalRef.current = 0;
        setSwapOpen(true);
    };

    const onWeekdaysChange = (weekdays) => {
        const generatedDates = generateDatesByWeekdays(range.days, weekdays);

        setSelectedDates(generatedDates);
        setPreviewDates(generatedDates);

        addForm.setFieldsValue({
            dates: generatedDates
        });
    };

    const submitAddOff = async () => {
        try {
            const values = await addForm.validateFields();
            const userId = Number(values.user_id);
            const dates = Array.isArray(values.dates) ? values.dates.sort() : [];

            if (dates.length === 0) {
                return message.warning("Pilih minimal satu tanggal OFF");
            }

            setModalBusy(true);
            includeToken();

            await axios.put("attendance/employee-off-days/bulk-replace", {
                user_id: userId,
                start_date: range.start_date,
                end_date: range.end_date,
                dates,
                reason: values.reason || "OFF Kalender"
            });

            message.success("Jadwal OFF berhasil disimpan");
            closeAddModal();
            await fetchOffDays();
        } catch (e) {
            if (e?.errorFields) return;
            console.error(e);
            message.error(e?.response?.data?.message || "Gagal menyimpan jadwal OFF");
        } finally {
            setModalBusy(false);
        }
    };

    const submitSwapOff = async () => {
        try {
            const values = await swapForm.validateFields();

            const employeeA = Number(values.employee_a);
            const employeeB = Number(values.employee_b);
            const offDateA = values.off_date_a;
            const offDateB = values.off_date_b;

            if (employeeA === employeeB) {
                return message.warning("Karyawan A dan B tidak boleh sama");
            }

            if (offDateA === offDateB) {
                return message.warning("Tanggal OFF yang ditukar tidak boleh sama");
            }

            setModalBusy(true);
            includeToken();

            await axios.post("attendance/employee-off-days/swap", {
                user_id: employeeA,
                old_off_date: offDateA,
                new_off_date: offDateB,
                reason: values.reason || "Tukar OFF antar karyawan",
                created_by: values.created_by || null
            });

            await axios.post("attendance/employee-off-days/swap", {
                user_id: employeeB,
                old_off_date: offDateB,
                new_off_date: offDateA,
                reason: values.reason || "Tukar OFF antar karyawan",
                created_by: values.created_by || null
            });

            message.success("Swap OFF antar karyawan berhasil");
            closeSwapModal();
            await fetchOffDays();
        } catch (e) {
            if (e?.errorFields) return;
            console.error(e);
            message.error(e?.response?.data?.message || "Gagal swap OFF");
        } finally {
            setModalBusy(false);
        }
    };

    const getEmployeeOffDateOptions = (userId) => {
        const map = offMap[Number(userId)] || {};

        return Object.keys(map).sort().map((date) => ({
            value: date,
            label: `${dayjs(date).format("DD MMMM YYYY")} - ${NAMA_HARI_SHORT[dayjs(date).day()]}`
        }));
    };

    const columns = useMemo(() => {
        const base = [
            {
                title: "No",
                dataIndex: "no",
                width: 52,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1
            },
            {
                title: "Nama",
                dataIndex: "name",
                width: 230,
                fixed: "left",
                render: (name, row) => (
                    <Space direction="vertical" size={0}>
                        <Text strong>{name}</Text>
                        <Button size="small" type="link" style={{ padding: 0 }} onClick={() => openAddModal(row)}>
                            Edit OFF
                        </Button>
                    </Space>
                )
            }
        ];

        const dayCols = range.days.map((d) => {
            const dateKey = d.format("YYYY-MM-DD");
            const dayName = NAMA_HARI_SHORT[d.day()];
            const isWeekend = [0, 6].includes(d.day());

            return {
                title: (
                    <div className="off-day-header">
                        <div className={isWeekend ? "weekend-day-name" : ""}>{dayName}</div>
                        <div>{d.date()}</div>
                    </div>
                ),
                dataIndex: dateKey,
                width: 60,
                align: "center",
                render: (_, row) => {
                    const off = offMap[Number(row.id)]?.[dateKey];

                    if (!off) {
                        return <div className={isWeekend ? "off-cell weekend-cell" : "off-cell"} />;
                    }

                    const isSwap = off.source === "SWAP" || String(off.reason || "").toLowerCase().includes("tukar");

                    return (
                        <Tooltip title={off.reason || "OFF"}>
                            <div className={isSwap ? "off-cell is-off is-swap" : "off-cell is-off"}>
                                <span>{isSwap ? "SWAP" : "OFF"}</span>
                            </div>
                        </Tooltip>
                    );
                }
            };
        });

        return [...base, ...dayCols];
    }, [range.days, offMap]);

    const monthTitle = monthVal.format("MMMM YYYY").toUpperCase();

    return (
        <ConfigProvider locale={antdLocaleWithFullWeekdays}>
            <>
                <Card
                    style={{
                        marginBottom: 16,
                        borderRadius: 12,
                        background: "linear-gradient(135deg, #1677ff 0%, #00b96b 100%)",
                        color: "#fff",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.1)"
                    }}
                    bodyStyle={{ padding: "16px 24px" }}
                >
                    <Space style={{ width: "100%", justifyContent: "space-between" }} align="center" wrap>
                        <Space>
                            <CalendarOutlined style={{ fontSize: 24 }} />
                            <Title level={4} style={{ margin: 0, color: "#fff" }}>
                                Jadwal OFF Karyawan
                            </Title>
                        </Space>

                        <Space wrap>
                            <DatePicker
                                picker="month"
                                allowClear={false}
                                value={monthVal}
                                onChange={(v) => setMonthVal(v || dayjs())}
                                format="MMMM YYYY"
                                style={{ width: 180 }}
                            />

                            <Tooltip title="Tahun Sebelumnya">
                                <Button ghost icon={<DoubleLeftOutlined />} onClick={() => setMonthVal((v) => v.add(-1, "year"))} />
                            </Tooltip>

                            <Tooltip title="Bulan Sebelumnya">
                                <Button ghost icon={<LeftOutlined />} onClick={() => setMonthVal((v) => v.add(-1, "month"))} />
                            </Tooltip>

                            <Button ghost onClick={() => setMonthVal(dayjs())}>
                                Bulan Ini
                            </Button>

                            <Tooltip title="Bulan Berikutnya">
                                <Button ghost icon={<RightOutlined />} onClick={() => setMonthVal((v) => v.add(1, "month"))} />
                            </Tooltip>

                            <Tooltip title="Tahun Berikutnya">
                                <Button ghost icon={<DoubleRightOutlined />} onClick={() => setMonthVal((v) => v.add(1, "year"))} />
                            </Tooltip>

                            <Tooltip title="Muat ulang">
                                <Button ghost icon={<ReloadOutlined />} loading={loading} onClick={fetchOffDays} />
                            </Tooltip>
                        </Space>
                    </Space>
                </Card>

                <Card style={{ borderRadius: 12, marginBottom: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                    <Space style={{ width: "100%", justifyContent: "space-between" }} align="center" wrap>
                        <Space wrap>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => openAddModal()}>
                                Add Karyawan
                            </Button>

                            <Button icon={<SwapOutlined />} onClick={openSwapModal}>
                                Swap OFF Antar Karyawan
                            </Button>

                            <Input
                                allowClear
                                prefix={<SearchOutlined style={{ opacity: 0.5 }} />}
                                placeholder="Cari nama karyawan di tabel"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ width: 240 }}
                            />
                        </Space>

                        <Space wrap>
                            <Badge color="#f4b183" text="OFF" />
                            <Badge color="#ff7875" text="Swap OFF" />
                        </Space>
                    </Space>
                </Card>

                <Card style={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                    <div className="calendar-title">BULAN {monthTitle}</div>

                    <Spin spinning={loading} tip="Memuat jadwal OFF…">
                        {filteredEmployees.length === 0 ? (
                            <Empty description="Belum ada jadwal OFF pada bulan ini" />
                        ) : (
                            <Table
                                bordered
                                size="small"
                                rowKey="id"
                                dataSource={filteredEmployees}
                                columns={columns}
                                pagination={false}
                                scroll={{ x: 282 + range.days.length * 60, y: 620 }}
                                className="off-calendar-table"
                            />
                        )}
                    </Spin>
                </Card>

                <Modal
                    open={addOpen}
                    title={editingEmployee ? "Edit Jadwal OFF Karyawan" : "Add Karyawan OFF"}
                    onCancel={closeAddModal}
                    footer={null}
                    destroyOnClose
                    width={760}
                >
                    <Form form={addForm} layout="vertical" onFinish={submitAddOff} style={{ marginTop: 20 }}>
                        <Form.Item name="user_id" label="Karyawan" rules={[{ required: true, message: "Karyawan wajib dipilih" }]}>
                            <Select
                                showSearch
                                allowClear={!editingEmployee}
                                disabled={!!editingEmployee}
                                placeholder="Ketik minimal 2 huruf nama karyawan"
                                options={getSelectOptions(editingEmployee)}
                                filterOption={false}
                                onSearch={handleSearchEmployees}
                                onPopupScroll={handlePopupScrollEmployees}
                                loading={empLoading}
                                notFoundContent={empLoading ? <Spin size="small" /> : "Ketik minimal 2 huruf"}
                                onChange={handleEmployeeSelected}
                            />
                        </Form.Item>

                        <Form.Item name="weekdays" label={`Generate otomatis berdasarkan hari di bulan ${monthVal.format("MMMM YYYY")}`}>
                            <Checkbox.Group options={HARI_OPTIONS} onChange={onWeekdaysChange} />
                        </Form.Item>

                        <Form.Item
                            name="dates"
                            label="Tanggal OFF"
                            rules={[{ required: true, message: "Pilih minimal satu tanggal OFF" }]}
                        >
                            <Checkbox.Group
                                style={{ width: "100%" }}
                                value={selectedDates}
                                onChange={(dates) => {
                                    const sortedDates = [...dates].sort();

                                    setSelectedDates(sortedDates);
                                    setPreviewDates(sortedDates);

                                    addForm.setFieldsValue({
                                        dates: sortedDates
                                    });
                                }}
                            >
                                <div className="date-check-grid">
                                    {range.days.map((d) => {
                                        const dateKey = d.format("YYYY-MM-DD");
                                        const isWeekend = [0, 6].includes(d.day());

                                        return (
                                            <Checkbox
                                                key={dateKey}
                                                value={dateKey}
                                                className={isWeekend ? "date-check is-weekend" : "date-check"}
                                            >
                                                <div>
                                                    <b>{d.date()}</b>
                                                    <span>{NAMA_HARI_SHORT[d.day()]}</span>
                                                </div>
                                            </Checkbox>
                                        );
                                    })}
                                </div>
                            </Checkbox.Group>
                        </Form.Item>

                        <Form.Item label="Tanggal yang akan menjadi OFF">
                            <div className="preview-date-box">
                                {previewDates.length === 0 ? (
                                    <Text type="secondary">Belum ada tanggal terpilih</Text>
                                ) : (
                                    previewDates.map((date) => (
                                        <span key={date} className="preview-date-item">
                                            {dayjs(date).format("DD MMM")} ({NAMA_HARI_SHORT[dayjs(date).day()]})
                                        </span>
                                    ))
                                )}
                            </div>
                        </Form.Item>

                        <Form.Item name="reason" label="Keterangan">
                            <Input placeholder="Contoh: OFF Kalender" />
                        </Form.Item>

                        <Space>
                            <Button icon={<SaveOutlined />} type="primary" htmlType="submit" loading={modalBusy}>
                                Simpan
                            </Button>
                            <Button onClick={closeAddModal} disabled={modalBusy}>
                                Batal
                            </Button>
                        </Space>
                    </Form>
                </Modal>

                <Modal
                    open={swapOpen}
                    title="Swap OFF Antar Karyawan"
                    onCancel={closeSwapModal}
                    footer={null}
                    destroyOnClose
                    width={720}
                >
                    <Form form={swapForm} layout="vertical" onFinish={submitSwapOff} style={{ marginTop: 20 }}>
                        <Space.Compact style={{ width: "100%", gap: 12 }}>
                            <Form.Item name="employee_a" label="Karyawan A" rules={[{ required: true, message: "Karyawan A wajib dipilih" }]} style={{ width: "50%" }}>
                                <Select
                                    showSearch
                                    allowClear
                                    placeholder="Ketik nama karyawan A"
                                    options={getSelectOptions()}
                                    filterOption={false}
                                    onSearch={handleSearchEmployees}
                                    onPopupScroll={handlePopupScrollEmployees}
                                    loading={empLoading}
                                    notFoundContent={empLoading ? <Spin size="small" /> : "Ketik minimal 2 huruf"}
                                    onChange={(value) => handleSwapEmployeeSelected("employee_a", "off_date_a", value)}
                                />
                            </Form.Item>

                            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.employee_a !== curr.employee_a}>
                                {({ getFieldValue }) => (
                                    <Form.Item name="off_date_a" label="OFF Karyawan A" rules={[{ required: true, message: "Tanggal OFF A wajib dipilih" }]} style={{ width: "50%" }}>
                                        <Select
                                            placeholder="Pilih OFF A"
                                            options={getEmployeeOffDateOptions(getFieldValue("employee_a"))}
                                            disabled={!getFieldValue("employee_a")}
                                        />
                                    </Form.Item>
                                )}
                            </Form.Item>
                        </Space.Compact>

                        <Space.Compact style={{ width: "100%", gap: 12 }}>
                            <Form.Item name="employee_b" label="Karyawan B" rules={[{ required: true, message: "Karyawan B wajib dipilih" }]} style={{ width: "50%" }}>
                                <Select
                                    showSearch
                                    allowClear
                                    placeholder="Ketik nama karyawan B"
                                    options={getSelectOptions()}
                                    filterOption={false}
                                    onSearch={handleSearchEmployees}
                                    onPopupScroll={handlePopupScrollEmployees}
                                    loading={empLoading}
                                    notFoundContent={empLoading ? <Spin size="small" /> : "Ketik minimal 2 huruf"}
                                    onChange={(value) => handleSwapEmployeeSelected("employee_b", "off_date_b", value)}
                                />
                            </Form.Item>

                            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.employee_b !== curr.employee_b}>
                                {({ getFieldValue }) => (
                                    <Form.Item name="off_date_b" label="OFF Karyawan B" rules={[{ required: true, message: "Tanggal OFF B wajib dipilih" }]} style={{ width: "50%" }}>
                                        <Select
                                            placeholder="Pilih OFF B"
                                            options={getEmployeeOffDateOptions(getFieldValue("employee_b"))}
                                            disabled={!getFieldValue("employee_b")}
                                        />
                                    </Form.Item>
                                )}
                            </Form.Item>
                        </Space.Compact>

                        <Form.Item name="reason" label="Keterangan">
                            <Input.TextArea rows={2} placeholder="Contoh: Tukar OFF karena kebutuhan operasional" />
                        </Form.Item>

                        <Space>
                            <Button icon={<SwapOutlined />} type="primary" htmlType="submit" loading={modalBusy}>
                                Proses Swap
                            </Button>
                            <Button onClick={closeSwapModal} disabled={modalBusy}>
                                Batal
                            </Button>
                        </Space>
                    </Form>
                </Modal>

                <style>{`
          .calendar-title {
            font-weight: 700;
            font-size: 18px;
            margin-bottom: 12px;
            letter-spacing: .5px;
          }

          .off-calendar-table .ant-table-thead > tr > th {
            text-align: center !important;
            padding: 4px 2px !important;
            background: #fafafa;
            border-color: #2f2f2f33 !important;
          }

          .off-calendar-table .ant-table-tbody > tr > td {
            padding: 0 !important;
            height: 38px;
            border-color: #2f2f2f33 !important;
          }

          .off-calendar-table .ant-table-cell {
            vertical-align: middle;
          }

          .off-day-header {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            font-size: 12px;
            line-height: 1.1;
          }

          .weekend-day-name {
            color: #ff4d4f;
          }

          .off-cell {
            width: 100%;
            height: 38px;
            min-height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: .2px;
          }

          .off-cell.is-off {
            background: #f4b183;
            color: #3b1d00;
          }

          .off-cell.is-swap {
            background: #ff7875;
            color: #fff;
          }

          .off-cell.weekend-cell {
            background: #fafafa;
          }

          .preview-date-box {
            min-height: 42px;
            border: 1px solid #f0f0f0;
            border-radius: 8px;
            padding: 10px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            background: #fafafa;
          }

          .preview-date-item {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            background: #fff7e6;
            border: 1px solid #ffd591;
            padding: 4px 10px;
            font-size: 12px;
            color: #874d00;
          }

          .date-check-grid {
            display: grid;
            grid-template-columns: repeat(7, minmax(72px, 1fr));
            gap: 8px;
          }

          .date-check {
            margin-inline-start: 0 !important;
            border: 1px solid #f0f0f0;
            border-radius: 8px;
            padding: 8px;
            transition: .2s ease;
            background: #fff;
          }

          .date-check:hover {
            border-color: #1677ff;
            background: #e6f4ff;
          }

          .date-check.is-weekend {
            background: #fff1f0;
          }

          .date-check span:last-child > div {
            display: flex;
            flex-direction: column;
            line-height: 1.2;
          }

          .date-check span:last-child span {
            font-size: 11px;
            color: #8c8c8c;
          }
        `}</style>
            </>
        </ConfigProvider>
    );
}