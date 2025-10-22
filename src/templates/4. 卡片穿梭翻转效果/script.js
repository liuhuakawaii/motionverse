/**
 * 主要功能：实现页面滚动时的动画效果
 * 核心依赖：
 * - GSAP (GreenSock Animation Platform)：用于处理动画
 * - ScrollTrigger 插件：处理滚动触发
 * - Lenis：实现平滑滚动
 */
document.addEventListener("DOMContentLoaded", () => {
    // 注册 ScrollTrigger 插件 - 必须在使用前注册，否则会报错
    gsap.registerPlugin(ScrollTrigger);

    // 初始化 Lenis 平滑滚动
    // 注意：如果不使用 Lenis，原生滚动可能会显得生硬且在不同浏览器下表现不一致
    const lenis = new Lenis();

    // 将 Lenis 的滚动事件与 ScrollTrigger 同步
    // 确保动画能够跟随平滑滚动正确触发
    lenis.on("scroll", ScrollTrigger.update);

    // 将 Lenis 的 requestAnimationFrame 与 GSAP 的 ticker 系统集成
    // time 参数单位为秒，需要转换为毫秒
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    // 禁用 GSAP 的延迟平滑，避免与 Lenis 的平滑效果冲突
    gsap.ticker.lagSmoothing(0);

    /**
     * smoothStep 函数：实现平滑的缓动效果
     * @param {number} p - 进度值 (0-1)
     * @returns {number} - 平滑后的进度值 (0-1)
     * 
     * 使用三次多项式实现更自然的动画过渡
     * 相比线性动画，这个函数在开始和结束时更平滑
     * 如果使用线性动画，动画会显得机械和生硬
     */
    const smoothStep = (p) => p * p * (3 - 2 * p);

    /**
     * Hero 区域的滚动动画
     * 实现卡片随滚动渐隐并向下扩散的效果
     */
    ScrollTrigger.create({
        // 触发元素：当 .hero 进入视口时开始动画
        trigger: ".hero",
        // 动画开始点：当 .hero 的顶部到达视口顶部
        start: "top top",
        // 动画结束点：当 .hero 滚动了75%距离
        end: "75% top",
        // scrub: 1 表示动画会跟随滚动，数值表示平滑程度（越大越平滑，但也越滞后）
        scrub: 1,
        onUpdate: (self) => {
            const progress = self.progress;

            // 计算卡片容器的透明度，从1渐变到0.5
            // gsap.utils.interpolate 用于在两个值之间进行插值
            // 使用 smoothStep 使过渡更平滑
            const heroCardContainerOpacity = gsap.utils.interpolate(
                1,  // 起始透明度
                0.5,  // 结束透明度
                smoothStep(progress)  // 使用平滑过渡的进度值
            );
            // 应用透明度到卡片容器
            gsap.set(".hero-cards", { opacity: heroCardContainerOpacity });

            // 为每个卡片设置不同的动画效果
            ["#hero-card-1", "#hero-card-2", "#hero-card-3"].forEach(
                (cardId, index) => {
                    // 设置延迟，使卡片依次动画
                    // 每个卡片延迟0.9的时间单位，创造瀑布效果
                    const delay = index * 0.9;

                    // 计算每个卡片的独立进度
                    // 通过 clamp 确保进度值在 0-1 之间
                    // 公式说明：
                    // - delay * 0.1 决定动画开始的时间点
                    // - (1 - delay * 0.1) 决定动画的持续时间
                    // 如果不使用这个公式，所有卡片会同时移动，失去层次感
                    const cardProgress = gsap.utils.clamp(
                        0,
                        1,
                        (progress - delay * 0.1) / (1 - delay * 0.1)
                    );

                    // 计算垂直位移：从0%移动到250%
                    const y = gsap.utils.interpolate("0%", "250%", smoothStep(cardProgress));
                    // 计算缩放：从1缩小到0.75
                    const scale = gsap.utils.interpolate(1, 0.75, smoothStep(cardProgress));

                    // 默认水平位移和旋转值
                    let x = "0%";
                    let rotation = 0;

                    // 为左右两侧的卡片设置不同的水平位移和旋转
                    if (index === 0) {  // 左侧卡片
                        // 向右移动90%
                        x = gsap.utils.interpolate("0%", "90%", smoothStep(cardProgress));
                        // 逆时针旋转15度
                        rotation = gsap.utils.interpolate(0, -15, smoothStep(cardProgress));
                    } else if (index === 2) {  // 右侧卡片
                        // 向左移动90%
                        x = gsap.utils.interpolate("0%", "-90%", smoothStep(cardProgress));
                        // 顺时针旋转15度
                        rotation = gsap.utils.interpolate(0, 15, smoothStep(cardProgress));
                    }
                    // 中间卡片保持默认值，不移动不旋转

                    // 应用所有动画属性到卡片
                    // 如果不使用 gsap.set，直接修改 style 属性会导致动画不平滑
                    gsap.set(cardId, { y, scale, x, rotation });
                }
            );
        }
    });
    /**
     * Services 区域的固定效果
     * 将 services 区域固定在视口中，创造视差滚动效果
     */
    ScrollTrigger.create({
        // 触发元素
        trigger: ".services",
        // 开始固定的位置：当 services 顶部到达视口顶部
        start: "top top",
        // 结束位置：向下滚动4个视口高度后
        end: `+=${window.innerHeight * 4}px`,
        // 固定 services 区域
        pin: ".services",
        // 保持原有的空间，避免内容重叠
        // 如果设为 false，会导致后续内容上移，可能产生不期望的重叠效果
        pinSpacing: true,
    });

    /**
     * Services 区域的位置处理
     * 处理离开固定区域时的位置计算，确保平滑过渡
     */
    ScrollTrigger.create({
        trigger: ".services",
        start: "top top",
        end: `+=${window.innerHeight * 4}px`,
        // 当完全离开固定区域时触发
        onLeave: () => {
            // 获取 services 元素
            const servicesSection = document.querySelector(".services");
            // 获取元素的位置信息
            const servicesRect = servicesSection.getBoundingClientRect();
            // 计算绝对位置（相对于页面顶部的距离）
            // 需要加上页面滚动距离，因为 getBoundingClientRect 返回的是相对于视口的位置
            const servicesTop = servicesRect.top + window.pageYOffset;

            // 设置卡片为绝对定位，固定在离开时的位置
            // 这样可以避免卡片在离开固定区域时突然跳动
            gsap.set(".cards", {
                position: "absolute",  // 改为绝对定位
                top: servicesTop,      // 使用计算出的顶部位置
                left: 0,
                width: "100vw",        // 保持全屏宽度
                height: "100vh",       // 保持全屏高度
            });
        },
        // 当重新进入固定区域时触发
        onEnterBack: () => {
            // 重新设置为固定定位，使卡片固定在视口中
            gsap.set(".cards", {
                position: "fixed",  // 改回固定定位
                top: 0,            // 固定在视口顶部
                left: 0,
                width: "100vw",
                height: "100vh",
            });
        }
    });

    /**
     * Services 区域的卡片动画
     * 实现卡片的入场和翻转效果
     */
    ScrollTrigger.create({
        trigger: ".services",
        // 开始点：services 区域的顶部到达视口底部时
        start: "top bottom",
        // 结束点：向下滚动4个视口高度
        end: `+=${window.innerHeight * 4}px`,
        // 启用滚动跟随，平滑度为1
        scrub: 1,
        onUpdate: (self) => {
            const progress = self.progress;

            // 处理标题的动画
            // 标题动画在总进度的90%内完成
            const headerProgress = gsap.utils.clamp(0, 1, progress * 0.9);
            // 标题从下方400%位置移动到原位
            const headerY = gsap.utils.interpolate("400%", "0%", smoothStep(headerProgress));
            gsap.set(".services-header", { y: headerY });

            // 处理每个服务卡片的动画
            ["#card-1", "#card-2", "#card-3"].forEach((cardId, index) => {
                // 设置卡片动画延迟，创造交错效果
                const delay = index * 0.5;
                // 计算每个卡片的独立进度
                const cardProgress = gsap.utils.clamp(
                    0,
                    1,
                    (progress - delay * 0.1) / (0.9 - delay * 0.1)
                );
                // 获取卡片内部元素（用于翻转动画）
                const innerCard = document.querySelector(`${cardId} .flip-card-inner`);

                // 处理垂直位移动画
                // 分三个阶段：
                // 1. 0-40%：从-100%移动到50%
                // 2. 40-60%：从50%移动到0%
                // 3. 60-100%：保持在0%
                let y;
                if (cardProgress < 0.4) {
                    const normalizedProgress = cardProgress / 0.4;
                    y = gsap.utils.interpolate("-100%", "50%",
                        smoothStep(normalizedProgress));
                } else if (cardProgress < 0.6) {
                    const normalizedProgress = (cardProgress - 0.4) / 0.2;
                    y = gsap.utils.interpolate("50%", "0%", smoothStep(normalizedProgress));
                } else {
                    y = "0%";
                }

                // 处理缩放动画
                // 分三个阶段：
                // 1. 0-40%：从0.25缩放到0.75
                // 2. 40-60%：从0.75缩放到1
                // 3. 60-100%：保持在1
                let scale;
                if (cardProgress < 0.4) {
                    const normalizedProgress = cardProgress / 0.4;
                    scale = gsap.utils.interpolate(0.25, 0.75, smoothStep(normalizedProgress));
                } else if (cardProgress < 0.6) {
                    const normalizedProgress = (cardProgress - 0.4) / 0.2;
                    scale = gsap.utils.interpolate(0.75, 1, smoothStep(normalizedProgress));
                } else {
                    scale = 1;
                }

                // 处理透明度动画
                // 在前20%进度内完成淡入
                let opacity;
                if (cardProgress < 0.2) {
                    const normalizedProgress = cardProgress / 0.2;
                    opacity = smoothStep(normalizedProgress);
                } else {
                    opacity = 1;
                }

                // 处理水平位移、旋转和翻转动画
                let x, rotate, rotateY;
                if (cardProgress < 0.6) {
                    // 初始状态：左右卡片分别在两侧，中间卡片居中
                    x = index === 0 ? "100%" : index === 1 ? "0%" : "-100%";
                    rotate = index === 0 ? -5 : index === 1 ? 0 : 5;
                    rotateY = 0;
                } else if (cardProgress < 1) {
                    // 过渡状态：所有卡片向中间聚拢，同时开始翻转
                    const normalizedProgress = (cardProgress - 0.6) / 0.4;
                    x = gsap.utils.interpolate(
                        index === 0 ? "100%" : index === 1 ? "0%" : "-100%",
                        "0%",
                        smoothStep(normalizedProgress)
                    );
                    rotate = gsap.utils.interpolate(
                        index === 0 ? -5 : index === 1 ? 0 : 5,
                        0,
                        smoothStep(normalizedProgress)
                    );
                    // 执行Y轴翻转，从0度到180度
                    rotateY = smoothStep(normalizedProgress) * 180;
                } else {
                    // 最终状态：所有卡片居中且完全翻转
                    x = "0%";
                    rotate = 0;
                    rotateY = 180;
                }

                // 应用所有动画属性到卡片本身
                gsap.set(cardId, {
                    y,
                    x,
                    scale,
                    rotate,
                    opacity,
                });
                // 应用翻转动画到卡片内部元素
                gsap.set(innerCard, { rotationY: rotateY });
            });
        }
    });
});
