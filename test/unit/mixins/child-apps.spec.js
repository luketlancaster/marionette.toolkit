import _ from 'underscore';
import { View } from 'backbone.marionette';
import App from '../../../src/app';

describe('ChildAppMixin', function() {
  beforeEach(function() {
    this.MyApp = App.extend({
      fooOption: 'bar'
    });

    this.myApp = new this.MyApp();

    this.childApps = {
      cA1: App,
      cA2: App,
      cA3: App
    };
  });

  describe('when instantiating', function() {
    describe('without declared child apps', function() {
      describe('childApps object', function() {
        it('should not be created', function() {
          expect(this.myApp.childApps).to.be.undefined;
        });
      });

      describe('_childApps object', function() {
        it('should be created but empty', function() {
          expect(this.myApp.childApps).to.not.be.null;
          expect(_.keys(this.myApp._childApps)).to.have.length(0);
        });
      });

      describe('_initChildApps', function() {
        it('should not have error', function() {
          this.sinon.spy(this.myApp, '_initChildApps');
          this.myApp._initChildApps();

          expect(this.myApp._initChildApps.called);
          expect(_.bind(this.myApp._initChildApps, this.myApp)).to.not.throw(Error);
        });
      });

      describe('addChildApp function', function() {
        it('should raise an error message', function() {
          const errMessage = 'App build failed.  Incorrect configuration.';

          // Bind function because `this` needs to be the other describe block
          expect(_.bind(this.myApp.addChildApp, this.myApp)).to.throw(errMessage);
        });
      });
    });

    describe('with declared child apps', function() {
      describe('constructor', function() {
        beforeEach(function() {
          const childApps = {
            cA1: App,
            cA2: App,
            cA3: App
          };

          this.myApp = new App({ childApps: childApps });
        });

        it('should create childApps and _childApps attributes with childApps inside', function() {
          expect(_.keys(this.myApp.childApps)).to.have.length(3);
          expect(_.keys(this.myApp._childApps)).to.have.length(3);
        });
      });

      describe('_initChildApps', function() {
        it('should accept a hash', function() {
          const childApps = {
            cA1: App,
            cA2: App,
            cA3: App
          };
          const MyApp = App.extend();

          this.sinon.spy(MyApp.prototype, '_initChildApps');
          this.myApp = new MyApp({ childApps: childApps });

          expect(this.myApp._initChildApps.called);
          expect(_.keys(this.myApp._childApps)).to.have.length(3);
        });

        describe('when passing childApps as a function', function() {
          beforeEach(function() {
            const childApps = function() {
              return {
                cA1: App,
                cA2: App
              };
            };

            this.MyApp2 = App.extend({
              childApps: childApps
            });
          });

          it('should use the results of the childApps function', function() {
            this.myApp = new this.MyApp2();

            expect(_.keys(this.myApp._childApps)).to.have.length(2);
          });

          it('should pass options to childApps', function() {
            const opts = { fooOption: 'bar' };

            this.sinon.stub(this.MyApp2.prototype, 'childApps');
            this.myApp = new this.MyApp2(opts);

            expect(this.MyApp2.prototype.childApps)
              .to.have.been.calledOnce
              .and.calledWith(opts);
          });
        });
      });
    });

    describe('when passing options using childAppOptions on parent app', function() {
      beforeEach(function() {
        this.MyApp = App;

        this.myApp = new this.MyApp({
          childAppOptions: {
            myChildOption: 'bar',
            bazOption: false
          }
        });

        this.childApps = {
          cA1: App,
          cA2: {
            AppClass: App,
            bazOption: true,
            fooOption: true
          }
        };

        this.myApp.addChildApps(this.childApps);
      });

      it('should attach options to each child', function() {
        expect(this.myApp.getChildApp('cA1').getOption('myChildOption')).to.equal('bar');
        expect(this.myApp.getChildApp('cA2').getOption('myChildOption')).to.equal('bar');
      });

      it('should not override options passed in with childApp definition', function() {
        expect(this.myApp.getChildApp('cA2').getOption('bazOption')).to.equal(true);
      });
    });
  });

  describe('when adding a child app', function() {
    describe('using addChildApp with an object literal', function() {
      beforeEach(function() {
        this.myApp.addChildApp('newChildApp', {
          AppClass: App,
          bazOption: true
        });
      });

      it('should contain the options from the initial MyApp definition', function() {
        expect(this.myApp.getOption('fooOption')).to.equal('bar');
      });

      it('should contain the options on the added childApp', function() {
        expect(this.myApp.getChildApp('newChildApp').getOption('bazOption')).to.equal(true);
      });
    });

    describe('using addChildApps', function() {
      beforeEach(function() {
        this.sinon.spy(this.myApp, 'addChildApps');
        this.myApp.addChildApps(this.childApps);
      });

      it('should be called', function() {
        expect(this.myApp.addChildApps.called).to.be.true;
      });

      it('should have arguments', function() {
        expect(this.myApp.addChildApps.calledWith(this.childApps)).to.be.true;
      });
    });
  });

  describe('_ensureAppIsUnique', function() {
    beforeEach(function() {
      this.thirdChildAppName = 'cA3';
      this.fourthChildAppName = 'cA4';
      this.errMessage = 'A child App with name "cA3" has already been added.';
      this.myApp = new App();
      this.myApp.addChildApps(this.childApps);
    });

    it('should throw error if a duplicate child exists', function() {
      expect(_.bind(function() {
        this.myApp._ensureAppIsUnique(this.thirdChildAppName);
      }, this)).to.throw(this.errMessage);
    });

    it('should not throw an error if new child app is not a duplicate', function() {
      expect(_.bind(function() {
        this.myApp._ensureAppIsUnique(this.fourthChildAppName);
      }, this)).to.not.throw(Error);
    });
  });

  describe('addChildApp', function() {
    beforeEach(function() {
      this.sinon.spy(this.myApp, 'addChildApp');

      this.myApp.addChildApps(this.childApps);
    });

    it('should be called three times', function() {
      expect(this.myApp.addChildApp.callCount === 3).to.be.true;
    });

    it('should assign the childApp name to the passed in appName', function() {
      expect(this.myApp.addChildApp('cA4', App)).to.have.property('_name', 'cA4');
    });

    describe('when the child startAfterInitialize', function() {
      it('should remove the child if destroyed', function() {
        this.myApp.addChildApp('foo', App.extend({ startAfterInitialized: true }));
        this.myApp.getChildApp('foo').destroy();

        expect(this.myApp.getChildApp('foo')).to.be.undefined;
      });
    });
  });

  describe('getName', function() {
    beforeEach(function() {
      this.sinon.spy(this.myApp, 'addChildApp');

      this.myApp.addChildApps(this.childApps);
    });

    it('should return the name of the childApp', function() {
      expect(this.myApp.getChildApp('cA1').getName()).to.equal('cA1');
    });

    it('should return undefined for an app that is not a child app', function() {
      expect(this.myApp.getName()).to.be.undefined;
    });

    it('should return undefined if a childApp has been removed from parent', function() {
      const childApp = this.myApp.getChildApp('cA3');
      this.myApp.removeChildApp('cA3');

      expect(childApp.getName()).to.be.undefined;
    });
  });

  describe('buildApp', function() {
    describe('when passing an object', function() {
      it('should return and instance of the class', function() {
        const foo = this.myApp.buildApp(App);

        expect(foo).to.be.instanceOf(App);
      });
    });
  });

  describe('getChildApps', function() {
    before(function() {
      this.myApp = new App({ childApps: this.childApps });
    });

    it('should return are registered childApps', function() {
      const childAppKeys = _.keys(this.myApp.getChildApps());
      expect(childAppKeys).to.have.length(3);
      expect(childAppKeys).to.eql(_.keys(this.childApps));
    });
  });

  describe('getChildApp', function() {
    beforeEach(function() {
      this.myApp = new App({ childApps: this.childApps });
    });

    describe('with existing childApp', function() {
      it('should return childApp object', function() {
        const existingChildApp = this.myApp._childApps.cA1;

        expect(this.myApp.getChildApp('cA1')).to.eql(existingChildApp);
      });
    });

    describe('with nonexisting childApp', function() {
      it('should not return a childApp object', function() {
        expect(this.myApp.getChildApp('cA4')).to.not.exist;

        this.myApp.addChildApp('cA4', App);

        expect(this.myApp.getChildApp('cA4')).to.exist;
      });
    });
  });

  describe('removeChildApps', function() {
    beforeEach(function() {
      this.myApp = new App({ childApps: this.childApps });
    });

    it('should remove all childApps', function() {
      expect(this.myApp._childApps).to.not.be.empty;

      this.myApp.removeChildApps();

      expect(this.myApp._childApps).to.be.empty;
    });
  });

  describe('removeChildApp', function() {
    beforeEach(function() {
      this.myApp = new App({ childApps: this.childApps });

      this.spy = sinon.spy(this.myApp, 'removeChildApps');
    });

    describe('when childApp is not present', function() {
      it('should return undefined', function() {
        expect(this.myApp.removeChildApp('cA4')).to.eql(undefined);
      });
    });

    describe('when childApp is present', function() {
      it('should remove childApp and return it', function() {
        this.myApp.addChildApp('cA4', App);

        expect(this.myApp.removeChildApp('cA4')).to.not.eql(undefined);
      });
    });
  });

  describe('startChildApp', function() {
    before(function() {
      const childApps = {
        cA1: App,
        cA2: App.extend({
          onStart(options) {
            this.mergeOptions(options, ['foo']);
          }
        }),
        cA3: App,
        cA4: {
          AppClass: App,
          regionName: 'region'
        },
        cA5: {
          AppClass: App,
          getOptions: ['foo', 'bar']
        }
      };

      this.myApp = new App({ childApps });
    });

    it('should start specified childApp', function() {
      this.myChildApp = this.myApp.startChildApp('cA1');

      expect(this.myChildApp.isRunning()).to.be.true;
    });

    it('should start childApp with options', function() {
      this.myChildApp = this.myApp.startChildApp('cA2', { foo: 'bar' });

      expect(this.myChildApp.getOption('foo')).to.eq('bar');
    });

    it('should return childApp instance', function() {
      const spy = sinon.spy(this.myApp, 'startChildApp');

      this.myChildApp = this.myApp.startChildApp('cA1');

      expect(spy.returned(this.myChildApp)).to.be.true;
    });

    describe('when regionName is defined', function() {
      it('should set the region from the app view on the child app', function() {
        const view = new View({
          template: _.template('<div id="region"></div>'),
          regions: { region: '#region' }
        });

        this.myApp.setView(view);

        this.myChildApp = this.myApp.startChildApp('cA4');

        expect(this.myChildApp.getRegion()).to.equal(this.myApp.getRegion('region'));
      });
    });

    describe('when getOptions is defined', function() {
      it('should set the options from the app on the child app', function() {
        this.myApp.foo = 'foo';
        this.myApp.bar = 'bar';

        this.myChildApp = this.myApp.getChildApp('cA5');

        const spy = sinon.spy(this.myChildApp, 'start');

        this.myApp.startChildApp('cA5', { bar: 'bar2', baz: 'baz' });

        expect(spy)
          .to.be.calledOnce
          .and.calledWith({ foo: 'foo', bar: 'bar2', baz: 'baz', region: undefined });
      });
    });
  });

  describe('stopChildApp', function() {
    before(function() {
      const childApps = {
        cA1: App,
        cA2: App,
        cA3: App
      };

      this.myApp = new App({ childApps: childApps });
      this.myChildApp = this.myApp.startChildApp('cA1');
    });

    it('should stop specified childApp', function() {
      this.myApp.stopChildApp('cA1');

      expect(this.myChildApp.isRunning()).to.be.false;
    });

    it('should stop childApp with options', function() {
      const spy = sinon.spy(this.myChildApp, 'stop');

      this.myApp.stopChildApp('cA1', { foo: 'bar' });

      expect(spy.calledWith({ foo: 'bar' })).to.be.true;
    });


    it('should return parentApp instance', function() {
      const spy = sinon.spy(this.myApp, 'stopChildApp');

      this.myApp.stopChildApp('cA1');

      expect(spy.returned(this.myChildApp)).to.be.true;
    });
  });
});
