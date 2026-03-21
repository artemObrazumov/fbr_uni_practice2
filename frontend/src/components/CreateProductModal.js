import React, { useState } from 'react';

const CreateProductModal = ({ token, setProducts, closeModal }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');

    const handleCreate = async (e) => {
        e.preventDefault();
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, price }),
        });
        if (response.ok) {
            const newProduct = await response.json();
            setProducts(prevProducts => [...prevProducts, newProduct]);
            closeModal();
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                width: '400px'
            }}>
                <h2>Создать продукт</h2>
                <form onSubmit={handleCreate}>
                    <input
                        type="text"
                        placeholder="Название"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ width: '100%', marginBottom: '10px' }}
                    />
                    <input
                        type="number"
                        placeholder="Цена"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        style={{ width: '100%', marginBottom: '10px' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={closeModal} style={{ backgroundColor: '#6c757d' }}>Отмена</button>
                        <button type="submit">Создать</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProductModal;
