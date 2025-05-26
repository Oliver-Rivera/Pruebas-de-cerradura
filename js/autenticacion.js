
/*Registro y login de usuarios*/



/*async function puedeAcceder(aulaId, profesorUid) {
  const now = new Date();
  const dia = now.toLocaleDateString("es-MX", { weekday: "long" }); // e.g. "Martes"
  const horaActual = now.toTimeString().substr(0,5); // "HH:MM"

  const snap = await db.ref("Horarios")
    .orderByChild("id_aula")
    .equalTo(aulaId)
    .once("value");
  const horarios = snap.val() || {};
  
  return Object.values(horarios).some(h => {
    const dias = h.dia_semana.split(",");
    return dias.includes(dia)
      && horaActual >= h.hora_inicio
      && horaActual <= h.hora_fin
      && h.id_profesor === profesorUid;
  });
}

async function cambiarEstado(id, estadoActual) {
  const userUid = // aquí toma el UID real del profesor logueado ;
  const autorizado = await puedeAcceder(id, userUid);
  if (!autorizado) {
    return alert("No tienes permiso de horario para abrir/cerrar en este momento.");
  }

  const nuevo = estadoActual === "ABIERTO" ? "CERRADO" : "ABIERTO";
  db.ref(`aulas/${id}/estado`).set(nuevo);

  const now = new Date();
  const fecha = now.toLocaleDateString("es-MX");
  const hora = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  db.ref(`accesos/${id}`).push({
    fecha, hora, accion: nuevo, metodo: "Manual", usuario: userUid
  });
}
 */