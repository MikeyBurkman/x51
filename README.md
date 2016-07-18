# x51
Utility for aggregating and flushing items to be processed

## When do I use this?
Use this when you want to collect items, and flush them out to another function
when either you have enough items, or when enough time has passed.

## How do I use it?
```js
// require('x51') returns a function to initialize a new x51 instance
var x51 = require('x51')({
  flushInterval: 60000, // Milliseconds between flushing, defaults to 60,000
  maxRecords: Infinity, // Max items to collect before flushing, defaults to Infinity
  flush: function(items) {
    // Receives a non-empty array of items to be flushed.
    // If this function throws an error, or returns a promise that is rejected,
    //  then these items are automatically kept, and will be flushed again next time.
    console.log('Items: ', items);
  }
});

x51.push('item1');
x51.push({
  foo: 'Items can be anything'
});

// If you feel the need, you can also manually flush at any time...
x51.flush();
```