document.addEventListener('DOMContentLoaded', async function() {
    const usersTable = document.getElementById('usersTable');
    const rowTemplate = document.getElementById('rowTemplate');
    const usersResponse = await fetch('/api/v1/users');
    const users = await usersResponse.json();

    users.forEach(user => {
        const row = document.importNode(rowTemplate.content, true);
        row.querySelector('.id').textContent = user.id;
        row.querySelector('.email').textContent = user.email;
        row.querySelector('.username').textContent = user.username;
        row.querySelector('.lastName').textContent = user.lastName;
        row.querySelector('.firstName').textContent = user.firstName;
        row.querySelector('.active').textContent = user.verifiedAt === null ? 'No' : 'Yes';
        row.querySelector('.lastLogin').textContent = user.lastLogin;
        row.querySelector('.createdAt').textContent = user.createdAt;
        usersTable.appendChild(row);
    });
})