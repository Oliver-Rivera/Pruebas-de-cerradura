const AgregarCerradura = (() => {
  // Referencias a elementos del DOM
  const modal = document.getElementById("modalAgregarCerradura");
  const botonAbrir = document.getElementById("botonAgregarCerradura");
  const botonCerrar = document.getElementById("cerrarAgregarCerradura");
  const botonGuardar = document.getElementById("agregarCerraduraBtn");
  const inputMAC = document.getElementById("macCerradura");
  const inputNombre = document.getElementById("nombreCerradura");
  const inputUbicacion = document.getElementById("ubicacionCerradura");

  // Limpia campos del formulario
  function limpiarFormulario() {
    inputMAC.value = "";
    inputNombre.value = "";
    inputUbicacion.value = "";
  }

  // Abre o cierra el modal
  function toggleModal() {
    closeAllModals(); // ← Esta función debe estar definida globalmente
    const visible = modal.classList.toggle("mostrar");
    if (!visible) limpiarFormulario();
  }

  // Cierra el modal
  function cerrarModal() {
    modal.classList.remove("mostrar");
    limpiarFormulario();
  }

  // Agrega cerradura a la DB
  function agregarCerradura() {
    const mac = inputMAC.value.trim();
    const nombre = inputNombre.value.trim();
    const ubicacion = inputUbicacion.value.trim();

    if (!mac || !nombre) {
      return alert("Completa ambos campos.");
    }

    db.ref(`aulas/${mac}`).set({
      estado: "CERRADO",
      nombre,
      ubicacion
    })
    .then(() => {
      alert("Cerradura agregada.");
      cerrarModal();
    })
    .catch(err => {
      alert("Error al agregar cerradura: " + err.message);
    });
  }

  // Inicializa eventos
  function iniciar() {
    botonAbrir.onclick = toggleModal;
    botonCerrar.onclick = cerrarModal;
    botonGuardar.onclick = agregarCerradura;
  }

  return {
    iniciar
  };
})();
