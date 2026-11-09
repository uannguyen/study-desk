#!/usr/bin/env python3
"""Dựng PWA từ interview-pre (_diagrams/ + On-tap/) vào web/ (thư mục sinh ra, không sửa tay).

Chỉ ĐỌC repo interview-pre, không ghi gì vào đó.
Nguồn: biến môi trường INTERVIEW_PRE, mặc định ~/Documents/interview-pre.
"""
import hashlib, html, json, os, re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(os.environ.get("INTERVIEW_PRE", Path.home() / "Documents" / "interview-pre")).expanduser()
SRC = ROOT / "_diagrams"
ONTAP = ROOT / "On-tap"
INDEXER = ROOT / ".claude/skills/hand-drawn-diagram/scripts/build-index.py"
HERE = Path(__file__).resolve().parent
ASSETS = HERE / "assets"
OUT = HERE / "web"


def inline(s: str) -> str:
    s = html.escape(s.strip())
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"<i>\1</i>", s)
    s = re.sub(r"`(.+?)`", r"<code>\1</code>", s)
    return s


def bullets(lines):
    """Gom dòng '- ' (kèm dòng thụt vào) thành danh sách chuỗi."""
    items = []
    for ln in lines:
        if ln.startswith("- "):
            items.append(ln[2:].strip())
        elif ln.startswith("  ") and items:
            items[-1] += " " + ln.strip()
    return items


def cards_from_bank():
    """01b: câu hỏi khái niệm. Bỏ dòng 'Chất liệu FV'/'Chuẩn bị ở file…' để không lộ chi tiết nội bộ."""
    cards, level, cur = [], "", None
    text = (ONTAP / "01b_microservices-bo-cau-hoi.md").read_text(encoding="utf-8")

    def flush():
        if not cur:
            return
        rows = []
        for it in bullets(cur["body"]):
            if it.lower().startswith(("chất liệu fv", "chuẩn bị")):
                continue
            label, sep, rest = it.partition(":")
            if not sep or len(label) > 25:
                label, rest = "", it
            rows.append({"label": label.strip(), "html": inline(rest)})
        if rows:
            cards.append({"id": cur["id"], "tag": cur["tag"], "star": cur["star"],
                          "q": inline(cur["q"]), "a": rows})

    for ln in text.splitlines():
        m_lv = re.match(r"^## (Mức \d+)", ln)
        m_q = re.match(r"^\*\*(\d+)\. (.+?)\*\*( ⭐+)?\s*$", ln)
        if m_lv:
            flush(); cur = None; level = m_lv.group(1)
        elif m_q:
            flush()
            cur = {"id": f"ms-{m_q.group(1)}", "tag": f"Microservices · {level}",
                   "q": m_q.group(2), "star": bool(m_q.group(3)), "body": []}
        elif cur is not None and not ln.startswith("---"):
            cur["body"].append(ln)
    flush()
    return cards


def cards_from_answers():
    """01-06: chỉ lấy câu bạn ĐÃ tự viết đáp án (dòng '> ' khác placeholder)."""
    cards = []
    for f in sorted(ONTAP.glob("0[1-6]-*.md")):
        topic = f.stem.split("-", 1)[1].replace("-", " ").capitalize()
        text = f.read_text(encoding="utf-8")
        for m in re.finditer(r'\*\*(Q\d+)\. "(.+?)"\*\*\s*\n(?:\*\(.*?\)\*\s*\n)?((?:>.*\n?)+)', text, re.S):
            ans = "\n".join(l.lstrip("> ").rstrip() for l in m.group(3).splitlines()).strip()
            if not ans or "(bạn viết)" in ans:
                continue
            cards.append({"id": f"{f.stem[:2]}-{m.group(1)}", "tag": topic, "star": False,
                          "q": inline(m.group(2)),
                          "a": [{"label": "Câu trả lời của bạn", "html": inline(ans).replace("\n", "<br>")}]})
    return cards


def cards_from_cornell():
    """Vở Cornell: cột cue = câu hỏi, cột note = đáp án.
    Mặt sau chỉ lấy ý chốt (Chốt/Bên dưới/Ví dụ dạng chữ) + Bẫy; bỏ Nôm na, Tự kiểm, khối FV (nội bộ)."""
    cards = []
    for f in sorted(SRC.glob("*/*cornell*.html")):
        t = f.read_text(encoding="utf-8")
        m_title = re.search(r'<h1 class="title[^"]*">(.*?)</h1>', t, re.S)
        sub = re.sub(r"<[^>]+>", "", m_title.group(1)).strip() if m_title else f.stem
        for i, row in enumerate(t.split('<div class="row')[1:], 1):
            m_cue = re.search(r'<div class="cue">(.*?)</div>', row, re.S)
            if not m_cue:
                continue
            cue = m_cue.group(1)
            m_kw = re.search(r"<small>(.*?)</small>", cue, re.S)
            q = re.sub(r"<small>.*?</small>|<b>Q\d+</b>|⭐", "", cue, flags=re.S)
            q = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", q)).strip()
            note = re.sub(r"<figure.*?</figure>|<svg.*?</svg>", "", row[m_cue.end():], flags=re.S)
            rows = []
            for cls, label, body in re.findall(r'<p(?: class="([a-z]+)")?>\s*<span class="lb">(.*?)</span>(.*?)</p>', note, re.S):
                if cls in ("kid", "test", "fv") or "FV" in label:
                    continue
                rows.append({"label": html.unescape(label).replace("⚠", "").strip(),
                             "html": re.sub(r"\s+", " ", body).strip()})
            if q and rows:
                cards.append({"id": f"{f.stem.replace('-cornell-hand-drawn', '')}-{i}", "sub": sub,
                              "star": "⭐" in cue, "q": html.escape(html.unescape(q)),
                              "hint": html.unescape(re.sub(r"<[^>]+>|từ khóa:\s*", "", m_kw.group(1))).strip() if m_kw else "",
                              "a": rows, "src": f.relative_to(SRC).as_posix()})
    return cards


def topic_names():
    """Tên chủ đề lấy từ _diagrams/topics.json: thư mục → tên nhóm cấp 1."""
    cfg = json.loads((SRC / "topics.json").read_text(encoding="utf-8"))
    names = {}
    for name, val in cfg.items():
        pats = val if isinstance(val, list) else [p for v in val.values() for p in v]
        for p in pats:
            names.setdefault(p.split("/")[0], name)
    return names


def write_decks(cards):
    """Mỗi chủ đề một file cards/<thư-mục>.json + cards/index.json, app chỉ tải bộ đang học."""
    names, decks = {**topic_names(), "tu-viet": "Bạn tự viết"}, {}
    for c in cards:
        folder = c.pop("folder")
        decks.setdefault(folder, []).append(c)
    (OUT / "cards").mkdir()
    index = []
    for folder, cs in sorted(decks.items(), key=lambda kv: -len(kv[1])):
        (OUT / "cards" / f"{folder}.json").write_text(json.dumps(cs, ensure_ascii=False), encoding="utf-8")
        index.append({"id": folder, "name": names.get(folder, folder), "count": len(cs)})
    (OUT / "cards" / "index.json").write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")
    return index


def main():
    assert SRC.is_dir(), f"Không thấy {SRC}: đặt INTERVIEW_PRE=<đường dẫn repo interview-pre>"
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(SRC, OUT, ignore=shutil.ignore_patterns("*.png", ".*"))
    # Dựng lại index trên bản copy: sơ đồ mới luôn có mặt dù quên chạy build-index ở interview-pre.
    subprocess.run([sys.executable, str(INDEXER), str(OUT)], check=True, stdout=subprocess.DEVNULL)
    (OUT / "topics.json").unlink(missing_ok=True)

    cornell = cards_from_cornell()
    for c in cornell:
        c["folder"] = c["src"].split("/")[0]
    for c in cards_from_bank():
        c.update(folder="microservices", sub=c.pop("tag"))
        cornell.append(c)
    for c in cards_from_answers():
        c.update(folder="tu-viet", sub=c.pop("tag"))
        cornell.append(c)
    decks = write_decks(cornell)

    for f in ("pwa.js", "pwa.css", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png"):
        shutil.copy(ASSETS / f, OUT / f)

    idx = OUT / "index.html"
    t = idx.read_text(encoding="utf-8")
    head = ('<link rel="manifest" href="manifest.webmanifest">'
            '<meta name="theme-color" content="#faf9f5">'
            '<link rel="icon" href="icon.svg" type="image/svg+xml">'
            '<link rel="apple-touch-icon" href="icon-192.png">'
            '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap&subset=vietnamese">'
            '<link rel="stylesheet" href="pwa.css">')
    assert "</head>" in t and "</body>" in t, "index.html thiếu </head> hoặc </body>"
    t = t.replace("</head>", head + "</head>", 1).replace("</body>", '<script src="pwa.js"></script></body>', 1)
    idx.write_text(t, encoding="utf-8")

    files = sorted(p.relative_to(OUT).as_posix() for p in OUT.rglob("*") if p.is_file())
    h = hashlib.sha1()
    for rel in files:
        h.update(rel.encode()); h.update((OUT / rel).read_bytes())
    version = h.hexdigest()[:10]
    sw = (ASSETS / "sw.js").read_text(encoding="utf-8")
    sw = sw.replace("__VERSION__", version).replace("__FILES__", json.dumps(["./"] + files, ensure_ascii=False))
    (OUT / "sw.js").write_text(sw, encoding="utf-8")

    size = sum((OUT / r).stat().st_size for r in files) / 1e6
    print(f"OK: {len(files)} file, {size:.1f}MB, sw version {version}")
    print("Thẻ: " + ", ".join(f"{d['name']} {d['count']}" for d in decks) + f" (tổng {sum(d['count'] for d in decks)})")


if __name__ == "__main__":
    main()
