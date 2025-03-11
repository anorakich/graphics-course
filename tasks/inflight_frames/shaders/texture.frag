#version 430
#extension GL_GOOGLE_include_directive : require
#include "cpp_glsl_compat.h"

layout(location = 0) out vec4 out_fragColor;

vec3 createNoisePattern(vec2 uv) {
    vec2 pos = fract(uv * 10.0);
    vec3 col = vec3(0.0);
    
    float checker = mod(floor(uv.x * 10.0) + floor(uv.y * 10.0), 2.0);
    
    float dist = length(pos - 0.5);
    float circle = smoothstep(0.4, 0.5, dist);
    
    vec3 color1 = vec3(0.8, 0.1, 0.1);
    vec3 color2 = vec3(0.1, 0.1, 0.8);
    
    col = mix(color1, color2, checker);
    col = mix(col, vec3(0.9, 0.7, 0.0), circle);
    
    return col;
}

void main()
{
  out_fragColor = vec4(0, 0.8, 0, 1);
}