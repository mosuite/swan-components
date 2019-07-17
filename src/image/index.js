/**
 * @file swan's file's base elements <image>
 * @author zengqingzhuang(zengqingzhuang@baidu.com)
 */
import styles from './index.css';
import {privadeKey} from '../utils';
import {internalDataComputedCreator, typesCast} from '../computedCreator';
import {STABILITY_LOG_CONFIG} from '../utils/constant';
import getObserverInstance from '../utils/getObserverInstance';

const IMAGE_MODE_TO_BACKGROUND = {
    'scaleToFill': {
        'background-size': '100% 100%',
        'background-position': '0% 0%'
    },
    'aspectFit': {
        'background-size': 'contain',
        'background-position': 'center center'
    },
    'aspectFill': {
        'background-size': 'cover',
        'background-position': 'center center'
    },
    'widthFix': {
        'background-size': '100% 100%',
        'background-position': '0% 0%'
    },
    'top': {
        'background-position': 'top center'
    },
    'bottom': {
        'background-position': 'bottom center'
    },
    'center': {
        'background-position': 'center center'
    },
    'left': {
        'background-position': 'center left'
    },
    'right': {
        'background-position': 'center right'
    },
    'top left': {
        'background-position': 'top left'
    },
    'top right': {
        'background-position': 'top right'
    },
    'bottom left': {
        'background-position': 'bottom left'
    },
    'bottom right': {
        'background-position': 'bottom right'
    }
};

export default {

    constructor(props) {
        this.aheadDistance = 50; // 提前懒加载的距离
        this.originalHeight = ''; // 开发者设置在style上的高度
    },

    behaviors: ['userTouchEvents', 'noNativeBehavior', 'animateEffect'],

    initData() {
        return {
            src: '',
            mode: 'scaleToFill', // 图片裁剪、缩放的模式
            lazyLoad: false,
            [privadeKey]: {
                backgroundImage: '',
                backgroundPositionX: '',
                backgroundPositionY: '',
                transform: ''
            }
        };
    },

    computed: {
        ...internalDataComputedCreator([{
                name: 'src',
                caster: typesCast.stringCast
            },
            {
                name: 'mode',
                data: ['scaleToFill', 'aspectFit', 'aspectFill', 'widthFix',
                    'top', 'bottom', 'center', 'left', 'right', 'top left',
                    'top right', 'bottom left', 'bottom right'
                ]
            },
            {
                name: 'lazyLoad',
                caster: typesCast.boolCast
            }
        ]),

        imgStyle() {
            const mode = this.data.get('__mode');
            const {
                backgroundImage,
                backgroundPositionX,
                backgroundPositionY,
                transform
            } = this.data.get(`${privadeKey}`);

            let curStyle = IMAGE_MODE_TO_BACKGROUND[mode] || {};
            let [
                defaultPositionX,
                defaultPositionY
            ] = (curStyle['background-position'] || '').split(' ');

            return {
                'background-size': 'auto auto',
                'background-repeat': 'no-repeat',
                ...curStyle,
                'background-position':
                    `${backgroundPositionX || defaultPositionX} ${backgroundPositionY || defaultPositionY}`,
                'background-image': backgroundImage,
                'transform': transform
            };
        }
    },

    filters: {
        toStyleText(styleObj) {
            const text = Object.keys(styleObj).reduce((styleArr, name) => {
                const value = styleObj[name];
                value && styleArr.push(`${name}: ${value}`);
                return styleArr;
            }, [])
            .join(';');

            return text;
        }
    },

    template: `<swan-image>
            <div s-ref="img" style="{{imgStyle|toStyleText}}"></div>
        </swan-image>`,

    attached() {
        this.img = this.ref('img');
        this.parseOutsideRulesPosition();
        this.loadImage(this.data.get('__src'));
        this.bindLazyLoadEvents();

        this.watch('mode', val => {
            if (val !== 'widthFix') {
                this.el.style.height = this.originalHeight;
            }
        });

        this.watch('src', src => {
            this.loaded = false;
            this.loadImage(src);
        });
    },

    slaveUpdated() {
        // 对于widthFix的特殊处理，保持图片比例，图片还没加载时不处理
        if (this.data.get('__mode') === 'widthFix' && this.rate) {
            this.handleWidthFixMode();
        }
    },

    /**
     * 解析用户写的position相关属性
     */
    parseOutsideRulesPosition() {
        const {
            backgroundPosition = '',
            backgroundPositionX = '',
            backgroundPositionY = '',
            height
        } = this.el.style;

        const backgroundPositionArr = backgroundPosition.split(' ');
        this.data.set(`${privadeKey}.backgroundPositionX`,
            backgroundPositionX || backgroundPositionArr[0]);
        this.data.set(`${privadeKey}.backgroundPositionY`,
            backgroundPositionY || backgroundPositionArr[1] || backgroundPositionArr[0]);

        if (typeof height !== 'undefined') {
            this.originalHeight = parseInt(height, 10) + 'px';
        }
    },

    /**
     * 加载背景图
     */
    loadImage(src) {
        const {
            __lazyLoad: lazyLoad,
            __mode: mode
        } =  this.data.get();

        if (
            this.loaded
            || !src
            || (lazyLoad && !this.ableToLoad)
        ) {
            return;
        }

        this.getImgPath(src).then(imgPath => {
            this.loaded = true;

            // 当元素已经销毁不执行回调, 如微博的占位卡片
            if (!this.el) {
                return;
            }

            this.tryLoadImg(imgPath).then(imgEntity => {
                const {
                    width,
                    height
                } = imgEntity;
                this.rate = width / height;
                // TODO: 应该去掉border和padding的宽度
                if (mode === 'widthFix' && this.el) {
                    this.imgHeight = parseInt(this.el.offsetWidth / this.rate, 10);
                    this.el.style.height = `${this.imgHeight}px`;
                }
            }).catch(e => {
                console.error('image load faild', e);
            });

            this.data.set(`${privadeKey}.backgroundImage`, `url('${imgPath}')`);
            this.data.set(`${privadeKey}.transform`, 'translateZ(0)');
            this.el.classList.add('swan-image-will-change');
            // TODO: 微信是ios才加动画
            setTimeout(() => {
                this.data.set(`${privadeKey}.transform`, '');
                this.el && this.el.classList.remove('swan-image-will-change');
            }, 0);
        });
    },

    /**
     * 获取图片地址
     * todo:如果图片地址是bdfile，需要调用隐藏端能力getLocalImgData方法获取本地图片地址
     * @return {string} 图片地址
     */
    getImgPath(src) {
        if (!src) {
            return Promise.reject('src is null');
        }

        return new Promise((resolve, reject) => {
            if (src.indexOf('bdfile://') === 0) {
                this.boxjs.data.get({
                    name: 'swan-localImgData',
                    data: {
                        filePath: src
                    }
                }).then(fileObj => {
                    resolve(fileObj.filePath);
                }).catch(err => {
                    reject(err);
                });
            }
            else {
                resolve(/^\s*data:image\//.test(src) ? src : this.absolutePathResolve(src));
            }
        });
    },

    /**
     * 加载图片获取宽高
     * @param {string} [imgPath] 图片地址
     * @return {Object} promise对象
     */
    tryLoadImg(imgPath) {
        return new Promise((resolve, reject) => {
            let imgEntity = new window.Image();

            imgEntity.onerror = e => {
                this.dispatchEvent('binderror', {
                    detail: {
                        errMsg: 'something wrong: ' + JSON.stringify(e)
                    }
                });
                this.logStability(STABILITY_LOG_CONFIG.imageBindError);
                reject();
            };

            imgEntity.onload = e => {
                this.dispatchEvent('bindload', {
                    detail: {
                        height: e.target.height,
                        width: e.target.width
                    }
                });
                resolve(imgEntity);
            };

            imgEntity.src = imgPath;
        });
    },

    bindLazyLoadEvents() {
        const {
            __lazyLoad: lazyLoad,
            __src: src
        } = this.data.get();

        if (!lazyLoad) {
            return;
        }

        const lazyLoadObserver = getObserverInstance('image', {
            rootMargin: `${this.aheadDistance}px`,
            threshold: [0.1]
        });

        lazyLoadObserver.observe(this.img, entry => {
            if (entry.isIntersecting) {
                lazyLoadObserver.unobserve(entry.target);
                this.ableToLoad = true;
                this.loadImage(src);
            }
        });
    },

    /**
     * 对于widthFix的特殊处理，保持图片比例
     */
    handleWidthFixMode() {
        this.imgHeight = this.imgHeight || parseInt(this.el.style.height, 10);
        let newHeight = parseInt(this.el.offsetWidth / this.rate, 10);

        if (newHeight !== this.imgHeight) {
            this.el.style.height = newHeight + 'px';
            this.imgHeight = newHeight;
            // TODO:
            this.communicator.fireMessage({type: 'slaveUpdated'});
        }
    }
};