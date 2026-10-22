"""Validate local references and assemble only deployable site files."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
FILES = ("index.html", "styles.css", "app.js", ".nojekyll", "CNAME")
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif", ".ico", ".mp4", ".webm", ".woff", ".woff2"}


def site_files():
    paths = [ROOT / name for name in FILES]
    for path in sorted((ROOT / "assets").rglob("*")):
        if path.is_symlink():
            raise ValueError(f"Symlink not allowed: {path}")
        if path.is_file():
            if path.suffix.lower() not in EXTENSIONS or any(p.startswith(".") for p in path.relative_to(ROOT).parts):
                raise ValueError(f"Unexpected asset: {path}")
            paths.append(path)
    for path in paths:
        if path.is_symlink() or not path.is_file():
            raise ValueError(f"Missing or unsafe file: {path}")
    return paths


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.references = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            if attrs["id"] in self.ids:
                self.errors.append("Duplicate HTML id: " + attrs["id"])
            self.ids.add(attrs["id"])
        for key in ("src", "href", "poster"):
            if attrs.get(key):
                self.references.append(attrs[key])


def check():
    paths = site_files()
    allowed = {p.relative_to(ROOT).as_posix() for p in paths}
    page = Page()
    page.feed((ROOT / "index.html").read_text())
    errors = page.errors
    refs = list(page.references)
    css = (ROOT / "styles.css").read_text()
    refs += [x.strip(" \"'") for x in re.findall(r"url\(([^)]+)\)", css)]
    js = (ROOT / "app.js").read_text()
    refs += re.findall(r"[\"'](assets/[^\"'`$]+)[\"']", js)
    refs += ["assets/products/" + name for name in re.findall(r"img\s*:\s*['\"]([^'\"]+)['\"]", js)]
    for ref in refs:
        url = urlsplit(ref)
        if url.scheme or url.netloc:
            continue
        if not url.path:
            if url.fragment and url.fragment not in page.ids:
                errors.append("Missing HTML anchor: " + ref)
            continue
        path = unquote(url.path)
        if path.startswith("/"):
            errors.append("Use relative URLs for GitHub Pages: " + ref)
        elif path.removeprefix("./") not in allowed:
            errors.append("Missing/unpublished resource: " + ref)
    if errors:
        raise ValueError("\n".join(sorted(set(errors))))
    print(f"OK: {len(paths)} publishable files; HTML anchors and local HTML/CSS/JS resources verified.")
    return paths


if __name__ == "__main__":
    paths = check()
    if sys.argv[1:] == ["build"]:
        target = ROOT / "dist"
        if target.is_symlink():
            raise ValueError("dist must not be a symlink")
        if target.exists():
            shutil.rmtree(target)
        for source in paths:
            destination = target / source.relative_to(ROOT)
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, destination)
        print("Built dist/ (only page and approved assets).")
