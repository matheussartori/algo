// The previous frame, dimmed: what is left of it becomes the trail.
@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var samp: sampler;
struct Fade { decay: f32, drift: f32 }
@group(0) @binding(2) var<uniform> fade: Fade;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  // scrolling the page drags the old light with it, so trails stay attached to their section
  let c = textureSampleLevel(src, samp, uv + vec2f(0.0, fade.drift), 0.0).rgb;
  return vec4f(c * fade.decay, 1.0);
}
