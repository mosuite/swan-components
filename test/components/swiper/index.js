import Swiper from '../../../src/swiper/index';
import SwiperItem from '../../../src/swiper-item/index';
import {swiperBindChangeEventCallbackFieldCheck} from "../../utils/event-callback-field-check";
import buildComponent, {getComponentClass, getFactory} from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
import sinon from 'sinon';
import {createSingleTouchEvent, createZoomEvent} from '../../utils/touch';

const COMPONENT_NAME = 'swiper';

/**
 * 创建单测用例
 * @param {Object} attrs 组件的自定义属性键值对
 * @param {Object} methods 组件的自定义方法
 * @param {boolean} dispose 是否自动销毁组件
 * @param {boolean} itemslengthstatus 是否子元素
 * @param {boolean} onlyOne 存在唯一子元素
 * @return {Promise} promise 对象
 */
const getTestCase = ({
                         attrs = {
                             style: 'width: 100%; height: 150px;'
                         },
                         methods = {},
                         dispose = false,
                         itemslengthstatus = true,
                         onlyOne = true
                     }) => {
    return new Promise((resolve, reject) => {
        const attrsArray = [];
        Object.keys(attrs).map(key => attrsArray.push(`${key}="${attrs[key]}"`));
        const factory = getFactory();
        let tpl = `<div style="position:relative; width: 100px; height: 100px; background-corlor: red;">
                    <swiper s-ref="swiper" ${attrsArray.join(' ')}>
                        <swiper-item item-id="a"></swiper-item>
                        <swiper-item item-id="b"></swiper-item>
                        <swiper-item item-id="c"></swiper-item>
                    </swiper>
                </div>`;

        if (!onlyOne) {
            tpl = `<div style="position:relative; width: 100px; height: 100px; background-corlor: red;">
                    <swiper s-ref="swiper" ${attrsArray.join(' ')}>
                        <swiper-item item-id="a"></swiper-item>
                    </swiper>
                </div>`;
        }
        if (!itemslengthstatus) {
            tpl = `<div style="position:relative; width: 100px; height: 100px; background-corlor: red;">
                    <swiper s-ref="swiper" ${attrsArray.join(' ')}>
                    </swiper>
                </div>`;
        }
        factory.componentDefine(
            'testComponent', {
                template: tpl,
                ...methods
            }, {
                classProperties: {
                    components: {
                        'swiper': getComponentClass('swiper', Swiper),
                        'swiper-item': getComponentClass('swiper-item', SwiperItem)
                    }
                }
            }
        );
        const TestView = factory.getComponents('testComponent');
        const testComponent = new TestView();
        testComponent.attach(document.body);
        testComponent.communicator.fireMessage({
            type: 'slaveRendered'
        });
        testComponent.nextTick(() => {
            const swiper = testComponent.ref('swiper');
            resolve({
                swiper,
                testComponent
            });
            dispose && testComponent.dispose();
        });
    });
};

describe(`component [${COMPONENT_NAME}]`, () => {
    const component = buildComponent(COMPONENT_NAME, Swiper);
    attach2Document(component);
    componentBaseFieldCheck(COMPONENT_NAME, component);
    component.nextTick(() => {
        component.dispose();
    });

    describe('base feature', () => {

        it('case should be rendered after attach', done => {
            getTestCase({})
                .then(({swiper, testComponent}) => {
                    const $swiper = swiper.el;
                    swiper.data.set('autoplay', 1);
                    expect($swiper).not.toBe(null);
                    done();
                    testComponent.dispose();
                });
        });
        it('case should be return if items.length be 0 ', done => {
            getTestCase({
                itemslengthstatus: false

            })
                .then(({swiper, testComponent}) => {
                    const swiperLength = swiper.ref('swiperSlides').children.length;
                    expect(swiperLength).toBe(0);
                    done();
                    testComponent.dispose();
                });
        });
        it('should be return if items.length be 1 ', done => {
            getTestCase({
                onlyOne: false,
                autoplay: true
            })
                .then(({swiper, testComponent}) => {
                    const swiperLength = swiper.ref('swiperSlides').children.length;
                    expect(swiperLength).toBe(1);
                    done();
                    testComponent.dispose();
                });
        });

        it('current default value should be NaN', done => {
            getTestCase({
                attrs: {
                    circular: false
                }
            })
                .then(({swiper, testComponent}) => {
                    expect(swiper.data.get('current')).not.toBe(swiper.data.get('current'));
                    done();
                    testComponent.dispose();
                });
        });


        it('default props', done => {
            const defaultAttrs = {
                indicatorDots: false,
                indicatorColor: 'rgba(0, 0, 0, .3)',
                indicatorActiveColor: '#000000',
                autoplay: false,
                currentItemId: '',
                interval: 5000,
                duration: 500,
                circular: false,
                vertical: false,
                previousMargin: '0px',
                nextMargin: '0px',
                displayMultipleItems: 1
            };
            getTestCase({})
                .then(({swiper, testComponent}) => {
                    Object.keys(defaultAttrs).forEach(key => {
                        expect(swiper.data.get(key)).toBe(defaultAttrs[key]);
                    });
                    done();
                    testComponent.dispose();
                });
        });


        it('should set margin of swan-swiper-sliders', done => {
            const defaultAttrs = {
                previousMargin: '20px',
                nextMargin: '30px'
            };
            getTestCase({
                attrs: defaultAttrs
            })
                .then(({swiper, testComponent}) => {
                    const $slider = swiper.el.querySelector('.swan-swiper-slides');
                    expect(getComputedStyle($slider).left).toBe(defaultAttrs.previousMargin);
                    expect(getComputedStyle($slider).right).toBe(defaultAttrs.nextMargin);
                    done();
                    testComponent.dispose();
                });
        });

        it('should set current to init index', done => {
            const defaultAttrs = {
                current: 1
            };
            getTestCase({
                attrs: defaultAttrs
            })
                .then(({swiper, testComponent}) => {
                    expect(swiper.index).toBe(1);
                    done();
                    testComponent.dispose();
                });
        });

        it('should set init index by current-item-id', done => {
            const defaultAttrs = {
                'current-item-id': 'c',
                'current': 'a'
            };
            getTestCase({
                attrs: defaultAttrs
            })
                .then(({swiper, testComponent}) => {
                    expect(swiper.index).toBe(2);
                    done();
                    testComponent.dispose();
                });
        });

        it('should render indicator while indicator-dots is true && should set indicator color to custom variable',
                done => {
                    const defaultAttrs = {
                        'indicator-dots': true,
                        'indicator-active-color': '#ffffff',
                        'indicator-color': 'rgba(0, 0, 0, 0.5)',
                    };
                    getTestCase({attrs: defaultAttrs})
                    .then(({swiper, testComponent}) => {
                        swiper.nextTick(() => {
                            const $indicatorDots = swiper.el.querySelector('.swan-swiper-dots');
                            expect($indicatorDots).not.toBe(null);
                            expect($indicatorDots.children[0].style.backgroundColor).toBe('rgb(255, 255, 255)');
                            expect($indicatorDots.children[1].style.backgroundColor).toBe('rgba(0, 0, 0, 0.5)');
                            done();
                            testComponent.dispose();
                        });
                });
        });

        it('autoPlay & interval change should be watch', done => {
            getTestCase({})
                .then(({swiper, testComponent}) => {
                    const swiperSpy = sinon.spy(swiper, 'autoPlayOn');
                    swiper.circular = true;
                    swiper.data.set('autoplay', 1);
                    swiper.data.set('__autoplay', 1);
                    let length = swiper.ref('swiperSlides').children.length;
                    swiper.total = length;
                    swiper.index = swiper.total - 1;
                    swiper.nextTick(() => {
                        swiper.data.set('interval', 2000);
                    });
                    setTimeout(() => {
                        expect(swiperSpy.callCount).not.toBe(1);
                        swiperSpy.restore();
                        done();
                        testComponent.dispose();
                    }, 3000);
                });
        });
        it('autoPlayOn should be watch', done => {
            getTestCase({})
                .then(({swiper, testComponent}) => {
                    const swiperSpy = sinon.spy(swiper, 'autoPlayOn');
                    swiper.data.set('autoplay', 1);
                    swiper.data.set('__autoplay', 1);
                    swiper.nextTick(() => {
                        swiper.data.set('interval', 2000);
                    });
                    setTimeout(() => {
                        expect(swiperSpy.callCount).not.toBe(1);
                        swiperSpy.restore();
                        done();
                        testComponent.dispose();
                    }, 3000);
                });
        });
        it('current change should be watch', done => {
            getTestCase({})
                .then(({swiper, testComponent}) => {
                    swiper.data.set('current', 1);
                    expect(swiper.index).toBe(1);
                    swiper.data.set('current', -1);
                    expect(swiper.index).toBe(0);
                    swiper.data.set('current', swiper.total);
                    expect(swiper.index).toBe(swiper.total - 1);
                    swiper.data.set('currentItemId', 'a');
                    swiper.nextTick(() => {
                        expect(swiper.index).toBe(0);
                        done();
                        testComponent.dispose();
                    });
                });
        });

        it('should trigger bindchange while current change', done => {
            getTestCase({})
                .then(({swiper, testComponent}) => {
                    swiper.on('bindchange', e => {
                        swiperBindChangeEventCallbackFieldCheck(expect, done, e);
                    });
                    swiper.data.set('current', 2);
                });
        });

        it('touch events should worked', done => {
            getTestCase({
                attrs: {
                    circular: true
                }
            })
                .then(({swiper, testComponent}) => {
                    createSingleTouchEvent(
                        swiper.el.querySelector('.swan-swiper-slide-frame'),
                        [{x: 90, y: 50}, {x: 10, y: 40}]
                    ).then(() => {
                        expect(swiper.index).toBe(1);
                        done();
                        testComponent.dispose();
                    });
                });
        });
        it('tow finger event should not worked', done => {
            getTestCase({
                attrs: {
                    circular: true
                }
            })
                .then(({swiper, testComponent}) => {
                    createZoomEvent(swiper.el.querySelector('.swan-swiper-slide-frame'), [
                        [{x: 0, y: 0, keyFrames: '0%'}, {x: 10, y: 15, keyFrames: '90%'}],
                        [{x: 20, y: 30, keyFrames: '0%'}, {x: 60, y: 80, keyFrames: '100%'}]
                    ]).then(() => {
                        expect(swiper.index).toBe(0);
                        done();
                        testComponent.dispose();
                    });

                });

        });
        it('touchstart events should worked', done => {
            getTestCase({

                attrs: {
                    circular: true,
                    vertical: false
                }
            })
                .then(({swiper, testComponent}) => {
                    swiper.fire('touchstart', {});
                    createSingleTouchEvent(
                        swiper.el.querySelector('.swan-swiper-slide-frame'),
                        [{x: 10, y: 100}, {x: 10, y: 100}]
                    ).then(() => {
                        expect(swiper.index).toBe(0);
                        done();
                        testComponent.dispose();
                    });
                });
        });
        it('touchmove events should be check', done => {
            getTestCase({
                autoplay: true,
                attrs: {
                    circular: true,
                    vertical: true
                }
            })
                .then(({swiper, testComponent}) => {
                    swiper.animationTimer = 222;
                    swiper.offset = 1111;
                    swiper.index = -1;
                    createSingleTouchEvent(
                        swiper.el.querySelector('.swan-swiper-slide-frame'),
                        [{x: 100, y: 90}, {x: 200, y: 90}]
                    ).then(() => {

                        expect(swiper.index).not.toBe(0);
                        done();
                        testComponent.dispose();

                    });
                });
        });
        it('touchend events should worked', done => {
            getTestCase({
                autoplay: true,
                attrs: {
                    circular: true,
                    vertical: true
                }
            })
                .then(({swiper, testComponent}) => {

                    createSingleTouchEvent(
                        swiper.el.querySelector('.swan-swiper-slide-frame'),
                        [{x: 100, y: 90}, {x: 200, y: 90}]
                    ).then(() => {
                        swiper.fire('touchend');

                        let swiperSpy = sinon.stub(swiper, 'indexRangeLimit');
                        swiperSpy(-2);
                        swiper.nextTick(() => {
                            expect(swiper.index).not.toBe(1);
                            swiperSpy.restore();
                            done();
                            testComponent.dispose();
                        });


                    });
                });
        });

        it('indexRange boundary should be check', done => {
            getTestCase({
                attrs: {
                    circular: true
                }
            })
                .then(({swiper, testComponent}) => {
                    swiper.indexRangeLimit(-1);
                    swiper.indexRangeLimit(swiper.total + 1);
                    swiper.offsetLimitL = swiper.offset + 10;
                    swiper.slicerRangeLimit();
                    swiper.nextTick(() => {
                        expect(swiper.index).not.toBe(1);
                        done();
                        testComponent.dispose();
                    });
                });

        });

        it('offset boundary should be check', done => {
            getTestCase({
                attrs: {
                    circular: true
                }
            })
                .then(({swiper, testComponent}) => {
                    swiper.indexRangeLimit(-1);
                    swiper.indexRangeLimit(swiper.total + 1);
                    swiper.offsetLimitL = swiper.offset - 10;
                    swiper.slicerRangeLimit();
                    swiper.nextTick(() => {
                        expect(swiper.index).not.toBe(1);
                        done();
                        testComponent.dispose();
                    });
                });

        });


    });
});
