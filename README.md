# Yakshavahini

A shared monorepo for Yakshavahini's smaller catalog projects — starting with
**Mattukosha**, with **Pustaka Sangraha** and **Sanghatana Kosha** to follow
using the same pattern. (Pratisangraha remains its own separate app/repo —
it's large enough to warrant that on its own.)

## Structure

```
backend/    Django + DRF API. One "core" app with the shared submission/
            review workflow, Drive integration, and auth — reused by every
            project. Each project (mattukosha, ...) is a small app with just
            its own entry model and an entry in core/registry.py describing
            its fields. Adding a new project is a new small app + one
            registry entry, not a rewrite of the generic layer.
admin/      React admin app — login, create/edit entries, review queue,
            Drive account management, user management.
public/     React public app — browse/search/filter, entry detail with a
            PDF viewer and (for Mattukosha) an embedded YouTube player.
```

## Backend setup

```
cd backend
python -m venv venv
venv\Scripts\activate      # or `source venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
cp .env.example .env       # fill in Google OAuth / Drive credentials
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Frontend setup

```
cd admin   # or public
npm install
cp .env.example .env
npm run dev
```

## Adding a new project

1. `python manage.py startapp <project_slug>` in `backend/`, with a model
   subclassing `core.models.CatalogEntryBase` (set `ENTRY_ID_PREFIX`).
2. Add it to `INSTALLED_APPS` and add one entry to `core/registry.py`
   describing its fields (title field, link fields, date fields, sortable/
   filterable fields, taxonomy models if any).
3. Run `makemigrations` / `migrate`. The generic views under
   `core/generic_views.py` and URLs under `core/project_urls.py` work for it
   immediately — no new view code needed.
4. On the frontend, add the project to `src/config/project.ts` in both
   `admin/` and `public/` (this becomes a small registry, same idea as the
   backend, once there's more than one project wired up in the UI).
