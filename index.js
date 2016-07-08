'use strict';

module.exports = function() {
  
  var _configured = false;
  var _flushInterval;
  var _maxRecords;
  var _flush;
  
  var _log = _defaultLogger();

  // Will flush using this setTimeout
  var _timeout;
  // Contains everything that hasn't been flushed yet
  var _items = [];
  
  var self = {
    init: init,
    push: push,
    flush: flush
  };
  
  return self;
  
  /////
  
  function init(opts) {
    _configured = false;

    _flush = opts.flush;
    _flushInterval = opts.flushInterval || 60000;
    _maxRecords = opts.maxRecords || Infinity;
    _log = opts.log || _defaultLogger();

    if (!_flush) {
      throw new Error('You must provide a `flush` funtion to init(opts)');
    }

    _configured = true;

    _timeout = setTimeout(flush, _flushInterval);

    return self;
  }
  
  function flush() {
    
    // If we flushed because we reached our max items, then make sure we don't
    //  try to automatically flush again until the flushInterval has passed
    clearTimeout(_timeout);
    _timeout = setTimeout(flush, _flushInterval);

    if (_items.length === 0) {
      return;
    }

    if (!_configured) {
      _log.warn('X51 is trying to flush records, but it has not been initialized yet');
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

    if (res && res.catch) {
      // Was probably a promise -- try catching and handling any errors
      res.catch(function(err) {
        _log.error(err, 'Error sending items');
        // In case the error is transient, make sure we don't lose any logs
        _items = _items.concat(curBatch);
      });
    }

    // TODO: What if flush() is a callback function?
  }
  
  function push(item) {
    _items.push(item);

    if (_items.length >= _maxRecords) {
      flush();
    }
  }
  
  function _defaultLogger() {
    return {
      warn: console.error.bind(console, '<WARN>'),
      error: console.error.bind(console, '<ERROR>')
    };
  }

};