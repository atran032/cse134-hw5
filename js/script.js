document.addEventListener("DOMContentLoaded", () => {
  let root = document.documentElement;

  // Theme Toggle
  let toggleBtn = document.getElementById("theme-toggle");

  let savedTheme = localStorage.getItem("theme") || "light";
  root.setAttribute("data-theme", savedTheme);

  function toggleTheme() {
    let current = root.getAttribute("data-theme");
    let next = current === "light" ? "dark" : "light";

    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  toggleBtn.addEventListener("click", toggleTheme);



  // Form Script
  let form = document.querySelector(".contact-form");

  let nameField = document.getElementById("name");
  let emailField = document.getElementById("email");
  let messageField = document.getElementById("message");

  let inlineErrorOutput = document.getElementById("inline-error");
  let submitErrorOutput = document.getElementById("submit-error");
  let formInfoOutput = document.getElementById("form-info");
  let formErrorsField = document.getElementById("form-errors");

  let messageCounter = document.getElementById("message-counter");
  let dialog = document.getElementById("submitted-dialog");

  function flashInlineError(msg) {
    inlineErrorOutput.textContent = msg;
    inlineErrorOutput.classList.add("visible");

    setTimeout(() => {
      inlineErrorOutput.textContent = "";
      inlineErrorOutput.classList.remove("visible");
    }, 5000);
  }


  // Check characters in name field
  nameField.addEventListener("beforeinput", (e) => {
    let disallowed = /[^A-Za-z\s]/;

    if (e.data && disallowed.test(e.data)) {
      e.preventDefault();

      nameField.classList.add("flash");
      setTimeout(() => nameField.classList.remove("flash"), 150);

      flashInlineError("Illegal character: letters and spaces only.");
    }
  });


  // Character countdown
  function updateMessageCounter() {
    let max = messageField.maxLength;
    let used = messageField.value.length;
    let remaining = max - used;

    messageCounter.textContent = `${remaining} characters remaining`;

    messageCounter.classList.remove("warn", "error");

    if (remaining <= 50 && remaining > 0) {
      messageCounter.classList.add("warn");
    }
    if (remaining <= 0) {
      messageCounter.classList.add("error");
    }
  }

  messageField.addEventListener("input", updateMessageCounter);
  updateMessageCounter();


  // Info pop-up for buttons
  let purposeDescriptions = {
    feedback:
      "Feedback — Tell me what you think of the site or offer suggestions.",
    question:
      "Question — Ask me something specific. I’ll get back to you soon.",
    request:
      "Feature Request — Suggest new site sections, tools, or content.",
    other:
      "Other — Anything that doesn't fit the above categories."
  };

  form.addEventListener("change", (e) => {
    if (e.target.name === "purpose") {
      formInfoOutput.textContent = purposeDescriptions[e.target.value];
      formInfoOutput.classList.add("visible");

      // Auto-hide after 7 seconds (optional)
      setTimeout(() => {
        formInfoOutput.classList.remove("visible");
      }, 7000);
    }
  });


  // Error collection
  let formErrors = [];

  form.addEventListener("submit", (e) => {
    let attemptErrors = [];

    [...form.elements].forEach((el) => {
      if (!el.name || el.type === "hidden") return;

      if (!el.checkValidity()) {
        attemptErrors.push({
          field: el.name,
          value: el.value,
          error: el.validationMessage,
          timestamp: new Date().toISOString()
        });
      }
    });

    if (attemptErrors.length > 0) {
      e.preventDefault();

      formErrors.push({
        attempt: formErrors.length + 1,
        errors: attemptErrors
      });

      submitErrorOutput.textContent =
        "The form has errors. Please fix them.";
      submitErrorOutput.classList.add("visible");

      formErrorsField.value = JSON.stringify(formErrors);

      let firstInvalid = form.querySelector(":invalid");
      if (firstInvalid) firstInvalid.focus();

      return;
    }

    formErrorsField.value = JSON.stringify(formErrors);

    dialog.showModal();
  });



  // MPA View Transition (LCD)
  // Only activate if the browser supports it
  if (document.startViewTransition) {
    document.addEventListener("click", (e) => {
      let link = e.target.closest("a");
      if (!link) return;

      // Only intercept same-origin normal navigation links
      let url = new URL(link.href);
      if (url.origin !== location.origin) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();

      // The LCD screen area we want to transition
      let screen = document.querySelector(".screen");

      document.startViewTransition(() => {
        // Navigate after DOM is in "old" state
        window.location.href = link.href;
      });
    });
  }

});




// Game Card Custom Element
class GameCard extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          background: var(--lcd-secondary, #e9f2d8);
          border: 3px solid var(--lcd-border, #1e2f24);
          border-radius: 12px;
          padding: 1rem;
          margin: 1.2rem 0;
          font-family: var(--font-main, monospace);
          color: var(--lcd-primary, #2d4739);
        }
        h2 { margin: 0 0 0.5rem; font-size: 1.1rem; text-transform: uppercase; }
        picture, img { width: 100%; border-radius: 8px; margin-bottom: 0.75rem; display:block; }
        .meta { font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--lcd-primary); }
        .desc { line-height: 1.4; margin-bottom: 0.75rem; color: var(--lcd-primary); }
        .rating { font-weight: bold; margin-bottom: 0.75rem; }
        a.more { color: var(--lcd-primary); text-decoration: underline; }
        .controls { margin-top: 0.5rem; display:flex; gap:0.5rem; justify-content:flex-end; }
        .controls button {
          background: var(--lcd-secondary-enhanced);
          color: var(--lcd-primary)
          border: 2px solid var(--lcd-border);
          padding: 0.35rem 0.6rem;
          font-family: var(--font-ui, sans-serif);
          cursor: pointer;
          border-radius: 4px;
        }
      </style>

      <h2></h2>
      <picture><img alt=""></picture>
      <p class="meta"></p>
      <p class="desc"></p>
      <p class="rating"></p>
      <a class="more" target="_blank" rel="noopener">Read more</a>

      <!-- Controls container is inside the shadow DOM so it renders -->
      <div class="controls" part="controls"></div>
    `;
  }

  static get observedAttributes() {
    return ["title", "img", "alt", "genre", "desc", "rating", "link"];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    const root = this.shadowRoot;
    switch (name) {
      case "title":
        root.querySelector("h2").textContent = newVal || "";
        break;
      case "img":
        root.querySelector("img").src = newVal || "";
        break;
      case "alt":
        root.querySelector("img").alt = newVal || "";
        break;
      case "genre":
        root.querySelector(".meta").innerHTML = `<strong>Genre:</strong> ${newVal || ""}`;
        break;
      case "desc":
        root.querySelector(".desc").textContent = newVal || "";
        break;
      case "rating":
        root.querySelector(".rating").innerHTML = newVal ? `<strong>Rating:</strong> ${newVal}` : "";
        break;
      case "link":
        root.querySelector(".more").href = newVal || "#";
        break;
    }
  }
}

customElements.define("game-card", GameCard);


// Populator
function populateCards(dataArray) {
  const container = document.querySelector("#game-card-list");
  container.innerHTML = ""; // Clear existing

  dataArray.forEach(g => {
    const card = document.createElement("game-card");
    for (const key in g) {
      card.setAttribute(key, g[key]);
    }
    container.appendChild(card);
  });
}


// Local Data
const defaultLocalData = [
  {
    title: "Kingdom Come: Deliverance II",
    img: "images/kcd2.jpg",
    alt: "Henry riding a horse through medieval Bohemia.",
    genre: "Action RPG",
    desc: "Immersive historical RPG set in 1403 Bohemia. A masterful blend of realism and narrative-driven storytelling.",
    rating: "★★★★★",
    link: "https://www.kingdomcomerpg.com/"
  },
  {
    title: "Cyberpunk 2077",
    img: "images/cp2077.jpg",
    alt: "V looking over Night City at sunset.",
    genre: "Action RPG",
    desc: "A dystopian open-world adventure with strong gameplay, emotional storytelling, and breathtaking worldbuilding.",
    rating: "★★★★★",
    link: "https://www.cyberpunk.net/"
  }
];

// Save local dataset if missing
if (!localStorage.getItem("gameDataLocal")) {
  localStorage.setItem("gameDataLocal", JSON.stringify(defaultLocalData));
}


// Load Button Handlers
document.addEventListener("DOMContentLoaded", () => {
  // local
  document.querySelector("#loadLocal").addEventListener("click", () => {
    const localData = JSON.parse(localStorage.getItem("gameDataLocal"));
    populateCards(localData);
  });

  // remote
  document.querySelector("#loadRemote").addEventListener("click", async () => {
    try {
      const response = await fetch("https://my-json-server.typicode.com/atran032/cse134-portfolio-data/games");
      const remoteData = await response.json();
      populateCards(remoteData);
    } catch (err) {
      console.error("Remote fetch failed:", err);
    }
  });
});



// Custom CRUD
// Ensure storage exists
if (!localStorage.getItem("gameDataCustom")) {
  localStorage.setItem("gameDataCustom", JSON.stringify([]));
}

// Load custom list into UI
function loadCustomList() {
  const list = JSON.parse(localStorage.getItem("gameDataCustom"));
  populateCustomList(list);
}

function populateCustomList(dataArray) {
  const container = document.querySelector("#custom-list");
  container.innerHTML = "";

  dataArray.forEach((g, index) => {
    const card = document.createElement("game-card");

    // set attributes that game-card expects
    for (const key in g) {
      card.setAttribute(key, g[key]);
    }

    // Create control buttons (in the outer JS context)
    const editBtnHtml = `<button class="editBtn" data-index="${index}">Edit</button>`;
    const deleteBtnHtml = `<button class="deleteBtn" data-index="${index}">Delete</button>`;

    // Write them into the card's shadow .controls container
    const controlsContainer = card.shadowRoot.querySelector(".controls");
    if (controlsContainer) {
      controlsContainer.innerHTML = editBtnHtml + deleteBtnHtml;
    } else {
      // fallback: append to light DOM (only happens if shadow isn't found)
      const fallback = document.createElement("div");
      fallback.innerHTML = editBtnHtml + deleteBtnHtml;
      card.appendChild(fallback);
    }

    container.appendChild(card);
  });
}


// Setup CRUD form events when DOM loads
document.addEventListener("DOMContentLoaded", () => {

  const form = document.querySelector("#gameForm");
  if (!form) return;   // Prevent running on hobbies.html

  const title = document.querySelector("#title");
  const genre = document.querySelector("#genre");
  const desc = document.querySelector("#desc");
  const rating = document.querySelector("#rating");
  const link = document.querySelector("#link");
  const editIndexField = document.querySelector("#editIndex");
  const cancelEdit = document.querySelector("#cancelEdit");

  loadCustomList();

  // Save (Create or Update)
  form.addEventListener("submit", e => {
    e.preventDefault();

    const data = {
      title: title.value,
      genre: genre.value,
      desc: desc.value,
      rating: rating.value,
      link: link.value,
      img: "images/default.jpg", // placeholder
      alt: title.value
    };

    const list = JSON.parse(localStorage.getItem("gameDataCustom"));

    // Editing existing
    if (editIndexField.value !== "") {
      const index = parseInt(editIndexField.value);
      list[index] = data;
    } 
    // Creating new
    else {
      list.push(data);
    }

    localStorage.setItem("gameDataCustom", JSON.stringify(list));

    form.reset();
    editIndexField.value = "";
    cancelEdit.style.display = "none";

    loadCustomList();
  });


  // Handle Edit/Delete clicks
  document.addEventListener("click", (e) => {
    const path = e.composedPath();

    const editBtn = path.find(el => el.classList && el.classList.contains("editBtn"));
    const deleteBtn = path.find(el => el.classList && el.classList.contains("deleteBtn"));

    if (editBtn) {
      const index = parseInt(editBtn.dataset.index, 10);
      handleEdit(index);
      return;
    }

    if (deleteBtn) {
      const index = parseInt(deleteBtn.dataset.index, 10);
      handleDelete(index);
      return;
    }
  });

});

function handleEdit(index) {
  const list = JSON.parse(localStorage.getItem("gameDataCustom") || "[]");
  const item = list[index];
  if (!item) return;

  document.querySelector("#title").value = item.title || "";
  document.querySelector("#genre").value = item.genre || "";
  document.querySelector("#desc").value = item.desc || "";
  document.querySelector("#rating").value = item.rating || "";
  document.querySelector("#link").value = item.link || "";
  document.querySelector("#editIndex").value = index;
  document.querySelector("#cancelEdit").style.display = "inline-block";
}

function handleDelete(index) {
  if (!confirm("Delete this item?")) return;
  const list = JSON.parse(localStorage.getItem("gameDataCustom") || "[]");
  list.splice(index, 1);
  localStorage.setItem("gameDataCustom", JSON.stringify(list));
  loadCustomList(); // re-render
}