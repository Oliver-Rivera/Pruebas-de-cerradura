const Cerraduras = (() => {
  const contenedor = document.getElementById("cerradurasContainer");
  const modalHist = document.getElementById("modalHistorial");
  const cerrarHist = document.getElementById("cerrarModal");
  const tituloHist = document.getElementById("tituloHistorial");
  const contenidoHist = document.getElementById("contenidoHistorial");

  const ubicacionesDisponibles = [
    "Laboratorio 1",
    "Laboratorio 2",
    "Aula de Electrónica",
    "Sala de Profesores",
    "Bodega de Equipos"
  ];

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
    const horaActual = now.toTimeString().slice(0, 5);
    const diaActual = now.toLocaleDateString("es-MX", { weekday: 'long' }).toLowerCase();

    db.ref(`Profesores/${uid}`).once("value").then(snapshot => {
      const profesor = snapshot.val();
      if (!profesor) throw new Error("No se encontró información del profesor.");

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
        nombre.innerHTML = `${info.nombre} <span style="font-size: 0.8em; color: #555;">(${info.ubicacion || "Sin ubicación"})</span>`;

        const inputNombre = document.createElement("input");
        inputNombre.type = "text";
        inputNombre.value = info.nombre;
        inputNombre.style.display = "none";
        inputNombre.style.marginRight = "5px";

        const selectUbicacion = document.createElement("select");
        selectUbicacion.style.display = "none";
        selectUbicacion.style.marginRight = "5px";

        const placeholderOption = document.createElement("option");
        placeholderOption.textContent = "Selecciona una ubicación";
        placeholderOption.disabled = true;
        placeholderOption.selected = true;
        selectUbicacion.appendChild(placeholderOption);

        ubicacionesDisponibles.forEach(opcion => {
          const opt = document.createElement("option");
          opt.value = opcion;
          opt.textContent = opcion;
          if (opcion === info.ubicacion) {
            opt.selected = true;
            placeholderOption.selected = false;
          }
          selectUbicacion.appendChild(opt);
        });

        const btnEditar = document.createElement("button");
        btnEditar.textContent = "✏️ Editar";
        btnEditar.className = "btn-editar";

        const btnGuardar = document.createElement("button");
        btnGuardar.textContent = "📂 Guardar";
        btnGuardar.className = "btn-guardar oculto";
        btnGuardar.style.display = "none";

        const btnCancelar = document.createElement("button");
        btnCancelar.textContent = "❌ Cancelar";
        btnCancelar.className = "btn-cancelar oculto";
        btnCancelar.style.display = "none";

        const btnEliminar = document.createElement("button");
        btnEliminar.textContent = "🗑️ Eliminar";
        btnEliminar.className = "btn-eliminar";
        btnEliminar.style.backgroundColor = "#e74c3c";
        btnEliminar.style.color = "#fff";
        btnEliminar.style.marginLeft = "5px";

        btnEliminar.onclick = () => {
          if (confirm(`¿Estás seguro de eliminar la cerradura "${info.nombre}"?`)) {
            db.ref("aulas/" + id).remove()
              .then(() => {
                alert("Cerradura eliminada.");
                cargarCerraduras();
              })
              .catch(err => {
                console.error("Error al eliminar:", err);
                alert("Error al eliminar cerradura.");
              });
          }
        };

        if (window.esAdmin) {
          btnEditar.onclick = () => {
            inputNombre.style.display = "inline";
            selectUbicacion.style.display = "inline";
            btnGuardar.style.display = "inline";
            btnCancelar.style.display = "inline";
            btnEditar.style.display = "none";
          };

          btnGuardar.onclick = () => {
            const nuevoNombre = inputNombre.value.trim();
            const nuevaUbicacion = selectUbicacion.value.trim();

            if (!nuevoNombre || !nuevaUbicacion) {
              alert("Nombre y ubicación no pueden estar vacíos.");
              return;
            }

            db.ref("aulas/" + id).update({
              nombre: nuevoNombre,
              ubicacion: nuevaUbicacion
            }).then(() => {
              alert("Datos actualizados.");
              cargarCerraduras();
            });
          };

          btnCancelar.onclick = () => {
            inputNombre.style.display = "none";
            selectUbicacion.style.display = "none";
            btnGuardar.style.display = "none";
            btnCancelar.style.display = "none";
            btnEditar.style.display = "inline";
            inputNombre.value = info.nombre;
            selectUbicacion.value = info.ubicacion || "";
          };
        } else {
          btnEditar.style.display = "none";
        }

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
          selectUbicacion,
          btnEditar,
          btnGuardar,
          btnCancelar,
          btnToggle,
          span,
          btnHist
        );

        if (window.esAdmin) div.appendChild(btnEliminar);

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
