//Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBOFqGZprPCapjuuby1_Fh5mcBWSaPwDD0",
  authDomain: "control-acceso-9b227.firebaseapp.com",
  databaseURL: "https://control-acceso-9b227-default-rtdb.firebaseio.com",
  projectId: "control-acceso-9b227",
  storageBucket: "control-acceso-9b227.firebasestorage.app",
  messagingSenderId: "515116159754",
  appId: "1:515116159754:web:80d6608c16a1cde26d20f3",
  measurementId: "G-GPDFRS6230"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// Función para cerrar y limpiar todos los modales
function closeAllModals() {
  // Historial
  const modalHist = document.getElementById("modalHistorial");
  if (modalHist) modalHist.classList.remove("mostrar");

  // Usuarios
  const modalUsuarios = document.getElementById("modalUsuarios");
  if (modalUsuarios) {
    modalUsuarios.classList.remove("mostrar");
    const formUsr = document.getElementById("formularioNuevoUsuario");
    if (formUsr) formUsr.style.display = "none";
    ["nuevoNombre", "nuevoID", "nuevoApellido", "nuevoCorreo", "nuevoContraseña", "confirmarContraseña", "nuevoRol"]
      .forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = "";
      });
  }

  // Cerraduras
  const modalAgregarCerradura = document.getElementById("modalAgregarCerradura");
  if (modalAgregarCerradura) {
    modalAgregarCerradura.classList.remove("mostrar");
    ["inputMAC", "inputNombre", "inputEstado"].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.value = "";
    });
  }

  // Horarios
  const modalHorarios = document.getElementById("modalHorarios");
  if (modalHorarios) {
    modalHorarios.classList.remove("mostrar");
    const formHorario = document.getElementById("formHorario");
    if (formHorario) {
      formHorario.reset();
      formHorario.onsubmit = Horarios.iniciar; // restaurar en caso de edición previa
    }
    document.querySelectorAll('input[name="dias"]').forEach(cb => cb.checked = false);
  }
}

//  Inicialización de módulos
window.onload = () => {
  if (typeof Historial !== "undefined" && Historial.iniciar) Historial.iniciar();
  if (typeof Usuarios !== "undefined" && Usuarios.iniciar) Usuarios.iniciar();
  if (typeof Cerraduras !== "undefined" && Cerraduras.iniciar) Cerraduras.iniciar();
  if (typeof Horarios !== "undefined" && Horarios.iniciar) Horarios.iniciar();
  if (typeof AgregarCerradura !== "undefined" && AgregarCerradura.iniciar) AgregarCerradura.iniciar();

};
