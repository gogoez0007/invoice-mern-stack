// UpdateItem.jsx
import React, { useState, useEffect } from 'react';
import {
    Button,
    Tag,
    message
} from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import {
    FileAddOutlined,
    EditOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import { selectCurrentItem, selectUpdatedItem } from '@/redux/erp/selectors';
import { useNavigate } from 'react-router-dom';
import { useMoney, useDate } from '@/settings';
import BongkarFormUpdate from '@/modules/BongkarModule/Forms/BongkarFormUpdate'; // Import komponen tampilan
import dayjs from 'dayjs';
import { generate as uniqueId } from 'shortid';
import calculate from '@/utils/calculate';

const UpdateItem = ({ config, selectedItem }) => {
    const translate = useLanguage();
    const { entity, ENTITY_NAME } = config;
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { dateFormat } = useDate();
    const formatNumber = (number) =>
        new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2 }).format(number);
    const { result: currentResult } = useSelector(selectCurrentItem);
    const { isSuccess: isUpdateSuccess, isError: isUpdateError } = useSelector(selectUpdatedItem);

    const [itemsByPosition, setItemsByPosition] = useState({});
    const [currentErp, setCurrentErp] = useState(selectedItem ?? {
        nama_pabrik: '',
        lokasi: '',
        staff: '',
        nama_perusahaan: '',
        nopol: '',
        status: ''
    });

    useEffect(() => {
        if (currentResult) {
            const { detail, ...others } = currentResult;
            setCurrentErp(currentResult);

            if (detail) {
                // Group items by posisi
                const groupedItems = detail.reduce((acc, item) => {
                    const position = item.posisi || 'Unknown Position';
                    if (!acc[position]) {
                        acc[position] = [];
                    }
                    acc[position].push(item);
                    return acc;
                }, {});
                setItemsByPosition(groupedItems);
            }
        }
    }, [currentResult]);

    useEffect(() => {
        if (isUpdateSuccess) {
            message.success(translate('Data berhasil diperbarui'));
            navigate(`/${entity.toLowerCase()}/read/${currentErp.id}`); // Arahkan ke halaman detail setelah sukses
            dispatch(erp.resetAction({ actionType: 'update' }));
        }

        if (isUpdateError) {
            message.error(translate('Gagal memperbarui data'));
        }
    }, [isUpdateSuccess, isUpdateError, navigate, translate, entity, currentErp.id, dispatch]);

    const handleFormSubmit = (dataToSend) => {

        console.log('Data yang akan disubmit ke backend:', JSON.stringify(dataToSend, null, 2));
        dispatch(erp.update({ entity, id: currentErp.id, jsonData: dataToSend })) // Kirim ke action update
    };

    return (
        <>
            <PageHeader
                onBack={() => {
                    navigate(`/${entity.toLowerCase()}`);
                }}
                title={`${ENTITY_NAME} # ${currentErp.nama_pabrik || currentErp.tanggal_bongkar}`}
                ghost={false}
                tags={[
                    <Tag key="status">{currentErp.status && translate(currentErp.status)}</Tag>,
                ]}
                extra={[
                    <Button
                        key="close"
                        onClick={() => navigate(`/${entity.toLowerCase()}`)}
                        icon={<CloseCircleOutlined />}
                    >
                        {translate('Close')}
                    </Button>,
                    <Button
                        key="create"
                        onClick={() => {
                            dispatch(
                                erp.currentAction({
                                    actionType: 'create',
                                    data: null,
                                })
                            );
                            navigate(`/${entity.toLowerCase()}/create`);
                        }}
                        type="primary"
                        icon={<FileAddOutlined />}
                    >
                        {translate('New')}
                    </Button>,
                ]}
                style={{ padding: '20px 0' }}
            >


            </PageHeader>
            <BongkarFormUpdate
                translate={translate}
                itemsByPosition={itemsByPosition}
                currentErp={currentErp}
                dateFormat={dateFormat}
                formatNumber={formatNumber}
                onSubmit={handleFormSubmit} // Pass handler ke komponen form
            />
        </>
    );
};

export default UpdateItem;