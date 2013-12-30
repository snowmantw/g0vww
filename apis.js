(function()
{
  var q       = require('q')
     ,express = require('express')
     ,logfmt  = require('logfmt')
     ,db      = require(__dirname + '/db.js')
     ,app     = express()
     ,states  = {}
     ,actions = {}

  actions.register = function(form)
  {
    return 'ok'
  }

  actions.main = function()
  {
    app.use(logfmt.requestLogger())
    app.use(express.static(__dirname + '/static'))
    app.use(express.urlencoded())
    app.get('/', function(req, res)
    {
      res.send('WW building')
    })
    app.post('/submit-register', function(req, res)
    {
      var form =
      { isPolling: req.body['is-polling']
      , pollingURL: req.body['polling-url']
      , pollingInterval: req.body['polling-interval']
      , proxyURL: req.body['proxy-url']
      }
      // TODO: Validation here.
      var apikey = actions.register(form)
      res.send(apikey)
    })
    var port = process.env.PORT || 5000
    app.listen(port, function()
    {
      console.log('Listening on: ' + port)
    })
  }

  actions.main()
})()

