import math

from pydantic import BaseModel

from core.logger import get_logger

logger = get_logger()


def significance(total_a, conversion_rate_a, total_b, conversion_rate_b):
    if conversion_rate_a in (0, 1) or conversion_rate_b in (0, 1) or conversion_rate_a > 1 or conversion_rate_b > 1:
        return 0

    diff = abs(conversion_rate_a - conversion_rate_b)
    z_a = diff / math.sqrt(conversion_rate_a * (1 - conversion_rate_a) / total_a)
    z_b = diff / math.sqrt(conversion_rate_b * (1 - conversion_rate_b) / total_b)
    desrired_z = min(z_a, z_b)

    z_score_maps = [
        (0.99, 2.56),
        (0.95, 1.96),
        (0.90, 1.65),
        (0.80, 1.282),
        (0.50, 0.674),
        (0.0, 0),
    ]

    percent = next(p for p, z in z_score_maps if desrired_z >= z)
    return percent


def safe_divide(a: float, b: float) -> float:
    return a / b if b != 0 else 0


def simple_row(rows: list[dict], y_field: str) -> list[float]:
    return [y[y_field] for y in rows if y[y_field] is not None]


def simple_sum(rows: list[dict], y_field: str) -> float:
    rows = simple_row(rows, y_field)
    if len(rows) == 0:
        return 0
    return sum(rows)


def simple_average(rows: list[dict], y_field: str) -> float:
    return safe_divide(simple_sum(rows, y_field), len(simple_row(rows, y_field)))


def safe_average(values: list[float]) -> float:
    return safe_divide(sum(values), len(values))


def simple_max(rows: list[dict], y_field: str, abs_val: bool = False) -> float:
    rows = simple_row(rows, y_field)
    if len(rows) == 0:
        return 0
    if abs_val:
        return max([abs(r) for r in rows])
    return max(rows)


def simple_min(rows: list[dict], y_field: str) -> float:
    rows = simple_row(rows, y_field)
    if len(rows) == 0:
        return 0
    return min(rows)


def simple_range(rows: list[dict], y_field: str) -> tuple[float, float]:
    return simple_min(rows, y_field), simple_max(rows, y_field)


def weighted_average(rows: list[dict], y_field: str, weight_field: str) -> float:
    return safe_divide(
        sum([r[y_field] * r[weight_field] for r in rows if r[y_field] is not None and r[weight_field] is not None]),
        simple_sum(rows, weight_field),
    )


def impact(left_avg, right_avg) -> tuple[float, int]:
    if left_avg > right_avg:
        return percent_change(right_avg, left_avg), 0
    else:
        return percent_change(left_avg, right_avg), 1


def percent_change(from_val, to_val) -> float:
    return safe_divide((to_val - from_val), from_val)


def data_with_mass(rows: list[dict], weight_field: str) -> list[dict]:
    sum_w = simple_sum(rows, weight_field)
    return [r for r in rows if r[weight_field] is not None and r[weight_field] > 0.01 * sum_w]


class BucketDataResult(BaseModel):
    best_split: int | None
    right_is_better: bool
    max_impact: float
    max_right_avg: float
    max_left_avg: float
    left_total: int
    right_total: int


def bucket_data(
    rows: list[dict], y_field: str, weight_field: str | None = None, pick_best: bool = False
) -> BucketDataResult | None:
    """
    Buckets the data into group where the metric has the greatest difference and there is significant amount of data in it
    """
    if len(rows) < 3:  # Need minimum data points for meaningful split
        return None

    res = None

    max_weighted_impact = 0

    # Sort rows by y_field to ensure meaningful splits
    # sorted_rows = sorted(rows, key=lambda x: x[y_field] if x[y_field] is not None else float('-inf'))

    if weight_field:
        min_y, max_y = simple_range(rows, y_field)
        if min_y >= 0 and max_y <= 1:
            is_rate = True
            max_w = simple_max(rows, weight_field)
        else:
            is_rate = False

    # Try each possible split point
    for i in range(1, len(rows)):  # Leave at least 2 points on each side
        if pick_best:
            left_rows = [rows[i]]
            right_rows = [r for j, r in enumerate(rows) if j != i]
        else:
            left_rows = rows[:i]
            right_rows = rows[i:]

        # Calculate averages for both groups
        if weight_field:
            # get rid of anything that is less than 5% of the max weight
            if is_rate:
                left_rows = [r for r in left_rows if r[weight_field] is not None and r[weight_field] > 0.05 * max_w]
                right_rows = [r for r in right_rows if r[weight_field] is not None and r[weight_field] > 0.05 * max_w]

            left_avg = weighted_average(left_rows, y_field, weight_field)
            right_avg = weighted_average(right_rows, y_field, weight_field)
            left_total = simple_sum(left_rows, weight_field)
            right_total = simple_sum(right_rows, weight_field)
        else:
            left_avg = simple_average(left_rows, y_field)
            right_avg = simple_average(right_rows, y_field)
            left_total = len(left_rows)
            right_total = len(right_rows)

        # Calculate significance
        sig = significance(left_total, left_avg, right_total, right_avg)

        impact_val = right_avg - left_avg
        if impact_val > 0:
            use_ii = 1
        else:
            use_ii = 0
            impact_val = -impact_val

        weighted_impact = impact_val
        logger.debug(
            "weighted_impact - default",
            weighted_impact=weighted_impact,
            i=i,
            sig=sig,
            left_avg=left_avg,
            right_avg=right_avg,
            left_total=left_total,
            right_total=right_total,
        )
        # more impact then give the impact more
        if sig == 0.99:
            weighted_impact *= 2
        elif sig == 0.95:
            weighted_impact *= 1.5

        # add another 15% for more equal sizes of the data
        size_ratio = min(left_total, right_total) / max(left_total, right_total)
        if size_ratio < 0.25:
            weighted_impact = 0

        # Update best split if this one is more significant
        if sig > 0.8 and weighted_impact > max_weighted_impact:
            logger.debug(
                f"weighted_impact - update : {i}",
                weighted_impact=weighted_impact,
                i=i,
                min_size=min(left_total, right_total),
                max_size=max(left_total, right_total),
                size_ratio=len(right_rows) / len(rows),
            )
            res = BucketDataResult(
                best_split=i,
                right_is_better=use_ii == 1,
                max_impact=impact(left_avg, right_avg)[0],
                max_right_avg=right_avg,
                max_left_avg=left_avg,
                left_total=left_total,
                right_total=right_total,
            )
            max_weighted_impact = weighted_impact

    return res


def find_best_fit_line(ys: list[float]) -> tuple[float, float]:
    """Finds the best fit line for a given segment of data."""
    n = len(ys)
    xs = list(range(n))
    x_mean = safe_average(xs)
    y_mean = safe_average(ys)
    slope = safe_divide(
        sum([(x - x_mean) * (y - y_mean) for x, y in zip(xs, ys)]),
        sum([(x - x_mean) ** 2 for x in xs]),
    )
    intercept = y_mean - slope * x_mean
    return slope, intercept


def find_weighted_best_fit_line(ys: list[float], weights: list[float]) -> tuple[float, float]:
    """Finds the weighted best fit line for a given segment of data."""
    n = len(ys)
    x_values = list(range(n))

    # Calculate weighted sums
    sum_weights = sum(weights)
    sum_x = sum(x * w for x, w in zip(x_values, weights))
    sum_y = sum(y * w for y, w in zip(ys, weights))
    sum_xy = sum(x * y * w for x, y, w in zip(x_values, ys, weights))
    sum_x2 = sum(x * x * w for x, w in zip(x_values, weights))

    # Calculate weighted slope and intercept
    slope = safe_divide((sum_weights * sum_xy - sum_x * sum_y), (sum_weights * sum_x2 - sum_x * sum_x))
    intercept = safe_divide((sum_y - slope * sum_x), sum_weights)

    return slope, intercept


def find_greatest_difference_point(
    rows: list[dict], y_field: str, weight_field: str | None = None, min_points: int = 4
) -> int:
    """Finds the index with the greatest difference between two halves."""
    n = len(rows)
    max_diff = 0
    best_index = 0

    for i in range(min_points, n - min_points):
        if weight_field:
            left_mean = weighted_average(rows[:i], y_field, weight_field)
            right_mean = weighted_average(rows[i:], y_field, weight_field)
        else:
            left_mean = simple_average(rows[:i], y_field)
            right_mean = simple_average(rows[i:], y_field)

        diff = abs(left_mean - right_mean)

        if diff > max_diff:
            max_diff = diff
            best_index = i

    return best_index


def analyze_trend(
    rows: list[dict], y_field: str, weight_field: str | None = None, threshold: float = 0.2, min_points: int = 4
) -> tuple[list[dict], float, float]:
    """Recursively analyzes the trend to find the most consistent segment."""
    if len(rows) < (min_points * 2):  # Base case: not enough data to analyze
        return ([], 0, 0)

    # find the point with the greatest difference between two halves
    split_point = find_greatest_difference_point(rows, y_field, weight_field, min_points)
    logger.debug("split_point", split_point=split_point, row=rows[split_point])

    # Divide data into left and right segments
    left_segment = rows[:split_point]
    right_segment = rows[split_point:]

    # Compute the best fit lines for both segments
    if weight_field:
        left_slope, _ = find_weighted_best_fit_line(
            simple_row(left_segment, y_field), simple_row(left_segment, weight_field)
        )
        right_slope, right_intercept = find_weighted_best_fit_line(
            simple_row(right_segment[:-1], y_field), simple_row(right_segment[:-1], weight_field)
        )
    else:
        left_slope, _ = find_best_fit_line(simple_row(left_segment, y_field))
        right_slope, right_intercept = find_best_fit_line(simple_row(right_segment[:-1], y_field))

    if weight_field:
        slope, intercept = find_weighted_best_fit_line(
            simple_row(rows[:-1], y_field), simple_row(rows[:-1], weight_field)
        )
    else:
        slope, intercept = find_best_fit_line(simple_row(rows[:-1], y_field))

    # Compare the slopes
    slope_diff = 1.0 - safe_divide(min(left_slope, right_slope), max(left_slope, right_slope))

    logger.debug(
        "slope_diff",
        slope_diff=slope_diff,
        left_slope=left_slope,
        right_slope=right_slope,
        right_intercept=right_intercept,
        slope=slope,
        right_segment=right_segment[0],
        right_length=len(right_segment),
    )

    # if the slopes are so similar then use the full object
    if slope_diff < threshold or len(right_segment) <= min_points * 2:
        return (rows, slope, intercept)  # The segment with consistent trend
    else:
        return analyze_trend(right_segment, y_field, weight_field, threshold, min_points)
