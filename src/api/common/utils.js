/* @flow */
'use strict';
const BigNumber = require('bignumber.js');
const core = require('../../core');
const errors = require('./errors');

type Amount = {currency: string, issuer: string, value: string}

function dropsToXrp(drops: string): string {
  return (new BigNumber(drops)).dividedBy(1000000.0).toString();
}

function xrpToDrops(xrp: string): string {
  return (new BigNumber(xrp)).times(1000000.0).floor().toString();
}

function toRippledAmount(amount: Amount): string|Amount {
  if (amount.currency === 'XRP') {
    return xrpToDrops(amount.value);
  }
  return {
    currency: amount.currency,
    issuer: amount.counterparty ? amount.counterparty : amount.issuer,
    value: amount.value
  };
}

type AsyncFunction = (...x: any) => void

function wrapCatch(asyncFunction: AsyncFunction): AsyncFunction {
  return function() {
    try {
      asyncFunction.apply(this, arguments);
    } catch (error) {
      const callback = arguments[arguments.length - 1];
      callback(error);
    }
  };
}

type Callback = (err: any, data: any) => void
type Wrapper = (data: any) => any

function composeAsync(wrapper: Wrapper, callback: Callback): Callback {
  return function(error, data) {
    if (error) {
      callback(error);
      return;
    }
    let result;
    try {
      result = wrapper(data);
    } catch (exception) {
      callback(exception);
      return;
    }
    callback(null, result);
  };
}

function convertExceptions<T>(f: () => T): () => T {
  return function() {
    try {
      return f.apply(this, arguments);
    } catch (error) {
      throw new errors.ApiError(error.message);
    }
  };
}

module.exports = {
  core,
  dropsToXrp,
  xrpToDrops,
  toRippledAmount,
  wrapCatch,
  composeAsync,
  convertExceptions
};