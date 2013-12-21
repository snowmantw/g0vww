(function()
{
  var express = require('express')
     ,logfmt  = require('logfmt')
     ,app     = express()
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
})()

