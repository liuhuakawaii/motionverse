#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

// 自定义 tanh 函数（因为 GLSL ES 没有内置的 tanh）
float tanh(float x) {
    float e2x = exp(2.0 * x);
    return (e2x - 1.0) / (e2x + 1.0);
}

// 距离场函数
float map(vec3 p) {
    // 域重复
    p = abs(fract(p) - 0.5);
    // 圆柱体 + 平面的 SDF
    return abs(min(length(p.xy) - 0.175, min(p.x, p.y) + 1e-3)) + 1e-3;
}

// 估算法线
vec3 estimateNormal(vec3 p) {
    float eps = 0.001;
    return normalize(vec3(
        map(p + vec3(eps, 0.0, 0.0)) - map(p - vec3(eps, 0.0, 0.0)),
        map(p + vec3(0.0, eps, 0.0)) - map(p - vec3(0.0, eps, 0.0)),
        map(p + vec3(0.0, 0.0, eps)) - map(p - vec3(0.0, 0.0, eps))
    ));
}

void main() {
    // 将像素坐标转换为标准化坐标
    vec2 r = u_resolution.xy;
    vec2 uv = (gl_FragCoord.xy - 0.5 * r) / r.y;
    
    float t = u_time;
    float z = fract(dot(gl_FragCoord.xy, sin(gl_FragCoord.xy))) - 0.5;
    vec4 col = vec4(0.0);
    vec4 p;
    
    // 光线步进
    for(float i = 0.0; i < 77.0; i++) {
        // 光线方向
        p = vec4(z * normalize(vec3(gl_FragCoord.xy - 0.7 * r, r.y)), 0.1 * t);
        p.z += t;
        
        vec4 q = p;
        
        // 应用"故障"旋转矩阵以产生故障分形失真
        p.xy *= mat2(cos(2.0 + q.z + vec4(0.0, 11.0, 33.0, 0.0)));
        p.xy *= mat2(cos(q + vec4(0.0, 11.0, 33.0, 0.0)));
        
        // 距离估算
        float d = map(p.xyz);
        
        // 估算光照
        vec3 pos = p.xyz;
        vec3 lightDir = normalize(vec3(0.3, 0.5, 1.0));
        vec3 viewDir = normalize(vec3(uv, 1.0));
        vec3 n = estimateNormal(pos);
        vec3 reflectDir = reflect(viewDir, n);
        
        // 模拟环境反射（天蓝色 + 渐变到白色）
        vec3 envColor = mix(vec3(0.8, 0.4, 0.8), vec3(1.0), 0.5 + 0.5 * reflectDir.y);
        
        // 镜面高光
        float spec = pow(max(dot(reflectDir, lightDir), 0.0), 32.0);
        
        // 基于原始方法的彩色调色板
        vec4 baseColor = (1.0 + sin(0.5 * q.z + length(p.xyz - q.xyz) + vec4(0.0, 4.0, 3.0, 6.0)))
            / (0.5 + 2.0 * dot(q.xy, q.xy));
        
        // 组合基础颜色 + 环境反射 + 镜面高光
        vec3 finalColor = baseColor.rgb * 0.1 + envColor * 0.9 + vec3(spec) * 1.2;
        
        // 亮度加权累积
        col.rgb += finalColor / d;
        
        z += 0.6 * d;
    }
    
    // 压缩亮度范围并输出
    vec3 final = vec3(
        tanh(col.r / 2e4),
        tanh(col.g / 2e4),
        tanh(col.b / 2e4)
    );
    gl_FragColor = vec4(final, 1.0);
}