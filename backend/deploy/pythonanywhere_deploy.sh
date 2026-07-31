#!/usr/bin/env bash
# Run from a PythonAnywhere Bash console to update the backend after a git push.
#
# Usage:
#   cd ~/yakshavahini
#   bash backend/deploy/pythonanywhere_deploy.sh
#
# First-time setup (venv doesn't exist yet):
#   mkvirtualenv --python=python3.10 yakshavahini-venv
#   bash backend/deploy/pythonanywhere_deploy.sh
#
# Required env vars (set once, e.g. in ~/.bashrc, or edit the defaults below):
#   PA_USERNAME   - your PythonAnywhere username (used to touch the WSGI reload file)
#   PA_VENV       - name of the virtualenv (default: yakshavahini-venv)

set -euo pipefail

PA_USERNAME="${PA_USERNAME:-yakshavahini}"
PA_VENV="${PA_VENV:-yakshavahini-venv}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"

echo "==> Pulling latest code"
cd "$REPO_ROOT"
git pull

echo "==> Activating virtualenv: $PA_VENV"
source "$WORKON_HOME/$PA_VENV/bin/activate"

echo "==> Installing dependencies"
pip install -r "$BACKEND_DIR/requirements.txt"

cd "$BACKEND_DIR"

echo "==> Running migrations"
python manage.py migrate --noinput

echo "==> Collecting static files"
python manage.py collectstatic --noinput

WSGI_FILE="/var/www/${PA_USERNAME}_pythonanywhere_com_wsgi.py"
if [ -f "$WSGI_FILE" ]; then
  echo "==> Reloading web app"
  touch "$WSGI_FILE"
else
  echo "==> Skipping reload: $WSGI_FILE not found. Reload manually from the Web tab."
fi

echo "==> Done"
