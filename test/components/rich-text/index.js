/**
 * @file rich-text组件单测
 * @author yanghuabei@baidu.com
 */

import RichText from '../../../src/rich-text';
import buildComponent from '../../mock/swan-core/build-component';
import {getComponentClass, getFactory} from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
import superCustomComponent from '../../../src/super-custom-component';

const COMPONENT_NAME = 'rich-text';

/* eslint-disable max-nested-callbacks */
describe(`component [${COMPONENT_NAME}]`, () => {
    describe('base feature', () => {
        const component = buildComponent(COMPONENT_NAME, RichText);
        const $component = attach2Document(component);
        componentBaseFieldCheck(COMPONENT_NAME, component);
        describe('default props', () => {
            it('default value of nodes should be []', () => {
                const component = buildComponent(COMPONENT_NAME, RichText);
                const actual = component.data.get('nodes');
                const expected = [];
                expect(actual.length).toBe(expected.length);
            });
        });
        it('should be rendered after attach', () => {
            const $swanMain = $component.querySelector('swan-rich-text');
            component.data.set('nodes', '<div class="content">Hello time!</div>');
            expect($swanMain).not.toBe(null);
        });
        describe('verify prop nodes', () => {

            const createRichText = options => buildComponent(COMPONENT_NAME, RichText, options);
            const render = richText => {
                const dom = attach2Document(richText);
                richText.slaveRendered();
                return dom;
            };
            it('should render string nodes properly', () => {
                const component = createRichText({
                    data: {nodes: '<div class="content">Hello world!</div>'}
                });
                const main = render(component);
                const $swanMain = main.querySelector('swan-rich-text');
                const richContent = $swanMain.firstChild;
                const contrasts = [
                    ['div', richContent.tagName.toLowerCase()],
                    ['Hello world!', richContent.innerText]
                ];
                contrasts.forEach(([expected, actual]) => expect(actual).toBe(expected));
            });

            it('untrusted node should be filterd', () => {
                const component = createRichText({
                    data: {
                        nodes: [
                            {
                                type: 'node',
                                name: 'div',
                                children: [
                                    {
                                        type: 'text',
                                        text: 'Hello&nbsp;world!'
                                    }
                                ]
                            },
                            {
                                type: 'node',
                                name: 'iframe'
                            },
                            {
                                type: 'node',
                                name: 'video'
                            },
                            {
                                type: 'node',
                                name: 'xxxx'
                            },
                        ]
                    }
                });
                const main = render(component);
                const $swanMain = main.querySelector('swan-rich-text');
                const richContent = $swanMain.children;
                const actual = richContent.length;
                const expected = 1;
                expect(actual).toBe(expected);
            });
            it('CustomComponent innerClass should add extra-class',() => {
                const component = createRichText({
                    data: {nodes: '<div class="content">Hello world!</div>'}
                });
                const main = render(component);
                const factory = getFactory();
                const nodes = '<div class="content">Hello world!</div>';
                // 自定义组件custom
                factory.componentDefine('custom', Object.assign({}, superCustomComponent, {
                    template: `<swan-custom><rich-text nodes='${nodes}'></rich-text></swan-custom>`,
                    componentPath: `custom`,
                    componentName: `custom`,
                    customComponentCss: ``
                }), {
                    classProperties: {
                        components: Object.assign({}, factory.getAllComponents())
                    }
                });

                const CustomComponent = factory.getComponents('custom');

                factory.componentDefine('test', {
                    template: '<view><custom s-ref="rich" my-class="extra-class"></custom></view>'
                }, {
                    classProperties: {
                        components: {
                            custom: CustomComponent
                        }
                    }
                });
                const TestView = factory.getComponents('test');
                const TestRichText = new TestView();
                attach2Document(TestRichText)
                const child = TestRichText.el.childNodes;
                component.replaceCustomComponentInnerClass(child);
                let childClassName = child[0].childNodes[0].childNodes[0].className;
                expect(childClassName.indexOf('custom') > -1).toBe(true);

            });
        });
    });
});
