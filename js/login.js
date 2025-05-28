const Login = (() => {
  const modal = document.getElementById("modalLogin");
  const cerrar = document.getElementById("cerrarLogin");
  const form = document.getElementById("formLogin");
  const inputCorreo = document.getElementById("correoLogin");
  const inputContraseña = document.getElementById("contraseñaLogin");

  const botonLogin = document.getElementById("botonLogin"); // ID del botón de login/logout

  function abrir() {
    closeAllModals?.(); // cierra otros modales si existe
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
        const user = cred.user;
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
      })
      .catch(error => {
        console.error("Error al cerrar sesión:", error);
      });
  }

  // Botón dinámico login/logout
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

  // Mantener activo el botón correcto al recargar
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      console.log("Usuario activo:", user.email);
      window.usuarioActivo = user; // 🔥 Puedes usar esto en otras partes
    } else {
      window.usuarioActivo = null;
    }
    renderizarBoton();
  });

  return { abrir };
})();
