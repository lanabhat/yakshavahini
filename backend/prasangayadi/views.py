from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdmin

from .csv_import import import_csv_rows


class PrasangaYadiCsvImportView(APIView):
    """POST /api/v1/prasangayadi/import-csv/ — admin-only.

    Lets an admin trigger the same import the `import_prasangayadi_csv`
    management command runs, from the browser — no shell/SSH access to the
    server needed. Expects a multipart upload: `file` (the CSV) and
    optionally `clear` ('true' to wipe existing entries first; omitted or
    anything else only imports rows whose prasanga_name isn't already in
    the database).
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        upload = request.FILES.get('file')
        if not upload:
            return Response({'error': 'No file uploaded (expected multipart field "file").'}, status=400)

        clear_existing = str(request.data.get('clear', '')).lower() == 'true'

        try:
            summary = import_csv_rows(upload.read(), clear_existing=clear_existing)
        except ValueError as e:
            return Response({'error': str(e)}, status=400)
        except UnicodeDecodeError:
            return Response({'error': 'Could not read the file as UTF-8 CSV text.'}, status=400)

        return Response(summary)
