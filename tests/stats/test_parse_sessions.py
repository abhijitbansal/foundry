"""Run: python3 -m unittest discover -s tests/stats  (not run by CI)."""
import importlib.util
import os
import unittest

_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "scripts", "stats", "parse_sessions.py")
_spec = importlib.util.spec_from_file_location("parse_sessions", _PATH)
ps = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ps)


class RepoFromDirname(unittest.TestCase):
    # Transcripts with no cwd fall back to the encoded dir name, where every
    # "/" became "-". Hyphenated allowlisted repos must survive that.
    def test_hyphenated_allowlisted_repo(self):
        for repo in ("job-finder", "claude-skills", "doc-scan", "design-system"):
            self.assertEqual(ps.repo_from_dirname(f"-Users-anyone-projects-{repo}"), repo)

    def test_worktree_subdir_maps_to_its_repo(self):
        self.assertEqual(
            ps.repo_from_dirname("-Users-anyone-projects-claude-skills--claude-worktrees-skills-improvement"),
            "claude-skills",
        )

    def test_unhyphenated_repo_unchanged(self):
        self.assertEqual(ps.repo_from_dirname("-Users-anyone-projects-cubby"), "cubby")

    def test_unknown_repo_keeps_old_decoding(self):
        self.assertEqual(ps.repo_from_dirname("-Users-anyone-projects-some-scratch"), "some")

    def test_outside_projects(self):
        self.assertEqual(ps.repo_from_dirname("-Users-anyone-Desktop"), "other")


if __name__ == "__main__":
    unittest.main()
