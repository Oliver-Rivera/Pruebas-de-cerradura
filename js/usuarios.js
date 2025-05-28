const Usuarios = (() => {
  // Elementos del DOM
  const modalUsuarios = document.getElementById("modalUsuarios");
  const cerrarUsuarios = document.getElementById("cerrarUsuarios");
  const listaUsuarios = document.getElementById("listaUsuarios");
  const formUsr = document.getElementById("formularioNuevoUsuario");
  const botonUsuarios = document.getElementById("botonUsuarios");
  const btnMostrarFormulario = document.getElementById("btnMostrarFormularioUsuario");
  const formCrearUsuario = document.getElementById("formularioNuevoUsuario");
  
  const btnAgregarUsuario = document.getElementById("btnAgregarUsuario");
  const inputNuevoNombre = document.getElementById("nuevoNombre");
  const inputNuevoID = document.getElementById("nuevoID");
  const inputNuevoApellido = document.getElementById("nuevoApellido");
  const inputNuevoCorreo = document.getElementById("nuevoCorreo");
  const inputNuevoContraseña = document.getElementById("nuevaContraseña");
  const inputConfirmarContraseña = document.getElementById("confirmarContraseña");
  const inputNuevoRol = document.getElementById("nuevoRol");

  // Función para mostrar u ocultar inputs editables en cada usuario
  function toggleInputs(show, inputs) {
    const display = show ? "inline" : "none";
    inputs.forEach(input => input.style.display = display);
  }

  function cargarUsuarios() {
    listaUsuarios.innerHTML = "<li>Cargando...</li>";

    db.ref("Profesores").once("value").then(snap => {
      const data = snap.val() || {};
      listaUsuarios.innerHTML = "";

      if (Object.keys(data).length === 0) {
        listaUsuarios.innerHTML = "<li>No hay usuarios registrados.</li>";
        return;
      }

      Object.entries(data).forEach(([uid, d]) => {
        const li = document.createElement("li");
        li.style.marginBottom = "15px";

        // Mostrar nombre completo
        const lblNombre = document.createElement("strong");
        lblNombre.textContent = `${d.nombre} ${d.apellido || ""}`;

        // Inputs editables
        const inputNombre = document.createElement("input");
        const inputApellido = document.createElement("input");
        const inputCorreo = document.createElement("input");
        const inputRol = document.createElement("input");

        inputNombre.type = inputApellido.type = inputCorreo.type = inputRol.type = "text";
        inputNombre.value = d.nombre || "";
        inputApellido.value = d.apellido || "";
        inputCorreo.value = d.correo || "";
        inputRol.value = d.rol || "";

        toggleInputs(false, [inputNombre, inputApellido, inputCorreo, inputRol]);

        // Botón Editar
        const btnEditar = document.createElement("button");
        btnEditar.textContent = "✏️ Editar";

        // Botón Guardar
        const btnGuardar = document.createElement("button");
        btnGuardar.textContent = "💾 Guardar";
        btnGuardar.style.display = "none";

        btnEditar.onclick = () => {
          btnEditar.style.display = "none";
          btnGuardar.style.display = "inline";
          toggleInputs(true, [inputNombre, inputApellido, inputCorreo, inputRol]);
        };

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
          }).catch(err => {
            console.error(err);
            alert("Error al actualizar datos.");
          });
        };

        // Mostrar/Ocultar UID
        const spanUID = document.createElement("span");
        spanUID.textContent = "******";

        const btnMostrarUID = document.createElement("button");
        btnMostrarUID.textContent = "👁️ Mostrar UID";
        btnMostrarUID.onclick = () => {
          const oculto = spanUID.textContent === "******";
          spanUID.textContent = oculto ? uid : "******";
          btnMostrarUID.textContent = oculto ? "🙈 Ocultar UID" : "👁️ Mostrar UID";
        };

        // Botón Eliminar
        const btnEliminar = document.createElement("button");
        btnEliminar.textContent = "🗑️ Eliminar";
        btnEliminar.onclick = () => {
  if (confirm("¿Eliminar este usuario?")) {
    // 1. Eliminar datos en base de datos
    db.ref(`Profesores/${uid}`).remove()
      .then(() => {
        // 2. Marcar para eliminación en Authentication (revisado por backend)
        return db.ref(`EliminarUsuarios/${uid}`).set({
          correo: d.correo,
          nombre: d.nombre,
          fecha: new Date().toISOString()
        });
      })
      .then(() => {
        alert("Usuario eliminado de la base de datos. Falta eliminar de Authentication.");
        cargarUsuarios();
      })
      .catch(err => {
        console.error(err);
        alert("Error al eliminar usuario.");
      });
  }
};


        // Añadir todo al <li>
        li.append(
          lblNombre, document.createElement("br"),
          inputNombre, inputApellido, inputCorreo, inputRol, document.createElement("br"),
          btnEditar, btnGuardar, btnMostrarUID, spanUID, btnEliminar
        );

        listaUsuarios.appendChild(li);
      });
    }).catch(err => {
      console.error(err);
      listaUsuarios.innerHTML = "<li>Error al cargar usuarios.</li>";
    });
  }

  function iniciar() {
    // Abre modal y carga usuarios
    botonUsuarios.addEventListener("click", () => {
      closeAllModals?.(); // si está definida globalmente
      modalUsuarios.classList.add("mostrar");
      cargarUsuarios();
    });

    // Agregar nuevo usuario
    btnAgregarUsuario.addEventListener("click", () => {
      const nombre = inputNuevoNombre.value.trim();
      const id = inputNuevoID.value.trim();
      const apellido = inputNuevoApellido.value.trim();
      const correo = inputNuevoCorreo.value.trim();
      const contraseña = inputNuevoContraseña.value;
      const confirmar = inputConfirmarContraseña.value;
      const rol = inputNuevoRol.value.trim();

      if (!nombre || !correo || !contraseña || !confirmar || !rol || !id) {
        return alert("Completa todos los campos.");
      }

      if (contraseña !== confirmar) {
        return alert("Las contraseñas no coinciden.");
      }

      // Crear usuario con Firebase Authentication
      firebase.auth().createUserWithEmailAndPassword(correo, contraseña)
        .then(userCredential => {
          const uid = userCredential.user.uid;

          // Guardar en la base de datos
          return db.ref(`Profesores/${uid}`).set({
            nombre,
            apellido,
            correo,
            rol,
            id_control: id
          });
        })
        .then(() => {
          alert("Usuario registrado exitosamente.");

          // Limpiar formulario
          inputNuevoNombre.value = "";
          inputNuevoID.value = "";
          inputNuevoApellido.value = "";
          inputNuevoCorreo.value = "";
          inputNuevoContraseña.value = "";
          inputConfirmarContraseña.value = "";
          inputNuevoRol.value = "";

          formUsr.style.display = "none";
          cargarUsuarios();
        })
        .catch(error => {
          console.error(error);
          alert("Error al registrar: " + error.message);
        });
    });

    // Mostrar formulario de creación de usuario
    btnMostrarFormulario.addEventListener("click", () => {
      formCrearUsuario.style.display = "block";
    });

    // Cerrar modal con botón ✖
    cerrarUsuarios.addEventListener("click", () => {
      modalUsuarios.classList.remove("mostrar");
      formUsr.style.display = "none";
    });

    // Cerrar modal al hacer clic fuera de él
    window.addEventListener("click", e => {
      if (e.target === modalUsuarios) {
        modalUsuarios.classList.remove("mostrar");
        formUsr.style.display = "none";
      }
    });

    // Opcional: cerrar modal con tecla ESC
    window.addEventListener("keydown", e => {
      if (e.key === "Escape" && modalUsuarios.classList.contains("mostrar")) {
        modalUsuarios.classList.remove("mostrar");
        formUsr.style.display = "none";
      }
    });
  }

  return { iniciar };
})();
