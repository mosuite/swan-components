/**
 * @file DOM测量相关函数
 * @author houyu(houyu01@baidu.com)
 */
const global = window;
export const getElementBox = el => {
    const boxRect = el.getBoundingClientRect();
    const elementStyle = global.getComputedStyle(el);
    const topWidth = parseFloat(elementStyle.getPropertyValue('border-top-width'));
    const bottomWidth = parseFloat(elementStyle.getPropertyValue('border-bottom-width'));
    const leftWidth = parseFloat(elementStyle.getPropertyValue('border-left-width'));
    const rightWidth = parseFloat(elementStyle.getPropertyValue('border-right-width'));
    const width = el.offsetWidth - leftWidth - rightWidth;
    const height = el.offsetHeight - topWidth - bottomWidth;
    return {
        top: boxRect.top + global.scrollY + topWidth + '',
        left: boxRect.left + global.scrollX + leftWidth + '',
        width: `${width < 0 ? 0 : width}`,
        height: `${height < 0 ? 0 : height}`
    };
};
