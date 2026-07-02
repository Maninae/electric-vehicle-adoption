/* Metric → color for the choropleth maps. Each of the four lenses (per tab) gets
   a distinct single-hue ramp so a 2x2 grid reads as four different questions.
   Ramps are FIXED in both themes (only --map-nodata is theme-dependent), the same
   discipline Grid Atlas settled on after a theme-dependent ramp read backwards.

   "clean" deliberately reuses Grid Atlas's green ramp — the two sites share that
   metric, so they should share the color. */
const d3 = window.d3;

// [lo, hi] endpoints per metric.
// The low endpoints are deliberately LIFTED above the dark-theme --card (#131829)
// and --map-nodata (#1A2133) so real-but-low data (USA 10% share, India 2.1%, most
// of Africa) reads as data rather than dissolving into the card or masquerading as
// "no data". Each low retains its ramp's hue identity (teal / violet / amber / green)
// as a saturated shadow, not a neutral, so the four maps still read as four
// distinct questions. The high endpoints are unchanged.
const RAMPS = {
  share:    ["#164A56", "#2FE3D0"], // EV share of new cars — electric teal-cyan (brand)
  percap:   ["#2A2758", "#9D8CFF"], // EVs per 1,000 people — electric violet
  charging: ["#2A2620", "#F5B63F"], // charging ports per capita — charged amber
  clean:    ["#142621", "#39D98E"], // grid cleanliness — green (Grid Atlas cross-link)
  growth:   ["#1B1A33", "#9D8CFF"], // YoY growth — violet (momentum)
  lowcarbon:["#142621", "#39D98E"], // world grid low-carbon % — same green as clean
};

// "growth" is the YoY change in EV share (percentage points) and CAN be negative
// (Germany, Iceland, etc. fell in 2024). It gets a DIVERGING ramp centered on 0 so
// declines read differently from flat — a single-hue ramp would paint them alike.
// The neutral is lifted (was #2A3350, ≈ --card in dark theme, so flat-growth countries
// like India 0.0 and Russia +2 dissolved) to #3D4670 — still an indigo neutral, but
// with enough luminance to sit clearly ABOVE both --card and --map-nodata on dark,
// and clearly BELOW --paper on light.
const GROWTH_NEG = ["#D06A4A", "#3D4670"]; // -8pp (amber-red) → 0 (neutral indigo)
const GROWTH_POS = ["#3D4670", "#9D8CFF"]; // 0 (neutral indigo) → +12pp (violet)

// Build a value→color function. `max` sets the top of the ramp (each map
// normalizes to its own domain).
export function colorFn(metric, max) {
  if (metric === "growth") {
    const neg = d3.interpolateRgb(GROWTH_NEG[0], GROWTH_NEG[1]);
    const pos = d3.interpolateRgb(GROWTH_POS[0], GROWTH_POS[1]);
    return (v) => {
      if (v == null) return null;
      return v < 0 ? neg(Math.max(0, Math.min(1, (v + 8) / 8)))
                   : pos(Math.max(0, Math.min(1, v / (max || 12))));
    };
  }
  const [lo, hi] = RAMPS[metric] || RAMPS.share;
  const f = d3.interpolateRgb(lo, hi);
  const top = max || 100;
  return (v) => (v == null ? null : f(Math.max(0, Math.min(1, v / top))));
}

// The swatches for a gradient legend bar.
export function rampColors(metric) {
  if (metric === "growth") return [GROWTH_NEG[0], GROWTH_NEG[1], GROWTH_POS[1]];
  const [lo, hi] = RAMPS[metric] || RAMPS.share;
  const mid = d3.interpolateRgb(lo, hi)(0.5);
  return [lo, mid, hi];
}

export function legendHtml(metric, loLabel, hiLabel) {
  // The growth metric uses a diverging ramp around 0 (negatives → indigo neutral
  // → positives). Without a midpoint label the reader can't tell where 0 sits on
  // the asymmetric -8..+12 bar, so add one. Other metrics keep their simple lo/hi.
  if (metric === "growth") {
    // 0 sits at 8/(8+12) = 40% along the bar (domain hardcoded to match
    // GROWTH_NEG/GROWTH_POS above and world-view MAPS cfg { max: 12 }). If the
    // growth domain ever becomes symmetric or configurable, thread the fraction
    // in as an arg. The label is nested INSIDE .legend-ramp so it can be
    // positioned absolutely relative to the bar (see components.css).
    return `<span class="legend-lo">${loLabel}</span>` +
      `<span class="legend-ramp" style="background:linear-gradient(90deg, ${rampColors(metric).join(",")})">` +
        `<span class="legend-mid" style="left:40%">0</span>` +
      `</span>` +
      `<span class="legend-hi">${hiLabel}</span>`;
  }
  return `<span class="legend-lo">${loLabel}</span>` +
    `<span class="legend-ramp" style="background:linear-gradient(90deg, ${rampColors(metric).join(",")})"></span>` +
    `<span class="legend-hi">${hiLabel}</span>`;
}

export { RAMPS };
