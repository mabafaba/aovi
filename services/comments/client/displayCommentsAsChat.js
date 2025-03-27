class CommentsAsChat extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.comments = [];

        this.render();
        this.room = 'default-room';


        this.translations = {
            'en': {
                'Disagree': 'Disagree',
                'Neutral': 'Neutral',
                'Agree': 'Agree'
            },
            'de': {
                'Agree': 'stimme zu',
                'Neutral': 'neutral',
                'Disagree': 'stimme nicht zu'
            },
            'es': {
                'Agree': 'de acuerdo',
                'Neutral': 'neutral',
                'Disagree': 'en desacuerdo'
            },
            'fr': {
                'Agree': 'd\'accord',
                'Neutral': 'neutre',
                'Disagree': 'pas d\'accord'
            },
            'pt': {
                'Agree': 'concordo',
                'Neutral': 'neutro',
                'Disagree': 'discordo'
            }
        };
    


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



    this.t = translator(this.translations, () => {
        console.log('Language changed');
        // this.render();
    }, this.shadowRoot);
    }

    async connectedCallback() {
        this.room = this.getAttribute('room') || 'default-room';
        // remove existing observer
        if (this.observer) {
            this.observer.disconnect();
        }
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'room') {
                    this.room = this.getAttribute('room') || 'default-room';
                    // empty comments
                    this.comments = [];
                    this.shadowRoot.getElementById('comments-container').innerHTML = '';
                    this.connectedCallback();

                    
                }
            });
        });
        this.observer.observe(this, { attributes: true });
        try {
            const comments = await this.fetchComments();
            this.comments = comments;
            for (const comment of comments) {
                const commentHTML = this.generateCommentHTML(comment);
                this.shadowRoot.getElementById('comments-container').appendChild(commentHTML);
            }

            // this.scrollToBottom();
            
            this.shadowRoot.querySelectorAll('.reaction-buttons button').forEach(button => {
                button.addEventListener('click', (event) => {
                    const targetedButton = event.target;
                    const notTargetedButtons = Array.from(targetedButton.parentElement.children).filter(button => button !== targetedButton);
                    notTargetedButtons.forEach(button => button.classList.add('passive-button'));
                    targetedButton.classList.remove('passive-button');
                });
            });
        } catch (error) {
            console.error(error);
        }
        this.listenForNewComments();
        this.listenForUpdatedComments();
        this.observeCommentContainer();
        // trigger translation
        document.documentElement.lang = document.documentElement.lang;


        // if document event "<comment-input>: posted successfully", scroll to bottom
        document.addEventListener('<comment-input>: posted successfully', () => {
            console.log("I MADE A COMMENT SCROLLING DOWN");
            this.scrollToBottom();
        });
    }

    observeCommentContainer() {
        const commentsContainer = this.shadowRoot.getElementById('comments-container');
        const observer = new MutationObserver(() => {
            // this.scrollToBottom();
        });
        observer.observe(commentsContainer, { childList: true });
    }

    addComment(comment) {
        this.comments.push(comment);
        const commentHTML = this.generateCommentHTML(comment);
        this.shadowRoot.getElementById('comments-container').appendChild(commentHTML);
        // update translation
        document.documentElement.lang = document.documentElement.lang;
    }

    generateCommentHTML(comment) {
        console.log("comment",comment);
        const htmlstring = `
            <div class='commentBubble'>
            <div class='time'>${new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <p class="commentmaintext">${comment.text}</p>
                <div class="reaction-buttons">
                <button id="disagree-button"><div class="button-counter"></div><div class="button-text" data-translator-text="Disagree"></div></button>
                <button id="neutral-button"><div class="button-counter"></div><div class="button-text" data-translator-text="Neutral"></div></button>
                <button id="agree-button" ><div class="button-counter"></div><div class="button-text" data-translator-text="Agree"></div></button>
                </div>
            </div>
                `;
        const htmlElement = document.createElement('div');
        htmlElement.className = 'comment';
        htmlElement.id = comment._id;
        htmlElement.innerHTML = htmlstring;
        // add click events (set button style & post to server)
        htmlElement.querySelector('#agree-button').addEventListener('click', () => this.postReaction(comment, 'agree'));
        htmlElement.querySelector('#neutral-button').addEventListener('click', () => this.postReaction(comment, 'neutral'));
        htmlElement.querySelector('#disagree-button').addEventListener('click', () => this.postReaction(comment, 'disagree'));

        // set counter values
        htmlElement.querySelector('#agree-button .button-counter').innerText = comment.usersAgree;
        htmlElement.querySelector('#neutral-button .button-counter').innerText = comment.usersNeutral;
        htmlElement.querySelector('#disagree-button .button-counter').innerText = comment.usersDisagree;

        // comment.myReaction sets the button style
        const reactionButtons = htmlElement.querySelectorAll('.reaction-buttons button');
        if(comment.myReaction != 'none'){
        reactionButtons.forEach(button => button.classList.add('passive-button'));
        if (comment.myReaction === 'agree') {
            htmlElement.querySelector('#agree-button').classList.remove('passive-button');
        }
        if (comment.myReaction === 'neutral') {
            htmlElement.querySelector('#neutral-button').classList.remove('passive-button');
        }
        if (comment.myReaction === 'disagree') {
            htmlElement.querySelector('#disagree-button').classList.remove('passive-button');
        }
        }

        return htmlElement

    }

    async postReaction(comment, reaction) {
        // set butotn styles
        console.log('posting reaction', reaction);
        console.log('to comment', comment);
        const commentElement = this.shadowRoot.getElementById(comment._id);

        // scroll to next comment
        const nextComment = commentElement.nextElementSibling;
        if (nextComment) {
            nextComment.scrollIntoView({ behavior: 'smooth' });
        }
        


        const reactionButtons = commentElement.querySelectorAll('.reaction-buttons button');
        reactionButtons.forEach(button => button.classList.add('passive-button'));
        const buttonId = reaction === 'agree' ? 'agree-button' : reaction === 'neutral' ? 'neutral-button' : 'disagree-button';
        commentElement.querySelector(`#${buttonId}`).classList.remove('passive-button');
        if(! ['agree', 'disagree', 'neutral'].includes(reaction)) {
            console.error('Invalid reaction');
            return;
        }   
        try {
            
            const response = await fetch(`/aovi/comments/reaction/${comment._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reaction: reaction,
                    commentId: comment._id

                }
                )
            });
            if (response.ok) {
                console.log('Reaction posted');
                

            } else {
                console.error('Failed to post reaction');
            }
        } catch (error) {
            console.error(error);
        }
    }

    listenForNewComments() {
        console.log("creating socket connection")
        if(!this.socket) {
            this.socket = io( { path: '/aovi-socket-io' });  
        } 

        // join room
        this.socket.emit('join', this.room);

        this.socket.on('comment created', (comment) => {
            console.log('New comment:', comment);
            this.addComment(comment);
            // this.scrollToBottom();
        });
        
    }

    listenForUpdatedComments() {
        if(!this.socket) {
            this.socket = io( { path: '/aovi-socket-io' });  
        } 
        this.socket.on('comment reacted', (comment) => {
            const commentElement = this.shadowRoot.getElementById(comment._id);
            if (commentElement) {
                // for each button, update the counter
                
                const agreeCounter = commentElement.querySelector('#agree-button .button-counter');
                const neutralCounter = commentElement.querySelector('#neutral-button .button-counter');
                const disagreeCounter = commentElement.querySelector('#disagree-button .button-counter');
                agreeCounter.innerText = comment.usersAgree;
                neutralCounter.innerText = comment.usersNeutral;
                disagreeCounter.innerText = comment.usersDisagree;
            }
        });
    }

    async fetchComments() {
        console.log('fetching comments for room', this.room);
        try {
            const url =  '/aovi/comments/room/' + this.room;
            const urlEncoded = encodeURI(url);
            console.log('fetching comments from', urlEncoded);
            const response = await fetch(urlEncoded, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('response', response);
            const comments = await response.json();
            console.log('comments', comments);
            return comments;
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    scrollToBottom() {
        
        // wait 500ms before scrolling to bottom
        setTimeout(() => {
            
            const commentsContainer = this.shadowRoot.getElementById('comments-container');
            console.log('container', commentsContainer);
            if (commentsContainer) {
                console.log('previous scroll value', commentsContainer.scrollTop);
                console.log('scrolling to', commentsContainer.scrollHeight);
                if (commentsContainer) {
                    // scroll animation
                    commentsContainer.scrollTo({
                        top: commentsContainer.scrollHeight,
                        behavior: 'smooth'
                    });
                }else {
                    console.log('commentsContainer is null');
                }
            }
        }
        , 500);
    }
    

    render() {
        this.shadowRoot.innerHTML = `

            <style>
            .comment:last-child {
                border-bottom: none;
            }

            .comment {
                color:black;
                float:right;
                position: relative;
                background-color: rgba(208, 208, 208, 0.76);
                width: 70%;
                padding: 20px;
                border-radius: 40px;
                border-bottom-right-radius: 0;
                margin-bottom: 10%;
                margin-height:10%;
                min-height: 50px;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                
            }
            #comments-container {
                width: 100%;
                height: 100%;
                overflow-y: scroll;
            }
            #disagree-button {
                background-color:rgb(240, 67, 67);
                border-radius: 0;
                border-top-left-radius: 10px;
                border-bottom-left-radius: 10px;
                margin-right: 0;
                margin:0px;
            }
            #neutral-button {
                background-color:rgb(192, 194, 184);
                border-radius: 0;
                margin-right: 0;
                margin-left: 0;
            }

            #agree-button {
                background-color:rgb(67, 240, 128);
                border-radius: 0;
                margin-left: 0;
                border-top-right-radius: 10px;
                border-bottom-right-radius: 10px;
            }

            .reaction-buttons {
                position: absolute;
                bottom: 10px;
                right: 10px;
                display: flex;
            }

            .reaction-buttons button {
                margin: 0;
                border: none;
            }

            button {
                border: none;
                color: white;
                padding: 5px 10px;
                border-radius: 5px;
                margin: 5px;
                cursor: pointer;
            }

            .passive-button {
                filter: saturate(50%) brightness(50%);
            }

            .time {
                font-size:9px;
                color:#99999;
                text-align:right;
                padding-right:5px;
            }

            .commentmaintext {
                font-size:12px;
                padding:20px;
                text-align:right;
            }

            .button-counter {
                font-size: 8px;
                padding-right:3px;
                display:inline;
            }

            .button-text {
                font-size: 8px;
                display:inline;
            }
            
            </style>
            <div id="comments-container">
            </div>
        `;
    }
}

customElements.define('display-comments-as-chat', CommentsAsChat);

