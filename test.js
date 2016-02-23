var emitterify = require('utilise.emitterify')
  , versioned = require('versioned').default
  , expect = require('chai').expect
  , last = require('utilise.last')
  , set = require('./')

describe('set', function() {

  it('should set value - object - add', function() {
    expect(set({ key: 'foo', value: 'bar', type: 'add' })({})).to.eql({ foo: 'bar' })
  })

  it('should set value - object - update', function() {
    expect(set({ key: 'foo', value: 'baz', type: 'update' })({ foo: 'bar' })).to.eql({ foo: 'baz' })
  })

  it('should set value - object - remove', function() {
    expect(set({ key: 'foo', value: 'bar', type: 'remove' })({ foo: 'bar' })).to.eql({})
  })

  it('should set value - array - add', function() {
    expect(set({ key: '0', value: 'foo', type: 'add' })([])).to.eql(['foo'])
  })

  it('should set value - array - update', function() {
    expect(set({ key: '0', value: 'bar', type: 'update' })(['foo'])).to.eql(['bar'])
  })

  it('should set value - array - remove', function() {
    expect(set({ key: '0', value: 'foo', type: 'remove' })(['foo'])).to.eql([])
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

  it('should fail gracefully with non-objects', function(){
    expect(set({ key: 'foo', value: 'bar', type: 'add' })(true)).to.be.eql(true)
    expect(set({ key: 'foo', value: 'bar', type: 'add' })(false)).to.be.eql(false)
    expect(set({ key: 'foo', value: 'bar', type: 'add' })(5)).to.be.eql(5)
    expect(set({ key: 'foo', value: 'bar', type: 'add' })('foo')).to.be.eql('foo')
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

})

