import React, { useEffect, useState } from "react";
import "./ProductsPage.scss";
import ProductList from "../../components/ProductList";
import ProductModal from "../../components/ProductModal";
import { api } from "../../api";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setModalMode("create");
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setModalMode("edit");
    setEditingProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitModal = async (payload) => {
    try {
      if (modalMode === "create") {
        const newProduct = await api.createProduct(payload);
        setProducts((prev) => [...prev, newProduct]);
      } else {
        const updatedProduct = await api.updateProduct(payload.id, payload);
        setProducts((prev) =>
          prev.map((p) => (p.id === payload.id ? updatedProduct : p))
        );
      }
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page">

      <main className="main">
        <div className="container">
          <div className="toolbar">
            <h1 className="title">Товары</h1>
            <button className="btn" onClick={openCreate}>
              Создать
            </button>
          </div>
          {loading ? (
            <div className="empty">Загрузка...</div>
          ) : (
            <ProductList
              products={products}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </main>
      <ProductModal
        open={modalOpen}
        mode={modalMode}
        initialProduct={editingProduct}
        onClose={closeModal}
        onSubmit={handleSubmitModal}
      />
    </div>
  );
}
