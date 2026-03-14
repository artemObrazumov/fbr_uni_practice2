
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api';
import Header from '../components/Header';

function ProductEditPage() {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await apiClient.get(`/products/${id}`);
                setName(response.data.name);
                setPrice(response.data.price);
            } catch (error) {
                console.error('Не удалось загрузить продукт', error);
            }
        };
        fetchProduct();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.put(`/products/${id}`, { name, price });
            navigate('/products');
        } catch (error) {
            console.error('Не удалось обновить продукт', error);
        }
    };

    return (
        <div>
            <Header />
            <h1>Редактировать продукт</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Название</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                    <label>Цена</label>
                    <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <button type="submit">Обновить</button>
            </form>
        </div>
    );
}

export default ProductEditPage;
