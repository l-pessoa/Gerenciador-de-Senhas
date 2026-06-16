const __BASE_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:Whyi2nVf/gs';
const authToken = localStorage.getItem('authToken');
let passwords = [];

// fetch passwords
async function fetchPasswords() {
    try {
        const response = await fetch(`${__BASE_URL}/passwd`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error('Erro ao buscar senhas do servidor');

        const data = await response.json();
        if (data && Array.isArray(data)) {
            passwords = data.map(item => ({
                id: item.id,
                service: item.service,
                email: item.email,              
                password: item.password,      
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
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No passwords found.</td></tr>';
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
            <td>
                <div class="actions-btn">
                    <button onclick="deletePassword(${pass.id})" style="background: red; color: white; border: none; padding: 3px 8px; cursor: pointer;">Deletar</button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// New password
async function createPassword() {
    const service = document.getElementById('formTag').value;
    const username = document.getElementById('formUsername').value;
    const email = document.getElementById('formEmail').value;
    const password = document.getElementById('formPassword').value;
    const description = document.getElementById('formDescription').value;

    if (!service || !email || !password) {
        alert('Please fill in the required fields (Service, Email and Password).');
        return;
    }

    const bodyData = { service, username, email, password, description };

    try {
        const response = await fetch(`${__BASE_URL}/passwd`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(bodyData)
        });

        if (!response.ok) throw new Error('Xano Error: Error saving password');

        alert('Password saved successfully!');
        closeModal();
        // Atualiza a tela local recarregando os dados
        await init();

    } catch (error) {
        console.error(error);
        alert('Could not save the password.');
    }
}

// --- 4. EXCLUIR SENHA (DELETE) ---
async function deletePassword(id) {
    if (!confirm('Have you sure you want to delete this password?')) return;

    try {
        const response = await fetch(`${__BASE_URL}/password/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) throw new Error('Xano Error: Error deleting password');

        alert('Password removed!');
        // Atualiza os dados
        await init();

    } catch (error) {
        console.error(error);
        alert('Xano Error: Error deleting password');
    }
}

// interface controls for modal and search
const modal = document.getElementById('passwordModal');

document.getElementById('openCreateModalBtn').addEventListener('click', () => {

    document.getElementById('formTag').value = '';
    document.getElementById('formUsername').value = '';
    document.getElementById('formEmail').value = '';
    document.getElementById('formPassword').value = '';
    document.getElementById('formDescription').value = '';
    modal.style.display = 'block';
});

function closeModal() { modal.style.display = 'none'; }
document.getElementById('closeModalBtn').addEventListener('click', closeModal);
document.getElementById('savePasswordBtn').addEventListener('click', createPassword);

document.getElementById('searchInput').addEventListener('input', (e) => {
    displayPasswords(e.target.value);
});


// MAIN FLOW
async function init() {
    await fetchPasswords();
    displayPasswords();
}

init();