const Login = (() => {
  const modal = document.getElementById("modalLogin");
  const cerrar = document.getElementById("cerrarLogin");
  const form = document.getElementById("formLogin");
  const inputCorreo = document.getElementById("correoLogin");
  const inputContraseña = document.getElementById("contraseñaLogin");
  const botonLogin = document.getElementById("botonLogin"); // Botón login/logout

  function abrir() {
    closeAllModals?.(); // Por si tienes una función para cerrar otros modales
    modal.classList.add("mostrar");
  }

  function cerrarModal() {
    modal.classList.remove("mostrar");
    form.reset();
  }

  // Iniciar sesión
  form.addEventListener("submit", e => {
    e.preventDefault();
    const correo = inputCorreo.value.trim();
    const contraseña = inputContraseña.value;

    if (!correo || !contraseña) return alert("Completa todos los campos.");

    firebase.auth().signInWithEmailAndPassword(correo, contraseña)
      .then(cred => {
        cerrarModal();
        alert("Sesión iniciada correctamente.");
        // renderizarBoton y ocultar botones se harán en onAuthStateChanged
      })
      .catch(error => {
        console.error(error);
        alert("Error: " + error.message);
      });
  });

  cerrar.onclick = cerrarModal;
  window.addEventListener("click", e => {
    if (e.target === modal) cerrarModal();
  });

  // Cerrar sesión
  function cerrarSesion() {
    firebase.auth().signOut()
      .then(() => {
        alert("Sesión cerrada.");
        renderizarBoton();
        ocultarBotonesAdmin(); // ocultar al cerrar sesión
      })
      .catch(error => {
        console.error("Error al cerrar sesión:", error);
      });
  }

  // Mostrar u ocultar botón login/logout
  function renderizarBoton() {
    const user = firebase.auth().currentUser;

    if (!botonLogin) return;

    if (user) {
      botonLogin.innerText = "🔓 Cerrar sesión";
      botonLogin.onclick = cerrarSesion;
    } else {
      botonLogin.innerText = "🔐 Iniciar Sesión";
      botonLogin.onclick = abrir;
    }
  }

  // Ocultar o mostrar botones de admin
  function ocultarBotonesAdmin() {
    const botonLoginEl = document.getElementById("botonLogin");
    const botonCerradura = document.getElementById("botonAgregarCerradura");
    const botonUsuarios = document.getElementById("botonUsuarios");
    const botonHorarios = document.getElementById("botonHorarios");

    if (!window.esAdmin) {
      if (botonCerradura) botonCerradura.style.display = "none";
      if (botonUsuarios) botonUsuarios.style.display = "none";

      // Además, si no es admin pero inició sesión, mantenemos Horarios visible:
      if (botonHorarios) botonHorarios.style.display = window.uid ? "block" : "none";

      // Mover login al fondo
      if (botonLoginEl) botonLoginEl.style.bottom = "20px";
    } else {
      // Para admin: asegurarse de que todo esté a la vista y en su posición
      if (botonCerradura) {
        botonCerradura.style.display = "block";
        botonCerradura.style.bottom = "120px";
      }
      if (botonUsuarios) {
        botonUsuarios.style.display = "block";
        botonUsuarios.style.bottom = "50px";
      }
      if (botonHorarios) {
        botonHorarios.style.display = "block";
        //botonHorarios.style.bottom = "350px";
      }
      // Volver a colocar login más arriba
      if (botonLoginEl) botonLoginEl.style.bottom = "200px";
    }
  }

  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      console.log("Usuario activo:", user.email);
      window.usuarioActivo = user;
      window.uid = user.uid;

      // Leer el rol del usuario desde la base de datos
      db.ref(`Profesores/${user.uid}/rol`).once("value")
        .then(snapshot => {
          window.esAdmin = snapshot.val() === "admin";
          console.log("¿Es admin?", window.esAdmin);

          renderizarBoton();
          ocultarBotonesAdmin();

          // Iniciar módulo de cerraduras y horarios después de conocer el rol
          Cerraduras.iniciar();
          Horarios.iniciar();
        })
        .catch(err => {
          console.error("Error al verificar rol:", err);
          window.esAdmin = false;

          renderizarBoton();
          ocultarBotonesAdmin();

          Cerraduras.iniciar();
          Horarios.iniciar();
        });

    } else {
      // No hay usuario
      window.usuarioActivo = null;
      window.uid = null;
      window.esAdmin = false;

      renderizarBoton();
      ocultarBotonesAdmin();

      Cerraduras.iniciar();
      Horarios.iniciar();
    }
  });

  return { abrir };
})();
