const Horarios = (() => {
  const modal = document.getElementById("modalHorarios");
  const botonAbrir = document.getElementById("botonHorarios");
  const botonCerrar = document.getElementById("cerrarModalHorarios");
  const form = document.getElementById("formHorario");

  const selectAula = document.getElementById("selectAula");
  const selectProfesor = document.getElementById("selectProfesor");
  const lista = document.getElementById("listaHorarios");

  const inputHoraInicio = document.getElementById("inputHoraInicio");
  const inputHoraFin = document.getElementById("inputHoraFin");

  // Recolecta los días seleccionados
  const checkboxes = () =>
    [...document.querySelectorAll('input[name="dias"]:checked')].map(cb => cb.value);

  // Abre el modal de horarios. 
  // - Si no hay sesión, oculta el botón (se hará antes en iniciar()).
  // - Si existe sesión pero no es admin: muestra modal, oculta formulario.
  // - Si es admin: muestra modal con formulario.
  function abrirModal() {
    closeAllModals(); 
    modal.classList.add("mostrar");

    if (window.esAdmin) {
      form.style.display = "block";      // formulario visible
      cargarSelects();
      form.onsubmit = agregarHorario;    // habilita registro
    } else {
      form.style.display = "none";       // oculta formulario
      form.onsubmit = e => e.preventDefault(); // previene envío
    }

    mostrarHorarios();
  }

  // Cierra el modal y resetea campos
  function cerrarModal() {
    modal.classList.remove("mostrar");
    form.reset();
    document.querySelectorAll('input[name="dias"]').forEach(cb => cb.checked = false);
  }

  // Carga los <select> de aulas y de profesores (solo para admin)
  function cargarSelects() {
    selectAula.innerHTML = "";
    selectProfesor.innerHTML = "";

    // Carga aulas
    db.ref("aulas").once("value").then(snap => {
      Object.entries(snap.val() || {}).forEach(([id, info]) => {
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = info.nombre;
        selectAula.appendChild(opt);
      });
    });

    // Carga profesores
    db.ref("Profesores").once("value").then(snap => {
      Object.entries(snap.val() || {}).forEach(([uid, p]) => {
        const opt = document.createElement("option");
        opt.value = uid;
        opt.textContent = p.nombre + (p.apellido ? ` ${p.apellido}` : "");
        selectProfesor.appendChild(opt);
      });
    });
  }

  // Registra un nuevo horario
  function agregarHorario(e) {
    e.preventDefault();
    if (!window.esAdmin) {
      return alert("Solo un administrador puede agregar horarios.");
    }

    const dias = checkboxes();
    const hi = inputHoraInicio.value;
    const hf = inputHoraFin.value;
    const aula = selectAula.value;
    const prof = selectProfesor.value;

    if (!dias.length || !hi || !hf || !aula || !prof) {
      return alert("Completa todos los campos.");
    }

    const id = db.ref("Horarios").push().key;
    db.ref(`Horarios/${id}`).set({
      dia_semana: dias.join(","),
      hora_inicio: hi,
      hora_fin: hf,
      id_aula: aula,
      id_profesor: prof
    }).then(() => {
      alert("Horario agregado.");
      form.reset();
      document.querySelectorAll('input[name="dias"]').forEach(cb => cb.checked = false);
      mostrarHorarios();
    });
  }

  // Actualiza un horario existente
  function actualizarHorario(id) {
    if (!window.esAdmin) {
      return alert("Solo un administrador puede editar horarios.");
    }

    const dias = checkboxes();
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
      form.reset();
      document.querySelectorAll('input[name="dias"]').forEach(cb => cb.checked = false);
      mostrarHorarios();
      form.onsubmit = agregarHorario;
    });
  }

  // Muestra en pantalla los horarios:
  // - Si es admin: todos.
  // - Si no es admin: solo los que tengan h.id_profesor === window.uid
  function mostrarHorarios() {
    lista.innerHTML = "";

    db.ref("Horarios").once("value").then(snap => {
      const hs = snap.val() || {};

      Object.entries(hs).forEach(([hid, h]) => {
        // Filtrar para usuarios normales
        if (!window.esAdmin && h.id_profesor !== window.uid) {
          return;
        }

        const div = document.createElement("div");
        div.className = "horario";

        // Si es admin, mostramos botones de editar/eliminar
        const accionesHTML = window.esAdmin
          ? `
            <div class="acciones">
              <button class="btn-editar" data-id="${hid}">✏️ Editar</button>
              <button class="btn-eliminar" data-id="${hid}">🗑️ Eliminar</button>
            </div>
            `
          : "";

        div.innerHTML = `
          <strong>${h.dia_semana}</strong>
          <div class="horario-info">🕒 ${h.hora_inicio}–${h.hora_fin}</div>
          <div class="horario-info">🏫 Aula: ${h.id_aula}</div>
          <div class="horario-info">👤 Profesor: ${h.id_profesor}</div>
          ${accionesHTML}
        `;

        lista.appendChild(div);
      });

      // Solo el admin tiene botones activos
      if (window.esAdmin) {
        document.querySelectorAll(".btn-eliminar").forEach(btn => {
          btn.onclick = () => eliminarHorario(btn.dataset.id);
        });
        document.querySelectorAll(".btn-editar").forEach(btn => {
          btn.onclick = () => editarHorario(btn.dataset.id);
        });
      }
    });
  }

  // Elimina un horario
  function eliminarHorario(id) {
    db.ref(`Horarios/${id}`).remove().then(() => {
      alert("Horario eliminado.");
      mostrarHorarios();
    });
  }

  // Carga datos de un horario en el formulario para editar
  function editarHorario(id) {
    db.ref(`Horarios/${id}`).once("value").then(snap => {
      const h = snap.val();
      if (!h) return;

      // Marca los checkboxes
      document.querySelectorAll('input[name="dias"]').forEach(chk => {
        chk.checked = h.dia_semana.split(",").includes(chk.value);
      });
      inputHoraInicio.value = h.hora_inicio;
      inputHoraFin.value = h.hora_fin;
      selectAula.value = h.id_aula;
      selectProfesor.value = h.id_profesor;

      modal.classList.add("mostrar");
      form.onsubmit = e => {
        e.preventDefault();
        actualizarHorario(id);
      };
    });
  }

  // Inicializa los eventos y controla visibilidad del botón “Horarios”
  function iniciar() {
    // Si no hay usuario logueado, oculto todo el botón
    if (!window.uid) {
      botonAbrir.style.display = "none";
    } else {
      // Si hay usuario, muestro el botón
      botonAbrir.style.display = "block";
      botonAbrir.onclick = abrirModal;
    }

    botonCerrar.onclick = cerrarModal;
    form.onsubmit = agregarHorario;

    window.addEventListener("click", e => {
      if (e.target === modal) cerrarModal();
    });
  }

  return {
    iniciar
  };
})();
