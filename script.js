// ---------------- CONFIG ----------------
const TOTAL_CREDITOS = 741;
const STORAGE_KEY    = 'materiasAprobadas';
const STORAGE_OPTS   = 'optativas';

// --------------- UTILIDADES -------------
const $ = sel => document.querySelector(sel);

// Cargar estado guardado
let aprobadas = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let optativas  = JSON.parse(localStorage.getItem(STORAGE_OPTS) || '[]');

// --------------- CARGAR DATOS -----------
fetch('materias.json')
  .then(r => r.json())
  .then(data => {
    startApp([...data, ...optativas]);
  });

function startApp(materias) {
  const main = $('#malla');
  render();

  // ----------- RENDERIZAR ------------
  function render(){
    main.innerHTML = '';
    // agrupar por año
    const porAnio = {};
    materias.forEach(m => {
      porAnio[m.anio] = porAnio[m.anio] || [];
      porAnio[m.anio].push(m);
    });

    Object.keys(porAnio).sort((a,b)=>a-b).forEach(anio=>{
      const h2 = document.createElement('h2');
      h2.textContent = `Año ${anio}`;
      h2.style.gridColumn = '1 / -1';
      main.appendChild(h2);

      porAnio[anio].forEach(mat=>{
        const locked   = !mat.previas.every(p => aprobadas.includes(p));
        const approved = aprobadas.includes(mat.id);
        const card = document.createElement('div');
        card.className = 'card';
        if (locked)    card.classList.add('locked');
        if (approved)  card.classList.add('approved');
        card.dataset.id = mat.id;
        card.innerHTML = `<strong>${mat.nombre}</strong><br><small>${mat.creditos} créditos</small>`;
        card.title = locked
          ? `Previas: ${mat.previas.join(', ')}`
          : 'Haz clic para marcar aprobar/desaprobar';

        if(!locked){
          card.addEventListener('click',()=>{
            toggleAprobada(mat.id);
          });
        }
        main.appendChild(card);
      });
    });

    actualizarProgreso();
  }

  // ---------- LOGICA DE APROBACION -----------
  function toggleAprobada(id){
    if(aprobadas.includes(id)){
      aprobadas = aprobadas.filter(x=>x!==id);
    }else{
      aprobadas.push(id);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(aprobadas));
    render();
  }

  // --------- PROGRESO -----------------
  function actualizarProgreso(){
    const cred = materias
      .filter(m => aprobadas.includes(m.id))
      .reduce((sum,m)=>sum+m.creditos,0);
    $('#progress-text').textContent = `${cred} / ${TOTAL_CREDITOS} créditos`;
    $('#progress-fill').style.width = `${(cred/TOTAL_CREDITOS)*100}%`;
  }

  // -------- FORMULARIO OPTATIVAS -------
  $('#optativa-form').addEventListener('submit',e=>{
    e.preventDefault();
    const nombre   = $('#opt-nombre').value.trim();
    const creditos = parseInt($('#opt-creditos').value);
    const anio     = parseInt($('#opt-anio').value);

    if(!nombre || creditos<=0 || anio<=0){return;}

    const id = `OPT${Date.now()}`; // id único
    const nueva = {id,nombre,anio,creditos,previas:[]};
    optativas.push(nueva);
    localStorage.setItem(STORAGE_OPTS, JSON.stringify(optativas));

    // limpiar
    e.target.reset();
    startApp([...materias, nueva]); // re-dibujar con la nueva optativa
  });
}
