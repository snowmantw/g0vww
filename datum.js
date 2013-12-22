(function()
{
  var uuid = require('node-uuid'),
      url  = require('url'),
      http = require('http'),
      q    = require('q')
  /**
   * Create a Datum.
   *
   * @param {object} instance - If instance from existing data
   * @constructor
   */
  var Datum = function()
  {
    if (!instance)
    {
      this.id = uuid.v4()
    }
    else
    {
      for (var i in Connection.prototype)
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

  Datum.prototype.read = function()
  {
    this.atime = Date.now()

    if ('' !== this.proxy)
      return this._readProxy()
    else
      return this.content
  }

  Datum.prototype.write = function(content)
  {
    if ('' !== this.proxy)
      this._writeProxy(content)
    else
      this.content = content

    this.ctime =
    this.mtime =
    Date.now()
  }

  /**
   * Would read JSON data from remote datum via GET request.
   *
   * @return {Promise} - With the result
   */
  Datum._readProxy = function()
  {
    if (!this._urlProxy)
      this._urlProxy = url.parse(this.proxy)

    var deferred = q.defer(),
        request  = '80' === this._urlProxy.port ?
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
  Datum._writeProxy = function(content)
  {
    if (!this._urlProxy)
      this._urlProxy = url.parse(this.proxy)

    var deferred = q.defer(),
        encData  = JSON.stringify(content),
        request  = '80' === this._urlProxy.port ?
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
