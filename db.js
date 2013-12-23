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

    // It's our last step to setup, so we return its Promise directly.
    return this._setupPrimaryNodes()
  }

  /**
   * @namespace Database.prototype
   * @property {GraphDatabase} db - The instance of the database.
   * @property {object} primaryNodes - Name and the instance of primary nodes.
   *                                   Because of they're immutable, primary
   *                                   nodes can be stored in references.
   */
  Database.prototype =
  {
    db: null,
    primaryNodes:
    {
      __compact__: ''
    }
  }

  /**
   * Delete all postponed deletion nodes.
   * This would clear all related nodes and there's no way to undo that.
   *
   * @return {Promise} - With the database instance.
   * @this {Database}
   */
  Database.prototype.compact = function()
  {
  }

  /**
   * Set up primary nodes like '__compact__' .
   *
   * @return {Promise}   - With the database instance.
   * @this {Database}
   */
  Database.prototype._setupPrimaryNodes = function()
  {
    var query = q.nbind(this.db.query, this.db)
    var qchain = null

    // TODO: I can't find a good way to execute multiple queries at once...
    ['__compact__'].forEach(function(id)
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
