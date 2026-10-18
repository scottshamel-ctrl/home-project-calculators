// Home project material calculators. Imperial units: feet for areas, inches for depths.
const num = (x, d = 1) => x.toLocaleString("en-US", { maximumFractionDigits: d });
const money = (x) => "$" + Math.round(x).toLocaleString("en-US");
const plus = (x, pct) => x * (1 + pct / 100);
const s = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// Splits a run into cabinet boxes in 3" width steps (9"–36"), leaving under 3" of filler.
function boxes(inches) {
  const t = Math.floor(inches / 3 + 1e-9) * 3;
  if (t < 9) return { list: "none", filler: inches };
  const k = Math.ceil(t / 36), w = Math.floor(t / k / 3) * 3, wider = (t - w * k) / 3;
  const groups = [[wider, w + 3], [k - wider, w]].filter(([c]) => c > 0);
  return { list: groups.map(([c, x]) => `${c} × ${x}"`).join(" + "), filler: inches - t };
}

const CALCS = {
  cabinet(v) {
    const baseIn = Math.max(v.base * 12 - v.appl, 0), upperIn = v.upper * 12, islandIn = v.island * 12;
    const b = boxes(baseIn), u = boxes(upperIn);
    const baseFt = (baseIn + islandIn) / 12, upperFt = upperIn / 12;
    return [
      ["Base cabinets", `${num(baseIn / 12, 2)} linear ft: ${b.list}${b.filler ? ` + ${num(b.filler, 2)}" filler` : ""}`],
      ["Wall (upper) cabinets", `${num(upperFt, 2)} linear ft: ${u.list}${u.filler ? ` + ${num(u.filler, 2)}" filler` : ""}`],
      ...(islandIn ? [["Island base cabinets", `${num(v.island, 2)} linear ft: ${boxes(islandIn).list}`]] : []),
      ["Total cabinetry", `${num(baseFt + upperFt, 2)} linear ft`],
      ["Estimated cabinet cost", money(baseFt * v.bppf + upperFt * v.uppf), true],
    ];
  },
  countertop(v) {
    const run = v.l1 + v.l2 + v.l3;
    const top = (run * v.depth + v.il * v.iw) / 144, splash = (run * v.splash) / 144;
    const buy = plus(top + splash, v.waste);
    return [
      ["Countertop area", `${num(top, 2)} sq ft`],
      ["Backsplash area", `${num(splash, 2)} sq ft`],
      [`Total with ${v.waste}% waste`, `${num(buy, 1)} sq ft`],
      ["Slabs needed", s(Math.ceil(buy / v.slab - 1e-9), "slab")],
      ["Estimated cost", money(buy * v.price), true],
    ];
  },
  asphalt(v) {
    const ft3 = v.l * v.w * (v.t / 12), tons = plus((ft3 * v.density) / 2000, v.waste);
    return [
      ["Area", `${num(v.l * v.w, 0)} sq ft`],
      ["Volume (compacted)", `${num(ft3 / 27, 2)} cubic yards`],
      [`Asphalt with ${v.waste}% extra`, `${num(tons, 2)} tons`, true],
      ["Estimated cost", money(tons * v.price)],
    ];
  },
  stain(v) {
    const area = v.dl * v.dw + v.rail * 6 + v.fl * v.fh * v.sides;
    const gal = (area * v.coats) / v.cover, buy = Math.ceil(gal - 1e-9);
    const pails = Math.floor(buy / 5), single = buy - pails * 5;
    const pack = [pails && `${pails} × 5-gallon pail`, single && `${single} × 1-gallon can`].filter(Boolean).join(" + ");
    return [
      ["Surface to stain", `${num(area, 0)} sq ft`],
      [`Stain for ${s(v.coats, "coat")}`, `${num(gal, 2)} gallons`],
      ["Buy", `${s(buy, "gallon")} (${pack || "none"})`, true],
    ];
  },
  propane(v) {
    const gph = v.btu / 91500, perDay = gph * v.hours;
    return [
      ["Propane burned per hour", `${num(gph, 2)} gallons (${num(gph * 4.24, 2)} lb)`],
      ["Hours of use per tank", `${num(v.tank / gph, 1)} hours`],
      ["Days per tank", `${num(v.tank / perDay, 1)} days`, true],
      ["Propane per month (30 days)", `${num(perDay * 30, 1)} gallons`],
      ["Cost per month", money(perDay * 30 * v.price)],
    ];
  },
  resin(v) {
    const in3 = plus(v.l * v.w * v.d, v.waste), oz = in3 / 1.80469;
    return [
      ["Pour volume", `${num(in3, 1)} cubic inches`],
      ["Mixed resin needed", `${num(oz, 1)} fl oz (${num(in3 / 231, 2)} gal, ${num(in3 * 0.0163871, 2)} L)`, true],
      [`Part A resin (${v.ratio}:1 by volume)`, `${num((oz * v.ratio) / (v.ratio + 1), 1)} fl oz`],
      ["Part B hardener", `${num(oz / (v.ratio + 1), 1)} fl oz`],
    ];
  },
  epoxy(v) {
    const area = v.l * v.w, perGal = (1604 * (v.solids / 100)) / v.mils;
    const gal = plus((area * v.coats) / perGal, v.waste);
    return [
      ["Floor area", `${num(area, 0)} sq ft`],
      ["Coverage per gallon", `${num(perGal, 0)} sq ft per coat`],
      [`Epoxy for ${s(v.coats, "coat")} + ${v.waste}% waste`, `${num(gal, 2)} gallons`, true],
      [`Kits (${v.kit} gal each)`, s(Math.ceil(gal / v.kit - 1e-9), "kit")],
    ];
  },
  sod(v) {
    const area = plus(v.l * v.w, v.waste), piece = (v.pl * v.pw) / 144;
    return [
      [`Sod with ${v.waste}% extra`, `${num(area, 0)} sq ft`],
      [`Pallets (${num(v.pallet, 0)} sq ft each)`, `${num(area / v.pallet, 2)}: buy ${s(Math.ceil(area / v.pallet - 1e-9), "pallet")}`, true],
      [`Pieces (${num(v.pl, 0)}" × ${num(v.pw, 0)}")`, num(Math.ceil(area / piece - 1e-9), 0)],
      ["Estimated cost", money(area * v.price)],
    ];
  },
  sand(v) {
    const ft3 = plus(v.l * v.w * (v.d / 12), v.waste), lb = ft3 * v.density;
    return [
      ["Sand volume", `${num(ft3, 1)} cubic feet (${num(ft3 / 27, 2)} cubic yards)`],
      ["Weight", `${num(lb / 2000, 2)} tons`, true],
      [`${num(v.bag, 0)} lb bags`, num(Math.ceil(lb / v.bag - 1e-9), 0)],
      ["Estimated bulk cost", money((lb / 2000) * v.price)],
    ];
  },
};

if (typeof document === "undefined") globalThis.CALCS = CALCS;
else {
  const form = document.querySelector("form[data-calc]");
  const run = () => {
    const out = document.getElementById("result"), v = {};
    let bad = false;
    for (const el of form.elements) {
      if (!el.name) continue;
      const n = parseFloat(el.value);
      v[el.name] = isFinite(n) && n >= 0 ? n : 0;
      if (el.required && !(n > 0)) bad = true;
    }
    out.innerHTML = bad ? `<p class="hint">Fill in every required box with a number above zero.</p>`
      : `<dl>${CALCS[form.dataset.calc](v).map(([k, val, hi]) => `<div class="${hi ? "hi" : ""}"><dt>${k}</dt><dd>${val}</dd></div>`).join("")}</dl>`;
  };
  if (form) { form.addEventListener("input", run); form.addEventListener("submit", (e) => { e.preventDefault(); run(); }); run(); }
}
