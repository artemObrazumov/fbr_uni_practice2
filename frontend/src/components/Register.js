import React, { useState } from 'react';

const Register = ({ setToken, setUser }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const registerResponse = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, role }),
        });

        if (registerResponse.ok) {
            const loginResponse = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
            const data = await loginResponse.json();
            if (loginResponse.ok) {
                setToken(data.accessToken);
                const userResponse = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${data.accessToken}`
                    }
                });
                const userData = await userResponse.json();
                setUser(userData.user);
            }
        } else {
            const data = await registerResponse.json();
            setError(data.error);
        }
    };

    return (
        <div>
            <h2>Регистрация</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Имя пользователя"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="user">Пользователь</option>
                    <option value="seller">Продавец</option>
                    <option value="admin">Администратор</option>
                </select>
                <button type="submit">Зарегистрироваться</button>
            </form>
        </div>
    );
};

export default Register;
