var expect = require('chai').expect
  , last = require('utilise.last')
  , set = require('./')

describe('set', function() {

  it('should set value - object - add', test(
    {} 
  , { key: 'foo', value: 'bar', type: 'add' }
  , { foo: 'bar' }
  ))

  it('should set value - object - add - deep', test(
    {} 
  , { key: 'bar.baz', value: 'boo', type: 'add' }
  , { bar: { baz: 'boo' } }
  ))

  it('should set value - object - update', test(
    { foo: 'bar' } 
  , { key: 'foo', value: 'baz', type: 'update' }
  , { foo: 'baz' }
  ))

  it('should set value - object - update - deep', test(
    {} 
  , { key: 'bar.baz', value: 'boo', type: 'update' }
  , { bar: { baz: 'boo' } }
  ))

  it('should set value - object - update - root', test(
    {} 
  , { key: '', value: { boo: 'boo' }, type: 'update' }
  , { boo: 'boo' }
  ))

  it('should set value - object - update - root (non-obj)', test(
    {} 
  , { key: '', value: 'boo', type: 'update' }
  , false
  ))

  it('should set value - object - remove', test(
    { foo: 'bar' } 
  , { key: 'foo', value: 'bar', type: 'remove' }
  , {}
  ))

  it('should set value - object - remove - already deleted', test(
    {} 
  , { key: 'foo', value: 'bar', type: 'remove' }
  , {}
  ))

  it('should set value - object - remove - deep', test(
    { foo: { bar: 5 } } 
  , { key: 'foo.bar', value: 'bar', type: 'remove' }
  , { foo: {} }
  ))

  it('should set value - object - remove - deep - missing path', test(
    {}
  , { key: 'foo.bar', value: 'bar', type: 'remove' }
  , {}
  ))

  it('should set value - array - push', test(
    []
  , { key: '0', value: 'foo', type: 'add' }
  , ['foo']
  ))

  it('should set value - array - add', function() {
    test(
      [1, 2, 3]
    , { key: '1', value: 'foo', type: 'add' }
    , [1, 'foo', 2, 3]
    )()

    test(
      [1, {}, 3]
    , { key: '1.1', value: 'foo', type: 'add' }
    , [1, { 1: 'foo' }, 3]
    )()

    test(
      [1, [1, 2, 3], 1]
    , { key: '1.1', value: 'foo', type: 'add' }
    , [1, [1, 'foo', 2, 3], 1]
    )()
  })

  it('should set value - array - update', function() {
    test(
      [1, 'foo', 2]
    , { key: '1', value: 'bar', type: 'update' }
    , [1, 'bar', 2]
    )()

    test(
      [1, {},  3]
    , { key: '1.1', value: 'bar', type: 'update' }
    , [1, { 1: 'bar' }, 3]
    )()
  })

  it('should set value - array - remove', function() {
    test(
      ['foo']
    , { key: '0', value: 'foo', type: 'remove' }
    , []
    )()

    test(
      [1, [2, 3, 4], 1]
    , { key: '1.1', value: 'foo', type: 'remove' }
    , [1, [2, 4], 1]
    )()

    test(
      [1, [2, {}, 4], 1]
    , { key: '1.1.1.1', value: 'foo', type: 'remove' }
    , [1, [2, {}, 4], 1]
    )()
  })

  it('should initialise and set on function', function(){
    /* istanbul ignore next */
    var fn = set()(function(){})
    expect(fn.on).to.be.a('function')
    expect(fn.log).to.be.a('array')

    set({ type: 'update', key: 'foo', value: 'bar' })(fn)
    expect(fn.foo).to.be.eql('bar')
  })

  it('should init and branch', function(){
    var result

    // init
    var a = set()({ a: 1 }, null, 10)
    expect(a).to.eql({ a: 1 })
    expect(a.on).to.be.a('function')
    expect(a.log).to.be.eql([{ type: 'update', value: { a: 1 }, time: 0 }])

    // branch from existing log
    var b = set()({ b: 1 }, [1, 2, 3], 10)
    expect(b).to.eql({ b: 1 })
    expect(b.on).to.be.a('function')
    expect(b.log).to.be.eql([1, 2, 3, { type: 'update', value: { b: 1 }, time: 3 }])

    // branch from existing log
    /* istanbul ignore next */
    b.on('change', function(){ result = true })
    var c = set()(b, [1, 2, 3, 4, 5], 10)
    expect(c).to.eql({ b: 1 }).to.not.equal(b)
    expect(c.on).to.be.a('function')
    expect(result).to.not.be.ok
    expect(c.log).to.be.eql([1, 2, 3, 4, 5, { type: 'update', value: { b: 1 }, time: 5 }])
    
    // branch from same log
    /* istanbul ignore next */
    c.on('change', function(){ result = true })
    var d = set()(c, null, 10)
    expect(d).to.eql({ b: 1 }).to.not.equal(c)
    expect(d.on).to.be.a('function')
    expect(result).to.not.be.ok
    expect(d.log).to.be.eql([1, 2, 3, 4, 5
      , { type: 'update', value: { b: 1 }, time: 5 }
      , { type: 'update', value: { b: 1 }, time: 6 }
    ])
  })

  it('should log and emit change - object', function(){
    var o = set()({}, null, 10).on('change', function(diff){ changes.push(diff) })
      , changes = [o.log[0]]

    expect(o).to.eql({})
    expect(o.log)
      .to.eql(changes)
      .to.have.lengthOf(1)
    expect(last(o.log)).to.eql({ type: 'update', value: {}, time: 0 })

    set({ key: 'focused', value: false, type: 'add' })(o)

    expect(o).to.eql({ 'focused': false })
    expect(o.log)
      .to.eql(changes)
      .to.have.lengthOf(2)
    expect(last(o.log)).to.eql({ key: 'focused', value: false, type: 'add', time: 1 })

    set({ key: 'focused', value: true, type: 'update' })(o)

    expect(o).to.eql({ 'focused': true })
    expect(o.log)
      .to.eql(changes)
      .to.have.lengthOf(3)
    expect(last(o.log)).to.eql({ key: 'focused', value: true, type: 'update', time: 2 })
    
    set({ key: 'focused', value: true, type: 'remove' })(o)

    expect(o).to.eql({})
    expect(o.log)
      .to.eql(changes)
      .to.have.lengthOf(4)
    expect(last(o.log)).to.eql({ key: 'focused', value: true, type: 'remove', time: 3 })
  })

  it('should fail gracefully with non-objects', function(){
    expect(set({ key: 'foo', value: 'bar', type: 'add' })(true)).to.be.eql(true)
    expect(set({ key: 'foo', value: 'bar', type: 'add' })(false)).to.be.eql(false)
    expect(set({ key: 'foo', value: 'bar', type: 'add' })(5)).to.be.eql(5)
    expect(set({ key: 'foo', value: 'bar', type: 'add' })('foo')).to.be.eql('foo')
    expect(set(true)({})).to.be.eql({})
    expect(set(false)({})).to.be.eql({})
    expect(set(5)({})).to.be.eql({})
    expect(set('foo')({})).to.be.eql({})
  })

  it('should create hollow log if max negative', function(){
    var result

    var a = set()({ a: 1 }, [], -1).on('change', function(d){ result = d })
    expect(a).to.eql({ a: 1 })
    expect(a.on).to.be.a('function')
    expect(a.log.max).to.be.eql(-1)
    expect(a.log).to.be.eql([null])

    expect(set({ key: 'b', value: 2, type: 'add' })(a)).to.be.eql(a)
    expect(a.log.max).to.be.eql(-1)
    expect(a.log).to.be.eql([null, null])
    expect(result).to.eql({ key: 'b', value: 2, type: 'add', time: 1 })

    expect(set()(a)).to.be.eql(a)
    expect(a.log.max).to.be.eql(-1)
    expect(a.log).to.be.eql([null, null, null])
  })

  it('should create no log if max zero', function(){
    var result

    var a = set()({ a: 1 }, [], 0)
    expect(a).to.eql({ a: 1 })
    expect(a.on).to.be.a('function')
    expect(a.log).to.be.eql([])

    expect(set({ key: 'b', value: 2, type: 'add' })(a)).to.be.eql(a)
    expect(a.log).to.be.eql([])
  })

  it('should return false if unsuccessful', function(){
    var o = set()({}, null, 10)
      , result = false
    o.on('change', function(){ result = true })

    expect(set({ type: 'dafuq', key: 'foo' })(o)).to.be.eql(false)
    expect(o).to.be.eql({})
    expect(o.log.length).to.be.eql(1)
    expect(result).to.be.eql(false)

    expect(set({ type: 'dafuq' })(o)).to.be.eql(false)
    expect(o).to.be.eql({})
    expect(o.log.length).to.be.eql(1)
    expect(result).to.be.eql(false)

    expect(set({ type: 'update', key: 'foo', value: 'bar' })(o)).to.be.eql(o)
    expect(o).to.be.eql({ foo: 'bar' })
    expect(o.log.length).to.be.eql(2)
    expect(result).to.be.eql(true)
  })
  
})

function test(initial, diff, expected) {
  return function(){
    expect(set(diff)(initial)).to.eql(expected)
  }
}