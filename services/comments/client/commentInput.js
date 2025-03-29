class CommentInput extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.room = "default-room";

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
                'Comment cannot be empty.': 'Comment cannot be empty.',
                'Failed to send comment': 'Failed to send comment',
            },
            'de': {
                'Write your comment...': 'Schreibe deinen Kommentar...',
                'Send': 'Senden',
                'Comment cannot be empty.': 'Kommentar darf nicht leer sein.',
                'Failed to send comment': 'Kommentar konnte nicht gesendet werden',
                    },          
            'fr': {
                'Write your comment...': 'Écrivez votre commentaire...',
                'Send': 'Envoyer',
                'Comment cannot be empty.': 'Le commentaire ne peut pas être vide.',
                'Failed to send comment': 'Échec de l\'envoi du commentaire',

            },
            'pt': {
                'Write your comment...': 'Escreva seu comentário...',
                'Send': 'Enviar',
                'Comment cannot be empty.': 'O comentário não pode estar vazio.',
                'Failed to send comment': 'Falha ao enviar comentário',
            }
        };

        this.t = translator(this.translations, () => {}
        , this.shadowRoot);

    }

    render(){

                



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
            box-shadow: inset 3px 3px 6px #0006;
            /* background: linear-gradient(145deg, #cacaca, #f0f0f0);
            box-shadow:  4px 4px 8px #bebebe, */
             -4px -4px 8px #ffffff;
            border: white;
            border-radius: 9px;
            height: 5em;
            padding:15px;
            box-sizing:border-box;
            font-size: 16px;

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
            font-size:18px;
        }
        </style>

        <div class="comment-box">
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
        const body = { 
            "text": comment,
            'room': this.room,
            'data': {
                'userCategories': userCategories,
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
                    alert(this.t('Failed to send comment'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert(this.t('Failed to send comment'));
            }
        } else {
            alert(this.t('Comment cannot be empty.'));     }
    }
}

customElements.define('comment-input', CommentInput);