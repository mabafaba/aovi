class LanguagePicker extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.languages = [];
     
    }

    connectedCallback() {
        this.languages = this.getAttribute('languages');
        if (this.languages) {
            this.languages = this.languages.split(',');
        }

        // check if ?lang=xx is in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const lang = urlParams.get('lang');
        console.log('language from url', lang);
        if (lang) {
            if(this.languages.includes(lang)) {
                document.documentElement.lang = lang;
            } else {
                console.warn(`Language ${lang} not available`);
            }
        }

        this.render();
        // available languages from attributes

    }

    render() {
        this.shadowRoot.innerHTML = `

            <select id="language-picker">
                ${this.languages.map((lang) => `<option value="${lang}">${lang}</option>`).join('')}
            </select>
        `;

        this.shadowRoot.querySelector('#language-picker').addEventListener('change', (event) => {
            document.documentElement.lang = event.target.value;
            localStorage.setItem('lang', event.target.value);
        });

        // set the selected option to the current language
        const lang = getPreferredLanguage();
        if (this.languages.includes(lang)) {
            this.shadowRoot.querySelector('#language-picker').value = lang;
        }
    }
}

customElements.define('language-picker', LanguagePicker);


getPreferredLanguage = function () {
    // check 1. cookie, 2. localstorage, 3. browser language
    // pick the first available language
    const lang = localStorage.getItem('lang') || document.documentElement.lang || navigator.language.split('-')[0];
    return lang;
    }


const setLanguage = function (lang) {
    if(!lang) {
        lang = getPreferredLanguage();
    }
    document.documentElement.lang = lang;
    localStorage.setItem('lang', lang);
}


const translator = function (translations, onLanguageChange, scope = document) {
    if (!onLanguageChange) {
        onLanguageChange = () => {};
    }

    const observer = new MutationObserver(() => {
        const lang = document.documentElement.lang || 'en';
        localStorage.setItem('lang', lang);

        // Select elements only within the given scope
        const elements = scope.querySelectorAll('[data-translator-text]');
        elements.forEach((element) => {
            const key = element.getAttribute('data-translator-text');
            if (!translations[lang] || !translations[lang][key]) {
                console.warn(`No translation found for key: ${key} in language: ${lang}`);
                element.innerText = key;
            } else {
                element.innerText = translations[lang][key];
            }
        });

        // Handle attributes prefixed with data-translator-*
        scope.querySelectorAll('[data-translator-]').forEach((element) => {
            Array.from(element.attributes).forEach(attr => {
                if (attr.name.startsWith('data-translator-')) {
                    const key = attr.value;
                    const attributeName = attr.name.replace('data-translator-', '');
                    let translation = translations[lang]?.[key] || key;

                    if (attributeName === 'text') {
                        element.innerText = translation;
                    } else {
                        element.setAttribute(attributeName, translation);
                    }
                }
            });
        });

        onLanguageChange();
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    let lang = getPreferredLanguage();
    if (!translations[lang]) {
        console.warn(`Language ${lang} not available`);
        lang = 'en';
    }
    document.documentElement.lang = lang;

    return (key) => {
        const lang = document.documentElement.lang || 'en';
        return translations[lang]?.[key] || key;
    };
};


