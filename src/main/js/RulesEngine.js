/**

Standalone implementation of a rules engine.

Author: Nick Grealy
Date: 04/07/2014

Example Usage:

var then1 = function(){console.log('exec scenario1'); return 1; },
    then2 = function(){console.log('exec scenario2'); return 2; },
    then3 = function(){console.log('exec scenario3'); return 3; };

var rules = [
  ['outcome',       'documentToProduce'],
  ['Review Held',   'ROA Short Form',       then1],
  ['Review Held',   'ROA Short Formx',      then2],
  ['Review Held',   ,                       then3]
]

var engine = RulesEngine.build(rules)
var result = engine.evaluate({outcome: 'Review Held', documentToProduce: 'ROA Short Formxx'})  // exec scenario1
// result = 1

 */
var RulesEngine = {

    WILDCARD: function(){return true},
    WC: this.WILDCARD,
    debug: true,

    build: function(twoDimRulesArray, defaultFunction){
        if (console && this.debug){ console.log('=== Building Rules Engine ===') }
        var rules = this.buildRules(twoDimRulesArray, defaultFunction)
        var thiz = this
        return {
            evaluate: function(inputs){
                for (var i = 0; i < rules.length; i++){
                    if (thiz.equals(rules[i].condition, inputs)){    // if we have a match
						var response = rules[i].then(rules[i].params)
						if (console){ console.log('Found match: ' + response) }
                        return response;
                    } else {
						if (console){ console.log('Could not find match for inputs: ' + thiz.objectToString(inputs)) }
					}
                }
            }
        };
    },

    buildRules: function(twoDimensionalArray, defaultFunction){
        var thiz = this
        var rules = []
        var tmp = twoDimensionalArray[0] // first row is the list of fields
        var fieldNames = thiz.findAll(tmp, function(a){ return a.indexOf && a.indexOf('p_') === -1 })
        var inputNames = thiz.collect(tmp, function(a){ if (a.indexOf && a.indexOf('p_') === 0){ return a.substring(2) } }) // this performance could be improved
		if (fieldNames.length == 0){
			throw 'Could not find any field names! headerRow=' + tmp.join(',')
		}
        for (var i = 1; i < twoDimensionalArray.length; i++){
            var tmp = this.buildRule(fieldNames, inputNames, twoDimensionalArray[i], defaultFunction)
            if (console){ console.log(tmp.toString()) }
            if (typeof tmp !== 'undefined' && tmp !== null){
                rules[rules.length] = tmp
            }
        }
        return rules
    },

    buildRule: function(fieldNames, inputNames, conditions, defaultCondition){
        var thiz = this
        defaultCondition = typeof defaultCondition === 'undefined' ? function(){} : defaultCondition
        if (typeof conditions !== 'undefined'){
            var fnlen = fieldNames.length, inlen = inputNames.length
            var conditionObject = {}
            for (var i = 0; i < fnlen; i++){
                conditionObject[fieldNames[i]] = conditions[i]
            }
            var inputObject = {}
            for (var i = 0; i < inlen; i++){
                inputObject[inputNames[i]] = conditions[i + fnlen]
            }
            var thenCondition = defaultCondition
            if ((fnlen + inlen) < conditions.length){
                thenCondition = conditions[conditions.length-1]
            }
            return {condition: conditionObject, params: inputObject, then: thenCondition, toString: function(){
                return "Rule={ conditions: " + thiz.objectToString(conditionObject) + ", params: " + thiz.objectToString(inputObject) + ", then: "+ typeof thenCondition+" }"
            }}
        }
    },
    
    objectToString: function(map){
        var keys = this.getKeys(map)
        var string = '('
        if (keys.length > 0){
            string += keys[0]+'='+map[keys[0]]
        }
        if (keys.length > 1){
            for (var i = 1; i < keys.length; i++){
                string += ','+keys[i]+'='+map[keys[i]]
            }
        }
        string += ')'
        return string
    },
    
    getKeys: function(obj){
       var keys = []
       for(var key in obj){ keys[keys.length] = key }
       return keys
    },
    
    /* -- N.B. These below methods should be in a common library. -- */

    /* does a deep match, of 1st level fields, of an object */
    equals: function(a, b){
        for (var field in a){
            if (a.hasOwnProperty(field)) {
				var matches = (typeof expected === 'function' && expected(b[field])) || a[field] == b[field]
				if (!matches){
                    if (console && true){ console.log('Rejecting match on field=' + field + ' - ' + a[field] + ' != ' + b[field]) }
                    return false;
                }
            }
        }
        return true;
    },
    
    /* finds all matches - see groovy! */ 
    findAll: function(list, closure){
        var tmp=[], clos = closure;
        for (var i=0;i<list.length;i++){
            if (clos(list[i])){
                tmp[tmp.length] = list[i];
            }
        }
        return tmp;
    },
    
    /* collects all non-undefined objects */ 
    collect: function(list, closure){
        var tmp=[], clos = closure;
        for (var i=0;i<list.length;i++){
            var val = clos(list[i], i)
            if (typeof val !== 'undefined'){ tmp[tmp.length] = val };
        }
        return tmp;
    }
};
var _RE = RulesEngine
