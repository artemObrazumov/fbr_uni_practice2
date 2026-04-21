import React, { useState } from 'react';

const EditUserModal = ({ token, user, setUsers, closeModal }) => {
    const [username, setUsername] = useState(user.username);
    const [role, setRole] = useState(user.role);

    const handleEdit = async (e) => {
        e.preventDefault();
        const response = await fetch(`/api/users/${user.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username, role }),
        });
        if (response.ok) {
            const updatedUser = await response.json();
            setUsers(prevUsers => prevUsers.map(u => u.id === user.id ? updatedUser : u));
            closeModal();
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                width: '400px'
            }}>
                <h2>Редактировать пользователя</h2>
                <form onSubmit={handleEdit}>
                    <input
                        type="text"
                        placeholder="Имя пользователя"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ width: '100%', marginBottom: '10px' }}
                    />
                    <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', marginBottom: '10px' }}>
                        <option value="user">Пользователь</option>
                        <option value="seller">Продавец</option>
                        <option value="admin">Администратор</option>
                    </select>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={closeModal} style={{ backgroundColor: '#6c757d' }}>Отмена</button>
                        <button type="submit">Сохранить</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;
