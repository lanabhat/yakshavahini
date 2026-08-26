"""
Bulk-import Drishya-Kavya Sanchaya entries from a CSV export (see
drishyashravyakosha/csv_import.py's COLUMNS for the expected header row:
event_type, subject, date, presenter, video_link).

Usage:
    python manage.py import_drishyashravya_csv path/to/file.csv

Prompts for confirmation before doing anything destructive:
  - Confirmed ("yes"): deletes every existing entry, then imports every row
    in the CSV as-is.
  - Not confirmed (anything else / Enter): leaves existing entries alone and
    only imports rows whose subject isn't already in the database (subject
    is the CSV's only natural key, so this is necessarily an approximation
    of "missing").

Pass --yes to skip the prompt and confirm the clear-then-import path
non-interactively (e.g. from an already-scripted deploy step).

This is also available as a browser-triggered import from the admin app
(no shell access needed) — see DrishyaShravyaCsvImportView in views.py,
which calls the same shared drishyashravyakosha.csv_import.import_csv_rows().
"""
from django.core.management.base import BaseCommand, CommandError

from drishyashravyakosha.csv_import import import_csv_rows
from drishyashravyakosha.models import DrishyaShravyaKoshaEntry


class Command(BaseCommand):
    help = 'Import Drishya-Kavya Sanchaya entries from a CSV export.'

    def add_arguments(self, parser):
        parser.add_argument('csv_path')
        parser.add_argument(
            '--yes', action='store_true',
            help='Skip the confirmation prompt and proceed as if confirmed (clear existing entries, then import all).',
        )

    def handle(self, *args, **options):
        csv_path = options['csv_path']
        try:
            with open(csv_path, 'rb') as f:
                file_bytes = f.read()
        except FileNotFoundError:
            raise CommandError(f'No such file: {csv_path}')

        existing_count = DrishyaShravyaKoshaEntry.objects.count()
        self.stdout.write(f'{existing_count} existing Drishya-Kavya Sanchaya entr{"y" if existing_count == 1 else "ies"} in the database.')

        if options['yes']:
            confirmed = True
        else:
            answer = input(
                f'\nThis will DELETE all {existing_count} existing entries before importing.\n'
                'Type "yes" to confirm that, or press Enter to instead only import rows not already '
                'in the database (matched by subject), leaving existing entries untouched: '
            )
            confirmed = answer.strip().lower() == 'yes'

        try:
            summary = import_csv_rows(file_bytes, clear_existing=confirmed)
        except ValueError as e:
            raise CommandError(str(e))

        if confirmed:
            self.stdout.write(self.style.WARNING(f'Deleted {summary["deleted"]} existing entr{"y" if summary["deleted"] == 1 else "ies"}.'))
        self.stdout.write(self.style.SUCCESS(
            f'Created {summary["created"]} entr{"y" if summary["created"] == 1 else "ies"}. '
            f'Skipped {summary["skipped_existing"]} already-present (by subject), {summary["skipped_blank"]} blank-subject row(s).'
        ))
