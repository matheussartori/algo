// The light on the night: scene + bloom, split into its channels when the page moves fast or
// a scene changes (chromatic aberration and a short line glitch), faint scanlines, grain, vignette.
@group(0) @binding(0) var light: texture_2d<f32>;
@group(0) @binding(1) var bloom: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;
struct Post {
  bg: vec4f,
  res: vec2f,
  time: f32,
  // a scene change in progress, 0..1 (peaks mid-way)
  glitch: f32,
  // chromatic split from scroll speed
  aberr: f32,
  fadeIn: f32,
  // how much of the light shows (sections with reading text dim it)
  gain: f32,
  unused: f32,
}
@group(0) @binding(3) var<uniform> post: Post;

fn hash(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(12.9898, 78.233))) * 43758.5453);
}

fn sampleSplit(uv: vec2f, off: vec2f) -> vec3f {
  let r = textureSampleLevel(light, samp, uv + off, 0.0).r + textureSampleLevel(bloom, samp, uv + off, 0.0).r;
  let g = textureSampleLevel(light, samp, uv, 0.0).g + textureSampleLevel(bloom, samp, uv, 0.0).g;
  let b = textureSampleLevel(light, samp, uv - off, 0.0).b + textureSampleLevel(bloom, samp, uv - off, 0.0).b;
  return vec3f(r, g, b);
}

@fragment fn fs_main(@builtin(position) frag: vec4f, @location(0) uv: vec2f) -> @location(0) vec4f {
  let g = post.glitch;
  // a few horizontal bands slip sideways while a scene changes
  let band = floor(uv.y * 54.0);
  let hb = hash(vec2f(band, floor(post.time * 20.0)));
  let slip = select(0.0, (hash(vec2f(band, 7.0)) - 0.5) * 0.025 * g, hb > 1.0 - g * 0.2);
  let u = vec2f(uv.x + slip, uv.y);

  let fromCentre = u - 0.5;
  let split = fromCentre * (post.aberr + g * 0.005) + vec2f(slip * 0.4, 0.0);
  var l = sampleSplit(u, split) * post.gain * post.fadeIn;
  // filmic shoulder: dense light glows instead of clipping
  l = l / (1.0 + l * 0.55);

  var c = post.bg.rgb + l;
  // scanlines, stronger during a change
  let scan = 0.5 + 0.5 * sin(frag.y * 3.14159 * 0.5);
  c *= 1.0 - (0.02 + g * 0.04) * scan;
  // vignette and grain
  let v = smoothstep(1.25, 0.3, length(fromCentre * vec2f(1.2, 1.6)));
  c = mix(post.bg.rgb * 0.75, c, mix(0.55, 1.0, v));
  c += (hash(floor(frag.xy) + fract(post.time) * 61.0) - 0.5) * 0.02;
  return vec4f(c, 1.0);
}
