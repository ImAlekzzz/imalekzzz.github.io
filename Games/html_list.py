#!/usr/bin/env python3

import argparse
import json
import re
import sys
import time
from pathlib import Path

PLAY_RE = re.compile(r"^play(?:_(?P<suffix>.+))?\.html?$", re.IGNORECASE)


def natural_key(text: str):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", text)]


def find_play_files(folder: Path):
    matches = []
    for f in folder.iterdir():
        if f.is_file():
            m = PLAY_RE.match(f.name)
            if m:
                matches.append((f, m.group("suffix")))
    matches.sort(key=lambda pair: (pair[1] is not None, natural_key(pair[1] or "")))
    return matches


def has_any_html(folder: Path) -> bool:
    return any(f.suffix.lower() in (".html", ".htm") for f in folder.iterdir() if f.is_file())


def load_previous(games_dir: Path):
    """Last games.json by folder name, so hand-edited fields dont get rewriten"""
    path = games_dir / "games.json"
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}
    items = data.get("games", []) if isinstance(data, dict) else data
    return {g.get("folder"): g for g in items if isinstance(g, dict) and "folder" in g}


def scan(games_dir: Path):
    previous = load_previous(games_dir)
    games = []

    for folder in sorted((p for p in games_dir.iterdir() if p.is_dir() and not p.name.startswith((".", "_"))),
                         key=lambda p: p.name.lower()):
        if not has_any_html(folder):
            continue  # not a web game

        play_files = find_play_files(folder)
        if not play_files:
            print(f"[html_list] skipped '{folder.name}': has .html files but no play.html / play_*.html")
            continue

        if len(play_files) > 2:
            print(f"[html_list] warning '{folder.name}': {len(play_files)} play files, using the first two")
        if len(play_files) > 1 and play_files[0][1] is None:
            print(f"[html_list] warning '{folder.name}': has play.html AND play_*.html, "
                  f"using {play_files[0][0].name} and {play_files[1][0].name}")

        prior = previous.get(folder.name, {})

        entry = {"folder": folder.name}
        prior_name = prior.get("name")
        if isinstance(prior_name, str) and prior_name and prior_name != folder.name:
            entry["name"] = prior_name  # hand-set display name

        bg = prior.get("background borders", "no")
        entry["background borders"] = bg if bg in ("yes", "no") else "no"

        for slot in (1, 2):
            file_key, text_key = f"version{slot}", f"v{slot}version"
            if slot <= len(play_files):
                path, suffix = play_files[slot - 1]
                # keep a hand-edited popup text while the file in this slot is the same
                if prior.get(file_key) == path.name and text_key in prior:
                    text = prior[text_key]
                else:
                    text = suffix or ""
                entry[file_key], entry[text_key] = path.name, text
            else:
                entry[file_key], entry[text_key] = "", ""

        games.append(entry)

    return games


def run_once(games_dir: Path):
    games = scan(games_dir)
    (games_dir / "games.json").write_text(
        json.dumps({"games": games}, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"[html_list] {len(games)} game(s) found -> games.json updated")


def watch(games_dir: Path, interval: float = 1.5):
    print(f"[html_list] watching {games_dir} for changes (Ctrl+C to stop)")
    last = None
    try:
        while True:
            # games.json itself is left out, or writing it would trigger another run forever
            signature = tuple(sorted(
                (str(p.relative_to(games_dir)), p.stat().st_mtime)
                for p in games_dir.rglob("*") if p.name != "games.json"
            ))
            if signature != last:
                run_once(games_dir)
                last = signature
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n[html_list] stopped")


def main():
    parser = argparse.ArgumentParser(description="Generate games.json for the Games page")
    parser.add_argument("--games-dir", default=str(Path(__file__).resolve().parent),
                        help="folder that holds the game folders (default: the folder this script is in)")
    parser.add_argument("--watch", action="store_true", help="keep running and re-scan on changes")
    args = parser.parse_args()

    games_dir = Path(args.games_dir).resolve()
    if not games_dir.is_dir():
        print(f"error: {games_dir} is not a directory", file=sys.stderr)
        sys.exit(1)

    watch(games_dir) if args.watch else run_once(games_dir)


if __name__ == "__main__":
    main()
