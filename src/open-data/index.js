/**
 * @file swan's file's base elements <open-data>
 * @author lvlei(lvlei03@baidu.com)
 */
import style from './index.css';
import {privateKey} from '../utils';
import {internalDataComputedCreator, typesCast} from '../computedCreator';

const GENDER_MAP = {
    'zh_CN': ['未知', '女', '男']
};

export default {

    behaviors: ['userTouchEvents', 'noNativeBehavior', 'nativeCover'],

    template: `<swan-open-data native="{{provideData.showNativeComponent}}" isempty="{{provideData.isEmpty}}">
        <span s-ref="value"
            class="avatar {{provideData.showDefaultAvatar ? '${style['default-avatar']}' : ''}}"
            style="{{!!provideData.value ? 'background-image: url(' + provideData.value + ')' : ''}}"
            s-if="__type === 'userAvatarUrl'"></span>
        <span s-ref="value"
            class="text"
            s-else>{{provideData.value}}</span>
    </swan-open-data>`,

    initData() {
        return {
            type: '',
            [privateKey]: {
                value: ' ',
                showDefaultAvatar: false, // 显示默认头像
                showNativeComponent: false,
                isEmpty: false
            }
        };
    },

    computed: {
        ...internalDataComputedCreator([
            {name: 'type', data: ['', 'userNickName', 'userAvatarUrl', 'userGender']},
            {name: 'hidden', caster: typesCast.boolCast}
        ]),

        /**
         * 创建私有属性，供模板使用
         * @return {Object} provideData
         */
        provideData() {
            return this.data.get(privateKey);
        }
    },

    // open-data NA 化的需求暂时下线
    // created() {
    //     const showNativeComponent = this.hasNativeParentComponent();
    //     this.data.set(`${privateKey}.showNativeComponent`, showNativeComponent);
    //     showNativeComponent && this.nextTick(() => {
    //         this.getUserInfo().then(value => {
    //             this.insertNativeCoverView(value);
    //         }).catch(value => {
    //             this.insertNativeCoverView(value);
    //         });
    //     });
    // },

    attached() {
        !this.data.get(`${privateKey}.showNativeComponent`) && this.getUserInfo();

        this.communicator.onMessage('openDataAccountChange', () => {
            this.getUserInfo();
        });
    },

    // open-data NA 化的需求暂时下线
    // detached() {
    //     this.data.get(`${privateKey}.showNativeComponent`) && this.removeNativeCoverView();
    // },

    /**
     * slaveUpdated open-data NA 化的需求暂时下线
     * @override
     */
    // slaveUpdated() {
    //     this.data.get(`${privateKey}.showNativeComponent`) && this.updateNativeCoverView();
    // },

    /**
     * 创建 NA 视图 open-data NA 化的需求暂时下线
     */
    // insertNativeCoverView() {
    //     const type = this.data.get('__type');
    //     const isAvatarUrl = type === 'userAvatarUrl';
    //     let value = this.data.get(`${privateKey}.value`);
    //     if (isAvatarUrl && value.length === 0) {
    //         value = 'headimg.png';
    //     }
    //     this.nextTick(() => {
    //         const params = {
    //             ...this.getParams(),
    //             position: {...this.getElementBox(this.ref('value'))},
    //             [isAvatarUrl ? 'src' : 'text']: value
    //         };
    //         this.isInserted = true;
    //         this.args = {
    //             ...params
    //         };
    //         this.insertNativeCover({
    //             name: isAvatarUrl ? 'coverimage' : 'coverview',
    //             params
    //         }).catch(() => {
    //             this.isInserted = false;
    //             this.args = null;
    //         });
    //     });
    // },

    /**
     * 更新 NA 视图 open-data NA 化的需求暂时下线
     */
    // updateNativeCoverView() {
    //     const type = this.data.get('__type');
    //     const isAvatarUrl = type === 'userAvatarUrl';
    //     let value = this.data.get(`${privateKey}.value`);
    //     if (isAvatarUrl && value.length === 0) {
    //         value = 'headimg.png';
    //     }
    //     this.nextTick(() => {
    //         if (this.el && this.isInserted) {
    //             const params = {
    //                 ...this.getParams(),
    //                 position: {...this.getElementBox(this.ref('value'))},
    //                 [isAvatarUrl ? 'src' : 'text']: value
    //             };
    //             const originArgs = {
    //                 ...this.args
    //             };
    //             if (!isEqualObject(params, this.args)) {
    //                 this.args = {
    //                     ...params
    //                 };
    //                 this.updateNativeCover({
    //                     name: isAvatarUrl ? 'coverimage' : 'coverview',
    //                     params
    //                 }).catch(() => {
    //                     this.args = originArgs;
    //                 });
    //             }
    //         }
    //     });
    // },

    /**
     * 删除 NA 视图 open-data NA 化的需求暂时下线
     */
    // removeNativeCoverView() {
    //     const type = this.data.get('__type');
    //     const isAvatarUrl = type === 'userAvatarUrl';
    //     if (this.isInserted) {
    //         const originArgs = {
    //             ...this.args
    //         };
    //         this.isInserted = false;
    //         this.args = null;
    //         this.removeNativeCover({
    //             name: isAvatarUrl ? 'coverimage' : 'coverview',
    //             params: {
    //                 slaveId: `${this.slaveId}`,
    //                 viewId: `${this.data.get('id')}`,
    //                 parentId: this.getFirstParentComponentId()
    //             }
    //         }).catch(() => {
    //             this.isInserted = true;
    //             this.args = originArgs;
    //         });
    //     }
    // },

    /**
     * 对性别状态进行转换
     * @param {number} [code] 性别code ( -1:未知 0:女 1:男)
     * @return {string} 性别类型(男|女|未知)
     */
    convertUserGender(code) {
        return GENDER_MAP['zh_CN'][+code + 1] || GENDER_MAP['zh_CN'][0];
    },

    /**
     * 获取用户信息
     * @param {string} [type] 组件对应type值
     * @param {Object} [data] 从端上返回经过解析的返回信息
     * @return {string} 返回对应type的用户信息
     */
    getValue(type, data) {
        // 组件type类型与端回传字段名做相应映射, 后续有其它类型在此处映射
        const openDataTypeMap = {
            userAvatarUrl: 'portrait',
            userNickName: 'displayname',
            userGender: 'gender'
        };
        let value = '未知';
        if (type === 'userGender') {
            value = this.convertUserGender(data.gender);
        } else if (type === 'userAvatarUrl') {
            const userAvatarUrl = data[openDataTypeMap[type]];
            // 是否显示默认头像
            if (!!userAvatarUrl) {
                value = userAvatarUrl;
            }
            this.data.set(`${privateKey}.showDefaultAvatar`, !!userAvatarUrl);
        } else {
            value = data[openDataTypeMap[type]];
        }
        return value;
    },

    privateGetUserInfo() {
        return new Promise((resolve, reject) => {
            this.boxjs.data.get({
                name: 'swan-baidu.privateGetUserInfo',
                data: {
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
    },

    /* 通过端能力获取用户信息 */
    getUserInfo() {
        let self = this;
        const type = this.data.get('__type');
        const isAvatarUrl = type === 'userAvatarUrl';
        const showNativeComponent = this.data.get(`${privateKey}.showNativeComponent`);
        return new Promise((resolve, reject) => {
            if (type === '') {
                self.data.set(`${privateKey}.isEmpty`, true);
                resolve('');
                showNativeComponent && self.communicator.fireMessage({
                    type: 'fullscreenchange',
                    data: {}
                });
                throw 'Invalid parameters';
            }
            self.data.set(`${privateKey}.isEmpty`, false);
            this.privateGetUserInfo().then(resData => {
                resData.data = resData.data || {};
                if (+resData.status === 0) {
                    self.data.set(`${privateKey}.value`, self.getValue(type, resData.data || {}));
                    resolve(self.data.get(`${privateKey}.value`));
                } else {
                    if (isAvatarUrl) {
                        self.data.set(`${privateKey}.showDefaultAvatar`, true);
                    }
                    const value = isAvatarUrl ? '' : '未知';
                    self.data.set(`${privateKey}.value`, value);
                    resolve(value);
                }
                showNativeComponent && self.communicator.fireMessage({
                    type: 'fullscreenchange',
                    data: {}
                });
            }).catch(err => {
                const value = isAvatarUrl ? '' : '未知';
                self.data.set(`${privateKey}.value`, value);
                reject(value);
                showNativeComponent && self.communicator.fireMessage({
                    type: 'fullscreenchange',
                    data: {}
                });
                console.error(err);
            });
        });
    }
};
