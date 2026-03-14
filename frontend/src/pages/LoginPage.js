
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await apiClient.post('/auth/login', { username, password });
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            navigate('/products');
        } catch (error) {
            setError('Неверное имя пользователя или пароль');
            console.error('Login failed', error);
        }
    };

    return (
        <div>
            <h1>Вход</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Имя пользователя</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div>
                    <label>Пароль</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button type="submit">Войти</button>
            </form>
            <p>
                Нет аккаунта? <a href="/register">Зарегистрируйтесь</a>
            </p>
        </div>
    );
}

export default LoginPage;
