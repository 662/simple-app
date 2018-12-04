(function () {

    // ������
    var Biu = {
        Engine: function () { },    // ����
        Canvas: function () { },    // ����
        ModelOptions: { },          // ����ģ�͹������
        Model: function () { },     // ����ģ��
        BG: function () { },        // ����
        Player: function () { },    // ���
        Enemy: function () { }      // �л�
    };

    // �̳�֧��
    function extend(subClass, superClass) {
        var F = function () { };
        F.prototype = superClass.prototype;
        subClass.prototype = new F();
        subClass.prototype.constructor = subClass;
        subClass.superclass = superClass.prototype; //�Ӷ��˸�����ָ���౾���Ա���ø��ຯ��
        if (superClass.prototype.constructor == Object.prototype.constructor) {
            superClass.prototype.constructor = superClass;
        }
    }

    // ��չ���飬�Ƴ�ָ��Ԫ��
    Array.prototype.remove = function (item) {
        var index = this.indexOf(item);
        if (index > -1) {
            this.splice(index, 1);
        }
        return this;
    }

    // ������
    Biu.Engine = function (canvas) {

        this.EnemyDense = 200;  // �л��ܶ�
        this.FireDense = 200;   // �ӵ��ܶ�
        this.Canvas = canvas;   // ����
        this.BG = null;         // ����
        this.Enemy = [];        // �л��б�
        this.Player = null;     // ���
        this.FireTimer = null;  // �ӵ�������
        this.Source = 0;        // ��ҵ÷�
        this.SourceBox = null;  // �÷���ʾ��
    }
    Biu.Engine.prototype = {
        start: function () {
            // ���ر���
            this.BG = new Biu.BG({
                width: 960,
                height: 703 * 3,
                left: 0,
                bottom: 0,
                image: 'scene.png',
                zIndex: 0,
                speed: 20
            });
            this.BG.setLeft(0 - (this.BG.getWidth() - this.Canvas.getWidth()) / 2);
            this.Canvas.add(this.BG);
            this.runBG();   // ��������

            // �÷ֿ�
            this.SourceBox = new Biu.Model({
                tag:'div',
                width: 50,
                height: 25,
                right: 5,
                top: 0,
                zIndex: 9
            });
            this.SourceBox.DOM.style.color = 'red';
            this.SourceBox.DOM.style.fontWeight = 'bold';
            this.SourceBox.DOM.style.textAlign = 'right';
            this.SourceBox.DOM.style.fontSize = 20;
            this.SourceBox.setValue(0);
            this.Canvas.add(this.SourceBox);

            // ������ҷɻ�
            this.Player = new Biu.Player({
                width: 15,
                height: 24,
                left: 0,
                bottom: 20,
                image: 'player.png',
                zIndex: 1,
                speed: 5
            });
            this.Player.setLeft((this.Canvas.getWidth()-this.Player.getWidth()) / 2);
            this.Canvas.add(this.Player);

            // ��ҿ���
            this.fire();

            // ���صл�
            this.createEnemy();

            this.keyEvent(); // ���ذ����¼�
        },
        runBG: function () {
            var _this = this;
            setInterval(function () {
                var _bottom = _this.BG.getBottom();
                if (Math.abs(_bottom) == _this.BG.getHeight() / 3 * 2) {
                    _this.BG.setBottom(0);
                } else {
                    _this.BG.setBottom(_bottom - 1);
                }
            }, _this.BG.getSpeed());
        },
        createEnemy: function () {
            var _this = this;
            setInterval(function () {
                if (_this.Enemy.length < 20) {
                    var enemy = new Biu.Enemy({
                        width: 37,
                        height: 19,
                        left: 0,
                        bottom: 0,
                        image: 'monster.png',
                        zIndex: 2,
                        speed: 5
                    });
                    enemy.setBottom(_this.Canvas.getHeight());
                    enemy.setLeft(Math.random() * (_this.Canvas.getWidth() - enemy.getWidth()));

                    _this.Canvas.add(enemy);
                    _this.Enemy.push(enemy);

                    var timer = setInterval(function () {
                        var bottom = enemy.getBottom();
                        enemy.setBottom(bottom - 1);
                        if (bottom - enemy.getHeight() < 0) {   // �л���ʧ
                            clearInterval(timer);
                            _this.Canvas.remove(enemy);
                            _this.Enemy.remove(enemy);
                            delete enemy;
                            delete timer;
                        }
                        if (!enemy.getDestroy() && _this.checkDestroy(enemy, _this.Player)) {
                            _this.gameOver();
                            clearInterval(_this.FireTimer);
                            clearInterval(timer);
                            _this.Canvas.remove(_this.Player);
                            _this.Player = null;
                            _this.Canvas.remove(enemy);
                            _this.Enemy.remove(enemy);
                            delete enemy;
                            delete timer;
                        }

                    }, enemy.getSpeed());
                }
            }, this.EnemyDense);
        },
        fire: function () {
            var _this = this;
            _this.FireTimer = setInterval(function () {
                var fire = new Biu.Model({
                    width: 5,
                    height: 8,
                    left: 0,
                    bottom: 0,
                    image: 'bullet.png',
                    zIndex: 2,
                    speed: 5
                });
                fire.setBottom(_this.Player.getBottom() + _this.Player.getHeight());                    // ��λ�ӵ�
                fire.setLeft(_this.Player.getLeft() + (_this.Player.getWidth() - fire.getWidth()) / 2); // ��λ�ӵ�

                _this.Canvas.add(fire);
                var timer = setInterval(function () {
                    var bottom = fire.getBottom();
                    fire.setBottom(bottom + 2);
                    if (bottom > _this.Canvas.getHeight()) {    // �ӵ���ʧ 
                        clearInterval(timer);
                        _this.Canvas.remove(fire);
                        delete fire;
                        delete timer;
                    }

                    if (_this.Player) {
                        // ���ٵл�
                        for (var i = 0; i < _this.Enemy.length; i++) {
                            if (_this.checkDestroy(fire, _this.Enemy[i])) {
                                _this.Source += _this.Enemy[i].getSource();
                                _this.SourceBox.setValue(_this.Source);
                                _this.Enemy[i].setDestroy(true);    // �л��ݻ�
                                clearInterval(timer);
                                _this.Canvas.remove(fire);
                                _this.Canvas.remove(_this.Enemy[i]);    // �Ƴ��л�ģ��
                                _this.Enemy.splice(i, 1);           // �Ƴ��л�����
                                delete fire;
                                delete timer;
                            }
                        }
                    }
                    

                }, fire.getSpeed());
            }, this.FireDense);

        },
        keyEvent: function () {
            var _this = this,
                _player = _this.Player,
                _canvas = _this.Canvas,
                _BG = _this.BG,
                bgMoveSize = Math.ceil( (_BG.getWidth() - _canvas.getWidth()) / (_canvas.getWidth() - _player.getWidth())),
                timeout = _player.getSpeed(),
                leftTimer, rightTimer, upTimer, downTimer;
            
            document.onkeydown = function (e) {
                if (_this.Player) {
                    switch (e.keyCode) {
                        case 37:    // ��
                            if (leftTimer == null) {
                                leftTimer = setInterval(function () {
                                    var playerLeft = _player.getLeft(), bgLeft = _BG.getLeft();
                                    if (playerLeft > 0) _player.setLeft(playerLeft - 1);
                                    // _BG.setLeft((bgLeft + bgMoveSize) > 0 ? 0 : bgLeft + bgMoveSize);    // ��ͼģʽ ����ƽ�ƿ����ڵ�ͼ���ƶ�
                                }, timeout);
                            }
                            break;
                        case 38:    // ��
                            if (upTimer == null) {
                                upTimer = setInterval(function () {
                                    var _bottom = _player.getBottom();
                                    if (_bottom < _this.Canvas.getHeight() - _this.Player.getHeight()) _this.Player.setBottom(_bottom + 1);
                                }, timeout);
                            }
                            break;
                        case 39:    // ��
                            if (rightTimer == null) {
                                rightTimer = setInterval(function () {
                                    var playerLeft = _player.getLeft(), bgLeft = _BG.getLeft(), bgLeftMin = _canvas.getWidth() - _BG.getWidth();
                                    if (playerLeft < _this.Canvas.getWidth() - _this.Player.getWidth()) _this.Player.setLeft(playerLeft + 1);
                                    // _BG.setLeft((bgLeft - bgMoveSize) < bgLeftMin ? bgLeftMin : bgLeft - bgMoveSize);   // // ��ͼģʽ ����ƽ�ƿ����ڵ�ͼ���ƶ�
                                }, timeout);
                            }
                            break;
                        case 40:    // ��
                            if (downTimer == null) {
                                downTimer = setInterval(function () {
                                    var _bottom = _player.getBottom();
                                    if (_bottom > 0) _this.Player.setBottom(_bottom - 1);
                                }, timeout);
                            }
                            break;
                    }
                }
            };
            document.onkeyup = function (e) {
                switch (e.keyCode) {
                    case 37:    // ��
                        clearInterval(leftTimer);
                        leftTimer = null;
                        break;
                    case 38:    // ��
                        clearInterval(upTimer);
                        upTimer = null;
                        break;
                    case 39:    // ��
                        clearInterval(rightTimer);
                        rightTimer = null;
                        break;
                    case 40:    // ��
                        clearInterval(downTimer);
                        downTimer = null;
                        break;
                }
            }
        },
        checkDestroy: function (model1,model2) {
            var destroy = true;

            if (model1 == null || model2 == null) {
                destroy = false;
            } else {
                // model1��model2���
                if (model1.getLeft() + model1.getWidth() < model2.getLeft()) destroy = false;
                // model1��model2�ұ�
                if (model1.getLeft() > model2.getLeft() + model2.getWidth()) destroy = false;
                // model1��model2�ϱ�
                if (model1.getBottom() > model2.getBottom() + model2.getHeight()) destroy = false;
                // model1��model2�±�
                if (model1.getBottom() + model1.getHeight() < model2.getBottom()) destroy = false;
            }
            return destroy;
        },
        gameOver: function () {
            var black = new Biu.Model({
                tag: 'div',
                width: this.Canvas.getWidth(),
                height: this.Canvas.getHeight(),
                right: 0,
                top: 0,
                zIndex: 10
            });
            black.DOM.style.backgroundColor = 'black';
            black.DOM.style.color = 'white';
            black.DOM.style.opacity = 0.5;
            black.DOM.style.textAlign = 'center';
            var tip = '<div style="margin-top:180px;"><span style="font-size:20px;">' + this.Source + '</span><br /><span>Game Over!</span></div>';
            black.DOM.innerHTML = tip;

            this.Canvas.add(black);
        }
    };

    // ������
    Biu.Canvas = function (id) {
        this.Container = id;
        this.DOM = null;
        this.init();
    }
    Biu.Canvas.prototype = {
        init: function () {
            this.getDOM();
        },
        getDOM: function () {
            this.DOM = document.createElement('div');
            document.getElementById(this.Container).appendChild(this.DOM);
            this.DOM.style.overflow = 'hidden';
            this.DOM.style.position = 'relative';

            this.setWidth(360);
            this.setHeight(480);
        },
        add: function (model) {
            this.Player = model;
            this.DOM.appendChild(this.Player.DOM);
        },
        remove: function (model) {
            this.DOM.removeChild(model.DOM);
        },
        setWidth: function (value) {
            this.DOM.style.width = value
        },
        getWidth: function () {
            return parseInt(this.DOM.style.width);
        },
        setHeight: function (value) {
            this.DOM.style.height = value
        },
        getHeight: function () {
            return parseInt(this.DOM.style.height);
        },
    }

    // ����ģ�����ò���
    Biu.ModelOptions = {
        tag:'img',  // ģ�ͳ��ر�ǩ
        source:1,   // ��ֵ �л�ר��
        width: 10,
        height: 10,
        left: null,
        right: null,
        top: null,
        bottom: null,
        image: '',
        zIndex: 0,
        speed:1     // 0-1000 ֵԽ��ɻ��ɵ�Խ��
    };

    // ����ģ����
    Biu.Model = function (options) {
        this.Options = options;    // �ϲ����ò���
        for (var p in Biu.ModelOptions) {
            if (this.Options[p] === undefined) this.Options[p] = Biu.ModelOptions[p];
        }
        this.DOM = null;
        this.init();
    };
    Biu.Model.prototype = {
        init: function () {
            this.getDOM();
        },
        getDOM: function () {
            this.DOM = document.createElement(this.Options.tag);
            this.DOM.style.position = 'absolute';

            this.setWidth(this.Options.width);
            this.setHeight(this.Options.height);
            this.setIndex(this.Options.zIndex);
            this.setImage(this.Options.image);

            if (this.Options.top != null) this.setTop(this.Options.top);
            if (this.Options.bottom != null) this.setBottom(this.Options.bottom);
            if (this.Options.left != null) this.setLeft(this.Options.left);
            if (this.Options.right != null) this.setRight(this.Options.right);
        },
        setWidth: function (value) {
            this.DOM.style.width = value;
        },
        getWidth: function () {
            return parseInt(this.DOM.style.width);
        },
        setHeight: function (value) {
            this.DOM.style.height = value;
        },
        getHeight: function () {
            return parseInt(this.DOM.style.height);
        },
        setTop: function (value) {
            this.DOM.style.top = value;
        },
        getTop: function () {
            return parseInt(this.DOM.style.top);
        },
        setBottom: function (value) {
            this.DOM.style.bottom = value;
        },
        getBottom: function () {
            return parseInt(this.DOM.style.bottom);
        },
        setLeft: function (value) {
            this.DOM.style.left = value;
        },
        getLeft: function () {
            return parseInt(this.DOM.style.left);
        },
        setRight: function (value) {
            this.DOM.style.right = value;
        },
        getRight: function () {
            return parseInt(this.DOM.style.right);
        },
        setIndex: function (value) {
            this.DOM.style.zIndex = value;
        },
        getIndex: function () {
            return parseInt(this.DOM.style.zIndex);
        },
        setImage: function (value) {
            this.DOM.src = value;
        },
        getImage: function () {
            return this.DOM.src;
        },
        setSpeed: function (value) {
            this.Options.speed = value;
        },
        getSpeed: function () {
            return this.Options.speed;
        },
        setValue: function (value) {
            this.DOM.innerHTML = value;
        },
        getValue: function () {
            return this.DOM.innerHTML;
        }
    };

    // ����ģ����
    Biu.BG = function (options) {
        Biu.Model.call(this,options);
    }
    // �̳� ����ģ����
    extend(Biu.BG, Biu.Model);   
    // ��д����getDOM
    Biu.BG.prototype.getDOM = function () {        
        this.DOM = document.createElement('div');
        this.DOM.style.position = 'absolute';

        this.setWidth(this.Options.width);
        this.setHeight(this.Options.height);
        this.setIndex(this.Options.zIndex);

        this.setBottom(this.Options.bottom);
        this.setLeft(this.Options.left);

        var _img = document.createElement('img');
        _img.src = this.Options.image;

        this.DOM.appendChild(_img);
        this.DOM.appendChild(_img.cloneNode());
        this.DOM.appendChild(_img.cloneNode());
    }


    // ���ģ���� �̳� ����ģ����
    Biu.Player = function (options) {
        Biu.Model.call(this, options);
        this.isDestroy = false;
    };
    // �̳� ����ģ����
    extend(Biu.Player, Biu.Model);


    // �л�ģ���� �̳� ����ģ����
    Biu.Enemy = function (options) {
        Biu.Model.call(this, options);

        this.isDestroy = false;
        this.Source = this.Options.source;
    }
    extend(Biu.Enemy, Biu.Model);
    Biu.Enemy.prototype.setDestroy = function (value) {
        this.isDestroy = value;
    }
    Biu.Enemy.prototype.getDestroy = function (value) {
        return this.isDestroy;
    }
    Biu.Enemy.prototype.getSource = function () {
        return this.Source;
    }

    window.Biu = Biu;
})();