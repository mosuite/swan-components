import OpenData from '../../../src/open-data/index';
import buildComponent from '../../mock/swan-core/build-component';
import attach2Document from '../../utils/attach-to-document';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import sinon from 'sinon';
const COMPONENT_NAME = 'OpenData';
describe('component [' + COMPONENT_NAME + ']', () =>{
    const component = buildComponent(COMPONENT_NAME, OpenData);
    const $component = attach2Document(component);
    componentBaseFieldCheck(COMPONENT_NAME, component);
    it('should be rendered after attach', done =>{
        component.nextTick(() => {
            const $text = $component.querySelector('.text');
            expect($component).not.toBe(null);
            expect($text).not.toBe(null);
            done();
            component.dispose();
        });
    });
});
describe('fail checked', () => {
    const component7 = buildComponent(COMPONENT_NAME, OpenData, {
        data: {
            type: 'userAvatarUrl'
        }
    });
    // 重写 privateGetUserInfo 方法，使端能力中能够注入额外参数，以 mock 出未登录的 case
    component7.privateGetUserInfo = function () {
        return new Promise((resolve, reject) => {
            component7.boxjs.data.get({
                name: 'swan-baidu.privateGetUserInfo',
                data: {
                    unLogined: true,
                    callback(res) {
                        const resData = JSON.parse(res);
                        resData.data = resData.data || {};
                        resolve(resData);
                    },
                    test: 'fail'
                }
            }).catch(err => {
                reject(err);
            });
        });
    };
    const $component7 = attach2Document(component7);
    it('getdata fail check ', done => {
        component7.communicator.fireMessage({
            type: 'openDataAccountChange'
        });
        component7.nextTick(() => {
            const $avatar = $component7.querySelector('.avatar');
            expect($avatar).not.toBe(null);
            expect($avatar.getAttribute('style')).toBe('');
            done();
            component7.dispose();
        });
    });

});
describe('component [' + COMPONENT_NAME + ']', () =>{
    const component1 = buildComponent(COMPONENT_NAME, OpenData, {
        data: {
            type: 'userNickName'
        }
    });
    const $component1 = attach2Document(component1);
    it('should show user name while type is "userNickName"', done => {
        component1.nextTick(() => {
            expect($component1.querySelector('.text').innerHTML).toBe('测试用户');
            done();
            component1.dispose();
        });
    });

    const component2 = buildComponent(COMPONENT_NAME, OpenData, {
        data: {
            type: 'userGender'
        }
    });
    const $component2 = attach2Document(component2);
    it('should show user gender while type is "userGender"', done => {
        component2.nextTick(() => {
            expect($component2.querySelector('.text').innerHTML).toBe('男');
            done();
            component2.dispose();
        });
    });

    const component3 = buildComponent(COMPONENT_NAME, OpenData, {
        data: {
            type: 'userAvatarUrl'
        }
    });
    const $component3 = attach2Document(component3);
    it('should show user head portrait while type is "userAvatarUrl"', done => {
        component3.nextTick(() => {
            expect($component3.querySelector('.avatar')).not.toBe(null);
            done();
            component3.dispose();
        });
    });

    const component4 = buildComponent(COMPONENT_NAME, OpenData, {
        data: {
            type: 'userAvatarUrl'
        }
    });
    // 重写 privateGetUserInfo 方法，使端能力中能够注入额外参数，以 mock 出未登录的 case
    component4.privateGetUserInfo = function () {
        return new Promise((resolve, reject) => {
            component4.boxjs.data.get({
                name: 'swan-baidu.privateGetUserInfo',
                data: {
                    unLogined: true,
                    callback(res) {
                        const resData = JSON.parse(res);
                        resData.data = resData.data || {};
                        resolve(resData);
                    }
                }
            }).catch(err => {
                reject(err);
            });
        });
    };
    const $component4 = attach2Document(component4);
    it('should show user head portrait while type is "userAvatarUrl" when unlogined', done => {
        component4.nextTick(() => {
            const $avatar = $component4.querySelector('.avatar');
            expect($avatar).not.toBe(null);
            expect($avatar.getAttribute('style')).toBe('');
            done();
            component4.dispose();
        });
    });
});