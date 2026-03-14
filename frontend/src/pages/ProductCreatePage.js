
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api';
import Header from '../components/Header';

function ProductCreatePage() {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/products', { name, price });
            navigate('/products');
        } catch (error) {
            console.error('Не удалось создать продукт', error);
        }
    };

    return (
        <div>
            <Header />
            <h1>Создать продукт</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Название</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                    <label>Цена</label>
                    <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <button type="submit">Создать</button>
            </form>
        </div>
    );
}

export default ProductCreatePage;
