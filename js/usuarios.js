function cargarUsuarios() {
  listaUsuarios.innerHTML = "<li>Cargando...</li>";
  db.ref("Profesores").once("value").then(snap => {
    const data = snap.val() || {};
    listaUsuarios.innerHTML = "";

    Object.entries(data).forEach(([uid, d]) => {
      const li = document.createElement("li");
      li.style.marginBottom = "15px";

      // Etiquetas visibles
      const lblNombre = document.createElement("strong");
      lblNombre.textContent = `${d.nombre} ${d.apellido || ""}`;

      // Campos editables
      const inputNombre = document.createElement("input");
      const inputApellido = document.createElement("input");
      const inputCorreo = document.createElement("input");
      const inputRol = document.createElement("input");

      inputNombre.type = inputApellido.type = inputCorreo.type = inputRol.type = "text";
      inputNombre.value = d.nombre || "";
      inputApellido.value = d.apellido || "";
      inputCorreo.value = d.correo || "";
      inputRol.value = d.rol || "";

      inputNombre.style.display =
      inputApellido.style.display =
      inputCorreo.style.display =
      inputRol.style.display = "none";

      // Botones
      const btnEditar = document.createElement("button");
      btnEditar.textContent = "✏️ Editar";
      btnEditar.onclick = () => {
        btnEditar.style.display = "none";
        btnGuardar.style.display = "inline";

        inputNombre.style.display =
        inputApellido.style.display =
        inputCorreo.style.display =
        inputRol.style.display = "inline";
      };

      const btnGuardar = document.createElement("button");
      btnGuardar.textContent = "💾 Guardar";
      btnGuardar.style.display = "none";
      btnGuardar.onclick = () => {
        const nuevoNombre = inputNombre.value.trim();
        const nuevoApellido = inputApellido.value.trim();
        const nuevoCorreo = inputCorreo.value.trim();
        const nuevoRol = inputRol.value.trim();

        if (!nuevoNombre || !nuevoCorreo || !nuevoRol) {
          return alert("Completa al menos nombre, correo y rol.");
        }

        db.ref(`Profesores/${uid}`).update({
          nombre: nuevoNombre,
          apellido: nuevoApellido,
          correo: nuevoCorreo,
          rol: nuevoRol
        }).then(() => {
          alert("Datos actualizados.");
          cargarUsuarios();
        });
      };

      const spanUID = document.createElement("span");
      spanUID.textContent = "******";

      const btnMostrarUID = document.createElement("button");
      btnMostrarUID.textContent = "👁️ Mostrar UID";
      btnMostrarUID.onclick = () => {
        const oculto = spanUID.textContent === "******";
        spanUID.textContent = oculto ? uid : "******";
        btnMostrarUID.textContent = oculto ? "🙈 Ocultar UID" : "👁️ Mostrar UID";
      };

      const btnEliminar = document.createElement("button");
      btnEliminar.textContent = "🗑️ Eliminar";
      btnEliminar.onclick = () => {
        if (confirm("¿Eliminar este usuario?")) {
          db.ref(`Profesores/${uid}`).remove().then(() => cargarUsuarios());
        }
      };

      li.append(
        lblNombre, document.createElement("br"),
        inputNombre, inputApellido, inputCorreo, inputRol, document.createElement("br"),
        btnEditar, btnGuardar, btnMostrarUID, spanUID, btnEliminar
      );
      listaUsuarios.appendChild(li);
    });

    if (Object.keys(data).length === 0) {
      listaUsuarios.innerHTML = "<li>No hay usuarios registrados.</li>";
    }
  });

  cerrarUsuarios.onclick = () => {
  modalUsuarios.classList.remove("mostrar");
  formUsr.reset(); // limpia todos los campos
  formUsr.style.display = "none";
};

// También captura clics fuera del modal
window.addEventListener("click", e => {
  if (e.target === modalUsuarios) {
    modalUsuarios.classList.remove("mostrar");
    formUsr.reset();
    formUsr.style.display = "none";
  }
});

}
