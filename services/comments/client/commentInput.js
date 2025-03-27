class CommentInput extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.room = "default-room";
        this.themes = ['1','2','3'];

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
        

        



        this.translations = {
            'en': {
                'Write your comment...': 'Write your comment...',
                'Send': 'Send',
                'Select theme': 'Select theme'
            },
            'de': {
                'Write your comment...': 'Schreibe deinen Kommentar...',
                'Send': 'Senden',
                'Select theme': 'Thema auswählen'
            },
            'fr': {
                'Write your comment...': 'Écrivez votre commentaire...',
                'Send': 'Envoyer',
                'Select theme': 'Sélectionner le thème'
            },
            'pt': {
                'Write your comment...': 'Escreva seu comentário...',
                'Send': 'Enviar',
                'Select theme': 'Selecione o tema'
            }
        };

        this.t = translator(this.translations, () => {}
        , this.shadowRoot);

    }

    render(){

        
        // get themes from attributes
        
    const theme1 = this.getAttribute('theme1');
    const theme2 = this.getAttribute('theme2');
    const theme3 = this.getAttribute('theme3');
    this.themes = [theme1, theme2, theme3];
    console.log("THEMES", this.themes);



        this.shadowRoot.innerHTML = `
        <style>
        .comment-box {
            display: flex;
            flex-direction: column;
            width: 100%;    
        }
        .comment-box textarea {
            width: 100%;
            height: 80%;
            margin-bottom: 10px;
        }

        @media screen and (max-height: 570px) {
            .comment-box textarea {
                height: 1em !important;
            }

            .sendMessageButton {
                height: 25px !important;
            }

            .comment-box .radio-group {
                font-size:0.4em !important;
            }
        }


        .comment-box .radio-group {
            display: table;
            width: 100%;
            margin-bottom: 10px;
            font-size: 0.6em;
            color: #666;
        }
        .comment-box .radio-group div {
            display: table-row;
        }
        .comment-box .radio-group label,
        .comment-box .radio-group input[type="radio"] {
            display: table-cell;
            vertical-align: middle;
            padding: 0px;
            margin: 0px;
        }

        .sendMessageButton {
            background-color: #9b00b0;
            color: white;
            border-radius: 10px;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            border: none;
            height: 40px;
            width: 100%;
            margin: auto;
        }
        </style>

        <div class="comment-box">
        <div class="radio-group">
    <div data-translator-text="Select theme"></div>
        <div>
<input type="radio" id="theme2" name="theme" value="${this.themes[0]}">
<label for="theme2">${this.themes[0]}</label>
</div>
<div>
<input type="radio" id="theme3" name="theme" value="${this.themes[1]}">
<label for="theme3">${this.themes[1]}</label>
</div>
<div>
<input type="radio" id="theme1" name="theme" value="${this.themes[2]}" checked>
<label for="theme1">${this.themes[2]}</label>
</div>
        </div>
        <textarea data-translator-placeholder="Write your comment..." maxlength="600"></textarea>
        <button class="sendMessageButton" data-translator-text="Send"></button>
        </div>
    `;
    }

    connectedCallback() {
        this.room = this.getAttribute('room') || 'default-room';
        console.log('input room', this.room);
        this.render();

        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'room') {
                    this.room = this.getAttribute('room') || 'default-room';

                }
            });
        });
        this.observer.observe(this, { attributes: true });

        this.shadowRoot.querySelector('button').addEventListener('click', () => this.sendComment());
        this.shadowRoot.querySelector('textarea').addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.sendComment();
            }
        });

        
    }

    



    disconnectedCallback() {
        this.shadowRoot.querySelector('button').removeEventListener('click', () => this.sendComment());
    }

   

    async sendComment() {
        console.log('attempting to send comment');
        const textarea = this.shadowRoot.querySelector('textarea');
        const comment = textarea.value.trim();
        const userCategories = JSON.parse(localStorage.getItem('userCategories') || '{}');
        const commentTheme = this.shadowRoot.querySelector('input[name="theme"]:checked').value;
        const body = { 
            "text": comment,
            'room': this.room,
            'data': {
                'userCategories': userCategories,
                'commentTheme': commentTheme
            }
         };
        if (comment) {
            try {
                const response = await fetch('/aovi/comments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });
                console.log('response', response);


                if (response.ok) {
                    textarea.value = '';
                    // document wide event 
                    document.dispatchEvent(new CustomEvent('<comment-input>: posted successfully', { detail: body }));
                } else {
                    console.log('Failed to send comment', response);
                    // if 401, redirect to login
                    if (response.status === 401) {
                        window.location.href = '/aovi/views/login?targeturl=' + window.location.pathname;
                    }
                    // alert('Failed to send comment - please check your connection');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while sending the comment.');
            }
        } else {
            alert('Comment cannot be empty.');
        }
    }
}

customElements.define('comment-input', CommentInput);