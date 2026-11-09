"""One-shot extractor: BA166_Reviewer_01_Sales.pdf -> per-page text dump.

READ-ONLY on sources: reads the original PDF, writes only under the output dir
given by argv[1] (inside review-room/, never next to the originals).
Usage: python pdf_extract.py <source-pdf> <output-dir>
"""
import sys
from pathlib import Path

from pypdf import PdfReader

SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)

reader = PdfReader(str(SRC))
print(f"pages={len(reader.pages)} encrypted={reader.is_encrypted}")
if reader.metadata:
    print(f"meta author={reader.metadata.author} producer={reader.metadata.producer}")

full = []
for i, page in enumerate(reader.pages, start=1):
    text = page.extract_text() or ""
    full.append(f"\n===== PAGE {i} ({len(text)} chars) =====\n{text}")
    (OUT / f"page-{i:02d}.txt").write_text(text, encoding="utf-8")

(OUT / "full.txt").write_text("\n".join(full), encoding="utf-8")
print(f"wrote {OUT / 'full.txt'} ({sum(len(p) for p in full)} chars total)")
