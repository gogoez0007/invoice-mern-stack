import React, { useState, useEffect } from 'react';
import { Modal, List, Checkbox } from 'antd';

const TambahBongkarModal = ({ open, onCancel, detailPanenOptions, onSelect }) => {
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        setSelectedItems([]); // Reset selected items ketika modal dibuka
    }, [detailPanenOptions]);

    const handleCheckboxChange = (item) => {
        const isSelected = selectedItems.some(i => i.id === item.id);
        if (isSelected) {
            setSelectedItems(selectedItems.filter(i => i.id !== item.id));
        } else {
            setSelectedItems([...selectedItems, item]);
        }
    };

    const handleOk = () => {
        onSelect(selectedItems);
        onCancel();
    };

    return (
        <Modal
            title="Pilih Detail Panen untuk Bongkar"
            open={open}
            onOk={handleOk}
            onCancel={onCancel}
        >
            <List
                dataSource={detailPanenOptions}
                renderItem={item => (
                    <List.Item>
                        <Checkbox
                            onChange={() => handleCheckboxChange(item)}
                            checked={selectedItems.some(i => i.id === item.id)}
                        >
                            {item.created_date} - {item.berat} Kg
                        </Checkbox>
                    </List.Item>
                )}
            />
        </Modal>
    );
};

export default TambahBongkarModal;