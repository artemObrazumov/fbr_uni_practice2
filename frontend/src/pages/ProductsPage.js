
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api';
import Header from '../components/Header';

function ProductsPage() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await apiClient.get('/products');
                setProducts(response.data);
            } catch (error) {
                console.error('Не удалось загрузить продукты', error);
            }
        };
        fetchProducts();
    }, []);

    const handleDelete = async (id) => {
        try {
            await apiClient.delete(`/products/${id}`);
            setProducts(products.filter(p => p.id !== id));
        } catch (error) {
            console.error('Не удалось удалить продукт', error);
        }
    };

    return (
        <div>
            <Header />
            <h1>Продукты</h1>
            <Link to="/products/create">Создать продукт</Link>
            <ul>
                {products.map(product => (
                    <li key={product.id}>
                        <Link to={`/products/${product.id}`}>{product.name}</Link> - {product.price}₽
                        <Link to={`/products/edit/${product.id}`}>Редактировать</Link>
                        <button onClick={() => handleDelete(product.id)}>Удалить</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default ProductsPage;
