/*
 * Standard Response Formatter
 */

const shortId = require('shortid');

const rootPrefix = '../..',
  Logger = require(rootPrefix + '/lib/logger/CustomConsoleLogger');

const logger = new Logger('Base');

/**
 * Result Class constructor
 *
 * @param {object} params - parameters object
 * @param {string} params.success_data - external error code
 * @param {object} params.error_config - optional debug params
 * @param {object} params.error_config.api_error_config - api error info
 * @param {object} params.error_config.param_error_config - param error info
 *
 * @return {result}
 */
const Result = function(params) {
  const oThis = this;

  oThis.data = params.success_data || {};
  oThis.apiErrorIdentifier = params.api_error_identifier;
  oThis.paramsErrorIdentifiers = params.params_error_identifiers;
  oThis.internalErrorCode = params.internal_error_identifier || 'base_default';

  params.error_config = params.error_config || {};
  oThis.paramErrorConfig = params.error_config.param_error_config || {};
  oThis.apiErrorConfig = params.error_config.api_error_config || {};
  oThis.debugOptions = params.debugOptions || {};

  oThis.goTo = params.go_to || {};

  oThis.success = typeof oThis.apiErrorIdentifier === 'undefined' || oThis.apiErrorIdentifier == null;
};

Result.prototype = {
  /**
   * method to check if the result is a success
   *
   * @returns {boolean}
   */
  isSuccess: function() {
    const oThis = this;

    return oThis.success;
  },

  /**
   * method to check if the result is a failure
   *
   * @returns {boolean}
   */
  isFailure: function() {
    const oThis = this;

    return !oThis.isSuccess();
  },

  /**
   * Overriding inspect of console
   * @param data
   */

  inspect: function(data) {
    const oThis = this;

    let result = null;

    if (oThis.isSuccess()) {
      logger.log('Formatted Result Object [SUCCESS]\n', oThis.toHash());
      result = oThis.toHash();
    } else {
      logger.log('Formatted Result Object [FAILURE]\n', oThis.getDebugData());
      result = oThis.getDebugData();
    }

    return result;
  },

  /**
   * converts the Result object to Hash object,
   * which can be passed to outside code not having knowledge of Result
   *
   * @param errorConfig - this is config of eror - contains keys
   * @param errorConfig.api_error_config - api error info
   * @param errorConfig.param_error_config - param error info
   *
   * @returns {object}
   */
  toHash: function(errorConfig) {
    const oThis = this;

    errorConfig = errorConfig || {};

    Object.assign(oThis.paramErrorConfig, errorConfig.param_error_config || {});
    Object.assign(oThis.apiErrorConfig, errorConfig.api_error_config || {});

    const apiErrInfo = oThis._fetchApiErrorInfo(),
      formattedData = {};

    if (!oThis.success) {
      formattedData.success = false;
      formattedData.err = {
        code: apiErrInfo.code,
        msg: apiErrInfo.message,
        error_data: oThis._fetchDetailedParamErrors(),
        internal_id: oThis.internalErrorCode || 'base_error'
      };

      if (oThis.goTo && Object.keys(oThis.goTo).length) {
        formattedData.go_to = oThis.goTo;
      }
    } else {
      formattedData.success = true;
      formattedData.data = oThis.data;

      if (oThis.goTo && Object.keys(oThis.goTo).length) {
        formattedData.go_to = oThis.goTo;
      }
    }

    return formattedData;
  },

  /**
   * converts the Result object to Hash object,
   * which can be passed to outside code not having knowledge of Result
   *
   * @param errorConfig - this is config of eror - contains keys
   * @param errorConfig.api_error_config - api error info
   * @param errorConfig.param_error_config - param error info
   *
   * @returns {object}
   */
  getDebugData: function(errorConfig) {
    const oThis = this;

    errorConfig = errorConfig || {};

    Object.assign(oThis.paramErrorConfig, errorConfig.param_error_config || {});
    Object.assign(oThis.apiErrorConfig, errorConfig.api_error_config || {});

    const apiErrInfo = oThis._fetchApiErrorInfo(),
      formattedData = {};

    if (!oThis.success) {
      formattedData.success = false;
      formattedData.err = {
        code: apiErrInfo.code,
        msg: apiErrInfo.message,
        error_data: oThis._fetchDetailedParamErrors(),
        internal_id: oThis.internalErrorCode || 'base_error',
        debugOptions: oThis.debugOptions
      };

      if (oThis.goTo && Object.keys(oThis.goTo).length) {
        formattedData.go_to = oThis.goTo;
      }
    } else {
      formattedData.success = true;
      formattedData.data = oThis.data;

      if (oThis.goTo && Object.keys(oThis.goTo).length) {
        formattedData.go_to = oThis.goTo;
      }
    }

    return formattedData;
  },

  /**
   * renderResponse - return the final response along with status
   *
   * @param responseObj - this is the response object for request
   * @param errorConfig - this is config of eror - contains keys
   * @param errorConfig.api_error_config - api error info
   * @param errorConfig.param_error_config - param error info
   */
  renderResponse: function(responseObj, errorConfig) {
    const oThis = this;

    errorConfig = errorConfig || {};

    const formattedResponse = oThis.toHash(errorConfig),
      status = oThis.success ? 200 : oThis._fetchHttpCode(errorConfig.api_error_config || {});

    return responseObj.status(status).json(formattedResponse);
  },

  /**
   * @private
   *
   * @returns {Array} - returns array of parameter level error messages.
   */
  _fetchDetailedParamErrors: function() {
    const oThis = this,
      detailedParamErrors = [];

    for (var i = 0; i < oThis.paramsErrorIdentifiers.length; i++) {
      let paramErrorIdentifier = oThis.paramsErrorIdentifiers[i];
      let errInfo = oThis._fetchParamErrorDetails(paramErrorIdentifier);
      detailedParamErrors.push({
        parameter: errInfo.parameter,
        msg: errInfo.message
      });
    }

    return detailedParamErrors;
  },

  /**
   * fetch API error details from Config
   *
   * @private
   *
   * @return {object}
   */
  _fetchApiErrorInfo: function() {
    const oThis = this;

    return (
      oThis.apiErrorConfig[oThis.apiErrorIdentifier] || {
        code: '',
        message: 'Something went wrong'
      }
    );
  },

  /**
   * fetch Param error details from Config
   *
   * @private
   *
   * @param {String} paramErrorCode - code using which details are to be fetched
   *
   * @return {object}
   */
  _fetchParamErrorDetails: function(paramErrorCode) {
    const oThis = this;

    return (
      oThis.paramErrorConfig[paramErrorCode] || {
        //TODO: Add defaults
        name: 'Something went wrong',
        message: 'Something went wrong'
      }
    );
  },

  /**
   * fetch response http code
   *
   * @private
   *
   * @param {object} apiErrorConfig - api error config
   *
   * @return {Number} - returns the http code
   */
  _fetchHttpCode: function(apiErrorConfig) {
    const oThis = this;

    Object.assign(oThis.apiErrorConfig, apiErrorConfig || {});

    return (oThis.apiErrorConfig[oThis.apiErrorIdentifier] || {}).http_code || '200';
  }
};

/**
 * ResponseHelper constructor
 *
 * @param {object} params - parameters object
 * @param {string} params.module_name - module name
 * @param {object} params.error_config - optional debug params
 * @param {object} params.error_config.api_error_config - api error info
 * @param {object} params.error_config.param_error_config - param error info
 *
 * @return {result}
 */
const ResponseHelper = function(params) {
  const oThis = this;

  oThis.moduleName = params.module_name || 'base';
};

/**
 * ResponseHelper - Helper Class for constructing the Result object and formatting it.
 */
ResponseHelper.prototype = {
  /**
   * Success with data
   *
   * @param {object} data - data to be sent with success result
   * @param {object} goTo - go to
   *
   * @return {result}
   */
  successWithData: function(data, goTo) {
    goTo = goTo || {};

    const resultParams = {
      success_data: data,
      go_to: goTo
    };

    return new Result(resultParams);
  },

  /**
   * Error result
   * @param {object} params - parameters object
   * @param {string} params.internal_error_identifier - internal error code
   * @param {string} params.api_error_identifier - external error code
   * @param {object} params.error_config - error_config
   * @param {object} params.debug_options - optional debug_options
   * @param {object} params.go_to - optional go_to
   *
   * @return {result}
   */
  error: function(params) {
    const oThis = this,
      internalErrorId = params.internal_error_identifier,
      apiErrorId = params.api_error_identifier,
      errorConfig = params.error_config || {},
      debugOptions = params.debug_options || {},
      err_code_for_log = oThis.moduleName + '(' + internalErrorId + ':' + shortId.generate() + ')',
      goTo = params.go_to || {};

    logger.error(
      'err_code_for_log: ',
      err_code_for_log,
      'internalErrorId: ',
      internalErrorId,
      'apiErrorId: ',
      apiErrorId,
      'debugOptions: ',
      debugOptions
    );

    const resultParams = {
      success_data: {},
      internal_error_identifier: internalErrorId,
      api_error_identifier: apiErrorId,
      params_error_identifiers: [],
      error_config: errorConfig,
      debugOptions: debugOptions,
      go_to: goTo
    };

    return new Result(resultParams);
  },

  /**
   * Param validation error result
   * @param {object} params - parameters object
   * @param {string} params.internal_error_identifier - internal error code
   * @param {string} params.api_error_identifier - external error code
   * @param {Array} params.params_error_identifiers - array having error identifier for params
   * @param {object} params.error_config - error_config
   * @param {object} params.debug_options - optional debug_options
   * @param {object} params.go_to - optional go_to
   *
   * @return {result}
   */
  paramValidationError: function(params) {
    const internalErrorId = params.internal_error_identifier,
      apiErrorId = params.api_error_identifier,
      paramsErrorIdentifiers = params.params_error_identifiers,
      errorConfig = params.error_config || {},
      debugOptions = params.debug_options || {},
      goTo = params.go_to || {};

    logger.error(
      'internalErrorId: ',
      internalErrorId,
      '\napiErrorId: ',
      apiErrorId,
      '\nparamsErrorIdentifiers: ',
      paramsErrorIdentifiers,
      '\ndebugOptions: ',
      debugOptions
    );

    const resultParams = {
      success_data: {},
      internal_error_identifier: internalErrorId,
      api_error_identifier: apiErrorId,
      params_error_identifiers: paramsErrorIdentifiers,
      error_config: errorConfig,
      go_to: goTo
    };

    return new Result(resultParams);
  },

  /**
   * return true if the object passed is of Result class
   *
   * @param {object} obj - object to check instanceof
   *
   * @return {boolean}
   */
  isCustomResult: function(obj) {
    return obj instanceof Result;
  }
};

module.exports = ResponseHelper;
