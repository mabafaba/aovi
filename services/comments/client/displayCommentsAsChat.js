class CommentsAsChat extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.comments = [];

        this.render();
        this.room = 'default-room';
    
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
            this.scrollToBottom();
            
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
        this.observeCommentContainer();
    }

    observeCommentContainer() {
        const commentsContainer = this.shadowRoot.getElementById('comments-container');
        const observer = new MutationObserver(() => {
            this.scrollToBottom();
        });
        observer.observe(commentsContainer, { childList: true });
    }

    addComment(comment) {
        this.comments.push(comment);
        const commentHTML = this.generateCommentHTML(comment);
        this.shadowRoot.getElementById('comments-container').appendChild(commentHTML);
    }

    generateCommentHTML(comment) {
        const htmlstring = `
            <div class='commentBubble'>
            <div class='time'>${new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <p class="commentmaintext">${comment.text}</p>
                <div class="reaction-buttons">
                <button id="disagree-button">Disagree</button><button id="neutral-button">Neutral</button><button id="agree-button">Agree</button>
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
                // scroll to next comment
                const nextComment = commentElement.nextElementSibling;
                if (nextComment) {
                    nextComment.scrollIntoView({ behavior: 'smooth' });
                }

            } else {
                console.error('Failed to post reaction');
            }
        } catch (error) {
            console.error(error);
        }
    }

    listenForNewComments() {
        console.log("creating socket connection")
        const socket = io( { path: '/aovi-socket-io' });

        // join room
        socket.emit('join', this.room);

        socket.on('comment created', (comment) => {
            console.log('New comment:', comment);
            this.addComment(comment);
            this.scrollToBottom();
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
            return await response.json();
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
            <link rel="stylesheet" href="https://unpkg.com/sakura.css/css/sakura.css">

        <link rel="stylesheet" href="https://newcss.net/theme/terminal.css"> 
            <style>
            .comment:last-child {
                border-bottom: none;
            }

            .comment {
                position: relative;
                background-color: rgba(234, 234, 234, 0.76);
                width: 90%;
                padding: 10px;
                border-radius: 40px;
                border-bottom-right-radius: 0;
                margin-bottom: 10px;
                height: 80%;
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
                font-size:16px;
                padding:20px;
                text-align:right;
            }
            
            </style>
            <div id="comments-container">
            </div>
        `;
    }
}

customElements.define('display-comments-as-chat', CommentsAsChat);

