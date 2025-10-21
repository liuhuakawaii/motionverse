// 注册ScrollTrigger插件
gsap.registerPlugin(ScrollTrigger);

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
  // 获取所有section
  const sections = document.querySelectorAll('.section');
  const content = document.querySelector('.content');

  // 为每个section创建视差效果
  sections.forEach((section, index) => {
    // 创建视差效果
    gsap.fromTo(section,
      {
        backgroundPositionY: `-${window.innerHeight / 2}px`
      },
      {
        backgroundPositionY: `${window.innerHeight / 2}px`,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: true, // 增加平滑度，减少回弹
          invalidateOnRefresh: true, // 窗口大小改变时重新计算
          fastScrollEnd: true, // 快速滚动结束时优化
        }
      }
    );

    // 为每个section添加淡入淡出效果
    gsap.fromTo(section,
      {
        opacity: index === 0 ? 1 : 0.3
      },
      {
        opacity: 1,
        ease: "power1.inOut", // 使用更平滑的缓动函数
        scrollTrigger: {
          trigger: section,
          start: "top center",
          end: "center center",
          scrub: 1, // 平滑过渡
        }
      }
    );
  });

  // 为文字内容添加动画
  gsap.to(content, {
    yPercent: 30, // 减小移动距离
    opacity: 0,
    ease: "power1.inOut", // 使用更平滑的缓动函数
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "25% top",
      scrub: 1,
    }
  });
});

// 优化滚动性能
const debounce = (fn, delay) => {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

// 使用 debounce 优化滚动事件
document.addEventListener('scroll', debounce(() => {
  // 可以在这里添加额外的滚动优化逻辑
}, 10));
