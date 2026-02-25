import React from "react";
import ProductItem from "./ProductItem";

export default function ProductList({ products, onEdit, onDelete }) {
  if (!products.length) {
    return <div className="empty">Товаров пока нет</div>;
  }

  return (
    <div className="list">
      {products.map((p) => (
        <ProductItem key={p.id} product={p} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
