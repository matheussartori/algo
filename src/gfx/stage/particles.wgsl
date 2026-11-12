// Each particle drawn as a short streak along its velocity, added into the trail buffer.
// Soft across and along, so the light has no hard pixel edge at any size.
struct Particle {
  pos: vec2f,
  vel: vec2f,
  seed: f32,
  heat: f32,
  tint: f32,
  vis: f32,
}

struct Look {
  neon: vec4f,
  accent: vec4f,
  found: vec4f,
  aspect: f32,
  px: f32,     // pixels per screen height
  gain: f32,
  still: f32,
}

@group(0) @binding(0) var<uniform> look: Look;
@group(0) @binding(1) var<storage, read> ps: array<Particle>;

struct Out {
  @builtin(position) pos: vec4f,
  @location(0) local: vec2f,
  @location(1) color: vec3f,
}

@vertex fn vs_main(@builtin(vertex_index) v: u32, @builtin(instance_index) n: u32) -> Out {
  var quad = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
    vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0),
  );
  let c = quad[v];
  let p = ps[n];
  let speed = length(p.vel);
  let dir = select(vec2f(0.0, 1.0), p.vel / speed, speed > 1e-4);
  let side = vec2f(-dir.y, dir.x);
  let len = (1.2 + min(speed * look.px * 0.02, 22.0)) * (1.0 - look.still) + look.still * 1.2;
  let wid = 1.1 + p.heat * 0.7 + p.seed * 0.5;
  let px = p.pos * look.px + dir * c.x * len + side * c.y * wid;
  var o: Out;
  o.pos = vec4f(px / (look.px * 0.5) / vec2f(look.aspect, 1.0), 0.0, 1.0);
  o.local = c;
  let hot = clamp(p.tint, 0.0, 1.0);
  let seal = clamp(p.tint - 1.0, 0.0, 1.0);
  var hue = mix(look.neon.rgb, look.accent.rgb * 2.2, hot);
  hue = mix(hue, look.found.rgb * 1.8, seal);
  hue = mix(hue, vec3f(1.0), p.heat * 0.35);
  // a long streak spreads the same light over more pixels
  let alpha = look.gain * (0.4 + 0.6 * p.seed) * (1.0 + 0.5 * p.heat) * p.vis * inverseSqrt(max(len, 1.0));
  o.color = hue * alpha;
  return o;
}

@fragment fn fs_main(@location(0) local: vec2f, @location(1) color: vec3f) -> @location(0) vec4f {
  let across = exp(-local.y * local.y * 3.0) - 0.05;
  let along = 1.0 - smoothstep(0.15, 1.0, abs(local.x));
  return vec4f(color * max(across, 0.0) * along, 1.0);
}
