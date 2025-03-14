class MainNavigation extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.shadowRoot.getElementById('menubutton').addEventListener('click', () => {
            const menu =  this.shadowRoot.getElementById('menu');
            this.shadowRoot.getElementById('menu').classList.toggle('hidden');
        });
    }

    render() {
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="https://unpkg.com/sakura.css/css/sakura.css">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">

            <style>
                nav {
                    position: fixed;
                    padding: 10px;
                    top: 0;
                    left: 0;
                    display: flex;
                    overflow: hidden;
                    width: 100%;
                    z-index: 2;
                    
                }

                img {
                    height: 40px;
                }

                #menubutton {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    cursor: pointer;
                }

                #logo {
                    position: relative;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                }

                .hidden {
                    display: none;
                }

                #menu {
                    position: fixed;
                    top: 30px;
                    left: 0;
                    background-color: #f1f1f1;
                    width: 100vw;
                    /* height full window minus 30px */
                    height: calc(100vh - 30px);
                    
                    overflow: hidden;
                    transition: height 0.3s;
                    z-index: 3;
                }
               
                #menu table {
                    /* center align children content */
                    
                    width: 100%;
                    height: 100%;
                    display: table;
                }

                #menu tr {
                    width: 100%;
                    height: calc(100% / 3); /* Assuming there are 3 rows */
                }

                #menu td {
                    width: 100%;
                    /* algin center */
                    text-align: center;
                    padding: 10px;
                    cursor: pointer;
                    display: table-cell;
                    vertical-align: middle;
                }

                #menu td:hover {
                    background-color: #ddd;
                }

            </style>
            <nav>
            <div id="menubutton">
                <i class="fas fa-bars"></i>
            </div>

            <div id="menu" class="hidden">
                <table>
                    <tr><td>home</td></tr>
                    <tr><td>chapters</td></tr>
                    <tr><td>logout</td></tr>
                </table>

                </ul>
            </div>

            <img src="/aovi/logo.png" id="logo">
                
            </nav>
        `;
    }
}

customElements.define('main-navigation', MainNavigation);