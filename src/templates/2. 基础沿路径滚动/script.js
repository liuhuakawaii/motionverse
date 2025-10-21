gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// 确保 DOM 加载完成
window.addEventListener('DOMContentLoaded', () => {
  const icon = document.querySelector('.icon');

  // 设置图标初始位置
  gsap.set(".icon", {
    xPercent: -50,
    yPercent: -50,
    transformOrigin: "50% 50%"
  });

  // 创建主时间线
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".content-wrapper",
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: self => {
        // 更新进度
        const progress = Math.round(self.progress * 100);
        document.getElementById('progress').textContent = progress;
        document.querySelector('.progress-bar-fill').style.width = progress + '%';
      }
    }
  });

  // 路径动画
  tl.to(".icon", {
    motionPath: {
      path: "#motionPath",
      align: "#motionPath",
      autoRotate: true, // 自动旋转
      alignOrigin: [0.5, 0.5], // 对齐原点
      useRelative: false // 使用绝对坐标
    },
    ease: "none",
    immediateRender: true
  });

  // 添加缩放动画
  gsap.to(".icon", {
    scale: 1.2,
    duration: 1,
    repeat: -1,
    yoyo: true,
    ease: "power1.inOut"
  });

  // 路径动画时的额外变换
  tl.to(".icon", {
    scale: 0.8,
    duration: 0.3,
    ease: "power1.inOut"
  }, 0.2);

  tl.to(".icon", {
    scale: 1.2,
    duration: 0.3,
    ease: "power1.inOut"
  }, 0.5);

  // 优化性能
  gsap.set([".icon", ".path-container"], {
    willChange: "transform"
  });
});