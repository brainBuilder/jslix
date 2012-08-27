VersionTest = new TestCase("VersionTest");


VersionTest.prototype.testInitVersion = function(){
    jslix.dispatcher.handlers.length = 0;
    var version;

    assertNoException(function(){
                        version = new jslix.version(jslix.dispatcher);
                        });

    assertNoException(function(){
                        version.init('Deadushka Moroz', '1.0');
                        });

    assertEquals(version.getName(), 'Deadushka Moroz');
    assertEquals(version.getVersion(), "1.0");
};

VersionTest.prototype.testGet = function(){
    jslix.dispatcher.handlers.length = 0;
    var version = new jslix.version(jslix.dispatcher);
    version.init('Deadushka Moroz', '2.0');

    var jid = new jslix.JID("posoh@urta");
    var requestId;

    var dummyFunction = { send: function(packet)
				    {
                        var parsedStanza = jslix.parse(packet.doc, jslix.version.stanzas.response);
                        requestId = parsedStanza.parent.id;
				    }
			    }

	window.con = dummyFunction;

    assertNoException(function(){
                            version.get(jid);
                        });

    assertTrue(requestId in jslix.dispatcher.deferreds);
};

VersionTest.prototype.testEqualityNames = function(){
    jslix.dispatcher.handlers.length = 0;
    var version1 = new jslix.version(jslix.dispatcher);
    var version2 = new jslix.version(jslix.dispatcher);

    version1.setName('v1');
    version2.setName('v2');

    assertEquals(version1.getName(), 'v1');
    assertEquals(version2.getName(), 'v2');
};
