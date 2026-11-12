/* ------------------------------------------------------------------ *
 * BLOG CARDS
 *
 * To add a card, copy one group below and fill it in.
 *
 * Buttons (bottom-right, left to right): docs, github, link (the project).
 * Leave a field out or as "" and that button is not shown.
 *
 * Keywords are used by the search bar. The title and description
 * are also searchable.
 * ------------------------------------------------------------------ */


const BLOGS = [
 {

title: "Test",
description: "TEstestsetstests",

keywords: [
"hey",
"this",
"is",
"a",
"test"
],

link: "example.com",
docs: "example.com",
},
];



const make = (tag, className, props = {}) =>
  Object.assign(document.createElement(tag), {
    className,
    ...props
  });

const ACTIONS = [
  { key: "docs",   icon: "Pictures/docs.png", label: "Docs" },
  { key: "link",   icon: "Pictures/go.png",   label: "Open" },
];


function renderCard(p) {
  const card = make("article", "card");

  // Title scrambles when card is hovered
  card.dataset.hoverScramble = "";

  const body = make("div", "card-body");

  const title = make("h2", "card-title", {
    textContent: p.title
  });

  title.dataset.hoverText = "";

  body.append(
    title,
    make("p", "card-desc", {
      textContent: p.description
    })
  );

  card.append(body);

  // Buttons: docs, project (only the ones the card has)
  const buttons = ACTIONS.filter((a) => p[a.key]);
  if (buttons.length) {
    card.classList.toggle("multi", buttons.length > 1); // more than 1 button get their own row
    const row = make("div", "card-actions");
    buttons.forEach((a) => {
      const wrap = make("span", "act");
      const btn = make("button", "icon-btn card-go");
      btn.dataset.href = p[a.key];
      btn.setAttribute("aria-label", `${a.label}: ${p.title}`);
      wrap.append(btn, make("span", "card-tip", { textContent: a.label }));
      row.append(wrap);
    });
    card.append(row);
  }

  return card;
}


const cardsContainer = document.getElementById("cards");

function renderBlogs(projects) {
  cardsContainer.replaceChildren(
    ...projects.map(renderCard)
  );
}

// Show all blogs when the page loads
renderBlogs(BLOGS);


/* ------------------------------------------------------------------ *
 * SEARCH
 *
 * Searches:
 *   - title
 *   - description
 *   - keywords
 *
 * Multiple words use AND logic.
 *
 * Example:
 *   "local multiplayer"
 *
 * The project must contain BOTH "local" and "multiplayer"
 * somewhere in its title, description, or keywords.
 * ------------------------------------------------------------------ */

const searchInput = document.querySelector(".search input");

if (searchInput) searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();

  if (!query) {
    renderBlogs(BLOGS);
    return;
  }

  const terms = query.split(/\s+/);

  const filteredBlogs = BLOGS.filter(project => {
    // Combine everything that should be searchable
    const searchableText = [
      project.title,
      project.description,
      ...(project.keywords || [])
    ]
      .join(" ")
      .toLowerCase();

    // Every search term must be found
    return terms.every(term =>
      searchableText.includes(term)
    );
  });

  renderBlogs(filteredBlogs);
});
