#version 430
#extension GL_GOOGLE_include_directive : require
#include "cpp_glsl_compat.h"

layout(location = 0) out vec4 out_fragColor;

layout(binding = 0) uniform sampler2D shader_image; 
layout(binding = 1) uniform sampler2D texture_image;

layout(push_constant) uniform Params {
  vec2 resolution;
  vec2 mouse_pos;
  float time;
} params;

const vec3 cameraPos      = vec3(0.0, 0.0, 3.0);
const vec3 lightPos       = vec3(0.0, 3.0, 5.0);
const int  MAX_STEPS      = 70;
const float SURFACE_EPS   = 0.01;
const float MAX_DISTANCE  = 10.0;

float smoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}

float smoothSubtraction(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5 * (d2 + d1) / k, 0.0, 1.0);
    return mix(d2, -d1, h) + k * h * (1.0 - h);
}

float smoothIntersection(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) + k * h * (1.0 - h);
}

mat3 rotateX(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
        vec3(1.0, 0.0, 0.0),
        vec3(0.0, c, -s),
        vec3(0.0, s, c)
    );
}

mat3 rotateY(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
        vec3(c, 0.0, s),
        vec3(0.0, 1.0, 0.0),
        vec3(-s, 0.0, c)
    );
}

float dCylinder(vec3 p, float radius, float height) {
    return max(length(p.xz) - radius, abs(p.y) - height);
}

float dSphere(vec3 p, in vec3 center, float radius) {
    return length(p - center) - radius;
}

float sceneSDF(in vec3 worldPos, in mat3 rotationMatrix) {
    vec3 localPos = worldPos * rotationMatrix;
    localPos *= 0.95;
    
    float dynamicLen   = 0.5 * abs(sin(params.time));
    float cylinderDist = dCylinder(localPos, 0.1 + 0.75 * dynamicLen, 0.7 + dynamicLen);
    
    float noise         = 0.025 * sin(20.0 * localPos.z + 20.0 * localPos.y - 20.0 * localPos.x + params.time * 20.0);
    float sphereLeft    = dSphere(localPos, vec3(0.0, -0.7 - dynamicLen, 0.0), 0.4 + dynamicLen) + noise;
    float sphereRight   = dSphere(localPos, vec3(0.0,  0.7 + dynamicLen, 0.0), 0.4 + dynamicLen) + noise;
    
    return smoothUnion(sphereRight, smoothUnion(cylinderDist, sphereLeft, 0.1), 0.1);
}

vec3 rayTrace(in vec3 origin, in vec3 rayDir, out bool hit, in mat3 rotationMatrix) {
    vec3 pos = origin;
    float totalDist = 0.0;
    
    hit = false;
    for (int i = 0; i < MAX_STEPS; i++) {
        float dist = sceneSDF(pos, rotationMatrix);
        if (dist < SURFACE_EPS) {
            hit = true;
            break;
        }
        totalDist += dist;
        if(totalDist > MAX_DISTANCE)
            break;
        pos += rayDir * dist;
    }
    return pos;
}

vec3 calculateNormal(vec3 pos, float delta, in mat3 rotationMatrix) {
    float e = max(delta * 0.5, SURFACE_EPS);
    float dx1 = sceneSDF(pos + vec3(e, 0.0, 0.0), rotationMatrix);
    float dx2 = sceneSDF(pos - vec3(e, 0.0, 0.0), rotationMatrix);
    float dy1 = sceneSDF(pos + vec3(0.0, e, 0.0), rotationMatrix);
    float dy2 = sceneSDF(pos - vec3(0.0, e, 0.0), rotationMatrix);
    float dz1 = sceneSDF(pos + vec3(0.0, 0.0, e), rotationMatrix);
    float dz2 = sceneSDF(pos - vec3(0.0, 0.0, e), rotationMatrix);
    
    return normalize(vec3(dx1 - dx2, dy1 - dy2, dz1 - dz2));
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec3 mousePos = vec3(params.mouse_pos / params.resolution - 0.5, 0.0);
    mat3 rotationMatrix = rotateX(6.0 * mousePos.y) * rotateY(6.0 * mousePos.x);
    
    vec2 scale = 9.0 * params.resolution / max(params.resolution.x, params.resolution.y);
    vec2 uv = scale * (fragCoord / params.resolution - vec2(0.5));
    
    vec3 rayDir = normalize(vec3(uv, 0.0) - cameraPos);
    
    // Используем shader_image как скайбокс
    vec3 bgColor = texture(shader_image, (rayDir * rotationMatrix).xy * 0.5 + 0.5).rgb;
    vec3 outColor = bgColor;
    
    bool hit;
    vec3 hitPos = rayTrace(cameraPos, rayDir, hit, rotationMatrix);
    if (hit) {
        vec3 lightDir = normalize(lightPos - hitPos);
        lightDir = rotationMatrix * lightDir;
        
        vec3 viewDir = normalize(cameraPos - hitPos);
        vec3 normal  = calculateNormal(hitPos, 0.001, rotationMatrix);
        
        bool shadowHit;
        vec3 shadowPos = rayTrace(hitPos + normal * 0.01, -lightDir, shadowHit, rotationMatrix);
        
        float diffuse  = max(dot(normal, lightDir), 0.0);
        vec3 halfVec   = normalize(lightDir + viewDir);
        float specular = pow(max(dot(halfVec, normal), 0.0), 250.0);
        vec3 lightCalc = vec3(0.3) + vec3(diffuse) + vec3(specular);
        if (shadowHit) {
            lightCalc += vec3(diffuse) + specular;
        }
        
        vec3 localPos = hitPos * rotationMatrix;
        vec3 absLocal = abs(localPos);
        float sum = absLocal.x + absLocal.y + absLocal.z;
        vec3 blendWeights = absLocal / sum;
        
        // Используем texture_image для трипланарного текстурирования
        vec3 objectColor = blendWeights.x * texture(texture_image, localPos.yz).rgb +
                           blendWeights.y * texture(texture_image, localPos.xz).rgb +
                           blendWeights.z * texture(texture_image, localPos.xy).rgb;
        
        outColor = objectColor * lightCalc;
    }
    outColor = pow(outColor, vec3(1.0 / 2.2));
    
    out_fragColor = vec4(outColor, 1.0);
}
