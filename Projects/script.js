/* ------------------------------------------------------------------ *
 * PROJECT CARDS
 *
 * To add a card, copy one group below and fill it in.
 *
 * Paths for banner/icon are relative to the Assets folder, e.g.
 *   banner: "Pictures/my-banner.jpg"
 *   -> /Assets/Pictures/my-banner.jpg
 *
 * Leave banner or icon as "" to show asset_missing.png.
 *
 * Buttons (bottom-right, left to right): docs, github, link (the project).
 * Leave a field out or as "" and that button is not shown.
 *
 * Keywords are used by the search bar. The title and description
 * are also searchable.
 * ------------------------------------------------------------------ */

const ASSETS = "../Assets/";

const PROJECTS = [
  {
    banner: "Pictures/Projects/2pbb.svg",
    icon: "Pictures/Projects/2pb.png",

    title: "2 Player Battles",
    description: "Local 2 Player Game.",

    keywords: [
      "2 player",
      "two player",
      "multiplayer",
      "local multiplayer",
      "coop",
      "co-op",
      "battle",
      "fighting",
      "competitive",
      "party game"
    ],

    docs: "https://example.com",
    github: "https://github.com/ImAlekzzz/",
    link: "https://imalekzzz.itch.io/2-player-battles",
  },
];



const make = (tag, className, props = {}) =>
  Object.assign(document.createElement(tag), {
    className,
    ...props
  });

const ACTIONS = [
  { key: "docs",   icon: "Pictures/docs.png", label: "Docs" },
  { key: "github", icon: "Pictures/code.svg", label: "Code" },
  { key: "link",   icon: "Pictures/go.png",   label: "Open" },
];


function renderCard(p) {
  const card = make("article", "card");

  // Title scrambles when card is hovered
  card.dataset.hoverScramble = "";

  card.append(
    make("img", "card-banner", {
      src: p.banner ? ASSETS + p.banner : MISSING_IMG_URL,
      alt: ""
    })
  );

  card.append(
    make("img", "card-icon", {
      src: p.icon ? ASSETS + p.icon : MISSING_IMG_URL,
      alt: ""
    })
  );

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

  // Buttons: docs, github, project (only the ones the card has)
  const buttons = ACTIONS.filter((a) => p[a.key]);
  if (buttons.length) {
    card.classList.toggle("multi", buttons.length > 1); // more than 1 button get their own row
    const row = make("div", "card-actions");
    buttons.forEach((a) => {
      const wrap = make("span", "act");
      const btn = make("button", "icon-btn card-go");
      btn.dataset.href = p[a.key];
      btn.setAttribute("aria-label", `${a.label}: ${p.title}`);
      btn.append(make("img", "", { src: ASSETS + a.icon, alt: "" }));
      wrap.append(btn, make("span", "card-tip", { textContent: a.label }));
      row.append(wrap);
    });
    card.append(row);
  }

  return card;
}


const cardsContainer = document.getElementById("cards");

function renderProjects(projects) {
  cardsContainer.replaceChildren(
    ...projects.map(renderCard)
  );
}

// Show all projects when the page loads
renderProjects(PROJECTS);


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
    renderProjects(PROJECTS);
    return;
  }

  const terms = query.split(/\s+/);

  const filteredProjects = PROJECTS.filter(project => {
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

  renderProjects(filteredProjects);
});
