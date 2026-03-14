
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api';

function ProductDetailPage() {
    const [product, setProduct] = useState(null);
    const { id } = useParams();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await apiClient.get(`/products/${id}`);
                setProduct(response.data);
            } catch (error) {
                console.error('Не удалось загрузить продукт', error);
            }
        };
        fetchProduct();
    }, [id]);

    if (!product) {
        return <div>Загрузка...</div>;
    }

    return (
        <div>
            <h1>{product.name}</h1>
            <p>Цена: {product.price}₽</p>
        </div>
    );
}

export default ProductDetailPage;
