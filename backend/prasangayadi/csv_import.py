"""
Shared CSV-import logic for Prasanga Yadi, used by both the
`import_prasangayadi_csv` management command (shell/SSH access) and the
DrishyaShravyaCsvImportView-style API endpoint (browser-triggered import
from the admin app) — see views.py.

Expected CSV columns: slnum (ignored — just the sheet's row number, not a
stable identifier, same reasoning as Mattukosha's ಕ್ರಮ ಸಂಖ್ಯೆ), unique_id,
prasanga_name, kavi_name, type, publish_status, prasanga_type,
prasanga_language, story_source, prasanga_kosha_link, pratisangraha_link,
notes.

`kavi_name` may list multiple people (comma or "ಹಾಗೂ"/"ಮತ್ತು"/"&"/"and"
separated) and gets split into the `kavi` taxonomy table, get_or_create'd by
name — same approach as Presenter's import for Drishya-Kavya Sanchaya. Note:
in this dataset a small number of kavi_name values (~10 out of 5,260) have a
comma that isn't a real separator, e.g. a parenthetical alternate name like
"ವಾರಂಬಳ್ಳಿ ವೆಂಕಪ್ಪಯ್ಯ (ಕವಿದಾಸ, ಸದಿಯಪ್ಪ ವಾರಂಬಳ್ಳಿ)" — these will get split too
literally. This is the same class of imprecision already accepted for
Presenter/Mattukosha imports; if it matters, it's fixable afterward via the
existing generic Taxonomy merge/rename tools in the admin app.
"""
import csv
import io
import re

from .models import PrasangaYadiEntry, Kavi

COLUMNS = {
    'unique_id': 'unique_id',
    'prasanga_name': 'prasanga_name',
    'kavi_name': 'kavi_name',
    'type': 'type',
    'publish_status': 'publish_status',
    'prasanga_type': 'prasanga_type',
    'prasanga_language': 'prasanga_language',
    'story_source': 'story_source',
    'prasanga_kosha_link': 'prasanga_kosha_link',
    'pratisangraha_link': 'pratisangraha_link',
    'notes': 'notes',
}

_NAME_SPLIT_RE = re.compile(r',| ಹಾಗೂ | ಮತ್ತು |&| and ')


def split_names(raw):
    """Free text -> a de-duplicated list of clean names, splitting on
    commas and common Kannada/English "and" conjunctions."""
    if not raw:
        return []
    seen = []
    for part in _NAME_SPLIT_RE.split(raw):
        name = re.sub(r'\.+$', '', part.strip()).strip()
        if name and name not in seen:
            seen.append(name)
    return seen


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

    existing_count = PrasangaYadiEntry.objects.count()
    if clear_existing:
        PrasangaYadiEntry.objects.all().delete()
        existing_names = set()
    else:
        existing_names = set(PrasangaYadiEntry.objects.values_list('prasanga_name', flat=True))

    created = 0
    skipped_existing = 0
    skipped_blank = 0
    kavi_cache = {}

    for row in rows:
        name = (row.get(COLUMNS['prasanga_name']) or '').strip()
        if not name:
            skipped_blank += 1
            continue
        if not clear_existing and name in existing_names:
            skipped_existing += 1
            continue

        def field(key):
            return (row.get(COLUMNS[key]) or '').strip() or None

        entry = PrasangaYadiEntry.objects.create(
            prasanga_name=name,
            unique_number=field('unique_id'),
            type=field('type'),
            publish_status=field('publish_status'),
            prasanga_type=field('prasanga_type'),
            prasanga_language=field('prasanga_language'),
            story_source=field('story_source'),
            prasanga_kosha_link=field('prasanga_kosha_link'),
            pratisangraha_link=field('pratisangraha_link'),
            notes=field('notes'),
            status='approved',
        )

        for kavi_name in split_names(row.get(COLUMNS['kavi_name'])):
            if kavi_name not in kavi_cache:
                kavi_cache[kavi_name], _ = Kavi.objects.get_or_create(name=kavi_name)
            entry.kavi.add(kavi_cache[kavi_name])

        created += 1

    return {
        'total_rows': len(rows),
        'existing_before': existing_count,
        'deleted': existing_count if clear_existing else 0,
        'created': created,
        'skipped_existing': skipped_existing,
        'skipped_blank': skipped_blank,
    }
