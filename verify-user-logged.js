const _BASE_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:Whyi2nVf/gs';
const _token = localStorage.getItem('authToken');
const PATHNAME = window.location.pathname

// search for the token in localStorage and redirect to login if not found
async function fetchUserData() {
    if (!_token) {
        if (PATHNAME.includes('login.html') || PATHNAME.includes('signup.html') || PATHNAME.includes('verify-otp.html')){
            return;
        }
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${_token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            // store user data in localStorage for later use
            localStorage.setItem('userID', data.id);
            localStorage.setItem('username', data.username);

            // if user is on login or signup page, redirect to home
            if (PATHNAME.includes('login.html') || PATHNAME.includes('signup.html') || PATHNAME.includes('verify-otp.html')){
                window.location.href = 'index.html';
            }

        } else {
            alert("Token expired or invalid. Please log in again.");
            localStorage.removeItem('authToken');
            localStorage.removeItem('userID');
            localStorage.removeItem('username');
            
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error in user search:', error);
    }
}

// MAIN - Verify if user is logged
fetchUserData();