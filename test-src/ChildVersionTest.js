//example of inheritance

ChildVersionTest = new TestCase('ChildVersionTest');

ChildVersionTest.prototype.testInheritance = function(){
   jslix.dispatcher.handlers.length = 0;

   var testClassExample = jslix.Class(
            jslix.version,
            function(dispatcher){
                jslix.version.call(this, dispatcher);
                this.setVersion(Math.floor((Math.random()*10)+1));
                this.setOs('JSLiX');
            }
        );

    var sample;
    assertNoException(function(){
                        sample = new testClassExample(jslix.dispatcher);
                      });

    assertEquals(sample.getOs(), 'JSLiX');

    sample.init("hell", "1.0");

    var query = jslix.version.stanzas.request.create();
    var iq = jslix.stanzas.iq.create({type:'get', jid:new jslix.JID("123@456.com"), link:query});
    var buildIq = jslix.build(iq);

    var dummyFunction = { send:
                            function(packet){
                             var parsedResponse = jslix.parse(packet.doc, jslix.version.stanzas.response);
                             assertEquals(parsedResponse.version, "1.0");
                             assertEquals(parsedResponse.name, "hell");
                             assertEquals(parsedResponse.os, "JSLiX");
                          }
                        };

    window.con = dummyFunction;
    assertNoException(function(){
                        jslix.dispatcher.dispatch(buildIq);
                     });

};
