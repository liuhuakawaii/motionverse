// 1. 初始化设置
document.addEventListener("DOMContentLoaded", () => {
    // 注册ScrollTrigger插件
    gsap.registerPlugin(ScrollTrigger);

    // 初始化平滑滚动
    // Lenis提供更流畅的滚动体验,如果不使用会导致滚动不平滑
    const lenis = new Lenis();

    // 确保ScrollTrigger能够正确追踪平滑滚动
    // 如果不同步,会导致动画触发时机不准确
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    // 禁用GSAP的延迟平滑,避免与Lenis冲突
    gsap.ticker.lagSmoothing(0);

    // 获取需要操作的DOM元素
    const nav = document.querySelector("nav");
    const header = document.querySelector(".header");
    const heroImg = document.querySelector(".hero-img");
    const canvas = document.querySelector("canvas");
    const context = canvas.getContext("2d");

    // 2. Canvas设置
    const setCanvasSize = () => {
        // 处理高DPI屏幕,确保图片清晰度
        // 如果不处理pixelRatio,在高分屏上会显示模糊
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * pixelRatio;
        canvas.height = window.innerHeight * pixelRatio;

        // 设置画布CSS尺寸
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";

        // 缩放绘图上下文以匹配设备像素比
        context.scale(pixelRatio, pixelRatio);
    }
    setCanvasSize();
    // 3. 图片序列加载
    const frameCount = 198;  // 总帧数
    const currentFrame = (index) => `./frames/Image${index + 1}.jpg`;

    let images = [];  // 存储所有图片对象
    let videoFrames = { frame: 0 };  // 当前显示的帧索引
    let imagesToLoad = frameCount;   // 待加载图片计数

    // 图片加载完成处理
    const onLoad = () => {
        imagesToLoad--;

        // 所有图片加载完成后初始化渲染和滚动触发
        // 这个检查很重要,如果不等所有图片加载完就开始动画,会出现闪烁或空白
        if (!imagesToLoad) {
            render();
            setupScrollTrigger();
        }
    };

    // 预加载所有图片
    // 使用循环预加载而不是按需加载,是为了确保滚动时动画流畅
    // 如果按需加载,可能会出现卡顿
    for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        img.onload = onLoad;
        // 处理图片加载错误,避免加载失败导致动画无法开始
        img.onerror = function () {
            onLoad.call(this)
        };
        img.src = currentFrame(i);
        images.push(img);
    }

    // 4. 渲染函数
    const render = () => {
        const canvasWidth = window.innerWidth;
        const canvasHeight = window.innerHeight;

        // 清除画布
        context.clearRect(0, 0, canvasWidth, canvasHeight);

        const img = images[videoFrames.frame];
        // 确保图片已加载且有效
        if (img && img.complete && img.naturalWidth > 0) {
            // 计算图片与画布的宽高比
            const imageAspect = img.naturalWidth / img.naturalHeight;
            const canvasAspect = canvasWidth / canvasHeight;

            // 实现cover效果的关键逻辑
            // 如果不处理宽高比,图片会变形或留白
            let drawWidth, drawHeight, drawX, drawY;

            if (imageAspect > canvasAspect) {
                // 图片较宽,以高度为准
                drawHeight = canvasHeight;
                drawWidth = drawHeight * imageAspect;
                drawX = (canvasWidth - drawWidth) / 2
                drawY = 0;
            } else {
                // 图片较高,以宽度为准
                drawWidth = canvasWidth;
                drawHeight = drawWidth / imageAspect;
                drawX = 0;
                drawY = (canvasHeight - drawHeight) / 2;
            }

            // 绘制图片,保持比例并居中
            context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        }
    };

    // 5. 滚动触发设置
    const setupScrollTrigger = () => {
        ScrollTrigger.create({
            trigger: ".hero",  // 触发元素
            start: "top top", // 触发起点
            end: `+=${window.innerHeight * 7}px`, // 触发终点(7屏高度)
            pin: true,        // 固定触发元素
            pinSpacing: true, // 保持固定元素的空间
            scrub: 1,         // 平滑滚动效果,1表示延迟程度

            // 滚动更新处理
            onUpdate: (self) => {
                const progress = self.progress; // 0-1之间的进度值

                // 1. 处理序列帧动画
                // 将总进度压缩到0.9,为最后的hero图片留出空间
                const animationProgress = Math.min(progress / 0.9, 1);
                const targetFrame = Math.round(animationProgress * (frameCount - 1));
                videoFrames.frame = targetFrame;
                render();

                // 2. 导航栏渐隐效果 (0-10%滚动)
                if (progress <= 0.1) {
                    const navProgress = progress / 0.1;
                    const opacity = 1 - navProgress;
                    gsap.set(nav, { opacity });
                } else {
                    gsap.set(nav, { opacity: 0 });
                }

                // 3. 标题3D效果 (0-25%滚动)
                if (progress <= 0.25) {
                    const zProgress = progress / 0.25;
                    const translateZ = zProgress * -500; // 向后移动最多500px

                    // 在20-25%滚动范围内渐隐
                    let opacity = 1;
                    if (progress >= 0.2) {
                        const fadeProgress = Math.min((progress - 0.2) / (0.25 - 0.2), 1);
                        opacity = 1 - fadeProgress;
                    }

                    gsap.set(header, {
                        transform: `translate(-50%, -50%) translateZ(${translateZ}px)`,
                        opacity,
                    })
                } else {
                    gsap.set(header, { opacity: 0 });
                }

                // 4. Hero图片3D效果 (60-90%滚动)
                if (progress < 0.6) {
                    // 初始状态:在远处且透明
                    gsap.set(heroImg, {
                        transform: "translateZ(1000px)",
                        opacity: 0,
                    });
                } else if (progress >= 0.6 && progress <= 0.9) {
                    // 过渡状态:逐渐移近且显现
                    const imgProgress = (progress - 0.6) / 0.3;
                    const translateZ = 1000 - imgProgress * 1000;

                    // 60-80%滚动范围内渐现
                    let opacity = 0;
                    if (progress <= 0.8) {
                        const opacityProgress = (progress - 0.6) / 0.2;
                        opacity = opacityProgress;
                    } else {
                        opacity = 1;
                    }

                    gsap.set(heroImg, {
                        transform: `translateZ(${translateZ}px)`,
                        opacity,
                    })
                } else {
                    // 最终状态:完全显示
                    gsap.set(heroImg, {
                        transform: "translateZ(0px)",
                        opacity: 1,
                    })
                }
            },
        });
    };

    // 6. 窗口调整处理
    // 确保响应式效果
    window.addEventListener("resize", () => {
        setCanvasSize();
        render();
        ScrollTrigger.refresh(); // 重新计算滚动触发点
    })
});