import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import HomePage from './components/HomePage';

function App() {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleSetToken = (token) => {
        setToken(token);
        localStorage.setItem('token', token);
    };

    const handleSetUser = (user) => {
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
    };

    const handleLogout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <div>
            <Routes>
                {token ? (
                    <>
                        <Route path="/" element={<HomePage user={user} token={token} handleLogout={handleLogout} />} />
                        <Route path="/login" element={<Navigate to="/" />} />
                        <Route path="/register" element={<Navigate to="/" />} />
                    </>
                ) : (
                    <>
                        <Route path="/" element={<Navigate to="/login" />} />
                        <Route path="/login" element={<LoginPage setToken={handleSetToken} setUser={handleSetUser} />} />
                        <Route path="/register" element={<RegisterPage setToken={handleSetToken} setUser={handleSetUser} />} />
                    </>
                )}
            </Routes>
        </div>
    );
}

export default App;