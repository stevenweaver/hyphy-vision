webpackJsonp([0],[
/* 0 */,
/* 1 */,
/* 2 */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function() {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		var result = [];
		for(var i = 0; i < this.length; i++) {
			var item = this[i];
			if(item[2]) {
				result.push("@media " + item[2] + "{" + item[1] + "}");
			} else {
				result.push(item[1]);
			}
		}
		return result.join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};


/***/ }),
/* 3 */,
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */


/**
 * WARNING: DO NOT manually require this module.
 * This is a replacement for `invariant(...)` used by the error code system
 * and will _only_ be required by the corresponding babel pass.
 * It always throws.
 */

function reactProdInvariant(code) {
  var argCount = arguments.length - 1;

  var message = 'Minified React error #' + code + '; visit ' + 'http://facebook.github.io/react/docs/error-decoder.html?invariant=' + code;

  for (var argIdx = 0; argIdx < argCount; argIdx++) {
    message += '&args[]=' + encodeURIComponent(arguments[argIdx + 1]);
  }

  message += ' for the full message or use the non-minified dev environment' + ' for full errors and additional helpful warnings.';

  var error = new Error(message);
  error.name = 'Invariant Violation';
  error.framesToPop = 1; // we don't care about reactProdInvariant's own frame

  throw error;
}

module.exports = reactProdInvariant;

/***/ }),
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _prodInvariant = __webpack_require__(4);

var DOMProperty = __webpack_require__(23);
var ReactDOMComponentFlags = __webpack_require__(98);

var invariant = __webpack_require__(1);

var ATTR_NAME = DOMProperty.ID_ATTRIBUTE_NAME;
var Flags = ReactDOMComponentFlags;

var internalInstanceKey = '__reactInternalInstance$' + Math.random().toString(36).slice(2);

/**
 * Check if a given node should be cached.
 */
function shouldPrecacheNode(node, nodeID) {
  return node.nodeType === 1 && node.getAttribute(ATTR_NAME) === String(nodeID) || node.nodeType === 8 && node.nodeValue === ' react-text: ' + nodeID + ' ' || node.nodeType === 8 && node.nodeValue === ' react-empty: ' + nodeID + ' ';
}

/**
 * Drill down (through composites and empty components) until we get a host or
 * host text component.
 *
 * This is pretty polymorphic but unavoidable with the current structure we have
 * for `_renderedChildren`.
 */
function getRenderedHostOrTextFromComponent(component) {
  var rendered;
  while (rendered = component._renderedComponent) {
    component = rendered;
  }
  return component;
}

/**
 * Populate `_hostNode` on the rendered host/text component with the given
 * DOM node. The passed `inst` can be a composite.
 */
function precacheNode(inst, node) {
  var hostInst = getRenderedHostOrTextFromComponent(inst);
  hostInst._hostNode = node;
  node[internalInstanceKey] = hostInst;
}

function uncacheNode(inst) {
  var node = inst._hostNode;
  if (node) {
    delete node[internalInstanceKey];
    inst._hostNode = null;
  }
}

/**
 * Populate `_hostNode` on each child of `inst`, assuming that the children
 * match up with the DOM (element) children of `node`.
 *
 * We cache entire levels at once to avoid an n^2 problem where we access the
 * children of a node sequentially and have to walk from the start to our target
 * node every time.
 *
 * Since we update `_renderedChildren` and the actual DOM at (slightly)
 * different times, we could race here and see a newer `_renderedChildren` than
 * the DOM nodes we see. To avoid this, ReactMultiChild calls
 * `prepareToManageChildren` before we change `_renderedChildren`, at which
 * time the container's child nodes are always cached (until it unmounts).
 */
function precacheChildNodes(inst, node) {
  if (inst._flags & Flags.hasCachedChildNodes) {
    return;
  }
  var children = inst._renderedChildren;
  var childNode = node.firstChild;
  outer: for (var name in children) {
    if (!children.hasOwnProperty(name)) {
      continue;
    }
    var childInst = children[name];
    var childID = getRenderedHostOrTextFromComponent(childInst)._domID;
    if (childID === 0) {
      // We're currently unmounting this child in ReactMultiChild; skip it.
      continue;
    }
    // We assume the child nodes are in the same order as the child instances.
    for (; childNode !== null; childNode = childNode.nextSibling) {
      if (shouldPrecacheNode(childNode, childID)) {
        precacheNode(childInst, childNode);
        continue outer;
      }
    }
    // We reached the end of the DOM children without finding an ID match.
     true ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Unable to find element with ID %s.', childID) : _prodInvariant('32', childID) : void 0;
  }
  inst._flags |= Flags.hasCachedChildNodes;
}

/**
 * Given a DOM node, return the closest ReactDOMComponent or
 * ReactDOMTextComponent instance ancestor.
 */
function getClosestInstanceFromNode(node) {
  if (node[internalInstanceKey]) {
    return node[internalInstanceKey];
  }

  // Walk up the tree until we find an ancestor whose instance we have cached.
  var parents = [];
  while (!node[internalInstanceKey]) {
    parents.push(node);
    if (node.parentNode) {
      node = node.parentNode;
    } else {
      // Top of the tree. This node must not be part of a React tree (or is
      // unmounted, potentially).
      return null;
    }
  }

  var closest;
  var inst;
  for (; node && (inst = node[internalInstanceKey]); node = parents.pop()) {
    closest = inst;
    if (parents.length) {
      precacheChildNodes(inst, node);
    }
  }

  return closest;
}

/**
 * Given a DOM node, return the ReactDOMComponent or ReactDOMTextComponent
 * instance, or null if the node was not rendered by this React.
 */
function getInstanceFromNode(node) {
  var inst = getClosestInstanceFromNode(node);
  if (inst != null && inst._hostNode === node) {
    return inst;
  } else {
    return null;
  }
}

/**
 * Given a ReactDOMComponent or ReactDOMTextComponent, return the corresponding
 * DOM node.
 */
function getNodeFromInstance(inst) {
  // Without this first invariant, passing a non-DOM-component triggers the next
  // invariant for a missing parent, which is super confusing.
  !(inst._hostNode !== undefined) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'getNodeFromInstance: Invalid argument.') : _prodInvariant('33') : void 0;

  if (inst._hostNode) {
    return inst._hostNode;
  }

  // Walk up the tree until we find an ancestor whose DOM node we have cached.
  var parents = [];
  while (!inst._hostNode) {
    parents.push(inst);
    !inst._hostParent ? process.env.NODE_ENV !== 'production' ? invariant(false, 'React DOM tree root should always have a node reference.') : _prodInvariant('34') : void 0;
    inst = inst._hostParent;
  }

  // Now parents contains each ancestor that does *not* have a cached native
  // node, and `inst` is the deepest ancestor that does.
  for (; parents.length; inst = parents.pop()) {
    precacheChildNodes(inst, inst._hostNode);
  }

  return inst._hostNode;
}

var ReactDOMComponentTree = {
  getClosestInstanceFromNode: getClosestInstanceFromNode,
  getInstanceFromNode: getInstanceFromNode,
  getNodeFromInstance: getNodeFromInstance,
  precacheChildNodes: precacheChildNodes,
  precacheNode: precacheNode,
  uncacheNode: uncacheNode
};

module.exports = ReactDOMComponentTree;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 9 */,
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var canUseDOM = !!(typeof window !== 'undefined' && window.document && window.document.createElement);

/**
 * Simple, lightweight module assisting with the detection and context of
 * Worker. Helps avoid circular dependencies and allows code to reason about
 * whether or not they are in a Worker, even if they never include the main
 * `ReactWorker` dependency.
 */
var ExecutionEnvironment = {

  canUseDOM: canUseDOM,

  canUseWorkers: typeof Worker !== 'undefined',

  canUseEventListeners: canUseDOM && !!(window.addEventListener || window.attachEvent),

  canUseViewport: canUseDOM && !!window.screen,

  isInWorker: !canUseDOM // For now, this is true - might change in the future.

};

module.exports = ExecutionEnvironment;

/***/ }),
/* 11 */,
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



// Trust the developer to only use ReactInstrumentation with a __DEV__ check

var debugTool = null;

if (process.env.NODE_ENV !== 'production') {
  var ReactDebugTool = __webpack_require__(211);
  debugTool = ReactDebugTool;
}

module.exports = { debugTool: debugTool };
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 13 */,
/* 14 */,
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _prodInvariant = __webpack_require__(4),
    _assign = __webpack_require__(7);

var CallbackQueue = __webpack_require__(102);
var PooledClass = __webpack_require__(26);
var ReactFeatureFlags = __webpack_require__(103);
var ReactReconciler = __webpack_require__(33);
var Transaction = __webpack_require__(52);

var invariant = __webpack_require__(1);

var dirtyComponents = [];
var updateBatchNumber = 0;
var asapCallbackQueue = CallbackQueue.getPooled();
var asapEnqueued = false;

var batchingStrategy = null;

function ensureInjected() {
  !(ReactUpdates.ReactReconcileTransaction && batchingStrategy) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'ReactUpdates: must inject a reconcile transaction class and batching strategy') : _prodInvariant('123') : void 0;
}

var NESTED_UPDATES = {
  initialize: function () {
    this.dirtyComponentsLength = dirtyComponents.length;
  },
  close: function () {
    if (this.dirtyComponentsLength !== dirtyComponents.length) {
      // Additional updates were enqueued by componentDidUpdate handlers or
      // similar; before our own UPDATE_QUEUEING wrapper closes, we want to run
      // these new updates so that if A's componentDidUpdate calls setState on
      // B, B will update before the callback A's updater provided when calling
      // setState.
      dirtyComponents.splice(0, this.dirtyComponentsLength);
      flushBatchedUpdates();
    } else {
      dirtyComponents.length = 0;
    }
  }
};

var UPDATE_QUEUEING = {
  initialize: function () {
    this.callbackQueue.reset();
  },
  close: function () {
    this.callbackQueue.notifyAll();
  }
};

var TRANSACTION_WRAPPERS = [NESTED_UPDATES, UPDATE_QUEUEING];

function ReactUpdatesFlushTransaction() {
  this.reinitializeTransaction();
  this.dirtyComponentsLength = null;
  this.callbackQueue = CallbackQueue.getPooled();
  this.reconcileTransaction = ReactUpdates.ReactReconcileTransaction.getPooled(
  /* useCreateElement */true);
}

_assign(ReactUpdatesFlushTransaction.prototype, Transaction, {
  getTransactionWrappers: function () {
    return TRANSACTION_WRAPPERS;
  },

  destructor: function () {
    this.dirtyComponentsLength = null;
    CallbackQueue.release(this.callbackQueue);
    this.callbackQueue = null;
    ReactUpdates.ReactReconcileTransaction.release(this.reconcileTransaction);
    this.reconcileTransaction = null;
  },

  perform: function (method, scope, a) {
    // Essentially calls `this.reconcileTransaction.perform(method, scope, a)`
    // with this transaction's wrappers around it.
    return Transaction.perform.call(this, this.reconcileTransaction.perform, this.reconcileTransaction, method, scope, a);
  }
});

PooledClass.addPoolingTo(ReactUpdatesFlushTransaction);

function batchedUpdates(callback, a, b, c, d, e) {
  ensureInjected();
  return batchingStrategy.batchedUpdates(callback, a, b, c, d, e);
}

/**
 * Array comparator for ReactComponents by mount ordering.
 *
 * @param {ReactComponent} c1 first component you're comparing
 * @param {ReactComponent} c2 second component you're comparing
 * @return {number} Return value usable by Array.prototype.sort().
 */
function mountOrderComparator(c1, c2) {
  return c1._mountOrder - c2._mountOrder;
}

function runBatchedUpdates(transaction) {
  var len = transaction.dirtyComponentsLength;
  !(len === dirtyComponents.length) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Expected flush transaction\'s stored dirty-components length (%s) to match dirty-components array length (%s).', len, dirtyComponents.length) : _prodInvariant('124', len, dirtyComponents.length) : void 0;

  // Since reconciling a component higher in the owner hierarchy usually (not
  // always -- see shouldComponentUpdate()) will reconcile children, reconcile
  // them before their children by sorting the array.
  dirtyComponents.sort(mountOrderComparator);

  // Any updates enqueued while reconciling must be performed after this entire
  // batch. Otherwise, if dirtyComponents is [A, B] where A has children B and
  // C, B could update twice in a single batch if C's render enqueues an update
  // to B (since B would have already updated, we should skip it, and the only
  // way we can know to do so is by checking the batch counter).
  updateBatchNumber++;

  for (var i = 0; i < len; i++) {
    // If a component is unmounted before pending changes apply, it will still
    // be here, but we assume that it has cleared its _pendingCallbacks and
    // that performUpdateIfNecessary is a noop.
    var component = dirtyComponents[i];

    // If performUpdateIfNecessary happens to enqueue any new updates, we
    // shouldn't execute the callbacks until the next render happens, so
    // stash the callbacks first
    var callbacks = component._pendingCallbacks;
    component._pendingCallbacks = null;

    var markerName;
    if (ReactFeatureFlags.logTopLevelRenders) {
      var namedComponent = component;
      // Duck type TopLevelWrapper. This is probably always true.
      if (component._currentElement.type.isReactTopLevelWrapper) {
        namedComponent = component._renderedComponent;
      }
      markerName = 'React update: ' + namedComponent.getName();
      console.time(markerName);
    }

    ReactReconciler.performUpdateIfNecessary(component, transaction.reconcileTransaction, updateBatchNumber);

    if (markerName) {
      console.timeEnd(markerName);
    }

    if (callbacks) {
      for (var j = 0; j < callbacks.length; j++) {
        transaction.callbackQueue.enqueue(callbacks[j], component.getPublicInstance());
      }
    }
  }
}

var flushBatchedUpdates = function () {
  // ReactUpdatesFlushTransaction's wrappers will clear the dirtyComponents
  // array and perform any updates enqueued by mount-ready handlers (i.e.,
  // componentDidUpdate) but we need to check here too in order to catch
  // updates enqueued by setState callbacks and asap calls.
  while (dirtyComponents.length || asapEnqueued) {
    if (dirtyComponents.length) {
      var transaction = ReactUpdatesFlushTransaction.getPooled();
      transaction.perform(runBatchedUpdates, null, transaction);
      ReactUpdatesFlushTransaction.release(transaction);
    }

    if (asapEnqueued) {
      asapEnqueued = false;
      var queue = asapCallbackQueue;
      asapCallbackQueue = CallbackQueue.getPooled();
      queue.notifyAll();
      CallbackQueue.release(queue);
    }
  }
};

/**
 * Mark a component as needing a rerender, adding an optional callback to a
 * list of functions which will be executed once the rerender occurs.
 */
function enqueueUpdate(component) {
  ensureInjected();

  // Various parts of our code (such as ReactCompositeComponent's
  // _renderValidatedComponent) assume that calls to render aren't nested;
  // verify that that's the case. (This is called by each top-level update
  // function, like setState, forceUpdate, etc.; creation and
  // destruction of top-level components is guarded in ReactMount.)

  if (!batchingStrategy.isBatchingUpdates) {
    batchingStrategy.batchedUpdates(enqueueUpdate, component);
    return;
  }

  dirtyComponents.push(component);
  if (component._updateBatchNumber == null) {
    component._updateBatchNumber = updateBatchNumber + 1;
  }
}

/**
 * Enqueue a callback to be run at the end of the current batching cycle. Throws
 * if no updates are currently being performed.
 */
function asap(callback, context) {
  !batchingStrategy.isBatchingUpdates ? process.env.NODE_ENV !== 'production' ? invariant(false, 'ReactUpdates.asap: Can\'t enqueue an asap callback in a context whereupdates are not being batched.') : _prodInvariant('125') : void 0;
  asapCallbackQueue.enqueue(callback, context);
  asapEnqueued = true;
}

var ReactUpdatesInjection = {
  injectReconcileTransaction: function (ReconcileTransaction) {
    !ReconcileTransaction ? process.env.NODE_ENV !== 'production' ? invariant(false, 'ReactUpdates: must provide a reconcile transaction class') : _prodInvariant('126') : void 0;
    ReactUpdates.ReactReconcileTransaction = ReconcileTransaction;
  },

  injectBatchingStrategy: function (_batchingStrategy) {
    !_batchingStrategy ? process.env.NODE_ENV !== 'production' ? invariant(false, 'ReactUpdates: must provide a batching strategy') : _prodInvariant('127') : void 0;
    !(typeof _batchingStrategy.batchedUpdates === 'function') ? process.env.NODE_ENV !== 'production' ? invariant(false, 'ReactUpdates: must provide a batchedUpdates() function') : _prodInvariant('128') : void 0;
    !(typeof _batchingStrategy.isBatchingUpdates === 'boolean') ? process.env.NODE_ENV !== 'production' ? invariant(false, 'ReactUpdates: must provide an isBatchingUpdates boolean attribute') : _prodInvariant('129') : void 0;
    batchingStrategy = _batchingStrategy;
  }
};

var ReactUpdates = {
  /**
   * React references `ReactReconcileTransaction` using this property in order
   * to allow dependency injection.
   *
   * @internal
   */
  ReactReconcileTransaction: null,

  batchedUpdates: batchedUpdates,
  enqueueUpdate: enqueueUpdate,
  flushBatchedUpdates: flushBatchedUpdates,
  injection: ReactUpdatesInjection,
  asap: asap
};

module.exports = ReactUpdates;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 16 */,
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = __webpack_require__(201);


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _assign = __webpack_require__(7);

var PooledClass = __webpack_require__(26);

var emptyFunction = __webpack_require__(13);
var warning = __webpack_require__(2);

var didWarnForAddedNewProperty = false;
var isProxySupported = typeof Proxy === 'function';

var shouldBeReleasedProperties = ['dispatchConfig', '_targetInst', 'nativeEvent', 'isDefaultPrevented', 'isPropagationStopped', '_dispatchListeners', '_dispatchInstances'];

/**
 * @interface Event
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var EventInterface = {
  type: null,
  target: null,
  // currentTarget is set when dispatching; no use in copying it here
  currentTarget: emptyFunction.thatReturnsNull,
  eventPhase: null,
  bubbles: null,
  cancelable: null,
  timeStamp: function (event) {
    return event.timeStamp || Date.now();
  },
  defaultPrevented: null,
  isTrusted: null
};

/**
 * Synthetic events are dispatched by event plugins, typically in response to a
 * top-level event delegation handler.
 *
 * These systems should generally use pooling to reduce the frequency of garbage
 * collection. The system should check `isPersistent` to determine whether the
 * event should be released into the pool after being dispatched. Users that
 * need a persisted event should invoke `persist`.
 *
 * Synthetic events (and subclasses) implement the DOM Level 3 Events API by
 * normalizing browser quirks. Subclasses do not necessarily have to implement a
 * DOM interface; custom application-specific events can also subclass this.
 *
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {*} targetInst Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @param {DOMEventTarget} nativeEventTarget Target node.
 */
function SyntheticEvent(dispatchConfig, targetInst, nativeEvent, nativeEventTarget) {
  if (process.env.NODE_ENV !== 'production') {
    // these have a getter/setter for warnings
    delete this.nativeEvent;
    delete this.preventDefault;
    delete this.stopPropagation;
  }

  this.dispatchConfig = dispatchConfig;
  this._targetInst = targetInst;
  this.nativeEvent = nativeEvent;

  var Interface = this.constructor.Interface;
  for (var propName in Interface) {
    if (!Interface.hasOwnProperty(propName)) {
      continue;
    }
    if (process.env.NODE_ENV !== 'production') {
      delete this[propName]; // this has a getter/setter for warnings
    }
    var normalize = Interface[propName];
    if (normalize) {
      this[propName] = normalize(nativeEvent);
    } else {
      if (propName === 'target') {
        this.target = nativeEventTarget;
      } else {
        this[propName] = nativeEvent[propName];
      }
    }
  }

  var defaultPrevented = nativeEvent.defaultPrevented != null ? nativeEvent.defaultPrevented : nativeEvent.returnValue === false;
  if (defaultPrevented) {
    this.isDefaultPrevented = emptyFunction.thatReturnsTrue;
  } else {
    this.isDefaultPrevented = emptyFunction.thatReturnsFalse;
  }
  this.isPropagationStopped = emptyFunction.thatReturnsFalse;
  return this;
}

_assign(SyntheticEvent.prototype, {
  preventDefault: function () {
    this.defaultPrevented = true;
    var event = this.nativeEvent;
    if (!event) {
      return;
    }

    if (event.preventDefault) {
      event.preventDefault();
      // eslint-disable-next-line valid-typeof
    } else if (typeof event.returnValue !== 'unknown') {
      event.returnValue = false;
    }
    this.isDefaultPrevented = emptyFunction.thatReturnsTrue;
  },

  stopPropagation: function () {
    var event = this.nativeEvent;
    if (!event) {
      return;
    }

    if (event.stopPropagation) {
      event.stopPropagation();
      // eslint-disable-next-line valid-typeof
    } else if (typeof event.cancelBubble !== 'unknown') {
      // The ChangeEventPlugin registers a "propertychange" event for
      // IE. This event does not support bubbling or cancelling, and
      // any references to cancelBubble throw "Member not found".  A
      // typeof check of "unknown" circumvents this issue (and is also
      // IE specific).
      event.cancelBubble = true;
    }

    this.isPropagationStopped = emptyFunction.thatReturnsTrue;
  },

  /**
   * We release all dispatched `SyntheticEvent`s after each event loop, adding
   * them back into the pool. This allows a way to hold onto a reference that
   * won't be added back into the pool.
   */
  persist: function () {
    this.isPersistent = emptyFunction.thatReturnsTrue;
  },

  /**
   * Checks if this event should be released back into the pool.
   *
   * @return {boolean} True if this should not be released, false otherwise.
   */
  isPersistent: emptyFunction.thatReturnsFalse,

  /**
   * `PooledClass` looks for `destructor` on each instance it releases.
   */
  destructor: function () {
    var Interface = this.constructor.Interface;
    for (var propName in Interface) {
      if (process.env.NODE_ENV !== 'production') {
        Object.defineProperty(this, propName, getPooledWarningPropertyDefinition(propName, Interface[propName]));
      } else {
        this[propName] = null;
      }
    }
    for (var i = 0; i < shouldBeReleasedProperties.length; i++) {
      this[shouldBeReleasedProperties[i]] = null;
    }
    if (process.env.NODE_ENV !== 'production') {
      Object.defineProperty(this, 'nativeEvent', getPooledWarningPropertyDefinition('nativeEvent', null));
      Object.defineProperty(this, 'preventDefault', getPooledWarningPropertyDefinition('preventDefault', emptyFunction));
      Object.defineProperty(this, 'stopPropagation', getPooledWarningPropertyDefinition('stopPropagation', emptyFunction));
    }
  }
});

SyntheticEvent.Interface = EventInterface;

if (process.env.NODE_ENV !== 'production') {
  if (isProxySupported) {
    /*eslint-disable no-func-assign */
    SyntheticEvent = new Proxy(SyntheticEvent, {
      construct: function (target, args) {
        return this.apply(target, Object.create(target.prototype), args);
      },
      apply: function (constructor, that, args) {
        return new Proxy(constructor.apply(that, args), {
          set: function (target, prop, value) {
            if (prop !== 'isPersistent' && !target.constructor.Interface.hasOwnProperty(prop) && shouldBeReleasedProperties.indexOf(prop) === -1) {
              process.env.NODE_ENV !== 'production' ? warning(didWarnForAddedNewProperty || target.isPersistent(), "This synthetic event is reused for performance reasons. If you're " + "seeing this, you're adding a new property in the synthetic event object. " + 'The property is never released. See ' + 'https://fb.me/react-event-pooling for more information.') : void 0;
              didWarnForAddedNewProperty = true;
            }
            target[prop] = value;
            return true;
          }
        });
      }
    });
    /*eslint-enable no-func-assign */
  }
}
/**
 * Helper to reduce boilerplate when creating subclasses.
 *
 * @param {function} Class
 * @param {?object} Interface
 */
SyntheticEvent.augmentClass = function (Class, Interface) {
  var Super = this;

  var E = function () {};
  E.prototype = Super.prototype;
  var prototype = new E();

  _assign(prototype, Class.prototype);
  Class.prototype = prototype;
  Class.prototype.constructor = Class;

  Class.Interface = _assign({}, Super.Interface, Interface);
  Class.augmentClass = Super.augmentClass;

  PooledClass.addPoolingTo(Class, PooledClass.fourArgumentPooler);
};

PooledClass.addPoolingTo(SyntheticEvent, PooledClass.fourArgumentPooler);

module.exports = SyntheticEvent;

/**
  * Helper to nullify syntheticEvent instance properties when destructing
  *
  * @param {object} SyntheticEvent
  * @param {String} propName
  * @return {object} defineProperty object
  */
function getPooledWarningPropertyDefinition(propName, getVal) {
  var isFunction = typeof getVal === 'function';
  return {
    configurable: true,
    set: set,
    get: get
  };

  function set(val) {
    var action = isFunction ? 'setting the method' : 'setting the property';
    warn(action, 'This is effectively a no-op');
    return val;
  }

  function get() {
    var action = isFunction ? 'accessing the method' : 'accessing the property';
    var result = isFunction ? 'This is a no-op function' : 'This is set to null';
    warn(action, result);
    return getVal;
  }

  function warn(action, result) {
    var warningCondition = false;
    process.env.NODE_ENV !== 'production' ? warning(warningCondition, "This synthetic event is reused for performance reasons. If you're seeing this, " + "you're %s `%s` on a released/nullified synthetic event. %s. " + 'If you must keep the original synthetic event around, use event.persist(). ' + 'See https://fb.me/react-event-pooling for more information.', action, propName, result) : void 0;
  }
}
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(d3, jQuery) {

var root = undefined;
var datamonkey = function datamonkey() {};

var $ = __webpack_require__(3);

if (true) {
  if (typeof module !== "undefined" && module.exports) {
    exports = module.exports = datamonkey;
  }
  exports.datamonkey = datamonkey;
} else {
  root.datamonkey = datamonkey;
}

datamonkey.errorModal = function (msg) {
  $("#modal-error-msg").text(msg);
  $("#errorModal").modal();
};

function b64toBlob(b64, onsuccess, onerror) {
  var img = new Image();

  img.onerror = onerror;

  img.onload = function onload() {
    var canvas = document.getElementById("hyphy-chart-canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(onsuccess);
  };

  img.src = b64;
}

datamonkey.export_csv_button = function (data) {
  data = d3.csv.format(data);
  if (data !== null) {
    var pom = document.createElement("a");
    pom.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(data));
    pom.setAttribute("download", "export.csv");
    pom.className = "btn btn-default btn-sm";
    pom.innerHTML = '<span class="glyphicon glyphicon-floppy-save"></span> Download CSV';
    $("body").append(pom);
    pom.click();
    pom.remove();
  }
};

datamonkey.save_image = function (type, container) {
  var prefix = {
    xmlns: "http://www.w3.org/2000/xmlns/",
    xlink: "http://www.w3.org/1999/xlink",
    svg: "http://www.w3.org/2000/svg"
  };

  function get_styles(doc) {
    function process_stylesheet(ss) {
      try {
        if (ss.cssRules) {
          for (var i = 0; i < ss.cssRules.length; i++) {
            var rule = ss.cssRules[i];
            if (rule.type === 3) {
              // Import Rule
              process_stylesheet(rule.styleSheet);
            } else {
              // hack for illustrator crashing on descendent selectors
              if (rule.selectorText) {
                if (rule.selectorText.indexOf(">") === -1) {
                  styles += "\n" + rule.cssText;
                }
              }
            }
          }
        }
      } catch (e) {
        //console.log("Could not process stylesheet : " + ss);
      }
    }

    var styles = "",
        styleSheets = doc.styleSheets;

    if (styleSheets) {
      for (var i = 0; i < styleSheets.length; i++) {
        process_stylesheet(styleSheets[i]);
      }
    }

    return styles;
  }

  var svg = $(container).find("svg")[0];
  if (!svg) {
    svg = $(container)[0];
  }

  var styles = get_styles(window.document);

  svg.setAttribute("version", "1.1");

  var defsEl = document.createElement("defs");
  svg.insertBefore(defsEl, svg.firstChild);

  var styleEl = document.createElement("style");
  defsEl.appendChild(styleEl);
  styleEl.setAttribute("type", "text/css");

  // removing attributes so they aren't doubled up
  svg.removeAttribute("xmlns");
  svg.removeAttribute("xlink");

  // These are needed for the svg
  if (!svg.hasAttributeNS(prefix.xmlns, "xmlns")) {
    svg.setAttributeNS(prefix.xmlns, "xmlns", prefix.svg);
  }

  if (!svg.hasAttributeNS(prefix.xmlns, "xmlns:xlink")) {
    svg.setAttributeNS(prefix.xmlns, "xmlns:xlink", prefix.xlink);
  }

  var source = new XMLSerializer().serializeToString(svg).replace("</style>", "<![CDATA[" + styles + "]]></style>");
  var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
  var to_download = [doctype + source];
  var image_string = "data:image/svg+xml;base66," + encodeURIComponent(to_download);

  if (type == "png") {
    b64toBlob(image_string, function (blob) {
      var url = window.URL.createObjectURL(blob);
      var pom = document.createElement("a");
      pom.setAttribute("download", "image.png");
      pom.setAttribute("href", url);
      $("body").append(pom);
      pom.click();
      pom.remove();
    }, function (error) {
      // handle error
    });
  } else {
    var pom = document.createElement("a");
    pom.setAttribute("download", "image.svg");
    pom.setAttribute("href", image_string);
    $("body").append(pom);
    pom.click();
    pom.remove();
  }
};

datamonkey.validate_date = function () {
  // Check that it is not empty
  if ($(this).val().length === 0) {
    $(this).next(".help-block").remove();
    $(this).parent().removeClass("has-success");
    $(this).parent().addClass("has-error");

    jQuery("<span/>", {
      class: "help-block",
      text: "Field is empty"
    }).insertAfter($(this));
  } else if (isNaN(Date.parse($(this).val()))) {
    $(this).next(".help-block").remove();
    $(this).parent().removeClass("has-success");
    $(this).parent().addClass("has-error");

    jQuery("<span/>", {
      class: "help-block",
      text: "Date format should be in the format YYYY-mm-dd"
    }).insertAfter($(this));
  } else {
    $(this).parent().removeClass("has-error");
    $(this).parent().addClass("has-success");
    $(this).next(".help-block").remove();
  }
};

$(document).ready(function () {
  $(function () {
    $('[data-toggle="tooltip"]').tooltip();
  });
  $("#datamonkey-header").collapse();

  var initial_padding = $("body").css("padding-top");

  $("#collapse_nav_bar").on("click", function (e) {
    $("#datamonkey-header").collapse("toggle");
    $(this).find("i").toggleClass("fa-times-circle fa-eye");
    var new_padding = $("body").css("padding-top") == initial_padding ? "5px" : initial_padding;
    d3.select("body").transition().style("padding-top", new_padding);
  });
});
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6), __webpack_require__(3)))

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function($) {

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var React = __webpack_require__(5),
    _ = __webpack_require__(9),
    d3 = __webpack_require__(6),
    datamonkey = __webpack_require__(19);

__webpack_require__(198);

var DatamonkeyTableRow = React.createClass({
  displayName: "DatamonkeyTableRow",

  /**
      A single table row
       *rowData* is an array of cells
          each cell can be one of
              1. string: simply render the text as shown
              2. object: a polymorphic case; can be rendered directly (if the object is a valid react.js element)
                 or via a transformation of the value associated with the key 'value'
                  supported keys
                  2.1. 'value' : the value to use to generate cell context
                  2.2. 'format' : the function (returning something react.js can render directly) that will be called
                  to transform 'value' into the object to be rendered
                  2.3. 'span' : colSpan attribute
                  2.4. 'style': CSS style attributes (JSX specification, i.e. {margin-top: '1em'} and not a string)
                  2.5. 'classes': CSS classes to apply to the cell
                  2.6. 'abbr': wrap cell value in <abbr> tags
               3. array: directly render array elements in the cell (must be renderable to react.js; note that plain
              text elements will be wrapped in "span" which is not allowed to nest in <th/td>
        *header* is a bool indicating whether the header is a header row (th cells) or a regular row (td cells)
  */

  /*propTypes: {
   rowData: React.PropTypes.arrayOf (React.PropTypes.oneOfType ([React.PropTypes.string,React.PropTypes.number,React.PropTypes.object,React.PropTypes.array])).isRequired,
   header:  React.PropTypes.bool,
  },*/

  dm_compareTwoValues: function dm_compareTwoValues(a, b) {
    /* this should be made static */

    /**
        compare objects by iterating over keys
         return 0 : equal
               1 : a < b
               2 : a > b
               -1 : cannot be compared
               -2 : not compared, but could contain 'value' objects that could be compared
    */

    var myType = typeof a === "undefined" ? "undefined" : _typeof(a),
        self = this;

    if (myType == (typeof b === "undefined" ? "undefined" : _typeof(b))) {
      // Parse as float if possible
      var parsed_a = parseFloat(a);
      var parsed_b = parseFloat(b);

      a = _.isNaN(parsed_a) ? a : parsed_a;
      b = _.isNaN(parsed_b) ? b : parsed_b;

      // If it's a string or number, it can be sorted with a simple greater than
      if (myType == "string" || myType == "number") {
        return a == b ? 0 : a > b ? 2 : 1;
      }

      if (_.isArray(a) && _.isArray(b)) {
        if (a.length != b.length) {
          return a.length > b.length ? 2 : 1;
        }

        var comparison_result = 0;

        _.every(a, function (c, i) {
          var comp = self.dm_compareTwoValues(c, b[i]);
          if (comp != 0) {
            comparison_result = comp;
            return false;
          }
          return true;
        });

        return comparison_result;
      }

      return -2;
      // further check to see if 'this' has a "value" attribute
    }
    return -1;
  },

  dm_compareTwoValues_level2: function dm_compareTwoValues_level2(a, b) {
    var compare = this.dm_compareTwoValues(a, b);

    if (compare == -2) {
      if (_.has(a, "value") && _.has(b, "value")) {
        return this.dm_compareTwoValues(a.value, b.value);
      }
    }

    return compare;
  },

  dm_log100times: _.before(100, function (v) {
    return 0;
  }),

  getInitialState: function getInitialState() {
    return {
      header: []
    };
  },

  shouldComponentUpdate: function shouldComponentUpdate(nextProps) {

    var self = this;

    if (this.state.header !== nextProps.header) {
      return true;
    }

    if (this.props.sortOn != nextProps.sortOn) {
      return true;
    }

    var result = _.some(this.props.rowData, function (value, index) {

      // check for format and other field equality
      if (!_.isMatch(value, nextProps.rowData[index])) {
        return true;
      }

      if (value === nextProps.rowData[index]) {
        return false;
      }

      if (value === nextProps.rowData[index]) {
        return false;
      }

      var compare = self.dm_compareTwoValues_level2(value, nextProps.rowData[index]);
      if (compare >= 0) {
        if (compare == 0) {
          // values match, compare properties
          var existing_keys = _.keys(value),
              new_keys = _.keys(nextProps.rowData[index]),
              shared = _.intersection(existing_keys, new_keys);

          if (shared.length < new_keys.length || shared.length < existing_keys.length) {
            return true;
          }

          return false;
        } else {
          return true;
        }
      }

      return true;
    });

    return result;
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    this.setState({
      header: nextProps.header
    });
  },

  render: function render() {
    var entity_regex = /(&*;)|(<*>)/;
    return React.createElement(
      "tr",
      null,
      this.props.rowData.map(_.bind(function (cell, index) {
        var value = _.has(cell, "value") ? cell.value : cell;

        if (_.isArray(value)) {
          if (!_.has(cell, "format")) {
            return value;
          }
        } else {
          if (_.isObject(value)) {
            if (!React.isValidElement(value)) {
              return null;
            }
          }
        }

        if (_.has(cell, "format")) {
          value = cell.format(value);
        }

        if (_.has(cell, "abbr")) {
          value = entity_regex.test(value) ? React.createElement("span", {
            "data-toggle": "tooltip",
            "data-placement": "top",
            "data-html": "true",
            title: cell.abbr,
            dangerouslySetInnerHTML: { __html: value }
          }) : React.createElement(
            "span",
            {
              "data-toggle": "tooltip",
              "data-placement": "top",
              "data-html": "true",
              title: cell.abbr
            },
            value
          );
        }

        var cellProps = { key: index };

        if (_.has(cell, "span")) {
          cellProps["colSpan"] = cell.span;
        }

        if (_.has(cell, "style")) {
          cellProps["style"] = cell.style;
        }

        if (_.has(cell, "tooltip")) {
          cellProps["title"] = cell.tooltip;
          //this.dm_log100times (cellProps);
        }

        if (_.has(cell, "classes")) {
          cellProps["className"] = cell.classes;
        }

        if (this.state.header && this.props.sorter) {
          if (_.has(cell, "sortable")) {
            cellProps["onClick"] = _.partial(this.props.sorter, index, this.dm_compareTwoValues_level2);

            var sortedness_state = "fa fa-sort";
            if (this.props.sortOn && this.props.sortOn[0] == index) {
              sortedness_state = this.props.sortOn[1] ? "fa fa-sort-amount-asc" : "fa fa-sort-amount-desc";
            }

            value = React.createElement(
              "div",
              null,
              value,
              React.createElement("i", {
                className: sortedness_state,
                "aria-hidden": "true",
                style: { marginLeft: "0.5em" }
              })
            );
          }
        }

        return React.createElement(this.state.header ? "th" : "td", cellProps, value);
      }, this))
    );
  }
});

/**
 * A table composed of rows
 * @param *headerData* -- an array of cells (see DatamonkeyTableRow) to render as the header
 * @param *bodyData* -- an array of arrays of cells (rows) to render
 * @param *classes* -- CSS classes to apply to the table element
 * @example
 * header = ["Model","AIC","Parameters"]
 * rows = [[{"value":"MG94","style":{"fontVariant":"small-caps"}},{"value":0},46],
 *         [{"value":"Full model","style":{"fontVariant":"small-caps"}},{"value":6954.016129926898},60]]
 */
var DatamonkeyTable = React.createClass({
  displayName: "DatamonkeyTable",

  getDefaultProps: function getDefaultProps() {
    return {
      classes: "dm-table table table-condensed table-hover",
      rowHash: null
    };
  },

  getInitialState: function getInitialState() {
    // either null or [index,
    // bool / to indicate if the sort is ascending (True) or descending (False)]

    var len = 0;

    if (this.props.bodyData) {
      len = this.props.bodyData.length;
    }

    return {
      rowOrder: _.range(0, len),
      headerData: this.props.headerData,
      sortOn: this.props.initialSort ? [this.props.initialSort, true] : null,
      current: 0
    };
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    this.setState({
      rowOrder: _.range(0, nextProps.bodyData.length),
      headerData: nextProps.headerData
    });
  },

  regress: function regress() {
    if (this.state.current >= this.props.paginate) {
      this.setState({
        current: this.state.current - this.props.paginate
      });
    } else {
      this.setState({
        current: 0
      });
    }
  },

  decrement: function decrement() {
    if (this.state.current > 0) {
      var new_current = this.state.current - 1;
      this.setState({
        current: new_current
      });
    }
  },

  increment: function increment() {
    if (this.state.current < this.state.rowOrder.length - this.props.paginate) {
      var new_current = this.state.current + 1;
      this.setState({
        current: new_current
      });
    }
  },

  advance: function advance() {
    if (this.state.current < this.state.rowOrder.length - 2 * this.props.paginate) {
      this.setState({
        current: this.state.current + this.props.paginate
      });
    } else {
      this.setState({
        current: this.state.rowOrder.length - this.props.paginate
      });
    }
  },

  dm_sortOnColumn: function dm_sortOnColumn(index, compare_function) {
    var self = this;
    var is_ascending = true;
    if (this.state.sortOn && this.state.sortOn[0] == index) {
      is_ascending = !this.state.sortOn[1];
    }

    var new_order = _.map(this.state.rowOrder, _.identity).sort(function (i, j) {
      var comp_value = compare_function(self.props.bodyData[i][index], self.props.bodyData[j][index]);
      if (comp_value > 0) {
        return is_ascending ? 2 * comp_value - 3 : 3 - 2 * comp_value;
      }
      return 0;
    });

    if (_.some(new_order, function (value, index) {
      return value != self.state.rowOrder[index];
    })) {
      this.setState({
        rowOrder: new_order
      });
    }
    this.setState({
      sortOn: [index, is_ascending]
    });
  },

  componentDidMount: function componentDidMount() {},

  componentDidUpdate: function componentDidUpdate() {
    $('[data-toggle="tooltip"]').tooltip();
  },

  render: function render() {
    var children = [];
    var self = this,
        paginatorControls,
        button,
        rowIndices,
        upperLimit = Math.min(this.state.current + this.props.paginate, this.state.rowOrder.length);

    if (this.props.paginate) {
      if (this.props.export_csv) {
        var exportCSV = function exportCSV() {
          function extract(d) {
            return _.isObject(d) ? d.value : d;
          }
          var headers = _.map(self.props.headerData, extract),
              munged = _.map(self.props.bodyData, function (row) {
            return _.map(row, extract);
          }).map(function (row) {
            return _.object(headers, row);
          }),
              exporter = Export.create();
          exporter.downloadCsv(munged);
        };
        button = React.createElement(
          "button",
          {
            id: "export-csv",
            type: "button",
            className: "btn btn-default btn-sm pull-right",
            onClick: exportCSV
          },
          React.createElement("span", { className: "glyphicon glyphicon-floppy-save" }),
          " Export Table to CSV"
        );
      }
      paginatorControls = React.createElement(
        "div",
        null,
        React.createElement(
          "div",
          { className: "col-md-6" },
          React.createElement(
            "p",
            null,
            "Showing entries ",
            this.state.current + 1,
            " through ",
            upperLimit,
            " out of ",
            this.state.rowOrder.length,
            "."
          )
        ),
        React.createElement(
          "div",
          { className: "col-md-3" },
          button
        ),
        React.createElement(
          "div",
          { className: "col-md-3" },
          React.createElement(
            "div",
            {
              className: "btn-group btn-group-justified",
              role: "group",
              "aria-label": "..."
            },
            React.createElement(
              "div",
              { className: "btn-group", role: "group" },
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "btn btn-default",
                  onClick: self.regress,
                  "data-toggle": "tooltip",
                  title: "Move backwards " + this.props.paginate + " rows."
                },
                React.createElement("span", {
                  className: "glyphicon glyphicon-backward",
                  "aria-hidden": "true"
                })
              )
            ),
            React.createElement(
              "div",
              { className: "btn-group", role: "group" },
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "btn btn-default",
                  onClick: self.decrement,
                  "data-toggle": "tooltip",
                  title: "Move backwards one row."
                },
                React.createElement("span", {
                  className: "glyphicon glyphicon-chevron-left",
                  "aria-hidden": "true"
                })
              )
            ),
            React.createElement(
              "div",
              { className: "btn-group", role: "group" },
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "btn btn-default",
                  onClick: self.increment,
                  "data-toggle": "tooltip",
                  title: "Move forwards one row."
                },
                React.createElement("span", {
                  className: "glyphicon glyphicon-chevron-right",
                  "aria-hidden": "true"
                })
              )
            ),
            React.createElement(
              "div",
              { className: "btn-group", role: "group" },
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "btn btn-default",
                  onClick: self.advance,
                  "data-toggle": "tooltip",
                  title: "Move forwards " + this.props.paginate + " rows."
                },
                React.createElement("span", {
                  className: "glyphicon glyphicon-forward",
                  "aria-hidden": "true"
                })
              )
            )
          )
        )
      );
    } else {
      paginatorControls = "";
    }

    if (this.state.headerData) {
      // check if header will be multiple rows by checking if headerData is an array of arrays
      if (_.isArray(this.props.headerData[0])) {
        children.push(React.createElement(
          "thead",
          { key: 0 },
          _.map(this.state.headerData, function (row, index) {
            return React.createElement(DatamonkeyTableRow, {
              rowData: row,
              header: true,
              key: index,
              sorter: _.bind(self.dm_sortOnColumn, self),
              sortOn: self.state.sortOn
            });
          })
        ));
      } else {
        children.push(React.createElement(
          "thead",
          { key: 0 },
          React.createElement(DatamonkeyTableRow, {
            rowData: this.state.headerData,
            header: true,
            sorter: _.bind(self.dm_sortOnColumn, self),
            sortOn: self.state.sortOn
          })
        ));
      }
    }
    if (this.props.paginate) {
      rowIndices = this.state.rowOrder.slice(this.state.current, this.state.current + this.props.paginate);
    } else {
      rowIndices = this.state.rowOrder;
    }
    children.push(React.createElement("tbody", {
      key: 1
    }, _.map(rowIndices, _.bind(function (row_index) {
      var componentData = this.props.bodyData[row_index];

      return React.createElement(DatamonkeyTableRow, {
        rowData: componentData,
        key: this.props.rowHash ? this.props.rowHash(componentData) : row_index,
        header: false
      });
    }, this))));
    return React.createElement(
      "div",
      { className: "row" },
      paginatorControls,
      React.createElement(
        "div",
        { className: "col-md-12" },
        React.createElement(
          "table",
          { className: this.props.classes },
          children
        )
      )
    );
  }
});

var DatamonkeyRateDistributionTable = React.createClass({
  displayName: "DatamonkeyRateDistributionTable",

  /** render a rate distribution table from JSON formatted like this
  {
       "non-synonymous/synonymous rate ratio for *background*":[ // name of distribution
        [0.1701428265961598, 1] // distribution points (rate, weight)
        ],
       "non-synonymous/synonymous rate ratio for *test*":[
        [0.1452686330406915, 1]
        ]
  }
   */

  propTypes: {
    distribution: React.PropTypes.object.isRequired
  },

  dm_formatterRate: d3.format(".3r"),
  dm_formatterProp: d3.format(".3p"),

  dm_createDistributionTable: function dm_createDistributionTable(jsonRates) {
    var rowData = [];
    var self = this;
    _.each(jsonRates, function (value, key) {
      rowData.push([{
        value: key,
        span: 3,
        classes: "info"
      }]);
      _.each(value, function (rate, index) {
        rowData.push([{
          value: rate[1],
          format: self.dm_formatterProp
        }, "@", {
          value: rate[0],
          format: self.dm_formatterRate
        }]);
      });
    });
    return rowData;
  },

  render: function render() {
    return React.createElement(DatamonkeyTable, {
      bodyData: this.dm_createDistributionTable(this.props.distribution),
      classes: "table table-condensed"
    });
  }
});

var DatamonkeyPartitionTable = React.createClass({
  displayName: "DatamonkeyPartitionTable",

  dm_formatterFloat: d3.format(".3r"),
  dm_formatterProp: d3.format(".3p"),

  propTypes: {
    trees: React.PropTypes.object.isRequired,
    partitions: React.PropTypes.object.isRequired,
    branchAttributes: React.PropTypes.object.isRequired,
    siteResults: React.PropTypes.object.isRequired,
    accessorNegative: React.PropTypes.func.isRequired,
    accessorPositive: React.PropTypes.func.isRequired,
    pValue: React.PropTypes.number.isRequired
  },

  dm_computePartitionInformation: function dm_computePartitionInformation(trees, partitions, attributes, pValue) {
    var partitionKeys = _.sortBy(_.keys(partitions), function (v) {
      return v;
    }),
        matchingKey = null,
        self = this;

    var extractBranchLength = this.props.extractOn || _.find(attributes.attributes, function (value, key) {
      matchingKey = key;
      return value["attribute type"] == "branch length";
    });
    if (matchingKey) {
      extractBranchLength = matchingKey;
    }

    return _.map(partitionKeys, function (key, index) {
      var treeBranches = trees.tested[key],
          tested = {};

      _.each(treeBranches, function (value, key) {
        if (value == "test") tested[key] = 1;
      });

      var testedLength = extractBranchLength ? datamonkey.helpers.sum(attributes[key], function (v, k) {
        if (tested[k.toUpperCase()]) {
          return v[extractBranchLength];
        }
        return 0;
      }) : 0;
      var totalLength = extractBranchLength ? datamonkey.helpers.sum(attributes[key], function (v) {
        return v[extractBranchLength] || 0;
      }) : 0; // || 0 is to resolve root node missing length

      return _.map([index + 1, // 1-based partition index
      partitions[key].coverage[0].length, // number of sites in the partition
      _.size(tested), // tested branches
      _.keys(treeBranches).length, // total branches
      testedLength, testedLength / totalLength, totalLength, _.filter(self.props.accessorPositive(self.props.siteResults, key), function (p) {
        return p <= pValue;
      }).length, _.filter(self.props.accessorNegative(self.props.siteResults, key), function (p) {
        return p <= pValue;
      }).length], function (cell, index) {
        if (index > 1) {
          var attributedCell = {
            value: cell,
            style: {
              textAlign: "center"
            }
          };

          if (index == 4 || index == 6) {
            _.extend(attributedCell, {
              format: self.dm_formatterFloat
            });
          }
          if (index == 5) {
            _.extend(attributedCell, {
              format: self.dm_formatterProp
            });
          }

          return attributedCell;
        }
        return cell;
      });
    });
  },

  dm_makeHeaderRow: function dm_makeHeaderRow(pValue) {
    return [_.map(["Partition", "Sites", "Branches", "Branch Length", "Selected at p" + String.fromCharCode(parseInt("2264", 16)) + pValue], function (d, i) {
      return _.extend({
        value: d,
        style: {
          borderBottom: 0,
          textAlign: i > 1 ? "center" : "left"
        }
      }, i > 1 ? {
        span: i == 3 ? 3 : 2
      } : {});
    }), _.map(["", "", "Tested", "Total", "Tested", "% of total", "Total", "Positive", "Negative"], function (d, i) {
      return {
        value: d,
        style: {
          borderTop: 0,
          textAlign: i > 1 ? "center" : "left"
        }
      };
    })];
  },

  getInitialState: function getInitialState() {
    return {
      header: this.dm_makeHeaderRow(this.props.pValue),
      rows: this.dm_computePartitionInformation(this.props.trees, this.props.partitions, this.props.branchAttributes, this.props.pValue)
    };
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    this.setState({
      header: this.dm_makeHeaderRow(nextProps.pValue),
      rows: this.dm_computePartitionInformation(nextProps.trees, nextProps.partitions, nextProps.branchAttributes, nextProps.pValue)
    });
  },

  render: function render() {
    return React.createElement(
      "div",
      { className: "table-responsive" },
      React.createElement(DatamonkeyTable, {
        headerData: this.state.header,
        bodyData: this.state.rows
      })
    );
  }
});

var DatamonkeyModelTable = React.createClass({
  displayName: "DatamonkeyModelTable",

  // render a model fit table from a JSON object with entries like this
  //     "Global MG94xREV":{  model name
  //          "log likelihood":-5453.527975908821,
  //          "parameters":131,
  //          "AIC-c":11172.05569160427,
  //          "rate distributions":{
  //            "non-synonymous/synonymous rate ratio for *background*":[
  //             [0.1701428265961598, 1]
  //             ],
  //            "non-synonymous/synonymous rate ratio for *test*":[
  //             [0.1452686330406915, 1]
  //             ]
  //           },
  //          "display order":0
  //         }
  // dm_supportedColumns controls which keys from model specification will be consumed;
  //     * 'value' is the cell specification to be consumed by DatamonkeyTableRow
  //     * 'order' is the column order in the resulting table (relative; doesn't have to be sequential)
  //     * 'display_format' is a formatting function for cell entries
  //     * 'transform' is a data trasformation function for cell entries

  dm_numberFormatter: d3.format(".2f"),

  dm_supportedColumns: {
    "log-likelihood": {
      order: 2,
      value: {
        value: "log L",
        abbr: "Log likelihood of model fit"
      },
      display_format: d3.format(".2f")
    },
    parameters: {
      order: 3,
      value: {
        value: "Parameters",
        abbr: "Number of estimated parameters"
      }
    },
    "AIC-c": {
      order: 1,
      value: {
        value: React.createElement("span", null, ["AIC", React.createElement(
          "sub",
          { key: "0" },
          "C"
        )]),
        abbr: "Small-sample corrected Akaike Information Score"
      },
      display_format: d3.format(".2f")
    },
    "rate distributions": {
      order: 4,
      value: "Rate distributions",
      transform: function transform(value) {
        return React.createElement(DatamonkeyRateDistributionTable, {
          distribution: value
        });
      }
    }
  },

  propTypes: {
    fits: React.PropTypes.object.isRequired
  },

  getDefaultProps: function getDefaultProps() {
    return {
      orderOn: "display order"
    };
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    var self = this,
        tableInfo = self.dm_extractFitsTable(nextProps.fits);
    //console.log(self.dm_makeHeaderRow     (tableInfo.columns));
    this.setState({
      header: self.dm_makeHeaderRow(tableInfo.columns),
      rows: tableInfo.data
    });
  },

  dm_extractFitsTable: function dm_extractFitsTable(jsonTable) {
    var columnMap = null;
    var columnMapIterator = [];
    var valueFormat = {};
    var valueTransform = {};
    var rowData = [];
    var self = this;

    _.each(jsonTable, function (value, key) {
      if (!columnMap) {
        columnMap = {};
        _.each(value, function (cellValue, cellName) {
          if (self.dm_supportedColumns[cellName]) {
            columnMap[cellName] = self.dm_supportedColumns[cellName];
            columnMapIterator[columnMap[cellName].order] = cellName;
            valueFormat[cellName] = self.dm_supportedColumns[cellName]["display_format"];
            if (_.isFunction(self.dm_supportedColumns[cellName]["transform"])) {
              valueTransform[cellName] = self.dm_supportedColumns[cellName]["transform"];
            }
          }
        });
        columnMapIterator = _.filter(columnMapIterator, function (v) {
          return v;
        });
      }

      var thisRow = [{
        value: key
        //style: {
        //  fontVariant: "small-caps"
        //}
      }];

      _.each(columnMapIterator, function (tag) {
        var myValue = valueTransform[tag] ? valueTransform[tag](value[tag]) : value[tag];

        if (valueFormat[tag]) {
          thisRow.push({
            value: myValue,
            format: valueFormat[tag]
          });
        } else {
          thisRow.push(myValue);
        }
      });

      rowData.push([thisRow, _.isNumber(value[self.props.orderOn]) ? value[self.props.orderOn] : rowData.length]);
    });

    return {
      data: _.map(_.sortBy(rowData, function (value) {
        return value[1];
      }), function (r) {
        return r[0];
      }),
      columns: _.map(columnMapIterator, function (tag) {
        return columnMap[tag].value;
      })
    };
  },

  dm_makeHeaderRow: function dm_makeHeaderRow(columnMap) {
    var headerRow = ["Model"];
    _.each(columnMap, function (v) {
      headerRow.push(v);
    });
    return headerRow;
  },

  getInitialState: function getInitialState() {
    var tableInfo = this.dm_extractFitsTable(this.props.fits);

    return {
      header: this.dm_makeHeaderRow(tableInfo.columns),
      rows: tableInfo.data,
      caption: null
    };
  },

  render: function render() {
    return React.createElement(
      "div",
      null,
      React.createElement(
        "h4",
        { className: "dm-table-header" },
        "Model fits",
        React.createElement("span", {
          className: "glyphicon glyphicon-info-sign",
          style: { verticalAlign: "middle", float: "right" },
          "aria-hidden": "true",
          "data-toggle": "popover",
          "data-trigger": "hover",
          title: "Actions",
          "data-html": "true",
          "data-content": "<ul><li>Hover over a column header for a description of its content.</li></ul>",
          "data-placement": "bottom"
        })
      ),
      React.createElement(DatamonkeyTable, {
        headerData: this.state.header,
        bodyData: this.state.rows
      })
    );
  }
});

var DatamonkeyTimersTable = React.createClass({
  displayName: "DatamonkeyTimersTable",

  dm_percentageFormatter: d3.format(".2%"),

  propTypes: {
    timers: React.PropTypes.object.isRequired
  },

  dm_formatSeconds: function dm_formatSeconds(seconds) {
    var fields = [~~(seconds / 3600), ~~(seconds % 3600 / 60), seconds % 60];

    return _.map(fields, function (d) {
      return d < 10 ? "0" + d : "" + d;
    }).join(":");
  },

  dm_extractTimerTable: function dm_extractTimerTable(jsonTable) {
    var totalTime = 0,
        formattedRows = _.map(jsonTable, _.bind(function (value, key) {
      if (this.props.totalTime) {
        if (key == this.props.totalTime) {
          totalTime = value["timer"];
        }
      } else {
        totalTime += value["timer"];
      }
      return [key, value["timer"], value["order"]];
    }, this));

    formattedRows = _.sortBy(formattedRows, function (row) {
      return row[2];
    });

    formattedRows = _.map(formattedRows, _.bind(function (row) {
      if (this.props.totalTime === null || this.props.totalTime != row[0]) {
        row[2] = {
          value: row[1] / totalTime,
          format: this.dm_percentageFormatter
        };
      } else {
        row[2] = "";
      }
      row[1] = this.dm_formatSeconds(row[1]);
      return row;
    }, this));

    return formattedRows;
  },

  dm_makeHeaderRow: function dm_makeHeaderRow() {
    return ["Task", "Time", "%"];
  },

  getInitialState: function getInitialState() {
    return {
      header: this.dm_makeHeaderRow(),
      rows: this.dm_extractTimerTable(this.props.timers),
      caption: null
    };
  },

  render: function render() {
    return React.createElement(DatamonkeyTable, {
      headerData: this.state.header,
      bodyData: this.state.rows
    });
  }
});

module.exports.DatamonkeyTable = DatamonkeyTable;
module.exports.DatamonkeyTableRow = DatamonkeyTableRow;
module.exports.DatamonkeyRateDistributionTable = DatamonkeyRateDistributionTable;
module.exports.DatamonkeyPartitionTable = DatamonkeyPartitionTable;
module.exports.DatamonkeyModelTable = DatamonkeyModelTable;
module.exports.DatamonkeyTimersTable = DatamonkeyTimersTable;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)))

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var React = __webpack_require__(5);

var Hamburger = React.createClass({
  displayName: "Hamburger",

  render: function render() {
    return React.createElement(
      "button",
      {
        type: "button",
        className: "navbar-toggle",
        "data-toggle": "collapse",
        "data-target": "#navbar-collapse-1"
      },
      React.createElement(
        "span",
        { className: "sr-only" },
        "Toggle navigation"
      ),
      React.createElement("span", { className: "icon-bar" }),
      React.createElement("span", { className: "icon-bar" }),
      React.createElement("span", { className: "icon-bar" })
    );
  }
});

var Methods = React.createClass({
  displayName: "Methods",

  render: function render() {
    return React.createElement(
      "div",
      { className: "dropdown" },
      React.createElement(
        "button",
        {
          className: "btn btn-primary dropdown-toggle",
          type: "button",
          "data-toggle": "dropdown"
        },
        "Tools",
        React.createElement("span", { className: "caret" })
      ),
      React.createElement(
        "ul",
        { className: "dropdown-menu" },
        React.createElement(
          "li",
          null,
          React.createElement(
            "a",
            { href: "#" },
            "aBSREL"
          )
        ),
        React.createElement(
          "li",
          null,
          React.createElement(
            "a",
            { href: "../relax" },
            "RELAX"
          )
        ),
        React.createElement(
          "li",
          null,
          React.createElement(
            "a",
            { href: "../busted" },
            "BUSTED"
          )
        ),
        React.createElement(
          "li",
          null,
          React.createElement(
            "a",
            { href: "../fade" },
            "FADE"
          )
        ),
        React.createElement(
          "li",
          null,
          React.createElement(
            "a",
            { href: "../slac" },
            "SLAC"
          )
        )
      )
    );
  }
});

React.createElement(
  "div",
  { className: "dropdown" },
  React.createElement(
    "button",
    {
      className: "btn btn-primary dropdown-toggle",
      type: "button",
      "data-toggle": "dropdown"
    },
    "Dropdown Example",
    React.createElement("span", { className: "caret" })
  ),
  React.createElement(
    "ul",
    { className: "dropdown-menu" },
    React.createElement(
      "li",
      null,
      React.createElement(
        "a",
        { href: "#" },
        "HTML"
      )
    ),
    React.createElement(
      "li",
      null,
      React.createElement(
        "a",
        { href: "#" },
        "CSS"
      )
    ),
    React.createElement(
      "li",
      null,
      React.createElement(
        "a",
        { href: "#" },
        "JavaScript"
      )
    )
  )
);

var NavBar = React.createClass({
  displayName: "NavBar",

  componentDidMount: function componentDidMount() {
    // Corrects navbar offset when clicking anchor hash
    var shiftWindow = function shiftWindow() {
      scrollBy(0, -50);
    };
    if (location.hash) shiftWindow();
    window.addEventListener("hashchange", shiftWindow);
  },
  render: function render() {
    var self = this,
        input_style = {
      position: "absolute",
      top: 0,
      right: 0,
      minWidth: "100%",
      minHeight: "100%",
      fontSize: "100px",
      textAlign: "right",
      filter: "alpha(opacity=0)",
      opacity: 0,
      outline: "none",
      background: "white",
      cursor: "inherit",
      display: "block"
    };
    return React.createElement(
      "nav",
      { className: "navbar navbar-default navbar-fixed-top", role: "navigation" },
      React.createElement(
        "div",
        { className: "container" },
        React.createElement(
          "div",
          { className: "row" },
          React.createElement(
            "div",
            { className: "col-sm-12" },
            React.createElement(
              "a",
              { href: "#" },
              React.createElement("img", { id: "hyphy-logo", src: "../../images/hyphy-logo.svg" })
            ),
            React.createElement(
              "div",
              { className: "navbar-header" },
              React.createElement(Hamburger, null)
            ),
            React.createElement(
              "div",
              { className: "collapse navbar-collapse", id: "navbar-collapse-1" },
              React.createElement(
                "ul",
                { className: "nav navbar-nav" },
                React.createElement(
                  "a",
                  {
                    href: "#",
                    className: "nav-button",
                    role: "button",
                    style: { position: "relative", overflow: "hidden" }
                  },
                  React.createElement("input", {
                    type: "file",
                    style: input_style,
                    id: "dm-file",
                    onChange: self.props.onFileChange
                  }),
                  "Load"
                ),
                React.createElement(
                  "a",
                  {
                    href: "#",
                    className: "nav-button",
                    role: "button",
                    style: { display: "none" }
                  },
                  "Export"
                )
              ),
              React.createElement(Methods, null)
            )
          )
        )
      )
    );
  }
});

module.exports.NavBar = NavBar;

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var React = __webpack_require__(5);

var ScrollSpy = React.createClass({
  displayName: "ScrollSpy",

  render: function render() {
    var list_items = this.props.info.map(function (item, index) {
      var is_active = index == 0 ? "active" : "",
          href = "#" + item.href;
      return React.createElement(
        "li",
        { className: is_active, key: item.label },
        React.createElement(
          "a",
          { href: href },
          item.label
        )
      );
    });
    return React.createElement(
      "nav",
      { className: "col-sm-2 bs-docs-sidebar" },
      React.createElement(
        "ul",
        { className: "nav nav-pills nav-stacked fixed" },
        list_items
      )
    );
  }
});

module.exports.ScrollSpy = ScrollSpy;

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _prodInvariant = __webpack_require__(4);

var invariant = __webpack_require__(1);

function checkMask(value, bitmask) {
  return (value & bitmask) === bitmask;
}

var DOMPropertyInjection = {
  /**
   * Mapping from normalized, camelcased property names to a configuration that
   * specifies how the associated DOM property should be accessed or rendered.
   */
  MUST_USE_PROPERTY: 0x1,
  HAS_BOOLEAN_VALUE: 0x4,
  HAS_NUMERIC_VALUE: 0x8,
  HAS_POSITIVE_NUMERIC_VALUE: 0x10 | 0x8,
  HAS_OVERLOADED_BOOLEAN_VALUE: 0x20,

  /**
   * Inject some specialized knowledge about the DOM. This takes a config object
   * with the following properties:
   *
   * isCustomAttribute: function that given an attribute name will return true
   * if it can be inserted into the DOM verbatim. Useful for data-* or aria-*
   * attributes where it's impossible to enumerate all of the possible
   * attribute names,
   *
   * Properties: object mapping DOM property name to one of the
   * DOMPropertyInjection constants or null. If your attribute isn't in here,
   * it won't get written to the DOM.
   *
   * DOMAttributeNames: object mapping React attribute name to the DOM
   * attribute name. Attribute names not specified use the **lowercase**
   * normalized name.
   *
   * DOMAttributeNamespaces: object mapping React attribute name to the DOM
   * attribute namespace URL. (Attribute names not specified use no namespace.)
   *
   * DOMPropertyNames: similar to DOMAttributeNames but for DOM properties.
   * Property names not specified use the normalized name.
   *
   * DOMMutationMethods: Properties that require special mutation methods. If
   * `value` is undefined, the mutation method should unset the property.
   *
   * @param {object} domPropertyConfig the config as described above.
   */
  injectDOMPropertyConfig: function (domPropertyConfig) {
    var Injection = DOMPropertyInjection;
    var Properties = domPropertyConfig.Properties || {};
    var DOMAttributeNamespaces = domPropertyConfig.DOMAttributeNamespaces || {};
    var DOMAttributeNames = domPropertyConfig.DOMAttributeNames || {};
    var DOMPropertyNames = domPropertyConfig.DOMPropertyNames || {};
    var DOMMutationMethods = domPropertyConfig.DOMMutationMethods || {};

    if (domPropertyConfig.isCustomAttribute) {
      DOMProperty._isCustomAttributeFunctions.push(domPropertyConfig.isCustomAttribute);
    }

    for (var propName in Properties) {
      !!DOMProperty.properties.hasOwnProperty(propName) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'injectDOMPropertyConfig(...): You\'re trying to inject DOM property \'%s\' which has already been injected. You may be accidentally injecting the same DOM property config twice, or you may be injecting two configs that have conflicting property names.', propName) : _prodInvariant('48', propName) : void 0;

      var lowerCased = propName.toLowerCase();
      var propConfig = Properties[propName];

      var propertyInfo = {
        attributeName: lowerCased,
        attributeNamespace: null,
        propertyName: propName,
        mutationMethod: null,

        mustUseProperty: checkMask(propConfig, Injection.MUST_USE_PROPERTY),
        hasBooleanValue: checkMask(propConfig, Injection.HAS_BOOLEAN_VALUE),
        hasNumericValue: checkMask(propConfig, Injection.HAS_NUMERIC_VALUE),
        hasPositiveNumericValue: checkMask(propConfig, Injection.HAS_POSITIVE_NUMERIC_VALUE),
        hasOverloadedBooleanValue: checkMask(propConfig, Injection.HAS_OVERLOADED_BOOLEAN_VALUE)
      };
      !(propertyInfo.hasBooleanValue + propertyInfo.hasNumericValue + propertyInfo.hasOverloadedBooleanValue <= 1) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'DOMProperty: Value can be one of boolean, overloaded boolean, or numeric value, but not a combination: %s', propName) : _prodInvariant('50', propName) : void 0;

      if (process.env.NODE_ENV !== 'production') {
        DOMProperty.getPossibleStandardName[lowerCased] = propName;
      }

      if (DOMAttributeNames.hasOwnProperty(propName)) {
        var attributeName = DOMAttributeNames[propName];
        propertyInfo.attributeName = attributeName;
        if (process.env.NODE_ENV !== 'production') {
          DOMProperty.getPossibleStandardName[attributeName] = propName;
        }
      }

      if (DOMAttributeNamespaces.hasOwnProperty(propName)) {
        propertyInfo.attributeNamespace = DOMAttributeNamespaces[propName];
      }

      if (DOMPropertyNames.hasOwnProperty(propName)) {
        propertyInfo.propertyName = DOMPropertyNames[propName];
      }

      if (DOMMutationMethods.hasOwnProperty(propName)) {
        propertyInfo.mutationMethod = DOMMutationMethods[propName];
      }

      DOMProperty.properties[propName] = propertyInfo;
    }
  }
};

/* eslint-disable max-len */
var ATTRIBUTE_NAME_START_CHAR = ':A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
/* eslint-enable max-len */

/**
 * DOMProperty exports lookup objects that can be used like functions:
 *
 *   > DOMProperty.isValid['id']
 *   true
 *   > DOMProperty.isValid['foobar']
 *   undefined
 *
 * Although this may be confusing, it performs better in general.
 *
 * @see http://jsperf.com/key-exists
 * @see http://jsperf.com/key-missing
 */
var DOMProperty = {
  ID_ATTRIBUTE_NAME: 'data-reactid',
  ROOT_ATTRIBUTE_NAME: 'data-reactroot',

  ATTRIBUTE_NAME_START_CHAR: ATTRIBUTE_NAME_START_CHAR,
  ATTRIBUTE_NAME_CHAR: ATTRIBUTE_NAME_START_CHAR + '\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040',

  /**
   * Map from property "standard name" to an object with info about how to set
   * the property in the DOM. Each object contains:
   *
   * attributeName:
   *   Used when rendering markup or with `*Attribute()`.
   * attributeNamespace
   * propertyName:
   *   Used on DOM node instances. (This includes properties that mutate due to
   *   external factors.)
   * mutationMethod:
   *   If non-null, used instead of the property or `setAttribute()` after
   *   initial render.
   * mustUseProperty:
   *   Whether the property must be accessed and mutated as an object property.
   * hasBooleanValue:
   *   Whether the property should be removed when set to a falsey value.
   * hasNumericValue:
   *   Whether the property must be numeric or parse as a numeric and should be
   *   removed when set to a falsey value.
   * hasPositiveNumericValue:
   *   Whether the property must be positive numeric or parse as a positive
   *   numeric and should be removed when set to a falsey value.
   * hasOverloadedBooleanValue:
   *   Whether the property can be used as a flag as well as with a value.
   *   Removed when strictly equal to false; present without a value when
   *   strictly equal to true; present with a value otherwise.
   */
  properties: {},

  /**
   * Mapping from lowercase property names to the properly cased version, used
   * to warn in the case of missing properties. Available only in __DEV__.
   *
   * autofocus is predefined, because adding it to the property whitelist
   * causes unintended side effects.
   *
   * @type {Object}
   */
  getPossibleStandardName: process.env.NODE_ENV !== 'production' ? { autofocus: 'autoFocus' } : null,

  /**
   * All of the isCustomAttribute() functions that have been injected.
   */
  _isCustomAttributeFunctions: [],

  /**
   * Checks whether a property name is a custom attribute.
   * @method
   */
  isCustomAttribute: function (attributeName) {
    for (var i = 0; i < DOMProperty._isCustomAttributeFunctions.length; i++) {
      var isCustomAttributeFn = DOMProperty._isCustomAttributeFunctions[i];
      if (isCustomAttributeFn(attributeName)) {
        return true;
      }
    }
    return false;
  },

  injection: DOMPropertyInjection
};

module.exports = DOMProperty;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 24 */,
/* 25 */,
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var _prodInvariant = __webpack_require__(4);

var invariant = __webpack_require__(1);

/**
 * Static poolers. Several custom versions for each potential number of
 * arguments. A completely generic pooler is easy to implement, but would
 * require accessing the `arguments` object. In each of these, `this` refers to
 * the Class itself, not an instance. If any others are needed, simply add them
 * here, or in their own files.
 */
var oneArgumentPooler = function (copyFieldsFrom) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, copyFieldsFrom);
    return instance;
  } else {
    return new Klass(copyFieldsFrom);
  }
};

var twoArgumentPooler = function (a1, a2) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2);
    return instance;
  } else {
    return new Klass(a1, a2);
  }
};

var threeArgumentPooler = function (a1, a2, a3) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3);
    return instance;
  } else {
    return new Klass(a1, a2, a3);
  }
};

var fourArgumentPooler = function (a1, a2, a3, a4) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3, a4);
    return instance;
  } else {
    return new Klass(a1, a2, a3, a4);
  }
};

var standardReleaser = function (instance) {
  var Klass = this;
  !(instance instanceof Klass) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Trying to release an instance into a pool of a different type.') : _prodInvariant('25') : void 0;
  instance.destructor();
  if (Klass.instancePool.length < Klass.poolSize) {
    Klass.instancePool.push(instance);
  }
};

var DEFAULT_POOL_SIZE = 10;
var DEFAULT_POOLER = oneArgumentPooler;

/**
 * Augments `CopyConstructor` to be a poolable class, augmenting only the class
 * itself (statically) not adding any prototypical fields. Any CopyConstructor
 * you give this may have a `poolSize` property, and will look for a
 * prototypical `destructor` on instances.
 *
 * @param {Function} CopyConstructor Constructor that can be used to reset.
 * @param {Function} pooler Customizable pooler.
 */
var addPoolingTo = function (CopyConstructor, pooler) {
  // Casting as any so that flow ignores the actual implementation and trusts
  // it to match the type we declared
  var NewKlass = CopyConstructor;
  NewKlass.instancePool = [];
  NewKlass.getPooled = pooler || DEFAULT_POOLER;
  if (!NewKlass.poolSize) {
    NewKlass.poolSize = DEFAULT_POOL_SIZE;
  }
  NewKlass.release = standardReleaser;
  return NewKlass;
};

var PooledClass = {
  addPoolingTo: addPoolingTo,
  oneArgumentPooler: oneArgumentPooler,
  twoArgumentPooler: twoArgumentPooler,
  threeArgumentPooler: threeArgumentPooler,
  fourArgumentPooler: fourArgumentPooler
};

module.exports = PooledClass;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 27 */,
/* 28 */,
/* 29 */,
/* 30 */,
/* 31 */,
/* 32 */,
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var ReactRef = __webpack_require__(209);
var ReactInstrumentation = __webpack_require__(12);

var warning = __webpack_require__(2);

/**
 * Helper to call ReactRef.attachRefs with this composite component, split out
 * to avoid allocations in the transaction mount-ready queue.
 */
function attachRefs() {
  ReactRef.attachRefs(this, this._currentElement);
}

var ReactReconciler = {
  /**
   * Initializes the component, renders markup, and registers event listeners.
   *
   * @param {ReactComponent} internalInstance
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @param {?object} the containing host component instance
   * @param {?object} info about the host container
   * @return {?string} Rendered markup to be inserted into the DOM.
   * @final
   * @internal
   */
  mountComponent: function (internalInstance, transaction, hostParent, hostContainerInfo, context, parentDebugID) // 0 in production and for roots
  {
    if (process.env.NODE_ENV !== 'production') {
      if (internalInstance._debugID !== 0) {
        ReactInstrumentation.debugTool.onBeforeMountComponent(internalInstance._debugID, internalInstance._currentElement, parentDebugID);
      }
    }
    var markup = internalInstance.mountComponent(transaction, hostParent, hostContainerInfo, context, parentDebugID);
    if (internalInstance._currentElement && internalInstance._currentElement.ref != null) {
      transaction.getReactMountReady().enqueue(attachRefs, internalInstance);
    }
    if (process.env.NODE_ENV !== 'production') {
      if (internalInstance._debugID !== 0) {
        ReactInstrumentation.debugTool.onMountComponent(internalInstance._debugID);
      }
    }
    return markup;
  },

  /**
   * Returns a value that can be passed to
   * ReactComponentEnvironment.replaceNodeWithMarkup.
   */
  getHostNode: function (internalInstance) {
    return internalInstance.getHostNode();
  },

  /**
   * Releases any resources allocated by `mountComponent`.
   *
   * @final
   * @internal
   */
  unmountComponent: function (internalInstance, safely) {
    if (process.env.NODE_ENV !== 'production') {
      if (internalInstance._debugID !== 0) {
        ReactInstrumentation.debugTool.onBeforeUnmountComponent(internalInstance._debugID);
      }
    }
    ReactRef.detachRefs(internalInstance, internalInstance._currentElement);
    internalInstance.unmountComponent(safely);
    if (process.env.NODE_ENV !== 'production') {
      if (internalInstance._debugID !== 0) {
        ReactInstrumentation.debugTool.onUnmountComponent(internalInstance._debugID);
      }
    }
  },

  /**
   * Update a component using a new element.
   *
   * @param {ReactComponent} internalInstance
   * @param {ReactElement} nextElement
   * @param {ReactReconcileTransaction} transaction
   * @param {object} context
   * @internal
   */
  receiveComponent: function (internalInstance, nextElement, transaction, context) {
    var prevElement = internalInstance._currentElement;

    if (nextElement === prevElement && context === internalInstance._context) {
      // Since elements are immutable after the owner is rendered,
      // we can do a cheap identity compare here to determine if this is a
      // superfluous reconcile. It's possible for state to be mutable but such
      // change should trigger an update of the owner which would recreate
      // the element. We explicitly check for the existence of an owner since
      // it's possible for an element created outside a composite to be
      // deeply mutated and reused.

      // TODO: Bailing out early is just a perf optimization right?
      // TODO: Removing the return statement should affect correctness?
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      if (internalInstance._debugID !== 0) {
        ReactInstrumentation.debugTool.onBeforeUpdateComponent(internalInstance._debugID, nextElement);
      }
    }

    var refsChanged = ReactRef.shouldUpdateRefs(prevElement, nextElement);

    if (refsChanged) {
      ReactRef.detachRefs(internalInstance, prevElement);
    }

    internalInstance.receiveComponent(nextElement, transaction, context);

    if (refsChanged && internalInstance._currentElement && internalInstance._currentElement.ref != null) {
      transaction.getReactMountReady().enqueue(attachRefs, internalInstance);
    }

    if (process.env.NODE_ENV !== 'production') {
      if (internalInstance._debugID !== 0) {
        ReactInstrumentation.debugTool.onUpdateComponent(internalInstance._debugID);
      }
    }
  },

  /**
   * Flush any dirty changes in a component.
   *
   * @param {ReactComponent} internalInstance
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  performUpdateIfNecessary: function (internalInstance, transaction, updateBatchNumber) {
    if (internalInstance._updateBatchNumber !== updateBatchNumber) {
      // The component's enqueued batch number should always be the current
      // batch or the following one.
      process.env.NODE_ENV !== 'production' ? warning(internalInstance._updateBatchNumber == null || internalInstance._updateBatchNumber === updateBatchNumber + 1, 'performUpdateIfNecessary: Unexpected batch number (current %s, ' + 'pending %s)', updateBatchNumber, internalInstance._updateBatchNumber) : void 0;
      return;
    }
    if (process.env.NODE_ENV !== 'production') {
      if (internalInstance._debugID !== 0) {
        ReactInstrumentation.debugTool.onBeforeUpdateComponent(internalInstance._debugID, internalInstance._currentElement);
      }
    }
    internalInstance.performUpdateIfNecessary(transaction);
    if (process.env.NODE_ENV !== 'production') {
      if (internalInstance._debugID !== 0) {
        ReactInstrumentation.debugTool.onUpdateComponent(internalInstance._debugID);
      }
    }
  }
};

module.exports = ReactReconciler;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var DOMNamespaces = __webpack_require__(71);
var setInnerHTML = __webpack_require__(54);

var createMicrosoftUnsafeLocalFunction = __webpack_require__(72);
var setTextContent = __webpack_require__(107);

var ELEMENT_NODE_TYPE = 1;
var DOCUMENT_FRAGMENT_NODE_TYPE = 11;

/**
 * In IE (8-11) and Edge, appending nodes with no children is dramatically
 * faster than appending a full subtree, so we essentially queue up the
 * .appendChild calls here and apply them so each node is added to its parent
 * before any children are added.
 *
 * In other browsers, doing so is slower or neutral compared to the other order
 * (in Firefox, twice as slow) so we only do this inversion in IE.
 *
 * See https://github.com/spicyj/innerhtml-vs-createelement-vs-clonenode.
 */
var enableLazy = typeof document !== 'undefined' && typeof document.documentMode === 'number' || typeof navigator !== 'undefined' && typeof navigator.userAgent === 'string' && /\bEdge\/\d/.test(navigator.userAgent);

function insertTreeChildren(tree) {
  if (!enableLazy) {
    return;
  }
  var node = tree.node;
  var children = tree.children;
  if (children.length) {
    for (var i = 0; i < children.length; i++) {
      insertTreeBefore(node, children[i], null);
    }
  } else if (tree.html != null) {
    setInnerHTML(node, tree.html);
  } else if (tree.text != null) {
    setTextContent(node, tree.text);
  }
}

var insertTreeBefore = createMicrosoftUnsafeLocalFunction(function (parentNode, tree, referenceNode) {
  // DocumentFragments aren't actually part of the DOM after insertion so
  // appending children won't update the DOM. We need to ensure the fragment
  // is properly populated first, breaking out of our lazy approach for just
  // this level. Also, some <object> plugins (like Flash Player) will read
  // <param> nodes immediately upon insertion into the DOM, so <object>
  // must also be populated prior to insertion into the DOM.
  if (tree.node.nodeType === DOCUMENT_FRAGMENT_NODE_TYPE || tree.node.nodeType === ELEMENT_NODE_TYPE && tree.node.nodeName.toLowerCase() === 'object' && (tree.node.namespaceURI == null || tree.node.namespaceURI === DOMNamespaces.html)) {
    insertTreeChildren(tree);
    parentNode.insertBefore(tree.node, referenceNode);
  } else {
    parentNode.insertBefore(tree.node, referenceNode);
    insertTreeChildren(tree);
  }
});

function replaceChildWithTree(oldNode, newTree) {
  oldNode.parentNode.replaceChild(newTree.node, oldNode);
  insertTreeChildren(newTree);
}

function queueChild(parentTree, childTree) {
  if (enableLazy) {
    parentTree.children.push(childTree);
  } else {
    parentTree.node.appendChild(childTree.node);
  }
}

function queueHTML(tree, html) {
  if (enableLazy) {
    tree.html = html;
  } else {
    setInnerHTML(tree.node, html);
  }
}

function queueText(tree, text) {
  if (enableLazy) {
    tree.text = text;
  } else {
    setTextContent(tree.node, text);
  }
}

function toString() {
  return this.node.nodeName;
}

function DOMLazyTree(node) {
  return {
    node: node,
    children: [],
    html: null,
    text: null,
    toString: toString
  };
}

DOMLazyTree.insertTreeBefore = insertTreeBefore;
DOMLazyTree.replaceChildWithTree = replaceChildWithTree;
DOMLazyTree.queueChild = queueChild;
DOMLazyTree.queueHTML = queueHTML;
DOMLazyTree.queueText = queueText;

module.exports = DOMLazyTree;

/***/ }),
/* 35 */,
/* 36 */,
/* 37 */,
/* 38 */,
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var React = __webpack_require__(5);

var InputInfo = React.createClass({
  displayName: "InputInfo",
  getInitialState: function getInitialState() {
    if (this.props.input_data) {
      return {
        input_data: this.props.input_data
      };
    }
    return {
      input_data: {}
    };
  },
  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    this.setState({
      input_data: nextProps.input_data
    });
  },
  render: function render() {
    return React.createElement(
      "div",
      { id: "input-info" },
      React.createElement(
        "span",
        { className: "hyphy-highlight" },
        "INPUT DATA"
      ),
      " ",
      React.createElement(
        "span",
        { className: "divider" },
        "|"
      ),
      React.createElement(
        "a",
        { href: "#" },
        this.state.input_data.filename
      ),
      " ",
      React.createElement(
        "span",
        { className: "divider" },
        "|"
      ),
      React.createElement(
        "span",
        { className: "hyphy-highlight" },
        this.state.input_data.sequences
      ),
      " sequences ",
      React.createElement(
        "span",
        { className: "divider" },
        "|"
      ),
      React.createElement(
        "span",
        { className: "hyphy-highlight" },
        this.state.input_data.sites
      ),
      " sites"
    );
  }
});

module.exports.InputInfo = InputInfo;

/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var EventPluginHub = __webpack_require__(41);
var EventPluginUtils = __webpack_require__(65);

var accumulateInto = __webpack_require__(99);
var forEachAccumulated = __webpack_require__(100);
var warning = __webpack_require__(2);

var getListener = EventPluginHub.getListener;

/**
 * Some event types have a notion of different registration names for different
 * "phases" of propagation. This finds listeners by a given phase.
 */
function listenerAtPhase(inst, event, propagationPhase) {
  var registrationName = event.dispatchConfig.phasedRegistrationNames[propagationPhase];
  return getListener(inst, registrationName);
}

/**
 * Tags a `SyntheticEvent` with dispatched listeners. Creating this function
 * here, allows us to not have to bind or create functions for each event.
 * Mutating the event's members allows us to not have to create a wrapping
 * "dispatch" object that pairs the event with the listener.
 */
function accumulateDirectionalDispatches(inst, phase, event) {
  if (process.env.NODE_ENV !== 'production') {
    process.env.NODE_ENV !== 'production' ? warning(inst, 'Dispatching inst must not be null') : void 0;
  }
  var listener = listenerAtPhase(inst, event, phase);
  if (listener) {
    event._dispatchListeners = accumulateInto(event._dispatchListeners, listener);
    event._dispatchInstances = accumulateInto(event._dispatchInstances, inst);
  }
}

/**
 * Collect dispatches (must be entirely collected before dispatching - see unit
 * tests). Lazily allocate the array to conserve memory.  We must loop through
 * each event and perform the traversal for each one. We cannot perform a
 * single traversal for the entire collection of events because each event may
 * have a different target.
 */
function accumulateTwoPhaseDispatchesSingle(event) {
  if (event && event.dispatchConfig.phasedRegistrationNames) {
    EventPluginUtils.traverseTwoPhase(event._targetInst, accumulateDirectionalDispatches, event);
  }
}

/**
 * Same as `accumulateTwoPhaseDispatchesSingle`, but skips over the targetID.
 */
function accumulateTwoPhaseDispatchesSingleSkipTarget(event) {
  if (event && event.dispatchConfig.phasedRegistrationNames) {
    var targetInst = event._targetInst;
    var parentInst = targetInst ? EventPluginUtils.getParentInstance(targetInst) : null;
    EventPluginUtils.traverseTwoPhase(parentInst, accumulateDirectionalDispatches, event);
  }
}

/**
 * Accumulates without regard to direction, does not look for phased
 * registration names. Same as `accumulateDirectDispatchesSingle` but without
 * requiring that the `dispatchMarker` be the same as the dispatched ID.
 */
function accumulateDispatches(inst, ignoredDirection, event) {
  if (event && event.dispatchConfig.registrationName) {
    var registrationName = event.dispatchConfig.registrationName;
    var listener = getListener(inst, registrationName);
    if (listener) {
      event._dispatchListeners = accumulateInto(event._dispatchListeners, listener);
      event._dispatchInstances = accumulateInto(event._dispatchInstances, inst);
    }
  }
}

/**
 * Accumulates dispatches on an `SyntheticEvent`, but only for the
 * `dispatchMarker`.
 * @param {SyntheticEvent} event
 */
function accumulateDirectDispatchesSingle(event) {
  if (event && event.dispatchConfig.registrationName) {
    accumulateDispatches(event._targetInst, null, event);
  }
}

function accumulateTwoPhaseDispatches(events) {
  forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle);
}

function accumulateTwoPhaseDispatchesSkipTarget(events) {
  forEachAccumulated(events, accumulateTwoPhaseDispatchesSingleSkipTarget);
}

function accumulateEnterLeaveDispatches(leave, enter, from, to) {
  EventPluginUtils.traverseEnterLeave(from, to, accumulateDispatches, leave, enter);
}

function accumulateDirectDispatches(events) {
  forEachAccumulated(events, accumulateDirectDispatchesSingle);
}

/**
 * A small set of propagation patterns, each of which will accept a small amount
 * of information, and generate a set of "dispatch ready event objects" - which
 * are sets of events that have already been annotated with a set of dispatched
 * listener functions/ids. The API is designed this way to discourage these
 * propagation strategies from actually executing the dispatches, since we
 * always want to collect the entire set of dispatches before executing event a
 * single one.
 *
 * @constructor EventPropagators
 */
var EventPropagators = {
  accumulateTwoPhaseDispatches: accumulateTwoPhaseDispatches,
  accumulateTwoPhaseDispatchesSkipTarget: accumulateTwoPhaseDispatchesSkipTarget,
  accumulateDirectDispatches: accumulateDirectDispatches,
  accumulateEnterLeaveDispatches: accumulateEnterLeaveDispatches
};

module.exports = EventPropagators;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _prodInvariant = __webpack_require__(4);

var EventPluginRegistry = __webpack_require__(51);
var EventPluginUtils = __webpack_require__(65);
var ReactErrorUtils = __webpack_require__(66);

var accumulateInto = __webpack_require__(99);
var forEachAccumulated = __webpack_require__(100);
var invariant = __webpack_require__(1);

/**
 * Internal store for event listeners
 */
var listenerBank = {};

/**
 * Internal queue of events that have accumulated their dispatches and are
 * waiting to have their dispatches executed.
 */
var eventQueue = null;

/**
 * Dispatches an event and releases it back into the pool, unless persistent.
 *
 * @param {?object} event Synthetic event to be dispatched.
 * @param {boolean} simulated If the event is simulated (changes exn behavior)
 * @private
 */
var executeDispatchesAndRelease = function (event, simulated) {
  if (event) {
    EventPluginUtils.executeDispatchesInOrder(event, simulated);

    if (!event.isPersistent()) {
      event.constructor.release(event);
    }
  }
};
var executeDispatchesAndReleaseSimulated = function (e) {
  return executeDispatchesAndRelease(e, true);
};
var executeDispatchesAndReleaseTopLevel = function (e) {
  return executeDispatchesAndRelease(e, false);
};

var getDictionaryKey = function (inst) {
  // Prevents V8 performance issue:
  // https://github.com/facebook/react/pull/7232
  return '.' + inst._rootNodeID;
};

function isInteractive(tag) {
  return tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea';
}

function shouldPreventMouseEvent(name, type, props) {
  switch (name) {
    case 'onClick':
    case 'onClickCapture':
    case 'onDoubleClick':
    case 'onDoubleClickCapture':
    case 'onMouseDown':
    case 'onMouseDownCapture':
    case 'onMouseMove':
    case 'onMouseMoveCapture':
    case 'onMouseUp':
    case 'onMouseUpCapture':
      return !!(props.disabled && isInteractive(type));
    default:
      return false;
  }
}

/**
 * This is a unified interface for event plugins to be installed and configured.
 *
 * Event plugins can implement the following properties:
 *
 *   `extractEvents` {function(string, DOMEventTarget, string, object): *}
 *     Required. When a top-level event is fired, this method is expected to
 *     extract synthetic events that will in turn be queued and dispatched.
 *
 *   `eventTypes` {object}
 *     Optional, plugins that fire events must publish a mapping of registration
 *     names that are used to register listeners. Values of this mapping must
 *     be objects that contain `registrationName` or `phasedRegistrationNames`.
 *
 *   `executeDispatch` {function(object, function, string)}
 *     Optional, allows plugins to override how an event gets dispatched. By
 *     default, the listener is simply invoked.
 *
 * Each plugin that is injected into `EventsPluginHub` is immediately operable.
 *
 * @public
 */
var EventPluginHub = {
  /**
   * Methods for injecting dependencies.
   */
  injection: {
    /**
     * @param {array} InjectedEventPluginOrder
     * @public
     */
    injectEventPluginOrder: EventPluginRegistry.injectEventPluginOrder,

    /**
     * @param {object} injectedNamesToPlugins Map from names to plugin modules.
     */
    injectEventPluginsByName: EventPluginRegistry.injectEventPluginsByName
  },

  /**
   * Stores `listener` at `listenerBank[registrationName][key]`. Is idempotent.
   *
   * @param {object} inst The instance, which is the source of events.
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   * @param {function} listener The callback to store.
   */
  putListener: function (inst, registrationName, listener) {
    !(typeof listener === 'function') ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Expected %s listener to be a function, instead got type %s', registrationName, typeof listener) : _prodInvariant('94', registrationName, typeof listener) : void 0;

    var key = getDictionaryKey(inst);
    var bankForRegistrationName = listenerBank[registrationName] || (listenerBank[registrationName] = {});
    bankForRegistrationName[key] = listener;

    var PluginModule = EventPluginRegistry.registrationNameModules[registrationName];
    if (PluginModule && PluginModule.didPutListener) {
      PluginModule.didPutListener(inst, registrationName, listener);
    }
  },

  /**
   * @param {object} inst The instance, which is the source of events.
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   * @return {?function} The stored callback.
   */
  getListener: function (inst, registrationName) {
    // TODO: shouldPreventMouseEvent is DOM-specific and definitely should not
    // live here; needs to be moved to a better place soon
    var bankForRegistrationName = listenerBank[registrationName];
    if (shouldPreventMouseEvent(registrationName, inst._currentElement.type, inst._currentElement.props)) {
      return null;
    }
    var key = getDictionaryKey(inst);
    return bankForRegistrationName && bankForRegistrationName[key];
  },

  /**
   * Deletes a listener from the registration bank.
   *
   * @param {object} inst The instance, which is the source of events.
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   */
  deleteListener: function (inst, registrationName) {
    var PluginModule = EventPluginRegistry.registrationNameModules[registrationName];
    if (PluginModule && PluginModule.willDeleteListener) {
      PluginModule.willDeleteListener(inst, registrationName);
    }

    var bankForRegistrationName = listenerBank[registrationName];
    // TODO: This should never be null -- when is it?
    if (bankForRegistrationName) {
      var key = getDictionaryKey(inst);
      delete bankForRegistrationName[key];
    }
  },

  /**
   * Deletes all listeners for the DOM element with the supplied ID.
   *
   * @param {object} inst The instance, which is the source of events.
   */
  deleteAllListeners: function (inst) {
    var key = getDictionaryKey(inst);
    for (var registrationName in listenerBank) {
      if (!listenerBank.hasOwnProperty(registrationName)) {
        continue;
      }

      if (!listenerBank[registrationName][key]) {
        continue;
      }

      var PluginModule = EventPluginRegistry.registrationNameModules[registrationName];
      if (PluginModule && PluginModule.willDeleteListener) {
        PluginModule.willDeleteListener(inst, registrationName);
      }

      delete listenerBank[registrationName][key];
    }
  },

  /**
   * Allows registered plugins an opportunity to extract events from top-level
   * native browser events.
   *
   * @return {*} An accumulation of synthetic events.
   * @internal
   */
  extractEvents: function (topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    var events;
    var plugins = EventPluginRegistry.plugins;
    for (var i = 0; i < plugins.length; i++) {
      // Not every plugin in the ordering may be loaded at runtime.
      var possiblePlugin = plugins[i];
      if (possiblePlugin) {
        var extractedEvents = possiblePlugin.extractEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget);
        if (extractedEvents) {
          events = accumulateInto(events, extractedEvents);
        }
      }
    }
    return events;
  },

  /**
   * Enqueues a synthetic event that should be dispatched when
   * `processEventQueue` is invoked.
   *
   * @param {*} events An accumulation of synthetic events.
   * @internal
   */
  enqueueEvents: function (events) {
    if (events) {
      eventQueue = accumulateInto(eventQueue, events);
    }
  },

  /**
   * Dispatches all synthetic events on the event queue.
   *
   * @internal
   */
  processEventQueue: function (simulated) {
    // Set `eventQueue` to null before processing it so that we can tell if more
    // events get enqueued while processing.
    var processingEventQueue = eventQueue;
    eventQueue = null;
    if (simulated) {
      forEachAccumulated(processingEventQueue, executeDispatchesAndReleaseSimulated);
    } else {
      forEachAccumulated(processingEventQueue, executeDispatchesAndReleaseTopLevel);
    }
    !!eventQueue ? process.env.NODE_ENV !== 'production' ? invariant(false, 'processEventQueue(): Additional events were enqueued while processing an event queue. Support for this has not yet been implemented.') : _prodInvariant('95') : void 0;
    // This would be a good time to rethrow if any of the event handlers threw.
    ReactErrorUtils.rethrowCaughtError();
  },

  /**
   * These are needed for tests only. Do not use!
   */
  __purge: function () {
    listenerBank = {};
  },

  __getListenerBank: function () {
    return listenerBank;
  }
};

module.exports = EventPluginHub;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var SyntheticEvent = __webpack_require__(18);

var getEventTarget = __webpack_require__(67);

/**
 * @interface UIEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var UIEventInterface = {
  view: function (event) {
    if (event.view) {
      return event.view;
    }

    var target = getEventTarget(event);
    if (target.window === target) {
      // target is a window object
      return target;
    }

    var doc = target.ownerDocument;
    // TODO: Figure out why `ownerDocument` is sometimes undefined in IE8.
    if (doc) {
      return doc.defaultView || doc.parentWindow;
    } else {
      return window;
    }
  },
  detail: function (event) {
    return event.detail || 0;
  }
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticEvent}
 */
function SyntheticUIEvent(dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget) {
  return SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget);
}

SyntheticEvent.augmentClass(SyntheticUIEvent, UIEventInterface);

module.exports = SyntheticUIEvent;

/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



/**
 * `ReactInstanceMap` maintains a mapping from a public facing stateful
 * instance (key) and the internal representation (value). This allows public
 * methods to accept the user facing instance as an argument and map them back
 * to internal methods.
 */

// TODO: Replace this with ES6: var ReactInstanceMap = new Map();

var ReactInstanceMap = {
  /**
   * This API should be called `delete` but we'd have to make sure to always
   * transform these to strings for IE support. When this transform is fully
   * supported we can rename it.
   */
  remove: function (key) {
    key._reactInternalInstance = undefined;
  },

  get: function (key) {
    return key._reactInternalInstance;
  },

  has: function (key) {
    return key._reactInternalInstance !== undefined;
  },

  set: function (key, value) {
    key._reactInternalInstance = value;
  }
};

module.exports = ReactInstanceMap;

/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _saveSvgAsPng = __webpack_require__(125);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = __webpack_require__(5),
    d3 = __webpack_require__(6),
    _ = __webpack_require__(9),
    d3_save_svg = __webpack_require__(126),
    graphDefaultColorPallette = d3.scale.category10().domain(_.range(10));

/* 
 * Creates a dropdown menu to be used with any 
 * component that extends BaseGraph
 */
var GraphMenu = function (_React$Component) {
  _inherits(GraphMenu, _React$Component);

  function GraphMenu(props) {
    _classCallCheck(this, GraphMenu);

    var _this = _possibleConstructorReturn(this, (GraphMenu.__proto__ || Object.getPrototypeOf(GraphMenu)).call(this, props));

    _this.state = {
      xaxis: "Site",
      yaxis: !_.isEmpty(props.y_options) ? props.y_options[0] : "alpha"
    };

    return _this;
  }

  _createClass(GraphMenu, [{
    key: "handleSelection",
    value: function handleSelection(e) {

      var dimension = e.target.dataset.dimension;
      var axis = e.target.dataset.axis;

      var state_to_update = {};
      state_to_update[axis] = dimension;
      this.setState(state_to_update);
      this.props.axisSelectionEvent(e);
    }
  }, {
    key: "dimensionOptionElement",
    value: function dimensionOptionElement(axis, value) {

      return React.createElement(
        "li",
        { key: value },
        React.createElement("a", {
          href: "javascript:void(0);",
          tabIndex: "-1",
          "data-dimension": value,
          "data-axis": axis,
          onClick: this.handleSelection.bind(this),
          dangerouslySetInnerHTML: { __html: value }
        })
      );
    }
  }, {
    key: "AxisButton",
    value: function AxisButton(options, selected, axis, label) {
      var self = this;

      var DimensionOptions = [];

      DimensionOptions = _.map(options, function (value) {
        return self.dimensionOptionElement(axis, value);
      }, self);

      if (_.size(_.keys(options)) <= 1) {
        return React.createElement("div", null);
      } else {
        return React.createElement(
          "div",
          { className: "input-group" },
          React.createElement(
            "span",
            { className: "input-group-addon" },
            label,
            ":",
            " "
          ),
          React.createElement(
            "ul",
            { className: "dropdown-menu" },
            DimensionOptions
          ),
          React.createElement("button", {
            className: "btn btn-default btn-sm dropdown-toggle form-control",
            type: "button",
            "data-toggle": "dropdown",
            "aria-haspopup": "true",
            "aria-expanded": "false",
            dangerouslySetInnerHTML: { __html: selected + '<span className="caret" />' }
          })
        );
      }
    }
  }, {
    key: "render",
    value: function render() {
      var self = this;
      var XAxisButton = self.AxisButton(self.props.x_options, self.state.xaxis, "xaxis", "X-axis");
      var YAxisButton = self.AxisButton(self.props.y_options, self.state.yaxis, "yaxis", "Y-axis");

      var navStyle = { borderBottom: "none" };

      return React.createElement(
        "nav",
        { className: "navbar", style: navStyle },
        React.createElement(
          "form",
          { className: "navbar-form" },
          React.createElement(
            "div",
            { className: "form-group navbar-left" },
            React.createElement(
              "div",
              { className: "input-group" },
              XAxisButton,
              YAxisButton
            )
          )
        )
      );
    }
  }]);

  return GraphMenu;
}(React.Component);

var BaseGraph = function (_React$Component2) {
  _inherits(BaseGraph, _React$Component2);

  function BaseGraph(props) {
    _classCallCheck(this, BaseGraph);

    var _this2 = _possibleConstructorReturn(this, (BaseGraph.__proto__ || Object.getPrototypeOf(BaseGraph)).call(this, props));

    _this2.state = {
      x_label: "site",
      y_label: "alpha"
    };
    return _this2;
  }

  _createClass(BaseGraph, [{
    key: "setXAxis",
    value: function setXAxis(column) {
      this.setState({ xaxis: column });
    }
  }, {
    key: "setYAxis",
    value: function setYAxis(column) {
      this.setState({ yaxis: column });
    }
  }, {
    key: "computeRanges",
    value: function computeRanges() {
      var self = this;

      return {
        x_range: d3.extent(self.props.x),
        y_range: d3.extent(_.flatten(_.map(self.props.y, function (data_point) {
          return d3.extent(data_point);
        })))
      };
    }
  }, {
    key: "computeDimensions",
    value: function computeDimensions() {
      var self = this;

      var height = self.props.height - self.props.marginTop - self.props.marginBottom;
      var width = self.props.width - self.props.marginLeft - self.props.marginRight;

      return { height: height, width: width };
    }
  }, {
    key: "makeTitle",
    value: function makeTitle(point) {
      return "x = " + this.props.numberFormat(point[0]) + " y = " + this.props.numberFormat(point[1]);
    }
  }, {
    key: "setTracker",
    value: function setTracker(main_graph, point) {
      if (this.props.tracker) {
        var tracker = main_graph.selectAll(".graph-tracker").data([[""]]);
        tracker.enter().append("g");
        tracker.attr("transform", "translate (50,50)").classed("graph-tracker", true);

        if (point) {
          var text_element = tracker.selectAll("text").data(function (d) {
            return d;
          });
          text_element.enter().append("text");
          text_element.text(this.makeTitle(point)).attr("background-color", "red");
        } else {
          tracker.selectAll("text").remove();
        }
      }
    }
  }, {
    key: "doTransition",
    value: function doTransition(d3sel) {
      if (this.props.transitions) {
        return d3sel.transition();
      }
      return d3sel;
    }
  }, {
    key: "renderAxis",
    value: function renderAxis(scale, location, label, dom_element) {
      var self = this;
      var xAxis = d3.svg.axis().scale(scale).orient(location); // e.g. bottom
      self.doTransition(d3.select(dom_element)).call(xAxis);
    }
  }, {
    key: "xAxisLabel",
    value: function xAxisLabel() {
      var transform_x = this.props.width / 2;
      var transform_y = this.props.height - this.props.marginTop / 3;
      return React.createElement(
        "text",
        { textAnchor: "middle", transform: "translate(" + transform_x + "," + transform_y + ")" },
        this.props.x_label
      );
    }
  }, {
    key: "yAxisLabel",
    value: function yAxisLabel() {
      var transform_x = (this.props.marginLeft - 25) / 2;
      var transform_y = this.props.height / 2;
      return React.createElement("text", {
        textAnchor: "middle",
        transform: "translate(" + transform_x + "," + transform_y + ")rotate(-90)",
        dangerouslySetInnerHTML: { __html: this.props.y_label }
      });
    }

    //TODO : See if this can be removed

  }, {
    key: "makeClasses",
    value: function makeClasses(key) {
      var className = null,
          styleDict = null;

      if (key in this.props.renderStyle) {
        if ("class" in this.props.renderStyle[key]) {
          className = this.props.renderStyle[key]["class"];
        }
        if ("style" in this.props.renderStyle[key]) {
          styleDict = this.props.renderStyle[key]["style"];
        }
      }

      return { className: className, style: styleDict };
    }
  }, {
    key: "makeScale",
    value: function makeScale(type, domain, range) {
      var scale;
      if (_.isFunction(type)) {
        scale = type;
      } else {
        switch (type) {
          case "linear":
            scale = d3.scale.linear();
            break;
          case "log":
            scale = d3.scale.log();
            break;
          default:
            scale = d3.scale.linear();
        }
      }
      return scale.domain(domain).range(range);
    }
  }, {
    key: "render",
    value: function render() {
      var self = this;

      var main = self.computeDimensions(),
          _self$computeRanges = self.computeRanges(),
          x_range = _self$computeRanges.x_range,
          y_range = _self$computeRanges.y_range;


      var x_scale = self.makeScale(self.props.xScale, x_range, [0, main.width]),
          y_scale = self.makeScale(self.props.yScale, y_range, [main.height, 0]);

      var xAxisLabel = self.xAxisLabel();
      var yAxisLabel = self.yAxisLabel();

      return React.createElement(
        "div",
        null,
        React.createElement(
          "svg",
          { width: self.props.width, height: self.props.height, id: "dm-chart" },
          React.createElement("rect", { width: "100%", height: "100%", fill: "white" }),
          React.createElement("g", {
            transform: "translate(" + self.props.marginLeft + "," + self.props.marginTop + ")",
            ref: _.partial(self.renderGraph, x_scale, y_scale).bind(self)
          }),
          self.props.xAxis ? React.createElement("g", _extends({}, self.makeClasses("axis"), {
            transform: "translate(" + self.props.marginLeft + "," + (main.height + self.props.marginTop + self.props.marginXaxis) + ")",
            ref: _.partial(self.renderAxis, x_scale, "bottom", self.props.xaxis).bind(self)
          })) : null,
          self.props.yAxis ? React.createElement("g", _extends({}, self.makeClasses("axis"), {
            transform: "translate(" + (self.props.marginLeft - self.props.marginYaxis) + "," + self.props.marginTop + ")",
            ref: _.partial(self.renderAxis, y_scale, "left", self.props.yLabel).bind(self)
          })) : null,
          xAxisLabel,
          yAxisLabel
        )
      );
    }
  }]);

  return BaseGraph;
}(React.Component);

BaseGraph.defaultProps = {
  width: 800,
  height: 400,
  marginLeft: 35,
  marginRight: 10,
  marginTop: 10,
  marginBottom: 35,
  marginXaxis: 5,
  marginYaxis: 5,
  graphData: null,
  renderStyle: { axis: { class: "hyphy-axis" }, points: { class: "" } },
  xScale: "linear",
  yScale: "linear",
  xAxis: true,
  yAxis: true,
  transitions: false,
  numberFormat: d3.format(".4r"),
  tracker: true,
  xLabel: null,
  yLabel: null,
  x: [],
  y: []
};

var LineChart = function (_BaseGraph) {
  _inherits(LineChart, _BaseGraph);

  function LineChart() {
    _classCallCheck(this, LineChart);

    return _possibleConstructorReturn(this, (LineChart.__proto__ || Object.getPrototypeOf(LineChart)).apply(this, arguments));
  }

  _createClass(LineChart, [{
    key: "renderGraph",
    value: function renderGraph(x_scale, y_scale, dom_element) {

      var main_graph = d3.select(dom_element);

      var y = this.props.y[0];

      var line = d3.svg.line().x(function (d) {
        return x_scale(d[0]);
      }).y(function (d) {
        return y_scale(d[1]);
      });

      var g = main_graph.append("g").attr("transform", "translate(" + this.props.marginLeft + "," + this.props.marginTop + ")");

      g.append("path").datum(_.zip(this.props.x, y)).attr("fill", "none").attr("stroke", "steelblue").attr("stroke-linejoin", "round").attr("stroke-linecap", "round").attr("stroke-width", 1.5).attr("d", function (d) {
        return line(d);
      });
    }
  }]);

  return LineChart;
}(BaseGraph);

var ScatterPlot = function (_BaseGraph2) {
  _inherits(ScatterPlot, _BaseGraph2);

  function ScatterPlot() {
    _classCallCheck(this, ScatterPlot);

    return _possibleConstructorReturn(this, (ScatterPlot.__proto__ || Object.getPrototypeOf(ScatterPlot)).apply(this, arguments));
  }

  _createClass(ScatterPlot, [{
    key: "renderGraph",
    value: function renderGraph(x_scale, y_scale, dom_element) {

      var self = this,
          main_graph = d3.select(dom_element);

      _.each(this.props.y, _.bind(function (y, i) {

        var series_color = this.props.color_pallette(i);

        var data_points = main_graph.selectAll("circle.series_" + i).data(_.zip(this.props.x, y));

        data_points.enter().append("circle");
        data_points.exit().remove();

        data_points.on("mouseover", function (t) {
          self.setTracker(main_graph, t);
        }).on("mouseout", function (t) {
          self.setTracker(main_graph, null);
        });

        this.doTransition(data_points.classed("series_" + i, true)).attr("cx", function (d) {
          return x_scale(d[0]);
        }).attr("cy", function (d) {
          return y_scale(d[1]);
        }).attr("r", function (d) {
          return 3;
        }).attr("fill", series_color);
      }, this));
    }
  }]);

  return ScatterPlot;
}(BaseGraph);

ScatterPlot.defaultProps = {
  color_pallette: d3.scale.category10().domain(_.range(10)),
  width: 800,
  height: 400,
  marginLeft: 35,
  marginRight: 10,
  marginTop: 10,
  marginBottom: 35,
  marginXaxis: 5,
  marginYaxis: 5,
  graphData: null,
  renderStyle: { axis: { class: "hyphy-axis" }, points: { class: "" } },
  xScale: "linear",
  yScale: "linear",
  xAxis: true,
  yAxis: true,
  transitions: false,
  numberFormat: d3.format(".4r"),
  tracker: true,
  xLabel: null,
  yLabel: null,
  x: [],
  y: []

};

var Series = function (_BaseGraph3) {
  _inherits(Series, _BaseGraph3);

  function Series() {
    _classCallCheck(this, Series);

    return _possibleConstructorReturn(this, (Series.__proto__ || Object.getPrototypeOf(Series)).apply(this, arguments));
  }

  _createClass(Series, [{
    key: "renderGraph",
    value: function renderGraph(x_scale, y_scale, dom_element) {
      var self = this,
          main_graph = d3.select(dom_element);

      _.each(self.props.y, function (y, i) {
        var series_color = graphDefaultColorPallette(i);

        var series_line = d3.svg.area().interpolate("step").y1(function (d) {
          return y_scale(d[1]);
        }).x(function (d) {
          return x_scale(d[0]);
        });

        if (y_scale.domain()[0] < 0) {
          series_line.y0(function (d) {
            return y_scale(0);
          });
        } else {
          series_line.y0(y_scale(y_scale.domain()[0]));
        }

        var data_points = main_graph.selectAll("path.series_" + i).data([_.zip(self.props.x, y)]);
        data_points.enter().append("path");
        data_points.exit().remove();

        self.doTransition(data_points.classed("series_" + i, true)).attr("d", series_line).attr("fill", series_color).attr("fill-opacity", 0.25).attr("stroke", series_color).attr("stroke-width", "0.5px");

        if (self.props.doDots) {
          var data_points = main_graph.selectAll("circle.series_" + i).data(_.zip(self.props.x, y));
          data_points.enter().append("circle");
          data_points.exit().remove();

          data_points.on("mouseover", function (t) {
            self.setTracker(main_graph, t);
          }).on("mouseout", function (t) {
            self.setTracker(main_graph, null);
          });

          self.doTransition(data_points.classed("series_" + i, true)).attr("cx", function (d) {
            return x_scale(d[0]);
          }).attr("cy", function (d) {
            return y_scale(d[1]);
          }).attr("r", function (d) {
            return 2;
          }).attr("fill", series_color);
        }
      });
    }
  }]);

  return Series;
}(BaseGraph);

var MultiScatterPlot = function (_React$Component3) {
  _inherits(MultiScatterPlot, _React$Component3);

  function MultiScatterPlot(props) {
    _classCallCheck(this, MultiScatterPlot);

    var _this6 = _possibleConstructorReturn(this, (MultiScatterPlot.__proto__ || Object.getPrototypeOf(MultiScatterPlot)).call(this, props));

    var to_plot = _.object(_this6.props.y_labels, _.times(_this6.props.y_labels.length, function () {
      return true;
    }));

    _this6.state = {
      to_plot: to_plot
    };
    return _this6;
  }

  _createClass(MultiScatterPlot, [{
    key: "plotDataPoints",
    value: function plotDataPoints(dom_element) {

      var self = this;

      // prepend property info with x information
      var property_info = self.props.y;

      var site_count = _.max(self.props.x);

      var width = self.props.width - self.props.marginLeft - self.props.marginRight;
      var height = self.props.height - self.props.marginTop - self.props.marginBottom;

      var x = d3.scale.linear().range([0, width]);
      var y = d3.scale.linear().range([height, 0]);

      var xAxis = d3.svg.axis().scale(x).orient("bottom");
      var yAxis = d3.svg.axis().scale(y).orient("left");
      var yAxis2 = d3.svg.axis().scale(y).orient("right");

      function make_x_axis() {
        return d3.svg.axis().scale(x).orient("bottom").ticks(20);
      }

      function make_y_axis() {
        return d3.svg.axis().scale(y).orient("left").ticks(20);
      }

      d3.select(dom_element).selectAll("*").remove();

      var svg = d3.select(dom_element).append("g").attr("transform", "translate(" + self.props.marginLeft + "," + self.props.marginTop + ")");

      x.domain([1, site_count]);
      y.domain([-20, 20]);

      svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis).append("text").attr("class", "label").attr("x", width).attr("y", 40).style("text-anchor", "end").text("Codon index");

      svg.append("g").attr("class", "grid").call(make_y_axis().tickSize(-width, 0, 0).tickFormat(""));

      svg.append("g").attr("class", "grid").attr("transform", "translate(0," + height + ")").call(make_x_axis().tickSize(-height, 0, 0).tickFormat(""));

      svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("class", "label").attr("transform", "rotate(-90)").attr("y", -45).attr("dy", ".71em").style("text-anchor", "end").text("Property weight");

      var y2 = svg.append("g").attr("class", "y axis").attr("transform", "translate(" + width + ",0)").call(yAxis2.tickFormat(""));

      y2.append("text").attr("class", "label").attr("transform", "rotate(-90)").attr("y", 10).attr("dy", ".71em").style("text-anchor", "end").text("Property conserved");

      y2.append("text").attr("class", "label").attr("transform", "rotate(-90)").attr("y", 10).attr("x", -height).attr("dy", ".71em").style("text-anchor", "start").text("Property changing");

      //var legend = svg
      //  .selectAll(".legend")
      //  .data(self.props.color.domain())
      //  .enter()
      //  .append("g")
      //  .attr("class", "legend")
      //  .attr("transform", function(d, i) {
      //    return "translate(0," + i * 20 + ")";
      //  });

      _.each(property_info, function (d, series) {

        // check if we should plot
        if (!_.values(self.state.to_plot)[series]) {
          return;
        }

        svg.selectAll(".dot" + series).data(_.zip(self.props.x, property_info[series])).enter().append("circle").attr("class", "dot" + series).attr("r", function (d) {
          if (d[1] == 0) return 1;
          return 3.5;
        }).attr("cx", function (d) {
          return x(d[0]);
        }).attr("cy", function (d) {
          return y(d[1]);
        }).style("fill", function (d) {
          return self.props.color(series);
        }).append("title").text(function (d) {
          return "Codon " + d[0] + ", property " + series + " = " + d[1];
        });
        d3.select("#show_property" + series).style("color", function (d) {
          return self.props.color(series);
        });
      });
    }
  }, {
    key: "componentWillMount",
    value: function componentWillMount() {}
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {}
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {}
  }, {
    key: "toggleActive",
    value: function toggleActive(e) {
      // set plot according to which buttons are activated
      var to_plot = this.state.to_plot;
      var label = e.target.dataset["label"];
      to_plot[label] = !to_plot[label];
      this.setState({ to_plot: to_plot });
    }
  }, {
    key: "getCheckBox",
    value: function getCheckBox(label) {

      var self = this;

      return React.createElement(
        "label",
        {
          className: "btn btn-primary active focus",
          onClick: self.toggleActive.bind(self),
          "data-label": label
        },
        React.createElement("input", { type: "checkbox" }),
        " ",
        label
      );
    }
  }, {
    key: "getCheckBoxes",
    value: function getCheckBoxes() {
      var _this7 = this;

      return _.map(this.props.y_labels, function (value) {
        return _this7.getCheckBox(value);
      }, self);
    }
  }, {
    key: "render",
    value: function render() {

      return React.createElement(
        "div",
        { style: { marginTop: "20px" } },
        React.createElement(
          "div",
          {
            id: "hyphy-prime-toggle-buttons",
            className: "btn-group-justified col-lg-12",
            "data-toggle": "buttons"
          },
          this.getCheckBoxes()
        ),
        React.createElement(
          "svg",
          {
            width: this.props.width + this.props.marginLeft + this.props.marginRight,
            height: this.props.height + this.props.marginTop + this.props.marginBottom
          },
          React.createElement("g", {
            transform: "translate(" + this.props.marginLeft + "," + this.props.marginTop + ")",
            ref: _.partial(this.plotDataPoints).bind(this)
          }),
          this.props.x_label,
          this.props.y_label
        )
      );
    }
  }]);

  return MultiScatterPlot;
}(React.Component);

MultiScatterPlot.defaultProps = {
  color: d3.scale.category10(),
  width: 800,
  height: 400,
  marginLeft: 40,
  marginRight: 40,
  marginTop: 20,
  marginBottom: 30,
  marginXaxis: 5,
  marginYaxis: 5,
  graphData: null,
  renderStyle: { axis: { class: "hyphy-axis" }, points: { class: "" } },
  xScale: "linear",
  yScale: "linear",
  xAxis: true,
  yAxis: true,
  transitions: false,
  numberFormat: d3.format(".4r"),
  tracker: true,
  xLabel: null,
  yLabel: null,
  x: [],
  y: []
};

var SiteGraph = function (_React$Component4) {
  _inherits(SiteGraph, _React$Component4);

  function SiteGraph(props) {
    _classCallCheck(this, SiteGraph);

    var _this8 = _possibleConstructorReturn(this, (SiteGraph.__proto__ || Object.getPrototypeOf(SiteGraph)).call(this, props));

    _this8.updateAxisSelection = _this8.updateAxisSelection.bind(_this8);
    _this8.state = { active_column: props.columns[0] };
    return _this8;
  }

  _createClass(SiteGraph, [{
    key: "updateAxisSelection",
    value: function updateAxisSelection(e) {
      var dimension = e.target.dataset.dimension;

      this.setState({
        axis: dimension,
        active_column: dimension
      });
    }
  }, {
    key: "savePNG",
    value: function savePNG() {
      (0, _saveSvgAsPng.saveSvgAsPng)(document.getElementById("dm-chart"), "datamonkey-chart.png");
    }
  }, {
    key: "saveSVG",
    value: function saveSVG() {
      d3_save_svg.save(d3.select("#dm-chart").node(), { filename: "datamonkey-chart" });
    }
  }, {
    key: "render",
    value: function render() {
      var self = this,
          index = this.props.columns.indexOf(this.state.active_column),
          x = _.range(1, this.props.rows.length + 1),
          y = [this.props.rows.map(function (row) {
        return row[index];
      })];

      return React.createElement(
        "div",
        { className: "row" },
        React.createElement(
          "div",
          { className: "col-md-6" },
          React.createElement(GraphMenu, {
            x_options: "Site",
            y_options: this.props.columns,
            axisSelectionEvent: self.updateAxisSelection
          })
        ),
        React.createElement(
          "div",
          { className: "col-md-6" },
          React.createElement(
            "button",
            {
              id: "export-chart-svg",
              type: "button",
              className: "btn btn-default btn-sm pull-right btn-export",
              onClick: self.saveSVG
            },
            React.createElement("span", { className: "glyphicon glyphicon-floppy-save" }),
            " Export Chart to SVG"
          ),
          React.createElement(
            "button",
            {
              id: "export-chart-png",
              type: "button",
              className: "btn btn-default btn-sm pull-right btn-export",
              onClick: self.savePNG
            },
            React.createElement("span", { className: "glyphicon glyphicon-floppy-save" }),
            " Export Chart to PNG"
          )
        ),
        React.createElement(
          "div",
          { className: "col-md-12" },
          React.createElement(Series, {
            x: x,
            y: y,
            x_label: "Site",
            y_label: self.state.active_column,
            marginLeft: 80,
            width: 900,
            transitions: true,
            doDots: true
          })
        )
      );
    }
  }]);

  return SiteGraph;
}(React.Component);

module.exports.DatamonkeyGraphMenu = GraphMenu;
module.exports.DatamonkeyLine = LineChart;
module.exports.DatamonkeyMultiScatterplot = MultiScatterPlot;
module.exports.DatamonkeyScatterplot = ScatterPlot;
module.exports.DatamonkeySeries = Series;
module.exports.DatamonkeySiteGraph = SiteGraph;

/***/ }),
/* 45 */,
/* 46 */,
/* 47 */,
/* 48 */,
/* 49 */,
/* 50 */,
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var _prodInvariant = __webpack_require__(4);

var invariant = __webpack_require__(1);

/**
 * Injectable ordering of event plugins.
 */
var eventPluginOrder = null;

/**
 * Injectable mapping from names to event plugin modules.
 */
var namesToPlugins = {};

/**
 * Recomputes the plugin list using the injected plugins and plugin ordering.
 *
 * @private
 */
function recomputePluginOrdering() {
  if (!eventPluginOrder) {
    // Wait until an `eventPluginOrder` is injected.
    return;
  }
  for (var pluginName in namesToPlugins) {
    var pluginModule = namesToPlugins[pluginName];
    var pluginIndex = eventPluginOrder.indexOf(pluginName);
    !(pluginIndex > -1) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'EventPluginRegistry: Cannot inject event plugins that do not exist in the plugin ordering, `%s`.', pluginName) : _prodInvariant('96', pluginName) : void 0;
    if (EventPluginRegistry.plugins[pluginIndex]) {
      continue;
    }
    !pluginModule.extractEvents ? process.env.NODE_ENV !== 'production' ? invariant(false, 'EventPluginRegistry: Event plugins must implement an `extractEvents` method, but `%s` does not.', pluginName) : _prodInvariant('97', pluginName) : void 0;
    EventPluginRegistry.plugins[pluginIndex] = pluginModule;
    var publishedEvents = pluginModule.eventTypes;
    for (var eventName in publishedEvents) {
      !publishEventForPlugin(publishedEvents[eventName], pluginModule, eventName) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'EventPluginRegistry: Failed to publish event `%s` for plugin `%s`.', eventName, pluginName) : _prodInvariant('98', eventName, pluginName) : void 0;
    }
  }
}

/**
 * Publishes an event so that it can be dispatched by the supplied plugin.
 *
 * @param {object} dispatchConfig Dispatch configuration for the event.
 * @param {object} PluginModule Plugin publishing the event.
 * @return {boolean} True if the event was successfully published.
 * @private
 */
function publishEventForPlugin(dispatchConfig, pluginModule, eventName) {
  !!EventPluginRegistry.eventNameDispatchConfigs.hasOwnProperty(eventName) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'EventPluginHub: More than one plugin attempted to publish the same event name, `%s`.', eventName) : _prodInvariant('99', eventName) : void 0;
  EventPluginRegistry.eventNameDispatchConfigs[eventName] = dispatchConfig;

  var phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;
  if (phasedRegistrationNames) {
    for (var phaseName in phasedRegistrationNames) {
      if (phasedRegistrationNames.hasOwnProperty(phaseName)) {
        var phasedRegistrationName = phasedRegistrationNames[phaseName];
        publishRegistrationName(phasedRegistrationName, pluginModule, eventName);
      }
    }
    return true;
  } else if (dispatchConfig.registrationName) {
    publishRegistrationName(dispatchConfig.registrationName, pluginModule, eventName);
    return true;
  }
  return false;
}

/**
 * Publishes a registration name that is used to identify dispatched events and
 * can be used with `EventPluginHub.putListener` to register listeners.
 *
 * @param {string} registrationName Registration name to add.
 * @param {object} PluginModule Plugin publishing the event.
 * @private
 */
function publishRegistrationName(registrationName, pluginModule, eventName) {
  !!EventPluginRegistry.registrationNameModules[registrationName] ? process.env.NODE_ENV !== 'production' ? invariant(false, 'EventPluginHub: More than one plugin attempted to publish the same registration name, `%s`.', registrationName) : _prodInvariant('100', registrationName) : void 0;
  EventPluginRegistry.registrationNameModules[registrationName] = pluginModule;
  EventPluginRegistry.registrationNameDependencies[registrationName] = pluginModule.eventTypes[eventName].dependencies;

  if (process.env.NODE_ENV !== 'production') {
    var lowerCasedName = registrationName.toLowerCase();
    EventPluginRegistry.possibleRegistrationNames[lowerCasedName] = registrationName;

    if (registrationName === 'onDoubleClick') {
      EventPluginRegistry.possibleRegistrationNames.ondblclick = registrationName;
    }
  }
}

/**
 * Registers plugins so that they can extract and dispatch events.
 *
 * @see {EventPluginHub}
 */
var EventPluginRegistry = {
  /**
   * Ordered list of injected plugins.
   */
  plugins: [],

  /**
   * Mapping from event name to dispatch config
   */
  eventNameDispatchConfigs: {},

  /**
   * Mapping from registration name to plugin module
   */
  registrationNameModules: {},

  /**
   * Mapping from registration name to event name
   */
  registrationNameDependencies: {},

  /**
   * Mapping from lowercase registration names to the properly cased version,
   * used to warn in the case of missing event handlers. Available
   * only in __DEV__.
   * @type {Object}
   */
  possibleRegistrationNames: process.env.NODE_ENV !== 'production' ? {} : null,
  // Trust the developer to only use possibleRegistrationNames in __DEV__

  /**
   * Injects an ordering of plugins (by plugin name). This allows the ordering
   * to be decoupled from injection of the actual plugins so that ordering is
   * always deterministic regardless of packaging, on-the-fly injection, etc.
   *
   * @param {array} InjectedEventPluginOrder
   * @internal
   * @see {EventPluginHub.injection.injectEventPluginOrder}
   */
  injectEventPluginOrder: function (injectedEventPluginOrder) {
    !!eventPluginOrder ? process.env.NODE_ENV !== 'production' ? invariant(false, 'EventPluginRegistry: Cannot inject event plugin ordering more than once. You are likely trying to load more than one copy of React.') : _prodInvariant('101') : void 0;
    // Clone the ordering so it cannot be dynamically mutated.
    eventPluginOrder = Array.prototype.slice.call(injectedEventPluginOrder);
    recomputePluginOrdering();
  },

  /**
   * Injects plugins to be used by `EventPluginHub`. The plugin names must be
   * in the ordering injected by `injectEventPluginOrder`.
   *
   * Plugins can be injected as part of page initialization or on-the-fly.
   *
   * @param {object} injectedNamesToPlugins Map from names to plugin modules.
   * @internal
   * @see {EventPluginHub.injection.injectEventPluginsByName}
   */
  injectEventPluginsByName: function (injectedNamesToPlugins) {
    var isOrderingDirty = false;
    for (var pluginName in injectedNamesToPlugins) {
      if (!injectedNamesToPlugins.hasOwnProperty(pluginName)) {
        continue;
      }
      var pluginModule = injectedNamesToPlugins[pluginName];
      if (!namesToPlugins.hasOwnProperty(pluginName) || namesToPlugins[pluginName] !== pluginModule) {
        !!namesToPlugins[pluginName] ? process.env.NODE_ENV !== 'production' ? invariant(false, 'EventPluginRegistry: Cannot inject two different event plugins using the same name, `%s`.', pluginName) : _prodInvariant('102', pluginName) : void 0;
        namesToPlugins[pluginName] = pluginModule;
        isOrderingDirty = true;
      }
    }
    if (isOrderingDirty) {
      recomputePluginOrdering();
    }
  },

  /**
   * Looks up the plugin for the supplied event.
   *
   * @param {object} event A synthetic event.
   * @return {?object} The plugin that created the supplied event.
   * @internal
   */
  getPluginModuleForEvent: function (event) {
    var dispatchConfig = event.dispatchConfig;
    if (dispatchConfig.registrationName) {
      return EventPluginRegistry.registrationNameModules[dispatchConfig.registrationName] || null;
    }
    if (dispatchConfig.phasedRegistrationNames !== undefined) {
      // pulling phasedRegistrationNames out of dispatchConfig helps Flow see
      // that it is not undefined.
      var phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;

      for (var phase in phasedRegistrationNames) {
        if (!phasedRegistrationNames.hasOwnProperty(phase)) {
          continue;
        }
        var pluginModule = EventPluginRegistry.registrationNameModules[phasedRegistrationNames[phase]];
        if (pluginModule) {
          return pluginModule;
        }
      }
    }
    return null;
  },

  /**
   * Exposed for unit testing.
   * @private
   */
  _resetEventPlugins: function () {
    eventPluginOrder = null;
    for (var pluginName in namesToPlugins) {
      if (namesToPlugins.hasOwnProperty(pluginName)) {
        delete namesToPlugins[pluginName];
      }
    }
    EventPluginRegistry.plugins.length = 0;

    var eventNameDispatchConfigs = EventPluginRegistry.eventNameDispatchConfigs;
    for (var eventName in eventNameDispatchConfigs) {
      if (eventNameDispatchConfigs.hasOwnProperty(eventName)) {
        delete eventNameDispatchConfigs[eventName];
      }
    }

    var registrationNameModules = EventPluginRegistry.registrationNameModules;
    for (var registrationName in registrationNameModules) {
      if (registrationNameModules.hasOwnProperty(registrationName)) {
        delete registrationNameModules[registrationName];
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      var possibleRegistrationNames = EventPluginRegistry.possibleRegistrationNames;
      for (var lowerCasedName in possibleRegistrationNames) {
        if (possibleRegistrationNames.hasOwnProperty(lowerCasedName)) {
          delete possibleRegistrationNames[lowerCasedName];
        }
      }
    }
  }
};

module.exports = EventPluginRegistry;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var _prodInvariant = __webpack_require__(4);

var invariant = __webpack_require__(1);

var OBSERVED_ERROR = {};

/**
 * `Transaction` creates a black box that is able to wrap any method such that
 * certain invariants are maintained before and after the method is invoked
 * (Even if an exception is thrown while invoking the wrapped method). Whoever
 * instantiates a transaction can provide enforcers of the invariants at
 * creation time. The `Transaction` class itself will supply one additional
 * automatic invariant for you - the invariant that any transaction instance
 * should not be run while it is already being run. You would typically create a
 * single instance of a `Transaction` for reuse multiple times, that potentially
 * is used to wrap several different methods. Wrappers are extremely simple -
 * they only require implementing two methods.
 *
 * <pre>
 *                       wrappers (injected at creation time)
 *                                      +        +
 *                                      |        |
 *                    +-----------------|--------|--------------+
 *                    |                 v        |              |
 *                    |      +---------------+   |              |
 *                    |   +--|    wrapper1   |---|----+         |
 *                    |   |  +---------------+   v    |         |
 *                    |   |          +-------------+  |         |
 *                    |   |     +----|   wrapper2  |--------+   |
 *                    |   |     |    +-------------+  |     |   |
 *                    |   |     |                     |     |   |
 *                    |   v     v                     v     v   | wrapper
 *                    | +---+ +---+   +---------+   +---+ +---+ | invariants
 * perform(anyMethod) | |   | |   |   |         |   |   | |   | | maintained
 * +----------------->|-|---|-|---|-->|anyMethod|---|---|-|---|-|-------->
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | +---+ +---+   +---------+   +---+ +---+ |
 *                    |  initialize                    close    |
 *                    +-----------------------------------------+
 * </pre>
 *
 * Use cases:
 * - Preserving the input selection ranges before/after reconciliation.
 *   Restoring selection even in the event of an unexpected error.
 * - Deactivating events while rearranging the DOM, preventing blurs/focuses,
 *   while guaranteeing that afterwards, the event system is reactivated.
 * - Flushing a queue of collected DOM mutations to the main UI thread after a
 *   reconciliation takes place in a worker thread.
 * - Invoking any collected `componentDidUpdate` callbacks after rendering new
 *   content.
 * - (Future use case): Wrapping particular flushes of the `ReactWorker` queue
 *   to preserve the `scrollTop` (an automatic scroll aware DOM).
 * - (Future use case): Layout calculations before and after DOM updates.
 *
 * Transactional plugin API:
 * - A module that has an `initialize` method that returns any precomputation.
 * - and a `close` method that accepts the precomputation. `close` is invoked
 *   when the wrapped process is completed, or has failed.
 *
 * @param {Array<TransactionalWrapper>} transactionWrapper Wrapper modules
 * that implement `initialize` and `close`.
 * @return {Transaction} Single transaction for reuse in thread.
 *
 * @class Transaction
 */
var TransactionImpl = {
  /**
   * Sets up this instance so that it is prepared for collecting metrics. Does
   * so such that this setup method may be used on an instance that is already
   * initialized, in a way that does not consume additional memory upon reuse.
   * That can be useful if you decide to make your subclass of this mixin a
   * "PooledClass".
   */
  reinitializeTransaction: function () {
    this.transactionWrappers = this.getTransactionWrappers();
    if (this.wrapperInitData) {
      this.wrapperInitData.length = 0;
    } else {
      this.wrapperInitData = [];
    }
    this._isInTransaction = false;
  },

  _isInTransaction: false,

  /**
   * @abstract
   * @return {Array<TransactionWrapper>} Array of transaction wrappers.
   */
  getTransactionWrappers: null,

  isInTransaction: function () {
    return !!this._isInTransaction;
  },

  /* eslint-disable space-before-function-paren */

  /**
   * Executes the function within a safety window. Use this for the top level
   * methods that result in large amounts of computation/mutations that would
   * need to be safety checked. The optional arguments helps prevent the need
   * to bind in many cases.
   *
   * @param {function} method Member of scope to call.
   * @param {Object} scope Scope to invoke from.
   * @param {Object?=} a Argument to pass to the method.
   * @param {Object?=} b Argument to pass to the method.
   * @param {Object?=} c Argument to pass to the method.
   * @param {Object?=} d Argument to pass to the method.
   * @param {Object?=} e Argument to pass to the method.
   * @param {Object?=} f Argument to pass to the method.
   *
   * @return {*} Return value from `method`.
   */
  perform: function (method, scope, a, b, c, d, e, f) {
    /* eslint-enable space-before-function-paren */
    !!this.isInTransaction() ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Transaction.perform(...): Cannot initialize a transaction when there is already an outstanding transaction.') : _prodInvariant('27') : void 0;
    var errorThrown;
    var ret;
    try {
      this._isInTransaction = true;
      // Catching errors makes debugging more difficult, so we start with
      // errorThrown set to true before setting it to false after calling
      // close -- if it's still set to true in the finally block, it means
      // one of these calls threw.
      errorThrown = true;
      this.initializeAll(0);
      ret = method.call(scope, a, b, c, d, e, f);
      errorThrown = false;
    } finally {
      try {
        if (errorThrown) {
          // If `method` throws, prefer to show that stack trace over any thrown
          // by invoking `closeAll`.
          try {
            this.closeAll(0);
          } catch (err) {}
        } else {
          // Since `method` didn't throw, we don't want to silence the exception
          // here.
          this.closeAll(0);
        }
      } finally {
        this._isInTransaction = false;
      }
    }
    return ret;
  },

  initializeAll: function (startIndex) {
    var transactionWrappers = this.transactionWrappers;
    for (var i = startIndex; i < transactionWrappers.length; i++) {
      var wrapper = transactionWrappers[i];
      try {
        // Catching errors makes debugging more difficult, so we start with the
        // OBSERVED_ERROR state before overwriting it with the real return value
        // of initialize -- if it's still set to OBSERVED_ERROR in the finally
        // block, it means wrapper.initialize threw.
        this.wrapperInitData[i] = OBSERVED_ERROR;
        this.wrapperInitData[i] = wrapper.initialize ? wrapper.initialize.call(this) : null;
      } finally {
        if (this.wrapperInitData[i] === OBSERVED_ERROR) {
          // The initializer for wrapper i threw an error; initialize the
          // remaining wrappers but silence any exceptions from them to ensure
          // that the first error is the one to bubble up.
          try {
            this.initializeAll(i + 1);
          } catch (err) {}
        }
      }
    }
  },

  /**
   * Invokes each of `this.transactionWrappers.close[i]` functions, passing into
   * them the respective return values of `this.transactionWrappers.init[i]`
   * (`close`rs that correspond to initializers that failed will not be
   * invoked).
   */
  closeAll: function (startIndex) {
    !this.isInTransaction() ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Transaction.closeAll(): Cannot close transaction when none are open.') : _prodInvariant('28') : void 0;
    var transactionWrappers = this.transactionWrappers;
    for (var i = startIndex; i < transactionWrappers.length; i++) {
      var wrapper = transactionWrappers[i];
      var initData = this.wrapperInitData[i];
      var errorThrown;
      try {
        // Catching errors makes debugging more difficult, so we start with
        // errorThrown set to true before setting it to false after calling
        // close -- if it's still set to true in the finally block, it means
        // wrapper.close threw.
        errorThrown = true;
        if (initData !== OBSERVED_ERROR && wrapper.close) {
          wrapper.close.call(this, initData);
        }
        errorThrown = false;
      } finally {
        if (errorThrown) {
          // The closer for wrapper i threw an error; close the remaining
          // wrappers but silence any exceptions from them to ensure that the
          // first error is the one to bubble up.
          try {
            this.closeAll(i + 1);
          } catch (e) {}
        }
      }
    }
    this.wrapperInitData.length = 0;
  }
};

module.exports = TransactionImpl;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var SyntheticUIEvent = __webpack_require__(42);
var ViewportMetrics = __webpack_require__(106);

var getEventModifierState = __webpack_require__(69);

/**
 * @interface MouseEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var MouseEventInterface = {
  screenX: null,
  screenY: null,
  clientX: null,
  clientY: null,
  ctrlKey: null,
  shiftKey: null,
  altKey: null,
  metaKey: null,
  getModifierState: getEventModifierState,
  button: function (event) {
    // Webkit, Firefox, IE9+
    // which:  1 2 3
    // button: 0 1 2 (standard)
    var button = event.button;
    if ('which' in event) {
      return button;
    }
    // IE<9
    // which:  undefined
    // button: 0 0 0
    // button: 1 4 2 (onmouseup)
    return button === 2 ? 2 : button === 4 ? 1 : 0;
  },
  buttons: null,
  relatedTarget: function (event) {
    return event.relatedTarget || (event.fromElement === event.srcElement ? event.toElement : event.fromElement);
  },
  // "Proprietary" Interface.
  pageX: function (event) {
    return 'pageX' in event ? event.pageX : event.clientX + ViewportMetrics.currentScrollLeft;
  },
  pageY: function (event) {
    return 'pageY' in event ? event.pageY : event.clientY + ViewportMetrics.currentScrollTop;
  }
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticMouseEvent(dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget) {
  return SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget);
}

SyntheticUIEvent.augmentClass(SyntheticMouseEvent, MouseEventInterface);

module.exports = SyntheticMouseEvent;

/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var ExecutionEnvironment = __webpack_require__(10);
var DOMNamespaces = __webpack_require__(71);

var WHITESPACE_TEST = /^[ \r\n\t\f]/;
var NONVISIBLE_TEST = /<(!--|link|noscript|meta|script|style)[ \r\n\t\f\/>]/;

var createMicrosoftUnsafeLocalFunction = __webpack_require__(72);

// SVG temp container for IE lacking innerHTML
var reusableSVGContainer;

/**
 * Set the innerHTML property of a node, ensuring that whitespace is preserved
 * even in IE8.
 *
 * @param {DOMElement} node
 * @param {string} html
 * @internal
 */
var setInnerHTML = createMicrosoftUnsafeLocalFunction(function (node, html) {
  // IE does not have innerHTML for SVG nodes, so instead we inject the
  // new markup in a temp node and then move the child nodes across into
  // the target node
  if (node.namespaceURI === DOMNamespaces.svg && !('innerHTML' in node)) {
    reusableSVGContainer = reusableSVGContainer || document.createElement('div');
    reusableSVGContainer.innerHTML = '<svg>' + html + '</svg>';
    var svgNode = reusableSVGContainer.firstChild;
    while (svgNode.firstChild) {
      node.appendChild(svgNode.firstChild);
    }
  } else {
    node.innerHTML = html;
  }
});

if (ExecutionEnvironment.canUseDOM) {
  // IE8: When updating a just created node with innerHTML only leading
  // whitespace is removed. When updating an existing node with innerHTML
  // whitespace in root TextNodes is also collapsed.
  // @see quirksmode.org/bugreports/archives/2004/11/innerhtml_and_t.html

  // Feature detection; only IE8 is known to behave improperly like this.
  var testElement = document.createElement('div');
  testElement.innerHTML = ' ';
  if (testElement.innerHTML === '') {
    setInnerHTML = function (node, html) {
      // Magic theory: IE8 supposedly differentiates between added and updated
      // nodes when processing innerHTML, innerHTML on updated nodes suffers
      // from worse whitespace behavior. Re-adding a node like this triggers
      // the initial and more favorable whitespace behavior.
      // TODO: What to do on a detached node?
      if (node.parentNode) {
        node.parentNode.replaceChild(node, node);
      }

      // We also implement a workaround for non-visible tags disappearing into
      // thin air on IE8, this only happens if there is no visible text
      // in-front of the non-visible tags. Piggyback on the whitespace fix
      // and simply check if any non-visible tags appear in the source.
      if (WHITESPACE_TEST.test(html) || html[0] === '<' && NONVISIBLE_TEST.test(html)) {
        // Recover leading whitespace by temporarily prepending any character.
        // \uFEFF has the potential advantage of being zero-width/invisible.
        // UglifyJS drops U+FEFF chars when parsing, so use String.fromCharCode
        // in hopes that this is preserved even if "\uFEFF" is transformed to
        // the actual Unicode character (by Babel, for example).
        // https://github.com/mishoo/UglifyJS2/blob/v2.4.20/lib/parse.js#L216
        node.innerHTML = String.fromCharCode(0xfeff) + html;

        // deleteData leaves an empty `TextNode` which offsets the index of all
        // children. Definitely want to avoid this.
        var textNode = node.firstChild;
        if (textNode.data.length === 1) {
          node.removeChild(textNode);
        } else {
          textNode.deleteData(0, 1);
        }
      } else {
        node.innerHTML = html;
      }
    };
  }
  testElement = null;
}

module.exports = setInnerHTML;

/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * Based on the escape-html library, which is used under the MIT License below:
 *
 * Copyright (c) 2012-2013 TJ Holowaychuk
 * Copyright (c) 2015 Andreas Lubbe
 * Copyright (c) 2015 Tiancheng "Timothy" Gu
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */



// code copied and modified from escape-html
/**
 * Module variables.
 * @private
 */

var matchHtmlRegExp = /["'&<>]/;

/**
 * Escape special characters in the given string of html.
 *
 * @param  {string} string The string to escape for inserting into HTML
 * @return {string}
 * @public
 */

function escapeHtml(string) {
  var str = '' + string;
  var match = matchHtmlRegExp.exec(str);

  if (!match) {
    return str;
  }

  var escape;
  var html = '';
  var index = 0;
  var lastIndex = 0;

  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34:
        // "
        escape = '&quot;';
        break;
      case 38:
        // &
        escape = '&amp;';
        break;
      case 39:
        // '
        escape = '&#x27;'; // modified from escape-html; used to be '&#39'
        break;
      case 60:
        // <
        escape = '&lt;';
        break;
      case 62:
        // >
        escape = '&gt;';
        break;
      default:
        continue;
    }

    if (lastIndex !== index) {
      html += str.substring(lastIndex, index);
    }

    lastIndex = index + 1;
    html += escape;
  }

  return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
}
// end code copied and modified from escape-html

/**
 * Escapes text to prevent scripting attacks.
 *
 * @param {*} text Text value to escape.
 * @return {string} An escaped string.
 */
function escapeTextContentForBrowser(text) {
  if (typeof text === 'boolean' || typeof text === 'number') {
    // this shortcircuit helps perf for types that we know will never have
    // special characters, especially given that this function is used often
    // for numeric dom ids.
    return '' + text;
  }
  return escapeHtml(text);
}

module.exports = escapeTextContentForBrowser;

/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _assign = __webpack_require__(7);

var EventPluginRegistry = __webpack_require__(51);
var ReactEventEmitterMixin = __webpack_require__(235);
var ViewportMetrics = __webpack_require__(106);

var getVendorPrefixedEventName = __webpack_require__(236);
var isEventSupported = __webpack_require__(68);

/**
 * Summary of `ReactBrowserEventEmitter` event handling:
 *
 *  - Top-level delegation is used to trap most native browser events. This
 *    may only occur in the main thread and is the responsibility of
 *    ReactEventListener, which is injected and can therefore support pluggable
 *    event sources. This is the only work that occurs in the main thread.
 *
 *  - We normalize and de-duplicate events to account for browser quirks. This
 *    may be done in the worker thread.
 *
 *  - Forward these native events (with the associated top-level type used to
 *    trap it) to `EventPluginHub`, which in turn will ask plugins if they want
 *    to extract any synthetic events.
 *
 *  - The `EventPluginHub` will then process each event by annotating them with
 *    "dispatches", a sequence of listeners and IDs that care about that event.
 *
 *  - The `EventPluginHub` then dispatches the events.
 *
 * Overview of React and the event system:
 *
 * +------------+    .
 * |    DOM     |    .
 * +------------+    .
 *       |           .
 *       v           .
 * +------------+    .
 * | ReactEvent |    .
 * |  Listener  |    .
 * +------------+    .                         +-----------+
 *       |           .               +--------+|SimpleEvent|
 *       |           .               |         |Plugin     |
 * +-----|------+    .               v         +-----------+
 * |     |      |    .    +--------------+                    +------------+
 * |     +-----------.--->|EventPluginHub|                    |    Event   |
 * |            |    .    |              |     +-----------+  | Propagators|
 * | ReactEvent |    .    |              |     |TapEvent   |  |------------|
 * |  Emitter   |    .    |              |<---+|Plugin     |  |other plugin|
 * |            |    .    |              |     +-----------+  |  utilities |
 * |     +-----------.--->|              |                    +------------+
 * |     |      |    .    +--------------+
 * +-----|------+    .                ^        +-----------+
 *       |           .                |        |Enter/Leave|
 *       +           .                +-------+|Plugin     |
 * +-------------+   .                         +-----------+
 * | application |   .
 * |-------------|   .
 * |             |   .
 * |             |   .
 * +-------------+   .
 *                   .
 *    React Core     .  General Purpose Event Plugin System
 */

var hasEventPageXY;
var alreadyListeningTo = {};
var isMonitoringScrollValue = false;
var reactTopListenersCounter = 0;

// For events like 'submit' which don't consistently bubble (which we trap at a
// lower node than `document`), binding at `document` would cause duplicate
// events so we don't include them here
var topEventMapping = {
  topAbort: 'abort',
  topAnimationEnd: getVendorPrefixedEventName('animationend') || 'animationend',
  topAnimationIteration: getVendorPrefixedEventName('animationiteration') || 'animationiteration',
  topAnimationStart: getVendorPrefixedEventName('animationstart') || 'animationstart',
  topBlur: 'blur',
  topCanPlay: 'canplay',
  topCanPlayThrough: 'canplaythrough',
  topChange: 'change',
  topClick: 'click',
  topCompositionEnd: 'compositionend',
  topCompositionStart: 'compositionstart',
  topCompositionUpdate: 'compositionupdate',
  topContextMenu: 'contextmenu',
  topCopy: 'copy',
  topCut: 'cut',
  topDoubleClick: 'dblclick',
  topDrag: 'drag',
  topDragEnd: 'dragend',
  topDragEnter: 'dragenter',
  topDragExit: 'dragexit',
  topDragLeave: 'dragleave',
  topDragOver: 'dragover',
  topDragStart: 'dragstart',
  topDrop: 'drop',
  topDurationChange: 'durationchange',
  topEmptied: 'emptied',
  topEncrypted: 'encrypted',
  topEnded: 'ended',
  topError: 'error',
  topFocus: 'focus',
  topInput: 'input',
  topKeyDown: 'keydown',
  topKeyPress: 'keypress',
  topKeyUp: 'keyup',
  topLoadedData: 'loadeddata',
  topLoadedMetadata: 'loadedmetadata',
  topLoadStart: 'loadstart',
  topMouseDown: 'mousedown',
  topMouseMove: 'mousemove',
  topMouseOut: 'mouseout',
  topMouseOver: 'mouseover',
  topMouseUp: 'mouseup',
  topPaste: 'paste',
  topPause: 'pause',
  topPlay: 'play',
  topPlaying: 'playing',
  topProgress: 'progress',
  topRateChange: 'ratechange',
  topScroll: 'scroll',
  topSeeked: 'seeked',
  topSeeking: 'seeking',
  topSelectionChange: 'selectionchange',
  topStalled: 'stalled',
  topSuspend: 'suspend',
  topTextInput: 'textInput',
  topTimeUpdate: 'timeupdate',
  topTouchCancel: 'touchcancel',
  topTouchEnd: 'touchend',
  topTouchMove: 'touchmove',
  topTouchStart: 'touchstart',
  topTransitionEnd: getVendorPrefixedEventName('transitionend') || 'transitionend',
  topVolumeChange: 'volumechange',
  topWaiting: 'waiting',
  topWheel: 'wheel'
};

/**
 * To ensure no conflicts with other potential React instances on the page
 */
var topListenersIDKey = '_reactListenersID' + String(Math.random()).slice(2);

function getListeningForDocument(mountAt) {
  // In IE8, `mountAt` is a host object and doesn't have `hasOwnProperty`
  // directly.
  if (!Object.prototype.hasOwnProperty.call(mountAt, topListenersIDKey)) {
    mountAt[topListenersIDKey] = reactTopListenersCounter++;
    alreadyListeningTo[mountAt[topListenersIDKey]] = {};
  }
  return alreadyListeningTo[mountAt[topListenersIDKey]];
}

/**
 * `ReactBrowserEventEmitter` is used to attach top-level event listeners. For
 * example:
 *
 *   EventPluginHub.putListener('myID', 'onClick', myFunction);
 *
 * This would allocate a "registration" of `('onClick', myFunction)` on 'myID'.
 *
 * @internal
 */
var ReactBrowserEventEmitter = _assign({}, ReactEventEmitterMixin, {
  /**
   * Injectable event backend
   */
  ReactEventListener: null,

  injection: {
    /**
     * @param {object} ReactEventListener
     */
    injectReactEventListener: function (ReactEventListener) {
      ReactEventListener.setHandleTopLevel(ReactBrowserEventEmitter.handleTopLevel);
      ReactBrowserEventEmitter.ReactEventListener = ReactEventListener;
    }
  },

  /**
   * Sets whether or not any created callbacks should be enabled.
   *
   * @param {boolean} enabled True if callbacks should be enabled.
   */
  setEnabled: function (enabled) {
    if (ReactBrowserEventEmitter.ReactEventListener) {
      ReactBrowserEventEmitter.ReactEventListener.setEnabled(enabled);
    }
  },

  /**
   * @return {boolean} True if callbacks are enabled.
   */
  isEnabled: function () {
    return !!(ReactBrowserEventEmitter.ReactEventListener && ReactBrowserEventEmitter.ReactEventListener.isEnabled());
  },

  /**
   * We listen for bubbled touch events on the document object.
   *
   * Firefox v8.01 (and possibly others) exhibited strange behavior when
   * mounting `onmousemove` events at some node that was not the document
   * element. The symptoms were that if your mouse is not moving over something
   * contained within that mount point (for example on the background) the
   * top-level listeners for `onmousemove` won't be called. However, if you
   * register the `mousemove` on the document object, then it will of course
   * catch all `mousemove`s. This along with iOS quirks, justifies restricting
   * top-level listeners to the document object only, at least for these
   * movement types of events and possibly all events.
   *
   * @see http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
   *
   * Also, `keyup`/`keypress`/`keydown` do not bubble to the window on IE, but
   * they bubble to document.
   *
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   * @param {object} contentDocumentHandle Document which owns the container
   */
  listenTo: function (registrationName, contentDocumentHandle) {
    var mountAt = contentDocumentHandle;
    var isListening = getListeningForDocument(mountAt);
    var dependencies = EventPluginRegistry.registrationNameDependencies[registrationName];

    for (var i = 0; i < dependencies.length; i++) {
      var dependency = dependencies[i];
      if (!(isListening.hasOwnProperty(dependency) && isListening[dependency])) {
        if (dependency === 'topWheel') {
          if (isEventSupported('wheel')) {
            ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent('topWheel', 'wheel', mountAt);
          } else if (isEventSupported('mousewheel')) {
            ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent('topWheel', 'mousewheel', mountAt);
          } else {
            // Firefox needs to capture a different mouse scroll event.
            // @see http://www.quirksmode.org/dom/events/tests/scroll.html
            ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent('topWheel', 'DOMMouseScroll', mountAt);
          }
        } else if (dependency === 'topScroll') {
          if (isEventSupported('scroll', true)) {
            ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent('topScroll', 'scroll', mountAt);
          } else {
            ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent('topScroll', 'scroll', ReactBrowserEventEmitter.ReactEventListener.WINDOW_HANDLE);
          }
        } else if (dependency === 'topFocus' || dependency === 'topBlur') {
          if (isEventSupported('focus', true)) {
            ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent('topFocus', 'focus', mountAt);
            ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent('topBlur', 'blur', mountAt);
          } else if (isEventSupported('focusin')) {
            // IE has `focusin` and `focusout` events which bubble.
            // @see http://www.quirksmode.org/blog/archives/2008/04/delegating_the.html
            ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent('topFocus', 'focusin', mountAt);
            ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent('topBlur', 'focusout', mountAt);
          }

          // to make sure blur and focus event listeners are only attached once
          isListening.topBlur = true;
          isListening.topFocus = true;
        } else if (topEventMapping.hasOwnProperty(dependency)) {
          ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(dependency, topEventMapping[dependency], mountAt);
        }

        isListening[dependency] = true;
      }
    }
  },

  trapBubbledEvent: function (topLevelType, handlerBaseName, handle) {
    return ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(topLevelType, handlerBaseName, handle);
  },

  trapCapturedEvent: function (topLevelType, handlerBaseName, handle) {
    return ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent(topLevelType, handlerBaseName, handle);
  },

  /**
   * Protect against document.createEvent() returning null
   * Some popup blocker extensions appear to do this:
   * https://github.com/facebook/react/issues/6887
   */
  supportsEventPageXY: function () {
    if (!document.createEvent) {
      return false;
    }
    var ev = document.createEvent('MouseEvent');
    return ev != null && 'pageX' in ev;
  },

  /**
   * Listens to window scroll and resize events. We cache scroll values so that
   * application code can access them without triggering reflows.
   *
   * ViewportMetrics is only used by SyntheticMouse/TouchEvent and only when
   * pageX/pageY isn't supported (legacy browsers).
   *
   * NOTE: Scroll events do not bubble.
   *
   * @see http://www.quirksmode.org/dom/events/scroll.html
   */
  ensureScrollValueMonitoring: function () {
    if (hasEventPageXY === undefined) {
      hasEventPageXY = ReactBrowserEventEmitter.supportsEventPageXY();
    }
    if (!hasEventPageXY && !isMonitoringScrollValue) {
      var refresh = ViewportMetrics.refreshScrollValues;
      ReactBrowserEventEmitter.ReactEventListener.monitorScrollValue(refresh);
      isMonitoringScrollValue = true;
    }
  }
});

module.exports = ReactBrowserEventEmitter;

/***/ }),
/* 57 */,
/* 58 */,
/* 59 */,
/* 60 */,
/* 61 */,
/* 62 */,
/* 63 */,
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(d3, _, $) {

var React = __webpack_require__(5);
var datamonkey = __webpack_require__(19);
__webpack_require__(50);

var Tree = React.createClass({
  displayName: "Tree",

  getDefaultProps: function getDefaultProps() {
    return {
      color_gradient: ["#5e4fa2", "#3288bd", "#e6f598", "#f46d43", "#9e0142"],
      grayscale_gradient: ["#DDDDDD", "#AAAAAA", "#888888", "#444444", "#000000"],
      fill_color: true,
      scaling_exponent: 0.33,
      bar_width: 70,
      bar_height: 300,
      margins: {
        bottom: 30,
        top: 15,
        left: 40,
        right: 2
      }
    };
  },

  toggleLegend: function toggleLegend(e) {
    var show_legend = !e.target.checked;

    this.setState({
      show_legend: show_legend
    });
  },

  changeColorScale: function changeColorScale(e) {
    var self = this;
    var fill_color = !e.target.checked;

    var omega_color = d3.scale.pow().exponent(self.props.scaling_exponent).domain([0, 0.25, 1, 5, 10]).range(fill_color ? self.props.color_gradient : self.props.grayscale_gradient).clamp(true);

    var omega_scale = d3.scale.pow().exponent(self.props.scaling_exponent).domain(d3.extent(omega_color.domain())).range([0, 1]);

    this.setState({
      omega_color: omega_color,
      omega_scale: omega_scale,
      fill_color: false
    });
  },

  getInitialState: function getInitialState() {
    var self = this;

    var omega_color = d3.scale.pow().exponent(self.props.scaling_exponent).domain([0, 0.25, 1, 5, 10]).range(self.props.fill_color ? self.props.color_gradient : self.props.grayscale_gradient).clamp(true);

    var omega_scale = d3.scale.pow().exponent(self.props.scaling_exponent).domain(d3.extent(omega_color.domain())).range([0, 1]),
        axis_scale = d3.scale.pow().exponent(self.props.scaling_exponent).domain(d3.extent(omega_color.domain())).range([0, self.props.bar_height - self.props.margins["top"] - self.props.margins["bottom"]]);

    var selected_model = _.first(_.keys(self.props.models));

    return {
      json: this.props.json,
      settings: this.props.settings,
      fill_color: this.props.fill_color,
      omega_color: omega_color,
      omega_scale: omega_scale,
      show_legend: true,
      axis_scale: axis_scale,
      selected_model: selected_model
    };
  },

  sortNodes: function sortNodes(asc) {
    var self = this;

    self.tree.traverse_and_compute(function (n) {
      var d = 1;
      if (n.children && n.children.length) {
        d += d3.max(n.children, function (d) {
          return d["count_depth"];
        });
      }
      n["count_depth"] = d;
    });

    self.tree.resort_children(function (a, b) {
      return (a["count_depth"] - b["count_depth"]) * (asc ? 1 : -1);
    });
  },

  getBranchLengths: function getBranchLengths() {
    var self = this;

    if (!this.state.json) {
      return [];
    }

    var branch_lengths = self.settings["tree-options"]["hyphy-tree-branch-lengths"][0] ? self.props.models[self.state.selected_model]["branch-lengths"] : null;

    if (!branch_lengths) {
      var nodes = _.filter(self.tree.get_nodes(), function (d) {
        return d.parent;
      });

      branch_lengths = _.object(_.map(nodes, function (d) {
        return d.name;
      }), _.map(nodes, function (d) {
        return parseFloat(d.attribute);
      }));
    }

    return branch_lengths;
  },

  assignBranchAnnotations: function assignBranchAnnotations() {
    if (this.state.json && this.props.models[this.state.selected_model]) {
      this.tree.assign_attributes(this.props.models[this.state.selected_model]["branch-annotations"]);
    }
  },

  renderDiscreteLegendColorScheme: function renderDiscreteLegendColorScheme(svg_container) {
    var self = this,
        svg = self.svg;

    if (!self.state.omega_color || !self.state.omega_scale) {
      return;
    }

    var color_fill = self.state.omega_color(0);

    var margins = {
      bottom: 30,
      top: 15,
      left: 0,
      right: 0
    };

    d3.selectAll("#color-legend").remove();

    var dc_legend = svg.append("g").attr("id", "color-legend").attr("class", "dc-legend").attr("transform", "translate(" + margins["left"] + "," + margins["top"] + ")");

    var fg_item = dc_legend.append("g").attr("class", "dc-legend-item").attr("transform", "translate(0,0)");

    fg_item.append("rect").attr("width", "13").attr("height", "13").attr("fill", color_fill);

    fg_item.append("text").attr("x", "15").attr("y", "11").text("Foreground");

    var bg_item = dc_legend.append("g").attr("class", "dc-legend-item").attr("transform", "translate(0,18)");

    bg_item.append("rect").attr("width", "13").attr("height", "13").attr("fill", "gray");

    bg_item.append("text").attr("x", "15").attr("y", "11").text("Background");
  },

  renderLegendColorScheme: function renderLegendColorScheme(svg_container, attr_name, do_not_render) {
    var self = this;
    var branch_annotations = self.props.models[self.state.selected_model]["branch-annotations"];
    var svg = self.svg;

    if (!self.state.omega_color || !self.state.omega_scale) {
      return;
    }

    // clear existing linearGradients
    d3.selectAll(".legend-definitions").selectAll("linearGradient").remove();
    d3.selectAll("#color-legend").remove();

    if (branch_annotations && !do_not_render) {
      var this_grad = svg.append("defs").attr("class", "legend-definitions").append("linearGradient").attr("id", "_omega_bar").attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");

      self.state.omega_color.domain().forEach(function (d) {
        this_grad.append("stop").attr("offset", "" + self.state.omega_scale(d) * 100 + "%").style("stop-color", self.state.omega_color(d));
      });

      var g_container = svg.append("g").attr("id", "color-legend").attr("transform", "translate(" + self.props.margins["left"] + "," + self.props.margins["top"] + ")");

      g_container.append("rect").attr("x", 0).attr("width", self.props.bar_width - self.props.margins["left"] - self.props.margins["right"]).attr("y", 0).attr("height", self.props.bar_height - self.props.margins["top"] - self.props.margins["bottom"]).style("fill", "url(#_omega_bar)");

      var draw_omega_bar = d3.svg.axis().scale(self.state.axis_scale).orient("left").tickFormat(d3.format(".1r")).tickValues([0, 0.01, 0.1, 0.5, 1, 2, 5, 10]);

      var scale_bar = g_container.append("g");

      scale_bar.style("font-size", "14").attr("class", "hyphy-omega-bar").call(draw_omega_bar);

      scale_bar.selectAll("text").style("text-anchor", "right");

      var x_label = scale_bar.append("g").attr("class", "hyphy-omega-bar");

      x_label = x_label.selectAll("text").data([attr_name]);
      x_label.enter().append("text");
      x_label.text(function (d) {
        return $("<textarea />").html(d).text();
      }).attr("transform", "translate(" + (self.props.bar_width - self.props.margins["left"] - self.props.margins["right"]) * 0.5 + "," + (self.props.bar_height - self.props.margins["bottom"]) + ")").style("text-anchor", "middle").style("font-size", "18").attr("dx", "0.0em").attr("dy", "0.1em");
    }
  },

  setHandlers: function setHandlers() {
    var self = this;

    $("#hyphy-error-hide").on("click", function (e) {
      d3.select("#hyphy-error").style("display", "none");
      e.preventDefault();
    });

    $(".hyphy-tree-trigger").on("click", function (e) {});

    $(".tree-tab-btn").on("click", function (e) {
      self.tree.placenodes().update();
    });

    $("#export-phylo-svg").on("click", function (e) {
      datamonkey.save_image("svg", "#tree_container");
    });

    $("#export-phylo-png").on("click", function (e) {
      datamonkey.save_image("png", "#tree_container");
    });

    $("#export-phylo-nwk").on("click", function (e) {
      var nwk = self.tree.get_newick(function () {});
      var pom = document.createElement("a");
      pom.setAttribute("href", "data:text/octet-stream;charset=utf-8," + encodeURIComponent(nwk));
      pom.setAttribute("download", "nwk.txt");
      $("body").append(pom);
      pom.click();
      pom.remove();
    });
  },

  setTreeHandlers: function setTreeHandlers() {
    var self = this;
    var tree_object = self.tree;

    $("[data-direction]").on("click", function (e) {
      var which_function = $(this).data("direction") == "vertical" ? tree_object.spacing_x : tree_object.spacing_y;
      which_function(which_function() + +$(this).data("amount")).update();
    });

    $(".phylotree-layout-mode").on("change", function (e) {
      if ($(this).is(":checked")) {
        if (tree_object.radial() != ($(this).data("mode") == "radial")) {
          tree_object.radial(!tree_object.radial()).placenodes().update();
        }
      }
    });

    $(".phylotree-align-toggler").on("change", function (e) {
      if ($(this).is(":checked")) {
        tree_object.align_tips($(this).data("align") == "right");
        tree_object.placenodes().update();
      }
    });

    $("#sort_original").on("click", function (e) {
      tree_object.resort_children(function (a, b) {
        return a["original_child_order"] - b["original_child_order"];
      });

      e.preventDefault();
    });

    $("#sort_ascending").on("click", function (e) {
      self.sortNodes(true);
      e.preventDefault();
    });

    $("#sort_descending").on("click", function (e) {
      self.sortNodes(false);
      e.preventDefault();
    });
  },

  setPartitionList: function setPartitionList() {
    var self = this;

    // Check if partition list exists
    if (!self.props.json["partition"]) {
      d3.select("#hyphy-tree-highlight-div").style("display", "none");
      d3.select("#hyphy-tree-highlight").style("display", "none");
      return;
    }

    // set tree partitions
    self.tree.set_partitions(self.props.json["partition"]);

    var partition_list = d3.select("#hyphy-tree-highlight-branches").selectAll("li").data([["None"]].concat(d3.keys(self.props.json["partition"]).map(function (d) {
      return [d];
    }).sort()));

    partition_list.enter().append("li");
    partition_list.exit().remove();
    partition_list = partition_list.selectAll("a").data(function (d) {
      return d;
    });

    partition_list.enter().append("a");
    partition_list.attr("href", "#").on("click", function (d, i) {
      d3.select("#hyphy-tree-highlight").attr("value", d);
    });

    // set default to passed setting
    partition_list.text(function (d) {
      if (d == "RELAX.test") {
        this.click();
      }
      return d;
    });
  },

  changeModelSelection: function changeModelSelection(e) {
    var selected_model = e.target.dataset.type;

    this.setState({
      selected_model: selected_model
    });
  },


  getModelList: function getModelList() {
    var self = this;

    var createListElement = function createListElement(model_type) {
      return React.createElement(
        "li",
        null,
        React.createElement(
          "a",
          {
            href: "#",
            "data-type": model_type,
            onClick: self.changeModelSelection
          },
          model_type
        )
      );
    };

    return _.map(this.props.models, function (d, key) {
      return createListElement(key);
    });
  },

  initialize: function initialize() {
    this.settings = this.state.settings;

    if (!this.settings) {
      return null;
    }

    if (!this.state.json) {
      return null;
    }

    $("#hyphy-tree-branch-lengths").click();

    this.scaling_exponent = 0.33;
    this.omega_format = d3.format(".3r");
    this.prop_format = d3.format(".2p");
    this.fit_format = d3.format(".2f");
    this.p_value_format = d3.format(".4f");

    this.width = 800;
    this.height = 600;

    this.legend_type = this.settings["hyphy-tree-legend-type"];

    this.setHandlers();
    this.initializeTree();
    this.setPartitionList();
  },

  initializeTree: function initializeTree() {
    var self = this;

    var analysis_data = self.state.json;

    var width = this.width,
        height = this.height;

    if (!this.tree) {
      this.tree = d3.layout.phylotree("body").size([height, width]).separation(function (a, b) {
        return 0;
      });
    }

    this.setTreeHandlers();

    // clear any existing svg
    d3.select("#tree_container").html("");

    this.svg = d3.select("#tree_container").append("svg").attr("width", width).attr("height", height);

    this.tree.branch_name(null);
    this.tree.node_span("equal");
    this.tree.options({
      "draw-size-bubbles": false,
      selectable: false,
      "left-right-spacing": "fit-to-size",
      "left-offset": 100,
      "color-fill": this.settings["tree-options"]["hyphy-tree-fill-color"][0]
    }, false);

    this.assignBranchAnnotations();

    if (_.indexOf(_.keys(analysis_data), "tree") > -1) {
      self.tree(analysis_data["tree"]).svg(self.svg);
    } else {
      self.tree(self.props.models[self.state.selected_model]["tree string"]).svg(self.svg);
    }

    self.branch_lengths = this.getBranchLengths();
    self.tree.font_size(18);
    self.tree.scale_bar_font_size(14);
    self.tree.node_circle_size(0);

    self.tree.branch_length(function (n) {
      if (self.branch_lengths) {
        return self.branch_lengths[n.name] || 0;
      }
      return undefined;
    });

    this.assignBranchAnnotations();

    if (self.state.show_legend) {
      if (self.legend_type == "discrete") {
        self.renderDiscreteLegendColorScheme("tree_container");
      } else {
        self.renderLegendColorScheme("tree_container", self.props.models[self.state.selected_model]["annotation-tag"]);
      }
    }

    if (this.settings.edgeColorizer) {
      this.edgeColorizer = _.partial(this.settings.edgeColorizer, _, _, self.state.omega_color);
    }

    this.tree.style_edges(this.edgeColorizer);
    this.tree.style_nodes(this.nodeColorizer);

    this.tree.spacing_x(30, true);
    this.tree.layout();
    this.tree.placenodes().update();
    this.tree.layout();
  },

  componentDidMount: function componentDidMount() {
    this.initialize();
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    var selected_model = _.first(_.keys(nextProps.models));

    this.setState({
      json: nextProps.json,
      settings: nextProps.settings,
      selected_model: selected_model
    });
  },

  componentDidUpdate: function componentDidUpdate() {
    this.initialize();
  },

  render: function render() {
    var dropdownListStyle = {
      paddingLeft: "20px",
      paddingRight: "20px",
      paddingTop: "10px",
      paddingBottom: "10px"
    };

    return React.createElement(
      "div",
      null,
      React.createElement(
        "h4",
        { className: "dm-table-header" },
        "Fitted tree",
        React.createElement("span", {
          className: "glyphicon glyphicon-info-sign",
          style: { verticalAlign: "middle", float: "right" },
          "aria-hidden": "true",
          "data-toggle": "popover",
          "data-trigger": "hover",
          title: "Actions",
          "data-html": "true",
          "data-content": "<ul><li>Hover over a branch to see its inferred rates and significance for selection.</li><ul>",
          "data-placement": "bottom"
        })
      ),
      React.createElement(
        "div",
        { className: "row" },
        React.createElement(
          "div",
          { className: "col-md-12" },
          React.createElement(
            "div",
            { className: "" },
            React.createElement(
              "div",
              { className: "input-group-btn" },
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "btn btn-default dropdown-toggle",
                  "data-toggle": "dropdown"
                },
                "Model",
                " ",
                React.createElement("span", { className: "caret" })
              ),
              React.createElement(
                "ul",
                { className: "dropdown-menu", id: "hyphy-tree-model-list" },
                this.getModelList()
              ),
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "btn btn-default btn-sm",
                  "data-direction": "vertical",
                  "data-amount": "1",
                  title: "Expand vertical spacing"
                },
                React.createElement("i", { className: "fa fa-arrows-v" })
              ),
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "btn btn-default btn-sm",
                  "data-direction": "vertical",
                  "data-amount": "-1",
                  title: "Compress vertical spacing"
                },
                React.createElement("i", { className: "fa  fa-compress fa-rotate-135" })
              ),
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "btn btn-default btn-sm",
                  id: "sort_ascending",
                  title: "Sort deepest clades to the bototm"
                },
                React.createElement("i", { className: "fa fa-sort-amount-asc" })
              ),
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "btn btn-default btn-sm",
                  id: "sort_descending",
                  title: "Sort deepsest clades to the top"
                },
                React.createElement("i", { className: "fa fa-sort-amount-desc" })
              )
            ),
            React.createElement(
              "div",
              { className: "input-group-btn", "data-toggle": "buttons" },
              React.createElement(
                "button",
                { className: "btn btn-default active" },
                React.createElement("input", {
                  type: "radio",
                  name: "options",
                  className: "phylotree-layout-mode",
                  "data-mode": "linear",
                  autoComplete: "off",
                  checked: "",
                  title: "Layout left-to-right"
                }),
                "Linear"
              ),
              React.createElement(
                "button",
                { className: "btn btn-default" },
                React.createElement("input", {
                  type: "radio",
                  name: "options",
                  className: "phylotree-layout-mode",
                  "data-mode": "radial",
                  autoComplete: "off",
                  title: "Layout radially"
                }),
                " ",
                "Radial"
              )
            ),
            React.createElement(
              "div",
              { className: "input-group-btn", "data-toggle": "buttons" },
              React.createElement(
                "button",
                { className: "btn btn-default active" },
                React.createElement("input", {
                  type: "radio",
                  className: "phylotree-align-toggler",
                  "data-align": "left",
                  name: "options-align",
                  autoComplete: "off",
                  checked: "",
                  title: "Align tips labels to branches"
                }),
                React.createElement("i", { className: "fa fa-align-left" })
              ),
              React.createElement(
                "button",
                { className: "btn btn-default btn-sm" },
                React.createElement("input", {
                  type: "radio",
                  className: "phylotree-align-toggler",
                  "data-align": "right",
                  name: "options-align",
                  autoComplete: "off",
                  title: "Align tips labels to the edge of the plot"
                }),
                React.createElement("i", { className: "fa fa-align-right" })
              )
            ),
            React.createElement(
              "div",
              { className: "input-group-btn" },
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "btn btn-default dropdown-toggle",
                  "data-toggle": "dropdown"
                },
                "Export ",
                React.createElement("span", { className: "caret" })
              ),
              React.createElement(
                "ul",
                { className: "dropdown-menu" },
                React.createElement(
                  "li",
                  { id: "export-phylo-png" },
                  React.createElement(
                    "a",
                    { href: "#" },
                    React.createElement("i", { className: "fa fa-image" }),
                    " Image"
                  )
                ),
                React.createElement(
                  "li",
                  { id: "export-phylo-nwk" },
                  React.createElement(
                    "a",
                    { href: "#" },
                    React.createElement("i", { className: "fa fa-file-o" }),
                    " Newick File"
                  )
                )
              )
            ),
            React.createElement(
              "div",
              { className: "input-group-btn" },
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "btn btn-default btn-sm dropdown-toggle",
                  "data-toggle": "dropdown",
                  style: { paddingLeft: "30px" }
                },
                React.createElement("span", { className: "glyphicon glyphicon-cog" }),
                " ",
                React.createElement("span", { className: "caret" })
              ),
              React.createElement(
                "ul",
                { className: "dropdown-menu" },
                React.createElement(
                  "li",
                  { style: dropdownListStyle },
                  React.createElement("input", {
                    type: "checkbox",
                    id: "hyphy-tree-hide-legend",
                    className: "hyphy-tree-trigger",
                    defaultChecked: false,
                    onChange: this.toggleLegend
                  }),
                  " ",
                  "Hide Legend"
                ),
                React.createElement(
                  "li",
                  { style: dropdownListStyle },
                  React.createElement("input", {
                    type: "checkbox",
                    id: "hyphy-tree-fill-color",
                    className: "hyphy-tree-trigger",
                    defaultChecked: !this.props.fill_color,
                    onChange: this.changeColorScale
                  }),
                  " ",
                  "GrayScale"
                )
              )
            )
          )
        )
      ),
      React.createElement(
        "div",
        { className: "row" },
        React.createElement(
          "div",
          { className: "col-md-12" },
          React.createElement(
            "div",
            { className: "row" },
            React.createElement("div", { id: "tree_container", className: "tree-widget" })
          )
        )
      )
    );
  }
});

function render_tree(json, element, settings) {
  return React.render(React.createElement(Tree, { json: json, settings: settings }), $(element)[0]);
}

function rerender_tree(json, element, settings) {
  $(element).empty();
  return render_tree(json, settings);
}

module.exports.Tree = Tree;
module.exports.render_tree = render_tree;
module.exports.rerender_tree = rerender_tree;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6), __webpack_require__(9), __webpack_require__(3)))

/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _prodInvariant = __webpack_require__(4);

var ReactErrorUtils = __webpack_require__(66);

var invariant = __webpack_require__(1);
var warning = __webpack_require__(2);

/**
 * Injected dependencies:
 */

/**
 * - `ComponentTree`: [required] Module that can convert between React instances
 *   and actual node references.
 */
var ComponentTree;
var TreeTraversal;
var injection = {
  injectComponentTree: function (Injected) {
    ComponentTree = Injected;
    if (process.env.NODE_ENV !== 'production') {
      process.env.NODE_ENV !== 'production' ? warning(Injected && Injected.getNodeFromInstance && Injected.getInstanceFromNode, 'EventPluginUtils.injection.injectComponentTree(...): Injected ' + 'module is missing getNodeFromInstance or getInstanceFromNode.') : void 0;
    }
  },
  injectTreeTraversal: function (Injected) {
    TreeTraversal = Injected;
    if (process.env.NODE_ENV !== 'production') {
      process.env.NODE_ENV !== 'production' ? warning(Injected && Injected.isAncestor && Injected.getLowestCommonAncestor, 'EventPluginUtils.injection.injectTreeTraversal(...): Injected ' + 'module is missing isAncestor or getLowestCommonAncestor.') : void 0;
    }
  }
};

function isEndish(topLevelType) {
  return topLevelType === 'topMouseUp' || topLevelType === 'topTouchEnd' || topLevelType === 'topTouchCancel';
}

function isMoveish(topLevelType) {
  return topLevelType === 'topMouseMove' || topLevelType === 'topTouchMove';
}
function isStartish(topLevelType) {
  return topLevelType === 'topMouseDown' || topLevelType === 'topTouchStart';
}

var validateEventDispatches;
if (process.env.NODE_ENV !== 'production') {
  validateEventDispatches = function (event) {
    var dispatchListeners = event._dispatchListeners;
    var dispatchInstances = event._dispatchInstances;

    var listenersIsArr = Array.isArray(dispatchListeners);
    var listenersLen = listenersIsArr ? dispatchListeners.length : dispatchListeners ? 1 : 0;

    var instancesIsArr = Array.isArray(dispatchInstances);
    var instancesLen = instancesIsArr ? dispatchInstances.length : dispatchInstances ? 1 : 0;

    process.env.NODE_ENV !== 'production' ? warning(instancesIsArr === listenersIsArr && instancesLen === listenersLen, 'EventPluginUtils: Invalid `event`.') : void 0;
  };
}

/**
 * Dispatch the event to the listener.
 * @param {SyntheticEvent} event SyntheticEvent to handle
 * @param {boolean} simulated If the event is simulated (changes exn behavior)
 * @param {function} listener Application-level callback
 * @param {*} inst Internal component instance
 */
function executeDispatch(event, simulated, listener, inst) {
  var type = event.type || 'unknown-event';
  event.currentTarget = EventPluginUtils.getNodeFromInstance(inst);
  if (simulated) {
    ReactErrorUtils.invokeGuardedCallbackWithCatch(type, listener, event);
  } else {
    ReactErrorUtils.invokeGuardedCallback(type, listener, event);
  }
  event.currentTarget = null;
}

/**
 * Standard/simple iteration through an event's collected dispatches.
 */
function executeDispatchesInOrder(event, simulated) {
  var dispatchListeners = event._dispatchListeners;
  var dispatchInstances = event._dispatchInstances;
  if (process.env.NODE_ENV !== 'production') {
    validateEventDispatches(event);
  }
  if (Array.isArray(dispatchListeners)) {
    for (var i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break;
      }
      // Listeners and Instances are two parallel arrays that are always in sync.
      executeDispatch(event, simulated, dispatchListeners[i], dispatchInstances[i]);
    }
  } else if (dispatchListeners) {
    executeDispatch(event, simulated, dispatchListeners, dispatchInstances);
  }
  event._dispatchListeners = null;
  event._dispatchInstances = null;
}

/**
 * Standard/simple iteration through an event's collected dispatches, but stops
 * at the first dispatch execution returning true, and returns that id.
 *
 * @return {?string} id of the first dispatch execution who's listener returns
 * true, or null if no listener returned true.
 */
function executeDispatchesInOrderStopAtTrueImpl(event) {
  var dispatchListeners = event._dispatchListeners;
  var dispatchInstances = event._dispatchInstances;
  if (process.env.NODE_ENV !== 'production') {
    validateEventDispatches(event);
  }
  if (Array.isArray(dispatchListeners)) {
    for (var i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break;
      }
      // Listeners and Instances are two parallel arrays that are always in sync.
      if (dispatchListeners[i](event, dispatchInstances[i])) {
        return dispatchInstances[i];
      }
    }
  } else if (dispatchListeners) {
    if (dispatchListeners(event, dispatchInstances)) {
      return dispatchInstances;
    }
  }
  return null;
}

/**
 * @see executeDispatchesInOrderStopAtTrueImpl
 */
function executeDispatchesInOrderStopAtTrue(event) {
  var ret = executeDispatchesInOrderStopAtTrueImpl(event);
  event._dispatchInstances = null;
  event._dispatchListeners = null;
  return ret;
}

/**
 * Execution of a "direct" dispatch - there must be at most one dispatch
 * accumulated on the event or it is considered an error. It doesn't really make
 * sense for an event with multiple dispatches (bubbled) to keep track of the
 * return values at each dispatch execution, but it does tend to make sense when
 * dealing with "direct" dispatches.
 *
 * @return {*} The return value of executing the single dispatch.
 */
function executeDirectDispatch(event) {
  if (process.env.NODE_ENV !== 'production') {
    validateEventDispatches(event);
  }
  var dispatchListener = event._dispatchListeners;
  var dispatchInstance = event._dispatchInstances;
  !!Array.isArray(dispatchListener) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'executeDirectDispatch(...): Invalid `event`.') : _prodInvariant('103') : void 0;
  event.currentTarget = dispatchListener ? EventPluginUtils.getNodeFromInstance(dispatchInstance) : null;
  var res = dispatchListener ? dispatchListener(event) : null;
  event.currentTarget = null;
  event._dispatchListeners = null;
  event._dispatchInstances = null;
  return res;
}

/**
 * @param {SyntheticEvent} event
 * @return {boolean} True iff number of dispatches accumulated is greater than 0.
 */
function hasDispatches(event) {
  return !!event._dispatchListeners;
}

/**
 * General utilities that are useful in creating custom Event Plugins.
 */
var EventPluginUtils = {
  isEndish: isEndish,
  isMoveish: isMoveish,
  isStartish: isStartish,

  executeDirectDispatch: executeDirectDispatch,
  executeDispatchesInOrder: executeDispatchesInOrder,
  executeDispatchesInOrderStopAtTrue: executeDispatchesInOrderStopAtTrue,
  hasDispatches: hasDispatches,

  getInstanceFromNode: function (node) {
    return ComponentTree.getInstanceFromNode(node);
  },
  getNodeFromInstance: function (node) {
    return ComponentTree.getNodeFromInstance(node);
  },
  isAncestor: function (a, b) {
    return TreeTraversal.isAncestor(a, b);
  },
  getLowestCommonAncestor: function (a, b) {
    return TreeTraversal.getLowestCommonAncestor(a, b);
  },
  getParentInstance: function (inst) {
    return TreeTraversal.getParentInstance(inst);
  },
  traverseTwoPhase: function (target, fn, arg) {
    return TreeTraversal.traverseTwoPhase(target, fn, arg);
  },
  traverseEnterLeave: function (from, to, fn, argFrom, argTo) {
    return TreeTraversal.traverseEnterLeave(from, to, fn, argFrom, argTo);
  },

  injection: injection
};

module.exports = EventPluginUtils;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var caughtError = null;

/**
 * Call a function while guarding against errors that happens within it.
 *
 * @param {String} name of the guard to use for logging or debugging
 * @param {Function} func The function to invoke
 * @param {*} a First argument
 * @param {*} b Second argument
 */
function invokeGuardedCallback(name, func, a) {
  try {
    func(a);
  } catch (x) {
    if (caughtError === null) {
      caughtError = x;
    }
  }
}

var ReactErrorUtils = {
  invokeGuardedCallback: invokeGuardedCallback,

  /**
   * Invoked by ReactTestUtils.Simulate so that any errors thrown by the event
   * handler are sure to be rethrown by rethrowCaughtError.
   */
  invokeGuardedCallbackWithCatch: invokeGuardedCallback,

  /**
   * During execution of guarded functions we will capture the first error which
   * we will rethrow to be handled by the top level error handler.
   */
  rethrowCaughtError: function () {
    if (caughtError) {
      var error = caughtError;
      caughtError = null;
      throw error;
    }
  }
};

if (process.env.NODE_ENV !== 'production') {
  /**
   * To help development we can get better devtools integration by simulating a
   * real browser event.
   */
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof document !== 'undefined' && typeof document.createEvent === 'function') {
    var fakeNode = document.createElement('react');
    ReactErrorUtils.invokeGuardedCallback = function (name, func, a) {
      var boundFunc = func.bind(null, a);
      var evtType = 'react-' + name;
      fakeNode.addEventListener(evtType, boundFunc, false);
      var evt = document.createEvent('Event');
      evt.initEvent(evtType, false, false);
      fakeNode.dispatchEvent(evt);
      fakeNode.removeEventListener(evtType, boundFunc, false);
    };
  }
}

module.exports = ReactErrorUtils;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 67 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



/**
 * Gets the target node from a native browser event by accounting for
 * inconsistencies in browser DOM APIs.
 *
 * @param {object} nativeEvent Native browser event.
 * @return {DOMEventTarget} Target node.
 */

function getEventTarget(nativeEvent) {
  var target = nativeEvent.target || nativeEvent.srcElement || window;

  // Normalize SVG <use> element events #4963
  if (target.correspondingUseElement) {
    target = target.correspondingUseElement;
  }

  // Safari may fire events on text nodes (Node.TEXT_NODE is 3).
  // @see http://www.quirksmode.org/js/events_properties.html
  return target.nodeType === 3 ? target.parentNode : target;
}

module.exports = getEventTarget;

/***/ }),
/* 68 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var ExecutionEnvironment = __webpack_require__(10);

var useHasFeature;
if (ExecutionEnvironment.canUseDOM) {
  useHasFeature = document.implementation && document.implementation.hasFeature &&
  // always returns true in newer browsers as per the standard.
  // @see http://dom.spec.whatwg.org/#dom-domimplementation-hasfeature
  document.implementation.hasFeature('', '') !== true;
}

/**
 * Checks if an event is supported in the current execution environment.
 *
 * NOTE: This will not work correctly for non-generic events such as `change`,
 * `reset`, `load`, `error`, and `select`.
 *
 * Borrows from Modernizr.
 *
 * @param {string} eventNameSuffix Event name, e.g. "click".
 * @param {?boolean} capture Check if the capture phase is supported.
 * @return {boolean} True if the event is supported.
 * @internal
 * @license Modernizr 3.0.0pre (Custom Build) | MIT
 */
function isEventSupported(eventNameSuffix, capture) {
  if (!ExecutionEnvironment.canUseDOM || capture && !('addEventListener' in document)) {
    return false;
  }

  var eventName = 'on' + eventNameSuffix;
  var isSupported = eventName in document;

  if (!isSupported) {
    var element = document.createElement('div');
    element.setAttribute(eventName, 'return;');
    isSupported = typeof element[eventName] === 'function';
  }

  if (!isSupported && useHasFeature && eventNameSuffix === 'wheel') {
    // This is the only way to test support for the `wheel` event in IE9+.
    isSupported = document.implementation.hasFeature('Events.wheel', '3.0');
  }

  return isSupported;
}

module.exports = isEventSupported;

/***/ }),
/* 69 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



/**
 * Translation from modifier key to the associated property in the event.
 * @see http://www.w3.org/TR/DOM-Level-3-Events/#keys-Modifiers
 */

var modifierKeyToProp = {
  Alt: 'altKey',
  Control: 'ctrlKey',
  Meta: 'metaKey',
  Shift: 'shiftKey'
};

// IE8 does not implement getModifierState so we simply map it to the only
// modifier keys exposed by the event itself, does not support Lock-keys.
// Currently, all major browsers except Chrome seems to support Lock-keys.
function modifierStateGetter(keyArg) {
  var syntheticEvent = this;
  var nativeEvent = syntheticEvent.nativeEvent;
  if (nativeEvent.getModifierState) {
    return nativeEvent.getModifierState(keyArg);
  }
  var keyProp = modifierKeyToProp[keyArg];
  return keyProp ? !!nativeEvent[keyProp] : false;
}

function getEventModifierState(nativeEvent) {
  return modifierStateGetter;
}

module.exports = getEventModifierState;

/***/ }),
/* 70 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var DOMLazyTree = __webpack_require__(34);
var Danger = __webpack_require__(220);
var ReactDOMComponentTree = __webpack_require__(8);
var ReactInstrumentation = __webpack_require__(12);

var createMicrosoftUnsafeLocalFunction = __webpack_require__(72);
var setInnerHTML = __webpack_require__(54);
var setTextContent = __webpack_require__(107);

function getNodeAfter(parentNode, node) {
  // Special case for text components, which return [open, close] comments
  // from getHostNode.
  if (Array.isArray(node)) {
    node = node[1];
  }
  return node ? node.nextSibling : parentNode.firstChild;
}

/**
 * Inserts `childNode` as a child of `parentNode` at the `index`.
 *
 * @param {DOMElement} parentNode Parent node in which to insert.
 * @param {DOMElement} childNode Child node to insert.
 * @param {number} index Index at which to insert the child.
 * @internal
 */
var insertChildAt = createMicrosoftUnsafeLocalFunction(function (parentNode, childNode, referenceNode) {
  // We rely exclusively on `insertBefore(node, null)` instead of also using
  // `appendChild(node)`. (Using `undefined` is not allowed by all browsers so
  // we are careful to use `null`.)
  parentNode.insertBefore(childNode, referenceNode);
});

function insertLazyTreeChildAt(parentNode, childTree, referenceNode) {
  DOMLazyTree.insertTreeBefore(parentNode, childTree, referenceNode);
}

function moveChild(parentNode, childNode, referenceNode) {
  if (Array.isArray(childNode)) {
    moveDelimitedText(parentNode, childNode[0], childNode[1], referenceNode);
  } else {
    insertChildAt(parentNode, childNode, referenceNode);
  }
}

function removeChild(parentNode, childNode) {
  if (Array.isArray(childNode)) {
    var closingComment = childNode[1];
    childNode = childNode[0];
    removeDelimitedText(parentNode, childNode, closingComment);
    parentNode.removeChild(closingComment);
  }
  parentNode.removeChild(childNode);
}

function moveDelimitedText(parentNode, openingComment, closingComment, referenceNode) {
  var node = openingComment;
  while (true) {
    var nextNode = node.nextSibling;
    insertChildAt(parentNode, node, referenceNode);
    if (node === closingComment) {
      break;
    }
    node = nextNode;
  }
}

function removeDelimitedText(parentNode, startNode, closingComment) {
  while (true) {
    var node = startNode.nextSibling;
    if (node === closingComment) {
      // The closing comment is removed by ReactMultiChild.
      break;
    } else {
      parentNode.removeChild(node);
    }
  }
}

function replaceDelimitedText(openingComment, closingComment, stringText) {
  var parentNode = openingComment.parentNode;
  var nodeAfterComment = openingComment.nextSibling;
  if (nodeAfterComment === closingComment) {
    // There are no text nodes between the opening and closing comments; insert
    // a new one if stringText isn't empty.
    if (stringText) {
      insertChildAt(parentNode, document.createTextNode(stringText), nodeAfterComment);
    }
  } else {
    if (stringText) {
      // Set the text content of the first node after the opening comment, and
      // remove all following nodes up until the closing comment.
      setTextContent(nodeAfterComment, stringText);
      removeDelimitedText(parentNode, nodeAfterComment, closingComment);
    } else {
      removeDelimitedText(parentNode, openingComment, closingComment);
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    ReactInstrumentation.debugTool.onHostOperation({
      instanceID: ReactDOMComponentTree.getInstanceFromNode(openingComment)._debugID,
      type: 'replace text',
      payload: stringText
    });
  }
}

var dangerouslyReplaceNodeWithMarkup = Danger.dangerouslyReplaceNodeWithMarkup;
if (process.env.NODE_ENV !== 'production') {
  dangerouslyReplaceNodeWithMarkup = function (oldChild, markup, prevInstance) {
    Danger.dangerouslyReplaceNodeWithMarkup(oldChild, markup);
    if (prevInstance._debugID !== 0) {
      ReactInstrumentation.debugTool.onHostOperation({
        instanceID: prevInstance._debugID,
        type: 'replace with',
        payload: markup.toString()
      });
    } else {
      var nextInstance = ReactDOMComponentTree.getInstanceFromNode(markup.node);
      if (nextInstance._debugID !== 0) {
        ReactInstrumentation.debugTool.onHostOperation({
          instanceID: nextInstance._debugID,
          type: 'mount',
          payload: markup.toString()
        });
      }
    }
  };
}

/**
 * Operations for updating with DOM children.
 */
var DOMChildrenOperations = {
  dangerouslyReplaceNodeWithMarkup: dangerouslyReplaceNodeWithMarkup,

  replaceDelimitedText: replaceDelimitedText,

  /**
   * Updates a component's children by processing a series of updates. The
   * update configurations are each expected to have a `parentNode` property.
   *
   * @param {array<object>} updates List of update configurations.
   * @internal
   */
  processUpdates: function (parentNode, updates) {
    if (process.env.NODE_ENV !== 'production') {
      var parentNodeDebugID = ReactDOMComponentTree.getInstanceFromNode(parentNode)._debugID;
    }

    for (var k = 0; k < updates.length; k++) {
      var update = updates[k];
      switch (update.type) {
        case 'INSERT_MARKUP':
          insertLazyTreeChildAt(parentNode, update.content, getNodeAfter(parentNode, update.afterNode));
          if (process.env.NODE_ENV !== 'production') {
            ReactInstrumentation.debugTool.onHostOperation({
              instanceID: parentNodeDebugID,
              type: 'insert child',
              payload: {
                toIndex: update.toIndex,
                content: update.content.toString()
              }
            });
          }
          break;
        case 'MOVE_EXISTING':
          moveChild(parentNode, update.fromNode, getNodeAfter(parentNode, update.afterNode));
          if (process.env.NODE_ENV !== 'production') {
            ReactInstrumentation.debugTool.onHostOperation({
              instanceID: parentNodeDebugID,
              type: 'move child',
              payload: { fromIndex: update.fromIndex, toIndex: update.toIndex }
            });
          }
          break;
        case 'SET_MARKUP':
          setInnerHTML(parentNode, update.content);
          if (process.env.NODE_ENV !== 'production') {
            ReactInstrumentation.debugTool.onHostOperation({
              instanceID: parentNodeDebugID,
              type: 'replace children',
              payload: update.content.toString()
            });
          }
          break;
        case 'TEXT_CONTENT':
          setTextContent(parentNode, update.content);
          if (process.env.NODE_ENV !== 'production') {
            ReactInstrumentation.debugTool.onHostOperation({
              instanceID: parentNodeDebugID,
              type: 'replace text',
              payload: update.content.toString()
            });
          }
          break;
        case 'REMOVE_NODE':
          removeChild(parentNode, update.fromNode);
          if (process.env.NODE_ENV !== 'production') {
            ReactInstrumentation.debugTool.onHostOperation({
              instanceID: parentNodeDebugID,
              type: 'remove child',
              payload: { fromIndex: update.fromIndex }
            });
          }
          break;
      }
    }
  }
};

module.exports = DOMChildrenOperations;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 71 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var DOMNamespaces = {
  html: 'http://www.w3.org/1999/xhtml',
  mathml: 'http://www.w3.org/1998/Math/MathML',
  svg: 'http://www.w3.org/2000/svg'
};

module.exports = DOMNamespaces;

/***/ }),
/* 72 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/* globals MSApp */



/**
 * Create a function which has 'unsafe' privileges (required by windows8 apps)
 */

var createMicrosoftUnsafeLocalFunction = function (func) {
  if (typeof MSApp !== 'undefined' && MSApp.execUnsafeLocalFunction) {
    return function (arg0, arg1, arg2, arg3) {
      MSApp.execUnsafeLocalFunction(function () {
        return func(arg0, arg1, arg2, arg3);
      });
    };
  } else {
    return func;
  }
};

module.exports = createMicrosoftUnsafeLocalFunction;

/***/ }),
/* 73 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _prodInvariant = __webpack_require__(4);

var ReactPropTypesSecret = __webpack_require__(111);
var propTypesFactory = __webpack_require__(95);

var React = __webpack_require__(31);
var PropTypes = propTypesFactory(React.isValidElement);

var invariant = __webpack_require__(1);
var warning = __webpack_require__(2);

var hasReadOnlyValue = {
  button: true,
  checkbox: true,
  image: true,
  hidden: true,
  radio: true,
  reset: true,
  submit: true
};

function _assertSingleLink(inputProps) {
  !(inputProps.checkedLink == null || inputProps.valueLink == null) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Cannot provide a checkedLink and a valueLink. If you want to use checkedLink, you probably don\'t want to use valueLink and vice versa.') : _prodInvariant('87') : void 0;
}
function _assertValueLink(inputProps) {
  _assertSingleLink(inputProps);
  !(inputProps.value == null && inputProps.onChange == null) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Cannot provide a valueLink and a value or onChange event. If you want to use value or onChange, you probably don\'t want to use valueLink.') : _prodInvariant('88') : void 0;
}

function _assertCheckedLink(inputProps) {
  _assertSingleLink(inputProps);
  !(inputProps.checked == null && inputProps.onChange == null) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Cannot provide a checkedLink and a checked property or onChange event. If you want to use checked or onChange, you probably don\'t want to use checkedLink') : _prodInvariant('89') : void 0;
}

var propTypes = {
  value: function (props, propName, componentName) {
    if (!props[propName] || hasReadOnlyValue[props.type] || props.onChange || props.readOnly || props.disabled) {
      return null;
    }
    return new Error('You provided a `value` prop to a form field without an ' + '`onChange` handler. This will render a read-only field. If ' + 'the field should be mutable use `defaultValue`. Otherwise, ' + 'set either `onChange` or `readOnly`.');
  },
  checked: function (props, propName, componentName) {
    if (!props[propName] || props.onChange || props.readOnly || props.disabled) {
      return null;
    }
    return new Error('You provided a `checked` prop to a form field without an ' + '`onChange` handler. This will render a read-only field. If ' + 'the field should be mutable use `defaultChecked`. Otherwise, ' + 'set either `onChange` or `readOnly`.');
  },
  onChange: PropTypes.func
};

var loggedTypeFailures = {};
function getDeclarationErrorAddendum(owner) {
  if (owner) {
    var name = owner.getName();
    if (name) {
      return ' Check the render method of `' + name + '`.';
    }
  }
  return '';
}

/**
 * Provide a linked `value` attribute for controlled forms. You should not use
 * this outside of the ReactDOM controlled form components.
 */
var LinkedValueUtils = {
  checkPropTypes: function (tagName, props, owner) {
    for (var propName in propTypes) {
      if (propTypes.hasOwnProperty(propName)) {
        var error = propTypes[propName](props, propName, tagName, 'prop', null, ReactPropTypesSecret);
      }
      if (error instanceof Error && !(error.message in loggedTypeFailures)) {
        // Only monitor this failure once because there tends to be a lot of the
        // same error.
        loggedTypeFailures[error.message] = true;

        var addendum = getDeclarationErrorAddendum(owner);
        process.env.NODE_ENV !== 'production' ? warning(false, 'Failed form propType: %s%s', error.message, addendum) : void 0;
      }
    }
  },

  /**
   * @param {object} inputProps Props for form component
   * @return {*} current value of the input either from value prop or link.
   */
  getValue: function (inputProps) {
    if (inputProps.valueLink) {
      _assertValueLink(inputProps);
      return inputProps.valueLink.value;
    }
    return inputProps.value;
  },

  /**
   * @param {object} inputProps Props for form component
   * @return {*} current checked status of the input either from checked prop
   *             or link.
   */
  getChecked: function (inputProps) {
    if (inputProps.checkedLink) {
      _assertCheckedLink(inputProps);
      return inputProps.checkedLink.value;
    }
    return inputProps.checked;
  },

  /**
   * @param {object} inputProps Props for form component
   * @param {SyntheticEvent} event change event to handle
   */
  executeOnChange: function (inputProps, event) {
    if (inputProps.valueLink) {
      _assertValueLink(inputProps);
      return inputProps.valueLink.requestChange(event.target.value);
    } else if (inputProps.checkedLink) {
      _assertCheckedLink(inputProps);
      return inputProps.checkedLink.requestChange(event.target.checked);
    } else if (inputProps.onChange) {
      return inputProps.onChange.call(undefined, event);
    }
  }
};

module.exports = LinkedValueUtils;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 74 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var _prodInvariant = __webpack_require__(4);

var invariant = __webpack_require__(1);

var injected = false;

var ReactComponentEnvironment = {
  /**
   * Optionally injectable hook for swapping out mount images in the middle of
   * the tree.
   */
  replaceNodeWithMarkup: null,

  /**
   * Optionally injectable hook for processing a queue of child updates. Will
   * later move into MultiChildComponents.
   */
  processChildrenUpdates: null,

  injection: {
    injectEnvironment: function (environment) {
      !!injected ? process.env.NODE_ENV !== 'production' ? invariant(false, 'ReactCompositeComponent: injectEnvironment() can only be called once.') : _prodInvariant('104') : void 0;
      ReactComponentEnvironment.replaceNodeWithMarkup = environment.replaceNodeWithMarkup;
      ReactComponentEnvironment.processChildrenUpdates = environment.processChildrenUpdates;
      injected = true;
    }
  }
};

module.exports = ReactComponentEnvironment;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 75 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @typechecks
 * 
 */

/*eslint-disable no-self-compare */



var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * inlined Object.is polyfill to avoid requiring consumers ship their own
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
 */
function is(x, y) {
  // SameValue algorithm
  if (x === y) {
    // Steps 1-5, 7-10
    // Steps 6.b-6.e: +0 != -0
    // Added the nonzero y check to make Flow happy, but it is redundant
    return x !== 0 || y !== 0 || 1 / x === 1 / y;
  } else {
    // Step 6.a: NaN == NaN
    return x !== x && y !== y;
  }
}

/**
 * Performs equality by iterating through keys on an object and returning false
 * when any key has values which are not strictly equal between the arguments.
 * Returns true when the values of all keys are strictly equal.
 */
function shallowEqual(objA, objB) {
  if (is(objA, objB)) {
    return true;
  }

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  var keysA = Object.keys(objA);
  var keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Test for A's keys different from B.
  for (var i = 0; i < keysA.length; i++) {
    if (!hasOwnProperty.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }

  return true;
}

module.exports = shallowEqual;

/***/ }),
/* 76 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



/**
 * Given a `prevElement` and `nextElement`, determines if the existing
 * instance should be updated as opposed to being destroyed or replaced by a new
 * instance. Both arguments are elements. This ensures that this logic can
 * operate on stateless trees without any backing instance.
 *
 * @param {?object} prevElement
 * @param {?object} nextElement
 * @return {boolean} True if the existing instance should be updated.
 * @protected
 */

function shouldUpdateReactComponent(prevElement, nextElement) {
  var prevEmpty = prevElement === null || prevElement === false;
  var nextEmpty = nextElement === null || nextElement === false;
  if (prevEmpty || nextEmpty) {
    return prevEmpty === nextEmpty;
  }

  var prevType = typeof prevElement;
  var nextType = typeof nextElement;
  if (prevType === 'string' || prevType === 'number') {
    return nextType === 'string' || nextType === 'number';
  } else {
    return nextType === 'object' && prevElement.type === nextElement.type && prevElement.key === nextElement.key;
  }
}

module.exports = shouldUpdateReactComponent;

/***/ }),
/* 77 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



/**
 * Escape and wrap key so it is safe to use as a reactid
 *
 * @param {string} key to be escaped.
 * @return {string} the escaped key.
 */

function escape(key) {
  var escapeRegex = /[=:]/g;
  var escaperLookup = {
    '=': '=0',
    ':': '=2'
  };
  var escapedString = ('' + key).replace(escapeRegex, function (match) {
    return escaperLookup[match];
  });

  return '$' + escapedString;
}

/**
 * Unescape and unwrap key for human-readable display
 *
 * @param {string} key to unescape.
 * @return {string} the unescaped key.
 */
function unescape(key) {
  var unescapeRegex = /(=0|=2)/g;
  var unescaperLookup = {
    '=0': '=',
    '=2': ':'
  };
  var keySubstring = key[0] === '.' && key[1] === '$' ? key.substring(2) : key.substring(1);

  return ('' + keySubstring).replace(unescapeRegex, function (match) {
    return unescaperLookup[match];
  });
}

var KeyEscapeUtils = {
  escape: escape,
  unescape: unescape
};

module.exports = KeyEscapeUtils;

/***/ }),
/* 78 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _prodInvariant = __webpack_require__(4);

var ReactCurrentOwner = __webpack_require__(14);
var ReactInstanceMap = __webpack_require__(43);
var ReactInstrumentation = __webpack_require__(12);
var ReactUpdates = __webpack_require__(15);

var invariant = __webpack_require__(1);
var warning = __webpack_require__(2);

function enqueueUpdate(internalInstance) {
  ReactUpdates.enqueueUpdate(internalInstance);
}

function formatUnexpectedArgument(arg) {
  var type = typeof arg;
  if (type !== 'object') {
    return type;
  }
  var displayName = arg.constructor && arg.constructor.name || type;
  var keys = Object.keys(arg);
  if (keys.length > 0 && keys.length < 20) {
    return displayName + ' (keys: ' + keys.join(', ') + ')';
  }
  return displayName;
}

function getInternalInstanceReadyForUpdate(publicInstance, callerName) {
  var internalInstance = ReactInstanceMap.get(publicInstance);
  if (!internalInstance) {
    if (process.env.NODE_ENV !== 'production') {
      var ctor = publicInstance.constructor;
      // Only warn when we have a callerName. Otherwise we should be silent.
      // We're probably calling from enqueueCallback. We don't want to warn
      // there because we already warned for the corresponding lifecycle method.
      process.env.NODE_ENV !== 'production' ? warning(!callerName, '%s(...): Can only update a mounted or mounting component. ' + 'This usually means you called %s() on an unmounted component. ' + 'This is a no-op. Please check the code for the %s component.', callerName, callerName, ctor && (ctor.displayName || ctor.name) || 'ReactClass') : void 0;
    }
    return null;
  }

  if (process.env.NODE_ENV !== 'production') {
    process.env.NODE_ENV !== 'production' ? warning(ReactCurrentOwner.current == null, '%s(...): Cannot update during an existing state transition (such as ' + "within `render` or another component's constructor). Render methods " + 'should be a pure function of props and state; constructor ' + 'side-effects are an anti-pattern, but can be moved to ' + '`componentWillMount`.', callerName) : void 0;
  }

  return internalInstance;
}

/**
 * ReactUpdateQueue allows for state updates to be scheduled into a later
 * reconciliation step.
 */
var ReactUpdateQueue = {
  /**
   * Checks whether or not this composite component is mounted.
   * @param {ReactClass} publicInstance The instance we want to test.
   * @return {boolean} True if mounted, false otherwise.
   * @protected
   * @final
   */
  isMounted: function (publicInstance) {
    if (process.env.NODE_ENV !== 'production') {
      var owner = ReactCurrentOwner.current;
      if (owner !== null) {
        process.env.NODE_ENV !== 'production' ? warning(owner._warnedAboutRefsInRender, '%s is accessing isMounted inside its render() function. ' + 'render() should be a pure function of props and state. It should ' + 'never access something that requires stale data from the previous ' + 'render, such as refs. Move this logic to componentDidMount and ' + 'componentDidUpdate instead.', owner.getName() || 'A component') : void 0;
        owner._warnedAboutRefsInRender = true;
      }
    }
    var internalInstance = ReactInstanceMap.get(publicInstance);
    if (internalInstance) {
      // During componentWillMount and render this will still be null but after
      // that will always render to something. At least for now. So we can use
      // this hack.
      return !!internalInstance._renderedComponent;
    } else {
      return false;
    }
  },

  /**
   * Enqueue a callback that will be executed after all the pending updates
   * have processed.
   *
   * @param {ReactClass} publicInstance The instance to use as `this` context.
   * @param {?function} callback Called after state is updated.
   * @param {string} callerName Name of the calling function in the public API.
   * @internal
   */
  enqueueCallback: function (publicInstance, callback, callerName) {
    ReactUpdateQueue.validateCallback(callback, callerName);
    var internalInstance = getInternalInstanceReadyForUpdate(publicInstance);

    // Previously we would throw an error if we didn't have an internal
    // instance. Since we want to make it a no-op instead, we mirror the same
    // behavior we have in other enqueue* methods.
    // We also need to ignore callbacks in componentWillMount. See
    // enqueueUpdates.
    if (!internalInstance) {
      return null;
    }

    if (internalInstance._pendingCallbacks) {
      internalInstance._pendingCallbacks.push(callback);
    } else {
      internalInstance._pendingCallbacks = [callback];
    }
    // TODO: The callback here is ignored when setState is called from
    // componentWillMount. Either fix it or disallow doing so completely in
    // favor of getInitialState. Alternatively, we can disallow
    // componentWillMount during server-side rendering.
    enqueueUpdate(internalInstance);
  },

  enqueueCallbackInternal: function (internalInstance, callback) {
    if (internalInstance._pendingCallbacks) {
      internalInstance._pendingCallbacks.push(callback);
    } else {
      internalInstance._pendingCallbacks = [callback];
    }
    enqueueUpdate(internalInstance);
  },

  /**
   * Forces an update. This should only be invoked when it is known with
   * certainty that we are **not** in a DOM transaction.
   *
   * You may want to call this when you know that some deeper aspect of the
   * component's state has changed but `setState` was not called.
   *
   * This will not invoke `shouldComponentUpdate`, but it will invoke
   * `componentWillUpdate` and `componentDidUpdate`.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @internal
   */
  enqueueForceUpdate: function (publicInstance) {
    var internalInstance = getInternalInstanceReadyForUpdate(publicInstance, 'forceUpdate');

    if (!internalInstance) {
      return;
    }

    internalInstance._pendingForceUpdate = true;

    enqueueUpdate(internalInstance);
  },

  /**
   * Replaces all of the state. Always use this or `setState` to mutate state.
   * You should treat `this.state` as immutable.
   *
   * There is no guarantee that `this.state` will be immediately updated, so
   * accessing `this.state` after calling this method may return the old value.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} completeState Next state.
   * @internal
   */
  enqueueReplaceState: function (publicInstance, completeState, callback) {
    var internalInstance = getInternalInstanceReadyForUpdate(publicInstance, 'replaceState');

    if (!internalInstance) {
      return;
    }

    internalInstance._pendingStateQueue = [completeState];
    internalInstance._pendingReplaceState = true;

    // Future-proof 15.5
    if (callback !== undefined && callback !== null) {
      ReactUpdateQueue.validateCallback(callback, 'replaceState');
      if (internalInstance._pendingCallbacks) {
        internalInstance._pendingCallbacks.push(callback);
      } else {
        internalInstance._pendingCallbacks = [callback];
      }
    }

    enqueueUpdate(internalInstance);
  },

  /**
   * Sets a subset of the state. This only exists because _pendingState is
   * internal. This provides a merging strategy that is not available to deep
   * properties which is confusing. TODO: Expose pendingState or don't use it
   * during the merge.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} partialState Next partial state to be merged with state.
   * @internal
   */
  enqueueSetState: function (publicInstance, partialState) {
    if (process.env.NODE_ENV !== 'production') {
      ReactInstrumentation.debugTool.onSetState();
      process.env.NODE_ENV !== 'production' ? warning(partialState != null, 'setState(...): You passed an undefined or null state object; ' + 'instead, use forceUpdate().') : void 0;
    }

    var internalInstance = getInternalInstanceReadyForUpdate(publicInstance, 'setState');

    if (!internalInstance) {
      return;
    }

    var queue = internalInstance._pendingStateQueue || (internalInstance._pendingStateQueue = []);
    queue.push(partialState);

    enqueueUpdate(internalInstance);
  },

  enqueueElementInternal: function (internalInstance, nextElement, nextContext) {
    internalInstance._pendingElement = nextElement;
    // TODO: introduce _pendingContext instead of setting it directly.
    internalInstance._context = nextContext;
    enqueueUpdate(internalInstance);
  },

  validateCallback: function (callback, callerName) {
    !(!callback || typeof callback === 'function') ? process.env.NODE_ENV !== 'production' ? invariant(false, '%s(...): Expected the last optional `callback` argument to be a function. Instead received: %s.', callerName, formatUnexpectedArgument(callback)) : _prodInvariant('122', callerName, formatUnexpectedArgument(callback)) : void 0;
  }
};

module.exports = ReactUpdateQueue;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 79 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _assign = __webpack_require__(7);

var emptyFunction = __webpack_require__(13);
var warning = __webpack_require__(2);

var validateDOMNesting = emptyFunction;

if (process.env.NODE_ENV !== 'production') {
  // This validation code was written based on the HTML5 parsing spec:
  // https://html.spec.whatwg.org/multipage/syntax.html#has-an-element-in-scope
  //
  // Note: this does not catch all invalid nesting, nor does it try to (as it's
  // not clear what practical benefit doing so provides); instead, we warn only
  // for cases where the parser will give a parse tree differing from what React
  // intended. For example, <b><div></div></b> is invalid but we don't warn
  // because it still parses correctly; we do warn for other cases like nested
  // <p> tags where the beginning of the second element implicitly closes the
  // first, causing a confusing mess.

  // https://html.spec.whatwg.org/multipage/syntax.html#special
  var specialTags = ['address', 'applet', 'area', 'article', 'aside', 'base', 'basefont', 'bgsound', 'blockquote', 'body', 'br', 'button', 'caption', 'center', 'col', 'colgroup', 'dd', 'details', 'dir', 'div', 'dl', 'dt', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'iframe', 'img', 'input', 'isindex', 'li', 'link', 'listing', 'main', 'marquee', 'menu', 'menuitem', 'meta', 'nav', 'noembed', 'noframes', 'noscript', 'object', 'ol', 'p', 'param', 'plaintext', 'pre', 'script', 'section', 'select', 'source', 'style', 'summary', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'title', 'tr', 'track', 'ul', 'wbr', 'xmp'];

  // https://html.spec.whatwg.org/multipage/syntax.html#has-an-element-in-scope
  var inScopeTags = ['applet', 'caption', 'html', 'table', 'td', 'th', 'marquee', 'object', 'template',

  // https://html.spec.whatwg.org/multipage/syntax.html#html-integration-point
  // TODO: Distinguish by namespace here -- for <title>, including it here
  // errs on the side of fewer warnings
  'foreignObject', 'desc', 'title'];

  // https://html.spec.whatwg.org/multipage/syntax.html#has-an-element-in-button-scope
  var buttonScopeTags = inScopeTags.concat(['button']);

  // https://html.spec.whatwg.org/multipage/syntax.html#generate-implied-end-tags
  var impliedEndTags = ['dd', 'dt', 'li', 'option', 'optgroup', 'p', 'rp', 'rt'];

  var emptyAncestorInfo = {
    current: null,

    formTag: null,
    aTagInScope: null,
    buttonTagInScope: null,
    nobrTagInScope: null,
    pTagInButtonScope: null,

    listItemTagAutoclosing: null,
    dlItemTagAutoclosing: null
  };

  var updatedAncestorInfo = function (oldInfo, tag, instance) {
    var ancestorInfo = _assign({}, oldInfo || emptyAncestorInfo);
    var info = { tag: tag, instance: instance };

    if (inScopeTags.indexOf(tag) !== -1) {
      ancestorInfo.aTagInScope = null;
      ancestorInfo.buttonTagInScope = null;
      ancestorInfo.nobrTagInScope = null;
    }
    if (buttonScopeTags.indexOf(tag) !== -1) {
      ancestorInfo.pTagInButtonScope = null;
    }

    // See rules for 'li', 'dd', 'dt' start tags in
    // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inbody
    if (specialTags.indexOf(tag) !== -1 && tag !== 'address' && tag !== 'div' && tag !== 'p') {
      ancestorInfo.listItemTagAutoclosing = null;
      ancestorInfo.dlItemTagAutoclosing = null;
    }

    ancestorInfo.current = info;

    if (tag === 'form') {
      ancestorInfo.formTag = info;
    }
    if (tag === 'a') {
      ancestorInfo.aTagInScope = info;
    }
    if (tag === 'button') {
      ancestorInfo.buttonTagInScope = info;
    }
    if (tag === 'nobr') {
      ancestorInfo.nobrTagInScope = info;
    }
    if (tag === 'p') {
      ancestorInfo.pTagInButtonScope = info;
    }
    if (tag === 'li') {
      ancestorInfo.listItemTagAutoclosing = info;
    }
    if (tag === 'dd' || tag === 'dt') {
      ancestorInfo.dlItemTagAutoclosing = info;
    }

    return ancestorInfo;
  };

  /**
   * Returns whether
   */
  var isTagValidWithParent = function (tag, parentTag) {
    // First, let's check if we're in an unusual parsing mode...
    switch (parentTag) {
      // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inselect
      case 'select':
        return tag === 'option' || tag === 'optgroup' || tag === '#text';
      case 'optgroup':
        return tag === 'option' || tag === '#text';
      // Strictly speaking, seeing an <option> doesn't mean we're in a <select>
      // but
      case 'option':
        return tag === '#text';
      // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-intd
      // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-incaption
      // No special behavior since these rules fall back to "in body" mode for
      // all except special table nodes which cause bad parsing behavior anyway.

      // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-intr
      case 'tr':
        return tag === 'th' || tag === 'td' || tag === 'style' || tag === 'script' || tag === 'template';
      // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-intbody
      case 'tbody':
      case 'thead':
      case 'tfoot':
        return tag === 'tr' || tag === 'style' || tag === 'script' || tag === 'template';
      // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-incolgroup
      case 'colgroup':
        return tag === 'col' || tag === 'template';
      // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-intable
      case 'table':
        return tag === 'caption' || tag === 'colgroup' || tag === 'tbody' || tag === 'tfoot' || tag === 'thead' || tag === 'style' || tag === 'script' || tag === 'template';
      // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inhead
      case 'head':
        return tag === 'base' || tag === 'basefont' || tag === 'bgsound' || tag === 'link' || tag === 'meta' || tag === 'title' || tag === 'noscript' || tag === 'noframes' || tag === 'style' || tag === 'script' || tag === 'template';
      // https://html.spec.whatwg.org/multipage/semantics.html#the-html-element
      case 'html':
        return tag === 'head' || tag === 'body';
      case '#document':
        return tag === 'html';
    }

    // Probably in the "in body" parsing mode, so we outlaw only tag combos
    // where the parsing rules cause implicit opens or closes to be added.
    // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inbody
    switch (tag) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return parentTag !== 'h1' && parentTag !== 'h2' && parentTag !== 'h3' && parentTag !== 'h4' && parentTag !== 'h5' && parentTag !== 'h6';

      case 'rp':
      case 'rt':
        return impliedEndTags.indexOf(parentTag) === -1;

      case 'body':
      case 'caption':
      case 'col':
      case 'colgroup':
      case 'frame':
      case 'head':
      case 'html':
      case 'tbody':
      case 'td':
      case 'tfoot':
      case 'th':
      case 'thead':
      case 'tr':
        // These tags are only valid with a few parents that have special child
        // parsing rules -- if we're down here, then none of those matched and
        // so we allow it only if we don't know what the parent is, as all other
        // cases are invalid.
        return parentTag == null;
    }

    return true;
  };

  /**
   * Returns whether
   */
  var findInvalidAncestorForTag = function (tag, ancestorInfo) {
    switch (tag) {
      case 'address':
      case 'article':
      case 'aside':
      case 'blockquote':
      case 'center':
      case 'details':
      case 'dialog':
      case 'dir':
      case 'div':
      case 'dl':
      case 'fieldset':
      case 'figcaption':
      case 'figure':
      case 'footer':
      case 'header':
      case 'hgroup':
      case 'main':
      case 'menu':
      case 'nav':
      case 'ol':
      case 'p':
      case 'section':
      case 'summary':
      case 'ul':
      case 'pre':
      case 'listing':
      case 'table':
      case 'hr':
      case 'xmp':
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return ancestorInfo.pTagInButtonScope;

      case 'form':
        return ancestorInfo.formTag || ancestorInfo.pTagInButtonScope;

      case 'li':
        return ancestorInfo.listItemTagAutoclosing;

      case 'dd':
      case 'dt':
        return ancestorInfo.dlItemTagAutoclosing;

      case 'button':
        return ancestorInfo.buttonTagInScope;

      case 'a':
        // Spec says something about storing a list of markers, but it sounds
        // equivalent to this check.
        return ancestorInfo.aTagInScope;

      case 'nobr':
        return ancestorInfo.nobrTagInScope;
    }

    return null;
  };

  /**
   * Given a ReactCompositeComponent instance, return a list of its recursive
   * owners, starting at the root and ending with the instance itself.
   */
  var findOwnerStack = function (instance) {
    if (!instance) {
      return [];
    }

    var stack = [];
    do {
      stack.push(instance);
    } while (instance = instance._currentElement._owner);
    stack.reverse();
    return stack;
  };

  var didWarn = {};

  validateDOMNesting = function (childTag, childText, childInstance, ancestorInfo) {
    ancestorInfo = ancestorInfo || emptyAncestorInfo;
    var parentInfo = ancestorInfo.current;
    var parentTag = parentInfo && parentInfo.tag;

    if (childText != null) {
      process.env.NODE_ENV !== 'production' ? warning(childTag == null, 'validateDOMNesting: when childText is passed, childTag should be null') : void 0;
      childTag = '#text';
    }

    var invalidParent = isTagValidWithParent(childTag, parentTag) ? null : parentInfo;
    var invalidAncestor = invalidParent ? null : findInvalidAncestorForTag(childTag, ancestorInfo);
    var problematic = invalidParent || invalidAncestor;

    if (problematic) {
      var ancestorTag = problematic.tag;
      var ancestorInstance = problematic.instance;

      var childOwner = childInstance && childInstance._currentElement._owner;
      var ancestorOwner = ancestorInstance && ancestorInstance._currentElement._owner;

      var childOwners = findOwnerStack(childOwner);
      var ancestorOwners = findOwnerStack(ancestorOwner);

      var minStackLen = Math.min(childOwners.length, ancestorOwners.length);
      var i;

      var deepestCommon = -1;
      for (i = 0; i < minStackLen; i++) {
        if (childOwners[i] === ancestorOwners[i]) {
          deepestCommon = i;
        } else {
          break;
        }
      }

      var UNKNOWN = '(unknown)';
      var childOwnerNames = childOwners.slice(deepestCommon + 1).map(function (inst) {
        return inst.getName() || UNKNOWN;
      });
      var ancestorOwnerNames = ancestorOwners.slice(deepestCommon + 1).map(function (inst) {
        return inst.getName() || UNKNOWN;
      });
      var ownerInfo = [].concat(
      // If the parent and child instances have a common owner ancestor, start
      // with that -- otherwise we just start with the parent's owners.
      deepestCommon !== -1 ? childOwners[deepestCommon].getName() || UNKNOWN : [], ancestorOwnerNames, ancestorTag,
      // If we're warning about an invalid (non-parent) ancestry, add '...'
      invalidAncestor ? ['...'] : [], childOwnerNames, childTag).join(' > ');

      var warnKey = !!invalidParent + '|' + childTag + '|' + ancestorTag + '|' + ownerInfo;
      if (didWarn[warnKey]) {
        return;
      }
      didWarn[warnKey] = true;

      var tagDisplayName = childTag;
      var whitespaceInfo = '';
      if (childTag === '#text') {
        if (/\S/.test(childText)) {
          tagDisplayName = 'Text nodes';
        } else {
          tagDisplayName = 'Whitespace text nodes';
          whitespaceInfo = " Make sure you don't have any extra whitespace between tags on " + 'each line of your source code.';
        }
      } else {
        tagDisplayName = '<' + childTag + '>';
      }

      if (invalidParent) {
        var info = '';
        if (ancestorTag === 'table' && childTag === 'tr') {
          info += ' Add a <tbody> to your code to match the DOM tree generated by ' + 'the browser.';
        }
        process.env.NODE_ENV !== 'production' ? warning(false, 'validateDOMNesting(...): %s cannot appear as a child of <%s>.%s ' + 'See %s.%s', tagDisplayName, ancestorTag, whitespaceInfo, ownerInfo, info) : void 0;
      } else {
        process.env.NODE_ENV !== 'production' ? warning(false, 'validateDOMNesting(...): %s cannot appear as a descendant of ' + '<%s>. See %s.', tagDisplayName, ancestorTag, ownerInfo) : void 0;
      }
    }
  };

  validateDOMNesting.updatedAncestorInfo = updatedAncestorInfo;

  // For testing
  validateDOMNesting.isTagValidInContext = function (tag, ancestorInfo) {
    ancestorInfo = ancestorInfo || emptyAncestorInfo;
    var parentInfo = ancestorInfo.current;
    var parentTag = parentInfo && parentInfo.tag;
    return isTagValidWithParent(tag, parentTag) && !findInvalidAncestorForTag(tag, ancestorInfo);
  };
}

module.exports = validateDOMNesting;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 80 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



/**
 * `charCode` represents the actual "character code" and is safe to use with
 * `String.fromCharCode`. As such, only keys that correspond to printable
 * characters produce a valid `charCode`, the only exception to this is Enter.
 * The Tab-key is considered non-printable and does not have a `charCode`,
 * presumably because it does not produce a tab-character in browsers.
 *
 * @param {object} nativeEvent Native browser event.
 * @return {number} Normalized `charCode` property.
 */

function getEventCharCode(nativeEvent) {
  var charCode;
  var keyCode = nativeEvent.keyCode;

  if ('charCode' in nativeEvent) {
    charCode = nativeEvent.charCode;

    // FF does not set `charCode` for the Enter-key, check against `keyCode`.
    if (charCode === 0 && keyCode === 13) {
      charCode = 13;
    }
  } else {
    // IE8 does not implement `charCode`, but `keyCode` has the correct value.
    charCode = keyCode;
  }

  // Some non-printable keys are reported in `charCode`/`keyCode`, discard them.
  // Must not discard the (non-)printable Enter-key.
  if (charCode >= 32 || charCode === 13) {
    return charCode;
  }

  return 0;
}

module.exports = getEventCharCode;

/***/ }),
/* 81 */,
/* 82 */,
/* 83 */,
/* 84 */,
/* 85 */,
/* 86 */,
/* 87 */,
/* 88 */,
/* 89 */,
/* 90 */,
/* 91 */,
/* 92 */,
/* 93 */,
/* 94 */,
/* 95 */,
/* 96 */,
/* 97 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(d3, _, $) {

var React = __webpack_require__(5);
var datamonkey = __webpack_require__(19);

var PropChart = React.createClass({
  displayName: "PropChart",

  getDefaultProps: function getDefaultProps() {
    return {
      svg_id: null,
      dimensions: {
        width: 600,
        height: 400
      },
      margins: {
        left: 50,
        right: 15,
        bottom: 25,
        top: 35
      },
      has_zeros: false,
      legend_id: null,
      do_log_plot: true,
      k_p: null,
      plot: null
    };
  },

  getInitialState: function getInitialState() {
    return {
      model_name: this.props.name,
      omegas: this.props.omegas,
      settings: this.props.settings
    };
  },

  setEvents: function setEvents() {
    var self = this;

    d3.select("#" + this.save_svg_id).on("click", function (e) {
      datamonkey.save_image("svg", "#" + self.svg_id);
    });

    d3.select("#" + this.save_png_id).on("click", function (e) {
      datamonkey.save_image("png", "#" + self.svg_id);
    });
  },

  initialize: function initialize() {
    // clear svg
    d3.select("#prop-chart").html("");
    this.data_to_plot = this.state.omegas;
    if (this.state.omegas) {
      this.data_to_plot.forEach(function (data) {
        if (data.omega < 1e-5) data.omega = 1e-5;
        if (data.omega > 1e4) data.omega = 1e4;
      });
    }

    // Set props from settings
    this.svg_id = this.props.settings.svg_id;
    this.dimensions = this.props.settings.dimensions || this.props.dimensions;
    this.margins = this.props.settings.margins || this.props.margins;
    this.legend_id = this.props.settings.legend || this.props.legend_id;
    this.do_log_plot = this.props.settings.log || this.props.do_log_plot;
    this.k_p = this.props.settings.k || this.props.k_p;

    var dimensions = this.props.dimensions;
    var margins = this.props.margins;

    if (this.props.do_log_plot) {
      this.has_zeros = this.data_to_plot.some(function (d) {
        return d.omega <= 0;
      });
    }

    this.plot_width = dimensions["width"] - margins["left"] - margins["right"], this.plot_height = dimensions["height"] - margins["top"] - margins["bottom"];

    var domain = this.state.settings["domain"];

    this.omega_scale = (this.do_log_plot ? d3.scale.log() : d3.scale.linear()).range([0, this.plot_width]).domain(domain).nice();

    this.proportion_scale = d3.scale.linear().range([this.plot_height, 0]).domain([-0.05, 1]).clamp(true);

    // compute margins -- circle AREA is proportional to the relative weight
    // maximum diameter is (height - text margin)
    this.svg = d3.select("#" + this.svg_id).attr("width", "100%").attr("preserveAspectRatio", "xMinYMin meet").attr("viewBox", "0 0 " + this.dimensions.width + " " + this.dimensions.height).attr("height", dimensions.height + margins["top"] + margins["bottom"]);

    this.plot = this.svg.selectAll(".container");

    this.svg.selectAll("defs").remove();

    this.svg.append("defs").append("marker").attr("id", "arrowhead").attr("refX", 10) /*must be smarter way to calculate shift*/
    .attr("refY", 4).attr("markerWidth", 10).attr("markerHeight", 8).attr("orient", "auto").attr("stroke", "#000").attr("fill", "#000").append("path").attr("d", "M 0,0 V8 L10,4 Z");

    if (this.plot.empty()) {
      this.plot = this.svg.append("g").attr("class", "container");
    }

    this.plot.attr("transform", "translate(" + this.margins["left"] + " , " + this.margins["top"] + ")");
    this.reference_omega_lines = this.plot.selectAll(".hyphy-omega-line-reference"), this.displacement_lines = this.plot.selectAll(".hyphy-displacement-line");

    this.createNeutralLine();
    this.createXAxis();
    this.createYAxis();
    this.setEvents();
    this.createOmegaLine(this.state.omegas);
  },

  createOmegaLine: function createOmegaLine(omegas) {
    var self = this;

    // generate color wheel from omegas
    self.colores_g = _.shuffle(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"]);

    var color_scale = d3.scale.linear().domain([0.01, 1, 10]).range([d3.rgb("#000000"), d3.rgb("#DDDDDD"), d3.rgb("#00A99D")]);

    // ** Omega Line (Red) ** //
    var omega_lines = this.plot.selectAll(".hyphy-omega-line").data(omegas);
    omega_lines.enter().append("line");
    omega_lines.exit().remove();

    omega_lines.transition().attr("x1", function (d) {
      return self.omega_scale(d.omega);
    }).attr("x2", function (d) {
      return self.omega_scale(d.omega);
    }).attr("y1", function (d) {
      return self.proportion_scale(-0.05) + 20;
    }).attr("y2", function (d) {
      return self.proportion_scale(d.prop) + 20;
    }).style("stroke", function (d) {
      return color_scale(Math.min(10, d.omega));
    }).attr("class", "hyphy-omega-line");
  },

  createNeutralLine: function createNeutralLine() {
    var self = this;

    // ** Neutral Line (Blue) ** //
    var neutral_line = this.plot.selectAll(".hyphy-neutral-line").data([1]);
    neutral_line.enter().append("line").attr("class", "hyphy-neutral-line");
    neutral_line.exit().remove();
    neutral_line.transition().attr("x1", function (d) {
      return self.omega_scale(d);
    }).attr("x2", function (d) {
      return self.omega_scale(d);
    }).attr("y1", 20).attr("y2", this.plot_height + 20);

    // Legend
    this.svg.append("g").attr("transform", "translate(" + 0.9 * this.plot_width + ", 25)").append("text").attr("font-size", 14).text("Neutrality (ω=1)");

    this.svg.append("g").attr("transform", "translate(" + 0.825 * this.plot_width + ", 20)").append("line").attr("class", "hyphy-neutral-line").attr("x1", 0).attr("x2", 0.05 * this.plot_width).attr("y1", 0).attr("y2", 0);
  },
  createXAxis: function createXAxis() {
    // *** X-AXIS *** //
    var xAxis = d3.svg.axis().scale(this.omega_scale).orient("bottom");

    if (this.do_log_plot) {
      xAxis.ticks(10, this.has_zeros ? ".2r" : ".1r");
    }

    var x_axis = this.svg.selectAll(".x.axis");
    var x_label;

    if (x_axis.empty()) {
      x_axis = this.svg.append("g").attr("class", "x hyphy-axis");

      x_label = x_axis.append("g").attr("class", "hyphy-axis-label x-label");
    } else {
      x_label = x_axis.select(".axis-label.x-label");
    }

    x_axis.attr("transform", "translate(" + this.margins["left"] + "," + (this.plot_height + this.margins["top"] + 20) + ")").call(xAxis);
    x_label = x_label.attr("transform", "translate(" + this.plot_width + "," + (this.margins["bottom"] - 30) + ")").selectAll("text").data(["\u03C9"]);
    x_label.enter().append("text");
    x_label.text(function (d) {
      return d;
    }).style({
      "text-anchor": "end",
      "font-size": 18
    }).attr("dy", "0.0em");
  },
  createYAxis: function createYAxis() {
    // *** Y-AXIS *** //
    var yAxis = d3.svg.axis().scale(this.proportion_scale).orient("left").ticks(10, ".1p");

    var y_axis = this.svg.selectAll(".y.hyphy-axis");
    var y_label;

    if (y_axis.empty()) {
      y_axis = this.svg.append("g").attr("class", "y hyphy-axis");
      y_label = y_axis.append("g").attr("class", "hyphy-axis-label y-label");
    } else {
      y_label = y_axis.select(".hyphy-axis-label.y-label");
    }
    y_axis.attr("transform", "translate(" + this.margins["left"] + "," + (this.margins["top"] + 20) + ")").call(yAxis);
    y_label = y_label.attr("transform", "translate(" + (-this.margins["left"] + 10) + "," + 0 + ")").selectAll("text").data(["Proportion of sites"]);
    y_label.enter().append("text");
    y_label.text(function (d) {
      return d;
    }).style({
      "text-anchor": "start",
      "font-size": 18
    }).attr("dy", "-1em");
  },

  componentDidMount: function componentDidMount() {
    try {
      this.initialize();
    } catch (e) {}
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    this.setState({
      model_name: nextProps.name,
      omegas: nextProps.omegas
    });
  },

  componentDidUpdate: function componentDidUpdate() {
    try {
      this.initialize();
    } catch (e) {}
  },

  render: function render() {
    this.save_svg_id = "export-" + this.svg_id + "-svg";
    this.save_png_id = "export-" + this.svg_id + "-png";

    return React.createElement(
      "div",
      { className: "panel panel-default", id: this.state.model_name },
      React.createElement(
        "div",
        { className: "panel-heading" },
        React.createElement(
          "div",
          { className: "row" },
          React.createElement(
            "div",
            { className: "col-md-8 v-align" },
            React.createElement(
              "h1",
              { className: "panel-title" },
              React.createElement(
                "strong",
                null,
                this.state.model_name
              )
            )
          ),
          React.createElement(
            "div",
            { className: "col-md-4 v-align" },
            React.createElement(
              "div",
              { className: "btn-group pull-right" },
              React.createElement(
                "button",
                {
                  id: this.save_svg_id,
                  type: "button",
                  className: "btn btn-default btn-sm"
                },
                React.createElement("span", { className: "glyphicon glyphicon-floppy-save" }),
                " SVG"
              ),
              React.createElement(
                "button",
                {
                  id: this.save_png_id,
                  type: "button",
                  className: "btn btn-default btn-sm"
                },
                React.createElement("span", { className: "glyphicon glyphicon-floppy-save" }),
                " PNG"
              )
            )
          )
        )
      ),
      React.createElement(
        "div",
        { className: "row" },
        React.createElement(
          "div",
          { className: "panel-body col-md-12", style: { textAlign: "center" } },
          React.createElement("svg", { id: this.svg_id })
        )
      )
    );
  }
});

function render_prop_chart(model_name, omegas, settings) {
  return React.render(React.createElement(PropChart, { name: model_name, omegas: omegas, settings: settings }), document.getElementById("primary-omega-tag"));
}

function rerender_prop_chart(model_name, omeags, settings) {
  $("#primary-omega-tag").empty();
  return render_prop_chart(model_name, omeags, settings);
}

module.exports.render_prop_chart = render_prop_chart;
module.exports.rerender_prop_chart = rerender_prop_chart;
module.exports.PropChart = PropChart;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6), __webpack_require__(9), __webpack_require__(3)))

/***/ }),
/* 98 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var ReactDOMComponentFlags = {
  hasCachedChildNodes: 1 << 0
};

module.exports = ReactDOMComponentFlags;

/***/ }),
/* 99 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var _prodInvariant = __webpack_require__(4);

var invariant = __webpack_require__(1);

/**
 * Accumulates items that must not be null or undefined into the first one. This
 * is used to conserve memory by avoiding array allocations, and thus sacrifices
 * API cleanness. Since `current` can be null before being passed in and not
 * null after this function, make sure to assign it back to `current`:
 *
 * `a = accumulateInto(a, b);`
 *
 * This API should be sparingly used. Try `accumulate` for something cleaner.
 *
 * @return {*|array<*>} An accumulation of items.
 */

function accumulateInto(current, next) {
  !(next != null) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'accumulateInto(...): Accumulated items must not be null or undefined.') : _prodInvariant('30') : void 0;

  if (current == null) {
    return next;
  }

  // Both are not empty. Warning: Never call x.concat(y) when you are not
  // certain that x is an Array (x could be a string with concat method).
  if (Array.isArray(current)) {
    if (Array.isArray(next)) {
      current.push.apply(current, next);
      return current;
    }
    current.push(next);
    return current;
  }

  if (Array.isArray(next)) {
    // A bit too dangerous to mutate `next`.
    return [current].concat(next);
  }

  return [current, next];
}

module.exports = accumulateInto;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 100 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



/**
 * @param {array} arr an "accumulation" of items which is either an Array or
 * a single item. Useful when paired with the `accumulate` module. This is a
 * simple utility that allows us to reason about a collection of items, but
 * handling the case when there is exactly one item (and we do not need to
 * allocate an array).
 */

function forEachAccumulated(arr, cb, scope) {
  if (Array.isArray(arr)) {
    arr.forEach(cb, scope);
  } else if (arr) {
    cb.call(scope, arr);
  }
}

module.exports = forEachAccumulated;

/***/ }),
/* 101 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var ExecutionEnvironment = __webpack_require__(10);

var contentKey = null;

/**
 * Gets the key used to access text content on a DOM node.
 *
 * @return {?string} Key used to access text content.
 * @internal
 */
function getTextContentAccessor() {
  if (!contentKey && ExecutionEnvironment.canUseDOM) {
    // Prefer textContent to innerText because many browsers support both but
    // SVG <text> elements don't support innerText even when <div> does.
    contentKey = 'textContent' in document.documentElement ? 'textContent' : 'innerText';
  }
  return contentKey;
}

module.exports = getTextContentAccessor;

/***/ }),
/* 102 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var _prodInvariant = __webpack_require__(4);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PooledClass = __webpack_require__(26);

var invariant = __webpack_require__(1);

/**
 * A specialized pseudo-event module to help keep track of components waiting to
 * be notified when their DOM representations are available for use.
 *
 * This implements `PooledClass`, so you should never need to instantiate this.
 * Instead, use `CallbackQueue.getPooled()`.
 *
 * @class ReactMountReady
 * @implements PooledClass
 * @internal
 */

var CallbackQueue = function () {
  function CallbackQueue(arg) {
    _classCallCheck(this, CallbackQueue);

    this._callbacks = null;
    this._contexts = null;
    this._arg = arg;
  }

  /**
   * Enqueues a callback to be invoked when `notifyAll` is invoked.
   *
   * @param {function} callback Invoked when `notifyAll` is invoked.
   * @param {?object} context Context to call `callback` with.
   * @internal
   */


  CallbackQueue.prototype.enqueue = function enqueue(callback, context) {
    this._callbacks = this._callbacks || [];
    this._callbacks.push(callback);
    this._contexts = this._contexts || [];
    this._contexts.push(context);
  };

  /**
   * Invokes all enqueued callbacks and clears the queue. This is invoked after
   * the DOM representation of a component has been created or updated.
   *
   * @internal
   */


  CallbackQueue.prototype.notifyAll = function notifyAll() {
    var callbacks = this._callbacks;
    var contexts = this._contexts;
    var arg = this._arg;
    if (callbacks && contexts) {
      !(callbacks.length === contexts.length) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Mismatched list of contexts in callback queue') : _prodInvariant('24') : void 0;
      this._callbacks = null;
      this._contexts = null;
      for (var i = 0; i < callbacks.length; i++) {
        callbacks[i].call(contexts[i], arg);
      }
      callbacks.length = 0;
      contexts.length = 0;
    }
  };

  CallbackQueue.prototype.checkpoint = function checkpoint() {
    return this._callbacks ? this._callbacks.length : 0;
  };

  CallbackQueue.prototype.rollback = function rollback(len) {
    if (this._callbacks && this._contexts) {
      this._callbacks.length = len;
      this._contexts.length = len;
    }
  };

  /**
   * Resets the internal queue.
   *
   * @internal
   */


  CallbackQueue.prototype.reset = function reset() {
    this._callbacks = null;
    this._contexts = null;
  };

  /**
   * `PooledClass` looks for this.
   */


  CallbackQueue.prototype.destructor = function destructor() {
    this.reset();
  };

  return CallbackQueue;
}();

module.exports = PooledClass.addPoolingTo(CallbackQueue);
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 103 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var ReactFeatureFlags = {
  // When true, call console.time() before and .timeEnd() after each top-level
  // render (both initial renders and updates). Useful when looking at prod-mode
  // timeline profiles in Chrome, for example.
  logTopLevelRenders: false
};

module.exports = ReactFeatureFlags;

/***/ }),
/* 104 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var ReactDOMComponentTree = __webpack_require__(8);

function isCheckable(elem) {
  var type = elem.type;
  var nodeName = elem.nodeName;
  return nodeName && nodeName.toLowerCase() === 'input' && (type === 'checkbox' || type === 'radio');
}

function getTracker(inst) {
  return inst._wrapperState.valueTracker;
}

function attachTracker(inst, tracker) {
  inst._wrapperState.valueTracker = tracker;
}

function detachTracker(inst) {
  delete inst._wrapperState.valueTracker;
}

function getValueFromNode(node) {
  var value;
  if (node) {
    value = isCheckable(node) ? '' + node.checked : node.value;
  }
  return value;
}

var inputValueTracking = {
  // exposed for testing
  _getTrackerFromNode: function (node) {
    return getTracker(ReactDOMComponentTree.getInstanceFromNode(node));
  },


  track: function (inst) {
    if (getTracker(inst)) {
      return;
    }

    var node = ReactDOMComponentTree.getNodeFromInstance(inst);
    var valueField = isCheckable(node) ? 'checked' : 'value';
    var descriptor = Object.getOwnPropertyDescriptor(node.constructor.prototype, valueField);

    var currentValue = '' + node[valueField];

    // if someone has already defined a value or Safari, then bail
    // and don't track value will cause over reporting of changes,
    // but it's better then a hard failure
    // (needed for certain tests that spyOn input values and Safari)
    if (node.hasOwnProperty(valueField) || typeof descriptor.get !== 'function' || typeof descriptor.set !== 'function') {
      return;
    }

    Object.defineProperty(node, valueField, {
      enumerable: descriptor.enumerable,
      configurable: true,
      get: function () {
        return descriptor.get.call(this);
      },
      set: function (value) {
        currentValue = '' + value;
        descriptor.set.call(this, value);
      }
    });

    attachTracker(inst, {
      getValue: function () {
        return currentValue;
      },
      setValue: function (value) {
        currentValue = '' + value;
      },
      stopTracking: function () {
        detachTracker(inst);
        delete node[valueField];
      }
    });
  },

  updateValueIfChanged: function (inst) {
    if (!inst) {
      return false;
    }
    var tracker = getTracker(inst);

    if (!tracker) {
      inputValueTracking.track(inst);
      return true;
    }

    var lastValue = tracker.getValue();
    var nextValue = getValueFromNode(ReactDOMComponentTree.getNodeFromInstance(inst));

    if (nextValue !== lastValue) {
      tracker.setValue(nextValue);
      return true;
    }

    return false;
  },
  stopTracking: function (inst) {
    var tracker = getTracker(inst);
    if (tracker) {
      tracker.stopTracking();
    }
  }
};

module.exports = inputValueTracking;

/***/ }),
/* 105 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



/**
 * @see http://www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#input-type-attr-summary
 */

var supportedInputTypes = {
  color: true,
  date: true,
  datetime: true,
  'datetime-local': true,
  email: true,
  month: true,
  number: true,
  password: true,
  range: true,
  search: true,
  tel: true,
  text: true,
  time: true,
  url: true,
  week: true
};

function isTextInputElement(elem) {
  var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();

  if (nodeName === 'input') {
    return !!supportedInputTypes[elem.type];
  }

  if (nodeName === 'textarea') {
    return true;
  }

  return false;
}

module.exports = isTextInputElement;

/***/ }),
/* 106 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var ViewportMetrics = {
  currentScrollLeft: 0,

  currentScrollTop: 0,

  refreshScrollValues: function (scrollPosition) {
    ViewportMetrics.currentScrollLeft = scrollPosition.x;
    ViewportMetrics.currentScrollTop = scrollPosition.y;
  }
};

module.exports = ViewportMetrics;

/***/ }),
/* 107 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var ExecutionEnvironment = __webpack_require__(10);
var escapeTextContentForBrowser = __webpack_require__(55);
var setInnerHTML = __webpack_require__(54);

/**
 * Set the textContent property of a node, ensuring that whitespace is preserved
 * even in IE8. innerText is a poor substitute for textContent and, among many
 * issues, inserts <br> instead of the literal newline chars. innerHTML behaves
 * as it should.
 *
 * @param {DOMElement} node
 * @param {string} text
 * @internal
 */
var setTextContent = function (node, text) {
  if (text) {
    var firstChild = node.firstChild;

    if (firstChild && firstChild === node.lastChild && firstChild.nodeType === 3) {
      firstChild.nodeValue = text;
      return;
    }
  }
  node.textContent = text;
};

if (ExecutionEnvironment.canUseDOM) {
  if (!('textContent' in document.documentElement)) {
    setTextContent = function (node, text) {
      if (node.nodeType === 3) {
        node.nodeValue = text;
        return;
      }
      setInnerHTML(node, escapeTextContentForBrowser(text));
    };
  }
}

module.exports = setTextContent;

/***/ }),
/* 108 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



/**
 * @param {DOMElement} node input/textarea to focus
 */

function focusNode(node) {
  // IE8 can throw "Can't move focus to the control because it is invisible,
  // not enabled, or of a type that does not accept the focus." for all kinds of
  // reasons that are too expensive and fragile to test.
  try {
    node.focus();
  } catch (e) {}
}

module.exports = focusNode;

/***/ }),
/* 109 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



/**
 * CSS properties which accept numbers but are not in units of "px".
 */

var isUnitlessNumber = {
  animationIterationCount: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  gridRow: true,
  gridRowEnd: true,
  gridRowSpan: true,
  gridRowStart: true,
  gridColumn: true,
  gridColumnEnd: true,
  gridColumnSpan: true,
  gridColumnStart: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,

  // SVG-related properties
  fillOpacity: true,
  floodOpacity: true,
  stopOpacity: true,
  strokeDasharray: true,
  strokeDashoffset: true,
  strokeMiterlimit: true,
  strokeOpacity: true,
  strokeWidth: true
};

/**
 * @param {string} prefix vendor-specific prefix, eg: Webkit
 * @param {string} key style name, eg: transitionDuration
 * @return {string} style name prefixed with `prefix`, properly camelCased, eg:
 * WebkitTransitionDuration
 */
function prefixKey(prefix, key) {
  return prefix + key.charAt(0).toUpperCase() + key.substring(1);
}

/**
 * Support style names that may come passed in prefixed by adding permutations
 * of vendor prefixes.
 */
var prefixes = ['Webkit', 'ms', 'Moz', 'O'];

// Using Object.keys here, or else the vanilla for-in loop makes IE8 go into an
// infinite loop, because it iterates over the newly added props too.
Object.keys(isUnitlessNumber).forEach(function (prop) {
  prefixes.forEach(function (prefix) {
    isUnitlessNumber[prefixKey(prefix, prop)] = isUnitlessNumber[prop];
  });
});

/**
 * Most style properties can be unset by doing .style[prop] = '' but IE8
 * doesn't like doing that with shorthand properties so for the properties that
 * IE8 breaks on, which are listed here, we instead unset each of the
 * individual properties. See http://bugs.jquery.com/ticket/12385.
 * The 4-value 'clock' properties like margin, padding, border-width seem to
 * behave without any problems. Curiously, list-style works too without any
 * special prodding.
 */
var shorthandPropertyExpansions = {
  background: {
    backgroundAttachment: true,
    backgroundColor: true,
    backgroundImage: true,
    backgroundPositionX: true,
    backgroundPositionY: true,
    backgroundRepeat: true
  },
  backgroundPosition: {
    backgroundPositionX: true,
    backgroundPositionY: true
  },
  border: {
    borderWidth: true,
    borderStyle: true,
    borderColor: true
  },
  borderBottom: {
    borderBottomWidth: true,
    borderBottomStyle: true,
    borderBottomColor: true
  },
  borderLeft: {
    borderLeftWidth: true,
    borderLeftStyle: true,
    borderLeftColor: true
  },
  borderRight: {
    borderRightWidth: true,
    borderRightStyle: true,
    borderRightColor: true
  },
  borderTop: {
    borderTopWidth: true,
    borderTopStyle: true,
    borderTopColor: true
  },
  font: {
    fontStyle: true,
    fontVariant: true,
    fontWeight: true,
    fontSize: true,
    lineHeight: true,
    fontFamily: true
  },
  outline: {
    outlineWidth: true,
    outlineStyle: true,
    outlineColor: true
  }
};

var CSSProperty = {
  isUnitlessNumber: isUnitlessNumber,
  shorthandPropertyExpansions: shorthandPropertyExpansions
};

module.exports = CSSProperty;

/***/ }),
/* 110 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var DOMProperty = __webpack_require__(23);
var ReactDOMComponentTree = __webpack_require__(8);
var ReactInstrumentation = __webpack_require__(12);

var quoteAttributeValueForBrowser = __webpack_require__(234);
var warning = __webpack_require__(2);

var VALID_ATTRIBUTE_NAME_REGEX = new RegExp('^[' + DOMProperty.ATTRIBUTE_NAME_START_CHAR + '][' + DOMProperty.ATTRIBUTE_NAME_CHAR + ']*$');
var illegalAttributeNameCache = {};
var validatedAttributeNameCache = {};

function isAttributeNameSafe(attributeName) {
  if (validatedAttributeNameCache.hasOwnProperty(attributeName)) {
    return true;
  }
  if (illegalAttributeNameCache.hasOwnProperty(attributeName)) {
    return false;
  }
  if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) {
    validatedAttributeNameCache[attributeName] = true;
    return true;
  }
  illegalAttributeNameCache[attributeName] = true;
  process.env.NODE_ENV !== 'production' ? warning(false, 'Invalid attribute name: `%s`', attributeName) : void 0;
  return false;
}

function shouldIgnoreValue(propertyInfo, value) {
  return value == null || propertyInfo.hasBooleanValue && !value || propertyInfo.hasNumericValue && isNaN(value) || propertyInfo.hasPositiveNumericValue && value < 1 || propertyInfo.hasOverloadedBooleanValue && value === false;
}

/**
 * Operations for dealing with DOM properties.
 */
var DOMPropertyOperations = {
  /**
   * Creates markup for the ID property.
   *
   * @param {string} id Unescaped ID.
   * @return {string} Markup string.
   */
  createMarkupForID: function (id) {
    return DOMProperty.ID_ATTRIBUTE_NAME + '=' + quoteAttributeValueForBrowser(id);
  },

  setAttributeForID: function (node, id) {
    node.setAttribute(DOMProperty.ID_ATTRIBUTE_NAME, id);
  },

  createMarkupForRoot: function () {
    return DOMProperty.ROOT_ATTRIBUTE_NAME + '=""';
  },

  setAttributeForRoot: function (node) {
    node.setAttribute(DOMProperty.ROOT_ATTRIBUTE_NAME, '');
  },

  /**
   * Creates markup for a property.
   *
   * @param {string} name
   * @param {*} value
   * @return {?string} Markup string, or null if the property was invalid.
   */
  createMarkupForProperty: function (name, value) {
    var propertyInfo = DOMProperty.properties.hasOwnProperty(name) ? DOMProperty.properties[name] : null;
    if (propertyInfo) {
      if (shouldIgnoreValue(propertyInfo, value)) {
        return '';
      }
      var attributeName = propertyInfo.attributeName;
      if (propertyInfo.hasBooleanValue || propertyInfo.hasOverloadedBooleanValue && value === true) {
        return attributeName + '=""';
      }
      return attributeName + '=' + quoteAttributeValueForBrowser(value);
    } else if (DOMProperty.isCustomAttribute(name)) {
      if (value == null) {
        return '';
      }
      return name + '=' + quoteAttributeValueForBrowser(value);
    }
    return null;
  },

  /**
   * Creates markup for a custom property.
   *
   * @param {string} name
   * @param {*} value
   * @return {string} Markup string, or empty string if the property was invalid.
   */
  createMarkupForCustomAttribute: function (name, value) {
    if (!isAttributeNameSafe(name) || value == null) {
      return '';
    }
    return name + '=' + quoteAttributeValueForBrowser(value);
  },

  /**
   * Sets the value for a property on a node.
   *
   * @param {DOMElement} node
   * @param {string} name
   * @param {*} value
   */
  setValueForProperty: function (node, name, value) {
    var propertyInfo = DOMProperty.properties.hasOwnProperty(name) ? DOMProperty.properties[name] : null;
    if (propertyInfo) {
      var mutationMethod = propertyInfo.mutationMethod;
      if (mutationMethod) {
        mutationMethod(node, value);
      } else if (shouldIgnoreValue(propertyInfo, value)) {
        this.deleteValueForProperty(node, name);
        return;
      } else if (propertyInfo.mustUseProperty) {
        // Contrary to `setAttribute`, object properties are properly
        // `toString`ed by IE8/9.
        node[propertyInfo.propertyName] = value;
      } else {
        var attributeName = propertyInfo.attributeName;
        var namespace = propertyInfo.attributeNamespace;
        // `setAttribute` with objects becomes only `[object]` in IE8/9,
        // ('' + value) makes it output the correct toString()-value.
        if (namespace) {
          node.setAttributeNS(namespace, attributeName, '' + value);
        } else if (propertyInfo.hasBooleanValue || propertyInfo.hasOverloadedBooleanValue && value === true) {
          node.setAttribute(attributeName, '');
        } else {
          node.setAttribute(attributeName, '' + value);
        }
      }
    } else if (DOMProperty.isCustomAttribute(name)) {
      DOMPropertyOperations.setValueForAttribute(node, name, value);
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      var payload = {};
      payload[name] = value;
      ReactInstrumentation.debugTool.onHostOperation({
        instanceID: ReactDOMComponentTree.getInstanceFromNode(node)._debugID,
        type: 'update attribute',
        payload: payload
      });
    }
  },

  setValueForAttribute: function (node, name, value) {
    if (!isAttributeNameSafe(name)) {
      return;
    }
    if (value == null) {
      node.removeAttribute(name);
    } else {
      node.setAttribute(name, '' + value);
    }

    if (process.env.NODE_ENV !== 'production') {
      var payload = {};
      payload[name] = value;
      ReactInstrumentation.debugTool.onHostOperation({
        instanceID: ReactDOMComponentTree.getInstanceFromNode(node)._debugID,
        type: 'update attribute',
        payload: payload
      });
    }
  },

  /**
   * Deletes an attributes from a node.
   *
   * @param {DOMElement} node
   * @param {string} name
   */
  deleteValueForAttribute: function (node, name) {
    node.removeAttribute(name);
    if (process.env.NODE_ENV !== 'production') {
      ReactInstrumentation.debugTool.onHostOperation({
        instanceID: ReactDOMComponentTree.getInstanceFromNode(node)._debugID,
        type: 'remove attribute',
        payload: name
      });
    }
  },

  /**
   * Deletes the value for a property on a node.
   *
   * @param {DOMElement} node
   * @param {string} name
   */
  deleteValueForProperty: function (node, name) {
    var propertyInfo = DOMProperty.properties.hasOwnProperty(name) ? DOMProperty.properties[name] : null;
    if (propertyInfo) {
      var mutationMethod = propertyInfo.mutationMethod;
      if (mutationMethod) {
        mutationMethod(node, undefined);
      } else if (propertyInfo.mustUseProperty) {
        var propName = propertyInfo.propertyName;
        if (propertyInfo.hasBooleanValue) {
          node[propName] = false;
        } else {
          node[propName] = '';
        }
      } else {
        node.removeAttribute(propertyInfo.attributeName);
      }
    } else if (DOMProperty.isCustomAttribute(name)) {
      node.removeAttribute(name);
    }

    if (process.env.NODE_ENV !== 'production') {
      ReactInstrumentation.debugTool.onHostOperation({
        instanceID: ReactDOMComponentTree.getInstanceFromNode(node)._debugID,
        type: 'remove attribute',
        payload: name
      });
    }
  }
};

module.exports = DOMPropertyOperations;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 111 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

module.exports = ReactPropTypesSecret;

/***/ }),
/* 112 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _assign = __webpack_require__(7);

var LinkedValueUtils = __webpack_require__(73);
var ReactDOMComponentTree = __webpack_require__(8);
var ReactUpdates = __webpack_require__(15);

var warning = __webpack_require__(2);

var didWarnValueLink = false;
var didWarnValueDefaultValue = false;

function updateOptionsIfPendingUpdateAndMounted() {
  if (this._rootNodeID && this._wrapperState.pendingUpdate) {
    this._wrapperState.pendingUpdate = false;

    var props = this._currentElement.props;
    var value = LinkedValueUtils.getValue(props);

    if (value != null) {
      updateOptions(this, Boolean(props.multiple), value);
    }
  }
}

function getDeclarationErrorAddendum(owner) {
  if (owner) {
    var name = owner.getName();
    if (name) {
      return ' Check the render method of `' + name + '`.';
    }
  }
  return '';
}

var valuePropNames = ['value', 'defaultValue'];

/**
 * Validation function for `value` and `defaultValue`.
 * @private
 */
function checkSelectPropTypes(inst, props) {
  var owner = inst._currentElement._owner;
  LinkedValueUtils.checkPropTypes('select', props, owner);

  if (props.valueLink !== undefined && !didWarnValueLink) {
    process.env.NODE_ENV !== 'production' ? warning(false, '`valueLink` prop on `select` is deprecated; set `value` and `onChange` instead.') : void 0;
    didWarnValueLink = true;
  }

  for (var i = 0; i < valuePropNames.length; i++) {
    var propName = valuePropNames[i];
    if (props[propName] == null) {
      continue;
    }
    var isArray = Array.isArray(props[propName]);
    if (props.multiple && !isArray) {
      process.env.NODE_ENV !== 'production' ? warning(false, 'The `%s` prop supplied to <select> must be an array if ' + '`multiple` is true.%s', propName, getDeclarationErrorAddendum(owner)) : void 0;
    } else if (!props.multiple && isArray) {
      process.env.NODE_ENV !== 'production' ? warning(false, 'The `%s` prop supplied to <select> must be a scalar ' + 'value if `multiple` is false.%s', propName, getDeclarationErrorAddendum(owner)) : void 0;
    }
  }
}

/**
 * @param {ReactDOMComponent} inst
 * @param {boolean} multiple
 * @param {*} propValue A stringable (with `multiple`, a list of stringables).
 * @private
 */
function updateOptions(inst, multiple, propValue) {
  var selectedValue, i;
  var options = ReactDOMComponentTree.getNodeFromInstance(inst).options;

  if (multiple) {
    selectedValue = {};
    for (i = 0; i < propValue.length; i++) {
      selectedValue['' + propValue[i]] = true;
    }
    for (i = 0; i < options.length; i++) {
      var selected = selectedValue.hasOwnProperty(options[i].value);
      if (options[i].selected !== selected) {
        options[i].selected = selected;
      }
    }
  } else {
    // Do not set `select.value` as exact behavior isn't consistent across all
    // browsers for all cases.
    selectedValue = '' + propValue;
    for (i = 0; i < options.length; i++) {
      if (options[i].value === selectedValue) {
        options[i].selected = true;
        return;
      }
    }
    if (options.length) {
      options[0].selected = true;
    }
  }
}

/**
 * Implements a <select> host component that allows optionally setting the
 * props `value` and `defaultValue`. If `multiple` is false, the prop must be a
 * stringable. If `multiple` is true, the prop must be an array of stringables.
 *
 * If `value` is not supplied (or null/undefined), user actions that change the
 * selected option will trigger updates to the rendered options.
 *
 * If it is supplied (and not null/undefined), the rendered options will not
 * update in response to user actions. Instead, the `value` prop must change in
 * order for the rendered options to update.
 *
 * If `defaultValue` is provided, any options with the supplied values will be
 * selected.
 */
var ReactDOMSelect = {
  getHostProps: function (inst, props) {
    return _assign({}, props, {
      onChange: inst._wrapperState.onChange,
      value: undefined
    });
  },

  mountWrapper: function (inst, props) {
    if (process.env.NODE_ENV !== 'production') {
      checkSelectPropTypes(inst, props);
    }

    var value = LinkedValueUtils.getValue(props);
    inst._wrapperState = {
      pendingUpdate: false,
      initialValue: value != null ? value : props.defaultValue,
      listeners: null,
      onChange: _handleChange.bind(inst),
      wasMultiple: Boolean(props.multiple)
    };

    if (props.value !== undefined && props.defaultValue !== undefined && !didWarnValueDefaultValue) {
      process.env.NODE_ENV !== 'production' ? warning(false, 'Select elements must be either controlled or uncontrolled ' + '(specify either the value prop, or the defaultValue prop, but not ' + 'both). Decide between using a controlled or uncontrolled select ' + 'element and remove one of these props. More info: ' + 'https://fb.me/react-controlled-components') : void 0;
      didWarnValueDefaultValue = true;
    }
  },

  getSelectValueContext: function (inst) {
    // ReactDOMOption looks at this initial value so the initial generated
    // markup has correct `selected` attributes
    return inst._wrapperState.initialValue;
  },

  postUpdateWrapper: function (inst) {
    var props = inst._currentElement.props;

    // After the initial mount, we control selected-ness manually so don't pass
    // this value down
    inst._wrapperState.initialValue = undefined;

    var wasMultiple = inst._wrapperState.wasMultiple;
    inst._wrapperState.wasMultiple = Boolean(props.multiple);

    var value = LinkedValueUtils.getValue(props);
    if (value != null) {
      inst._wrapperState.pendingUpdate = false;
      updateOptions(inst, Boolean(props.multiple), value);
    } else if (wasMultiple !== Boolean(props.multiple)) {
      // For simplicity, reapply `defaultValue` if `multiple` is toggled.
      if (props.defaultValue != null) {
        updateOptions(inst, Boolean(props.multiple), props.defaultValue);
      } else {
        // Revert the select back to its default unselected state.
        updateOptions(inst, Boolean(props.multiple), props.multiple ? [] : '');
      }
    }
  }
};

function _handleChange(event) {
  var props = this._currentElement.props;
  var returnValue = LinkedValueUtils.executeOnChange(props, event);

  if (this._rootNodeID) {
    this._wrapperState.pendingUpdate = true;
  }
  ReactUpdates.asap(updateOptionsIfPendingUpdateAndMounted, this);
  return returnValue;
}

module.exports = ReactDOMSelect;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 113 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _prodInvariant = __webpack_require__(4),
    _assign = __webpack_require__(7);

var ReactCompositeComponent = __webpack_require__(242);
var ReactEmptyComponent = __webpack_require__(115);
var ReactHostComponent = __webpack_require__(116);

var getNextDebugID = __webpack_require__(245);
var invariant = __webpack_require__(1);
var warning = __webpack_require__(2);

// To avoid a cyclic dependency, we create the final class in this module
var ReactCompositeComponentWrapper = function (element) {
  this.construct(element);
};

function getDeclarationErrorAddendum(owner) {
  if (owner) {
    var name = owner.getName();
    if (name) {
      return ' Check the render method of `' + name + '`.';
    }
  }
  return '';
}

/**
 * Check if the type reference is a known internal type. I.e. not a user
 * provided composite type.
 *
 * @param {function} type
 * @return {boolean} Returns true if this is a valid internal type.
 */
function isInternalComponentType(type) {
  return typeof type === 'function' && typeof type.prototype !== 'undefined' && typeof type.prototype.mountComponent === 'function' && typeof type.prototype.receiveComponent === 'function';
}

/**
 * Given a ReactNode, create an instance that will actually be mounted.
 *
 * @param {ReactNode} node
 * @param {boolean} shouldHaveDebugID
 * @return {object} A new instance of the element's constructor.
 * @protected
 */
function instantiateReactComponent(node, shouldHaveDebugID) {
  var instance;

  if (node === null || node === false) {
    instance = ReactEmptyComponent.create(instantiateReactComponent);
  } else if (typeof node === 'object') {
    var element = node;
    var type = element.type;
    if (typeof type !== 'function' && typeof type !== 'string') {
      var info = '';
      if (process.env.NODE_ENV !== 'production') {
        if (type === undefined || typeof type === 'object' && type !== null && Object.keys(type).length === 0) {
          info += ' You likely forgot to export your component from the file ' + "it's defined in.";
        }
      }
      info += getDeclarationErrorAddendum(element._owner);
       true ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s', type == null ? type : typeof type, info) : _prodInvariant('130', type == null ? type : typeof type, info) : void 0;
    }

    // Special case string values
    if (typeof element.type === 'string') {
      instance = ReactHostComponent.createInternalComponent(element);
    } else if (isInternalComponentType(element.type)) {
      // This is temporarily available for custom components that are not string
      // representations. I.e. ART. Once those are updated to use the string
      // representation, we can drop this code path.
      instance = new element.type(element);

      // We renamed this. Allow the old name for compat. :(
      if (!instance.getHostNode) {
        instance.getHostNode = instance.getNativeNode;
      }
    } else {
      instance = new ReactCompositeComponentWrapper(element);
    }
  } else if (typeof node === 'string' || typeof node === 'number') {
    instance = ReactHostComponent.createInstanceForText(node);
  } else {
     true ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Encountered invalid React node of type %s', typeof node) : _prodInvariant('131', typeof node) : void 0;
  }

  if (process.env.NODE_ENV !== 'production') {
    process.env.NODE_ENV !== 'production' ? warning(typeof instance.mountComponent === 'function' && typeof instance.receiveComponent === 'function' && typeof instance.getHostNode === 'function' && typeof instance.unmountComponent === 'function', 'Only React Components can be mounted.') : void 0;
  }

  // These two fields are used by the DOM and ART diffing algorithms
  // respectively. Instead of using expandos on components, we should be
  // storing the state needed by the diffing algorithms elsewhere.
  instance._mountIndex = 0;
  instance._mountImage = null;

  if (process.env.NODE_ENV !== 'production') {
    instance._debugID = shouldHaveDebugID ? getNextDebugID() : 0;
  }

  // Internal instances should fully constructed at this point, so they should
  // not get any new fields added to them at this point.
  if (process.env.NODE_ENV !== 'production') {
    if (Object.preventExtensions) {
      Object.preventExtensions(instance);
    }
  }

  return instance;
}

_assign(ReactCompositeComponentWrapper.prototype, ReactCompositeComponent, {
  _instantiateReactComponent: instantiateReactComponent
});

module.exports = instantiateReactComponent;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 114 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var _prodInvariant = __webpack_require__(4);

var React = __webpack_require__(31);

var invariant = __webpack_require__(1);

var ReactNodeTypes = {
  HOST: 0,
  COMPOSITE: 1,
  EMPTY: 2,

  getType: function (node) {
    if (node === null || node === false) {
      return ReactNodeTypes.EMPTY;
    } else if (React.isValidElement(node)) {
      if (typeof node.type === 'function') {
        return ReactNodeTypes.COMPOSITE;
      } else {
        return ReactNodeTypes.HOST;
      }
    }
     true ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Unexpected node: %s', node) : _prodInvariant('26', node) : void 0;
  }
};

module.exports = ReactNodeTypes;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 115 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var emptyComponentFactory;

var ReactEmptyComponentInjection = {
  injectEmptyComponentFactory: function (factory) {
    emptyComponentFactory = factory;
  }
};

var ReactEmptyComponent = {
  create: function (instantiate) {
    return emptyComponentFactory(instantiate);
  }
};

ReactEmptyComponent.injection = ReactEmptyComponentInjection;

module.exports = ReactEmptyComponent;

/***/ }),
/* 116 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _prodInvariant = __webpack_require__(4);

var invariant = __webpack_require__(1);

var genericComponentClass = null;
var textComponentClass = null;

var ReactHostComponentInjection = {
  // This accepts a class that receives the tag string. This is a catch all
  // that can render any kind of tag.
  injectGenericComponentClass: function (componentClass) {
    genericComponentClass = componentClass;
  },
  // This accepts a text component class that takes the text string to be
  // rendered as props.
  injectTextComponentClass: function (componentClass) {
    textComponentClass = componentClass;
  }
};

/**
 * Get a host internal component class for a specific tag.
 *
 * @param {ReactElement} element The element to create.
 * @return {function} The internal class constructor function.
 */
function createInternalComponent(element) {
  !genericComponentClass ? process.env.NODE_ENV !== 'production' ? invariant(false, 'There is no registered component for the tag %s', element.type) : _prodInvariant('111', element.type) : void 0;
  return new genericComponentClass(element);
}

/**
 * @param {ReactText} text
 * @return {ReactComponent}
 */
function createInstanceForText(text) {
  return new textComponentClass(text);
}

/**
 * @param {ReactComponent} component
 * @return {boolean}
 */
function isTextComponent(component) {
  return component instanceof textComponentClass;
}

var ReactHostComponent = {
  createInternalComponent: createInternalComponent,
  createInstanceForText: createInstanceForText,
  isTextComponent: isTextComponent,
  injection: ReactHostComponentInjection
};

module.exports = ReactHostComponent;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 117 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _prodInvariant = __webpack_require__(4);

var ReactCurrentOwner = __webpack_require__(14);
var REACT_ELEMENT_TYPE = __webpack_require__(246);

var getIteratorFn = __webpack_require__(247);
var invariant = __webpack_require__(1);
var KeyEscapeUtils = __webpack_require__(77);
var warning = __webpack_require__(2);

var SEPARATOR = '.';
var SUBSEPARATOR = ':';

/**
 * This is inlined from ReactElement since this file is shared between
 * isomorphic and renderers. We could extract this to a
 *
 */

/**
 * TODO: Test that a single child and an array with one item have the same key
 * pattern.
 */

var didWarnAboutMaps = false;

/**
 * Generate a key string that identifies a component within a set.
 *
 * @param {*} component A component that could contain a manual key.
 * @param {number} index Index that is used if a manual key is not provided.
 * @return {string}
 */
function getComponentKey(component, index) {
  // Do some typechecking here since we call this blindly. We want to ensure
  // that we don't block potential future ES APIs.
  if (component && typeof component === 'object' && component.key != null) {
    // Explicit key
    return KeyEscapeUtils.escape(component.key);
  }
  // Implicit key determined by the index in the set
  return index.toString(36);
}

/**
 * @param {?*} children Children tree container.
 * @param {!string} nameSoFar Name of the key path so far.
 * @param {!function} callback Callback to invoke with each child found.
 * @param {?*} traverseContext Used to pass information throughout the traversal
 * process.
 * @return {!number} The number of children in this subtree.
 */
function traverseAllChildrenImpl(children, nameSoFar, callback, traverseContext) {
  var type = typeof children;

  if (type === 'undefined' || type === 'boolean') {
    // All of the above are perceived as null.
    children = null;
  }

  if (children === null || type === 'string' || type === 'number' ||
  // The following is inlined from ReactElement. This means we can optimize
  // some checks. React Fiber also inlines this logic for similar purposes.
  type === 'object' && children.$$typeof === REACT_ELEMENT_TYPE) {
    callback(traverseContext, children,
    // If it's the only child, treat the name as if it was wrapped in an array
    // so that it's consistent if the number of children grows.
    nameSoFar === '' ? SEPARATOR + getComponentKey(children, 0) : nameSoFar);
    return 1;
  }

  var child;
  var nextName;
  var subtreeCount = 0; // Count of children found in the current subtree.
  var nextNamePrefix = nameSoFar === '' ? SEPARATOR : nameSoFar + SUBSEPARATOR;

  if (Array.isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      child = children[i];
      nextName = nextNamePrefix + getComponentKey(child, i);
      subtreeCount += traverseAllChildrenImpl(child, nextName, callback, traverseContext);
    }
  } else {
    var iteratorFn = getIteratorFn(children);
    if (iteratorFn) {
      var iterator = iteratorFn.call(children);
      var step;
      if (iteratorFn !== children.entries) {
        var ii = 0;
        while (!(step = iterator.next()).done) {
          child = step.value;
          nextName = nextNamePrefix + getComponentKey(child, ii++);
          subtreeCount += traverseAllChildrenImpl(child, nextName, callback, traverseContext);
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          var mapsAsChildrenAddendum = '';
          if (ReactCurrentOwner.current) {
            var mapsAsChildrenOwnerName = ReactCurrentOwner.current.getName();
            if (mapsAsChildrenOwnerName) {
              mapsAsChildrenAddendum = ' Check the render method of `' + mapsAsChildrenOwnerName + '`.';
            }
          }
          process.env.NODE_ENV !== 'production' ? warning(didWarnAboutMaps, 'Using Maps as children is not yet fully supported. It is an ' + 'experimental feature that might be removed. Convert it to a ' + 'sequence / iterable of keyed ReactElements instead.%s', mapsAsChildrenAddendum) : void 0;
          didWarnAboutMaps = true;
        }
        // Iterator will provide entry [k,v] tuples rather than values.
        while (!(step = iterator.next()).done) {
          var entry = step.value;
          if (entry) {
            child = entry[1];
            nextName = nextNamePrefix + KeyEscapeUtils.escape(entry[0]) + SUBSEPARATOR + getComponentKey(child, 0);
            subtreeCount += traverseAllChildrenImpl(child, nextName, callback, traverseContext);
          }
        }
      }
    } else if (type === 'object') {
      var addendum = '';
      if (process.env.NODE_ENV !== 'production') {
        addendum = ' If you meant to render a collection of children, use an array ' + 'instead or wrap the object using createFragment(object) from the ' + 'React add-ons.';
        if (children._isReactElement) {
          addendum = " It looks like you're using an element created by a different " + 'version of React. Make sure to use only one copy of React.';
        }
        if (ReactCurrentOwner.current) {
          var name = ReactCurrentOwner.current.getName();
          if (name) {
            addendum += ' Check the render method of `' + name + '`.';
          }
        }
      }
      var childrenString = String(children);
       true ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Objects are not valid as a React child (found: %s).%s', childrenString === '[object Object]' ? 'object with keys {' + Object.keys(children).join(', ') + '}' : childrenString, addendum) : _prodInvariant('31', childrenString === '[object Object]' ? 'object with keys {' + Object.keys(children).join(', ') + '}' : childrenString, addendum) : void 0;
    }
  }

  return subtreeCount;
}

/**
 * Traverses children that are typically specified as `props.children`, but
 * might also be specified through attributes:
 *
 * - `traverseAllChildren(this.props.children, ...)`
 * - `traverseAllChildren(this.props.leftPanelChildren, ...)`
 *
 * The `traverseContext` is an optional argument that is passed through the
 * entire traversal. It can be used to store accumulations or anything else that
 * the callback might find relevant.
 *
 * @param {?*} children Children tree object.
 * @param {!function} callback To invoke upon traversing each child.
 * @param {?*} traverseContext Context for traversal.
 * @return {!number} The number of children in this subtree.
 */
function traverseAllChildren(children, callback, traverseContext) {
  if (children == null) {
    return 0;
  }

  return traverseAllChildrenImpl(children, '', callback, traverseContext);
}

module.exports = traverseAllChildren;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 118 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @typechecks
 */

var emptyFunction = __webpack_require__(13);

/**
 * Upstream version of event listener. Does not take into account specific
 * nature of platform.
 */
var EventListener = {
  /**
   * Listen to DOM events during the bubble phase.
   *
   * @param {DOMEventTarget} target DOM element to register listener on.
   * @param {string} eventType Event type, e.g. 'click' or 'mouseover'.
   * @param {function} callback Callback function.
   * @return {object} Object with a `remove` method.
   */
  listen: function listen(target, eventType, callback) {
    if (target.addEventListener) {
      target.addEventListener(eventType, callback, false);
      return {
        remove: function remove() {
          target.removeEventListener(eventType, callback, false);
        }
      };
    } else if (target.attachEvent) {
      target.attachEvent('on' + eventType, callback);
      return {
        remove: function remove() {
          target.detachEvent('on' + eventType, callback);
        }
      };
    }
  },

  /**
   * Listen to DOM events during the capture phase.
   *
   * @param {DOMEventTarget} target DOM element to register listener on.
   * @param {string} eventType Event type, e.g. 'click' or 'mouseover'.
   * @param {function} callback Callback function.
   * @return {object} Object with a `remove` method.
   */
  capture: function capture(target, eventType, callback) {
    if (target.addEventListener) {
      target.addEventListener(eventType, callback, true);
      return {
        remove: function remove() {
          target.removeEventListener(eventType, callback, true);
        }
      };
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Attempted to listen to events during the capture phase on a ' + 'browser that does not support the capture phase. Your application ' + 'will not receive some events.');
      }
      return {
        remove: emptyFunction
      };
    }
  },

  registerDefault: function registerDefault() {}
};

module.exports = EventListener;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 119 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var ReactDOMSelection = __webpack_require__(259);

var containsNode = __webpack_require__(261);
var focusNode = __webpack_require__(108);
var getActiveElement = __webpack_require__(120);

function isInDocument(node) {
  return containsNode(document.documentElement, node);
}

/**
 * @ReactInputSelection: React input selection module. Based on Selection.js,
 * but modified to be suitable for react and has a couple of bug fixes (doesn't
 * assume buttons have range selections allowed).
 * Input selection module for React.
 */
var ReactInputSelection = {
  hasSelectionCapabilities: function (elem) {
    var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
    return nodeName && (nodeName === 'input' && elem.type === 'text' || nodeName === 'textarea' || elem.contentEditable === 'true');
  },

  getSelectionInformation: function () {
    var focusedElem = getActiveElement();
    return {
      focusedElem: focusedElem,
      selectionRange: ReactInputSelection.hasSelectionCapabilities(focusedElem) ? ReactInputSelection.getSelection(focusedElem) : null
    };
  },

  /**
   * @restoreSelection: If any selection information was potentially lost,
   * restore it. This is useful when performing operations that could remove dom
   * nodes and place them back in, resulting in focus being lost.
   */
  restoreSelection: function (priorSelectionInformation) {
    var curFocusedElem = getActiveElement();
    var priorFocusedElem = priorSelectionInformation.focusedElem;
    var priorSelectionRange = priorSelectionInformation.selectionRange;
    if (curFocusedElem !== priorFocusedElem && isInDocument(priorFocusedElem)) {
      if (ReactInputSelection.hasSelectionCapabilities(priorFocusedElem)) {
        ReactInputSelection.setSelection(priorFocusedElem, priorSelectionRange);
      }
      focusNode(priorFocusedElem);
    }
  },

  /**
   * @getSelection: Gets the selection bounds of a focused textarea, input or
   * contentEditable node.
   * -@input: Look up selection bounds of this input
   * -@return {start: selectionStart, end: selectionEnd}
   */
  getSelection: function (input) {
    var selection;

    if ('selectionStart' in input) {
      // Modern browser with input or textarea.
      selection = {
        start: input.selectionStart,
        end: input.selectionEnd
      };
    } else if (document.selection && input.nodeName && input.nodeName.toLowerCase() === 'input') {
      // IE8 input.
      var range = document.selection.createRange();
      // There can only be one selection per document in IE, so it must
      // be in our element.
      if (range.parentElement() === input) {
        selection = {
          start: -range.moveStart('character', -input.value.length),
          end: -range.moveEnd('character', -input.value.length)
        };
      }
    } else {
      // Content editable or old IE textarea.
      selection = ReactDOMSelection.getOffsets(input);
    }

    return selection || { start: 0, end: 0 };
  },

  /**
   * @setSelection: Sets the selection bounds of a textarea or input and focuses
   * the input.
   * -@input     Set selection bounds of this input or textarea
   * -@offsets   Object of same form that is returned from get*
   */
  setSelection: function (input, offsets) {
    var start = offsets.start;
    var end = offsets.end;
    if (end === undefined) {
      end = start;
    }

    if ('selectionStart' in input) {
      input.selectionStart = start;
      input.selectionEnd = Math.min(end, input.value.length);
    } else if (document.selection && input.nodeName && input.nodeName.toLowerCase() === 'input') {
      var range = input.createTextRange();
      range.collapse(true);
      range.moveStart('character', start);
      range.moveEnd('character', end - start);
      range.select();
    } else {
      ReactDOMSelection.setOffsets(input, offsets);
    }
  }
};

module.exports = ReactInputSelection;

/***/ }),
/* 120 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @typechecks
 */

/* eslint-disable fb-www/typeof-undefined */

/**
 * Same as document.activeElement but wraps in a try-catch block. In IE it is
 * not safe to call document.activeElement if there is nothing focused.
 *
 * The activeElement will be null only if the document or document body is not
 * yet defined.
 *
 * @param {?DOMDocument} doc Defaults to current document.
 * @return {?DOMElement}
 */
function getActiveElement(doc) /*?DOMElement*/{
  doc = doc || (typeof document !== 'undefined' ? document : undefined);
  if (typeof doc === 'undefined') {
    return null;
  }
  try {
    return doc.activeElement || doc.body;
  } catch (e) {
    return doc.body;
  }
}

module.exports = getActiveElement;

/***/ }),
/* 121 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _prodInvariant = __webpack_require__(4);

var DOMLazyTree = __webpack_require__(34);
var DOMProperty = __webpack_require__(23);
var React = __webpack_require__(31);
var ReactBrowserEventEmitter = __webpack_require__(56);
var ReactCurrentOwner = __webpack_require__(14);
var ReactDOMComponentTree = __webpack_require__(8);
var ReactDOMContainerInfo = __webpack_require__(276);
var ReactDOMFeatureFlags = __webpack_require__(277);
var ReactFeatureFlags = __webpack_require__(103);
var ReactInstanceMap = __webpack_require__(43);
var ReactInstrumentation = __webpack_require__(12);
var ReactMarkupChecksum = __webpack_require__(278);
var ReactReconciler = __webpack_require__(33);
var ReactUpdateQueue = __webpack_require__(78);
var ReactUpdates = __webpack_require__(15);

var emptyObject = __webpack_require__(49);
var instantiateReactComponent = __webpack_require__(113);
var invariant = __webpack_require__(1);
var setInnerHTML = __webpack_require__(54);
var shouldUpdateReactComponent = __webpack_require__(76);
var warning = __webpack_require__(2);

var ATTR_NAME = DOMProperty.ID_ATTRIBUTE_NAME;
var ROOT_ATTR_NAME = DOMProperty.ROOT_ATTRIBUTE_NAME;

var ELEMENT_NODE_TYPE = 1;
var DOC_NODE_TYPE = 9;
var DOCUMENT_FRAGMENT_NODE_TYPE = 11;

var instancesByReactRootID = {};

/**
 * Finds the index of the first character
 * that's not common between the two given strings.
 *
 * @return {number} the index of the character where the strings diverge
 */
function firstDifferenceIndex(string1, string2) {
  var minLen = Math.min(string1.length, string2.length);
  for (var i = 0; i < minLen; i++) {
    if (string1.charAt(i) !== string2.charAt(i)) {
      return i;
    }
  }
  return string1.length === string2.length ? -1 : minLen;
}

/**
 * @param {DOMElement|DOMDocument} container DOM element that may contain
 * a React component
 * @return {?*} DOM element that may have the reactRoot ID, or null.
 */
function getReactRootElementInContainer(container) {
  if (!container) {
    return null;
  }

  if (container.nodeType === DOC_NODE_TYPE) {
    return container.documentElement;
  } else {
    return container.firstChild;
  }
}

function internalGetID(node) {
  // If node is something like a window, document, or text node, none of
  // which support attributes or a .getAttribute method, gracefully return
  // the empty string, as if the attribute were missing.
  return node.getAttribute && node.getAttribute(ATTR_NAME) || '';
}

/**
 * Mounts this component and inserts it into the DOM.
 *
 * @param {ReactComponent} componentInstance The instance to mount.
 * @param {DOMElement} container DOM element to mount into.
 * @param {ReactReconcileTransaction} transaction
 * @param {boolean} shouldReuseMarkup If true, do not insert markup
 */
function mountComponentIntoNode(wrapperInstance, container, transaction, shouldReuseMarkup, context) {
  var markerName;
  if (ReactFeatureFlags.logTopLevelRenders) {
    var wrappedElement = wrapperInstance._currentElement.props.child;
    var type = wrappedElement.type;
    markerName = 'React mount: ' + (typeof type === 'string' ? type : type.displayName || type.name);
    console.time(markerName);
  }

  var markup = ReactReconciler.mountComponent(wrapperInstance, transaction, null, ReactDOMContainerInfo(wrapperInstance, container), context, 0 /* parentDebugID */
  );

  if (markerName) {
    console.timeEnd(markerName);
  }

  wrapperInstance._renderedComponent._topLevelWrapper = wrapperInstance;
  ReactMount._mountImageIntoNode(markup, container, wrapperInstance, shouldReuseMarkup, transaction);
}

/**
 * Batched mount.
 *
 * @param {ReactComponent} componentInstance The instance to mount.
 * @param {DOMElement} container DOM element to mount into.
 * @param {boolean} shouldReuseMarkup If true, do not insert markup
 */
function batchedMountComponentIntoNode(componentInstance, container, shouldReuseMarkup, context) {
  var transaction = ReactUpdates.ReactReconcileTransaction.getPooled(
  /* useCreateElement */
  !shouldReuseMarkup && ReactDOMFeatureFlags.useCreateElement);
  transaction.perform(mountComponentIntoNode, null, componentInstance, container, transaction, shouldReuseMarkup, context);
  ReactUpdates.ReactReconcileTransaction.release(transaction);
}

/**
 * Unmounts a component and removes it from the DOM.
 *
 * @param {ReactComponent} instance React component instance.
 * @param {DOMElement} container DOM element to unmount from.
 * @final
 * @internal
 * @see {ReactMount.unmountComponentAtNode}
 */
function unmountComponentFromNode(instance, container, safely) {
  if (process.env.NODE_ENV !== 'production') {
    ReactInstrumentation.debugTool.onBeginFlush();
  }
  ReactReconciler.unmountComponent(instance, safely);
  if (process.env.NODE_ENV !== 'production') {
    ReactInstrumentation.debugTool.onEndFlush();
  }

  if (container.nodeType === DOC_NODE_TYPE) {
    container = container.documentElement;
  }

  // http://jsperf.com/emptying-a-node
  while (container.lastChild) {
    container.removeChild(container.lastChild);
  }
}

/**
 * True if the supplied DOM node has a direct React-rendered child that is
 * not a React root element. Useful for warning in `render`,
 * `unmountComponentAtNode`, etc.
 *
 * @param {?DOMElement} node The candidate DOM node.
 * @return {boolean} True if the DOM element contains a direct child that was
 * rendered by React but is not a root element.
 * @internal
 */
function hasNonRootReactChild(container) {
  var rootEl = getReactRootElementInContainer(container);
  if (rootEl) {
    var inst = ReactDOMComponentTree.getInstanceFromNode(rootEl);
    return !!(inst && inst._hostParent);
  }
}

/**
 * True if the supplied DOM node is a React DOM element and
 * it has been rendered by another copy of React.
 *
 * @param {?DOMElement} node The candidate DOM node.
 * @return {boolean} True if the DOM has been rendered by another copy of React
 * @internal
 */
function nodeIsRenderedByOtherInstance(container) {
  var rootEl = getReactRootElementInContainer(container);
  return !!(rootEl && isReactNode(rootEl) && !ReactDOMComponentTree.getInstanceFromNode(rootEl));
}

/**
 * True if the supplied DOM node is a valid node element.
 *
 * @param {?DOMElement} node The candidate DOM node.
 * @return {boolean} True if the DOM is a valid DOM node.
 * @internal
 */
function isValidContainer(node) {
  return !!(node && (node.nodeType === ELEMENT_NODE_TYPE || node.nodeType === DOC_NODE_TYPE || node.nodeType === DOCUMENT_FRAGMENT_NODE_TYPE));
}

/**
 * True if the supplied DOM node is a valid React node element.
 *
 * @param {?DOMElement} node The candidate DOM node.
 * @return {boolean} True if the DOM is a valid React DOM node.
 * @internal
 */
function isReactNode(node) {
  return isValidContainer(node) && (node.hasAttribute(ROOT_ATTR_NAME) || node.hasAttribute(ATTR_NAME));
}

function getHostRootInstanceInContainer(container) {
  var rootEl = getReactRootElementInContainer(container);
  var prevHostInstance = rootEl && ReactDOMComponentTree.getInstanceFromNode(rootEl);
  return prevHostInstance && !prevHostInstance._hostParent ? prevHostInstance : null;
}

function getTopLevelWrapperInContainer(container) {
  var root = getHostRootInstanceInContainer(container);
  return root ? root._hostContainerInfo._topLevelWrapper : null;
}

/**
 * Temporary (?) hack so that we can store all top-level pending updates on
 * composites instead of having to worry about different types of components
 * here.
 */
var topLevelRootCounter = 1;
var TopLevelWrapper = function () {
  this.rootID = topLevelRootCounter++;
};
TopLevelWrapper.prototype.isReactComponent = {};
if (process.env.NODE_ENV !== 'production') {
  TopLevelWrapper.displayName = 'TopLevelWrapper';
}
TopLevelWrapper.prototype.render = function () {
  return this.props.child;
};
TopLevelWrapper.isReactTopLevelWrapper = true;

/**
 * Mounting is the process of initializing a React component by creating its
 * representative DOM elements and inserting them into a supplied `container`.
 * Any prior content inside `container` is destroyed in the process.
 *
 *   ReactMount.render(
 *     component,
 *     document.getElementById('container')
 *   );
 *
 *   <div id="container">                   <-- Supplied `container`.
 *     <div data-reactid=".3">              <-- Rendered reactRoot of React
 *       // ...                                 component.
 *     </div>
 *   </div>
 *
 * Inside of `container`, the first element rendered is the "reactRoot".
 */
var ReactMount = {
  TopLevelWrapper: TopLevelWrapper,

  /**
   * Used by devtools. The keys are not important.
   */
  _instancesByReactRootID: instancesByReactRootID,

  /**
   * This is a hook provided to support rendering React components while
   * ensuring that the apparent scroll position of its `container` does not
   * change.
   *
   * @param {DOMElement} container The `container` being rendered into.
   * @param {function} renderCallback This must be called once to do the render.
   */
  scrollMonitor: function (container, renderCallback) {
    renderCallback();
  },

  /**
   * Take a component that's already mounted into the DOM and replace its props
   * @param {ReactComponent} prevComponent component instance already in the DOM
   * @param {ReactElement} nextElement component instance to render
   * @param {DOMElement} container container to render into
   * @param {?function} callback function triggered on completion
   */
  _updateRootComponent: function (prevComponent, nextElement, nextContext, container, callback) {
    ReactMount.scrollMonitor(container, function () {
      ReactUpdateQueue.enqueueElementInternal(prevComponent, nextElement, nextContext);
      if (callback) {
        ReactUpdateQueue.enqueueCallbackInternal(prevComponent, callback);
      }
    });

    return prevComponent;
  },

  /**
   * Render a new component into the DOM. Hooked by hooks!
   *
   * @param {ReactElement} nextElement element to render
   * @param {DOMElement} container container to render into
   * @param {boolean} shouldReuseMarkup if we should skip the markup insertion
   * @return {ReactComponent} nextComponent
   */
  _renderNewRootComponent: function (nextElement, container, shouldReuseMarkup, context) {
    // Various parts of our code (such as ReactCompositeComponent's
    // _renderValidatedComponent) assume that calls to render aren't nested;
    // verify that that's the case.
    process.env.NODE_ENV !== 'production' ? warning(ReactCurrentOwner.current == null, '_renderNewRootComponent(): Render methods should be a pure function ' + 'of props and state; triggering nested component updates from ' + 'render is not allowed. If necessary, trigger nested updates in ' + 'componentDidUpdate. Check the render method of %s.', ReactCurrentOwner.current && ReactCurrentOwner.current.getName() || 'ReactCompositeComponent') : void 0;

    !isValidContainer(container) ? process.env.NODE_ENV !== 'production' ? invariant(false, '_registerComponent(...): Target container is not a DOM element.') : _prodInvariant('37') : void 0;

    ReactBrowserEventEmitter.ensureScrollValueMonitoring();
    var componentInstance = instantiateReactComponent(nextElement, false);

    // The initial render is synchronous but any updates that happen during
    // rendering, in componentWillMount or componentDidMount, will be batched
    // according to the current batching strategy.

    ReactUpdates.batchedUpdates(batchedMountComponentIntoNode, componentInstance, container, shouldReuseMarkup, context);

    var wrapperID = componentInstance._instance.rootID;
    instancesByReactRootID[wrapperID] = componentInstance;

    return componentInstance;
  },

  /**
   * Renders a React component into the DOM in the supplied `container`.
   *
   * If the React component was previously rendered into `container`, this will
   * perform an update on it and only mutate the DOM as necessary to reflect the
   * latest React component.
   *
   * @param {ReactComponent} parentComponent The conceptual parent of this render tree.
   * @param {ReactElement} nextElement Component element to render.
   * @param {DOMElement} container DOM element to render into.
   * @param {?function} callback function triggered on completion
   * @return {ReactComponent} Component instance rendered in `container`.
   */
  renderSubtreeIntoContainer: function (parentComponent, nextElement, container, callback) {
    !(parentComponent != null && ReactInstanceMap.has(parentComponent)) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'parentComponent must be a valid React Component') : _prodInvariant('38') : void 0;
    return ReactMount._renderSubtreeIntoContainer(parentComponent, nextElement, container, callback);
  },

  _renderSubtreeIntoContainer: function (parentComponent, nextElement, container, callback) {
    ReactUpdateQueue.validateCallback(callback, 'ReactDOM.render');
    !React.isValidElement(nextElement) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'ReactDOM.render(): Invalid component element.%s', typeof nextElement === 'string' ? " Instead of passing a string like 'div', pass " + "React.createElement('div') or <div />." : typeof nextElement === 'function' ? ' Instead of passing a class like Foo, pass ' + 'React.createElement(Foo) or <Foo />.' : // Check if it quacks like an element
    nextElement != null && nextElement.props !== undefined ? ' This may be caused by unintentionally loading two independent ' + 'copies of React.' : '') : _prodInvariant('39', typeof nextElement === 'string' ? " Instead of passing a string like 'div', pass " + "React.createElement('div') or <div />." : typeof nextElement === 'function' ? ' Instead of passing a class like Foo, pass ' + 'React.createElement(Foo) or <Foo />.' : nextElement != null && nextElement.props !== undefined ? ' This may be caused by unintentionally loading two independent ' + 'copies of React.' : '') : void 0;

    process.env.NODE_ENV !== 'production' ? warning(!container || !container.tagName || container.tagName.toUpperCase() !== 'BODY', 'render(): Rendering components directly into document.body is ' + 'discouraged, since its children are often manipulated by third-party ' + 'scripts and browser extensions. This may lead to subtle ' + 'reconciliation issues. Try rendering into a container element created ' + 'for your app.') : void 0;

    var nextWrappedElement = React.createElement(TopLevelWrapper, {
      child: nextElement
    });

    var nextContext;
    if (parentComponent) {
      var parentInst = ReactInstanceMap.get(parentComponent);
      nextContext = parentInst._processChildContext(parentInst._context);
    } else {
      nextContext = emptyObject;
    }

    var prevComponent = getTopLevelWrapperInContainer(container);

    if (prevComponent) {
      var prevWrappedElement = prevComponent._currentElement;
      var prevElement = prevWrappedElement.props.child;
      if (shouldUpdateReactComponent(prevElement, nextElement)) {
        var publicInst = prevComponent._renderedComponent.getPublicInstance();
        var updatedCallback = callback && function () {
          callback.call(publicInst);
        };
        ReactMount._updateRootComponent(prevComponent, nextWrappedElement, nextContext, container, updatedCallback);
        return publicInst;
      } else {
        ReactMount.unmountComponentAtNode(container);
      }
    }

    var reactRootElement = getReactRootElementInContainer(container);
    var containerHasReactMarkup = reactRootElement && !!internalGetID(reactRootElement);
    var containerHasNonRootReactChild = hasNonRootReactChild(container);

    if (process.env.NODE_ENV !== 'production') {
      process.env.NODE_ENV !== 'production' ? warning(!containerHasNonRootReactChild, 'render(...): Replacing React-rendered children with a new root ' + 'component. If you intended to update the children of this node, ' + 'you should instead have the existing children update their state ' + 'and render the new components instead of calling ReactDOM.render.') : void 0;

      if (!containerHasReactMarkup || reactRootElement.nextSibling) {
        var rootElementSibling = reactRootElement;
        while (rootElementSibling) {
          if (internalGetID(rootElementSibling)) {
            process.env.NODE_ENV !== 'production' ? warning(false, 'render(): Target node has markup rendered by React, but there ' + 'are unrelated nodes as well. This is most commonly caused by ' + 'white-space inserted around server-rendered markup.') : void 0;
            break;
          }
          rootElementSibling = rootElementSibling.nextSibling;
        }
      }
    }

    var shouldReuseMarkup = containerHasReactMarkup && !prevComponent && !containerHasNonRootReactChild;
    var component = ReactMount._renderNewRootComponent(nextWrappedElement, container, shouldReuseMarkup, nextContext)._renderedComponent.getPublicInstance();
    if (callback) {
      callback.call(component);
    }
    return component;
  },

  /**
   * Renders a React component into the DOM in the supplied `container`.
   * See https://facebook.github.io/react/docs/top-level-api.html#reactdom.render
   *
   * If the React component was previously rendered into `container`, this will
   * perform an update on it and only mutate the DOM as necessary to reflect the
   * latest React component.
   *
   * @param {ReactElement} nextElement Component element to render.
   * @param {DOMElement} container DOM element to render into.
   * @param {?function} callback function triggered on completion
   * @return {ReactComponent} Component instance rendered in `container`.
   */
  render: function (nextElement, container, callback) {
    return ReactMount._renderSubtreeIntoContainer(null, nextElement, container, callback);
  },

  /**
   * Unmounts and destroys the React component rendered in the `container`.
   * See https://facebook.github.io/react/docs/top-level-api.html#reactdom.unmountcomponentatnode
   *
   * @param {DOMElement} container DOM element containing a React component.
   * @return {boolean} True if a component was found in and unmounted from
   *                   `container`
   */
  unmountComponentAtNode: function (container) {
    // Various parts of our code (such as ReactCompositeComponent's
    // _renderValidatedComponent) assume that calls to render aren't nested;
    // verify that that's the case. (Strictly speaking, unmounting won't cause a
    // render but we still don't expect to be in a render call here.)
    process.env.NODE_ENV !== 'production' ? warning(ReactCurrentOwner.current == null, 'unmountComponentAtNode(): Render methods should be a pure function ' + 'of props and state; triggering nested component updates from render ' + 'is not allowed. If necessary, trigger nested updates in ' + 'componentDidUpdate. Check the render method of %s.', ReactCurrentOwner.current && ReactCurrentOwner.current.getName() || 'ReactCompositeComponent') : void 0;

    !isValidContainer(container) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'unmountComponentAtNode(...): Target container is not a DOM element.') : _prodInvariant('40') : void 0;

    if (process.env.NODE_ENV !== 'production') {
      process.env.NODE_ENV !== 'production' ? warning(!nodeIsRenderedByOtherInstance(container), "unmountComponentAtNode(): The node you're attempting to unmount " + 'was rendered by another copy of React.') : void 0;
    }

    var prevComponent = getTopLevelWrapperInContainer(container);
    if (!prevComponent) {
      // Check if the node being unmounted was rendered by React, but isn't a
      // root node.
      var containerHasNonRootReactChild = hasNonRootReactChild(container);

      // Check if the container itself is a React root node.
      var isContainerReactRoot = container.nodeType === 1 && container.hasAttribute(ROOT_ATTR_NAME);

      if (process.env.NODE_ENV !== 'production') {
        process.env.NODE_ENV !== 'production' ? warning(!containerHasNonRootReactChild, "unmountComponentAtNode(): The node you're attempting to unmount " + 'was rendered by React and is not a top-level container. %s', isContainerReactRoot ? 'You may have accidentally passed in a React root node instead ' + 'of its container.' : 'Instead, have the parent component update its state and ' + 'rerender in order to remove this component.') : void 0;
      }

      return false;
    }
    delete instancesByReactRootID[prevComponent._instance.rootID];
    ReactUpdates.batchedUpdates(unmountComponentFromNode, prevComponent, container, false);
    return true;
  },

  _mountImageIntoNode: function (markup, container, instance, shouldReuseMarkup, transaction) {
    !isValidContainer(container) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'mountComponentIntoNode(...): Target container is not valid.') : _prodInvariant('41') : void 0;

    if (shouldReuseMarkup) {
      var rootElement = getReactRootElementInContainer(container);
      if (ReactMarkupChecksum.canReuseMarkup(markup, rootElement)) {
        ReactDOMComponentTree.precacheNode(instance, rootElement);
        return;
      } else {
        var checksum = rootElement.getAttribute(ReactMarkupChecksum.CHECKSUM_ATTR_NAME);
        rootElement.removeAttribute(ReactMarkupChecksum.CHECKSUM_ATTR_NAME);

        var rootMarkup = rootElement.outerHTML;
        rootElement.setAttribute(ReactMarkupChecksum.CHECKSUM_ATTR_NAME, checksum);

        var normalizedMarkup = markup;
        if (process.env.NODE_ENV !== 'production') {
          // because rootMarkup is retrieved from the DOM, various normalizations
          // will have occurred which will not be present in `markup`. Here,
          // insert markup into a <div> or <iframe> depending on the container
          // type to perform the same normalizations before comparing.
          var normalizer;
          if (container.nodeType === ELEMENT_NODE_TYPE) {
            normalizer = document.createElement('div');
            normalizer.innerHTML = markup;
            normalizedMarkup = normalizer.innerHTML;
          } else {
            normalizer = document.createElement('iframe');
            document.body.appendChild(normalizer);
            normalizer.contentDocument.write(markup);
            normalizedMarkup = normalizer.contentDocument.documentElement.outerHTML;
            document.body.removeChild(normalizer);
          }
        }

        var diffIndex = firstDifferenceIndex(normalizedMarkup, rootMarkup);
        var difference = ' (client) ' + normalizedMarkup.substring(diffIndex - 20, diffIndex + 20) + '\n (server) ' + rootMarkup.substring(diffIndex - 20, diffIndex + 20);

        !(container.nodeType !== DOC_NODE_TYPE) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'You\'re trying to render a component to the document using server rendering but the checksum was invalid. This usually means you rendered a different component type or props on the client from the one on the server, or your render() methods are impure. React cannot handle this case due to cross-browser quirks by rendering at the document root. You should look for environment dependent code in your components and ensure the props are the same client and server side:\n%s', difference) : _prodInvariant('42', difference) : void 0;

        if (process.env.NODE_ENV !== 'production') {
          process.env.NODE_ENV !== 'production' ? warning(false, 'React attempted to reuse markup in a container but the ' + 'checksum was invalid. This generally means that you are ' + 'using server rendering and the markup generated on the ' + 'server was not what the client was expecting. React injected ' + 'new markup to compensate which works but you have lost many ' + 'of the benefits of server rendering. Instead, figure out ' + 'why the markup being generated is different on the client ' + 'or server:\n%s', difference) : void 0;
        }
      }
    }

    !(container.nodeType !== DOC_NODE_TYPE) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'You\'re trying to render a component to the document but you didn\'t use server rendering. We can\'t do this without using server rendering due to cross-browser quirks. See ReactDOMServer.renderToString() for server rendering.') : _prodInvariant('43') : void 0;

    if (transaction.useCreateElement) {
      while (container.lastChild) {
        container.removeChild(container.lastChild);
      }
      DOMLazyTree.insertTreeBefore(container, markup, null);
    } else {
      setInnerHTML(container, markup);
      ReactDOMComponentTree.precacheNode(instance, container.firstChild);
    }

    if (process.env.NODE_ENV !== 'production') {
      var hostNode = ReactDOMComponentTree.getInstanceFromNode(container.firstChild);
      if (hostNode._debugID !== 0) {
        ReactInstrumentation.debugTool.onHostOperation({
          instanceID: hostNode._debugID,
          type: 'mount',
          payload: markup.toString()
        });
      }
    }
  }
};

module.exports = ReactMount;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 122 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var ReactNodeTypes = __webpack_require__(114);

function getHostComponentFromComposite(inst) {
  var type;

  while ((type = inst._renderedNodeType) === ReactNodeTypes.COMPOSITE) {
    inst = inst._renderedComponent;
  }

  if (type === ReactNodeTypes.HOST) {
    return inst._renderedComponent;
  } else if (type === ReactNodeTypes.EMPTY) {
    return null;
  }
}

module.exports = getHostComponentFromComposite;

/***/ }),
/* 123 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 124 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(d3, _, $) {

var React = __webpack_require__(5);

var ModelFits = React.createClass({
  displayName: "ModelFits",

  getInitialState: function getInitialState() {
    var table_row_data = this.getModelRows(this.props.json),
        table_columns = this.getModelColumns(table_row_data);

    return {
      table_row_data: table_row_data,
      table_columns: table_columns
    };
  },

  formatRuntime: function formatRuntime(seconds) {
    var duration_string = "",
        seconds = parseFloat(seconds);

    var split_array = [Math.floor(seconds / (24 * 3600)), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60],
        quals = ["d.", "hrs.", "min.", "sec."];

    split_array.forEach(function (d, i) {
      if (d) {
        duration_string += " " + d + " " + quals[i];
      }
    });

    return duration_string;
  },

  getLogLikelihood: function getLogLikelihood(this_model) {
    return d3.format(".2f")(this_model["log-likelihood"]);
  },

  getAIC: function getAIC(this_model) {
    return d3.format(".2f")(this_model["AIC-c"]);
  },

  getNumParameters: function getNumParameters(this_model) {
    return this_model["parameters"];
  },

  getBranchLengths: function getBranchLengths(this_model) {
    if (this_model["tree length"]) {
      return d3.format(".2f")(this_model["tree length"]);
    } else {
      return d3.format(".2f")(d3.values(this_model["branch-lengths"]).reduce(function (p, c) {
        return p + c;
      }, 0));
    }
  },

  getRuntime: function getRuntime(this_model) {
    //return this.formatRuntime(this_model['runtime']);
    return this.formatRuntime(this_model["runtime"]);
  },

  getDistributions: function getDistributions(m, this_model) {
    var omega_distributions = {};
    omega_distributions[m] = {};

    var omega_format = d3.format(".3r"),
        prop_format = d3.format(".2p");

    var distributions = [];

    for (var d in this_model["rate-distributions"]) {
      var this_distro = this_model["rate-distributions"][d];
      var this_distro_entry = [d, "", "", ""];

      omega_distributions[m][d] = this_distro.map(function (d) {
        return {
          omega: d[0],
          weight: d[1]
        };
      });

      for (var k = 0; k < this_distro.length; k++) {
        this_distro_entry[k + 1] = omega_format(this_distro[k][0]) + " (" + prop_format(this_distro[k][1]) + ")";
      }

      distributions.push(this_distro_entry);
    }

    distributions.sort(function (a, b) {
      return a[0] < b[0] ? -1 : a[0] == b[0] ? 0 : 1;
    });

    return distributions;
  },

  getModelRows: function getModelRows(json) {
    if (!json) {
      return [];
    }

    var table_row_data = [];

    for (var m in json["fits"]) {
      var this_model_row = [],
          this_model = json["fits"][m];

      this_model_row = [this_model["display-order"], "", m, this.getLogLikelihood(this_model), this.getNumParameters(this_model), this.getAIC(this_model), this.getRuntime(this_model), this.getBranchLengths(this_model)];

      var distributions = this.getDistributions(m, this_model);

      if (distributions.length) {
        this_model_row = this_model_row.concat(distributions[0]);
        this_model_row[1] = distributions[0][0];

        table_row_data.push(this_model_row);

        for (var d = 1; d < distributions.length; d++) {
          var this_distro_entry = this_model_row.map(function (d, i) {
            if (i) return "";
            return d;
          });

          this_distro_entry[1] = distributions[d][0];

          for (var k = this_distro_entry.length - 4; k < this_distro_entry.length; k++) {
            this_distro_entry[k] = distributions[d][k - this_distro_entry.length + 4];
          }

          table_row_data.push(this_distro_entry);
        }
      } else {
        table_row_data.push(this_model_row);
      }
    }

    table_row_data.sort(function (a, b) {
      if (a[0] == b[0]) {
        return a[1] < b[1] ? -1 : a[1] == b[1] ? 0 : 1;
      }
      return a[0] - b[0];
    });

    table_row_data = table_row_data.map(function (r) {
      return r.slice(2);
    });

    return table_row_data;
  },

  getModelColumns: function getModelColumns(table_row_data) {
    var model_header = "<th>Model</th>",
        logl_header = "<th><em> log </em>L</th>",
        num_params_header = "<th># par.</th>",
        aic_header = "<th>AIC<sub>c</sub></abbr></th>",
        runtime_header = "<th>Time to fit</th>",
        branch_lengths_header = "<th>L<sub>tree</sub></abbr></th>",
        branch_set_header = "<th>Branch set</th>",
        omega_1_header = "<th>&omega;<sub>1</sub></th>",
        omega_2_header = "<th>&omega;<sub>2</sub></th>",
        omega_3_header = "<th>&omega;<sub>3</sub></th>";

    // inspect table_row_data and return header
    var all_columns = [model_header, logl_header, num_params_header, aic_header, runtime_header, branch_lengths_header, branch_set_header, omega_1_header, omega_2_header, omega_3_header];

    // validate each table row with its associated header
    if (table_row_data.length == 0) {
      return [];
    }

    // trim columns to length of table_row_data
    var column_headers = _.take(all_columns, table_row_data[0].length);

    return column_headers;
  },

  componentDidUpdate: function componentDidUpdate() {
    var model_columns = d3.select("#summary-model-header1");
    model_columns = model_columns.selectAll("th").data(this.state.table_columns);
    model_columns.enter().append("th");
    model_columns.html(function (d) {
      return d;
    });

    var model_rows = d3.select("#summary-model-table").selectAll("tr").data(this.state.table_row_data);
    model_rows.enter().append("tr");
    model_rows.exit().remove();
    model_rows = model_rows.selectAll("td").data(function (d) {
      return d;
    });
    model_rows.enter().append("td");
    model_rows.html(function (d) {
      return d;
    });
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    var table_row_data = this.getModelRows(nextProps.json),
        table_columns = this.getModelColumns(table_row_data);

    this.setState({
      table_row_data: table_row_data,
      table_columns: table_columns
    });
  },

  render: function render() {
    return React.createElement(
      "div",
      null,
      React.createElement(
        "h4",
        { className: "dm-table-header" },
        "Model fits",
        React.createElement("span", {
          className: "glyphicon glyphicon-info-sign",
          style: { verticalAlign: "middle", float: "right" },
          "aria-hidden": "true",
          "data-toggle": "popover",
          "data-trigger": "hover",
          title: "Actions",
          "data-html": "true",
          "data-content": "<ul><li>Hover over a column header for a description of its content.</li></ul>",
          "data-placement": "bottom"
        })
      ),
      React.createElement(
        "table",
        {
          className: "dm-table table table-hover table-condensed list-group-item-text",
          style: { marginTop: "0.5em" }
        },
        React.createElement("thead", { id: "summary-model-header1" }),
        React.createElement("tbody", { id: "summary-model-table" })
      )
    );
  }
});

// Will need to make a call to this
// omega distributions
function render_model_fits(json, element) {
  React.render(React.createElement(ModelFits, { json: json }), $(element)[0]);
}

// Will need to make a call to this
// omega distributions
function rerender_model_fits(json, element) {
  $(element).empty();
  render_model_fits(json, element);
}

module.exports.ModelFits = ModelFits;
module.exports.render_model_fits = render_model_fits;
module.exports.rerender_model_fits = rerender_model_fits;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6), __webpack_require__(9), __webpack_require__(3)))

/***/ }),
/* 125 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;(function() {
  var out$ = typeof exports != 'undefined' && exports || "function" != 'undefined' && {} || this;

  var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" [<!ENTITY nbsp "&#160;">]>';

  function isElement(obj) {
    return obj instanceof HTMLElement || obj instanceof SVGElement;
  }

  function requireDomNode(el) {
    if (!isElement(el)) {
      throw new Error('an HTMLElement or SVGElement is required; got ' + el);
    }
  }

  function isExternal(url) {
    return url && url.lastIndexOf('http',0) == 0 && url.lastIndexOf(window.location.host) == -1;
  }

  function inlineImages(el, callback) {
    requireDomNode(el);

    var images = el.querySelectorAll('image'),
        left = images.length,
        checkDone = function() {
          if (left === 0) {
            callback();
          }
        };

    checkDone();
    for (var i = 0; i < images.length; i++) {
      (function(image) {
        var href = image.getAttributeNS("http://www.w3.org/1999/xlink", "href");
        if (href) {
          if (isExternal(href.value)) {
            console.warn("Cannot render embedded images linking to external hosts: "+href.value);
            return;
          }
        }
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        var img = new Image();
        img.crossOrigin="anonymous";
        href = href || image.getAttribute('href');
        if (href) {
          img.src = href;
          img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            image.setAttributeNS("http://www.w3.org/1999/xlink", "href", canvas.toDataURL('image/png'));
            left--;
            checkDone();
          }
          img.onerror = function() {
            console.log("Could not load "+href);
            left--;
            checkDone();
          }
        } else {
          left--;
          checkDone();
        }
      })(images[i]);
    }
  }

  function styles(el, options, cssLoadedCallback) {
    var selectorRemap = options.selectorRemap;
    var modifyStyle = options.modifyStyle;
    var css = "";
    // each font that has extranl link is saved into queue, and processed
    // asynchronously
    var fontsQueue = [];
    var sheets = document.styleSheets;
    for (var i = 0; i < sheets.length; i++) {
      try {
        var rules = sheets[i].cssRules;
      } catch (e) {
        console.warn("Stylesheet could not be loaded: "+sheets[i].href);
        continue;
      }

      if (rules != null) {
        for (var j = 0, match; j < rules.length; j++, match = null) {
          var rule = rules[j];
          if (typeof(rule.style) != "undefined") {
            var selectorText;

            try {
              selectorText = rule.selectorText;
            } catch(err) {
              console.warn('The following CSS rule has an invalid selector: "' + rule + '"', err);
            }

            try {
              if (selectorText) {
                match = el.querySelector(selectorText) || el.parentNode.querySelector(selectorText);
              }
            } catch(err) {
              console.warn('Invalid CSS selector "' + selectorText + '"', err);
            }

            if (match) {
              var selector = selectorRemap ? selectorRemap(rule.selectorText) : rule.selectorText;
              var cssText = modifyStyle ? modifyStyle(rule.style.cssText) : rule.style.cssText;
              css += selector + " { " + cssText + " }\n";
            } else if(rule.cssText.match(/^@font-face/)) {
              // below we are trying to find matches to external link. E.g.
              // @font-face {
              //   // ...
              //   src: local('Abel'), url(https://fonts.gstatic.com/s/abel/v6/UzN-iejR1VoXU2Oc-7LsbvesZW2xOQ-xsNqO47m55DA.woff2);
              // }
              //
              // This regex will save extrnal link into first capture group
              var fontUrlRegexp = /url\(["']?(.+?)["']?\)/;
              // TODO: This needs to be changed to support multiple url declarations per font.
              var fontUrlMatch = rule.cssText.match(fontUrlRegexp);

              var externalFontUrl = (fontUrlMatch && fontUrlMatch[1]) || '';
              var fontUrlIsDataURI = externalFontUrl.match(/^data:/);
              if (fontUrlIsDataURI) {
                // We should ignore data uri - they are already embedded
                externalFontUrl = '';
              }

              if (externalFontUrl) {
                // okay, we are lucky. We can fetch this font later

                //handle url if relative
                if (externalFontUrl.startsWith('../')) {
                  externalFontUrl = sheets[i].href + '/../' + externalFontUrl
                } else if (externalFontUrl.startsWith('./')) {
                  externalFontUrl = sheets[i].href + '/.' + externalFontUrl
                }

                fontsQueue.push({
                  text: rule.cssText,
                  // Pass url regex, so that once font is downladed, we can run `replace()` on it
                  fontUrlRegexp: fontUrlRegexp,
                  format: getFontMimeTypeFromUrl(externalFontUrl),
                  url: externalFontUrl
                });
              } else {
                // otherwise, use previous logic
                css += rule.cssText + '\n';
              }
            }
          }
        }
      }
    }

    // Now all css is processed, it's time to handle scheduled fonts
    processFontQueue(fontsQueue);

    function getFontMimeTypeFromUrl(fontUrl) {
      var supportedFormats = {
        'woff2': 'font/woff2',
        'woff': 'font/woff',
        'otf': 'application/x-font-opentype',
        'ttf': 'application/x-font-ttf',
        'eot': 'application/vnd.ms-fontobject',
        'sfnt': 'application/font-sfnt',
        'svg': 'image/svg+xml'
      };
      var extensions = Object.keys(supportedFormats);
      for (var i = 0; i < extensions.length; ++i) {
        var extension = extensions[i];
        // TODO: This is not bullet proof, it needs to handle edge cases...
        if (fontUrl.indexOf('.' + extension) > 0) {
          return supportedFormats[extension];
        }
      }

      // If you see this error message, you probably need to update code above.
      console.error('Unknown font format for ' + fontUrl+ '; Fonts may not be working correctly');
      return 'application/octet-stream';
    }

    function processFontQueue(queue) {
      if (queue.length > 0) {
        // load fonts one by one until we have anything in the queue:
        var font = queue.pop();
        processNext(font);
      } else {
        // no more fonts to load.
        cssLoadedCallback(css);
      }

      function processNext(font) {
        // TODO: This could benefit from caching.
        var oReq = new XMLHttpRequest();
        oReq.addEventListener('load', fontLoaded);
        oReq.addEventListener('error', transferFailed);
        oReq.addEventListener('abort', transferFailed);
        oReq.open('GET', font.url);
        oReq.responseType = 'arraybuffer';
        oReq.send();

        function fontLoaded() {
          // TODO: it may be also worth to wait until fonts are fully loaded before
          // attempting to rasterize them. (e.g. use https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet )
          var fontBits = oReq.response;
          var fontInBase64 = arrayBufferToBase64(fontBits);
          updateFontStyle(font, fontInBase64);
        }

        function transferFailed(e) {
          console.warn('Failed to load font from: ' + font.url);
          console.warn(e)
          css += font.text + '\n';
          processFontQueue();
        }

        function updateFontStyle(font, fontInBase64) {
          var dataUrl = 'url("data:' + font.format + ';base64,' + fontInBase64 + '")';
          css += font.text.replace(font.fontUrlRegexp, dataUrl) + '\n';

          // schedule next font download on next tick.
          setTimeout(function() {
            processFontQueue(queue)
          }, 0);
        }

      }
    }

    function arrayBufferToBase64(buffer) {
      var binary = '';
      var bytes = new Uint8Array(buffer);
      var len = bytes.byteLength;

      for (var i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
      }

      return window.btoa(binary);
    }
  }

  function getDimension(el, clone, dim) {
    var v = (el.viewBox && el.viewBox.baseVal && el.viewBox.baseVal[dim]) ||
      (clone.getAttribute(dim) !== null && !clone.getAttribute(dim).match(/%$/) && parseInt(clone.getAttribute(dim))) ||
      el.getBoundingClientRect()[dim] ||
      parseInt(clone.style[dim]) ||
      parseInt(window.getComputedStyle(el).getPropertyValue(dim));
    return (typeof v === 'undefined' || v === null || isNaN(parseFloat(v))) ? 0 : v;
  }

  function reEncode(data) {
    data = encodeURIComponent(data);
    data = data.replace(/%([0-9A-F]{2})/g, function(match, p1) {
      var c = String.fromCharCode('0x'+p1);
      return c === '%' ? '%25' : c;
    });
    return decodeURIComponent(data);
  }

  out$.prepareSvg = function(el, options, cb) {
    requireDomNode(el);

    options = options || {};
    options.scale = options.scale || 1;
    options.responsive = options.responsive || false;
    var xmlns = "http://www.w3.org/2000/xmlns/";

    inlineImages(el, function() {
      var outer = document.createElement("div");
      var clone = el.cloneNode(true);
      var width, height;
      if(el.tagName == 'svg') {
        width = options.width || getDimension(el, clone, 'width');
        height = options.height || getDimension(el, clone, 'height');
      } else if(el.getBBox) {
        var box = el.getBBox();
        width = box.x + box.width;
        height = box.y + box.height;
        clone.setAttribute('transform', clone.getAttribute('transform').replace(/translate\(.*?\)/, ''));

        var svg = document.createElementNS('http://www.w3.org/2000/svg','svg')
        svg.appendChild(clone)
        clone = svg;
      } else {
        console.error('Attempted to render non-SVG element', el);
        return;
      }

      clone.setAttribute("version", "1.1");
      if (!clone.getAttribute('xmlns')) {
        clone.setAttributeNS(xmlns, "xmlns", "http://www.w3.org/2000/svg");
      }
      if (!clone.getAttribute('xmlns:xlink')) {
        clone.setAttributeNS(xmlns, "xmlns:xlink", "http://www.w3.org/1999/xlink");
      }

      if (options.responsive) {
        clone.removeAttribute('width');
        clone.removeAttribute('height');
        clone.setAttribute('preserveAspectRatio', 'xMinYMin meet');
      } else {
        clone.setAttribute("width", width * options.scale);
        clone.setAttribute("height", height * options.scale);
      }

      clone.setAttribute("viewBox", [
        options.left || 0,
        options.top || 0,
        width,
        height
      ].join(" "));

      var fos = clone.querySelectorAll('foreignObject > *');
      for (var i = 0; i < fos.length; i++) {
        if (!fos[i].getAttribute('xmlns')) {
          fos[i].setAttributeNS(xmlns, "xmlns", "http://www.w3.org/1999/xhtml");
        }
      }

      outer.appendChild(clone);

      // In case of custom fonts we need to fetch font first, and then inline
      // its url into data-uri format (encode as base64). That's why style
      // processing is done asynchonously. Once all inlining is finshed
      // cssLoadedCallback() is called.
      styles(el, options, cssLoadedCallback);

      function cssLoadedCallback(css) {
        // here all fonts are inlined, so that we can render them properly.
        var s = document.createElement('style');
        s.setAttribute('type', 'text/css');
        s.innerHTML = "<![CDATA[\n" + css + "\n]]>";
        var defs = document.createElement('defs');
        defs.appendChild(s);
        clone.insertBefore(defs, clone.firstChild);

        if (cb) {
          var outHtml = outer.innerHTML;
          outHtml = outHtml.replace(/NS\d+:href/gi, 'xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href');
          cb(outHtml, width, height);
        }
      }
    });
  }

  out$.svgAsDataUri = function(el, options, cb) {
    out$.prepareSvg(el, options, function(svg) {
      var uri = 'data:image/svg+xml;base64,' + window.btoa(reEncode(doctype + svg));
      if (cb) {
        cb(uri);
      }
    });
  }

  out$.svgAsPngUri = function(el, options, cb) {
    requireDomNode(el);

    options = options || {};
    options.encoderType = options.encoderType || 'image/png';
    options.encoderOptions = options.encoderOptions || 0.8;

    var convertToPng = function(src, w, h) {
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      canvas.width = w;
      canvas.height = h;

      if(options.canvg) {
        options.canvg(canvas, src);
      } else {
        context.drawImage(src, 0, 0);
      }

      if(options.backgroundColor){
        context.globalCompositeOperation = 'destination-over';
        context.fillStyle = options.backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      var png;
      try {
        png = canvas.toDataURL(options.encoderType, options.encoderOptions);
      } catch (e) {
        if ((typeof SecurityError !== 'undefined' && e instanceof SecurityError) || e.name == "SecurityError") {
          console.error("Rendered SVG images cannot be downloaded in this browser.");
          return;
        } else {
          throw e;
        }
      }
      cb(png);
    }

    if(options.canvg) {
      out$.prepareSvg(el, options, convertToPng);
    } else {
      out$.svgAsDataUri(el, options, function(uri) {
        var image = new Image();

        image.onload = function() {
          convertToPng(image, image.width, image.height);
        }

        image.onerror = function() {
          console.error(
            'There was an error loading the data URI as an image on the following SVG\n',
            window.atob(uri.slice(26)), '\n',
            "Open the following link to see browser's diagnosis\n",
            uri);
        }

        image.src = uri;
      });
    }
  }

  out$.download = function(name, uri) {
    if (navigator.msSaveOrOpenBlob) {
      navigator.msSaveOrOpenBlob(uriToBlob(uri), name);
    } else {
      var saveLink = document.createElement('a');
      var downloadSupported = 'download' in saveLink;
      if (downloadSupported) {
        saveLink.download = name;
        saveLink.style.display = 'none';
        document.body.appendChild(saveLink);
        try {
          var blob = uriToBlob(uri);
          var url = URL.createObjectURL(blob);
          saveLink.href = url;
          saveLink.onclick = function() {
            requestAnimationFrame(function() {
              URL.revokeObjectURL(url);
            })
          };
        } catch (e) {
          console.warn('This browser does not support object URLs. Falling back to string URL.');
          saveLink.href = uri;
        }
        saveLink.click();
        document.body.removeChild(saveLink);
      }
      else {
        window.open(uri, '_temp', 'menubar=no,toolbar=no,status=no');
      }
    }
  }

  function uriToBlob(uri) {
    var byteString = window.atob(uri.split(',')[1]);
    var mimeString = uri.split(',')[0].split(':')[1].split(';')[0]
    var buffer = new ArrayBuffer(byteString.length);
    var intArray = new Uint8Array(buffer);
    for (var i = 0; i < byteString.length; i++) {
      intArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([buffer], {type: mimeString});
  }

  out$.saveSvg = function(el, name, options) {
    requireDomNode(el);

    options = options || {};
    out$.svgAsDataUri(el, options, function(uri) {
      out$.download(name, uri);
    });
  }

  out$.saveSvgAsPng = function(el, name, options) {
    requireDomNode(el);

    options = options || {};
    out$.svgAsPngUri(el, options, function(uri) {
      out$.download(name, uri);
    });
  }

  // if define is defined create as an AMD module
  if (true) {
    !(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
      return out$;
    }.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  }

})();


/***/ }),
/* 126 */
/***/ (function(module, exports, __webpack_require__) {

(function (global, factory) {
   true ? factory(exports) :
  typeof define === 'function' && define.amd ? define('d3-save-svg', ['exports'], factory) :
  factory((global.d3_save_svg = {}));
}(this, function (exports) { 'use strict';

  function download (svgInfo, filename) {
    window.URL = (window.URL || window.webkitURL);
    var blob = new Blob(svgInfo.source, {type: 'text\/xml'});
    var url = window.URL.createObjectURL(blob);
    var body = document.body;
    var a = document.createElement('a');

    body.appendChild(a);
    a.setAttribute('download', filename + '.svg');
    a.setAttribute('href', url);
    a.style.display = 'none';
    a.click();
    a.parentNode.removeChild(a);

    setTimeout(function() {
      window.URL.revokeObjectURL(url);
    }, 10);
  }

  var prefix = {
    svg: 'http://www.w3.org/2000/svg',
    xhtml: 'http://www.w3.org/1999/xhtml',
    xlink: 'http://www.w3.org/1999/xlink',
    xml: 'http://www.w3.org/XML/1998/namespace',
    xmlns: 'http://www.w3.org/2000/xmlns/',
  };

  function setInlineStyles (svg) {

    // add empty svg element
    var emptySvg = window.document.createElementNS(prefix.svg, 'svg');
    window.document.body.appendChild(emptySvg);
    var emptySvgDeclarationComputed = window.getComputedStyle(emptySvg);

    // hardcode computed css styles inside svg
    var allElements = traverse(svg);
    var i = allElements.length;
    while (i--) {
      explicitlySetStyle(allElements[i]);
    }

    emptySvg.parentNode.removeChild(emptySvg);

    function explicitlySetStyle(element) {
      var cSSStyleDeclarationComputed = window.getComputedStyle(element);
      var i;
      var len;
      var key;
      var value;
      var computedStyleStr = '';

      for (i = 0, len = cSSStyleDeclarationComputed.length; i < len; i++) {
        key = cSSStyleDeclarationComputed[i];
        value = cSSStyleDeclarationComputed.getPropertyValue(key);
        if (value !== emptySvgDeclarationComputed.getPropertyValue(key)) {
          // Don't set computed style of width and height. Makes SVG elmements disappear.
          if ((key !== 'height') && (key !== 'width')) {
            computedStyleStr += key + ':' + value + ';';
          }

        }
      }

      element.setAttribute('style', computedStyleStr);
    }

    function traverse(obj) {
      var tree = [];
      tree.push(obj);
      visit(obj);
      function visit(node) {
        if (node && node.hasChildNodes()) {
          var child = node.firstChild;
          while (child) {
            if (child.nodeType === 1 && child.nodeName != 'SCRIPT') {
              tree.push(child);
              visit(child);
            }

            child = child.nextSibling;
          }
        }
      }

      return tree;
    }
  }

  function preprocess (svg) {
    svg.setAttribute('version', '1.1');

    // removing attributes so they aren't doubled up
    svg.removeAttribute('xmlns');
    svg.removeAttribute('xlink');

    // These are needed for the svg
    if (!svg.hasAttributeNS(prefix.xmlns, 'xmlns')) {
      svg.setAttributeNS(prefix.xmlns, 'xmlns', prefix.svg);
    }

    if (!svg.hasAttributeNS(prefix.xmlns, 'xmlns:xlink')) {
      svg.setAttributeNS(prefix.xmlns, 'xmlns:xlink', prefix.xlink);
    }

    setInlineStyles(svg);

    var xmls = new XMLSerializer();
    var source = xmls.serializeToString(svg);
    var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
    var rect = svg.getBoundingClientRect();
    var svgInfo = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      class: svg.getAttribute('class'),
      id: svg.getAttribute('id'),
      childElementCount: svg.childElementCount,
      source: [doctype + source],
    };

    return svgInfo;
  }

  function converterEngine(input) { // fn BLOB => Binary => Base64 ?
    var uInt8Array = new Uint8Array(input);
    var i = uInt8Array.length;
    var biStr = []; //new Array(i);
    while (i--) {
      biStr[i] = String.fromCharCode(uInt8Array[i]);
    }

    var base64 = window.btoa(biStr.join(''));
    return base64;
  };

  function getImageBase64(url, callback) {
    var xhr = new XMLHttpRequest(url);
    var img64;
    xhr.open('GET', url, true); // url is the url of a PNG/JPG image.
    xhr.responseType = 'arraybuffer';
    xhr.callback = callback;
    xhr.onload = function() {
      img64 = converterEngine(this.response); // convert BLOB to base64
      this.callback(null, img64); // callback : err, data
    };

    xhr.onerror = function() {
      callback('B64 ERROR', null);
    };

    xhr.send();
  };

  function isDataURL(str) {
    var uriPattern = /^\s*data:([a-z]+\/[a-z0-9\-]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/i;
    return !!str.match(uriPattern);
  }

  function save(svgElement, config) {
    if (svgElement.nodeName !== 'svg' || svgElement.nodeType !== 1) {
      throw 'Need an svg element input';
    }

    var config = config || {};
    var svgInfo = preprocess(svgElement, config);
    var defaultFileName = getDefaultFileName(svgInfo);
    var filename = config.filename || defaultFileName;
    var svgInfo = preprocess(svgElement);
    download(svgInfo, filename);
  }

  function embedRasterImages(svg) {

    var images = svg.querySelectorAll('image');
    [].forEach.call(images, function(image) {
      var url = image.getAttribute('href');

      // Check if it is already a data URL
      if (!isDataURL(url)) {
        // convert to base64 image and embed.
        getImageBase64(url, function(err, d) {
          image.setAttributeNS(prefix.xlink, 'href', 'data:image/png;base64,' + d);
        });
      }

    });

  }

  function getDefaultFileName(svgInfo) {
    var defaultFileName = 'untitled';
    if (svgInfo.id) {
      defaultFileName = svgInfo.id;
    } else if (svgInfo.class) {
      defaultFileName = svgInfo.class;
    } else if (window.document.title) {
      defaultFileName = window.document.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    }

    return defaultFileName;
  }

  var version = "0.0.2";

  exports.version = version;
  exports.save = save;
  exports.embedRasterImages = embedRasterImages;

}));

/***/ }),
/* 127 */,
/* 128 */,
/* 129 */,
/* 130 */,
/* 131 */,
/* 132 */,
/* 133 */,
/* 134 */,
/* 135 */,
/* 136 */,
/* 137 */,
/* 138 */,
/* 139 */,
/* 140 */,
/* 141 */,
/* 142 */,
/* 143 */,
/* 144 */,
/* 145 */,
/* 146 */,
/* 147 */,
/* 148 */,
/* 149 */,
/* 150 */,
/* 151 */,
/* 152 */,
/* 153 */,
/* 154 */,
/* 155 */,
/* 156 */,
/* 157 */,
/* 158 */,
/* 159 */
/***/ (function(module, exports) {

// transliterated from the python snippet here:
// http://en.wikipedia.org/wiki/Lanczos_approximation

var g = 7;
var p = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
];

var g_ln = 607/128;
var p_ln = [
    0.99999999999999709182,
    57.156235665862923517,
    -59.597960355475491248,
    14.136097974741747174,
    -0.49191381609762019978,
    0.33994649984811888699e-4,
    0.46523628927048575665e-4,
    -0.98374475304879564677e-4,
    0.15808870322491248884e-3,
    -0.21026444172410488319e-3,
    0.21743961811521264320e-3,
    -0.16431810653676389022e-3,
    0.84418223983852743293e-4,
    -0.26190838401581408670e-4,
    0.36899182659531622704e-5
];

// Spouge approximation (suitable for large arguments)
function lngamma(z) {

    if(z < 0) return Number('0/0');
    var x = p_ln[0];
    for(var i = p_ln.length - 1; i > 0; --i) x += p_ln[i] / (z + i);
    var t = z + g_ln + 0.5;
    return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x)-Math.log(z);
}

module.exports = function gamma (z) {
    if (z < 0.5) {
        return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    }
    else if(z > 100) return Math.exp(lngamma(z));
    else {
        z -= 1;
        var x = p[0];
        for (var i = 1; i < g + 2; i++) {
            x += p[i] / (z + i);
        }
        var t = z + g + 0.5;

        return Math.sqrt(2 * Math.PI)
            * Math.pow(t, z + 0.5)
            * Math.exp(-t)
            * x
        ;
    }
};

module.exports.log = lngamma;


/***/ }),
/* 160 */,
/* 161 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(162);


/***/ }),
/* 162 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function($) {

window.jQuery = window.$ = $;

__webpack_require__(165);
__webpack_require__(166);
__webpack_require__(167);
__webpack_require__(168);

__webpack_require__(89);
__webpack_require__(19);

var absrel = __webpack_require__(182),
    busted = __webpack_require__(286),
    fade = __webpack_require__(287),
    fade_summary = __webpack_require__(288),
    fel = __webpack_require__(289),
    prime = __webpack_require__(438),
    relax = __webpack_require__(441),
    slac = __webpack_require__(443),
    meme = __webpack_require__(445),
    template = __webpack_require__(446);

// Create new hyphy-vision export
window.absrel = absrel;
window.busted = busted;
window.fade = fade;
window.fade_summary = fade_summary;
window.fel = fel;
window.prime = prime;
window.meme = meme;
window.relax = relax;
window.slac = slac;
window.template = template;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)))

/***/ }),
/* 163 */,
/* 164 */,
/* 165 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 166 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 167 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 168 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 169 */,
/* 170 */,
/* 171 */,
/* 172 */,
/* 173 */,
/* 174 */,
/* 175 */,
/* 176 */,
/* 177 */,
/* 178 */,
/* 179 */,
/* 180 */,
/* 181 */,
/* 182 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(d3, $) {

var _tables = __webpack_require__(20);

var _tree_summary = __webpack_require__(199);

var _tree = __webpack_require__(64);

var _branch_table = __webpack_require__(200);

var _navbar = __webpack_require__(21);

var _scrollspy = __webpack_require__(22);

var _input_info = __webpack_require__(39);

var React = __webpack_require__(5),
    ReactDOM = __webpack_require__(17);

var _ = __webpack_require__(9);

__webpack_require__(50);
__webpack_require__(123);

var BSRELSummary = React.createClass({
  displayName: "BSRELSummary",

  float_format: d3.format(".2f"),

  countBranchesTested: function countBranchesTested(branches_tested) {
    if (branches_tested) {
      return branches_tested.split(";").length;
    } else {
      return 0;
    }
  },

  getBranchesWithEvidence: function getBranchesWithEvidence(test_results) {
    return _.filter(test_results, function (d) {
      return d.p <= 0.05;
    }).length;
  },

  getTestBranches: function getTestBranches(test_results) {
    return _.filter(test_results, function (d) {
      return d.tested > 0;
    }).length;
  },

  getTotalBranches: function getTotalBranches(test_results) {
    return _.keys(test_results).length;
  },

  getInitialState: function getInitialState() {
    var self = this;

    return {
      branches_with_evidence: this.getBranchesWithEvidence(self.props.test_results),
      test_branches: this.getTestBranches(self.props.test_results),
      total_branches: this.getTotalBranches(self.props.test_results)
    };
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    this.setState({
      branches_with_evidence: this.getBranchesWithEvidence(nextProps.test_results),
      test_branches: this.getTestBranches(nextProps.test_results),
      total_branches: this.getTotalBranches(nextProps.test_results)
    });
  },

  render: function render() {
    var self = this,
        user_message,
        was_evidence = self.state.branches_with_evidence > 0;

    if (was_evidence) {
      user_message = React.createElement(
        "p",
        { className: "list-group-item-text label_and_input" },
        "aBSREL ",
        React.createElement(
          "strong",
          { className: "hyphy-highlight" },
          "found evidence"
        ),
        " of episodic diversifying selection on",
        " ",
        React.createElement(
          "span",
          { className: "hyphy-highlight" },
          React.createElement(
            "strong",
            null,
            self.state.branches_with_evidence
          )
        ),
        " ",
        "out of",
        " ",
        React.createElement(
          "span",
          { className: "hyphy-highlight" },
          React.createElement(
            "strong",
            null,
            self.state.total_branches
          )
        ),
        " ",
        "branches in your phylogeny."
      );
    } else {
      user_message = React.createElement(
        "p",
        { className: "list-group-item-text label_and_input" },
        "aBSREL ",
        React.createElement(
          "strong",
          null,
          "found no evidence"
        ),
        " of episodic diversifying selection in your phylogeny."
      );
    }

    return React.createElement(
      "div",
      { className: "row", id: "summary-div" },
      React.createElement(
        "div",
        { className: "col-md-12" },
        React.createElement(
          "h3",
          { className: "list-group-item-heading" },
          React.createElement(
            "span",
            { className: "summary-method-name" },
            "adaptive Branch Site REL"
          ),
          React.createElement("br", null),
          React.createElement(
            "span",
            { className: "results-summary" },
            "results summary"
          )
        )
      ),
      React.createElement(
        "div",
        { className: "col-md-12" },
        React.createElement(_input_info.InputInfo, { input_data: this.props.input_data })
      ),
      React.createElement(
        "div",
        { className: "col-md-12" },
        React.createElement(
          "div",
          { className: "main-result" },
          user_message,
          React.createElement(
            "p",
            null,
            "A total of",
            " ",
            React.createElement(
              "strong",
              { className: "hyphy-highlight" },
              self.state.test_branches
            ),
            " ",
            "branches were formally tested for diversifying selection. Significance was assessed using the Likelihood Ratio Test at a threshold of p \u2264 0.05, after correcting for multiple testing. Significance and number of rate categories inferred at each branch are provided in the ",
            React.createElement(
              "a",
              { href: "#table-tab" },
              "detailed results"
            ),
            " ",
            "table."
          ),
          React.createElement("hr", null),
          React.createElement(
            "p",
            null,
            React.createElement(
              "small",
              null,
              "See",
              " ",
              React.createElement(
                "a",
                { href: "http://hyphy.org/methods/selection-methods/#absrel" },
                "here"
              ),
              " ",
              "for more information about the aBSREL method.",
              React.createElement("br", null),
              "Please cite",
              " ",
              React.createElement(
                "a",
                {
                  href: "http://www.ncbi.nlm.nih.gov/pubmed/25697341",
                  id: "summary-pmid",
                  target: "_blank"
                },
                "PMID 25697341"
              ),
              " ",
              "if you use this result in a publication, presentation, or other scientific work."
            )
          )
        )
      )
    );
  }
});

var BSREL = React.createClass({
  displayName: "BSREL",

  float_format: d3.format(".2f"),

  loadFromServer: function loadFromServer() {

    var self = this;

    d3.json(this.props.url, function (data) {
      data["fits"]["MG94"]["branch-annotations"] = self.formatBranchAnnotations(data, "MG94");
      data["fits"]["Full model"]["branch-annotations"] = self.formatBranchAnnotations(data, "Full model");

      // GH-#18 Add omega annotation tag
      data["fits"]["MG94"]["annotation-tag"] = "ω";
      data["fits"]["Full model"]["annotation-tag"] = "ω";

      self.setState({
        annotations: data["fits"]["Full model"]["branch-annotations"],
        json: data,
        pmid: data["PMID"],
        fits: data["fits"],
        full_model: data["fits"]["Full model"],
        test_results: data["test results"],
        input_data: data["input_data"],
        tree: d3.layout.phylotree()(data["fits"]["Full model"]["tree string"])
      });
    });
  },

  omegaColorGradient: ["#5e4fa2", "#3288bd", "#e6f598", "#f46d43", "#9e0142"],
  omegaGrayScaleGradient: ["#DDDDDD", "#AAAAAA", "#888888", "#444444", "#000000"],

  getDefaultProps: function getDefaultProps() {},

  getInitialState: function getInitialState() {
    var edgeColorizer = function edgeColorizer(element, data, omega_color) {
      var svg = d3.select("#tree_container svg"),
          svg_defs = d3.select(".phylotree-definitions");

      if (svg_defs.empty()) {
        svg_defs = svg.append("defs").attr("class", "phylotree-definitions");
      }

      // clear existing linearGradients
      var omega_format = d3.format(".3r"),
          prop_format = d3.format(".2p");

      var createBranchGradient = function createBranchGradient(node) {
        function generateGradient(svg_defs, grad_id, annotations, already_cumulative) {
          var current_weight = 0;
          var this_grad = svg_defs.append("linearGradient").attr("id", grad_id);

          annotations.forEach(function (d, i) {
            if (d.prop) {
              var new_weight = current_weight + d.prop;
              this_grad.append("stop").attr("offset", "" + current_weight * 100 + "%").style("stop-color", omega_color(d.omega));
              this_grad.append("stop").attr("offset", "" + new_weight * 100 + "%").style("stop-color", omega_color(d.omega));
              current_weight = new_weight;
            }
          });
        }

        // Create svg definitions
        if (self.gradient_count == undefined) {
          self.gradient_count = 0;
        }

        if (node.annotations) {
          if (node.annotations.length == 1) {
            node["color"] = omega_color(node.annotations[0]["omega"]);
          } else {
            self.gradient_count++;
            var grad_id = "branch_gradient_" + self.gradient_count;
            generateGradient(svg_defs, grad_id, node.annotations.omegas);
            node["grad"] = grad_id;
          }
        }
      };

      var annotations = data.target.annotations,
          alpha_level = 0.05,
          tooltip = "<b>" + data.target.name + "</b>";
      //reference_omega_weight = prop_format(0),
      //distro = "";

      if (annotations) {
        //reference_omega_weight = annotations.omegas[0].prop;

        annotations.omegas.forEach(function (d, i) {
          var omega_value = d.omega > 1e20 ? "&infin;" : omega_format(d.omega),
              omega_weight = prop_format(d.prop);

          tooltip += "<br/>&omega;<sub>" + (i + 1) + "</sub> = " + omega_value + " (" + omega_weight + ")";

          //if (i) {
          //  distro += "<br/>";
          //}

          //distro +=
          //  "&omega;<sub>" +
          //  (i + 1) +
          //  "</sub> = " +
          //  omega_value +
          //  " (" +
          //omega_weight +
          //")";
        });

        tooltip += "<br/><i>p = " + omega_format(annotations["p"]) + "</i>";

        $(element[0][0]).tooltip({
          title: tooltip,
          html: true,
          trigger: "hover",
          container: "body",
          placement: "auto"
        });

        createBranchGradient(data.target);

        if (data.target.grad) {
          element.style("stroke", "url(#" + data.target.grad + ")");
        } else {
          element.style("stroke", data.target.color);
        }

        element.style("stroke-width", annotations["p"] <= alpha_level ? "12" : "5").style("stroke-linejoin", "round").style("stroke-linecap", "round");
      }
    };

    var tree_settings = {
      omegaPlot: {},
      "tree-options": {
        /* value arrays have the following meaning
                [0] - the value of the attribute
                [1] - does the change in attribute value trigger tree re-layout?
            */
        "hyphy-tree-model": ["Full model", true],
        "hyphy-tree-highlight": [null, false],
        "hyphy-tree-branch-lengths": [true, true],
        "hyphy-tree-hide-legend": [false, true],
        "hyphy-tree-fill-color": [true, true]
      },
      "suppress-tree-render": false,
      "chart-append-html": true,
      edgeColorizer: edgeColorizer
    };

    return {
      annotations: null,
      json: null,
      pmid: null,
      model_fits: {},
      settings: tree_settings,
      test_results: null,
      input_data: null,
      tree: null
    };
  },

  componentWillMount: function componentWillMount() {
    this.loadFromServer();
  },

  componentDidMount: function componentDidMount() {
    this.setEvents();
  },

  setEvents: function setEvents() {
    var self = this;

    $("#dm-file").on("change", function (e) {
      var files = e.target.files; // FileList object

      if (files.length == 1) {
        var f = files[0];
        var reader = new FileReader();

        reader.onload = function (theFile) {
          return function (e) {
            var data = JSON.parse(this.result);
            data["fits"]["MG94"]["branch-annotations"] = self.formatBranchAnnotations(data, "MG94");
            data["fits"]["Full model"]["branch-annotations"] = self.formatBranchAnnotations(data, "Full model");

            var annotations = data["fits"]["Full model"]["branch-annotations"],
                json = data,
                pmid = data["PMID"],
                full_model = json["fits"]["Full model"],
                test_results = data["test results"],
                input_data = data["input_data"],
                fits = data["fits"];

            self.setState({
              annotations: annotations,
              json: json,
              pmid: pmid,
              full_model: full_model,
              test_results: test_results,
              input_data: input_data,
              fits: fits,
              tree: d3.layout.phylotree()(data["fits"]["Full model"]["tree string"])
            });
          };
        }(f);
        reader.readAsText(f);
      }
      e.preventDefault();
    });
  },

  formatBranchAnnotations: function formatBranchAnnotations(json, key) {
    var initial_branch_annotations = json["fits"][key]["branch-annotations"];

    if (!initial_branch_annotations) {
      initial_branch_annotations = json["fits"][key]["rate distributions"];
    }

    // Iterate over objects
    var branch_annotations = _.mapObject(initial_branch_annotations, function (val, key) {
      var vals = [];
      try {
        vals = JSON.parse(val);
      } catch (e) {
        vals = val;
      }

      var omegas = {
        omegas: _.map(vals, function (d) {
          return _.object(["omega", "prop"], d);
        })
      };
      var test_results = _.clone(json["test results"][key]);
      _.extend(test_results, omegas);
      return test_results;
    });

    return branch_annotations;
  },

  componentDidUpdate: function componentDidUpdate(prevProps, prevState) {
    $("body").scrollspy({
      target: ".bs-docs-sidebar",
      offset: 50
    });
    $('[data-toggle="popover"]').popover();
  },


  render: function render() {
    var self = this;

    var scrollspy_info = [{ label: "summary", href: "summary-tab" }, { label: "tree", href: "hyphy-tree-summary" }, { label: "table", href: "table-tab" }];

    var models = {};
    if (!_.isNull(self.state.json)) {
      models = self.state.json.fits;
    }

    return React.createElement(
      "div",
      null,
      React.createElement(_navbar.NavBar, null),
      React.createElement(
        "div",
        { className: "container" },
        React.createElement(
          "div",
          { className: "row" },
          React.createElement(_scrollspy.ScrollSpy, { info: scrollspy_info }),
          React.createElement(
            "div",
            { className: "col-sm-10" },
            React.createElement(
              "div",
              {
                id: "datamonkey-absrel-error",
                className: "alert alert-danger alert-dismissible",
                role: "alert",
                style: { display: "none" }
              },
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "close",
                  id: "datamonkey-absrel-error-hide"
                },
                React.createElement(
                  "span",
                  { "aria-hidden": "true" },
                  "\xD7"
                ),
                React.createElement(
                  "span",
                  { className: "sr-only" },
                  "Close"
                )
              ),
              React.createElement(
                "strong",
                null,
                "Error!"
              ),
              " ",
              React.createElement("span", { id: "datamonkey-absrel-error-text" })
            ),
            React.createElement(
              "div",
              { id: "results" },
              React.createElement(
                "div",
                { id: "summary-tab" },
                React.createElement(BSRELSummary, {
                  test_results: self.state.test_results,
                  pmid: self.state.pmid,
                  input_data: self.state.input_data
                }),
                React.createElement(
                  "div",
                  { className: "row" },
                  React.createElement(
                    "div",
                    { id: "hyphy-tree-summary", className: "col-md-12" },
                    React.createElement(_tree_summary.TreeSummary, {
                      model: self.state.full_model,
                      test_results: self.state.test_results
                    })
                  )
                )
              ),
              React.createElement(
                "div",
                { className: "row" },
                React.createElement(
                  "div",
                  { id: "tree-tab", className: "col-md-12" },
                  React.createElement(_tree.Tree, {
                    json: self.state.json,
                    settings: self.state.settings,
                    models: models,
                    color_gradient: self.omegaColorGradient,
                    grayscale_gradient: self.omegaGrayscaleGradient
                  })
                )
              ),
              React.createElement(
                "div",
                { className: "row" },
                React.createElement(
                  "div",
                  { id: "table-tab", className: "col-md-12" },
                  React.createElement(_branch_table.BranchTable, {
                    tree: self.state.tree,
                    test_results: self.state.test_results,
                    annotations: self.state.annotations
                  })
                ),
                React.createElement(
                  "div",
                  { id: "hyphy-model-fits", className: "col-md-12" },
                  React.createElement(_tables.DatamonkeyModelTable, { fits: self.state.fits }),
                  React.createElement(
                    "p",
                    { className: "description" },
                    "This table reports a statistical summary of the models fit to the data. Here, ",
                    React.createElement(
                      "strong",
                      null,
                      "MG94"
                    ),
                    " refers to the MG94xREV baseline model that infers a single \u03C9 rate category per branch. ",
                    React.createElement(
                      "strong",
                      null,
                      "Full Model"
                    ),
                    " refers to the adaptive aBSREL model that infers an optimized number of \u03C9 rate categories per branch."
                  )
                )
              )
            )
          )
        )
      )
    );
  }
});

// Will need to make a call to this
// omega distributions
function render_absrel(url, element) {
  ReactDOM.render(React.createElement(BSREL, { url: url }), document.getElementById(element));
}

module.exports = render_absrel;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6), __webpack_require__(3)))

/***/ }),
/* 183 */,
/* 184 */,
/* 185 */,
/* 186 */,
/* 187 */,
/* 188 */,
/* 189 */,
/* 190 */,
/* 191 */,
/* 192 */,
/* 193 */,
/* 194 */,
/* 195 */,
/* 196 */,
/* 197 */,
/* 198 */
/***/ (function(module, exports) {

(() => {
  
class CsvWriter {
  constructor(delimiter = ",", contentType = "text/csv") {
    this._delimiter = delimiter;
    this._contentType = contentType;
    this._rows = [[]];
  }

  get _currentRow() { return this._rows[this._rows.length-1]; }

  _quote(string) { return "\"" + string.replace(/"/g, "\"\"") + "\"" }

  writeValue(value) {
    let stringValue = value === undefined ? "" : String(value);
    let needsQuote = stringValue.indexOf(this._delimiter) !== -1 || /"\r\n/.test(stringValue);
    this._currentRow.push(needsQuote ? this._quote(stringValue) : stringValue);
  }

  writeLine() { this._rows.push([]); }

  toString() { return this._rows.map(row => row.join(this._delimiter)).reduce((content,row) => content + "\r\n" + row); }

  toBlob() { return new Blob([this.toString()], { type: this._contentType }); }
}


class Export {
  
  constructor(options) {
    this._options = options || {};
  }
  
  _createCsvBlob(data) {
    let delimeter = this._options.delimeter || ",";
    let contentType = this._options.contentType || "text/csv";
    let headerNames = this._options.headers || {};
    let formatters = this._options.formatters || {};
    let includeHeaders = this._options.includeHeaders;
    let getFormater = header => formatters[header] || (v => v);
    let writer = new CsvWriter(delimeter,contentType);
    let headers = this._options.columns || Object.getOwnPropertyNames(data[0]);
    if (includeHeaders === undefined || includeHeaders) {
      headers.forEach(header => writer.writeValue(headerNames[header]||header));
      writer.writeLine();
    }
    data.forEach(row => {
      headers.forEach(header => writer.writeValue(getFormater(header)(row[header])));
      writer.writeLine();
    });
    return writer.toBlob();
  }

  _download(blob, filename)
  {
    if (navigator.msSaveBlob) {
      // Internet Explorer throws "Access is Denied" with ObjectUrls
      navigator.msSaveBlob(blob,filename);
      return;
    }
    let link = document.createElement("A");
    let url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  downloadCsv(data) {
  	try {
    	console.info("Generating CSV download");
      let blob = this._createCsvBlob(data);
      let filename = this._options.filename || "export.csv";
      this._download(blob, filename);
    } catch(err) {
    	alert(`Unable to create export: ${err.message}`);
      console.error(err);
    }
  }
  
  static create(options) { return new Export(options); }

  static download(data) { return new Export().downloadCsv(data); }
}

window.Export = Export;

})();

/***/ }),
/* 199 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(d3, $) {

var _tables = __webpack_require__(20);

var React = __webpack_require__(5),
    _ = __webpack_require__(9);

/**
 * Generates a table that contains tree summary information
 * @param model -- the model to obtain information from
 * @param test results -- the general test result information
 */
var TreeSummary = React.createClass({
  displayName: "TreeSummary",
  getDefaultProps: function getDefaultProps() {
    return {
      model: {},
      test_results: {}
    };
  },


  getInitialState: function getInitialState() {
    var table_row_data = this.getSummaryRows(this.props.model, this.props.test_results),
        table_columns = this.getTreeSummaryColumns(table_row_data);

    return {
      table_row_data: table_row_data,
      table_columns: table_columns
    };
  },

  getRateClasses: function getRateClasses(branch_annotations) {
    // Get count of all rate classes
    var all_branches = _.values(branch_annotations);

    return _.countBy(all_branches, function (branch) {
      return branch.omegas.length;
    });
  },

  getBranchProportion: function getBranchProportion(rate_classes) {
    var sum = _.reduce(_.values(rate_classes), function (memo, num) {
      return memo + num;
    });
    return _.mapObject(rate_classes, function (val, key) {
      return d3.format(".2p")(val / sum);
    });
  },

  getBranchLengthProportion: function getBranchLengthProportion(model, rate_classes, branch_annotations, total_branch_length) {
    // get branch lengths of each rate distribution
    //return prop_format(d[2] / total_tree_length
    if (_.has(model, "tree string")) {
      var tree = d3.layout.phylotree("body")(model["tree string"]);
    } else {
      return null;
    }

    // Get count of all rate classes
    var branch_lengths = _.mapObject(rate_classes, function (d) {
      return 0;
    });

    for (var key in branch_annotations) {
      var node = tree.get_node_by_name(key);
      branch_lengths[branch_annotations[key].omegas.length] += tree.branch_length()(node);
    }

    return _.mapObject(branch_lengths, function (val, key) {
      return d3.format(".2p")(val / total_branch_length);
    });
  },

  getNumUnderSelection: function getNumUnderSelection(rate_classes, branch_annotations, test_results) {
    var num_under_selection = _.mapObject(rate_classes, function (d) {
      return 0;
    });

    for (var key in branch_annotations) {
      num_under_selection[branch_annotations[key].omegas.length] += test_results[key]["p"] <= 0.05;
    }

    return num_under_selection;
  },

  getSummaryRows: function getSummaryRows(model, test_results) {
    if (!model || !test_results) {
      return [];
    }

    // Create an array of phylotrees from fits

    var tree_length = model["tree length"];
    var branch_annotations = model["branch-annotations"];

    var rate_classes = this.getRateClasses(branch_annotations),
        proportions = this.getBranchProportion(rate_classes),
        length_proportions = this.getBranchLengthProportion(model, rate_classes, branch_annotations, tree_length),
        num_under_selection = this.getNumUnderSelection(rate_classes, branch_annotations, test_results);

    // zip objects into matrix
    var keys = _.keys(rate_classes);

    var summary_rows = _.zip(keys, _.values(rate_classes), _.values(proportions), _.values(length_proportions), _.values(num_under_selection));

    summary_rows.sort(function (a, b) {
      if (a[0] == b[0]) {
        return a[1] < b[1] ? -1 : a[1] == b[1] ? 0 : 1;
      }
      return a[0] - b[0];
    });

    return summary_rows;
  },

  getTreeSummaryColumns: function getTreeSummaryColumns(table_row_data) {
    var omega_header = "ω rate classes",
        branch_num_header = "# of branches",
        branch_prop_header = "% of branches",
        branch_prop_length_header = "% of tree length",
        under_selection_header = "# under selection";

    // inspect table_row_data and return header
    var all_columns = [{
      value: omega_header,
      abbr: "Number of ω rate classes inferred"
    }, {
      value: branch_num_header,
      abbr: "Number of branches with this many rate classes"
    }, {
      value: branch_prop_header,
      abbr: "Percentage of branches with this many rate classes"
    }, {
      value: branch_prop_length_header,
      abbr: "Percentage of tree length with this many rate classes"
    }, {
      value: under_selection_header,
      abbr: "Number of selected branches with this many rate classes"
    }];

    // validate each table row with its associated header
    if (table_row_data.length == 0) {
      return [];
    }

    // trim columns to length of table_row_data
    var column_headers = _.take(all_columns, table_row_data[0].length);
    return column_headers;
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    var table_row_data = this.getSummaryRows(nextProps.model, nextProps.test_results),
        table_columns = this.getTreeSummaryColumns(table_row_data);

    this.setState({
      table_row_data: table_row_data,
      table_columns: table_columns
    });
  },

  render: function render() {
    return React.createElement(
      "div",
      null,
      React.createElement(
        "h4",
        { className: "dm-table-header" },
        "Tree summary",
        React.createElement("span", {
          className: "glyphicon glyphicon-info-sign",
          style: { verticalAlign: "middle", float: "right" },
          "aria-hidden": "true",
          "data-toggle": "popover",
          "data-trigger": "hover",
          title: "Actions",
          "data-html": "true",
          "data-content": "<ul><li>Hover over a column header for a description of its content.</li></ul>",
          "data-placement": "bottom"
        })
      ),
      React.createElement(_tables.DatamonkeyTable, {
        headerData: this.state.table_columns,
        bodyData: this.state.table_row_data
      }),
      React.createElement(
        "p",
        { className: "description" },
        "This table contains a summary of the inferred aBSREL model complexity. Each row provides information about the branches that were best described by the given number of \u03C9 rate categories."
      )
    );
  }
});

// Will need to make a call to this
// omega distributions
function render_tree_summary(json, element) {
  React.render(React.createElement(TreeSummary, { model: model, test_results: test_results }), $(element)[0]);
}

// Will need to make a call to this
// omega distributions
function rerender_tree_summary(tree, element) {
  $(element).empty();
  render_tree_summary(tree, element);
}

module.exports.TreeSummary = TreeSummary;
module.exports.render_tree_summary = render_tree_summary;
module.exports.rerender_tree_summary = rerender_tree_summary;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6), __webpack_require__(3)))

/***/ }),
/* 200 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(_, d3, $) {

var _prop_chart = __webpack_require__(97);

var React = __webpack_require__(5);


var BranchTable = React.createClass({
  displayName: "BranchTable",

  getInitialState: function getInitialState() {
    // add the following
    var table_row_data = this.getBranchRows(this.props.tree, this.props.test_results, this.props.annotations),
        initial_model_name = _.take(_.keys(this.props.annotations)),
        initial_omegas = this.props.annotations ? this.props.annotations[initial_model_name]["omegas"] : null;

    var distro_settings = {
      dimensions: {
        width: 600,
        height: 400
      },
      margins: {
        left: 50,
        right: 15,
        bottom: 15,
        top: 35
      },
      legend: false,
      domain: [0.00001, 10000],
      do_log_plot: true,
      k_p: null,
      plot: null,
      svg_id: "prop-chart"
    };

    return {
      tree: this.props.tree,
      test_results: this.props.test_results,
      annotations: this.props.annotations,
      table_row_data: table_row_data,
      current_model_name: initial_model_name,
      current_omegas: initial_omegas,
      distro_settings: distro_settings
    };
  },

  getBranchLength: function getBranchLength(m, tree) {
    if (tree.get_node_by_name(m)) return d3.format(".4f")(tree.get_node_by_name(m).attribute);
    return "";
  },

  getLRT: function getLRT(branch) {
    var formatted = d3.format(".4f")(branch["LRT"]);
    if (formatted == "NaN") {
      return branch["LRT"];
    } else {
      return formatted;
    }
  },

  getPVal: function getPVal(branch) {
    return d3.format(".4f")(branch["p"]);
  },

  getUncorrectedPVal: function getUncorrectedPVal(branch) {
    return d3.format(".4f")(branch["uncorrected p"]);
  },

  getOmegaDistribution: function getOmegaDistribution(m, annotations) {
    if (!annotations) {
      return "";
    }

    var omega_string = "";

    for (var i in annotations[m]["omegas"]) {
      var omega = parseFloat(annotations[m]["omegas"][i]["omega"]);
      var formatted_omega = "∞";
      if (omega < 1e20) {
        formatted_omega = d3.format(".3r")(omega);
      }
      omega_string += "&omega;<sub>" + (parseInt(i) + 1) + "</sub> = " + formatted_omega + " (" + d3.format(".2p")(annotations[m]["omegas"][i]["prop"]) + ")<br/>";
    }

    return omega_string;
  },

  getBranchRows: function getBranchRows(tree, test_results, annotations) {
    var table_row_data = [];

    for (var m in test_results) {
      var branch_row = [];
      var branch = test_results[m];

      branch_row = [m, this.getBranchLength(m, tree), this.getLRT(branch), this.getPVal(branch), this.getUncorrectedPVal(branch), this.getOmegaDistribution(m, annotations)];

      table_row_data.push(branch_row);
    }

    table_row_data.sort(function (a, b) {
      if (a[2] == "test not run" && b[2] != "test not run") return 1;
      if (a[2] != "test not run" && b[2] == "test not run") return -1;

      if (a[0] == b[0]) {
        return a[1] < b[1] ? -1 : a[1] == b[1] ? 0 : 1;
      }

      return a[3] - b[3];
    });

    return table_row_data;
  },

  setEvents: function setEvents() {
    var self = this;

    if (self.state.annotations) {
      var branch_table = d3.select("#table-branch-table").selectAll("tr");

      branch_table.on("click", function (d) {
        var label = d[0];
        self.setState({
          current_model_name: label,
          current_omegas: self.state.annotations[label]["omegas"]
        });
        $("#myModal").modal("show");
      });
    }
  },

  createDistroChart: function createDistroChart() {
    this.settings = {
      dimensions: {
        width: 600,
        height: 400
      },
      margins: {
        left: 50,
        right: 15,
        bottom: 15,
        top: 15
      },
      has_zeros: true,
      legend_id: null,
      do_log_plot: true,
      k_p: null,
      plot: null,
      svg_id: "prop-chart"
    };
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    var table_row_data = this.getBranchRows(nextProps.tree, nextProps.test_results, nextProps.annotations),
        initial_model_name = _.take(_.keys(nextProps.annotations)),
        initial_omegas = nextProps.annotations ? nextProps.annotations[initial_model_name]["omegas"] : null;

    var distro_settings = {
      dimensions: {
        width: 600,
        height: 400
      },
      margins: {
        left: 50,
        right: 15,
        bottom: 15,
        top: 15
      },
      legend: false,
      domain: [0.00001, 10000],
      do_log_plot: true,
      k_p: null,
      plot: null,
      svg_id: "prop-chart"
    };

    if (nextProps.test_results && nextProps.annotations) {
      this.setState({
        tree: nextProps.tree,
        test_results: nextProps.test_results,
        annotations: nextProps.annotations,
        table_row_data: table_row_data,
        current_model_name: initial_model_name,
        current_omegas: initial_omegas,
        distro_settings: distro_settings
      });
    }
  },

  componentDidUpdate: function componentDidUpdate() {
    var branch_rows = d3.select("#table-branch-table").selectAll("tr").data(this.state.table_row_data);

    branch_rows.enter().append("tr");
    branch_rows.exit().remove();
    branch_rows.style("font-weight", function (d) {
      return d[3] <= 0.05 ? "bold" : "normal";
    });

    branch_rows = branch_rows.selectAll("td").data(function (d) {
      return d;
    });

    branch_rows.enter().append("td");
    branch_rows.html(function (d) {
      return d;
    });

    this.createDistroChart();
    this.setEvents();
  },

  render: function render() {
    var self = this;

    return React.createElement(
      "div",
      { className: "row" },
      React.createElement(
        "div",
        { id: "hyphy-branch-table", className: "col-md-12" },
        React.createElement(
          "h4",
          { className: "dm-table-header" },
          "Detailed results",
          React.createElement("span", {
            className: "glyphicon glyphicon-info-sign",
            style: { verticalAlign: "middle", float: "right" },
            "aria-hidden": "true",
            "data-toggle": "popover",
            "data-trigger": "hover",
            title: "Detailed results",
            "data-html": "true",
            "data-content": "<ul><li><strong>Bolded rows</strong> correspond to positively-selected branches at P \u2264 0.05.</li><li>Click on a row to see a visualization of its inferred rate distribution.</li><li>Hover over a column header for a description of its content.</li></ul>",
            "data-placement": "bottom"
          })
        ),
        React.createElement(
          "table",
          { className: "table table-hover table-condensed dm-table" },
          React.createElement(
            "thead",
            { id: "table-branch-header" },
            React.createElement(
              "tr",
              null,
              React.createElement(
                "th",
                null,
                React.createElement(
                  "span",
                  {
                    "data-toggle": "tooltip",
                    title: "Branch of interest",
                    "data-placement": "top"
                  },
                  "Name"
                )
              ),
              React.createElement(
                "th",
                null,
                React.createElement(
                  "span",
                  { "data-toggle": "tooltip", title: "Optimized branch length" },
                  "B",
                  " "
                )
              ),
              React.createElement(
                "th",
                null,
                React.createElement(
                  "span",
                  {
                    "data-toggle": "tooltip",
                    title: "Likelihood ratio test statistic for selection"
                  },
                  "LRT"
                )
              ),
              React.createElement(
                "th",
                null,
                React.createElement(
                  "span",
                  {
                    "data-toggle": "tooltip",
                    title: "P-value corrected for multiple testing"
                  },
                  "Test p-value"
                )
              ),
              React.createElement(
                "th",
                null,
                React.createElement(
                  "span",
                  {
                    "data-toggle": "tooltip",
                    title: "Raw P-value without correction for multiple testing"
                  },
                  "Uncorrected p-value"
                )
              ),
              React.createElement(
                "th",
                null,
                React.createElement(
                  "span",
                  {
                    "data-toggle": "tooltip",
                    title: "Inferred \u03C9 estimates and respective proportion of sites"
                  },
                  "\u03C9 distribution over sites"
                )
              )
            )
          ),
          React.createElement("tbody", { id: "table-branch-table" })
        )
      ),
      React.createElement(
        "div",
        {
          className: "modal fade",
          id: "myModal",
          tabIndex: "-1",
          role: "dialog",
          "aria-labelledby": "myModalLabel"
        },
        React.createElement(
          "div",
          { className: "modal-dialog", role: "document" },
          React.createElement(
            "div",
            { className: "modal-content" },
            React.createElement(
              "div",
              { className: "modal-header" },
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "close",
                  "data-dismiss": "modal",
                  "aria-label": "Close"
                },
                React.createElement(
                  "span",
                  { "aria-hidden": "true" },
                  "\xD7"
                )
              ),
              React.createElement(
                "h4",
                { className: "modal-title", id: "myModalLabel" },
                "aBSREL Site Proportion Chart"
              )
            ),
            React.createElement(
              "div",
              { className: "modal-body", id: "modal-body" },
              React.createElement(
                "h4",
                { className: "dm-table-header" },
                "\u03C9 distribution"
              ),
              React.createElement(_prop_chart.PropChart, {
                name: self.state.current_model_name,
                omegas: self.state.current_omegas,
                settings: self.state.distro_settings
              })
            ),
            React.createElement(
              "div",
              { className: "modal-footer" },
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "btn btn-default",
                  "data-dismiss": "modal"
                },
                "Close"
              )
            )
          )
        )
      ),
      React.createElement(
        "div",
        { className: "col-md-12" },
        React.createElement("p", { className: "description" })
      )
    );
  }
});

// Will need to make a call to this
// omega distributions
function render_branch_table(tree, test_results, annotations, element) {
  React.render(React.createElement(BranchTable, {
    tree: tree,
    test_results: test_results,
    annotations: annotations
  }), $(element)[0]);
}

// Will need to make a call to this
// omega distributions
function rerender_branch_table(tree, test_results, annotations, element) {
  $(element).empty();
  render_branch_table(tree, test_results, annotations, element);
}

module.exports.BranchTable = BranchTable;
module.exports.render_branch_table = render_branch_table;
module.exports.rerender_branch_table = rerender_branch_table;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(9), __webpack_require__(6), __webpack_require__(3)))

/***/ }),
/* 201 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/* globals __REACT_DEVTOOLS_GLOBAL_HOOK__*/



var ReactDOMComponentTree = __webpack_require__(8);
var ReactDefaultInjection = __webpack_require__(202);
var ReactMount = __webpack_require__(121);
var ReactReconciler = __webpack_require__(33);
var ReactUpdates = __webpack_require__(15);
var ReactVersion = __webpack_require__(280);

var findDOMNode = __webpack_require__(281);
var getHostComponentFromComposite = __webpack_require__(122);
var renderSubtreeIntoContainer = __webpack_require__(282);
var warning = __webpack_require__(2);

ReactDefaultInjection.inject();

var ReactDOM = {
  findDOMNode: findDOMNode,
  render: ReactMount.render,
  unmountComponentAtNode: ReactMount.unmountComponentAtNode,
  version: ReactVersion,

  /* eslint-disable camelcase */
  unstable_batchedUpdates: ReactUpdates.batchedUpdates,
  unstable_renderSubtreeIntoContainer: renderSubtreeIntoContainer
  /* eslint-enable camelcase */
};

// Inject the runtime into a devtools global hook regardless of browser.
// Allows for debugging when the hook is injected on the page.
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.inject === 'function') {
  __REACT_DEVTOOLS_GLOBAL_HOOK__.inject({
    ComponentTree: {
      getClosestInstanceFromNode: ReactDOMComponentTree.getClosestInstanceFromNode,
      getNodeFromInstance: function (inst) {
        // inst is an internal instance (but could be a composite)
        if (inst._renderedComponent) {
          inst = getHostComponentFromComposite(inst);
        }
        if (inst) {
          return ReactDOMComponentTree.getNodeFromInstance(inst);
        } else {
          return null;
        }
      }
    },
    Mount: ReactMount,
    Reconciler: ReactReconciler
  });
}

if (process.env.NODE_ENV !== 'production') {
  var ExecutionEnvironment = __webpack_require__(10);
  if (ExecutionEnvironment.canUseDOM && window.top === window.self) {
    // First check if devtools is not installed
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === 'undefined') {
      // If we're in Chrome or Firefox, provide a download link if not installed.
      if (navigator.userAgent.indexOf('Chrome') > -1 && navigator.userAgent.indexOf('Edge') === -1 || navigator.userAgent.indexOf('Firefox') > -1) {
        // Firefox does not have the issue with devtools loaded over file://
        var showFileUrlMessage = window.location.protocol.indexOf('http') === -1 && navigator.userAgent.indexOf('Firefox') === -1;
        console.debug('Download the React DevTools ' + (showFileUrlMessage ? 'and use an HTTP server (instead of a file: URL) ' : '') + 'for a better development experience: ' + 'https://fb.me/react-devtools');
      }
    }

    var testFunc = function testFn() {};
    process.env.NODE_ENV !== 'production' ? warning((testFunc.name || testFunc.toString()).indexOf('testFn') !== -1, "It looks like you're using a minified copy of the development build " + 'of React. When deploying React apps to production, make sure to use ' + 'the production build which skips development warnings and is faster. ' + 'See https://fb.me/react-minification for more details.') : void 0;

    // If we're in IE8, check to see if we are in compatibility mode and provide
    // information on preventing compatibility mode
    var ieCompatibilityMode = document.documentMode && document.documentMode < 8;

    process.env.NODE_ENV !== 'production' ? warning(!ieCompatibilityMode, 'Internet Explorer is running in compatibility mode; please add the ' + 'following tag to your HTML to prevent this from happening: ' + '<meta http-equiv="X-UA-Compatible" content="IE=edge" />') : void 0;

    var expectedFeatures = [
    // shims
    Array.isArray, Array.prototype.every, Array.prototype.forEach, Array.prototype.indexOf, Array.prototype.map, Date.now, Function.prototype.bind, Object.keys, String.prototype.trim];

    for (var i = 0; i < expectedFeatures.length; i++) {
      if (!expectedFeatures[i]) {
        process.env.NODE_ENV !== 'production' ? warning(false, 'One or more ES5 shims expected by React are not available: ' + 'https://fb.me/react-warning-polyfills') : void 0;
        break;
      }
    }
  }
}

if (process.env.NODE_ENV !== 'production') {
  var ReactInstrumentation = __webpack_require__(12);
  var ReactDOMUnknownPropertyHook = __webpack_require__(283);
  var ReactDOMNullInputValuePropHook = __webpack_require__(284);
  var ReactDOMInvalidARIAHook = __webpack_require__(285);

  ReactInstrumentation.debugTool.addHook(ReactDOMUnknownPropertyHook);
  ReactInstrumentation.debugTool.addHook(ReactDOMNullInputValuePropHook);
  ReactInstrumentation.debugTool.addHook(ReactDOMInvalidARIAHook);
}

module.exports = ReactDOM;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 202 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var ARIADOMPropertyConfig = __webpack_require__(203);
var BeforeInputEventPlugin = __webpack_require__(204);
var ChangeEventPlugin = __webpack_require__(208);
var DefaultEventPluginOrder = __webpack_require__(216);
var EnterLeaveEventPlugin = __webpack_require__(217);
var HTMLDOMPropertyConfig = __webpack_require__(218);
var ReactComponentBrowserEnvironment = __webpack_require__(219);
var ReactDOMComponent = __webpack_require__(225);
var ReactDOMComponentTree = __webpack_require__(8);
var ReactDOMEmptyComponent = __webpack_require__(251);
var ReactDOMTreeTraversal = __webpack_require__(252);
var ReactDOMTextComponent = __webpack_require__(253);
var ReactDefaultBatchingStrategy = __webpack_require__(254);
var ReactEventListener = __webpack_require__(255);
var ReactInjection = __webpack_require__(257);
var ReactReconcileTransaction = __webpack_require__(258);
var SVGDOMPropertyConfig = __webpack_require__(264);
var SelectEventPlugin = __webpack_require__(265);
var SimpleEventPlugin = __webpack_require__(266);

var alreadyInjected = false;

function inject() {
  if (alreadyInjected) {
    // TODO: This is currently true because these injections are shared between
    // the client and the server package. They should be built independently
    // and not share any injection state. Then this problem will be solved.
    return;
  }
  alreadyInjected = true;

  ReactInjection.EventEmitter.injectReactEventListener(ReactEventListener);

  /**
   * Inject modules for resolving DOM hierarchy and plugin ordering.
   */
  ReactInjection.EventPluginHub.injectEventPluginOrder(DefaultEventPluginOrder);
  ReactInjection.EventPluginUtils.injectComponentTree(ReactDOMComponentTree);
  ReactInjection.EventPluginUtils.injectTreeTraversal(ReactDOMTreeTraversal);

  /**
   * Some important event plugins included by default (without having to require
   * them).
   */
  ReactInjection.EventPluginHub.injectEventPluginsByName({
    SimpleEventPlugin: SimpleEventPlugin,
    EnterLeaveEventPlugin: EnterLeaveEventPlugin,
    ChangeEventPlugin: ChangeEventPlugin,
    SelectEventPlugin: SelectEventPlugin,
    BeforeInputEventPlugin: BeforeInputEventPlugin
  });

  ReactInjection.HostComponent.injectGenericComponentClass(ReactDOMComponent);

  ReactInjection.HostComponent.injectTextComponentClass(ReactDOMTextComponent);

  ReactInjection.DOMProperty.injectDOMPropertyConfig(ARIADOMPropertyConfig);
  ReactInjection.DOMProperty.injectDOMPropertyConfig(HTMLDOMPropertyConfig);
  ReactInjection.DOMProperty.injectDOMPropertyConfig(SVGDOMPropertyConfig);

  ReactInjection.EmptyComponent.injectEmptyComponentFactory(function (instantiate) {
    return new ReactDOMEmptyComponent(instantiate);
  });

  ReactInjection.Updates.injectReconcileTransaction(ReactReconcileTransaction);
  ReactInjection.Updates.injectBatchingStrategy(ReactDefaultBatchingStrategy);

  ReactInjection.Component.injectEnvironment(ReactComponentBrowserEnvironment);
}

module.exports = {
  inject: inject
};

/***/ }),
/* 203 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var ARIADOMPropertyConfig = {
  Properties: {
    // Global States and Properties
    'aria-current': 0, // state
    'aria-details': 0,
    'aria-disabled': 0, // state
    'aria-hidden': 0, // state
    'aria-invalid': 0, // state
    'aria-keyshortcuts': 0,
    'aria-label': 0,
    'aria-roledescription': 0,
    // Widget Attributes
    'aria-autocomplete': 0,
    'aria-checked': 0,
    'aria-expanded': 0,
    'aria-haspopup': 0,
    'aria-level': 0,
    'aria-modal': 0,
    'aria-multiline': 0,
    'aria-multiselectable': 0,
    'aria-orientation': 0,
    'aria-placeholder': 0,
    'aria-pressed': 0,
    'aria-readonly': 0,
    'aria-required': 0,
    'aria-selected': 0,
    'aria-sort': 0,
    'aria-valuemax': 0,
    'aria-valuemin': 0,
    'aria-valuenow': 0,
    'aria-valuetext': 0,
    // Live Region Attributes
    'aria-atomic': 0,
    'aria-busy': 0,
    'aria-live': 0,
    'aria-relevant': 0,
    // Drag-and-Drop Attributes
    'aria-dropeffect': 0,
    'aria-grabbed': 0,
    // Relationship Attributes
    'aria-activedescendant': 0,
    'aria-colcount': 0,
    'aria-colindex': 0,
    'aria-colspan': 0,
    'aria-controls': 0,
    'aria-describedby': 0,
    'aria-errormessage': 0,
    'aria-flowto': 0,
    'aria-labelledby': 0,
    'aria-owns': 0,
    'aria-posinset': 0,
    'aria-rowcount': 0,
    'aria-rowindex': 0,
    'aria-rowspan': 0,
    'aria-setsize': 0
  },
  DOMAttributeNames: {},
  DOMPropertyNames: {}
};

module.exports = ARIADOMPropertyConfig;

/***/ }),
/* 204 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var EventPropagators = __webpack_require__(40);
var ExecutionEnvironment = __webpack_require__(10);
var FallbackCompositionState = __webpack_require__(205);
var SyntheticCompositionEvent = __webpack_require__(206);
var SyntheticInputEvent = __webpack_require__(207);

var END_KEYCODES = [9, 13, 27, 32]; // Tab, Return, Esc, Space
var START_KEYCODE = 229;

var canUseCompositionEvent = ExecutionEnvironment.canUseDOM && 'CompositionEvent' in window;

var documentMode = null;
if (ExecutionEnvironment.canUseDOM && 'documentMode' in document) {
  documentMode = document.documentMode;
}

// Webkit offers a very useful `textInput` event that can be used to
// directly represent `beforeInput`. The IE `textinput` event is not as
// useful, so we don't use it.
var canUseTextInputEvent = ExecutionEnvironment.canUseDOM && 'TextEvent' in window && !documentMode && !isPresto();

// In IE9+, we have access to composition events, but the data supplied
// by the native compositionend event may be incorrect. Japanese ideographic
// spaces, for instance (\u3000) are not recorded correctly.
var useFallbackCompositionData = ExecutionEnvironment.canUseDOM && (!canUseCompositionEvent || documentMode && documentMode > 8 && documentMode <= 11);

/**
 * Opera <= 12 includes TextEvent in window, but does not fire
 * text input events. Rely on keypress instead.
 */
function isPresto() {
  var opera = window.opera;
  return typeof opera === 'object' && typeof opera.version === 'function' && parseInt(opera.version(), 10) <= 12;
}

var SPACEBAR_CODE = 32;
var SPACEBAR_CHAR = String.fromCharCode(SPACEBAR_CODE);

// Events and their corresponding property names.
var eventTypes = {
  beforeInput: {
    phasedRegistrationNames: {
      bubbled: 'onBeforeInput',
      captured: 'onBeforeInputCapture'
    },
    dependencies: ['topCompositionEnd', 'topKeyPress', 'topTextInput', 'topPaste']
  },
  compositionEnd: {
    phasedRegistrationNames: {
      bubbled: 'onCompositionEnd',
      captured: 'onCompositionEndCapture'
    },
    dependencies: ['topBlur', 'topCompositionEnd', 'topKeyDown', 'topKeyPress', 'topKeyUp', 'topMouseDown']
  },
  compositionStart: {
    phasedRegistrationNames: {
      bubbled: 'onCompositionStart',
      captured: 'onCompositionStartCapture'
    },
    dependencies: ['topBlur', 'topCompositionStart', 'topKeyDown', 'topKeyPress', 'topKeyUp', 'topMouseDown']
  },
  compositionUpdate: {
    phasedRegistrationNames: {
      bubbled: 'onCompositionUpdate',
      captured: 'onCompositionUpdateCapture'
    },
    dependencies: ['topBlur', 'topCompositionUpdate', 'topKeyDown', 'topKeyPress', 'topKeyUp', 'topMouseDown']
  }
};

// Track whether we've ever handled a keypress on the space key.
var hasSpaceKeypress = false;

/**
 * Return whether a native keypress event is assumed to be a command.
 * This is required because Firefox fires `keypress` events for key commands
 * (cut, copy, select-all, etc.) even though no character is inserted.
 */
function isKeypressCommand(nativeEvent) {
  return (nativeEvent.ctrlKey || nativeEvent.altKey || nativeEvent.metaKey) &&
  // ctrlKey && altKey is equivalent to AltGr, and is not a command.
  !(nativeEvent.ctrlKey && nativeEvent.altKey);
}

/**
 * Translate native top level events into event types.
 *
 * @param {string} topLevelType
 * @return {object}
 */
function getCompositionEventType(topLevelType) {
  switch (topLevelType) {
    case 'topCompositionStart':
      return eventTypes.compositionStart;
    case 'topCompositionEnd':
      return eventTypes.compositionEnd;
    case 'topCompositionUpdate':
      return eventTypes.compositionUpdate;
  }
}

/**
 * Does our fallback best-guess model think this event signifies that
 * composition has begun?
 *
 * @param {string} topLevelType
 * @param {object} nativeEvent
 * @return {boolean}
 */
function isFallbackCompositionStart(topLevelType, nativeEvent) {
  return topLevelType === 'topKeyDown' && nativeEvent.keyCode === START_KEYCODE;
}

/**
 * Does our fallback mode think that this event is the end of composition?
 *
 * @param {string} topLevelType
 * @param {object} nativeEvent
 * @return {boolean}
 */
function isFallbackCompositionEnd(topLevelType, nativeEvent) {
  switch (topLevelType) {
    case 'topKeyUp':
      // Command keys insert or clear IME input.
      return END_KEYCODES.indexOf(nativeEvent.keyCode) !== -1;
    case 'topKeyDown':
      // Expect IME keyCode on each keydown. If we get any other
      // code we must have exited earlier.
      return nativeEvent.keyCode !== START_KEYCODE;
    case 'topKeyPress':
    case 'topMouseDown':
    case 'topBlur':
      // Events are not possible without cancelling IME.
      return true;
    default:
      return false;
  }
}

/**
 * Google Input Tools provides composition data via a CustomEvent,
 * with the `data` property populated in the `detail` object. If this
 * is available on the event object, use it. If not, this is a plain
 * composition event and we have nothing special to extract.
 *
 * @param {object} nativeEvent
 * @return {?string}
 */
function getDataFromCustomEvent(nativeEvent) {
  var detail = nativeEvent.detail;
  if (typeof detail === 'object' && 'data' in detail) {
    return detail.data;
  }
  return null;
}

// Track the current IME composition fallback object, if any.
var currentComposition = null;

/**
 * @return {?object} A SyntheticCompositionEvent.
 */
function extractCompositionEvent(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
  var eventType;
  var fallbackData;

  if (canUseCompositionEvent) {
    eventType = getCompositionEventType(topLevelType);
  } else if (!currentComposition) {
    if (isFallbackCompositionStart(topLevelType, nativeEvent)) {
      eventType = eventTypes.compositionStart;
    }
  } else if (isFallbackCompositionEnd(topLevelType, nativeEvent)) {
    eventType = eventTypes.compositionEnd;
  }

  if (!eventType) {
    return null;
  }

  if (useFallbackCompositionData) {
    // The current composition is stored statically and must not be
    // overwritten while composition continues.
    if (!currentComposition && eventType === eventTypes.compositionStart) {
      currentComposition = FallbackCompositionState.getPooled(nativeEventTarget);
    } else if (eventType === eventTypes.compositionEnd) {
      if (currentComposition) {
        fallbackData = currentComposition.getData();
      }
    }
  }

  var event = SyntheticCompositionEvent.getPooled(eventType, targetInst, nativeEvent, nativeEventTarget);

  if (fallbackData) {
    // Inject data generated from fallback path into the synthetic event.
    // This matches the property of native CompositionEventInterface.
    event.data = fallbackData;
  } else {
    var customData = getDataFromCustomEvent(nativeEvent);
    if (customData !== null) {
      event.data = customData;
    }
  }

  EventPropagators.accumulateTwoPhaseDispatches(event);
  return event;
}

/**
 * @param {string} topLevelType Record from `EventConstants`.
 * @param {object} nativeEvent Native browser event.
 * @return {?string} The string corresponding to this `beforeInput` event.
 */
function getNativeBeforeInputChars(topLevelType, nativeEvent) {
  switch (topLevelType) {
    case 'topCompositionEnd':
      return getDataFromCustomEvent(nativeEvent);
    case 'topKeyPress':
      /**
       * If native `textInput` events are available, our goal is to make
       * use of them. However, there is a special case: the spacebar key.
       * In Webkit, preventing default on a spacebar `textInput` event
       * cancels character insertion, but it *also* causes the browser
       * to fall back to its default spacebar behavior of scrolling the
       * page.
       *
       * Tracking at:
       * https://code.google.com/p/chromium/issues/detail?id=355103
       *
       * To avoid this issue, use the keypress event as if no `textInput`
       * event is available.
       */
      var which = nativeEvent.which;
      if (which !== SPACEBAR_CODE) {
        return null;
      }

      hasSpaceKeypress = true;
      return SPACEBAR_CHAR;

    case 'topTextInput':
      // Record the characters to be added to the DOM.
      var chars = nativeEvent.data;

      // If it's a spacebar character, assume that we have already handled
      // it at the keypress level and bail immediately. Android Chrome
      // doesn't give us keycodes, so we need to blacklist it.
      if (chars === SPACEBAR_CHAR && hasSpaceKeypress) {
        return null;
      }

      return chars;

    default:
      // For other native event types, do nothing.
      return null;
  }
}

/**
 * For browsers that do not provide the `textInput` event, extract the
 * appropriate string to use for SyntheticInputEvent.
 *
 * @param {string} topLevelType Record from `EventConstants`.
 * @param {object} nativeEvent Native browser event.
 * @return {?string} The fallback string for this `beforeInput` event.
 */
function getFallbackBeforeInputChars(topLevelType, nativeEvent) {
  // If we are currently composing (IME) and using a fallback to do so,
  // try to extract the composed characters from the fallback object.
  // If composition event is available, we extract a string only at
  // compositionevent, otherwise extract it at fallback events.
  if (currentComposition) {
    if (topLevelType === 'topCompositionEnd' || !canUseCompositionEvent && isFallbackCompositionEnd(topLevelType, nativeEvent)) {
      var chars = currentComposition.getData();
      FallbackCompositionState.release(currentComposition);
      currentComposition = null;
      return chars;
    }
    return null;
  }

  switch (topLevelType) {
    case 'topPaste':
      // If a paste event occurs after a keypress, throw out the input
      // chars. Paste events should not lead to BeforeInput events.
      return null;
    case 'topKeyPress':
      /**
       * As of v27, Firefox may fire keypress events even when no character
       * will be inserted. A few possibilities:
       *
       * - `which` is `0`. Arrow keys, Esc key, etc.
       *
       * - `which` is the pressed key code, but no char is available.
       *   Ex: 'AltGr + d` in Polish. There is no modified character for
       *   this key combination and no character is inserted into the
       *   document, but FF fires the keypress for char code `100` anyway.
       *   No `input` event will occur.
       *
       * - `which` is the pressed key code, but a command combination is
       *   being used. Ex: `Cmd+C`. No character is inserted, and no
       *   `input` event will occur.
       */
      if (nativeEvent.which && !isKeypressCommand(nativeEvent)) {
        return String.fromCharCode(nativeEvent.which);
      }
      return null;
    case 'topCompositionEnd':
      return useFallbackCompositionData ? null : nativeEvent.data;
    default:
      return null;
  }
}

/**
 * Extract a SyntheticInputEvent for `beforeInput`, based on either native
 * `textInput` or fallback behavior.
 *
 * @return {?object} A SyntheticInputEvent.
 */
function extractBeforeInputEvent(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
  var chars;

  if (canUseTextInputEvent) {
    chars = getNativeBeforeInputChars(topLevelType, nativeEvent);
  } else {
    chars = getFallbackBeforeInputChars(topLevelType, nativeEvent);
  }

  // If no characters are being inserted, no BeforeInput event should
  // be fired.
  if (!chars) {
    return null;
  }

  var event = SyntheticInputEvent.getPooled(eventTypes.beforeInput, targetInst, nativeEvent, nativeEventTarget);

  event.data = chars;
  EventPropagators.accumulateTwoPhaseDispatches(event);
  return event;
}

/**
 * Create an `onBeforeInput` event to match
 * http://www.w3.org/TR/2013/WD-DOM-Level-3-Events-20131105/#events-inputevents.
 *
 * This event plugin is based on the native `textInput` event
 * available in Chrome, Safari, Opera, and IE. This event fires after
 * `onKeyPress` and `onCompositionEnd`, but before `onInput`.
 *
 * `beforeInput` is spec'd but not implemented in any browsers, and
 * the `input` event does not provide any useful information about what has
 * actually been added, contrary to the spec. Thus, `textInput` is the best
 * available event to identify the characters that have actually been inserted
 * into the target node.
 *
 * This plugin is also responsible for emitting `composition` events, thus
 * allowing us to share composition fallback code for both `beforeInput` and
 * `composition` event types.
 */
var BeforeInputEventPlugin = {
  eventTypes: eventTypes,

  extractEvents: function (topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    return [extractCompositionEvent(topLevelType, targetInst, nativeEvent, nativeEventTarget), extractBeforeInputEvent(topLevelType, targetInst, nativeEvent, nativeEventTarget)];
  }
};

module.exports = BeforeInputEventPlugin;

/***/ }),
/* 205 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _assign = __webpack_require__(7);

var PooledClass = __webpack_require__(26);

var getTextContentAccessor = __webpack_require__(101);

/**
 * This helper class stores information about text content of a target node,
 * allowing comparison of content before and after a given event.
 *
 * Identify the node where selection currently begins, then observe
 * both its text content and its current position in the DOM. Since the
 * browser may natively replace the target node during composition, we can
 * use its position to find its replacement.
 *
 * @param {DOMEventTarget} root
 */
function FallbackCompositionState(root) {
  this._root = root;
  this._startText = this.getText();
  this._fallbackText = null;
}

_assign(FallbackCompositionState.prototype, {
  destructor: function () {
    this._root = null;
    this._startText = null;
    this._fallbackText = null;
  },

  /**
   * Get current text of input.
   *
   * @return {string}
   */
  getText: function () {
    if ('value' in this._root) {
      return this._root.value;
    }
    return this._root[getTextContentAccessor()];
  },

  /**
   * Determine the differing substring between the initially stored
   * text content and the current content.
   *
   * @return {string}
   */
  getData: function () {
    if (this._fallbackText) {
      return this._fallbackText;
    }

    var start;
    var startValue = this._startText;
    var startLength = startValue.length;
    var end;
    var endValue = this.getText();
    var endLength = endValue.length;

    for (start = 0; start < startLength; start++) {
      if (startValue[start] !== endValue[start]) {
        break;
      }
    }

    var minEnd = startLength - start;
    for (end = 1; end <= minEnd; end++) {
      if (startValue[startLength - end] !== endValue[endLength - end]) {
        break;
      }
    }

    var sliceTail = end > 1 ? 1 - end : undefined;
    this._fallbackText = endValue.slice(start, sliceTail);
    return this._fallbackText;
  }
});

PooledClass.addPoolingTo(FallbackCompositionState);

module.exports = FallbackCompositionState;

/***/ }),
/* 206 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var SyntheticEvent = __webpack_require__(18);

/**
 * @interface Event
 * @see http://www.w3.org/TR/DOM-Level-3-Events/#events-compositionevents
 */
var CompositionEventInterface = {
  data: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticCompositionEvent(dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget) {
  return SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget);
}

SyntheticEvent.augmentClass(SyntheticCompositionEvent, CompositionEventInterface);

module.exports = SyntheticCompositionEvent;

/***/ }),
/* 207 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var SyntheticEvent = __webpack_require__(18);

/**
 * @interface Event
 * @see http://www.w3.org/TR/2013/WD-DOM-Level-3-Events-20131105
 *      /#events-inputevents
 */
var InputEventInterface = {
  data: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticInputEvent(dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget) {
  return SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget);
}

SyntheticEvent.augmentClass(SyntheticInputEvent, InputEventInterface);

module.exports = SyntheticInputEvent;

/***/ }),
/* 208 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var EventPluginHub = __webpack_require__(41);
var EventPropagators = __webpack_require__(40);
var ExecutionEnvironment = __webpack_require__(10);
var ReactDOMComponentTree = __webpack_require__(8);
var ReactUpdates = __webpack_require__(15);
var SyntheticEvent = __webpack_require__(18);

var inputValueTracking = __webpack_require__(104);
var getEventTarget = __webpack_require__(67);
var isEventSupported = __webpack_require__(68);
var isTextInputElement = __webpack_require__(105);

var eventTypes = {
  change: {
    phasedRegistrationNames: {
      bubbled: 'onChange',
      captured: 'onChangeCapture'
    },
    dependencies: ['topBlur', 'topChange', 'topClick', 'topFocus', 'topInput', 'topKeyDown', 'topKeyUp', 'topSelectionChange']
  }
};

function createAndAccumulateChangeEvent(inst, nativeEvent, target) {
  var event = SyntheticEvent.getPooled(eventTypes.change, inst, nativeEvent, target);
  event.type = 'change';
  EventPropagators.accumulateTwoPhaseDispatches(event);
  return event;
}
/**
 * For IE shims
 */
var activeElement = null;
var activeElementInst = null;

/**
 * SECTION: handle `change` event
 */
function shouldUseChangeEvent(elem) {
  var nodeName = elem.nodeName && elem.nodeName.toLowerCase();
  return nodeName === 'select' || nodeName === 'input' && elem.type === 'file';
}

var doesChangeEventBubble = false;
if (ExecutionEnvironment.canUseDOM) {
  // See `handleChange` comment below
  doesChangeEventBubble = isEventSupported('change') && (!document.documentMode || document.documentMode > 8);
}

function manualDispatchChangeEvent(nativeEvent) {
  var event = createAndAccumulateChangeEvent(activeElementInst, nativeEvent, getEventTarget(nativeEvent));

  // If change and propertychange bubbled, we'd just bind to it like all the
  // other events and have it go through ReactBrowserEventEmitter. Since it
  // doesn't, we manually listen for the events and so we have to enqueue and
  // process the abstract event manually.
  //
  // Batching is necessary here in order to ensure that all event handlers run
  // before the next rerender (including event handlers attached to ancestor
  // elements instead of directly on the input). Without this, controlled
  // components don't work properly in conjunction with event bubbling because
  // the component is rerendered and the value reverted before all the event
  // handlers can run. See https://github.com/facebook/react/issues/708.
  ReactUpdates.batchedUpdates(runEventInBatch, event);
}

function runEventInBatch(event) {
  EventPluginHub.enqueueEvents(event);
  EventPluginHub.processEventQueue(false);
}

function startWatchingForChangeEventIE8(target, targetInst) {
  activeElement = target;
  activeElementInst = targetInst;
  activeElement.attachEvent('onchange', manualDispatchChangeEvent);
}

function stopWatchingForChangeEventIE8() {
  if (!activeElement) {
    return;
  }
  activeElement.detachEvent('onchange', manualDispatchChangeEvent);
  activeElement = null;
  activeElementInst = null;
}

function getInstIfValueChanged(targetInst, nativeEvent) {
  var updated = inputValueTracking.updateValueIfChanged(targetInst);
  var simulated = nativeEvent.simulated === true && ChangeEventPlugin._allowSimulatedPassThrough;

  if (updated || simulated) {
    return targetInst;
  }
}

function getTargetInstForChangeEvent(topLevelType, targetInst) {
  if (topLevelType === 'topChange') {
    return targetInst;
  }
}

function handleEventsForChangeEventIE8(topLevelType, target, targetInst) {
  if (topLevelType === 'topFocus') {
    // stopWatching() should be a noop here but we call it just in case we
    // missed a blur event somehow.
    stopWatchingForChangeEventIE8();
    startWatchingForChangeEventIE8(target, targetInst);
  } else if (topLevelType === 'topBlur') {
    stopWatchingForChangeEventIE8();
  }
}

/**
 * SECTION: handle `input` event
 */
var isInputEventSupported = false;
if (ExecutionEnvironment.canUseDOM) {
  // IE9 claims to support the input event but fails to trigger it when
  // deleting text, so we ignore its input events.

  isInputEventSupported = isEventSupported('input') && (!('documentMode' in document) || document.documentMode > 9);
}

/**
 * (For IE <=9) Starts tracking propertychange events on the passed-in element
 * and override the value property so that we can distinguish user events from
 * value changes in JS.
 */
function startWatchingForValueChange(target, targetInst) {
  activeElement = target;
  activeElementInst = targetInst;
  activeElement.attachEvent('onpropertychange', handlePropertyChange);
}

/**
 * (For IE <=9) Removes the event listeners from the currently-tracked element,
 * if any exists.
 */
function stopWatchingForValueChange() {
  if (!activeElement) {
    return;
  }
  activeElement.detachEvent('onpropertychange', handlePropertyChange);

  activeElement = null;
  activeElementInst = null;
}

/**
 * (For IE <=9) Handles a propertychange event, sending a `change` event if
 * the value of the active element has changed.
 */
function handlePropertyChange(nativeEvent) {
  if (nativeEvent.propertyName !== 'value') {
    return;
  }
  if (getInstIfValueChanged(activeElementInst, nativeEvent)) {
    manualDispatchChangeEvent(nativeEvent);
  }
}

function handleEventsForInputEventPolyfill(topLevelType, target, targetInst) {
  if (topLevelType === 'topFocus') {
    // In IE8, we can capture almost all .value changes by adding a
    // propertychange handler and looking for events with propertyName
    // equal to 'value'
    // In IE9, propertychange fires for most input events but is buggy and
    // doesn't fire when text is deleted, but conveniently, selectionchange
    // appears to fire in all of the remaining cases so we catch those and
    // forward the event if the value has changed
    // In either case, we don't want to call the event handler if the value
    // is changed from JS so we redefine a setter for `.value` that updates
    // our activeElementValue variable, allowing us to ignore those changes
    //
    // stopWatching() should be a noop here but we call it just in case we
    // missed a blur event somehow.
    stopWatchingForValueChange();
    startWatchingForValueChange(target, targetInst);
  } else if (topLevelType === 'topBlur') {
    stopWatchingForValueChange();
  }
}

// For IE8 and IE9.
function getTargetInstForInputEventPolyfill(topLevelType, targetInst, nativeEvent) {
  if (topLevelType === 'topSelectionChange' || topLevelType === 'topKeyUp' || topLevelType === 'topKeyDown') {
    // On the selectionchange event, the target is just document which isn't
    // helpful for us so just check activeElement instead.
    //
    // 99% of the time, keydown and keyup aren't necessary. IE8 fails to fire
    // propertychange on the first input event after setting `value` from a
    // script and fires only keydown, keypress, keyup. Catching keyup usually
    // gets it and catching keydown lets us fire an event for the first
    // keystroke if user does a key repeat (it'll be a little delayed: right
    // before the second keystroke). Other input methods (e.g., paste) seem to
    // fire selectionchange normally.
    return getInstIfValueChanged(activeElementInst, nativeEvent);
  }
}

/**
 * SECTION: handle `click` event
 */
function shouldUseClickEvent(elem) {
  // Use the `click` event to detect changes to checkbox and radio inputs.
  // This approach works across all browsers, whereas `change` does not fire
  // until `blur` in IE8.
  var nodeName = elem.nodeName;
  return nodeName && nodeName.toLowerCase() === 'input' && (elem.type === 'checkbox' || elem.type === 'radio');
}

function getTargetInstForClickEvent(topLevelType, targetInst, nativeEvent) {
  if (topLevelType === 'topClick') {
    return getInstIfValueChanged(targetInst, nativeEvent);
  }
}

function getTargetInstForInputOrChangeEvent(topLevelType, targetInst, nativeEvent) {
  if (topLevelType === 'topInput' || topLevelType === 'topChange') {
    return getInstIfValueChanged(targetInst, nativeEvent);
  }
}

function handleControlledInputBlur(inst, node) {
  // TODO: In IE, inst is occasionally null. Why?
  if (inst == null) {
    return;
  }

  // Fiber and ReactDOM keep wrapper state in separate places
  var state = inst._wrapperState || node._wrapperState;

  if (!state || !state.controlled || node.type !== 'number') {
    return;
  }

  // If controlled, assign the value attribute to the current value on blur
  var value = '' + node.value;
  if (node.getAttribute('value') !== value) {
    node.setAttribute('value', value);
  }
}

/**
 * This plugin creates an `onChange` event that normalizes change events
 * across form elements. This event fires at a time when it's possible to
 * change the element's value without seeing a flicker.
 *
 * Supported elements are:
 * - input (see `isTextInputElement`)
 * - textarea
 * - select
 */
var ChangeEventPlugin = {
  eventTypes: eventTypes,

  _allowSimulatedPassThrough: true,
  _isInputEventSupported: isInputEventSupported,

  extractEvents: function (topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    var targetNode = targetInst ? ReactDOMComponentTree.getNodeFromInstance(targetInst) : window;

    var getTargetInstFunc, handleEventFunc;
    if (shouldUseChangeEvent(targetNode)) {
      if (doesChangeEventBubble) {
        getTargetInstFunc = getTargetInstForChangeEvent;
      } else {
        handleEventFunc = handleEventsForChangeEventIE8;
      }
    } else if (isTextInputElement(targetNode)) {
      if (isInputEventSupported) {
        getTargetInstFunc = getTargetInstForInputOrChangeEvent;
      } else {
        getTargetInstFunc = getTargetInstForInputEventPolyfill;
        handleEventFunc = handleEventsForInputEventPolyfill;
      }
    } else if (shouldUseClickEvent(targetNode)) {
      getTargetInstFunc = getTargetInstForClickEvent;
    }

    if (getTargetInstFunc) {
      var inst = getTargetInstFunc(topLevelType, targetInst, nativeEvent);
      if (inst) {
        var event = createAndAccumulateChangeEvent(inst, nativeEvent, nativeEventTarget);
        return event;
      }
    }

    if (handleEventFunc) {
      handleEventFunc(topLevelType, targetNode, targetInst);
    }

    // When blurring, set the value attribute for number inputs
    if (topLevelType === 'topBlur') {
      handleControlledInputBlur(targetInst, targetNode);
    }
  }
};

module.exports = ChangeEventPlugin;

/***/ }),
/* 209 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var ReactOwner = __webpack_require__(210);

var ReactRef = {};

function attachRef(ref, component, owner) {
  if (typeof ref === 'function') {
    ref(component.getPublicInstance());
  } else {
    // Legacy ref
    ReactOwner.addComponentAsRefTo(component, ref, owner);
  }
}

function detachRef(ref, component, owner) {
  if (typeof ref === 'function') {
    ref(null);
  } else {
    // Legacy ref
    ReactOwner.removeComponentAsRefFrom(component, ref, owner);
  }
}

ReactRef.attachRefs = function (instance, element) {
  if (element === null || typeof element !== 'object') {
    return;
  }
  var ref = element.ref;
  if (ref != null) {
    attachRef(ref, instance, element._owner);
  }
};

ReactRef.shouldUpdateRefs = function (prevElement, nextElement) {
  // If either the owner or a `ref` has changed, make sure the newest owner
  // has stored a reference to `this`, and the previous owner (if different)
  // has forgotten the reference to `this`. We use the element instead
  // of the public this.props because the post processing cannot determine
  // a ref. The ref conceptually lives on the element.

  // TODO: Should this even be possible? The owner cannot change because
  // it's forbidden by shouldUpdateReactComponent. The ref can change
  // if you swap the keys of but not the refs. Reconsider where this check
  // is made. It probably belongs where the key checking and
  // instantiateReactComponent is done.

  var prevRef = null;
  var prevOwner = null;
  if (prevElement !== null && typeof prevElement === 'object') {
    prevRef = prevElement.ref;
    prevOwner = prevElement._owner;
  }

  var nextRef = null;
  var nextOwner = null;
  if (nextElement !== null && typeof nextElement === 'object') {
    nextRef = nextElement.ref;
    nextOwner = nextElement._owner;
  }

  return prevRef !== nextRef ||
  // If owner changes but we have an unchanged function ref, don't update refs
  typeof nextRef === 'string' && nextOwner !== prevOwner;
};

ReactRef.detachRefs = function (instance, element) {
  if (element === null || typeof element !== 'object') {
    return;
  }
  var ref = element.ref;
  if (ref != null) {
    detachRef(ref, instance, element._owner);
  }
};

module.exports = ReactRef;

/***/ }),
/* 210 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var _prodInvariant = __webpack_require__(4);

var invariant = __webpack_require__(1);

/**
 * @param {?object} object
 * @return {boolean} True if `object` is a valid owner.
 * @final
 */
function isValidOwner(object) {
  return !!(object && typeof object.attachRef === 'function' && typeof object.detachRef === 'function');
}

/**
 * ReactOwners are capable of storing references to owned components.
 *
 * All components are capable of //being// referenced by owner components, but
 * only ReactOwner components are capable of //referencing// owned components.
 * The named reference is known as a "ref".
 *
 * Refs are available when mounted and updated during reconciliation.
 *
 *   var MyComponent = React.createClass({
 *     render: function() {
 *       return (
 *         <div onClick={this.handleClick}>
 *           <CustomComponent ref="custom" />
 *         </div>
 *       );
 *     },
 *     handleClick: function() {
 *       this.refs.custom.handleClick();
 *     },
 *     componentDidMount: function() {
 *       this.refs.custom.initialize();
 *     }
 *   });
 *
 * Refs should rarely be used. When refs are used, they should only be done to
 * control data that is not handled by React's data flow.
 *
 * @class ReactOwner
 */
var ReactOwner = {
  /**
   * Adds a component by ref to an owner component.
   *
   * @param {ReactComponent} component Component to reference.
   * @param {string} ref Name by which to refer to the component.
   * @param {ReactOwner} owner Component on which to record the ref.
   * @final
   * @internal
   */
  addComponentAsRefTo: function (component, ref, owner) {
    !isValidOwner(owner) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'addComponentAsRefTo(...): Only a ReactOwner can have refs. You might be adding a ref to a component that was not created inside a component\'s `render` method, or you have multiple copies of React loaded (details: https://fb.me/react-refs-must-have-owner).') : _prodInvariant('119') : void 0;
    owner.attachRef(ref, component);
  },

  /**
   * Removes a component by ref from an owner component.
   *
   * @param {ReactComponent} component Component to dereference.
   * @param {string} ref Name of the ref to remove.
   * @param {ReactOwner} owner Component on which the ref is recorded.
   * @final
   * @internal
   */
  removeComponentAsRefFrom: function (component, ref, owner) {
    !isValidOwner(owner) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'removeComponentAsRefFrom(...): Only a ReactOwner can have refs. You might be removing a ref to a component that was not created inside a component\'s `render` method, or you have multiple copies of React loaded (details: https://fb.me/react-refs-must-have-owner).') : _prodInvariant('120') : void 0;
    var ownerPublicInstance = owner.getPublicInstance();
    // Check that `component`'s owner is still alive and that `component` is still the current ref
    // because we do not want to detach the ref if another component stole it.
    if (ownerPublicInstance && ownerPublicInstance.refs[ref] === component.getPublicInstance()) {
      owner.detachRef(ref);
    }
  }
};

module.exports = ReactOwner;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 211 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var ReactInvalidSetStateWarningHook = __webpack_require__(212);
var ReactHostOperationHistoryHook = __webpack_require__(213);
var ReactComponentTreeHook = __webpack_require__(11);
var ExecutionEnvironment = __webpack_require__(10);

var performanceNow = __webpack_require__(214);
var warning = __webpack_require__(2);

var hooks = [];
var didHookThrowForEvent = {};

function callHook(event, fn, context, arg1, arg2, arg3, arg4, arg5) {
  try {
    fn.call(context, arg1, arg2, arg3, arg4, arg5);
  } catch (e) {
    process.env.NODE_ENV !== 'production' ? warning(didHookThrowForEvent[event], 'Exception thrown by hook while handling %s: %s', event, e + '\n' + e.stack) : void 0;
    didHookThrowForEvent[event] = true;
  }
}

function emitEvent(event, arg1, arg2, arg3, arg4, arg5) {
  for (var i = 0; i < hooks.length; i++) {
    var hook = hooks[i];
    var fn = hook[event];
    if (fn) {
      callHook(event, fn, hook, arg1, arg2, arg3, arg4, arg5);
    }
  }
}

var isProfiling = false;
var flushHistory = [];
var lifeCycleTimerStack = [];
var currentFlushNesting = 0;
var currentFlushMeasurements = [];
var currentFlushStartTime = 0;
var currentTimerDebugID = null;
var currentTimerStartTime = 0;
var currentTimerNestedFlushDuration = 0;
var currentTimerType = null;

var lifeCycleTimerHasWarned = false;

function clearHistory() {
  ReactComponentTreeHook.purgeUnmountedComponents();
  ReactHostOperationHistoryHook.clearHistory();
}

function getTreeSnapshot(registeredIDs) {
  return registeredIDs.reduce(function (tree, id) {
    var ownerID = ReactComponentTreeHook.getOwnerID(id);
    var parentID = ReactComponentTreeHook.getParentID(id);
    tree[id] = {
      displayName: ReactComponentTreeHook.getDisplayName(id),
      text: ReactComponentTreeHook.getText(id),
      updateCount: ReactComponentTreeHook.getUpdateCount(id),
      childIDs: ReactComponentTreeHook.getChildIDs(id),
      // Text nodes don't have owners but this is close enough.
      ownerID: ownerID || parentID && ReactComponentTreeHook.getOwnerID(parentID) || 0,
      parentID: parentID
    };
    return tree;
  }, {});
}

function resetMeasurements() {
  var previousStartTime = currentFlushStartTime;
  var previousMeasurements = currentFlushMeasurements;
  var previousOperations = ReactHostOperationHistoryHook.getHistory();

  if (currentFlushNesting === 0) {
    currentFlushStartTime = 0;
    currentFlushMeasurements = [];
    clearHistory();
    return;
  }

  if (previousMeasurements.length || previousOperations.length) {
    var registeredIDs = ReactComponentTreeHook.getRegisteredIDs();
    flushHistory.push({
      duration: performanceNow() - previousStartTime,
      measurements: previousMeasurements || [],
      operations: previousOperations || [],
      treeSnapshot: getTreeSnapshot(registeredIDs)
    });
  }

  clearHistory();
  currentFlushStartTime = performanceNow();
  currentFlushMeasurements = [];
}

function checkDebugID(debugID) {
  var allowRoot = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  if (allowRoot && debugID === 0) {
    return;
  }
  if (!debugID) {
    process.env.NODE_ENV !== 'production' ? warning(false, 'ReactDebugTool: debugID may not be empty.') : void 0;
  }
}

function beginLifeCycleTimer(debugID, timerType) {
  if (currentFlushNesting === 0) {
    return;
  }
  if (currentTimerType && !lifeCycleTimerHasWarned) {
    process.env.NODE_ENV !== 'production' ? warning(false, 'There is an internal error in the React performance measurement code. ' + 'Did not expect %s timer to start while %s timer is still in ' + 'progress for %s instance.', timerType, currentTimerType || 'no', debugID === currentTimerDebugID ? 'the same' : 'another') : void 0;
    lifeCycleTimerHasWarned = true;
  }
  currentTimerStartTime = performanceNow();
  currentTimerNestedFlushDuration = 0;
  currentTimerDebugID = debugID;
  currentTimerType = timerType;
}

function endLifeCycleTimer(debugID, timerType) {
  if (currentFlushNesting === 0) {
    return;
  }
  if (currentTimerType !== timerType && !lifeCycleTimerHasWarned) {
    process.env.NODE_ENV !== 'production' ? warning(false, 'There is an internal error in the React performance measurement code. ' + 'We did not expect %s timer to stop while %s timer is still in ' + 'progress for %s instance. Please report this as a bug in React.', timerType, currentTimerType || 'no', debugID === currentTimerDebugID ? 'the same' : 'another') : void 0;
    lifeCycleTimerHasWarned = true;
  }
  if (isProfiling) {
    currentFlushMeasurements.push({
      timerType: timerType,
      instanceID: debugID,
      duration: performanceNow() - currentTimerStartTime - currentTimerNestedFlushDuration
    });
  }
  currentTimerStartTime = 0;
  currentTimerNestedFlushDuration = 0;
  currentTimerDebugID = null;
  currentTimerType = null;
}

function pauseCurrentLifeCycleTimer() {
  var currentTimer = {
    startTime: currentTimerStartTime,
    nestedFlushStartTime: performanceNow(),
    debugID: currentTimerDebugID,
    timerType: currentTimerType
  };
  lifeCycleTimerStack.push(currentTimer);
  currentTimerStartTime = 0;
  currentTimerNestedFlushDuration = 0;
  currentTimerDebugID = null;
  currentTimerType = null;
}

function resumeCurrentLifeCycleTimer() {
  var _lifeCycleTimerStack$ = lifeCycleTimerStack.pop(),
      startTime = _lifeCycleTimerStack$.startTime,
      nestedFlushStartTime = _lifeCycleTimerStack$.nestedFlushStartTime,
      debugID = _lifeCycleTimerStack$.debugID,
      timerType = _lifeCycleTimerStack$.timerType;

  var nestedFlushDuration = performanceNow() - nestedFlushStartTime;
  currentTimerStartTime = startTime;
  currentTimerNestedFlushDuration += nestedFlushDuration;
  currentTimerDebugID = debugID;
  currentTimerType = timerType;
}

var lastMarkTimeStamp = 0;
var canUsePerformanceMeasure = typeof performance !== 'undefined' && typeof performance.mark === 'function' && typeof performance.clearMarks === 'function' && typeof performance.measure === 'function' && typeof performance.clearMeasures === 'function';

function shouldMark(debugID) {
  if (!isProfiling || !canUsePerformanceMeasure) {
    return false;
  }
  var element = ReactComponentTreeHook.getElement(debugID);
  if (element == null || typeof element !== 'object') {
    return false;
  }
  var isHostElement = typeof element.type === 'string';
  if (isHostElement) {
    return false;
  }
  return true;
}

function markBegin(debugID, markType) {
  if (!shouldMark(debugID)) {
    return;
  }

  var markName = debugID + '::' + markType;
  lastMarkTimeStamp = performanceNow();
  performance.mark(markName);
}

function markEnd(debugID, markType) {
  if (!shouldMark(debugID)) {
    return;
  }

  var markName = debugID + '::' + markType;
  var displayName = ReactComponentTreeHook.getDisplayName(debugID) || 'Unknown';

  // Chrome has an issue of dropping markers recorded too fast:
  // https://bugs.chromium.org/p/chromium/issues/detail?id=640652
  // To work around this, we will not report very small measurements.
  // I determined the magic number by tweaking it back and forth.
  // 0.05ms was enough to prevent the issue, but I set it to 0.1ms to be safe.
  // When the bug is fixed, we can `measure()` unconditionally if we want to.
  var timeStamp = performanceNow();
  if (timeStamp - lastMarkTimeStamp > 0.1) {
    var measurementName = displayName + ' [' + markType + ']';
    performance.measure(measurementName, markName);
  }

  performance.clearMarks(markName);
  if (measurementName) {
    performance.clearMeasures(measurementName);
  }
}

var ReactDebugTool = {
  addHook: function (hook) {
    hooks.push(hook);
  },
  removeHook: function (hook) {
    for (var i = 0; i < hooks.length; i++) {
      if (hooks[i] === hook) {
        hooks.splice(i, 1);
        i--;
      }
    }
  },
  isProfiling: function () {
    return isProfiling;
  },
  beginProfiling: function () {
    if (isProfiling) {
      return;
    }

    isProfiling = true;
    flushHistory.length = 0;
    resetMeasurements();
    ReactDebugTool.addHook(ReactHostOperationHistoryHook);
  },
  endProfiling: function () {
    if (!isProfiling) {
      return;
    }

    isProfiling = false;
    resetMeasurements();
    ReactDebugTool.removeHook(ReactHostOperationHistoryHook);
  },
  getFlushHistory: function () {
    return flushHistory;
  },
  onBeginFlush: function () {
    currentFlushNesting++;
    resetMeasurements();
    pauseCurrentLifeCycleTimer();
    emitEvent('onBeginFlush');
  },
  onEndFlush: function () {
    resetMeasurements();
    currentFlushNesting--;
    resumeCurrentLifeCycleTimer();
    emitEvent('onEndFlush');
  },
  onBeginLifeCycleTimer: function (debugID, timerType) {
    checkDebugID(debugID);
    emitEvent('onBeginLifeCycleTimer', debugID, timerType);
    markBegin(debugID, timerType);
    beginLifeCycleTimer(debugID, timerType);
  },
  onEndLifeCycleTimer: function (debugID, timerType) {
    checkDebugID(debugID);
    endLifeCycleTimer(debugID, timerType);
    markEnd(debugID, timerType);
    emitEvent('onEndLifeCycleTimer', debugID, timerType);
  },
  onBeginProcessingChildContext: function () {
    emitEvent('onBeginProcessingChildContext');
  },
  onEndProcessingChildContext: function () {
    emitEvent('onEndProcessingChildContext');
  },
  onHostOperation: function (operation) {
    checkDebugID(operation.instanceID);
    emitEvent('onHostOperation', operation);
  },
  onSetState: function () {
    emitEvent('onSetState');
  },
  onSetChildren: function (debugID, childDebugIDs) {
    checkDebugID(debugID);
    childDebugIDs.forEach(checkDebugID);
    emitEvent('onSetChildren', debugID, childDebugIDs);
  },
  onBeforeMountComponent: function (debugID, element, parentDebugID) {
    checkDebugID(debugID);
    checkDebugID(parentDebugID, true);
    emitEvent('onBeforeMountComponent', debugID, element, parentDebugID);
    markBegin(debugID, 'mount');
  },
  onMountComponent: function (debugID) {
    checkDebugID(debugID);
    markEnd(debugID, 'mount');
    emitEvent('onMountComponent', debugID);
  },
  onBeforeUpdateComponent: function (debugID, element) {
    checkDebugID(debugID);
    emitEvent('onBeforeUpdateComponent', debugID, element);
    markBegin(debugID, 'update');
  },
  onUpdateComponent: function (debugID) {
    checkDebugID(debugID);
    markEnd(debugID, 'update');
    emitEvent('onUpdateComponent', debugID);
  },
  onBeforeUnmountComponent: function (debugID) {
    checkDebugID(debugID);
    emitEvent('onBeforeUnmountComponent', debugID);
    markBegin(debugID, 'unmount');
  },
  onUnmountComponent: function (debugID) {
    checkDebugID(debugID);
    markEnd(debugID, 'unmount');
    emitEvent('onUnmountComponent', debugID);
  },
  onTestEvent: function () {
    emitEvent('onTestEvent');
  }
};

// TODO remove these when RN/www gets updated
ReactDebugTool.addDevtool = ReactDebugTool.addHook;
ReactDebugTool.removeDevtool = ReactDebugTool.removeHook;

ReactDebugTool.addHook(ReactInvalidSetStateWarningHook);
ReactDebugTool.addHook(ReactComponentTreeHook);
var url = ExecutionEnvironment.canUseDOM && window.location.href || '';
if (/[?&]react_perf\b/.test(url)) {
  ReactDebugTool.beginProfiling();
}

module.exports = ReactDebugTool;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 212 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var warning = __webpack_require__(2);

if (process.env.NODE_ENV !== 'production') {
  var processingChildContext = false;

  var warnInvalidSetState = function () {
    process.env.NODE_ENV !== 'production' ? warning(!processingChildContext, 'setState(...): Cannot call setState() inside getChildContext()') : void 0;
  };
}

var ReactInvalidSetStateWarningHook = {
  onBeginProcessingChildContext: function () {
    processingChildContext = true;
  },
  onEndProcessingChildContext: function () {
    processingChildContext = false;
  },
  onSetState: function () {
    warnInvalidSetState();
  }
};

module.exports = ReactInvalidSetStateWarningHook;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 213 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var history = [];

var ReactHostOperationHistoryHook = {
  onHostOperation: function (operation) {
    history.push(operation);
  },
  clearHistory: function () {
    if (ReactHostOperationHistoryHook._preventClearing) {
      // Should only be used for tests.
      return;
    }

    history = [];
  },
  getHistory: function () {
    return history;
  }
};

module.exports = ReactHostOperationHistoryHook;

/***/ }),
/* 214 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @typechecks
 */

var performance = __webpack_require__(215);

var performanceNow;

/**
 * Detect if we can use `window.performance.now()` and gracefully fallback to
 * `Date.now()` if it doesn't exist. We need to support Firefox < 15 for now
 * because of Facebook's testing infrastructure.
 */
if (performance.now) {
  performanceNow = function performanceNow() {
    return performance.now();
  };
} else {
  performanceNow = function performanceNow() {
    return Date.now();
  };
}

module.exports = performanceNow;

/***/ }),
/* 215 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @typechecks
 */



var ExecutionEnvironment = __webpack_require__(10);

var performance;

if (ExecutionEnvironment.canUseDOM) {
  performance = window.performance || window.msPerformance || window.webkitPerformance;
}

module.exports = performance || {};

/***/ }),
/* 216 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



/**
 * Module that is injectable into `EventPluginHub`, that specifies a
 * deterministic ordering of `EventPlugin`s. A convenient way to reason about
 * plugins, without having to package every one of them. This is better than
 * having plugins be ordered in the same order that they are injected because
 * that ordering would be influenced by the packaging order.
 * `ResponderEventPlugin` must occur before `SimpleEventPlugin` so that
 * preventing default on events is convenient in `SimpleEventPlugin` handlers.
 */

var DefaultEventPluginOrder = ['ResponderEventPlugin', 'SimpleEventPlugin', 'TapEventPlugin', 'EnterLeaveEventPlugin', 'ChangeEventPlugin', 'SelectEventPlugin', 'BeforeInputEventPlugin'];

module.exports = DefaultEventPluginOrder;

/***/ }),
/* 217 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var EventPropagators = __webpack_require__(40);
var ReactDOMComponentTree = __webpack_require__(8);
var SyntheticMouseEvent = __webpack_require__(53);

var eventTypes = {
  mouseEnter: {
    registrationName: 'onMouseEnter',
    dependencies: ['topMouseOut', 'topMouseOver']
  },
  mouseLeave: {
    registrationName: 'onMouseLeave',
    dependencies: ['topMouseOut', 'topMouseOver']
  }
};

var EnterLeaveEventPlugin = {
  eventTypes: eventTypes,

  /**
   * For almost every interaction we care about, there will be both a top-level
   * `mouseover` and `mouseout` event that occurs. Only use `mouseout` so that
   * we do not extract duplicate events. However, moving the mouse into the
   * browser from outside will not fire a `mouseout` event. In this case, we use
   * the `mouseover` top-level event.
   */
  extractEvents: function (topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    if (topLevelType === 'topMouseOver' && (nativeEvent.relatedTarget || nativeEvent.fromElement)) {
      return null;
    }
    if (topLevelType !== 'topMouseOut' && topLevelType !== 'topMouseOver') {
      // Must not be a mouse in or mouse out - ignoring.
      return null;
    }

    var win;
    if (nativeEventTarget.window === nativeEventTarget) {
      // `nativeEventTarget` is probably a window object.
      win = nativeEventTarget;
    } else {
      // TODO: Figure out why `ownerDocument` is sometimes undefined in IE8.
      var doc = nativeEventTarget.ownerDocument;
      if (doc) {
        win = doc.defaultView || doc.parentWindow;
      } else {
        win = window;
      }
    }

    var from;
    var to;
    if (topLevelType === 'topMouseOut') {
      from = targetInst;
      var related = nativeEvent.relatedTarget || nativeEvent.toElement;
      to = related ? ReactDOMComponentTree.getClosestInstanceFromNode(related) : null;
    } else {
      // Moving to a node from outside the window.
      from = null;
      to = targetInst;
    }

    if (from === to) {
      // Nothing pertains to our managed components.
      return null;
    }

    var fromNode = from == null ? win : ReactDOMComponentTree.getNodeFromInstance(from);
    var toNode = to == null ? win : ReactDOMComponentTree.getNodeFromInstance(to);

    var leave = SyntheticMouseEvent.getPooled(eventTypes.mouseLeave, from, nativeEvent, nativeEventTarget);
    leave.type = 'mouseleave';
    leave.target = fromNode;
    leave.relatedTarget = toNode;

    var enter = SyntheticMouseEvent.getPooled(eventTypes.mouseEnter, to, nativeEvent, nativeEventTarget);
    enter.type = 'mouseenter';
    enter.target = toNode;
    enter.relatedTarget = fromNode;

    EventPropagators.accumulateEnterLeaveDispatches(leave, enter, from, to);

    return [leave, enter];
  }
};

module.exports = EnterLeaveEventPlugin;

/***/ }),
/* 218 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var DOMProperty = __webpack_require__(23);

var MUST_USE_PROPERTY = DOMProperty.injection.MUST_USE_PROPERTY;
var HAS_BOOLEAN_VALUE = DOMProperty.injection.HAS_BOOLEAN_VALUE;
var HAS_NUMERIC_VALUE = DOMProperty.injection.HAS_NUMERIC_VALUE;
var HAS_POSITIVE_NUMERIC_VALUE = DOMProperty.injection.HAS_POSITIVE_NUMERIC_VALUE;
var HAS_OVERLOADED_BOOLEAN_VALUE = DOMProperty.injection.HAS_OVERLOADED_BOOLEAN_VALUE;

var HTMLDOMPropertyConfig = {
  isCustomAttribute: RegExp.prototype.test.bind(new RegExp('^(data|aria)-[' + DOMProperty.ATTRIBUTE_NAME_CHAR + ']*$')),
  Properties: {
    /**
     * Standard Properties
     */
    accept: 0,
    acceptCharset: 0,
    accessKey: 0,
    action: 0,
    allowFullScreen: HAS_BOOLEAN_VALUE,
    allowTransparency: 0,
    alt: 0,
    // specifies target context for links with `preload` type
    as: 0,
    async: HAS_BOOLEAN_VALUE,
    autoComplete: 0,
    // autoFocus is polyfilled/normalized by AutoFocusUtils
    // autoFocus: HAS_BOOLEAN_VALUE,
    autoPlay: HAS_BOOLEAN_VALUE,
    capture: HAS_BOOLEAN_VALUE,
    cellPadding: 0,
    cellSpacing: 0,
    charSet: 0,
    challenge: 0,
    checked: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    cite: 0,
    classID: 0,
    className: 0,
    cols: HAS_POSITIVE_NUMERIC_VALUE,
    colSpan: 0,
    content: 0,
    contentEditable: 0,
    contextMenu: 0,
    controls: HAS_BOOLEAN_VALUE,
    coords: 0,
    crossOrigin: 0,
    data: 0, // For `<object />` acts as `src`.
    dateTime: 0,
    'default': HAS_BOOLEAN_VALUE,
    defer: HAS_BOOLEAN_VALUE,
    dir: 0,
    disabled: HAS_BOOLEAN_VALUE,
    download: HAS_OVERLOADED_BOOLEAN_VALUE,
    draggable: 0,
    encType: 0,
    form: 0,
    formAction: 0,
    formEncType: 0,
    formMethod: 0,
    formNoValidate: HAS_BOOLEAN_VALUE,
    formTarget: 0,
    frameBorder: 0,
    headers: 0,
    height: 0,
    hidden: HAS_BOOLEAN_VALUE,
    high: 0,
    href: 0,
    hrefLang: 0,
    htmlFor: 0,
    httpEquiv: 0,
    icon: 0,
    id: 0,
    inputMode: 0,
    integrity: 0,
    is: 0,
    keyParams: 0,
    keyType: 0,
    kind: 0,
    label: 0,
    lang: 0,
    list: 0,
    loop: HAS_BOOLEAN_VALUE,
    low: 0,
    manifest: 0,
    marginHeight: 0,
    marginWidth: 0,
    max: 0,
    maxLength: 0,
    media: 0,
    mediaGroup: 0,
    method: 0,
    min: 0,
    minLength: 0,
    // Caution; `option.selected` is not updated if `select.multiple` is
    // disabled with `removeAttribute`.
    multiple: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    muted: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    name: 0,
    nonce: 0,
    noValidate: HAS_BOOLEAN_VALUE,
    open: HAS_BOOLEAN_VALUE,
    optimum: 0,
    pattern: 0,
    placeholder: 0,
    playsInline: HAS_BOOLEAN_VALUE,
    poster: 0,
    preload: 0,
    profile: 0,
    radioGroup: 0,
    readOnly: HAS_BOOLEAN_VALUE,
    referrerPolicy: 0,
    rel: 0,
    required: HAS_BOOLEAN_VALUE,
    reversed: HAS_BOOLEAN_VALUE,
    role: 0,
    rows: HAS_POSITIVE_NUMERIC_VALUE,
    rowSpan: HAS_NUMERIC_VALUE,
    sandbox: 0,
    scope: 0,
    scoped: HAS_BOOLEAN_VALUE,
    scrolling: 0,
    seamless: HAS_BOOLEAN_VALUE,
    selected: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    shape: 0,
    size: HAS_POSITIVE_NUMERIC_VALUE,
    sizes: 0,
    span: HAS_POSITIVE_NUMERIC_VALUE,
    spellCheck: 0,
    src: 0,
    srcDoc: 0,
    srcLang: 0,
    srcSet: 0,
    start: HAS_NUMERIC_VALUE,
    step: 0,
    style: 0,
    summary: 0,
    tabIndex: 0,
    target: 0,
    title: 0,
    // Setting .type throws on non-<input> tags
    type: 0,
    useMap: 0,
    value: 0,
    width: 0,
    wmode: 0,
    wrap: 0,

    /**
     * RDFa Properties
     */
    about: 0,
    datatype: 0,
    inlist: 0,
    prefix: 0,
    // property is also supported for OpenGraph in meta tags.
    property: 0,
    resource: 0,
    'typeof': 0,
    vocab: 0,

    /**
     * Non-standard Properties
     */
    // autoCapitalize and autoCorrect are supported in Mobile Safari for
    // keyboard hints.
    autoCapitalize: 0,
    autoCorrect: 0,
    // autoSave allows WebKit/Blink to persist values of input fields on page reloads
    autoSave: 0,
    // color is for Safari mask-icon link
    color: 0,
    // itemProp, itemScope, itemType are for
    // Microdata support. See http://schema.org/docs/gs.html
    itemProp: 0,
    itemScope: HAS_BOOLEAN_VALUE,
    itemType: 0,
    // itemID and itemRef are for Microdata support as well but
    // only specified in the WHATWG spec document. See
    // https://html.spec.whatwg.org/multipage/microdata.html#microdata-dom-api
    itemID: 0,
    itemRef: 0,
    // results show looking glass icon and recent searches on input
    // search fields in WebKit/Blink
    results: 0,
    // IE-only attribute that specifies security restrictions on an iframe
    // as an alternative to the sandbox attribute on IE<10
    security: 0,
    // IE-only attribute that controls focus behavior
    unselectable: 0
  },
  DOMAttributeNames: {
    acceptCharset: 'accept-charset',
    className: 'class',
    htmlFor: 'for',
    httpEquiv: 'http-equiv'
  },
  DOMPropertyNames: {},
  DOMMutationMethods: {
    value: function (node, value) {
      if (value == null) {
        return node.removeAttribute('value');
      }

      // Number inputs get special treatment due to some edge cases in
      // Chrome. Let everything else assign the value attribute as normal.
      // https://github.com/facebook/react/issues/7253#issuecomment-236074326
      if (node.type !== 'number' || node.hasAttribute('value') === false) {
        node.setAttribute('value', '' + value);
      } else if (node.validity && !node.validity.badInput && node.ownerDocument.activeElement !== node) {
        // Don't assign an attribute if validation reports bad
        // input. Chrome will clear the value. Additionally, don't
        // operate on inputs that have focus, otherwise Chrome might
        // strip off trailing decimal places and cause the user's
        // cursor position to jump to the beginning of the input.
        //
        // In ReactDOMInput, we have an onBlur event that will trigger
        // this function again when focus is lost.
        node.setAttribute('value', '' + value);
      }
    }
  }
};

module.exports = HTMLDOMPropertyConfig;

/***/ }),
/* 219 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var DOMChildrenOperations = __webpack_require__(70);
var ReactDOMIDOperations = __webpack_require__(224);

/**
 * Abstracts away all functionality of the reconciler that requires knowledge of
 * the browser context. TODO: These callers should be refactored to avoid the
 * need for this injection.
 */
var ReactComponentBrowserEnvironment = {
  processChildrenUpdates: ReactDOMIDOperations.dangerouslyProcessChildrenUpdates,

  replaceNodeWithMarkup: DOMChildrenOperations.dangerouslyReplaceNodeWithMarkup
};

module.exports = ReactComponentBrowserEnvironment;

/***/ }),
/* 220 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _prodInvariant = __webpack_require__(4);

var DOMLazyTree = __webpack_require__(34);
var ExecutionEnvironment = __webpack_require__(10);

var createNodesFromMarkup = __webpack_require__(221);
var emptyFunction = __webpack_require__(13);
var invariant = __webpack_require__(1);

var Danger = {
  /**
   * Replaces a node with a string of markup at its current position within its
   * parent. The markup must render into a single root node.
   *
   * @param {DOMElement} oldChild Child node to replace.
   * @param {string} markup Markup to render in place of the child node.
   * @internal
   */
  dangerouslyReplaceNodeWithMarkup: function (oldChild, markup) {
    !ExecutionEnvironment.canUseDOM ? process.env.NODE_ENV !== 'production' ? invariant(false, 'dangerouslyReplaceNodeWithMarkup(...): Cannot render markup in a worker thread. Make sure `window` and `document` are available globally before requiring React when unit testing or use ReactDOMServer.renderToString() for server rendering.') : _prodInvariant('56') : void 0;
    !markup ? process.env.NODE_ENV !== 'production' ? invariant(false, 'dangerouslyReplaceNodeWithMarkup(...): Missing markup.') : _prodInvariant('57') : void 0;
    !(oldChild.nodeName !== 'HTML') ? process.env.NODE_ENV !== 'production' ? invariant(false, 'dangerouslyReplaceNodeWithMarkup(...): Cannot replace markup of the <html> node. This is because browser quirks make this unreliable and/or slow. If you want to render to the root you must use server rendering. See ReactDOMServer.renderToString().') : _prodInvariant('58') : void 0;

    if (typeof markup === 'string') {
      var newChild = createNodesFromMarkup(markup, emptyFunction)[0];
      oldChild.parentNode.replaceChild(newChild, oldChild);
    } else {
      DOMLazyTree.replaceChildWithTree(oldChild, markup);
    }
  }
};

module.exports = Danger;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 221 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @typechecks
 */

/*eslint-disable fb-www/unsafe-html*/

var ExecutionEnvironment = __webpack_require__(10);

var createArrayFromMixed = __webpack_require__(222);
var getMarkupWrap = __webpack_require__(223);
var invariant = __webpack_require__(1);

/**
 * Dummy container used to render all markup.
 */
var dummyNode = ExecutionEnvironment.canUseDOM ? document.createElement('div') : null;

/**
 * Pattern used by `getNodeName`.
 */
var nodeNamePattern = /^\s*<(\w+)/;

/**
 * Extracts the `nodeName` of the first element in a string of markup.
 *
 * @param {string} markup String of markup.
 * @return {?string} Node name of the supplied markup.
 */
function getNodeName(markup) {
  var nodeNameMatch = markup.match(nodeNamePattern);
  return nodeNameMatch && nodeNameMatch[1].toLowerCase();
}

/**
 * Creates an array containing the nodes rendered from the supplied markup. The
 * optionally supplied `handleScript` function will be invoked once for each
 * <script> element that is rendered. If no `handleScript` function is supplied,
 * an exception is thrown if any <script> elements are rendered.
 *
 * @param {string} markup A string of valid HTML markup.
 * @param {?function} handleScript Invoked once for each rendered <script>.
 * @return {array<DOMElement|DOMTextNode>} An array of rendered nodes.
 */
function createNodesFromMarkup(markup, handleScript) {
  var node = dummyNode;
  !!!dummyNode ? process.env.NODE_ENV !== 'production' ? invariant(false, 'createNodesFromMarkup dummy not initialized') : invariant(false) : void 0;
  var nodeName = getNodeName(markup);

  var wrap = nodeName && getMarkupWrap(nodeName);
  if (wrap) {
    node.innerHTML = wrap[1] + markup + wrap[2];

    var wrapDepth = wrap[0];
    while (wrapDepth--) {
      node = node.lastChild;
    }
  } else {
    node.innerHTML = markup;
  }

  var scripts = node.getElementsByTagName('script');
  if (scripts.length) {
    !handleScript ? process.env.NODE_ENV !== 'production' ? invariant(false, 'createNodesFromMarkup(...): Unexpected <script> element rendered.') : invariant(false) : void 0;
    createArrayFromMixed(scripts).forEach(handleScript);
  }

  var nodes = Array.from(node.childNodes);
  while (node.lastChild) {
    node.removeChild(node.lastChild);
  }
  return nodes;
}

module.exports = createNodesFromMarkup;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 222 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @typechecks
 */

var invariant = __webpack_require__(1);

/**
 * Convert array-like objects to arrays.
 *
 * This API assumes the caller knows the contents of the data type. For less
 * well defined inputs use createArrayFromMixed.
 *
 * @param {object|function|filelist} obj
 * @return {array}
 */
function toArray(obj) {
  var length = obj.length;

  // Some browsers builtin objects can report typeof 'function' (e.g. NodeList
  // in old versions of Safari).
  !(!Array.isArray(obj) && (typeof obj === 'object' || typeof obj === 'function')) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'toArray: Array-like object expected') : invariant(false) : void 0;

  !(typeof length === 'number') ? process.env.NODE_ENV !== 'production' ? invariant(false, 'toArray: Object needs a length property') : invariant(false) : void 0;

  !(length === 0 || length - 1 in obj) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'toArray: Object should have keys for indices') : invariant(false) : void 0;

  !(typeof obj.callee !== 'function') ? process.env.NODE_ENV !== 'production' ? invariant(false, 'toArray: Object can\'t be `arguments`. Use rest params ' + '(function(...args) {}) or Array.from() instead.') : invariant(false) : void 0;

  // Old IE doesn't give collections access to hasOwnProperty. Assume inputs
  // without method will throw during the slice call and skip straight to the
  // fallback.
  if (obj.hasOwnProperty) {
    try {
      return Array.prototype.slice.call(obj);
    } catch (e) {
      // IE < 9 does not support Array#slice on collections objects
    }
  }

  // Fall back to copying key by key. This assumes all keys have a value,
  // so will not preserve sparsely populated inputs.
  var ret = Array(length);
  for (var ii = 0; ii < length; ii++) {
    ret[ii] = obj[ii];
  }
  return ret;
}

/**
 * Perform a heuristic test to determine if an object is "array-like".
 *
 *   A monk asked Joshu, a Zen master, "Has a dog Buddha nature?"
 *   Joshu replied: "Mu."
 *
 * This function determines if its argument has "array nature": it returns
 * true if the argument is an actual array, an `arguments' object, or an
 * HTMLCollection (e.g. node.childNodes or node.getElementsByTagName()).
 *
 * It will return false for other array-like objects like Filelist.
 *
 * @param {*} obj
 * @return {boolean}
 */
function hasArrayNature(obj) {
  return (
    // not null/false
    !!obj && (
    // arrays are objects, NodeLists are functions in Safari
    typeof obj == 'object' || typeof obj == 'function') &&
    // quacks like an array
    'length' in obj &&
    // not window
    !('setInterval' in obj) &&
    // no DOM node should be considered an array-like
    // a 'select' element has 'length' and 'item' properties on IE8
    typeof obj.nodeType != 'number' && (
    // a real array
    Array.isArray(obj) ||
    // arguments
    'callee' in obj ||
    // HTMLCollection/NodeList
    'item' in obj)
  );
}

/**
 * Ensure that the argument is an array by wrapping it in an array if it is not.
 * Creates a copy of the argument if it is already an array.
 *
 * This is mostly useful idiomatically:
 *
 *   var createArrayFromMixed = require('createArrayFromMixed');
 *
 *   function takesOneOrMoreThings(things) {
 *     things = createArrayFromMixed(things);
 *     ...
 *   }
 *
 * This allows you to treat `things' as an array, but accept scalars in the API.
 *
 * If you need to convert an array-like object, like `arguments`, into an array
 * use toArray instead.
 *
 * @param {*} obj
 * @return {array}
 */
function createArrayFromMixed(obj) {
  if (!hasArrayNature(obj)) {
    return [obj];
  } else if (Array.isArray(obj)) {
    return obj.slice();
  } else {
    return toArray(obj);
  }
}

module.exports = createArrayFromMixed;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 223 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*eslint-disable fb-www/unsafe-html */

var ExecutionEnvironment = __webpack_require__(10);

var invariant = __webpack_require__(1);

/**
 * Dummy container used to detect which wraps are necessary.
 */
var dummyNode = ExecutionEnvironment.canUseDOM ? document.createElement('div') : null;

/**
 * Some browsers cannot use `innerHTML` to render certain elements standalone,
 * so we wrap them, render the wrapped nodes, then extract the desired node.
 *
 * In IE8, certain elements cannot render alone, so wrap all elements ('*').
 */

var shouldWrap = {};

var selectWrap = [1, '<select multiple="true">', '</select>'];
var tableWrap = [1, '<table>', '</table>'];
var trWrap = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

var svgWrap = [1, '<svg xmlns="http://www.w3.org/2000/svg">', '</svg>'];

var markupWrap = {
  '*': [1, '?<div>', '</div>'],

  'area': [1, '<map>', '</map>'],
  'col': [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  'legend': [1, '<fieldset>', '</fieldset>'],
  'param': [1, '<object>', '</object>'],
  'tr': [2, '<table><tbody>', '</tbody></table>'],

  'optgroup': selectWrap,
  'option': selectWrap,

  'caption': tableWrap,
  'colgroup': tableWrap,
  'tbody': tableWrap,
  'tfoot': tableWrap,
  'thead': tableWrap,

  'td': trWrap,
  'th': trWrap
};

// Initialize the SVG elements since we know they'll always need to be wrapped
// consistently. If they are created inside a <div> they will be initialized in
// the wrong namespace (and will not display).
var svgElements = ['circle', 'clipPath', 'defs', 'ellipse', 'g', 'image', 'line', 'linearGradient', 'mask', 'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect', 'stop', 'text', 'tspan'];
svgElements.forEach(function (nodeName) {
  markupWrap[nodeName] = svgWrap;
  shouldWrap[nodeName] = true;
});

/**
 * Gets the markup wrap configuration for the supplied `nodeName`.
 *
 * NOTE: This lazily detects which wraps are necessary for the current browser.
 *
 * @param {string} nodeName Lowercase `nodeName`.
 * @return {?array} Markup wrap configuration, if applicable.
 */
function getMarkupWrap(nodeName) {
  !!!dummyNode ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Markup wrapping node not initialized') : invariant(false) : void 0;
  if (!markupWrap.hasOwnProperty(nodeName)) {
    nodeName = '*';
  }
  if (!shouldWrap.hasOwnProperty(nodeName)) {
    if (nodeName === '*') {
      dummyNode.innerHTML = '<link />';
    } else {
      dummyNode.innerHTML = '<' + nodeName + '></' + nodeName + '>';
    }
    shouldWrap[nodeName] = !dummyNode.firstChild;
  }
  return shouldWrap[nodeName] ? markupWrap[nodeName] : null;
}

module.exports = getMarkupWrap;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 224 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var DOMChildrenOperations = __webpack_require__(70);
var ReactDOMComponentTree = __webpack_require__(8);

/**
 * Operations used to process updates to DOM nodes.
 */
var ReactDOMIDOperations = {
  /**
   * Updates a component's children by processing a series of updates.
   *
   * @param {array<object>} updates List of update configurations.
   * @internal
   */
  dangerouslyProcessChildrenUpdates: function (parentInst, updates) {
    var node = ReactDOMComponentTree.getNodeFromInstance(parentInst);
    DOMChildrenOperations.processUpdates(node, updates);
  }
};

module.exports = ReactDOMIDOperations;

/***/ }),
/* 225 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/* global hasOwnProperty:true */



var _prodInvariant = __webpack_require__(4),
    _assign = __webpack_require__(7);

var AutoFocusUtils = __webpack_require__(226);
var CSSPropertyOperations = __webpack_require__(227);
var DOMLazyTree = __webpack_require__(34);
var DOMNamespaces = __webpack_require__(71);
var DOMProperty = __webpack_require__(23);
var DOMPropertyOperations = __webpack_require__(110);
var EventPluginHub = __webpack_require__(41);
var EventPluginRegistry = __webpack_require__(51);
var ReactBrowserEventEmitter = __webpack_require__(56);
var ReactDOMComponentFlags = __webpack_require__(98);
var ReactDOMComponentTree = __webpack_require__(8);
var ReactDOMInput = __webpack_require__(237);
var ReactDOMOption = __webpack_require__(238);
var ReactDOMSelect = __webpack_require__(112);
var ReactDOMTextarea = __webpack_require__(239);
var ReactInstrumentation = __webpack_require__(12);
var ReactMultiChild = __webpack_require__(240);
var ReactServerRenderingTransaction = __webpack_require__(249);

var emptyFunction = __webpack_require__(13);
var escapeTextContentForBrowser = __webpack_require__(55);
var invariant = __webpack_require__(1);
var isEventSupported = __webpack_require__(68);
var shallowEqual = __webpack_require__(75);
var inputValueTracking = __webpack_require__(104);
var validateDOMNesting = __webpack_require__(79);
var warning = __webpack_require__(2);

var Flags = ReactDOMComponentFlags;
var deleteListener = EventPluginHub.deleteListener;
var getNode = ReactDOMComponentTree.getNodeFromInstance;
var listenTo = ReactBrowserEventEmitter.listenTo;
var registrationNameModules = EventPluginRegistry.registrationNameModules;

// For quickly matching children type, to test if can be treated as content.
var CONTENT_TYPES = { string: true, number: true };

var STYLE = 'style';
var HTML = '__html';
var RESERVED_PROPS = {
  children: null,
  dangerouslySetInnerHTML: null,
  suppressContentEditableWarning: null
};

// Node type for document fragments (Node.DOCUMENT_FRAGMENT_NODE).
var DOC_FRAGMENT_TYPE = 11;

function getDeclarationErrorAddendum(internalInstance) {
  if (internalInstance) {
    var owner = internalInstance._currentElement._owner || null;
    if (owner) {
      var name = owner.getName();
      if (name) {
        return ' This DOM node was rendered by `' + name + '`.';
      }
    }
  }
  return '';
}

function friendlyStringify(obj) {
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return '[' + obj.map(friendlyStringify).join(', ') + ']';
    } else {
      var pairs = [];
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          var keyEscaped = /^[a-z$_][\w$_]*$/i.test(key) ? key : JSON.stringify(key);
          pairs.push(keyEscaped + ': ' + friendlyStringify(obj[key]));
        }
      }
      return '{' + pairs.join(', ') + '}';
    }
  } else if (typeof obj === 'string') {
    return JSON.stringify(obj);
  } else if (typeof obj === 'function') {
    return '[function object]';
  }
  // Differs from JSON.stringify in that undefined because undefined and that
  // inf and nan don't become null
  return String(obj);
}

var styleMutationWarning = {};

function checkAndWarnForMutatedStyle(style1, style2, component) {
  if (style1 == null || style2 == null) {
    return;
  }
  if (shallowEqual(style1, style2)) {
    return;
  }

  var componentName = component._tag;
  var owner = component._currentElement._owner;
  var ownerName;
  if (owner) {
    ownerName = owner.getName();
  }

  var hash = ownerName + '|' + componentName;

  if (styleMutationWarning.hasOwnProperty(hash)) {
    return;
  }

  styleMutationWarning[hash] = true;

  process.env.NODE_ENV !== 'production' ? warning(false, '`%s` was passed a style object that has previously been mutated. ' + 'Mutating `style` is deprecated. Consider cloning it beforehand. Check ' + 'the `render` %s. Previous style: %s. Mutated style: %s.', componentName, owner ? 'of `' + ownerName + '`' : 'using <' + componentName + '>', friendlyStringify(style1), friendlyStringify(style2)) : void 0;
}

/**
 * @param {object} component
 * @param {?object} props
 */
function assertValidProps(component, props) {
  if (!props) {
    return;
  }
  // Note the use of `==` which checks for null or undefined.
  if (voidElementTags[component._tag]) {
    !(props.children == null && props.dangerouslySetInnerHTML == null) ? process.env.NODE_ENV !== 'production' ? invariant(false, '%s is a void element tag and must neither have `children` nor use `dangerouslySetInnerHTML`.%s', component._tag, component._currentElement._owner ? ' Check the render method of ' + component._currentElement._owner.getName() + '.' : '') : _prodInvariant('137', component._tag, component._currentElement._owner ? ' Check the render method of ' + component._currentElement._owner.getName() + '.' : '') : void 0;
  }
  if (props.dangerouslySetInnerHTML != null) {
    !(props.children == null) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Can only set one of `children` or `props.dangerouslySetInnerHTML`.') : _prodInvariant('60') : void 0;
    !(typeof props.dangerouslySetInnerHTML === 'object' && HTML in props.dangerouslySetInnerHTML) ? process.env.NODE_ENV !== 'production' ? invariant(false, '`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://fb.me/react-invariant-dangerously-set-inner-html for more information.') : _prodInvariant('61') : void 0;
  }
  if (process.env.NODE_ENV !== 'production') {
    process.env.NODE_ENV !== 'production' ? warning(props.innerHTML == null, 'Directly setting property `innerHTML` is not permitted. ' + 'For more information, lookup documentation on `dangerouslySetInnerHTML`.') : void 0;
    process.env.NODE_ENV !== 'production' ? warning(props.suppressContentEditableWarning || !props.contentEditable || props.children == null, 'A component is `contentEditable` and contains `children` managed by ' + 'React. It is now your responsibility to guarantee that none of ' + 'those nodes are unexpectedly modified or duplicated. This is ' + 'probably not intentional.') : void 0;
    process.env.NODE_ENV !== 'production' ? warning(props.onFocusIn == null && props.onFocusOut == null, 'React uses onFocus and onBlur instead of onFocusIn and onFocusOut. ' + 'All React events are normalized to bubble, so onFocusIn and onFocusOut ' + 'are not needed/supported by React.') : void 0;
  }
  !(props.style == null || typeof props.style === 'object') ? process.env.NODE_ENV !== 'production' ? invariant(false, 'The `style` prop expects a mapping from style properties to values, not a string. For example, style={{marginRight: spacing + \'em\'}} when using JSX.%s', getDeclarationErrorAddendum(component)) : _prodInvariant('62', getDeclarationErrorAddendum(component)) : void 0;
}

function enqueuePutListener(inst, registrationName, listener, transaction) {
  if (transaction instanceof ReactServerRenderingTransaction) {
    return;
  }
  if (process.env.NODE_ENV !== 'production') {
    // IE8 has no API for event capturing and the `onScroll` event doesn't
    // bubble.
    process.env.NODE_ENV !== 'production' ? warning(registrationName !== 'onScroll' || isEventSupported('scroll', true), "This browser doesn't support the `onScroll` event") : void 0;
  }
  var containerInfo = inst._hostContainerInfo;
  var isDocumentFragment = containerInfo._node && containerInfo._node.nodeType === DOC_FRAGMENT_TYPE;
  var doc = isDocumentFragment ? containerInfo._node : containerInfo._ownerDocument;
  listenTo(registrationName, doc);
  transaction.getReactMountReady().enqueue(putListener, {
    inst: inst,
    registrationName: registrationName,
    listener: listener
  });
}

function putListener() {
  var listenerToPut = this;
  EventPluginHub.putListener(listenerToPut.inst, listenerToPut.registrationName, listenerToPut.listener);
}

function inputPostMount() {
  var inst = this;
  ReactDOMInput.postMountWrapper(inst);
}

function textareaPostMount() {
  var inst = this;
  ReactDOMTextarea.postMountWrapper(inst);
}

function optionPostMount() {
  var inst = this;
  ReactDOMOption.postMountWrapper(inst);
}

var setAndValidateContentChildDev = emptyFunction;
if (process.env.NODE_ENV !== 'production') {
  setAndValidateContentChildDev = function (content) {
    var hasExistingContent = this._contentDebugID != null;
    var debugID = this._debugID;
    // This ID represents the inlined child that has no backing instance:
    var contentDebugID = -debugID;

    if (content == null) {
      if (hasExistingContent) {
        ReactInstrumentation.debugTool.onUnmountComponent(this._contentDebugID);
      }
      this._contentDebugID = null;
      return;
    }

    validateDOMNesting(null, String(content), this, this._ancestorInfo);
    this._contentDebugID = contentDebugID;
    if (hasExistingContent) {
      ReactInstrumentation.debugTool.onBeforeUpdateComponent(contentDebugID, content);
      ReactInstrumentation.debugTool.onUpdateComponent(contentDebugID);
    } else {
      ReactInstrumentation.debugTool.onBeforeMountComponent(contentDebugID, content, debugID);
      ReactInstrumentation.debugTool.onMountComponent(contentDebugID);
      ReactInstrumentation.debugTool.onSetChildren(debugID, [contentDebugID]);
    }
  };
}

// There are so many media events, it makes sense to just
// maintain a list rather than create a `trapBubbledEvent` for each
var mediaEvents = {
  topAbort: 'abort',
  topCanPlay: 'canplay',
  topCanPlayThrough: 'canplaythrough',
  topDurationChange: 'durationchange',
  topEmptied: 'emptied',
  topEncrypted: 'encrypted',
  topEnded: 'ended',
  topError: 'error',
  topLoadedData: 'loadeddata',
  topLoadedMetadata: 'loadedmetadata',
  topLoadStart: 'loadstart',
  topPause: 'pause',
  topPlay: 'play',
  topPlaying: 'playing',
  topProgress: 'progress',
  topRateChange: 'ratechange',
  topSeeked: 'seeked',
  topSeeking: 'seeking',
  topStalled: 'stalled',
  topSuspend: 'suspend',
  topTimeUpdate: 'timeupdate',
  topVolumeChange: 'volumechange',
  topWaiting: 'waiting'
};

function trackInputValue() {
  inputValueTracking.track(this);
}

function trapBubbledEventsLocal() {
  var inst = this;
  // If a component renders to null or if another component fatals and causes
  // the state of the tree to be corrupted, `node` here can be null.
  !inst._rootNodeID ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Must be mounted to trap events') : _prodInvariant('63') : void 0;
  var node = getNode(inst);
  !node ? process.env.NODE_ENV !== 'production' ? invariant(false, 'trapBubbledEvent(...): Requires node to be rendered.') : _prodInvariant('64') : void 0;

  switch (inst._tag) {
    case 'iframe':
    case 'object':
      inst._wrapperState.listeners = [ReactBrowserEventEmitter.trapBubbledEvent('topLoad', 'load', node)];
      break;
    case 'video':
    case 'audio':
      inst._wrapperState.listeners = [];
      // Create listener for each media event
      for (var event in mediaEvents) {
        if (mediaEvents.hasOwnProperty(event)) {
          inst._wrapperState.listeners.push(ReactBrowserEventEmitter.trapBubbledEvent(event, mediaEvents[event], node));
        }
      }
      break;
    case 'source':
      inst._wrapperState.listeners = [ReactBrowserEventEmitter.trapBubbledEvent('topError', 'error', node)];
      break;
    case 'img':
      inst._wrapperState.listeners = [ReactBrowserEventEmitter.trapBubbledEvent('topError', 'error', node), ReactBrowserEventEmitter.trapBubbledEvent('topLoad', 'load', node)];
      break;
    case 'form':
      inst._wrapperState.listeners = [ReactBrowserEventEmitter.trapBubbledEvent('topReset', 'reset', node), ReactBrowserEventEmitter.trapBubbledEvent('topSubmit', 'submit', node)];
      break;
    case 'input':
    case 'select':
    case 'textarea':
      inst._wrapperState.listeners = [ReactBrowserEventEmitter.trapBubbledEvent('topInvalid', 'invalid', node)];
      break;
  }
}

function postUpdateSelectWrapper() {
  ReactDOMSelect.postUpdateWrapper(this);
}

// For HTML, certain tags should omit their close tag. We keep a whitelist for
// those special-case tags.

var omittedCloseTags = {
  area: true,
  base: true,
  br: true,
  col: true,
  embed: true,
  hr: true,
  img: true,
  input: true,
  keygen: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true
  // NOTE: menuitem's close tag should be omitted, but that causes problems.
};

var newlineEatingTags = {
  listing: true,
  pre: true,
  textarea: true
};

// For HTML, certain tags cannot have children. This has the same purpose as
// `omittedCloseTags` except that `menuitem` should still have its closing tag.

var voidElementTags = _assign({
  menuitem: true
}, omittedCloseTags);

// We accept any tag to be rendered but since this gets injected into arbitrary
// HTML, we want to make sure that it's a safe tag.
// http://www.w3.org/TR/REC-xml/#NT-Name

var VALID_TAG_REGEX = /^[a-zA-Z][a-zA-Z:_\.\-\d]*$/; // Simplified subset
var validatedTagCache = {};
var hasOwnProperty = {}.hasOwnProperty;

function validateDangerousTag(tag) {
  if (!hasOwnProperty.call(validatedTagCache, tag)) {
    !VALID_TAG_REGEX.test(tag) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Invalid tag: %s', tag) : _prodInvariant('65', tag) : void 0;
    validatedTagCache[tag] = true;
  }
}

function isCustomComponent(tagName, props) {
  return tagName.indexOf('-') >= 0 || props.is != null;
}

var globalIdCounter = 1;

/**
 * Creates a new React class that is idempotent and capable of containing other
 * React components. It accepts event listeners and DOM properties that are
 * valid according to `DOMProperty`.
 *
 *  - Event listeners: `onClick`, `onMouseDown`, etc.
 *  - DOM properties: `className`, `name`, `title`, etc.
 *
 * The `style` property functions differently from the DOM API. It accepts an
 * object mapping of style properties to values.
 *
 * @constructor ReactDOMComponent
 * @extends ReactMultiChild
 */
function ReactDOMComponent(element) {
  var tag = element.type;
  validateDangerousTag(tag);
  this._currentElement = element;
  this._tag = tag.toLowerCase();
  this._namespaceURI = null;
  this._renderedChildren = null;
  this._previousStyle = null;
  this._previousStyleCopy = null;
  this._hostNode = null;
  this._hostParent = null;
  this._rootNodeID = 0;
  this._domID = 0;
  this._hostContainerInfo = null;
  this._wrapperState = null;
  this._topLevelWrapper = null;
  this._flags = 0;
  if (process.env.NODE_ENV !== 'production') {
    this._ancestorInfo = null;
    setAndValidateContentChildDev.call(this, null);
  }
}

ReactDOMComponent.displayName = 'ReactDOMComponent';

ReactDOMComponent.Mixin = {
  /**
   * Generates root tag markup then recurses. This method has side effects and
   * is not idempotent.
   *
   * @internal
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @param {?ReactDOMComponent} the parent component instance
   * @param {?object} info about the host container
   * @param {object} context
   * @return {string} The computed markup.
   */
  mountComponent: function (transaction, hostParent, hostContainerInfo, context) {
    this._rootNodeID = globalIdCounter++;
    this._domID = hostContainerInfo._idCounter++;
    this._hostParent = hostParent;
    this._hostContainerInfo = hostContainerInfo;

    var props = this._currentElement.props;

    switch (this._tag) {
      case 'audio':
      case 'form':
      case 'iframe':
      case 'img':
      case 'link':
      case 'object':
      case 'source':
      case 'video':
        this._wrapperState = {
          listeners: null
        };
        transaction.getReactMountReady().enqueue(trapBubbledEventsLocal, this);
        break;
      case 'input':
        ReactDOMInput.mountWrapper(this, props, hostParent);
        props = ReactDOMInput.getHostProps(this, props);
        transaction.getReactMountReady().enqueue(trackInputValue, this);
        transaction.getReactMountReady().enqueue(trapBubbledEventsLocal, this);
        break;
      case 'option':
        ReactDOMOption.mountWrapper(this, props, hostParent);
        props = ReactDOMOption.getHostProps(this, props);
        break;
      case 'select':
        ReactDOMSelect.mountWrapper(this, props, hostParent);
        props = ReactDOMSelect.getHostProps(this, props);
        transaction.getReactMountReady().enqueue(trapBubbledEventsLocal, this);
        break;
      case 'textarea':
        ReactDOMTextarea.mountWrapper(this, props, hostParent);
        props = ReactDOMTextarea.getHostProps(this, props);
        transaction.getReactMountReady().enqueue(trackInputValue, this);
        transaction.getReactMountReady().enqueue(trapBubbledEventsLocal, this);
        break;
    }

    assertValidProps(this, props);

    // We create tags in the namespace of their parent container, except HTML
    // tags get no namespace.
    var namespaceURI;
    var parentTag;
    if (hostParent != null) {
      namespaceURI = hostParent._namespaceURI;
      parentTag = hostParent._tag;
    } else if (hostContainerInfo._tag) {
      namespaceURI = hostContainerInfo._namespaceURI;
      parentTag = hostContainerInfo._tag;
    }
    if (namespaceURI == null || namespaceURI === DOMNamespaces.svg && parentTag === 'foreignobject') {
      namespaceURI = DOMNamespaces.html;
    }
    if (namespaceURI === DOMNamespaces.html) {
      if (this._tag === 'svg') {
        namespaceURI = DOMNamespaces.svg;
      } else if (this._tag === 'math') {
        namespaceURI = DOMNamespaces.mathml;
      }
    }
    this._namespaceURI = namespaceURI;

    if (process.env.NODE_ENV !== 'production') {
      var parentInfo;
      if (hostParent != null) {
        parentInfo = hostParent._ancestorInfo;
      } else if (hostContainerInfo._tag) {
        parentInfo = hostContainerInfo._ancestorInfo;
      }
      if (parentInfo) {
        // parentInfo should always be present except for the top-level
        // component when server rendering
        validateDOMNesting(this._tag, null, this, parentInfo);
      }
      this._ancestorInfo = validateDOMNesting.updatedAncestorInfo(parentInfo, this._tag, this);
    }

    var mountImage;
    if (transaction.useCreateElement) {
      var ownerDocument = hostContainerInfo._ownerDocument;
      var el;
      if (namespaceURI === DOMNamespaces.html) {
        if (this._tag === 'script') {
          // Create the script via .innerHTML so its "parser-inserted" flag is
          // set to true and it does not execute
          var div = ownerDocument.createElement('div');
          var type = this._currentElement.type;
          div.innerHTML = '<' + type + '></' + type + '>';
          el = div.removeChild(div.firstChild);
        } else if (props.is) {
          el = ownerDocument.createElement(this._currentElement.type, props.is);
        } else {
          // Separate else branch instead of using `props.is || undefined` above becuase of a Firefox bug.
          // See discussion in https://github.com/facebook/react/pull/6896
          // and discussion in https://bugzilla.mozilla.org/show_bug.cgi?id=1276240
          el = ownerDocument.createElement(this._currentElement.type);
        }
      } else {
        el = ownerDocument.createElementNS(namespaceURI, this._currentElement.type);
      }
      ReactDOMComponentTree.precacheNode(this, el);
      this._flags |= Flags.hasCachedChildNodes;
      if (!this._hostParent) {
        DOMPropertyOperations.setAttributeForRoot(el);
      }
      this._updateDOMProperties(null, props, transaction);
      var lazyTree = DOMLazyTree(el);
      this._createInitialChildren(transaction, props, context, lazyTree);
      mountImage = lazyTree;
    } else {
      var tagOpen = this._createOpenTagMarkupAndPutListeners(transaction, props);
      var tagContent = this._createContentMarkup(transaction, props, context);
      if (!tagContent && omittedCloseTags[this._tag]) {
        mountImage = tagOpen + '/>';
      } else {
        mountImage = tagOpen + '>' + tagContent + '</' + this._currentElement.type + '>';
      }
    }

    switch (this._tag) {
      case 'input':
        transaction.getReactMountReady().enqueue(inputPostMount, this);
        if (props.autoFocus) {
          transaction.getReactMountReady().enqueue(AutoFocusUtils.focusDOMComponent, this);
        }
        break;
      case 'textarea':
        transaction.getReactMountReady().enqueue(textareaPostMount, this);
        if (props.autoFocus) {
          transaction.getReactMountReady().enqueue(AutoFocusUtils.focusDOMComponent, this);
        }
        break;
      case 'select':
        if (props.autoFocus) {
          transaction.getReactMountReady().enqueue(AutoFocusUtils.focusDOMComponent, this);
        }
        break;
      case 'button':
        if (props.autoFocus) {
          transaction.getReactMountReady().enqueue(AutoFocusUtils.focusDOMComponent, this);
        }
        break;
      case 'option':
        transaction.getReactMountReady().enqueue(optionPostMount, this);
        break;
    }

    return mountImage;
  },

  /**
   * Creates markup for the open tag and all attributes.
   *
   * This method has side effects because events get registered.
   *
   * Iterating over object properties is faster than iterating over arrays.
   * @see http://jsperf.com/obj-vs-arr-iteration
   *
   * @private
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @param {object} props
   * @return {string} Markup of opening tag.
   */
  _createOpenTagMarkupAndPutListeners: function (transaction, props) {
    var ret = '<' + this._currentElement.type;

    for (var propKey in props) {
      if (!props.hasOwnProperty(propKey)) {
        continue;
      }
      var propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      if (registrationNameModules.hasOwnProperty(propKey)) {
        if (propValue) {
          enqueuePutListener(this, propKey, propValue, transaction);
        }
      } else {
        if (propKey === STYLE) {
          if (propValue) {
            if (process.env.NODE_ENV !== 'production') {
              // See `_updateDOMProperties`. style block
              this._previousStyle = propValue;
            }
            propValue = this._previousStyleCopy = _assign({}, props.style);
          }
          propValue = CSSPropertyOperations.createMarkupForStyles(propValue, this);
        }
        var markup = null;
        if (this._tag != null && isCustomComponent(this._tag, props)) {
          if (!RESERVED_PROPS.hasOwnProperty(propKey)) {
            markup = DOMPropertyOperations.createMarkupForCustomAttribute(propKey, propValue);
          }
        } else {
          markup = DOMPropertyOperations.createMarkupForProperty(propKey, propValue);
        }
        if (markup) {
          ret += ' ' + markup;
        }
      }
    }

    // For static pages, no need to put React ID and checksum. Saves lots of
    // bytes.
    if (transaction.renderToStaticMarkup) {
      return ret;
    }

    if (!this._hostParent) {
      ret += ' ' + DOMPropertyOperations.createMarkupForRoot();
    }
    ret += ' ' + DOMPropertyOperations.createMarkupForID(this._domID);
    return ret;
  },

  /**
   * Creates markup for the content between the tags.
   *
   * @private
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @param {object} props
   * @param {object} context
   * @return {string} Content markup.
   */
  _createContentMarkup: function (transaction, props, context) {
    var ret = '';

    // Intentional use of != to avoid catching zero/false.
    var innerHTML = props.dangerouslySetInnerHTML;
    if (innerHTML != null) {
      if (innerHTML.__html != null) {
        ret = innerHTML.__html;
      }
    } else {
      var contentToUse = CONTENT_TYPES[typeof props.children] ? props.children : null;
      var childrenToUse = contentToUse != null ? null : props.children;
      if (contentToUse != null) {
        // TODO: Validate that text is allowed as a child of this node
        ret = escapeTextContentForBrowser(contentToUse);
        if (process.env.NODE_ENV !== 'production') {
          setAndValidateContentChildDev.call(this, contentToUse);
        }
      } else if (childrenToUse != null) {
        var mountImages = this.mountChildren(childrenToUse, transaction, context);
        ret = mountImages.join('');
      }
    }
    if (newlineEatingTags[this._tag] && ret.charAt(0) === '\n') {
      // text/html ignores the first character in these tags if it's a newline
      // Prefer to break application/xml over text/html (for now) by adding
      // a newline specifically to get eaten by the parser. (Alternately for
      // textareas, replacing "^\n" with "\r\n" doesn't get eaten, and the first
      // \r is normalized out by HTMLTextAreaElement#value.)
      // See: <http://www.w3.org/TR/html-polyglot/#newlines-in-textarea-and-pre>
      // See: <http://www.w3.org/TR/html5/syntax.html#element-restrictions>
      // See: <http://www.w3.org/TR/html5/syntax.html#newlines>
      // See: Parsing of "textarea" "listing" and "pre" elements
      //  from <http://www.w3.org/TR/html5/syntax.html#parsing-main-inbody>
      return '\n' + ret;
    } else {
      return ret;
    }
  },

  _createInitialChildren: function (transaction, props, context, lazyTree) {
    // Intentional use of != to avoid catching zero/false.
    var innerHTML = props.dangerouslySetInnerHTML;
    if (innerHTML != null) {
      if (innerHTML.__html != null) {
        DOMLazyTree.queueHTML(lazyTree, innerHTML.__html);
      }
    } else {
      var contentToUse = CONTENT_TYPES[typeof props.children] ? props.children : null;
      var childrenToUse = contentToUse != null ? null : props.children;
      // TODO: Validate that text is allowed as a child of this node
      if (contentToUse != null) {
        // Avoid setting textContent when the text is empty. In IE11 setting
        // textContent on a text area will cause the placeholder to not
        // show within the textarea until it has been focused and blurred again.
        // https://github.com/facebook/react/issues/6731#issuecomment-254874553
        if (contentToUse !== '') {
          if (process.env.NODE_ENV !== 'production') {
            setAndValidateContentChildDev.call(this, contentToUse);
          }
          DOMLazyTree.queueText(lazyTree, contentToUse);
        }
      } else if (childrenToUse != null) {
        var mountImages = this.mountChildren(childrenToUse, transaction, context);
        for (var i = 0; i < mountImages.length; i++) {
          DOMLazyTree.queueChild(lazyTree, mountImages[i]);
        }
      }
    }
  },

  /**
   * Receives a next element and updates the component.
   *
   * @internal
   * @param {ReactElement} nextElement
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @param {object} context
   */
  receiveComponent: function (nextElement, transaction, context) {
    var prevElement = this._currentElement;
    this._currentElement = nextElement;
    this.updateComponent(transaction, prevElement, nextElement, context);
  },

  /**
   * Updates a DOM component after it has already been allocated and
   * attached to the DOM. Reconciles the root DOM node, then recurses.
   *
   * @param {ReactReconcileTransaction} transaction
   * @param {ReactElement} prevElement
   * @param {ReactElement} nextElement
   * @internal
   * @overridable
   */
  updateComponent: function (transaction, prevElement, nextElement, context) {
    var lastProps = prevElement.props;
    var nextProps = this._currentElement.props;

    switch (this._tag) {
      case 'input':
        lastProps = ReactDOMInput.getHostProps(this, lastProps);
        nextProps = ReactDOMInput.getHostProps(this, nextProps);
        break;
      case 'option':
        lastProps = ReactDOMOption.getHostProps(this, lastProps);
        nextProps = ReactDOMOption.getHostProps(this, nextProps);
        break;
      case 'select':
        lastProps = ReactDOMSelect.getHostProps(this, lastProps);
        nextProps = ReactDOMSelect.getHostProps(this, nextProps);
        break;
      case 'textarea':
        lastProps = ReactDOMTextarea.getHostProps(this, lastProps);
        nextProps = ReactDOMTextarea.getHostProps(this, nextProps);
        break;
    }

    assertValidProps(this, nextProps);
    this._updateDOMProperties(lastProps, nextProps, transaction);
    this._updateDOMChildren(lastProps, nextProps, transaction, context);

    switch (this._tag) {
      case 'input':
        // Update the wrapper around inputs *after* updating props. This has to
        // happen after `_updateDOMProperties`. Otherwise HTML5 input validations
        // raise warnings and prevent the new value from being assigned.
        ReactDOMInput.updateWrapper(this);
        break;
      case 'textarea':
        ReactDOMTextarea.updateWrapper(this);
        break;
      case 'select':
        // <select> value update needs to occur after <option> children
        // reconciliation
        transaction.getReactMountReady().enqueue(postUpdateSelectWrapper, this);
        break;
    }
  },

  /**
   * Reconciles the properties by detecting differences in property values and
   * updating the DOM as necessary. This function is probably the single most
   * critical path for performance optimization.
   *
   * TODO: Benchmark whether checking for changed values in memory actually
   *       improves performance (especially statically positioned elements).
   * TODO: Benchmark the effects of putting this at the top since 99% of props
   *       do not change for a given reconciliation.
   * TODO: Benchmark areas that can be improved with caching.
   *
   * @private
   * @param {object} lastProps
   * @param {object} nextProps
   * @param {?DOMElement} node
   */
  _updateDOMProperties: function (lastProps, nextProps, transaction) {
    var propKey;
    var styleName;
    var styleUpdates;
    for (propKey in lastProps) {
      if (nextProps.hasOwnProperty(propKey) || !lastProps.hasOwnProperty(propKey) || lastProps[propKey] == null) {
        continue;
      }
      if (propKey === STYLE) {
        var lastStyle = this._previousStyleCopy;
        for (styleName in lastStyle) {
          if (lastStyle.hasOwnProperty(styleName)) {
            styleUpdates = styleUpdates || {};
            styleUpdates[styleName] = '';
          }
        }
        this._previousStyleCopy = null;
      } else if (registrationNameModules.hasOwnProperty(propKey)) {
        if (lastProps[propKey]) {
          // Only call deleteListener if there was a listener previously or
          // else willDeleteListener gets called when there wasn't actually a
          // listener (e.g., onClick={null})
          deleteListener(this, propKey);
        }
      } else if (isCustomComponent(this._tag, lastProps)) {
        if (!RESERVED_PROPS.hasOwnProperty(propKey)) {
          DOMPropertyOperations.deleteValueForAttribute(getNode(this), propKey);
        }
      } else if (DOMProperty.properties[propKey] || DOMProperty.isCustomAttribute(propKey)) {
        DOMPropertyOperations.deleteValueForProperty(getNode(this), propKey);
      }
    }
    for (propKey in nextProps) {
      var nextProp = nextProps[propKey];
      var lastProp = propKey === STYLE ? this._previousStyleCopy : lastProps != null ? lastProps[propKey] : undefined;
      if (!nextProps.hasOwnProperty(propKey) || nextProp === lastProp || nextProp == null && lastProp == null) {
        continue;
      }
      if (propKey === STYLE) {
        if (nextProp) {
          if (process.env.NODE_ENV !== 'production') {
            checkAndWarnForMutatedStyle(this._previousStyleCopy, this._previousStyle, this);
            this._previousStyle = nextProp;
          }
          nextProp = this._previousStyleCopy = _assign({}, nextProp);
        } else {
          this._previousStyleCopy = null;
        }
        if (lastProp) {
          // Unset styles on `lastProp` but not on `nextProp`.
          for (styleName in lastProp) {
            if (lastProp.hasOwnProperty(styleName) && (!nextProp || !nextProp.hasOwnProperty(styleName))) {
              styleUpdates = styleUpdates || {};
              styleUpdates[styleName] = '';
            }
          }
          // Update styles that changed since `lastProp`.
          for (styleName in nextProp) {
            if (nextProp.hasOwnProperty(styleName) && lastProp[styleName] !== nextProp[styleName]) {
              styleUpdates = styleUpdates || {};
              styleUpdates[styleName] = nextProp[styleName];
            }
          }
        } else {
          // Relies on `updateStylesByID` not mutating `styleUpdates`.
          styleUpdates = nextProp;
        }
      } else if (registrationNameModules.hasOwnProperty(propKey)) {
        if (nextProp) {
          enqueuePutListener(this, propKey, nextProp, transaction);
        } else if (lastProp) {
          deleteListener(this, propKey);
        }
      } else if (isCustomComponent(this._tag, nextProps)) {
        if (!RESERVED_PROPS.hasOwnProperty(propKey)) {
          DOMPropertyOperations.setValueForAttribute(getNode(this), propKey, nextProp);
        }
      } else if (DOMProperty.properties[propKey] || DOMProperty.isCustomAttribute(propKey)) {
        var node = getNode(this);
        // If we're updating to null or undefined, we should remove the property
        // from the DOM node instead of inadvertently setting to a string. This
        // brings us in line with the same behavior we have on initial render.
        if (nextProp != null) {
          DOMPropertyOperations.setValueForProperty(node, propKey, nextProp);
        } else {
          DOMPropertyOperations.deleteValueForProperty(node, propKey);
        }
      }
    }
    if (styleUpdates) {
      CSSPropertyOperations.setValueForStyles(getNode(this), styleUpdates, this);
    }
  },

  /**
   * Reconciles the children with the various properties that affect the
   * children content.
   *
   * @param {object} lastProps
   * @param {object} nextProps
   * @param {ReactReconcileTransaction} transaction
   * @param {object} context
   */
  _updateDOMChildren: function (lastProps, nextProps, transaction, context) {
    var lastContent = CONTENT_TYPES[typeof lastProps.children] ? lastProps.children : null;
    var nextContent = CONTENT_TYPES[typeof nextProps.children] ? nextProps.children : null;

    var lastHtml = lastProps.dangerouslySetInnerHTML && lastProps.dangerouslySetInnerHTML.__html;
    var nextHtml = nextProps.dangerouslySetInnerHTML && nextProps.dangerouslySetInnerHTML.__html;

    // Note the use of `!=` which checks for null or undefined.
    var lastChildren = lastContent != null ? null : lastProps.children;
    var nextChildren = nextContent != null ? null : nextProps.children;

    // If we're switching from children to content/html or vice versa, remove
    // the old content
    var lastHasContentOrHtml = lastContent != null || lastHtml != null;
    var nextHasContentOrHtml = nextContent != null || nextHtml != null;
    if (lastChildren != null && nextChildren == null) {
      this.updateChildren(null, transaction, context);
    } else if (lastHasContentOrHtml && !nextHasContentOrHtml) {
      this.updateTextContent('');
      if (process.env.NODE_ENV !== 'production') {
        ReactInstrumentation.debugTool.onSetChildren(this._debugID, []);
      }
    }

    if (nextContent != null) {
      if (lastContent !== nextContent) {
        this.updateTextContent('' + nextContent);
        if (process.env.NODE_ENV !== 'production') {
          setAndValidateContentChildDev.call(this, nextContent);
        }
      }
    } else if (nextHtml != null) {
      if (lastHtml !== nextHtml) {
        this.updateMarkup('' + nextHtml);
      }
      if (process.env.NODE_ENV !== 'production') {
        ReactInstrumentation.debugTool.onSetChildren(this._debugID, []);
      }
    } else if (nextChildren != null) {
      if (process.env.NODE_ENV !== 'production') {
        setAndValidateContentChildDev.call(this, null);
      }

      this.updateChildren(nextChildren, transaction, context);
    }
  },

  getHostNode: function () {
    return getNode(this);
  },

  /**
   * Destroys all event registrations for this instance. Does not remove from
   * the DOM. That must be done by the parent.
   *
   * @internal
   */
  unmountComponent: function (safely) {
    switch (this._tag) {
      case 'audio':
      case 'form':
      case 'iframe':
      case 'img':
      case 'link':
      case 'object':
      case 'source':
      case 'video':
        var listeners = this._wrapperState.listeners;
        if (listeners) {
          for (var i = 0; i < listeners.length; i++) {
            listeners[i].remove();
          }
        }
        break;
      case 'input':
      case 'textarea':
        inputValueTracking.stopTracking(this);
        break;
      case 'html':
      case 'head':
      case 'body':
        /**
         * Components like <html> <head> and <body> can't be removed or added
         * easily in a cross-browser way, however it's valuable to be able to
         * take advantage of React's reconciliation for styling and <title>
         * management. So we just document it and throw in dangerous cases.
         */
         true ? process.env.NODE_ENV !== 'production' ? invariant(false, '<%s> tried to unmount. Because of cross-browser quirks it is impossible to unmount some top-level components (eg <html>, <head>, and <body>) reliably and efficiently. To fix this, have a single top-level component that never unmounts render these elements.', this._tag) : _prodInvariant('66', this._tag) : void 0;
        break;
    }

    this.unmountChildren(safely);
    ReactDOMComponentTree.uncacheNode(this);
    EventPluginHub.deleteAllListeners(this);
    this._rootNodeID = 0;
    this._domID = 0;
    this._wrapperState = null;

    if (process.env.NODE_ENV !== 'production') {
      setAndValidateContentChildDev.call(this, null);
    }
  },

  getPublicInstance: function () {
    return getNode(this);
  }
};

_assign(ReactDOMComponent.prototype, ReactDOMComponent.Mixin, ReactMultiChild.Mixin);

module.exports = ReactDOMComponent;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 226 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var ReactDOMComponentTree = __webpack_require__(8);

var focusNode = __webpack_require__(108);

var AutoFocusUtils = {
  focusDOMComponent: function () {
    focusNode(ReactDOMComponentTree.getNodeFromInstance(this));
  }
};

module.exports = AutoFocusUtils;

/***/ }),
/* 227 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var CSSProperty = __webpack_require__(109);
var ExecutionEnvironment = __webpack_require__(10);
var ReactInstrumentation = __webpack_require__(12);

var camelizeStyleName = __webpack_require__(228);
var dangerousStyleValue = __webpack_require__(230);
var hyphenateStyleName = __webpack_require__(231);
var memoizeStringOnly = __webpack_require__(233);
var warning = __webpack_require__(2);

var processStyleName = memoizeStringOnly(function (styleName) {
  return hyphenateStyleName(styleName);
});

var hasShorthandPropertyBug = false;
var styleFloatAccessor = 'cssFloat';
if (ExecutionEnvironment.canUseDOM) {
  var tempStyle = document.createElement('div').style;
  try {
    // IE8 throws "Invalid argument." if resetting shorthand style properties.
    tempStyle.font = '';
  } catch (e) {
    hasShorthandPropertyBug = true;
  }
  // IE8 only supports accessing cssFloat (standard) as styleFloat
  if (document.documentElement.style.cssFloat === undefined) {
    styleFloatAccessor = 'styleFloat';
  }
}

if (process.env.NODE_ENV !== 'production') {
  // 'msTransform' is correct, but the other prefixes should be capitalized
  var badVendoredStyleNamePattern = /^(?:webkit|moz|o)[A-Z]/;

  // style values shouldn't contain a semicolon
  var badStyleValueWithSemicolonPattern = /;\s*$/;

  var warnedStyleNames = {};
  var warnedStyleValues = {};
  var warnedForNaNValue = false;

  var warnHyphenatedStyleName = function (name, owner) {
    if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
      return;
    }

    warnedStyleNames[name] = true;
    process.env.NODE_ENV !== 'production' ? warning(false, 'Unsupported style property %s. Did you mean %s?%s', name, camelizeStyleName(name), checkRenderMessage(owner)) : void 0;
  };

  var warnBadVendoredStyleName = function (name, owner) {
    if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
      return;
    }

    warnedStyleNames[name] = true;
    process.env.NODE_ENV !== 'production' ? warning(false, 'Unsupported vendor-prefixed style property %s. Did you mean %s?%s', name, name.charAt(0).toUpperCase() + name.slice(1), checkRenderMessage(owner)) : void 0;
  };

  var warnStyleValueWithSemicolon = function (name, value, owner) {
    if (warnedStyleValues.hasOwnProperty(value) && warnedStyleValues[value]) {
      return;
    }

    warnedStyleValues[value] = true;
    process.env.NODE_ENV !== 'production' ? warning(false, "Style property values shouldn't contain a semicolon.%s " + 'Try "%s: %s" instead.', checkRenderMessage(owner), name, value.replace(badStyleValueWithSemicolonPattern, '')) : void 0;
  };

  var warnStyleValueIsNaN = function (name, value, owner) {
    if (warnedForNaNValue) {
      return;
    }

    warnedForNaNValue = true;
    process.env.NODE_ENV !== 'production' ? warning(false, '`NaN` is an invalid value for the `%s` css style property.%s', name, checkRenderMessage(owner)) : void 0;
  };

  var checkRenderMessage = function (owner) {
    if (owner) {
      var name = owner.getName();
      if (name) {
        return ' Check the render method of `' + name + '`.';
      }
    }
    return '';
  };

  /**
   * @param {string} name
   * @param {*} value
   * @param {ReactDOMComponent} component
   */
  var warnValidStyle = function (name, value, component) {
    var owner;
    if (component) {
      owner = component._currentElement._owner;
    }
    if (name.indexOf('-') > -1) {
      warnHyphenatedStyleName(name, owner);
    } else if (badVendoredStyleNamePattern.test(name)) {
      warnBadVendoredStyleName(name, owner);
    } else if (badStyleValueWithSemicolonPattern.test(value)) {
      warnStyleValueWithSemicolon(name, value, owner);
    }

    if (typeof value === 'number' && isNaN(value)) {
      warnStyleValueIsNaN(name, value, owner);
    }
  };
}

/**
 * Operations for dealing with CSS properties.
 */
var CSSPropertyOperations = {
  /**
   * Serializes a mapping of style properties for use as inline styles:
   *
   *   > createMarkupForStyles({width: '200px', height: 0})
   *   "width:200px;height:0;"
   *
   * Undefined values are ignored so that declarative programming is easier.
   * The result should be HTML-escaped before insertion into the DOM.
   *
   * @param {object} styles
   * @param {ReactDOMComponent} component
   * @return {?string}
   */
  createMarkupForStyles: function (styles, component) {
    var serialized = '';
    for (var styleName in styles) {
      if (!styles.hasOwnProperty(styleName)) {
        continue;
      }
      var isCustomProperty = styleName.indexOf('--') === 0;
      var styleValue = styles[styleName];
      if (process.env.NODE_ENV !== 'production') {
        if (!isCustomProperty) {
          warnValidStyle(styleName, styleValue, component);
        }
      }
      if (styleValue != null) {
        serialized += processStyleName(styleName) + ':';
        serialized += dangerousStyleValue(styleName, styleValue, component, isCustomProperty) + ';';
      }
    }
    return serialized || null;
  },

  /**
   * Sets the value for multiple styles on a node.  If a value is specified as
   * '' (empty string), the corresponding style property will be unset.
   *
   * @param {DOMElement} node
   * @param {object} styles
   * @param {ReactDOMComponent} component
   */
  setValueForStyles: function (node, styles, component) {
    if (process.env.NODE_ENV !== 'production') {
      ReactInstrumentation.debugTool.onHostOperation({
        instanceID: component._debugID,
        type: 'update styles',
        payload: styles
      });
    }

    var style = node.style;
    for (var styleName in styles) {
      if (!styles.hasOwnProperty(styleName)) {
        continue;
      }
      var isCustomProperty = styleName.indexOf('--') === 0;
      if (process.env.NODE_ENV !== 'production') {
        if (!isCustomProperty) {
          warnValidStyle(styleName, styles[styleName], component);
        }
      }
      var styleValue = dangerousStyleValue(styleName, styles[styleName], component, isCustomProperty);
      if (styleName === 'float' || styleName === 'cssFloat') {
        styleName = styleFloatAccessor;
      }
      if (isCustomProperty) {
        style.setProperty(styleName, styleValue);
      } else if (styleValue) {
        style[styleName] = styleValue;
      } else {
        var expansion = hasShorthandPropertyBug && CSSProperty.shorthandPropertyExpansions[styleName];
        if (expansion) {
          // Shorthand property that IE8 won't like unsetting, so unset each
          // component to placate it
          for (var individualStyleName in expansion) {
            style[individualStyleName] = '';
          }
        } else {
          style[styleName] = '';
        }
      }
    }
  }
};

module.exports = CSSPropertyOperations;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 228 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @typechecks
 */



var camelize = __webpack_require__(229);

var msPattern = /^-ms-/;

/**
 * Camelcases a hyphenated CSS property name, for example:
 *
 *   > camelizeStyleName('background-color')
 *   < "backgroundColor"
 *   > camelizeStyleName('-moz-transition')
 *   < "MozTransition"
 *   > camelizeStyleName('-ms-transition')
 *   < "msTransition"
 *
 * As Andi Smith suggests
 * (http://www.andismith.com/blog/2012/02/modernizr-prefixed/), an `-ms` prefix
 * is converted to lowercase `ms`.
 *
 * @param {string} string
 * @return {string}
 */
function camelizeStyleName(string) {
  return camelize(string.replace(msPattern, 'ms-'));
}

module.exports = camelizeStyleName;

/***/ }),
/* 229 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @typechecks
 */

var _hyphenPattern = /-(.)/g;

/**
 * Camelcases a hyphenated string, for example:
 *
 *   > camelize('background-color')
 *   < "backgroundColor"
 *
 * @param {string} string
 * @return {string}
 */
function camelize(string) {
  return string.replace(_hyphenPattern, function (_, character) {
    return character.toUpperCase();
  });
}

module.exports = camelize;

/***/ }),
/* 230 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var CSSProperty = __webpack_require__(109);
var warning = __webpack_require__(2);

var isUnitlessNumber = CSSProperty.isUnitlessNumber;
var styleWarnings = {};

/**
 * Convert a value into the proper css writable value. The style name `name`
 * should be logical (no hyphens), as specified
 * in `CSSProperty.isUnitlessNumber`.
 *
 * @param {string} name CSS property name such as `topMargin`.
 * @param {*} value CSS property value such as `10px`.
 * @param {ReactDOMComponent} component
 * @return {string} Normalized style value with dimensions applied.
 */
function dangerousStyleValue(name, value, component, isCustomProperty) {
  // Note that we've removed escapeTextForBrowser() calls here since the
  // whole string will be escaped when the attribute is injected into
  // the markup. If you provide unsafe user data here they can inject
  // arbitrary CSS which may be problematic (I couldn't repro this):
  // https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
  // http://www.thespanner.co.uk/2007/11/26/ultimate-xss-css-injection/
  // This is not an XSS hole but instead a potential CSS injection issue
  // which has lead to a greater discussion about how we're going to
  // trust URLs moving forward. See #2115901

  var isEmpty = value == null || typeof value === 'boolean' || value === '';
  if (isEmpty) {
    return '';
  }

  var isNonNumeric = isNaN(value);
  if (isCustomProperty || isNonNumeric || value === 0 || isUnitlessNumber.hasOwnProperty(name) && isUnitlessNumber[name]) {
    return '' + value; // cast to string
  }

  if (typeof value === 'string') {
    if (process.env.NODE_ENV !== 'production') {
      // Allow '0' to pass through without warning. 0 is already special and
      // doesn't require units, so we don't need to warn about it.
      if (component && value !== '0') {
        var owner = component._currentElement._owner;
        var ownerName = owner ? owner.getName() : null;
        if (ownerName && !styleWarnings[ownerName]) {
          styleWarnings[ownerName] = {};
        }
        var warned = false;
        if (ownerName) {
          var warnings = styleWarnings[ownerName];
          warned = warnings[name];
          if (!warned) {
            warnings[name] = true;
          }
        }
        if (!warned) {
          process.env.NODE_ENV !== 'production' ? warning(false, 'a `%s` tag (owner: `%s`) was passed a numeric string value ' + 'for CSS property `%s` (value: `%s`) which will be treated ' + 'as a unitless number in a future version of React.', component._currentElement.type, ownerName || 'unknown', name, value) : void 0;
        }
      }
    }
    value = value.trim();
  }
  return value + 'px';
}

module.exports = dangerousStyleValue;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 231 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @typechecks
 */



var hyphenate = __webpack_require__(232);

var msPattern = /^ms-/;

/**
 * Hyphenates a camelcased CSS property name, for example:
 *
 *   > hyphenateStyleName('backgroundColor')
 *   < "background-color"
 *   > hyphenateStyleName('MozTransition')
 *   < "-moz-transition"
 *   > hyphenateStyleName('msTransition')
 *   < "-ms-transition"
 *
 * As Modernizr suggests (http://modernizr.com/docs/#prefixed), an `ms` prefix
 * is converted to `-ms-`.
 *
 * @param {string} string
 * @return {string}
 */
function hyphenateStyleName(string) {
  return hyphenate(string).replace(msPattern, '-ms-');
}

module.exports = hyphenateStyleName;

/***/ }),
/* 232 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @typechecks
 */

var _uppercasePattern = /([A-Z])/g;

/**
 * Hyphenates a camelcased string, for example:
 *
 *   > hyphenate('backgroundColor')
 *   < "background-color"
 *
 * For CSS style names, use `hyphenateStyleName` instead which works properly
 * with all vendor prefixes, including `ms`.
 *
 * @param {string} string
 * @return {string}
 */
function hyphenate(string) {
  return string.replace(_uppercasePattern, '-$1').toLowerCase();
}

module.exports = hyphenate;

/***/ }),
/* 233 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 * @typechecks static-only
 */



/**
 * Memoizes the return value of a function that accepts one string argument.
 */

function memoizeStringOnly(callback) {
  var cache = {};
  return function (string) {
    if (!cache.hasOwnProperty(string)) {
      cache[string] = callback.call(this, string);
    }
    return cache[string];
  };
}

module.exports = memoizeStringOnly;

/***/ }),
/* 234 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var escapeTextContentForBrowser = __webpack_require__(55);

/**
 * Escapes attribute value to prevent scripting attacks.
 *
 * @param {*} value Value to escape.
 * @return {string} An escaped string.
 */
function quoteAttributeValueForBrowser(value) {
  return '"' + escapeTextContentForBrowser(value) + '"';
}

module.exports = quoteAttributeValueForBrowser;

/***/ }),
/* 235 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var EventPluginHub = __webpack_require__(41);

function runEventQueueInBatch(events) {
  EventPluginHub.enqueueEvents(events);
  EventPluginHub.processEventQueue(false);
}

var ReactEventEmitterMixin = {
  /**
   * Streams a fired top-level event to `EventPluginHub` where plugins have the
   * opportunity to create `ReactEvent`s to be dispatched.
   */
  handleTopLevel: function (topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    var events = EventPluginHub.extractEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget);
    runEventQueueInBatch(events);
  }
};

module.exports = ReactEventEmitterMixin;

/***/ }),
/* 236 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var ExecutionEnvironment = __webpack_require__(10);

/**
 * Generate a mapping of standard vendor prefixes using the defined style property and event name.
 *
 * @param {string} styleProp
 * @param {string} eventName
 * @returns {object}
 */
function makePrefixMap(styleProp, eventName) {
  var prefixes = {};

  prefixes[styleProp.toLowerCase()] = eventName.toLowerCase();
  prefixes['Webkit' + styleProp] = 'webkit' + eventName;
  prefixes['Moz' + styleProp] = 'moz' + eventName;
  prefixes['ms' + styleProp] = 'MS' + eventName;
  prefixes['O' + styleProp] = 'o' + eventName.toLowerCase();

  return prefixes;
}

/**
 * A list of event names to a configurable list of vendor prefixes.
 */
var vendorPrefixes = {
  animationend: makePrefixMap('Animation', 'AnimationEnd'),
  animationiteration: makePrefixMap('Animation', 'AnimationIteration'),
  animationstart: makePrefixMap('Animation', 'AnimationStart'),
  transitionend: makePrefixMap('Transition', 'TransitionEnd')
};

/**
 * Event names that have already been detected and prefixed (if applicable).
 */
var prefixedEventNames = {};

/**
 * Element to check for prefixes on.
 */
var style = {};

/**
 * Bootstrap if a DOM exists.
 */
if (ExecutionEnvironment.canUseDOM) {
  style = document.createElement('div').style;

  // On some platforms, in particular some releases of Android 4.x,
  // the un-prefixed "animation" and "transition" properties are defined on the
  // style object but the events that fire will still be prefixed, so we need
  // to check if the un-prefixed events are usable, and if not remove them from the map.
  if (!('AnimationEvent' in window)) {
    delete vendorPrefixes.animationend.animation;
    delete vendorPrefixes.animationiteration.animation;
    delete vendorPrefixes.animationstart.animation;
  }

  // Same as above
  if (!('TransitionEvent' in window)) {
    delete vendorPrefixes.transitionend.transition;
  }
}

/**
 * Attempts to determine the correct vendor prefixed event name.
 *
 * @param {string} eventName
 * @returns {string}
 */
function getVendorPrefixedEventName(eventName) {
  if (prefixedEventNames[eventName]) {
    return prefixedEventNames[eventName];
  } else if (!vendorPrefixes[eventName]) {
    return eventName;
  }

  var prefixMap = vendorPrefixes[eventName];

  for (var styleProp in prefixMap) {
    if (prefixMap.hasOwnProperty(styleProp) && styleProp in style) {
      return prefixedEventNames[eventName] = prefixMap[styleProp];
    }
  }

  return '';
}

module.exports = getVendorPrefixedEventName;

/***/ }),
/* 237 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _prodInvariant = __webpack_require__(4),
    _assign = __webpack_require__(7);

var DOMPropertyOperations = __webpack_require__(110);
var LinkedValueUtils = __webpack_require__(73);
var ReactDOMComponentTree = __webpack_require__(8);
var ReactUpdates = __webpack_require__(15);

var invariant = __webpack_require__(1);
var warning = __webpack_require__(2);

var didWarnValueLink = false;
var didWarnCheckedLink = false;
var didWarnValueDefaultValue = false;
var didWarnCheckedDefaultChecked = false;
var didWarnControlledToUncontrolled = false;
var didWarnUncontrolledToControlled = false;

function forceUpdateIfMounted() {
  if (this._rootNodeID) {
    // DOM component is still mounted; update
    ReactDOMInput.updateWrapper(this);
  }
}

function isControlled(props) {
  var usesChecked = props.type === 'checkbox' || props.type === 'radio';
  return usesChecked ? props.checked != null : props.value != null;
}

/**
 * Implements an <input> host component that allows setting these optional
 * props: `checked`, `value`, `defaultChecked`, and `defaultValue`.
 *
 * If `checked` or `value` are not supplied (or null/undefined), user actions
 * that affect the checked state or value will trigger updates to the element.
 *
 * If they are supplied (and not null/undefined), the rendered element will not
 * trigger updates to the element. Instead, the props must change in order for
 * the rendered element to be updated.
 *
 * The rendered element will be initialized as unchecked (or `defaultChecked`)
 * with an empty value (or `defaultValue`).
 *
 * @see http://www.w3.org/TR/2012/WD-html5-20121025/the-input-element.html
 */
var ReactDOMInput = {
  getHostProps: function (inst, props) {
    var value = LinkedValueUtils.getValue(props);
    var checked = LinkedValueUtils.getChecked(props);

    var hostProps = _assign({
      // Make sure we set .type before any other properties (setting .value
      // before .type means .value is lost in IE11 and below)
      type: undefined,
      // Make sure we set .step before .value (setting .value before .step
      // means .value is rounded on mount, based upon step precision)
      step: undefined,
      // Make sure we set .min & .max before .value (to ensure proper order
      // in corner cases such as min or max deriving from value, e.g. Issue #7170)
      min: undefined,
      max: undefined
    }, props, {
      defaultChecked: undefined,
      defaultValue: undefined,
      value: value != null ? value : inst._wrapperState.initialValue,
      checked: checked != null ? checked : inst._wrapperState.initialChecked,
      onChange: inst._wrapperState.onChange
    });

    return hostProps;
  },

  mountWrapper: function (inst, props) {
    if (process.env.NODE_ENV !== 'production') {
      LinkedValueUtils.checkPropTypes('input', props, inst._currentElement._owner);

      var owner = inst._currentElement._owner;

      if (props.valueLink !== undefined && !didWarnValueLink) {
        process.env.NODE_ENV !== 'production' ? warning(false, '`valueLink` prop on `input` is deprecated; set `value` and `onChange` instead.') : void 0;
        didWarnValueLink = true;
      }
      if (props.checkedLink !== undefined && !didWarnCheckedLink) {
        process.env.NODE_ENV !== 'production' ? warning(false, '`checkedLink` prop on `input` is deprecated; set `value` and `onChange` instead.') : void 0;
        didWarnCheckedLink = true;
      }
      if (props.checked !== undefined && props.defaultChecked !== undefined && !didWarnCheckedDefaultChecked) {
        process.env.NODE_ENV !== 'production' ? warning(false, '%s contains an input of type %s with both checked and defaultChecked props. ' + 'Input elements must be either controlled or uncontrolled ' + '(specify either the checked prop, or the defaultChecked prop, but not ' + 'both). Decide between using a controlled or uncontrolled input ' + 'element and remove one of these props. More info: ' + 'https://fb.me/react-controlled-components', owner && owner.getName() || 'A component', props.type) : void 0;
        didWarnCheckedDefaultChecked = true;
      }
      if (props.value !== undefined && props.defaultValue !== undefined && !didWarnValueDefaultValue) {
        process.env.NODE_ENV !== 'production' ? warning(false, '%s contains an input of type %s with both value and defaultValue props. ' + 'Input elements must be either controlled or uncontrolled ' + '(specify either the value prop, or the defaultValue prop, but not ' + 'both). Decide between using a controlled or uncontrolled input ' + 'element and remove one of these props. More info: ' + 'https://fb.me/react-controlled-components', owner && owner.getName() || 'A component', props.type) : void 0;
        didWarnValueDefaultValue = true;
      }
    }

    var defaultValue = props.defaultValue;
    inst._wrapperState = {
      initialChecked: props.checked != null ? props.checked : props.defaultChecked,
      initialValue: props.value != null ? props.value : defaultValue,
      listeners: null,
      onChange: _handleChange.bind(inst),
      controlled: isControlled(props)
    };
  },

  updateWrapper: function (inst) {
    var props = inst._currentElement.props;

    if (process.env.NODE_ENV !== 'production') {
      var controlled = isControlled(props);
      var owner = inst._currentElement._owner;

      if (!inst._wrapperState.controlled && controlled && !didWarnUncontrolledToControlled) {
        process.env.NODE_ENV !== 'production' ? warning(false, '%s is changing an uncontrolled input of type %s to be controlled. ' + 'Input elements should not switch from uncontrolled to controlled (or vice versa). ' + 'Decide between using a controlled or uncontrolled input ' + 'element for the lifetime of the component. More info: https://fb.me/react-controlled-components', owner && owner.getName() || 'A component', props.type) : void 0;
        didWarnUncontrolledToControlled = true;
      }
      if (inst._wrapperState.controlled && !controlled && !didWarnControlledToUncontrolled) {
        process.env.NODE_ENV !== 'production' ? warning(false, '%s is changing a controlled input of type %s to be uncontrolled. ' + 'Input elements should not switch from controlled to uncontrolled (or vice versa). ' + 'Decide between using a controlled or uncontrolled input ' + 'element for the lifetime of the component. More info: https://fb.me/react-controlled-components', owner && owner.getName() || 'A component', props.type) : void 0;
        didWarnControlledToUncontrolled = true;
      }
    }

    // TODO: Shouldn't this be getChecked(props)?
    var checked = props.checked;
    if (checked != null) {
      DOMPropertyOperations.setValueForProperty(ReactDOMComponentTree.getNodeFromInstance(inst), 'checked', checked || false);
    }

    var node = ReactDOMComponentTree.getNodeFromInstance(inst);
    var value = LinkedValueUtils.getValue(props);
    if (value != null) {
      if (value === 0 && node.value === '') {
        node.value = '0';
        // Note: IE9 reports a number inputs as 'text', so check props instead.
      } else if (props.type === 'number') {
        // Simulate `input.valueAsNumber`. IE9 does not support it
        var valueAsNumber = parseFloat(node.value, 10) || 0;

        if (
        // eslint-disable-next-line
        value != valueAsNumber ||
        // eslint-disable-next-line
        value == valueAsNumber && node.value != value) {
          // Cast `value` to a string to ensure the value is set correctly. While
          // browsers typically do this as necessary, jsdom doesn't.
          node.value = '' + value;
        }
      } else if (node.value !== '' + value) {
        // Cast `value` to a string to ensure the value is set correctly. While
        // browsers typically do this as necessary, jsdom doesn't.
        node.value = '' + value;
      }
    } else {
      if (props.value == null && props.defaultValue != null) {
        // In Chrome, assigning defaultValue to certain input types triggers input validation.
        // For number inputs, the display value loses trailing decimal points. For email inputs,
        // Chrome raises "The specified value <x> is not a valid email address".
        //
        // Here we check to see if the defaultValue has actually changed, avoiding these problems
        // when the user is inputting text
        //
        // https://github.com/facebook/react/issues/7253
        if (node.defaultValue !== '' + props.defaultValue) {
          node.defaultValue = '' + props.defaultValue;
        }
      }
      if (props.checked == null && props.defaultChecked != null) {
        node.defaultChecked = !!props.defaultChecked;
      }
    }
  },

  postMountWrapper: function (inst) {
    var props = inst._currentElement.props;

    // This is in postMount because we need access to the DOM node, which is not
    // available until after the component has mounted.
    var node = ReactDOMComponentTree.getNodeFromInstance(inst);

    // Detach value from defaultValue. We won't do anything if we're working on
    // submit or reset inputs as those values & defaultValues are linked. They
    // are not resetable nodes so this operation doesn't matter and actually
    // removes browser-default values (eg "Submit Query") when no value is
    // provided.

    switch (props.type) {
      case 'submit':
      case 'reset':
        break;
      case 'color':
      case 'date':
      case 'datetime':
      case 'datetime-local':
      case 'month':
      case 'time':
      case 'week':
        // This fixes the no-show issue on iOS Safari and Android Chrome:
        // https://github.com/facebook/react/issues/7233
        node.value = '';
        node.value = node.defaultValue;
        break;
      default:
        node.value = node.value;
        break;
    }

    // Normally, we'd just do `node.checked = node.checked` upon initial mount, less this bug
    // this is needed to work around a chrome bug where setting defaultChecked
    // will sometimes influence the value of checked (even after detachment).
    // Reference: https://bugs.chromium.org/p/chromium/issues/detail?id=608416
    // We need to temporarily unset name to avoid disrupting radio button groups.
    var name = node.name;
    if (name !== '') {
      node.name = '';
    }
    node.defaultChecked = !node.defaultChecked;
    node.defaultChecked = !node.defaultChecked;
    if (name !== '') {
      node.name = name;
    }
  }
};

function _handleChange(event) {
  var props = this._currentElement.props;

  var returnValue = LinkedValueUtils.executeOnChange(props, event);

  // Here we use asap to wait until all updates have propagated, which
  // is important when using controlled components within layers:
  // https://github.com/facebook/react/issues/1698
  ReactUpdates.asap(forceUpdateIfMounted, this);

  var name = props.name;
  if (props.type === 'radio' && name != null) {
    var rootNode = ReactDOMComponentTree.getNodeFromInstance(this);
    var queryRoot = rootNode;

    while (queryRoot.parentNode) {
      queryRoot = queryRoot.parentNode;
    }

    // If `rootNode.form` was non-null, then we could try `form.elements`,
    // but that sometimes behaves strangely in IE8. We could also try using
    // `form.getElementsByName`, but that will only return direct children
    // and won't include inputs that use the HTML5 `form=` attribute. Since
    // the input might not even be in a form, let's just use the global
    // `querySelectorAll` to ensure we don't miss anything.
    var group = queryRoot.querySelectorAll('input[name=' + JSON.stringify('' + name) + '][type="radio"]');

    for (var i = 0; i < group.length; i++) {
      var otherNode = group[i];
      if (otherNode === rootNode || otherNode.form !== rootNode.form) {
        continue;
      }
      // This will throw if radio buttons rendered by different copies of React
      // and the same name are rendered into the same form (same as #1939).
      // That's probably okay; we don't support it just as we don't support
      // mixing React radio buttons with non-React ones.
      var otherInstance = ReactDOMComponentTree.getInstanceFromNode(otherNode);
      !otherInstance ? process.env.NODE_ENV !== 'production' ? invariant(false, 'ReactDOMInput: Mixing React and non-React radio inputs with the same `name` is not supported.') : _prodInvariant('90') : void 0;
      // If this is a controlled radio button group, forcing the input that
      // was previously checked to update will cause it to be come re-checked
      // as appropriate.
      ReactUpdates.asap(forceUpdateIfMounted, otherInstance);
    }
  }

  return returnValue;
}

module.exports = ReactDOMInput;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 238 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _assign = __webpack_require__(7);

var React = __webpack_require__(31);
var ReactDOMComponentTree = __webpack_require__(8);
var ReactDOMSelect = __webpack_require__(112);

var warning = __webpack_require__(2);
var didWarnInvalidOptionChildren = false;

function flattenChildren(children) {
  var content = '';

  // Flatten children and warn if they aren't strings or numbers;
  // invalid types are ignored.
  React.Children.forEach(children, function (child) {
    if (child == null) {
      return;
    }
    if (typeof child === 'string' || typeof child === 'number') {
      content += child;
    } else if (!didWarnInvalidOptionChildren) {
      didWarnInvalidOptionChildren = true;
      process.env.NODE_ENV !== 'production' ? warning(false, 'Only strings and numbers are supported as <option> children.') : void 0;
    }
  });

  return content;
}

/**
 * Implements an <option> host component that warns when `selected` is set.
 */
var ReactDOMOption = {
  mountWrapper: function (inst, props, hostParent) {
    // TODO (yungsters): Remove support for `selected` in <option>.
    if (process.env.NODE_ENV !== 'production') {
      process.env.NODE_ENV !== 'production' ? warning(props.selected == null, 'Use the `defaultValue` or `value` props on <select> instead of ' + 'setting `selected` on <option>.') : void 0;
    }

    // Look up whether this option is 'selected'
    var selectValue = null;
    if (hostParent != null) {
      var selectParent = hostParent;

      if (selectParent._tag === 'optgroup') {
        selectParent = selectParent._hostParent;
      }

      if (selectParent != null && selectParent._tag === 'select') {
        selectValue = ReactDOMSelect.getSelectValueContext(selectParent);
      }
    }

    // If the value is null (e.g., no specified value or after initial mount)
    // or missing (e.g., for <datalist>), we don't change props.selected
    var selected = null;
    if (selectValue != null) {
      var value;
      if (props.value != null) {
        value = props.value + '';
      } else {
        value = flattenChildren(props.children);
      }
      selected = false;
      if (Array.isArray(selectValue)) {
        // multiple
        for (var i = 0; i < selectValue.length; i++) {
          if ('' + selectValue[i] === value) {
            selected = true;
            break;
          }
        }
      } else {
        selected = '' + selectValue === value;
      }
    }

    inst._wrapperState = { selected: selected };
  },

  postMountWrapper: function (inst) {
    // value="" should make a value attribute (#6219)
    var props = inst._currentElement.props;
    if (props.value != null) {
      var node = ReactDOMComponentTree.getNodeFromInstance(inst);
      node.setAttribute('value', props.value);
    }
  },

  getHostProps: function (inst, props) {
    var hostProps = _assign({ selected: undefined, children: undefined }, props);

    // Read state only from initial mount because <select> updates value
    // manually; we need the initial state only for server rendering
    if (inst._wrapperState.selected != null) {
      hostProps.selected = inst._wrapperState.selected;
    }

    var content = flattenChildren(props.children);

    if (content) {
      hostProps.children = content;
    }

    return hostProps;
  }
};

module.exports = ReactDOMOption;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 239 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _prodInvariant = __webpack_require__(4),
    _assign = __webpack_require__(7);

var LinkedValueUtils = __webpack_require__(73);
var ReactDOMComponentTree = __webpack_require__(8);
var ReactUpdates = __webpack_require__(15);

var invariant = __webpack_require__(1);
var warning = __webpack_require__(2);

var didWarnValueLink = false;
var didWarnValDefaultVal = false;

function forceUpdateIfMounted() {
  if (this._rootNodeID) {
    // DOM component is still mounted; update
    ReactDOMTextarea.updateWrapper(this);
  }
}

/**
 * Implements a <textarea> host component that allows setting `value`, and
 * `defaultValue`. This differs from the traditional DOM API because value is
 * usually set as PCDATA children.
 *
 * If `value` is not supplied (or null/undefined), user actions that affect the
 * value will trigger updates to the element.
 *
 * If `value` is supplied (and not null/undefined), the rendered element will
 * not trigger updates to the element. Instead, the `value` prop must change in
 * order for the rendered element to be updated.
 *
 * The rendered element will be initialized with an empty value, the prop
 * `defaultValue` if specified, or the children content (deprecated).
 */
var ReactDOMTextarea = {
  getHostProps: function (inst, props) {
    !(props.dangerouslySetInnerHTML == null) ? process.env.NODE_ENV !== 'production' ? invariant(false, '`dangerouslySetInnerHTML` does not make sense on <textarea>.') : _prodInvariant('91') : void 0;

    // Always set children to the same thing. In IE9, the selection range will
    // get reset if `textContent` is mutated.  We could add a check in setTextContent
    // to only set the value if/when the value differs from the node value (which would
    // completely solve this IE9 bug), but Sebastian+Ben seemed to like this solution.
    // The value can be a boolean or object so that's why it's forced to be a string.
    var hostProps = _assign({}, props, {
      value: undefined,
      defaultValue: undefined,
      children: '' + inst._wrapperState.initialValue,
      onChange: inst._wrapperState.onChange
    });

    return hostProps;
  },

  mountWrapper: function (inst, props) {
    if (process.env.NODE_ENV !== 'production') {
      LinkedValueUtils.checkPropTypes('textarea', props, inst._currentElement._owner);
      if (props.valueLink !== undefined && !didWarnValueLink) {
        process.env.NODE_ENV !== 'production' ? warning(false, '`valueLink` prop on `textarea` is deprecated; set `value` and `onChange` instead.') : void 0;
        didWarnValueLink = true;
      }
      if (props.value !== undefined && props.defaultValue !== undefined && !didWarnValDefaultVal) {
        process.env.NODE_ENV !== 'production' ? warning(false, 'Textarea elements must be either controlled or uncontrolled ' + '(specify either the value prop, or the defaultValue prop, but not ' + 'both). Decide between using a controlled or uncontrolled textarea ' + 'and remove one of these props. More info: ' + 'https://fb.me/react-controlled-components') : void 0;
        didWarnValDefaultVal = true;
      }
    }

    var value = LinkedValueUtils.getValue(props);
    var initialValue = value;

    // Only bother fetching default value if we're going to use it
    if (value == null) {
      var defaultValue = props.defaultValue;
      // TODO (yungsters): Remove support for children content in <textarea>.
      var children = props.children;
      if (children != null) {
        if (process.env.NODE_ENV !== 'production') {
          process.env.NODE_ENV !== 'production' ? warning(false, 'Use the `defaultValue` or `value` props instead of setting ' + 'children on <textarea>.') : void 0;
        }
        !(defaultValue == null) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'If you supply `defaultValue` on a <textarea>, do not pass children.') : _prodInvariant('92') : void 0;
        if (Array.isArray(children)) {
          !(children.length <= 1) ? process.env.NODE_ENV !== 'production' ? invariant(false, '<textarea> can only have at most one child.') : _prodInvariant('93') : void 0;
          children = children[0];
        }

        defaultValue = '' + children;
      }
      if (defaultValue == null) {
        defaultValue = '';
      }
      initialValue = defaultValue;
    }

    inst._wrapperState = {
      initialValue: '' + initialValue,
      listeners: null,
      onChange: _handleChange.bind(inst)
    };
  },

  updateWrapper: function (inst) {
    var props = inst._currentElement.props;

    var node = ReactDOMComponentTree.getNodeFromInstance(inst);
    var value = LinkedValueUtils.getValue(props);
    if (value != null) {
      // Cast `value` to a string to ensure the value is set correctly. While
      // browsers typically do this as necessary, jsdom doesn't.
      var newValue = '' + value;

      // To avoid side effects (such as losing text selection), only set value if changed
      if (newValue !== node.value) {
        node.value = newValue;
      }
      if (props.defaultValue == null) {
        node.defaultValue = newValue;
      }
    }
    if (props.defaultValue != null) {
      node.defaultValue = props.defaultValue;
    }
  },

  postMountWrapper: function (inst) {
    // This is in postMount because we need access to the DOM node, which is not
    // available until after the component has mounted.
    var node = ReactDOMComponentTree.getNodeFromInstance(inst);
    var textContent = node.textContent;

    // Only set node.value if textContent is equal to the expected
    // initial value. In IE10/IE11 there is a bug where the placeholder attribute
    // will populate textContent as well.
    // https://developer.microsoft.com/microsoft-edge/platform/issues/101525/
    if (textContent === inst._wrapperState.initialValue) {
      node.value = textContent;
    }
  }
};

function _handleChange(event) {
  var props = this._currentElement.props;
  var returnValue = LinkedValueUtils.executeOnChange(props, event);
  ReactUpdates.asap(forceUpdateIfMounted, this);
  return returnValue;
}

module.exports = ReactDOMTextarea;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 240 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _prodInvariant = __webpack_require__(4);

var ReactComponentEnvironment = __webpack_require__(74);
var ReactInstanceMap = __webpack_require__(43);
var ReactInstrumentation = __webpack_require__(12);

var ReactCurrentOwner = __webpack_require__(14);
var ReactReconciler = __webpack_require__(33);
var ReactChildReconciler = __webpack_require__(241);

var emptyFunction = __webpack_require__(13);
var flattenChildren = __webpack_require__(248);
var invariant = __webpack_require__(1);

/**
 * Make an update for markup to be rendered and inserted at a supplied index.
 *
 * @param {string} markup Markup that renders into an element.
 * @param {number} toIndex Destination index.
 * @private
 */
function makeInsertMarkup(markup, afterNode, toIndex) {
  // NOTE: Null values reduce hidden classes.
  return {
    type: 'INSERT_MARKUP',
    content: markup,
    fromIndex: null,
    fromNode: null,
    toIndex: toIndex,
    afterNode: afterNode
  };
}

/**
 * Make an update for moving an existing element to another index.
 *
 * @param {number} fromIndex Source index of the existing element.
 * @param {number} toIndex Destination index of the element.
 * @private
 */
function makeMove(child, afterNode, toIndex) {
  // NOTE: Null values reduce hidden classes.
  return {
    type: 'MOVE_EXISTING',
    content: null,
    fromIndex: child._mountIndex,
    fromNode: ReactReconciler.getHostNode(child),
    toIndex: toIndex,
    afterNode: afterNode
  };
}

/**
 * Make an update for removing an element at an index.
 *
 * @param {number} fromIndex Index of the element to remove.
 * @private
 */
function makeRemove(child, node) {
  // NOTE: Null values reduce hidden classes.
  return {
    type: 'REMOVE_NODE',
    content: null,
    fromIndex: child._mountIndex,
    fromNode: node,
    toIndex: null,
    afterNode: null
  };
}

/**
 * Make an update for setting the markup of a node.
 *
 * @param {string} markup Markup that renders into an element.
 * @private
 */
function makeSetMarkup(markup) {
  // NOTE: Null values reduce hidden classes.
  return {
    type: 'SET_MARKUP',
    content: markup,
    fromIndex: null,
    fromNode: null,
    toIndex: null,
    afterNode: null
  };
}

/**
 * Make an update for setting the text content.
 *
 * @param {string} textContent Text content to set.
 * @private
 */
function makeTextContent(textContent) {
  // NOTE: Null values reduce hidden classes.
  return {
    type: 'TEXT_CONTENT',
    content: textContent,
    fromIndex: null,
    fromNode: null,
    toIndex: null,
    afterNode: null
  };
}

/**
 * Push an update, if any, onto the queue. Creates a new queue if none is
 * passed and always returns the queue. Mutative.
 */
function enqueue(queue, update) {
  if (update) {
    queue = queue || [];
    queue.push(update);
  }
  return queue;
}

/**
 * Processes any enqueued updates.
 *
 * @private
 */
function processQueue(inst, updateQueue) {
  ReactComponentEnvironment.processChildrenUpdates(inst, updateQueue);
}

var setChildrenForInstrumentation = emptyFunction;
if (process.env.NODE_ENV !== 'production') {
  var getDebugID = function (inst) {
    if (!inst._debugID) {
      // Check for ART-like instances. TODO: This is silly/gross.
      var internal;
      if (internal = ReactInstanceMap.get(inst)) {
        inst = internal;
      }
    }
    return inst._debugID;
  };
  setChildrenForInstrumentation = function (children) {
    var debugID = getDebugID(this);
    // TODO: React Native empty components are also multichild.
    // This means they still get into this method but don't have _debugID.
    if (debugID !== 0) {
      ReactInstrumentation.debugTool.onSetChildren(debugID, children ? Object.keys(children).map(function (key) {
        return children[key]._debugID;
      }) : []);
    }
  };
}

/**
 * ReactMultiChild are capable of reconciling multiple children.
 *
 * @class ReactMultiChild
 * @internal
 */
var ReactMultiChild = {
  /**
   * Provides common functionality for components that must reconcile multiple
   * children. This is used by `ReactDOMComponent` to mount, update, and
   * unmount child components.
   *
   * @lends {ReactMultiChild.prototype}
   */
  Mixin: {
    _reconcilerInstantiateChildren: function (nestedChildren, transaction, context) {
      if (process.env.NODE_ENV !== 'production') {
        var selfDebugID = getDebugID(this);
        if (this._currentElement) {
          try {
            ReactCurrentOwner.current = this._currentElement._owner;
            return ReactChildReconciler.instantiateChildren(nestedChildren, transaction, context, selfDebugID);
          } finally {
            ReactCurrentOwner.current = null;
          }
        }
      }
      return ReactChildReconciler.instantiateChildren(nestedChildren, transaction, context);
    },

    _reconcilerUpdateChildren: function (prevChildren, nextNestedChildrenElements, mountImages, removedNodes, transaction, context) {
      var nextChildren;
      var selfDebugID = 0;
      if (process.env.NODE_ENV !== 'production') {
        selfDebugID = getDebugID(this);
        if (this._currentElement) {
          try {
            ReactCurrentOwner.current = this._currentElement._owner;
            nextChildren = flattenChildren(nextNestedChildrenElements, selfDebugID);
          } finally {
            ReactCurrentOwner.current = null;
          }
          ReactChildReconciler.updateChildren(prevChildren, nextChildren, mountImages, removedNodes, transaction, this, this._hostContainerInfo, context, selfDebugID);
          return nextChildren;
        }
      }
      nextChildren = flattenChildren(nextNestedChildrenElements, selfDebugID);
      ReactChildReconciler.updateChildren(prevChildren, nextChildren, mountImages, removedNodes, transaction, this, this._hostContainerInfo, context, selfDebugID);
      return nextChildren;
    },

    /**
     * Generates a "mount image" for each of the supplied children. In the case
     * of `ReactDOMComponent`, a mount image is a string of markup.
     *
     * @param {?object} nestedChildren Nested child maps.
     * @return {array} An array of mounted representations.
     * @internal
     */
    mountChildren: function (nestedChildren, transaction, context) {
      var children = this._reconcilerInstantiateChildren(nestedChildren, transaction, context);
      this._renderedChildren = children;

      var mountImages = [];
      var index = 0;
      for (var name in children) {
        if (children.hasOwnProperty(name)) {
          var child = children[name];
          var selfDebugID = 0;
          if (process.env.NODE_ENV !== 'production') {
            selfDebugID = getDebugID(this);
          }
          var mountImage = ReactReconciler.mountComponent(child, transaction, this, this._hostContainerInfo, context, selfDebugID);
          child._mountIndex = index++;
          mountImages.push(mountImage);
        }
      }

      if (process.env.NODE_ENV !== 'production') {
        setChildrenForInstrumentation.call(this, children);
      }

      return mountImages;
    },

    /**
     * Replaces any rendered children with a text content string.
     *
     * @param {string} nextContent String of content.
     * @internal
     */
    updateTextContent: function (nextContent) {
      var prevChildren = this._renderedChildren;
      // Remove any rendered children.
      ReactChildReconciler.unmountChildren(prevChildren, false);
      for (var name in prevChildren) {
        if (prevChildren.hasOwnProperty(name)) {
           true ? process.env.NODE_ENV !== 'production' ? invariant(false, 'updateTextContent called on non-empty component.') : _prodInvariant('118') : void 0;
        }
      }
      // Set new text content.
      var updates = [makeTextContent(nextContent)];
      processQueue(this, updates);
    },

    /**
     * Replaces any rendered children with a markup string.
     *
     * @param {string} nextMarkup String of markup.
     * @internal
     */
    updateMarkup: function (nextMarkup) {
      var prevChildren = this._renderedChildren;
      // Remove any rendered children.
      ReactChildReconciler.unmountChildren(prevChildren, false);
      for (var name in prevChildren) {
        if (prevChildren.hasOwnProperty(name)) {
           true ? process.env.NODE_ENV !== 'production' ? invariant(false, 'updateTextContent called on non-empty component.') : _prodInvariant('118') : void 0;
        }
      }
      var updates = [makeSetMarkup(nextMarkup)];
      processQueue(this, updates);
    },

    /**
     * Updates the rendered children with new children.
     *
     * @param {?object} nextNestedChildrenElements Nested child element maps.
     * @param {ReactReconcileTransaction} transaction
     * @internal
     */
    updateChildren: function (nextNestedChildrenElements, transaction, context) {
      // Hook used by React ART
      this._updateChildren(nextNestedChildrenElements, transaction, context);
    },

    /**
     * @param {?object} nextNestedChildrenElements Nested child element maps.
     * @param {ReactReconcileTransaction} transaction
     * @final
     * @protected
     */
    _updateChildren: function (nextNestedChildrenElements, transaction, context) {
      var prevChildren = this._renderedChildren;
      var removedNodes = {};
      var mountImages = [];
      var nextChildren = this._reconcilerUpdateChildren(prevChildren, nextNestedChildrenElements, mountImages, removedNodes, transaction, context);
      if (!nextChildren && !prevChildren) {
        return;
      }
      var updates = null;
      var name;
      // `nextIndex` will increment for each child in `nextChildren`, but
      // `lastIndex` will be the last index visited in `prevChildren`.
      var nextIndex = 0;
      var lastIndex = 0;
      // `nextMountIndex` will increment for each newly mounted child.
      var nextMountIndex = 0;
      var lastPlacedNode = null;
      for (name in nextChildren) {
        if (!nextChildren.hasOwnProperty(name)) {
          continue;
        }
        var prevChild = prevChildren && prevChildren[name];
        var nextChild = nextChildren[name];
        if (prevChild === nextChild) {
          updates = enqueue(updates, this.moveChild(prevChild, lastPlacedNode, nextIndex, lastIndex));
          lastIndex = Math.max(prevChild._mountIndex, lastIndex);
          prevChild._mountIndex = nextIndex;
        } else {
          if (prevChild) {
            // Update `lastIndex` before `_mountIndex` gets unset by unmounting.
            lastIndex = Math.max(prevChild._mountIndex, lastIndex);
            // The `removedNodes` loop below will actually remove the child.
          }
          // The child must be instantiated before it's mounted.
          updates = enqueue(updates, this._mountChildAtIndex(nextChild, mountImages[nextMountIndex], lastPlacedNode, nextIndex, transaction, context));
          nextMountIndex++;
        }
        nextIndex++;
        lastPlacedNode = ReactReconciler.getHostNode(nextChild);
      }
      // Remove children that are no longer present.
      for (name in removedNodes) {
        if (removedNodes.hasOwnProperty(name)) {
          updates = enqueue(updates, this._unmountChild(prevChildren[name], removedNodes[name]));
        }
      }
      if (updates) {
        processQueue(this, updates);
      }
      this._renderedChildren = nextChildren;

      if (process.env.NODE_ENV !== 'production') {
        setChildrenForInstrumentation.call(this, nextChildren);
      }
    },

    /**
     * Unmounts all rendered children. This should be used to clean up children
     * when this component is unmounted. It does not actually perform any
     * backend operations.
     *
     * @internal
     */
    unmountChildren: function (safely) {
      var renderedChildren = this._renderedChildren;
      ReactChildReconciler.unmountChildren(renderedChildren, safely);
      this._renderedChildren = null;
    },

    /**
     * Moves a child component to the supplied index.
     *
     * @param {ReactComponent} child Component to move.
     * @param {number} toIndex Destination index of the element.
     * @param {number} lastIndex Last index visited of the siblings of `child`.
     * @protected
     */
    moveChild: function (child, afterNode, toIndex, lastIndex) {
      // If the index of `child` is less than `lastIndex`, then it needs to
      // be moved. Otherwise, we do not need to move it because a child will be
      // inserted or moved before `child`.
      if (child._mountIndex < lastIndex) {
        return makeMove(child, afterNode, toIndex);
      }
    },

    /**
     * Creates a child component.
     *
     * @param {ReactComponent} child Component to create.
     * @param {string} mountImage Markup to insert.
     * @protected
     */
    createChild: function (child, afterNode, mountImage) {
      return makeInsertMarkup(mountImage, afterNode, child._mountIndex);
    },

    /**
     * Removes a child component.
     *
     * @param {ReactComponent} child Child to remove.
     * @protected
     */
    removeChild: function (child, node) {
      return makeRemove(child, node);
    },

    /**
     * Mounts a child with the supplied name.
     *
     * NOTE: This is part of `updateChildren` and is here for readability.
     *
     * @param {ReactComponent} child Component to mount.
     * @param {string} name Name of the child.
     * @param {number} index Index at which to insert the child.
     * @param {ReactReconcileTransaction} transaction
     * @private
     */
    _mountChildAtIndex: function (child, mountImage, afterNode, index, transaction, context) {
      child._mountIndex = index;
      return this.createChild(child, afterNode, mountImage);
    },

    /**
     * Unmounts a rendered child.
     *
     * NOTE: This is part of `updateChildren` and is here for readability.
     *
     * @param {ReactComponent} child Component to unmount.
     * @private
     */
    _unmountChild: function (child, node) {
      var update = this.removeChild(child, node);
      child._mountIndex = null;
      return update;
    }
  }
};

module.exports = ReactMultiChild;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 241 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var ReactReconciler = __webpack_require__(33);

var instantiateReactComponent = __webpack_require__(113);
var KeyEscapeUtils = __webpack_require__(77);
var shouldUpdateReactComponent = __webpack_require__(76);
var traverseAllChildren = __webpack_require__(117);
var warning = __webpack_require__(2);

var ReactComponentTreeHook;

if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
  // Temporary hack.
  // Inline requires don't work well with Jest:
  // https://github.com/facebook/react/issues/7240
  // Remove the inline requires when we don't need them anymore:
  // https://github.com/facebook/react/pull/7178
  ReactComponentTreeHook = __webpack_require__(11);
}

function instantiateChild(childInstances, child, name, selfDebugID) {
  // We found a component instance.
  var keyUnique = childInstances[name] === undefined;
  if (process.env.NODE_ENV !== 'production') {
    if (!ReactComponentTreeHook) {
      ReactComponentTreeHook = __webpack_require__(11);
    }
    if (!keyUnique) {
      process.env.NODE_ENV !== 'production' ? warning(false, 'flattenChildren(...): Encountered two children with the same key, ' + '`%s`. Child keys must be unique; when two children share a key, only ' + 'the first child will be used.%s', KeyEscapeUtils.unescape(name), ReactComponentTreeHook.getStackAddendumByID(selfDebugID)) : void 0;
    }
  }
  if (child != null && keyUnique) {
    childInstances[name] = instantiateReactComponent(child, true);
  }
}

/**
 * ReactChildReconciler provides helpers for initializing or updating a set of
 * children. Its output is suitable for passing it onto ReactMultiChild which
 * does diffed reordering and insertion.
 */
var ReactChildReconciler = {
  /**
   * Generates a "mount image" for each of the supplied children. In the case
   * of `ReactDOMComponent`, a mount image is a string of markup.
   *
   * @param {?object} nestedChildNodes Nested child maps.
   * @return {?object} A set of child instances.
   * @internal
   */
  instantiateChildren: function (nestedChildNodes, transaction, context, selfDebugID) // 0 in production and for roots
  {
    if (nestedChildNodes == null) {
      return null;
    }
    var childInstances = {};

    if (process.env.NODE_ENV !== 'production') {
      traverseAllChildren(nestedChildNodes, function (childInsts, child, name) {
        return instantiateChild(childInsts, child, name, selfDebugID);
      }, childInstances);
    } else {
      traverseAllChildren(nestedChildNodes, instantiateChild, childInstances);
    }
    return childInstances;
  },

  /**
   * Updates the rendered children and returns a new set of children.
   *
   * @param {?object} prevChildren Previously initialized set of children.
   * @param {?object} nextChildren Flat child element maps.
   * @param {ReactReconcileTransaction} transaction
   * @param {object} context
   * @return {?object} A new set of child instances.
   * @internal
   */
  updateChildren: function (prevChildren, nextChildren, mountImages, removedNodes, transaction, hostParent, hostContainerInfo, context, selfDebugID) // 0 in production and for roots
  {
    // We currently don't have a way to track moves here but if we use iterators
    // instead of for..in we can zip the iterators and check if an item has
    // moved.
    // TODO: If nothing has changed, return the prevChildren object so that we
    // can quickly bailout if nothing has changed.
    if (!nextChildren && !prevChildren) {
      return;
    }
    var name;
    var prevChild;
    for (name in nextChildren) {
      if (!nextChildren.hasOwnProperty(name)) {
        continue;
      }
      prevChild = prevChildren && prevChildren[name];
      var prevElement = prevChild && prevChild._currentElement;
      var nextElement = nextChildren[name];
      if (prevChild != null && shouldUpdateReactComponent(prevElement, nextElement)) {
        ReactReconciler.receiveComponent(prevChild, nextElement, transaction, context);
        nextChildren[name] = prevChild;
      } else {
        if (prevChild) {
          removedNodes[name] = ReactReconciler.getHostNode(prevChild);
          ReactReconciler.unmountComponent(prevChild, false);
        }
        // The child must be instantiated before it's mounted.
        var nextChildInstance = instantiateReactComponent(nextElement, true);
        nextChildren[name] = nextChildInstance;
        // Creating mount image now ensures refs are resolved in right order
        // (see https://github.com/facebook/react/pull/7101 for explanation).
        var nextChildMountImage = ReactReconciler.mountComponent(nextChildInstance, transaction, hostParent, hostContainerInfo, context, selfDebugID);
        mountImages.push(nextChildMountImage);
      }
    }
    // Unmount children that are no longer present.
    for (name in prevChildren) {
      if (prevChildren.hasOwnProperty(name) && !(nextChildren && nextChildren.hasOwnProperty(name))) {
        prevChild = prevChildren[name];
        removedNodes[name] = ReactReconciler.getHostNode(prevChild);
        ReactReconciler.unmountComponent(prevChild, false);
      }
    }
  },

  /**
   * Unmounts all rendered children. This should be used to clean up children
   * when this component is unmounted.
   *
   * @param {?object} renderedChildren Previously initialized set of children.
   * @internal
   */
  unmountChildren: function (renderedChildren, safely) {
    for (var name in renderedChildren) {
      if (renderedChildren.hasOwnProperty(name)) {
        var renderedChild = renderedChildren[name];
        ReactReconciler.unmountComponent(renderedChild, safely);
      }
    }
  }
};

module.exports = ReactChildReconciler;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 242 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _prodInvariant = __webpack_require__(4),
    _assign = __webpack_require__(7);

var React = __webpack_require__(31);
var ReactComponentEnvironment = __webpack_require__(74);
var ReactCurrentOwner = __webpack_require__(14);
var ReactErrorUtils = __webpack_require__(66);
var ReactInstanceMap = __webpack_require__(43);
var ReactInstrumentation = __webpack_require__(12);
var ReactNodeTypes = __webpack_require__(114);
var ReactReconciler = __webpack_require__(33);

if (process.env.NODE_ENV !== 'production') {
  var checkReactTypeSpec = __webpack_require__(243);
}

var emptyObject = __webpack_require__(49);
var invariant = __webpack_require__(1);
var shallowEqual = __webpack_require__(75);
var shouldUpdateReactComponent = __webpack_require__(76);
var warning = __webpack_require__(2);

var CompositeTypes = {
  ImpureClass: 0,
  PureClass: 1,
  StatelessFunctional: 2
};

function StatelessComponent(Component) {}
StatelessComponent.prototype.render = function () {
  var Component = ReactInstanceMap.get(this)._currentElement.type;
  var element = Component(this.props, this.context, this.updater);
  warnIfInvalidElement(Component, element);
  return element;
};

function warnIfInvalidElement(Component, element) {
  if (process.env.NODE_ENV !== 'production') {
    process.env.NODE_ENV !== 'production' ? warning(element === null || element === false || React.isValidElement(element), '%s(...): A valid React element (or null) must be returned. You may have ' + 'returned undefined, an array or some other invalid object.', Component.displayName || Component.name || 'Component') : void 0;
    process.env.NODE_ENV !== 'production' ? warning(!Component.childContextTypes, '%s(...): childContextTypes cannot be defined on a functional component.', Component.displayName || Component.name || 'Component') : void 0;
  }
}

function shouldConstruct(Component) {
  return !!(Component.prototype && Component.prototype.isReactComponent);
}

function isPureComponent(Component) {
  return !!(Component.prototype && Component.prototype.isPureReactComponent);
}

// Separated into a function to contain deoptimizations caused by try/finally.
function measureLifeCyclePerf(fn, debugID, timerType) {
  if (debugID === 0) {
    // Top-level wrappers (see ReactMount) and empty components (see
    // ReactDOMEmptyComponent) are invisible to hooks and devtools.
    // Both are implementation details that should go away in the future.
    return fn();
  }

  ReactInstrumentation.debugTool.onBeginLifeCycleTimer(debugID, timerType);
  try {
    return fn();
  } finally {
    ReactInstrumentation.debugTool.onEndLifeCycleTimer(debugID, timerType);
  }
}

/**
 * ------------------ The Life-Cycle of a Composite Component ------------------
 *
 * - constructor: Initialization of state. The instance is now retained.
 *   - componentWillMount
 *   - render
 *   - [children's constructors]
 *     - [children's componentWillMount and render]
 *     - [children's componentDidMount]
 *     - componentDidMount
 *
 *       Update Phases:
 *       - componentWillReceiveProps (only called if parent updated)
 *       - shouldComponentUpdate
 *         - componentWillUpdate
 *           - render
 *           - [children's constructors or receive props phases]
 *         - componentDidUpdate
 *
 *     - componentWillUnmount
 *     - [children's componentWillUnmount]
 *   - [children destroyed]
 * - (destroyed): The instance is now blank, released by React and ready for GC.
 *
 * -----------------------------------------------------------------------------
 */

/**
 * An incrementing ID assigned to each component when it is mounted. This is
 * used to enforce the order in which `ReactUpdates` updates dirty components.
 *
 * @private
 */
var nextMountID = 1;

/**
 * @lends {ReactCompositeComponent.prototype}
 */
var ReactCompositeComponent = {
  /**
   * Base constructor for all composite component.
   *
   * @param {ReactElement} element
   * @final
   * @internal
   */
  construct: function (element) {
    this._currentElement = element;
    this._rootNodeID = 0;
    this._compositeType = null;
    this._instance = null;
    this._hostParent = null;
    this._hostContainerInfo = null;

    // See ReactUpdateQueue
    this._updateBatchNumber = null;
    this._pendingElement = null;
    this._pendingStateQueue = null;
    this._pendingReplaceState = false;
    this._pendingForceUpdate = false;

    this._renderedNodeType = null;
    this._renderedComponent = null;
    this._context = null;
    this._mountOrder = 0;
    this._topLevelWrapper = null;

    // See ReactUpdates and ReactUpdateQueue.
    this._pendingCallbacks = null;

    // ComponentWillUnmount shall only be called once
    this._calledComponentWillUnmount = false;

    if (process.env.NODE_ENV !== 'production') {
      this._warnedAboutRefsInRender = false;
    }
  },

  /**
   * Initializes the component, renders markup, and registers event listeners.
   *
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @param {?object} hostParent
   * @param {?object} hostContainerInfo
   * @param {?object} context
   * @return {?string} Rendered markup to be inserted into the DOM.
   * @final
   * @internal
   */
  mountComponent: function (transaction, hostParent, hostContainerInfo, context) {
    var _this = this;

    this._context = context;
    this._mountOrder = nextMountID++;
    this._hostParent = hostParent;
    this._hostContainerInfo = hostContainerInfo;

    var publicProps = this._currentElement.props;
    var publicContext = this._processContext(context);

    var Component = this._currentElement.type;

    var updateQueue = transaction.getUpdateQueue();

    // Initialize the public class
    var doConstruct = shouldConstruct(Component);
    var inst = this._constructComponent(doConstruct, publicProps, publicContext, updateQueue);
    var renderedElement;

    // Support functional components
    if (!doConstruct && (inst == null || inst.render == null)) {
      renderedElement = inst;
      warnIfInvalidElement(Component, renderedElement);
      !(inst === null || inst === false || React.isValidElement(inst)) ? process.env.NODE_ENV !== 'production' ? invariant(false, '%s(...): A valid React element (or null) must be returned. You may have returned undefined, an array or some other invalid object.', Component.displayName || Component.name || 'Component') : _prodInvariant('105', Component.displayName || Component.name || 'Component') : void 0;
      inst = new StatelessComponent(Component);
      this._compositeType = CompositeTypes.StatelessFunctional;
    } else {
      if (isPureComponent(Component)) {
        this._compositeType = CompositeTypes.PureClass;
      } else {
        this._compositeType = CompositeTypes.ImpureClass;
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      // This will throw later in _renderValidatedComponent, but add an early
      // warning now to help debugging
      if (inst.render == null) {
        process.env.NODE_ENV !== 'production' ? warning(false, '%s(...): No `render` method found on the returned component ' + 'instance: you may have forgotten to define `render`.', Component.displayName || Component.name || 'Component') : void 0;
      }

      var propsMutated = inst.props !== publicProps;
      var componentName = Component.displayName || Component.name || 'Component';

      process.env.NODE_ENV !== 'production' ? warning(inst.props === undefined || !propsMutated, '%s(...): When calling super() in `%s`, make sure to pass ' + "up the same props that your component's constructor was passed.", componentName, componentName) : void 0;
    }

    // These should be set up in the constructor, but as a convenience for
    // simpler class abstractions, we set them up after the fact.
    inst.props = publicProps;
    inst.context = publicContext;
    inst.refs = emptyObject;
    inst.updater = updateQueue;

    this._instance = inst;

    // Store a reference from the instance back to the internal representation
    ReactInstanceMap.set(inst, this);

    if (process.env.NODE_ENV !== 'production') {
      // Since plain JS classes are defined without any special initialization
      // logic, we can not catch common errors early. Therefore, we have to
      // catch them here, at initialization time, instead.
      process.env.NODE_ENV !== 'production' ? warning(!inst.getInitialState || inst.getInitialState.isReactClassApproved || inst.state, 'getInitialState was defined on %s, a plain JavaScript class. ' + 'This is only supported for classes created using React.createClass. ' + 'Did you mean to define a state property instead?', this.getName() || 'a component') : void 0;
      process.env.NODE_ENV !== 'production' ? warning(!inst.getDefaultProps || inst.getDefaultProps.isReactClassApproved, 'getDefaultProps was defined on %s, a plain JavaScript class. ' + 'This is only supported for classes created using React.createClass. ' + 'Use a static property to define defaultProps instead.', this.getName() || 'a component') : void 0;
      process.env.NODE_ENV !== 'production' ? warning(!inst.propTypes, 'propTypes was defined as an instance property on %s. Use a static ' + 'property to define propTypes instead.', this.getName() || 'a component') : void 0;
      process.env.NODE_ENV !== 'production' ? warning(!inst.contextTypes, 'contextTypes was defined as an instance property on %s. Use a ' + 'static property to define contextTypes instead.', this.getName() || 'a component') : void 0;
      process.env.NODE_ENV !== 'production' ? warning(typeof inst.componentShouldUpdate !== 'function', '%s has a method called ' + 'componentShouldUpdate(). Did you mean shouldComponentUpdate()? ' + 'The name is phrased as a question because the function is ' + 'expected to return a value.', this.getName() || 'A component') : void 0;
      process.env.NODE_ENV !== 'production' ? warning(typeof inst.componentDidUnmount !== 'function', '%s has a method called ' + 'componentDidUnmount(). But there is no such lifecycle method. ' + 'Did you mean componentWillUnmount()?', this.getName() || 'A component') : void 0;
      process.env.NODE_ENV !== 'production' ? warning(typeof inst.componentWillRecieveProps !== 'function', '%s has a method called ' + 'componentWillRecieveProps(). Did you mean componentWillReceiveProps()?', this.getName() || 'A component') : void 0;
    }

    var initialState = inst.state;
    if (initialState === undefined) {
      inst.state = initialState = null;
    }
    !(typeof initialState === 'object' && !Array.isArray(initialState)) ? process.env.NODE_ENV !== 'production' ? invariant(false, '%s.state: must be set to an object or null', this.getName() || 'ReactCompositeComponent') : _prodInvariant('106', this.getName() || 'ReactCompositeComponent') : void 0;

    this._pendingStateQueue = null;
    this._pendingReplaceState = false;
    this._pendingForceUpdate = false;

    var markup;
    if (inst.unstable_handleError) {
      markup = this.performInitialMountWithErrorHandling(renderedElement, hostParent, hostContainerInfo, transaction, context);
    } else {
      markup = this.performInitialMount(renderedElement, hostParent, hostContainerInfo, transaction, context);
    }

    if (inst.componentDidMount) {
      if (process.env.NODE_ENV !== 'production') {
        transaction.getReactMountReady().enqueue(function () {
          measureLifeCyclePerf(function () {
            return inst.componentDidMount();
          }, _this._debugID, 'componentDidMount');
        });
      } else {
        transaction.getReactMountReady().enqueue(inst.componentDidMount, inst);
      }
    }

    return markup;
  },

  _constructComponent: function (doConstruct, publicProps, publicContext, updateQueue) {
    if (process.env.NODE_ENV !== 'production') {
      ReactCurrentOwner.current = this;
      try {
        return this._constructComponentWithoutOwner(doConstruct, publicProps, publicContext, updateQueue);
      } finally {
        ReactCurrentOwner.current = null;
      }
    } else {
      return this._constructComponentWithoutOwner(doConstruct, publicProps, publicContext, updateQueue);
    }
  },

  _constructComponentWithoutOwner: function (doConstruct, publicProps, publicContext, updateQueue) {
    var Component = this._currentElement.type;

    if (doConstruct) {
      if (process.env.NODE_ENV !== 'production') {
        return measureLifeCyclePerf(function () {
          return new Component(publicProps, publicContext, updateQueue);
        }, this._debugID, 'ctor');
      } else {
        return new Component(publicProps, publicContext, updateQueue);
      }
    }

    // This can still be an instance in case of factory components
    // but we'll count this as time spent rendering as the more common case.
    if (process.env.NODE_ENV !== 'production') {
      return measureLifeCyclePerf(function () {
        return Component(publicProps, publicContext, updateQueue);
      }, this._debugID, 'render');
    } else {
      return Component(publicProps, publicContext, updateQueue);
    }
  },

  performInitialMountWithErrorHandling: function (renderedElement, hostParent, hostContainerInfo, transaction, context) {
    var markup;
    var checkpoint = transaction.checkpoint();
    try {
      markup = this.performInitialMount(renderedElement, hostParent, hostContainerInfo, transaction, context);
    } catch (e) {
      // Roll back to checkpoint, handle error (which may add items to the transaction), and take a new checkpoint
      transaction.rollback(checkpoint);
      this._instance.unstable_handleError(e);
      if (this._pendingStateQueue) {
        this._instance.state = this._processPendingState(this._instance.props, this._instance.context);
      }
      checkpoint = transaction.checkpoint();

      this._renderedComponent.unmountComponent(true);
      transaction.rollback(checkpoint);

      // Try again - we've informed the component about the error, so they can render an error message this time.
      // If this throws again, the error will bubble up (and can be caught by a higher error boundary).
      markup = this.performInitialMount(renderedElement, hostParent, hostContainerInfo, transaction, context);
    }
    return markup;
  },

  performInitialMount: function (renderedElement, hostParent, hostContainerInfo, transaction, context) {
    var inst = this._instance;

    var debugID = 0;
    if (process.env.NODE_ENV !== 'production') {
      debugID = this._debugID;
    }

    if (inst.componentWillMount) {
      if (process.env.NODE_ENV !== 'production') {
        measureLifeCyclePerf(function () {
          return inst.componentWillMount();
        }, debugID, 'componentWillMount');
      } else {
        inst.componentWillMount();
      }
      // When mounting, calls to `setState` by `componentWillMount` will set
      // `this._pendingStateQueue` without triggering a re-render.
      if (this._pendingStateQueue) {
        inst.state = this._processPendingState(inst.props, inst.context);
      }
    }

    // If not a stateless component, we now render
    if (renderedElement === undefined) {
      renderedElement = this._renderValidatedComponent();
    }

    var nodeType = ReactNodeTypes.getType(renderedElement);
    this._renderedNodeType = nodeType;
    var child = this._instantiateReactComponent(renderedElement, nodeType !== ReactNodeTypes.EMPTY /* shouldHaveDebugID */
    );
    this._renderedComponent = child;

    var markup = ReactReconciler.mountComponent(child, transaction, hostParent, hostContainerInfo, this._processChildContext(context), debugID);

    if (process.env.NODE_ENV !== 'production') {
      if (debugID !== 0) {
        var childDebugIDs = child._debugID !== 0 ? [child._debugID] : [];
        ReactInstrumentation.debugTool.onSetChildren(debugID, childDebugIDs);
      }
    }

    return markup;
  },

  getHostNode: function () {
    return ReactReconciler.getHostNode(this._renderedComponent);
  },

  /**
   * Releases any resources allocated by `mountComponent`.
   *
   * @final
   * @internal
   */
  unmountComponent: function (safely) {
    if (!this._renderedComponent) {
      return;
    }

    var inst = this._instance;

    if (inst.componentWillUnmount && !inst._calledComponentWillUnmount) {
      inst._calledComponentWillUnmount = true;

      if (safely) {
        var name = this.getName() + '.componentWillUnmount()';
        ReactErrorUtils.invokeGuardedCallback(name, inst.componentWillUnmount.bind(inst));
      } else {
        if (process.env.NODE_ENV !== 'production') {
          measureLifeCyclePerf(function () {
            return inst.componentWillUnmount();
          }, this._debugID, 'componentWillUnmount');
        } else {
          inst.componentWillUnmount();
        }
      }
    }

    if (this._renderedComponent) {
      ReactReconciler.unmountComponent(this._renderedComponent, safely);
      this._renderedNodeType = null;
      this._renderedComponent = null;
      this._instance = null;
    }

    // Reset pending fields
    // Even if this component is scheduled for another update in ReactUpdates,
    // it would still be ignored because these fields are reset.
    this._pendingStateQueue = null;
    this._pendingReplaceState = false;
    this._pendingForceUpdate = false;
    this._pendingCallbacks = null;
    this._pendingElement = null;

    // These fields do not really need to be reset since this object is no
    // longer accessible.
    this._context = null;
    this._rootNodeID = 0;
    this._topLevelWrapper = null;

    // Delete the reference from the instance to this internal representation
    // which allow the internals to be properly cleaned up even if the user
    // leaks a reference to the public instance.
    ReactInstanceMap.remove(inst);

    // Some existing components rely on inst.props even after they've been
    // destroyed (in event handlers).
    // TODO: inst.props = null;
    // TODO: inst.state = null;
    // TODO: inst.context = null;
  },

  /**
   * Filters the context object to only contain keys specified in
   * `contextTypes`
   *
   * @param {object} context
   * @return {?object}
   * @private
   */
  _maskContext: function (context) {
    var Component = this._currentElement.type;
    var contextTypes = Component.contextTypes;
    if (!contextTypes) {
      return emptyObject;
    }
    var maskedContext = {};
    for (var contextName in contextTypes) {
      maskedContext[contextName] = context[contextName];
    }
    return maskedContext;
  },

  /**
   * Filters the context object to only contain keys specified in
   * `contextTypes`, and asserts that they are valid.
   *
   * @param {object} context
   * @return {?object}
   * @private
   */
  _processContext: function (context) {
    var maskedContext = this._maskContext(context);
    if (process.env.NODE_ENV !== 'production') {
      var Component = this._currentElement.type;
      if (Component.contextTypes) {
        this._checkContextTypes(Component.contextTypes, maskedContext, 'context');
      }
    }
    return maskedContext;
  },

  /**
   * @param {object} currentContext
   * @return {object}
   * @private
   */
  _processChildContext: function (currentContext) {
    var Component = this._currentElement.type;
    var inst = this._instance;
    var childContext;

    if (inst.getChildContext) {
      if (process.env.NODE_ENV !== 'production') {
        ReactInstrumentation.debugTool.onBeginProcessingChildContext();
        try {
          childContext = inst.getChildContext();
        } finally {
          ReactInstrumentation.debugTool.onEndProcessingChildContext();
        }
      } else {
        childContext = inst.getChildContext();
      }
    }

    if (childContext) {
      !(typeof Component.childContextTypes === 'object') ? process.env.NODE_ENV !== 'production' ? invariant(false, '%s.getChildContext(): childContextTypes must be defined in order to use getChildContext().', this.getName() || 'ReactCompositeComponent') : _prodInvariant('107', this.getName() || 'ReactCompositeComponent') : void 0;
      if (process.env.NODE_ENV !== 'production') {
        this._checkContextTypes(Component.childContextTypes, childContext, 'child context');
      }
      for (var name in childContext) {
        !(name in Component.childContextTypes) ? process.env.NODE_ENV !== 'production' ? invariant(false, '%s.getChildContext(): key "%s" is not defined in childContextTypes.', this.getName() || 'ReactCompositeComponent', name) : _prodInvariant('108', this.getName() || 'ReactCompositeComponent', name) : void 0;
      }
      return _assign({}, currentContext, childContext);
    }
    return currentContext;
  },

  /**
   * Assert that the context types are valid
   *
   * @param {object} typeSpecs Map of context field to a ReactPropType
   * @param {object} values Runtime values that need to be type-checked
   * @param {string} location e.g. "prop", "context", "child context"
   * @private
   */
  _checkContextTypes: function (typeSpecs, values, location) {
    if (process.env.NODE_ENV !== 'production') {
      checkReactTypeSpec(typeSpecs, values, location, this.getName(), null, this._debugID);
    }
  },

  receiveComponent: function (nextElement, transaction, nextContext) {
    var prevElement = this._currentElement;
    var prevContext = this._context;

    this._pendingElement = null;

    this.updateComponent(transaction, prevElement, nextElement, prevContext, nextContext);
  },

  /**
   * If any of `_pendingElement`, `_pendingStateQueue`, or `_pendingForceUpdate`
   * is set, update the component.
   *
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  performUpdateIfNecessary: function (transaction) {
    if (this._pendingElement != null) {
      ReactReconciler.receiveComponent(this, this._pendingElement, transaction, this._context);
    } else if (this._pendingStateQueue !== null || this._pendingForceUpdate) {
      this.updateComponent(transaction, this._currentElement, this._currentElement, this._context, this._context);
    } else {
      this._updateBatchNumber = null;
    }
  },

  /**
   * Perform an update to a mounted component. The componentWillReceiveProps and
   * shouldComponentUpdate methods are called, then (assuming the update isn't
   * skipped) the remaining update lifecycle methods are called and the DOM
   * representation is updated.
   *
   * By default, this implements React's rendering and reconciliation algorithm.
   * Sophisticated clients may wish to override this.
   *
   * @param {ReactReconcileTransaction} transaction
   * @param {ReactElement} prevParentElement
   * @param {ReactElement} nextParentElement
   * @internal
   * @overridable
   */
  updateComponent: function (transaction, prevParentElement, nextParentElement, prevUnmaskedContext, nextUnmaskedContext) {
    var inst = this._instance;
    !(inst != null) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Attempted to update component `%s` that has already been unmounted (or failed to mount).', this.getName() || 'ReactCompositeComponent') : _prodInvariant('136', this.getName() || 'ReactCompositeComponent') : void 0;

    var willReceive = false;
    var nextContext;

    // Determine if the context has changed or not
    if (this._context === nextUnmaskedContext) {
      nextContext = inst.context;
    } else {
      nextContext = this._processContext(nextUnmaskedContext);
      willReceive = true;
    }

    var prevProps = prevParentElement.props;
    var nextProps = nextParentElement.props;

    // Not a simple state update but a props update
    if (prevParentElement !== nextParentElement) {
      willReceive = true;
    }

    // An update here will schedule an update but immediately set
    // _pendingStateQueue which will ensure that any state updates gets
    // immediately reconciled instead of waiting for the next batch.
    if (willReceive && inst.componentWillReceiveProps) {
      if (process.env.NODE_ENV !== 'production') {
        measureLifeCyclePerf(function () {
          return inst.componentWillReceiveProps(nextProps, nextContext);
        }, this._debugID, 'componentWillReceiveProps');
      } else {
        inst.componentWillReceiveProps(nextProps, nextContext);
      }
    }

    var nextState = this._processPendingState(nextProps, nextContext);
    var shouldUpdate = true;

    if (!this._pendingForceUpdate) {
      if (inst.shouldComponentUpdate) {
        if (process.env.NODE_ENV !== 'production') {
          shouldUpdate = measureLifeCyclePerf(function () {
            return inst.shouldComponentUpdate(nextProps, nextState, nextContext);
          }, this._debugID, 'shouldComponentUpdate');
        } else {
          shouldUpdate = inst.shouldComponentUpdate(nextProps, nextState, nextContext);
        }
      } else {
        if (this._compositeType === CompositeTypes.PureClass) {
          shouldUpdate = !shallowEqual(prevProps, nextProps) || !shallowEqual(inst.state, nextState);
        }
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      process.env.NODE_ENV !== 'production' ? warning(shouldUpdate !== undefined, '%s.shouldComponentUpdate(): Returned undefined instead of a ' + 'boolean value. Make sure to return true or false.', this.getName() || 'ReactCompositeComponent') : void 0;
    }

    this._updateBatchNumber = null;
    if (shouldUpdate) {
      this._pendingForceUpdate = false;
      // Will set `this.props`, `this.state` and `this.context`.
      this._performComponentUpdate(nextParentElement, nextProps, nextState, nextContext, transaction, nextUnmaskedContext);
    } else {
      // If it's determined that a component should not update, we still want
      // to set props and state but we shortcut the rest of the update.
      this._currentElement = nextParentElement;
      this._context = nextUnmaskedContext;
      inst.props = nextProps;
      inst.state = nextState;
      inst.context = nextContext;
    }
  },

  _processPendingState: function (props, context) {
    var inst = this._instance;
    var queue = this._pendingStateQueue;
    var replace = this._pendingReplaceState;
    this._pendingReplaceState = false;
    this._pendingStateQueue = null;

    if (!queue) {
      return inst.state;
    }

    if (replace && queue.length === 1) {
      return queue[0];
    }

    var nextState = _assign({}, replace ? queue[0] : inst.state);
    for (var i = replace ? 1 : 0; i < queue.length; i++) {
      var partial = queue[i];
      _assign(nextState, typeof partial === 'function' ? partial.call(inst, nextState, props, context) : partial);
    }

    return nextState;
  },

  /**
   * Merges new props and state, notifies delegate methods of update and
   * performs update.
   *
   * @param {ReactElement} nextElement Next element
   * @param {object} nextProps Next public object to set as properties.
   * @param {?object} nextState Next object to set as state.
   * @param {?object} nextContext Next public object to set as context.
   * @param {ReactReconcileTransaction} transaction
   * @param {?object} unmaskedContext
   * @private
   */
  _performComponentUpdate: function (nextElement, nextProps, nextState, nextContext, transaction, unmaskedContext) {
    var _this2 = this;

    var inst = this._instance;

    var hasComponentDidUpdate = Boolean(inst.componentDidUpdate);
    var prevProps;
    var prevState;
    var prevContext;
    if (hasComponentDidUpdate) {
      prevProps = inst.props;
      prevState = inst.state;
      prevContext = inst.context;
    }

    if (inst.componentWillUpdate) {
      if (process.env.NODE_ENV !== 'production') {
        measureLifeCyclePerf(function () {
          return inst.componentWillUpdate(nextProps, nextState, nextContext);
        }, this._debugID, 'componentWillUpdate');
      } else {
        inst.componentWillUpdate(nextProps, nextState, nextContext);
      }
    }

    this._currentElement = nextElement;
    this._context = unmaskedContext;
    inst.props = nextProps;
    inst.state = nextState;
    inst.context = nextContext;

    this._updateRenderedComponent(transaction, unmaskedContext);

    if (hasComponentDidUpdate) {
      if (process.env.NODE_ENV !== 'production') {
        transaction.getReactMountReady().enqueue(function () {
          measureLifeCyclePerf(inst.componentDidUpdate.bind(inst, prevProps, prevState, prevContext), _this2._debugID, 'componentDidUpdate');
        });
      } else {
        transaction.getReactMountReady().enqueue(inst.componentDidUpdate.bind(inst, prevProps, prevState, prevContext), inst);
      }
    }
  },

  /**
   * Call the component's `render` method and update the DOM accordingly.
   *
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  _updateRenderedComponent: function (transaction, context) {
    var prevComponentInstance = this._renderedComponent;
    var prevRenderedElement = prevComponentInstance._currentElement;
    var nextRenderedElement = this._renderValidatedComponent();

    var debugID = 0;
    if (process.env.NODE_ENV !== 'production') {
      debugID = this._debugID;
    }

    if (shouldUpdateReactComponent(prevRenderedElement, nextRenderedElement)) {
      ReactReconciler.receiveComponent(prevComponentInstance, nextRenderedElement, transaction, this._processChildContext(context));
    } else {
      var oldHostNode = ReactReconciler.getHostNode(prevComponentInstance);
      ReactReconciler.unmountComponent(prevComponentInstance, false);

      var nodeType = ReactNodeTypes.getType(nextRenderedElement);
      this._renderedNodeType = nodeType;
      var child = this._instantiateReactComponent(nextRenderedElement, nodeType !== ReactNodeTypes.EMPTY /* shouldHaveDebugID */
      );
      this._renderedComponent = child;

      var nextMarkup = ReactReconciler.mountComponent(child, transaction, this._hostParent, this._hostContainerInfo, this._processChildContext(context), debugID);

      if (process.env.NODE_ENV !== 'production') {
        if (debugID !== 0) {
          var childDebugIDs = child._debugID !== 0 ? [child._debugID] : [];
          ReactInstrumentation.debugTool.onSetChildren(debugID, childDebugIDs);
        }
      }

      this._replaceNodeWithMarkup(oldHostNode, nextMarkup, prevComponentInstance);
    }
  },

  /**
   * Overridden in shallow rendering.
   *
   * @protected
   */
  _replaceNodeWithMarkup: function (oldHostNode, nextMarkup, prevInstance) {
    ReactComponentEnvironment.replaceNodeWithMarkup(oldHostNode, nextMarkup, prevInstance);
  },

  /**
   * @protected
   */
  _renderValidatedComponentWithoutOwnerOrContext: function () {
    var inst = this._instance;
    var renderedElement;

    if (process.env.NODE_ENV !== 'production') {
      renderedElement = measureLifeCyclePerf(function () {
        return inst.render();
      }, this._debugID, 'render');
    } else {
      renderedElement = inst.render();
    }

    if (process.env.NODE_ENV !== 'production') {
      // We allow auto-mocks to proceed as if they're returning null.
      if (renderedElement === undefined && inst.render._isMockFunction) {
        // This is probably bad practice. Consider warning here and
        // deprecating this convenience.
        renderedElement = null;
      }
    }

    return renderedElement;
  },

  /**
   * @private
   */
  _renderValidatedComponent: function () {
    var renderedElement;
    if (process.env.NODE_ENV !== 'production' || this._compositeType !== CompositeTypes.StatelessFunctional) {
      ReactCurrentOwner.current = this;
      try {
        renderedElement = this._renderValidatedComponentWithoutOwnerOrContext();
      } finally {
        ReactCurrentOwner.current = null;
      }
    } else {
      renderedElement = this._renderValidatedComponentWithoutOwnerOrContext();
    }
    !(
    // TODO: An `isValidNode` function would probably be more appropriate
    renderedElement === null || renderedElement === false || React.isValidElement(renderedElement)) ? process.env.NODE_ENV !== 'production' ? invariant(false, '%s.render(): A valid React element (or null) must be returned. You may have returned undefined, an array or some other invalid object.', this.getName() || 'ReactCompositeComponent') : _prodInvariant('109', this.getName() || 'ReactCompositeComponent') : void 0;

    return renderedElement;
  },

  /**
   * Lazily allocates the refs object and stores `component` as `ref`.
   *
   * @param {string} ref Reference name.
   * @param {component} component Component to store as `ref`.
   * @final
   * @private
   */
  attachRef: function (ref, component) {
    var inst = this.getPublicInstance();
    !(inst != null) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Stateless function components cannot have refs.') : _prodInvariant('110') : void 0;
    var publicComponentInstance = component.getPublicInstance();
    if (process.env.NODE_ENV !== 'production') {
      var componentName = component && component.getName ? component.getName() : 'a component';
      process.env.NODE_ENV !== 'production' ? warning(publicComponentInstance != null || component._compositeType !== CompositeTypes.StatelessFunctional, 'Stateless function components cannot be given refs ' + '(See ref "%s" in %s created by %s). ' + 'Attempts to access this ref will fail.', ref, componentName, this.getName()) : void 0;
    }
    var refs = inst.refs === emptyObject ? inst.refs = {} : inst.refs;
    refs[ref] = publicComponentInstance;
  },

  /**
   * Detaches a reference name.
   *
   * @param {string} ref Name to dereference.
   * @final
   * @private
   */
  detachRef: function (ref) {
    var refs = this.getPublicInstance().refs;
    delete refs[ref];
  },

  /**
   * Get a text description of the component that can be used to identify it
   * in error messages.
   * @return {string} The name or null.
   * @internal
   */
  getName: function () {
    var type = this._currentElement.type;
    var constructor = this._instance && this._instance.constructor;
    return type.displayName || constructor && constructor.displayName || type.name || constructor && constructor.name || null;
  },

  /**
   * Get the publicly accessible representation of this component - i.e. what
   * is exposed by refs and returned by render. Can be null for stateless
   * components.
   *
   * @return {ReactComponent} the public component instance.
   * @internal
   */
  getPublicInstance: function () {
    var inst = this._instance;
    if (this._compositeType === CompositeTypes.StatelessFunctional) {
      return null;
    }
    return inst;
  },

  // Stub
  _instantiateReactComponent: null
};

module.exports = ReactCompositeComponent;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 243 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _prodInvariant = __webpack_require__(4);

var ReactPropTypeLocationNames = __webpack_require__(244);
var ReactPropTypesSecret = __webpack_require__(111);

var invariant = __webpack_require__(1);
var warning = __webpack_require__(2);

var ReactComponentTreeHook;

if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
  // Temporary hack.
  // Inline requires don't work well with Jest:
  // https://github.com/facebook/react/issues/7240
  // Remove the inline requires when we don't need them anymore:
  // https://github.com/facebook/react/pull/7178
  ReactComponentTreeHook = __webpack_require__(11);
}

var loggedTypeFailures = {};

/**
 * Assert that the values match with the type specs.
 * Error messages are memorized and will only be shown once.
 *
 * @param {object} typeSpecs Map of name to a ReactPropType
 * @param {object} values Runtime values that need to be type-checked
 * @param {string} location e.g. "prop", "context", "child context"
 * @param {string} componentName Name of the component for error messages.
 * @param {?object} element The React element that is being type-checked
 * @param {?number} debugID The React component instance that is being type-checked
 * @private
 */
function checkReactTypeSpec(typeSpecs, values, location, componentName, element, debugID) {
  for (var typeSpecName in typeSpecs) {
    if (typeSpecs.hasOwnProperty(typeSpecName)) {
      var error;
      // Prop type validation may throw. In case they do, we don't want to
      // fail the render phase where it didn't fail before. So we log it.
      // After these have been cleaned up, we'll let them throw.
      try {
        // This is intentionally an invariant that gets caught. It's the same
        // behavior as without this statement except with a better message.
        !(typeof typeSpecs[typeSpecName] === 'function') ? process.env.NODE_ENV !== 'production' ? invariant(false, '%s: %s type `%s` is invalid; it must be a function, usually from React.PropTypes.', componentName || 'React class', ReactPropTypeLocationNames[location], typeSpecName) : _prodInvariant('84', componentName || 'React class', ReactPropTypeLocationNames[location], typeSpecName) : void 0;
        error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, ReactPropTypesSecret);
      } catch (ex) {
        error = ex;
      }
      process.env.NODE_ENV !== 'production' ? warning(!error || error instanceof Error, '%s: type specification of %s `%s` is invalid; the type checker ' + 'function must return `null` or an `Error` but returned a %s. ' + 'You may have forgotten to pass an argument to the type checker ' + 'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' + 'shape all require an argument).', componentName || 'React class', ReactPropTypeLocationNames[location], typeSpecName, typeof error) : void 0;
      if (error instanceof Error && !(error.message in loggedTypeFailures)) {
        // Only monitor this failure once because there tends to be a lot of the
        // same error.
        loggedTypeFailures[error.message] = true;

        var componentStackInfo = '';

        if (process.env.NODE_ENV !== 'production') {
          if (!ReactComponentTreeHook) {
            ReactComponentTreeHook = __webpack_require__(11);
          }
          if (debugID !== null) {
            componentStackInfo = ReactComponentTreeHook.getStackAddendumByID(debugID);
          } else if (element !== null) {
            componentStackInfo = ReactComponentTreeHook.getCurrentStackAddendum(element);
          }
        }

        process.env.NODE_ENV !== 'production' ? warning(false, 'Failed %s type: %s%s', location, error.message, componentStackInfo) : void 0;
      }
    }
  }
}

module.exports = checkReactTypeSpec;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 244 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var ReactPropTypeLocationNames = {};

if (process.env.NODE_ENV !== 'production') {
  ReactPropTypeLocationNames = {
    prop: 'prop',
    context: 'context',
    childContext: 'child context'
  };
}

module.exports = ReactPropTypeLocationNames;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 245 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var nextDebugID = 1;

function getNextDebugID() {
  return nextDebugID++;
}

module.exports = getNextDebugID;

/***/ }),
/* 246 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



// The Symbol used to tag the ReactElement type. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.

var REACT_ELEMENT_TYPE = typeof Symbol === 'function' && Symbol['for'] && Symbol['for']('react.element') || 0xeac7;

module.exports = REACT_ELEMENT_TYPE;

/***/ }),
/* 247 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



/* global Symbol */

var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

/**
 * Returns the iterator method function contained on the iterable object.
 *
 * Be sure to invoke the function with the iterable as context:
 *
 *     var iteratorFn = getIteratorFn(myIterable);
 *     if (iteratorFn) {
 *       var iterator = iteratorFn.call(myIterable);
 *       ...
 *     }
 *
 * @param {?object} maybeIterable
 * @return {?function}
 */
function getIteratorFn(maybeIterable) {
  var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
  if (typeof iteratorFn === 'function') {
    return iteratorFn;
  }
}

module.exports = getIteratorFn;

/***/ }),
/* 248 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var KeyEscapeUtils = __webpack_require__(77);
var traverseAllChildren = __webpack_require__(117);
var warning = __webpack_require__(2);

var ReactComponentTreeHook;

if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
  // Temporary hack.
  // Inline requires don't work well with Jest:
  // https://github.com/facebook/react/issues/7240
  // Remove the inline requires when we don't need them anymore:
  // https://github.com/facebook/react/pull/7178
  ReactComponentTreeHook = __webpack_require__(11);
}

/**
 * @param {function} traverseContext Context passed through traversal.
 * @param {?ReactComponent} child React child component.
 * @param {!string} name String name of key path to child.
 * @param {number=} selfDebugID Optional debugID of the current internal instance.
 */
function flattenSingleChildIntoContext(traverseContext, child, name, selfDebugID) {
  // We found a component instance.
  if (traverseContext && typeof traverseContext === 'object') {
    var result = traverseContext;
    var keyUnique = result[name] === undefined;
    if (process.env.NODE_ENV !== 'production') {
      if (!ReactComponentTreeHook) {
        ReactComponentTreeHook = __webpack_require__(11);
      }
      if (!keyUnique) {
        process.env.NODE_ENV !== 'production' ? warning(false, 'flattenChildren(...): Encountered two children with the same key, ' + '`%s`. Child keys must be unique; when two children share a key, only ' + 'the first child will be used.%s', KeyEscapeUtils.unescape(name), ReactComponentTreeHook.getStackAddendumByID(selfDebugID)) : void 0;
      }
    }
    if (keyUnique && child != null) {
      result[name] = child;
    }
  }
}

/**
 * Flattens children that are typically specified as `props.children`. Any null
 * children will not be included in the resulting object.
 * @return {!object} flattened children keyed by name.
 */
function flattenChildren(children, selfDebugID) {
  if (children == null) {
    return children;
  }
  var result = {};

  if (process.env.NODE_ENV !== 'production') {
    traverseAllChildren(children, function (traverseContext, child, name) {
      return flattenSingleChildIntoContext(traverseContext, child, name, selfDebugID);
    }, result);
  } else {
    traverseAllChildren(children, flattenSingleChildIntoContext, result);
  }
  return result;
}

module.exports = flattenChildren;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 249 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _assign = __webpack_require__(7);

var PooledClass = __webpack_require__(26);
var Transaction = __webpack_require__(52);
var ReactInstrumentation = __webpack_require__(12);
var ReactServerUpdateQueue = __webpack_require__(250);

/**
 * Executed within the scope of the `Transaction` instance. Consider these as
 * being member methods, but with an implied ordering while being isolated from
 * each other.
 */
var TRANSACTION_WRAPPERS = [];

if (process.env.NODE_ENV !== 'production') {
  TRANSACTION_WRAPPERS.push({
    initialize: ReactInstrumentation.debugTool.onBeginFlush,
    close: ReactInstrumentation.debugTool.onEndFlush
  });
}

var noopCallbackQueue = {
  enqueue: function () {}
};

/**
 * @class ReactServerRenderingTransaction
 * @param {boolean} renderToStaticMarkup
 */
function ReactServerRenderingTransaction(renderToStaticMarkup) {
  this.reinitializeTransaction();
  this.renderToStaticMarkup = renderToStaticMarkup;
  this.useCreateElement = false;
  this.updateQueue = new ReactServerUpdateQueue(this);
}

var Mixin = {
  /**
   * @see Transaction
   * @abstract
   * @final
   * @return {array} Empty list of operation wrap procedures.
   */
  getTransactionWrappers: function () {
    return TRANSACTION_WRAPPERS;
  },

  /**
   * @return {object} The queue to collect `onDOMReady` callbacks with.
   */
  getReactMountReady: function () {
    return noopCallbackQueue;
  },

  /**
   * @return {object} The queue to collect React async events.
   */
  getUpdateQueue: function () {
    return this.updateQueue;
  },

  /**
   * `PooledClass` looks for this, and will invoke this before allowing this
   * instance to be reused.
   */
  destructor: function () {},

  checkpoint: function () {},

  rollback: function () {}
};

_assign(ReactServerRenderingTransaction.prototype, Transaction, Mixin);

PooledClass.addPoolingTo(ReactServerRenderingTransaction);

module.exports = ReactServerRenderingTransaction;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 250 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ReactUpdateQueue = __webpack_require__(78);

var warning = __webpack_require__(2);

function warnNoop(publicInstance, callerName) {
  if (process.env.NODE_ENV !== 'production') {
    var constructor = publicInstance.constructor;
    process.env.NODE_ENV !== 'production' ? warning(false, '%s(...): Can only update a mounting component. ' + 'This usually means you called %s() outside componentWillMount() on the server. ' + 'This is a no-op. Please check the code for the %s component.', callerName, callerName, constructor && (constructor.displayName || constructor.name) || 'ReactClass') : void 0;
  }
}

/**
 * This is the update queue used for server rendering.
 * It delegates to ReactUpdateQueue while server rendering is in progress and
 * switches to ReactNoopUpdateQueue after the transaction has completed.
 * @class ReactServerUpdateQueue
 * @param {Transaction} transaction
 */

var ReactServerUpdateQueue = function () {
  function ReactServerUpdateQueue(transaction) {
    _classCallCheck(this, ReactServerUpdateQueue);

    this.transaction = transaction;
  }

  /**
   * Checks whether or not this composite component is mounted.
   * @param {ReactClass} publicInstance The instance we want to test.
   * @return {boolean} True if mounted, false otherwise.
   * @protected
   * @final
   */


  ReactServerUpdateQueue.prototype.isMounted = function isMounted(publicInstance) {
    return false;
  };

  /**
   * Enqueue a callback that will be executed after all the pending updates
   * have processed.
   *
   * @param {ReactClass} publicInstance The instance to use as `this` context.
   * @param {?function} callback Called after state is updated.
   * @internal
   */


  ReactServerUpdateQueue.prototype.enqueueCallback = function enqueueCallback(publicInstance, callback, callerName) {
    if (this.transaction.isInTransaction()) {
      ReactUpdateQueue.enqueueCallback(publicInstance, callback, callerName);
    }
  };

  /**
   * Forces an update. This should only be invoked when it is known with
   * certainty that we are **not** in a DOM transaction.
   *
   * You may want to call this when you know that some deeper aspect of the
   * component's state has changed but `setState` was not called.
   *
   * This will not invoke `shouldComponentUpdate`, but it will invoke
   * `componentWillUpdate` and `componentDidUpdate`.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @internal
   */


  ReactServerUpdateQueue.prototype.enqueueForceUpdate = function enqueueForceUpdate(publicInstance) {
    if (this.transaction.isInTransaction()) {
      ReactUpdateQueue.enqueueForceUpdate(publicInstance);
    } else {
      warnNoop(publicInstance, 'forceUpdate');
    }
  };

  /**
   * Replaces all of the state. Always use this or `setState` to mutate state.
   * You should treat `this.state` as immutable.
   *
   * There is no guarantee that `this.state` will be immediately updated, so
   * accessing `this.state` after calling this method may return the old value.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object|function} completeState Next state.
   * @internal
   */


  ReactServerUpdateQueue.prototype.enqueueReplaceState = function enqueueReplaceState(publicInstance, completeState) {
    if (this.transaction.isInTransaction()) {
      ReactUpdateQueue.enqueueReplaceState(publicInstance, completeState);
    } else {
      warnNoop(publicInstance, 'replaceState');
    }
  };

  /**
   * Sets a subset of the state. This only exists because _pendingState is
   * internal. This provides a merging strategy that is not available to deep
   * properties which is confusing. TODO: Expose pendingState or don't use it
   * during the merge.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object|function} partialState Next partial state to be merged with state.
   * @internal
   */


  ReactServerUpdateQueue.prototype.enqueueSetState = function enqueueSetState(publicInstance, partialState) {
    if (this.transaction.isInTransaction()) {
      ReactUpdateQueue.enqueueSetState(publicInstance, partialState);
    } else {
      warnNoop(publicInstance, 'setState');
    }
  };

  return ReactServerUpdateQueue;
}();

module.exports = ReactServerUpdateQueue;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 251 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _assign = __webpack_require__(7);

var DOMLazyTree = __webpack_require__(34);
var ReactDOMComponentTree = __webpack_require__(8);

var ReactDOMEmptyComponent = function (instantiate) {
  // ReactCompositeComponent uses this:
  this._currentElement = null;
  // ReactDOMComponentTree uses these:
  this._hostNode = null;
  this._hostParent = null;
  this._hostContainerInfo = null;
  this._domID = 0;
};
_assign(ReactDOMEmptyComponent.prototype, {
  mountComponent: function (transaction, hostParent, hostContainerInfo, context) {
    var domID = hostContainerInfo._idCounter++;
    this._domID = domID;
    this._hostParent = hostParent;
    this._hostContainerInfo = hostContainerInfo;

    var nodeValue = ' react-empty: ' + this._domID + ' ';
    if (transaction.useCreateElement) {
      var ownerDocument = hostContainerInfo._ownerDocument;
      var node = ownerDocument.createComment(nodeValue);
      ReactDOMComponentTree.precacheNode(this, node);
      return DOMLazyTree(node);
    } else {
      if (transaction.renderToStaticMarkup) {
        // Normally we'd insert a comment node, but since this is a situation
        // where React won't take over (static pages), we can simply return
        // nothing.
        return '';
      }
      return '<!--' + nodeValue + '-->';
    }
  },
  receiveComponent: function () {},
  getHostNode: function () {
    return ReactDOMComponentTree.getNodeFromInstance(this);
  },
  unmountComponent: function () {
    ReactDOMComponentTree.uncacheNode(this);
  }
});

module.exports = ReactDOMEmptyComponent;

/***/ }),
/* 252 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _prodInvariant = __webpack_require__(4);

var invariant = __webpack_require__(1);

/**
 * Return the lowest common ancestor of A and B, or null if they are in
 * different trees.
 */
function getLowestCommonAncestor(instA, instB) {
  !('_hostNode' in instA) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'getNodeFromInstance: Invalid argument.') : _prodInvariant('33') : void 0;
  !('_hostNode' in instB) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'getNodeFromInstance: Invalid argument.') : _prodInvariant('33') : void 0;

  var depthA = 0;
  for (var tempA = instA; tempA; tempA = tempA._hostParent) {
    depthA++;
  }
  var depthB = 0;
  for (var tempB = instB; tempB; tempB = tempB._hostParent) {
    depthB++;
  }

  // If A is deeper, crawl up.
  while (depthA - depthB > 0) {
    instA = instA._hostParent;
    depthA--;
  }

  // If B is deeper, crawl up.
  while (depthB - depthA > 0) {
    instB = instB._hostParent;
    depthB--;
  }

  // Walk in lockstep until we find a match.
  var depth = depthA;
  while (depth--) {
    if (instA === instB) {
      return instA;
    }
    instA = instA._hostParent;
    instB = instB._hostParent;
  }
  return null;
}

/**
 * Return if A is an ancestor of B.
 */
function isAncestor(instA, instB) {
  !('_hostNode' in instA) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'isAncestor: Invalid argument.') : _prodInvariant('35') : void 0;
  !('_hostNode' in instB) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'isAncestor: Invalid argument.') : _prodInvariant('35') : void 0;

  while (instB) {
    if (instB === instA) {
      return true;
    }
    instB = instB._hostParent;
  }
  return false;
}

/**
 * Return the parent instance of the passed-in instance.
 */
function getParentInstance(inst) {
  !('_hostNode' in inst) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'getParentInstance: Invalid argument.') : _prodInvariant('36') : void 0;

  return inst._hostParent;
}

/**
 * Simulates the traversal of a two-phase, capture/bubble event dispatch.
 */
function traverseTwoPhase(inst, fn, arg) {
  var path = [];
  while (inst) {
    path.push(inst);
    inst = inst._hostParent;
  }
  var i;
  for (i = path.length; i-- > 0;) {
    fn(path[i], 'captured', arg);
  }
  for (i = 0; i < path.length; i++) {
    fn(path[i], 'bubbled', arg);
  }
}

/**
 * Traverses the ID hierarchy and invokes the supplied `cb` on any IDs that
 * should would receive a `mouseEnter` or `mouseLeave` event.
 *
 * Does not invoke the callback on the nearest common ancestor because nothing
 * "entered" or "left" that element.
 */
function traverseEnterLeave(from, to, fn, argFrom, argTo) {
  var common = from && to ? getLowestCommonAncestor(from, to) : null;
  var pathFrom = [];
  while (from && from !== common) {
    pathFrom.push(from);
    from = from._hostParent;
  }
  var pathTo = [];
  while (to && to !== common) {
    pathTo.push(to);
    to = to._hostParent;
  }
  var i;
  for (i = 0; i < pathFrom.length; i++) {
    fn(pathFrom[i], 'bubbled', argFrom);
  }
  for (i = pathTo.length; i-- > 0;) {
    fn(pathTo[i], 'captured', argTo);
  }
}

module.exports = {
  isAncestor: isAncestor,
  getLowestCommonAncestor: getLowestCommonAncestor,
  getParentInstance: getParentInstance,
  traverseTwoPhase: traverseTwoPhase,
  traverseEnterLeave: traverseEnterLeave
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 253 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _prodInvariant = __webpack_require__(4),
    _assign = __webpack_require__(7);

var DOMChildrenOperations = __webpack_require__(70);
var DOMLazyTree = __webpack_require__(34);
var ReactDOMComponentTree = __webpack_require__(8);

var escapeTextContentForBrowser = __webpack_require__(55);
var invariant = __webpack_require__(1);
var validateDOMNesting = __webpack_require__(79);

/**
 * Text nodes violate a couple assumptions that React makes about components:
 *
 *  - When mounting text into the DOM, adjacent text nodes are merged.
 *  - Text nodes cannot be assigned a React root ID.
 *
 * This component is used to wrap strings between comment nodes so that they
 * can undergo the same reconciliation that is applied to elements.
 *
 * TODO: Investigate representing React components in the DOM with text nodes.
 *
 * @class ReactDOMTextComponent
 * @extends ReactComponent
 * @internal
 */
var ReactDOMTextComponent = function (text) {
  // TODO: This is really a ReactText (ReactNode), not a ReactElement
  this._currentElement = text;
  this._stringText = '' + text;
  // ReactDOMComponentTree uses these:
  this._hostNode = null;
  this._hostParent = null;

  // Properties
  this._domID = 0;
  this._mountIndex = 0;
  this._closingComment = null;
  this._commentNodes = null;
};

_assign(ReactDOMTextComponent.prototype, {
  /**
   * Creates the markup for this text node. This node is not intended to have
   * any features besides containing text content.
   *
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @return {string} Markup for this text node.
   * @internal
   */
  mountComponent: function (transaction, hostParent, hostContainerInfo, context) {
    if (process.env.NODE_ENV !== 'production') {
      var parentInfo;
      if (hostParent != null) {
        parentInfo = hostParent._ancestorInfo;
      } else if (hostContainerInfo != null) {
        parentInfo = hostContainerInfo._ancestorInfo;
      }
      if (parentInfo) {
        // parentInfo should always be present except for the top-level
        // component when server rendering
        validateDOMNesting(null, this._stringText, this, parentInfo);
      }
    }

    var domID = hostContainerInfo._idCounter++;
    var openingValue = ' react-text: ' + domID + ' ';
    var closingValue = ' /react-text ';
    this._domID = domID;
    this._hostParent = hostParent;
    if (transaction.useCreateElement) {
      var ownerDocument = hostContainerInfo._ownerDocument;
      var openingComment = ownerDocument.createComment(openingValue);
      var closingComment = ownerDocument.createComment(closingValue);
      var lazyTree = DOMLazyTree(ownerDocument.createDocumentFragment());
      DOMLazyTree.queueChild(lazyTree, DOMLazyTree(openingComment));
      if (this._stringText) {
        DOMLazyTree.queueChild(lazyTree, DOMLazyTree(ownerDocument.createTextNode(this._stringText)));
      }
      DOMLazyTree.queueChild(lazyTree, DOMLazyTree(closingComment));
      ReactDOMComponentTree.precacheNode(this, openingComment);
      this._closingComment = closingComment;
      return lazyTree;
    } else {
      var escapedText = escapeTextContentForBrowser(this._stringText);

      if (transaction.renderToStaticMarkup) {
        // Normally we'd wrap this between comment nodes for the reasons stated
        // above, but since this is a situation where React won't take over
        // (static pages), we can simply return the text as it is.
        return escapedText;
      }

      return '<!--' + openingValue + '-->' + escapedText + '<!--' + closingValue + '-->';
    }
  },

  /**
   * Updates this component by updating the text content.
   *
   * @param {ReactText} nextText The next text content
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  receiveComponent: function (nextText, transaction) {
    if (nextText !== this._currentElement) {
      this._currentElement = nextText;
      var nextStringText = '' + nextText;
      if (nextStringText !== this._stringText) {
        // TODO: Save this as pending props and use performUpdateIfNecessary
        // and/or updateComponent to do the actual update for consistency with
        // other component types?
        this._stringText = nextStringText;
        var commentNodes = this.getHostNode();
        DOMChildrenOperations.replaceDelimitedText(commentNodes[0], commentNodes[1], nextStringText);
      }
    }
  },

  getHostNode: function () {
    var hostNode = this._commentNodes;
    if (hostNode) {
      return hostNode;
    }
    if (!this._closingComment) {
      var openingComment = ReactDOMComponentTree.getNodeFromInstance(this);
      var node = openingComment.nextSibling;
      while (true) {
        !(node != null) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Missing closing comment for text component %s', this._domID) : _prodInvariant('67', this._domID) : void 0;
        if (node.nodeType === 8 && node.nodeValue === ' /react-text ') {
          this._closingComment = node;
          break;
        }
        node = node.nextSibling;
      }
    }
    hostNode = [this._hostNode, this._closingComment];
    this._commentNodes = hostNode;
    return hostNode;
  },

  unmountComponent: function () {
    this._closingComment = null;
    this._commentNodes = null;
    ReactDOMComponentTree.uncacheNode(this);
  }
});

module.exports = ReactDOMTextComponent;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 254 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _assign = __webpack_require__(7);

var ReactUpdates = __webpack_require__(15);
var Transaction = __webpack_require__(52);

var emptyFunction = __webpack_require__(13);

var RESET_BATCHED_UPDATES = {
  initialize: emptyFunction,
  close: function () {
    ReactDefaultBatchingStrategy.isBatchingUpdates = false;
  }
};

var FLUSH_BATCHED_UPDATES = {
  initialize: emptyFunction,
  close: ReactUpdates.flushBatchedUpdates.bind(ReactUpdates)
};

var TRANSACTION_WRAPPERS = [FLUSH_BATCHED_UPDATES, RESET_BATCHED_UPDATES];

function ReactDefaultBatchingStrategyTransaction() {
  this.reinitializeTransaction();
}

_assign(ReactDefaultBatchingStrategyTransaction.prototype, Transaction, {
  getTransactionWrappers: function () {
    return TRANSACTION_WRAPPERS;
  }
});

var transaction = new ReactDefaultBatchingStrategyTransaction();

var ReactDefaultBatchingStrategy = {
  isBatchingUpdates: false,

  /**
   * Call the provided function in a context within which calls to `setState`
   * and friends are batched such that components aren't updated unnecessarily.
   */
  batchedUpdates: function (callback, a, b, c, d, e) {
    var alreadyBatchingUpdates = ReactDefaultBatchingStrategy.isBatchingUpdates;

    ReactDefaultBatchingStrategy.isBatchingUpdates = true;

    // The code is written this way to avoid extra allocations
    if (alreadyBatchingUpdates) {
      return callback(a, b, c, d, e);
    } else {
      return transaction.perform(callback, null, a, b, c, d, e);
    }
  }
};

module.exports = ReactDefaultBatchingStrategy;

/***/ }),
/* 255 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _assign = __webpack_require__(7);

var EventListener = __webpack_require__(118);
var ExecutionEnvironment = __webpack_require__(10);
var PooledClass = __webpack_require__(26);
var ReactDOMComponentTree = __webpack_require__(8);
var ReactUpdates = __webpack_require__(15);

var getEventTarget = __webpack_require__(67);
var getUnboundedScrollPosition = __webpack_require__(256);

/**
 * Find the deepest React component completely containing the root of the
 * passed-in instance (for use when entire React trees are nested within each
 * other). If React trees are not nested, returns null.
 */
function findParent(inst) {
  // TODO: It may be a good idea to cache this to prevent unnecessary DOM
  // traversal, but caching is difficult to do correctly without using a
  // mutation observer to listen for all DOM changes.
  while (inst._hostParent) {
    inst = inst._hostParent;
  }
  var rootNode = ReactDOMComponentTree.getNodeFromInstance(inst);
  var container = rootNode.parentNode;
  return ReactDOMComponentTree.getClosestInstanceFromNode(container);
}

// Used to store ancestor hierarchy in top level callback
function TopLevelCallbackBookKeeping(topLevelType, nativeEvent) {
  this.topLevelType = topLevelType;
  this.nativeEvent = nativeEvent;
  this.ancestors = [];
}
_assign(TopLevelCallbackBookKeeping.prototype, {
  destructor: function () {
    this.topLevelType = null;
    this.nativeEvent = null;
    this.ancestors.length = 0;
  }
});
PooledClass.addPoolingTo(TopLevelCallbackBookKeeping, PooledClass.twoArgumentPooler);

function handleTopLevelImpl(bookKeeping) {
  var nativeEventTarget = getEventTarget(bookKeeping.nativeEvent);
  var targetInst = ReactDOMComponentTree.getClosestInstanceFromNode(nativeEventTarget);

  // Loop through the hierarchy, in case there's any nested components.
  // It's important that we build the array of ancestors before calling any
  // event handlers, because event handlers can modify the DOM, leading to
  // inconsistencies with ReactMount's node cache. See #1105.
  var ancestor = targetInst;
  do {
    bookKeeping.ancestors.push(ancestor);
    ancestor = ancestor && findParent(ancestor);
  } while (ancestor);

  for (var i = 0; i < bookKeeping.ancestors.length; i++) {
    targetInst = bookKeeping.ancestors[i];
    ReactEventListener._handleTopLevel(bookKeeping.topLevelType, targetInst, bookKeeping.nativeEvent, getEventTarget(bookKeeping.nativeEvent));
  }
}

function scrollValueMonitor(cb) {
  var scrollPosition = getUnboundedScrollPosition(window);
  cb(scrollPosition);
}

var ReactEventListener = {
  _enabled: true,
  _handleTopLevel: null,

  WINDOW_HANDLE: ExecutionEnvironment.canUseDOM ? window : null,

  setHandleTopLevel: function (handleTopLevel) {
    ReactEventListener._handleTopLevel = handleTopLevel;
  },

  setEnabled: function (enabled) {
    ReactEventListener._enabled = !!enabled;
  },

  isEnabled: function () {
    return ReactEventListener._enabled;
  },

  /**
   * Traps top-level events by using event bubbling.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {string} handlerBaseName Event name (e.g. "click").
   * @param {object} element Element on which to attach listener.
   * @return {?object} An object with a remove function which will forcefully
   *                  remove the listener.
   * @internal
   */
  trapBubbledEvent: function (topLevelType, handlerBaseName, element) {
    if (!element) {
      return null;
    }
    return EventListener.listen(element, handlerBaseName, ReactEventListener.dispatchEvent.bind(null, topLevelType));
  },

  /**
   * Traps a top-level event by using event capturing.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {string} handlerBaseName Event name (e.g. "click").
   * @param {object} element Element on which to attach listener.
   * @return {?object} An object with a remove function which will forcefully
   *                  remove the listener.
   * @internal
   */
  trapCapturedEvent: function (topLevelType, handlerBaseName, element) {
    if (!element) {
      return null;
    }
    return EventListener.capture(element, handlerBaseName, ReactEventListener.dispatchEvent.bind(null, topLevelType));
  },

  monitorScrollValue: function (refresh) {
    var callback = scrollValueMonitor.bind(null, refresh);
    EventListener.listen(window, 'scroll', callback);
  },

  dispatchEvent: function (topLevelType, nativeEvent) {
    if (!ReactEventListener._enabled) {
      return;
    }

    var bookKeeping = TopLevelCallbackBookKeeping.getPooled(topLevelType, nativeEvent);
    try {
      // Event queue being processed in the same cycle allows
      // `preventDefault`.
      ReactUpdates.batchedUpdates(handleTopLevelImpl, bookKeeping);
    } finally {
      TopLevelCallbackBookKeeping.release(bookKeeping);
    }
  }
};

module.exports = ReactEventListener;

/***/ }),
/* 256 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @typechecks
 */



/**
 * Gets the scroll position of the supplied element or window.
 *
 * The return values are unbounded, unlike `getScrollPosition`. This means they
 * may be negative or exceed the element boundaries (which is possible using
 * inertial scrolling).
 *
 * @param {DOMWindow|DOMElement} scrollable
 * @return {object} Map with `x` and `y` keys.
 */

function getUnboundedScrollPosition(scrollable) {
  if (scrollable.Window && scrollable instanceof scrollable.Window) {
    return {
      x: scrollable.pageXOffset || scrollable.document.documentElement.scrollLeft,
      y: scrollable.pageYOffset || scrollable.document.documentElement.scrollTop
    };
  }
  return {
    x: scrollable.scrollLeft,
    y: scrollable.scrollTop
  };
}

module.exports = getUnboundedScrollPosition;

/***/ }),
/* 257 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var DOMProperty = __webpack_require__(23);
var EventPluginHub = __webpack_require__(41);
var EventPluginUtils = __webpack_require__(65);
var ReactComponentEnvironment = __webpack_require__(74);
var ReactEmptyComponent = __webpack_require__(115);
var ReactBrowserEventEmitter = __webpack_require__(56);
var ReactHostComponent = __webpack_require__(116);
var ReactUpdates = __webpack_require__(15);

var ReactInjection = {
  Component: ReactComponentEnvironment.injection,
  DOMProperty: DOMProperty.injection,
  EmptyComponent: ReactEmptyComponent.injection,
  EventPluginHub: EventPluginHub.injection,
  EventPluginUtils: EventPluginUtils.injection,
  EventEmitter: ReactBrowserEventEmitter.injection,
  HostComponent: ReactHostComponent.injection,
  Updates: ReactUpdates.injection
};

module.exports = ReactInjection;

/***/ }),
/* 258 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _assign = __webpack_require__(7);

var CallbackQueue = __webpack_require__(102);
var PooledClass = __webpack_require__(26);
var ReactBrowserEventEmitter = __webpack_require__(56);
var ReactInputSelection = __webpack_require__(119);
var ReactInstrumentation = __webpack_require__(12);
var Transaction = __webpack_require__(52);
var ReactUpdateQueue = __webpack_require__(78);

/**
 * Ensures that, when possible, the selection range (currently selected text
 * input) is not disturbed by performing the transaction.
 */
var SELECTION_RESTORATION = {
  /**
   * @return {Selection} Selection information.
   */
  initialize: ReactInputSelection.getSelectionInformation,
  /**
   * @param {Selection} sel Selection information returned from `initialize`.
   */
  close: ReactInputSelection.restoreSelection
};

/**
 * Suppresses events (blur/focus) that could be inadvertently dispatched due to
 * high level DOM manipulations (like temporarily removing a text input from the
 * DOM).
 */
var EVENT_SUPPRESSION = {
  /**
   * @return {boolean} The enabled status of `ReactBrowserEventEmitter` before
   * the reconciliation.
   */
  initialize: function () {
    var currentlyEnabled = ReactBrowserEventEmitter.isEnabled();
    ReactBrowserEventEmitter.setEnabled(false);
    return currentlyEnabled;
  },

  /**
   * @param {boolean} previouslyEnabled Enabled status of
   *   `ReactBrowserEventEmitter` before the reconciliation occurred. `close`
   *   restores the previous value.
   */
  close: function (previouslyEnabled) {
    ReactBrowserEventEmitter.setEnabled(previouslyEnabled);
  }
};

/**
 * Provides a queue for collecting `componentDidMount` and
 * `componentDidUpdate` callbacks during the transaction.
 */
var ON_DOM_READY_QUEUEING = {
  /**
   * Initializes the internal `onDOMReady` queue.
   */
  initialize: function () {
    this.reactMountReady.reset();
  },

  /**
   * After DOM is flushed, invoke all registered `onDOMReady` callbacks.
   */
  close: function () {
    this.reactMountReady.notifyAll();
  }
};

/**
 * Executed within the scope of the `Transaction` instance. Consider these as
 * being member methods, but with an implied ordering while being isolated from
 * each other.
 */
var TRANSACTION_WRAPPERS = [SELECTION_RESTORATION, EVENT_SUPPRESSION, ON_DOM_READY_QUEUEING];

if (process.env.NODE_ENV !== 'production') {
  TRANSACTION_WRAPPERS.push({
    initialize: ReactInstrumentation.debugTool.onBeginFlush,
    close: ReactInstrumentation.debugTool.onEndFlush
  });
}

/**
 * Currently:
 * - The order that these are listed in the transaction is critical:
 * - Suppresses events.
 * - Restores selection range.
 *
 * Future:
 * - Restore document/overflow scroll positions that were unintentionally
 *   modified via DOM insertions above the top viewport boundary.
 * - Implement/integrate with customized constraint based layout system and keep
 *   track of which dimensions must be remeasured.
 *
 * @class ReactReconcileTransaction
 */
function ReactReconcileTransaction(useCreateElement) {
  this.reinitializeTransaction();
  // Only server-side rendering really needs this option (see
  // `ReactServerRendering`), but server-side uses
  // `ReactServerRenderingTransaction` instead. This option is here so that it's
  // accessible and defaults to false when `ReactDOMComponent` and
  // `ReactDOMTextComponent` checks it in `mountComponent`.`
  this.renderToStaticMarkup = false;
  this.reactMountReady = CallbackQueue.getPooled(null);
  this.useCreateElement = useCreateElement;
}

var Mixin = {
  /**
   * @see Transaction
   * @abstract
   * @final
   * @return {array<object>} List of operation wrap procedures.
   *   TODO: convert to array<TransactionWrapper>
   */
  getTransactionWrappers: function () {
    return TRANSACTION_WRAPPERS;
  },

  /**
   * @return {object} The queue to collect `onDOMReady` callbacks with.
   */
  getReactMountReady: function () {
    return this.reactMountReady;
  },

  /**
   * @return {object} The queue to collect React async events.
   */
  getUpdateQueue: function () {
    return ReactUpdateQueue;
  },

  /**
   * Save current transaction state -- if the return value from this method is
   * passed to `rollback`, the transaction will be reset to that state.
   */
  checkpoint: function () {
    // reactMountReady is the our only stateful wrapper
    return this.reactMountReady.checkpoint();
  },

  rollback: function (checkpoint) {
    this.reactMountReady.rollback(checkpoint);
  },

  /**
   * `PooledClass` looks for this, and will invoke this before allowing this
   * instance to be reused.
   */
  destructor: function () {
    CallbackQueue.release(this.reactMountReady);
    this.reactMountReady = null;
  }
};

_assign(ReactReconcileTransaction.prototype, Transaction, Mixin);

PooledClass.addPoolingTo(ReactReconcileTransaction);

module.exports = ReactReconcileTransaction;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 259 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var ExecutionEnvironment = __webpack_require__(10);

var getNodeForCharacterOffset = __webpack_require__(260);
var getTextContentAccessor = __webpack_require__(101);

/**
 * While `isCollapsed` is available on the Selection object and `collapsed`
 * is available on the Range object, IE11 sometimes gets them wrong.
 * If the anchor/focus nodes and offsets are the same, the range is collapsed.
 */
function isCollapsed(anchorNode, anchorOffset, focusNode, focusOffset) {
  return anchorNode === focusNode && anchorOffset === focusOffset;
}

/**
 * Get the appropriate anchor and focus node/offset pairs for IE.
 *
 * The catch here is that IE's selection API doesn't provide information
 * about whether the selection is forward or backward, so we have to
 * behave as though it's always forward.
 *
 * IE text differs from modern selection in that it behaves as though
 * block elements end with a new line. This means character offsets will
 * differ between the two APIs.
 *
 * @param {DOMElement} node
 * @return {object}
 */
function getIEOffsets(node) {
  var selection = document.selection;
  var selectedRange = selection.createRange();
  var selectedLength = selectedRange.text.length;

  // Duplicate selection so we can move range without breaking user selection.
  var fromStart = selectedRange.duplicate();
  fromStart.moveToElementText(node);
  fromStart.setEndPoint('EndToStart', selectedRange);

  var startOffset = fromStart.text.length;
  var endOffset = startOffset + selectedLength;

  return {
    start: startOffset,
    end: endOffset
  };
}

/**
 * @param {DOMElement} node
 * @return {?object}
 */
function getModernOffsets(node) {
  var selection = window.getSelection && window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  var anchorNode = selection.anchorNode;
  var anchorOffset = selection.anchorOffset;
  var focusNode = selection.focusNode;
  var focusOffset = selection.focusOffset;

  var currentRange = selection.getRangeAt(0);

  // In Firefox, range.startContainer and range.endContainer can be "anonymous
  // divs", e.g. the up/down buttons on an <input type="number">. Anonymous
  // divs do not seem to expose properties, triggering a "Permission denied
  // error" if any of its properties are accessed. The only seemingly possible
  // way to avoid erroring is to access a property that typically works for
  // non-anonymous divs and catch any error that may otherwise arise. See
  // https://bugzilla.mozilla.org/show_bug.cgi?id=208427
  try {
    /* eslint-disable no-unused-expressions */
    currentRange.startContainer.nodeType;
    currentRange.endContainer.nodeType;
    /* eslint-enable no-unused-expressions */
  } catch (e) {
    return null;
  }

  // If the node and offset values are the same, the selection is collapsed.
  // `Selection.isCollapsed` is available natively, but IE sometimes gets
  // this value wrong.
  var isSelectionCollapsed = isCollapsed(selection.anchorNode, selection.anchorOffset, selection.focusNode, selection.focusOffset);

  var rangeLength = isSelectionCollapsed ? 0 : currentRange.toString().length;

  var tempRange = currentRange.cloneRange();
  tempRange.selectNodeContents(node);
  tempRange.setEnd(currentRange.startContainer, currentRange.startOffset);

  var isTempRangeCollapsed = isCollapsed(tempRange.startContainer, tempRange.startOffset, tempRange.endContainer, tempRange.endOffset);

  var start = isTempRangeCollapsed ? 0 : tempRange.toString().length;
  var end = start + rangeLength;

  // Detect whether the selection is backward.
  var detectionRange = document.createRange();
  detectionRange.setStart(anchorNode, anchorOffset);
  detectionRange.setEnd(focusNode, focusOffset);
  var isBackward = detectionRange.collapsed;

  return {
    start: isBackward ? end : start,
    end: isBackward ? start : end
  };
}

/**
 * @param {DOMElement|DOMTextNode} node
 * @param {object} offsets
 */
function setIEOffsets(node, offsets) {
  var range = document.selection.createRange().duplicate();
  var start, end;

  if (offsets.end === undefined) {
    start = offsets.start;
    end = start;
  } else if (offsets.start > offsets.end) {
    start = offsets.end;
    end = offsets.start;
  } else {
    start = offsets.start;
    end = offsets.end;
  }

  range.moveToElementText(node);
  range.moveStart('character', start);
  range.setEndPoint('EndToStart', range);
  range.moveEnd('character', end - start);
  range.select();
}

/**
 * In modern non-IE browsers, we can support both forward and backward
 * selections.
 *
 * Note: IE10+ supports the Selection object, but it does not support
 * the `extend` method, which means that even in modern IE, it's not possible
 * to programmatically create a backward selection. Thus, for all IE
 * versions, we use the old IE API to create our selections.
 *
 * @param {DOMElement|DOMTextNode} node
 * @param {object} offsets
 */
function setModernOffsets(node, offsets) {
  if (!window.getSelection) {
    return;
  }

  var selection = window.getSelection();
  var length = node[getTextContentAccessor()].length;
  var start = Math.min(offsets.start, length);
  var end = offsets.end === undefined ? start : Math.min(offsets.end, length);

  // IE 11 uses modern selection, but doesn't support the extend method.
  // Flip backward selections, so we can set with a single range.
  if (!selection.extend && start > end) {
    var temp = end;
    end = start;
    start = temp;
  }

  var startMarker = getNodeForCharacterOffset(node, start);
  var endMarker = getNodeForCharacterOffset(node, end);

  if (startMarker && endMarker) {
    var range = document.createRange();
    range.setStart(startMarker.node, startMarker.offset);
    selection.removeAllRanges();

    if (start > end) {
      selection.addRange(range);
      selection.extend(endMarker.node, endMarker.offset);
    } else {
      range.setEnd(endMarker.node, endMarker.offset);
      selection.addRange(range);
    }
  }
}

var useIEOffsets = ExecutionEnvironment.canUseDOM && 'selection' in document && !('getSelection' in window);

var ReactDOMSelection = {
  /**
   * @param {DOMElement} node
   */
  getOffsets: useIEOffsets ? getIEOffsets : getModernOffsets,

  /**
   * @param {DOMElement|DOMTextNode} node
   * @param {object} offsets
   */
  setOffsets: useIEOffsets ? setIEOffsets : setModernOffsets
};

module.exports = ReactDOMSelection;

/***/ }),
/* 260 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



/**
 * Given any node return the first leaf node without children.
 *
 * @param {DOMElement|DOMTextNode} node
 * @return {DOMElement|DOMTextNode}
 */

function getLeafNode(node) {
  while (node && node.firstChild) {
    node = node.firstChild;
  }
  return node;
}

/**
 * Get the next sibling within a container. This will walk up the
 * DOM if a node's siblings have been exhausted.
 *
 * @param {DOMElement|DOMTextNode} node
 * @return {?DOMElement|DOMTextNode}
 */
function getSiblingNode(node) {
  while (node) {
    if (node.nextSibling) {
      return node.nextSibling;
    }
    node = node.parentNode;
  }
}

/**
 * Get object describing the nodes which contain characters at offset.
 *
 * @param {DOMElement|DOMTextNode} root
 * @param {number} offset
 * @return {?object}
 */
function getNodeForCharacterOffset(root, offset) {
  var node = getLeafNode(root);
  var nodeStart = 0;
  var nodeEnd = 0;

  while (node) {
    if (node.nodeType === 3) {
      nodeEnd = nodeStart + node.textContent.length;

      if (nodeStart <= offset && nodeEnd >= offset) {
        return {
          node: node,
          offset: offset - nodeStart
        };
      }

      nodeStart = nodeEnd;
    }

    node = getLeafNode(getSiblingNode(node));
  }
}

module.exports = getNodeForCharacterOffset;

/***/ }),
/* 261 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

var isTextNode = __webpack_require__(262);

/*eslint-disable no-bitwise */

/**
 * Checks if a given DOM node contains or is another DOM node.
 */
function containsNode(outerNode, innerNode) {
  if (!outerNode || !innerNode) {
    return false;
  } else if (outerNode === innerNode) {
    return true;
  } else if (isTextNode(outerNode)) {
    return false;
  } else if (isTextNode(innerNode)) {
    return containsNode(outerNode, innerNode.parentNode);
  } else if ('contains' in outerNode) {
    return outerNode.contains(innerNode);
  } else if (outerNode.compareDocumentPosition) {
    return !!(outerNode.compareDocumentPosition(innerNode) & 16);
  } else {
    return false;
  }
}

module.exports = containsNode;

/***/ }),
/* 262 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @typechecks
 */

var isNode = __webpack_require__(263);

/**
 * @param {*} object The object to check.
 * @return {boolean} Whether or not the object is a DOM text node.
 */
function isTextNode(object) {
  return isNode(object) && object.nodeType == 3;
}

module.exports = isTextNode;

/***/ }),
/* 263 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @typechecks
 */

/**
 * @param {*} object The object to check.
 * @return {boolean} Whether or not the object is a DOM node.
 */
function isNode(object) {
  var doc = object ? object.ownerDocument || object : document;
  var defaultView = doc.defaultView || window;
  return !!(object && (typeof defaultView.Node === 'function' ? object instanceof defaultView.Node : typeof object === 'object' && typeof object.nodeType === 'number' && typeof object.nodeName === 'string'));
}

module.exports = isNode;

/***/ }),
/* 264 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var NS = {
  xlink: 'http://www.w3.org/1999/xlink',
  xml: 'http://www.w3.org/XML/1998/namespace'
};

// We use attributes for everything SVG so let's avoid some duplication and run
// code instead.
// The following are all specified in the HTML config already so we exclude here.
// - class (as className)
// - color
// - height
// - id
// - lang
// - max
// - media
// - method
// - min
// - name
// - style
// - target
// - type
// - width
var ATTRS = {
  accentHeight: 'accent-height',
  accumulate: 0,
  additive: 0,
  alignmentBaseline: 'alignment-baseline',
  allowReorder: 'allowReorder',
  alphabetic: 0,
  amplitude: 0,
  arabicForm: 'arabic-form',
  ascent: 0,
  attributeName: 'attributeName',
  attributeType: 'attributeType',
  autoReverse: 'autoReverse',
  azimuth: 0,
  baseFrequency: 'baseFrequency',
  baseProfile: 'baseProfile',
  baselineShift: 'baseline-shift',
  bbox: 0,
  begin: 0,
  bias: 0,
  by: 0,
  calcMode: 'calcMode',
  capHeight: 'cap-height',
  clip: 0,
  clipPath: 'clip-path',
  clipRule: 'clip-rule',
  clipPathUnits: 'clipPathUnits',
  colorInterpolation: 'color-interpolation',
  colorInterpolationFilters: 'color-interpolation-filters',
  colorProfile: 'color-profile',
  colorRendering: 'color-rendering',
  contentScriptType: 'contentScriptType',
  contentStyleType: 'contentStyleType',
  cursor: 0,
  cx: 0,
  cy: 0,
  d: 0,
  decelerate: 0,
  descent: 0,
  diffuseConstant: 'diffuseConstant',
  direction: 0,
  display: 0,
  divisor: 0,
  dominantBaseline: 'dominant-baseline',
  dur: 0,
  dx: 0,
  dy: 0,
  edgeMode: 'edgeMode',
  elevation: 0,
  enableBackground: 'enable-background',
  end: 0,
  exponent: 0,
  externalResourcesRequired: 'externalResourcesRequired',
  fill: 0,
  fillOpacity: 'fill-opacity',
  fillRule: 'fill-rule',
  filter: 0,
  filterRes: 'filterRes',
  filterUnits: 'filterUnits',
  floodColor: 'flood-color',
  floodOpacity: 'flood-opacity',
  focusable: 0,
  fontFamily: 'font-family',
  fontSize: 'font-size',
  fontSizeAdjust: 'font-size-adjust',
  fontStretch: 'font-stretch',
  fontStyle: 'font-style',
  fontVariant: 'font-variant',
  fontWeight: 'font-weight',
  format: 0,
  from: 0,
  fx: 0,
  fy: 0,
  g1: 0,
  g2: 0,
  glyphName: 'glyph-name',
  glyphOrientationHorizontal: 'glyph-orientation-horizontal',
  glyphOrientationVertical: 'glyph-orientation-vertical',
  glyphRef: 'glyphRef',
  gradientTransform: 'gradientTransform',
  gradientUnits: 'gradientUnits',
  hanging: 0,
  horizAdvX: 'horiz-adv-x',
  horizOriginX: 'horiz-origin-x',
  ideographic: 0,
  imageRendering: 'image-rendering',
  'in': 0,
  in2: 0,
  intercept: 0,
  k: 0,
  k1: 0,
  k2: 0,
  k3: 0,
  k4: 0,
  kernelMatrix: 'kernelMatrix',
  kernelUnitLength: 'kernelUnitLength',
  kerning: 0,
  keyPoints: 'keyPoints',
  keySplines: 'keySplines',
  keyTimes: 'keyTimes',
  lengthAdjust: 'lengthAdjust',
  letterSpacing: 'letter-spacing',
  lightingColor: 'lighting-color',
  limitingConeAngle: 'limitingConeAngle',
  local: 0,
  markerEnd: 'marker-end',
  markerMid: 'marker-mid',
  markerStart: 'marker-start',
  markerHeight: 'markerHeight',
  markerUnits: 'markerUnits',
  markerWidth: 'markerWidth',
  mask: 0,
  maskContentUnits: 'maskContentUnits',
  maskUnits: 'maskUnits',
  mathematical: 0,
  mode: 0,
  numOctaves: 'numOctaves',
  offset: 0,
  opacity: 0,
  operator: 0,
  order: 0,
  orient: 0,
  orientation: 0,
  origin: 0,
  overflow: 0,
  overlinePosition: 'overline-position',
  overlineThickness: 'overline-thickness',
  paintOrder: 'paint-order',
  panose1: 'panose-1',
  pathLength: 'pathLength',
  patternContentUnits: 'patternContentUnits',
  patternTransform: 'patternTransform',
  patternUnits: 'patternUnits',
  pointerEvents: 'pointer-events',
  points: 0,
  pointsAtX: 'pointsAtX',
  pointsAtY: 'pointsAtY',
  pointsAtZ: 'pointsAtZ',
  preserveAlpha: 'preserveAlpha',
  preserveAspectRatio: 'preserveAspectRatio',
  primitiveUnits: 'primitiveUnits',
  r: 0,
  radius: 0,
  refX: 'refX',
  refY: 'refY',
  renderingIntent: 'rendering-intent',
  repeatCount: 'repeatCount',
  repeatDur: 'repeatDur',
  requiredExtensions: 'requiredExtensions',
  requiredFeatures: 'requiredFeatures',
  restart: 0,
  result: 0,
  rotate: 0,
  rx: 0,
  ry: 0,
  scale: 0,
  seed: 0,
  shapeRendering: 'shape-rendering',
  slope: 0,
  spacing: 0,
  specularConstant: 'specularConstant',
  specularExponent: 'specularExponent',
  speed: 0,
  spreadMethod: 'spreadMethod',
  startOffset: 'startOffset',
  stdDeviation: 'stdDeviation',
  stemh: 0,
  stemv: 0,
  stitchTiles: 'stitchTiles',
  stopColor: 'stop-color',
  stopOpacity: 'stop-opacity',
  strikethroughPosition: 'strikethrough-position',
  strikethroughThickness: 'strikethrough-thickness',
  string: 0,
  stroke: 0,
  strokeDasharray: 'stroke-dasharray',
  strokeDashoffset: 'stroke-dashoffset',
  strokeLinecap: 'stroke-linecap',
  strokeLinejoin: 'stroke-linejoin',
  strokeMiterlimit: 'stroke-miterlimit',
  strokeOpacity: 'stroke-opacity',
  strokeWidth: 'stroke-width',
  surfaceScale: 'surfaceScale',
  systemLanguage: 'systemLanguage',
  tableValues: 'tableValues',
  targetX: 'targetX',
  targetY: 'targetY',
  textAnchor: 'text-anchor',
  textDecoration: 'text-decoration',
  textRendering: 'text-rendering',
  textLength: 'textLength',
  to: 0,
  transform: 0,
  u1: 0,
  u2: 0,
  underlinePosition: 'underline-position',
  underlineThickness: 'underline-thickness',
  unicode: 0,
  unicodeBidi: 'unicode-bidi',
  unicodeRange: 'unicode-range',
  unitsPerEm: 'units-per-em',
  vAlphabetic: 'v-alphabetic',
  vHanging: 'v-hanging',
  vIdeographic: 'v-ideographic',
  vMathematical: 'v-mathematical',
  values: 0,
  vectorEffect: 'vector-effect',
  version: 0,
  vertAdvY: 'vert-adv-y',
  vertOriginX: 'vert-origin-x',
  vertOriginY: 'vert-origin-y',
  viewBox: 'viewBox',
  viewTarget: 'viewTarget',
  visibility: 0,
  widths: 0,
  wordSpacing: 'word-spacing',
  writingMode: 'writing-mode',
  x: 0,
  xHeight: 'x-height',
  x1: 0,
  x2: 0,
  xChannelSelector: 'xChannelSelector',
  xlinkActuate: 'xlink:actuate',
  xlinkArcrole: 'xlink:arcrole',
  xlinkHref: 'xlink:href',
  xlinkRole: 'xlink:role',
  xlinkShow: 'xlink:show',
  xlinkTitle: 'xlink:title',
  xlinkType: 'xlink:type',
  xmlBase: 'xml:base',
  xmlns: 0,
  xmlnsXlink: 'xmlns:xlink',
  xmlLang: 'xml:lang',
  xmlSpace: 'xml:space',
  y: 0,
  y1: 0,
  y2: 0,
  yChannelSelector: 'yChannelSelector',
  z: 0,
  zoomAndPan: 'zoomAndPan'
};

var SVGDOMPropertyConfig = {
  Properties: {},
  DOMAttributeNamespaces: {
    xlinkActuate: NS.xlink,
    xlinkArcrole: NS.xlink,
    xlinkHref: NS.xlink,
    xlinkRole: NS.xlink,
    xlinkShow: NS.xlink,
    xlinkTitle: NS.xlink,
    xlinkType: NS.xlink,
    xmlBase: NS.xml,
    xmlLang: NS.xml,
    xmlSpace: NS.xml
  },
  DOMAttributeNames: {}
};

Object.keys(ATTRS).forEach(function (key) {
  SVGDOMPropertyConfig.Properties[key] = 0;
  if (ATTRS[key]) {
    SVGDOMPropertyConfig.DOMAttributeNames[key] = ATTRS[key];
  }
});

module.exports = SVGDOMPropertyConfig;

/***/ }),
/* 265 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var EventPropagators = __webpack_require__(40);
var ExecutionEnvironment = __webpack_require__(10);
var ReactDOMComponentTree = __webpack_require__(8);
var ReactInputSelection = __webpack_require__(119);
var SyntheticEvent = __webpack_require__(18);

var getActiveElement = __webpack_require__(120);
var isTextInputElement = __webpack_require__(105);
var shallowEqual = __webpack_require__(75);

var skipSelectionChangeEvent = ExecutionEnvironment.canUseDOM && 'documentMode' in document && document.documentMode <= 11;

var eventTypes = {
  select: {
    phasedRegistrationNames: {
      bubbled: 'onSelect',
      captured: 'onSelectCapture'
    },
    dependencies: ['topBlur', 'topContextMenu', 'topFocus', 'topKeyDown', 'topKeyUp', 'topMouseDown', 'topMouseUp', 'topSelectionChange']
  }
};

var activeElement = null;
var activeElementInst = null;
var lastSelection = null;
var mouseDown = false;

// Track whether a listener exists for this plugin. If none exist, we do
// not extract events. See #3639.
var hasListener = false;

/**
 * Get an object which is a unique representation of the current selection.
 *
 * The return value will not be consistent across nodes or browsers, but
 * two identical selections on the same node will return identical objects.
 *
 * @param {DOMElement} node
 * @return {object}
 */
function getSelection(node) {
  if ('selectionStart' in node && ReactInputSelection.hasSelectionCapabilities(node)) {
    return {
      start: node.selectionStart,
      end: node.selectionEnd
    };
  } else if (window.getSelection) {
    var selection = window.getSelection();
    return {
      anchorNode: selection.anchorNode,
      anchorOffset: selection.anchorOffset,
      focusNode: selection.focusNode,
      focusOffset: selection.focusOffset
    };
  } else if (document.selection) {
    var range = document.selection.createRange();
    return {
      parentElement: range.parentElement(),
      text: range.text,
      top: range.boundingTop,
      left: range.boundingLeft
    };
  }
}

/**
 * Poll selection to see whether it's changed.
 *
 * @param {object} nativeEvent
 * @return {?SyntheticEvent}
 */
function constructSelectEvent(nativeEvent, nativeEventTarget) {
  // Ensure we have the right element, and that the user is not dragging a
  // selection (this matches native `select` event behavior). In HTML5, select
  // fires only on input and textarea thus if there's no focused element we
  // won't dispatch.
  if (mouseDown || activeElement == null || activeElement !== getActiveElement()) {
    return null;
  }

  // Only fire when selection has actually changed.
  var currentSelection = getSelection(activeElement);
  if (!lastSelection || !shallowEqual(lastSelection, currentSelection)) {
    lastSelection = currentSelection;

    var syntheticEvent = SyntheticEvent.getPooled(eventTypes.select, activeElementInst, nativeEvent, nativeEventTarget);

    syntheticEvent.type = 'select';
    syntheticEvent.target = activeElement;

    EventPropagators.accumulateTwoPhaseDispatches(syntheticEvent);

    return syntheticEvent;
  }

  return null;
}

/**
 * This plugin creates an `onSelect` event that normalizes select events
 * across form elements.
 *
 * Supported elements are:
 * - input (see `isTextInputElement`)
 * - textarea
 * - contentEditable
 *
 * This differs from native browser implementations in the following ways:
 * - Fires on contentEditable fields as well as inputs.
 * - Fires for collapsed selection.
 * - Fires after user input.
 */
var SelectEventPlugin = {
  eventTypes: eventTypes,

  extractEvents: function (topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    if (!hasListener) {
      return null;
    }

    var targetNode = targetInst ? ReactDOMComponentTree.getNodeFromInstance(targetInst) : window;

    switch (topLevelType) {
      // Track the input node that has focus.
      case 'topFocus':
        if (isTextInputElement(targetNode) || targetNode.contentEditable === 'true') {
          activeElement = targetNode;
          activeElementInst = targetInst;
          lastSelection = null;
        }
        break;
      case 'topBlur':
        activeElement = null;
        activeElementInst = null;
        lastSelection = null;
        break;
      // Don't fire the event while the user is dragging. This matches the
      // semantics of the native select event.
      case 'topMouseDown':
        mouseDown = true;
        break;
      case 'topContextMenu':
      case 'topMouseUp':
        mouseDown = false;
        return constructSelectEvent(nativeEvent, nativeEventTarget);
      // Chrome and IE fire non-standard event when selection is changed (and
      // sometimes when it hasn't). IE's event fires out of order with respect
      // to key and input events on deletion, so we discard it.
      //
      // Firefox doesn't support selectionchange, so check selection status
      // after each key entry. The selection changes after keydown and before
      // keyup, but we check on keydown as well in the case of holding down a
      // key, when multiple keydown events are fired but only one keyup is.
      // This is also our approach for IE handling, for the reason above.
      case 'topSelectionChange':
        if (skipSelectionChangeEvent) {
          break;
        }
      // falls through
      case 'topKeyDown':
      case 'topKeyUp':
        return constructSelectEvent(nativeEvent, nativeEventTarget);
    }

    return null;
  },

  didPutListener: function (inst, registrationName, listener) {
    if (registrationName === 'onSelect') {
      hasListener = true;
    }
  }
};

module.exports = SelectEventPlugin;

/***/ }),
/* 266 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var _prodInvariant = __webpack_require__(4);

var EventListener = __webpack_require__(118);
var EventPropagators = __webpack_require__(40);
var ReactDOMComponentTree = __webpack_require__(8);
var SyntheticAnimationEvent = __webpack_require__(267);
var SyntheticClipboardEvent = __webpack_require__(268);
var SyntheticEvent = __webpack_require__(18);
var SyntheticFocusEvent = __webpack_require__(269);
var SyntheticKeyboardEvent = __webpack_require__(270);
var SyntheticMouseEvent = __webpack_require__(53);
var SyntheticDragEvent = __webpack_require__(272);
var SyntheticTouchEvent = __webpack_require__(273);
var SyntheticTransitionEvent = __webpack_require__(274);
var SyntheticUIEvent = __webpack_require__(42);
var SyntheticWheelEvent = __webpack_require__(275);

var emptyFunction = __webpack_require__(13);
var getEventCharCode = __webpack_require__(80);
var invariant = __webpack_require__(1);

/**
 * Turns
 * ['abort', ...]
 * into
 * eventTypes = {
 *   'abort': {
 *     phasedRegistrationNames: {
 *       bubbled: 'onAbort',
 *       captured: 'onAbortCapture',
 *     },
 *     dependencies: ['topAbort'],
 *   },
 *   ...
 * };
 * topLevelEventsToDispatchConfig = {
 *   'topAbort': { sameConfig }
 * };
 */
var eventTypes = {};
var topLevelEventsToDispatchConfig = {};
['abort', 'animationEnd', 'animationIteration', 'animationStart', 'blur', 'canPlay', 'canPlayThrough', 'click', 'contextMenu', 'copy', 'cut', 'doubleClick', 'drag', 'dragEnd', 'dragEnter', 'dragExit', 'dragLeave', 'dragOver', 'dragStart', 'drop', 'durationChange', 'emptied', 'encrypted', 'ended', 'error', 'focus', 'input', 'invalid', 'keyDown', 'keyPress', 'keyUp', 'load', 'loadedData', 'loadedMetadata', 'loadStart', 'mouseDown', 'mouseMove', 'mouseOut', 'mouseOver', 'mouseUp', 'paste', 'pause', 'play', 'playing', 'progress', 'rateChange', 'reset', 'scroll', 'seeked', 'seeking', 'stalled', 'submit', 'suspend', 'timeUpdate', 'touchCancel', 'touchEnd', 'touchMove', 'touchStart', 'transitionEnd', 'volumeChange', 'waiting', 'wheel'].forEach(function (event) {
  var capitalizedEvent = event[0].toUpperCase() + event.slice(1);
  var onEvent = 'on' + capitalizedEvent;
  var topEvent = 'top' + capitalizedEvent;

  var type = {
    phasedRegistrationNames: {
      bubbled: onEvent,
      captured: onEvent + 'Capture'
    },
    dependencies: [topEvent]
  };
  eventTypes[event] = type;
  topLevelEventsToDispatchConfig[topEvent] = type;
});

var onClickListeners = {};

function getDictionaryKey(inst) {
  // Prevents V8 performance issue:
  // https://github.com/facebook/react/pull/7232
  return '.' + inst._rootNodeID;
}

function isInteractive(tag) {
  return tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea';
}

var SimpleEventPlugin = {
  eventTypes: eventTypes,

  extractEvents: function (topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    var dispatchConfig = topLevelEventsToDispatchConfig[topLevelType];
    if (!dispatchConfig) {
      return null;
    }
    var EventConstructor;
    switch (topLevelType) {
      case 'topAbort':
      case 'topCanPlay':
      case 'topCanPlayThrough':
      case 'topDurationChange':
      case 'topEmptied':
      case 'topEncrypted':
      case 'topEnded':
      case 'topError':
      case 'topInput':
      case 'topInvalid':
      case 'topLoad':
      case 'topLoadedData':
      case 'topLoadedMetadata':
      case 'topLoadStart':
      case 'topPause':
      case 'topPlay':
      case 'topPlaying':
      case 'topProgress':
      case 'topRateChange':
      case 'topReset':
      case 'topSeeked':
      case 'topSeeking':
      case 'topStalled':
      case 'topSubmit':
      case 'topSuspend':
      case 'topTimeUpdate':
      case 'topVolumeChange':
      case 'topWaiting':
        // HTML Events
        // @see http://www.w3.org/TR/html5/index.html#events-0
        EventConstructor = SyntheticEvent;
        break;
      case 'topKeyPress':
        // Firefox creates a keypress event for function keys too. This removes
        // the unwanted keypress events. Enter is however both printable and
        // non-printable. One would expect Tab to be as well (but it isn't).
        if (getEventCharCode(nativeEvent) === 0) {
          return null;
        }
      /* falls through */
      case 'topKeyDown':
      case 'topKeyUp':
        EventConstructor = SyntheticKeyboardEvent;
        break;
      case 'topBlur':
      case 'topFocus':
        EventConstructor = SyntheticFocusEvent;
        break;
      case 'topClick':
        // Firefox creates a click event on right mouse clicks. This removes the
        // unwanted click events.
        if (nativeEvent.button === 2) {
          return null;
        }
      /* falls through */
      case 'topDoubleClick':
      case 'topMouseDown':
      case 'topMouseMove':
      case 'topMouseUp':
      // TODO: Disabled elements should not respond to mouse events
      /* falls through */
      case 'topMouseOut':
      case 'topMouseOver':
      case 'topContextMenu':
        EventConstructor = SyntheticMouseEvent;
        break;
      case 'topDrag':
      case 'topDragEnd':
      case 'topDragEnter':
      case 'topDragExit':
      case 'topDragLeave':
      case 'topDragOver':
      case 'topDragStart':
      case 'topDrop':
        EventConstructor = SyntheticDragEvent;
        break;
      case 'topTouchCancel':
      case 'topTouchEnd':
      case 'topTouchMove':
      case 'topTouchStart':
        EventConstructor = SyntheticTouchEvent;
        break;
      case 'topAnimationEnd':
      case 'topAnimationIteration':
      case 'topAnimationStart':
        EventConstructor = SyntheticAnimationEvent;
        break;
      case 'topTransitionEnd':
        EventConstructor = SyntheticTransitionEvent;
        break;
      case 'topScroll':
        EventConstructor = SyntheticUIEvent;
        break;
      case 'topWheel':
        EventConstructor = SyntheticWheelEvent;
        break;
      case 'topCopy':
      case 'topCut':
      case 'topPaste':
        EventConstructor = SyntheticClipboardEvent;
        break;
    }
    !EventConstructor ? process.env.NODE_ENV !== 'production' ? invariant(false, 'SimpleEventPlugin: Unhandled event type, `%s`.', topLevelType) : _prodInvariant('86', topLevelType) : void 0;
    var event = EventConstructor.getPooled(dispatchConfig, targetInst, nativeEvent, nativeEventTarget);
    EventPropagators.accumulateTwoPhaseDispatches(event);
    return event;
  },

  didPutListener: function (inst, registrationName, listener) {
    // Mobile Safari does not fire properly bubble click events on
    // non-interactive elements, which means delegated click listeners do not
    // fire. The workaround for this bug involves attaching an empty click
    // listener on the target node.
    // http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
    if (registrationName === 'onClick' && !isInteractive(inst._tag)) {
      var key = getDictionaryKey(inst);
      var node = ReactDOMComponentTree.getNodeFromInstance(inst);
      if (!onClickListeners[key]) {
        onClickListeners[key] = EventListener.listen(node, 'click', emptyFunction);
      }
    }
  },

  willDeleteListener: function (inst, registrationName) {
    if (registrationName === 'onClick' && !isInteractive(inst._tag)) {
      var key = getDictionaryKey(inst);
      onClickListeners[key].remove();
      delete onClickListeners[key];
    }
  }
};

module.exports = SimpleEventPlugin;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 267 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var SyntheticEvent = __webpack_require__(18);

/**
 * @interface Event
 * @see http://www.w3.org/TR/css3-animations/#AnimationEvent-interface
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AnimationEvent
 */
var AnimationEventInterface = {
  animationName: null,
  elapsedTime: null,
  pseudoElement: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticEvent}
 */
function SyntheticAnimationEvent(dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget) {
  return SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget);
}

SyntheticEvent.augmentClass(SyntheticAnimationEvent, AnimationEventInterface);

module.exports = SyntheticAnimationEvent;

/***/ }),
/* 268 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var SyntheticEvent = __webpack_require__(18);

/**
 * @interface Event
 * @see http://www.w3.org/TR/clipboard-apis/
 */
var ClipboardEventInterface = {
  clipboardData: function (event) {
    return 'clipboardData' in event ? event.clipboardData : window.clipboardData;
  }
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticClipboardEvent(dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget) {
  return SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget);
}

SyntheticEvent.augmentClass(SyntheticClipboardEvent, ClipboardEventInterface);

module.exports = SyntheticClipboardEvent;

/***/ }),
/* 269 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var SyntheticUIEvent = __webpack_require__(42);

/**
 * @interface FocusEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var FocusEventInterface = {
  relatedTarget: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticFocusEvent(dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget) {
  return SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget);
}

SyntheticUIEvent.augmentClass(SyntheticFocusEvent, FocusEventInterface);

module.exports = SyntheticFocusEvent;

/***/ }),
/* 270 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var SyntheticUIEvent = __webpack_require__(42);

var getEventCharCode = __webpack_require__(80);
var getEventKey = __webpack_require__(271);
var getEventModifierState = __webpack_require__(69);

/**
 * @interface KeyboardEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var KeyboardEventInterface = {
  key: getEventKey,
  location: null,
  ctrlKey: null,
  shiftKey: null,
  altKey: null,
  metaKey: null,
  repeat: null,
  locale: null,
  getModifierState: getEventModifierState,
  // Legacy Interface
  charCode: function (event) {
    // `charCode` is the result of a KeyPress event and represents the value of
    // the actual printable character.

    // KeyPress is deprecated, but its replacement is not yet final and not
    // implemented in any major browser. Only KeyPress has charCode.
    if (event.type === 'keypress') {
      return getEventCharCode(event);
    }
    return 0;
  },
  keyCode: function (event) {
    // `keyCode` is the result of a KeyDown/Up event and represents the value of
    // physical keyboard key.

    // The actual meaning of the value depends on the users' keyboard layout
    // which cannot be detected. Assuming that it is a US keyboard layout
    // provides a surprisingly accurate mapping for US and European users.
    // Due to this, it is left to the user to implement at this time.
    if (event.type === 'keydown' || event.type === 'keyup') {
      return event.keyCode;
    }
    return 0;
  },
  which: function (event) {
    // `which` is an alias for either `keyCode` or `charCode` depending on the
    // type of the event.
    if (event.type === 'keypress') {
      return getEventCharCode(event);
    }
    if (event.type === 'keydown' || event.type === 'keyup') {
      return event.keyCode;
    }
    return 0;
  }
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticKeyboardEvent(dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget) {
  return SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget);
}

SyntheticUIEvent.augmentClass(SyntheticKeyboardEvent, KeyboardEventInterface);

module.exports = SyntheticKeyboardEvent;

/***/ }),
/* 271 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var getEventCharCode = __webpack_require__(80);

/**
 * Normalization of deprecated HTML5 `key` values
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Key_names
 */
var normalizeKey = {
  Esc: 'Escape',
  Spacebar: ' ',
  Left: 'ArrowLeft',
  Up: 'ArrowUp',
  Right: 'ArrowRight',
  Down: 'ArrowDown',
  Del: 'Delete',
  Win: 'OS',
  Menu: 'ContextMenu',
  Apps: 'ContextMenu',
  Scroll: 'ScrollLock',
  MozPrintableKey: 'Unidentified'
};

/**
 * Translation from legacy `keyCode` to HTML5 `key`
 * Only special keys supported, all others depend on keyboard layout or browser
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Key_names
 */
var translateToKey = {
  8: 'Backspace',
  9: 'Tab',
  12: 'Clear',
  13: 'Enter',
  16: 'Shift',
  17: 'Control',
  18: 'Alt',
  19: 'Pause',
  20: 'CapsLock',
  27: 'Escape',
  32: ' ',
  33: 'PageUp',
  34: 'PageDown',
  35: 'End',
  36: 'Home',
  37: 'ArrowLeft',
  38: 'ArrowUp',
  39: 'ArrowRight',
  40: 'ArrowDown',
  45: 'Insert',
  46: 'Delete',
  112: 'F1',
  113: 'F2',
  114: 'F3',
  115: 'F4',
  116: 'F5',
  117: 'F6',
  118: 'F7',
  119: 'F8',
  120: 'F9',
  121: 'F10',
  122: 'F11',
  123: 'F12',
  144: 'NumLock',
  145: 'ScrollLock',
  224: 'Meta'
};

/**
 * @param {object} nativeEvent Native browser event.
 * @return {string} Normalized `key` property.
 */
function getEventKey(nativeEvent) {
  if (nativeEvent.key) {
    // Normalize inconsistent values reported by browsers due to
    // implementations of a working draft specification.

    // FireFox implements `key` but returns `MozPrintableKey` for all
    // printable characters (normalized to `Unidentified`), ignore it.
    var key = normalizeKey[nativeEvent.key] || nativeEvent.key;
    if (key !== 'Unidentified') {
      return key;
    }
  }

  // Browser does not implement `key`, polyfill as much of it as we can.
  if (nativeEvent.type === 'keypress') {
    var charCode = getEventCharCode(nativeEvent);

    // The enter-key is technically both printable and non-printable and can
    // thus be captured by `keypress`, no other non-printable key should.
    return charCode === 13 ? 'Enter' : String.fromCharCode(charCode);
  }
  if (nativeEvent.type === 'keydown' || nativeEvent.type === 'keyup') {
    // While user keyboard layout determines the actual meaning of each
    // `keyCode` value, almost all function keys have a universal value.
    return translateToKey[nativeEvent.keyCode] || 'Unidentified';
  }
  return '';
}

module.exports = getEventKey;

/***/ }),
/* 272 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var SyntheticMouseEvent = __webpack_require__(53);

/**
 * @interface DragEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var DragEventInterface = {
  dataTransfer: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticDragEvent(dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget) {
  return SyntheticMouseEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget);
}

SyntheticMouseEvent.augmentClass(SyntheticDragEvent, DragEventInterface);

module.exports = SyntheticDragEvent;

/***/ }),
/* 273 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var SyntheticUIEvent = __webpack_require__(42);

var getEventModifierState = __webpack_require__(69);

/**
 * @interface TouchEvent
 * @see http://www.w3.org/TR/touch-events/
 */
var TouchEventInterface = {
  touches: null,
  targetTouches: null,
  changedTouches: null,
  altKey: null,
  metaKey: null,
  ctrlKey: null,
  shiftKey: null,
  getModifierState: getEventModifierState
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticTouchEvent(dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget) {
  return SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget);
}

SyntheticUIEvent.augmentClass(SyntheticTouchEvent, TouchEventInterface);

module.exports = SyntheticTouchEvent;

/***/ }),
/* 274 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var SyntheticEvent = __webpack_require__(18);

/**
 * @interface Event
 * @see http://www.w3.org/TR/2009/WD-css3-transitions-20090320/#transition-events-
 * @see https://developer.mozilla.org/en-US/docs/Web/API/TransitionEvent
 */
var TransitionEventInterface = {
  propertyName: null,
  elapsedTime: null,
  pseudoElement: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticEvent}
 */
function SyntheticTransitionEvent(dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget) {
  return SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget);
}

SyntheticEvent.augmentClass(SyntheticTransitionEvent, TransitionEventInterface);

module.exports = SyntheticTransitionEvent;

/***/ }),
/* 275 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var SyntheticMouseEvent = __webpack_require__(53);

/**
 * @interface WheelEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var WheelEventInterface = {
  deltaX: function (event) {
    return 'deltaX' in event ? event.deltaX : // Fallback to `wheelDeltaX` for Webkit and normalize (right is positive).
    'wheelDeltaX' in event ? -event.wheelDeltaX : 0;
  },
  deltaY: function (event) {
    return 'deltaY' in event ? event.deltaY : // Fallback to `wheelDeltaY` for Webkit and normalize (down is positive).
    'wheelDeltaY' in event ? -event.wheelDeltaY : // Fallback to `wheelDelta` for IE<9 and normalize (down is positive).
    'wheelDelta' in event ? -event.wheelDelta : 0;
  },
  deltaZ: null,

  // Browsers without "deltaMode" is reporting in raw wheel delta where one
  // notch on the scroll is always +/- 120, roughly equivalent to pixels.
  // A good approximation of DOM_DELTA_LINE (1) is 5% of viewport size or
  // ~40 pixels, for DOM_DELTA_SCREEN (2) it is 87.5% of viewport size.
  deltaMode: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticMouseEvent}
 */
function SyntheticWheelEvent(dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget) {
  return SyntheticMouseEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget);
}

SyntheticMouseEvent.augmentClass(SyntheticWheelEvent, WheelEventInterface);

module.exports = SyntheticWheelEvent;

/***/ }),
/* 276 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var validateDOMNesting = __webpack_require__(79);

var DOC_NODE_TYPE = 9;

function ReactDOMContainerInfo(topLevelWrapper, node) {
  var info = {
    _topLevelWrapper: topLevelWrapper,
    _idCounter: 1,
    _ownerDocument: node ? node.nodeType === DOC_NODE_TYPE ? node : node.ownerDocument : null,
    _node: node,
    _tag: node ? node.nodeName.toLowerCase() : null,
    _namespaceURI: node ? node.namespaceURI : null
  };
  if (process.env.NODE_ENV !== 'production') {
    info._ancestorInfo = node ? validateDOMNesting.updatedAncestorInfo(null, info._tag, null) : null;
  }
  return info;
}

module.exports = ReactDOMContainerInfo;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 277 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var ReactDOMFeatureFlags = {
  useCreateElement: true,
  useFiber: false
};

module.exports = ReactDOMFeatureFlags;

/***/ }),
/* 278 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var adler32 = __webpack_require__(279);

var TAG_END = /\/?>/;
var COMMENT_START = /^<\!\-\-/;

var ReactMarkupChecksum = {
  CHECKSUM_ATTR_NAME: 'data-react-checksum',

  /**
   * @param {string} markup Markup string
   * @return {string} Markup string with checksum attribute attached
   */
  addChecksumToMarkup: function (markup) {
    var checksum = adler32(markup);

    // Add checksum (handle both parent tags, comments and self-closing tags)
    if (COMMENT_START.test(markup)) {
      return markup;
    } else {
      return markup.replace(TAG_END, ' ' + ReactMarkupChecksum.CHECKSUM_ATTR_NAME + '="' + checksum + '"$&');
    }
  },

  /**
   * @param {string} markup to use
   * @param {DOMElement} element root React element
   * @returns {boolean} whether or not the markup is the same
   */
  canReuseMarkup: function (markup, element) {
    var existingChecksum = element.getAttribute(ReactMarkupChecksum.CHECKSUM_ATTR_NAME);
    existingChecksum = existingChecksum && parseInt(existingChecksum, 10);
    var markupChecksum = adler32(markup);
    return markupChecksum === existingChecksum;
  }
};

module.exports = ReactMarkupChecksum;

/***/ }),
/* 279 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */



var MOD = 65521;

// adler32 is not cryptographically strong, and is only used to sanity check that
// markup generated on the server matches the markup generated on the client.
// This implementation (a modified version of the SheetJS version) has been optimized
// for our use case, at the expense of conforming to the adler32 specification
// for non-ascii inputs.
function adler32(data) {
  var a = 1;
  var b = 0;
  var i = 0;
  var l = data.length;
  var m = l & ~0x3;
  while (i < m) {
    var n = Math.min(i + 4096, m);
    for (; i < n; i += 4) {
      b += (a += data.charCodeAt(i)) + (a += data.charCodeAt(i + 1)) + (a += data.charCodeAt(i + 2)) + (a += data.charCodeAt(i + 3));
    }
    a %= MOD;
    b %= MOD;
  }
  for (; i < l; i++) {
    b += a += data.charCodeAt(i);
  }
  a %= MOD;
  b %= MOD;
  return a | b << 16;
}

module.exports = adler32;

/***/ }),
/* 280 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



module.exports = '15.6.1';

/***/ }),
/* 281 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _prodInvariant = __webpack_require__(4);

var ReactCurrentOwner = __webpack_require__(14);
var ReactDOMComponentTree = __webpack_require__(8);
var ReactInstanceMap = __webpack_require__(43);

var getHostComponentFromComposite = __webpack_require__(122);
var invariant = __webpack_require__(1);
var warning = __webpack_require__(2);

/**
 * Returns the DOM node rendered by this element.
 *
 * See https://facebook.github.io/react/docs/top-level-api.html#reactdom.finddomnode
 *
 * @param {ReactComponent|DOMElement} componentOrElement
 * @return {?DOMElement} The root node of this element.
 */
function findDOMNode(componentOrElement) {
  if (process.env.NODE_ENV !== 'production') {
    var owner = ReactCurrentOwner.current;
    if (owner !== null) {
      process.env.NODE_ENV !== 'production' ? warning(owner._warnedAboutRefsInRender, '%s is accessing findDOMNode inside its render(). ' + 'render() should be a pure function of props and state. It should ' + 'never access something that requires stale data from the previous ' + 'render, such as refs. Move this logic to componentDidMount and ' + 'componentDidUpdate instead.', owner.getName() || 'A component') : void 0;
      owner._warnedAboutRefsInRender = true;
    }
  }
  if (componentOrElement == null) {
    return null;
  }
  if (componentOrElement.nodeType === 1) {
    return componentOrElement;
  }

  var inst = ReactInstanceMap.get(componentOrElement);
  if (inst) {
    inst = getHostComponentFromComposite(inst);
    return inst ? ReactDOMComponentTree.getNodeFromInstance(inst) : null;
  }

  if (typeof componentOrElement.render === 'function') {
     true ? process.env.NODE_ENV !== 'production' ? invariant(false, 'findDOMNode was called on an unmounted component.') : _prodInvariant('44') : void 0;
  } else {
     true ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Element appears to be neither ReactComponent nor DOMNode (keys: %s)', Object.keys(componentOrElement)) : _prodInvariant('45', Object.keys(componentOrElement)) : void 0;
  }
}

module.exports = findDOMNode;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 282 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var ReactMount = __webpack_require__(121);

module.exports = ReactMount.renderSubtreeIntoContainer;

/***/ }),
/* 283 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var DOMProperty = __webpack_require__(23);
var EventPluginRegistry = __webpack_require__(51);
var ReactComponentTreeHook = __webpack_require__(11);

var warning = __webpack_require__(2);

if (process.env.NODE_ENV !== 'production') {
  var reactProps = {
    children: true,
    dangerouslySetInnerHTML: true,
    key: true,
    ref: true,

    autoFocus: true,
    defaultValue: true,
    valueLink: true,
    defaultChecked: true,
    checkedLink: true,
    innerHTML: true,
    suppressContentEditableWarning: true,
    onFocusIn: true,
    onFocusOut: true
  };
  var warnedProperties = {};

  var validateProperty = function (tagName, name, debugID) {
    if (DOMProperty.properties.hasOwnProperty(name) || DOMProperty.isCustomAttribute(name)) {
      return true;
    }
    if (reactProps.hasOwnProperty(name) && reactProps[name] || warnedProperties.hasOwnProperty(name) && warnedProperties[name]) {
      return true;
    }
    if (EventPluginRegistry.registrationNameModules.hasOwnProperty(name)) {
      return true;
    }
    warnedProperties[name] = true;
    var lowerCasedName = name.toLowerCase();

    // data-* attributes should be lowercase; suggest the lowercase version
    var standardName = DOMProperty.isCustomAttribute(lowerCasedName) ? lowerCasedName : DOMProperty.getPossibleStandardName.hasOwnProperty(lowerCasedName) ? DOMProperty.getPossibleStandardName[lowerCasedName] : null;

    var registrationName = EventPluginRegistry.possibleRegistrationNames.hasOwnProperty(lowerCasedName) ? EventPluginRegistry.possibleRegistrationNames[lowerCasedName] : null;

    if (standardName != null) {
      process.env.NODE_ENV !== 'production' ? warning(false, 'Unknown DOM property %s. Did you mean %s?%s', name, standardName, ReactComponentTreeHook.getStackAddendumByID(debugID)) : void 0;
      return true;
    } else if (registrationName != null) {
      process.env.NODE_ENV !== 'production' ? warning(false, 'Unknown event handler property %s. Did you mean `%s`?%s', name, registrationName, ReactComponentTreeHook.getStackAddendumByID(debugID)) : void 0;
      return true;
    } else {
      // We were unable to guess which prop the user intended.
      // It is likely that the user was just blindly spreading/forwarding props
      // Components should be careful to only render valid props/attributes.
      // Warning will be invoked in warnUnknownProperties to allow grouping.
      return false;
    }
  };
}

var warnUnknownProperties = function (debugID, element) {
  var unknownProps = [];
  for (var key in element.props) {
    var isValid = validateProperty(element.type, key, debugID);
    if (!isValid) {
      unknownProps.push(key);
    }
  }

  var unknownPropString = unknownProps.map(function (prop) {
    return '`' + prop + '`';
  }).join(', ');

  if (unknownProps.length === 1) {
    process.env.NODE_ENV !== 'production' ? warning(false, 'Unknown prop %s on <%s> tag. Remove this prop from the element. ' + 'For details, see https://fb.me/react-unknown-prop%s', unknownPropString, element.type, ReactComponentTreeHook.getStackAddendumByID(debugID)) : void 0;
  } else if (unknownProps.length > 1) {
    process.env.NODE_ENV !== 'production' ? warning(false, 'Unknown props %s on <%s> tag. Remove these props from the element. ' + 'For details, see https://fb.me/react-unknown-prop%s', unknownPropString, element.type, ReactComponentTreeHook.getStackAddendumByID(debugID)) : void 0;
  }
};

function handleElement(debugID, element) {
  if (element == null || typeof element.type !== 'string') {
    return;
  }
  if (element.type.indexOf('-') >= 0 || element.props.is) {
    return;
  }
  warnUnknownProperties(debugID, element);
}

var ReactDOMUnknownPropertyHook = {
  onBeforeMountComponent: function (debugID, element) {
    handleElement(debugID, element);
  },
  onBeforeUpdateComponent: function (debugID, element) {
    handleElement(debugID, element);
  }
};

module.exports = ReactDOMUnknownPropertyHook;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 284 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var ReactComponentTreeHook = __webpack_require__(11);

var warning = __webpack_require__(2);

var didWarnValueNull = false;

function handleElement(debugID, element) {
  if (element == null) {
    return;
  }
  if (element.type !== 'input' && element.type !== 'textarea' && element.type !== 'select') {
    return;
  }
  if (element.props != null && element.props.value === null && !didWarnValueNull) {
    process.env.NODE_ENV !== 'production' ? warning(false, '`value` prop on `%s` should not be null. ' + 'Consider using the empty string to clear the component or `undefined` ' + 'for uncontrolled components.%s', element.type, ReactComponentTreeHook.getStackAddendumByID(debugID)) : void 0;

    didWarnValueNull = true;
  }
}

var ReactDOMNullInputValuePropHook = {
  onBeforeMountComponent: function (debugID, element) {
    handleElement(debugID, element);
  },
  onBeforeUpdateComponent: function (debugID, element) {
    handleElement(debugID, element);
  }
};

module.exports = ReactDOMNullInputValuePropHook;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 285 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var DOMProperty = __webpack_require__(23);
var ReactComponentTreeHook = __webpack_require__(11);

var warning = __webpack_require__(2);

var warnedProperties = {};
var rARIA = new RegExp('^(aria)-[' + DOMProperty.ATTRIBUTE_NAME_CHAR + ']*$');

function validateProperty(tagName, name, debugID) {
  if (warnedProperties.hasOwnProperty(name) && warnedProperties[name]) {
    return true;
  }

  if (rARIA.test(name)) {
    var lowerCasedName = name.toLowerCase();
    var standardName = DOMProperty.getPossibleStandardName.hasOwnProperty(lowerCasedName) ? DOMProperty.getPossibleStandardName[lowerCasedName] : null;

    // If this is an aria-* attribute, but is not listed in the known DOM
    // DOM properties, then it is an invalid aria-* attribute.
    if (standardName == null) {
      warnedProperties[name] = true;
      return false;
    }
    // aria-* attributes should be lowercase; suggest the lowercase version.
    if (name !== standardName) {
      process.env.NODE_ENV !== 'production' ? warning(false, 'Unknown ARIA attribute %s. Did you mean %s?%s', name, standardName, ReactComponentTreeHook.getStackAddendumByID(debugID)) : void 0;
      warnedProperties[name] = true;
      return true;
    }
  }

  return true;
}

function warnInvalidARIAProps(debugID, element) {
  var invalidProps = [];

  for (var key in element.props) {
    var isValid = validateProperty(element.type, key, debugID);
    if (!isValid) {
      invalidProps.push(key);
    }
  }

  var unknownPropString = invalidProps.map(function (prop) {
    return '`' + prop + '`';
  }).join(', ');

  if (invalidProps.length === 1) {
    process.env.NODE_ENV !== 'production' ? warning(false, 'Invalid aria prop %s on <%s> tag. ' + 'For details, see https://fb.me/invalid-aria-prop%s', unknownPropString, element.type, ReactComponentTreeHook.getStackAddendumByID(debugID)) : void 0;
  } else if (invalidProps.length > 1) {
    process.env.NODE_ENV !== 'production' ? warning(false, 'Invalid aria props %s on <%s> tag. ' + 'For details, see https://fb.me/invalid-aria-prop%s', unknownPropString, element.type, ReactComponentTreeHook.getStackAddendumByID(debugID)) : void 0;
  }
}

function handleElement(debugID, element) {
  if (element == null || typeof element.type !== 'string') {
    return;
  }
  if (element.type.indexOf('-') >= 0 || element.props.is) {
    return;
  }

  warnInvalidARIAProps(debugID, element);
}

var ReactDOMInvalidARIAHook = {
  onBeforeMountComponent: function (debugID, element) {
    if (process.env.NODE_ENV !== 'production') {
      handleElement(debugID, element);
    }
  },
  onBeforeUpdateComponent: function (debugID, element) {
    if (process.env.NODE_ENV !== 'production') {
      handleElement(debugID, element);
    }
  }
};

module.exports = ReactDOMInvalidARIAHook;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(485)))

/***/ }),
/* 286 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function($) {

var _tree = __webpack_require__(64);

var _model_fits = __webpack_require__(124);

var _prop_chart = __webpack_require__(97);

var _navbar = __webpack_require__(21);

var _scrollspy = __webpack_require__(22);

var _tables = __webpack_require__(20);

var _saveSvgAsPng = __webpack_require__(125);

var _input_info = __webpack_require__(39);

__webpack_require__(50);
__webpack_require__(123);

var React = __webpack_require__(5),
    ReactDOM = __webpack_require__(17),
    d3 = __webpack_require__(6),
    d3_save_svg = __webpack_require__(126);

var datamonkey = __webpack_require__(19);
var _ = __webpack_require__(9);

var BUSTEDSummary = React.createClass({
  displayName: "BUSTEDSummary",

  render: function render() {
    var significant = this.props.test_result.p < 0.05,
        message;
    if (significant) {
      message = React.createElement(
        "p",
        null,
        "BUSTED ",
        React.createElement(
          "strong",
          { className: "hyphy-highlight" },
          "found evidence"
        ),
        " ",
        "(LRT, p-value \u2264 .05) of gene-wide episodic diversifying selection in the selected foreground of your phylogeny. Therefore, there is evidence that at least one site on at least one foreground branch has experienced diversifying selection.",
        " "
      );
    } else {
      message = React.createElement(
        "p",
        null,
        "BUSTED ",
        React.createElement(
          "strong",
          { className: "hyphy-highlight" },
          "found no evidence"
        ),
        " ",
        "(LRT, p-value \u2264 .05) of gene-wide episodic diversifying selection in the selected foreground of your phylogeny. Therefore, there is no evidence that any sites have experienced diversifying selection along the foreground branch(es).",
        " "
      );
    }
    return React.createElement(
      "div",
      { className: "row", id: "summary-div" },
      React.createElement(
        "div",
        { className: "col-md-12" },
        React.createElement(
          "h3",
          { className: "list-group-item-heading" },
          React.createElement(
            "span",
            { className: "summary-method-name" },
            "Branch-Site Unrestricted Statistical Test for Episodic Diversification"
          ),
          React.createElement("br", null),
          React.createElement(
            "span",
            { className: "results-summary" },
            "results summary"
          )
        )
      ),
      React.createElement(
        "div",
        { className: "col-md-12" },
        React.createElement(_input_info.InputInfo, { input_data: this.props.input_data })
      ),
      React.createElement(
        "div",
        { className: "col-md-12" },
        React.createElement(
          "div",
          { className: "main-result" },
          message,
          React.createElement("hr", null),
          React.createElement(
            "p",
            null,
            React.createElement(
              "small",
              null,
              "See",
              " ",
              React.createElement(
                "a",
                { href: "http://hyphy.org/methods/selection-methods/#busted" },
                "here"
              ),
              " ",
              "for more information about the BUSTED method.",
              React.createElement("br", null),
              "Please cite",
              " ",
              React.createElement(
                "a",
                {
                  href: "http://www.ncbi.nlm.nih.gov/pubmed/25701167",
                  id: "summary-pmid",
                  target: "_blank"
                },
                "PMID 25701167"
              ),
              " ",
              "if you use this result in a publication, presentation, or other scientific work."
            )
          )
        )
      )
    );
  }
});

var BUSTEDSiteChartAndTable = React.createClass({
  displayName: "BUSTEDSiteChartAndTable",

  getInitialState: function getInitialState() {
    return {
      lower_site_range: 0,
      upper_site_range: null,
      constrained_evidence_ratio_threshold: "-Infinity",
      optimized_null_evidence_ratio_threshold: "-Infinity",
      brushend_event: false
    };
  },
  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    this.setState({
      upper_site_range: nextProps.data.length + 1,
      brushend_event: false
    });
  },
  componentDidUpdate: function componentDidUpdate() {
    if (!this.state.brushend_event) {
      d3.select("#chart-id").html("");
      this.drawChart();
    }
  },
  componentDidMount: function componentDidMount() {
    d3.select("#export-chart-png").on("click", function (e) {
      (0, _saveSvgAsPng.saveSvgAsPng)(document.getElementById("chart"), "busted-chart.png");
    });
    d3.select("#export-chart-svg").on("click", function (e) {
      d3_save_svg.save(d3.select("#chart").node(), { filename: "busted" });
    });
  },
  drawChart: function drawChart() {
    var self = this,
        number_of_sites = this.props.data.length,
        margin = { top: 20, right: 20, bottom: 40, left: 50 },
        width = $("#chart-id").width() - margin.left - margin.right,
        height = 270 - margin.top - margin.bottom,
        ymin = d3.min(self.props.data.map(function (d) {
      return Math.min(d.constrained_evidence_ratio, d.optimized_null_evidence_ratio);
    })),
        ymax = d3.max(self.props.data.map(function (d) {
      return Math.max(d.constrained_evidence_ratio, d.optimized_null_evidence_ratio);
    })),
        x = d3.scale.linear().domain([0, number_of_sites]).range([0, width]),
        y = d3.scale.linear().domain([ymin, ymax]).range([height, 0]),
        yAxisTicks = d3.range(5 * Math.ceil(ymin / 5), 5 * Math.floor(ymax / 5) + 1, 5),
        xAxis = d3.svg.axis().scale(x).orient("bottom").tickValues(d3.range(5, number_of_sites, 5)),
        yAxis = d3.svg.axis().scale(y).orient("left").tickValues(yAxisTicks),
        cer_line = d3.svg.line().x(function (d, i) {
      return x(d.site_index);
    }).y(function (d, i) {
      return y(d.constrained_evidence_ratio);
    }),
        oner_line = d3.svg.line().x(function (d, i) {
      return x(d.site_index);
    }).y(function (d, i) {
      return y(d.optimized_null_evidence_ratio);
    }),
        svg = d3.select("#chart-id").append("svg").attr("id", "chart").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom);

    svg.append("rect").attr("width", "100%").attr("height", "100%").attr("fill", "white");

    var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    g.selectAll(".axis-line").data(yAxisTicks).enter().append("line").attr("x1", 0).attr("x2", width).attr("y1", function (d) {
      return y(d);
    }).attr("y2", function (d) {
      return y(d);
    }).style("stroke", "#eee").style("stroke-width", 1);
    g.append("path").attr("class", "line").attr("d", oner_line(self.props.data)).style("fill", "none").style("stroke-width", 2).style("stroke", "#000");
    g.append("path").attr("class", "line").attr("d", cer_line(self.props.data)).style("fill", "none").style("stroke-width", 2).style("stroke", "#00a99d");
    g.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);
    g.append("text").attr("x", width / 2).attr("y", height + margin.bottom).style("text-anchor", "middle").text("Site index");
    g.append("g").attr("class", "y axis").call(yAxis);
    g.append("text").attr("transform", "rotate(-90)").attr("x", -height / 2).attr("y", -margin.left).attr("dy", "1em").style("text-anchor", "middle").text("2*Logarithm of evidence ratio");
    var c_legend = svg.append("g").attr("class", "legend").attr("transform", "translate( " + 0.8 * width + "," + 0.05 * height + ")").attr("text-anchor", "end");
    c_legend.append("text").text("Constrained").attr("x", 115).attr("y", 7.5).attr("dy", ".32em");
    c_legend.append("rect").attr("width", 15).attr("height", 15).attr("fill", "#00a99d");
    var on_legend = svg.append("g").attr("class", "legend").attr("transform", "translate( " + 0.8 * width + "," + 0.15 * height + ")").attr("text-anchor", "end");
    on_legend.append("text").text("Optimized Null").attr("x", 135).attr("y", 7.5).attr("dy", ".32em");
    on_legend.append("rect").attr("width", 15).attr("height", 15).attr("fill", "#000");

    function brushend() {
      var extent = brush.extent();
      if (extent[0] != extent[1]) {
        self.setState({
          lower_site_range: extent[0],
          upper_site_range: extent[1],
          brushend_event: true
        });
      } else {
        self.setState({
          lower_site_range: 0,
          upper_site_range: self.props.data.length + 1,
          brushend_event: true
        });
      }
    }

    var brush = d3.svg.brush().x(x).on("brushend", brushend);

    g.append("g").attr("class", "brush").call(brush).selectAll("rect").attr("height", height);
  },
  handleONERChange: function handleONERChange(event) {
    if (/^-?[0-9]*(\.[0-9]*)?$/.test(event.target.value)) {
      this.setState({
        optimized_null_evidence_ratio_threshold: event.target.value
      });
    } else if (event.target.value == "-I") {
      this.setState({
        optimized_null_evidence_ratio_threshold: "-Infinity"
      });
    } else if (event.target.value == "-Infinit") {
      this.setState({
        optimized_null_evidence_ratio_threshold: ""
      });
    }
  },
  handleONERFocus: function handleONERFocus(event) {
    this.setState({
      optimized_null_evidence_ratio_threshold: ""
    });
  },
  handleONERBlur: function handleONERBlur(event) {
    if (!event.target.value) {
      this.setState({
        optimized_null_evidence_ratio_threshold: "-Infinity"
      });
    }
  },
  handleCERChange: function handleCERChange(event) {
    if (/^-?[0-9]*(\.[0-9]*)?$/.test(event.target.value)) {
      this.setState({
        constrained_evidence_ratio_threshold: event.target.value
      });
    } else if (event.target.value == "-I") {
      this.setState({
        constrained_evidence_ratio_threshold: "-Infinity"
      });
    } else if (event.target.value == "-Infinit") {
      this.setState({
        constrained_evidence_ratio_threshold: ""
      });
    }
  },
  handleCERFocus: function handleCERFocus(event) {
    this.setState({
      constrained_evidence_ratio_threshold: ""
    });
  },
  handleCERBlur: function handleCERBlur(event) {
    if (!event.target.value) {
      this.setState({
        constrained_evidence_ratio_threshold: "-Infinity"
      });
    }
  },
  headerData: [{
    abbr: "Position of site in multiple sequence alignment.",
    sortable: true,
    value: "Site index"
  }, {
    abbr: "Likelihood of unconstrained model.",
    sortable: true,
    value: "Unconstrained likelihood"
  }, {
    abbr: "Likelihood of constrained model.",
    sortable: true,
    value: "Constrained likelihood"
  },, "Optimized Null Likelihood", "Constrained Statistic", "Optimized Null Statistic"],
  render: function render() {
    var self = this,
        float_format = d3.format(".2f"),
        bodyData = _.filter(this.props.data, function (element, index) {
      var valid_optimized_null_evidence_ratio = _.contains(["-Infinity", "", "-"], self.state.optimized_null_evidence_ratio_threshold) || element.optimized_null_evidence_ratio > +self.state.optimized_null_evidence_ratio_threshold,
          valid_constrained_evidence_ratio = _.contains(["-Infinity", "", "-"], self.state.constrained_evidence_ratio_threshold) || element.constrained_evidence_ratio > +self.state.constrained_evidence_ratio_threshold,
          valid_ers = valid_constrained_evidence_ratio && valid_optimized_null_evidence_ratio,
          valid_site = element.site_index > self.state.lower_site_range && element.site_index < self.state.upper_site_range;
      return valid_ers && valid_site;
    }).map(function (row) {
      return _.values(row).map(function (d, i) {
        return i != 0 ? +float_format(d) : +d;
      });
    });
    return React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        { className: "row hyphy-busted-site-table" },
        React.createElement(
          "div",
          { className: "col-md-12" },
          React.createElement(
            "h4",
            { className: "dm-table-header" },
            "Model Test Statistics Per Site",
            React.createElement("span", {
              className: "glyphicon glyphicon-info-sign",
              style: { verticalAlign: "middle", float: "right" },
              "aria-hidden": "true",
              "data-toggle": "popover",
              "data-trigger": "hover",
              title: "Actions",
              "data-html": "true",
              "data-content": "<ul><li>Hover over a column header for a description of its content.</li></ul>",
              "data-placement": "bottom"
            })
          )
        ),
        React.createElement(
          "div",
          { className: "col-lg-12" },
          React.createElement(
            "button",
            {
              id: "export-chart-svg",
              type: "button",
              className: "btn btn-default btn-sm pull-right btn-export"
            },
            React.createElement("span", { className: "glyphicon glyphicon-floppy-save" }),
            " Export Chart to SVG"
          ),
          React.createElement(
            "button",
            {
              id: "export-chart-png",
              type: "button",
              className: "btn btn-default btn-sm pull-right btn-export"
            },
            React.createElement("span", { className: "glyphicon glyphicon-floppy-save" }),
            " Export Chart to PNG"
          )
        ),
        React.createElement("div", { id: "chart-id", className: "col-lg-12" })
      ),
      React.createElement(
        "div",
        { className: "row site-table" },
        React.createElement(
          "div",
          { className: "col-lg-6" },
          React.createElement(
            "div",
            { className: "form-group" },
            React.createElement(
              "label",
              { "for": "er-constrained-threshold" },
              "Constrained Test Statistic"
            ),
            React.createElement("input", {
              type: "text",
              className: "form-control",
              id: "er-constrained-threshold",
              value: this.state.constrained_evidence_ratio_threshold,
              onChange: this.handleCERChange,
              onFocus: this.handleCERFocus,
              onBlur: this.handleCERBlur
            })
          )
        ),
        React.createElement(
          "div",
          { className: "col-lg-6" },
          React.createElement(
            "div",
            { className: "form-group" },
            React.createElement(
              "label",
              { "for": "er-optimized-null-threshold" },
              "Optimized Null Test Statistic"
            ),
            React.createElement("input", {
              type: "text",
              className: "form-control",
              id: "er-optimized-null-threshold",
              value: this.state.optimized_null_evidence_ratio_threshold,
              onChange: this.handleONERChange,
              onFocus: this.handleONERFocus,
              onBlur: this.handleONERBlur
            })
          )
        ),
        React.createElement(
          "div",
          { className: "col-lg-12" },
          React.createElement(_tables.DatamonkeyTable, {
            headerData: this.headerData,
            bodyData: bodyData,
            paginate: Math.min(20, bodyData.length),
            initialSort: 0,
            classes: "table table-condensed table-striped",
            export_csv: true
          })
        )
      )
    );
  }

});

var BUSTED = React.createClass({
  displayName: "BUSTED",

  float_format: d3.format(".2f"),
  p_value_format: d3.format(".4f"),
  fit_format: d3.format(".2f"),

  loadFromServer: function loadFromServer() {
    var self = this;

    d3.json(this.props.url, function (data) {
      data["fits"]["Unconstrained model"]["branch-annotations"] = self.formatBranchAnnotations(data, "Unconstrained model");
      data["fits"]["Constrained model"]["branch-annotations"] = self.formatBranchAnnotations(data, "Constrained model");

      // rename rate distributions
      data["fits"]["Unconstrained model"]["rate-distributions"] = data["fits"]["Unconstrained model"]["rate distributions"];
      data["fits"]["Constrained model"]["rate-distributions"] = data["fits"]["Constrained model"]["rate distributions"];

      // set display order
      data["fits"]["Unconstrained model"]["display-order"] = 0;
      data["fits"]["Constrained model"]["display-order"] = 1;

      var json = data,
          pmid = "25701167",
          pmid_text = "PubMed ID " + pmid,
          pmid_href = "http://www.ncbi.nlm.nih.gov/pubmed/" + pmid,
          p = json["test results"]["p"],
          statement = p <= 0.05 ? "evidence" : "no evidence";

      var fg_rate = json["fits"]["Unconstrained model"]["rate distributions"]["FG"];
      var mapped_omegas = {
        omegas: _.map(fg_rate, function (d) {
          return _.object(["omega", "prop"], d);
        })
      };

      self.setState({
        p: p,
        test_result: {
          statement: statement,
          p: p
        },
        json: json,
        omegas: mapped_omegas["omegas"],
        pmid: {
          text: pmid_text,
          href: pmid_href
        },
        input_data: data["input_data"],
        evidence_ratio_data: _.map(_.range(data.input_data["sites"]), function (i) {
          return {
            site_index: i + 1,
            unconstrained_likelihood: data["profiles"]["unconstrained"][0][i],
            constained_likelihood: data["profiles"]["constrained"][0][i],
            optimized_null_likelihood: data["profiles"]["optimized null"][0][i],
            constrained_evidence_ratio: 2 * Math.log(data["evidence ratios"]["constrained"][0][i]),
            optimized_null_evidence_ratio: 2 * Math.log(data["evidence ratios"]["optimized null"][0][i])
          };
        })
      });
    });
  },

  colorGradient: ["red", "green"],
  grayScaleGradient: ["#444444", "#000000"],

  getDefaultProps: function getDefaultProps() {

    var edgeColorizer = function edgeColorizer(element, data, foreground_color) {

      var is_foreground = data.target.annotations.is_foreground,
          color_fill = foreground_color(0);

      element.style("stroke", is_foreground ? color_fill : "gray").style("stroke-linejoin", "round").style("stroke-linejoin", "round").style("stroke-linecap", "round");
    };

    var tree_settings = {
      omegaPlot: {},
      "tree-options": {
        /* value arrays have the following meaning
                [0] - the value of the attribute
                [1] - does the change in attribute value trigger tree re-layout?
            */
        "hyphy-tree-model": ["Unconstrained model", true],
        "hyphy-tree-highlight": ["RELAX.test", false],
        "hyphy-tree-branch-lengths": [true, true],
        "hyphy-tree-hide-legend": [true, false],
        "hyphy-tree-fill-color": [true, false]
      },
      "hyphy-tree-legend-type": "discrete",
      "suppress-tree-render": false,
      "chart-append-html": true,
      edgeColorizer: edgeColorizer
    };

    var distro_settings = {
      dimensions: { width: 600, height: 400 },
      margins: { left: 50, right: 15, bottom: 35, top: 35 },
      legend: false,
      domain: [0.00001, 100],
      do_log_plot: true,
      k_p: null,
      plot: null,
      svg_id: "prop-chart"
    };

    return {
      distro_settings: distro_settings,
      tree_settings: tree_settings,
      constrained_threshold: "Infinity",
      null_threshold: "-Infinity",
      model_name: "FG"
    };
  },

  getInitialState: function getInitialState() {
    return {
      p: null,
      test_result: {
        statement: null,
        p: null
      },
      json: null,
      omegas: null,
      pmid: {
        href: null,
        text: null
      },
      input_data: null,
      table_rows: []
    };
  },

  setEvents: function setEvents() {
    var self = this;

    $("#json-file").on("change", function (e) {
      var files = e.target.files; // FileList object
      if (files.length == 1) {
        var f = files[0];
        var reader = new FileReader();
        reader.onload = function (theFile) {
          return function (e) {
            var data = JSON.parse(this.result);
            data["fits"]["Unconstrained model"]["branch-annotations"] = self.formatBranchAnnotations(data, "Unconstrained model");
            data["fits"]["Constrained model"]["branch-annotations"] = self.formatBranchAnnotations(data, "Constrained model");

            // rename rate distributions
            data["fits"]["Unconstrained model"]["rate-distributions"] = data["fits"]["Unconstrained model"]["rate distributions"];
            data["fits"]["Constrained model"]["rate-distributions"] = data["fits"]["Constrained model"]["rate distributions"];

            var json = data,
                pmid = "25701167",
                pmid_text = "PubMed ID " + pmid,
                pmid_href = "http://www.ncbi.nlm.nih.gov/pubmed/" + pmid,
                p = json["test results"]["p"],
                statement = p <= 0.05 ? "evidence" : "no evidence";

            var fg_rate = json["fits"]["Unconstrained model"]["rate distributions"]["FG"];
            var mapped_omegas = {
              omegas: _.map(fg_rate, function (d) {
                return _.object(["omega", "prop"], d);
              })
            };

            self.setState({
              p: p,
              test_result: {
                statement: statement,
                p: p
              },
              json: json,
              omegas: mapped_omegas["omegas"],
              pmid: {
                text: pmid_text,
                href: pmid_href
              },
              input_data: data["input_data"]
            });
          };
        }(f);
        reader.readAsText(f);
      }
      $("#json-file").dropdown("toggle");
      e.preventDefault();
    });
  },

  formatBranchAnnotations: function formatBranchAnnotations(json, key) {
    // attach is_foreground to branch annotations
    var foreground = json["test set"].split(",");

    var tree = d3.layout.phylotree(),
        nodes = tree(json["fits"][key]["tree string"]).get_nodes(),
        node_names = _.map(nodes, function (d) {
      return d.name;
    });

    // Iterate over objects
    var branch_annotations = _.object(node_names, _.map(node_names, function (d) {
      return { is_foreground: _.indexOf(foreground, d) > -1 };
    }));

    return branch_annotations;
  },

  initialize: function initialize() {
    var json = this.state.json;

    if (!json) {
      return;
    }

    // delete existing tree
    d3.select("#tree_container").select("svg").remove();

    $("#export-dist-svg").on("click", function (e) {
      datamonkey.save_image("svg", "#primary-omega-dist");
    });

    $("#export-dist-png").on("click", function (e) {
      datamonkey.save_image("png", "#primary-omega-dist");
    });
  },

  componentWillMount: function componentWillMount() {
    this.loadFromServer();
    this.setEvents();
  },

  componentDidUpdate: function componentDidUpdate(prevProps, prevState) {
    $("body").scrollspy({
      target: ".bs-docs-sidebar",
      offset: 50
    });
    $('[data-toggle="popover"]').popover();
  },


  render: function render() {

    var self = this;
    self.initialize();
    var scrollspy_info = [{ label: "summary", href: "summary-div" }, { label: "model statistics", href: "hyphy-model-fits" }, { label: "input tree", href: "phylogenetic-tree" }, { label: "ω distribution", href: "primary-omega-dist" }];

    var models = {};
    if (!_.isNull(self.state.json)) {
      models = self.state.json.fits;
    }

    return React.createElement(
      "div",
      null,
      React.createElement(_navbar.NavBar, null),
      React.createElement(
        "div",
        { className: "container" },
        React.createElement(
          "div",
          { className: "row" },
          React.createElement(_scrollspy.ScrollSpy, { info: scrollspy_info }),
          React.createElement(
            "div",
            { className: "col-lg-10" },
            React.createElement(
              "div",
              { id: "results" },
              React.createElement(
                "div",
                { id: "summary-tab" },
                React.createElement(BUSTEDSummary, {
                  test_result: this.state.test_result,
                  pmid: this.state.pmid,
                  input_data: self.state.input_data
                })
              )
            ),
            React.createElement(
              "div",
              { className: "row" },
              React.createElement(
                "div",
                { id: "hyphy-model-fits", className: "col-lg-12" },
                React.createElement(_model_fits.ModelFits, { json: self.state.json }),
                React.createElement(
                  "p",
                  { className: "description" },
                  "This table reports a statistical summary of the models fit to the data. Here, ",
                  React.createElement(
                    "strong",
                    null,
                    "Unconstrained model"
                  ),
                  " ",
                  "refers to the BUSTED alternative model for selection, and",
                  " ",
                  React.createElement(
                    "strong",
                    null,
                    "Constrained model"
                  ),
                  " refers to the BUSTED null model for selection."
                )
              )
            ),
            React.createElement(BUSTEDSiteChartAndTable, { data: this.state.evidence_ratio_data }),
            React.createElement(
              "div",
              { className: "row" },
              React.createElement(
                "div",
                { className: "col-md-12", id: "phylogenetic-tree" },
                React.createElement(_tree.Tree, {
                  json: self.state.json,
                  settings: self.props.tree_settings,
                  models: models,
                  color_gradient: self.colorGradient,
                  grayscale_gradient: self.grayscaleGradient
                })
              ),
              React.createElement(
                "div",
                { className: "col-md-12" },
                React.createElement(
                  "h4",
                  { className: "dm-table-header" },
                  "\u03C9 distribution"
                ),
                React.createElement(
                  "div",
                  { id: "primary-omega-dist", className: "panel-body" },
                  React.createElement(_prop_chart.PropChart, {
                    name: self.props.model_name,
                    omegas: self.state.omegas,
                    settings: self.props.distro_settings
                  })
                )
              )
            )
          ),
          React.createElement("div", { className: "col-lg-1" })
        )
      )
    );
  }
});

// Will need to make a call to this
// omega distributions
var render_busted = function render_busted(url, element) {
  ReactDOM.render(React.createElement(BUSTED, { url: url }), document.getElementById(element));
};

module.exports = render_busted;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)))

/***/ }),
/* 287 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function($, d3) {

var datamonkey_fade = function datamonkey_fade(json) {
  var _use_BF = false;

  var fade_results = json["results"]["FADE"];

  var dict_to_array = function dict_to_array(dict) {
    ar = [];
    for (var k in dict) {
      ar.push(dict[k]);
    }
    return ar;
  };

  var keys_in_dict = function keys_in_dict(dict) {
    ar = [];
    for (var k in dict) {
      ar.push(k);
    }
    return ar;
  };

  //For displaying table with Posteriors
  var display_column_map = function display_column_map(row) {
    var result = [parseInt(row[0])];

    for (var k = 4; k < row.length; k += 5) {
      result.push(row[k]);
    }
    return result;
  };

  //For displaying table with BFs
  var display_column_map_bf = function display_column_map_bf(row) {
    //result = [parseInt(row[0]),row[3]];
    var result = [parseInt(row[0])];

    for (var k = 5; k < row.length; k += 5) {
      result.push(row[k]);
    }
    return result;
  };

  var row_display_filter = function row_display_filter(d) {
    //Any row, with at least one val > thres must get displayed. Any elements greater must be in red.
    // if (d.slice(2).reduce (function (a,b) {return a+b;}) == 0.0) {return false;}
    //console.log (d, this);
    for (var k = 1; k < 21; k++) {
      if (d[k] > this) return true;
    }
    return false;
  };

  var initial_display = function initial_display() {
    $("#filter_on_pvalue").trigger("submit");
    plot_property_graphs("property_plot_svg", fade_results); //Using a matrix from html
  };

  var set_handlers = function set_handlers(file_id) {
    var fade_headers = [["Site", "A", "C", "D", "E", "F", "G", "H", "I", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "V", "W", "Y"], ["Site", "Alanine", "Cysteine", "Aspartic acid", "Glutamic acid", "Phenylalanine", "Glycine", "Histidine", "Isoleucine", "Lysine", "Leucine", "Methionine", "Asparagine", "Proline", "Glutamine", "Arginine", "Serine", "Threonine", "Valine", "Tryptophan", "Tyrosin"]];

    var found = "";

    $("body").attr("data-job-id", file_id);
    $("#filter_on_pvalue").submit(function (e) {
      cutoff = parseFloat($("#pvalue")[0].value);
      if (_use_BF) {
        found = load_analysis_results("prime_table", fade_headers, fade_results, display_column_map_bf, row_display_filter);
      } else {
        found = load_analysis_results("prime_table", fade_headers, fade_results, display_column_map, row_display_filter);
      }
      d3.select("#total_sites_found").selectAll("span").data(found).html(function (d) {
        return d;
      });
      return false;
    });

    $("#site_rate_display").on("show", function (e) {
      //alert ("Show");
      //console.log (this);
      return true;
    });

    $("body").on("click", '[data-toggle="modal"]', function (event) {
      display_site_properties($(this).attr("data-codon-id"));
    });

    $("#set-p-value").click(function (event) {
      d3.select("#pq_selector").html("Posterior <span class='caret'></span>");
      _use_BF = false;
      event.preventDefault();
    });

    $("#set-q-value").click(function (event) {
      d3.select("#pq_selector").html("BF <span class='caret'></span>");
      _use_BF = true;
      event.preventDefault();
    });

    $("body").on("click", "#property_selector .btn", function (event) {
      event.stopPropagation(); // prevent default bootstrap behavior
      if ($(this).attr("data-toggle") != "button") {
        // don't toggle if data-toggle="button"
        $(this).toggleClass("active");
      }
      toggle_view("property_plot_svg", parseInt($(this).attr("data-property-id")), $(this).hasClass("active")); // button state AFTER the click
    });
  };

  var property_plot_done = false;

  var display_site_properties = function display_site_properties(site_id) {
    job_id = $("body").attr("data-job-id");
    url = "/cgi-bin/datamonkey/wrapHyPhyBF.pl?file=fade_site&mode=1&arguments=" + job_id + "-" + site_id;
    d3.json(url, function (json) {
      site_info(json, site_id);
    });
  };

  var toggle_view = function toggle_view(property_plot, group, show_hide) {
    if (show_hide) {
      prop = "visible";
    } else {
      prop = "hidden";
    }
    d3.select("#" + property_plot).selectAll(".dot" + group).style("visibility", prop);
  };

  var site_info = function site_info(values, site_id) {
    d3.select("#site_rate_display_header").html("Detailed information about site " + site_id);
    elements = dict_to_array(values);
    headers = keys_in_dict(elements[0]).sort();
    var header_element = d3.select("#site_info_table").select("thead");
    header_element.selectAll("th").remove();
    header_element.selectAll("th").data(headers).enter().append("th").html(function (d, i //Get header of table
    ) {
      return d;
    });
  };

  var plot_property_graphs = function plot_property_graphs(property_plot, property_info) {
    if (!property_plot_done) {
      property_info = property_info.map(display_column_map);
      property_plot_done = true;
      var site_count = property_info.length;

      //console.log (d3.extent (property_info.map(function (d){return d[0];})));

      var margin = { top: 20, right: 40, bottom: 30, left: 40 },
          width = 800 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

      var x = d3.scale.linear().range([0, width]);

      var y = d3.scale.linear().range([height, 0]);

      var color = d3.scale.category10();

      var xAxis = d3.svg.axis().scale(x).orient("bottom");

      var yAxis = d3.svg.axis().scale(y).orient("left");

      var yAxis2 = d3.svg.axis().scale(y).orient("right");

      var make_x_axis = function make_x_axis() {
        return d3.svg.axis().scale(x).orient("bottom").ticks(20);
      };

      var make_y_axis = function make_y_axis() {
        return d3.svg.axis().scale(y).orient("left").ticks(20);
      };

      var svg = d3.select("#" + property_plot).attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      x.domain([1, site_count]);
      y.domain([0, 1]);

      svg.append("g").attr("class", "x hyphy-axis").attr("transform", "translate(0," + height + ")").call(xAxis).append("text")
      //.attr("class", "label")
      .attr("x", width).attr("y", 30).style("text-anchor", "end").text("Site index");

      svg.append("g").attr("class", "grid").call(make_y_axis().tickSize(-width, 0, 0).tickFormat(""));

      svg.append("g").attr("class", "grid").attr("transform", "translate(0," + height + ")").call(make_x_axis().tickSize(-height, 0, 0).tickFormat(""));

      svg.append("g").attr("class", "y hyphy-axis").call(yAxis).append("text")
      //.attr("class", "label")
      .attr("transform", "rotate(-90)").attr("y", -37).attr("dy", ".71em").style("text-anchor", "end").text("P(Bias>1)");

      var y2 = svg.append("g").attr("class", "y hyphy-axis").attr("transform", "translate(" + width + ",0)").call(yAxis2.tickFormat(""));

      y2.append("text")
      //.attr("class", "label")
      .attr("transform", "rotate(-90)").attr("y", 10).attr("dy", ".71em").style("text-anchor", "end").text("High Posteriors");

      y2.append("text")
      //.attr("class", "label")
      .attr("transform", "rotate(-90)").attr("y", 10).attr("x", -height).attr("dy", ".71em").style("text-anchor", "start").text("Low Posteriors");

      svg.selectAll(".legend").data(color.domain()).enter().append("g").attr("class", "legend").attr("transform", function (d, i) {
        return "translate(0," + i * 20 + ")";
      });

      var h = {}; //Hash of numbers -> AA names for labels
      h[1] = "Alanine";
      h[2] = "Cysteine";
      h[3] = "Aspartic acid";
      h[4] = "Glutamic acid";
      h[5] = "Phenylalanine";
      h[6] = "Glycine";
      h[7] = "Histidine";
      h[8] = "Isoleucine";
      h[9] = "Lysine";
      h[10] = "Leucine";
      h[11] = "Methionine";
      h[12] = "Asparagine";
      h[13] = "Proline";
      h[14] = "Glutamine";
      h[15] = "Arginine";
      h[16] = "Serine";
      h[17] = "Threonine";
      h[18] = "Valine";
      h[19] = "Tryptophan";
      h[20] = "Tyrosine";

      var vis = "visible";
      for (var series = 1; series <= 20; series++) {
        if (series > 1) {
          vis = "hidden";
        }
        svg.selectAll(".dot" + series).data(property_info).enter().append("circle").attr("class", "dot" + series).attr("r", function (d) {
          if (d[series] == 0) return 1;
          return 3.5;
        }).attr("cx", function (d) {
          return x(d[0]);
        }).attr("cy", function (d) {
          return y(d[series]);
        }).style("fill", function (d) {
          return color(series);
        }).style("opacity", 0.5).style("visibility", vis).append("title").text(function (d) {
          return "Site " + d[0] + ", " + h[series] + " P(Beta>1) =" + d[series];
        });
        d3.select("#show_property" + series).style("color", function (d) {
          return color(series);
        }); //Colour buttons on HTML
      }
    }
  };

  var load_analysis_results = function load_analysis_results(id, headers, matrix, column_selector, condition) {
    var header_element = d3.select("#" + id).select("thead");
    header_element.selectAll("th").remove();
    header_element.selectAll("th").data(headers[0]).enter().append("th").html(function (d, i //Get header of table
    ) {
      return "<a href='#' data-toggle='tooltip' data-placement = 'right' data-html = true title data-original-title='" + headers[1][i] + "'>" + d + "</a>";
    });

    var parent_element = d3.select("#" + id).select("tbody");
    parent_element.selectAll("tr").remove();
    var filtered_matrix = matrix.map(column_selector).filter(condition, cutoff); //Get the columns to display in table
    var rows = parent_element.selectAll("tr").data(function (d) {
      return filtered_matrix;
    });
    var conserved = 0;
    rows.enter().append("tr").selectAll("td").data(function (d) {
      return d;
    }).enter().append("td").html(function (d, i) {
      d = parseFloat(d);
      if (i) {
        if (_use_BF == false) {
          if (d > 0.99) return "1.00";
          return d.toFixed(2);
        } else {
          if (d > 100) return "100+";
          return d.toFixed(1);
        }
      }
      return "<b>" + d + "</b> <a href='#site_rate_display' data-toggle='modal' data-codon-id = '" + d + "' data-placement = 'bottom'><i class='icon-list'></i></a>";
    }).classed("btn-danger", function (d, i, j) {
      if (d >= cutoff && i >= 1) {
        conserved++;
        return true;
      }
      return false;
    });

    d3.select("#" + id).classed("table-striped table-hover", true);
    $("a").tooltip();
    return [filtered_matrix.length, conserved];
  };

  set_handlers("test");
  initial_display();
};

module.exports = datamonkey_fade;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3), __webpack_require__(6)))

/***/ }),
/* 288 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var React = __webpack_require__(5),
    d3 = __webpack_require__(6);

var FadeSummary = React.createClass({
  displayName: "FadeSummary",

  float_format: d3.format(".2f"),

  countBranchesTested: function countBranchesTested(branches_tested) {
    if (branches_tested) {
      return branches_tested.split(";").length;
    } else {
      return 0;
    }
  },

  getDefaultProps: function getDefaultProps() {
    return {
      subs: []
    };
  },

  componentDidMount: function componentDidMount() {
    this.setProps({
      alpha_level: 0.05,
      sequences: this.props.msa.sequences,
      subs: this.props.fade_results["TREE_LENGTHS"][0],
      sites: this.props.msa.sites,
      model: this.props.fade_results["MODEL_INFO"],
      grid_desc: this.props.fade_results["GRID_DESCRIPTION"],
      branches_tested: this.props.fade_results["BRANCHES_TESTED"]
    });
  },

  render: function render() {
    var self = this;

    return React.createElement(
      "dl",
      { className: "dl-horizontal" },
      React.createElement(
        "dt",
        null,
        "Data summary"
      ),
      React.createElement(
        "dd",
        null,
        this.props.sequences,
        " sequences with ",
        this.props.partitions,
        " ",
        "partitions."
      ),
      React.createElement(
        "dd",
        null,
        React.createElement(
          "div",
          { className: "alert" },
          "These sequences have not been screened for recombination. Selection analyses of alignments with recombinants in them using a single tree may generate ",
          React.createElement(
            "u",
            null,
            "misleading"
          ),
          " results."
        )
      ),
      this.props.msa.partition_info.map(function (partition, index) {
        return React.createElement(
          "div",
          null,
          React.createElement(
            "dt",
            null,
            "Partition ",
            partition["partition"]
          ),
          React.createElement(
            "dd",
            null,
            " ",
            self.float_format(self.props.subs[index]),
            " subs/ aminoacid site"
          ),
          React.createElement(
            "dd",
            null,
            partition["endcodon"] - partition["startcodon"],
            " aminoacids"
          )
        );
      }),
      React.createElement(
        "dt",
        null,
        "Settings"
      ),
      React.createElement(
        "dd",
        null,
        this.props.model
      ),
      React.createElement(
        "dd",
        null,
        this.props.grid_desc
      ),
      React.createElement(
        "dd",
        null,
        "Directional model applied to",
        " ",
        self.countBranchesTested(this.props.branches_tested),
        " branches"
      )
    );
  }
});

// Will need to make a call to this
// omega distributions
function render_fade_summary(json, msa) {
  React.render(React.createElement(FadeSummary, { fade_results: json, msa: msa }), document.getElementById("summary-div"));
}

module.exports = render_fade_summary;

/***/ }),
/* 289 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(d3, $) {

var _tables = __webpack_require__(20);

var _graphs = __webpack_require__(44);

var _navbar = __webpack_require__(21);

var _scrollspy = __webpack_require__(22);

var _reactCopyToClipboard = __webpack_require__(290);

var _reactCopyToClipboard2 = _interopRequireDefault(_reactCopyToClipboard);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var React = __webpack_require__(5),
    ReactDOM = __webpack_require__(17),
    _ = __webpack_require__(9);

var FEL = React.createClass({
  displayName: "FEL",

  definePlotData: function definePlotData(x_label, y_label) {

    var x = _.map(this.state.mle_results, function (d) {
      return d[x_label];
    });

    var y = _.map(this.state.mle_results, function (d) {
      return d[y_label];
    });

    return { x: x, y: [y] };
  },

  float_format: d3.format(".3f"),

  formatHeadersForTable: function formatHeadersForTable(mle) {
    return _.map(mle, function (d) {
      return _.object(["value", "abbr"], d);
    });
  },

  updateAxisSelection: function updateAxisSelection(e) {
    var state_to_update = {},
        dimension = e.target.dataset.dimension,
        axis = e.target.dataset.axis;

    state_to_update[axis] = dimension;
    this.setState(state_to_update);
  },

  updatePvalThreshold: function updatePvalThreshold(e) {

    // Get number of positively and negatively selected sites by p-value threshold
    var pvalue_threshold = parseFloat(e.target.value);

    // Get number of positively and negatively selected sites by p-value threshold
    var mle_results = _.map(this.state.mle_results, function (d) {
      d["is_positive"] = parseFloat(d["beta"]) / parseFloat(d["alpha"]) > 1 && parseFloat(d["p-value"]) <= pvalue_threshold;
      d["is_negative"] = parseFloat(d["beta"]) / parseFloat(d["alpha"]) < 1 && parseFloat(d["p-value"]) <= pvalue_threshold;
      return d;
    });

    var positively_selected = _.filter(this.state.mle_results, function (d) {
      return d["is_positive"];
    });
    var negatively_selected = _.filter(this.state.mle_results, function (d) {
      return d["is_negative"];
    });

    // highlight mle_content with whether they are significant or not
    var mle_content = _.map(this.state.mle_results, function (d, key) {
      var classes = "";
      if (mle_results[key].is_positive) {
        classes = "success";
      } else if (mle_results[key].is_negative) {
        classes = "warning";
      }
      return _.map(_.values(d), function (g) {
        return { value: g, classes: classes };
      });
    });

    this.setState({
      positively_selected: positively_selected,
      negatively_selected: negatively_selected,
      pvalue_threshold: pvalue_threshold,
      mle_results: mle_results,
      mle_content: mle_content
    });
  },

  getDefaultProps: function getDefaultProps() {
    return {};
  },

  getInitialState: function getInitialState() {
    return {
      mle_headers: [],
      mle_content: [],
      xaxis: "Site",
      yaxis: "alpha",
      copy_transition: false,
      pvalue_threshold: 0.1,
      positively_selected: [],
      negatively_selected: []
    };
  },

  loadFromServer: function loadFromServer() {
    var _this = this;

    d3.json(this.props.url, function (data) {
      var mle = data["MLE"];

      // These variables are to be used for DatamonkeyTable
      var mle_headers = mle.headers || [];
      var mle_content = mle.content[0] || [];

      mle_headers = _this.formatHeadersForTable(mle_headers);

      _.each(mle_headers, function (d) {
        return d["sortable"] = true;
      });

      // format content
      mle_content = _.map(mle_content, function (d) {
        return _.map(d, function (g) {
          return _this.float_format(g);
        });
      });

      // add a site count to both headers and content
      mle_headers = [{ value: "Site", sortable: true, abbr: "Site Position" }].concat(mle_headers);

      mle_content = _.map(mle_content, function (d, key) {
        var k = key + 1;
        return [k].concat(d);
      });

      // Create datatype that is a bit more manageable for use with DatamonkeySeries
      var mle_header_values = _.map(mle_headers, function (d) {
        return d.value;
      });

      var mle_results = _.map(mle_content, function (c) {
        return _.object(mle_header_values, c);
      });

      // Get number of positively and negatively selected sites by p-value threshold
      var mle_results = _.map(mle_results, function (d) {
        d["is_positive"] = parseFloat(d["beta"]) / parseFloat(d["alpha"]) > 1 && parseFloat(d["p-value"]) <= _this.state.pvalue_threshold;
        d["is_negative"] = parseFloat(d["beta"]) / parseFloat(d["alpha"]) < 1 && parseFloat(d["p-value"]) <= _this.state.pvalue_threshold;
        return d;
      });

      var positively_selected = _.filter(mle_results, function (d) {
        return d["is_positive"];
      });
      var negatively_selected = _.filter(mle_results, function (d) {
        return d["is_negative"];
      });

      // highlight mle_content with whether they are significant or not
      var mle_content = _.map(mle_results, function (d, key) {
        var classes = "";
        if (mle_results[key].is_positive) {
          classes = "success";
        } else if (mle_results[key].is_negative) {
          classes = "warning";
        }
        return _.map(_.values(d), function (g) {
          return { value: g, classes: classes };
        });
      });

      _this.setState({
        mle_headers: mle_headers,
        mle_content: mle_content,
        mle_results: mle_results,
        positively_selected: positively_selected,
        negatively_selected: negatively_selected
      });
    });
  },

  getClipboard: function getClipboard() {
    if (this.state.copy_transition) {
      return React.createElement(
        "i",
        null,
        "Copied!"
      );
    } else {
      return React.createElement(
        "a",
        { href: "#" },
        React.createElement("i", { className: "fa fa-clipboard", "aria-hidden": "true" })
      );
    }
  },
  onCopy: function onCopy() {
    var _this2 = this;

    this.setState({ copy_transition: true });
    setTimeout(function () {
      _this2.setState({ copy_transition: false });
    }, 1000);
  },
  getSummary: function getSummary() {

    return React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        { className: "main-result" },
        React.createElement(
          "p",
          null,
          React.createElement(
            _reactCopyToClipboard2.default,
            { text: this.getSummaryText(), onCopy: this.onCopy },
            React.createElement(
              "span",
              { id: "copy-it", className: "pull-right" },
              this.getClipboard()
            )
          ),
          React.createElement(
            "p",
            null,
            "FEL ",
            React.createElement(
              "strong",
              { className: "hyphy-highlight" },
              " ",
              "found evidence"
            ),
            " ",
            "of"
          ),
          React.createElement(
            "p",
            null,
            React.createElement(
              "i",
              { className: "fa fa-plus-circle", "aria-hidden": "true" },
              " "
            ),
            " ",
            "Pervasive Positive/Diversifying selection at",
            React.createElement(
              "span",
              { className: "hyphy-highlight" },
              " ",
              this.state.positively_selected.length,
              " "
            ),
            "sites"
          ),
          React.createElement(
            "p",
            null,
            React.createElement(
              "i",
              { className: "fa fa-minus-circle", "aria-hidden": "true" },
              " "
            ),
            " ",
            "Pervasive Negative/Purifying selection at",
            React.createElement(
              "span",
              { className: "hyphy-highlight" },
              " ",
              this.state.negatively_selected.length,
              " "
            ),
            "sites"
          ),
          React.createElement(
            "div",
            { className: "row", style: { marginTop: "20px" } },
            React.createElement(
              "div",
              { className: "col-md-3" },
              "With p-value threshold of"
            ),
            React.createElement(
              "div",
              { className: "col-md-2", style: { top: "-5px" } },
              React.createElement("input", {
                className: "form-control",
                type: "number",
                defaultValue: "0.1",
                step: "0.01",
                min: "0",
                max: "1",
                onChange: this.updatePvalThreshold
              })
            )
          )
        ),
        React.createElement("hr", null),
        React.createElement(
          "p",
          null,
          React.createElement(
            "small",
            null,
            "See ",
            React.createElement(
              "a",
              { href: "//hyphy.org/methods/selection-methods/#fel" },
              "here"
            ),
            " ",
            "for more information about the FEL method",
            React.createElement("br", null),
            "Please cite PMID",
            " ",
            React.createElement(
              "a",
              { href: "//www.ncbi.nlm.nih.gov/pubmed/15703242" },
              "15703242"
            ),
            " if you use this result in a publication, presentation, or other scientific work"
          )
        )
      )
    );
  },
  getSummaryText: function getSummaryText() {

    var no_selected = this.state.mle_content.length - this.state.positively_selected.length - this.state.negatively_selected.length;

    var summary_text = "FEL found evidence of pervasive positive/diversifying selection at " + this.state.positively_selected.length + " sites/at any sites in your alignment. In addition, FEL found evidence with p-value " + this.state.pvalue_threshold + " of pervasive negative/purifying selection at " + this.state.negatively_selected.length + " sites/at any sites in your alignment. FEL did not find evidence for either positive or negative selection in the remaining " + no_selected + " sites in your alignment.";

    return summary_text;
  },


  componentWillMount: function componentWillMount() {
    this.loadFromServer();
  },

  componentDidUpdate: function componentDidUpdate(prevProps) {
    $("body").scrollspy({
      target: ".bs-docs-sidebar",
      offset: 50
    });
  },


  render: function render() {

    var scrollspy_info = [{ label: "summary", href: "summary-tab" }, { label: "plots", href: "plot-tab" }, { label: "table", href: "table-tab" }];

    var _definePlotData = this.definePlotData(this.state.xaxis, this.state.yaxis),
        x = _definePlotData.x,
        y = _definePlotData.y;

    var x_options = "Site";
    var y_options = _.filter(_.map(this.state.mle_headers, function (d) {
      return d.value;
    }), function (d) {
      return d != "Site";
    });

    var Summary = this.getSummary();

    return React.createElement(
      "div",
      null,
      React.createElement(_navbar.NavBar, null),
      React.createElement(
        "div",
        { className: "container" },
        React.createElement(
          "div",
          { className: "row" },
          React.createElement(_scrollspy.ScrollSpy, { info: scrollspy_info }),
          React.createElement(
            "div",
            { className: "col-sm-10" },
            React.createElement(
              "div",
              {
                id: "datamonkey-fel-error",
                className: "alert alert-danger alert-dismissible",
                role: "alert",
                style: { display: "none" }
              },
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "close",
                  id: "datamonkey-fel-error-hide"
                },
                React.createElement(
                  "span",
                  { "aria-hidden": "true" },
                  "\xD7"
                ),
                React.createElement(
                  "span",
                  { className: "sr-only" },
                  "Close"
                )
              ),
              React.createElement(
                "strong",
                null,
                "Error!"
              ),
              " ",
              React.createElement("span", { id: "datamonkey-fel-error-text" })
            ),
            React.createElement(
              "div",
              { id: "results" },
              React.createElement(
                "h3",
                { className: "list-group-item-heading" },
                React.createElement(
                  "span",
                  { id: "summary-method-name" },
                  "FEL - Fixed Effects Likelihood"
                ),
                React.createElement("br", null),
                React.createElement(
                  "span",
                  { className: "results-summary" },
                  "results summary"
                )
              ),
              Summary,
              React.createElement(
                "div",
                { id: "plot-tab", className: "row hyphy-row" },
                React.createElement(
                  "h3",
                  { className: "dm-table-header" },
                  "Plot Summary"
                ),
                React.createElement(_graphs.DatamonkeyGraphMenu, {
                  x_options: x_options,
                  y_options: y_options,
                  axisSelectionEvent: this.updateAxisSelection
                }),
                React.createElement(_graphs.DatamonkeySeries, {
                  x: x,
                  y: y,
                  x_label: this.state.xaxis,
                  y_label: this.state.yaxis,
                  marginLeft: 50,
                  width: $("#results").width(),
                  transitions: true,
                  doDots: true
                })
              ),
              React.createElement(
                "div",
                { id: "table-tab", className: "row hyphy-row" },
                React.createElement(
                  "div",
                  { id: "hyphy-mle-fits", className: "col-md-12" },
                  React.createElement(
                    "h3",
                    { className: "dm-table-header" },
                    "Table Summary"
                  ),
                  React.createElement(
                    "div",
                    { className: "col-md-6 alert alert-success", role: "alert" },
                    "Positively selected sites with evidence are highlighted in green."
                  ),
                  React.createElement(
                    "div",
                    { className: "col-md-6 alert alert-warning", role: "alert" },
                    "Negatively selected sites with evidence are highlighted in yellow."
                  ),
                  React.createElement(_tables.DatamonkeyTable, {
                    headerData: this.state.mle_headers,
                    bodyData: this.state.mle_content,
                    classes: "table table-condensed table-striped",
                    paginate: 20,
                    export_csv: true
                  })
                )
              )
            )
          )
        )
      )
    );
  }

});

// Will need to make a call to this
// omega distributions
function render_fel(url, element) {
  ReactDOM.render(React.createElement(FEL, { url: url }), document.getElementById(element));
}

module.exports = render_fel;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6), __webpack_require__(3)))

/***/ }),
/* 290 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _require = __webpack_require__(291),
    CopyToClipboard = _require.CopyToClipboard;

module.exports = CopyToClipboard;

/***/ }),
/* 291 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CopyToClipboard = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(5);

var _react2 = _interopRequireDefault(_react);

var _copyToClipboard = __webpack_require__(292);

var _copyToClipboard2 = _interopRequireDefault(_copyToClipboard);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CopyToClipboard = exports.CopyToClipboard = function (_React$PureComponent) {
  _inherits(CopyToClipboard, _React$PureComponent);

  function CopyToClipboard() {
    var _ref;

    var _temp, _this, _ret;

    _classCallCheck(this, CopyToClipboard);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = CopyToClipboard.__proto__ || Object.getPrototypeOf(CopyToClipboard)).call.apply(_ref, [this].concat(args))), _this), _this.onClick = function (event) {
      var _this$props = _this.props,
          text = _this$props.text,
          onCopy = _this$props.onCopy,
          children = _this$props.children,
          options = _this$props.options;


      var elem = _react2.default.Children.only(children);

      var result = (0, _copyToClipboard2.default)(text, options);

      if (onCopy) {
        onCopy(text, result);
      }

      // Bypass onClick if it was present
      if (elem && elem.props && typeof elem.props.onClick === 'function') {
        elem.props.onClick(event);
      }
    }, _temp), _possibleConstructorReturn(_this, _ret);
  }

  _createClass(CopyToClipboard, [{
    key: 'render',
    value: function render() {
      var _props = this.props,
          _text = _props.text,
          _onCopy = _props.onCopy,
          _options = _props.options,
          children = _props.children,
          props = _objectWithoutProperties(_props, ['text', 'onCopy', 'options', 'children']);

      var elem = _react2.default.Children.only(children);

      return _react2.default.cloneElement(elem, _extends({}, props, { onClick: this.onClick }));
    }
  }]);

  return CopyToClipboard;
}(_react2.default.PureComponent);

/***/ }),
/* 292 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var deselectCurrent = __webpack_require__(293);

var defaultMessage = 'Copy to clipboard: #{key}, Enter';

function format(message) {
  var copyKey = (/mac os x/i.test(navigator.userAgent) ? '⌘' : 'Ctrl') + '+C';
  return message.replace(/#{\s*key\s*}/g, copyKey);
}

function copy(text, options) {
  var debug, message, reselectPrevious, range, selection, mark, success = false;
  if (!options) { options = {}; }
  debug = options.debug || false;
  try {
    reselectPrevious = deselectCurrent();

    range = document.createRange();
    selection = document.getSelection();

    mark = document.createElement('span');
    mark.textContent = text;
    // reset user styles for span element
    mark.style.all = 'unset';
    // prevents scrolling to the end of the page
    mark.style.position = 'fixed';
    mark.style.top = 0;
    mark.style.clip = 'rect(0, 0, 0, 0)';
    // used to preserve spaces and line breaks
    mark.style.whiteSpace = 'pre';
    // do not inherit user-select (it may be `none`)
    mark.style.webkitUserSelect = 'text';
    mark.style.MozUserSelect = 'text';
    mark.style.msUserSelect = 'text';
    mark.style.userSelect = 'text';

    document.body.appendChild(mark);

    range.selectNode(mark);
    selection.addRange(range);

    var successful = document.execCommand('copy');
    if (!successful) {
      throw new Error('copy command was unsuccessful');
    }
    success = true;
  } catch (err) {
    debug && console.error('unable to copy using execCommand: ', err);
    debug && console.warn('trying IE specific stuff');
    try {
      window.clipboardData.setData('text', text);
      success = true;
    } catch (err) {
      debug && console.error('unable to copy using clipboardData: ', err);
      debug && console.error('falling back to prompt');
      message = format('message' in options ? options.message : defaultMessage);
      window.prompt(message, text);
    }
  } finally {
    if (selection) {
      if (typeof selection.removeRange == 'function') {
        selection.removeRange(range);
      } else {
        selection.removeAllRanges();
      }
    }

    if (mark) {
      document.body.removeChild(mark);
    }
    reselectPrevious();
  }

  return success;
}

module.exports = copy;


/***/ }),
/* 293 */
/***/ (function(module, exports) {


module.exports = function () {
  var selection = document.getSelection();
  if (!selection.rangeCount) {
    return function () {};
  }
  var active = document.activeElement;

  var ranges = [];
  for (var i = 0; i < selection.rangeCount; i++) {
    ranges.push(selection.getRangeAt(i));
  }

  switch (active.tagName.toUpperCase()) { // .toUpperCase handles XHTML
    case 'INPUT':
    case 'TEXTAREA':
      active.blur();
      break;

    default:
      active = null;
      break;
  }

  selection.removeAllRanges();
  return function () {
    selection.type === 'Caret' &&
    selection.removeAllRanges();

    if (!selection.rangeCount) {
      ranges.forEach(function(range) {
        selection.addRange(range);
      });
    }

    active &&
    active.focus();
  };
};


/***/ }),
/* 294 */,
/* 295 */,
/* 296 */,
/* 297 */,
/* 298 */,
/* 299 */,
/* 300 */,
/* 301 */,
/* 302 */,
/* 303 */,
/* 304 */,
/* 305 */,
/* 306 */,
/* 307 */,
/* 308 */,
/* 309 */,
/* 310 */,
/* 311 */,
/* 312 */,
/* 313 */,
/* 314 */,
/* 315 */,
/* 316 */,
/* 317 */,
/* 318 */,
/* 319 */,
/* 320 */,
/* 321 */,
/* 322 */,
/* 323 */,
/* 324 */,
/* 325 */,
/* 326 */,
/* 327 */,
/* 328 */,
/* 329 */,
/* 330 */,
/* 331 */,
/* 332 */,
/* 333 */,
/* 334 */,
/* 335 */,
/* 336 */,
/* 337 */,
/* 338 */,
/* 339 */,
/* 340 */,
/* 341 */,
/* 342 */,
/* 343 */,
/* 344 */,
/* 345 */,
/* 346 */,
/* 347 */,
/* 348 */,
/* 349 */,
/* 350 */,
/* 351 */,
/* 352 */,
/* 353 */,
/* 354 */,
/* 355 */,
/* 356 */,
/* 357 */,
/* 358 */,
/* 359 */,
/* 360 */,
/* 361 */,
/* 362 */,
/* 363 */,
/* 364 */,
/* 365 */,
/* 366 */,
/* 367 */,
/* 368 */,
/* 369 */,
/* 370 */,
/* 371 */,
/* 372 */,
/* 373 */,
/* 374 */,
/* 375 */,
/* 376 */,
/* 377 */,
/* 378 */,
/* 379 */,
/* 380 */,
/* 381 */,
/* 382 */,
/* 383 */,
/* 384 */,
/* 385 */,
/* 386 */,
/* 387 */,
/* 388 */,
/* 389 */,
/* 390 */,
/* 391 */,
/* 392 */,
/* 393 */,
/* 394 */,
/* 395 */,
/* 396 */,
/* 397 */,
/* 398 */,
/* 399 */,
/* 400 */,
/* 401 */,
/* 402 */,
/* 403 */,
/* 404 */,
/* 405 */,
/* 406 */,
/* 407 */,
/* 408 */,
/* 409 */,
/* 410 */,
/* 411 */,
/* 412 */,
/* 413 */,
/* 414 */,
/* 415 */,
/* 416 */,
/* 417 */,
/* 418 */,
/* 419 */,
/* 420 */,
/* 421 */,
/* 422 */,
/* 423 */,
/* 424 */,
/* 425 */,
/* 426 */,
/* 427 */,
/* 428 */,
/* 429 */,
/* 430 */,
/* 431 */,
/* 432 */,
/* 433 */,
/* 434 */,
/* 435 */,
/* 436 */,
/* 437 */,
/* 438 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(d3, $) {

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tables = __webpack_require__(20);

var _graphs = __webpack_require__(44);

var _navbar = __webpack_require__(21);

var _scrollspy = __webpack_require__(22);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = __webpack_require__(5),
    ReactDOM = __webpack_require__(17),
    _ = __webpack_require__(9),
    chi = __webpack_require__(439);

var PRIME = function (_React$Component) {
  _inherits(PRIME, _React$Component);

  function PRIME(props) {
    _classCallCheck(this, PRIME);

    var _this = _possibleConstructorReturn(this, (PRIME.__proto__ || Object.getPrototypeOf(PRIME)).call(this, props));

    _this.float_format = d3.format(".3f");
    _this.initial_pvalue_threshold = 0.1;

    var results = _.map(_this.props.prime_results, function (d, k) {
      d["codon"] = k;
      return d;
    });

    results = _.filter(results, function (d) {
      return _.has(d, "Full model");
    });

    // filter out sites that are constant
    results = _.filter(results, function (d) {
      return d.CONSTANT != 1;
    });

    // calculate p-values
    results = _.map(results, function (d) {
      return _.extend(d, { pvalues: _this.calculatePvalues(d) });
    });

    var codons = _.map(results, function (d) {
      return parseInt(d.codon);
    });

    var property_headers = _.keys(_.omit(results[0]["Full model"]["MLES"], "_felScaler"));

    // format property_values for table
    var property_values = _.unzip(_.map(results, function (d) {
      return _.map(_.values(_.omit(d["Full model"]["MLES"], "_felScaler")), function (d) {
        return _this.float_format(d);
      });
    }));

    // add pvalue to header
    var table_property_headers = _.map(_.flatten(_.zip(property_headers, property_headers)), function (d, k) {
      if (k % 2) {
        return d + "_pval";
      } else return d;
    });

    // prepend with codon
    table_property_headers = ["codon"].concat(table_property_headers);
    var table_property_values = _this.formatValuesForTable(codons, results, _this.initial_pvalue_threshold);

    // format data into variables usable by components
    var all_mle_props = _.flatten(_.map(results, function (d) {
      return _.zip(_.values(_.omit(d["Full model"]["MLES"], "_felScaler")), _.values(d["pvalues"]));
    }), true);

    var changing_properties = _.filter(all_mle_props, function (d) {
      return d[0] < 0 && d[1] < _this.initial_pvalue_threshold;
    });

    var conserved_properties = _.filter(all_mle_props, function (d) {
      return d[0] > 0 && d[1] < _this.initial_pvalue_threshold;
    });

    // Get plot width according to bootstrap conventions
    var plot_width = 960;

    switch (true) {
      case window.innerWidth >= 992:
        plot_width = 960;
        break;
      case window.innerWidth >= 768:
        plot_width = 460;
        break;
      case window.innerWidth <= 576:
        plot_width = 460;
        break;
      default:
        plot_width = 0;
    }

    _this.state = {
      results: results,
      all_mle_props: all_mle_props,
      codons: codons,
      property_plot_done: false,
      property_headers: property_headers,
      property_values: property_values,
      table_property_headers: table_property_headers,
      table_property_values: table_property_values,
      changing_properties: changing_properties,
      conserved_properties: conserved_properties,
      pvalue_threshold: _this.initial_pvalue_threshold,
      total_sites_found: results.length,
      plot_width: plot_width
    };
    return _this;
  }

  _createClass(PRIME, [{
    key: "formatValuesForTable",
    value: function formatValuesForTable(codons, results, pvalue) {
      var _this2 = this;

      // update property values to state whether they are conserved or changing
      var table_property_values = _.unzip(_.map(results, function (rows) {
        return _.map(_.omit(rows["Full model"]["MLES"], "_felScaler"), function (d, k) {
          var classes = "";
          if (rows["pvalues"][k] < pvalue) {
            if (d < 0) {
              classes = "success";
            } else {
              classes = "danger";
            }
          }
          return { value: d, classes: classes };
        }, _this2);
      }));

      var p_values = _.unzip(_.map(results, function (d) {
        return _.map(_.values(d["pvalues"]), function (d) {
          return { value: _this2.float_format(d) };
        });
      }));

      table_property_values = _.flatten(_.zip(table_property_values, p_values), true);

      // prepend with codon sites
      table_property_values = [codons].concat(table_property_values);

      return table_property_values;
    }
  }, {
    key: "calculatePvalues",
    value: function calculatePvalues(values) {
      var property_keys = ["alpha_0", "alpha_1", "alpha_2", "alpha_3", "alpha_4"];
      var full_model_logl = values["Full model"]["LogL"];
      var full_model_df = values["Full model"]["DF"];

      // Must get log-likelihood of each test property
      var pvals = _.map(this.props.properties, function (d) {
        var logl = values[d]["LogL"];
        var n = 2 * (full_model_logl - logl);
        var df = full_model_df - values[d]["DF"];
        return 1 - chi.cdf(n, df);
      });

      return _.object(property_keys, pvals);
    }
  }, {
    key: "updatePvalThreshold",
    value: function updatePvalThreshold(e) {

      var pvalue_threshold = parseFloat(e.target.value);

      var table_property_values = this.formatValuesForTable(this.state.codons, this.state.results, pvalue_threshold);

      // update conserved and changing properties count
      var changing_properties = _.filter(this.state.all_mle_props, function (d) {
        return d[0] < 0 && d[1] < pvalue_threshold;
      });

      var conserved_properties = _.filter(this.state.all_mle_props, function (d) {
        return d[0] > 0 && d[1] < pvalue_threshold;
      });

      this.setState({
        table_property_headers: this.state.table_property_headers,
        pvalue_threshold: pvalue_threshold,
        table_property_values: table_property_values,
        conserved_properties: conserved_properties,
        changing_properties: changing_properties
      });
    }
  }, {
    key: "getSummary",
    value: function getSummary() {
      var self = this;

      return React.createElement(
        "div",
        null,
        React.createElement(
          "div",
          { className: "main-result" },
          React.createElement(
            "p",
            null,
            React.createElement(
              "p",
              null,
              "PRIME ",
              " ",
              React.createElement(
                "strong",
                { className: "hyphy-highlight" },
                " found evidence "
              ),
              " of",
              " "
            ),
            React.createElement(
              "p",
              null,
              React.createElement(
                "span",
                { className: "hyphy-highlight" },
                " ",
                " ",
                self.state.conserved_properties.length,
                " ",
                " "
              ),
              "conserved properties found.",
              " "
            ),
            React.createElement(
              "p",
              null,
              React.createElement(
                "span",
                { className: "hyphy-highlight" },
                " ",
                " ",
                self.state.changing_properties.length,
                " ",
                " "
              ),
              "changing properties found.",
              " "
            ),
            React.createElement(
              "div",
              {
                className: "row",
                style: {
                  marginTop: "20px"
                }
              },
              React.createElement(
                "div",
                { className: "col-md-3" },
                "With p-value threshold of"
              ),
              React.createElement(
                "div",
                {
                  className: "col-md-2",
                  style: {
                    top: "-5px"
                  }
                },
                React.createElement("input", {
                  className: "form-control",
                  type: "number",
                  defaultValue: "0.1",
                  step: "0.01",
                  min: "0",
                  max: "1",
                  onChange: self.updatePvalThreshold.bind(this)
                })
              )
            )
          ),
          React.createElement("hr", null),
          React.createElement(
            "p",
            null,
            React.createElement(
              "small",
              null,
              "See ",
              " ",
              React.createElement(
                "a",
                { href: "//hyphy.org/methods/selection-methods/#prime" },
                "here",
                " "
              ),
              " ",
              "for more information about the PRIME method ",
              React.createElement("br", null),
              "Please cite PMID ",
              React.createElement(
                "a",
                { href: "" },
                " TBA "
              ),
              " if you use this result in a publication, presentation, or other scientific work"
            )
          )
        )
      );
    }
  }, {
    key: "componentWillMount",
    value: function componentWillMount() {}
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {}
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
      $("body").scrollspy({
        target: ".bs-docs-sidebar",
        offset: 50
      });
    }
  }, {
    key: "render",
    value: function render() {
      var scrollspy_info = [{
        label: "summary",
        href: "summary-tab"
      }, {
        label: "plots",
        href: "plot-tab"
      }, {
        label: "table",
        href: "table-tab"
      }];

      var order_table_rows = _.unzip(this.state.table_property_values);

      return React.createElement(
        "div",
        null,
        React.createElement(_navbar.NavBar, null),
        React.createElement(
          "div",
          { className: "container" },
          React.createElement(
            "div",
            { className: "row" },
            React.createElement(_scrollspy.ScrollSpy, { info: scrollspy_info }),
            React.createElement(
              "div",
              { className: "col-sm-10" },
              React.createElement(
                "div",
                { id: "results" },
                React.createElement(
                  "h3",
                  { className: "list-group-item-heading" },
                  React.createElement(
                    "span",
                    { id: "summary-method-name" },
                    "PRIME - PRoperty Informed Models of Evolution",
                    " "
                  ),
                  React.createElement("br", null),
                  React.createElement(
                    "span",
                    { className: "results-summary" },
                    " results summary "
                  )
                ),
                this.getSummary()
              ),
              React.createElement(
                "div",
                { id: "plot-tab", className: "row hyphy-row" },
                React.createElement(
                  "h3",
                  { className: "dm-table-header" },
                  "Property Importance Plot"
                ),
                React.createElement(_graphs.DatamonkeyMultiScatterplot, {
                  x: this.state.codons,
                  y: this.state.property_values,
                  width: this.state.plot_width,
                  x_label: "test",
                  y_labels: this.state.property_headers,
                  transitions: true
                })
              ),
              React.createElement(
                "div",
                { id: "table-tab", className: "row hyphy-row" },
                React.createElement(
                  "div",
                  { id: "hyphy-mle-fits", className: "col-md-12" },
                  React.createElement(
                    "h3",
                    { className: "dm-table-header" },
                    "Table Summary"
                  ),
                  React.createElement(
                    "div",
                    { className: "col-md-6 alert alert-danger", role: "alert" },
                    "Conserved properties with evidence are highlighted in red."
                  ),
                  React.createElement(
                    "div",
                    { className: "col-md-6 alert alert-success", role: "alert" },
                    "Changing properties with evidence are highlighted in green."
                  ),
                  React.createElement(_tables.DatamonkeyTable, {
                    headerData: this.state.table_property_headers,
                    bodyData: order_table_rows,
                    classes: "table table-condensed table-striped",
                    paginate: 20,
                    export_csv: true
                  })
                )
              )
            )
          )
        )
      );
    }
  }]);

  return PRIME;
}(React.Component);

PRIME.defaultProps = {
  _use_q_values: false,
  properties: ["Test property 1", "Test property 2", "Test property 3", "Test property 4", "Test property 5"]
};

// Will need to make a call to this
// omega distributions
function prime(prime_results, element) {
  ReactDOM.render(React.createElement(PRIME, { prime_results: prime_results }), document.getElementById(element));
}

module.exports = prime;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6), __webpack_require__(3)))

/***/ }),
/* 439 */
/***/ (function(module, exports, __webpack_require__) {

var gamma = __webpack_require__(159);

exports.pdf = function (x, k_) {
    if (x < 0) return 0;
    var k = k_ / 2;
    return 1 / (Math.pow(2, k) * gamma(k))
        * Math.pow(x, k - 1)
        * Math.exp(-x / 2)
    ;
};

exports.cdf = __webpack_require__(440)


/***/ }),
/* 440 */
/***/ (function(module, exports, __webpack_require__) {

var LogGamma = __webpack_require__(159).log

// The following code liberated from
// http://www.math.ucla.edu/~tom/distributions/chisq.html

function Gcf(X,A) {        // Good for X>A+1
  with (Math) {
    var A0=0;
    var B0=1;
    var A1=1;
    var B1=X;
    var AOLD=0;
    var N=0;
    while (abs((A1-AOLD)/A1)>.00001) {
      AOLD=A1;
      N=N+1;
      A0=A1+(N-A)*A0;
      B0=B1+(N-A)*B0;
      A1=X*A0+N*A1;
      B1=X*B0+N*B1;
      A0=A0/B1;
      B0=B0/B1;
      A1=A1/B1;
      B1=1;
    }
    var Prob=exp(A*log(X)-X-LogGamma(A))*A1;
  }
  return 1-Prob
}

function Gser(X,A) {        // Good for X<A+1.
    with (Math) {
    var T9=1/A;
    var G=T9;
    var I=1;
    while (T9>G*.00001) {
      T9=T9*X/(A+I);
      G=G+T9;
      I=I+1;
    }
    G=G*exp(A*log(X)-X-LogGamma(A));
    }
    return G
}

function Gammacdf(x,a) {
  var GI;
  if (x<=0) {
    GI=0
  } else if (x<a+1) {
    GI=Gser(x,a)
  } else {
    GI=Gcf(x,a)
  }
  return GI
}

module.exports = function (Z, DF) {
  if (DF<=0) {
    throw new Error("Degrees of freedom must be positive")
  }
  return Gammacdf(Z/2,DF/2)
}


/***/ }),
/* 441 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(d3, $) {

var _model_fits = __webpack_require__(124);

var _tree = __webpack_require__(64);

var _omega_plots = __webpack_require__(442);

var React = __webpack_require__(5),
    ReactDOM = __webpack_require__(17),
    _ = __webpack_require__(9);

var RELAX = React.createClass({
  displayName: "RELAX",

  float_format: d3.format(".2f"),
  p_value_format: d3.format(".4f"),
  fit_format: d3.format(".2f"),

  loadFromServer: function loadFromServer() {
    var self = this;

    d3.json(this.props.url, function (data) {
      data["fits"]["Partitioned MG94xREV"]["branch-annotations"] = self.formatBranchAnnotations(data, "Partitioned MG94xREV");
      data["fits"]["General Descriptive"]["branch-annotations"] = self.formatBranchAnnotations(data, "General Descriptive");
      data["fits"]["Null"]["branch-annotations"] = self.formatBranchAnnotations(data, "Null");
      data["fits"]["Alternative"]["branch-annotations"] = self.formatBranchAnnotations(data, "Alternative");
      data["fits"]["Partitioned Exploratory"]["branch-annotations"] = self.formatBranchAnnotations(data, "Partitioned Exploratory");

      var annotations = data["fits"]["Partitioned MG94xREV"]["branch-annotations"],
          json = data,
          pmid = data["PMID"],
          test_results = data["relaxation_test"];

      var p = data["relaxation-test"]["p"],
          direction = data["fits"]["Alternative"]["K"] > 1 ? "intensification" : "relaxation",
          evidence = p <= self.props.alpha_level ? "significant" : "not significant",
          pvalue = self.p_value_format(p),
          lrt = self.fit_format(data["relaxation-test"]["LR"]),
          summary_k = self.fit_format(data["fits"]["Alternative"]["K"]),
          pmid_text = "PubMed ID " + pmid,
          pmid_href = "http://www.ncbi.nlm.nih.gov/pubmed/" + pmid;

      self.setState({
        annotations: annotations,
        json: json,
        pmid: pmid,
        test_results: test_results,
        p: p,
        direction: direction,
        evidence: evidence,
        pvalue: pvalue,
        lrt: lrt,
        summary_k: summary_k,
        pmid_text: pmid_text,
        pmid_href: pmid_href
      });
    });
  },

  getDefaultProps: function getDefaultProps() {
    var edgeColorizer = function edgeColorizer(element, data) {
      var self = this,
          scaling_exponent = 0.33,
          omega_format = d3.format(".3r");

      var omega_color = d3.scale.pow().exponent(scaling_exponent).domain([0, 0.25, 1, 5, 10]).range(self.options()["color-fill"] ? ["#DDDDDD", "#AAAAAA", "#888888", "#444444", "#000000"] : ["#6e4fa2", "#3288bd", "#e6f598", "#f46d43", "#9e0142"]).clamp(true);

      if (data.target.annotations) {
        element.style("stroke", omega_color(data.target.annotations.length) || null);
        $(element[0][0]).tooltip("destroy");
        $(element[0][0]).tooltip({
          title: omega_format(data.target.annotations.length),
          html: true,
          trigger: "hover",
          container: "body",
          placement: "auto"
        });
      } else {
        element.style("stroke", null);
        $(element[0][0]).tooltip("destroy");
      }

      var selected_partition = $("#hyphy-tree-highlight").attr("value");

      if (selected_partition && this.get_partitions()) {
        var partitions = this.get_partitions()[selected_partition];

        element.style("stroke-width", partitions && partitions[data.target.name] ? "8" : "4").style("stroke-linejoin", "round").style("stroke-linecap", "round");
      }
    };

    return {
      edgeColorizer: edgeColorizer,
      alpha_level: 0.05
    };
  },

  getInitialState: function getInitialState() {
    var tree_settings = {
      omegaPlot: {},
      "tree-options": {
        /* value arrays have the following meaning
                [0] - the value of the attribute
                [1] - does the change in attribute value trigger tree re-layout?
            */
        "hyphy-tree-model": ["Partitioned MG94xREV", true],
        "hyphy-tree-highlight": ["RELAX.test", false],
        "hyphy-tree-branch-lengths": [true, true],
        "hyphy-tree-hide-legend": [true, false],
        "hyphy-tree-fill-color": [true, false]
      },
      "suppress-tree-render": false,
      "chart-append-html": true,
      edgeColorizer: this.props.edgeColorizer
    };

    return {
      annotations: null,
      json: null,
      pmid: null,
      settings: tree_settings,
      test_results: null,
      tree: null,
      p: null,
      direction: "unknown",
      evidence: "unknown",
      pvalue: null,
      lrt: null,
      summary_k: "unknown",
      pmid_text: "PubMed ID : Unknown",
      pmid_href: "#",
      relaxation_K: "unknown"
    };
  },

  componentWillMount: function componentWillMount() {
    this.loadFromServer();
    this.setEvents();
  },

  setEvents: function setEvents() {
    var self = this;

    $("#datamonkey-relax-load-json").on("change", function (e) {
      var files = e.target.files; // FileList object

      if (files.length == 1) {
        var f = files[0];
        var reader = new FileReader();

        reader.onload = function (theFile) {
          return function (e) {
            var data = JSON.parse(this.result);
            data["fits"]["Partitioned MG94xREV"]["branch-annotations"] = self.formatBranchAnnotations(data, "Partitioned MG94xREV");
            data["fits"]["General Descriptive"]["branch-annotations"] = self.formatBranchAnnotations(data, "General Descriptive");
            data["fits"]["Null"]["branch-annotations"] = self.formatBranchAnnotations(data, "Null");
            data["fits"]["Alternative"]["branch-annotations"] = self.formatBranchAnnotations(data, "Alternative");
            data["fits"]["Partitioned Exploratory"]["branch-annotations"] = self.formatBranchAnnotations(data, "Partitioned Exploratory");

            var annotations = data["fits"]["Partitioned MG94xREV"]["branch-annotations"],
                json = data,
                pmid = data["PMID"],
                test_results = data["relaxation_test"];

            var p = data["relaxation-test"]["p"],
                direction = data["fits"]["Alternative"]["K"] > 1 ? "intensification" : "relaxation",
                evidence = p <= self.props.alpha_level ? "significant" : "not significant",
                pvalue = self.p_value_format(p),
                lrt = self.fit_format(data["relaxation-test"]["LR"]),
                summary_k = self.fit_format(data["fits"]["Alternative"]["K"]),
                pmid_text = "PubMed ID " + pmid,
                pmid_href = "http://www.ncbi.nlm.nih.gov/pubmed/" + pmid;

            self.setState({
              annotations: annotations,
              json: json,
              pmid: pmid,
              test_results: test_results,
              p: p,
              direction: direction,
              evidence: evidence,
              pvalue: pvalue,
              lrt: lrt,
              summary_k: summary_k,
              pmid_text: pmid_text,
              pmid_href: pmid_href
            });
          };
        }(f);
        reader.readAsText(f);
      }

      $("#datamonkey-absrel-toggle-here").dropdown("toggle");
      e.preventDefault();
    });
  },

  formatBranchAnnotations: function formatBranchAnnotations(json, key) {
    var initial_branch_annotations = json["fits"][key]["branch-annotations"];

    if (!initial_branch_annotations) {
      initial_branch_annotations = json["fits"][key]["rate distributions"];
    }

    // Iterate over objects
    var branch_annotations = _.mapObject(initial_branch_annotations, function (val, key) {
      return { length: val };
    });

    return branch_annotations;
  },

  initialize: function initialize() {},

  render: function render() {
    var self = this;

    return React.createElement(
      "div",
      { className: "tab-content" },
      React.createElement(
        "div",
        { className: "tab-pane active", id: "datamonkey-relax-summary-tab" },
        React.createElement(
          "div",
          { id: "hyphy-relax-summary", className: "row" },
          React.createElement(
            "div",
            { className: "col-md-12" },
            React.createElement(
              "ul",
              { className: "list-group" },
              React.createElement(
                "li",
                { className: "list-group-item list-group-item-info" },
                React.createElement(
                  "h3",
                  { className: "list-group-item-heading" },
                  React.createElement("i", { className: "fa fa-list", style: { marginRight: "10px" } }),
                  React.createElement(
                    "span",
                    { id: "summary-method-name" },
                    "RELAX(ed selection test)"
                  ),
                  " ",
                  "summary"
                ),
                React.createElement(
                  "p",
                  {
                    className: "list-group-item-text lead",
                    style: { marginTop: "0.5em" }
                  },
                  "Test for selection",
                  " ",
                  React.createElement(
                    "strong",
                    { id: "summary-direction" },
                    this.state.direction
                  ),
                  " ",
                  "(",
                  React.createElement(
                    "abbr",
                    { title: "Relaxation coefficient" },
                    "K"
                  ),
                  " =",
                  " ",
                  React.createElement(
                    "strong",
                    { id: "summary-K" },
                    this.state.summary_k
                  ),
                  ") was",
                  " ",
                  React.createElement(
                    "strong",
                    { id: "summary-evidence" },
                    this.state.evidence
                  ),
                  " ",
                  "(p = ",
                  React.createElement(
                    "strong",
                    { id: "summary-pvalue" },
                    this.state.p
                  ),
                  ",",
                  " ",
                  React.createElement(
                    "abbr",
                    { title: "Likelihood ratio statistic" },
                    "LR"
                  ),
                  " =",
                  " ",
                  React.createElement(
                    "strong",
                    { id: "summary-LRT" },
                    this.state.lrt
                  ),
                  ")"
                ),
                React.createElement(
                  "p",
                  null,
                  React.createElement(
                    "small",
                    null,
                    "Please cite",
                    " ",
                    React.createElement(
                      "a",
                      { href: this.state.pmid_href, id: "summary-pmid" },
                      this.state.pmid_text
                    ),
                    " ",
                    "if you use this result in a publication, presentation, or other scientific work."
                  )
                )
              )
            )
          )
        ),
        React.createElement(
          "div",
          { id: "hyphy-model-fits", className: "row" },
          React.createElement(_model_fits.ModelFits, { json: self.state.json })
        ),
        React.createElement(
          "div",
          { id: "hyphy-omega-plots", className: "row" },
          React.createElement(_omega_plots.OmegaPlotGrid, { json: self.state.json })
        )
      ),
      React.createElement(
        "div",
        { className: "tab-pane", id: "tree-tab" },
        React.createElement(_tree.Tree, { json: self.state.json, settings: self.state.settings })
      )
    );
  }
});

// Will need to make a call to this
// omega distributions
function render_relax(url, element) {
  ReactDOM.render(React.createElement(RELAX, { url: url }), document.getElementById(element));
}

module.exports = render_relax;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6), __webpack_require__(3)))

/***/ }),
/* 442 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(d3) {

var React = __webpack_require__(5);
var datamonkey = __webpack_require__(19);
var _ = __webpack_require__(9);

var OmegaPlot = React.createClass({
  displayName: "OmegaPlot",

  getDefaultProps: function getDefaultProps() {
    return {
      svg_id: null,
      dimensions: { width: 600, height: 400 },
      margins: { left: 50, right: 15, bottom: 35, top: 35 },
      has_zeros: false,
      legend_id: null,
      do_log_plot: true,
      k_p: null,
      plot: null
    };
  },

  setEvents: function setEvents() {
    var self = this;

    d3.select("#" + this.save_svg_id).on("click", function (e) {
      datamonkey.save_image("svg", "#" + self.svg_id);
    });

    d3.select("#" + this.save_png_id).on("click", function (e) {
      datamonkey.save_image("png", "#" + self.svg_id);
    });
  },

  initialize: function initialize() {
    if (!this.state.omegas || !this.state.omegas["Reference"]) {
      return;
    }

    var data_to_plot = this.state.omegas["Reference"];
    var secondary_data = this.state.omegas["Test"];

    // Set props from settings
    this.svg_id = this.props.settings.svg_id;
    this.dimensions = this.props.settings.dimensions || this.props.dimensions;
    this.legend_id = this.props.settings.legend || this.props.legend_id;
    this.do_log_plot = this.props.settings.log || this.props.do_log_plot;
    this.k_p = this.props.settings.k || this.props.k_p;

    var dimensions = this.props.dimensions;
    var margins = this.props.margins;

    this.margins = margins;

    if (this.do_log_plot) {
      this.has_zeros = data_to_plot.some(function (d) {
        return d.omega <= 0;
      });
      if (secondary_data) {
        this.has_zeros = this.has_zeros || data_to_plot.some(function (d) {
          return d.omega <= 0;
        });
      }
    }

    this.plot_width = dimensions["width"] - margins["left"] - margins["right"], this.plot_height = dimensions["height"] - margins["top"] - margins["bottom"];

    var domain = this.state.settings["domain"] || d3.extent(secondary_data ? secondary_data.map(function (d) {
      return d.omega;
    }).concat(data_to_plot.map(function (d) {
      return d.omega;
    })) : data_to_plot.map(function (d) {
      return d.omega;
    }));

    domain[0] *= 0.5;

    this.omega_scale = (this.do_log_plot ? this.has_zeros ? d3.scale.pow().exponent(0.2) : d3.scale.log() : d3.scale.linear()).range([0, this.plot_width]).domain(domain).nice();

    this.proportion_scale = d3.scale.linear().range([this.plot_height, 0]).domain([-0.05, 1]).clamp(true);

    // compute margins -- circle AREA is proportional to the relative weight
    // maximum diameter is (height - text margin)
    this.svg = d3.select("#" + this.svg_id).attr("width", dimensions.width).attr("height", dimensions.height);
    this.plot = this.svg.selectAll(".container");

    this.svg.selectAll("defs").remove();
    this.svg.append("defs").append("marker").attr("id", "arrowhead").attr("refX", 10) /*must be smarter way to calculate shift*/
    .attr("refY", 4).attr("markerWidth", 10).attr("markerHeight", 8).attr("orient", "auto").attr("stroke", "#000").attr("fill", "#000").append("path").attr("d", "M 0,0 V8 L10,4 Z");

    if (this.plot.empty()) {
      this.plot = this.svg.append("g").attr("class", "container");
    }

    this.plot.attr("transform", "translate(" + this.margins["left"] + " , " + this.margins["top"] + ")");
    this.reference_omega_lines = this.plot.selectAll(".hyphy-omega-line-reference"), this.displacement_lines = this.plot.selectAll(".hyphy-displacement-line");

    this.createDisplacementLine();
    this.createNeutralLine();
    this.createOmegaLine();
    this.createReferenceLine();
    this.createXAxis();
    this.createYAxis();
    this.setEvents();
  },
  makeSpring: function makeSpring(x1, x2, y1, y2, step, displacement) {
    if (x1 == x2) {
      y1 = Math.min(y1, y2);
      return "M" + x1 + "," + (y1 - 40) + "v20";
    }

    var spring_data = [],
        point = [x1, y1],
        angle = Math.atan2(y2 - y1, x2 - x1);

    var step = [step * Math.cos(angle), step * Math.sin(angle)];
    var k = 0;

    if (Math.abs(x1 - x2) < 15) {
      spring_data.push(point);
    } else {
      while (x1 < x2 && point[0] < x2 - 15 || x1 > x2 && point[0] > x2 + 15) {
        point = point.map(function (d, i) {
          return d + step[i];
        });
        if (k % 2) {
          spring_data.push([point[0], point[1] + displacement]);
        } else {
          spring_data.push([point[0], point[1] - displacement]);
        }
        k++;
        if (k > 100) {
          break;
        }
      }
    }

    if (spring_data.length > 1) {
      spring_data.pop();
    }

    spring_data.push([x2, y2]);
    var line = d3.svg.line().interpolate("monotone");
    return line(spring_data);
  },
  createDisplacementLine: function createDisplacementLine() {
    var self = this;
    var data_to_plot = this.state.omegas["Reference"];
    var secondary_data = this.state.omegas["Test"];

    if (secondary_data) {
      var diffs = data_to_plot.map(function (d, i) {
        return {
          x1: d.omega,
          x2: secondary_data[i].omega,
          y1: d.weight * 0.98,
          y2: secondary_data[i].weight * 0.98
        };
      });

      this.displacement_lines = this.displacement_lines.data(diffs);
      this.displacement_lines.enter().append("path");
      this.displacement_lines.exit().remove();
      this.displacement_lines.transition().attr("d", function (d) {
        return self.makeSpring(self.omega_scale(d.x1), self.omega_scale(d.x2), self.proportion_scale(d.y1 * 0.5), self.proportion_scale(d.y2 * 0.5), 5, 5);
      }).attr("marker-end", "url(#arrowhead)").attr("class", "hyphy-displacement-line");
    }
  },
  createReferenceLine: function createReferenceLine() {
    var data_to_plot = this.state.omegas["Reference"];
    var secondary_data = this.state.omegas["Test"];
    var self = this;

    if (secondary_data) {
      this.reference_omega_lines = this.reference_omega_lines.data(data_to_plot);
      this.reference_omega_lines.enter().append("line");
      this.reference_omega_lines.exit().remove();

      this.reference_omega_lines.transition().attr("x1", function (d) {
        return self.omega_scale(d.omega);
      }).attr("x2", function (d) {
        return self.omega_scale(d.omega);
      }).attr("y1", function (d) {
        return self.proportion_scale(-0.05);
      }).attr("y2", function (d) {
        return self.proportion_scale(d.weight);
      }).style("stroke", function (d) {
        return "#d62728";
      }).attr("class", "hyphy-omega-line-reference");
    } else {
      this.reference_omega_lines.remove();
      this.displacement_lines.remove();
    }
  },
  createOmegaLine: function createOmegaLine() {
    var data_to_plot = this.state.omegas["Reference"];
    var secondary_data = this.state.omegas["Test"];
    var self = this;

    // ** Omega Line (Red) ** //
    var omega_lines = this.plot.selectAll(".hyphy-omega-line").data(secondary_data ? secondary_data : data_to_plot);
    omega_lines.enter().append("line");
    omega_lines.exit().remove();
    omega_lines.transition().attr("x1", function (d) {
      return self.omega_scale(d.omega);
    }).attr("x2", function (d) {
      return self.omega_scale(d.omega);
    }).attr("y1", function (d) {
      return self.proportion_scale(-0.05);
    }).attr("y2", function (d) {
      return self.proportion_scale(d.weight);
    }).style("stroke", function (d) {
      return "#1f77b4";
    }).attr("class", "hyphy-omega-line");
  },
  createNeutralLine: function createNeutralLine() {
    var self = this;

    // ** Neutral Line (Blue) ** //
    var neutral_line = this.plot.selectAll(".hyphy-neutral-line").data([1]);
    neutral_line.enter().append("line").attr("class", "hyphy-neutral-line");
    neutral_line.exit().remove();
    neutral_line.transition().attr("x1", function (d) {
      return self.omega_scale(d);
    }).attr("x2", function (d) {
      return self.omega_scale(d);
    }).attr("y1", 0).attr("y2", this.plot_height);
  },
  createXAxis: function createXAxis() {
    // *** X-AXIS *** //
    var xAxis = d3.svg.axis().scale(this.omega_scale).orient("bottom");

    if (this.do_log_plot) {
      xAxis.ticks(10, this.has_zeros ? ".2r" : ".1r");
    }

    var x_axis = this.svg.selectAll(".x.axis");
    var x_label;

    if (x_axis.empty()) {
      x_axis = this.svg.append("g").attr("class", "x hyphy-axis");

      x_label = x_axis.append("g").attr("class", "hyphy-axis-label x-label");
    } else {
      x_label = x_axis.select(".axis-label.x-label");
    }

    x_axis.attr("transform", "translate(" + this.margins["left"] + "," + (this.plot_height + this.margins["top"]) + ")").call(xAxis);
    x_label = x_label.attr("transform", "translate(" + this.plot_width + "," + this.margins["bottom"] + ")").selectAll("text").data(["\u03C9"]);
    x_label.enter().append("text");
    x_label.text(function (d) {
      return d;
    }).style("text-anchor", "end").attr("dy", "0.0em");
  },
  createYAxis: function createYAxis() {
    // *** Y-AXIS *** //
    var yAxis = d3.svg.axis().scale(this.proportion_scale).orient("left").ticks(10, ".1p");

    var y_axis = this.svg.selectAll(".y.hyphy-axis");
    var y_label;

    if (y_axis.empty()) {
      y_axis = this.svg.append("g").attr("class", "y hyphy-axis");
      y_label = y_axis.append("g").attr("class", "hyphy-axis-label y-label");
    } else {
      y_label = y_axis.select(".hyphy-axis-label.y-label");
    }
    y_axis.attr("transform", "translate(" + this.margins["left"] + "," + this.margins["top"] + ")").call(yAxis);
    y_label = y_label.attr("transform", "translate(" + -this.margins["left"] + "," + 0 + ")").selectAll("text").data(["Proportion of sites"]);
    y_label.enter().append("text");
    y_label.text(function (d) {
      return d;
    }).style("text-anchor", "start").attr("dy", "-1em");
  },

  getInitialState: function getInitialState() {
    return {
      omegas: this.props.omegas,
      settings: this.props.settings
    };
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    this.setState({
      omegas: nextProps.omegas
    });
  },

  componentDidUpdate: function componentDidUpdate() {
    this.initialize();
  },

  componentDidMount: function componentDidMount() {
    this.initialize();
  },

  render: function render() {
    var key = this.props.omegas.key,
        label = this.props.omegas.label;

    this.svg_id = key + "-svg";
    this.save_svg_id = "export-" + key + "-svg";
    this.save_png_id = "export-" + key + "-png";

    return React.createElement(
      "div",
      { className: "col-lg-6" },
      React.createElement(
        "div",
        { className: "panel panel-default", id: key },
        React.createElement(
          "div",
          { className: "panel-heading" },
          React.createElement(
            "h3",
            { className: "panel-title" },
            "\u03C9 distributions under the ",
            React.createElement(
              "strong",
              null,
              label
            ),
            " model"
          ),
          React.createElement(
            "p",
            null,
            React.createElement(
              "small",
              null,
              "Test branches are shown in",
              " ",
              React.createElement(
                "span",
                { className: "hyphy-blue" },
                "blue"
              ),
              " and reference branches are shown in ",
              React.createElement(
                "span",
                { className: "hyphy-red" },
                "red"
              )
            )
          ),
          React.createElement(
            "div",
            { className: "btn-group" },
            React.createElement(
              "button",
              {
                id: this.save_svg_id,
                type: "button",
                className: "btn btn-default btn-sm"
              },
              React.createElement("span", { className: "glyphicon glyphicon-floppy-save" }),
              " SVG"
            ),
            React.createElement(
              "button",
              {
                id: this.save_png_id,
                type: "button",
                className: "btn btn-default btn-sm"
              },
              React.createElement("span", { className: "glyphicon glyphicon-floppy-save" }),
              " PNG"
            )
          )
        ),
        React.createElement(
          "div",
          { className: "panel-body" },
          React.createElement("svg", { id: this.svg_id })
        )
      )
    );
  }
});

var OmegaPlotGrid = React.createClass({
  displayName: "OmegaPlotGrid",

  getInitialState: function getInitialState() {
    return { omega_distributions: this.getDistributions(this.props.json) };
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    this.setState({
      omega_distributions: this.getDistributions(nextProps.json)
    });
  },

  getDistributions: function getDistributions(json) {
    var omega_distributions = {};

    if (!json) {
      return [];
    }

    for (var m in json["fits"]) {
      var this_model = json["fits"][m];
      omega_distributions[m] = {};
      for (var d in this_model["rate-distributions"]) {
        var this_distro = this_model["rate-distributions"][d];
        omega_distributions[m][d] = this_distro.map(function (d) {
          return {
            omega: d[0],
            weight: d[1]
          };
        });
      }
    }

    _.each(omega_distributions, function (item, key) {
      item.key = key.toLowerCase().replace(/ /g, "-");
      item.label = key;
    });

    var omega_distributions = _.filter(omega_distributions, function (item) {
      return _.isObject(item["Reference"]);
    });

    return omega_distributions;
  },

  render: function render() {
    var OmegaPlots = _.map(this.state.omega_distributions, function (item, key) {
      var model_name = key;
      var omegas = item;

      var settings = {
        svg_id: omegas.key + "-svg",
        dimensions: { width: 600, height: 400 },
        margins: { left: 50, right: 15, bottom: 35, top: 35 },
        has_zeros: false,
        legend_id: null,
        do_log_plot: true,
        k_p: null,
        plot: null
      };

      return React.createElement(OmegaPlot, { name: model_name, omegas: omegas, settings: settings });
    });

    return React.createElement(
      "div",
      null,
      OmegaPlots
    );
  }
});

module.exports.OmegaPlot = OmegaPlot;
module.exports.OmegaPlotGrid = OmegaPlotGrid;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ }),
/* 443 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(d3, $) {

var _tables = __webpack_require__(20);

var _navbar = __webpack_require__(21);

var _scrollspy = __webpack_require__(22);

var _graphs = __webpack_require__(44);

var _input_info = __webpack_require__(39);

var React = __webpack_require__(5),
    ReactDOM = __webpack_require__(17),
    _ = __webpack_require__(9),
    datamonkey = __webpack_require__(19);

__webpack_require__(444);

var SLACSites = React.createClass({
  displayName: "SLACSites",

  propTypes: {
    headers: React.PropTypes.arrayOf(React.PropTypes.arrayOf(React.PropTypes.string)).isRequired,
    mle: React.PropTypes.object.isRequired,
    sample25: React.PropTypes.object,
    sampleMedian: React.PropTypes.object,
    sample975: React.PropTypes.object,
    initialAmbigHandling: React.PropTypes.string.isRequired,
    partitionSites: React.PropTypes.object.isRequired
  },

  getInitialState: function getInitialState() {
    var canDoCI = this.props.sample25 && this.props.sampleMedian && this.props.sample975;

    return {
      ambigOptions: this.dm_AmbigOptions(this.props),
      ambigHandling: this.props.initialAmbigHandling,
      filters: new Object(null),
      showIntervals: false,
      showCellColoring: canDoCI,
      hasCI: canDoCI,
      filterField: ["Site", -1],
      filterOp: "AND",
      canAddFilter: false,
      lowerFilterBound: -Infinity,
      upperFilterBound: Infinity
    };
  },

  getDefaultProps: function getDefaultProps() {
    return {
      sample25: null,
      sampleMedian: null,
      sample975: null,
      initialAmbigHandling: "RESOLVED"
    };
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    this.setState({
      ambigOptions: this.dm_AmbigOptions(nextProps),
      ambigHandling: nextProps.initialAmbigHandling
    });
  },

  dm_formatNumber: d3.format(".3r"),
  dm_formatNumberShort: d3.format(".2r"),
  dm_rangeColorizer: d3.scale.linear().range([d3.rgb("blue"), d3.rgb("white"), d3.rgb("red")]).clamp(true).domain([-1, 0, 1]),
  dm_rangeTextColorizer: d3.scale.linear().range([d3.rgb("white"), d3.rgb("black"), d3.rgb("black")]).clamp(true).domain([-1, -0.25, 1]),

  dm_log10times: _.before(10, function (v) {
    //console.log(v);
    return 0;
  }),

  dm_formatInterval: function dm_formatInterval(values) {
    //this.dm_log10times (values);

    return this.dm_formatNumber(values[0]) + " / " + this.dm_formatNumber(values[2]) + " [" + this.dm_formatNumber(values[1]) + " : " + this.dm_formatNumber(values[3]) + "]";
  },

  dm_AmbigOptions: function dm_AmbigOptions(theseProps) {
    return _.keys(theseProps.mle[0]);
  },

  dm_setAmbigOption: function dm_setAmbigOption(value) {
    this.setState({
      ambigHandling: value
    });
  },

  dm_toggleIntervals: function dm_toggleIntervals(event) {
    this.setState({
      showIntervals: !this.state.showIntervals,
      showCellColoring: this.state.showIntervals ? this.state.showCellColoring : false
    });
  },

  dm_toggleCellColoring: function dm_toggleCellColoring(event) {
    this.setState({
      showCellColoring: !this.state.showCellColoring
    });
  },

  dm_toggleVariableFilter: function dm_toggleVariableFilter(event) {
    var filterState = new Object(null);
    _.extend(filterState, this.state.filters);
    if (!("variable" in this.state.filters)) {
      filterState["variable"] = true;
    } else {
      delete filterState["variable"];
    }
    this.setState({ filters: filterState });
  },

  dm_makeFilterFunction: function dm_makeFilterFunction() {
    var filterFunction = null;

    _.each(this.state.filters, function (value, key) {
      var composeFunction = null;

      switch (key) {
        case "variable":
          {
            if (filterFunction) {
              composeFunction = function composeFunction(f, partitionIndex, index, site, siteData) {
                return f(partitionIndex, index, site, siteData) && siteData[2] + siteData[3] > 0;
              };
            } else {
              filterFunction = function filterFunction(partitionIndex, index, site, siteData) {
                return siteData[2] + siteData[3] > 0;
              };
            }
            break;
          }
        default:
          {
            if (_.isArray(value)) {
              var new_condition = null,
                  filter_index = value[0][1];
              switch (filter_index) {
                case -2:
                  new_condition = function new_condition(partitionIndex, index, site, siteData) {
                    return partitionIndex >= value[1] && partitionIndex <= value[2];
                  };
                  break;
                case -1:
                  new_condition = function new_condition(partitionIndex, index, site, siteData) {
                    return site >= value[1] && site <= value[2];
                  };
                  break;
                default:
                  new_condition = function new_condition(partitionIndex, index, site, siteData) {
                    return siteData[filter_index] >= value[1] && siteData[filter_index] <= value[2];
                  };
              }

              if (new_condition) {
                if (value[3] == "AND") {
                  composeFunction = function composeFunction(f, partitionIndex, index, site, siteData) {
                    return (!f || f(partitionIndex, index, site, siteData)) && new_condition(partitionIndex, index, site, siteData);
                  };
                } else {
                  if (filterFunction) {
                    composeFunction = function composeFunction(f, partitionIndex, index, site, siteData) {
                      return f(partitionIndex, index, site, siteData) || new_condition(partitionIndex, index, site, siteData);
                    };
                  } else {
                    filterFunction = function filterFunction(partitionIndex, index, site, siteData) {
                      return new_condition(partitionIndex, index, site, siteData);
                    };
                  }
                }
              }
            }
          }
      }

      if (composeFunction) {
        filterFunction = _.wrap(filterFunction, composeFunction);
      }
    });

    return filterFunction;
  },

  dm_makeHeaderRow: function dm_makeHeaderRow() {
    var headers = [{ value: "Partition", sortable: true }, { value: "Site", sortable: true }],
        doCI = this.state.showIntervals,
        filterable = [["Partition", -2], ["Site", -1]];

    if (doCI) {
      var secondRow = ["", ""];

      _.each(this.props.headers, function (value, index) {
        headers.push({
          value: value[0],
          abbr: value[1],
          span: 4,
          style: { textAlign: "center" }
        });
        filterable.push([value[0], index]);
        _.each(["MLE", "Med", "2.5%", "97.5%"], function (v) {
          secondRow.push({ value: v, sortable: true });
        });
      });
      return { headers: [headers, secondRow], filterable: filterable };
    } else {
      _.each(this.props.headers, function (value, index) {
        headers.push({ value: value[0], abbr: value[1], sortable: true });
        filterable.push([value[0], index]);
      });
    }
    return { headers: headers, filterable: filterable };
  },

  dm_makeDataRows: function dm_makeDataRows(filter) {
    var rows = [],
        partitionCount = datamonkey.helpers.countPartitionsJSON(this.props.partitionSites),
        partitionIndex = 0,
        self = this,
        doCI = this.state.showIntervals,
        siteCount = 0;

    while (partitionIndex < partitionCount) {
      _.each(self.props.partitionSites[partitionIndex].coverage[0], function (site, index) {
        var siteData = self.props.mle[partitionIndex][self.state.ambigHandling][index];
        if (!filter || filter(partitionIndex + 1, index + 1, site + 1, siteData)) {
          var thisRow = [partitionIndex + 1, site + 1];
          //secondRow = doCI ? ['',''] : null;
          siteCount++;

          _.each(siteData, function (estimate, colIndex) {
            var sampled_range = null,
                scaled_median_mle_dev = 0;

            if (self.state.hasCI) {
              sampled_range = [self.props.sampleMedian[partitionIndex][self.state.ambigHandling][index][colIndex], self.props.sample25[partitionIndex][self.state.ambigHandling][index][colIndex], self.props.sample975[partitionIndex][self.state.ambigHandling][index][colIndex]];

              var range = sampled_range[2] - sampled_range[1];
              if (range > 0) {
                scaled_median_mle_dev = (estimate - sampled_range[0]) / range;
              }
            }

            if (doCI) {
              thisRow.push({ value: estimate, format: self.dm_formatNumber });
              thisRow.push({
                value: sampled_range[0],
                format: self.dm_formatNumberShort
              });
              thisRow.push({
                value: sampled_range[1],
                format: self.dm_formatNumberShort
              });
              thisRow.push({
                value: sampled_range[2],
                format: self.dm_formatNumberShort
              });
            } else {
              var this_cell = { value: estimate, format: self.dm_formatNumber };
              if (self.state.hasCI) {
                if (self.state.showCellColoring) {
                  this_cell.style = {
                    backgroundColor: self.dm_rangeColorizer(scaled_median_mle_dev),
                    color: self.dm_rangeTextColorizer(scaled_median_mle_dev)
                  };
                }
                this_cell.tooltip = self.dm_formatNumberShort(sampled_range[0]) + " [" + self.dm_formatNumberShort(sampled_range[1]) + " - " + self.dm_formatNumberShort(sampled_range[2]) + "]";
              }
              thisRow.push(this_cell);
            }
          });
          rows.push(thisRow);
          //if (secondRow) {
          //    rows.push (secondRow);
          //}
        }
      });

      partitionIndex++;
    }

    return { rows: rows, count: siteCount };
  },

  dm_handleLB: function dm_handleLB(e) {
    var new_value = parseFloat(e.target.value);
    this.setState({
      lowerFilterBound: _.isFinite(new_value) ? new_value : -Infinity
    });
  },

  dm_handleUB: function dm_handleUB(e) {
    var new_value = parseFloat(e.target.value);
    this.setState({
      upperFilterBound: _.isFinite(new_value) ? new_value : Infinity
    });
  },

  dm_handleFilterField: function dm_handleFilterField(value) {
    this.setState({ filterField: value });
  },

  dm_checkFilterValidity: function dm_checkFilterValidity() {
    if (_.isFinite(this.state.lowerFilterBound)) {
      if (_.isFinite(this.state.upperFilterBound)) {
        return this.state.lowerFilterBound <= this.state.upperFilterBound;
      }
      return true;
    }
    return _.isFinite(this.state.upperFilterBound);
  },

  dm_unique_filter_ID: 0,

  dm_handleAddCondition: function dm_handleAddCondition(e) {
    e.preventDefault();
    var filterState = new Object(null);
    _.extend(filterState, this.state.filters);
    filterState[this.dm_unique_filter_ID++] = [this.state.filterField, this.state.lowerFilterBound, this.state.upperFilterBound, this.state.filterOp];

    this.setState({ filters: filterState });
  },

  dm_handleRemoveCondition: function dm_handleRemoveCondition(key, e) {
    e.preventDefault();

    _.extend(filterState, this.state.filters);
    delete filterState[key];
    //console.log (key, this.state.filters,filterState);

    this.setState({ filters: filterState });
  },

  render: function render() {
    var self = this;

    var _dm_makeDataRows = this.dm_makeDataRows(this.dm_makeFilterFunction()),
        rows = _dm_makeDataRows.rows,
        count = _dm_makeDataRows.count;

    var _dm_makeHeaderRow = this.dm_makeHeaderRow(),
        headers = _dm_makeHeaderRow.headers,
        filterable = _dm_makeHeaderRow.filterable;

    var show_ci_menu = function show_ci_menu() {
      if (self.state.hasCI) {
        var ci_menu = [React.createElement("li", { key: "ci_divider", className: "divider" }), React.createElement(
          "li",
          { key: "intervals" },
          React.createElement(
            "a",
            {
              href: "#",
              "data-value": "showIntervals",
              tabIndex: "-1",
              onClick: self.dm_toggleIntervals
            },
            React.createElement("input", {
              type: "checkbox",
              checked: self.state.showIntervals,
              defaultChecked: self.state.showIntervals,
              onChange: self.dm_toggleIntervals
            }),
            "\xA0Show sampling confidence intervals"
          )
        )];

        if (!self.state.showIntervals) {
          ci_menu.push(React.createElement(
            "li",
            { key: "coloring" },
            React.createElement(
              "a",
              {
                href: "#",
                "data-value": "showIntervals",
                tabIndex: "-1",
                onClick: self.dm_toggleCellColoring
              },
              React.createElement("input", {
                type: "checkbox",
                checked: self.state.showCellColoring,
                defaultChecked: self.state.showCellColoring,
                onChange: self.dm_toggleCellColoring
              }),
              "\xA0Color cells based on MLE-median"
            )
          ));
        }
        return ci_menu;
      }
      return null;
    };

    var result = React.createElement(
      "div",
      { className: "table-responsive" },
      React.createElement(
        "nav",
        { className: "navbar" },
        React.createElement(
          "form",
          { className: "navbar-form " },
          React.createElement(
            "div",
            { className: "form-group navbar-left" },
            React.createElement(
              "div",
              { className: "input-group" },
              React.createElement(
                "span",
                { className: "input-group-addon" },
                "Display Options "
              ),
              React.createElement(
                "ul",
                { className: "dropdown-menu" },
                React.createElement(
                  "li",
                  { key: "variable" },
                  React.createElement(
                    "a",
                    {
                      href: "#",
                      "data-value": "variable",
                      tabIndex: "-1",
                      onClick: self.dm_toggleVariableFilter
                    },
                    React.createElement("input", {
                      type: "checkbox",
                      checked: "variable" in self.state.filters,
                      defaultChecked: "variable" in self.state.filters,
                      onChange: self.dm_toggleVariableFilter
                    }),
                    "\xA0Variable sites only"
                  )
                ),
                show_ci_menu()
              ),
              React.createElement(
                "button",
                {
                  className: "btn btn-default btn-sm dropdown-toggle form-control",
                  type: "button",
                  "data-toggle": "dropdown",
                  "aria-haspopup": "true",
                  "aria-expanded": "false"
                },
                React.createElement("span", { className: "caret" })
              )
            ),
            React.createElement(
              "div",
              { className: "input-group" },
              React.createElement(
                "span",
                { className: "input-group-addon" },
                "Ambiguities "
              ),
              React.createElement(
                "ul",
                { className: "dropdown-menu" },
                _.map(this.state.ambigOptions, function (value, index) {
                  return React.createElement(
                    "li",
                    { key: index },
                    React.createElement(
                      "a",
                      {
                        href: "#",
                        tabIndex: "-1",
                        onClick: _.partial(self.dm_setAmbigOption, value)
                      },
                      value
                    )
                  );
                })
              ),
              React.createElement(
                "button",
                {
                  className: "btn btn-default btn-sm dropdown-toggle form-control",
                  type: "button",
                  "data-toggle": "dropdown",
                  "aria-haspopup": "true",
                  "aria-expanded": "false"
                },
                self.state.ambigHandling,
                " ",
                React.createElement("span", { className: "caret" })
              )
            )
          ),
          React.createElement(
            "div",
            { className: "form-group navbar-right" },
            React.createElement(
              "div",
              { className: "input-group" },
              React.createElement(
                "ul",
                { className: "dropdown-menu" },
                _.map(filterable, function (d, index) {
                  return React.createElement(
                    "li",
                    { key: index },
                    React.createElement(
                      "a",
                      {
                        href: "#",
                        tabIndex: "-1",
                        onClick: _.partial(self.dm_handleFilterField, d)
                      },
                      d[0]
                    )
                  );
                })
              ),
              React.createElement(
                "button",
                {
                  className: "btn btn-default btn-sm dropdown-toggle form-control",
                  type: "button",
                  "data-toggle": "dropdown",
                  "aria-haspopup": "true",
                  "aria-expanded": "false"
                },
                self.state.filterField[0],
                " ",
                React.createElement("span", { className: "caret" })
              )
            ),
            React.createElement(
              "div",
              { className: "input-group" },
              React.createElement(
                "span",
                { className: "input-group-addon" },
                " ",
                "is in [",
                " "
              ),
              React.createElement("input", {
                type: "text",
                className: "form-control",
                placeholder: "-\u221E",
                defaultValue: "-" + String.fromCharCode(8734),
                onChange: self.dm_handleLB
              })
            ),
            React.createElement(
              "div",
              { className: "input-group" },
              React.createElement(
                "span",
                { className: "input-group-addon" },
                ","
              ),
              React.createElement("input", {
                type: "text",
                className: "form-control",
                placeholder: "\u221E",
                defaultValue: String.fromCharCode(8734),
                onChange: self.dm_handleUB
              }),
              React.createElement(
                "span",
                { className: "input-group-addon" },
                "]"
              )
            ),
            React.createElement(
              "div",
              { className: "input-group" },
              React.createElement(
                "button",
                {
                  className: "btn btn-default " + (self.dm_checkFilterValidity() ? "" : "disabled"),
                  onClick: self.dm_handleAddCondition
                },
                " ",
                "Add condition as",
                " "
              )
            ),
            React.createElement(
              "div",
              { className: "input-group" },
              React.createElement(
                "ul",
                { className: "dropdown-menu" },
                _.map(["AND", "OR"], function (d, index) {
                  return React.createElement(
                    "li",
                    { key: index },
                    React.createElement(
                      "a",
                      {
                        href: "#",
                        tabIndex: "-1",
                        onClick: function onClick() {
                          self.setState({ filterOp: d });
                        }
                      },
                      d
                    )
                  );
                })
              ),
              React.createElement(
                "button",
                {
                  className: "btn btn-default btn-sm dropdown-toggle form-control",
                  type: "button",
                  "data-toggle": "dropdown",
                  "aria-haspopup": "true",
                  "aria-expanded": "false"
                },
                self.state.filterOp,
                " ",
                React.createElement("span", { className: "caret" })
              )
            ),
            React.createElement(
              "span",
              { className: "badge", style: { marginLeft: "0.5em" } },
              count
            ),
            " ",
            "sites shown"
          )
        )
      ),
      self.state.hasCI ? React.createElement(
        "div",
        { className: "alert alert-info alert-dismissable" },
        React.createElement(
          "button",
          {
            type: "button",
            className: "close pull-right",
            "data-dismiss": "alert",
            "aria-hidden": "true"
          },
          " ",
          "\xD7",
          " "
        ),
        "Default table shading is used to indicate the magnitude of difference between the estimate of a specific quantity using the MLE ancestral state reconstruction, and the median of the estimate using a sample from the distribution of ancestral state reconstructions.",
        React.createElement("br", null),
        React.createElement(
          "strong",
          null,
          "Color legend:"
        ),
        " MLE is \xA0",
        React.createElement(
          "span",
          {
            className: "badge",
            style: { backgroundColor: self.dm_rangeColorizer(-1) }
          },
          "is much less"
        ),
        "\xA0",
        React.createElement(
          "span",
          {
            className: "badge",
            style: {
              backgroundColor: self.dm_rangeColorizer(0),
              color: "black"
            }
          },
          "is the same as"
        ),
        "\xA0",
        React.createElement(
          "span",
          {
            className: "badge",
            style: { backgroundColor: self.dm_rangeColorizer(1) }
          },
          "is much greater"
        ),
        "\xA0 than the sampled median. You can mouse over the cells to see individual sampling intervals."
      ) : null,
      _.keys(self.state.filters).length > 0 ? React.createElement(
        "div",
        { className: "well well-sm" },
        _.map(self.state.filters, function (value, key) {
          if (key == "variable") {
            return React.createElement(
              "div",
              {
                className: "input-group",
                style: { display: "inline" },
                key: key
              },
              React.createElement(
                "span",
                { className: "badge badge-info" },
                "(AND) variable sites",
                React.createElement("i", {
                  className: "fa fa-times-circle",
                  style: { marginLeft: "0.25em" },
                  onClick: self.dm_toggleVariableFilter
                })
              )
            );
          } else {
            var label = (value[3] == "AND" ? " (AND) " : " (OR) ") + value[0][0];

            if (_.isFinite(value[1])) {
              if (_.isFinite(value[2])) {
                label += String.fromCharCode(8712) + "[" + value[1] + "," + value[2] + "]";
              } else {
                label += String.fromCharCode(8805) + value[1];
              }
            } else {
              label += String.fromCharCode(8804) + value[2];
            }

            return React.createElement(
              "div",
              {
                className: "input-group",
                style: { display: "inline" },
                key: key
              },
              React.createElement(
                "span",
                { className: "badge badge-info" },
                label,
                React.createElement("i", {
                  className: "fa fa-times-circle",
                  style: { marginLeft: "0.25em" },
                  onClick: _.bind(_.partial(self.dm_handleRemoveCondition, key), self)
                })
              )
            );
          }
        })
      ) : null,
      React.createElement(_tables.DatamonkeyTable, {
        headerData: headers,
        bodyData: rows,
        initialSort: 1,
        paginate: 20,
        export_csv: true
      })
    );

    return result;
  }
});

var SLACBanner = React.createClass({
  displayName: "SLACBanner",

  dm_countSites: function dm_countSites(json, cutoff) {
    var result = {
      all: 0,
      positive: 0,
      negative: 0
    };

    result.all = datamonkey.helpers.countSitesFromPartitionsJSON(json);

    result.positive = datamonkey.helpers.sum(json["MLE"]["content"], function (partition) {
      return _.reduce(partition["by-site"]["RESOLVED"], function (sum, row) {
        return sum + (row[8] <= cutoff ? 1 : 0);
      }, 0);
    });

    result.negative = datamonkey.helpers.sum(json["MLE"]["content"], function (partition) {
      return _.reduce(partition["by-site"]["RESOLVED"], function (sum, row) {
        return sum + (row[9] <= cutoff ? 1 : 0);
      }, 0);
    });

    return result;
  },

  dm_computeState: function dm_computeState(state, pvalue) {
    return {
      sites: this.dm_countSites(state, pvalue)
    };
  },

  dm_formatP: d3.format(".3f"),

  getInitialState: function getInitialState() {
    return this.dm_computeState(this.props.analysis_results, this.props.pValue);
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    this.setState(this.dm_computeState(nextProps.analysis_results, nextProps.pValue));
  },

  render: function render() {
    return React.createElement(
      "div",
      { className: "row", id: "slac-summary" },
      React.createElement(
        "div",
        { className: "col-md-12" },
        React.createElement(
          "h3",
          { className: "list-group-item-heading" },
          React.createElement(
            "span",
            { className: "summary-method-name" },
            "Single-Likelihood Ancestor Counting"
          ),
          React.createElement("br", null),
          React.createElement(
            "span",
            { className: "results-summary" },
            "results summary"
          )
        )
      ),
      React.createElement(
        "div",
        { className: "col-md-12" },
        React.createElement(_input_info.InputInfo, { input_data: this.props.input_data })
      ),
      React.createElement(
        "div",
        { className: "col-md-12" },
        React.createElement(
          "div",
          { className: "main-result" },
          React.createElement(
            "p",
            null,
            "Evidence",
            React.createElement(
              "sup",
              null,
              "\u2020"
            ),
            " of pervasive",
            " ",
            React.createElement(
              "span",
              { className: "hyphy-highlight" },
              "diversifying"
            ),
            "/",
            React.createElement(
              "span",
              { className: "hyphy-highlight" },
              "purifying"
            ),
            " ",
            "selection was found at",
            React.createElement(
              "strong",
              { className: "hyphy-highlight" },
              " ",
              this.state.sites.positive
            ),
            " ",
            "/",
            " ",
            React.createElement(
              "strong",
              { className: "hyphy-navy" },
              this.state.sites.negative
            ),
            " ",
            "sites among ",
            this.state.sites.all,
            " tested sites."
          ),
          React.createElement(
            "div",
            { style: { marginBottom: "0em" } },
            React.createElement(
              "small",
              null,
              React.createElement(
                "sup",
                null,
                "\u2020"
              ),
              "Extended binomial test, p \u2264",
              " ",
              this.dm_formatP(this.props.pValue),
              React.createElement(
                "div",
                {
                  className: "dropdown hidden-print",
                  style: { display: "inline", marginLeft: "0.25em" }
                },
                React.createElement(
                  "button",
                  {
                    id: "dm.pvalue.slider",
                    type: "button",
                    className: "btn btn-primary btn-xs dropdown-toggle",
                    "data-toggle": "dropdown",
                    "aria-haspopup": "true",
                    "aria-expanded": "false"
                  },
                  React.createElement("span", { className: "caret" })
                ),
                React.createElement(
                  "ul",
                  {
                    className: "dropdown-menu",
                    "aria-labelledby": "dm.pvalue.slider"
                  },
                  React.createElement(
                    "li",
                    null,
                    React.createElement(
                      "a",
                      { href: "#" },
                      React.createElement("input", {
                        type: "range",
                        min: "0",
                        max: "1",
                        value: this.props.pValue,
                        step: "0.01",
                        onChange: this.props.pAdjuster
                      })
                    )
                  )
                )
              ),
              React.createElement(
                "emph",
                null,
                " not"
              ),
              " corrected for multiple testing; ambiguous characters resolved to minimize substitution counts.",
              React.createElement("br", null),
              React.createElement("i", { className: "fa fa-exclamation-circle" }),
              " Please cite",
              " ",
              React.createElement(
                "a",
                {
                  href: "http://www.ncbi.nlm.nih.gov/pubmed/15703242",
                  target: "_blank"
                },
                "PMID 15703242"
              ),
              " ",
              "if you use this result in a publication, presentation, or other scientific work."
            )
          )
        )
      )
    );
  }
});

var SLACGraphs = React.createClass({
  displayName: "SLACGraphs",

  getInitialState: function getInitialState() {
    return {
      ambigHandling: this.props.initialAmbigHandling,
      ambigOptions: this.dm_AmbigOptions(this.props),
      xLabel: "Site",
      yLabel: "dN-dS"
    };
  },

  getDefaultProps: function getDefaultProps() {
    return {
      mle: null,
      partitionSites: null,
      initialAmbigHandling: "RESOLVED"
    };
  },

  dm_AmbigOptions: function dm_AmbigOptions(theseProps) {
    return _.keys(theseProps.mle[0]);
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    this.setState({
      ambigOptions: this.dm_AmbigOptions(nextProps),
      ambigHandling: nextProps.initialAmbigHandling
    });
  },

  dm_makePlotData: function dm_makePlotData(xlabel, ylabels) {
    var self = this;

    var x = [];
    var y = [[]];

    var partitionCount = datamonkey.helpers.countPartitionsJSON(this.props.partitionSites),
        partitionIndex = 0,
        siteCount = 0,
        col_index = [],
        x_index = -1;

    _.each(self.props.headers, function (d, i) {
      if (_.find(ylabels, function (l) {
        return l == d[0];
      })) {
        col_index.push(i);
      }
    });

    x_index = _.pluck(self.props.headers, 0).indexOf(xlabel);

    y = _.map(col_index, function () {
      return [];
    });

    while (partitionIndex < partitionCount) {
      _.each(self.props.partitionSites[partitionIndex].coverage[0], function (site, index) {
        var siteData = self.props.mle[partitionIndex][self.state.ambigHandling][index];
        siteCount++;
        if (x_index < 0) {
          x.push(siteCount);
        } else {
          x.push(siteData[x_index]);
        }
        _.each(col_index, function (ci, i) {
          y[i].push(siteData[ci]);
        });
      });

      partitionIndex++;
    }

    return { x: x, y: y };
  },

  dm_xAxis: function dm_xAxis(column) {
    this.setState({ xLabel: column });
  },

  dm_yAxis: function dm_yAxis(column) {
    this.setState({ yLabel: column });
  },

  dm_setAmbigOption: function dm_setAmbigOption(value) {
    this.setState({
      ambigHandling: value
    });
  },

  dm_doScatter: function dm_doScatter() {
    return this.state.xLabel != "Site";
  },

  render: function render() {
    var self = this;

    var _dm_makePlotData = this.dm_makePlotData(this.state.xLabel, [this.state.yLabel]),
        x = _dm_makePlotData.x,
        y = _dm_makePlotData.y;

    return React.createElement(
      "div",
      { className: "row" },
      React.createElement(
        "nav",
        { className: "navbar" },
        React.createElement(
          "form",
          { className: "navbar-form " },
          React.createElement(
            "div",
            { className: "form-group navbar-left" },
            React.createElement(
              "div",
              { className: "input-group" },
              React.createElement(
                "span",
                { className: "input-group-addon" },
                "X-axis:"
              ),
              React.createElement(
                "ul",
                { className: "dropdown-menu" },
                _.map(["Site"].concat(_.pluck(self.props.headers, 0)), function (value) {
                  return React.createElement(
                    "li",
                    { key: value },
                    React.createElement(
                      "a",
                      {
                        href: "#",
                        tabIndex: "-1",
                        onClick: _.partial(self.dm_xAxis, value)
                      },
                      value
                    )
                  );
                })
              ),
              React.createElement(
                "button",
                {
                  className: "btn btn-default btn-sm dropdown-toggle form-control",
                  type: "button",
                  "data-toggle": "dropdown",
                  "aria-haspopup": "true",
                  "aria-expanded": "false"
                },
                self.state.xLabel,
                React.createElement("span", { className: "caret" })
              )
            ),
            React.createElement(
              "div",
              { className: "input-group" },
              React.createElement(
                "span",
                { className: "input-group-addon" },
                "Y-axis:"
              ),
              React.createElement(
                "ul",
                { className: "dropdown-menu" },
                _.map(_.pluck(self.props.headers, 0), function (value) {
                  return React.createElement(
                    "li",
                    { key: value },
                    React.createElement(
                      "a",
                      {
                        href: "#",
                        tabIndex: "-1",
                        onClick: _.partial(self.dm_yAxis, value)
                      },
                      value
                    )
                  );
                })
              ),
              React.createElement(
                "button",
                {
                  className: "btn btn-default btn-sm dropdown-toggle form-control",
                  type: "button",
                  "data-toggle": "dropdown",
                  "aria-haspopup": "true",
                  "aria-expanded": "false"
                },
                self.state.yLabel,
                React.createElement("span", { className: "caret" })
              )
            ),
            React.createElement(
              "div",
              { className: "input-group" },
              React.createElement(
                "span",
                { className: "input-group-addon" },
                "Ambiguities "
              ),
              React.createElement(
                "ul",
                { className: "dropdown-menu" },
                _.map(this.state.ambigOptions, function (value, index) {
                  return React.createElement(
                    "li",
                    { key: index },
                    React.createElement(
                      "a",
                      {
                        href: "#",
                        tabIndex: "-1",
                        onClick: _.partial(self.dm_setAmbigOption, value)
                      },
                      value
                    )
                  );
                })
              ),
              React.createElement(
                "button",
                {
                  className: "btn btn-default btn-sm dropdown-toggle form-control",
                  type: "button",
                  "data-toggle": "dropdown",
                  "aria-haspopup": "true",
                  "aria-expanded": "false"
                },
                self.state.ambigHandling,
                " ",
                React.createElement("span", { className: "caret" })
              )
            )
          )
        )
      ),
      self.dm_doScatter() ? React.createElement(_graphs.DatamonkeyScatterplot, {
        x: x,
        y: y,
        marginLeft: 50,
        transitions: true
      }) : React.createElement(_graphs.DatamonkeySeries, {
        x: x,
        y: y,
        marginLeft: 50,
        transitions: true,
        doDots: true
      })
    );
  }
});

var SLAC = React.createClass({
  displayName: "SLAC",

  float_format: d3.format(".2f"),

  dm_loadFromServer: function dm_loadFromServer() {
    /* 20160721 SLKP: prefixing all custom (i.e. not defined by REACT) with dm_
     to make it easier to recognize scoping immediately */

    var self = this;

    d3.json(self.props.url, function (request_error, data) {
      if (!data) {
        var error_message_text = request_error.status == 404 ? self.props.url + " could not be loaded" : request_error.statusText;
        self.setState({ error_message: error_message_text });
      } else {
        self.dm_initializeFromJSON(data);
      }
    });
  },

  dm_initializeFromJSON: function dm_initializeFromJSON(data) {
    this.setState({
      analysis_results: data,
      input_data: data.input_data
    });
  },

  getDefaultProps: function getDefaultProps() {
    /* default properties for the component */

    return {
      url: "#"
    };
  },

  getInitialState: function getInitialState() {
    return {
      analysis_results: null,
      error_message: null,
      pValue: 0.1,
      input_data: null
    };
  },

  componentWillMount: function componentWillMount() {
    this.dm_loadFromServer();
    this.dm_setEvents();
  },

  dm_setEvents: function dm_setEvents() {
    var self = this;

    $("#datamonkey-json-file").on("change", function (e) {
      var files = e.target.files; // FileList object

      if (files.length == 1) {
        var f = files[0];
        var reader = new FileReader();

        reader.onload = function (theFile) {
          return function (e) {
            try {
              self.dm_initializeFromJSON(JSON.parse(this.result));
            } catch (error) {
              self.setState({ error_message: error.toString() });
            }
          };
        }(f);

        reader.readAsText(f);
      }

      $("#datamonkey-json-file-toggle").dropdown("toggle");
    });
  },

  dm_adjustPvalue: function dm_adjustPvalue(event) {
    this.setState({ pValue: parseFloat(event.target.value) });
  },

  componentDidUpdate: function componentDidUpdate(prevProps, prevState) {
    $("body").scrollspy({
      target: ".bs-docs-sidebar",
      offset: 50
    });
    $('[data-toggle="popover"]').popover();
  },


  render: function render() {
    var self = this;

    if (self.state.error_message) {
      return React.createElement(
        "div",
        {
          id: "datamonkey-error",
          className: "alert alert-danger alert-dismissible",
          role: "alert"
        },
        React.createElement(
          "button",
          {
            type: "button",
            className: "close",
            "data-dismiss": "alert",
            "aria-label": "Close"
          },
          React.createElement(
            "span",
            { "aria-hidden": "true" },
            "\xD7"
          )
        ),
        React.createElement(
          "strong",
          null,
          self.state.error_message
        ),
        " ",
        React.createElement("span", { id: "datamonkey-error-text" })
      );
    }

    if (self.state.analysis_results) {
      var scrollspy_info = [{ label: "summary", href: "slac-summary" }, { label: "information", href: "datamonkey-slac-tree-summary" }, { label: "table", href: "slac-table" }, { label: "graph", href: "slac-graph" }];
      return React.createElement(
        "div",
        null,
        React.createElement(_navbar.NavBar, null),
        React.createElement(
          "div",
          { className: "container" },
          React.createElement(
            "div",
            { className: "row" },
            React.createElement(_scrollspy.ScrollSpy, { info: scrollspy_info }),
            React.createElement(
              "div",
              { className: "col-md-10" },
              React.createElement(
                "div",
                { id: "results" },
                React.createElement(SLACBanner, {
                  analysis_results: self.state.analysis_results,
                  pValue: self.state.pValue,
                  pAdjuster: _.bind(self.dm_adjustPvalue, self),
                  input_data: self.state.input_data
                }),
                React.createElement(
                  "div",
                  { className: "row hidden-print" },
                  React.createElement(
                    "div",
                    {
                      id: "datamonkey-slac-tree-summary",
                      className: "col-lg-4 col-md-6 col-sm-12"
                    },
                    React.createElement(
                      "h4",
                      { className: "dm-table-header" },
                      "Partition information"
                    ),
                    React.createElement(
                      "small",
                      null,
                      React.createElement(_tables.DatamonkeyPartitionTable, {
                        pValue: self.state.pValue,
                        trees: self.state.analysis_results.trees,
                        partitions: self.state.analysis_results.partitions,
                        branchAttributes: self.state.analysis_results["branch attributes"],
                        siteResults: self.state.analysis_results.MLE,
                        accessorPositive: function accessorPositive(json, partition) {
                          return _.map(json["content"][partition]["by-site"]["AVERAGED"], function (v) {
                            return v[8];
                          });
                        },
                        accessorNegative: function accessorNegative(json, partition) {
                          return _.map(json["content"][partition]["by-site"]["AVERAGED"], function (v) {
                            return v[9];
                          });
                        }
                      })
                    )
                  ),
                  React.createElement(
                    "div",
                    {
                      id: "datamonkey-slac-model-fits",
                      className: "col-lg-5 col-md-6 col-sm-12"
                    },
                    React.createElement(
                      "small",
                      null,
                      React.createElement(_tables.DatamonkeyModelTable, {
                        fits: self.state.analysis_results.fits
                      })
                    )
                  ),
                  React.createElement(
                    "div",
                    {
                      id: "datamonkey-slac-timers",
                      className: "col-lg-3 col-md-3 col-sm-12"
                    },
                    React.createElement(
                      "h4",
                      { className: "dm-table-header" },
                      "Execution time"
                    ),
                    React.createElement(
                      "small",
                      null,
                      React.createElement(_tables.DatamonkeyTimersTable, {
                        timers: self.state.analysis_results.timers,
                        totalTime: "Total time"
                      })
                    )
                  )
                ),
                React.createElement(
                  "div",
                  { className: "row" },
                  React.createElement(
                    "div",
                    { className: "col-md-12", id: "slac-table" },
                    React.createElement(
                      "h4",
                      { className: "dm-table-header" },
                      "Site table"
                    ),
                    React.createElement(SLACSites, {
                      headers: self.state.analysis_results.MLE.headers,
                      mle: datamonkey.helpers.map(datamonkey.helpers.filter(self.state.analysis_results.MLE.content, function (value, key) {
                        return _.has(value, "by-site");
                      }), function (value, key) {
                        return value["by-site"];
                      }),
                      sample25: self.state.analysis_results["sample-2.5"],
                      sampleMedian: self.state.analysis_results["sample-median"],
                      sample975: self.state.analysis_results["sample-97.5"],
                      partitionSites: self.state.analysis_results.partitions
                    })
                  )
                ),
                React.createElement(
                  "div",
                  { className: "row" },
                  React.createElement(
                    "div",
                    { className: "col-md-12", i: true, id: "slac-graph" },
                    React.createElement(
                      "h4",
                      { className: "dm-table-header" },
                      "Site graph"
                    ),
                    React.createElement(SLACGraphs, {
                      mle: datamonkey.helpers.map(datamonkey.helpers.filter(self.state.analysis_results.MLE.content, function (value, key) {
                        return _.has(value, "by-site");
                      }), function (value, key) {
                        return value["by-site"];
                      }),
                      partitionSites: self.state.analysis_results.partitions,
                      headers: self.state.analysis_results.MLE.headers
                    })
                  )
                )
              )
            ),
            React.createElement("div", { className: "col-md-1" })
          )
        )
      );
    }
    return null;
  }
});

// Will need to make a call to this
// omega distributions
function render_slac(url, element) {
  ReactDOM.render(React.createElement(SLAC, { url: url }), document.getElementById(element));
}

module.exports = render_slac;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6), __webpack_require__(3)))

/***/ }),
/* 444 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function($, jQuery, d3, _) {

var datamonkey = __webpack_require__(19);

function datamonkey_get_styles(doc) {
  var styles = "",
      styleSheets = doc.styleSheets;

  if (styleSheets) {
    for (var i = 0; i < styleSheets.length; i++) {
      processStyleSheet(styleSheets[i]);
    }
  }

  function processStyleSheet(ss) {
    if (ss.cssRules) {
      for (var i = 0; i < ss.cssRules.length; i++) {
        var rule = ss.cssRules[i];
        if (rule.type === 3) {
          // Import Rule
          processStyleSheet(rule.styleSheet);
        } else {
          // hack for illustrator crashing on descendent selectors
          if (rule.selectorText) {
            if (rule.selectorText.indexOf(">") === -1) {
              styles += "\n" + rule.cssText;
            }
          }
        }
      }
    }
  }
  return styles;
}

function datamonkey_save_newick_to_file() {
  var top_modal_container = "#neighbor-tree-modal";
  var nwk = $(top_modal_container).data("tree");
  var pom = document.createElement("a");
  pom.setAttribute("href", "data:text/octet-stream;charset=utf-8," + encodeURIComponent(nwk));
  pom.setAttribute("download", "nwk.txt");
  $("body").append(pom);
  pom.click();
  pom.remove();
}

function datamonkey_convert_svg_to_png(image_string) {
  var image = document.getElementById("image");
  image.src = image_string;

  image.onload = function () {
    var canvas = document.getElementById("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    var context = canvas.getContext("2d");
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, image.width, image.height);
    context.drawImage(image, 0, 0);
    var pom = document.createElement("a");
    pom.setAttribute("download", "phylotree.png");
    pom.href = canvas.toDataURL("image/png");
    $("body").append(pom);
    pom.click();
    pom.remove();
  };
}

function datamonkey_save_newick_tree(type) {
  var prefix = {
    xmlns: "http://www.w3.org/2000/xmlns/",
    xlink: "http://www.w3.org/1999/xlink",
    svg: "http://www.w3.org/2000/svg"
  };

  var svg = $("#tree_container").find("svg")[0];
  var styles = datamonkey_get_styles(window.document);

  svg.setAttribute("version", "1.1");

  var defsEl = document.createElement("defs");
  svg.insertBefore(defsEl, svg.firstChild);

  var styleEl = document.createElement("style");
  defsEl.appendChild(styleEl);
  styleEl.setAttribute("type", "text/css");

  // removing attributes so they aren't doubled up
  svg.removeAttribute("xmlns");
  svg.removeAttribute("xlink");

  // These are needed for the svg
  if (!svg.hasAttributeNS(prefix.xmlns, "xmlns")) {
    svg.setAttributeNS(prefix.xmlns, "xmlns", prefix.svg);
  }

  if (!svg.hasAttributeNS(prefix.xmlns, "xmlns:xlink")) {
    svg.setAttributeNS(prefix.xmlns, "xmlns:xlink", prefix.xlink);
  }

  var source = new XMLSerializer().serializeToString(svg).replace("</style>", "<![CDATA[" + styles + "]]></style>");
  var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
  var to_download = [doctype + source];
  var image_string = "data:image/svg+xml;base66," + encodeURIComponent(to_download);

  if (type == "png") {
    datamonkey_convert_svg_to_png(image_string);
  } else {
    var pom = document.createElement("a");
    pom.setAttribute("download", "phylotree.svg");
    pom.setAttribute("href", image_string);
    $("body").append(pom);
    pom.click();
    pom.remove();
  }
}

function datamonkey_validate_email(email) {
  if ($(this).find("input[name='receive_mail']")[0].checked) {
    var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    if (regex.test($(this).find("input[name='mail']").val())) {
      // Give them green. They like that.
      $(this).removeClass("has-error");
      $(this).addClass("has-success");
      $(this).next(".help-block").remove();
    } else {
      $(this).next(".help-block").remove();
      $(this).removeClass("has-error");
      $(this).removeClass("has-success");
      $(this).addClass("has-error");
      jQuery("<span/>", {
        class: "help-block col-lg-9 pull-right",
        text: "Invalid Email"
      }).insertAfter($(this));
    }
  } else {
    $(this).removeClass("has-error");
    $(this).removeClass("has-success");
    $(this).next(".help-block").remove();
  }
}

function datamonkey_describe_vector(vector, as_list) {
  vector.sort(d3.ascending);

  var d = {
    min: d3.min(vector),
    max: d3.max(vector),
    median: d3.median(vector),
    Q1: d3.quantile(vector, 0.25),
    Q3: d3.quantile(vector, 0.75),
    mean: d3.mean(vector)
  };

  if (as_list) {
    d = "<pre>Range  :" + d["min"] + "-" + d["max"] + "\n" + "IQR    :" + d["Q1"] + "-" + d["Q3"] + "\n" + "Mean   :" + d["mean"] + "\n" + "Median :" + d["median"] + "\n" + "</pre>";

    /*d =
        "<dl class = 'dl-horizontal'>" +
        "<dt>Range</dt><dd>" + d['min'] + "-" + d['max'] + "</dd>" +
        "<dt>IQR</dt><dd>" + d['Q1'] + "-" + d['Q3'] +  "</dd>" +
        "<dt>Mean</dt><dd>" + d['mean'] +  "</dd>" +
        "<dt>Median</dt><dd>" + d['median'] + "</dd></dl>";*/
  }

  return d;
}

function datamonkey_export_handler(data, filename, mimeType) {
  function msieversion() {
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");
    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
      return true;
    }
    return false;
  }

  if (msieversion()) {
    var IEwindow = window.open();
    IEwindow.document.write(data);
    IEwindow.document.close();
    IEwindow.document.execCommand("SaveAs", true, filename + ".csv");
    IEwindow.close();
  } else {
    var pom = document.createElement("a");
    pom.setAttribute("href", "data:" + (mimeType || "text/plain") + ";charset=utf-8," + encodeURIComponent(data));
    pom.setAttribute("download", filename || "download.tsv");
    pom.click();
    pom.remove();
  }
}

function datamonkey_table_to_text(table_id, sep) {
  sep = sep || "\t";
  var header_row = [];
  d3.select(table_id + " thead").selectAll("th").each(function () {
    header_row.push(d3.select(this).text());
  });
  var data_rows = [];
  d3.select(table_id + " tbody").selectAll("tr").each(function (d, i) {
    data_rows.push([]);
    d3.select(this).selectAll("td").each(function () {
      data_rows[i].push(d3.select(this).text());
    });
  });

  return header_row.join(sep) + "\n" + data_rows.map(function (d) {
    return d.join(sep);
  }).join("\n");
}

function datamonkey_capitalize(s) {
  if (s.length > 0) {
    return s[0].toUpperCase() + s.slice(1);
  } else {
    return s;
  }
}

function datamonkey_count_partitions(json) {
  try {
    return _.keys(json).length;
  } catch (e) {
    // ignore errors
  }
  return 0;
}

function datamonkey_sum(object, accessor) {
  accessor = accessor || function (value) {
    return value;
  };
  return _.reduce(object, function (sum, value, index) {
    return sum + accessor(value, index);
  }, 0);
}

function datamonkey_count_sites_from_partitions(json) {
  try {
    return datamonkey_sum(json["partitions"], function (value) {
      return value["coverage"][0].length;
    });
  } catch (e) {
    // ignore errors
  }
  return 0;
}

function datamonkey_filter_list(list, predicate, context) {
  var result = {};
  predicate = _.bind(predicate, context);
  _.each(list, _.bind(function (value, key) {
    if (predicate(value, key)) {
      result[key] = value;
    }
  }, context));
  return result;
}

function datamonkey_map_list(list, transform, context) {
  var result = {};
  transform = _.bind(transform, context);
  _.each(list, _.bind(function (value, key) {
    result[key] = transform(value, key);
  }, context));
  return result;
}

datamonkey.helpers = new Object();
datamonkey.helpers.save_newick_to_file = datamonkey_save_newick_to_file;
datamonkey.helpers.convert_svg_to_png = datamonkey_convert_svg_to_png;
datamonkey.helpers.save_newick_tree = datamonkey_save_newick_tree;
datamonkey.helpers.validate_email = datamonkey_validate_email;
datamonkey.helpers.describe_vector = datamonkey_describe_vector;
datamonkey.helpers.table_to_text = datamonkey_table_to_text;
datamonkey.helpers.export_handler = datamonkey_export_handler;
datamonkey.helpers.capitalize = datamonkey_capitalize;
datamonkey.helpers.countPartitionsJSON = datamonkey_count_partitions;
datamonkey.helpers.countSitesFromPartitionsJSON = datamonkey_count_sites_from_partitions;
datamonkey.helpers.sum = datamonkey_sum;
datamonkey.helpers.filter = datamonkey_filter_list;
datamonkey.helpers.map = datamonkey_map_list;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3), __webpack_require__(3), __webpack_require__(6), __webpack_require__(9)))

/***/ }),
/* 445 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function($) {

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _input_info = __webpack_require__(39);

var _tables = __webpack_require__(20);

var _graphs = __webpack_require__(44);

var _navbar = __webpack_require__(21);

var _scrollspy = __webpack_require__(22);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = __webpack_require__(5),
    ReactDOM = __webpack_require__(17),
    d3 = __webpack_require__(6),
    _ = __webpack_require__(9);

var MEMESummary = function (_React$Component) {
  _inherits(MEMESummary, _React$Component);

  function MEMESummary() {
    _classCallCheck(this, MEMESummary);

    return _possibleConstructorReturn(this, (MEMESummary.__proto__ || Object.getPrototypeOf(MEMESummary)).apply(this, arguments));
  }

  _createClass(MEMESummary, [{
    key: "render",
    value: function render() {
      var user_message,
          was_evidence = true;
      if (was_evidence) {
        user_message = React.createElement(
          "p",
          { className: "list-group-item-text label_and_input" },
          "MEME ",
          React.createElement(
            "strong",
            { className: "hyphy-highlight" },
            "found evidence"
          ),
          " of positive selection in your phylogeny."
        );
      } else {
        user_message = React.createElement(
          "p",
          { className: "list-group-item-text label_and_input" },
          "MEME ",
          React.createElement(
            "strong",
            null,
            "found no evidence"
          ),
          " of positive selection in your phylogeny."
        );
      }

      return React.createElement(
        "div",
        { className: "row", id: "summary-tab" },
        React.createElement(
          "div",
          { className: "col-md-12" },
          React.createElement(
            "h3",
            { className: "list-group-item-heading" },
            React.createElement(
              "span",
              { className: "summary-method-name" },
              "Mixed Effects Model of Evolution"
            ),
            React.createElement("br", null),
            React.createElement(
              "span",
              { className: "results-summary" },
              "results summary"
            )
          )
        ),
        React.createElement(
          "div",
          { className: "col-md-12" },
          React.createElement(_input_info.InputInfo, { input_data: this.props.input_data })
        ),
        React.createElement(
          "div",
          { className: "col-md-12" },
          React.createElement(
            "div",
            { className: "main-result" },
            user_message,
            React.createElement("hr", null),
            React.createElement(
              "p",
              null,
              React.createElement(
                "small",
                null,
                "See",
                " ",
                React.createElement(
                  "a",
                  { href: "http://www.hyphy.org/methods/selection-methods/#meme" },
                  "here"
                ),
                " ",
                "for more information about the MEME method.",
                React.createElement("br", null),
                "Please cite",
                " ",
                React.createElement(
                  "a",
                  {
                    href: "http://www.ncbi.nlm.nih.gov/pubmed/22807683",
                    id: "summary-pmid",
                    target: "_blank"
                  },
                  "PMID 22807683"
                ),
                " ",
                "if you use this result in a publication, presentation, or other scientific work."
              )
            )
          )
        )
      );
    }
  }]);

  return MEMESummary;
}(React.Component);

var MEMETable = function (_React$Component2) {
  _inherits(MEMETable, _React$Component2);

  function MEMETable(props) {
    _classCallCheck(this, MEMETable);

    var _this2 = _possibleConstructorReturn(this, (MEMETable.__proto__ || Object.getPrototypeOf(MEMETable)).call(this, props));

    _this2.handleChange = _this2.handleChange.bind(_this2);
    _this2.handleMouseUp = _this2.handleMouseUp.bind(_this2);
    _this2.state = {
      bodyData: null,
      value: 10,
      filter: 0.1
    };
    return _this2;
  }

  _createClass(MEMETable, [{
    key: "componentWillReceiveProps",
    value: function componentWillReceiveProps(nextProps) {
      var formatter = d3.format(".2f"),
          new_rows = nextProps.rows.map(function (row) {
        return row.map(function (entry) {
          return formatter(entry);
        });
      });
      this.setState({
        bodyData: new_rows
      });
    }
  }, {
    key: "handleChange",
    value: function handleChange(event) {
      this.setState({ value: event.target.value });
    }
  }, {
    key: "handleMouseUp",
    value: function handleMouseUp(event) {
      this.setState({ filter: event.target.value / 100 });
    }
  }, {
    key: "render",
    value: function render() {
      var _this3 = this;

      if (this.props.header) {
        var headerData = this.props.header.map(function (pair) {
          return { value: pair[0], abbr: pair[1] };
        }),
            bodyData = this.state.bodyData.filter(function (row) {
          return row[6] < _this3.state.filter;
        });
      }
      var self = this;
      return React.createElement(
        "div",
        { className: "row" },
        React.createElement(
          "div",
          { className: "col-md-12", id: "table-tab" },
          React.createElement(
            "h4",
            { className: "dm-table-header" },
            "MEME data",
            React.createElement("span", {
              className: "glyphicon glyphicon-info-sign",
              style: { verticalAlign: "middle", float: "right" },
              "aria-hidden": "true",
              "data-toggle": "popover",
              "data-trigger": "hover",
              title: "Actions",
              "data-html": "true",
              "data-content": "<ul><li>Hover over a column header for a description of its content.</li></ul>",
              "data-placement": "bottom"
            })
          ),
          React.createElement(
            "div",
            { style: { width: "500px" } },
            React.createElement(
              "span",
              {
                style: {
                  width: "35%",
                  display: "inline-block",
                  verticalAlign: "middle"
                }
              },
              "p-value threshold: ",
              self.state.value / 100
            ),
            React.createElement("input", {
              type: "range",
              id: "myRange",
              value: self.state.value,
              style: {
                width: "65%",
                display: "inline-block",
                verticalAlign: "middle"
              },
              onChange: this.handleChange,
              onMouseUp: this.handleMouseUp
            })
          ),
          React.createElement(_tables.DatamonkeyTable, {
            headerData: headerData,
            bodyData: bodyData,
            paginate: 20,
            classes: "table table-condensed table-striped",
            export_csv: true
          })
        )
      );
    }
  }]);

  return MEMETable;
}(React.Component);

var MEME = function (_React$Component3) {
  _inherits(MEME, _React$Component3);

  function MEME(props) {
    _classCallCheck(this, MEME);

    var _this4 = _possibleConstructorReturn(this, (MEME.__proto__ || Object.getPrototypeOf(MEME)).call(this, props));

    _this4.updateAxisSelection = _this4.updateAxisSelection.bind(_this4);
    _this4.state = {
      input_data: null,
      data: null,
      fits: null,
      header: null,
      rows: null,
      xaxis: "Site",
      yaxis: "&alpha;"
    };
    return _this4;
  }

  _createClass(MEME, [{
    key: "updateAxisSelection",
    value: function updateAxisSelection(e) {
      var state_to_update = {},
          dimension = e.target.dataset.dimension,
          axis = e.target.dataset.axis;

      state_to_update[axis] = dimension;
      this.setState(state_to_update);
    }
  }, {
    key: "loadFromServer",
    value: function loadFromServer() {
      var self = this;
      d3.json(this.props.url, function (data) {
        self.setState({
          input_data: data["input_data"],
          data: data,
          fits: data["fits"],
          header: data["MLE"]["headers"],
          rows: data["MLE"]["content"]["0"]
        });
      });
    }
  }, {
    key: "componentWillMount",
    value: function componentWillMount() {
      this.loadFromServer();
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps, prevState) {
      $("body").scrollspy({
        target: ".bs-docs-sidebar",
        offset: 50
      });
    }
  }, {
    key: "render",
    value: function render() {
      var self = this,
          site_graph,
          scrollspy_info = [{ label: "summary", href: "summary-tab" }, { label: "table", href: "table-tab" }, { label: "fits", href: "fit-tab" }, { label: "plot", href: "plot-tab" }];

      if (this.state.data) {
        site_graph = React.createElement(_graphs.DatamonkeySiteGraph, {
          columns: _.pluck(self.state.header, 0),
          rows: self.state.rows
        });
      }
      return React.createElement(
        "div",
        null,
        React.createElement(_navbar.NavBar, null),
        React.createElement(
          "div",
          { className: "container" },
          React.createElement(
            "div",
            { className: "row" },
            React.createElement(_scrollspy.ScrollSpy, { info: scrollspy_info }),
            React.createElement(
              "div",
              { className: "col-sm-10", id: "results" },
              React.createElement(MEMESummary, { input_data: self.state.input_data }),
              React.createElement(MEMETable, { header: self.state.header, rows: self.state.rows }),
              React.createElement(
                "div",
                { className: "row" },
                React.createElement(
                  "div",
                  { className: "col-md-12", id: "fit-tab" },
                  React.createElement(_tables.DatamonkeyModelTable, { fits: self.state.fits }),
                  React.createElement(
                    "p",
                    { className: "description" },
                    "This table reports a statistical summary of the models fit to the data. Here, ",
                    React.createElement(
                      "strong",
                      null,
                      "MG94"
                    ),
                    " refers to the MG94xREV baseline model that infers a single \u03C9 rate category per branch."
                  )
                )
              ),
              React.createElement(
                "div",
                { id: "plot-tab", className: "row hyphy-row" },
                React.createElement(
                  "div",
                  { className: "col-md-12" },
                  React.createElement(
                    "h4",
                    { className: "dm-table-header" },
                    "Plot Summary"
                  ),
                  site_graph
                )
              )
            )
          )
        )
      );
    }
  }]);

  return MEME;
}(React.Component);

function render_meme(url, element) {
  ReactDOM.render(React.createElement(MEME, { url: url }), document.getElementById(element));
}

module.exports = render_meme;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)))

/***/ }),
/* 446 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function($) {

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _navbar = __webpack_require__(21);

var _scrollspy = __webpack_require__(22);

var _input_info = __webpack_require__(39);

var _error_message = __webpack_require__(447);

var _header = __webpack_require__(448);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = __webpack_require__(5),
    ReactDOM = __webpack_require__(17),
    d3 = __webpack_require__(6);

var TemplateResults = function (_React$Component) {
  _inherits(TemplateResults, _React$Component);

  function TemplateResults() {
    _classCallCheck(this, TemplateResults);

    return _possibleConstructorReturn(this, (TemplateResults.__proto__ || Object.getPrototypeOf(TemplateResults)).apply(this, arguments));
  }

  _createClass(TemplateResults, [{
    key: "render",
    value: function render() {
      if (!this.props.data) return React.createElement("div", null);
      return React.createElement(
        "div",
        { className: "row", id: "summary-tab" },
        React.createElement(
          "div",
          { className: "col-md-12" },
          React.createElement(
            "h3",
            { className: "list-group-item-heading" },
            React.createElement(
              "span",
              { className: "summary-method-name" },
              "HyPhy Vision Template"
            ),
            React.createElement("br", null),
            React.createElement(
              "span",
              { className: "results-summary" },
              "results summary"
            )
          )
        ),
        React.createElement(
          "div",
          { className: "col-md-12" },
          React.createElement(_input_info.InputInfo, { input_data: this.props.data })
        ),
        React.createElement(
          "div",
          { className: "col-md-12" },
          React.createElement(
            "div",
            { className: "main-result" },
            React.createElement(
              "p",
              null,
              "This will serve as a template for Hyphy-Vision/Datamonkey results visualizations, as well as notes on useful design patterns and best practices to allow rapid prototyping of new analyses."
            ),
            React.createElement("hr", null),
            React.createElement(
              "p",
              null,
              React.createElement(
                "small",
                null,
                "See",
                " ",
                React.createElement(
                  "a",
                  { href: "http://hyphy.org/methods/selection-methods/#absrel" },
                  "here"
                ),
                " ",
                "for more information about this method.",
                React.createElement("br", null),
                "Please cite",
                " ",
                React.createElement(
                  "a",
                  {
                    href: "http://www.ncbi.nlm.nih.gov/pubmed/25697341",
                    id: "summary-pmid",
                    target: "_blank"
                  },
                  "PMID 123456789"
                ),
                " ",
                "if you use this result in a publication, presentation, or other scientific work."
              )
            )
          )
        )
      );
    }
  }]);

  return TemplateResults;
}(React.Component);

var ReactConventions = function (_React$Component2) {
  _inherits(ReactConventions, _React$Component2);

  function ReactConventions() {
    _classCallCheck(this, ReactConventions);

    return _possibleConstructorReturn(this, (ReactConventions.__proto__ || Object.getPrototypeOf(ReactConventions)).apply(this, arguments));
  }

  _createClass(ReactConventions, [{
    key: "render",
    value: function render() {
      var popover = "<ul>\n      <li>\n        This is an example of a popover, which will describe the contents of the section that\n        correspond to this header.\n      </li>\n    </ul>";

      return React.createElement(
        "div",
        { className: "row", id: "react-tab" },
        React.createElement(
          "div",
          { className: "col-md-12" },
          React.createElement(_header.Header, { title: "React Conventions", popover: popover }),
          React.createElement(
            "p",
            { className: "description" },
            "Components initially render with no data present, which must be accounted for. An API call is made in the componentDidMount method of the Results component. All data will be stored in the state of this component, and relevant pieces will be passed down to child components as props. The state can be changed upon loading a file."
          )
        )
      );
    }
  }]);

  return ReactConventions;
}(React.Component);

var Template = function (_React$Component3) {
  _inherits(Template, _React$Component3);

  function Template(props) {
    _classCallCheck(this, Template);

    var _this3 = _possibleConstructorReturn(this, (Template.__proto__ || Object.getPrototypeOf(Template)).call(this, props));

    _this3.state = { data: null };
    _this3.onFileChange = _this3.onFileChange.bind(_this3);
    return _this3;
  }

  _createClass(Template, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var self = this;
      d3.json(this.props.url, function (data) {
        self.setState({
          data: data
        });
      });
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps, prevState) {
      $("body").scrollspy({
        target: ".bs-docs-sidebar",
        offset: 50
      });
      $('[data-toggle="popover"]').popover();
    }
  }, {
    key: "onFileChange",
    value: function onFileChange(e) {
      var self = this,
          files = e.target.files; // FileList object

      if (files.length == 1) {
        var f = files[0],
            reader = new FileReader();

        reader.onload = function (theFile) {
          return function (e) {
            var data = JSON.parse(this.result);
            self.setState({ data: data });
          };
        }(f);
        reader.readAsText(f);
      }
      e.preventDefault();
    }
  }, {
    key: "render",
    value: function render() {
      var self = this,
          scrollspy_info = [{ label: "summary", href: "summary-tab" }, { label: "react", href: "react-tab" }];
      return React.createElement(
        "div",
        null,
        React.createElement(_navbar.NavBar, { onFileChange: this.onFileChange }),
        React.createElement(
          "div",
          { className: "container" },
          React.createElement(
            "div",
            { className: "row" },
            React.createElement(_scrollspy.ScrollSpy, { info: scrollspy_info }),
            React.createElement(
              "div",
              { className: "col-sm-10", id: "results" },
              React.createElement(_error_message.ErrorMessage, null),
              React.createElement(TemplateResults, { data: self.state.data ? self.state.data.input_data : null }),
              React.createElement(ReactConventions, null)
            )
          )
        )
      );
    }
  }]);

  return Template;
}(React.Component);

function render_template(url, element) {
  ReactDOM.render(React.createElement(Template, { url: url }), document.getElementById(element));
}

module.exports = render_template;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)))

/***/ }),
/* 447 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = __webpack_require__(5);

var ErrorMessage = function (_React$Component) {
  _inherits(ErrorMessage, _React$Component);

  function ErrorMessage() {
    _classCallCheck(this, ErrorMessage);

    return _possibleConstructorReturn(this, (ErrorMessage.__proto__ || Object.getPrototypeOf(ErrorMessage)).apply(this, arguments));
  }

  _createClass(ErrorMessage, [{
    key: "render",
    value: function render() {
      return React.createElement(
        "div",
        {
          id: "datamonkey-absrel-error",
          className: "alert alert-danger alert-dismissible",
          role: "alert",
          style: { display: "none" }
        },
        React.createElement(
          "button",
          {
            type: "button",
            className: "close",
            id: "datamonkey-absrel-error-hide"
          },
          React.createElement(
            "span",
            { "aria-hidden": "true" },
            "\xD7"
          ),
          React.createElement(
            "span",
            { className: "sr-only" },
            "Close"
          )
        ),
        React.createElement(
          "strong",
          null,
          "Error!"
        ),
        " ",
        React.createElement("span", { id: "datamonkey-absrel-error-text" })
      );
    }
  }]);

  return ErrorMessage;
}(React.Component);

module.exports.ErrorMessage = ErrorMessage;

/***/ }),
/* 448 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = __webpack_require__(5);

var Header = function (_React$Component) {
  _inherits(Header, _React$Component);

  function Header() {
    _classCallCheck(this, Header);

    return _possibleConstructorReturn(this, (Header.__proto__ || Object.getPrototypeOf(Header)).apply(this, arguments));
  }

  _createClass(Header, [{
    key: "render",
    value: function render() {
      return React.createElement(
        "h4",
        { className: "dm-table-header" },
        this.props.title,
        React.createElement("span", {
          className: "glyphicon glyphicon-info-sign",
          style: { verticalAlign: "middle", float: "right" },
          "aria-hidden": "true",
          "data-toggle": "popover",
          "data-trigger": "hover",
          title: "Actions",
          "data-html": "true",
          "data-content": this.props.popover,
          "data-placement": "bottom"
        })
      );
    }
  }]);

  return Header;
}(React.Component);

module.exports.Header = Header;

/***/ })
],[161]);
//# sourceMappingURL=hyphyvision.js.map