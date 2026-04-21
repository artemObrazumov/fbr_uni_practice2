import React from 'react';
import { Link } from 'react-router-dom';
import Login from './Login';

const LoginPage = ({ setToken, setUser }) => {
    return (
        <div>
            <Login setToken={setToken} setUser={setUser} />
            <p>
                Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
            </p>
        </div>
    );
};

export default LoginPage;
