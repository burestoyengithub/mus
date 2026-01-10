async function guardarClasificacionActual() {
  const snapshot = await db.collection("partidas").get();
  const partidas = snapshot.docs.map(d => d.data());

  const stats = {};

  partidas.forEach(p => {
    // Pareja A
    p.jugadoresA.forEach(j => {
      stats[j] ??= { victorias:0, derrotas:0, ordagos:0 };
      if (p.ganador === "A") {
        stats[j].victorias++;
        if (p.ordago) stats[j].ordagos++;
      } else stats[j].derrotas++;
    });

    // Pareja B
    p.jugadoresB.forEach(j => {
      stats[j] ??= { victorias:0, derrotas:0, ordagos:0 };
      if (p.ganador === "B") {
        stats[j].victorias++;
        if (p.ordago) stats[j].ordagos++;
      } else stats[j].derrotas++;
    });
  });

  const batch = db.batch();
  Object.entries(stats).forEach(([nombre, s]) => {
    const total = s.victorias + s.derrotas;
    const porcentaje = total ? (s.victorias/total*100) : 0;

    const ref = db.collection("clasificacion_historica").doc();
    batch.set(ref, {
      jugadorNombre: nombre,
      victorias: s.victorias,
      derrotas: s.derrotas,
      porcentaje,
      ordagos: s.ordagos,
      fechaSnapshot: new Date()
    });
  });

  await batch.commit();
  alert("Clasificación histórica guardada correctamente");
}