(function()
{
  var q       = require('q')
     ,redis   = require('redis').createClient()
     ,uuid    = require('node-uuid')
     ,express = require('express')
     ,logfmt  = require('logfmt')
     ,db      = require(__dirname + '/db.js')
     ,app     = express()
     ,states  = {}
     ,actions = {}
     ,streamOut = {}
     ,streamIn  = {}

  streamIn.register = function(form)
  {
    var key = uuid.v1()
    redis.set(key, JSON.stringify(form))
    return key
  }

  streamIn.push = function(apikey, data)
  {
    var defer = q.defer()
    // TODO: write these data to the db.
    // TODO: If push too much data, and make the response
    // time too long, it may timeout here.
    defer.resolve()
    return defer
  }

  actions.main = function()
  {
    redis.on('error', function(err)
    {
      throw "Redis error: " + err
    })

    app.use(logfmt.requestLogger())
    app.use(express.urlencoded())
    app.use(express.json())
    app.use(express.logger())
    app.get('/', function(req, res)
    {
      res.send('WW building')
    })
    app.get('/stream-in/register', function(req, res)
    {
      res.sendfile(__dirname + '/static/stream-in/register.html')
    })
    app.post('/stream-in/register', function(req, res)
    {
      var form =
      { isPolling: req.body['is-polling']
      , pollingURL: req.body['polling-url']
      , pollingInterval: req.body['polling-interval']
      , proxyURL: req.body['proxy-url']
      }
      // TODO: Validation here.
      var apikey = streamIn.register(form)
      res.send('{data:"' + apikey + '"}')
    })
    app.post('/stream-in/push/:apikey', function(req, res)
    {
      // Array of data.
      var data   = req.body.data
         ,apikey = req.params.apikey
      var pr = streamIn.push(apikey, data)

      q.npost(redis, 'get', [apikey])
      .then(function(info)
      {
        if (null === info)
          res.send(404)
      })
      .then(pr)
      .then(function() {res.send('{"data": ""')})
      .done()
    })
    app.all('*', function(req, res) {
      res.send(403)
    })
    var port = process.env.PORT || 5000
    app.listen(port, function()
    {
      console.log('Listening on: ' + port)
    })
  }

  actions.main()
})()

