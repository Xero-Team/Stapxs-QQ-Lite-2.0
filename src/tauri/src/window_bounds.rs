pub const LEGACY_WIDTH: f64 = 850.0;
pub const LEGACY_HEIGHT: f64 = 530.0;
pub const IDEAL_WIDTH: f64 = 1200.0;
pub const IDEAL_HEIGHT: f64 = 800.0;
pub const PREFERRED_MIN_WIDTH: f64 = 720.0;
pub const PREFERRED_MIN_HEIGHT: f64 = 450.0;
pub const HARD_MIN_WIDTH: f64 = 350.0;
pub const HARD_MIN_HEIGHT: f64 = 450.0;

const WORK_AREA_MARGIN: f64 = 48.0;
const WIDTH_RATIO: f64 = 0.72;
const HEIGHT_RATIO: f64 = 0.78;
const MIN_DEFAULT_WIDTH: f64 = 960.0;
const MIN_DEFAULT_HEIGHT: f64 = 640.0;
const LEGACY_SIZE_TOLERANCE: f64 = 8.0;

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct WindowBounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

fn clamp(value: f64, min: f64, max: f64) -> f64 {
    if max < min {
        max
    } else {
        value.max(min).min(max)
    }
}

pub fn is_legacy_default_window_size(width: f64, height: f64) -> bool {
    (width - LEGACY_WIDTH).abs() <= LEGACY_SIZE_TOLERANCE
        && (height - LEGACY_HEIGHT).abs() <= LEGACY_SIZE_TOLERANCE
}

pub fn min_window_size(work_width: f64, work_height: f64) -> (f64, f64) {
    (
        HARD_MIN_WIDTH.max(PREFERRED_MIN_WIDTH.min(work_width.floor())),
        HARD_MIN_HEIGHT.max(PREFERRED_MIN_HEIGHT.min(work_height.floor())),
    )
}

pub fn compute_default_window_size(work_width: f64, work_height: f64) -> (f64, f64) {
    let max_width = HARD_MIN_WIDTH.max(work_width - WORK_AREA_MARGIN);
    let max_height = HARD_MIN_HEIGHT.max(work_height - WORK_AREA_MARGIN);
    let width = clamp(
        (IDEAL_WIDTH.min(work_width * WIDTH_RATIO)).round(),
        MIN_DEFAULT_WIDTH.min(max_width),
        max_width,
    );
    let height = clamp(
        (IDEAL_HEIGHT.min(work_height * HEIGHT_RATIO)).round(),
        MIN_DEFAULT_HEIGHT.min(max_height),
        max_height,
    );
    (width, height)
}

pub fn fit_window_to_work_area(
    x: Option<f64>,
    y: Option<f64>,
    width: f64,
    height: f64,
    work_x: f64,
    work_y: f64,
    work_width: f64,
    work_height: f64,
) -> WindowBounds {
    let (min_width, min_height) = min_window_size(work_width, work_height);
    let max_width = min_width.max(work_width - WORK_AREA_MARGIN);
    let max_height = min_height.max(work_height - WORK_AREA_MARGIN);
    let width = clamp(width.round(), min_width, max_width);
    let height = clamp(height.round(), min_height, max_height);
    match (x, y) {
        (Some(x), Some(y)) if x.is_finite() && y.is_finite() => WindowBounds {
            x: clamp(
                x.round(),
                work_x,
                work_x.max(work_x + work_width - width),
            ),
            y: clamp(
                y.round(),
                work_y,
                work_y.max(work_y + work_height - height),
            ),
            width,
            height,
        },
        _ => WindowBounds {
            x: (work_x + (work_width - width) / 2.0).round(),
            y: (work_y + (work_height - height) / 2.0).round(),
            width,
            height,
        },
    }
}

pub fn resolve_window_bounds(
    x: Option<f64>,
    y: Option<f64>,
    width: f64,
    height: f64,
    work_x: f64,
    work_y: f64,
    work_width: f64,
    work_height: f64,
) -> WindowBounds {
    let legacy = is_legacy_default_window_size(width, height);
    let (width, height) = if legacy {
        compute_default_window_size(work_width, work_height)
    } else {
        (width, height)
    };
    fit_window_to_work_area(
        if legacy { None } else { x },
        if legacy { None } else { y },
        width,
        height,
        work_x,
        work_y,
        work_width,
        work_height,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn uses_ideal_size_on_1080p() {
        assert_eq!(compute_default_window_size(1920.0, 1080.0), (1200.0, 800.0));
    }

    #[test]
    fn replaces_legacy_default() {
        let bounds = resolve_window_bounds(
            Some(40.0),
            Some(60.0),
            850.0,
            530.0,
            0.0,
            0.0,
            1920.0,
            1080.0,
        );
        assert_eq!(
            bounds,
            WindowBounds {
                x: 360.0,
                y: 140.0,
                width: 1200.0,
                height: 800.0,
            }
        );
    }
}
