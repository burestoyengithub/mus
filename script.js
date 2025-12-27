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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// SELECTORES
const form = document.getElementById("partida-form");
const ganadorInput = document.getElementById("ganador");
const ordagoInput = document.getElementById("ordago");
const historicoBody = document.getElementById("historico-body");
const clasificacionBody = document.getElementById("clasificacion-body");
const listaJugadoresDiv = document.getElementById("lista-jugadores");

const selects = ["jugadorA1","jugadorA2","jugadorB1","jugadorB2"].map(id => document.getElementById(id));

let jugadores = [];

// ==============================
// CARGAR JUGADORES
function cargarJugadores() {
  db.collection("jugadores").orderBy("nombre").onSnapshot(snapshot => {
    jugadores = snapshot.docs.map(doc => ({
      id: doc.id,
      nombre: doc.data().nombre,
      activo: doc.data().activo ?? true
    }));

    const activos = jugadores.filter(j => j.activo);

    // Llenar selects
    selects.forEach(sel => {
      const valorActual = sel.value;
      sel.innerHTML = '<option value="">Selecciona</option>';
      activos.forEach(j => {
        const option = document.createElement("option");
        option.value = j.nombre;
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
function actualizarSelects() {
  const valores = selects.map(s => s.value).filter(v => v);
  selects.forEach(sel => {
    Array.from(sel.options).forEach(opt => {
      if(opt.value && opt.value !== sel.value) opt.disabled = valores.includes(opt.value);
    });
  });
}

cargarJugadores();

// ==============================
// NUEVO JUGADOR
const jugadorForm = document.getElementById("jugador-form");
const nuevoJugadorInput = document.getElementById("nuevoJugador");

jugadorForm.addEventListener("submit", e => {
  e.preventDefault();
  const nombre = nuevoJugadorInput.value.trim();
  if (!nombre) return;

  db.collection("jugadores").where("nombre","==",nombre).get()
    .then(snapshot => {
      if (!snapshot.empty) alert("El jugador ya existe");
      else db.collection("jugadores").add({ nombre, activo:true });
      nuevoJugadorInput.value = "";
    });
});

// ==============================
// AÑADIR PARTIDA
form.addEventListener("submit", e => {
  e.preventDefault();
  const jugadoresA = [selects[0].value, selects[1].value];
  const jugadoresB = [selects[2].value, selects[3].value];

  if (jugadoresA.includes("") || jugadoresB.includes("")) return alert("Debes seleccionar todos los jugadores");
  if (jugadoresA.some(j => jugadoresB.includes(j))) return alert("Un jugador no puede estar en ambas parejas");

  const partida = {
    fecha: new Date(),
    jugadoresA,
    jugadoresB,
    ganador: ganadorInput.value,
    ordago: ordagoInput.checked
  };

  db.collection("partidas").add(partida).then(() => {
    selects.forEach(s => s.value = "");
    form.reset();
    cargarJugadores();
  });
});

// ==============================
// HISTÓRICO
function renderHistorico(partidas) {
  historicoBody.innerHTML = "";
  partidas.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.fecha.toDate().toLocaleDateString()}</td>
      <td>${p.jugadoresA.join(", ")}</td>
      <td>${p.jugadoresB.join(", ")}</td>
      <td>${p.ganador}</td>
      <td>${p.ordago ? "Sí" : "No"}</td>
      <td><button class="btn-eliminar" data-id="${p.id}">Eliminar</button></td>
    `;
    historicoBody.appendChild(tr);
  });

  document.querySelectorAll(".btn-eliminar").forEach(btn=>{
    btn.addEventListener("click", e=>{
      const id = e.target.dataset.id;
      if(confirm("¿Eliminar esta partida?")) db.collection("partidas").doc(id).delete();
    });
  });
}

// ==============================
// CLASIFICACIÓN POR % VICTORIAS Y ÓRDAGOS
function renderClasificacion(partidas) {
  const stats = {};
  partidas.forEach(p => {
    // Pareja A
    p.jugadoresA.forEach(j => {
      stats[j] ??= { victorias:0, derrotas:0, ordagos:0 };
      if(p.ganador==="A") {
        stats[j].victorias++;
        if(p.ordago) stats[j].ordagos++;
      } else stats[j].derrotas++;
    });
    // Pareja B
    p.jugadoresB.forEach(j => {
      stats[j] ??= { victorias:0, derrotas:0, ordagos:0 };
      if(p.ganador==="B") {
        stats[j].victorias++;
        if(p.ordago) stats[j].ordagos++;
      } else stats[j].derrotas++;
    });
  });

  clasificacionBody.innerHTML = "";
  Object.entries(stats)
    .map(([jugador,s]) => {
      const total = s.victorias + s.derrotas;
      const porcentaje = total ? (s.victorias/total*100).toFixed(1) : 0;
      return { jugador, victorias:s.victorias, derrotas:s.derrotas, porcentaje, ordagos: s.ordagos };
    })
    .sort((a,b)=>b.porcentaje - a.porcentaje)
    .forEach(s=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.jugador}</td>
        <td>${s.victorias}</td>
        <td>${s.derrotas}</td>
        <td>${s.porcentaje}%</td>
        <td>${s.ordagos}</td>
      `;
      clasificacionBody.appendChild(tr);
    });
}

// ==============================
// LISTA JUGADORES (al final) CON ELIMINAR/ACTIVAR/MODIFICAR
function renderListaJugadores() {
  listaJugadoresDiv.innerHTML = "";
  jugadores.forEach(j=>{
    const div = document.createElement("div");
    div.textContent = `${j.nombre} (${j.activo ? "Activo" : "Inactivo"})`;

    // Botón eliminar/activar
    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = j.activo ? "Eliminar" : "Activar";
    btnEliminar.addEventListener("click", ()=>{
      const accion = j.activo ? "Eliminar" : "Activar";
      if(confirm(`${accion} jugador ${j.nombre}?`)) {
        db.collection("jugadores").doc(j.id).update({ activo: !j.activo });
      }
    });
    div.appendChild(btnEliminar);

    // Botón modificar con actualización de partidas
    const btnModificar = document.createElement("button");
    btnModificar.textContent = "Modificar";
    btnModificar.addEventListener("click", async () => {
      const nuevoNombre = prompt("Introduce el nuevo nombre:", j.nombre);
      if (!nuevoNombre || nuevoNombre.trim() === "") return;

      // Comprobar que no exista otro jugador con ese nombre
      const snapshot = await db.collection("jugadores").where("nombre", "==", nuevoNombre.trim()).get();
      if (!snapshot.empty) return alert("Ya existe un jugador con ese nombre");

      const nombreAntiguo = j.nombre;
      const idJugador = j.id;

      // 1️⃣ Actualizar nombre del jugador
      await db.collection("jugadores").doc(idJugador).update({ nombre: nuevoNombre.trim() });

      // 2️⃣ Actualizar partidas existentes
      const partidasSnap = await db.collection("partidas").get();
      partidasSnap.docs.forEach(doc => {
        const partida = doc.data();
        let modificado = false;

        // Pareja A
        partida.jugadoresA = partida.jugadoresA.map(x => {
          if (x === nombreAntiguo) { modificado = true; return nuevoNombre.trim(); }
          return x;
        });

        // Pareja B
        partida.jugadoresB = partida.jugadoresB.map(x => {
          if (x === nombreAntiguo) { modificado = true; return nuevoNombre.trim(); }
          return x;
        });

        if (modificado) {
          doc.ref.update({
            jugadoresA: partida.jugadoresA,
            jugadoresB: partida.jugadoresB
          });
        }
      });

      alert(`Nombre del jugador actualizado a "${nuevoNombre.trim()}" y partidas modificadas`);
    });
    div.appendChild(btnModificar);

    listaJugadoresDiv.appendChild(div);
  });
}

// ==============================
// SUSCRIPCIONES FIRESTORE
db.collection("partidas").orderBy("fecha","desc").onSnapshot(snapshot=>{
  const partidas = snapshot.docs.map(doc=> ({...doc.data(), id: doc.id}) );
  renderHistorico(partidas);
  renderClasificacion(partidas);
});
