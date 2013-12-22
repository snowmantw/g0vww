(function()
{
  var express = require('express')
     ,logfmt  = require('logfmt')
     ,db      = require(__dirname + '/db.js')
     ,app     = express()
     ,states  = {}
     ,actions = {}

  actions.main = function()
  {
    app.use(logfmt.requestLogger())
    app.get('/', function(req, res)
    {
      res.send('WW building')
    })
    var port = process.env.PORT || 5000
    app.listen(port, function()
    {
      console.log('Listening on: ' + port)
    })
  }

  actions.main()
})()

