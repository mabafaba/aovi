class CommentInput extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.room = "default-room";

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

            .comment-box .radio-group {
                display: table;
                width: 100%;
                margin-bottom: 10px;
                font-size: 0.8em;
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
            }
            </style>
            <link rel="stylesheet" href="https://unpkg.com/sakura.css/css/sakura.css">

            <div class="comment-box">
            <div class="radio-group">
            <div>
    <input type="radio" id="theme2" name="theme" value="theme2">
    <label for="theme2">Direitos e desenvolvimento social</label>
</div>
<div>
    <input type="radio" id="theme3" name="theme" value="theme3">
    <label for="theme3">Economia e sustentabilidade</label>
</div>
<div>
    <input type="radio" id="theme1" name="theme" value="theme1" checked>
    <label for="theme1">Democracia e soberania</label>
</div>
            </div>
            <textarea placeholder="Write your comment..."></textarea>
            <button class="sendMessageButton">Send</button>
            </div>
        `;
    }

    connectedCallback() {
        this.room = this.getAttribute('room') || 'default-room';
        console.log('input room', this.room);

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
        const textarea = this.shadowRoot.querySelector('textarea');
        const comment = textarea.value.trim();

        if (comment) {
            try {
                const response = await fetch('/aovi/comments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        "text": comment,
                        'room': this.room

                     })
                });

                if (response.ok) {
                    textarea.value = '';
                } else {
                    alert('Failed to send comment - please check your connection');
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