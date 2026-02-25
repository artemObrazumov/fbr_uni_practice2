import React, { useEffect, useState } from "react";

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initialProduct?.name ?? "");
    setCategory(initialProduct?.category ?? "");
    setDescription(initialProduct?.description ?? "");
    setPrice(initialProduct?.price != null ? String(initialProduct.price) : "");
    setStock(initialProduct?.stock != null ? String(initialProduct.stock) : "");
  }, [open, initialProduct]);

  if (!open) return null;

  const title = mode === "edit" ? "Редактирование товара" : "Создание товара";

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (!trimmedName) {
      console.error("Введите название");
      return;
    }
    if (!category.trim()) {
      console.error("Введите категорию");
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      console.error("Введите корректную цену");
      return;
    }
    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
        console.error("Введите корректное количество на складе");
        return;
    }

    onSubmit({
      id: initialProduct?.id,
      name: trimmedName,
      category: category.trim(),
      description: description.trim(),
      price: parsedPrice,
      stock: parsedStock,
    });
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal__header">
          <div className="modal__title">{title}</div>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </label>
          <label className="label">
            Категория
            <input
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </label>
          <label className="label">
            Описание
            <input
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="label">
            Цена
            <input
              className="input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="numeric"
            />
          </label>
          <label className="label">
            Количество на складе
            <input
              className="input"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              inputMode="numeric"
            />
          </label>
          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn--primary">
              {mode === "edit" ? "Сохранить" : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
