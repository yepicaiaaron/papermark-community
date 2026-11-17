# Tinybird (Forward) project

New Tinybird workspaces use Tinybird Forward, which no longer supports the
`VERSION` line used by the files in `lib/tinybird`. This folder holds the same
datasources and endpoints converted to Forward format, with the version
suffixes (`page_views__v3`, `get_total_document_duration__v1` and so on) kept
in the file names so the app's existing calls keep working.

Deploy to your workspace:

```sh
pip install tinybird
cd community/tinybird
tb --cloud --host "$TINYBIRD_BASE_URL" --token "$TINYBIRD_ADMIN_TOKEN" deploy
```

Then set `TINYBIRD_TOKEN` and `TINYBIRD_BASE_URL` (for example
`https://api.us-east.tinybird.co`) in the app.

If `lib/tinybird` changes upstream, regenerate this folder with:

```sh
python3 community/tinybird/convert-from-classic.py lib/tinybird community/tinybird
```
