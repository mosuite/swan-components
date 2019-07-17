import pickerViewColumn from '../../../src/picker-view-column/index';
import pickerView from '../../../src/picker-view/index';
import {getComponentClass, getFactory} from '../../mock/swan-core/build-component';
import {createSingleTouchEvent} from '../../utils/touch';

const COMPONENT_NAME = 'picker-view-column';
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
        factory.componentDefine(
            'testComponent',
            {
                template: `
            <div>
                <picker-view value='{{[0]}}' s-ref="pickerView" 
                style="width: 100%; height: 300px;" indicator-style="height: 50px;">
                    <picker-view-column s-ref="column">
                        <view style="height:50px;line-height:50px;">1年</view>
                        <view style="height:50px;line-height:50px;">2年</view>
                        <view style="height:50px;line-height:50px;">3年</view>
                        <view style="height:50px;line-height:50px;">4年</view>
                        <view style="height:50px;line-height:50px;">5年</view>
                        <view style="height:50px;line-height:50px;">6年</view>
                    </picker-view-column>
                </picker-view>
            </div>
            `
            },
            {
                classProperties: {
                    components: {
                        'picker-view': getComponentClass('picker-view', pickerView),
                        'picker-view-column': getComponentClass(COMPONENT_NAME, pickerViewColumn)
                    }
                }
            }
        );
        const swanPickerView = factory.getComponents('testComponent');
        const testComponent = new swanPickerView();
        testComponent.attach(document.body);
        testComponent.communicator.fireMessage({
            type: 'slaveRendered'
        });
        testComponent.nextTick(() => {
            const columnRef = testComponent.ref('column');
            resolve({
                columnRef,
                testComponent
            });
            dispose && testComponent.dispose();
        });
    });
};

describe('component [' + COMPONENT_NAME + '] Should be rendered', () => {

    it('webkitTransitionEnd event should check', done => {
        getTestCase({})
            .then(({columnRef, testComponent}) => {
                createSingleTouchEvent(columnRef.el.querySelector('.swan-picker__content'),
                    [{x: 0, y: 0}, {x: 0, y: -150}]).then(() => {
                        const event = new Event('webkitTransitionEnd');
                        columnRef.el.querySelector('.swan-picker__content').dispatchEvent(event);
                        setTimeout(() => {
                            expect(columnRef.el.curIndex >= 3).toBe(true);
                            done();
                            testComponent.dispose();
                        }, 1000);
                    });
            });

    });
    it('touch event should exec', done => {
        getTestCase({})
            .then(({columnRef, testComponent}) => {
                createSingleTouchEvent(columnRef.el.querySelector('.swan-picker__content'),
                    [{x: 0, y: 0}, {x: 10, y: 10}]).then(() => {
                        columnRef.el.curIndex = 100;
                        setTimeout(() => {
                            expect(columnRef.el.curIndex).not.toBe(100);
                            done();
                            testComponent.dispose();
                        }, 1000);
                    });
            });

    });
    it('resetTranslateY event should exec', done => {
        getTestCase({})
            .then(({columnRef, testComponent}) => {
                createSingleTouchEvent(columnRef.el.querySelector('.swan-picker__content'),
                    [{x: 0, y: 0}, {x: 10, y: 10}]).then(() => {
                        columnRef.curTranslateY = 111;
                        setTimeout(() => {
                            expect(columnRef.el.curIndex).not.toBe(100);
                            done();
                            testComponent.dispose();
                        }, 1000);
                    });
            });

    });
    it(' curTranslateY VS maxTranslateY should exec', done => {
        getTestCase({})
            .then(({columnRef, testComponent}) => {
                createSingleTouchEvent(columnRef.el.querySelector('.swan-picker__content'),
                    [{x: 0, y: 0}, {x: 0, y: 100}]).then(() => {
                        columnRef.curTranslateY = columnRef.maxTranslateY + 100;
                        columnRef.resetTranslateY();
                        setTimeout(() => {
                            expect(columnRef.maxTranslateY).not.toBe(0);
                            done();
                            testComponent.dispose();
                        }, 1000);
                    });
            });

    });

});
