/**
 * @file index.js
 * @author yangzongjun@baidu.com
 */

import sinon from 'sinon';
import {
    datasetFilter,
    convertToCamelCase,
    sanComponentWalker,
    isDiffArray,
    isObject,
    isFunction,
    diff
} from '../../../src/utils/index';

describe('utils index', () => {
    it('datasetFilter', () => {
        let params = {
            'a': 1,
            'dataA': 2
        };
        let res = datasetFilter(params);
        expect(JSON.stringify(res)).toEqual('{"a":2}');
    });

    it('datasetFilter', () => {
        let params = 'data-a';
        let res = convertToCamelCase(params);
        expect(res).toEqual('dataA');
    });

    it('sanComponentWalker', () => {
        let params = {
            parentNode: {sanComponent: {}},
            tagName: 'body'
        };
        let res = sanComponentWalker(params);
        expect(JSON.stringify(res)).toEqual('{}');
    });

    it('sanComponentWalker', () => {
        let params = {
            parentNode: {sanComponent: {}},
            tagName: 'button'
        };
        let res = sanComponentWalker(params);
        expect(JSON.stringify(res)).toEqual('{}');
    });

    it('isDiffArray', () => {
        let arrA = [1, {b: 1}];
        let arrB = [1, {b: 1}];
        let key = 'b';

        let res = isDiffArray(arrA, arrB, key);
        expect(res).toEqual(false);
    });

    it('isObject', () => {
        let params = {};

        let res = isObject(params);
        expect(res).toBe(true);
    });

    it('isFunction', () => {
        let params = () => {};

        let res = isFunction(params);
        expect(res).toBe(true);
    });

    it('diff', () => {
        function ConstuctorFn() {
            return 'ConstuctorFn';
        }
        ConstuctorFn.prototype.e = 'prototypeE';

        let paramsA = {
            a: {},
            b: [],
            c: 1,
            d: 1
        };
        let paramsB = new ConstuctorFn();
        paramsB.a = [];
        paramsB.b = {};
        paramsB.c = 1;
        paramsB.d = undefined;

        let whiteList = ['e'];

        let res = diff(paramsA, paramsB, whiteList);
        expect(JSON.stringify(res)).toBe('{"a":{},"b":{},"e":"prototypeE"}');
    });

    it('diff', () => {
        let paramsA = {
            a: {},
            b: [],
            c: 1,
            d: 1
        };
        let paramsB = {

        };

        let res = diff(paramsA, paramsB);
        expect(JSON.stringify(res)).toBe('null');
    });
});
