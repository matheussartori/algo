// Separable 9-tap gaussian.
@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var samp: sampler;
struct Blur { texel: vec2f, dir: vec2f, radius: f32 }
@group(0) @binding(2) var<uniform> blur: Blur;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let w = array<f32, 5>(0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
  let st = blur.texel * blur.dir * blur.radius;
  var c = textureSampleLevel(src, samp, uv, 0.0).rgb * w[0];
  for (var i = 1; i < 5; i++) {
    let o = st * f32(i);
    c += textureSampleLevel(src, samp, uv + o, 0.0).rgb * w[i];
    c += textureSampleLevel(src, samp, uv - o, 0.0).rgb * w[i];
  }
  return vec4f(c, 1.0);
}
