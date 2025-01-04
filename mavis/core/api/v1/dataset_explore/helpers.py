# from fastapi import APIRouter

# from core import utils
# from core.graph import graph_client
# from core.v4 import createDataset
# from core.v4.datasetPlotter import DatasetPlot as DatasetPlotV2
# from core.v4.datasetPlotter import PlotKindEnum as PlotKindEnumV2

# from .models import DatasetBasic, OutputKindEnum

# router = APIRouter()


# def _get_col(options, col_id, agg_function=None):
#     if col_id:
#         for c in options:
#             if col_id == c.column_id and (
#                 agg_function is None or agg_function.lower() == c.agg_function.value
#             ):
#                 return c
#     return None


# def make_definition(input):
#     if input.cohort:
#         return createDataset.DatasetConfig(
#             activity_stream=input.activity_stream,
#             cohort=input.cohort,
#             append_activities=input.append_activities,
#         )
#     else:
#         return None


# def get_explore_options(mavis, dataset_config, dataset_definition=None):
#     (d_obj, group, plot, dataset_definition) = _get_dataset_obj(
#         mavis, dataset_config, dataset_definition
#     )

#     if group:
#         gc_group = {gc["id"]: gc for gc in group["columns"]}

#     (columns, _, time_filter) = createDataset.get_quick_explore_columns(mavis, d_obj)

#     (y_metric_options, orignial_to_idx) = createDataset.get_possible_metric_columns(
#         mavis, d_obj
#     )

#     segment_by_options = [
#         c
#         for c in columns
#         if c.column
#         and c.column.type != "timestamp"
#         and c.column.name
#         not in (
#             "enriched_activity_id",
#             "activity_id",
#             "customer",
#             "join_customer",
#             "link",
#         )
#         and not (
#             c.column.type == "string"
#             and (
#                 len(c.column.values) > 50
#                 or (len(c.column.values) > 0 and c.column.values[0].key == "% NULL")
#                 or (len(c.column.values) > 1 > float(c.column.values[1].value[:-1]))
#                 or (
#                     len(c.column.values) == 1
#                     and c.column.values[0].value == "NULL"
#                     and float(c.column.values[0].value[:-1]) < 50
#                 )
#             )
#         )
#     ]

#     selected_filters = []

#     if plot:
#         y_metrics = []
#         y_id_to_col = {y.id: y for y in y_metric_options}
#         column_id_to_col = {s.column_id: s for s in columns}

#         segment_bys = []
#         g_slug = plot["config"]["dataset"]["group_slug"]
#         pl_cols = plot["config"]["columns"]

#         # handle adding the parent filters as filtesr
#         for pf in group.get("parent_filters") or []:
#             if column_id_to_col.get(pf["column_id"]):
#                 selected_filters.append(
#                     createDataset.PossibleColumnFilter(
#                         **column_id_to_col[pf["column_id"]].dict(), filter=pf["filter"]
#                     )
#                 )

#         # add the columns of the plots
#         y_metrics = [
#             y_id_to_col[orignial_to_idx[f"{g_slug}.{y_id}"]] for y_id in pl_cols["ys"]
#         ]

#         # use the time column for resolution
#         if (
#             len(pl_cols["xs"]) == 1
#             and gc_group.get(pl_cols["xs"][0])
#             and gc_group.get(pl_cols["xs"][0])["type"] == "timestamp"
#         ):
#             time_resolution = utils.guess_format(
#                 gc_group[pl_cols["xs"][0]]["label"], "timestamp"
#             ).replace("date_short", "day")

#         else:
#             time_resolution = None

#         if time_resolution:
#             plot_segment_by = pl_cols["color_bys"]
#         else:
#             plot_segment_by = pl_cols["xs"]

#         # add the color by
#         for c_id in plot_segment_by:
#             temp_col = column_id_to_col.get(gc_group.get(c_id, {}).get("column_id"))

#             if temp_col:
#                 segment_bys.append(temp_col)

#         # In case the y columns is the a computed columns
#         if not y_metrics:
#             y_metrics = y_metric_options[:1]

#         # save the plot kind
#         plot_kind = plot["config"]["axes"]["plot_kind"]

#     else:
#         y_metrics = y_metric_options[:1]
#         segment_bys = []
#         time_resolution = "month"
#         plot_kind = None

#     return dict(
#         dataset_definition=dataset_definition,
#         fields=d_obj.get("fields") or dict(),
#         y_metric_options=y_metric_options,
#         segment_by_options=segment_by_options,
#         filter_column_options=columns,
#         time_filter=time_filter,
#         y_metrics=y_metrics,
#         segment_bys=segment_bys,
#         selected_filters=selected_filters,
#         time_resolution=time_resolution,
#         dataset_config=dataset_config,
#         plot_options=[pk.value for pk in PlotKindEnumV2],
#         plot_kind=plot_kind,
#         loading_screen=[
#             dict(
#                 percent=20,
#                 text="generating a dataset to create this slice",
#                 duration=11,
#             ),
#             dict(
#                 percent=30,
#                 text="Running the query",
#                 duration=20,
#             ),
#             dict(
#                 percent=60,
#                 text="Creating the plot",
#                 duration=40,
#             ),
#             dict(
#                 percent=75,
#                 text="Still waiting, you have a lot of data so this takes a bit of processing",
#                 duration=52,
#             ),
#             dict(
#                 percent=90,
#                 text="Things is longer than usual, but should be back any second",
#                 duration=65,
#             ),
#         ],
#     )


# def apply_explore_options(
#     mavis,
#     d_obj,
#     plot_kind,
#     y_metrics,
#     segment_bys,
#     time_resolution,
#     selected_filters=None,
#     time_filter=None,
#     output_kind=None,
#     title=None,
# ):
#     (y_metric_options, _) = createDataset.get_possible_metric_columns(mavis, d_obj)

#     activity_objs = {a["id"]: a for a in d_obj["query"]["activities"]}

#     # add the group func to all y_metric_options
#     cm = {
#         c["id"]: c
#         for c in dataset.ds.get_all_columns(d_obj["query"], force_uniqueness=True)
#     }

#     plan = []

#     # add the columns needed
#     for c in segment_bys:
#         if c.column_id is None:
#             (desired_col, _) = createDataset._convert_column_config_to_col(
#                 mavis, activity_objs[c.activity_id], c.column, None
#             )
#             c.column_id = desired_col["id"]
#             cm[desired_col["id"]] = desired_col
#             createDataset._add_action(plan, "add", new_column=desired_col)

#     # Add the column filters
#     for f in selected_filters or []:
#         createDataset.apply_quick_explore(mavis, d_obj, plan, column=f, filter=f.filter)

#     # new col
#     if time_filter:
#         time_filter.operator = "time_range"
#         ts_col = createDataset._get_cohort_column(d_obj["query"], "ts")
#         cohort_ts_col = createDataset.PossibleColumn(
#             column_id=ts_col["id"],
#             activity_id=createDataset._get_activity_id(ts_col),
#         )
#         createDataset.apply_quick_explore(
#             mavis, d_obj, plan, column=cohort_ts_col, filter=time_filter
#         )

#     group_slug = utils.slugify("explore") + get_uuid()[:8]

#     # add the group
#     createDataset._add_action(
#         plan,
#         "add_group",
#         group_slug=group_slug,
#         group_name="Explore",
#     )

#     # Create the group
#     if time_resolution:
#         found_column = createDataset._find_or_add_time_column(
#             mavis, d_obj, time_resolution.value, plan
#         )
#         createDataset._add_action(
#             plan,
#             "add",
#             group_slug=group_slug,
#             column_kind="group",
#             new_column=createDataset._create_group_column(found_column),
#         )

#     for c in segment_bys:
#         createDataset._add_action(
#             plan,
#             "add",
#             group_slug=group_slug,
#             column_kind="group",
#             new_column=createDataset._create_group_column(cm[c.column_id]),
#         )

#     # Add all the group functions
#     mapping_id = dict()
#     # for y in y_metrics_options:
#     for y in y_metrics:
#         kind = "metrics"
#         if y.computed_string:
#             kind = "computed"
#             raw_string = y.computed_string

#             # replace the columns in order
#             for y_id, c_id in sorted(
#                 mapping_id.items(), key=lambda x: len(x[1]), reverse=True
#             ):
#                 raw_string = raw_string.replace(y_id, c_id)

#             desired_col = createDataset._create_computed_column(raw_string, y.label)
#         elif y.column_id is None:
#             desired_col = createDataset._create_count_all_column(d_obj["query"])
#         else:
#             desired_col = createDataset._create_metric_column(
#                 cm[y.column_id],
#                 y.agg_function,
#                 d_obj,
#                 display_format=y.display_format,
#             )
#             desired_col["label"] = y.label

#         mapping_id[y.id] = desired_col["id"]

#         # add the count all
#         createDataset._add_action(
#             plan,
#             "add",
#             group_slug=group_slug,
#             column_kind=kind,
#             new_column=desired_col,
#         )

#     # update the dataset
#     res = createDataset._update_plan(mavis, d_obj, plan)

#     # get the staged dataset
#     staged_dataset = res["staged_dataset"]

#     group = dataset.ds.get_group_from_slug(staged_dataset["query"], group_slug)
#     group["name"] = "Explore"

#     # add the order by x values
#     if group["columns"] and utils.get_simple_type(group["columns"][0]["type"]) in (
#         "number",
#         "timestamp",
#     ):
#         group["order"] = [createDataset._make_order(c["id"]) for c in group["columns"]]
#     else:
#         group["order"] = [
#             createDataset._make_order(mapping_id[y_metrics[0].id], is_desc=True)
#         ]

#     ys = [mapping_id[ym.id] for ym in y_metrics]

#     return_dict = dict(
#         staged_dataset=staged_dataset,
#         is_actionable=(
#             (
#                 (y_metrics[0].agg_function or "").lower()
#                 not in createDataset.NON_ACTIONABLE_FUNCS
#             )
#             if len(y_metrics) == 1 and len(segment_bys) == 1
#             else False
#         ),
#     )

#     # start preparing the plot
#     plot = DatasetPlotV2(
#         mavis,
#         dict(
#             dataset=dict(group_slug=group_slug),
#             columns=dict(
#                 ys=ys,
#                 xs=[c["id"] for c in group["columns"][:1]],
#                 color_bys=[c["id"] for c in group["columns"][1:]],
#             ),
#         ),
#         dataset_obj=staged_dataset["query"],
#     )
#     plot.load_data()
#     plot.generate_columns()
#     plot.reset_axis(override_title=title)

#     # add a slider
#     if plot.x_type in ("timestamp", "number"):
#         plot.config.axes.add_sliders = True
#         plot.config.axes.slider_start = 0
#         plot.config.axes.slider_end = 100

#     if plot_kind:
#         plot.config.axes.plot_kind = PlotKindEnumV2(plot_kind)

#     group["plots"].append(
#         dict(
#             slug=utils.slugify(plot.config.axes.title),
#             name=plot.config.axes.title,
#             config=plot.get_config(),
#         )
#     )

#     # process the plots
#     return_dict["plot_slug"] = (group["plots"][-1]["slug"],)
#     return_dict["plot_data"] = plot.run_plot()

#     # table data
#     for c in plot.data.columns:
#         if utils.get_simple_type(c.type) == "number":
#             c.filter_kind = "number_range"
#         elif utils.get_simple_type(c.type) == "timestamp":
#             c.filter_kind = "time_range"
#         else:
#             if len(set(r[c.name] for r in plot.data.rows)) < 15:
#                 c.filter_kind = "set_values"
#             else:
#                 c.filter_kind = "search"

#     # for table data
#     return_dict["table_data"] = plot.data

#     if len(y_metrics) >= 1:
#         if len(plot.data.rows) == 0:
#             return_dict["metric_data"] = dict(title=y_metrics[0].label, value="No Data")
#         else:
#             return_dict["metric_data"] = dict(
#                 title=y_metrics[0].label,
#                 value=utils.human_format(
#                     plot.data.rows[0][dataset.ds.column_mapper[ys[0]]],
#                     utils.guess_format(
#                         y_metrics[0].label, dataset.ds.column_types[ys[0]]
#                     ),
#                 ),
#             )

#     # show the output kind
#     if output_kind:
#         return_dict["output_kind"] = output_kind
#     elif len(plot.data.rows) <= 1 and len(y_metrics) == 1:
#         return_dict["output_kind"] = OutputKindEnum.METRIC
#     else:
#         return_dict["output_kind"] = OutputKindEnum.PLOT

#     # add the actionable data
#     if return_dict["is_actionable"]:
#         if len(group["columns"]) == 1:
#             feature_col = group["columns"][0]
#         else:
#             feature_col = group["columns"][1]

#         return_dict["analyze_button_input"] = dict(
#             feature_label=feature_col["label"],
#             feature_id=feature_col["id"],
#             kpi_id=f"{y_metrics[0].agg_function}.{y_metrics[0].column_id or''}",
#             kpi_label=y_metrics[0].label,
#             kpi_format=utils.guess_format(y_metrics[0].label),
#             time_resolution=time_resolution,
#             impact_direction="increase",
#             row_name="customer",
#         )

#     return return_dict


# def replace_field_with_value(s):
#     if s == "field":
#         return "value"
#     else:
#         return s


# def _get_dataset_obj(mavis, dataset_config: DatasetBasic, dataset_definition=None):
#     d_obj = None
#     group = None
#     plot = None

#     if dataset_config.staged_dataset:
#         if dataset_definition:
#             res = createDataset.diff_dataset(
#                 mavis,
#                 dataset_config.staged_dataset,
#                 createDataset.generate_dataset_obj(mavis, dataset_definition)[
#                     "staged_dataset"
#                 ],
#             )
#             dataset_config.staged_dataset = res["staged_dataset"]
#             fivetran_track(
#                 mavis.user, data=dict(action="updated_explore_definition")
#             )

#     elif dataset_config.slug:
#         d_obj = DatasetUpdator(mavis=mavis).get_config_with_narrative(
#             dataset_config.slug,
#             narrative_slug=dataset_config.narrative_slug,
#             upload_key=dataset_config.upload_key,
#         )

#         if dataset_definition is None:
#             # # validate the lockign of the kpi
#             for c in d_obj["query"]["columns"]:
#                 c["kpi_locked"] = True

#             # lock the activity
#             for a in d_obj["query"]["activities"]:
#                 a["kpi_locked"] = True

#             d_obj["query"] = DatasetUpdator(mavis=mavis).get_config_query(d_obj)

#             d_obj["query"] = utils.recursive_update(
#                 d_obj["query"], replace_field_with_value
#             )

#             # add the dataset
#             dataset_definition = createDataset.make_definition(
#                 mavis, d_obj, include_values=False
#             )

#             fivetran_track(mavis.user, data=dict(action="loaded_explore_from_dataset"))

#         dataset_config.staged_dataset = d_obj

#     elif dataset_config.activity_id:
#         activity_ids = [dataset_config.activity_id]
#         activities = {
#             a.id: a
#             for a in graph_client.get_activities_w_columns(ids=activity_ids).activities
#         }

#         all_cols = createDataset.get_activity_columns(
#             mavis,
#             activity_ids=activity_ids,
#             activities=activities,
#             include_values=False,
#         )["all_columns"]

#         dataset_definition = dict(
#             activity_stream=mavis.company.table(activities[activity_ids[0]].table_id),
#             cohort=dict(
#                 activity_ids=activity_ids,
#                 columns=[c for c in all_cols if not c["name"].startswith("_")],
#                 occurrence_filter=dict(occurrence=createDataset.OccurrenceEnum.ALL),
#             ),
#             append_activities=[],
#         )
#         dataset_config.staged_dataset = createDataset.generate_dataset_obj(
#             mavis, createDataset.DatasetConfig(**dataset_definition)
#         )["staged_dataset"]
#         fivetran_track(
#             mavis.user, data=dict(action="loaded_explore_from_activity")
#         )

#     if dataset_config.group_slug:
#         group = dataset.ds.get_group_from_slug(
#             dataset_config.staged_dataset["query"], dataset_config.group_slug
#         )

#         if group and dataset_config.plot_slug:
#             plot = next(
#                 (p for p in group["plots"] if p["slug"] == dataset_config.plot_slug),
#                 None,
#             )

#     if dataset_definition and not isinstance(dataset_definition, dict):
#         dataset_definition = dataset_definition.dict()

#     return (dataset_config.staged_dataset, group, plot, dataset_definition)
