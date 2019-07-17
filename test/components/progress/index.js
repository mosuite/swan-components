/**
 * @file progress组件单测
 * @author yanghuabei@baidu.com
 * @author sunbaixin@baidu.com
 */

import sinon from 'sinon';
import Progess from '../../../src/progress';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';

const COMPONENT_NAME = 'progress';

/* eslint-disable max-nested-callbacks */
describe(`component [${COMPONENT_NAME}]`, () => {
    describe('base feature', () => {
        const component = buildComponent(COMPONENT_NAME, Progess);
        const $component = attach2Document(component);
        componentBaseFieldCheck(COMPONENT_NAME, component);
        it('should be rendered after attach', () => {
            const $swanMain = $component.querySelector('swan-progress');
            expect($swanMain).not.toBe(null);
        });

        describe('default props', () => {
            const defaults = [
                ['percent', 0],
                ['showInfo', false],
                ['strokeWidth', 2],
                ['color', ['#09BB07', '#09bb07'], 'includes'],
                ['activeColor', ''],
                ['backgroundColor', ['#e6e6e6', '#E6E6E6'], 'includes'],
                ['active', false],
                ['activeMode', 'backwards']
            ];
            defaults.forEach(
                ([name, expected, checkType]) => {
                    const message = checkType === 'includes'
                        ? `${name} default value should be one of ${expected.join()}`
                        : `${name} default value should be ${expected}`;
                    it(message, () => {
                        const data = component.data;
                        const actual = data.get(name);
                        if (checkType === 'includes') {
                            expect(expected.includes(actual)).toBe(true);
                        }
                        else {
                            expect(actual).toBe(expected);
                        }
                    });
                }
            );

        });

        describe('percent change', () => {
            describe('percent change max', () => {
                let component = buildComponent(COMPONENT_NAME, Progess);
                attach2Document(component);
                it('should call activeAnimation and percentChange when percent change and active is true', done => {
                    const percentChangeSpy = sinon.spy(component, 'percentChange');
                    const activeAnimationSpy = sinon.spy(component, 'activeAnimation');
                    component.data.set('active', true);
                    component.data.set('percent', 101);
                    component.nextTick(() => {
                        expect(percentChangeSpy.calledOnce);
                        expect(activeAnimationSpy.calledOnce);
                        percentChangeSpy.restore();
                        activeAnimationSpy.restore();
                        component.dispose();
                        done();
                    });
                });
            });

            describe('percent change min', () => {
                let component = buildComponent(COMPONENT_NAME, Progess);
                attach2Document(component);
                it('should call activeAnimation and percentChange when percent change and active is true', done => {
                    const percentChangeSpy = sinon.spy(component, 'percentChange');
                    const activeAnimationSpy = sinon.spy(component, 'activeAnimation');
                    component.data.set('active', true);
                    component.data.set('percent', -1);
                    component.nextTick(() => {
                        expect(percentChangeSpy.calledOnce);
                        expect(activeAnimationSpy.calledOnce);
                        percentChangeSpy.restore();
                        activeAnimationSpy.restore();
                        component.dispose();
                        done();
                    });
                });
            });
        });
    });
});
