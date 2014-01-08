g0vww
=====

Taiwan g0vww project. Implement it as I promised.

## Requirements

1. Neo4j
2. Redis
3. Node.js + NPM

## Installation

`npm install`

## Test Manually

1. Start Neo4j and Redis
2. `node ./apis.js`
3. In another console, directly test Database driver (import data):
````javascript
var db = require('./db.js');var data = [{'{"id":10,"f0oo":"b0ar"}': [{'RELATED': { '{"id":20,"bar":"aa0a"}':undefined}}, {'SUBJECT': { '{"id":902,"0bar":"0a9aa"}':undefined}}]}, {'{"id":1011,"fo0o":"10bar"}': [{'RELATED': { '{"id":2022,"ba0r":"22aaa"}':undefined}}, {'SUBJECT': { '{"id":92033,"bar":"a9102aa"}':undefined}}]}]; var d = new db(); d.insert(data).done()
````

4. It should work as expected. You can see data in `http://localhost:7474`, with the Cypher query:

    MATCH (r)<br/>
    RETURN r
    
5. Get API key and register

    http://127.0.0.1:5000/stream-in/register
    
  After submit, an API key would return from the server.

6. Test simple read (in console):

    curl http://127.0.0.1:5000/stream-out/read/JSON-encoded-object/your-relation/depth-of-relation/your-api-key
    
For example, query a `{id: 'Java'}` object with `DERIVED_FROM` relation, depth is 1 to 1:

    curl http://127.0.0.1:5000/stream-out/read/%7B%22id%22:%22Java%22%7D/DERIVED_FROM/1/your-api-key
    
Then it should return data like:

    "{data: [{id: 'C++'}]}"
    
If it query nothing, would be

    "{data: ''}"
    
Caveats: reading functions are in progress, so this test may be failed.

# License

GPLv3
