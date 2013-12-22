(function()
{
  var uuid = require('node-uuid')

  /**
   * Create a Connection.
   *
   * @param {object} instance - If instance from existing data
   * @constructor
   */
  var Connection = function(instance)
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
   * @namespace Connection.prototype
   * @property {string} type - Limited possible type of connection:
   *                           Related|Not|Neg|Uni|Subset|Alias|Update
   * @property {string} from - In a directive relation, the begin datum's ID
   * @property {string} to   - In a directive relation, the end's ID
   */
  Conneciton.prototype =
  { type: ''
  , from: ''
  , to: ''
  }
  module.exports = Connection
})()
