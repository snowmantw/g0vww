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

    return this._setupPrimaryNodes()
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
    return query(qstr)
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
      var qstr = 'MATCH (n:Primary {id: "%ID"})'.replace('%ID', id)
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
