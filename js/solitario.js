const API_BASE = "https://deckofcardsapi.com/api/deck";
let deckId = null;
let score = 0;
let moves = 0;

const deckElement = document.getElementById("deck");
const drawPileElement = document.getElementById("draw-pile");
const tableauColumns = document.querySelectorAll(".tableau-pile");
const scoreElement = document.getElementById("score");
const movesElement = document.getElementById("moves");
const btnReiniciar = document.getElementById("btn-reiniciar");

// Inicializar juego al cargar la página
async function initGame() {
    try {
        score = 0;
        moves = 0;
        updateUI();
        
        // 1. Obtener un nuevo mazo barajado desde la API
        const response = await fetch(`${API_BASE}/new/shuffle/?deck_count=1`);
        const data = await response.json();
        deckId = data.deck_id;

        // 2. Repartir cartas para las 7 columnas del Solitario
        // Columna i necesita i+1 cartas (total 28 cartas iniciales)
        for (let i = 0; i < tableauColumns.length; i++) {
            tableauColumns[i].innerHTML = ""; // Limpiar columna
            const count = i + 1;
            const drawRes = await fetch(`${API_BASE}/${deckId}/draw/?count=${count}`);
            const drawData = await drawRes.json();
            
            drawData.cards.forEach((card, index) => {
                renderCardInColumn(tableauColumns[i], card, index === count - 1);
            });
        }
    } catch (error) {
        console.error("Error al inicializar el solitario con la API:", error);
        alert("Hubo un error al conectar con la API de cartas.");
    }
}

// Renderizar una carta dentro de una columna del tablero
function renderCardInColumn(columnElement, card, isFaceUp) {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");
    cardDiv.dataset.code = card.code;
    cardDiv.dataset.value = card.value;
    cardDiv.dataset.suit = card.suit;

    if (isFaceUp) {
        cardDiv.innerHTML = `<img src="${card.image}" alt="${card.value} of ${card.suit}">`;
        cardDiv.classList.add("face-up");
    } else {
        cardDiv.classList.add("face-down");
        cardDiv.innerHTML = `<div class="card-back">🂠</div>`;
    }

    // Ejemplo de evento interactivo
    cardDiv.addEventListener("click", () => {
        if (isFaceUp) {
            moves++;
            score += 5; // Puntuación de ejemplo
            updateUI();
            console.log(`Carta seleccionada: ${card.value} de ${card.suit}`);
        }
    });

    columnElement.appendChild(cardDiv);
}

function updateUI() {
    scoreElement.textContent = score;
    movesElement.textContent = moves;
}

// Guardar récord en storage
function guardarRecordPartida() {
    let records = JSON.parse(localStorage.getItem("tp1_records")) || [];
    records.push({
        juego: "Solitario",
        puntaje: score,
        movimientos: moves,
        fecha: new Date().toLocaleDateString()
    });
    localStorage.setItem("tp1_records", JSON.stringify(records));
}

btnReiniciar.addEventListener("click", initGame);

// Arrancar por primera vez
initGame();