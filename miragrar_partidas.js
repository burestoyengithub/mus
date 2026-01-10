async function migrarPartidasAIDs() {
  console.log("🔄 Iniciando migración de partidas a IDs...");

  // 1️⃣ Obtener jugadores
  const jugadoresSnap = await db.collection("jugadores").get();
  const mapaNombreAId = {};

  jugadoresSnap.docs.forEach(doc => {
    const data = doc.data();
    mapaNombreAId[data.nombre] = doc.id;
  });

  console.log("🧠 Mapa nombre → ID:", mapaNombreAId);

  // 2️⃣ Obtener partidas
  const partidasSnap = await db.collection("partidas").get();

  if (partidasSnap.empty) {
    console.warn("⚠️ No hay partidas para migrar");
    return;
  }

  const batch = db.batch();
  let contador = 0;

  partidasSnap.docs.forEach(doc => {
    const p = doc.data();

    // Seguridad básica
    if (!Array.isArray(p.jugadoresA) || !Array.isArray(p.jugadoresB)) {
      console.warn("⛔ Partida con formato inválido:", doc.id);
      return;
    }

    // Convertir nombres a IDs
    const jugadoresA = p.jugadoresA.map(nombre => {
      const id = mapaNombreAId[nombre];
      if (!id) {
        console.error(`❌ No se encontró ID para ${nombre}`);
      }
      return id || null;
    });

    const jugadoresB = p.jugadoresB.map(nombre => {
      const id = mapaNombreAId[nombre];
      if (!id) {
        console.error(`❌ No se encontró ID para ${nombre}`);
      }
      return id || null;
    });

    // No migrar si hay errores
    if (jugadoresA.includes(null) || jugadoresB.includes(null)) {
      console.warn("⚠️ Partida saltada por jugador no encontrado:", doc.id);
      return;
    }

    batch.update(doc.ref, {
      jugadoresA,
      jugadoresB,
      migrada: true // marca opcional
    });

    contador++;
  });

  await batch.commit();
  console.log(`✅ Migración completada. Partidas migradas: ${contador}`);
  alert(`Migración completada. Partidas migradas: ${contador}`);
}
