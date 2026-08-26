"""
Shared CSV-import logic for Drishya-Kavya Sanchaya, used by both the
`import_drishyashravya_csv` management command (for direct shell/SSH access,
e.g. on PythonAnywhere) and the DrishyaShravyaCsvImportView API endpoint (so
an admin can trigger the same import from the browser, without shell
access — see drishyashravyakosha/views.py).

Expected CSV columns: event_type, subject, date, presenter, video_link
(see "input files/drishya-shravya-db.csv" for a real example). `date` is
parsed as M/D/YYYY for the sortable `date_english` field and also kept
as-is in `date_kannada` (the display field — despite the name, it's just
whatever text the source data has; no Kannada-numeral conversion is done).
`presenter` is a free-text cell that may list multiple people (comma or
"ಹಾಗೂ" separated) and gets split into the `presenters` taxonomy table,
get_or_create'd by name like Mattukosha's ragas/situations import does.
`video_link` may be a Facebook link-shim (l.facebook.com/l.php?u=...) that
wraps the real URL (often a YouTube link) — unwrapped before saving so the
public site's embed logic can actually recognize it.
"""
import csv
import io
import re
from datetime import datetime
from urllib.parse import unquote, urlparse, parse_qs

from .models import DrishyaShravyaKoshaEntry, Presenter

COLUMNS = {
    'event_type': 'event_type',
    'subject': 'subject',
    'date': 'date',
    'presenter': 'presenter',
    'video_link': 'video_link',
}

_NAME_SPLIT_RE = re.compile(r',| ಹಾಗೂ | ಮತ್ತು |&| and ')
# Not real names — "ಇತರರು" ("and others") is a placeholder some source rows
# use instead of listing every presenter; keeping it would show up as a
# nonsensical "browse by ಇತರರು" filter on the public site.
_NAME_STOPWORDS = {'ಇತರರು', 'ಇತರ'}


def split_names(raw):
    """Free text -> a de-duplicated list of clean names, splitting on
    commas and common Kannada/English "and" conjunctions. Mirrors
    Mattukosha's split_names (strips a trailing '.', dedupes)."""
    if not raw:
        return []
    seen = []
    for part in _NAME_SPLIT_RE.split(raw):
        name = re.sub(r'\.+$', '', part.strip()).strip()
        if name and name not in _NAME_STOPWORDS and name not in seen:
            seen.append(name)
    return seen


def unwrap_video_link(url):
    """Facebook's link-shim (l.facebook.com/l.php?u=<encoded real URL>&...)
    wraps the actual video URL (often YouTube) — unwrap it so the public
    site's embed logic sees the real link, not Facebook's redirect page."""
    url = (url or '').strip()
    if not url:
        return ''
    if 'l.facebook.com/l.php' in url:
        query = parse_qs(urlparse(url).query)
        real = query.get('u', [None])[0]
        if real:
            return unquote(real)
    return url


def parse_date_english(raw):
    """CSV dates are M/D/YYYY (confirmed unambiguous — many rows have a
    day-of-month > 12). Returns a date object or None."""
    raw = (raw or '').strip()
    if not raw:
        return None
    try:
        return datetime.strptime(raw, '%m/%d/%Y').date()
    except ValueError:
        return None


def import_csv_rows(file_bytes, clear_existing):
    """Runs the import against decoded CSV bytes. Returns a summary dict.
    Raises ValueError on a malformed CSV (missing expected columns)."""
    text = file_bytes.decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(text))
    # Header whitespace/casing has been inconsistent across every CSV export
    # this project has dealt with so far — match by stripped lowercase name.
    raw_fieldnames = reader.fieldnames or []
    rename = {raw: raw.strip().lower() for raw in raw_fieldnames}
    reader.fieldnames = [rename[raw] for raw in raw_fieldnames]
    missing = [c for c in COLUMNS.values() if c not in reader.fieldnames]
    if missing:
        raise ValueError(f'CSV is missing expected column(s): {missing}. Found: {reader.fieldnames}')
    rows = list(reader)

    existing_count = DrishyaShravyaKoshaEntry.objects.count()
    if clear_existing:
        DrishyaShravyaKoshaEntry.objects.all().delete()
        existing_subjects = set()
    else:
        existing_subjects = set(DrishyaShravyaKoshaEntry.objects.values_list('subject', flat=True))

    created = 0
    skipped_existing = 0
    skipped_blank = 0
    presenter_cache = {}

    for row in rows:
        subject = (row.get(COLUMNS['subject']) or '').strip()
        if not subject:
            skipped_blank += 1
            continue
        if not clear_existing and subject in existing_subjects:
            skipped_existing += 1
            continue

        entry = DrishyaShravyaKoshaEntry.objects.create(
            subject=subject,
            event_type=(row.get(COLUMNS['event_type']) or '').strip() or None,
            date_kannada=(row.get(COLUMNS['date']) or '').strip() or None,
            date_english=parse_date_english(row.get(COLUMNS['date'])),
            video_link=unwrap_video_link(row.get(COLUMNS['video_link'])) or None,
            status='approved',
        )

        for name in split_names(row.get(COLUMNS['presenter'])):
            if name not in presenter_cache:
                presenter_cache[name], _ = Presenter.objects.get_or_create(name=name)
            entry.presenters.add(presenter_cache[name])

        created += 1

    return {
        'total_rows': len(rows),
        'existing_before': existing_count,
        'deleted': existing_count if clear_existing else 0,
        'created': created,
        'skipped_existing': skipped_existing,
        'skipped_blank': skipped_blank,
    }
