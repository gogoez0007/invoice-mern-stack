import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Tabs,
  Space,
  Tag,
  Input,
  Modal,
  Form,
  Select,
  Switch,
  Typography,
  message,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Statistic,
  Badge,
  Divider,
  Alert,
  Spin,
} from 'antd';
import {
  BranchesOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  MailOutlined,
  UserOutlined,
  ApartmentOutlined,
  ClusterOutlined,
  CloudSyncOutlined,
  SafetyCertificateOutlined,
  AppstoreOutlined,
  IdcardOutlined,
  TeamOutlined,
  EyeOutlined,
  DownloadOutlined,
  FilterOutlined,
  CheckOutlined,
  UndoOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { leaveApprovalService } from '@/request/leaveApprovalService';
import useResponsive from '@/hooks/useResponsive';

const { Title, Text, Paragraph } = Typography;

export default function LeaveApprovalLinesPage() {
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState('hermes360'); // 'hermes360' | 'global_fallback' | 'all_employees' | 'integrated_apps'
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState([]);
  const [search, setSearch] = useState('');

  // Hermes Users for Autocomplete
  const [hermesUsers, setHermesUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Modal State for Line Approval
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // Watch switch states
  const app1IsExternal = Form.useWatch('app1_is_external', form);
  const app2IsExternal = Form.useWatch('app2_is_external', form);

  // 1. Feature: Collapsible keywords tags (Max 10 default)
  const [expandedKeywords, setExpandedKeywords] = useState({});

  // 2. Feature: Modal Cek Karyawan per Alur yang Dipilih
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [selectedRuleRecord, setSelectedRuleRecord] = useState(null);
  const [ruleEmployees, setRuleEmployees] = useState([]);
  const [loadingRuleEmployees, setLoadingRuleEmployees] = useState(false);
  const [ruleEmpSearch, setRuleEmpSearch] = useState('');

  // 3. Feature: Preview Keywords in Modal Form
  const [previewKeywordsModalOpen, setPreviewKeywordsModalOpen] = useState(false);
  const [previewEmployees, setPreviewEmployees] = useState([]);
  const [loadingKeywordPreview, setLoadingKeywordPreview] = useState(false);

  // 4. Feature: Tab Semua Line Approval Karyawan
  const [allEmployees, setAllEmployees] = useState([]);
  const [loadingAllEmployees, setLoadingAllEmployees] = useState(false);
  const [allEmpSearch, setAllEmpSearch] = useState('');
  const [filterEntitas, setFilterEntitas] = useState('all');
  const [filterRule, setFilterRule] = useState('all');

  // 5. Feature: Tab Rule Global (Default Fallback) -> Jogi & Christianus
  const [fallbackData, setFallbackData] = useState({ rule: null, employees: [], total_fallback_employees: 0 });
  const [loadingFallback, setLoadingFallback] = useState(false);
  const [fallbackSearch, setFallbackSearch] = useState('');
  const [fallbackFilterEntitas, setFallbackFilterEntitas] = useState('all');
  const [isFallbackModalOpen, setIsFallbackModalOpen] = useState(false);
  const [fallbackForm] = Form.useForm();
  const [savingFallback, setSavingFallback] = useState(false);
  const fallbackApp1IsExternal = Form.useWatch('app1_is_external', fallbackForm);
  const fallbackApp2IsExternal = Form.useWatch('app2_is_external', fallbackForm);

  // 5. Feature: Org Structure & Entity-Department-Position Scope State
  const [orgStructure, setOrgStructure] = useState({ entities: [], all_departments: [], all_positions: [] });
  const [loadingOrg, setLoadingOrg] = useState(false);
  const [selectedEntityNames, setSelectedEntityNames] = useState([]);
  const [activeModalEntityTab, setActiveModalEntityTab] = useState('');
  const [entityScopeMap, setEntityScopeMap] = useState({});

  // Mini Help Tool: Pencarian info Entitas, Departemen, dan Posisi Karyawan
  const [selectedHelpEmployeeId, setSelectedHelpEmployeeId] = useState(null);

  // Flatten seluruh karyawan dari semua entitas untuk Mini Help Tool
  const allOrgEmployees = useMemo(() => {
    if (!orgStructure.entities) return [];
    const list = [];
    orgStructure.entities.forEach((ent) => {
      (ent.employees || []).forEach((emp) => {
        list.push({
          ...emp,
          entitas_name: ent.name,
          entitas_company: ent.company_name || ent.name,
          searchKey: `${emp.name || ''} ${emp.nik || ''} ${ent.name} ${emp.department || ''} ${emp.position || ''}`.toLowerCase(),
        });
      });
    });
    return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [orgStructure.entities]);

  const selectedHelpEmployee = useMemo(() => {
    if (!selectedHelpEmployeeId) return null;
    return allOrgEmployees.find((e) => `${e.entitas_name}_${e.id}` === selectedHelpEmployeeId) || null;
  }, [allOrgEmployees, selectedHelpEmployeeId]);

  const handleApplyEmployeeToScope = (emp) => {
    if (!emp) return;
    const entName = emp.entitas_name;
    const dept = emp.department || '(Tanpa Departemen)';
    const pos = emp.position || '(Tanpa Jabatan)';

    // 1. Pastikan entitas masuk selectedEntityNames
    setSelectedEntityNames((prev) => {
      if (prev.includes(entName)) return prev;
      return [...prev, entName];
    });

    // 2. Perbarui entityScopeMap
    setEntityScopeMap((prev) => {
      const nextMap = { ...prev };
      const entData = (orgStructure.entities || []).find((e) => e.name === entName);
      const existing = nextMap[entName] || {
        departments: entData ? [...entData.departments] : [],
        positions: entData ? [...entData.positions] : [],
        excluded_employee_ids: [],
      };

      const nextDepts = existing.departments.includes(dept)
        ? existing.departments
        : [...existing.departments, dept];

      const nextPositions = existing.positions.includes(pos)
        ? existing.positions
        : [...existing.positions, pos];

      // Hapus dari excluded jika sebelumnya pernah dikecualikan
      const nextExcluded = (existing.excluded_employee_ids || []).filter(
        (id) => String(id) !== String(emp.id)
      );

      nextMap[entName] = {
        departments: nextDepts,
        positions: nextPositions,
        excluded_employee_ids: nextExcluded,
      };
      return nextMap;
    });

    // 3. Pindahkan tab aktif ke entitas tersebut
    setActiveModalEntityTab(entName);

    message.success(
      `Berhasil! ${emp.name} (Entitas: ${entName}, Dept: ${dept}, Jabatan: ${pos}) telah diterapkan ke filter cakupan alur.`
    );
  };

  // Fetch Org Structure (Entitas, Depts, Positions, Employees)
  const fetchOrgStructure = async () => {
    setLoadingOrg(true);
    try {
      const res = await leaveApprovalService.getOrganizationStructure();
      if (res && res.result) {
        setOrgStructure(res.result);
      }
    } catch (err) {
      console.warn('Gagal mengambil struktur organisasi:', err.message);
    } finally {
      setLoadingOrg(false);
    }
  };

  const handleEntitySelectionChange = (newSelected) => {
    setSelectedEntityNames(newSelected);
    setEntityScopeMap((prev) => {
      const nextMap = { ...prev };
      newSelected.forEach((entName) => {
        if (!nextMap[entName]) {
          const entData = orgStructure.entities?.find((e) => e.name === entName);
          nextMap[entName] = {
            departments: entData ? [...entData.departments] : [],
            positions: entData ? [...entData.positions] : [],
            excluded_employee_ids: [],
          };
        }
      });
      Object.keys(nextMap).forEach((key) => {
        if (!newSelected.includes(key)) {
          delete nextMap[key];
        }
      });
      return nextMap;
    });

    if (newSelected.length > 0 && !newSelected.includes(activeModalEntityTab)) {
      setActiveModalEntityTab(newSelected[0]);
    }
  };

  const handleSelectAllEntities = () => {
    if (!orgStructure.entities) return;
    const allNames = orgStructure.entities.map((e) => e.name);
    handleEntitySelectionChange(allNames);
  };

  const handleClearAllEntities = () => {
    handleEntitySelectionChange([]);
  };

  const handleDepartmentsChange = (entName, newDepts) => {
    setEntityScopeMap((prev) => ({
      ...prev,
      [entName]: {
        ...(prev[entName] || {}),
        departments: newDepts,
      },
    }));
  };

  const handlePositionsChange = (entName, newPositions) => {
    setEntityScopeMap((prev) => ({
      ...prev,
      [entName]: {
        ...(prev[entName] || {}),
        positions: newPositions,
      },
    }));
  };

  // Exclude / Remove specific employee from rule
  const handleExcludeEmployee = (entName, empId) => {
    setEntityScopeMap((prev) => {
      const current = prev[entName] || { departments: [], positions: [], excluded_employee_ids: [] };
      const currentExcluded = current.excluded_employee_ids || [];
      if (currentExcluded.includes(empId)) return prev;
      return {
        ...prev,
        [entName]: {
          ...current,
          excluded_employee_ids: [...currentExcluded, empId],
        },
      };
    });
  };

  // Restore excluded employee back into rule
  const handleRestoreEmployee = (entName, empId) => {
    setEntityScopeMap((prev) => {
      const current = prev[entName] || { departments: [], positions: [], excluded_employee_ids: [] };
      const currentExcluded = current.excluded_employee_ids || [];
      return {
        ...prev,
        [entName]: {
          ...current,
          excluded_employee_ids: currentExcluded.filter((id) => id !== empId),
        },
      };
    });
  };

  const handleExcludedSelectChange = (entName, selectedIds) => {
    setEntityScopeMap((prev) => {
      const current = prev[entName] || { departments: [], positions: [], excluded_employee_ids: [] };
      return {
        ...prev,
        [entName]: {
          ...current,
          excluded_employee_ids: selectedIds || [],
        },
      };
    });
  };

  const handleSelectAllDeptsForEntity = (entName) => {
    const entData = orgStructure.entities?.find((e) => e.name === entName);
    if (entData) {
      handleDepartmentsChange(entName, [...entData.departments]);
    }
  };

  const handleClearAllDeptsForEntity = (entName) => {
    handleDepartmentsChange(entName, []);
  };

  const handleSelectAllPositionsForEntity = (entName) => {
    const entData = orgStructure.entities?.find((e) => e.name === entName);
    if (entData) {
      handlePositionsChange(entName, [...entData.positions]);
    }
  };

  const handleClearAllPositionsForEntity = (entName) => {
    handlePositionsChange(entName, []);
  };

  // Karyawan di entitas yang cocok dengan kriteria dan TIDAK dikecualikan
  const getMatchedEmployeesForEntity = (entName) => {
    const entData = orgStructure.entities?.find((e) => e.name === entName);
    if (!entData) return [];
    const scope = entityScopeMap[entName];
    if (!scope) return [];
    const depts = scope.departments || [];
    const posList = scope.positions || [];
    const excluded = scope.excluded_employee_ids || [];

    return (entData.employees || []).filter((emp) => {
      if (excluded.includes(emp.id)) return false;
      const empDept = emp.department || '(Tanpa Departemen)';
      const empPos = emp.position || '(Tanpa Posisi)';
      const deptMatches = depts.length === 0 || depts.includes(empDept);
      const posMatches = posList.length === 0 || posList.includes(empPos);
      return deptMatches && posMatches;
    });
  };

  // Karyawan di entitas yang secara eksplisit dikecualikan
  const getExcludedEmployeesForEntity = (entName) => {
    const entData = orgStructure.entities?.find((e) => e.name === entName);
    if (!entData) return [];
    const scope = entityScopeMap[entName];
    if (!scope) return [];
    const excluded = scope.excluded_employee_ids || [];
    return (entData.employees || []).filter((emp) => excluded.includes(emp.id));
  };

  const totalModalMatchedEmployees = useMemo(() => {
    let total = 0;
    selectedEntityNames.forEach((entName) => {
      total += getMatchedEmployeesForEntity(entName).length;
    });
    return total;
  }, [selectedEntityNames, entityScopeMap, orgStructure]);

  // Fetch Global Fallback Rule & Employees
  const fetchGlobalFallback = async () => {
    setLoadingFallback(true);
    try {
      const res = await leaveApprovalService.getGlobalFallbackRule();
      if (res && res.success && res.result) {
        setFallbackData(res.result);
      }
    } catch (err) {
      console.warn('Gagal memuat Rule Global Fallback:', err.message);
    } finally {
      setLoadingFallback(false);
    }
  };

  // Sinkronisasi data form alur global inline saat data rule fallback termuat
  useEffect(() => {
    if (fallbackData.rule) {
      const r = fallbackData.rule;
      fallbackForm.setFieldsValue({
        app1_user_id: r.app1_user_id,
        app1_name: r.app1_name,
        app1_email: r.app1_email,
        app1_is_external: Boolean(r.app1_is_external),
        app2_user_id: r.app2_user_id,
        app2_name: r.app2_name,
        app2_email: r.app2_email,
        app2_is_external: Boolean(r.app2_is_external),
        notes: r.notes || '',
      });
    }
  }, [fallbackData.rule]);

  const handleOpenEditFallback = () => {
    if (!fallbackData.rule) {
      message.error('Data Rule Global Fallback belum termuat.');
      return;
    }
    const r = fallbackData.rule;
    fallbackForm.resetFields();
    fallbackForm.setFieldsValue({
      app1_user_id: r.app1_user_id,
      app1_name: r.app1_name,
      app1_email: r.app1_email,
      app1_is_external: Boolean(r.app1_is_external),
      app2_user_id: r.app2_user_id,
      app2_name: r.app2_name,
      app2_email: r.app2_email,
      app2_is_external: Boolean(r.app2_is_external),
      notes: r.notes || '',
    });
    setIsFallbackModalOpen(true);
  };

  const handleSaveFallback = async (values) => {
    setSavingFallback(true);
    try {
      const isSame = Boolean(
        values.app1_name && values.app2_name &&
        (
          (values.app1_user_id && values.app2_user_id && values.app1_user_id === values.app2_user_id) ||
          values.app1_name.trim().toLowerCase() === values.app2_name.trim().toLowerCase()
        )
      );
      const cleanApp2Name = (!values.app2_name || values.app2_name.trim() === '' || values.app2_name.trim() === '-' || isSame) ? null : values.app2_name.trim();

      const payload = {
        app1_user_id: values.app1_user_id || null,
        app1_name: values.app1_name,
        app1_email: values.app1_email || null,
        app1_is_external: values.app1_is_external ? 1 : 0,
        app2_user_id: cleanApp2Name ? (values.app2_user_id || null) : null,
        app2_name: cleanApp2Name,
        app2_email: cleanApp2Name ? (values.app2_email || null) : null,
        app2_is_external: cleanApp2Name ? (values.app2_is_external ? 1 : 0) : 0,
        notes: values.notes || null,
      };

      const res = await leaveApprovalService.updateGlobalFallbackRule(payload);
      if (res && res.success) {
        message.success('Rule Global (Default Fallback) berhasil diperbarui!');
        setIsFallbackModalOpen(false);
        fetchGlobalFallback();
        fetchLines();
      } else {
        message.error(res?.message || 'Gagal memperbarui Rule Global Fallback.');
      }
    } catch (err) {
      console.error(err);
      message.error('Gagal menyimpan Rule Global Fallback: ' + err.message);
    } finally {
      setSavingFallback(false);
    }
  };

  // Fetch Hermes Users for Autocomplete
  const fetchHermesUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await leaveApprovalService.getHermesUsers();
      if (res.success) {
        setHermesUsers(res.result || []);
      }
    } catch (err) {
      console.warn('Gagal mengambil daftar user Hermes:', err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch Lines
  const fetchLines = async () => {
    setLoading(true);
    try {
      const source = activeTab === 'all_employees' ? 'hermes360' : activeTab;
      const res = await leaveApprovalService.getApprovalLines({
        app_source: source,
        q: search.trim() || undefined,
      });
      if (res.success) {
        setLines(res.result || []);
      } else {
        message.error(res.message || 'Gagal memuat data alur approval.');
      }
    } catch (err) {
      console.error(err);
      message.error('Gagal mengambil data alur approval dari server.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch All Employees Approval Line (for Tab 3)
  const fetchAllEmployees = async () => {
    setLoadingAllEmployees(true);
    try {
      const res = await leaveApprovalService.getApprovalLineEmployees();
      if (res.success) {
        setAllEmployees(res.result || []);
      }
    } catch (err) {
      console.error('Gagal mengambil daftar seluruh approval karyawan:', err);
      message.error('Gagal memuat pemetaan approval seluruh karyawan.');
    } finally {
      setLoadingAllEmployees(false);
    }
  };

  useEffect(() => {
    fetchHermesUsers();
    fetchOrgStructure();
    fetchGlobalFallback();
  }, []);

  useEffect(() => {
    if (activeTab === 'all_employees') {
      fetchAllEmployees();
    } else if (activeTab === 'global_fallback') {
      fetchGlobalFallback();
    } else {
      fetchLines();
    }
  }, [activeTab, search]);

  // Options for Autocomplete Select
  const userSelectOptions = useMemo(() => {
    return hermesUsers.map((u) => {
      const subtitle = u.position || u.department || '';
      return {
        value: u.id,
        label: subtitle ? `${u.name} (${subtitle})` : u.name,
        user: u,
      };
    });
  }, [hermesUsers]);

  // Handle open employee check modal for a selected rule
  const handleOpenEmployeeList = async (record) => {
    setSelectedRuleRecord(record);
    setIsEmpModalOpen(true);
    setRuleEmpSearch('');
    setLoadingRuleEmployees(true);
    try {
      const res = await leaveApprovalService.getApprovalLineEmployees({ rule_id: record.id });
      if (res.success) {
        setRuleEmployees(res.result || []);
      } else {
        message.error(res.message || 'Gagal mengambil data karyawan dalam alur ini.');
      }
    } catch (err) {
      console.error(err);
      message.error('Gagal mengambil daftar karyawan untuk alur ini.');
    } finally {
      setLoadingRuleEmployees(false);
    }
  };

  // Handle preview typed keywords inside modal
  const handlePreviewKeywordsInModal = async () => {
    const rawKeywords = form.getFieldValue('department');
    if (!rawKeywords || !rawKeywords.trim()) {
      message.warning('Ketik kata kunci jabatan terlebih dahulu untuk melakukan simulasi.');
      return;
    }
    setLoadingKeywordPreview(true);
    setPreviewKeywordsModalOpen(true);
    try {
      const res = await leaveApprovalService.previewKeywordsEmployees({ keywords: rawKeywords });
      if (res.success) {
        setPreviewEmployees(res.result || []);
      }
    } catch (err) {
      console.error(err);
      message.error('Gagal melakukan simulasi kata kunci.');
    } finally {
      setLoadingKeywordPreview(false);
    }
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingRecord(null);
    setSelectedEntityNames([]);
    setEntityScopeMap({});
    setActiveModalEntityTab('');
    setSelectedHelpEmployeeId(null);
    form.resetFields();
    form.setFieldsValue({
      app_source: activeTab === 'all_employees' ? 'hermes360' : activeTab,
      line_order: lines.length + 1,
      app1_is_external: false,
      app2_is_external: false,
      is_active: true,
      app2_user_id: null,
      app2_name: null,
      app2_email: null,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record) => {
    setModalMode('edit');
    setEditingRecord(record);
    setSelectedHelpEmployeeId(null);
    form.resetFields();

    let initialEntities = [];
    let initialScopeMap = {};

    if (record.scope_config) {
      try {
        const parsed = typeof record.scope_config === 'string' ? JSON.parse(record.scope_config) : record.scope_config;
        if (parsed.entities && Array.isArray(parsed.entities)) {
          initialEntities = parsed.entities.map((e) => e.entitas_name);
          parsed.entities.forEach((e) => {
            initialScopeMap[e.entitas_name] = {
              departments: e.departments || [],
              positions: e.positions || [],
              excluded_employee_ids: e.excluded_employee_ids || [],
            };
          });
        }
      } catch (e) {
        console.warn('Error parsing scope_config:', e);
      }
    }

    // Fallback cerdas jika data lama belum memiliki scope_config
    if (initialEntities.length === 0) {
      const rawKeywords = (record.department || record.position || '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const ruleEntName = (record.entitas_name || '').toLowerCase();
      const isGeneral = !ruleEntName || ruleEntName.includes('general') || ruleEntName.includes('semua');

      (orgStructure.entities || []).forEach((ent) => {
        // Jika entitas spesifik, hanya periksa entitas tersebut
        if (!isGeneral && !ruleEntName.includes(ent.name.toLowerCase())) {
          return;
        }

        // Cari departemen yang cocok dengan kata kunci
        const matchedDepts = (ent.departments || []).filter((dept) => {
          const dLower = dept.toLowerCase();
          return rawKeywords.some((kw) => dLower.includes(kw) || kw.includes(dLower));
        });

        // Cari posisi yang cocok dengan kata kunci
        const matchedPositions = (ent.positions || []).filter((pos) => {
          const pLower = pos.toLowerCase();
          return rawKeywords.some((kw) => pLower.includes(kw) || kw.includes(pLower));
        });

        // Cek apakah ada karyawan di entitas ini yang cocok dengan kata kunci
        const hasMatchingEmployees = (ent.employees || []).some((emp) => {
          const comb = `${emp.name} ${emp.position} ${emp.department}`.toLowerCase();
          return rawKeywords.some((kw) => comb.includes(kw));
        });

        if (matchedPositions.length > 0 || matchedDepts.length > 0 || hasMatchingEmployees) {
          initialEntities.push(ent.name);
          initialScopeMap[ent.name] = {
            departments: matchedDepts.length > 0 ? matchedDepts : (ent.departments ? [...ent.departments] : []),
            positions: matchedPositions.length > 0 ? matchedPositions : (ent.positions ? [...ent.positions] : []),
            excluded_employee_ids: [],
          };
        }
      });

      // Jika masih belum ada entitas terdeteksi, ambil entitas yang ada di nama entitas atau semua entitas
      if (initialEntities.length === 0) {
        if (!isGeneral) {
          initialEntities = ruleEntName.split(',').map((s) => s.trim()).filter(Boolean);
        } else {
          initialEntities = (orgStructure.entities || []).map((e) => e.name);
        }
        initialEntities.forEach((eName) => {
          const entData = orgStructure.entities?.find((e) => e.name === eName);
          initialScopeMap[eName] = {
            departments: entData ? [...entData.departments] : [],
            positions: entData ? [...entData.positions] : [],
            excluded_employee_ids: [],
          };
        });
      }
    }

    setSelectedEntityNames(initialEntities);
    setEntityScopeMap(initialScopeMap);
    if (initialEntities.length > 0) {
      setActiveModalEntityTab(initialEntities[0]);
    }

    form.setFieldsValue({
      ...record,
      app1_is_external: Boolean(record.app1_is_external),
      app2_is_external: Boolean(record.app2_is_external),
      is_active: Boolean(record.is_active),
    });
    setIsModalOpen(true);
  };

  const handleSave = async (values) => {
    if (selectedEntityNames.length === 0) {
      message.error('Silakan pilih minimal 1 entitas cakupan untuk alur approval ini.');
      return;
    }

    setSaving(true);
    try {
      const isSame = Boolean(
        values.app1_name && values.app2_name &&
        (
          (values.app1_user_id && values.app2_user_id && values.app1_user_id === values.app2_user_id) ||
          values.app1_name.trim().toLowerCase() === values.app2_name.trim().toLowerCase()
        )
      );
      const cleanApp2Name = (!values.app2_name || values.app2_name.trim() === '' || values.app2_name.trim() === '-' || isSame) ? null : values.app2_name.trim();

      const scope_config = {
        entities: selectedEntityNames.map((entName) => ({
          entitas_name: entName,
          departments: entityScopeMap[entName]?.departments || [],
          positions: entityScopeMap[entName]?.positions || [],
          excluded_employee_ids: entityScopeMap[entName]?.excluded_employee_ids || [],
        })),
      };

      // Summary label posisi & departemen untuk tampilan ringkas tabel
      const allSelectedPositions = [];
      selectedEntityNames.forEach((entName) => {
        const pos = entityScopeMap[entName]?.positions || [];
        allSelectedPositions.push(...pos);
      });
      const uniquePositions = Array.from(new Set(allSelectedPositions.filter((p) => p && p !== '(Semua Posisi)')));
      const summaryDepartment = uniquePositions.length > 0 ? uniquePositions.join(', ') : values.position;

      const payload = {
        ...values,
        entitas_name: selectedEntityNames.length > 0 ? selectedEntityNames.join(', ') : (values.entitas_name || 'General (Semua Entitas)'),
        department: summaryDepartment,
        scope_config,
        app_source: activeTab === 'all_employees' ? 'hermes360' : activeTab,
        app1_is_external: values.app1_is_external ? 1 : 0,
        app2_user_id: cleanApp2Name ? (values.app2_user_id || null) : null,
        app2_name: cleanApp2Name,
        app2_email: cleanApp2Name ? (values.app2_email || null) : null,
        app2_is_external: cleanApp2Name ? (values.app2_is_external ? 1 : 0) : 0,
        is_active: values.is_active ? 1 : 0,
      };

      if (modalMode === 'edit' && editingRecord?.id) {
        await leaveApprovalService.updateApprovalLine(editingRecord.id, payload);
        message.success('Alur approval berhasil diperbarui.');
      } else {
        await leaveApprovalService.createApprovalLine(payload);
        message.success('Alur approval baru berhasil ditambahkan.');
      }

      setIsModalOpen(false);
      fetchLines();
      fetchGlobalFallback();
      if (activeTab === 'all_employees') fetchAllEmployees();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || err.message || 'Gagal menyimpan alur approval.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await leaveApprovalService.deleteApprovalLine(id);
      message.success('Alur approval berhasil dihapus.');
      fetchLines();
      fetchGlobalFallback();
      if (activeTab === 'all_employees') fetchAllEmployees();
    } catch (err) {
      console.error(err);
      message.error('Gagal menghapus alur approval.');
    }
  };

  // Helper render Approver badge
  const renderApprover = (name, email, isExternal) => {
    if (!name) return <Text type="secondary">-</Text>;
    return (
      <div style={{ wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.35 }}>
        <Space size={6} wrap>
          <Text strong style={{ fontSize: 13 }}>
            {name}
          </Text>
          {isExternal ? (
            <Tooltip title="Approver Eksternal via Email (Notifikasi persetujuan ber-token dikirim via email)">
              <Tag color="volcano" icon={<MailOutlined />} style={{ fontSize: 10.5, margin: 0, padding: '0 4px' }}>
                Via Email
              </Tag>
            </Tooltip>
          ) : (
            <Tooltip title="Approver Internal User Hermes360">
              <Tag color="blue" icon={<UserOutlined />} style={{ fontSize: 10.5, margin: 0, padding: '0 4px' }}>
                Hermes ID
              </Tag>
            </Tooltip>
          )}
        </Space>
        {email && (
          <div style={{ fontSize: 11.5, color: '#64748b', wordBreak: 'break-all', marginTop: 2 }}>
            {email}
          </div>
        )}
      </div>
    );
  };

  // Helper render Approver 2 badge (jika kosong / sama dengan APP 1, tandai sebagai 1 tahap saja)
  const renderApprover2 = (record) => {
    const isSame = Boolean(
      record.app1_name && record.app2_name &&
      (
        (record.app1_user_id && record.app2_user_id && record.app1_user_id === record.app2_user_id) ||
        record.app1_name.trim().toLowerCase() === record.app2_name.trim().toLowerCase()
      )
    );
    if (!record.app2_name || record.app2_name.trim() === '' || record.app2_name.trim() === '-' || isSame) {
      return (
        <Space direction="vertical" size={2}>
          <Tag color="cyan" style={{ fontSize: 11, margin: 0, padding: '2px 7px' }}>
            Cukup APP 1 (1 Tahap)
          </Tag>
          <Text type="secondary" style={{ fontSize: 11, color: '#64748b' }}>
            {isSame ? 'APP 1 & 2 orang yang sama' : 'Tidak perlu approval ke-2'}
          </Text>
        </Space>
      );
    }
    return renderApprover(record.app2_name, record.app2_email, record.app2_is_external);
  };

  // Columns for Tab 1: Hermes 360
  const hermesColumns = [
    {
      title: 'No',
      dataIndex: 'line_order',
      key: 'line_order',
      width: 50,
      align: 'center',
      render: (val, _, idx) => <Text strong>{val || idx + 1}</Text>,
    },
    {
      title: 'Grup / Kelompok Approval',
      dataIndex: 'position',
      key: 'position',
      width: 175,
      render: (text, record) => (
        <div style={{ wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.4 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 4 }}>
            📁 {text}
          </div>
          <Tag color="cyan" style={{ fontSize: 11, whiteSpace: 'normal', height: 'auto', padding: '1px 6px' }}>
            {record.entitas_name || 'General (Semua Entitas)'}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Cakupan Jabatan / Kata Kunci Pencocokan',
      dataIndex: 'department',
      key: 'department',
      render: (text, record) => {
        if (!text) return <Text type="secondary">-</Text>;
        const tags = text.split(',').map((t) => t.trim()).filter(Boolean);
        const isExpanded = Boolean(expandedKeywords[record.id]);
        const visibleTags = isExpanded ? tags : tags.slice(0, 10);
        const hasMore = tags.length > 10;

        return (
          <div style={{ wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.4 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {visibleTags.map((t, i) => (
                <Tag
                  key={i}
                  color="geekblue"
                  style={{
                    fontSize: 11.5,
                    margin: 0,
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    height: 'auto',
                    padding: '2px 7px',
                    borderRadius: 4,
                  }}
                >
                  {t}
                </Tag>
              ))}
              {hasMore && (
                <Button
                  type="link"
                  size="small"
                  onClick={() =>
                    setExpandedKeywords((prev) => ({
                      ...prev,
                      [record.id]: !prev[record.id],
                    }))
                  }
                  style={{
                    padding: '0 4px',
                    fontSize: 11.5,
                    fontWeight: 600,
                    height: 'auto',
                    lineHeight: 1.6,
                    color: '#0284c7',
                  }}
                >
                  {isExpanded ? '▲ Sembunyikan' : `+${tags.length - 10} lainnya (Tampilkan Semua)`}
                </Button>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'APP 1',
      dataIndex: 'app1_name',
      key: 'app1_name',
      width: 190,
      render: (_, record) => renderApprover(record.app1_name, record.app1_email, record.app1_is_external),
    },
    {
      title: 'APP 2 (Opsional)',
      dataIndex: 'app2_name',
      key: 'app2_name',
      width: 190,
      render: (_, record) => renderApprover2(record),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 85,
      align: 'center',
      render: (isActive) =>
        isActive ? (
          <Badge status="success" text={<Text type="success" style={{ fontSize: 12 }}>Aktif</Text>} />
        ) : (
          <Badge status="error" text={<Text type="danger" style={{ fontSize: 12 }}>Nonaktif</Text>} />
        ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 110,
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Edit Aturan">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          {/* Button Cek Daftar Karyawan (Sebelah Delete) */}
          <Tooltip title="Cek Daftar Karyawan dalam Alur Ini">
            <Button
              type="text"
              size="small"
              icon={<TeamOutlined style={{ color: '#16a34a', fontSize: 14 }} />}
              onClick={() => handleOpenEmployeeList(record)}
            />
          </Tooltip>
          <Tooltip title="Hapus Aturan">
            <Popconfirm
              title="Hapus alur approval ini?"
              description={`Yakin menghapus grup "${record.position}"?`}
              onConfirm={() => handleDelete(record.id)}
              okText="Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" size="small" icon={<DeleteOutlined style={{ color: '#ef4444' }} />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Columns for Tab 2: Integrated Apps
  const integratedColumns = [
    {
      title: 'No',
      dataIndex: 'line_order',
      key: 'line_order',
      width: 55,
      align: 'center',
      render: (val, _, idx) => <Text strong>{val || idx + 1}</Text>,
    },
    {
      title: 'Modul / Tipe Dokumen',
      dataIndex: 'doc_type',
      key: 'doc_type',
      width: 170,
      render: (text) => (
        <Tag color="volcano" style={{ fontWeight: 600, fontSize: 12 }}>
          {text || 'Semua Dokumen'}
        </Tag>
      ),
    },
    {
      title: 'Entitas',
      dataIndex: 'entitas_name',
      key: 'entitas_name',
      width: 150,
      render: (text) => <Tag color="geekblue">{text || 'General'}</Tag>,
    },
    {
      title: 'Kluster Posisi / Divisi',
      dataIndex: 'position',
      key: 'position',
      width: 190,
      render: (text) => <Text strong>{text || '-'}</Text>,
    },
    {
      title: 'APP 1',
      dataIndex: 'app1_name',
      key: 'app1_name',
      width: 220,
      render: (_, record) => renderApprover(record.app1_name, record.app1_email, record.app1_is_external),
    },
    {
      title: 'APP 2 (Opsional)',
      dataIndex: 'app2_name',
      key: 'app2_name',
      width: 210,
      render: (_, record) => renderApprover2(record),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 90,
      align: 'center',
      render: (isActive) =>
        isActive ? (
          <Badge status="success" text={<Text type="success" style={{ fontSize: 12 }}>Aktif</Text>} />
        ) : (
          <Badge status="error" text={<Text type="danger" style={{ fontSize: 12 }}>Nonaktif</Text>} />
        ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 110,
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Edit Aturan">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Cek Daftar Karyawan dalam Alur Ini">
            <Button
              type="text"
              size="small"
              icon={<TeamOutlined style={{ color: '#16a34a', fontSize: 14 }} />}
              onClick={() => handleOpenEmployeeList(record)}
            />
          </Tooltip>
          <Tooltip title="Hapus Aturan">
            <Popconfirm
              title="Hapus alur approval ini?"
              description={`Yakin menghapus alur "${record.position}"?`}
              onConfirm={() => handleDelete(record.id)}
              okText="Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" size="small" icon={<DeleteOutlined style={{ color: '#ef4444' }} />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Filtered employees for the Modal Cek Karyawan per Rule
  const filteredRuleEmployees = useMemo(() => {
    if (!ruleEmpSearch || !ruleEmpSearch.trim()) return ruleEmployees;
    const q = ruleEmpSearch.trim().toLowerCase();
    return ruleEmployees.filter((e) => {
      return (
        (e.name && e.name.toLowerCase().includes(q)) ||
        (e.nik && e.nik.toLowerCase().includes(q)) ||
        (e.position && e.position.toLowerCase().includes(q)) ||
        (e.department && e.department.toLowerCase().includes(q)) ||
        (e.entitas_name && e.entitas_name.toLowerCase().includes(q))
      );
    });
  }, [ruleEmployees, ruleEmpSearch]);

  // Filtered employees for Tab 3 (Semua Line Approval Karyawan)
  const filteredAllEmployees = useMemo(() => {
    return allEmployees.filter((e) => {
      // Filter Entitas
      if (filterEntitas !== 'all' && e.entitas_name !== filterEntitas) {
        return false;
      }
      // Filter Rule
      if (filterRule !== 'all' && String(e.rule_id) !== String(filterRule)) {
        return false;
      }
      // Search
      if (allEmpSearch && allEmpSearch.trim()) {
        const q = allEmpSearch.trim().toLowerCase();
        const searchable = `${e.name} ${e.nik || ''} ${e.position || ''} ${e.department || ''} ${e.entitas_name || ''} ${e.rule_name || ''}`.toLowerCase();
        return searchable.includes(q);
      }
      return true;
    });
  }, [allEmployees, allEmpSearch, filterEntitas, filterRule]);

  // Unique Entitas list for Tab 3 dropdown
  const uniqueEntities = useMemo(() => {
    const set = new Set();
    allEmployees.forEach((e) => {
      if (e.entitas_name) set.add(e.entitas_name);
    });
    return Array.from(set).sort();
  }, [allEmployees]);

  // Export Tab 3 to CSV
  const handleExportCSV = () => {
    if (filteredAllEmployees.length === 0) {
      message.warning('Tidak ada data karyawan untuk di-export.');
      return;
    }
    const headers = ['No', 'NIK', 'Nama Karyawan', 'Entitas', 'Departemen', 'Posisi / Jabatan', 'Alur Approval', 'Approver 1', 'Approver 2', 'Tingkat Approval'];
    const rows = filteredAllEmployees.map((e, idx) => [
      idx + 1,
      `"${e.nik || '-'}"`,
      `"${e.name}"`,
      `"${e.entitas_name || '-'}"`,
      `"${e.department || '-'}"`,
      `"${e.position || '-'}"`,
      `"${e.rule_name || '-'}"`,
      `"${e.app1_name || '-'}"`,
      `"${e.is_single_step ? 'Cukup APP 1 (1 Tahap)' : (e.app2_name || '-')}"`,
      `"${e.is_single_step ? '1 Tahap' : '2 Tahap'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Approval_Line_Karyawan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('File CSV berhasil diunduh.');
  };

  // Filtered employees for Tab Rule Global Fallback
  const filteredFallbackEmployees = useMemo(() => {
    const list = fallbackData.employees || [];
    return list.filter((e) => {
      if (fallbackFilterEntitas !== 'all' && e.entitas_name !== fallbackFilterEntitas) {
        return false;
      }
      if (fallbackSearch && fallbackSearch.trim()) {
        const q = fallbackSearch.trim().toLowerCase();
        const searchable = `${e.name} ${e.nik || ''} ${e.position || ''} ${e.department || ''} ${e.entitas_name || ''}`.toLowerCase();
        return searchable.includes(q);
      }
      return true;
    });
  }, [fallbackData.employees, fallbackSearch, fallbackFilterEntitas]);

  // Unique Entitas list for Fallback tab dropdown
  const uniqueFallbackEntities = useMemo(() => {
    const set = new Set();
    (fallbackData.employees || []).forEach((e) => {
      if (e.entitas_name) set.add(e.entitas_name);
    });
    return Array.from(set).sort();
  }, [fallbackData.employees]);

  // Export Fallback employees to CSV
  const handleExportFallbackCSV = () => {
    if (filteredFallbackEmployees.length === 0) {
      message.warning('Tidak ada data karyawan fallback untuk di-export.');
      return;
    }
    const headers = ['No', 'NIK', 'Nama Karyawan', 'Entitas', 'Departemen', 'Posisi / Jabatan', 'Alur Approval', 'Approver 1', 'Approver 2'];
    const rows = filteredFallbackEmployees.map((e, idx) => [
      idx + 1,
      `"${e.nik || '-'}"`,
      `"${e.name}"`,
      `"${e.entitas_name || '-'}"`,
      `"${e.department || '-'}"`,
      `"${e.position || '-'}"`,
      `"Rule Global (Default Fallback)"`,
      `"${fallbackData.rule?.app1_name || 'Jogi Ardyawan'}"`,
      `"${fallbackData.rule?.app2_name || 'Christianus Dwi Haryadi'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Karyawan_Global_Fallback_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('File CSV karyawan fallback berhasil diunduh.');
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = lines.length;
    const activeCount = lines.filter((l) => l.is_active).length;
    const extAppCount = lines.filter((l) => l.app1_is_external || l.app2_is_external).length;
    return { total, activeCount, extAppCount };
  }, [lines]);

  return (
    <div style={{ padding: isMobile ? 12 : 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header Banner */}
      <Card
        className="shadow-sm"
        style={{
          marginBottom: 20,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #0e3a64 0%, #1e5a96 50%, #0284c7 100%)',
          color: '#ffffff',
          border: 'none',
        }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Space align="center" size={14}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: 12,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <BranchesOutlined style={{ fontSize: 28, color: '#ffffff' }} />
              </div>
              <div>
                <Title level={3} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
                  Line Approval Izin & Dokumen
                </Title>
                <Text style={{ color: '#e0f2fe', fontSize: 13 }}>
                  Manajemen dan konfigurasi alur persetujuan permohonan izin karyawan.
                </Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: isMobile ? 'left' : 'right' }}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  if (activeTab === 'all_employees') fetchAllEmployees();
                  else if (activeTab === 'global_fallback') fetchGlobalFallback();
                  else fetchLines();
                }}
                loading={loading || loadingAllEmployees || loadingFallback}
                style={{ borderRadius: 8 }}
              >
                Refresh
              </Button>
              {(activeTab === 'hermes360' || activeTab === 'integrated_apps') && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleOpenCreate}
                  style={{
                    background: '#16a34a',
                    borderColor: '#16a34a',
                    borderRadius: 8,
                    fontWeight: 600,
                  }}
                >
                  Tambah Alur Approval
                </Button>
              )}
              {activeTab === 'global_fallback' && (
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  loading={savingFallback}
                  onClick={() => fallbackForm.submit()}
                  style={{
                    background: '#d97706',
                    borderColor: '#d97706',
                    borderRadius: 8,
                    fontWeight: 600,
                  }}
                >
                  Simpan Alur Global
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm" style={{ borderRadius: 10 }}>
            <Statistic
              title={<Text type="secondary">Total Grup Approval</Text>}
              value={stats.total}
              prefix={<ApartmentOutlined style={{ color: '#0284c7' }} />}
              valueStyle={{ fontWeight: 700, color: '#0f172a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm" style={{ borderRadius: 10 }}>
            <Statistic
              title={<Text type="secondary">Status Aktif</Text>}
              value={stats.activeCount}
              prefix={<CheckCircleOutlined style={{ color: '#16a34a' }} />}
              valueStyle={{ fontWeight: 700, color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm" style={{ borderRadius: 10 }}>
            <Statistic
              title={<Text type="secondary">Karyawan Global Fallback</Text>}
              value={fallbackData.employees.length}
              prefix={<BranchesOutlined style={{ color: '#d97706' }} />}
              valueStyle={{ fontWeight: 700, color: '#d97706' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Tabs Card */}
      <Card
        className="shadow-sm"
        style={{ borderRadius: 12 }}
        bodyStyle={{ padding: isMobile ? 12 : 20 }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setSearch('');
          }}
          type="card"
          items={[
            {
              key: 'hermes360',
              label: (
                <Space>
                  <AppstoreOutlined />
                  <span>Alur Khusus Unit</span>
                  {lines.length > 0 && <Badge count={lines.length} overflowCount={99} style={{ backgroundColor: '#0284c7' }} />}
                </Space>
              ),
            },
            {
              key: 'global_fallback',
              label: (
                <Space>
                  <BranchesOutlined style={{ color: '#d97706' }} />
                  <span>Alur Global (Fallback)</span>
                  {fallbackData.employees.length > 0 && (
                    <Badge count={fallbackData.employees.length} overflowCount={999} style={{ backgroundColor: '#d97706' }} />
                  )}
                </Space>
              ),
            },
            {
              key: 'all_employees',
              label: (
                <Space>
                  <TeamOutlined style={{ color: '#16a34a' }} />
                  <span>Daftar Karyawan</span>
                  {allEmployees.length > 0 && (
                    <Badge count={allEmployees.length} overflowCount={999} style={{ backgroundColor: '#16a34a' }} />
                  )}
                </Space>
              ),
            },
            {
              key: 'integrated_apps',
              label: (
                <Space>
                  <CloudSyncOutlined />
                  <span>Integrated Apps</span>
                </Space>
              ),
            },
          ]}
        />

        {/* TAB 1 & TAB 4: Hermes 360 / Integrated Apps Rules */}
        {(activeTab === 'hermes360' || activeTab === 'integrated_apps') && (
          <>
            {/* Toolbar Filter */}
            <Row justify="space-between" align="middle" style={{ marginBottom: 16, marginTop: 8 }} gutter={[12, 12]}>
              <Col xs={24} sm={12} md={8}>
                <Input
                  placeholder="Cari alur approval..."
                  prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  allowClear
                  style={{ borderRadius: 8 }}
                />
              </Col>
              <Col xs={24} sm={12} style={{ textAlign: isMobile ? 'left' : 'right' }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Menampilkan {lines.length} alur approval
                </Text>
              </Col>
            </Row>

            {/* Rules Table */}
            <Table
              columns={activeTab === 'hermes360' ? hermesColumns : integratedColumns}
              dataSource={lines}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: 1000 }}
              bordered
              size="middle"
            />
          </>
        )}

        {/* TAB 2: Rule Global (Default Fallback) */}
        {activeTab === 'global_fallback' && (
          <div>
            {/* Inline Panel Konfigurasi Approver Alur Global */}
            <Card
              style={{
                borderRadius: 12,
                marginBottom: 20,
                border: '1px solid #fed7aa',
                background: '#fffdf7',
                boxShadow: '0 2px 8px rgba(217, 119, 6, 0.08)',
              }}
              bodyStyle={{ padding: 20 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Space align="center" size={12}>
                  <BranchesOutlined style={{ fontSize: 24, color: '#d97706' }} />
                  <div>
                    <Text strong style={{ fontSize: 16, color: '#92400e', display: 'block' }}>
                      Konfigurasi Alur Persetujuan Global (Fallback)
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13, color: '#b45309' }}>
                      Pilih approver langsung di bawah ini. Alur ini berlaku otomatis bagi karyawan yang tidak terpetakan ke alur khusus unit.
                    </Text>
                  </div>
                </Space>
                <Space>
                  <Button
                    icon={<UndoOutlined />}
                    onClick={() => {
                      if (fallbackData.rule) {
                        const r = fallbackData.rule;
                        fallbackForm.setFieldsValue({
                          app1_user_id: r.app1_user_id,
                          app1_name: r.app1_name,
                          app1_email: r.app1_email,
                          app1_is_external: Boolean(r.app1_is_external),
                          app2_user_id: r.app2_user_id,
                          app2_name: r.app2_name,
                          app2_email: r.app2_email,
                          app2_is_external: Boolean(r.app2_is_external),
                          notes: r.notes || '',
                        });
                        message.info('Form dikembalikan ke data tersimpan.');
                      }
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    loading={savingFallback}
                    onClick={() => fallbackForm.submit()}
                    style={{ background: '#d97706', borderColor: '#d97706', fontWeight: 600 }}
                  >
                    Simpan Alur Global
                  </Button>
                </Space>
              </div>

              <Form
                form={fallbackForm}
                layout="vertical"
                onFinish={handleSaveFallback}
              >
                <Row gutter={[16, 16]}>
                  {/* Approver 1 (Col 12) */}
                  <Col xs={24} md={12}>
                    <Card
                      size="small"
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 10,
                        height: '100%',
                      }}
                      bodyStyle={{ padding: 16 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text strong style={{ color: '#0284c7', fontSize: 14 }}>
                          <IdcardOutlined style={{ marginRight: 6 }} />
                          Approver 1 (APP 1)
                        </Text>
                        <Form.Item name="app1_is_external" valuePropName="checked" noStyle>
                          <Switch
                            checkedChildren="Eksternal"
                            unCheckedChildren="Internal"
                            style={{ background: fallbackApp1IsExternal ? '#f59e0b' : '#0284c7' }}
                          />
                        </Form.Item>
                      </div>

                      <Form.Item name="app1_user_id" noStyle><Input type="hidden" /></Form.Item>

                      {!fallbackApp1IsExternal ? (
                        <>
                          <Form.Item label="Pilih User Internal (Hermes360)" required style={{ marginBottom: 10 }}>
                            <Select
                              showSearch
                              placeholder="Ketik nama atau jabatan user..."
                              loading={loadingUsers}
                              options={userSelectOptions}
                              filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                              }
                              value={fallbackForm.getFieldValue('app1_user_id') || undefined}
                              onChange={(selectedUserId) => {
                                const sel = hermesUsers.find((u) => u.id === selectedUserId);
                                if (sel) {
                                  fallbackForm.setFieldsValue({
                                    app1_user_id: sel.id,
                                    app1_name: sel.name,
                                    app1_email: sel.email || '',
                                  });
                                }
                              }}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                          <Row gutter={8}>
                            <Col span={12}>
                              <Form.Item
                                name="app1_name"
                                label="Nama User"
                                rules={[{ required: true, message: 'Wajib pilih user' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <Input readOnly placeholder="-" style={{ background: '#f8fafc' }} />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="app1_email" label="Email User" style={{ marginBottom: 0 }}>
                                <Input readOnly placeholder="-" style={{ background: '#f8fafc' }} />
                              </Form.Item>
                            </Col>
                          </Row>
                        </>
                      ) : (
                        <>
                          <Form.Item
                            name="app1_name"
                            label="Nama Approver Eksternal"
                            rules={[{ required: true, message: 'Nama approver wajib diisi' }]}
                            style={{ marginBottom: 10 }}
                          >
                            <Input placeholder="Nama lengkap approver..." />
                          </Form.Item>
                          <Form.Item
                            name="app1_email"
                            label="Email Approver Eksternal"
                            rules={[
                              { required: true, message: 'Email approver wajib diisi' },
                              { type: 'email', message: 'Format email tidak valid' },
                            ]}
                            style={{ marginBottom: 0 }}
                          >
                            <Input placeholder="email@delmargroup.id" />
                          </Form.Item>
                        </>
                      )}
                    </Card>
                  </Col>

                  {/* Approver 2 (Col 12) */}
                  <Col xs={24} md={12}>
                    <Card
                      size="small"
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 10,
                        height: '100%',
                      }}
                      bodyStyle={{ padding: 16 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Space size={8}>
                          <Text strong style={{ color: '#16a34a', fontSize: 14 }}>
                            <IdcardOutlined style={{ marginRight: 6 }} />
                            Approver 2 (APP 2) - Opsional
                          </Text>
                          <Button
                            size="small"
                            type="link"
                            danger
                            style={{ padding: 0 }}
                            onClick={() => {
                              fallbackForm.setFieldsValue({
                                app2_user_id: null,
                                app2_name: null,
                                app2_email: null,
                              });
                              message.info('Approver 2 dikosongkan (Alur menjadi 1 Tahap)');
                            }}
                          >
                            Kosongkan (1 Tahap)
                          </Button>
                        </Space>
                        <Form.Item name="app2_is_external" valuePropName="checked" noStyle>
                          <Switch
                            checkedChildren="Eksternal"
                            unCheckedChildren="Internal"
                            style={{ background: fallbackApp2IsExternal ? '#f59e0b' : '#16a34a' }}
                          />
                        </Form.Item>
                      </div>

                      <Form.Item name="app2_user_id" noStyle><Input type="hidden" /></Form.Item>

                      {!fallbackApp2IsExternal ? (
                        <>
                          <Form.Item label="Pilih User Internal (Hermes360)" style={{ marginBottom: 10 }}>
                            <Select
                              showSearch
                              allowClear
                              placeholder="Pilih user atau kosongkan jika 1 tahap..."
                              loading={loadingUsers}
                              options={userSelectOptions}
                              filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                              }
                              value={fallbackForm.getFieldValue('app2_user_id') || undefined}
                              onChange={(selectedUserId) => {
                                if (!selectedUserId) {
                                  fallbackForm.setFieldsValue({
                                    app2_user_id: null,
                                    app2_name: null,
                                    app2_email: null,
                                  });
                                  return;
                                }
                                const sel = hermesUsers.find((u) => u.id === selectedUserId);
                                if (sel) {
                                  fallbackForm.setFieldsValue({
                                    app2_user_id: sel.id,
                                    app2_name: sel.name,
                                    app2_email: sel.email || '',
                                  });
                                }
                              }}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                          <Row gutter={8}>
                            <Col span={12}>
                              <Form.Item name="app2_name" label="Nama User" style={{ marginBottom: 0 }}>
                                <Input readOnly placeholder="-" style={{ background: '#f8fafc' }} />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="app2_email" label="Email User" style={{ marginBottom: 0 }}>
                                <Input readOnly placeholder="-" style={{ background: '#f8fafc' }} />
                              </Form.Item>
                            </Col>
                          </Row>
                        </>
                      ) : (
                        <>
                          <Form.Item
                            name="app2_name"
                            label="Nama Approver Eksternal"
                            style={{ marginBottom: 10 }}
                          >
                            <Input placeholder="Nama lengkap approver..." />
                          </Form.Item>
                          <Form.Item
                            name="app2_email"
                            label="Email Approver Eksternal"
                            rules={[
                              { type: 'email', message: 'Format email tidak valid' },
                            ]}
                            style={{ marginBottom: 0 }}
                          >
                            <Input placeholder="email@delmargroup.id" />
                          </Form.Item>
                        </>
                      )}
                    </Card>
                  </Col>
                </Row>
              </Form>
            </Card>

            {/* Toolbar Filter Karyawan Fallback */}
            <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} md={10}>
                <Input
                  placeholder="Cari karyawan..."
                  prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                  value={fallbackSearch}
                  onChange={(e) => setFallbackSearch(e.target.value)}
                  allowClear
                  style={{ borderRadius: 8 }}
                />
              </Col>
              <Col xs={24} sm={6} md={6}>
                <Select
                  value={fallbackFilterEntitas}
                  onChange={setFallbackFilterEntitas}
                  style={{ width: '100%', borderRadius: 8 }}
                  options={[
                    { value: 'all', label: 'Semua Entitas' },
                    ...uniqueFallbackEntities.map((e) => ({ value: e, label: e })),
                  ]}
                />
              </Col>
              <Col xs={24} md={8} style={{ textAlign: isMobile ? 'left' : 'right' }}>
                <Space>
                  <Tag color="gold" style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6 }}>
                    {filteredFallbackEmployees.length} Karyawan
                  </Tag>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleExportFallbackCSV}
                    style={{ borderRadius: 8, borderColor: '#d97706', color: '#d97706' }}
                  >
                    Export CSV
                  </Button>
                </Space>
              </Col>
            </Row>

            {/* Table of Fallback Employees */}
            <Table
              dataSource={filteredFallbackEmployees}
              rowKey="id"
              loading={loadingFallback}
              pagination={{
                pageSize: 15,
                showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} karyawan`,
                showSizeChanger: true,
                pageSizeOptions: ['15', '30', '50', '100'],
              }}
              scroll={{ x: 1000 }}
              bordered
              size="middle"
              columns={[
                {
                  title: 'No',
                  key: 'no',
                  width: 55,
                  align: 'center',
                  render: (_, __, idx) => idx + 1,
                },
                {
                  title: 'Karyawan',
                  key: 'employee',
                  width: 220,
                  render: (_, r) => (
                    <div>
                      <Text strong style={{ color: '#0f172a', fontSize: 13 }}>{r.name}</Text>
                      <div><Text type="secondary" style={{ fontSize: 11 }}>NIK: {r.nik || '-'}</Text></div>
                    </div>
                  ),
                },
                {
                  title: 'Entitas',
                  key: 'entitas',
                  width: 120,
                  align: 'center',
                  render: (_, r) => (
                    <Tag color="cyan" style={{ fontWeight: 600 }}>{r.entitas_name || '-'}</Tag>
                  ),
                },
                {
                  title: 'Departemen & Jabatan',
                  key: 'dept_pos',
                  width: 240,
                  render: (_, r) => (
                    <div>
                      <div style={{ fontWeight: 500 }}>{r.department || '-'}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{r.position || '-'}</Text>
                    </div>
                  ),
                },
                {
                  title: 'Alur Approval',
                  key: 'rule_name',
                  width: 220,
                  render: () => (
                    <Tag color="gold" style={{ fontWeight: 600, fontSize: 12, padding: '2px 8px' }}>
                      ⚡ Rule Global (Default Fallback)
                    </Tag>
                  ),
                },
                {
                  title: 'Approver 1',
                  key: 'app1',
                  width: 180,
                  render: () =>
                    renderApprover(fallbackData.rule?.app1_name || 'Jogi Ardyawan', fallbackData.rule?.app1_email || 'jogi@delmargroup.id', fallbackData.rule?.app1_is_external),
                },
                {
                  title: 'Approver 2',
                  key: 'app2',
                  width: 180,
                  render: () =>
                    renderApprover(fallbackData.rule?.app2_name || 'Christianus Dwi Haryadi', fallbackData.rule?.app2_email || 'christian@delmargroup.id', fallbackData.rule?.app2_is_external),
                },
              ]}
            />
          </div>
        )}

        {/* TAB 3: Semua Line Approval Karyawan */}
        {activeTab === 'all_employees' && (
          <div>
            {/* Filter Bar */}
            <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 16, marginTop: 8 }}>
              <Col xs={24} sm={12} md={8}>
                <Input
                  placeholder="Cari karyawan..."
                  prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                  value={allEmpSearch}
                  onChange={(e) => setAllEmpSearch(e.target.value)}
                  allowClear
                  style={{ borderRadius: 8 }}
                />
              </Col>
              <Col xs={24} sm={6} md={5}>
                <Select
                  value={filterEntitas}
                  onChange={setFilterEntitas}
                  style={{ width: '100%', borderRadius: 8 }}
                  options={[
                    { value: 'all', label: 'Semua Entitas' },
                    ...uniqueEntities.map((e) => ({ value: e, label: e })),
                  ]}
                />
              </Col>
              <Col xs={24} sm={6} md={6}>
                <Select
                  value={filterRule}
                  onChange={setFilterRule}
                  style={{ width: '100%', borderRadius: 8 }}
                  options={[
                    { value: 'all', label: 'Semua Alur' },
                    ...lines.map((r) => ({ value: String(r.id), label: r.position })),
                  ]}
                />
              </Col>
              <Col xs={24} md={5} style={{ textAlign: isMobile ? 'left' : 'right' }}>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleExportCSV}
                  style={{ borderRadius: 8, borderColor: '#16a34a', color: '#16a34a' }}
                >
                  Export CSV
                </Button>
              </Col>
            </Row>

            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tag color="green" style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6 }}>
                Total Karyawan: {filteredAllEmployees.length}
              </Tag>
            </div>

            {/* Table of All Employees */}
            <Table
              dataSource={filteredAllEmployees}
              rowKey="id"
              loading={loadingAllEmployees}
              pagination={{
                pageSize: 15,
                showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} karyawan`,
                showSizeChanger: true,
                pageSizeOptions: ['15', '30', '50', '100'],
              }}
              scroll={{ x: 1100 }}
              bordered
              size="middle"
              columns={[
                {
                  title: 'No',
                  width: 50,
                  align: 'center',
                  render: (_, __, idx) => idx + 1,
                },
                {
                  title: 'Nama Karyawan',
                  dataIndex: 'name',
                  key: 'name',
                  width: 200,
                  render: (text, record) => (
                    <div>
                      <Text strong style={{ fontSize: 13.5, color: '#0f172a' }}>
                        {text}
                      </Text>
                      {record.nik && (
                        <div style={{ fontSize: 11, color: '#64748b' }}>NIK: {record.nik}</div>
                      )}
                    </div>
                  ),
                },
                {
                  title: 'Entitas',
                  dataIndex: 'entitas_name',
                  key: 'entitas_name',
                  width: 110,
                  render: (text) => (
                    <Tag color="cyan" style={{ fontWeight: 600, fontSize: 11.5 }}>
                      {text || 'General'}
                    </Tag>
                  ),
                },
                {
                  title: 'Departemen & Jabatan',
                  key: 'dept_pos',
                  width: 220,
                  render: (_, record) => (
                    <div style={{ lineHeight: 1.35 }}>
                      <div style={{ fontWeight: 600, color: '#334155', fontSize: 12.5 }}>
                        {record.position || '-'}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>
                        {record.department || '-'}
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Alur Approval yang Cocok',
                  dataIndex: 'rule_name',
                  key: 'rule_name',
                  width: 200,
                  render: (text) => (
                    <Tag color="geekblue" style={{ fontWeight: 600, fontSize: 12, padding: '2px 8px' }}>
                      📁 {text || 'Operasional Lapangan (Default)'}
                    </Tag>
                  ),
                },
                {
                  title: 'Approver 1',
                  key: 'app1',
                  width: 180,
                  render: (_, record) =>
                    renderApprover(record.app1_name, record.app1_email, record.app1_is_external),
                },
                {
                  title: 'Approver 2',
                  key: 'app2',
                  width: 180,
                  render: (_, record) =>
                    record.is_single_step ? (
                      <Tag color="cyan" style={{ fontSize: 11, padding: '2px 6px' }}>
                        Cukup APP 1 (1 Tahap)
                      </Tag>
                    ) : (
                      renderApprover(record.app2_name, record.app2_email, record.app2_is_external)
                    ),
                },
                {
                  title: 'Tingkat',
                  key: 'step_type',
                  width: 90,
                  align: 'center',
                  render: (_, record) =>
                    record.is_single_step ? (
                      <Tag color="green" style={{ fontSize: 11 }}>1 Tahap</Tag>
                    ) : (
                      <Tag color="purple" style={{ fontSize: 11 }}>2 Tahap</Tag>
                    ),
                },
              ]}
            />
          </div>
        )}
      </Card>

      {/* MODAL 1: Cek Daftar Karyawan per Alur yang Dipilih */}
      <Modal
        title={
          <Space>
            <TeamOutlined style={{ color: '#16a34a', fontSize: 18 }} />
            <span>Daftar Karyawan dalam Alur Approval</span>
          </Space>
        }
        open={isEmpModalOpen}
        onCancel={() => setIsEmpModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsEmpModalOpen(false)}>
            Tutup
          </Button>,
        ]}
        width={850}
        destroyOnClose
      >
        {selectedRuleRecord && (
          <div>
            {/* Header info alur */}
            <Card
              size="small"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <Row gutter={[16, 12]} align="middle">
                <Col xs={24} sm={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Alur Approval:</Text>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                    {selectedRuleRecord.position}
                  </div>
                  <Tag color="cyan" style={{ marginTop: 4 }}>
                    {selectedRuleRecord.entitas_name || 'Semua Entitas'}
                  </Tag>
                </Col>
                <Col xs={24} sm={12}>
                  <Row gutter={8}>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 11.5 }}>Approver 1:</Text>
                      <div style={{ fontWeight: 600, fontSize: 12.5 }}>
                        {selectedRuleRecord.app1_name}
                      </div>
                      <Tag color={selectedRuleRecord.app1_is_external ? 'volcano' : 'blue'} style={{ fontSize: 10 }}>
                        {selectedRuleRecord.app1_is_external ? 'Eksternal' : 'Internal'}
                      </Tag>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 11.5 }}>Approver 2:</Text>
                      <div style={{ fontWeight: 600, fontSize: 12.5 }}>
                        {selectedRuleRecord.app2_name || '-'}
                      </div>
                      <Tag color="cyan" style={{ fontSize: 10 }}>
                        {selectedRuleRecord.app2_name ? (selectedRuleRecord.app2_is_external ? 'Eksternal' : 'Internal') : '1 Tahap'}
                      </Tag>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card>

            {/* Filter Search inside modal */}
            <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
              <Col xs={24} sm={12}>
                <Input
                  placeholder="Cari karyawan..."
                  prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                  value={ruleEmpSearch}
                  onChange={(e) => setRuleEmpSearch(e.target.value)}
                  allowClear
                  size="small"
                  style={{ borderRadius: 6 }}
                />
              </Col>
              <Col xs={24} sm={12} style={{ textAlign: isMobile ? 'left' : 'right' }}>
                <Tag color="green" style={{ fontSize: 12, padding: '2px 8px' }}>
                  {filteredRuleEmployees.length} Karyawan
                </Tag>
              </Col>
            </Row>

            {/* Table of Employees in this rule */}
            <Table
              dataSource={filteredRuleEmployees}
              rowKey="id"
              loading={loadingRuleEmployees}
              size="small"
              bordered
              pagination={{ pageSize: 8, showSizeChanger: false }}
              columns={[
                {
                  title: 'No',
                  width: 45,
                  align: 'center',
                  render: (_, __, idx) => idx + 1,
                },
                {
                  title: 'Nama Karyawan',
                  dataIndex: 'name',
                  key: 'name',
                  render: (text, r) => (
                    <div>
                      <Text strong style={{ fontSize: 13 }}>{text}</Text>
                      {r.nik && <div style={{ fontSize: 11, color: '#64748b' }}>NIK: {r.nik}</div>}
                    </div>
                  ),
                },
                {
                  title: 'Entitas',
                  dataIndex: 'entitas_name',
                  key: 'entitas_name',
                  width: 100,
                  render: (t) => <Tag color="cyan">{t || 'General'}</Tag>,
                },
                {
                  title: 'Departemen & Jabatan',
                  key: 'pos',
                  render: (_, r) => (
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{r.position || '-'}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{r.department || '-'}</div>
                    </div>
                  ),
                },
                {
                  title: 'Status Approval',
                  key: 'status',
                  width: 130,
                  align: 'center',
                  render: (_, r) =>
                    r.is_single_step ? (
                      <Tag color="cyan">1 Tahap (APP 1)</Tag>
                    ) : (
                      <Tag color="purple">2 Tahap (APP 1 & 2)</Tag>
                    ),
                },
              ]}
            />
          </div>
        )}
      </Modal>

      {/* MODAL 2: Add / Edit Line Approval */}
      <Modal
        title={
          <Space>
            <BranchesOutlined style={{ color: '#0284c7' }} />
            <span>{modalMode === 'edit' ? 'Edit Alur Approval' : 'Tambah Alur Approval Baru'}</span>
            <Tag color={activeTab === 'hermes360' ? 'blue' : 'purple'}>
              {activeTab === 'hermes360' ? 'Hermes 360' : 'Integrated Apps'}
            </Tag>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={920}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
          {/* BARIS 1: NAMA ALUR & PRIORITAS */}
          <Row gutter={16}>
            <Col xs={24} sm={18}>
              <Form.Item
                name="position"
                label="Nama Alur Approval"
                rules={[{ required: true, message: 'Nama alur approval wajib diisi' }]}
              >
                <Input placeholder="Nama alur approval" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item
                name="line_order"
                label="Prioritas"
                rules={[{ required: true, message: 'Prioritas wajib diisi' }]}
              >
                <Input type="number" min={1} />
              </Form.Item>
            </Col>
          </Row>

          {/* BARIS 2: KETERANGAN & STATUS ALUR */}
          <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
            <Col xs={24} sm={18}>
              <Form.Item name="notes" label="Keterangan (Opsional)" style={{ marginBottom: 0 }}>
                <Input placeholder="Keterangan alur..." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item name="is_active" label="Status" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" defaultChecked />
              </Form.Item>
            </Col>
          </Row>

          {/* BARIS 3: APPROVER 1 & APPROVER 2 (SIDE-BY-SIDE) */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            {/* Approver 1 (Col 12) */}
            <Col xs={24} md={12}>
              <Card
                size="small"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  height: '100%',
                }}
                bodyStyle={{ padding: 14 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text strong style={{ color: '#0284c7', fontSize: 13.5 }}>
                    <IdcardOutlined style={{ marginRight: 6 }} />
                    Approver 1
                  </Text>
                  <Form.Item name="app1_is_external" valuePropName="checked" noStyle>
                    <Switch
                      checkedChildren="Eksternal"
                      unCheckedChildren="Internal"
                      style={{ background: app1IsExternal ? '#f59e0b' : '#0284c7' }}
                    />
                  </Form.Item>
                </div>

                <Form.Item name="app1_user_id" noStyle><Input type="hidden" /></Form.Item>

                {!app1IsExternal ? (
                  <>
                    <Form.Item label="Pilih User Internal" required style={{ marginBottom: 8 }}>
                      <Select
                        showSearch
                        placeholder="Pilih user..."
                        loading={loadingUsers}
                        options={userSelectOptions}
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        value={form.getFieldValue('app1_user_id') || undefined}
                        onChange={(selectedUserId) => {
                          const sel = hermesUsers.find((u) => u.id === selectedUserId);
                          if (sel) {
                            form.setFieldsValue({
                              app1_user_id: sel.id,
                              app1_name: sel.name,
                              app1_email: sel.email || '',
                            });
                          }
                        }}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Row gutter={8}>
                      <Col span={12}>
                        <Form.Item
                          name="app1_name"
                          label="Nama User"
                          rules={[{ required: true, message: 'Pilih user' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input readOnly placeholder="-" style={{ background: '#f1f5f9' }} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="app1_email" label="Email User" style={{ marginBottom: 0 }}>
                          <Input readOnly placeholder="-" style={{ background: '#f1f5f9' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                ) : (
                  <div>
                    <Form.Item
                      name="app1_name"
                      label="Nama Approver"
                      rules={[{ required: true, message: 'Nama approver wajib diisi' }]}
                      style={{ marginBottom: 10 }}
                    >
                      <Input placeholder="Nama approver" />
                    </Form.Item>
                    <Form.Item
                      name="app1_email"
                      label="Email Approver"
                      rules={[
                        { required: true, message: 'Email approver wajib diisi' },
                        { type: 'email', message: 'Format email tidak valid' },
                      ]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input placeholder="email@delmargroup.id" />
                    </Form.Item>
                  </div>
                )}
              </Card>
            </Col>

            {/* Approver 2 (Col 12) */}
            <Col xs={24} md={12}>
              <Card
                size="small"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  height: '100%',
                }}
                bodyStyle={{ padding: 14 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Space size={6}>
                    <Text strong style={{ color: '#0284c7', fontSize: 13.5 }}>
                      <IdcardOutlined style={{ marginRight: 6 }} />
                      Approver 2 (Opsional)
                    </Text>
                    <Button
                      size="small"
                      type="link"
                      danger
                      onClick={() => {
                        form.setFieldsValue({
                          app2_user_id: null,
                          app2_name: null,
                          app2_email: null,
                        });
                      }}
                      style={{ fontSize: 11, padding: 0 }}
                    >
                      Kosongkan
                    </Button>
                  </Space>
                  <Form.Item name="app2_is_external" valuePropName="checked" noStyle>
                    <Switch
                      checkedChildren="Eksternal"
                      unCheckedChildren="Internal"
                      style={{ background: app2IsExternal ? '#f59e0b' : '#0284c7' }}
                    />
                  </Form.Item>
                </div>

                <Form.Item name="app2_user_id" noStyle><Input type="hidden" /></Form.Item>

                {!app2IsExternal ? (
                  <>
                    <Form.Item label="Pilih User Internal (Opsional)" style={{ marginBottom: 8 }}>
                      <Select
                        showSearch
                        allowClear
                        placeholder="Pilih user..."
                        loading={loadingUsers}
                        options={userSelectOptions}
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        value={form.getFieldValue('app2_user_id') || undefined}
                        onChange={(selectedUserId) => {
                          if (!selectedUserId) {
                            form.setFieldsValue({
                              app2_user_id: null,
                              app2_name: null,
                              app2_email: null,
                            });
                            return;
                          }
                          const sel = hermesUsers.find((u) => u.id === selectedUserId);
                          if (sel) {
                            form.setFieldsValue({
                              app2_user_id: sel.id,
                              app2_name: sel.name,
                              app2_email: sel.email || '',
                            });
                          }
                        }}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Row gutter={8}>
                      <Col span={12}>
                        <Form.Item name="app2_name" label="Nama User" style={{ marginBottom: 0 }}>
                          <Input readOnly placeholder="-" style={{ background: '#f1f5f9' }} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="app2_email" label="Email User" style={{ marginBottom: 0 }}>
                          <Input readOnly placeholder="-" style={{ background: '#f1f5f9' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                ) : (
                  <div>
                    <Form.Item
                      name="app2_name"
                      label="Nama Approver"
                      style={{ marginBottom: 10 }}
                    >
                      <Input placeholder="Nama approver" />
                    </Form.Item>
                    <Form.Item
                      name="app2_email"
                      label="Email Approver (Opsional)"
                      rules={[{ type: 'email', message: 'Format email tidak valid' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input placeholder="email@delmargroup.id" />
                    </Form.Item>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {activeTab === 'integrated_apps' && (
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="doc_type"
                  label="Tipe Dokumen"
                  rules={[{ required: true, message: 'Tipe dokumen wajib diisi' }]}
                >
                  <Input placeholder="Tipe dokumen" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="entitas_name" label="Entitas">
                  <Input placeholder="Nama entitas" />
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* PENCARIAN DATA KARYAWAN */}
          <Card
            size="small"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              marginBottom: 16,
            }}
            bodyStyle={{ padding: 12 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Space size={6}>
                <SearchOutlined style={{ color: '#0284c7', fontSize: 15 }} />
                <Text strong style={{ color: '#0f172a', fontSize: 13 }}>
                  Pencarian Data Karyawan
                </Text>
                <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>Referensi</Tag>
              </Space>
              {selectedHelpEmployee && (
                <Button
                  size="small"
                  type="link"
                  onClick={() => setSelectedHelpEmployeeId(null)}
                  style={{ fontSize: 12, padding: 0, color: '#dc2626' }}
                >
                  Reset
                </Button>
              )}
            </div>

            <Select
              showSearch
              allowClear
              placeholder="Cari nama karyawan atau NIK..."
              value={selectedHelpEmployeeId}
              onChange={(val) => setSelectedHelpEmployeeId(val)}
              filterOption={(input, option) => {
                if (!input) return true;
                return (option?.searchKey || '').includes(input.toLowerCase());
              }}
              style={{ width: '100%' }}
              options={allOrgEmployees.map((emp) => ({
                value: `${emp.entitas_name}_${emp.id}`,
                searchKey: emp.searchKey,
                label: (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span>
                      <strong>{emp.name}</strong>{' '}
                      <span style={{ color: '#64748b', fontSize: 11 }}>({emp.nik || '-'})</span>
                    </span>
                    <Space size={4}>
                      <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>{emp.entitas_name}</Tag>
                      <Tag color="cyan" style={{ fontSize: 10, margin: 0 }}>{emp.department || '-'}</Tag>
                      <Tag color="purple" style={{ fontSize: 10, margin: 0 }}>{emp.position || '-'}</Tag>
                    </Space>
                  </div>
                ),
              }))}
            />

            {selectedHelpEmployee && (
              <div
                style={{
                  marginTop: 10,
                  padding: 10,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 13.5, color: '#0f172a' }}>
                      {selectedHelpEmployee.name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                      (NIK: {selectedHelpEmployee.nik || '-'})
                    </Text>
                  </div>
                  <Space size={8} wrap>
                    <div>
                      <Text type="secondary" style={{ fontSize: 11, marginRight: 4 }}>Entitas:</Text>
                      <Tag color="blue" style={{ fontWeight: 600 }}>{selectedHelpEmployee.entitas_name}</Tag>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 11, marginRight: 4 }}>Departemen:</Text>
                      <Tag color="cyan" style={{ fontWeight: 600 }}>{selectedHelpEmployee.department || '-'}</Tag>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 11, marginRight: 4 }}>Posisi / Jabatan:</Text>
                      <Tag color="purple" style={{ fontWeight: 600 }}>{selectedHelpEmployee.position || '-'}</Tag>
                    </div>
                  </Space>
                </div>

                <Button
                  type="primary"
                  icon={<PlusCircleOutlined />}
                  onClick={() => handleApplyEmployeeToScope(selectedHelpEmployee)}
                  style={{
                    background: '#0284c7',
                    borderColor: '#0284c7',
                    fontWeight: 600,
                    borderRadius: 6,
                  }}
                >
                  Terapkan ke Cakupan
                </Button>
              </div>
            )}
          </Card>

          {/* 1. SELEKSI ENTITAS */}
          <Card
            size="small"
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 10,
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Space>
                <ApartmentOutlined style={{ color: '#0284c7', fontSize: 16 }} />
                <Text strong style={{ fontSize: 13.5, color: '#1e293b' }}>
                  1. Cakupan Entitas
                </Text>
                {selectedEntityNames.length > 0 && (
                  <Tag color="blue">{selectedEntityNames.length} Entitas</Tag>
                )}
              </Space>
              <Space size="small">
                <Button
                  size="small"
                  type="link"
                  onClick={handleSelectAllEntities}
                  style={{ fontSize: 12, padding: '0 4px' }}
                >
                  Pilih Semua
                </Button>
                <Divider type="vertical" />
                <Button
                  size="small"
                  type="link"
                  danger
                  onClick={handleClearAllEntities}
                  style={{ fontSize: 12, padding: '0 4px' }}
                >
                  Reset
                </Button>
              </Space>
            </div>

            <Select
              mode="multiple"
              placeholder="Pilih entitas..."
              value={selectedEntityNames}
              onChange={handleEntitySelectionChange}
              style={{ width: '100%' }}
              options={(orgStructure.entities || []).map((e) => ({
                value: e.name,
                label: `${e.name} (${e.employee_count} Karyawan)`,
              }))}
            />

            {selectedEntityNames.length === 0 && (
              <Alert
                type="info"
                showIcon
                style={{ marginTop: 10, fontSize: 12 }}
                message="Pilih minimal satu entitas untuk menentukan departemen dan posisi."
              />
            )}
          </Card>

          {/* 2. DYNAMIC TABS PER ENTITAS */}
          {selectedEntityNames.length > 0 && (
            <Card
              size="small"
              style={{
                background: '#ffffff',
                border: '1px solid #0284c7',
                borderRadius: 10,
                marginBottom: 16,
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Space>
                  <ClusterOutlined style={{ color: '#0284c7', fontSize: 16 }} />
                  <Text strong style={{ fontSize: 13.5, color: '#0369a1' }}>
                    2. Pengaturan Departemen & Posisi
                  </Text>
                </Space>
                <Tag color="cyan" style={{ fontSize: 12 }}>
                  {totalModalMatchedEmployees} Karyawan Tercakup
                </Tag>
              </div>

              <Tabs
                type="card"
                activeKey={activeModalEntityTab}
                onChange={setActiveModalEntityTab}
                items={selectedEntityNames.map((entName) => {
                  const entData = (orgStructure.entities || []).find((e) => e.name === entName) || {
                    departments: [],
                    positions: [],
                    employees: [],
                  };
                  const currentScope = entityScopeMap[entName] || { departments: [], positions: [], excluded_employee_ids: [] };
                  const matchedEmployeesInEnt = getMatchedEmployeesForEntity(entName);
                  const excludedEmployeesInEnt = getExcludedEmployeesForEntity(entName);

                  return {
                    key: entName,
                    label: (
                      <span>
                        <ApartmentOutlined style={{ marginRight: 4 }} />
                        <strong>{entName}</strong>
                        <Badge
                          count={matchedEmployeesInEnt.length}
                          style={{
                            backgroundColor: matchedEmployeesInEnt.length > 0 ? '#10b981' : '#94a3b8',
                            marginLeft: 8,
                          }}
                        />
                      </span>
                    ),
                    children: (
                      <div style={{ padding: '8px 4px' }}>
                        {/* DEPARTEMEN SECTION */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <Text strong style={{ fontSize: 13, color: '#334155' }}>
                              Departemen ({currentScope.departments?.length || 0} dipilih)
                            </Text>
                            <Space size="small">
                              <Button
                                size="small"
                                type="text"
                                style={{ fontSize: 11.5, color: '#0284c7', padding: '0 4px' }}
                                onClick={() => handleSelectAllDeptsForEntity(entName)}
                              >
                                Pilih Semua
                              </Button>
                              <Button
                                size="small"
                                type="text"
                                style={{ fontSize: 11.5, color: '#ef4444', padding: '0 4px' }}
                                onClick={() => handleClearAllDeptsForEntity(entName)}
                              >
                                Reset
                              </Button>
                            </Space>
                          </div>
                          <Select
                            mode="tags"
                            style={{ width: '100%' }}
                            placeholder="Pilih departemen..."
                            value={currentScope.departments || []}
                            onChange={(val) => handleDepartmentsChange(entName, val)}
                            options={entData.departments.map((d) => ({
                              value: d,
                              label: d,
                            }))}
                          />
                        </div>

                        {/* POSISI / JABATAN SECTION */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <Text strong style={{ fontSize: 13, color: '#334155' }}>
                              Posisi / Jabatan ({currentScope.positions?.length || 0} dipilih)
                            </Text>
                            <Space size="small">
                              <Button
                                size="small"
                                type="text"
                                style={{ fontSize: 11.5, color: '#0284c7', padding: '0 4px' }}
                                onClick={() => handleSelectAllPositionsForEntity(entName)}
                              >
                                Pilih Semua
                              </Button>
                              <Button
                                size="small"
                                type="text"
                                style={{ fontSize: 11.5, color: '#ef4444', padding: '0 4px' }}
                                onClick={() => handleClearAllPositionsForEntity(entName)}
                              >
                                Reset
                              </Button>
                            </Space>
                          </div>
                          <Select
                            mode="tags"
                            style={{ width: '100%' }}
                            placeholder="Pilih posisi / jabatan..."
                            value={currentScope.positions || []}
                            onChange={(val) => handlePositionsChange(entName, val)}
                            options={entData.positions.map((p) => ({
                              value: p,
                              label: p,
                            }))}
                          />
                        </div>

                        {/* PENGECUALIAN KARYAWAN TERTENTU */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <Space size={4}>
                              <Text strong style={{ fontSize: 13, color: '#dc2626' }}>
                                Pengecualian Karyawan
                              </Text>
                              {excludedEmployeesInEnt.length > 0 && (
                                <Tag color="error">{excludedEmployeesInEnt.length} Dikecualikan</Tag>
                              )}
                            </Space>
                            {excludedEmployeesInEnt.length > 0 && (
                              <Button
                                size="small"
                                type="link"
                                danger
                                onClick={() => handleExcludedSelectChange(entName, [])}
                                style={{ fontSize: 11.5, padding: '0 4px' }}
                              >
                                Reset
                              </Button>
                            )}
                          </div>
                          <Select
                            mode="multiple"
                            style={{ width: '100%' }}
                            placeholder="Pilih karyawan yang dikecualikan..."
                            value={currentScope.excluded_employee_ids || []}
                            onChange={(val) => handleExcludedSelectChange(entName, val)}
                            options={(entData.employees || []).map((emp) => ({
                              value: emp.id,
                              label: `${emp.name} (${emp.position || '-'}) - ${emp.department || '-'}`,
                            }))}
                            allowClear
                          />
                        </div>

                        {/* LIVE MATCHED EMPLOYEES PREVIEW */}
                        <div
                          style={{
                            background: '#f8fafc',
                            border: '1px dashed #cbd5e1',
                            borderRadius: 8,
                            padding: '12px 14px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                            <Space>
                              <TeamOutlined style={{ color: '#16a34a' }} />
                              <Text strong style={{ fontSize: 12.5, color: '#334155' }}>
                                Daftar Karyawan Tercakup ({matchedEmployeesInEnt.length})
                              </Text>
                            </Space>
                          </div>

                          {matchedEmployeesInEnt.length === 0 ? (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Tidak ada karyawan yang memenuhi kriteria cakupan.
                            </Text>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 130, overflowY: 'auto', padding: '2px 0' }}>
                              {matchedEmployeesInEnt.map((emp) => (
                                <Tooltip key={emp.id} title={`Keluarkan ${emp.name} dari alur ini`}>
                                  <Tag
                                    color="geekblue"
                                    closable
                                    onClose={(e) => {
                                      e.preventDefault();
                                      handleExcludeEmployee(entName, emp.id);
                                    }}
                                    style={{
                                      fontSize: 11,
                                      padding: '3px 8px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      borderRadius: 4,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <strong>{emp.name}</strong>&nbsp;({emp.position || '-'})
                                  </Tag>
                                </Tooltip>
                              ))}
                            </div>
                          )}

                          {/* DAFTAR KARYAWAN DIKECUALIKAN */}
                          {excludedEmployeesInEnt.length > 0 && (
                            <div
                              style={{
                                marginTop: 12,
                                padding: '10px 12px',
                                background: '#fef2f2',
                                border: '1px dashed #f87171',
                                borderRadius: 8,
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <Text strong style={{ fontSize: 12, color: '#b91c1c' }}>
                                  Karyawan Dikecualikan ({excludedEmployeesInEnt.length})
                                </Text>
                                <Button
                                  size="small"
                                  type="link"
                                  danger
                                  onClick={() => handleExcludedSelectChange(entName, [])}
                                  style={{ fontSize: 11, padding: 0 }}
                                >
                                  Reset
                                </Button>
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {excludedEmployeesInEnt.map((emp) => (
                                  <Tooltip key={emp.id} title={`Kembalikan ${emp.name} ke alur ini`}>
                                    <Tag
                                      color="error"
                                      closable
                                      closeIcon={<UndoOutlined style={{ fontSize: 11 }} />}
                                      onClose={(e) => {
                                        e.preventDefault();
                                        handleRestoreEmployee(entName, emp.id);
                                      }}
                                      style={{
                                        fontSize: 11,
                                        padding: '3px 8px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <del>{emp.name}</del>&nbsp;({emp.position || '-'})
                                    </Tag>
                                  </Tooltip>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ),
                  };
                })}
              />
            </Card>
          )}

          <Divider style={{ margin: '12px 0 20px 0' }} />

          <Row justify="space-between" align="middle" style={{ marginTop: 8 }}>
            <Col>
              {selectedEntityNames.length > 0 && (
                <Tag color="blue" style={{ fontSize: 12.5, padding: '4px 10px' }}>
                  <strong>{totalModalMatchedEmployees} Karyawan</strong> tercakup
                </Tag>
              )}
            </Col>
            <Col>
              <Space>
                <Button onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="primary" htmlType="submit" loading={saving} style={{ background: '#0284c7' }}>
                  Simpan
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* MODAL 3: Preview Hasil Simulasi Kata Kunci di Form Add/Edit */}
      <Modal
        title={
          <Space>
            <TeamOutlined style={{ color: '#0284c7' }} />
            <span>Simulasi Karyawan yang Masuk Kata Kunci</span>
          </Space>
        }
        open={previewKeywordsModalOpen}
        onCancel={() => setPreviewKeywordsModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setPreviewKeywordsModalOpen(false)}>
            Tutup Simulasi
          </Button>,
        ]}
        width={700}
        destroyOnClose
      >
        <Alert
          message={`Ditemukan ${previewEmployees.length} karyawan yang cocok dengan kata kunci yang Anda masukkan saat ini.`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Table
          dataSource={previewEmployees}
          rowKey="id"
          loading={loadingKeywordPreview}
          size="small"
          bordered
          pagination={{ pageSize: 8, showSizeChanger: false }}
          columns={[
            {
              title: 'No',
              width: 45,
              align: 'center',
              render: (_, __, idx) => idx + 1,
            },
            {
              title: 'Nama Karyawan',
              dataIndex: 'name',
              key: 'name',
              render: (t) => <Text strong>{t}</Text>,
            },
            {
              title: 'Entitas',
              dataIndex: 'entitas_name',
              key: 'entitas_name',
              width: 100,
              render: (t) => <Tag color="cyan">{t || 'General'}</Tag>,
            },
            {
              title: 'Departemen & Jabatan',
              key: 'pos',
              render: (_, r) => `${r.position || '-'} (${r.department || '-'})`,
            },
          ]}
        />
      </Modal>
    </div>
  );
}
