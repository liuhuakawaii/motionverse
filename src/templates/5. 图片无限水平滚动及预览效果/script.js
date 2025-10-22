/**
 * 无限轮播图组件
 * 
 * 主要特性：
 * 1. 无限循环滚动
 * 2. 缓冲预加载
 * 3. 动态DOM管理
 * 4. GSAP动画集成
 */

import products from "./products.js";

// DOM元素选择器
// 注意: 所有选择器必须在HTML中有对应元素，否则组件将无法正常工作
const productsContainer = document.querySelector(".products");
const productName = document.querySelector(".product-name p");
const productPreview = document.querySelector(".product-preview");
const previewName = document.querySelector(".product-preview-name p");
const previewImg = document.querySelector(".product-preview-img img");
const previewTag = document.querySelector(".product-preview-tag p");
const previewUrl = document.querySelector(".product-url .btn a");
const productBanner = document.querySelector(".product-banner");
const bannerImg = document.querySelector(".product-banner img");
const controllerInner = document.querySelector(".controller-inner");
const controllerOuter = document.querySelector(".controller-outer");
const closeIconSpans = document.querySelectorAll(".close-icon span");
const prevBtn = document.querySelector(".nav-btn.prev");
const nextBtn = document.querySelector(".nav-btn.next");

// 状态管理
let currentProductIndex = 0;  // 当前显示的产品索引
let slideItems = [];         // 存储所有轮播项的数组
let isPreviewAnimating = false;  // 预览动画锁，防止动画过程中的重复触发
let isPreviewOpen = false;   // 预览面板的开关状态

// 关键配置参数
const BUFFER_SIZE = 5;       // 预加载缓冲区大小 (前后各5个项目)
// 增大这个值会提高性能但增加内存占用
const spacing = 0.375;      // 项目间距系数
const slideWidth = spacing * 1000;  // 每个滑动项的宽度
// 使用1000作为基准以便于计算

/**
 * 添加新的轮播项到DOM中
 * @param {number} relativeIndex - 相对于当前项的索引位置 (-5到5之间)
 * 
 * 关键实现细节：
 * 1. 使用取模运算确保索引在合法范围内
 * 2. 通过dataset存储相对索引，便于后续查找和更新
 * 3. 使用GSAP设置初始位置和缩放
 * 
 * 注意事项：
 * - 不要直接修改relativeIndex，这会破坏滑动逻辑
 * - 必须配合removeSlideItem使用，否则会导致内存泄漏
 */
function addSlideItem(relativeIndex) {
    // 计算实际产品索引，处理负数和溢出情况
    const productIndex =
        (((currentProductIndex + relativeIndex) % products.length) +
            products.length) %
        products.length;
    const product = products[productIndex];

    const li = document.createElement("li");
    li.innerHTML = `<img src="${product.img}" alt="${product.name}" />`
    li.dataset.relativeIndex = relativeIndex;  // 存储相对索引用于后续查找

    // 设置初始样式和位置
    gsap.set(li, {
        x: relativeIndex * slideWidth,  // 水平位置
        scale: relativeIndex === 0 ? 1.25 : 0.75,  // 当前项放大
        zIndex: relativeIndex === 0 ? 100 : 1,  // 当前项置顶
    });

    productsContainer.appendChild(li);
    slideItems.push({ element: li, relativeIndex: relativeIndex });
}

/**
 * 从DOM中移除指定的轮播项
 * @param {number} relativeIndex - 要移除项的相对索引
 * 
 * 性能优化：
 * - 使用findIndex而不是filter，找到后立即停止搜索
 * - 先从DOM移除，再更新数组，避免不必要的重排
 */
function removeSlideItem(relativeIndex) {
    const itemIndex = slideItems.findIndex(
        (item) => item.relativeIndex === relativeIndex
    );
    if (itemIndex !== -1) {
        const item = slideItems[itemIndex];
        item.element.remove();  // 从DOM中移除
        slideItems.splice(itemIndex, 1);  // 从数组中移除
    }
}

/**
 * 更新所有轮播项的位置和样式
 * 
 * GSAP动画配置说明：
 * - duration: 0.75s 平滑过渡
 * - power3.out: 缓出效果，开始快结束慢
 * - scale: 当前项放大1.25倍，其他项缩小到0.75倍
 * 
 * 注意：不要在动画过程中调用此函数，可能导致动画卡顿
 */
function updateSliderPosition() {
    slideItems.forEach((item) => {
        const isActive = item.relativeIndex === 0;
        gsap.to(item.element, {
            x: item.relativeIndex * slideWidth,
            scale: isActive ? 1.25 : 0.75,
            zIndex: isActive ? 100 : 1,
            duration: 0.75,
            ease: "power3.out",
        });
    });
}

/**
 * 更新产品名称显示
 * 
 * 使用取模运算处理索引，确保：
 * 1. 负数索引正确映射
 * 2. 大于数组长度的索引循环
 */
function updateProductName() {
    const actualIndex =
        ((currentProductIndex % products.length) + products.length) %
        products.length;
    productName.textContent = products[actualIndex].name;
}

/**
 * 更新预览面板的所有内容
 * 
 * 包括：
 * - 产品名称
 * - 预览图片
 * - 标签
 * - 链接URL
 * - Banner图片
 * 
 * 注意：此函数应在打开预览面板前调用，确保内容已更新
 */
function updatePreviewContent() {
    const actualIndex =
        ((currentProductIndex % products.length) + products.length) %
        products.length;

    const currentProduct = products[actualIndex];
    previewName.textContent = currentProduct.name;
    previewImg.src = currentProduct.img;
    previewImg.alt = currentProduct.name;
    previewTag.textContent = currentProduct.tag;
    previewUrl.href = currentProduct.url;
    bannerImg.src = currentProduct.img;
    bannerImg.alt = currentProduct.name;
}

/**
 * 向后滑动到下一个项目
 * 
 * 实现步骤：
 * 1. 增加当前索引
 * 2. 移除最左侧项目（-BUFFER_SIZE位置）
 * 3. 更新所有项目的相对索引
 * 4. 在最右侧添加新项目（BUFFER_SIZE位置）
 * 5. 更新UI和动画
 * 
 * 注意：
 * - 动画或预览面板打开时不允许滑动
 * - 必须同时更新DOM的dataset和内存中的relativeIndex
 */
function moveNext() {
    if (isPreviewAnimating || isPreviewOpen) return;

    currentProductIndex++;
    removeSlideItem(-BUFFER_SIZE);  // 移除最左侧项目
    slideItems.forEach((item) => {
        item.relativeIndex--;  // 所有项目向左移动一位
        item.element.dataset.relativeIndex = item.relativeIndex;
    });
    addSlideItem(BUFFER_SIZE);  // 在最右侧添加新项目
    updateSliderPosition();
    updateProductName();
    updatePreviewContent();
}

/**
 * 向前滑动到上一个项目
 * 实现逻辑与moveNext相反
 */
function movePrev() {
    if (isPreviewAnimating || isPreviewOpen) return;

    currentProductIndex--;
    removeSlideItem(BUFFER_SIZE);  // 移除最右侧项目
    slideItems.forEach((item) => {
        item.relativeIndex++;  // 所有项目向右移动一位
        item.element.dataset.relativeIndex = item.relativeIndex;
    });
    addSlideItem(-BUFFER_SIZE);  // 在最左侧添加新项目
    updateSliderPosition();
    updateProductName();
    updatePreviewContent();
}

/**
 * 更新导航按钮的状态
 * 在动画过程中或预览面板打开时禁用按钮
 */
function updateButtonStates() {
    if (isPreviewAnimating || isPreviewOpen) {
        prevBtn.classList.add("disabled");
        nextBtn.classList.add("disabled");
    } else {
        prevBtn.classList.remove("disabled");
        nextBtn.classList.remove("disabled");
    }
}

/**
 * 获取当前激活的轮播项
 * @returns {Object|undefined} 当前激活的轮播项或undefined
 */
function getActiveSlide() {
    return slideItems.find((item) => item.relativeIndex === 0);
}

/**
 * 动画处理相邻轮播项的显示/隐藏
 * @param {boolean} hide - true表示隐藏，false表示显示
 * 
 * 动画效果：
 * - 相邻项（1和2位置）会向外扩展移动
 * - 中心项会缩小并淡出
 * 
 * 性能优化：
 * - 只动画处理相邻的4个项目（±1和±2位置）
 * - 其他项目不参与动画，避免不必要的性能消耗
 */
function animateSideItems(hide = false) {
    const activeSlide = getActiveSlide();

    // 处理相邻项的动画
    slideItems.forEach((item) => {
        const absIndex = Math.abs(item.relativeIndex);
        if (absIndex === 1 || absIndex === 2) {
            gsap.to(item.element, {
                x: hide
                    ? item.relativeIndex * slideWidth * 1.5  // 向外扩展1.5倍
                    : item.relativeIndex * slideWidth,
                opacity: hide ? 0 : 1,
                duration: 0.75,
                ease: "power3.inOut"
            });
        }
    });

    // 处理当前项的动画
    if (activeSlide) {
        gsap.to(activeSlide.element, {
            scale: hide ? 0.75 : 1.25,
            opacity: hide ? 0 : 1,
            duration: 0.75,
            ease: "power3.inOut"
        });
    }
}

/**
 * 控制器过渡动画
 * @param {boolean} opening - true表示打开预览，false表示关闭预览
 * 
 * 动画序列：
 * 1. 导航元素淡出/入
 * 2. 外圆环缩放
 * 3. 内圆环缩放
 * 4. 关闭图标展开/收起
 * 
 * 关键点：
 * - 使用clipPath实现圆形过渡效果
 * - 通过延迟和错开时间实现连贯的动画序列
 * - 不同元素使用不同的缓动函数增加视觉效果
 */
function animateControllerTransition(opening = false) {
    const navEls = [".controller-label p", ".nav-btn"];

    // 导航元素动画
    gsap.to(navEls, {
        opacity: opening ? 0 : 1,
        duration: 0.2,
        ease: "power3.out",
        delay: opening ? 0 : 0.4,
    });

    // 外圆环动画
    gsap.to(controllerOuter, {
        clipPath: opening ? "circle(0% at 50% 50%)" : "circle(50% at 50% 50%)",
        duration: 0.75,
        ease: "power3.inOut"
    });

    // 内圆环动画
    gsap.to(controllerInner, {
        clipPath: opening ? "circle(50% at 50% 50%)" : "circle(40% at 50% 50%)",
        duration: 0.75,
        ease: "power3.inOut",
    });

    // 关闭图标动画
    gsap.to(closeIconSpans, {
        width: opening ? "20px" : "0px",
        duration: opening ? 0.4 : 0.3,
        ease: opening ? "power3.out" : "power3.in",
        stagger: opening ? 0.1 : 0.05,  // 错开动画时间
        delay: opening ? 0.2 : 0
    });
}

/**
 * 切换预览面板的显示状态
 * 
 * 动画流程：
 * 1. 设置动画锁防止重复触发
 * 2. 更新按钮状态
 * 3. 如果是打开预览，先更新内容
 * 4. 执行预览面板滑动动画
 * 5. 执行banner渐变动画
 * 6. 处理侧边项目动画
 * 7. 处理控制器过渡
 * 8. 动画完成后解锁并更新状态
 * 
 * 性能优化：
 * - 使用动画锁避免动画过程中的重复触发
 * - 合理的动画时序和延迟，确保流畅的视觉效果
 * - 动画完成后及时清理状态
 */
function togglePreview() {
    if (isPreviewAnimating) return;

    isPreviewAnimating = true;
    updateButtonStates();

    // 打开预览前更新内容
    if (!isPreviewOpen) updatePreviewContent();

    // 预览面板滑动动画
    gsap.to(productPreview, {
        y: isPreviewOpen ? "100%" : "-50%",  // 向上滑动到中间位置
        duration: 0.75,
        ease: "power3.inOut",
    });

    // Banner渐变动画
    gsap.to(productBanner, {
        opacity: isPreviewOpen ? 0 : 1,
        duration: 0.4,
        delay: isPreviewOpen ? 0 : 0.25,  // 打开时稍微延迟显示
        ease: "power3.inOut",
    });

    // 处理侧边项目和控制器动画
    animateSideItems(!isPreviewOpen);
    animateControllerTransition(!isPreviewOpen);

    // 主预览面板动画（包含完成回调）
    gsap.to(productPreview, {
        y: isPreviewOpen ? "100%" : "-50%",
        duration: 0.75,
        ease: "power3.inOut",
        onComplete: () => {
            isPreviewAnimating = false;  // 解除动画锁
            isPreviewOpen = !isPreviewOpen;  // 更新状态
            updateButtonStates();  // 更新按钮状态
        }
    });
}

/**
 * 初始化轮播组件
 * 
 * 初始化步骤：
 * 1. 创建初始的轮播项（-5到5位置）
 * 2. 设置初始位置和样式
 * 3. 更新产品名称
 * 4. 准备预览内容
 * 5. 设置按钮状态
 * 
 * 注意：
 * - 必须在DOM加载完成后调用
 * - 确保products数组已加载
 * - 所有必需的DOM元素都存在
 */
function init() {
    // 创建初始的轮播项（-5到5位置）
    for (let i = -BUFFER_SIZE; i <= BUFFER_SIZE; i++) {
        addSlideItem(i);
    }
    updateSliderPosition();
    updateProductName();
    updatePreviewContent();
    updateButtonStates();
}

// 事件监听器设置
prevBtn.addEventListener("click", movePrev);
nextBtn.addEventListener("click", moveNext);
controllerInner.addEventListener("click", togglePreview);

// 等待DOM加载完成后初始化
document.addEventListener("DOMContentLoaded", () => {
    if (!productsContainer) return;  // 安全检查
    init();
});