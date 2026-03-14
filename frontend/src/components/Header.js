
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api';

function Header() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await apiClient.get('/auth/me');
                setUser(response.data);
            } catch (error) {
                console.error('Не удалось загрузить пользователя', error);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            await apiClient.post('/auth/logout', { refreshToken });
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            navigate('/login');
        } catch (error) {
            console.error('Не удалось выйти', error);
        }
    };

    return (
        <header>
            {user && <span className='user_welcome'>Привет, {user.username}</span>}
            <button onClick={handleLogout}>Выйти</button>
        </header>
    );
}

export default Header;
