"""Regression checks for publishing and private-preview boundaries."""
import contextlib
import http.client
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch
from http.server import ThreadingHTTPServer
import dev
import site_tools


class DevelopmentToolsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for name, text in {"index.html": '<main id="home"><a href="#home">Home</a><img src="assets/a.webp"></main>',
                           "styles.css": "body {}", "app.js": "", ".nojekyll": "", "CNAME": "monchos.co\n",
                           "README.md": "private operations", ".env": "private fixture"}.items():
            (self.root / name).write_text(text)
        (self.root / "assets").mkdir()
        (self.root / "assets/a.webp").write_bytes(b"fixture")
        self.override = patch.object(site_tools, "ROOT", self.root)
        self.override.start()
        self.addCleanup(self.override.stop)

    def test_only_site_files_are_publishable(self):
        self.assertEqual({p.relative_to(self.root).as_posix() for p in site_tools.check()},
                         {"index.html", "styles.css", "app.js", ".nojekyll", "CNAME", "assets/a.webp"})

    def test_broken_asset_stops_publication(self):
        (self.root / "assets/a.webp").unlink()
        with self.assertRaisesRegex(ValueError, "Missing/unpublished"):
            site_tools.check()

    def test_broken_anchor_stops_publication(self):
        (self.root / "index.html").write_text('<a href="#missing">Link</a>')
        with self.assertRaisesRegex(ValueError, "Missing HTML anchor"):
            site_tools.check()

    def test_root_relative_url_stops_publication(self):
        (self.root / "index.html").write_text('<img src="/assets/a.webp">')
        with self.assertRaisesRegex(ValueError, "relative URLs"):
            site_tools.check()

    def test_javascript_product_asset_is_checked(self):
        (self.root / "app.js").write_text("const item={img:'missing.webp'};")
        with self.assertRaisesRegex(ValueError, "Missing/unpublished"):
            site_tools.check()

    def test_symlink_stops_publication(self):
        (self.root / "assets/private.webp").symlink_to(self.root / ".env")
        with self.assertRaisesRegex(ValueError, "Symlink"):
            site_tools.check()

    def test_unexpected_asset_stops_publication(self):
        (self.root / "assets/token.txt").write_text("private fixture")
        with self.assertRaisesRegex(ValueError, "Unexpected asset"):
            site_tools.check()

    def test_preview_serves_site_but_hides_repository(self):
        with patch.object(dev, "ROOT", self.root):
            server = ThreadingHTTPServer(("127.0.0.1", 0), dev.Preview)
            worker = threading.Thread(target=server.serve_forever, daemon=True)
            worker.start()
            try:
                for path, expected in [("/", 200), ("/assets/a.webp", 200),
                        ("/.env", 404), ("/.git/config", 404), ("/README.md", 404),
                        ("/scripts/dev.py", 404), ("/assets/", 404),
                        ("/%2e%2e/.env", 404)]:
                    with contextlib.closing(http.client.HTTPConnection("127.0.0.1", server.server_port)) as connection:
                        connection.request("GET", path)
                        response = connection.getresponse()
                        self.assertEqual(response.status, expected, path)
                        self.assertEqual(response.getheader("Cache-Control"), "no-store")
                        response.read()
            finally:
                server.shutdown()
                server.server_close()
                worker.join()


if __name__ == "__main__":
    unittest.main()
