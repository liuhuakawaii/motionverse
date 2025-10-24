precision highp float;
uniform vec2 u_resolution;
uniform float u_time;

vec2 uvFromFrag(){
  vec2 uv=(gl_FragCoord.xy/u_resolution)*2.-1.;// 将坐标归一化到 [-1,1] 范围
  uv.x*=u_resolution.x/u_resolution.y;// 宽高比校正，防止画面拉伸
  return uv;
}

// 球体的 SDF
float sdSphere(vec3 p,float r){
  return length(p)-r;// 点到球心的距离减去半径
}

// 立方体的 SDF
float sdBox(vec3 p,vec3 b){
  vec3 q=abs(p)-b;
  return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);
}

float sceneSDF(vec3 p){
  // 一个会上下移动的球体
  float s=sdSphere(p-vec3(0.,0.,3.5+sin(u_time)),1.);
  // 一个固定位置的立方体
  float b=sdBox(p-vec3(1.6,0.,3.),vec3(.6));
  return min(s,b);// 使用 min 操作来组合两个物体
}

vec3 calcNormal(vec3 p){
  float e=1e-4;// 很小的偏移量
  // 使用中心差分法计算法线
  return normalize(vec3(
      sceneSDF(p+vec3(e,0,0))-sceneSDF(p-vec3(e,0,0)),
      sceneSDF(p+vec3(0,e,0))-sceneSDF(p-vec3(0,e,0)),
      sceneSDF(p+vec3(0,0,e))-sceneSDF(p-vec3(0,0,e))
    ));
  }
  
  float rayMarch(vec3 ro,vec3 rd){// 光线从相机位置 ro 沿 rd 方向前进，看能否击中物体
    float t=0.;// 从起点开始
    for(int i=0;i<90;i++){// 最多90步
      vec3 p=ro+rd*t;// 当前位置
      float d=sceneSDF(p);// 到最近物体的距离
      if(d<1e-3)return t;// 击中物体
      t+=d;// 安全地前进
      if(t>80.)break;// 超出最大距离
    }
    return-1.;// 未击中任何物体
  }
  
  void main(){
    vec2 uv=uvFromFrag();
    // 相机位置：稍微抬高且往后移，并随时间缓慢移动
    vec3 ro=vec3(sin(u_time*.5)*2.,2.,-0.);
    
    // 相机目标点：看向场景中心稍上方
    vec3 target=vec3(0.,0.,3.);
    vec3 forward=normalize(target-ro);// 相机方向
    vec3 right=normalize(cross(vec3(0.,1.,0.),forward));// 相机右方向
    vec3 up=cross(forward,right);// 相机上方向
    
    // 构建相机射线方向
    float fov=1.;// 视野
    vec3 rd=normalize(forward+right*uv.x*fov+up*uv.y*fov);
    float dist=rayMarch(ro,rd);// 光线步进
    vec3 color=vec3(0.);// 默认黑色背景
    
    if(dist>0.){// 如果击中了物体
      vec3 p=ro+rd*dist;// 击中点
      vec3 n=calcNormal(p);// 法线
      vec3 lightPos=vec3(2.*sin(u_time),4.,2.);// 移动的光源
      vec3 lightDir=normalize(lightPos-p);// 光源方向
      vec3 viewDir=normalize(ro-p);// 视线方向
      vec3 reflectDir=reflect(-lightDir,n);// 反射方向
      
      // 材质属性
      vec3 albedo=vec3(.6,.8,1.);// 基础颜色
      float metallic=.5;// 金属度
      float roughness=.2;// 粗糙度
      
      // 光照计算
      float ambient=.2;// 环境光
      float diff=max(dot(n,lightDir),0.);// 漫反射
      float spec=pow(max(dot(viewDir,reflectDir),0.),32.);// 镜面反射
      
      // 菲涅尔效果
      float fresnel=pow(1.-max(dot(n,viewDir),0.),5.);
      
      // 边缘光
      float rim=pow(1.-max(dot(n,viewDir),0.),3.);
      
      // 组合所有光照效果
      vec3 finalColor=albedo*(
        ambient+// 环境光
        diff*.5+// 漫反射
        spec*(.5+metallic*.5)+// 镜面反射
        fresnel*.3+// 菲涅尔
        rim*vec3(.3,.4,.5)// 边缘光
      );
      
      color=finalColor;
    }
    gl_FragColor=vec4(color,1.);
  }
  