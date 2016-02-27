var emitterify = require('utilise.emitterify')
  , versioned = require('versioned').default
  , expect = require('chai').expect
  , last = require('utilise.last')
  , set = require('./')

describe('set', function() {

  it('should set value - object - add', function() {
    expect(set({ key: 'foo', value: 'bar', type: 'add' })({})).to.eql({ foo: 'bar' })
    expect(set({ key: 'bar.baz', value: 'boo', type: 'add' })({})).to.eql({ bar: { baz: 'boo' } })
  })

  it('should set value - object - update', function() {
    expect(set({ key: 'foo', value: 'baz', type: 'update' })({ foo: 'bar' })).to.eql({ foo: 'baz' })
    expect(set({ key: 'bar.baz', value: 'boo', type: 'update' })({})).to.eql({ bar: { baz: 'boo' } })
  })

  it('should set value - object - remove', function() {
    expect(set({ key: 'foo', value: 'bar', type: 'remove' })({ foo: 'bar' })).to.eql({})
    expect(set({ key: 'foo', value: 'bar', type: 'remove' })({})).to.eql({})
    expect(set({ key: 'foo.bar', value: 'bar', type: 'remove' })({ foo: { bar: 5 }})).to.eql({ foo: {} })
  })

  it('should set value - array - add', function() {
    expect(set({ key: '1', value: 'foo', type: 'add' })([1,2,3])).to.eql([1, 'foo', 2, 3])
    expect(set({ key: '1.1', value: 'foo', type: 'add' })([1,{},3])).to.eql([1, { 1: 'foo' }, 3])
    expect(set({ key: '1.1', value: 'foo', type: 'add' })([1, [1,2,3], 1])).to.eql([1, [1, 'foo', 2, 3], 1])
  })

  it('should set value - array - update', function() {
    expect(set({ key: '1', value: 'bar', type: 'update' })([1, 'foo', 2])).to.eql([1, 'bar', 2])
    expect(set({ key: '1.1', value: 'bar', type: 'update' })([1,{},3])).to.eql([1, { 1: 'bar' }, 3])
  })

  it('should set value - array - remove', function() {
    expect(set({ key: '0', value: 'foo', type: 'remove' })(['foo'])).to.eql([])
    expect(set({ key: '1.1', value: 'foo', type: 'remove' })([1, [2, 3, 4], 1])).to.eql([1, [2, 4], 1])
    expect(set({ key: '1.1.1.1', value: 'foo', type: 'remove' })([1, [2, {}, 4], 1])).to.eql([1, [2, {}, 4], 1])
  })

  it('should set - object', function(){
    var changes = []
      , o = versioned({}).on('log', function(diff){ changes.push(diff) })

    expect(o).to.eql({})
    expect(o.log.length).to.eql(1) 
    expect(last(o.log).diff).to.eql(undefined)
    expect(last(o.log).value.toJS()).to.eql({})
    expect(changes).to.eql([])

    expect(set({ key: 'focused', value: false, type: 'add' })(o)).to.eql(o)
    expect(o).to.eql({ 'focused': false })
    expect(o.log.length).to.eql(2)
    expect(last(o.log).diff).to.eql({ key: 'focused', value: false, type: 'add' })
    expect(last(o.log).value.toJS()).to.eql({ focused: false })
    expect(changes).to.eql([
      { key: 'focused', value: false, type: 'add' }
    ])

    expect(set({ key: 'focused', value: true, type: 'update' })(o)).to.eql(o)
    expect(o).to.eql({ 'focused': true })
    expect(o.log.length).to.eql(3)
    expect(last(o.log).diff).to.eql({ key: 'focused', value: true, type: 'update' })
    expect(last(o.log).value.toJS()).to.eql({ focused: true })
    expect(changes).to.eql([
      { key: 'focused', value: false, type: 'add' }
    , { key: 'focused', value: true, type: 'update' }
    ])

    expect(set({ key: 'focused', value: true, type: 'remove' })(o)).to.eql(o)
    expect(o).to.eql({})
    expect(o.log.length).to.eql(4)
    expect(last(o.log).diff).to.eql({ key: 'focused', value: true, type: 'remove' })
    expect(last(o.log).value.toJS()).to.eql({})
    expect(changes).to.eql([
      { key: 'focused', value: false, type: 'add' }
    , { key: 'focused', value: true, type: 'update' }
    , { key: 'focused', value: true, type: 'remove' }
    ])
  })

  it('should set - array', function(){
    var changes = []
      , o = versioned([]).on('log', function(diff){ changes.push(diff) })

    expect(o).to.eql([])
    expect(o.log.length).to.eql(1) 
    expect(last(o.log).diff).to.eql(undefined)
    expect(last(o.log).value.toJS()).to.eql([])
    expect(changes).to.eql([])

    expect(set({ key: 0, value: 'foo', type: 'add' })(o)).to.eql(o)
    expect(o).to.eql(['foo'])
    expect(o.log.length).to.eql(2)
    expect(last(o.log).diff).to.eql({ key: '0', value: 'foo', type: 'add' })
    expect(last(o.log).value.toJS()).to.eql(['foo'])
    expect(changes).to.eql([
      { key: '0', value: 'foo', type: 'add' }
    ])

    expect(set({ key: 0, value: 'bar', type: 'update' })(o)).to.eql(o)
    expect(o).to.eql(['bar'])
    expect(o.log.length).to.eql(3)
    expect(last(o.log).diff).to.eql({ key: '0', value: 'bar', type: 'update' })
    expect(last(o.log).value.toJS()).to.eql(['bar'])
    expect(changes).to.eql([
      { key: '0', value: 'foo', type: 'add' }
    , { key: '0', value: 'bar', type: 'update' }
    ])

    expect(set({ key: 0, value: o[0], type: 'remove' })(o)).to.eql(o)
    expect(o).to.eql([])
    expect(o.log.length).to.eql(4)
    expect(last(o.log).diff).to.eql({ key: '0', value: 'bar', type: 'remove' })
    expect(last(o.log).value.toJS()).to.eql([])
    expect(changes).to.eql([
      { key: '0', value: 'foo', type: 'add' }
    , { key: '0', value: 'bar', type: 'update' }
    , { key: '0', value: 'bar', type: 'remove' }
    ])

  })


  it('should set - object - deep', function(){
    var changes = []
      , o = versioned({}).on('log', function(diff){ changes.push(diff) })

    expect(o).to.eql({})
    expect(o.log.length).to.eql(1) 
    expect(last(o.log).diff).to.eql(undefined)
    expect(last(o.log).value.toJS()).to.eql({})
    expect(changes).to.eql([])

    expect(set({ key: '1.1', value: false, type: 'add' })(o)).to.eql(o)
    expect(o).to.eql({ 1: { 1: false } })
    expect(o.log.length).to.eql(2)
    expect(last(o.log).diff).to.eql({ key: '1.1', value: false, type: 'add' })
    expect(last(o.log).value.toJS()).to.eql(o)
    expect(changes).to.eql([
      { key: '1.1', value: false, type: 'add' }
    ])

    expect(set({ key: '1.1', value: true, type: 'update' })(o)).to.eql(o)
    expect(o).to.eql({ 1: { 1: true } })
    expect(o.log.length).to.eql(3)
    expect(last(o.log).diff).to.eql({ key: '1.1', value: true, type: 'update' })
    expect(last(o.log).value.toJS()).to.eql(o)
    expect(changes).to.eql([
      { key: '1.1', value: false, type: 'add' }
    , { key: '1.1', value: true, type: 'update' }
    ])

    expect(set({ key: '1.1', value: true, type: 'remove' })(o)).to.eql(o)
    expect(o).to.eql({ 1: {}})
    expect(o.log.length).to.eql(4)
    expect(last(o.log).diff).to.eql({ key: '1.1', value: true, type: 'remove' })
    expect(last(o.log).value.toJS()).to.eql(o)
    expect(changes).to.eql([
      { key: '1.1', value: false, type: 'add' }
    , { key: '1.1', value: true, type: 'update' }
    , { key: '1.1', value: true, type: 'remove' }
    ])
  })

  it('should set - array - deep', function(){
    var changes = []
      , o = versioned([1,[3],2]).on('log', function(diff){ changes.push(diff) })

    expect(o).to.eql([1,[3],2])
    expect(o.log.length).to.eql(1) 
    expect(last(o.log).diff).to.eql(undefined)
    expect(last(o.log).value.toJS()).to.eql(o)
    expect(changes).to.eql([])

    expect(set({ key: '1.1', value: 4, type: 'add' })(o)).to.eql(o)
    expect(o).to.eql([1,[3,4],2])
    expect(o.log.length).to.eql(2)
    expect(last(o.log).diff).to.eql({ key: '1.1', value: 4, type: 'add' })
    expect(last(o.log).value.toJS()).to.eql(o)
    expect(changes).to.eql([
      { key: '1.1', value: 4, type: 'add' }
    ])

    expect(set({ key: '1.1', value: 5, type: 'update' })(o)).to.eql(o)
    expect(o).to.eql([1,[3,5],2])
    expect(o.log.length).to.eql(3)
    expect(last(o.log).diff).to.eql({ key: '1.1', value: 5, type: 'update' })
    expect(last(o.log).value.toJS()).to.eql(o)
    expect(changes).to.eql([
      { key: '1.1', value: 4, type: 'add' }
    , { key: '1.1', value: 5, type: 'update' }
    ])

    expect(set({ key: '1.1', value: 5, type: 'remove' })(o)).to.eql(o)
    expect(o).to.eql([1,[3],2])
    expect(o.log.length).to.eql(4)
    expect(last(o.log).diff).to.eql({ key: '1.1', value: 5, type: 'remove' })
    expect(last(o.log).value.toJS()).to.eql(o)
    expect(changes).to.eql([
      { key: '1.1', value: 4, type: 'add' }
    , { key: '1.1', value: 5, type: 'update' }
    , { key: '1.1', value: 5, type: 'remove' }
    ])

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

  it('should work on non-versioned data', function(){
    var changes = []
      , o = {}

    expect(set({ key: 'foo', value: 'bar', type: 'add' })(o)).to.eql({ foo: 'bar' })
    expect(o.log).to.not.be.ok
    expect(o.emit).to.not.be.ok

    emitterify(o).on('log', function(diff){ changes.push(diff) })

    expect(set({ key: 'bar', value: 'baz', type: 'add' })(o)).to.eql({ foo: 'bar', bar: 'baz' })
    expect(o.log).to.not.be.ok
    expect(o.emit).to.be.ok
    expect(changes).to.be.eql([{ key: 'bar', value: 'baz', type: 'add' }])
  })

  it('should update immutable deeply', function(){
    var changes = []
      , o = versioned({ a: { b: { c: 5 }}}).on('log', function(diff){ changes.push(diff) })

    expect(o).to.eql({ a: { b: { c: 5 }}})
    expect(o.log.length).to.eql(1) 
    expect(last(o.log).diff).to.eql(undefined)
    expect(last(o.log).value.toJS()).to.eql({ a: { b: { c: 5 }}})
    expect(changes).to.eql([])

    expect(set.commit(o, { key: 'a.b.c', value: 10, type: 'update' })).to.eql(o)
    expect(o.log.length).to.eql(2)
    expect(last(o.log).diff).to.eql({ key: 'a.b.c', value: 10, type: 'update' })
    expect(last(o.log).value.toJS()).to.eql({ a: { b: { c: 10 }}})
    expect(changes).to.eql([
      { key: 'a.b.c', value: 10, type: 'update' }
    ])
  })

})

