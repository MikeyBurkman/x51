'use strict';

module.exports = function(opts) {
  
  var _flush = opts.flush;
  var _flushInterval = opts.flushInterval || 60000;
  var _maxRecords = opts.maxRecords || Infinity;
  var _log = opts.log || _defaultLogger();

  if (!_flush) {
    throw new Error('You must provide a `flush` funtion to init(opts)');
  }

  // Will flush using this setTimeout
  var _timeout;
  // Contains everything that hasn't been flushed yet
  var _items = [];
  
  var self = {
    push: push,
    flush: flush
  };
  
  setFlushInterval();
  
  return self;
  
  /////
  
  function setFlushInterval() {
    clearTimeout(_timeout);
    if (_flushInterval < Infinity) {
      _timeout = setTimeout(flush, _flushInterval);
    }
  }
  
  function flush(resetFlush) {
    
    if (resetFlush) {
      setFlushInterval();
    }

    if (_items.length === 0) {
      return;
    }

    var curBatch = _items;
    _items = [];

    var res;

    try {
      res = _flush(curBatch);
    } catch (err) {
      // In case _flush is synchronous
      _log.error(err, 'Error sending items');
      // In case the error is transient, make sure we don't lose any logs
      _items = _items.concat(curBatch);
    }

    if (res && res.then && res.catch) {
      // Was probably a promise -- try catching and handling any errors
      res.catch(function(err) {
        _log.error(err, 'Error sending items');
        // In case the error is transient, make sure we don't lose any logs
        _items = _items.concat(curBatch);
      });
    }
  }
  
  function push(item) {
    _items.push(item);

    if (_items.length >= _maxRecords) {
      // If we flushed because we reached our max items, then make sure we don't
      //  try to automatically flush again until the flushInterval has passed
      flush(true);
    }
  }
  
  function _defaultLogger() {
    var noop = function() {};
    return {
      error: noop
    };
  }

};