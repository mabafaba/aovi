class MainNavigation extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();

    this.shadowRoot
      .getElementById("menubutton")
      .addEventListener("click", () => {
        const menu = this.shadowRoot.getElementById("menu");
        this.shadowRoot.getElementById("menu").classList.toggle("hidden");
      });

    // Check for event ID in URL and fetch event logo
    this.checkAndLoadEventLogo();

    // if back-url attribute is set, show back button & add event listener

    // fetching back0-url
    console.log("back url:", this.getAttribute("back-url"));
    if (this.getAttribute("back-url")) {
      console.log("back url set to", this.getAttribute("back-url"));
      this.shadowRoot.getElementById("backbutton").classList.remove("hidden");
      this.shadowRoot
        .getElementById("backbutton")
        .addEventListener("click", () => {
          window.location.href = this.getAttribute("back-url");
        });
    }

    // if menu-item-1-label & menu-item-1-url attributes are set, add menu item (for however many are set)
    const setMenuItems = () => {
      console.log("setting menu items");
      // get menu labels from attributes (stored as json array string)
      let menuLabels = this.getAttribute("menu-item-labels");
      console.log(menuLabels);
      if (menuLabels) {
        menuLabels = JSON.parse(menuLabels);
      }
      console.log("menu labels", menuLabels);
      const menuUrls = JSON.parse(this.getAttribute("menu-item-urls"));
      const menu = this.shadowRoot.getElementById("menu");
      const table = menu.querySelector("table");
      console.log("table", table);
      // clear existing menu items
      table.innerHTML = "";
      // create new menu items unless null
      // log wether menu labels are null

      if (menuLabels === null) {
        // hide menu button
        this.shadowRoot.getElementById("menubutton").classList.add("hidden");
        return;
      }
      menuLabels.forEach((label, index) => {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.textContent = label;
        td.addEventListener("click", () => {
          window.location.href = menuUrls[index];
        });
        tr.appendChild(td);
        table.appendChild(tr);
      });
    };

    setMenuItems();
  }

  // Method to check URL for event ID and load event logo
  async checkAndLoadEventLogo() {
    const currentUrl = window.location.pathname;
    const eventIdMatch = currentUrl.match(
      /\/aovi\/views\/events\/([a-f\d]{24})/
    );

    if (eventIdMatch) {
      const eventId = eventIdMatch[1];
      try {
        const response = await fetch(`/aovi/rooms/id/${eventId}`);
        if (response.ok) {
          const roomData = await response.json();
          if (roomData.data && roomData.data.logo) {
            this.replaceMainLogo(roomData.data.logo);
          } else {
            // If no event logo, show the original logo
            this.showOriginalLogo();
          }
        }
      } catch (error) {
        console.error("Error fetching event data:", error);
      }
    } else {
      // If no event ID in URL, show the original logo
      this.showOriginalLogo();
    }
  }

  // Method to replace the main logo with event logo
  replaceMainLogo(logoBase64) {
    const mainLogo = this.shadowRoot.getElementById("logo");
    if (mainLogo && logoBase64) {
      mainLogo.src = logoBase64;
      mainLogo.classList.remove("hidden");
    }
  }

  // Method to show the original logo
  showOriginalLogo() {
    const mainLogo = this.shadowRoot.getElementById("logo");
    if (mainLogo) {
      mainLogo.src = "/aovi/static/logo.png"; // Assuming the original logo path
      mainLogo.classList.remove("hidden");
    }
  }

  static get observedAttributes() {
    return ["back-url", "menu-item-labels", "menu-item-urls"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "back-url" && this.shadowRoot) {
      const backButton = this.shadowRoot.getElementById("backbutton");
      if (newValue) {
        console.log("back url set to", newValue);
        backButton.classList.remove("hidden");
        backButton.addEventListener("click", () => {
          window.location.href = newValue;
        });
      } else {
        backButton.classList.add("hidden");
        backButton.removeEventListener("click", () => {
          window.location.href = oldValue;
        });
      }
    }
    if (oldValue !== newValue) {
      this.render();
      this.connectedCallback();
      // Also check for event logo when navigation changes
      if (this.shadowRoot) {
        this.checkAndLoadEventLogo();
      }
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
      this.connectedCallback();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="https://unpkg.com/sakura.css/css/sakura.css">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
            <script src="/aovi/static/languagepicker.js"></script>
            <style>
                nav {
                    position: relative;
                    top: 0;
                    left: 0;
                    display: flex;
                    overflow: hidden;
                    width: 100%;
                    z-index: 2;
                    box-sizing: border-box;
                    height: 100%;
                    padding-left: 15px;
                    padding-right: 15px;
                    
                }

                /* all children and children children erc. */
                nav * {
                    box-sizing: border-box;
                }

                nav {
                    align-items: center;
                }

                img {
                    max-height: 80%;
                }

                #menubutton {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    cursor: pointer;
                }

                #logo {
                    position: absolute;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    margin-bottom: 0;
                }

                #unitaclogo {
                    position: relative;
                    top: 0;
                    left: 0px;
                    max-height: 60%;
                    box-sixing: border-box;
                    margin-top: auto;
                    margin-bottom: auto;
                    cursor: pointer;

                }

                .hidden {
                    visibility: hidden !important;
                }

                #menu {
                    position: fixed;
                    top: 80px;
                    left: 0;
                    background-color: #f1f1f1;
                    width: 100vw;
                    height: calc(100vh - 80px);
                    overflow: hidden;
                    transition: height 0.3s ease-in-out;
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

                #backbutton {

                    cursor: pointer;
                }

                language-picker {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                }


                /* shadow below nav */

                nav {
                    box-shadow: 0 2px 4px 0 rgba(0,0,0,0.2);
                }

            </style>
            <nav>

            <div id="backbutton" class="hidden">
                <i class="fas fa-arrow-left"></i>
            </div>

            <div id="menubutton" class="">
                <i class="fas fa-bars"></i>
            </div>

             <div id="menu" class="hidden">
                <table>
                </table>
            </div>
           
            <img src="/aovi/static/unitaclogo.png" id="unitaclogo" onclick="window.open('https://unitac.un.org/', '_blank')">
            <img src="/aovi/static/logo.png" id="logo" class="hidden">

            <language-picker languages="pt,en,fr,de"></language-picker>
                
            </nav>
        `;
  }
}

customElements.define("main-navigation", MainNavigation);
