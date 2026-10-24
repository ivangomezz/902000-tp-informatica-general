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
    const response = await fetch(API_OPENTRIVIADB_URL);

    if (!response.ok) {
        throw new Error("Error al obtener preguntas");
    }

    const preguntas = await response.json();

    const personajesMarvel = preguntas.filter(
        h => h.biography.publisher === "Comics"
    );

    const listaPreguntas = [];

    for (let i = 0; i < TOTAL_PREGUNTAS; i++) {

        const personaje =
            personajesMarvel[Math.floor(
                Math.random() * personajesMarvel.length
            )];

        let opciones = [personaje.name];

        while(opciones.length < 4){

            const falso =
                personajesMarvel[Math.floor(
                    Math.random() * personajesMarvel.length
                )].name;

            if(!opciones.includes(falso)){
                opciones.push(falso);
            }
        }

        opciones.sort(() => Math.random() - 0.5);

        listaPreguntas.push({
            enunciado:
                `¿Qué personaje de Marvel tiene el nombre real "${personaje.biography.fullName}"?`,
            opciones: opciones,
            correcta: personaje.name
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
        corazonesSpan.textContent = "💀 ¡PERDISTE!";
    } else {
        corazonesSpan.textContent = "🧡 ".repeat(restantes);
    }
}

