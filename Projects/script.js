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
 * Leave link as "" to hide the go button.
 *
 * Keywords are used by the search bar. The title and description
 * are also searchable.
 * ------------------------------------------------------------------ */

const ASSETS = "../Assets/";

const PROJECTS = [
  {
    banner: "Pictures/Projects/2pbb.svg",
    icon: "Pictures/Projects/2pb.png",

    title: "2 Player Games",
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

    link: "https://imalekzzz.itch.io/2-player-battles",
  },
];


/* ------------------------------------------------------------------ *
 * RENDERING
 * ------------------------------------------------------------------ */

const make = (tag, className, props = {}) =>
  Object.assign(document.createElement(tag), {
    className,
    ...props
  });


function renderCard(p) {
  const card = make("article", "card");

  // Title scrambles when the card is hovered
  card.dataset.hoverScramble = "";

  // Banner
  card.append(
    make("img", "card-banner", {
      src: p.banner ? ASSETS + p.banner : MISSING_IMG_URL,
      alt: ""
    })
  );

  // Icon
  card.append(
    make("img", "card-icon", {
      src: p.icon ? ASSETS + p.icon : MISSING_IMG_URL,
      alt: ""
    })
  );

  // Card body
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

  // Go button
  if (p.link) {
    const go = make("button", "icon-btn card-go");

    go.dataset.href = p.link;
    go.setAttribute("aria-label", `Open ${p.title}`);

    go.append(
      make("img", "", {
        src: ASSETS + "Pictures/go.png",
        alt: ""
      })
    );

    card.append(go);
  }

  return card;
}


/* ------------------------------------------------------------------ *
 * PROJECT DISPLAY
 * ------------------------------------------------------------------ */

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

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();

  // Empty search = show everything
  if (!query) {
    renderProjects(PROJECTS);
    return;
  }

  // Split the search into individual words
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
