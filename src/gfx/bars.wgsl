// A sorted array as a row of 3D columns, raymarched in one fullscreen pass.
// Each cell carries its height and how much it is "discarded", "mid" or "found",
// so the same shader draws the landing's field and the player's stage.

struct Scene {
  res: vec2f,
  time: f32,
  count: f32,
  // x orbit angle, y elevation, z distance, w lens (focal length)
  cam: vec4f,
  // x spacing, y bar width, z bar depth, w max height
  geo: vec4f,
  bg: vec4f,
  bar: vec4f,
  dim: vec4f,
  mid: vec4f,
  found: vec4f,
  // x dark (1/0), y fade in, z vignette, w unused
  look: vec4f,
  // x, y: where the picture sits on screen (offset in viewport heights)
  view: vec4f,
  // x height, y discarded, z mid, w found (all 0..1)
  cells: array<vec4f, 64>,
}
@group(0) @binding(0) var<uniform> scene: Scene;

const FAR = 80.0;

fn sdBox(p: vec3f, b: vec3f) -> f32 {
  let q = abs(p) - b;
  return length(max(q, vec3f(0.0))) + min(max(q.x, max(q.y, q.z)), 0.0) - 0.02;
}

fn cellX(i: f32) -> f32 {
  return (i - (scene.count - 1.0) * 0.5) * scene.geo.x;
}

fn cellHeight(i: i32) -> f32 {
  let c = scene.cells[i];
  // discarded columns sink, but never vanish: you can still see what was ruled out
  return max(0.06, c.x * scene.geo.w * (1.0 - 0.72 * c.y));
}

// distance to the nearest column, and its index
fn mapBars(p: vec3f) -> vec2f {
  let n = i32(scene.count);
  let center = i32(round(p.x / scene.geo.x + (scene.count - 1.0) * 0.5));
  var best = vec2f(FAR, -1.0);
  for (var k = -1; k <= 1; k++) {
    let i = clamp(center + k, 0, n - 1);
    let h = cellHeight(i);
    let q = p - vec3f(cellX(f32(i)), h * 0.5, 0.0);
    let d = sdBox(q, vec3f(scene.geo.y * 0.5, h * 0.5, scene.geo.z * 0.5));
    if (d < best.x) { best = vec2f(d, f32(i)); }
  }
  return best;
}

fn map(p: vec3f) -> vec2f {
  let bars = mapBars(p);
  let floorD = p.y;
  if (floorD < bars.x) { return vec2f(floorD, -2.0); }
  return bars;
}

fn normal(p: vec3f) -> vec3f {
  let e = vec2f(0.002, 0.0);
  return normalize(vec3f(
    map(p + e.xyy).x - map(p - e.xyy).x,
    map(p + e.yxy).x - map(p - e.yxy).x,
    map(p + e.yyx).x - map(p - e.yyx).x,
  ));
}

fn softShadow(ro: vec3f, rd: vec3f) -> f32 {
  var res = 1.0;
  var t = 0.04;
  for (var i = 0; i < 28; i++) {
    let h = mapBars(ro + rd * t).x;
    res = min(res, 10.0 * h / t);
    t += clamp(h, 0.03, 0.5);
    if (res < 0.01 || t > 12.0) { break; }
  }
  return clamp(res, 0.0, 1.0);
}

fn hash(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(12.9898, 78.233))) * 43758.5453);
}

@fragment fn fs_main(@builtin(position) frag: vec4f, @location(0) uv: vec2f) -> @location(0) vec4f {
  let aspect = scene.res.x / max(scene.res.y, 1.0);
  var sp = uv * 2.0 - 1.0;
  sp.y = -sp.y;
  sp.x *= aspect;
  sp -= scene.view.xy;

  let focus = vec3f(0.0, scene.geo.w * 0.32, 0.0);
  let ang = scene.cam.x;
  let el = scene.cam.y;
  let ro = focus + scene.cam.z * vec3f(sin(ang) * cos(el), sin(el), cos(ang) * cos(el));
  let fw = normalize(focus - ro);
  let rt = normalize(cross(fw, vec3f(0.0, 1.0, 0.0)));
  let up = cross(rt, fw);
  let rd = normalize(fw * scene.cam.w + rt * sp.x + up * sp.y);

  var t = 0.0;
  var hit = vec2f(FAR, -3.0);
  for (var i = 0; i < 96; i++) {
    let h = map(ro + rd * t);
    if (h.x < 0.0015 * t) { hit = vec2f(t, h.y); break; }
    t += h.x;
    if (t > FAR) { break; }
  }

  let dark = scene.look.x;
  let light = normalize(vec3f(-0.55, 0.85, 0.45));
  var col = scene.bg.rgb;

  if (hit.y > -3.0) {
    let p = ro + rd * hit.x;
    let n = normal(p);
    let sh = softShadow(p + n * 0.01, light);
    let diff = max(dot(n, light), 0.0);
    // fog relative to the camera distance, so a wide shot and a close one read the same
    let fd = max(hit.x - scene.cam.z * 0.75, 0.0) / scene.cam.z;
    let fog = 1.0 - exp(-fd * fd * 4.0);

    if (hit.y < -1.5) {
      // the floor: the ground colour, darkened under the columns' shadows
      let ao = clamp(mapBars(p + vec3f(0.0, 0.25, 0.0)).x * 2.2, 0.0, 1.0);
      let shade = mix(0.55, 1.0, sh) * mix(0.75, 1.0, ao);
      col = scene.bg.rgb * mix(0.72, 1.0, shade);
      col = mix(col, scene.bg.rgb, fog);
    } else {
      let c = scene.cells[i32(hit.y)];
      var base = mix(scene.bar.rgb, scene.dim.rgb, c.y);
      base = mix(base, scene.mid.rgb, c.z);
      base = mix(base, scene.found.rgb, c.w);
      let glowing = max(c.z, c.w);
      let topFace = smoothstep(0.6, 0.95, n.y);
      // a key light from the upper left, a cool fill from the front, the top faces catching the most
      let key = diff * mix(0.35, 1.0, sh);
      let fill = max(dot(n, normalize(vec3f(0.6, 0.2, 0.8))), 0.0) * 0.25;
      let lit = 0.42 + 0.7 * key + fill + topFace * 0.35;
      col = base * mix(lit, 1.15, glowing * 0.6);
      // the glowing columns light the floor and their neighbours a little
      let rim = pow(1.0 - max(dot(n, -rd), 0.0), 3.0) * 0.22 * (1.0 - c.y);
      col += vec3f(rim) * select(0.3, 1.0, dark > 0.5);
      col = mix(col, scene.bg.rgb, fog);
    }
  }

  // vignette toward the ground colour, and a whisper of grain
  let v = smoothstep(1.35, 0.35, length(sp / vec2f(aspect, 1.0) * vec2f(0.8, 1.1)));
  col = mix(scene.bg.rgb, col, mix(1.0, v, scene.look.z));
  col += (hash(floor(frag.xy) + fract(scene.time) * 61.0) - 0.5) * select(0.008, 0.016, dark > 0.5);
  col = mix(scene.bg.rgb, col, scene.look.y);
  return vec4f(col, 1.0);
}
