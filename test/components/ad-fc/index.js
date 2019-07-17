/**
 * @file ad-fc 组件单测
 * @author zhoushufeng@baidu.com
 */

import sinon from 'sinon';
import {fclick, request} from '../../../src/ad-fc/ecom';
import adFc from '../../../src/ad-fc/index';
import buildComponent from '../../mock/swan-core/build-component';
import attach2Document from '../../utils/attach-to-document';

const COMPONENT_NAME = 'ad-fc';
const buildComponentAdFc = option => buildComponent(COMPONENT_NAME, adFc, option || {});
const adData = '<div class="ec-placeholder" style="height: 700px;">占位</div><div class="ec-fc-ad-results"><div class="ec-fc-ad ec-fc-click" ad-fc-show=\'{"srcid": 1577, "totle": 1, "rank": 0, "tag": "ec_mip", "sid": "34a22c4086a53861", "url": "/s?ie=utf-8&mod=0&isid=BE002D81EEB24324&pstg=0&wd=%E9%B2%9C%E8%8A%B1&tn=baidu&ie=utf-8&f=8&rsv_bp=1&bs=%E9%B2%9C%E8%8A%B1&rsv_spt=3&rsv_sid=4398_5414_1436_5139_5225_5378_5368_4261_5124_4760_5402_5342&f4s=1&csor=2&_cr1=14939&pst=0,4"}\' href="http://cq01-cs-anti-remora14.cq01.baidu.com:8765/baidu.php?url=a00000ji9L-sjElFx1I32n2GDXMseCHr--BP1PhM0Hy6wFVFMP69tBYC6wtao_xEgljqpviZlIDQfB1Atfsaq7bQaYmbT6SJZCHvx1JlVuV1Oe8ElJxJoJXedUCPph12SwAwLT9vEfygbjfQDgFgmImxkoEBSGK2FtK5iORSUnX5DnnJA_vHCRggB2_22ZY4O1IZsSen3j5JTWAt20.DY_jgwIsFhzNqB7501W4XaPmuCyPLHu_L20.U1Yk0ZDq1tJeJ0KspynqnfKY5g9Gmy4CIyD0pyYqnWcz0ATq0ZNG5fKspyfqn0KWpyfqn0KVIjYknjDLg1nvnj7xnH0krfKopHYs0ZFY5HcYrfK-pyfqn10YrHwxnH0sPjR30AFG5HnsnNt1njFxn101g1csnj0kg1csnjm10AdW5HDsnHIxn7ts0Z7spyfqnfKkmv-b5HD0ThIYmyTqn0K9mWYsg100ugFM5H00TZ0qn0K8IM0qna3snj0snj0sn0KVIZ0qn0KbuAqs5H00ThCqn0KbugmqIv-1ufKhIjYz0ZKC5H00ULnqnfKBI1Yd0A4Y5H00TLCqnHnzn7tznj0k0ZwdT1YYPHRYnjTsrjcvn1RkPWT1PHf0ThNkIjYkPHR1njTznHbvnj6z0ZPGujdbPW0dP1uWnW64ujbLuyNB0AkBT1Ys0A7W5HD0TA3qn0KkUgfqn0KkUgnqn0KlIjYs0AdWgvuzUvYqn7tsg100uA78IyF-gLK_my4GuZnqn7tsg100TA7Ygvu_myTqn0Kbmv-b5H00ugwGujYVnfK9TLKWm1Ys0ZNspy4Wm1YknHD0Tydh5H00uhPdIjYs0AulpjYs0Au9IjYs0ZGsUZN15H00mywhUA7M5HD0UAuW5H00IvuzUvYqn0KLpHYd0ZwV5H60TLPs5H00mywWUA71T1YL0Zwd5fKWIA_q0AqY5H00ULFsIjYsc10W0APzm1Y1rHfLP0&word=%E9%B2%9C%E8%8A%B1&word=%E5%8C%97%E4%BA%AC%E6%97%85%E6%B8%B8%E5%93%AA%E9%87%8C%E6%9C%80%E5%A5%BD%E5%90%83"><div class="ec-fc-ad-title ec-fc-gap-bottom-small ec-fc-line-clamp1"><span class="ec-fc-inner-text">鲜花中国\'鲜花网,南京&amp;合肥..</span></div><div class="ec-fc-ad-desc ec-fc-line-clamp2"><em>鲜花</em>--中\'国<em>鲜花</em>礼品网n&n，销量连续5年全国领先，1-3小时送达全国1000多城市。<em>鲜花</em>中国花卉协会单位会员..</div><div class="ec-fc-ad-urlline ec-fc-clearfix"><span class="ec-fc-ad-url">www.xianhua.com</span><span class="ec-fc-ad-icon ec-fc-ad-icon-v2"></span><span class="ec-fc-ad-tuiguang">广告</span></div></div></div>';
const healthData = '<div class="c-row swan-ad-fc-button-row"><span class="c-span4 swan-ad-fc-button-a swan-ad-fc-button swan-ad-fc-click swan-ad-fc-redirect" data-theme="normal" data-redirect="http://m.baidu.com/" data-log="http://m.baidu.com/" data-source="/pages/expertlist/expertlist" data-target="swan-ad-fc-button-normal" data-appkey="VlKQRMSyT32ln2AG84dmTjW6qldpGsNk"><div class="swan-ad-fc-button-btn swan-ad-fc-button-btn-normal"><span class="swan-ad-fc-button-btntext">专家咨询</span></div></span> <span class="c-span4 swan-ad-fc-button-a swan-ad-fc-button swan-ad-fc-click" data-theme="primary" data-log="http://m.baidu.com" data-source="/pages/triage/triager"><div class="swan-ad-fc-button-btn swan-ad-fc-button-btn-primary"><span class="swan-ad-fc-button-btntext">免费问诊（限时）</span></div></span></div>';

describe('component [' + COMPONENT_NAME + ']', () => {
    describe('ecom.js', () => {
        it('request(url) should work fine', () => {
            let spiedRequst = sinon.spy(request);
            spiedRequst('https://sp0.baidu.com/-rU_dTmfKgQFm2e88IuM_a/w.gif');
            expect(spiedRequst.called).toBe(true);
        });

        it('fclick(data) should work fine', () => {
            let spiedFclick = sinon.spy(fclick);
            spiedFclick({tag: 'fclik_test'});
            expect(spiedFclick.called).toBe(true);
        });
    });

    describe('render', () => {
        let component = null;
        let $component = null;
        beforeEach(() => {
            component = buildComponentAdFc();
            $component = attach2Document(component);
        });
        afterAll(() => {
            component.dispose();
        });

        // 正常渲染组件
        it('should be rendered while attach', () => {
            let $swanAdFc = $component.querySelector('swan-ad-fc');
            expect($swanAdFc).not.toBe(null);
        });
    });

    describe('api test', () => {
        // 测试source url为空
        it('should trigger error when source url empty', done => {
            let component = buildComponentAdFc();
            component.on('binderror', handleError);
            attach2Document(component);

            function handleError(data) {
                expect(data.detail.err).toBe('source不能为空');
                done();
            }
        });

        // 测试source url不在白名单
        it('should trigger validation error when url not in allowedHosts', done => {
            let component = buildComponentAdFc(
                {
                    data: {
                        unitTestParams: {
                            callbackData: {
                                statusCode: 200,
                                data: '<div>html</div>'
                            }
                        }
                    }
                }
            );
            component.on('binderror', handleError);
            component.data.set('source', 'https://m.baidu.com');
            attach2Document(component);

            function handleError(data) {
                expect(data.detail.type).toBe('validation');
                done();
            }
        });

        // 测试url请求失败
        it('should trigger request error when request fail', done => {
            let component = buildComponentAdFc(
                {
                    data: {
                        unitTestParams: {
                            apiExecResult: 'fail',
                            callbackData: {
                                err: 'test'
                            }
                        }
                    }
                }
            );
            component.on('binderror', handleError);
            component.data.set('source', 'https://mipengine.baidu.com/smartapp?query=%E5%AD%90%E5%AE%AB%E8%82');
            attach2Document(component);

            function handleError(data) {
                expect(data.detail.type).toBe('request');
                done();
            }
        });

        // 测试url返回错误
        it('should trigger response error when response fail', done => {
            let component = buildComponentAdFc(
                {
                    data: {
                        unitTestParams: {
                            callbackData: {
                                statusCode: 500,
                                data: '<div>html</div>'
                            }
                        }
                    }
                }
            );
            component.on('binderror', handleError);
            component.data.set('source', 'https://mipengine.baidu.com/smartapp?query=%E5%AD%90%E5%AE%AB%E8%82');
            attach2Document(component);

            function handleError(data) {
                expect(data.detail.type).toBe('response');
                done();
            }
        });

        // 返回数据标签必须合法
        it('should trigger error when ads data has illegal tag', done => {
            let component = buildComponentAdFc(
                {
                    data: {
                        unitTestParams: {
                            callbackData: {
                                statusCode: 200,
                                data: '<script>alert("haha")</script>'
                            }
                        }
                    }
                }
            );
            component.on('binderror', handleError);
            component.data.set('source', 'https://mipengine.baidu.com/smartapp?query=%E5%AD%90%E5%AE%AB%E8%82');
            attach2Document(component);

            function handleError(data) {
                expect(data.detail.type).toBe('validation');
                done();
            }
        });

        // 返回数据属性必须合法
        it('should trigger error when ads data has onclick=""', done => {
            let component = buildComponentAdFc(
                {
                    data: {
                        unitTestParams: {
                            callbackData: {
                                statusCode: 200,
                                data: '<div onclick="haha();">测试<div>'
                            }
                        }
                    }
                }
            );
            component.on('binderror', handleError);
            component.data.set('source', 'https://mipengine.baidu.com/smartapp?query=%E5%AD%90%E5%AE%AB%E8%82');
            attach2Document(component);

            function handleError(data) {
                expect(data.detail.type).toBe('validation');
                done();
            }
        });

        // 点击广告元素应该可以跳转
        it('should open url when click ad dom', done => {
            let component = buildComponentAdFc({
                data: {
                    unitTestParams: {
                        callbackData: {
                            statusCode: 200,
                            data: adData
                        }
                    }
                }
            });
            component.data.set('source', 'https://mipengine.baidu.com/smartapp?query=%E5%AD%90%E5%AE%AB%E8%82');
            let $component = attach2Document(component);
            let $ad = $component.querySelector('.ec-fc-ad-results');
            expect($ad).not.toBe(null);

            window.scroll(0, $ad.getBoundingClientRect().top + 100);

            let spy = sinon.spy(component.boxjs.ui, 'open');
            component.nextTick(nextTick);

            function nextTick() {
                document.querySelector('.ec-fc-click').click();
                setTimeout(timeout, 50);
            }

            function timeout() {
                expect(spy.calledWith(sinon.match.has('name', 'swan-adWebPage'))).toBe(true);
                spy.restore();
                done();
            }
        });

        // 点击用户侧元素支持跳转
        it('should open url when click health dom', done => {
            let component = buildComponentAdFc({
                data: {
                    unitTestParams: {
                        callbackData: {
                            statusCode: 200,
                            data: healthData
                        }
                    }
                }
            });
            component.data.set('source', 'https://mipengine.baidu.com/smartapp?query=%E5%AD%90%E5%AE%AB%E8%82');
            attach2Document(component);

            let spy = sinon.spy(component.boxjs.ui, 'open');
            component.nextTick(nextTick);

            function nextTick() {
                document.querySelector('.swan-ad-fc-click').click();
                setTimeout(timeout, 50);
            }

            function timeout() {
                expect(spy.calledWith(sinon.match.has('name', 'swan-adWebPage'))).toBe(true);
                spy.restore();
                done();
            }
        });
    });
});
