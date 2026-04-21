import React from 'react';
import { Link } from 'react-router-dom';
import Register from './Register';

const RegisterPage = ({ setToken, setUser }) => {
    return (
        <div>
            <Register setToken={setToken} setUser={setUser} />
            <p>
                Уже есть аккаунт? <Link to="/login">Войти</Link>
            </p>
        </div>
    );
};

export default RegisterPage;
