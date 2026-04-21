import React, { useState, useEffect } from 'react';
import CreateProductModal from './CreateProductModal';
import EditProductModal from './EditProductModal';

const Products = ({ token, user }) => {
    const [products, setProducts] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            const response = await fetch('/api/products');
            const data = await response.json();
            setProducts(data);
        };
        fetchProducts();
    }, []);

    const handleDelete = async (id) => {
        await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        setProducts(products.filter(p => p.id !== id));
    };

    const openEditModal = (product) => {
        setSelectedProduct(product);
        setIsEditModalOpen(true);
    };

    return (
        <div>
            {(user?.role === 'seller' || user?.role === 'admin') && (
                <button onClick={() => setIsCreateModalOpen(true)} style={{ marginBottom: '20px' }}>Создать продукт</button>
            )}
            {isCreateModalOpen && <CreateProductModal token={token} setProducts={setProducts} closeModal={() => setIsCreateModalOpen(false)} />}
            {isEditModalOpen && <EditProductModal token={token} product={selectedProduct} setProducts={setProducts} closeModal={() => setIsEditModalOpen(false)} />}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {products.map((product) => (
                    <div key={product.id} style={{
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '20px',
                        width: 'calc(33.333% - 20px)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}>
                        <div>
                            <h3>{product.name}</h3>
                            <p>{product.price} руб.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {(user?.role === 'seller' || user?.role === 'admin') && (
                                <button onClick={() => openEditModal(product)}>Редактировать</button>
                            )}
                            {(user?.role === 'seller' || user?.role === 'admin') && (
                                <button onClick={() => handleDelete(product.id)} style={{ backgroundColor: '#dc3545' }}>Удалить</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Products;
