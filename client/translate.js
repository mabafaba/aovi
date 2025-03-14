


class TextComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.id='';
    }

    connectedCallback() {
        this.id = this.getAttribute('id') || '';
    }
}

customElements.define('text', TextComponent);



class Translator {
    constructor(translations, defaultLanguage = 'en') {
        this.translations = translations;
        this.validateTranslations();
        this.translate(defaultLanguage);
    }

    validateTranslations() {

        if (typeof this.translations !== 'object' || this.translations === null) {
            throw new Error('Translations should be a non-null object');
        }

        const firstKey = Object.keys(this.translations)[0];
        if (typeof this.translations[firstKey] !== 'object' || this.translations[firstKey] === null) {
            throw new Error('Each translation entry should be a non-null object');
        }

        const languages = Object.keys(this.translations[Object.keys(this.translations)[0]]);
        const missingTranslations = {};

        Object.keys(this.translations).forEach((id) => {
            languages.forEach((language) => {
                if (!this.translations[id][language]) {
                    if (!missingTranslations[id]) {
                        missingTranslations[id] = [];
                    }
                    missingTranslations[id].push(language);
                }
            });
        });

        if (Object.keys(missingTranslations).length > 0) {
            console.warn('Missing translations:', missingTranslations);
        } else {
            console.log('All translations are present.');
        }


        // check if all text elements have a corresponding translation
        const textElements = document.querySelectorAll('text');
        textElements.forEach((element) => {
            const id = element.id;
            if (!this.translations[id]) {
                console.warn(`No text found for ${id}`);
            }
        });

    }

    translate(language) {
            // get all elements with xln-* attributes (unknown what * is)
            const elements = document.querySelectorAll('[data-xln-*]');
            // set i.e. if  xln-value="login", value="Login" (based on translations)
            elements.forEach((element) => {
                const xlnAttribute = element.getAttribute('data-xln-*');
                // get the part aftr data-xln- (i.e. value)
                const attribute = xlnAttribute.split('data-xln-')[1];
                // get the translation for the attribute
                const translation = translations[attribute][language];
                element.setAttribute(attribute, translation);
            });
        
            const elementsContent = document.querySelectorAll('[data-xln]');
            elementsContent.forEach((element) => {
                const translation = translations[element.getAttribute('data-xln')][language];
                element.innerHTML = translation;
            });
        }
        
}


// translator
let translator = null;
fetch('/translations.json')
    .then(response => response.json())
    .then(data => {
        translator = new Translator(data);
    });




<input type="button" id="login" xln-value="Login" xln-placeholder="Login">field content</input>

