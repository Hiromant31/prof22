const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: "#222",
    parent: 'game-container',
    physics: {
      default: 'arcade',
      arcade: {
        debug: false
      }
    },
    scene: {
      preload,
      create,
      update
    }
  };
  
  const game = new Phaser.Game(config);
  
  let fields = [];
  let selectedField = null;
  let pointerDown = false;
  
  function preload() {}
  
  function create() {
    const scene = this;
  
    fields = [
        createField(scene, 120, 120, 50, 'И1'),
        createField(scene, 260, 120, 50, 'И2'),
        createField(scene, 400, 120, 50, 'И3'),
        createField(scene, 180, 220, 10, null),
        createField(scene, 320, 220, 10, null),
        createField(scene, 460, 220, 10, null),
        createField(scene, 120, 320, 10, null),
        createField(scene, 260, 320, 10, null),
        createField(scene, 400, 320, 10, null),
        createField(scene, 180, 420, 10, null)
      ];
      

      startBots(this);
  
    this.input.on('pointerdown', (pointer) => {
      pointerDown = true;
      selectedField = findFieldAt(pointer.x, pointer.y);
    });
  
    this.input.on('pointerup', (pointer) => {
      pointerDown = false;
      const targetField = findFieldAt(pointer.x, pointer.y);
      if (selectedField && targetField && selectedField !== targetField && selectedField.owner === 'И1') {
        sendUnits(scene, selectedField, targetField);
      }
      selectedField = null;
    });
  
    // Регенерация каждые 1 секунду
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        fields.forEach(field => {
          if (!field.isBeingAttacked && !field.isSendingUnits && field.units < 50 && field.owner !== null) {
            field.units = Math.min(field.units + 2, 50);
            field.text.setText(field.units);
          }
        });
      }
    });
    // автообновление интерфейса игрока каждые 500 мс
this.time.addEvent({
    delay: 500,
    loop: true,
    callback: () => {
      updatePlayerUI(fields);
    }
  });
  scaleToFit(this);
  window.addEventListener('resize', () => scaleToFit(game.scene.scenes[0]));  
  }
  
  function update() {}
  
  function createField(scene, x, y, units, owner) {
    const graphics = scene.add.graphics();
  
    const color = owner === 'И1' ? 0xa8d5e2 : owner === 'И2' ? 0xf6c6c6 : owner === 'И3' ? 0xc4e1c1 : 0xdcdcdc;
  
    const darkened = Phaser.Display.Color.ValueToColor(color).darken(10).color;
  
    // создаём шестиугольник (в стиле границ)
    const size = 60;
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = Phaser.Math.DegToRad(60 * i);
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      points.push(new Phaser.Geom.Point(px, py));
    }
  
    // тень
    const shadow = scene.add.graphics();
    shadow.fillStyle(0x111111, 0.5);
    shadow.beginPath();
    shadow.moveTo(points[0].x + 5, points[0].y + 5);
    for (let i = 1; i < points.length; i++) {
      shadow.lineTo(points[i].x + 5, points[i].y + 5);
    }
    shadow.closePath();
    shadow.fillPath();
  
    graphics.fillStyle(color, 1);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.closePath();
    graphics.fillPath();
  
    // белая точка в центре
    const dot = scene.add.circle(x, y, 6, 0xffffff);
    const dotShadow = scene.add.circle(x, y, 6, darkened, 1);
  
    dot.setDepth(1);
    dotShadow.setDepth(0);
  
    const text = scene.add.text(x - 10, y - 25, units.toString(), {
      color: '#fff',
      fontSize: '14px',
      fontStyle: 'bold'
    }).setDepth(2);
  
    // всё вместе
    return {
      x,
      y,
      owner,
      units,
      maxUnits: 50,
      area: graphics,
      dot,
      dotShadow,
      text,
      isBeingAttacked: false,
      isSendingUnits: false,
      regenTimeout: null
    };
  }
  
  
  function findFieldAt(x, y) {
    return fields.find(field => Phaser.Math.Distance.Between(x, y, field.x, field.y) < 40);
  }
  
  function sendUnits(scene, from, to) {
    if (from.units <= 0) return;
  
    from.isSendingUnits = true;
    if (from.regenTimeout) clearTimeout(from.regenTimeout);
  
    const attackInterval = 1000 / 15; // 15 юнитов в секунду
    const interval = setInterval(() => {
      if (from.units <= 0) {
        clearInterval(interval);
        from.isSendingUnits = false;
        from.regenTimeout = setTimeout(() => from.isSendingUnits = false, 1000);
        return;
      }
  
      from.units -= 1;
      from.text.setText(from.units);
  
      const unit = scene.add.circle(from.x, from.y, 5, 0xffffff);
      scene.tweens.add({
        targets: unit,
        x: to.x + Phaser.Math.Between(-10, 10),
        y: to.y + Phaser.Math.Between(-10, 10),
        duration: 1000,
        onComplete: () => {
          unit.destroy();
  
          // Отключаем реген цели
          to.isBeingAttacked = true;
          if (to.regenTimeout) clearTimeout(to.regenTimeout);
          to.regenTimeout = setTimeout(() => to.isBeingAttacked = false, 1000);
  
          if (to.owner === from.owner) {
            if (to.units < to.maxUnits) {
              to.units += 1;
            }
          } else {
            to.units -= 1;
            if (to.units <= 0) {
                to.owner = from.owner;
                to.area.clear();
                
                const newColor = from.owner === 'И1' ? 0xa8d5e2 : from.owner === 'И2' ? 0xf6c6c6 : 0xc4e1c1;
                const darkened = Phaser.Display.Color.ValueToColor(newColor).darken(10).color;
                
                const size = 60;
                const points = [];
                for (let i = 0; i < 6; i++) {
                  const angle = Phaser.Math.DegToRad(60 * i);
                  const px = to.x + size * Math.cos(angle);
                  const py = to.y + size * Math.sin(angle);
                  points.push(new Phaser.Geom.Point(px, py));
                }
                
                // закрашиваем снова
                to.area.fillStyle(newColor, 1);
                to.area.beginPath();
                to.area.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                  to.area.lineTo(points[i].x, points[i].y);
                }
                to.area.closePath();
                to.area.fillPath();
                
                to.dot.setFillStyle(0xffffff);
                to.dotShadow.setFillStyle(darkened);
                
              to.units = 0;
            }
          }
  
          to.text.setText(to.units);
        }
      });
    }, attackInterval);
  }
  
  
    from.units -= count;
    from.text.setText(from.units);
    from.isSendingUnits = true;
  
    if (from.regenTimeout) clearTimeout(from.regenTimeout);
    from.regenTimeout = setTimeout(() => from.isSendingUnits = false, 1000);
  
    let arrivalCount = 0;
    for (let i = 0; i < count; i++) {
      const unit = scene.add.circle(from.x, from.y, 5, 0xffffff);
      scene.tweens.add({
        targets: unit,
        x: to.x + Phaser.Math.Between(-10, 10),
        y: to.y + Phaser.Math.Between(-10, 10),
        duration: 1000,
        onComplete: () => {
          unit.destroy();
  
          // поле атакуется
          to.isBeingAttacked = true;
          if (to.regenTimeout) clearTimeout(to.regenTimeout);
          to.regenTimeout = setTimeout(() => to.isBeingAttacked = false, 1000);
  
          if (to.owner === from.owner) {
            if (to.units < to.maxUnits) {
              to.units += 1;
            }
          } else {
            to.units -= 1;
            if (to.units <= 0) {
              to.owner = from.owner;
              to.circle.setFillStyle(from.circle.fillColor);
              to.units = 0;
            }
          }
  
          to.text.setText(to.units);
          arrivalCount++;
        }
      });
    }
    function startBot(scene) {
        setTimeout(() => {
          botThink(scene); // первый ход
          setInterval(() => botThink(scene), Phaser.Math.Between(3000, 6000)); // следующие ходы
        }, 2000); // задержка перед первым ходом
      }
      
      function startBots(scene) {
        // Бот И2
        setTimeout(() => {
          botLoop(scene, 'И2');
        }, Phaser.Math.Between(2000, 4000));
      
        // Бот И3
        setTimeout(() => {
          botLoop(scene, 'И3');
        }, Phaser.Math.Between(2000, 4000));
      }
      
      function botLoop(scene, botOwner) {
        botMakeMove(scene, botOwner);
      
        // следующий ход через 2–4 секунды
        setTimeout(() => {
          botLoop(scene, botOwner);
        }, Phaser.Math.Between(2000, 4000));
      }
      
      function botMakeMove(scene, botOwner) {
        const botFields = fields.filter(f => f.owner === botOwner && f.units > 0);
        const targets = fields.filter(f => f.owner !== botOwner);
      
        if (botFields.length === 0) return;
      
        // Бот выбирает только одно поле, случайное из своих
        const from = Phaser.Utils.Array.GetRandom(botFields);
      
        const potentialTargets = targets.filter(to => to.units <= from.units);
      
        if (potentialTargets.length === 0) return;
      
        // выбирает ближайшее
        potentialTargets.sort((a, b) => {
          const da = Phaser.Math.Distance.Between(from.x, from.y, a.x, a.y);
          const db = Phaser.Math.Distance.Between(from.x, from.y, b.x, b.y);
          return da - db;
        });
      
        const target = potentialTargets[0];
        sendUnits(scene, from, target);
      }
      function startBots(scene) {
        // Бот И2
        setTimeout(() => {
          botLoop(scene, 'И2');
        }, Phaser.Math.Between(2000, 4000));
      
        // Бот И3
        setTimeout(() => {
          botLoop(scene, 'И3');
        }, Phaser.Math.Between(2000, 4000));
      }
      
      function botLoop(scene, botOwner) {
        botMakeMove(scene, botOwner);
      
        // следующий ход через 2–4 секунды
        setTimeout(() => {
          botLoop(scene, botOwner);
        }, Phaser.Math.Between(2000, 4000));
      }
      
      function botMakeMove(scene, botOwner) {
        const botFields = fields.filter(f => f.owner === botOwner && f.units > 0);
        const targets = fields.filter(f => f.owner !== botOwner);
      
        if (botFields.length === 0) return;
      
        // Бот выбирает только одно поле, случайное из своих
        const from = Phaser.Utils.Array.GetRandom(botFields);
      
        const potentialTargets = targets.filter(to => to.units <= from.units);
      
        if (potentialTargets.length === 0) return;
      
        // выбирает ближайшее
        potentialTargets.sort((a, b) => {
          const da = Phaser.Math.Distance.Between(from.x, from.y, a.x, a.y);
          const db = Phaser.Math.Distance.Between(from.x, from.y, b.x, b.y);
          return da - db;
        });
      
        const target = potentialTargets[0];
        sendUnits(scene, from, target);
      }

      function scaleToFit(scene) {
        const canvas = scene.game.canvas;
        const parent = scene.game.scale.parent;
        const w = parent.clientWidth;
        const h = parent.clientHeight;
      
        const designedWidth = 800; // ширина нашей карты (см. ниже координаты)
        const designedHeight = 600;
      
        const scale = Math.min(w / designedWidth, h / designedHeight);
      
        canvas.style.transformOrigin = 'top left';
        canvas.style.transform = `scale(${scale})`;
      }
      
            
      
  