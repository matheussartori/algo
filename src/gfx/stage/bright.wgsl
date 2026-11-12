// Bloom bright-pass with a soft knee.
@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var samp: sampler;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let c = textureSampleLevel(src, samp, uv, 0.0).rgb;
  let l = dot(c, vec3f(0.2126, 0.7152, 0.0722));
  let knee = 0.4;
  let th = 0.9;
  let soft = clamp((l - th + knee) / (2.0 * knee), 0.0, 1.0);
  let w = max(soft * soft * knee, l - th) / max(l, 1e-4);
  return vec4f(c * w, 1.0);
}
