import React from 'react';
import Products from './Products';
import Users from './Users';

const HomePage = ({ user, token, handleLogout }) => {
    const roleMapping = {
        'admin': 'Администратор',
        'seller': 'Продавец',
        'user': 'Пользователь'
    };

    return (
        <div>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #ddd' }}>
                <div/>
                <div style={{ fontWeight: 'bold' }}>
                    {user?.username} ({roleMapping[user?.role] || user?.role})
                    <button onClick={handleLogout} style={{ marginLeft: '10px' }}>Выйти</button>
                </div>
            </header>
            <main style={{ padding: '20px' }}>
                <Products token={token} user={user} />
                {user?.role === 'admin' && <Users token={token} />}
            </main>
        </div>
    );
};

export default HomePage;
