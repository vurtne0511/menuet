/*!
 * Menuet.
 * Copyright(c) 2017-present LiveBridge Co., Ltd.
 */
'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Types = mongoose.Types;
const ObjectId = mongoose.Types.ObjectId;
const redis = require('redis');

const requireDir = require('../../utils/require-dir');
const injectArgs = require('../../utils/inject-args');
const camelCase = require('../../utils/string').camel;

const GET_MODEL = Symbol.for('getModel');
const CONFIG = Symbol.for('config');
const GET_STRING = Symbol.for('getString');
const GET_UTIL = Symbol.for('getUtil');
const VALIDATE_MODULE_NAME = Symbol.for('validateModuleName');
const MODULE_NAME = Symbol.for('moduleName');

/**
 * Load models.
 * @param {object} app
 * @param {string} modelsDir
 * @returns {Promise}
 */
module.exports = async (app, modelsDir) => {

  let models = {};

  /**
   * Get model by name.
   * @param {string} modelName
   * @returns {mongoose.Model}
   */
  app[GET_MODEL] = (modelName) => {
    return models[modelName];
  };

  if (!modelsDir) {
    return;
  }

  const getters = [
    (name) => {
      return ({
        Schema: Schema,
        ObjectId: ObjectId,
        Types: Types,
        $redis: redis.client,
        $config: app[CONFIG],
        $string: app[GET_STRING],
        $utils: require('../../utils')
      })[name];
    },
    app[GET_UTIL]
  ];

  await requireDir(modelsDir, '.js', (define, name, sourceDir) => {

    let moduleName = define[MODULE_NAME] || `${camelCase(name, true)}Model`;

    app[VALIDATE_MODULE_NAME](moduleName);

    let model = injectArgs.call(app, sourceDir, getters, define)();

    models[moduleName] = model.constructor === mongoose.Schema ? mongoose.model(moduleName, model) : model;
  });

};
