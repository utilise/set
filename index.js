var last = require('utilise.last')
  , str = require('utilise.str')
  , is = require('utilise.is')

module.exports = exports = function set(diff) {
  return function(o) {
    if (!o || !is.obj(o)) return o
    var key = str(diff.key)
    act.raw[diff.type](o, key, diff.value)
    return set.commit(o, { key: key, value: diff.value, type: diff.type })
  }
}

exports.commit = function commit(o, diff) {
  var log = o.log

  if (log) 
    log.push({ 
      diff: diff
    , value: act.imm[diff.type](o, last(log).value, diff.key, diff.value) 
    })

  if (o.emit) 
    o.emit('log', diff)

  return o
}

var act = {
  raw: {
    update: function(o, k, v) { return o[k] = v }
  , remove: function(o, k, v) { return is.arr(o) ? o.splice(k, 1)    : delete o[k] }
  , add   : function(o, k, v) { return is.arr(o) ? o.splice(k, 0, v) : o[k] = v }
  }
, imm: {
    update: function(d, o, k, v) { return o.setIn(k.split('.'), v) }
  , remove: function(d, o, k, v) { return is.arr(d) ? o.splice(k, 1)    : o.remove(k) }
  , add   : function(d, o, k, v) { return is.arr(d) ? o.splice(k, 0, v) : o.set(k, v) }
  }
}