/**
 * Manipulate the graph database with our supporting API behaviors.
 * Most of these methods would return promise, because the nature of the
 * Neo4J proxy module.
 */

(function()
{
  var  q      = require('q')
      ,neo4j  = require('neo4j')

  /**
   * Set up the database instance.
   *
   * @param {string} url - (Optional) URL from NEO4J_URL or somewhere else.
   *                       would connect to 127.0.0.1:7474 if it's omitted.
   * @return {Promise}   - With the database instance.
   * @this {Database}
   */
  var Database = function(url)
  {
    this.db = url ?
              new neo4j.GraphDatabase(process.env.NEO4J_URL) :
              new neo4j.GraphDatabase('http://localhost:7474')

    this.stages = this._setupPrimaryNodes()
      .then(function() {return this.db})
  }

  /**
   * @namespace Database.prototype
   * @property {GraphDatabase} db - The instance of the database.
   * @property {object} primaryNodes - Name and the ID of primary nodes.
   */
  Database.prototype =
  {
    db: null,
    stages: null,
    primaryNodes:
    {
      compact: '__compact__'
    }
  }

  /**
   * Delete all postponed deletion nodes.
   * This would clear all related nodes and there's no way to undo that.
   *
   * @return {Promise} - With the query result: empty.
   * @this {Database}
   */
  Database.prototype.compact = function()
  {
    var query = q.nbind(this.db.query, this.db)
    var qstr = [ 'MATCH ({id: "%ID_COMPACT"})<-[:SUBSET]-(n)'
               , 'DELETE n'
               ].join('\n').replace('%ID_COMPACT', primaryNodes.compact)
    var pm = query(qstr)
    this.stages = this.stages.then(pm)
    return pm
  }

  Database.prototype.read = function()
  {

  }

  /**
   * Insert nodes and paths. It's directive.
   * Please note because detect duplicate and update nodes is expensive,
   * so here would create new nodes even the old ones exist.
   * And the reader should distinguish them with timestamps.
   * (Reader should delete old nodes by comparing all existing nodes)
   *
   * @param {Object} data - `[{JSON: [{Relation: {JSON: label}}], 'label': ''}]`
   * @return {Promise} - With the empty result.
   * @this {Database}
   */
  Database.prototype.insert = function(data)
  {
    var query = q.nbind(this.db.query, this.db)
    var qchain = null

    // Can't find a good way to create unique nodes in batch mode.
    // 1. Create the node if it doesn't exist
    // 2. Match the rel node
    data.forEach(function(e)
    {
      // Give default label if it doesn't exist.
      var labelFrom = e.label ? e.label : 'Datum'
         ,enc_from  = Object.keys(e)
                    .filter(function(k) {return 'label' !== k})[0]
         ,qry_from  = enc_from            // Cypher disallow objects with '"'
                    .replace(/":/g,':')
                    .replace(/{"/g,'{')
                    .replace(/,"/g,',')
         ,from = JSON.parse(enc_from)
         ,rels = e[enc_from]
         ,qstr = 'MERGE (n:%LABEL %DATUM)'
               .replace('%LABEL', labelFrom)
               .replace('%DATUM', qry_from)
         ,pm = query(qstr)

      if (!qchain)
        qchain = pm

      rels.forEach(function(rel)
      {
        var relation  = Object.keys(rel)[0]
           ,target    = rel[relation]
           ,enc_to    = Object.keys(target)[0]
           ,qry_to    = enc_to            // Cypher disallow objects with '"'
                      .replace(/":/g,':')
                      .replace(/{"/g,'{')
                      .replace(/,"/g,',')
           ,to        = JSON.parse(enc_to)
           ,labelTo   = to[enc_to] ? to[enc_to] : 'Datum'
           ,qstrRel   = [ 'MATCH (n:%LABEL_FROM {id: %ID_FROM})'
                        , 'CREATE UNIQUE (n)-[:%RELATION]->(m:%LABEL_TO %TO)'
                        , 'RETURN ""']
                      .join('\n')
                      .replace('%LABEL_FROM', labelFrom)
                      .replace('%ID_FROM', from.id)
                      .replace('%RELATION', relation)
                      .replace('%LABEL_TO', labelTo)
                      .replace('%TO',qry_to)
           ,pmRel     = query(qstrRel)

        qchain = qchain.then(pmRel)
      })
    })
    this.stages = this.stages.then(qchain)
    return qchain
  }

  /**
   * Set up primary nodes like '__compact__' .
   *
   * @return {Promise} - With the query result: empty.
   * @this {Database}
   */
  Database.prototype._setupPrimaryNodes = function()
  {
    var query = q.nbind(this.db.query, this.db)
    var qchain = null

    // TODO: I can't find a good way to execute multiple queries at once...
    Object.keys(this.primaryNodes).forEach(function(id)
    {
      var qstr = 'MERGE (n:Primary {id: "%ID"})'.replace('%ID', id)
      var pm = query(qstr)
      if (!qchain)
        qchain = pm

      // Concat Promises but never done.
      qchain.then(pm)
    })
    return qchain
  }
  module.exports = Database
})()
