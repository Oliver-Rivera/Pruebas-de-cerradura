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
        renderizarBoton();
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

  // Ocultar botones para usuarios que no son admin
  function ocultarBotonesAdmin() {
  const botonLogin = document.getElementById("botonLogin");
  const botonCerradura = document.getElementById("botonAgregarCerradura");
  const botonUsuarios = document.getElementById("botonUsuarios");

  if (!window.esAdmin) {
    if (botonCerradura) botonCerradura.style.display = "none";
    if (botonUsuarios) botonUsuarios.style.display = "none";

    // Mover login al fondo
    if (botonLogin) botonLogin.style.bottom = "20px";
  } else {
    if (botonCerradura) {
      botonCerradura.style.display = "block";
      botonCerradura.style.bottom = "90px";
    }

    if (botonUsuarios) {
      botonUsuarios.style.display = "block";
      botonUsuarios.style.bottom = "20px";
    }

    // Volver a colocar login más arriba
    if (botonLogin) botonLogin.style.bottom = "170px";
  }
}



  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      console.log("Usuario activo:", user.email);
      window.usuarioActivo = user;

      // Leer el rol del usuario desde la base de datos
      db.ref(`Profesores/${user.uid}/rol`).once("value")
        .then(snapshot => {
          window.esAdmin = snapshot.val() === "admin";
          console.log("¿Es admin?", window.esAdmin);

          renderizarBoton();
          ocultarBotonesAdmin();

          Cerraduras.iniciar(); // Iniciar sistema de cerraduras
        })
        .catch(err => {
          console.error("Error al verificar rol:", err);
          window.esAdmin = false;

          renderizarBoton();
          ocultarBotonesAdmin();

          Cerraduras.iniciar();
        });

    } else {
      window.usuarioActivo = null;
      window.esAdmin = false;

      renderizarBoton();
      ocultarBotonesAdmin();

      Cerraduras.iniciar();
    }
  });

  return { abrir };
})();
