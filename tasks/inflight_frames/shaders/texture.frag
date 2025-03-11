#version 430
#extension GL_GOOGLE_include_directive : require
#include "cpp_glsl_compat.h"

layout(location = 0) out vec4 out_fragColor;

void main()
{
  out_fragColor = vec4(0, 0.8, 0, 1);
}
