// ========================================
// 1️⃣ CONFIGURACIÓN DE FIREBASE
// ========================================

// Asegúrate de haber creado un proyecto en Firebase y copiado esta config
// Reemplaza con la tuya
const firebaseConfig = {
  apiKey: "AIzaSyAGgm0KD99KjMb1AQZXZ22I0ey2vCMnCfU",
  authDomain: "ligamus-c7ebe.firebaseapp.com",
  projectId: "ligamus-c7ebe",
  storageBucket: "ligamus-c7ebe.firebasestorage.app",
  messagingSenderId: "747328486638",
  appId: "1:747328486638:web:b9deb3fcbc7461872387ff",
  measurementId: "G-YS6MDHTDDM"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ========================================
// 2️⃣ SELECTORES DE ELEMENTOS
// ========================================
const form = document.getElementById('partida-form');
const jugadoresAInput = document.getElementById('jugadoresA');
const jugadoresBInput = document.getElementById('jugadoresB');
const ganadorInput = document.getElementById('ganador');
const ordagoInput = document.getElementById('ordago');

const clasificacionBody = document.getElementById('clasificacion-body');
const historicoBody = document.getElementById('historico-body');

// ========================================
// 3️⃣ FUNCIONES AUXILIARES
// ========================================

// Calcular puntuación según reglas básicas
function calcularPuntos(partida) {
    let puntosA = 0;
    let puntosB = 0;

    if (partida.ganador === "A") {
        puntosA += 3;
        if (partida.ordago) puntosA += 1;
    } else {
        puntosB += 3;
        if (partida.ordago) puntosB += 1;
    }

    return { puntosA, puntosB };
}

// ========================================
// 4️⃣ FUNCIONES DE RENDERIZADO
// ========================================

// Renderiza histórico
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
        `;
        historicoBody.appendChild(tr);
    });
}

// Renderiza clasificación
function renderClasificacion(partidas) {
    const puntuacion = {};

    partidas.forEach(p => {
        const { puntosA, puntosB } = calcularPuntos(p);

        p.jugadoresA.forEach(j => {
            if (!puntuacion[j]) puntuacion[j] = { puntos: 0, victorias: 0, ordagos: 0 };
            puntuacion[j].puntos += puntosA;
            if (p.ganador === "A") puntuacion[j].victorias += 1;
            if (p.ordago && p.ganador === "A") puntuacion[j].ordagos += 1;
        });

        p.jugadoresB.forEach(j => {
            if (!puntuacion[j]) puntuacion[j] = { puntos: 0, victorias: 0, ordagos: 0 };
            puntuacion[j].puntos += puntosB;
            if (p.ganador === "B") puntuacion[j].victorias += 1;
            if (p.ordago && p.ganador === "B") puntuacion[j].ordagos += 1;
        });
    });

    // Ordenar por puntos descendente
    const jugadoresOrdenados = Object.entries(puntuacion).sort((a, b) => b[1].puntos - a[1].puntos);

    clasificacionBody.innerHTML = "";
    jugadoresOrdenados.forEach(([jugador, stats]) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${jugador}</td>
            <td>${stats.puntos}</td>
            <td>${stats.victorias}</td>
            <td>${stats.ordagos}</td>
        `;
        clasificacionBody.appendChild(tr);
    });
}

// ========================================
// 5️⃣ OBTENER PARTIDAS DE FIRESTORE
// ========================================
function obtenerPartidas() {
    db.collection("partidas")
        .orderBy("fecha", "desc")
        .onSnapshot(snapshot => {
            const partidas = snapshot.docs.map(doc => doc.data());
            renderHistorico(partidas);
            renderClasificacion(partidas);
        });
}

// ========================================
// 6️⃣ AÑADIR NUEVA PARTIDA
// ========================================
form.addEventListener("submit", e => {
    e.preventDefault();

    const nuevaPartida = {
        fecha: new Date(),
        jugadoresA: jugadoresAInput.value.split(",").map(s => s.trim()),
        jugadoresB: jugadoresBInput.value.split(",").map(s => s.trim()),
        ganador: ganadorInput.value,
        ordago: ordagoInput.checked
    };

    db.collection("partidas").add(nuevaPartida)
        .then(() => {
            form.reset();
        })
        .catch(err => {
            console.error("Error al guardar partida:", err);
        });
});

// ========================================
// 7️⃣ INICIALIZACIÓN
// ========================================
obtenerPartidas();
