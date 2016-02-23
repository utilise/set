var last = require('utilise.last')
  , str = require('utilise.str')
  , is = require('utilise.is')

module.exports = function set(diff) {
  return function(o) {
    if (!o || !is.obj(o)) return o
    var key = str(diff.key)
    act.raw[diff.type](o, key, diff.value)
    append(o, { key: key, value: diff.value, type: diff.type })
    return o
  }
}

function append(o, diff) {
  var log = o.log

  if (log) 
    log.push({ 
      diff: diff
    , value: act.imm[diff.type](o, last(log).value, diff.key, diff.value) 
    })

  if (o.emit) 
    o.emit('log', diff)
}

var act = {
  raw: {
    update: function(o, k, v) { return o[k] = v }
  , remove: function(o, k, v) { return is.arr(o) ? o.splice(k, 1)    : delete o[k] }
  , add   : function(o, k, v) { return is.arr(o) ? o.splice(k, 0, v) : o[k] = v }
  }
, imm: {
    update: function(d, o, k, v) { return o.set(k, v) }
  , remove: function(d, o, k, v) { return is.arr(d) ? o.splice(k, 1)    : o.remove(k) }
  , add   : function(d, o, k, v) { return is.arr(d) ? o.splice(k, 0, v) : o.set(k, v) }
  }
}