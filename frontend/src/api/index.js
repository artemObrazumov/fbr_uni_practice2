import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
    "accept": "application/json",
  }
});

export const api = {
  createProduct: async (product) => {
    let response = await apiClient.post("/products", product);
    return response.data;
  },
  getProducts: async () => {
    let response = await apiClient.get("/products");
    return response.data;
  },
  getProductById: async (id) => {
    let response = await apiClient.get(`/products/${id}`);
    return response.data;
  },
  updateProduct: async (id, product) => {
    let response = await apiClient.patch(`/products/${id}`, product);
    return response.data;
  },
  deleteProduct: async (id) => {
    let response = await apiClient.delete(`/products/${id}`);
    return response.data;
  }
}
