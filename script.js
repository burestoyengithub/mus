// 🔥 FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "ligamus-c7ebe.firebaseapp.com",
  projectId: "ligamus-c7ebe",
  storageBucket: "ligamus-c7ebe.appspot.com",
  messagingSenderId: "747328486638",
  appId: "1:747328486638:web:b9deb3fcbc7461872387ff",
  measurementId: "G-YS6MDHTDDM"
};
// 🔥 FIREBASE CONFIG
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==============================
// SELECTORES
// ==============================
const form = document.getElementById("partida-form");
const ganadorInput = document.getElementById("ganador");
const ordagoInput = document.getElementById("ordago");
const historicoBody = document.getElementById("historico-body");
const clasificacionBody = document.getElementById("clasificacion-body");
const listaJugadoresDiv = document.getElementById("lista-jugadores");
const mejoresParejasBody = document.getElementById("mejores-parejas-body");
const peoresParejasBody = document.getElementById("peores-parejas-body");

const selects = ["jugadorA1","jugadorA2","jugadorB1","jugadorB2"]
  .map(id => document.getElementById(id));

const btnNext = document.getElementById("next-partidas");
const btnPrev = document.getElementById("prev-partidas");
const spanPagina = document.getElementById("pagina-actual");

// ==============================
// ESTADO GLOBAL
// ==============================
let jugadores = [];
let mapaJugadores = {}; // id -> nombre

let primerDoc = null;
let ultimoDoc = null;
const LIMITE_PARTIDAS = 10;
let totalPartidas = 0;
let paginaActual = 1;
let totalPaginas = 1;

// ==============================
// CARGAR JUGADORES
// ==============================
function cargarJugadores() {
  db.collection("jugadores").orderBy("nombre").onSnapshot(snapshot => {
    jugadores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    mapaJugadores = {};
    jugadores.forEach(j => mapaJugadores[j.id] = j.nombre);

    const activos = jugadores.filter(j => j.activo);

    selects.forEach(sel => {
      const valorActual = sel.value;
      sel.innerHTML = '<option value="">Selecciona</option>';
      activos.forEach(j => {
        const option = document.createElement("option");
        option.value = j.id;
        option.textContent = j.nombre;
        sel.appendChild(option);
      });
      sel.value = valorActual;
    });

    actualizarSelects();
    renderListaJugadores();
  });
}

// ==============================
// Evitar duplicados en selects
// ==============================
function actualizarSelects() {
  const valores = selects.map(s => s.value).filter(v => v);
  selects.forEach(sel => {
    Array.from(sel.options).forEach(opt => {
      if(opt.value && opt.value !== sel.value) {
        opt.disabled = valores.includes(opt.value);
      }
    });
  });
}

cargarJugadores();

// ==============================
// NUEVO JUGADOR
// ==============================
const jugadorForm = document.getElementById("jugador-form");
const nuevoJugadorInput = document.getElementById("nuevoJugador");

jugadorForm.addEventListener("submit", async e => {
  e.preventDefault();
  const nombre = nuevoJugadorInput.value.trim();
  if (!nombre) return;

  const snap = await db.collection("jugadores").where("nombre","==",nombre).get();
  if (!snap.empty) return alert("El jugador ya existe");

  await db.collection("jugadores").add({ nombre, activo:true });
  nuevoJugadorInput.value = "";
});

// ==============================
// AÑADIR PARTIDA
// ==============================
form.addEventListener("submit", e => {
  e.preventDefault();

  const jugadoresA = [selects[0].value, selects[1].value];
  const jugadoresB = [selects[2].value, selects[3].value];

  if (jugadoresA.includes("") || jugadoresB.includes(""))
    return alert("Debes seleccionar todos los jugadores");

  if (jugadoresA.some(id => jugadoresB.includes(id)))
    return alert("Un jugador no puede estar en ambas parejas");

  db.collection("partidas").add({
    fecha: new Date(),
    jugadoresA,
    jugadoresB,
    ganador: ganadorInput.value,
    ordago: ordagoInput.checked
  });

  form.reset();
});

// ==============================
// ACTUALIZAR TOTAL PARTIDAS
// ==============================
async function actualizarTotalPartidas() {
  const snapshot = await db.collection("partidas").get();
  totalPartidas = snapshot.size;
  totalPaginas = Math.ceil(totalPartidas / LIMITE_PARTIDAS);
  actualizarIndicadorPagina();
}

// ==============================
// ACTUALIZAR INDICADOR DE PÁGINA
// ==============================
function actualizarIndicadorPagina() {
  spanPagina.textContent = `Página ${paginaActual} / ${totalPaginas || 1}`;
  btnPrev.disabled = paginaActual <= 1;
  btnNext.disabled = paginaActual >= totalPaginas;
}

// ==============================
// CARGAR PARTIDAS (PAGINACIÓN)
// ==============================
async function cargarPartidas(direction = "init") {
  await actualizarTotalPartidas();

  let query = db.collection("partidas").orderBy("fecha", "desc").limit(LIMITE_PARTIDAS);

  if (direction === "next" && ultimoDoc) {
    query = query.startAfter(ultimoDoc);
    paginaActual++;
  }

  if (direction === "prev" && primerDoc) {
    query = db.collection("partidas")
      .orderBy("fecha", "desc")
      .endBefore(primerDoc)
      .limitToLast(LIMITE_PARTIDAS);
    paginaActual--;
  }

  if (direction === "init") paginaActual = 1;

  const snapshot = await query.get();
  if (snapshot.empty) return;

  primerDoc = snapshot.docs[0];
  ultimoDoc = snapshot.docs[snapshot.docs.length - 1];

  const partidas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  renderHistorico(partidas);
  cargarClasificacionGlobal();
  actualizarIndicadorPagina();
}

btnNext.addEventListener("click", ()=> cargarPartidas("next"));
btnPrev.addEventListener("click", ()=> cargarPartidas("prev"));

// ==============================
// RENDER HISTÓRICO
// ==============================
function renderHistorico(partidas) {
  historicoBody.innerHTML = "";

  partidas.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.fecha.toDate().toLocaleDateString()}</td>
      <td>${p.jugadoresA.map(id => mapaJugadores[id] || "Jugador eliminado").join(", ")}</td>
      <td>${p.jugadoresB.map(id => mapaJugadores[id] || "Jugador eliminado").join(", ")}</td>
      <td>${p.ganador}</td>
      <td>${p.ordago ? "Sí" : "No"}</td>
      <td><button data-id="${p.id}">Eliminar</button></td>
    `;
    tr.querySelector("button").onclick = () => {
      if(confirm("¿Eliminar partida?")) {
        db.collection("partidas").doc(p.id).delete();
        cargarPartidas();
      }
    };
    historicoBody.appendChild(tr);
  });
}

// ==============================
// CLASIFICACIÓN GLOBAL
// ==============================
async function cargarClasificacionGlobal() {
  const snapshot = await db.collection("partidas").get();
  const partidas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const stats = {};
  partidas.forEach(p => {
    p.jugadoresA.forEach(id => {
      stats[id] ??= { victorias:0, derrotas:0, ordagos:0 };
      if (p.ganador === "A") { stats[id].victorias++; if(p.ordago) stats[id].ordagos++; } 
      else stats[id].derrotas++;
    });
    p.jugadoresB.forEach(id => {
      stats[id] ??= { victorias:0, derrotas:0, ordagos:0 };
      if (p.ganador === "B") { stats[id].victorias++; if(p.ordago) stats[id].ordagos++; } 
      else stats[id].derrotas++;
    });
  });

  clasificacionBody.innerHTML = "";
  Object.entries(stats)
    .map(([id,s]) => {
      const total = s.victorias + s.derrotas;
      return {
        nombre: mapaJugadores[id] || "Jugador eliminado",
        victorias: s.victorias,
        derrotas: s.derrotas,
        porcentaje: total ? (s.victorias/total*100).toFixed(1) : "0.0",
        ordagos: s.ordagos
      };
    })
    .sort((a,b)=>b.porcentaje - a.porcentaje)
    .forEach(s=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.nombre}</td>
        <td>${s.victorias}</td>
        <td>${s.derrotas}</td>
        <td>${s.porcentaje}%</td>
        <td>${s.ordagos}</td>
      `;
      clasificacionBody.appendChild(tr);
    });

  renderParejas(partidas); // recalcular mejores/peores parejas
}

// ==============================
// RENDER PAREJAS
// ==============================
function renderParejas(partidas) {
  const parejas = {};

  partidas.forEach(p => {
    const pares = [
      { jugadores: p.jugadoresA, ganador: p.ganador === "A" },
      { jugadores: p.jugadoresB, ganador: p.ganador === "B" }
    ];

    pares.forEach(par => {
      const [id1,id2] = par.jugadores.sort();
      const key = `${id1}|${id2}`;
      parejas[key] ??= { victorias:0, partidas:0, nombres:[mapaJugadores[id1]||"Eliminado",mapaJugadores[id2]||"Eliminado"] };
      parejas[key].partidas++;
      if(par.ganador) parejas[key].victorias++;
    });
  });

  const listaParejas = Object.values(parejas)
    .filter(p => p.partidas >= 3)
    .map(p => ({ ...p, porcentaje: (p.victorias/p.partidas*100).toFixed(1) }));

  // Mejores
  listaParejas.sort((a,b)=>b.porcentaje - a.porcentaje);
  mejoresParejasBody.innerHTML = "";
  listaParejas.slice(0,10).forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.nombres.join(" & ")}</td><td>${p.victorias}</td><td>${p.partidas}</td><td>${p.porcentaje}%</td>`;
    mejoresParejasBody.appendChild(tr);
  });

  // Peores
  listaParejas.sort((a,b)=>a.porcentaje - b.porcentaje);
  peoresParejasBody.innerHTML = "";
  listaParejas.slice(0,10).forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.nombres.join(" & ")}</td><td>${p.victorias}</td><td>${p.partidas}</td><td>${p.porcentaje}%</td>`;
    peoresParejasBody.appendChild(tr);
  });
}

// ==============================
// LISTA JUGADORES
// ==============================
function renderListaJugadores() {
  listaJugadoresDiv.innerHTML = "";
  jugadores.forEach(j=>{
    const div = document.createElement("div");
    div.textContent = `${j.nombre} (${j.activo?"Activo":"Inactivo"}) `;

    const toggle = document.createElement("button");
    toggle.textContent = j.activo ? "Desactivar" : "Activar";
    toggle.onclick = ()=> db.collection("jugadores").doc(j.id).update({ activo: !j.activo });

    const edit = document.createElement("button");
    edit.textContent = "Modificar";
    edit.onclick = async ()=>{
      const nuevo = prompt("Nuevo nombre:", j.nombre);
      if(!nuevo || !nuevo.trim()) return;
      const snap = await db.collection("jugadores").where("nombre","==",nuevo.trim()).get();
      if(!snap.empty) return alert("Ya existe un jugador con ese nombre");
      await db.collection("jugadores").doc(j.id).update({ nombre:nuevo.trim() });
    };

    div.appendChild(toggle);
    div.appendChild(edit);
    listaJugadoresDiv.appendChild(div);
  });
}

// ==============================
// INICIALIZACIÓN
// ==============================
cargarPartidas();
