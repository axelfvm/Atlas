#!/usr/bin/env python3
"""Apply the Atlas product name to user-visible Chromium resource text.

Only XML text nodes are changed. File names, message identifiers, attributes,
comments, URLs and native Chromium symbols remain untouched so the fork keeps
its build and web-compatibility contracts.
"""

from __future__ import annotations

import argparse
import re
import subprocess
from pathlib import Path


RESOURCE_ROOTS = ("chrome", "components")
RESOURCE_SUFFIXES = {".grd", ".grdp", ".xtb"}
TEXT_NODE = re.compile(r"(?<=>)([^<]+)(?=<)", re.DOTALL)
PRODUCT_NAME = re.compile(r"\bChromium\b")


def replace_product_name(content: str) -> tuple[str, int]:
    replacements = 0

    def replace_text_node(match: re.Match[str]) -> str:
        nonlocal replacements
        updated, count = PRODUCT_NAME.subn("Atlas", match.group(1))
        replacements += count
        return updated

    return TEXT_NODE.sub(replace_text_node, content), replacements


def resource_files(checkout: Path):
    for root_name in RESOURCE_ROOTS:
        root = checkout / root_name
        if not root.is_dir():
            raise FileNotFoundError(f"Resource directory not found: {root}")

    tracked = subprocess.run(
        ["git", "-C", str(checkout), "ls-files", "-z", *RESOURCE_ROOTS],
        check=True,
        capture_output=True,
    ).stdout.decode("utf-8").split("\0")

    for relative_path in tracked:
        if relative_path and Path(relative_path).suffix in RESOURCE_SUFFIXES:
            yield checkout / relative_path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("checkout", type=Path, help="Path to the Chromium src checkout")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Report remaining visible Chromium names without changing files",
    )
    args = parser.parse_args()

    checkout = args.checkout.resolve()
    changed_files = 0
    total_replacements = 0

    for path in resource_files(checkout):
        original_bytes = path.read_bytes()
        original = original_bytes.decode("utf-8")
        updated, replacements = replace_product_name(original)
        if replacements == 0:
            continue

        changed_files += 1
        total_replacements += replacements
        if args.check:
            print(f"{replacements:4}  {path.relative_to(checkout)}")
        else:
            path.write_bytes(updated.encode("utf-8"))

    if args.check:
        print(
            f"Found {total_replacements} visible Chromium name(s) "
            f"in {changed_files} resource file(s)."
        )
        return 1 if total_replacements else 0

    print(
        f"Applied Atlas to {total_replacements} visible product name(s) "
        f"in {changed_files} resource file(s)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
