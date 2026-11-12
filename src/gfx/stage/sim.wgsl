// algo landing: the swarm. One compute step per frame moves every particle toward the
// formation of the section in view. Units: screen heights, origin at the centre, y up.
// Each formation fills a box pinned to an element of the page, so it scrolls with its section.
//   0 array   64 columns of rising light, a mirror under them, low..high as a beam on the base
//   1 tree    the decision tree of binary search; light runs down the branches, the path is lit
//   2 cycle   the study loop: an orbit, five stations, a comet on the active one
//   3 curves  light running along n, n log n and n², with log n in the accent
//   4 bounds  the invariant: a ruler of 64 ticks, low and high as brackets closing on the target
// The pointer tears the swarm; the springs pull it back together.

struct Particle {
  pos: vec2f,
  vel: vec2f,
  seed: f32,
  heat: f32,
  tint: f32,
  vis: f32,
}

struct Sim {
  box: vec4f,      // cx, cy, half w, half h
  pointer: vec4f,  // xy, velocity xy
  span: vec4f,     // low, high, mid (-1 none), found (0/1)
  tree: vec4f,     // target leaf 0..63, depth reached 0..6, found 0/1
  misc: vec4f,     // cycle step 0..4, curves progress 0..1
  bounds: vec4f,   // low, high, target (fractions of the ruler)
  shift: vec4f,    // how far the box moved since the last frame (xy)
  time: f32,
  dt: f32,
  aspect: f32,
  form: f32,
  formT: f32,
  still: f32,
  power: f32,
  count: f32,
  // x height 0..1, y discarded, z mid, w found
  cells: array<vec4f, 64>,
}

@group(0) @binding(0) var<uniform> sim: Sim;
@group(0) @binding(1) var<storage, read_write> ps: array<Particle>;

const TAU = 6.2831853;
const PI = 3.14159265;

// PCG on the float's bits: sin-based hashes lose precision on large indices and clump
fn pcg(v: u32) -> u32 {
  let s = v * 747796405u + 2891336453u;
  let w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}
fn h11(x: f32) -> f32 { return f32(pcg(bitcast<u32>(x))) / 4294967295.0; }

// divergence-free flow: the curl of a sum of travelling waves
fn curl(p: vec2f, t: f32) -> vec2f {
  let a = vec2f(2.1, 2.7);
  let b = vec2f(4.3, -3.7);
  let pa = p * a + vec2f(t * 0.21, -t * 0.17);
  let pb = p * b + vec2f(-t * 0.31, t * 0.23);
  let dx = cos(pa.x) * cos(pa.y) * a.x + 0.45 * cos(pb.x + pb.y) * b.x;
  let dy = -sin(pa.x) * sin(pa.y) * a.y + 0.45 * cos(pb.x + pb.y) * b.y;
  return vec2f(dy, -dx);
}

// tint: 0 neon white, 1 accent, 2 found
struct Goal { p: vec2f, tint: f32, stiff: f32, vis: f32 }

// fades a particle out at the ends of a looping path, so the jump back to the start is never seen
fn ends(u: f32) -> f32 { return smoothstep(0.0, 0.08, u) * (1.0 - smoothstep(0.9, 1.0, u)); }

// ---------------------------------------------------------------- 0 · array

fn columnHeight(ci: i32) -> f32 {
  let c = sim.cells[ci];
  return max(0.012, c.x * (1.0 - 0.86 * c.y)) * 2.0 * sim.box.w;
}

fn formArray(i: f32, s: f32, t: f32) -> Goal {
  let c = sim.box.xy;
  let hw = sim.box.z;
  let pitch = 2.0 * hw / 64.0;
  let base = c.y - sim.box.w;
  let bw = pitch * 0.3;

  // one particle in ten belongs to the column being looked at, so it burns brighter
  var col = floor(h11(i * 0.131) * 64.0);
  if (sim.span.z >= 0.0 && h11(i * 9.13) < 0.0) { col = sim.span.z; }
  let ci = i32(col);
  let cell = sim.cells[ci];
  let x0 = c.x - hw + (col + 0.5) * pitch;
  let H = columnHeight(ci);
  let hot = max(cell.z, cell.w);
  let u = fract(t * (0.18 + 0.2 * s) + h11(i * 3.17));
  let side = select(-1.0, 1.0, h11(i * 2.31) > 0.5);
  let role = h11(i * 1.73);

  var g: Goal;
  g.stiff = 1.0;
  g.tint = cell.z + cell.w * 2.0;
  // the same number of particles on every column: a short one is denser, so it shines less each
  let density = clamp(H / (2.0 * sim.box.w), 0.03, 1.0);
  g.vis = mix(1.0, 0.3, cell.y) * density;
  if (role < 0.6) {
    // the two edges of the column, light rising up them
    g.p = vec2f(x0 + side * bw, base + u * H);
    g.vis *= ends(u);
  } else if (role < 0.7) {
    // the cap
    g.p = vec2f(x0 + (u * 2.0 - 1.0) * bw, base + H);
    g.vis *= ends(u);
  } else if (role < 0.8) {
    // the inside: faint, unless the column is lit
    g.p = vec2f(x0 + (h11(i * 4.71) * 2.0 - 1.0) * bw * 0.8, base + u * H);
    g.vis *= (0.06 + 0.4 * hot) * ends(u);
  } else if (role < 0.94) {
    // the mirror under the base
    g.p = vec2f(x0 + side * bw, base - 0.008 - u * H * 0.55);
    g.vis *= 0.22 * (1.0 - u) * ends(u);
  } else {
    // low..high: a beam along the base, the interval still in play
    let lo = c.x - hw + sim.span.x * pitch;
    let hi = c.x - hw + (sim.span.y + 1.0) * pitch;
    let v = fract(t * 0.12 + h11(i * 5.9));
    g.p = vec2f(mix(lo, hi, v), base - 0.004 + (h11(i * 6.1) - 0.5) * 0.003);
    g.tint = 1.0;
    g.vis = ends(v);
  }
  return g;
}

// ---------------------------------------------------------------- 1 · tree

fn nodePos(n: f32) -> vec2f {
  let d = floor(log2(n + 1.0) + 1e-4);
  let w = exp2(d);
  let k = n + 1.0 - w;
  let c = sim.box.xy;
  return vec2f(c.x + ((k + 0.5) / w - 0.5) * 2.0 * sim.box.z, c.y + sim.box.w - d * (2.0 * sim.box.w / 5.0));
}

fn nodeLit(n: f32) -> bool {
  let d = floor(log2(n + 1.0) + 1e-4);
  let k = n + 1.0 - exp2(d);
  return d < sim.tree.y && k == floor(sim.tree.x / exp2(6.0 - d));
}

fn formTree(i: f32, s: f32, t: f32) -> Goal {
  var g: Goal;
  g.stiff = 1.0;
  let role = h11(i * 1.31);
  if (role < 0.78) {
    // light running from a parent to its child
    let child = 1.0 + floor(h11(i * 0.713) * 62.0);
    let parent = floor((child - 1.0) * 0.5);
    let a = nodePos(parent);
    let b = nodePos(child);
    let u = fract(t * (0.12 + 0.1 * s) + h11(i * 2.9));
    let dir = normalize(b - a);
    g.p = mix(a, b, u) + vec2f(-dir.y, dir.x) * (h11(i * 3.7) - 0.5) * 0.004;
    let lit = nodeLit(child);
    g.tint = select(0.0, 1.0, lit);
    g.vis = select(0.14, 0.8, lit) * ends(u);
  } else {
    // a knot of light on each node
    let n = floor(h11(i * 0.53) * 63.0);
    let lit = nodeLit(n);
    let d = floor(log2(n + 1.0) + 1e-4);
    let last = lit && d + 1.0 >= sim.tree.y;
    let a = t * (0.8 + s) + h11(i) * TAU;
    let r = (0.003 + 0.012 * h11(i * 7.0) * h11(i * 7.0)) * select(1.0, 1.8, last);
    g.p = nodePos(n) + vec2f(cos(a), sin(a)) * r;
    g.tint = select(select(0.0, 1.0, lit), 2.0, last && sim.tree.z > 0.5);
    g.vis = select(0.22, 0.9, lit);
  }
  return g;
}

// ---------------------------------------------------------------- 2 · cycle

fn formCycle(i: f32, s: f32, t: f32) -> Goal {
  let c = sim.box.xy;
  let r = sim.box.zw;
  let spin = t * 0.04;
  let station = sim.misc.x;
  let aStation = station / 5.0 * TAU + PI * 0.5 - spin;
  var g: Goal;
  g.stiff = 1.0;
  let role = h11(i * 1.11);
  if (role < 0.6) {
    // the orbit; the comet's tail trails behind the active station
    let u = fract(h11(i * 2.3) - t * 0.015 * (1.0 + s));
    let a = u * TAU;
    let jit = (h11(i * 4.1) - 0.5) * 0.012;
    g.p = c + vec2f(cos(a), sin(a)) * (r + vec2f(jit));
    var behind = a - aStation;
    behind = behind - floor(behind / TAU) * TAU;
    let tail = exp(-behind * 2.4);
    g.tint = tail;
    g.vis = 0.16 + 0.84 * tail;
  } else if (role < 0.9) {
    // five stations
    let j = floor(h11(i * 0.77) * 5.0);
    let a = j / 5.0 * TAU + PI * 0.5 - spin;
    let on = abs(j - station) < 0.5;
    let orbit = t * (1.0 + s) + h11(i) * TAU;
    let rr = (0.004 + 0.016 * h11(i * 5.3) * h11(i * 5.3)) * select(1.0, 2.0, on);
    g.p = c + vec2f(cos(a), sin(a)) * r + vec2f(cos(orbit), sin(orbit)) * rr;
    g.tint = select(0.0, 1.0, on);
    g.vis = select(0.3, 1.0, on);
  } else {
    // a spoke from the hub to the active station
    let u = fract(t * 0.3 + h11(i * 6.7));
    g.p = mix(c, c + vec2f(cos(aStation), sin(aStation)) * r, u);
    g.tint = 1.0;
    g.vis = 0.5 * ends(u);
  }
  return g;
}

// ---------------------------------------------------------------- 3 · curves

fn cost(kind: f32, x: f32) -> f32 {
  let n = 1.0 + 63.0 * x;
  let lg = log2(n);
  var y = n * n;
  if (kind < 0.5) { y = lg * 2.0; }
  else if (kind < 1.5) { y = n; }
  else if (kind < 2.5) { y = n * lg; }
  return y / 64.0;
}

fn formCurves(i: f32, s: f32, t: f32) -> Goal {
  let origin = sim.box.xy - sim.box.zw;
  let size = sim.box.zw * 2.0;
  let progress = max(sim.misc.y, 0.001);
  let role = h11(i * 1.19);
  var kind = 3.0;
  if (role < 0.3) { kind = 0.0; } else if (role < 0.6) { kind = 1.0; } else if (role < 0.82) { kind = 2.0; }
  let u = fract(t * (0.05 + 0.05 * s) + h11(i * 2.7));
  var g: Goal;
  g.stiff = 1.0;
  if (role > 0.95) {
    // the axis
    g.p = origin + vec2f(u * size.x, 0.0);
    g.tint = 0.0;
    g.vis = 0.3 * ends(u);
    return g;
  }
  let x = u * progress;
  let y = cost(kind, x);
  g.p = origin + vec2f(x, min(y, 1.08)) * size + vec2f(0.0, (h11(i * 3.3) - 0.5) * 0.003);
  g.tint = select(0.0, 1.0, kind < 0.5);
  // a short curve gets as many particles as a long one: dim it by how much of it is drawn
  let drawn = max(0.04, min(progress, select(1.0, 0.13, kind > 2.5)));
  g.vis = ends(u) * (1.0 - smoothstep(1.0, 1.08, y)) * select(1.0, 0.5, kind > 2.5) * 0.4 * sqrt(drawn);
  return g;
}

// ---------------------------------------------------------------- 4 · bounds

fn formBounds(i: f32, s: f32, t: f32) -> Goal {
  let c = sim.box.xy;
  let hw = sim.box.z;
  let hh = sim.box.w;
  let left = c.x - hw;
  let w = 2.0 * hw;
  let lo = left + sim.bounds.x * w;
  let hi = left + sim.bounds.y * w;
  let role = h11(i * 1.37);
  var g: Goal;
  g.stiff = 1.0;
  if (role < 0.5) {
    // 64 ticks; the ones still in play are bright
    let k = floor(h11(i * 0.91) * 64.0);
    let x = left + (k + 0.5) / 64.0 * w;
    let u = fract(t * (0.15 + 0.1 * s) + h11(i * 2.3));
    let inside = x > lo && x < hi;
    g.p = vec2f(x, c.y - hh * 0.35 + u * hh * 0.7);
    g.tint = 0.0;
    g.vis = select(0.07, 0.4, inside) * ends(u);
  } else if (role < 0.9) {
    // two brackets: a tall stroke and two short feet pointing inward
    let right = h11(i * 3.1) > 0.5;
    let x = select(lo, hi, right);
    let inward = select(1.0, -1.0, right);
    let u = fract(t * (0.2 + 0.15 * s) + h11(i * 4.3));
    let part = h11(i * 5.9);
    if (part < 0.7) {
      g.p = vec2f(x, c.y - hh + u * 2.0 * hh);
    } else {
      let top = select(-1.0, 1.0, part > 0.85);
      g.p = vec2f(x + inward * u * hh * 0.35, c.y + top * hh);
    }
    g.tint = 1.0;
    g.vis = 0.32 * ends(u);
  } else {
    // the target, always between them
    let a = t * (1.0 + s) + h11(i) * 6.2831853;
    let r = 0.003 + 0.014 * h11(i * 7.3) * h11(i * 7.3);
    g.p = vec2f(left + sim.bounds.z * w, c.y) + vec2f(cos(a), sin(a)) * r;
    g.tint = 2.0;
    g.vis = 0.8;
  }
  return g;
}

fn goal(form: f32, i: f32, s: f32, t: f32) -> Goal {
  if (form < 0.5) { return formArray(i, s, t); }
  if (form < 1.5) { return formTree(i, s, t); }
  if (form < 2.5) { return formCycle(i, s, t); }
  if (form < 3.5) { return formCurves(i, s, t); }
  return formBounds(i, s, t);
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let n = u32(sim.count);
  if (id.x >= n) { return; }
  var p = ps[id.x];
  let i = f32(id.x);
  let dt = sim.dt;
  let t = sim.time;

  let g = goal(sim.form, i, p.seed, t);
  // after a change of section the swarm lets go and regroups from the front, not all at once
  let lag = p.seed * 0.7;
  let hold = smoothstep(lag, lag + 0.7, sim.formT) * g.stiff;

  // the formation travels with its section: carried rigidly, never pulled after it like a spring
  p.pos += sim.shift.xy;
  // critically damped: the swarm settles without swinging back and forth
  let k = 38.0 * hold;
  var acc = (g.p - p.pos) * k - p.vel * (12.0 * hold + 0.9);
  acc += curl(p.pos * 1.4, t) * (0.08 + 1.2 * (1.0 - hold)) * (1.0 - sim.still);

  // the pointer tears through and drags a wake
  let d = p.pos - sim.pointer.xy;
  let r2 = dot(d, d);
  let f = exp(-r2 / 0.005) * sim.power;
  let dn = d / sqrt(r2 + 1e-5);
  acc += (dn * 6.0 + vec2f(-dn.y, dn.x) * 4.0) * f;
  acc += sim.pointer.zw * f * 8.0;

  if (sim.still > 0.5) {
    p.vel = vec2f(0.0);
    p.pos = mix(p.pos, g.p, 1.0 - exp(-dt * 30.0));
  } else {
    p.vel += acc * dt;
    p.pos += p.vel * dt;
  }
  p.heat = max(p.heat * exp(-dt * 1.8), min(1.0, f * 1.6));
  p.tint = mix(p.tint, g.tint, 1.0 - exp(-dt * 5.0));
  p.vis = mix(p.vis, g.vis, 1.0 - exp(-dt * 8.0));
  ps[id.x] = p;
}
