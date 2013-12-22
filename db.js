(function()
{
  var  q      = require('q')
      ,neo4j  = require('neo4j')
      ,db     = {}

  db.setup = function()
  {
    states.db = process.env.NEO4J_URL ?
                new neo4j.GraphDatabase(process.env.NEO4J_URL) :
                new neo4j.GraphDatabase('http://localhost:7474')
  }
  module.exports = db
})()
