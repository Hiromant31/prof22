function updatePlayerUI(fields) {
    const myFields = fields.filter(f => f.owner === 'И1');
    const fieldCount = myFields.length;
    const unitCount = myFields.reduce((acc, f) => acc + f.units, 0);
  
    document.getElementById('fields-count').textContent = fieldCount;
    document.getElementById('units-count').textContent = unitCount;
  }
  
  function startGame() {
    alert("Ты уже в игре :)");
  }
  
  function surrender() {
    alert("Игра окончена. Ты сдался.");
    location.reload();
  }
  