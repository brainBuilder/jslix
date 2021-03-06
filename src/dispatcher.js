(function(window) {
    var jslix = window.jslix;
    jslix.dispatcher = function(myjid) {
        this.myjid = myjid;
        this.handlers = [];
    }
    var dispatcher = jslix.dispatcher;
    dispatcher.prototype.addHandler = function(handler, host) {
        this.handlers[this.handlers.length] = [handler, host];
        this.deferreds = {};
    }
    dispatcher.prototype.dispatch = function(el) {
        var tops = [jslix.stanzas.iq, jslix.stanzas.presence,
                    jslix.stanzas.message];
        for (var i=0; i<tops.length; i++) {
            try {
                var top = jslix.parse(el, tops[i]);
                break;
            } catch (e) {}
        }
        var results = [];
        var bad_request = false;
        var i = 0;
        var self = this;
        var can_error = ['result', 'error'].indexOf(top.type) == -1;

        // FIXME: check sender
        if (!can_error && top.id in this.deferreds) {
            var d = this.deferreds[top.id][0];
            var r_el = this.deferreds[top.id][1];
            var result_class = r_el.__definition__.result_class;
            if (result_class && top.type == 'result') {
                try {
                    var result = jslix.parse(el, result_class);
                    d.resolve(result);
                } catch (e) {
                    d.reject(e);
                }
            } else if (!result_class && top.type == 'result') {
                d.resolve(r_el);
            } else if (top.type == 'error') {
                try {
                    exception = jslix.parse(el, r_el.error_class);
                } catch(e) {
                    exception = e;
                }
                d.reject(exception);
            }
            delete this.deferreds[top.id];
        }

        var continue_loop = function() {
            i++;
            if (i<self.handlers.length) {
                loop();
            } else {
                if (results.length)
                    self.send(results);
                else if (bad_request && can_error) {
                    self.send(top.makeError('bad-request'));
                } else if (can_error && top.__definition__.element_name == 'iq') {
                    self.send(top.makeError('feature-not-implemented'));
                }
            }
        }

        var loop_fail = function(failure) {
            if (typeof failure == 'object' && 
                'definition' in failure) self.send(failure)
            else if (failure instanceof Error) {
                self.send(top.makeError('internal-server-error',
                                        failure.toString()));
                            // XXX: remove failure information when not debug
            } else if (typeof failure == 'object' &&
                       'condition' in failure) {
                self.send(top.makeError(failure));
            } else if (typeof failure == 'string') {
                self.send(top.makeError(failure));
            } else {
                self.send(top.makeError('internal-server-error'));
            }
            continue_loop();
        }

        var loop_done = function(result) {
            results[results.length] = result;
            continue_loop();
        }

        var loop = function() { // I hate JS for that shit.
            var handler = self.handlers[i][0];
            var host = self.handlers[i][1];
            try {
                var obj = jslix.parse(el, handler);
            } catch (e) {
                if (e instanceof jslix.exceptions.WrongElement) return continue_loop();
                if (e instanceof jslix.exceptions.ElementParseError) {
                    bad_request = True;
                    return continue_loop(); // TODO: pass an exception message?
                }
                throw (e); // TODO: internal-server-error?
            }
            var func = obj[top.type+'Handler'] || obj['anyHandler'];
            if (func === undefined) {
                bad_request = true;
                return continue_loop();
            }
            try {
                var deferred = func.call(host, obj, top);
            } catch (e) {
                loop_fail(e);
            }
            if ('__definition__' in deferred) {
                loop_done(deferred);
            } else {
                deferred.done(loop_done);
                deferred.fail(loop_fail);
            }
        }
        loop();
    }
    dispatcher.prototype.send = function(els) {
        if(els.length === undefined) els = [els];
        var d = null;
        for (var i=0; i<els.length; i++) {
            var el = els[i];
            var top = el.getTop();
            var packet = new window.JSJaCPacket(top.__definition__.element_name);
            if (top.__definition__.element_name == 'iq' && 
                ['get', 'set'].indexOf(top.type) != -1) {
                d = new $.Deferred();
                this.deferreds[top.id] = [d, el];
                // TODO: implement timeouts
            }
            packet.doc = jslix.build(top);
            window.con.send(packet);
        }
        return d;
    }

})(window);
