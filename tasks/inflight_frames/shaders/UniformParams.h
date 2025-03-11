#ifndef UNIFORM_PARAMS_H_INCLUDED
#define UNIFORM_PARAMS_H_INCLUDED

#include "cpp_glsl_compat.h"


struct UniformParams
{
  shader_float iResolution_x;
  shader_float iResolution_y;
  shader_float iMouse_x;
  shader_float iMouse_y;
  shader_float iTime;
};


#endif // UNIFORM_PARAMS_H_INCLUDED 