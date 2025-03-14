class AuthenticationForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['target-url'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'target-url') {
            const loginForm = this.shadowRoot.querySelector('.login-form');
            const registrationForm = this.shadowRoot.querySelector('.registration-form');
            if (loginForm) loginForm.setAttribute('target-url', newValue);
            if (registrationForm) registrationForm.setAttribute('target-url', newValue);
        }
    }

    connectedCallback() {
        this.render();
        this.addEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .hidden {
                    display: none;
                }

                .container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                a {
                    margin-top: 10px;
                    cursor: pointer;
                }
            </style>
            <div class="container">
                <login-form class="login-form hidden"></login-form>
                <registration-form class="registration-form"></registration-form>
                <a id="toggle-link">Already registered? Login</a>
            </div>
        `;
    }

    addEventListeners() {
        const loginForm = this.shadowRoot.querySelector('.login-form');
        const registrationForm = this.shadowRoot.querySelector('.registration-form');
        const toggleLink = this.shadowRoot.querySelector('#toggle-link');

        loginForm.setAttribute('login-endpoint', this.getAttribute('login-endpoint'));
        loginForm.setAttribute('target-url', this.getAttribute('target-url'));
        registrationForm.setAttribute('register-endpoint', this.getAttribute('register-endpoint'));
        registrationForm.setAttribute('target-url', this.getAttribute('target-url'));

        toggleLink.addEventListener('click', () => {
            if (loginForm.classList.contains('hidden')) {
                loginForm.classList.remove('hidden');
                registrationForm.classList.add('hidden');
                toggleLink.textContent = "Don't have an account? Register";
            } else {
                loginForm.classList.add('hidden');
                registrationForm.classList.remove('hidden');
                toggleLink.textContent = "Already registered? Login";
            }
        });
    }
}

customElements.define('authentication-form', AuthenticationForm);





class LoginForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host form {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                :host input {
                    margin: 5px;
                }

                :host a {
                    margin-top: 10px;
                }
            </style>
            <form>
                <h1>Login</h1>
                <div class="error" style="background-color: red;"></div><br>
                <label for="username">Username</label><br>
                <input type="text" id="username" required/><br>
                <label for="password">Password</label><br>
                <input type="password" id="password" required><br>
                <input type="submit" value="login"><br>
            </form>
            
        `;


        
    }

    connectedCallback() {

        this.render();

        this.form = this.shadowRoot.querySelector('form');
        this.username = this.shadowRoot.querySelector('#username');
        this.password = this.shadowRoot.querySelector('#password');
        this.display = this.shadowRoot.querySelector('.error');


        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const targeturl = this.getAttribute('target-url') || '/';
            this.loginEndpoint = this.getAttribute('login-endpoint') || './user/login';

            this.display.textContent = '';
    
            try {
                const res = await fetch(this.loginEndpoint, {
                    method: 'POST',
                    body: JSON.stringify({ username: this.username.value, password: this.password.value }),
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await res.json();
                if (res.status === 400 || res.status === 401) {
                    return this.display.textContent = `${data.message}. ${data.error ? data.error : ''}`;
                }
                location.assign(targeturl);
            } catch (err) {
                console.log(err.message);
            }
        });
    }
}

customElements.define('login-form', LoginForm);




class RegistrationForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.addEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>

                form {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                input {
                    margin: 5px;
                }

                a {
                    margin-top: 10px;
                }

            </style>
            
            <form>
            <h1>Register</h1>
                <div class="error" style="background-color: red;"></div><br>
                <label for="username" txt="Username">Username</label><br>
                <input type="text" id="username" required/><br>
                <label for="password" txt="Password">Password</label><br>
                <input type="password" id="password" required><br>
                <input type="submit" value="register"><br>
            </form>
        `;
    }

    addEventListeners() {
        const form = this.shadowRoot.querySelector('form');
        const username = this.shadowRoot.querySelector('#username');
        const password = this.shadowRoot.querySelector('#password');
        const display = this.shadowRoot.querySelector('.error');
        const loginLink = this.shadowRoot.querySelector('#login-link');

        const targeturl = this.getAttribute('target-url') || '/';

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            display.textContent = '';
            try {
                const res = await fetch(this.getAttribute('register-endpoint'), {
                    method: 'POST',
                    body: JSON.stringify({ username: username.value, password: password.value }),
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await res.json();

                if (res.status === 200 || res.status === 201) {
                    // activate login form
                    loginLink.click();
                } else if (res.status === 400 || res.status === 401) {
                    display.textContent = `${data.message}. ${data.error ? data.error : ''}`;
                }
            } catch (err) {
                console.log(err.message);
            }
        });
    }
}

customElements.define('registration-form', RegistrationForm);