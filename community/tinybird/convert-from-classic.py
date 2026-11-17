import os, re, sys, pathlib
src = pathlib.Path(sys.argv[1]); out = pathlib.Path(sys.argv[2])
(out/"datasources").mkdir(parents=True, exist_ok=True); (out/"endpoints").mkdir(parents=True, exist_ok=True)
ds_ver = {}
for f in sorted((src/"datasources").glob("*.datasource")):
    t = f.read_text(); v = re.match(r"VERSION (\d+)", t).group(1); ds_ver[f.stem] = v
    t = re.sub(r"^VERSION \d+\n+", "", t)
    (out/"datasources"/f"{f.stem}__v{v}.datasource").write_text(t)
# names the app calls, mapped to source files
calls = {
 "get_total_average_page_duration__v5":"get_total_average_page_duration",
 "get_page_duration_per_view__v5":"get_page_duration_per_view",
 "get_view_completion_stats__v1":"get_view_completion_stats",
 "get_total_document_duration__v1":"get_total_document_duration",
 "get_total_link_duration__v1":"get_total_link_duration",
 "get_total_viewer_duration__v1":"get_total_viewer_duration",
 "get_useragent_per_view__v2":"get_useragent_per_view",
 "get_useragent_per_view__v3":"get_useragent_per_view",
 "get_total_dataroom_duration__v1":"get_total_dataroom_duration",
 "get_document_duration_per_viewer__v1":"get_document_duration_per_viewer",
 "get_webhook_events__v1":"get_webhook_events",
 "get_video_events_by_document__v1":"get_video_events_by_document",
 "get_video_events_by_view__v1":"get_video_events_by_view",
 "get_click_events_by_view__v1":"get_click_events_by_view",
 "get_dataroom_view_document_stats__v1":"get_dataroom_view_document_stats",
 "get_total_team_duration__v1":"get_total_team_duration",
}
for name, stem in calls.items():
    t = (src/"endpoints"/f"{stem}.pipe").read_text()
    t = re.sub(r"^VERSION \d+\n+", "", t)
    # unversioned datasource references -> versioned
    for ds, v in ds_ver.items():
        t = re.sub(rf"\b{ds}\b(?!__v)", f"{ds}__v{v}", t)
    t = t.rstrip() + "\n\nTYPE endpoint\n"
    (out/"endpoints"/f"{name}.pipe").write_text(t)
print("ok", ds_ver)
