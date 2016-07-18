'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');
var Promise = require('bluebird');

describe(__filename, function() {

  var mod;

  beforeEach(function() {
    delete require.cache[require.resolve('./index')];
    mod = require('./index');
  });


  it('Should flush according to the flush interval', function(done) {
    var flush = sinon.stub();

    var x51 = mod({
      flush: flush,
      flushInterval: 200
    });

    x51.push({});
    x51.push({});
    
    setTimeout(function() {
      expect(flush.callCount).to.eql(1);
      var items = flush.getCall(0).args[0];
      expect(items.length).to.eql(2);

      done();
    }, 250);

  });

  it('Should not lose records if flush throws an error', function() {
    var flush = sinon.stub();

    flush.onCall(0).throws(new Error());
    flush.onCall(1).returns(undefined);

    var x51 = mod({
      flush: flush
    });

    x51.push({});

    // This one will throw an error
    x51.flush();

    expect(flush.callCount).to.eql(1);
    var items1 = flush.getCall(0).args[0];
    expect(items1.length).to.eql(1);

    // Send another record
    x51.push({});

    // This one should succeed
    x51.flush();

    expect(flush.callCount).to.eql(2);
    var items2 = flush.getCall(1).args[0];
    expect(items2.length).to.eql(2); // Should have both records this time
  });

  it('Should not lose records if flush throws an error and is a promise', function(done) {
    var flush = sinon.stub();

    flush.onCall(0).returns(Promise.reject(new Error()));
    flush.onCall(1).returns(Promise.resolve());

    var x51 = mod({
      flush: flush
    });

    x51.push({});

    // This one will throw an error
    x51.flush();

    expect(flush.callCount).to.eql(1);
    var items1 = flush.getCall(0).args[0];
    expect(items1.length).to.eql(1);

    // Send another record
    x51.push({});

    setTimeout(function() {
      // This one should succeed
      x51.flush();

      expect(flush.callCount).to.eql(2);
      var items2 = flush.getCall(1).args[0];
      expect(items2.length).to.eql(2); // Should have both records this time

      done();
    });
  });

  it('Should not flush automatically if the number of records is below the set threshold', function() {
    var flush = sinon.stub();

    var x51 = mod({
      flush: flush,
      maxRecords: 2
    });

    x51.push({});

    expect(flush.callCount).to.eql(0);
  });

  it('Should proactively flush if the number of records passes the set threshold', function() {
    var flush = sinon.stub();

    var x51 = mod({
      flush: flush,
      maxRecords: 2
    });

    x51.push({});
    x51.push({});

    expect(flush.callCount).to.eql(1);
    var items = flush.getCall(0).args[0];
    expect(items.length).to.eql(2);
  });

});
