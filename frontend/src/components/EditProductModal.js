import React, { useState } from 'react';

const EditProductModal = ({ token, product, setProducts, closeModal }) => {
    const [name, setName] = useState(product.name);
    const [price, setPrice] = useState(product.price);

    const handleEdit = async (e) => {
        e.preventDefault();
        const response = await fetch(`/api/products/${product.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, price }),
        });
        if (response.ok) {
            const updatedProduct = await response.json();
            setProducts(prevProducts => prevProducts.map(p => p.id === product.id ? updatedProduct : p));
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
                <h2>Редактировать продукт</h2>
                <form onSubmit={handleEdit}>
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
                        <button type="submit">Сохранить</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProductModal;
