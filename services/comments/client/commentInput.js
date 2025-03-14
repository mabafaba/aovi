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
                .comment-box button {
                    align-self: flex-end;
                }
            </style>
                <link rel="stylesheet" href="https://unpkg.com/sakura.css/css/sakura.css">

            <div class="comment-box">
                <textarea placeholder="Write your comment..."></textarea>
                <button>Send</button>
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