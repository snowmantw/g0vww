/**
 * Define our node in the graph.
 * Each Datum would holds read and write methods,
 * which would return Promise.
 *
 * Note: the `then()` function of Promise require a
 * standalone function, so methods should be bound to
 * access the correct instance:
 *
 *    var Datum = require('./datum.js'),
 *        d = new Datum(),
 *        p = d.write({'hub': 3.14, 'foo': 'abc'}),
 *    
 *    p.then(d.read.bind(d))    // Need `bind`.
 *     .then(function(data){console.dir(data)}).done()
 *
 * To return Promises, rather than result while the datum
 * performs reading or writing, is because some datum may
 * only be a proxy of the read datum, which would need to
 * access remote server, and it would be asynchronous.
 */
(function()
{
  var uuid  = require('node-uuid'),
      url   = require('url'),
      http  = require('http'),
      https = require('https'),
      q     = require('q')

  /**
   * Create a Datum.
   *
   * @param {object} instance - (Optional) if instance from existing data
   * @constructor
   */
  var Datum = function(instance)
  {
    if (!instance)
    {
      this.id = uuid.v4()
    }
    else
    {
      for (var i in Datum.prototype)
      {
        this[i] = instance[i]
      }
    }
  }

  /**
   * @namespace Datum.prototype
   * @property {boolean} mutable    - If this datum is mutable after imported
   * @property {URL|EmptyURL} proxy - If this datum is a proxy (data must read
   *                                  from other service)
   * @property {object} content     - Any data can be encoded by JSON
   * @property {string} id          - UUID of this datum
   * @property {number} atime       - Access time
   * @property {number} ctime       - Change time
   * @property {number} mtime       - Modified time
   */
  Datum.prototype =
  { mutable: false
  , proxy: ''
  , content: null
  , type: ''
  , id: ''
  , atime: 0
  , ctime: 0
  , mtime: 0
  , _urlProxy: null
  }

  /**
   * Read a datum's content.
   *
   * @return {Promise} - With the content it holds.
   * @this {Datum}
   */
  Datum.prototype.read = function()
  {
    var deferred = q.defer()
    this.atime = Date.now()

    if ('' !== this.proxy)
      return this._readProxy()
    else
    {
      deferred.resolve(this.content)
      return deferred.promise
    }
  }

  /**
   * Write something as the datum's content.
   *
   * @param {object}   - The data. JSON must be able to encode it.
   * @return {Promise} - With nothing.
   * @this {Datum}
   */
  Datum.prototype.write = function(content)
  {
    var deferred = q.defer()
    if ('' !== this.proxy)
      return this._writeProxy(content)
    else
    {
      this.content = content
      deferred.resolve()
      this.ctime =
      this.mtime = Date.now()
      return deferred.promise
    }
  }

  /**
   * Would read JSON data from remote datum via GET request.
   *
   * @return {Promise} - With the result
   */
  Datum.prototype._readProxy = function()
  {
    if (!this._urlProxy)
      this._urlProxy = url.parse(this.proxy)

    var deferred = q.defer(),
        request  = 'http:' === this._urlProxy.protocol ?
                   http.request :
                   https.request,
        options  =
        { host: this._urlProxy.hostname
        , port: this._urlProxy.port || '80'
        , path: this._urlProxy.path
        , method: 'GET'
        , headers: { 'Accept': 'application/json'}
        },
        req = request(options, function(res)
        {
          var output = ''
          res.setEncoding('utf8')
          res.on('data', function(chunk)
          {
            output += chunk
          })
          res.on('end', function()
          {
            var data = JSON.parse(output)
            deferred.resolve(output)
          })
        })
        req.on('error', function(err)
        {
          deferred.reject(new Error(err))
        })
        req.end()
      return deferred.promise
  }

  /**
   * Would PUT JSON data from remote datum.
   *
   * @param {object} content - Data would be encoded & put
   * @return {Promise}
   */
  Datum.prototype._writeProxy = function(content)
  {
    if (!this._urlProxy)
      this._urlProxy = url.parse(this.proxy)

    var self     = this,
        deferred = q.defer(),
        encData  = JSON.stringify(content),
        request  = 'http:' === this._urlProxy.protocol ?
                   http.request :
                   https.request,
        options  =
        { host: this._urlProxy.hostname
        , port: this._urlProxy.port || '80'
        , path: this._urlProxy.path
        , method: 'PUT'
        , headers: { 'Content-Type': 'application/json'}
        },
        req = request(options, function(res)
        {
          var output = ''
          res.setEncoding('utf8')
          res.on('data', function(chunk)
          {
            output += chunk
          })
          res.on('end', function()
          {
            self.ctime =
            self.mtime = Date.now()

            // In fact, write doesn't require response.
            // This is only for debugging.
            var data = JSON.parse(output)
            deferred.resolve(output)
          })
        })
        req.on('error', function(err)
        {
          deferred.reject(new Error(err))
        })
        req.write(encData)
        req.end()
      return deferred.promise
  }
  module.exports = Datum
})()
