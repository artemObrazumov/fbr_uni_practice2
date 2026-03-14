
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api';

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/auth/register', { username, password });
            navigate('/login');
        } catch (error) {
            setError('Не удалось зарегистрироваться. Возможно, имя пользователя уже занято.');
            console.error('Registration failed', error);
        }
    };

    return (
        <div>
            <h1>Регистрация</h1>
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
                <button type="submit">Зарегистрироваться</button>
            </form>
            <p>
                Уже есть аккаунт? <a href="/login">Войдите</a>
            </p>
        </div>
    );
}

export default RegisterPage;
