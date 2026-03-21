import React, { useState, useEffect } from 'react';
import EditUserModal from './EditUserModal';

const Users = ({ token }) => {
    const [users, setUsers] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const roleMapping = {
        'admin': 'Администратор',
        'seller': 'Продавец',
        'user': 'Пользователь'
    };

    useEffect(() => {
        const fetchUsers = async () => {
            const response = await fetch('/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setUsers(data);
        };
        fetchUsers();
    }, [token]);

    const handleDelete = async (id) => {
        await fetch(`/api/users/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        setUsers(users.filter(u => u.id !== id));
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    return (
        <div>
            <h2>Пользователи</h2>
            {isEditModalOpen && <EditUserModal token={token} user={selectedUser} setUsers={setUsers} closeModal={() => setIsEditModalOpen(false)} />}
            <ul>
                {users.map((user) => (
                    <li key={user.id}>
                        <span>{user.username} - {roleMapping[user.role] || user.role}</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => openEditModal(user)}>Редактировать</button>
                            <button onClick={() => handleDelete(user.id)} style={{ backgroundColor: '#dc3545' }}>Удалить</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Users;
