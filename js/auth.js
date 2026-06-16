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
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirm_password = document.getElementById('confirm_password').value;

        if (password.length < 8) {
            alert('Password must be at least 8 characters long.');
            return;
        }
        
        if (password !== confirm_password) {
            alert("Passwords doesn't match.");
            return;
        }
        
        try {
            const response = await fetch(`${BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password, confirm_password })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Registration successful! Please log in with your credentials.');
                window.location.href = '../index.html';
            } else {
                alert(`Error during registration: ${data.message || 'Please check your details.'}`);
            }
        } catch (error) {
            console.error('Error connecting to Xano:', error);
            alert('Connection error with the server.');
        }
    });
}