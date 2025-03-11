#version 430
#extension GL_GOOGLE_include_directive : require
#include "cpp_glsl_compat.h"

layout(push_constant) uniform PushConstants {
  float time;
} pushConstants;

void main(void)
{
  vec4 position = vec4(-1.0 + 4.0 * float(gl_VertexIndex == 1), 
                        -1.0 + 4.0 * float(gl_VertexIndex == 2), 
                        0.0, 
                        1.0);
  
  if (gl_VertexIndex == 0) {
    position.x += sin(pushConstants.time * 0.3) * 0.05;
    position.y += cos(pushConstants.time * 0.4) * 0.05;
  } else if (gl_VertexIndex == 1) {
    position.x += sin(pushConstants.time * 0.5 + 1.0) * 0.05;
    position.y += cos(pushConstants.time * 0.6 + 2.0) * 0.05;
  } else if (gl_VertexIndex == 2) {
    position.x += sin(pushConstants.time * 0.7 + 3.0) * 0.05;
    position.y += cos(pushConstants.time * 0.8 + 4.0) * 0.05;
  }
  
  gl_Position = position;
}