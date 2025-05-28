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

function cambiarEstado(id, estadoActual) {
  const nuevo = estadoActual === "ABIERTO" ? "CERRADO" : "ABIERTO";
  db.ref(`aulas/${id}/estado`).set(nuevo);

  const now = new Date();
  const fecha = now.toLocaleDateString("es-MX");
  const hora = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  const usuario = firebase.auth().currentUser;
  if (!usuario) {
    alert("Debes iniciar sesión para registrar la acción.");
    return;
  }

  const uid = usuario.uid;
  db.ref(`Profesores/${uid}`).once("value").then(snapshot => {
    const datos = snapshot.val();
    const nombreCompleto = datos ? `${datos.nombre} ${datos.apellido}` : usuario.email;

    db.ref(`accesos/${id}`).push({
      fecha,
      hora,
      accion: nuevo,
      metodo: "Apertura Manual",
      usuario: nombreCompleto
    });
  }).catch(error => {
    console.error("Error obteniendo nombre del profesor:", error);
    db.ref(`accesos/${id}`).push({
      fecha,
      hora,
      accion: nuevo,
      metodo: "Apertura Manual",
      usuario: usuario.email // fallback
    });
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
        btnGuardarNombre.textContent = "💾 Guardar";
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
