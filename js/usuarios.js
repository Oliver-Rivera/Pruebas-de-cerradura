const Usuarios = (() => { 
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

        const lblNombre = document.createElement("strong");
        lblNombre.textContent = `${d.nombre} ${d.apellido || ""}`;

        const inputNombre = document.createElement("input");
        const inputApellido = document.createElement("input");
        const inputCorreo = document.createElement("input");
        const inputRol = document.createElement("select");

        inputNombre.type = inputApellido.type = inputCorreo.type = "text";
        inputNombre.value = d.nombre || "";
        inputApellido.value = d.apellido || "";
        inputCorreo.value = d.correo || "";

        ["admin", "profesor"].forEach(rol => {
          const option = document.createElement("option");
          option.value = rol;
          option.textContent = rol.charAt(0).toUpperCase() + rol.slice(1);
          if (d.rol === rol) option.selected = true;
          inputRol.appendChild(option);
        });

        toggleInputs(false, [inputNombre, inputApellido, inputCorreo, inputRol]);

        const btnEditar = document.createElement("button");
        btnEditar.textContent = "✏️ Editar";

        const btnGuardar = document.createElement("button");
        btnGuardar.textContent = "💾 Guardar";
        btnGuardar.style.display = "none";

        const btnCancelarEdicion = document.createElement("button");
btnCancelarEdicion.textContent = "❌ Cancelar";
btnCancelarEdicion.style.display = "none";

btnEditar.onclick = () => {
  if (!window.esAdmin) return alert("Solo un administrador puede editar usuarios.");
  btnEditar.style.display = "none";
  btnGuardar.style.display = "inline";
  btnCancelarEdicion.style.display = "inline";
  toggleInputs(true, [inputNombre, inputApellido, inputCorreo, inputRol]);
};

btnCancelarEdicion.onclick = () => {
  inputNombre.value = d.nombre || "";
  inputApellido.value = d.apellido || "";
  inputCorreo.value = d.correo || "";
  inputRol.value = d.rol || "";
  btnEditar.style.display = "inline";
  btnGuardar.style.display = "none";
  btnCancelarEdicion.style.display = "none";
  toggleInputs(false, [inputNombre, inputApellido, inputCorreo, inputRol]);
};


        btnGuardar.onclick = () => {
          const nuevoNombre = inputNombre.value.trim();
          const nuevoApellido = inputApellido.value.trim();
          const nuevoCorreo = inputCorreo.value.trim();
          const nuevoRol = inputRol.value;

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
          if (!window.esAdmin) return alert("Solo un administrador puede eliminar usuarios.");
          if (confirm("¿Eliminar este usuario?")) {
            db.ref(`Profesores/${uid}`).remove()
              .then(() => {
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

        li.append(
          lblNombre, document.createElement("br"),
          inputNombre, inputApellido, inputCorreo, inputRol, document.createElement("br"),
          btnEditar, btnGuardar, btnCancelarEdicion, btnMostrarUID, spanUID, btnEliminar
        );


        listaUsuarios.appendChild(li);
      });
    }).catch(err => {
      console.error(err);
      listaUsuarios.innerHTML = "<li>Error al cargar usuarios.</li>";
    });
  }

  function iniciar() {
    botonUsuarios.addEventListener("click", () => {
      closeAllModals?.();
      modalUsuarios.classList.add("mostrar");
      cargarUsuarios();
    });

    btnAgregarUsuario.addEventListener("click", () => {
      if (!window.esAdmin) return alert("Solo un administrador puede agregar usuarios.");

      const nombre = inputNuevoNombre.value.trim();
      const id = inputNuevoID.value.trim();
      const apellido = inputNuevoApellido.value.trim();
      const correo = inputNuevoCorreo.value.trim();
      const contraseña = inputNuevoContraseña.value;
      const confirmar = inputConfirmarContraseña.value;
      const rol = inputNuevoRol.value;

      if (!nombre || !correo || !contraseña || !confirmar || !rol || !id) {
        return alert("Completa todos los campos.");
      }

      if (contraseña !== confirmar) {
        return alert("Las contraseñas no coinciden.");
      }

      firebase.auth().createUserWithEmailAndPassword(correo, contraseña)
        .then(userCredential => {
          const uid = userCredential.user.uid;

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

    btnMostrarFormulario.addEventListener("click", () => {
      if (!window.esAdmin) return alert("Solo un administrador puede ver el formulario de registro.");
      formCrearUsuario.style.display = "block";
    });

    cerrarUsuarios.addEventListener("click", () => {
      modalUsuarios.classList.remove("mostrar");
      formUsr.style.display = "none";
    });

    window.addEventListener("click", e => {
      if (e.target === modalUsuarios) {
        modalUsuarios.classList.remove("mostrar");
        formUsr.style.display = "none";
      }
    });

    window.addEventListener("keydown", e => {
      if (e.key === "Escape" && modalUsuarios.classList.contains("mostrar")) {
        modalUsuarios.classList.remove("mostrar");
        formUsr.style.display = "none";
      }
    });

    const btnCancelarCrearUsuario = document.getElementById("btnCancelarCrearUsuario");
      btnCancelarCrearUsuario.addEventListener("click", () => {
      formUsr.style.display = "none";
      inputNuevoNombre.value = "";
      inputNuevoID.value = "";
      inputNuevoApellido.value = "";
      inputNuevoCorreo.value = "";
      inputNuevoContraseña.value = "";
      inputConfirmarContraseña.value = "";
      inputNuevoRol.value = "";
    });

  }

  return { iniciar };
})();
