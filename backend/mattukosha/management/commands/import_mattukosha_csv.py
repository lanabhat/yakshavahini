"""
Bulk-import Mattukosha entries from a CSV export shaped like the Google
Sheet ("Mattukosha 150 - Sheet1.csv"): columns ಮಟ್ಟಿನ ಹೆಸರು, ಛಂದಸ್ಸಿನ ವಿಧ,
ಸಂದರ್ಭ ಸೂಕ್ತತೆ, ಹೊಂದುವ ರಾಗಗಳು, ಮಟ್ಟಿನ ವಿವರದ ದಸ್ತಾವೇಜಿನ ಕೊಂಡಿ,
ದಸ್ತಾವೇಜನ್ನು ಸೇರಿಸಿದ ದಿನಾಂಕ, ಟಿಪ್ಪಣಿ — mapping 1:1 onto MattukoshaEntry's
name/type/situations/ragas/pdf_link/date_kannada/notes fields.

Usage:
    python manage.py import_mattukosha_csv path/to/file.csv

Prompts for confirmation before doing anything destructive:
  - Confirmed ("yes"): deletes every existing Mattukosha entry, then
    imports every row in the CSV as-is — including rows that share a
    ಮಟ್ಟಿನ ಹೆಸರು with another row, since name isn't a real unique key
    (two entries can have the same title but differ in type/ragas/
    situations/etc.).
  - Not confirmed (anything else / Enter): leaves existing entries alone
    and only imports rows whose name isn't already in the database
    (name is the CSV's only natural key, so this path is necessarily
    name-based — it's the best available approximation of "missing").

Pass --yes to skip the prompt and confirm the clear-then-import path
non-interactively (e.g. from an already-scripted deploy step).
"""
import csv

from django.core.management.base import BaseCommand, CommandError

from mattukosha.models import MattukoshaEntry

COLUMNS = {
    'name': 'ಮಟ್ಟಿನ ಹೆಸರು',
    'type': 'ಛಂದಸ್ಸಿನ ವಿಧ',
    'situations': 'ಸಂದರ್ಭ ಸೂಕ್ತತೆ',
    'ragas': 'ಹೊಂದುವ ರಾಗಗಳು',
    'pdf_link': 'ಮಟ್ಟಿನ ವಿವರದ ದಸ್ತಾವೇಜಿನ ಕೊಂಡಿ',
    'date_kannada': 'ದಸ್ತಾವೇಜನ್ನು ಸೇರಿಸಿದ ದಿನಾಂಕ',
    'notes': 'ಟಿಪ್ಪಣಿ',
}


class Command(BaseCommand):
    help = 'Import Mattukosha entries from a CSV export (see COLUMNS in this file for the expected header row).'

    def add_arguments(self, parser):
        parser.add_argument('csv_path')
        parser.add_argument(
            '--yes', action='store_true',
            help='Skip the confirmation prompt and proceed as if confirmed (clear existing entries, then import all).',
        )

    def handle(self, *args, **options):
        csv_path = options['csv_path']
        try:
            with open(csv_path, encoding='utf-8-sig', newline='') as f:
                reader = csv.DictReader(f)
                missing = [c for c in COLUMNS.values() if c not in (reader.fieldnames or [])]
                if missing:
                    raise CommandError(f'CSV is missing expected column(s): {missing}\nFound: {reader.fieldnames}')
                rows = list(reader)
        except FileNotFoundError:
            raise CommandError(f'No such file: {csv_path}')

        if not rows:
            raise CommandError('CSV has no data rows.')

        existing_count = MattukoshaEntry.objects.count()
        self.stdout.write(f'{len(rows)} row(s) in CSV, {existing_count} existing Mattukosha entr{"y" if existing_count == 1 else "ies"} in the database.')

        if options['yes']:
            confirmed = True
        else:
            answer = input(
                f'\nThis will DELETE all {existing_count} existing Mattukosha entries before importing.\n'
                'Type "yes" to confirm that, or press Enter to instead only import rows not already '
                'in the database (matched by name), leaving existing entries untouched: '
            )
            confirmed = answer.strip().lower() == 'yes'

        if confirmed:
            deleted, _ = MattukoshaEntry.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'Deleted {deleted} existing entr{"y" if deleted == 1 else "ies"}.'))
            existing_names = set()
        else:
            self.stdout.write('Not confirmed — importing only rows missing from the database.')
            existing_names = set(MattukoshaEntry.objects.values_list('name', flat=True))

        created = 0
        skipped_existing = 0
        skipped_blank = 0

        for row in rows:
            name = (row.get(COLUMNS['name']) or '').strip()
            if not name:
                skipped_blank += 1
                continue
            # Name isn't a real unique key — two entries can legitimately
            # share a title but differ in type/ragas/situations/etc. Only
            # the not-confirmed (missing-only) path uses name as a stand-in
            # "already imported" check, since it has nothing else to go on;
            # a fresh clear-then-import-everything run imports every row,
            # duplicate names and all.
            if not confirmed and name in existing_names:
                skipped_existing += 1
                continue

            def field(key):
                return (row.get(COLUMNS[key]) or '').strip() or None

            MattukoshaEntry.objects.create(
                name=name,
                type=field('type'),
                situations=field('situations'),
                ragas=field('ragas'),
                pdf_link=field('pdf_link'),
                date_kannada=field('date_kannada'),
                notes=field('notes'),
                status='approved',
            )
            created += 1

        self.stdout.write(self.style.SUCCESS(
            f'Created {created} entr{"y" if created == 1 else "ies"}. '
            f'Skipped {skipped_existing} already-present (by name), {skipped_blank} blank-name row(s).'
        ))
