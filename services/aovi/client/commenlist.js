class CommentComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        

        this.text = this.getAttribute('text');
        this.usersAgree = this.getAttribute('usersAgree');
        this.usersDisagree = this.getAttribute('usersDisagree');
        this.usersNeutral = this.getAttribute('usersNeutral');
        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                .comment {
                    border: 1px solid black;
                    padding: 10px;
                    margin: 10px;
                    border-radius: 10px;
                }
                .votes {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 10px;
                    font-size: 10px;
                }
                .smallLabel {
                    display: inline-flex;
                }
            </style>
            <div class="comment">
                ${this.text}
                <div class="votes">
                    <div class="smallLabel" data-translator-text="agree"> agree</div><div class="smallLabel">${this.usersAgree}</div>
                    <div class="smallLabel" data-translator-text="disagree"> disagree</div><div class="smallLabel">${this.usersDisagree}</div>
                    <div class="smallLabel" data-translator-text="neutral"> neutral</div><div class="smallLabel">${this.usersNeutral}</div>
                </div>
            </div>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
}

customElements.define('comment-component', CommentComponent);


class CommentListComponent extends HTMLElement {


    constructor(comments, userCategories, themes) {
        super();
        this.attachShadow({ mode: 'open' });

        this.comments = comments;
        this.userCategories = userCategories;
        this.themes = themes;
        this.sortOptions = ['Most Agreed', 'Controversial', 'Most Disagreed', 'Most Neutral', 'Most Votes'];

        this.categoricalFilters = [];

    }

    connectedCallback() {
        const template = document.createElement('template');


        const sortDropdown = document.createElement('select');
        sortDropdown.id = 'sortingInput';
        sortDropdown.innerHTML = this.sortOptions.map(option => `<option value="${option}" data-translator-text="${option}">${option}</option>`).join('');

        sortDropdown.addEventListener('change', (event) => {
            this.renderComments();
        });

        const userCategoriesCheckboxes = document.createElement('div');
        userCategoriesCheckboxes.id = 'userCategoriesCheckboxes';

        this.userCategories.forEach(category => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = category;
            checkbox.name = category;
            checkbox.value = category;
            checkbox.checked = true;
            checkbox.addEventListener('change', (event) => {
                this.renderComments();
            });

            const label = document.createElement('label');
            label.htmlFor = category;
            label.textContent = category;

            userCategoriesCheckboxes.appendChild(checkbox);
            userCategoriesCheckboxes.appendChild(label);
        }
        );
        

        this.shadowRoot.innerHTML = `
            <style>
            .commentList {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            </style>
            <div id="controls">
            </div>
            <div id="commentList">
            ${this.comments.map(comment => `<comment-component text="${comment.text}" usersAgree="${comment.usersAgree}" usersDisagree="${comment.usersDisagree}" usersNeutral="${comment.usersNeutral}" userCategories="${comment.userCategories}" theme="${comment.theme}" commentId="${comment._id}"></comment-component>`).join('')}
            </div>
        `;

        this.shadowRoot.getElementById('controls').appendChild(sortDropdown);
        this.shadowRoot.getElementById('controls').appendChild(userCategoriesCheckboxes);
        this.renderComments();
    }


    categoricalFilter(name, values) {
        // for each value, create a checkbox
        const checkboxes = values.map(value => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.setAttribute('data-category-name', name);
            checkbox.addEventListener('change', (event) => {
                this.renderComments();
            
            });

            const label = document.createElement('label');
            label.htmlFor = value;
            label.textContent = value;
            label.prepend(checkbox);
            return label;
        });
        return checkboxes;
    }


    renderComments() {
        const commentList = this.shadowRoot.getElementById('commentList');
        const sortingInput = this.shadowRoot.getElementById('sortingInput');
        const userCategoriesCheckboxes = this.shadowRoot.getElementById('userCategoriesCheckboxes');
        const selectedCategories = Array.from(userCategoriesCheckboxes.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
        const selectedSorting = sortingInput.value;
        const sortedComments = this.sortComments(this.comments, selectedSorting);
        const filteredComments = this.filterComments(sortedComments, selectedCategories);
        commentList.innerHTML = filteredComments.map(comment => `<comment-component text="${comment.text}" usersAgree="${comment.usersAgree}" usersDisagree="${comment.usersDisagree}" usersNeutral="${comment.usersNeutral}"></comment-component>`).join('');
    }

    sortComments(comments, sorting) {
        switch (sorting) {
            case 'Most Agreed':
                return comments.sort((a, b) => b.usersAgree - a.usersAgree);
            case 'Controversial':
                return comments.sort((a, b) => Math.abs(b.usersAgree - b.usersDisagree) - Math.abs(a.usersAgree - a.usersDisagree));
            case 'Most Disagreed':
                return comments.sort((a, b) => b.usersDisagree - a.usersDisagree);
            case 'Most Neutral':
                return comments.sort((a, b) => b.usersNeutral - a.usersNeutral);
            case 'Most Votes':
                return comments.sort((a, b) => (b.usersAgree + b.usersDisagree + b.usersNeutral) - (a.usersAgree + a.usersDisagree + a.usersNeutral));
        }
    }

    filterComments(comments, categories) {
        return comments.filter(comment => comment.userCategories.some(category => categories.includes(category)));
    }
}

customElements.define('comment-list-component', CommentListComponent);