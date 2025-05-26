// 🔧 Configuración de Firebase
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

function closeAllModals() {
  modalHist.classList.remove("mostrar");
  modalUsuarios.classList.remove("mostrar");
  modalAgregarCerradura.classList.remove("mostrar");
}


// ─── CERRADURAS Y SU HISTORIAL ───────────────────────────────────────────────
const contenedor = document.getElementById("cerradurasContainer");
const modalHist = document.getElementById("modalHistorial");
const cerrarHist = document.getElementById("cerrarModal");
const tituloHist = document.getElementById("tituloHistorial");
const contenidoHist = document.getElementById("contenidoHistorial");

// Cierra historial con la X
cerrarHist.onclick = () => modalHist.classList.remove("mostrar");

// Cierra cualquier modal con clic fuera
window.addEventListener("click", (e) => {
  if (e.target === modalHist) modalHist.classList.remove("mostrar");
  if (e.target === modalUsuarios) modalUsuarios.classList.remove("mostrar");
  if (e.target === modalAgregarCerradura) modalAgregarCerradura.classList.remove("mostrar");
});

// Formato de fecha/hora
function getHora() {
  const now = new Date();
  return now.toLocaleDateString("es-MX") + " " + now.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Cambiar estado y registrar en historial
function cambiarEstado(id, estadoActual) {
  const nuevo = estadoActual === "ABIERTO" ? "CERRADO" : "ABIERTO";
  db.ref(`aulas/${id}/estado`).set(nuevo);

  const now = new Date();
  const fecha = now.toLocaleDateString("es-MX");
  const hora = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  db.ref(`accesos/${id}`).push({
    fecha,
    hora,
    accion: nuevo,
    metodo: "Apertura Manual",
    usuario: "Admin",
    //usuario: usuarioActual.email,
    // puedes agregar aquí `nombre` si lo tienes disponible
  });
}


// Mostrar historial de la cerradura
function mostrarHistorial(id, nombreMostrado) {
  db.ref(`accesos/${id}`).limitToLast(10).once("value")
    .then(snapshot => {
      const registros = snapshot.val();
      tituloHist.textContent = `Historial de ${nombreMostrado}`;
      contenidoHist.innerHTML = "";

      if (registros) {
        Object.values(registros).reverse().forEach(r => {
          const li = document.createElement("li");
          let texto = `${r.fecha} ${r.hora}  — ${r.accion} ${r.metodo} por ${r.usuario}`;
          
          if (r.nombre) {
            texto += ` (${r.nombre})`;
          }
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


// Cargar y renderizar cerraduras
function cargarCerraduras() {
  db.ref("aulas").on("value", snapshot => {
    contenedor.innerHTML = "";
    const datos = snapshot.val() || {};

    Object.entries(datos).forEach(([id, info]) => {
      const div = document.createElement("div");
      div.className = "cerradura";

      // Título actual
      const nombre = document.createElement("h2");
      nombre.textContent = info.nombre;

      // Campo de texto oculto para renombrar
      const inputNombre = document.createElement("input");
      inputNombre.type = "text";
      inputNombre.value = info.nombre;
      inputNombre.style.display = "none";
      inputNombre.style.marginRight = "5px";

      // Botón para activar edición
      const btnEditarNombre = document.createElement("button");
      btnEditarNombre.textContent = "✏️ Renombrar";
      btnEditarNombre.onclick = () => {
        inputNombre.style.display = "inline";
        btnGuardarNombre.style.display = "inline";
        btnEditarNombre.style.display = "none";
      };

      // Botón para guardar nuevo nombre
      const btnGuardarNombre = document.createElement("button");
      btnGuardarNombre.textContent = "💾 Guardar";
      btnGuardarNombre.style.display = "none";
      btnGuardarNombre.onclick = () => {
        const nuevoNombre = inputNombre.value.trim();
        if (nuevoNombre !== "") {
          db.ref("aulas/" + id + "/nombre").set(nuevoNombre).then(() => {
            alert("Nombre actualizado.");
            cargarCerraduras(); // Recargar lista
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


window.onload = cargarCerraduras;

// ─── USUARIOS ────────────────────────────────────────────────────────────────
const modalUsuarios = document.getElementById("modalUsuarios");
const cerrarUsuarios = document.getElementById("cerrarUsuarios");
const listaUsuarios = document.getElementById("listaUsuarios");
const botonUsuarios = document.getElementById("botonUsuarios");
const btnMostrarFormUsr = document.getElementById("btnMostrarFormulario");
const formUsr = document.getElementById("formularioNuevoUsuario");
const inputNombreUsr = document.getElementById("nuevoNombre");
const inputUIDUsr = document.getElementById("nuevoID");
const inputApellidoUsr = document.getElementById("nuevoApellido");
const inputCorreo = document.getElementById("nuevoCorreo");
const inputContraseña = document.getElementById("nuevoContraseña");
const inputConfirmarCont = document.getElementById("confirmarContraseña");
const inputRol = document.getElementById("nuevoRol");

const btnAgregarUsr = document.getElementById("btnAgregarUsuario");

// Alterna modal de usuarios
botonUsuarios.onclick = () => {
  closeAllModals();                                  // ① cierra cualquier otro modal
  const visible = modalUsuarios.classList.toggle("mostrar");
  if (visible) {
    cargarUsuarios();
  } else {
    inputNombreUsr.value = "";
    inputUIDUsr.value = "";
    inputApellidoUsr.value = "";
    inputCorreo.value = "";
    inputContraseña.value = "";
    inputConfirmarCont.value = "";
    inputRol.value = "";
    formUsr.style.display = "none";
  }
};

cerrarUsuarios.onclick = () => {
  modalUsuarios.classList.remove("mostrar");
  inputNombreUsr.value = "";
  inputUIDUsr.value = "";
  inputApellidoUsr.value = "";
  inputCorreo.value = "";
  inputContraseña.value = "";
  inputConfirmarCont.value = "";
  inputRol.value = "";
  formUsr.style.display = "none";
};

btnMostrarFormUsr.onclick = () => {
  formUsr.style.display = formUsr.style.display === "none" ? "block" : "none";
};

function cargarUsuarios() {
  listaUsuarios.innerHTML = "<li>Cargando...</li>";
  db.ref("Profesores").once("value").then(snap => {
    const data = snap.val() || {};
    listaUsuarios.innerHTML = "";

    Object.entries(data).forEach(([uid, d]) => {
      const li = document.createElement("li");
      li.style.marginBottom = "10px";

      const lbl = document.createElement("strong");
      lbl.textContent = d.nombre + " ";

      const inp = document.createElement("input");
      inp.type = "text"; inp.value = d.nombre; inp.style.display = "none";

      const btnEd = document.createElement("button");
      btnEd.textContent = "✏️ Editar";
      btnEd.onclick = () => {
        inp.style.display = "inline";
        btnEd.style.display = "none";
        btnSv.style.display = "inline";
      };

      const btnSv = document.createElement("button");
      btnSv.textContent = "💾 Guardar"; btnSv.style.display = "none";
      btnSv.onclick = () => {
        const nuevo = inp.value.trim();
        if (nuevo) {
          db.ref(`Profesores/${uid}/nombre`).set(nuevo).then(() => {
            alert("Nombre actualizado.");
            cargarUsuarios();
          });
        }
      };

      const span = document.createElement("span");
      span.textContent = "******";

      const btnSee = document.createElement("button");
      btnSee.textContent = "👁️ Mostrar UID";
      btnSee.onclick = () => {
        const show = span.textContent === "******";
        span.textContent = show ? uid : "******";
        btnSee.textContent = show ? "🙈 Ocultar" : "👁️ Mostrar UID";
      };

      const btnDel = document.createElement("button");
      btnDel.textContent = "🗑️ Eliminar";
      btnDel.onclick = () => {
        if (confirm("¿Eliminar este usuario?")) {
          db.ref(`Profesores/${uid}`).remove();
          cargarUsuarios();
        }
      };

      li.append(lbl, inp, btnEd, btnSv, span, btnSee, btnDel);
      listaUsuarios.appendChild(li);
    });

    if (Object.keys(data).length === 0) {
      listaUsuarios.innerHTML = "<li>No hay usuarios registrados.</li>";
    }
  });
}

btnAgregarUsr.onclick = () => {
  const nombre = inputNombreUsr.value.trim();
  const uidManual = inputUIDUsr.value.trim(); // lo usaremos solo como campo decorativo
  const apellido = inputApellidoUsr.value.trim();
  const correo = inputCorreo.value.trim();
  const contraseña = inputContraseña.value.trim();
  const confirmarCont = inputConfirmarCont.value.trim();
  const rol = inputRol.value.trim();

  if (!nombre || !uidManual || !apellido || !correo || !contraseña || !confirmarCont || !rol) {
    return alert("Completa todos los campos.");
  }
  if (contraseña !== confirmarCont) {
    return alert("Las contraseñas no coinciden.");
  }

  // Paso 1: Crear usuario en Firebase Auth
  auth.createUserWithEmailAndPassword(correo, contraseña)
    .then(userCredential => {
      const uid = userCredential.user.uid;

      // Paso 2: Guardar datos en base de datos
      return db.ref(`Profesores/${uid}`).set({
        nombre,
        apellido,
        correo,
        rol,
        permisos: true,
        numero_control: uidManual
      });
    })
    .then(() => {
      alert("Usuario creado y registrado correctamente.");
      inputNombreUsr.value = "";
      inputUIDUsr.value = "";
      inputApellidoUsr.value = "";
      inputCorreo.value = "";
      inputContraseña.value = "";
      inputConfirmarCont.value = "";
      inputRol.value = "";
      formUsr.style.display = "none";
      cargarUsuarios();
    })
    .catch(err => {
      alert("Error al registrar: " + err.message);
    });
};



// ─── AGREGAR CERRADURA ──────────────────────────────────────────────────────
const modalAgregarCerradura = document.getElementById("modalAgregarCerradura");
const botonAgregarCerradura = document.getElementById("botonAgregarCerradura");
const cerrarAgregarCerradura = document.getElementById("cerrarAgregarCerradura");
const btnAgregarC = document.getElementById("agregarCerraduraBtn");
const inputMAC = document.getElementById("macCerradura");
const inputNombreC = document.getElementById("nombreCerradura");
const inputUbicacionC = document.getElementById("ubicacionCerradura");

botonAgregarCerradura.onclick = () => {
  closeAllModals();                                  // ① cierra cualquier otro modal
  const vis = modalAgregarCerradura.classList.toggle("mostrar");
  if (!vis) {
    inputMAC.value = "";
    inputNombreC.value = "";
    inputUbicacionC.value = "";
  }
};

cerrarAgregarCerradura.onclick = () => {
  modalAgregarCerradura.classList.remove("mostrar");
  inputMAC.value = "";
  inputNombreC.value = "";
  inputUbicacionC.value = "";
};

btnAgregarC.onclick = () => {
  const mac = inputMAC.value.trim();
  const nombre = inputNombreC.value.trim()
  const ubicacionC = inputUbicacionC.value.trim()
  if (!mac || !nombre) {
    return alert("Completa ambos campos.");
  }
  db.ref(`aulas/${mac}`).set({ estado: "CERRADO", nombre, ubicacion: ubicacionC})
    .then(() => {
      alert("Cerradura agregada.");
      modalAgregarCerradura.classList.remove("mostrar");
      inputMAC.value = "";
      inputNombreC.value = "";
      inputUbicacionC.value = "";
    })
    .catch(err => alert("Error al agregar cerradura: " + err.message));
};


// — referencias DOM —
const botonHorarios = document.getElementById("botonHorarios");
const modalHorarios = document.getElementById("modalHorarios");
const cerrarModalHorarios = document.getElementById("cerrarModalHorarios");
const formHorario = document.getElementById("formHorario");
const selectAula = document.getElementById("selectAula");
const selectProfesor = document.getElementById("selectProfesor");
const listaHorarios = document.getElementById("listaHorarios");
const selectDia = document.getElementById("selectDia");  // NUEVO: referencia al <select> del día
const inputHoraInicio = document.getElementById("inputHoraInicio");
const inputHoraFin = document.getElementById("inputHoraFin");

// — Abrir/cerrar modal —
botonHorarios.onclick = () => {
  closeAllModals();
  modalHorarios.classList.toggle("mostrar");
  if (modalHorarios.classList.contains("mostrar")) {
    cargarSelects();
    mostrarHorarios();
  }
};
cerrarModalHorarios.onclick = () => modalHorarios.classList.remove("mostrar");
window.addEventListener("click", e => {
  if (e.target === modalHorarios) modalHorarios.classList.remove("mostrar");
});

// — Rellenar los <select> de aulas y profesores —
function cargarSelects() {
  selectAula.innerHTML = "";
  selectProfesor.innerHTML = "";

  db.ref("aulas").once("value").then(snap => {
    const aulas = snap.val() || {};
    Object.entries(aulas).forEach(([id, info]) => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = info.nombre;
      selectAula.appendChild(opt);
    });
  });

  db.ref("Profesores").once("value").then(snap => {
    const profs = snap.val() || {};
    Object.entries(profs).forEach(([uid, d]) => {
      const opt = document.createElement("option");
      opt.value = uid;
      opt.textContent = d.nombre + (d.apellido ? " " + d.apellido : "");
      selectProfesor.appendChild(opt);
    });
  });
}

// — Guardar nuevo horario —
function agregarHorario(e) {
  e.preventDefault();
const checkboxes = document.querySelectorAll('input[name="dias"]');
const dias = [...document.querySelectorAll('input[name="dias"]:checked')].map(d => d.value);
  const hi = inputHoraInicio.value;
  const hf = inputHoraFin.value;
  const aula = selectAula.value;
  const prof = selectProfesor.value;
  if (!dias.length || !hi || !hf || !aula || !prof) {
    return alert("Completa todos los campos del horario.");
  }

  const idHorario = db.ref("Horarios").push().key;
  db.ref(`Horarios/${idHorario}`).set({
    dia_semana: dias.join(","),
    hora_inicio: hi,
    hora_fin: hf,
    id_aula: aula,
    id_profesor: prof
  }).then(() => {
    alert("Horario agregado.");
    formHorario.reset();
    checkboxes.forEach(chk => chk.checked = false);
    mostrarHorarios();
  });
}
formHorario.onsubmit = agregarHorario;

// — Mostrar lista de horarios existentes —
function mostrarHorarios() {
  listaHorarios.innerHTML = "";
  db.ref("Horarios").once("value").then(snap => {
    const hs = snap.val() || {};
    Object.entries(hs).forEach(([hid, h]) => {
      const div = document.createElement("div");
      div.className = "horario";
      div.innerHTML = `
        <strong>${h.dia_semana}</strong>
        <div class="horario-info">🕒 ${h.hora_inicio}–${h.hora_fin}</div>
        <div class="horario-info">🏫 Aula: ${h.id_aula}</div>
        <div class="horario-info">👤 Profesor: ${h.id_profesor}</div>
        <div class="acciones">
          <button class="btn-editar" data-id="${hid}">✏️ Editar</button>
          <button class="btn-eliminar" data-id="${hid}">🗑️ Eliminar</button>
        </div>
      `;
      listaHorarios.appendChild(div);
    });

    // Botones funcionales
    document.querySelectorAll(".btn-eliminar").forEach(btn => {
      btn.onclick = () => eliminarHorario(btn.dataset.id);
    });

    document.querySelectorAll(".btn-editar").forEach(btn => {
      btn.onclick = () => editarHorario(btn.dataset.id);
    });
  });
}


function eliminarHorario(id) {
  if (confirm("¿Seguro que deseas eliminar este horario?")) {
    db.ref(`Horarios/${id}`).remove().then(() => {
      alert("Horario eliminado.");
      mostrarHorarios();
    });
  }
}

function editarHorario(id) {
  db.ref(`Horarios/${id}`).once("value").then(snap => {
    const h = snap.val();
    if (!h) return;

    // Rellenar formulario
    const checkboxes = document.querySelectorAll('#diasSemanaCheckboxes input[type=checkbox]');
    checkboxes.forEach(chk => {
      chk.checked = h.dia_semana.split(",").includes(chk.value);
    });

    inputHoraInicio.value = h.hora_inicio;
    inputHoraFin.value = h.hora_fin;
    selectAula.value = h.id_aula;
    selectProfesor.value = h.id_profesor;

    // Abrir modal
    modalHorarios.classList.add("mostrar");

    // Al guardar, sobreescribe en lugar de crear uno nuevo
    formHorario.onsubmit = e => {
      e.preventDefault();
      const dias = Array.from(checkboxes).filter(chk => chk.checked).map(chk => chk.value);
      const hi = inputHoraInicio.value;
      const hf = inputHoraFin.value;
      const aula = selectAula.value;
      const prof = selectProfesor.value;
      if (!dias.length || !hi || !hf || !aula || !prof) {
        return alert("Completa todos los campos.");
      }

      db.ref(`Horarios/${id}`).set({
        dia_semana: dias.join(","),
        hora_inicio: hi,
        hora_fin: hf,
        id_aula: aula,
        id_profesor: prof
      }).then(() => {
        alert("Horario editado.");
        formHorario.reset();
        checkboxes.forEach(chk => chk.checked = false);
        mostrarHorarios();

        // Restaurar comportamiento original de agregar
        formHorario.onsubmit = agregarHorario;
      });
    };
  });
}


/*Registro y login de usuarios*/



/*async function puedeAcceder(aulaId, profesorUid) {
  const now = new Date();
  const dia = now.toLocaleDateString("es-MX", { weekday: "long" }); // e.g. "Martes"
  const horaActual = now.toTimeString().substr(0,5); // "HH:MM"

  const snap = await db.ref("Horarios")
    .orderByChild("id_aula")
    .equalTo(aulaId)
    .once("value");
  const horarios = snap.val() || {};
  
  return Object.values(horarios).some(h => {
    const dias = h.dia_semana.split(",");
    return dias.includes(dia)
      && horaActual >= h.hora_inicio
      && horaActual <= h.hora_fin
      && h.id_profesor === profesorUid;
  });
}

async function cambiarEstado(id, estadoActual) {
  const userUid = // aquí toma el UID real del profesor logueado ;
  const autorizado = await puedeAcceder(id, userUid);
  if (!autorizado) {
    return alert("No tienes permiso de horario para abrir/cerrar en este momento.");
  }

  const nuevo = estadoActual === "ABIERTO" ? "CERRADO" : "ABIERTO";
  db.ref(`aulas/${id}/estado`).set(nuevo);

  const now = new Date();
  const fecha = now.toLocaleDateString("es-MX");
  const hora = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  db.ref(`accesos/${id}`).push({
    fecha, hora, accion: nuevo, metodo: "Manual", usuario: userUid
  });
}
 */