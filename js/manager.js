const __BASE_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:Whyi2nVf/gs';
const authToken = localStorage.getItem('authToken');
let passwords = [];
let editingPasswordId = null;

// fetch passwords
async function fetchPasswords() {
    try {
        const response = await fetch(`${__BASE_URL}/passwd`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error('Xano Error: Error loading data from server');

        const data = await response.json();
        if (data && Array.isArray(data)) {
            passwords = data.map(item => ({
                id: item.id,
                last_modified: formatTimestamp(item.last_modified),
                service: item.service || 'No service',
                email: item.email || '-',              
                password: item.password || '-',      
                username: item.username || '-',
                description: item.description || '-'
            }));
        } else {
            passwords = [];
        }
    } catch (error) {
        console.error(error);
        alert('Xano Error: Error loading data from server.');
    }
}

// display passwords in the table
function displayPasswords(filterText = '') {
    const tableBody = document.getElementById('passwordsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    const filteredPasswords = passwords.filter(pass => 
        pass.service.toLowerCase().includes(filterText.toLowerCase())
    );

    if (filteredPasswords.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No passwords found.</td></tr>';
        return;
    }

    filteredPasswords.forEach(pass => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><strong>${pass.service}</strong></td>
            <td>${pass.email}</td>
            <td><code>${pass.password}</code></td>
            <td>${pass.username}</td>
            <td>${pass.description}</td>
            <td>${pass.last_modified}</td>
            <td>
                <div class="actions-btn">
                    <button onclick="openEditModal(${pass.id})" style="background: blue; color: white; border: none; padding: 3px 8px; cursor: pointer;">Edit</button>
                    <button onclick="deletePassword(${pass.id})" style="background: red; color: white; border: none; padding: 3px 8px; cursor: pointer;">Delete</button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Edit Modal
function openEditModal(id) {
    const pass = passwords.find(p => p.id === id);
    if (!pass) return;

    editingPasswordId = id;

    document.getElementById('modalTitle').textContent = 'Edit Password';

    document.getElementById('formTag').value = pass.service === 'No service' ? '' : pass.service;
    document.getElementById('formEmail').value = pass.email === '-' ? '' : pass.email;
    document.getElementById('formPassword').value = pass.password === '-' ? '' : pass.password;
    document.getElementById('formUsername').value = pass.username === '-' ? '' : pass.username;
    document.getElementById('formDescription').value = pass.description === '-' ? '' : pass.description;

    modal.style.display = 'block';
}

// Create or Update password
async function savePassword() {
    const service = document.getElementById('formTag').value;
    const username = document.getElementById('formUsername').value;
    const email = document.getElementById('formEmail').value;
    const password = document.getElementById('formPassword').value;
    const description = document.getElementById('formDescription').value;

    if (!service || !email || !password) {
        alert('Please fill in the required fields (Service, Email and Password).');
        return;
    }

    const bodyData = { service, email, password, username, description };

    let url = `${__BASE_URL}/passwd`;
    let method = 'POST';

    if (editingPasswordId !== null) {
        url = `${__BASE_URL}/password/${editingPasswordId}`;
        method = 'PATCH';
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(bodyData)
        });

        if (!response.ok) throw new Error(`Xano Error: Error processing password request via ${method}`);
        
        alert(editingPasswordId !== null ? 'Password updated successfully!' : 'Password saved successfully!');
        closeModal();
        await init();

    } catch (error) {
        console.error(error);
        alert('Could not save or update the password.');
    }
}

// Delete password
async function deletePassword(id) {
    if (!confirm('Have you sure you want to delete this password?')) return;

    try {
        const response = await fetch(`${__BASE_URL}/password/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) throw new Error('Xano Error: Error deleting password');

        alert('Password removed!');
        await init();

    } catch (error) {
        console.error(error);
        alert('Xano Error: Error deleting password');
    }
}

// interface controls for modal and search
const modal = document.getElementById('passwordModal');

document.getElementById('openCreateModalBtn').addEventListener('click', () => {
    editingPasswordId = null;
    document.getElementById('modalTitle').textContent = 'New Password';

    document.getElementById('formTag').value = '';
    document.getElementById('formUsername').value = '';
    document.getElementById('formEmail').value = '';
    document.getElementById('formPassword').value = '';
    document.getElementById('formDescription').value = '';
    modal.style.display = 'block';
});

function closeModal() { modal.style.display = 'none'; }
document.getElementById('closeModalBtn').addEventListener('click', closeModal);

document.getElementById('savePasswordBtn').addEventListener('click', savePassword);

document.getElementById('searchInput').addEventListener('input', (e) => {
    displayPasswords(e.target.value);
});

// Utility function to format timestamps
function formatTimestamp(timestamp) {
    if (!timestamp) return '-';
    
    const dateElement = new Date(Number(timestamp));
    
    if (isNaN(dateElement.getTime())) return '-';

    return dateElement.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Logout
const logoutButton = document.getElementById('logoutBtn');
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userID');
        localStorage.removeItem('username');

        alert('You have been logged out.');

        window.location.href = 'pages/login.html'; 
    });
}

// MAIN FLOW
async function init() {
    await fetchPasswords();
    displayPasswords();
}

init();