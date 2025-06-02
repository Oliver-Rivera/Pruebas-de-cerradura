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

 firebase.auth().onAuthStateChanged(user => {
  if (user) {
    console.log("Usuario activo:", user.email);
    window.usuarioActivo = user;

    // Verificar si el usuario es administrador
    db.ref(`Profesores/${user.uid}/rol`).once("value")
      .then(snapshot => {
        window.esAdmin = snapshot.val() === "admin";
        console.log("¿Es admin?", window.esAdmin);
        renderizarBoton();

        // ✅ Iniciar módulo cerraduras después de conocer el rol
        Cerraduras.iniciar();
      })
      .catch(err => {
        console.error("Error al verificar rol del usuario:", err);
        window.esAdmin = false;
        renderizarBoton();

        // ✅ Igual iniciamos las cerraduras (sin privilegios)
        Cerraduras.iniciar();
      });

  } else {
    window.usuarioActivo = null;
    window.esAdmin = false;
    renderizarBoton();

    // ✅ También en caso de no haber usuario
    Cerraduras.iniciar();
  }
});



  return { abrir };
})();
