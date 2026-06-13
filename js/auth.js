const BASE_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:Whyi2nVf/gs';

// LOGIN
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            // FIRST SECURITY LAYER
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();


            if (response.ok && data === true) {
                // SECOND SECURITY LAYER - Generate OTP
                const response = await fetch(`${BASE_URL}/auth/generate-otp`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({username})
                });
                const data = await response.json();

                if (response.ok && data.message) {
                    // FINAL SECURITY LAYER - Redirect to OTP verification page
                    localStorage.setItem('username', username);
                    window.location.href = 'verify-otp.html';

                } else {
                    console.error(`OTP Generation Error: ${data.message}`);
                    alert('OTP generation failed, re-generate another.');
                }

            } else {
                console.error(`[LOGIN] Login Error: ${data.message}`);
                alert('Invalid Credentials.');
            }
        } catch (error) {
            console.error('[LOGIN] Xano Error:', error);
            alert('Xano error. Please try again later.');
        }
    });
}

// Verify OTP
const verifyOtpForm = document.getElementById('verifyOtpForm');
if (verifyOtpForm) {
    verifyOtpForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = localStorage.getItem('username');
        const otp = document.getElementById('otp').value;
        
        try {
            const response = await fetch(`${BASE_URL}/auth/verify-login/${otp}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({username})
            });
            const data = await response.json();

            if (response.ok && data.authToken) {
                localStorage.setItem('authToken', data.authToken);
                localStorage.removeItem('username');
                localStorage.removeItem('userID');
                window.location.href = '../index.html';
            } else {
                console.error(`[OTP Verification] Error: ${data.message}`);
                alert('Invalid OTP. Please try again.');
            }

        } catch (error) {
            console.error('[OTP Verification] Xano Error:', error);
            alert('Xano error. Please try again later.');
        }
    });;
}

// Resend OTP
const btnResendOtp = document.getElementById('btn-otp');
if (btnResendOtp) {
    btnResendOtp.addEventListener('click', async () => {
        const username = localStorage.getItem('username');
        try {
            const response = await fetch(`${BASE_URL}/auth/generate-otp`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({username})
            });
            const data = await response.json();

            if (response.ok && data.message) {
                alert('OTP re-generated! Please check your email.');
            } else {
                console.error(`OTP Re-generation Error: ${data.message}`);
                alert('Failed to re-generate OTP. Please try again.');
            }
        } catch (error) {
            console.error('[OTP Re-generation] Xano Error:', error);
            alert('Xano error. Please try again later.');
        }
    });
}

// Sign-UP
const registerForm = document.getElementById('signupForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nome = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('password').value;

        try {
            const response = await fetch(`${BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nome: nome, email: email, senha: senha })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Cadastro realizado com sucesso! Faça login.');
                window.location.href = 'index.html';
            } else {
                alert(`Erro no cadastro: ${data.message || 'Verifique os dados.'}`);
            }
        } catch (error) {
            console.error('Erro ao conectar com o Xano:', error);
            alert('Erro de conexão com o servidor.');
        }
    });
}

// LOGOUT
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', async (e) => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userID');
        localStorage.removeItem('username');

        window.location.href = 'login.html';
    });
}