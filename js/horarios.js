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

  const checkboxes = () =>
    [...document.querySelectorAll('input[name="dias"]:checked')].map(cb => cb.value);

  // Abrir modal y cargar datos
  function abrirModal() {
    closeAllModals();
    modal.classList.add("mostrar");
    cargarSelects();
    mostrarHorarios();
    form.onsubmit = agregarHorario; // Asegurar comportamiento base
  }

  function cerrarModal() {
    modal.classList.remove("mostrar");
    form.reset();
    document.querySelectorAll('input[name="dias"]').forEach(cb => cb.checked = false);
  }

  // Cargar opciones
  function cargarSelects() {
    selectAula.innerHTML = "";
    selectProfesor.innerHTML = "";

    db.ref("aulas").once("value").then(snap => {
      Object.entries(snap.val() || {}).forEach(([id, info]) => {
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = info.nombre;
        selectAula.appendChild(opt);
      });
    });

    db.ref("Profesores").once("value").then(snap => {
      Object.entries(snap.val() || {}).forEach(([uid, p]) => {
        const opt = document.createElement("option");
        opt.value = uid;
        opt.textContent = p.nombre + (p.apellido ? ` ${p.apellido}` : "");
        selectProfesor.appendChild(opt);
      });
    });
  }

  // Guardar nuevo horario
  function agregarHorario(e) {
    e.preventDefault();
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

  function actualizarHorario(id) {
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

  // Mostrar todos los horarios
  function mostrarHorarios() {
    lista.innerHTML = "";
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
        lista.appendChild(div);
      });

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

  function iniciar() {
    botonAbrir.onclick = abrirModal;
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
