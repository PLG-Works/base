# Base provides advanced Promise Queue Manager, Custom Console Logger and other utilities.
![npm version](https://img.shields.io/npm/v/@plgworks/base.svg?style=flat)

# Install

```bash
npm install @plgworks/base --save
```

# PromiseQueueManager Usage
```js
const Base = require('@plgworks/base'),
  logger  = new Base.Logger("my_module_name");

const queueManagerOptions = {
  // Specify the name for easy identification in logs.
  name: "my_module_name_promise_queue"

  // resolvePromiseOnTimeout :: set this flag to false if you need custom handling.
  // By Default, the manager will neither resolve nor reject the Promise on time out.
  , resolvePromiseOnTimeout: false
  // The value to be passed to resolve when the Promise has timedout.
  , resolvedValueOnTimeout: null

  // rejectPromiseOnTimeout :: set this flag to true if you need custom handling.
  , rejectPromiseOnTimeout : false

  //  Pass timeoutInMilliSecs in options to set the timeout.
  //  If less than or equal to zero, timeout will not be observed.
  , timeoutInMilliSecs: 5000

  //  Pass maxZombieCount in options to set the max acceptable zombie count.
  //  When this zombie promise count reaches this limit, onMaxZombieCountReached will be triggered.
  //  If less than or equal to zero, onMaxZombieCountReached callback will not triggered.
  , maxZombieCount: 0

  //  Pass logInfoTimeInterval in options to log queue healthcheck information.
  //  If less than or equal to zero, healthcheck will not be logged.
  , logInfoTimeInterval : 0


  , onPromiseResolved: function ( resolvedValue, promiseContext ) {
    //onPromiseResolved will be executed when the any promise is resolved.
    //This callback method should be set by instance creator.
    //It can be set using options parameter in constructor.
    const oThis = this;

    logger.log(oThis.name, " :: a promise has been resolved. resolvedValue:", resolvedValue);
  }

  , onPromiseRejected: function ( rejectReason, promiseContext ) {
    //onPromiseRejected will be executed when the any promise is timedout.
    //This callback method should be set by instance creator.
    //It can be set using options parameter in constructor.
    const oThis = this;

    logger.log(oThis.name, " :: a promise has been rejected. rejectReason: ", rejectReason);
  }

  , onPromiseTimedout: function ( promiseContext ) {
    //onPromiseTimedout will be executed when the any promise is timedout.
    //This callback method should be set by instance creator.
    //It can be set using options parameter in constructor.
    const oThis = this;

    logger.log(oThis.name, ":: a promise has timed out.", promiseContext.executorParams);
  }

  , onMaxZombieCountReached: function () {
    //onMaxZombieCountReached will be executed when maxZombieCount >= 0 && current zombie count (oThis.zombieCount) >= maxZombieCount.
    //This callback method should be set by instance creator.
    //It can be set using options parameter in constructor.
    const oThis = this;

    logger.log(oThis.name, ":: maxZombieCount reached.");

  }

  , onPromiseCompleted: function ( promiseContext ) {
    //onPromiseCompleted will be executed when the any promise is removed from pendingPromise queue.
    //This callback method should be set by instance creator.
    //It can be set using options parameter in constructor.
    const oThis = this;

    logger.log(oThis.name, ":: a promise has been completed.");
  }  
  , onAllPromisesCompleted: function () {
    //onAllPromisesCompleted will be executed when the last promise in pendingPromise is resolved/rejected.
    //This callback method should be set by instance creator.
    //It can be set using options parameter in constructor.
    //Ideally, you should set this inside SIGINT/SIGTERM handlers.

    logger.log("Examples.allResolve :: onAllPromisesCompleted triggered");
    manager.logInfo();
  }
};


const promiseExecutor = function ( resolve, reject, params, promiseContext ) {
  //promiseExecutor
  setTimeout(function () {
    resolve( params.cnt ); // Try different things here.
  }, 1000);
};

const manager = new Base.CustomPromise.QueueManager( promiseExecutor, queueManagerOptions);

for( let cnt = 0; cnt < 5; cnt++ ) {
  manager.createPromise( {"cnt": (cnt + 1) } );
}

```


# Logger Usage
```js
const Base = require('@plgworks/base'),
  Logger  = Base.Logger,
  logger  = new Logger("my_module_name", Logger.LOG_LEVELS.TRACE);

//Log Level FATAL 
logger.notify("notify called");

//Log Level ERROR
logger.error("error called");

//Log Level WARN
logger.warn("warn called");

//Log Level INFO
logger.info("info Invoked");
logger.step("step Invoked");
logger.win("win called");

//Log Level DEBUG
logger.log("log called");
logger.debug("debug called");
logger.dir({ l1: { l2 : { l3Val: "val3", l3: { l4Val: { val: "val"  }}} }});

//Log Level TRACE
logger.trace("trace called");


```
All methods will be available for use irrespective of configured log level.
Log Level only controls what needs to be logged.

### Method to Log Level Map
| Method | Enabling  |
|        | Log Level |
| :----- | :-------- |
| notify | FATAL     |
| error  | ERROR     |
| warn   | WARN      |
| info   | INFO      |
| step   | INFO      |
| win    | INFO      |
| debug  | DEBUG     |
| log    | DEBUG     |
| dir    | DEBUG     |
| trace  | TRACE     |


# Response formatter usage

```js

const rootPrefix = '.',
  paramErrorConfig = require(rootPrefix + '/tests/mocha/lib/formatter/paramErrorConfig'),
  apiErrorConfig = require(rootPrefix + '/tests/mocha/lib/formatter/apiErrorConfig');

const Base = require('@plgworks/base'),
  ResponseHelper  = Base.responseHelper,
  responseHelper = new ResponseHelper({
      moduleName: 'companyRestFulApi'
  });
    
//using error function
responseHelper.error({
  internal_error_identifier: 's_vt_1', 
  api_error_identifier: 'test_1',
  debug_options: {id: 1234},
  error_config: {
    param_error_config: paramErrorConfig,
    api_error_config: apiErrorConfig   
  }
});
    
//using paramValidationError function
responseHelper.paramValidationError({
  internal_error_identifier:"s_vt_2", 
  api_error_identifier: "test_1", 
  params_error_identifiers: ["user_name_inappropriate"], 
  debug_options: {id: 1234},
  error_config: {
    param_error_config: paramErrorConfig,
    api_error_config: apiErrorConfig   
  }
});

// Result object is returned from responseHelper method invocations above, we can chain several methods as shown below
    
responseHelper.error({
  internal_error_identifier: 's_vt_1', 
  api_error_identifier: 'invalid_api_params',
  debug_options: {id: 1234},
  error_config: {
    param_error_config: paramErrorConfig,
    api_error_config: apiErrorConfig   
  }
}).isSuccess();

responseHelper.error({
  internal_error_identifier: 's_vt_1', 
  api_error_identifier: 'invalid_api_params',
  debug_options: {id: 1234},
  error_config: {
    param_error_config: paramErrorConfig,
    api_error_config: apiErrorConfig   
  }
}).isFailure();

responseHelper.error({
  internal_error_identifier: 's_vt_1', 
  api_error_identifier: 'invalid_api_params',
  debug_options: {id: 1234},
  error_config: {
    param_error_config: paramErrorConfig,
    api_error_config: apiErrorConfig   
  }
}).toHash();    
```

# Running test cases
```shell script
./node_modules/.bin/mocha --recursive "./tests/**/*.js"
```
