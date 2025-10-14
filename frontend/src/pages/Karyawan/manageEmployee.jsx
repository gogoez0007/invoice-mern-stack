// src/pages/UserOnboarding.jsx
import React, { useEffect, useRef, useState } from "react";
import {
    Button, Card, Col, DatePicker, Form, Input, InputNumber,
    Modal, Popconfirm, Row, Select, Space, Spin, Table, Tabs, Tag, Typography, message, Tooltip, Checkbox
} from "antd";
import {
    PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
    IdcardOutlined, UserOutlined, KeyOutlined, SaveOutlined, UserAddOutlined
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import { API_BASE_URL } from "@/config/serverApiConfig";
import storePersist from "@/redux/storePersist";

const { Title, Text } = Typography;

function includeToken() {
    axios.defaults.baseURL = API_BASE_URL;
    axios.defaults.withCredentials = true;
    const auth = storePersist.get("auth");
    if (auth && auth.current && auth.current.token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${auth.current.token}`;
    } else {
        delete axios.defaults.headers.common["Authorization"];
    }
}

const PAGE_SIZE = 10;
const ENUM_GENDER = [{ value: "L", label: "Laki-laki" }, { value: "P", label: "Perempuan" }, { value: "Other", label: "Lainnya" }];
const ENUM_MARITAL = ["Single", "Married", "Divorced", "Widowed"].map(v => ({ value: v, label: v }));
const ENUM_BLOOD = ["A", "B", "AB", "O", "Unknown"].map(v => ({ value: v, label: v }));
const ENUM_RELIGION = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Lainnya"].map(v => ({ value: v, label: v }));
const ENUM_EMP_TYPE = ["PKWT", "PKWTT", "Intern", "Outsource", "Contractor"].map(v => ({ value: v, label: v }));
const ENUM_RELATION = ["Spouse", "Child", "Parent", "Sibling", "Relative", "Friend", "Other"].map(v => ({ value: v, label: v }));
const ENUM_DEP_REL = ["Spouse", "Child", "Parent", "Sibling", "Other"].map(v => ({ value: v, label: v }));
const ENUM_REASON = ["Hire", "Promotion", "Transfer", "Rotation", "Demotion", "Salary Change", "Org Change", "Correction", "Termination"].map(v => ({ value: v, label: v }));

// NEW: jenis kontrak untuk pengalaman kerja
const ENUM_EMPLOYMENT_TYPE = ["Full-time", "Part-time", "Contract", "Internship", "Freelance", "Other"].map(v => ({ value: v, label: v }));


// helper: "HH:mm:ss" -> "HH:mm"
const toHM = (s) => (typeof s === "string" ? s.slice(0, 5) : s || "");

// CSS khusus dropdown Select agar bisa 2 baris
const styles = `
                                .shift-select-scope .ant-select-item-option-content{
                                white-space: normal;           /* izinkan wrap */
                                line-height: 1.1;
                                }
                                .shift-opt{ line-height:1.1; }
                                .shift-opt .t{ font-weight:600; }
                                .shift-opt .s{ font-size:12px; opacity:.75; margin-top:2px; }

                                /* (opsional) kalau mau selected value juga boleh 2 baris:
                                .shift-select-scope .ant-select-single .ant-select-selector .ant-select-selection-item{
                                white-space: normal;
                                line-height: 1.1;
                                }
                                */
                                `;

export default function UserOnboarding() {
    // selector + add
    const [userId, setUserId] = useState(null);
    const [addingNew, setAddingNew] = useState(false);
    const [activeTab, setActiveTab] = useState("general");
    const mustSaveFirst = addingNew && !userId;

    const [empOpen, setEmpOpen] = useState(false);
    const [empOptions, setEmpOptions] = useState([]);
    const [empLoading, setEmpLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [hasMore, setHasMore] = useState(false);
    const pageRef = useRef(0);
    const totalRef = useRef(0);
    const debounceRef = useRef(null);

    // lookups
    const [shiftOpts, setShiftOpts] = useState([]);
    const [lokasiOpts, setLokasiOpts] = useState([]);
    const [entitasOpts, setEntitasOpts] = useState([]);

    // forms
    const [generalForm] = Form.useForm();
    const [personalForm] = Form.useForm();
    const [employmentForm] = Form.useForm();
    const [ecForm] = Form.useForm();
    const [depForm] = Form.useForm();
    const [eduForm] = Form.useForm();
    const [jaForm] = Form.useForm();
    const [expForm] = Form.useForm(); // NEW

    // tables/modals data
    const [ecRows, setEcRows] = useState([]);
    const [depRows, setDepRows] = useState([]);
    const [eduRows, setEduRows] = useState([]);
    const [jaRows, setJaRows] = useState([]);
    const [expRows, setExpRows] = useState([]); // NEW

    const [ecModalOpen, setEcModalOpen] = useState(false);
    const [depModalOpen, setDepModalOpen] = useState(false);
    const [eduModalOpen, setEduModalOpen] = useState(false);
    const [jaModalOpen, setJaModalOpen] = useState(false);
    const [expModalOpen, setExpModalOpen] = useState(false); // NEW

    const [ecEditing, setEcEditing] = useState(null);
    const [depEditing, setDepEditing] = useState(null);
    const [eduEditing, setEduEditing] = useState(null);
    const [jaEditing, setJaEditing] = useState(null);
    const [expEditing, setExpEditing] = useState(null); // NEW

    // credentials
    const [credBusy, setCredBusy] = useState(false);
    const [credNik, setCredNik] = useState("");
    const [generated, setGenerated] = useState(null);

    const [loadingAll, setLoadingAll] = useState(false);

    // helpers
    const upsertEmployeeOption = (id, name) => {
        if (!id) return;
        setEmpOptions(prev => {
            const rest = prev.filter(o => o.value !== id);
            return [{ value: id, label: name || `#${id}` }, ...rest];
        });
    };

    // employees remote search
    const fetchEmployees = async ({ page = 1, q = "" }, append = false) => {
        try {
            setEmpLoading(true);
            includeToken();
            const { data } = await axios.get("employees/list", {
                params: { page, items: 10, q, sortBy: "id", sortValue: "DESC" },
            });
            const list = Array.isArray(data?.result) ? data.result : [];
            const total = data?.pagination?.count || list.length || 0;
            const opts = list.map((e) => ({ value: e.id, label: e.name || `#${e.id}` }));
            setEmpOptions((prev) => (append ? [...prev, ...opts] : opts));
            totalRef.current = total;
            pageRef.current = page;
            setHasMore(page * 10 < total);
        } catch {
            message.error("Gagal memuat karyawan");
        } finally {
            setEmpLoading(false);
        }
    };

    const onSearchEmp = (val) => {
        setSearchText(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!val || !val.trim()) {
            setEmpOptions([]); setHasMore(false); pageRef.current = 0; totalRef.current = 0;
            return;
        }
        debounceRef.current = setTimeout(async () => {
            pageRef.current = 1;
            await fetchEmployees({ page: 1, q: val.trim() }, false);
        }, 400);
    };

    const onPopupScroll = async (e) => {
        if (!hasMore || empLoading || empOptions.length === 0) return;
        const el = e.target;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 32) {
            const next = pageRef.current + 1;
            if (next <= Math.ceil((totalRef.current || 0) / 10)) {
                await fetchEmployees({ page: next, q: searchText.trim() }, true);
            } else setHasMore(false);
        }
    };

    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    // lookups
    useEffect(() => {
        (async () => {
            try {
                includeToken();
                const [s, l, e] = await Promise.allSettled([
                    axios.get("shifts/list"),
                    axios.get("lokasi/list"),
                    axios.get("entitas"),
                ]);

                if (s.status === "fulfilled") {
                    const list = (s.value.data?.result || s.value.data || []);
                    const arr = list.map(r => {
                        const name = r.name || r.nama || `Shift #${r.id}`;
                        const time = (r.start_time && r.end_time) ? `${toHM(r.start_time)}–${toHM(r.end_time)}` : "—";
                        const tol = r.tolerance_start_time ? ` • Tol: ${toHM(r.tolerance_start_time)}` : "";
                        return {
                            value: r.id,
                            // simpan raw untuk pencarian
                            rawLabel: name,
                            rawTime: time,
                            // label 2 baris (ReactNode)
                            label: (
                                <div className="shift-opt">
                                    <div className="t">{name}</div>
                                    <div className="s">Jam: {time}</div>
                                </div>
                            ),
                        };
                    });
                    setShiftOpts(arr);
                }

                if (l.status === "fulfilled") {
                    const arr = (l.value.data?.result || l.value.data || []).map(r => ({ value: r.id, label: r.name || r.nama || `Lokasi #${r.id}` }));
                    setLokasiOpts(arr);
                }
                if (e.status === "fulfilled") {
                    const arr = (e.value.data?.result || e.value.data || []).map(r => ({ value: r.id, label: r.name || r.nama || `Entitas #${r.id}` }));
                    setEntitasOpts(arr);
                }
            } catch { }
        })();
    }, []);

    // fetchers
    const fetchGeneral = async (uid) => {
        if (!uid) { generalForm.resetFields(); return; }
        try {
            includeToken();
            const { data } = await axios.get(`/employees/${uid}`);
            const u = data?.result || data;
            generalForm.setFieldsValue({
                name: u?.name || "",
                department: u?.department || "",
                position: u?.position || "",
                phone: u?.phone || "",
                shift_id: u?.shift_id || u?.shift || null,
                location_id: u?.location_id || u?.lokasi || null,
                entitas_id: u?.entitas_id || u?.entitas || null,
            });
        } catch {
            generalForm.resetFields();
        }
    };

    const fetchAll = async (uid) => {
        if (!uid) return;
        try {
            setLoadingAll(true);
            includeToken();

            await fetchGeneral(uid);

            // personal
            try {
                const { data } = await axios.get(`/users/${uid}/personal`);
                personalForm.setFieldsValue({
                    ...data.result,
                    date_of_birth: data.result && data.result.date_of_birth ? dayjs(data.result.date_of_birth) : null,
                });
            } catch { personalForm.resetFields(); }

            // employment
            try {
                const { data } = await axios.get(`/users/${uid}/employment`);
                employmentForm.setFieldsValue({
                    ...data.result,
                    start_date: data.result && data.result.start_date ? dayjs(data.result.start_date) : null,
                    probation_end_date: data.result && data.result.probation_end_date ? dayjs(data.result.probation_end_date) : null,
                    contract_end_date: data.result && data.result.contract_end_date ? dayjs(data.result.contract_end_date) : null,
                });
            } catch { employmentForm.resetFields(); }

            // emergency
            try { const { data } = await axios.get(`/users/${uid}/emergency-contacts`); setEcRows(data.result || []); } catch { setEcRows([]); }
            // dependents
            try { const { data } = await axios.get(`/users/${uid}/dependents`); setDepRows(data.result || []); } catch { setDepRows([]); }
            // education
            try { const { data } = await axios.get(`/users/${uid}/education`); setEduRows(data.result || []); } catch { setEduRows([]); }
            // assignments
            try { const { data } = await axios.get(`/users/${uid}/job-assignments`); setJaRows(data.result || []); } catch { setJaRows([]); }
            // experiences (NEW)
            try { const { data } = await axios.get(`/users/${uid}/work-experiences`); setExpRows(data.result || []); } catch { setExpRows([]); }

            setGenerated(null);
        } finally {
            setLoadingAll(false);
        }
    };

    useEffect(() => {
        if (userId) {
            setAddingNew(false);
            setActiveTab("general");
            fetchAll(userId);
        } else {
            personalForm.resetFields();
            employmentForm.resetFields();
            setEcRows([]); setDepRows([]); setEduRows([]); setJaRows([]); setExpRows([]);
        }
    }, [userId]);

    // actions
    const startAddEmployee = () => {
        setAddingNew(true);
        setUserId(null);
        setActiveTab("general");
        generalForm.resetFields();
        message.info("Isi & simpan Informasi Umum terlebih dulu.");
    };

    const saveGeneral = async (vals) => {
        try {
            includeToken();
            const payload = {
                name: vals.name ? vals.name.trim() : "",
                department: vals.department || null,
                position: vals.position || null,
                phone: vals.phone || null,
                shift: vals.shift_id || null,
                lokasi: vals.location_id || null,
                entitas: vals.entitas_id || null,
            };

            if (userId) {
                await axios.put(`/employees/${userId}`, payload);
                upsertEmployeeOption(userId, payload.name);
                setUserId(userId);
                message.success("Informasi Umum diupdate");
                await fetchGeneral(userId);
            } else {
                const { data } = await axios.post(`/employees/create`, payload);
                let newId = (data && data.result && data.result.id) || data.id || data.insertId || null;
                const newName = (data && data.result && data.result.name) || payload.name;

                if (!newId) {
                    try {
                        const sr = await axios.get("employees/list", {
                            params: { page: 1, items: 1, q: newName, sortBy: "id", sortValue: "DESC" },
                        });
                        const cand = Array.isArray(sr?.data?.result) ? sr.data.result[0] : null;
                        if (cand && cand.id) newId = cand.id;
                    } catch { }
                }

                if (newId) {
                    upsertEmployeeOption(newId, newName);
                    setUserId(newId);
                    setAddingNew(false);
                    setActiveTab("general");
                    setEmpOpen(false);
                    setSearchText("");
                    message.success("Karyawan baru dibuat & dipilih.");
                } else {
                    message.warning("Karyawan dibuat, tapi ID tidak terdeteksi. Silakan cari dari Select Karyawan.");
                }
            }
        } catch (e) {
            message.error((e && e.response && e.response.data && e.response.data.message) || "Gagal menyimpan Informasi Umum");
        }
    };

    const savePersonal = async (vals) => {
        if (!userId) return;
        try {
            includeToken();
            const payload = {
                ...vals,
                date_of_birth: vals.date_of_birth ? dayjs(vals.date_of_birth).format("YYYY-MM-DD") : null,
            };
            await axios.post(`/users/${userId}/personal`, payload);
            message.success("Personal profile disimpan");
            fetchAll(userId);
        } catch {
            message.error("Gagal simpan personal profile");
        }
    };

    const saveEmployment = async (vals) => {
        if (!userId) return;
        try {
            includeToken();
            const payload = {
                ...vals,
                start_date: vals.start_date ? dayjs(vals.start_date).format("YYYY-MM-DD") : null,
                probation_end_date: vals.probation_end_date ? dayjs(vals.probation_end_date).format("YYYY-MM-DD") : null,
                contract_end_date: vals.contract_end_date ? dayjs(vals.contract_end_date).format("YYYY-MM-DD") : null,
            };
            await axios.post(`/users/${userId}/employment`, payload);
            message.success("Employment disimpan");
            fetchAll(userId);
        } catch {
            message.error("Gagal simpan employment");
        }
    };

    // Emergency
    const openEcModal = (row) => { setEcEditing(row || null); setEcModalOpen(true); if (row) ecForm.setFieldsValue(row); else ecForm.resetFields(); };
    const submitEc = async () => {
        try {
            const vals = await ecForm.validateFields();
            includeToken();
            if (ecEditing) {
                await axios.put(`/emergency-contacts/${ecEditing.id}`, vals);
                message.success("Emergency contact diupdate");
            } else {
                await axios.post(`/users/${userId}/emergency-contacts`, vals);
                message.success("Emergency contact dibuat");
            }
            setEcModalOpen(false); fetchAll(userId);
        } catch (e) {
            if (e && e.errorFields) return;
            message.error("Gagal simpan emergency contact");
        }
    };
    const deleteEc = async (row) => {
        try { includeToken(); await axios.delete(`/emergency-contacts/${row.id}`); message.success("Emergency contact dihapus"); fetchAll(userId); }
        catch { message.error("Gagal hapus emergency contact"); }
    };

    // Dependents
    const openDepModal = (row) => {
        setDepEditing(row || null);
        setDepModalOpen(true);
        if (row) {
            depForm.setFieldsValue({
                ...row,
                date_of_birth: row.date_of_birth ? dayjs(row.date_of_birth) : null, // ✅ convert ke dayjs
                tax_dependent: !!row.tax_dependent,   // kalau backend kirim 0/1
                bpjs_dependent: !!row.bpjs_dependent, // kalau backend kirim 0/1
            });
        } else {
            depForm.resetFields();
        }
    };
    const submitDep = async () => {
        try {
            const vals = await depForm.validateFields();
            includeToken();
            const body = {
                ...vals,
                date_of_birth: vals.date_of_birth ? dayjs(vals.date_of_birth).format("YYYY-MM-DD") : null, // ✅ format ke string
                tax_dependent: vals.tax_dependent ? 1 : 0,
                bpjs_dependent: vals.bpjs_dependent ? 1 : 0,
            };
            if (depEditing) {
                await axios.put(`/dependents/${depEditing.id}`, body);
                message.success("Dependent diupdate");
            } else {
                await axios.post(`/users/${userId}/dependents`, body);
                message.success("Dependent dibuat");
            }
            setDepModalOpen(false);
            fetchAll(userId);
        } catch (e) {
            if (e && e.errorFields) return;
            message.error("Gagal simpan dependent");
        }
    };
    const deleteDep = async (row) => {
        try { includeToken(); await axios.delete(`/dependents/${row.id}`); message.success("Dependent dihapus"); fetchAll(userId); }
        catch { message.error("Gagal hapus dependent"); }
    };

    // Education
    const openEduModal = (row) => {
        setEduEditing(row || null); setEduModalOpen(true);
        if (row) {
            eduForm.setFieldsValue({
                ...row,
                start_date: row.start_date ? dayjs(row.start_date) : null,
                end_date: row.end_date ? dayjs(row.end_date) : null,
            });
        } else eduForm.resetFields();
    };
    const submitEdu = async () => {
        try {
            const vals = await eduForm.validateFields();
            includeToken();
            const payload = {
                ...vals,
                start_date: vals.start_date ? dayjs(vals.start_date).format("YYYY-MM-DD") : null,
                end_date: vals.end_date ? dayjs(vals.end_date).format("YYYY-MM-DD") : null,
            };
            if (eduEditing) { await axios.put(`/education/${eduEditing.id}`, payload); message.success("Riwayat pendidikan diupdate"); }
            else { await axios.post(`/users/${userId}/education`, payload); message.success("Riwayat pendidikan dibuat"); }
            setEduModalOpen(false); fetchAll(userId);
        } catch (e) {
            if (e && e.errorFields) return;
            message.error("Gagal simpan pendidikan");
        }
    };
    const deleteEdu = async (row) => {
        try { includeToken(); await axios.delete(`/education/${row.id}`); message.success("Riwayat pendidikan dihapus"); fetchAll(userId); }
        catch { message.error("Gagal hapus riwayat pendidikan"); }
    };

    // Job Assignments
    const openJaModal = (row) => {
        setJaEditing(row || null); setJaModalOpen(true);
        if (row) {
            jaForm.setFieldsValue({
                ...row,
                effective_start: row.effective_start ? dayjs(row.effective_start) : null,
                effective_end: row.effective_end ? dayjs(row.effective_end) : null,
            });
        } else jaForm.resetFields();
    };
    const submitJa = async () => {
        try {
            const vals = await jaForm.validateFields();
            includeToken();
            const payload = {
                ...vals,
                effective_start: vals.effective_start ? dayjs(vals.effective_start).format("YYYY-MM-DD") : null,
                effective_end: vals.effective_end ? dayjs(vals.effective_end).format("YYYY-MM-DD") : null,
            };
            if (jaEditing) { await axios.put(`/job-assignments/${jaEditing.id}`, payload); message.success("Riwayat jabatan diupdate"); }
            else { await axios.post(`/users/${userId}/job-assignments`, payload); message.success("Riwayat jabatan dibuat"); }
            setJaModalOpen(false); fetchAll(userId);
        } catch (e) {
            if (e && e.response && e.response.status === 409) message.error("Periode tumpang tindih dengan assignment lain");
            else message.error("Gagal simpan riwayat jabatan");
        }
    };
    const deleteJa = async (row) => {
        try { includeToken(); await axios.delete(`/job-assignments/${row.id}`); message.success("Riwayat jabatan dihapus"); fetchAll(userId); }
        catch { message.error("Gagal hapus riwayat jabatan"); }
    };

    // Work Experiences (NEW)
    const openExpModal = (row) => {
        setExpEditing(row || null);
        setExpModalOpen(true);
        if (row) {
            expForm.setFieldsValue({
                ...row,
                start_date: row.start_date ? dayjs(row.start_date) : null,
                end_date: row.end_date ? dayjs(row.end_date) : null,
            });
        } else {
            expForm.resetFields();
        }
    };

    const submitExp = async () => {
        try {
            const vals = await expForm.validateFields();
            includeToken();
            const payload = {
                ...vals,
                start_date: vals.start_date ? dayjs(vals.start_date).format("YYYY-MM-DD") : null,
                end_date: vals.end_date ? dayjs(vals.end_date).format("YYYY-MM-DD") : null,
            };
            if (expEditing) {
                await axios.put(`/work-experiences/${expEditing.id}`, payload);
                message.success("Pengalaman kerja diupdate");
            } else {
                await axios.post(`/users/${userId}/work-experiences`, payload);
                message.success("Pengalaman kerja dibuat");
            }
            setExpModalOpen(false);
            fetchAll(userId);
        } catch (e) {
            if (e && e.errorFields) return; // validasi form
            message.error("Gagal simpan pengalaman kerja");
        }
    };

    const deleteExp = async (row) => {
        try {
            includeToken();
            await axios.delete(`/work-experiences/${row.id}`);
            message.success("Pengalaman kerja dihapus");
            fetchAll(userId);
        } catch {
            message.error("Gagal hapus pengalaman kerja");
        }
    };

    // credentials
    const generateCredentials = async () => {
        if (!userId) return;
        try {
            setCredBusy(true);
            includeToken();
            const body = credNik && credNik.trim() ? { nik_ktp: credNik.trim() } : {};
            const { data } = await axios.post(`/users/${userId}/generate-credentials`, body);
            setGenerated(data.result);
            message.success("Username & password berhasil dibuat");
        } catch {
            setGenerated(null);
            message.error("Gagal generate credentials");
        } finally {
            setCredBusy(false);
        }
    };

    // columns
    const ecCols = [
        { title: "Nama", dataIndex: "name" },
        { title: "Hubungan", dataIndex: "relationship" },
        { title: "Telepon", dataIndex: "phone" },
        { title: "Telepon Alternatif", dataIndex: "alt_phone" },
        {
            title: "Aksi",
            width: 160,
            render: (_, r) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEcModal(r)}>Edit</Button>
                    <Popconfirm title="Hapus kontak darurat ini?" onConfirm={() => deleteEc(r)}>
                        <Button size="small" danger icon={<DeleteOutlined />}>Hapus</Button>
                    </Popconfirm>
                </Space>
            )
        },
    ];
    const depCols = [
        { title: "Nama", dataIndex: "name" },
        { title: "Hubungan", dataIndex: "relationship" },
        { title: "NIK", dataIndex: "nik_ktp" },
        { title: "Tanggal Lahir", dataIndex: "date_of_birth", render: (v) => (v ? dayjs(v).format("YYYY-MM-DD") : "—") },
        { title: "PTKP", dataIndex: "tax_dependent", render: (v) => (v ? <Tag color="green">Ya</Tag> : <Tag>—</Tag>) },
        { title: "BPJS", dataIndex: "bpjs_dependent", render: (v) => (v ? <Tag color="blue">Ya</Tag> : <Tag>—</Tag>) },
        {
            title: "Aksi",
            width: 160,
            render: (_, r) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openDepModal(r)}>Edit</Button>
                    <Popconfirm title="Hapus tanggungan ini?" onConfirm={() => deleteDep(r)}>
                        <Button size="small" danger icon={<DeleteOutlined />}>Hapus</Button>
                    </Popconfirm>
                </Space>
            )
        },
    ];
    const eduCols = [
        { title: "Jenjang", dataIndex: "level" },
        { title: "Institusi", dataIndex: "institution" },
        { title: "Jurusan", dataIndex: "major" },
        { title: "Mulai", dataIndex: "start_date", render: (v) => (v ? dayjs(v).format("YYYY-MM-DD") : "—") },
        { title: "Selesai", dataIndex: "end_date", render: (v) => (v ? dayjs(v).format("YYYY-MM-DD") : <Tag color="geekblue">Masih aktif</Tag>) },
        { title: "Tahun Lulus", dataIndex: "graduation_year" },
        { title: "IPK", dataIndex: "gpa" },
        {
            title: "Aksi",
            width: 160,
            render: (_, r) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEduModal(r)}>Edit</Button>
                    <Popconfirm title="Hapus riwayat pendidikan ini?" onConfirm={() => deleteEdu(r)}>
                        <Button size="small" danger icon={<DeleteOutlined />}>Hapus</Button>
                    </Popconfirm>
                </Space>
            )
        },
    ];
    const jaCols = [
        { title: "Mulai", dataIndex: "effective_start", render: (v) => dayjs(v).format("YYYY-MM-DD") },
        { title: "Selesai", dataIndex: "effective_end", render: (v) => (v ? dayjs(v).format("YYYY-MM-DD") : <Tag color="green">Aktif</Tag>) },
        { title: "Alasan", dataIndex: "change_reason" },
        { title: "Departemen", dataIndex: "department" },
        { title: "Posisi", dataIndex: "position" },
        { title: "Level", dataIndex: "job_level" },
        { title: "Grade", dataIndex: "grade" },
        { title: "Cost Center", dataIndex: "cost_center" },
        {
            title: "Aksi",
            width: 160,
            render: (_, r) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openJaModal(r)}>Edit</Button>
                    <Popconfirm title="Hapus assignment ini?" onConfirm={() => deleteJa(r)}>
                        <Button size="small" danger icon={<DeleteOutlined />}>Hapus</Button>
                    </Popconfirm>
                </Space>
            )
        },
    ];
    // NEW: work experiences columns
    const expCols = [
        { title: "Perusahaan", dataIndex: "company_name" },
        { title: "Jabatan", dataIndex: "position_title" },
        { title: "Jenis", dataIndex: "employment_type" },
        { title: "Mulai", dataIndex: "start_date", render: (v) => (v ? dayjs(v).format("YYYY-MM-DD") : "—") },
        { title: "Selesai", dataIndex: "end_date", render: (v) => (v ? dayjs(v).format("YYYY-MM-DD") : <Tag>Masih aktif</Tag>) },
        { title: "Lokasi", dataIndex: "location" },
        { title: "Gaji Terakhir", dataIndex: "last_salary", render: (v) => (v == null ? "—" : new Intl.NumberFormat('id-ID').format(v)) },
        { title: "Alasan Keluar", dataIndex: "reason_for_leaving", ellipsis: true },
        {
            title: "Aksi",
            width: 160,
            render: (_, r) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openExpModal(r)}>Edit</Button>
                    <Popconfirm title="Hapus pengalaman kerja ini?" onConfirm={() => deleteExp(r)}>
                        <Button size="small" danger icon={<DeleteOutlined />}>Hapus</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            {/* Header */}
            <Card
                style={{ marginBottom: 16, borderRadius: 16, background: "linear-gradient(135deg, #3b82f6 0%, #10b981 50%, #f97316 100%)", color: "#fff" }}
                bodyStyle={{ padding: 18 }}
            >
                <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <Space>
                        <IdcardOutlined />
                        <Title level={4} style={{ margin: 0, color: "#fff" }}>User Onboarding — Data HR</Title>
                    </Space>
                    <Button
                        ghost icon={<ReloadOutlined />}
                        onClick={() => {
                            setUserId(null);
                            setEmpOptions([]); setSearchText(""); setHasMore(false); pageRef.current = 0; totalRef.current = 0;
                            personalForm.resetFields(); employmentForm.resetFields();
                            setEcRows([]); setDepRows([]); setEduRows([]); setJaRows([]); setExpRows([]);
                            setGenerated(null); setCredNik("");
                            setAddingNew(false); setActiveTab("general"); generalForm.resetFields();
                        }}
                        style={{ borderColor: "#fff", color: "#fff" }}
                    >
                        Reset
                    </Button>
                </Space>
            </Card>

            {/* Selector */}
            <Card style={{ borderRadius: 14, marginBottom: 12 }}>
                <Space align="start" size={8} wrap>
                    <div>
                        <Text strong><UserOutlined /> Pilih Karyawan</Text>
                        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                            <Select
                                showSearch allowClear placeholder="Ketik untuk mencari…"
                                value={userId}
                                onChange={(v) => { setUserId(v || null); setActiveTab("general"); }}
                                style={{ width: 360 }}
                                filterOption={false}
                                onSearch={onSearchEmp}
                                onDropdownVisibleChange={(v) => setEmpOpen(v)}
                                open={empOpen}
                                onPopupScroll={onPopupScroll}
                                options={empOptions}
                                loading={empLoading}
                            />
                            <Tooltip title="Tambah karyawan baru (simpan dulu sebelum lanjut)">
                                <Button type="primary" icon={<UserAddOutlined />} onClick={startAddEmployee}>
                                    Tambah Karyawan
                                </Button>
                            </Tooltip>
                            <Button onClick={() => fetchEmployees({ page: 1, q: searchText.trim() }, false)}>Refresh</Button>
                        </div>
                    </div>
                </Space>
            </Card>

            {/* Tabs */}
            <Card style={{ borderRadius: 14 }}>
                <Tabs
                    activeKey={activeTab}
                    onChange={(k) => {
                        if (k !== "general" && !userId) {
                            message.warning("Simpan Informasi Umum terlebih dulu.");
                            setActiveTab("general");
                            return;
                        }
                        setActiveTab(k);
                    }}
                    items={[
                        {
                            key: "general",
                            label: "Informasi Umum",
                            children: (
                                <Form form={generalForm} layout="vertical" onFinish={saveGeneral}>
                                    <Row gutter={16}>
                                        <Col xs={24} md={12}><Form.Item name="name" label="Nama Lengkap" rules={[{ required: true }]}><Input /></Form.Item></Col>
                                        <Col xs={24} md={12}><Form.Item name="phone" label="No. Telepon"><Input maxLength={20} /></Form.Item></Col>
                                        <Col xs={24} md={8}><Form.Item name="department" label="Departemen"><Input /></Form.Item></Col>
                                        <Col xs={24} md={8}><Form.Item name="position" label="Posisi"><Input /></Form.Item></Col>
                                        <Col xs={24} md={8}>
                                            <div className="shift-select-scope">
                                                <style>{styles}</style>
                                                <Form.Item name="shift_id" label="Shift">
                                                    <Select
                                                        allowClear
                                                        showSearch
                                                        options={shiftOpts}
                                                        popupClassName="shift-select-scope"   // penting: apply CSS ke dropdown portal
                                                        filterOption={(input, opt) => {
                                                            const a = opt?.rawLabel?.toLowerCase() || "";
                                                            const b = opt?.rawTime?.toLowerCase() || "";
                                                            const q = input.toLowerCase();
                                                            return a.includes(q) || b.includes(q);
                                                        }}
                                                    />
                                                </Form.Item>
                                            </div>


                                        </Col>
                                        <Col xs={24} md={8}><Form.Item name="location_id" label="Lokasi"><Select allowClear options={lokasiOpts} /></Form.Item></Col>
                                        <Col xs={24} md={8}><Form.Item name="entitas_id" label="Entitas"><Select allowClear options={entitasOpts} /></Form.Item></Col>
                                    </Row>
                                    <Space>
                                        <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
                                            {userId ? "Update Informasi" : "Simpan (Buat Karyawan)"}
                                        </Button>
                                        {/* {userId ? <Tag color="geekblue">ID: {userId}</Tag> : (mustSaveFirst ? <Tag color="orange">Simpan dulu untuk buka tab lain</Tag> : null)} */}
                                    </Space>
                                </Form>
                            )
                        },
                        {
                            key: "personal",
                            label: "Identitas Pribadi",
                            children: (
                                <Form form={personalForm} layout="vertical" onFinish={savePersonal} disabled={!userId}>
                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item name="nik_ktp" label="NIK KTP" rules={[{ required: true }, { pattern: /^\d{16}$/, message: "Harus 16 digit angka" }]}>
                                                <Input maxLength={16} />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}><Form.Item name="personal_email" label="Email Pribadi"><Input type="email" /></Form.Item></Col>
                                        <Col xs={24} md={8}><Form.Item name="place_of_birth" label="Tempat Lahir" rules={[{ required: true }]}><Input /></Form.Item></Col>
                                        <Col xs={24} md={8}><Form.Item name="date_of_birth" label="Tanggal Lahir" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" /></Form.Item></Col>
                                        <Col xs={24} md={8}><Form.Item name="gender" label="Jenis Kelamin" rules={[{ required: true }]}><Select options={ENUM_GENDER} /></Form.Item></Col>
                                        <Col xs={24} md={8}><Form.Item name="marital_status" label="Status Perkawinan" rules={[{ required: true }]}><Select options={ENUM_MARITAL} /></Form.Item></Col>
                                        <Col xs={24} md={8}><Form.Item name="nationality" label="Kewarganegaraan" initialValue="Indonesia"><Input /></Form.Item></Col>
                                        <Col xs={24} md={8}><Form.Item name="blood_type" label="Golongan Darah" initialValue="Unknown"><Select options={ENUM_BLOOD} /></Form.Item></Col>
                                        <Col xs={24} md={8}><Form.Item name="religion" label="Agama"><Select allowClear options={ENUM_RELIGION} /></Form.Item></Col>
                                        <Col xs={24}><Form.Item name="address_ktp" label="Alamat KTP" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item></Col>
                                        <Col xs={24}><Form.Item name="address_domisili" label="Alamat Domisili" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item></Col>
                                    </Row>
                                    <Button type="primary" icon={<SaveOutlined />} htmlType="submit" disabled={!userId}>Simpan Identitas</Button>
                                </Form>
                            )
                        },
                        {
                            key: "employment",
                            label: "Kepegawaian",
                            children: (
                                <Form form={employmentForm} layout="vertical" onFinish={saveEmployment} disabled={!userId}>
                                    <Row gutter={16}>
                                        {/* <Col xs={24} md={8}><Form.Item name="employee_no" label="NIK Internal" rules={[{ required: true }]}><Input /></Form.Item></Col> */}
                                        <Col xs={24} md={8}><Form.Item name="employment_type" label="Jenis Hubungan Kerja" rules={[{ required: true }]}><Select options={ENUM_EMP_TYPE} /></Form.Item></Col>
                                        <Col xs={24} md={8}><Form.Item name="start_date" label="Tanggal Mulai" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" /></Form.Item></Col>
                                        <Col xs={24} md={8}><Form.Item name="probation_end_date" label="Akhir Probation"><DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" /></Form.Item></Col>
                                        {/* <Col xs={24} md={8}><Form.Item name="manager_user_id" label="Atasan (User ID)"><InputNumber style={{ width: "100%" }} min={1} /></Form.Item></Col> */}
                                        {/* <Col xs={24} md={8}><Form.Item name="work_location" label="Lokasi Kerja"><Input /></Form.Item></Col> */}
                                        {/* <Col xs={24} md={8}><Form.Item name="job_level" label="Level"><Input /></Form.Item></Col> */}
                                        {/* <Col xs={24} md={8}><Form.Item name="grade" label="Grade"><Input /></Form.Item></Col>
                                        <Col xs={24} md={8}><Form.Item name="cost_center" label="Cost Center"><Input /></Form.Item></Col> */}
                                        <Col xs={24} md={8}><Form.Item name="contract_end_date" label="Akhir Kontrak (PKWT)"><DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" /></Form.Item></Col>
                                    </Row>
                                    <Button type="primary" icon={<SaveOutlined />} htmlType="submit" disabled={!userId}>Simpan Employment</Button>
                                </Form>
                            )
                        },
                        {
                            key: "emergency",
                            label: "Kontak Darurat",
                            children: (
                                <>
                                    <Space style={{ marginBottom: 12 }}>
                                        <Button type="primary" icon={<PlusOutlined />} disabled={!userId} onClick={() => { setEcEditing(null); setEcModalOpen(true); ecForm.resetFields(); }}>
                                            Tambah Kontak
                                        </Button>
                                    </Space>
                                    <Table rowKey="id" columns={ecCols} dataSource={ecRows} pagination={{ pageSize: PAGE_SIZE }} size="middle" />
                                </>
                            )
                        },
                        {
                            key: "dependents",
                            label: "Tanggungan",
                            children: (
                                <>
                                    <Space style={{ marginBottom: 12 }}>
                                        <Button type="primary" icon={<PlusOutlined />} disabled={!userId} onClick={() => { setDepEditing(null); setDepModalOpen(true); depForm.resetFields(); }}>
                                            Tambah Tanggungan
                                        </Button>
                                    </Space>
                                    <Table rowKey="id" columns={depCols} dataSource={depRows} pagination={{ pageSize: PAGE_SIZE }} size="middle" />
                                </>
                            )
                        },
                        {
                            key: "education",
                            label: "Riwayat Pendidikan",
                            children: (
                                <>
                                    <Space style={{ marginBottom: 12 }}>
                                        <Button type="primary" icon={<PlusOutlined />} disabled={!userId} onClick={() => { setEduEditing(null); setEduModalOpen(true); eduForm.resetFields(); }}>
                                            Tambah Pendidikan
                                        </Button>
                                    </Space>
                                    <Table rowKey="id" columns={eduCols} dataSource={eduRows} pagination={{ pageSize: PAGE_SIZE }} size="middle" />
                                </>
                            )
                        },
                        // NEW: Pengalaman Kerja
                        {
                            key: "experiences",
                            label: "Pengalaman Kerja",
                            children: (
                                <>
                                    <Space style={{ marginBottom: 12 }}>
                                        <Button type="primary" icon={<PlusOutlined />} disabled={!userId} onClick={() => { setExpEditing(null); setExpModalOpen(true); expForm.resetFields(); }}>
                                            Tambah Pengalaman
                                        </Button>
                                    </Space>
                                    <Table rowKey="id" columns={expCols} dataSource={expRows} pagination={{ pageSize: PAGE_SIZE }} size="middle" />
                                </>
                            )
                        },
                        {
                            key: "assignments",
                            label: "Riwayat Jabatan",
                            children: (
                                <>
                                    <Space style={{ marginBottom: 12 }}>
                                        <Button type="primary" icon={<PlusOutlined />} disabled={!userId} onClick={() => { setJaEditing(null); setJaModalOpen(true); jaForm.resetFields(); }}>
                                            Tambah Assignment
                                        </Button>
                                    </Space>
                                    <Table rowKey="id" columns={jaCols} dataSource={jaRows} pagination={{ pageSize: PAGE_SIZE }} size="middle" />
                                </>
                            )
                        },
                        {
                            key: "credentials",
                            label: "Credentials",
                            children: (
                                <Space direction="vertical" size={12}>
                                    <Text>Aturan: username = nama depan + 4 digit pertama NIK (unik). Password = digit 7–12 NIK.</Text>
                                    <Input placeholder="Opsional: NIK override" style={{ width: 360 }} maxLength={32} value={credNik} onChange={(e) => setCredNik(e.target.value)} />
                                    <Space>
                                        <Button type="primary" icon={<KeyOutlined />} disabled={!userId} loading={credBusy} onClick={generateCredentials}>
                                            Generate Username & Password
                                        </Button>
                                        {generated ? <Tag color="green">username: <b>{generated.username}</b> — password: <b>{generated.password}</b></Tag> : null}
                                    </Space>
                                </Space>
                            )
                        },
                    ]}
                />
                {loadingAll ? <div style={{ textAlign: "center", padding: 12 }}><Spin /></div> : null}
            </Card>

            {/* Modals */}
            <Modal
                open={ecModalOpen} onCancel={() => setEcModalOpen(false)}
                title={ecEditing ? "Edit Kontak Darurat" : "Tambah Kontak Darurat"}
                onOk={async () => { if (!userId) { message.warning("Simpan Informasi Umum dulu."); return; } await submitEc(); }}
                okText="Simpan" destroyOnClose
            >
                <Form form={ecForm} layout="vertical" preserve={false}>
                    <Form.Item name="name" label="Nama" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="relationship" label="Hubungan" rules={[{ required: true }]}><Select options={ENUM_RELATION} /></Form.Item>
                    <Form.Item name="phone" label="Telepon" rules={[{ required: true }]}><Input maxLength={20} /></Form.Item>
                    <Form.Item name="alt_phone" label="Telepon Alternatif"><Input maxLength={20} /></Form.Item>
                    <Form.Item name="address" label="Alamat"><Input /></Form.Item>
                </Form>
            </Modal>

            <Modal
                open={depModalOpen} onCancel={() => setDepModalOpen(false)}
                title={depEditing ? "Edit Tanggungan" : "Tambah Tanggungan"}
                onOk={async () => { if (!userId) { message.warning("Simpan Informasi Umum dulu."); return; } await submitDep(); }}
                okText="Simpan" destroyOnClose
            >
                <Form form={depForm} layout="vertical" preserve={false}>
                    <Form.Item name="name" label="Nama" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="relationship" label="Hubungan" rules={[{ required: true }]}><Select options={ENUM_DEP_REL} /></Form.Item>
                    <Form.Item name="nik_ktp" label="NIK (opsional)" rules={[{ pattern: /^\d{16}$/, message: "Harus 16 digit angka", warningOnly: true }]}><Input maxLength={16} /></Form.Item>
                    <Form.Item name="date_of_birth" label="Tanggal Lahir"><DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" /></Form.Item>
                    <Form.Item name="tax_dependent" label="Masuk PTKP" valuePropName="checked"><Checkbox>PTKP</Checkbox></Form.Item>
                    <Form.Item name="bpjs_dependent" label="Didaftarkan BPJS" valuePropName="checked"><Checkbox>BPJS</Checkbox></Form.Item>
                </Form>
            </Modal>

            <Modal
                open={eduModalOpen} onCancel={() => setEduModalOpen(false)}
                title={eduEditing ? "Edit Riwayat Pendidikan" : "Tambah Riwayat Pendidikan"}
                onOk={async () => { if (!userId) { message.warning("Simpan Informasi Umum dulu."); return; } await submitEdu(); }}
                okText="Simpan" destroyOnClose
            >
                <Form form={eduForm} layout="vertical" preserve={false}>
                    <Form.Item name="level" label="Jenjang" rules={[{ required: true }]}>
                        <Select options={["SD", "SMP", "SMA/SMK", "Diploma", "S1", "S2", "S3", "Lainnya"].map(v => ({ value: v, label: v }))} />
                    </Form.Item>
                    <Form.Item name="institution" label="Institusi" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="major" label="Jurusan"><Input /></Form.Item>
                    <Row gutter={12}>
                        <Col span={12}><Form.Item name="start_date" label="Mulai"><DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="end_date" label="Selesai"><DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" /></Form.Item></Col>
                    </Row>
                    <Row gutter={12}>
                        <Col span={12}><Form.Item name="graduation_year" label="Tahun Lulus"><InputNumber style={{ width: "100%" }} min={1900} max={2999} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="gpa" label="IPK"><InputNumber style={{ width: "100%" }} min={0} max={4} step={0.01} stringMode /></Form.Item></Col>
                    </Row>
                    <Form.Item name="certificate_number" label="No. Ijazah"><Input /></Form.Item>
                </Form>
            </Modal>

            {/* NEW: Work Experience Modal */}
            <Modal
                open={expModalOpen} onCancel={() => setExpModalOpen(false)}
                title={expEditing ? "Edit Pengalaman Kerja" : "Tambah Pengalaman Kerja"}
                onOk={async () => {
                    if (!userId) { message.warning("Simpan Informasi Umum dulu."); return; }
                    await submitExp();
                }}
                okText="Simpan" destroyOnClose
            >
                <Form form={expForm} layout="vertical" preserve={false}>
                    <Form.Item name="company_name" label="Nama Perusahaan" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="position_title" label="Jabatan" rules={[{ required: true }]}><Input /></Form.Item>
                    <Row gutter={12}>
                        <Col span={12}><Form.Item name="employment_type" label="Jenis" initialValue="Full-time"><Select options={ENUM_EMPLOYMENT_TYPE} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="location" label="Lokasi"><Input /></Form.Item></Col>
                    </Row>
                    <Row gutter={12}>
                        <Col span={12}><Form.Item name="start_date" label="Mulai" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="end_date" label="Selesai"><DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" /></Form.Item></Col>
                    </Row>
                    <Form.Item name="last_salary" label="Gaji Terakhir"><InputNumber style={{ width: "100%" }} min={0} step={100000} stringMode /></Form.Item>
                    <Form.Item name="reason_for_leaving" label="Alasan Keluar"><Input /></Form.Item>
                    <Form.Item name="supervisor_name" label="Nama Atasan"><Input /></Form.Item>
                    <Form.Item name="supervisor_phone" label="Telepon Atasan"><Input maxLength={50} /></Form.Item>
                    <Form.Item name="description" label="Deskripsi Pekerjaan"><Input.TextArea rows={2} /></Form.Item>
                    <Form.Item name="achievements" label="Pencapaian"><Input.TextArea rows={2} /></Form.Item>
                </Form>
            </Modal>

            {/* Job Assignment Modal */}
            <Modal
                open={jaModalOpen} onCancel={() => setJaModalOpen(false)}
                title={jaEditing ? "Edit Riwayat Jabatan" : "Tambah Riwayat Jabatan"}
                onOk={async () => { if (!userId) { message.warning("Simpan Informasi Umum dulu."); return; } await submitJa(); }}
                okText="Simpan" destroyOnClose
            >
                <Form form={jaForm} layout="vertical" preserve={false}>
                    <Row gutter={12}>
                        <Col span={12}><Form.Item name="effective_start" label="Mulai" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="effective_end" label="Selesai (opsional)"><DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" /></Form.Item></Col>
                    </Row>
                    <Form.Item name="change_reason" label="Alasan Perubahan" initialValue="Hire" rules={[{ required: true }]}><Select options={ENUM_REASON} /></Form.Item>
                    <Row gutter={12}>
                        <Col span={12}><Form.Item name="department" label="Departemen" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="position" label="Posisi" rules={[{ required: true }]}><Input /></Form.Item></Col>
                    </Row>
                    {/* <Row gutter={12}>
                        <Col span={8}><Form.Item name="job_level" label="Level"><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="grade" label="Grade"><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="cost_center" label="Cost Center"><Input /></Form.Item></Col>
                    </Row>
                    <Row gutter={12}>
                        <Col span={8}><Form.Item name="location_id" label="Location ID"><InputNumber style={{ width: "100%" }} min={0} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="shift_id" label="Shift ID"><InputNumber style={{ width: "100%" }} min={0} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="entitas_id" label="Entitas ID"><InputNumber style={{ width: "100%" }} min={0} /></Form.Item></Col>
                    </Row> */}
                    <Row gutter={12}>
                        {/* <Col span={12}><Form.Item name="manager_user_id" label="Manager User ID"><InputNumber style={{ width: "100%" }} min={1} /></Form.Item></Col> */}
                        <Col span={12}><Form.Item name="remarks" label="Catatan"><Input /></Form.Item></Col>
                    </Row>
                </Form>
            </Modal>
        </>
    );
}
