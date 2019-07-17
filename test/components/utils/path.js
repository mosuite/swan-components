/**
 * @file path.js
 * @author yangzongjun@baidu.com
 */

import sinon from 'sinon';
import {
    pathResolver,
    absolutePathResolver,
    componentPathResolver
} from '../../../src/utils/path';

describe('utils path', () => {
    it('pathResolver', () => {
        let riginPath = '';
        let path = '../subpath';
        let errorCb = () => {};

        let res = pathResolver(riginPath, path, errorCb);
        expect(JSON.stringify(res)).toEqual('["subpath"]');
    });

    it('absolutePathResolver 开发者工具', () => {
        const stub = sinon.stub(window.navigator, 'userAgent').value('/swandevtools');
        let res = absolutePathResolver(
            '',
            '',
            '/百度开发者工具/swan/file'
        );
        expect(res).toEqual('/百度开发者工具/swan/file');
        stub.restore();
    });

    it('absolutePathResolver https', () => {
        let res = absolutePathResolver(
            'https://xxx:.com',
            '',
            '/百度开发者工具/swan/file'
        );
        expect(res).toEqual('https://xxx:/.com/百度开发者工具/swan/file');
    });

    it('componentPathResolver src not string', () => {
        let customComponentPath = '';
        let srcPath = 1;
        let res = componentPathResolver(
            customComponentPath,
            srcPath
        );
        expect(res).toEqual(srcPath);
    });

    it('componentPathResolver relative path', () => {
        let customComponentPath = '';
        let srcPath = './a';
        let res = componentPathResolver(
            customComponentPath,
            srcPath
        );
        expect(res).toEqual('/a');
    });

    it('componentPathResolver invalid path', () => {
        let customComponentPath = '';
        let srcPath = 'aaa';
        let res = componentPathResolver(
            customComponentPath,
            srcPath
        );
        expect(res).toEqual('aaa');
    });
});
