// index.jsx
import React, { useState, useLayoutEffect } from 'react'; // Import useState dan useLayoutEffect
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import NotFound from '@/components/NotFound';
import { ErpLayout } from '@/layout';
import PageLoader from '@/components/PageLoader';

import { erp } from '@/redux/erp/actions';
import { selectReadItem } from '@/redux/erp/selectors';

import UpdateKpiForm from '../Forms/UpdateKpiForm';

export default function UpdateKPIModule({ config }) {
  const dispatch = useDispatch();

  const { id } = useParams();

  useLayoutEffect(() => {
    dispatch(erp.read({ entity: config.entity, id }));
  }, [id, dispatch, config.entity]); // Tambahkan dependency yang hilang: dispatch dan config.entity

  const { result: currentResult, isSuccess, isLoading = true } = useSelector(selectReadItem);

  // Gunakan state untuk menyimpan ID, pastikan hanya di-set sekali
  const [kpiId, setKpiId] = useState(null);

  useLayoutEffect(() => {
    if (currentResult && !kpiId) { // Hanya set kpiId jika currentResult ada dan kpiId masih null
      const data = { ...currentResult };
      dispatch(erp.currentAction({ actionType: 'update', data }));
      setKpiId(id); // Set kpiId hanya sekali
    }
  }, [currentResult, id, dispatch, kpiId]); // Tambahkan dispatch ke dependency

  if (isLoading) {
    return (
      <ErpLayout>
        <PageLoader />
      </ErpLayout>
    );
  } else
    return (
      <ErpLayout>
        {isSuccess ? (
          <UpdateKpiForm initialKpiId={kpiId} /> // Kirim kpiId sebagai prop
        ) : (
          <NotFound entity={config.entity} />
        )}
      </ErpLayout>
    );
}