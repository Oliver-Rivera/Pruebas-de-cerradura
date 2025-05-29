const Cerraduras = (() => {
  const contenedor = document.getElementById("cerradurasContainer");
  const modalHist = document.getElementById("modalHistorial");
  const cerrarHist = document.getElementById("cerrarModal");
  const tituloHist = document.getElementById("tituloHistorial");
  const contenidoHist = document.getElementById("contenidoHistorial");

  cerrarHist.onclick = () => modalHist.classList.remove("mostrar");

  window.addEventListener("click", (e) => {
    if (e.target === modalHist) modalHist.classList.remove("mostrar");
    if (e.target === modalUsuarios) modalUsuarios.classList.remove("mostrar");
    if (e.target === modalAgregarCerradura) modalAgregarCerradura.classList.remove("mostrar");
  });

  function getHora() {
    const now = new Date();
    return now.toLocaleDateString("es-MX") + " " + now.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function cambiarEstado(idAula, estadoActual) {
  const usuario = firebase.auth().currentUser;
  if (!usuario) {
    alert("Debes iniciar sesión para registrar la acción.");
    return;
  }

  const uid = usuario.uid;
  const now = new Date();
  const fecha = now.toLocaleDateString("es-MX");
  const horaActual = now.toTimeString().slice(0, 5); // "HH:MM"
  const diaActual = now.toLocaleDateString("es-MX", { weekday: 'long' }).toLowerCase();

  // Obtener datos del profesor
  db.ref(`Profesores/${uid}`).once("value").then(snapshot => {
    const profesor = snapshot.val();
    if (!profesor) throw new Error("No se encontró información del profesor.");

    // Buscar si tiene clase en este momento
    db.ref("Horarios").once("value").then(snapshot => {
      const horarios = snapshot.val();
      let accesoPermitido = false;

      for (let key in horarios) {
        const h = horarios[key];
        const dias = h.dia_semana.split(",").map(d => d.trim().toLowerCase());
        if (
          h.id_profesor === uid &&
          h.id_aula === idAula &&
          dias.includes(diaActual) &&
          h.hora_inicio <= horaActual &&
          horaActual <= h.hora_fin
        ) {
          accesoPermitido = true;
          break;
        }
      }

      if (!accesoPermitido) {
        alert("No tienes clase programada en este aula en este momento.");
        return;
      }

      // Si tiene permiso, cambiar el estado
      const nuevo = estadoActual === "ABIERTO" ? "CERRADO" : "ABIERTO";
      db.ref(`aulas/${idAula}/estado`).set(nuevo);

      const nombreCompleto = `${profesor.nombre} ${profesor.apellido}`;
      db.ref(`accesos/${idAula}`).push({
        fecha,
        hora: horaActual,
        accion: nuevo,
        metodo: "Apertura Manual",
        usuario: nombreCompleto
      });

      alert(`Cerradura ${nuevo.toLowerCase()} correctamente.`);
    });
  }).catch(error => {
    console.error("Error en verificación de clase:", error);
    alert("Error verificando el horario. Intenta más tarde.");
  });
}


  function mostrarHistorial(id, nombreMostrado) {
    db.ref(`accesos/${id}`).limitToLast(10).once("value")
      .then(snapshot => {
        const registros = snapshot.val();
        tituloHist.textContent = `Historial de ${nombreMostrado}`;
        contenidoHist.innerHTML = "";

        if (registros) {
          Object.values(registros).reverse().forEach(r => {
            const li = document.createElement("li");
            let texto = `${r.fecha} ${r.hora} — ${r.accion} ${r.metodo} por ${r.usuario}`;
            if (r.nombre) texto += ` (${r.nombre})`;
            li.textContent = texto;
            contenidoHist.appendChild(li);
          });
        } else {
          contenidoHist.innerHTML = "<li>No hay historial aún.</li>";
        }

        closeAllModals();
        modalHist.classList.add("mostrar");
      })
      .catch(err => {
        console.error("Error al obtener historial:", err);
        alert("Error al cargar el historial.");
      });
  }

  function cargarCerraduras() {
    db.ref("aulas").on("value", snapshot => {
      contenedor.innerHTML = "";
      const datos = snapshot.val() || {};

      Object.entries(datos).forEach(([id, info]) => {
        const div = document.createElement("div");
        div.className = "cerradura";

        const nombre = document.createElement("h2");
        nombre.textContent = info.nombre;

        const inputNombre = document.createElement("input");
        inputNombre.type = "text";
        inputNombre.value = info.nombre;
        inputNombre.style.display = "none";
        inputNombre.style.marginRight = "5px";

        const btnEditarNombre = document.createElement("button");
        btnEditarNombre.textContent = "✏️ Renombrar";
        btnEditarNombre.onclick = () => {
          inputNombre.style.display = "inline";
          btnGuardarNombre.style.display = "inline";
          btnEditarNombre.style.display = "none";
        };

        const btnGuardarNombre = document.createElement("button");
        btnGuardarNombre.textContent = "📂 Guardar";
        btnGuardarNombre.style.display = "none";
        btnGuardarNombre.onclick = () => {
          const nuevoNombre = inputNombre.value.trim();
          if (nuevoNombre !== "") {
            db.ref("aulas/" + id + "/nombre").set(nuevoNombre).then(() => {
              alert("Nombre actualizado.");
              cargarCerraduras();
            });
          }
        };

        const span = document.createElement("span");
        span.className = `estado ${info.estado === "ABIERTO" ? "abierto" : "cerrado"}`;
        span.textContent = info.estado;

        const btnToggle = document.createElement("button");
        btnToggle.textContent = info.estado === "ABIERTO" ? "Cerrar" : "Abrir";
        btnToggle.onclick = () => cambiarEstado(id, info.estado);

        const btnHist = document.createElement("button");
        btnHist.textContent = "📜 Ver historial";
        btnHist.onclick = () => mostrarHistorial(id, info.nombre);

        div.append(
          nombre,
          inputNombre,
          btnEditarNombre,
          btnGuardarNombre,
          btnToggle,
          span,
          document.createElement("br"),
          btnHist
        );
        contenedor.appendChild(div);
      });

      if (Object.keys(datos).length === 0) {
        contenedor.innerHTML = "<p>No hay cerraduras registradas.</p>";
      }
    });
  }

  return {
    iniciar: cargarCerraduras,
    cambiarEstado,
    mostrarHistorial
  };
})();
