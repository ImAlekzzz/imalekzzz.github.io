//Congrats! You finally found something different! Intresting huh?

(function () {
  const grid = document.getElementById("grid");
  const searchInput = document.querySelector(".search input");

  let allGames = [];

  const make = (tag, className, props = {}) =>
    Object.assign(document.createElement(tag), { className, ...props });

  // A button that opens one version of the game in its own tab
  // (if there is only one version)
  function versionButton(folder, file, tip, gameName) {
    const wrap = make("span", "ver");

    const link = make("a", "ver-btn", {
      href: `${folder}/${encodeURIComponent(file)}`,
      target: "_blank",
      rel: "noopener",
    });

    link.setAttribute(
      "aria-label",
      `Play ${gameName}${tip ? " " + tip : ""}`
    );

    link.append(
      make("img", "", {
        src: "../Assets/Pictures/go.png",
        alt: ""
      })
    );

    wrap.append(link);

    if (tip) {
      wrap.append(
        make("span", "tip", {
          textContent: tip
        })
      );
    }

    return wrap;
  }

  function render(games) {
    grid.replaceChildren();

    if (games.length === 0) {
      grid.append(
        make("div", "empty-state", {
          textContent: "No games found yet."
        })
      );
      return;
    }

    games.forEach((game) => {
      const folder = encodeURIComponent(game.folder);
      const displayName = game.name || game.folder;
      const cut = game["background borders"] === "yes";

      const card = make("div", "game-card");

      card.dataset.hoverScramble = "";
      // name scrambles when the card is hovered

      const iconWrap = make("span", "icon-wrap");

      iconWrap.append(
        make("img", "game-icon" + (cut ? " cut" : ""), {
          src: `${folder}/icon.svg`,
          alt: ""
        })
      );

      if (cut) {
        iconWrap.append(make("span", "icon-glass"));
      }

      const nameWrap = make("div", "name-wrap");

      const name = make("h2", "game-name", {
        textContent: displayName
      });

      name.dataset.hoverText = "";

      nameWrap.append(name);

      if (game.version1) {
        card.classList.add("has-actions");

        const actions = make(
          "div",
          "game-actions" + (game.version2 ? "" : " single")
        );

        actions.append(
          versionButton(
            folder,
            game.version1,
            game.v1version,
            displayName
          )
        );

        if (game.version2) {
          actions.append(
            versionButton(
              folder,
              game.version2,
              game.v2version,
              displayName
            )
          );
        }

        nameWrap.append(actions);
      }

      card.append(iconWrap, nameWrap);
      grid.append(card);
    });
  }


  /* ---------------------------------------------------------------
   * SEARCH
   *
   * Searches:
   *   - game name
   *   - folder name
   *   - keywords
   *   - version names
   *
   * Multiple words use AND logic.
   *
   * Example:
   *
   *   "tower defense"
   *
   * Every word must be found somewhere in the searchable
   * information for the game.
   * --------------------------------------------------------------- */

  function searchGames(query) {
    query = query.trim().toLowerCase();

    // Empty search = show every game
    if (!query) {
      render(allGames);
      return;
    }

    const terms = query.split(/\s+/);

    const filteredGames = allGames.filter((game) => {
      const searchableText = [
        game.name,
        game.folder,
        game.keywords,
        game.version1,
        game.v1version,
        game.version2,
        game.v2version
      ]
        .flat()
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      // Every search term must match somewhere
      return terms.every((term) =>
        searchableText.includes(term)
      );
    });

    render(filteredGames);
  }


  /* ---------------------------------------------------------------
   * LOAD GAMES
   * --------------------------------------------------------------- */

  fetch("games.json", { cache: "no-store" })
    .then((res) => {
      if (!res.ok) {
        throw new Error("games.json not found");
      }

      return res.json();
    })
    .then((data) => {
      allGames = Array.isArray(data)
        ? data
        : data.games || [];

      render(allGames);

      // Search only after the JSON has loaded
      if (searchInput) {
        searchInput.addEventListener("input", () => {
          searchGames(searchInput.value);
        });
      }
    })
    .catch((err) => {
      console.error(err);

      grid.replaceChildren(
        make("div", "empty-state", {
          textContent:
            "Could not load games.json. Run html_list.py first."
        })
      );
    });


  /* ---------------------------------------------------------------
   * BACK TO TOP
   * --------------------------------------------------------------- */

  document.getElementById("to-top").addEventListener("click", () => {
    const reduce = matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: reduce ? "auto" : "smooth"
    });
  });

})();
