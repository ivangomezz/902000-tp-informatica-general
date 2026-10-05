// --- CONFIGURACIÓN DE APIS Y ESTADO DEL JUEGO ---
const API_SOUTHPARK_URL = "https://spapi.dev/api/characters";
const MAX_ERRORES = 3;
const TOTAL_PREGUNTAS = 5;

let preguntas = [];
let indicePreguntaActual = 0;
let erroresCometidos = 0;
let aciertos = 0;

// --- ELEMENTOS DEL DOM ---
let pantallaInicio, pantallaJuego, pantallaResultado;
let btnComenzar, btnReiniciar, btnJugarNuevo;
let textoPregunta, opcionesContainer, corazonesSpan;
let numPreguntaSpan, totalPreguntasSpan, contadorAciertosSpan;
let tituloResultado, mensajeResultado;

document.addEventListener("DOMContentLoaded", () => {
    // Vínculos con los elementos del HTML
    pantallaInicio = document.getElementById("pantalla-inicio");
    pantallaJuego = document.getElementById("pantalla-juego");
    pantallaResultado = document.getElementById("pantalla-resultado");

    btnComenzar = document.getElementById("btn-comenzar");
    btnReiniciar = document.getElementById("btn-reiniciar");
    btnJugarNuevo = document.getElementById("btn-jugar-nuevo");

    textoPregunta = document.getElementById("texto-pregunta");
    opcionesContainer = document.getElementById("opciones-container");
    corazonesSpan = document.getElementById("corazones");
    numPreguntaSpan = document.getElementById("num-pregunta");
    totalPreguntasSpan = document.getElementById("total-preguntas");
    contadorAciertosSpan = document.getElementById("contador-aciertos");

    tituloResultado = document.getElementById("titulo-resultado");
    mensajeResultado = document.getElementById("mensaje-resultado");

    // Asignación de eventos
    btnComenzar.addEventListener("click", iniciarJuego);
    btnReiniciar.addEventListener("click", iniciarJuego);
    btnJugarNuevo.addEventListener("click", iniciarJuego);
});

async function iniciarJuego() {
    erroresCometidos = 0;
    aciertos = 0;
    indicePreguntaActual = 0;
    preguntas = [];

    actualizarVidasUI();
    contadorAciertosSpan.textContent = "0";

    pantallaInicio.classList.add("oculto");
    pantallaResultado.classList.add("oculto");
    pantallaJuego.classList.remove("oculto");

    textoPregunta.textContent = "Cargando preguntas desde South Park API...";
    opcionesContainer.innerHTML = "";

    try {
        preguntas = await cargarPreguntasAPI();
        totalPreguntasSpan.textContent = preguntas.length;
        mostrarPreguntaActual();
    } catch (error) {
        console.warn("Error al conectar con la API, ejecutando respaldo local:", error);
        preguntas = cargarPreguntasRespaldo();
        totalPreguntasSpan.textContent = preguntas.length;
        mostrarPreguntaActual();
    }
}

async function cargarPreguntasAPI() {
    const page = Math.floor(Math.random() * 4) + 1;
    const response = await fetch(`${API_SOUTHPARK_URL}?page=${page}`);
    if (!response.ok) throw new Error("Error en la respuesta del servidor API");

    const data = await response.json();
    const personajes = data.data.filter(p => p.name && (p.occupation || p.religion || p.age));

    const listaPreguntas = [];

    for (let i = 0; i < Math.min(TOTAL_PREGUNTAS, personajes.length); i++) {
        const p = personajes[i];
        let campo = "";
        let correcta = "";

        if (p.occupation) {
            campo = "ocupación";
            correcta = p.occupation;
        } else if (p.religion) {
            campo = "religión";
            correcta = p.religion;
        } else {
            campo = "edad";
            correcta = `${p.age} años`;
        }

        const distractores = ["Estudiante", "Profesor", "Católico", "Desconocida", "4to Grado"]
            .filter(op => op !== correcta)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

        const opciones = [correcta, ...distractores].sort(() => 0.5 - Math.random());

        listaPreguntas.push({
            enunciado: `¿Cuál es la/el ${campo} de "${p.name}"?`,
            opciones: opciones,
            correcta: correcta
        });
    }

    return listaPreguntas;
}

function mostrarPreguntaActual() {
    if (indicePreguntaActual >= preguntas.length) {
        finalizarJuego(true);
        return;
    }

    const q = preguntas[indicePreguntaActual];
    numPreguntaSpan.textContent = indicePreguntaActual + 1;
    textoPregunta.textContent = q.enunciado;
    opcionesContainer.innerHTML = "";

    q.opciones.forEach(opcion => {
        const btn = document.createElement("button");
        btn.classList.add("btn-opcion");
        btn.textContent = opcion;
        btn.addEventListener("click", () => evaluarRespuesta(opcion, q.correcta));
        opcionesContainer.appendChild(btn);
    });
}

function evaluarRespuesta(seleccion, correcta) {
    const botones = opcionesContainer.querySelectorAll(".btn-opcion");
    botones.forEach(b => b.disabled = true);

    if (seleccion === correcta) {
        aciertos++;
        contadorAciertosSpan.textContent = aciertos;
        indicePreguntaActual++;
        setTimeout(mostrarPreguntaActual, 800);
    } else {
        erroresCometidos++;
        actualizarVidasUI();

        if (erroresCometidos >= MAX_ERRORES) {
            setTimeout(() => finalizarJuego(false), 800);
        } else {
            indicePreguntaActual++;
            setTimeout(mostrarPreguntaActual, 800);
        }
    }
}

function actualizarVidasUI() {
    const restantes = MAX_ERRORES - erroresCometidos;
    if (restantes <= 0) {
        corazonesSpan.textContent = "💀 ¡Muerto!";
    } else {
        corazonesSpan.textContent = "🧡 ".repeat(restantes);
    }
}

function finalizarJuego(gano) {
    pantallaJuego.classList.add("oculto");
    pantallaResultado.classList.remove("oculto");

    if (gano && erroresCometidos < MAX_ERRORES) {
        tituloResultado.textContent = "¡OH MI DIOS, SALVASTE A KENNY!";
        mensajeResultado.textContent = `Lograste contestar ${aciertos} preguntas bien con ${erroresCometidos} error(es). ¡Kenny vivirá un episodio más!`;
    } else {
        tituloResultado.textContent = "¡OH MI DIOS, MATARON A KENNY!";
        mensajeResultado.textContent = `Cometiste ${erroresCometidos} errores. ¡Hijos de p***! Vuelve a intentarlo para salvarlo.`;
    }
}

function cargarPreguntasRespaldo() {
    return [
        {
            enunciado: "¿En qué estado de EE.UU. queda el pueblo de South Park?",
            opciones: ["Colorado", "Texas", "California", "Springfield"],
            correcta: "Colorado"
        },
        {
            enunciado: "¿Cómo se llama el alter ego superhéroe de Kenny?",
            opciones: ["Mysterion", "El Mapache", "Profesor Caos", "Human Kite"],
            correcta: "Mysterion"
        },
        {
            enunciado: "¿Cómo se llama la mamá de Eric Cartman?",
            opciones: ["Liane", "Sheila", "Sharon", "Carol"],
            correcta: "Liane"
        },
        {
            enunciado: "¿Qué personaje usa siempre un gorro verde con orejeras?",
            opciones: ["Kyle Broflovski", "Stan Marsh", "Kenny McCormick", "Craig Tucker"],
            correcta: "Kyle Broflovski"
        },
        {
            enunciado: "¿Quién es el maestro de 4to grado de los niños?",
            opciones: ["Sr. Garrison", "Sr. Mackey", "Chef", "Director PC"],
            correcta: "Sr. Garrison"
        }
    ];
}