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
      createField(scene, 200, 300, 50, 'И1'),
      createField(scene, 600, 300, 50, 'И2'),
      createField(scene, 400, 500, 10, null)
    ];
  
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
  }
  
  function update() {}
  
  function createField(scene, x, y, units, owner) {
    const color = owner === 'И1' ? 0x00ff00 : owner === 'И2' ? 0xff0000 : 0xaaaaaa;
    const circle = scene.add.circle(x, y, 40, color).setInteractive();
    const text = scene.add.text(x - 10, y - 10, units.toString(), { color: '#fff' });
  
    return {
      x,
      y,
      owner,
      units,
      maxUnits: 50,
      circle,
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
              to.circle.setFillStyle(from.circle.fillColor);
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

  