/**
 * @file swan's file's base elements <movable-view>
 * @author jiamiao(jiamiao@baidu.com)
 */
import {attrValBool} from '../utils';
import {getElementBox} from '../utils/dom';

export default {

    /**
     * 限制x和y值的方法
     * @param {number} [posX] x轴坐标想要变成的值
     * @param {number} [posY] y轴坐标想要变成的值
     * @param {string} [privateKey] 私有属性的key值
     * @param {number} [type] 判断是否开启out-of-bounds属性，判断超过可移动区域后，movable-view是否还可以移动
     * @return {Object} 限制之后的x、y值
     */
    limitRangeOfMovement(posX, posY, privateKey, type = 1) {
        const {width, height} = getElementBox(this.el);
        const scaleValue = this.data.get(`${privateKey}.scaleValue`);
        let maxTranslateX = this.areaPosition.width - width * scaleValue;
        let maxTranslateY = this.areaPosition.height - height * scaleValue;
        const outOfBounds = this.data.get('__outOfBounds');
        // area的宽高都比view大
        if (maxTranslateX >= 0 && maxTranslateY >= 0) {
            posX < this.diffX && (posX = outOfBounds && 1 === type
                ? this.diffX - Math.sqrt(Math.abs(posX - this.diffX)) : this.diffX);
            posY < this.diffY && (posY = outOfBounds && 1 === type
                ? this.diffY - Math.sqrt(Math.abs(posY - this.diffY)) : this.diffY);
            posX > maxTranslateX + this.diffX && (posX = outOfBounds && 1 === type ? maxTranslateX + this.diffX
                + Math.sqrt(Math.abs(posX - maxTranslateX + this.diffX)) : maxTranslateX + this.diffX);
            posY > maxTranslateY + this.diffY && (posY = outOfBounds && 1 === type ? maxTranslateY + this.diffY
                + Math.sqrt(Math.abs(posY - maxTranslateY + this.diffY)) : maxTranslateY + this.diffY);
        }
        // area的宽比view小，高比view大
        else if (maxTranslateX < 0 && maxTranslateY > 0) {
            posX < maxTranslateX && (posX = maxTranslateX + this.diffX);
            posX > this.diffX && (posX = this.diffX);
            posY < this.diffY && (posY = this.diffY);
            posY > maxTranslateY + this.diffY && (posY = maxTranslateY + this.diffY);
        }
        // area的宽比view大，高比view小
        else if (maxTranslateX > 0 && maxTranslateY < 0) {
            posX < this.diffX && (posX = this.diffX);
            posX > maxTranslateX + this.diffX && (posX = maxTranslateX + this.diffX);
            posY < maxTranslateY && (posY = maxTranslateY);
            posY > this.diffY && (posY = this.diffY);
        }
        // area的宽高都比view小
        else {
            posX < maxTranslateX + this.diffX && (posX = maxTranslateX + this.diffX);
            posX > this.diffX && (posX = this.diffX);
            posY < maxTranslateY + this.diffY && (posY = maxTranslateY + this.diffY);
            posY > this.diffY && (posY = this.diffY);
        }
        return {x: posX, y: posY};
    },

    /**
     * 进行缩放操作时，x和y值也需做相应改变
     * @param {string} [privateKey] 私有属性的key值
     */
    limitRangeOfScaleZoom(privateKey) {
        const scaleValue = this.data.get(`${privateKey}.scaleValue`);
        const {x, y} = this.data.get(privateKey);
        const {width, height} = getElementBox(this.el);
        if (this.isViewBiggerThanArea(scaleValue)) {
            // 缩放后左侧边超出area
            if (x - width * (scaleValue - 1) / 2 < 0) {
                this.data.set(`${privateKey}.x`, width * (scaleValue - 1) / 2);
            }
            // 缩放后右边侧超出area
            if (x + width * (scaleValue + 1) / 2 > this.areaPosition.width) {
                this.data.set(`${privateKey}.x`, this.areaPosition.width - width * (scaleValue + 1) / 2);
            }
            // 缩放后上侧边超出area
            if (y - height * (scaleValue - 1) / 2 < 0) {
                this.data.set(`${privateKey}.y`, height * (scaleValue - 1) / 2);
            }
            // 缩放后下侧边超出area
            if (y + height * (scaleValue + 1) / 2 > this.areaPosition.height) {
                this.data.set(`${privateKey}.y`, this.areaPosition.height - height * (scaleValue + 1) / 2);
            }
        }
    }
};
