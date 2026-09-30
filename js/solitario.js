const API_BASE = "https://deckofcardsapi.com/api/deck";
let deckId = null;
let score = 0;
let moves = 0;

document.addEventListener("DOMContentLoaded", () => {
    const btnReiniciar = document.getElementById("btn-reiniciar");
    if (btnReiniciar) {
        btnReiniciar.addEventListener("click", initGame);
    }
    initGame();
});

async function initGame() {
    try {
        score = 0;
        moves = 0;
        updateUI();
        
        // Forzar https para evitar bloqueos de seguridad en GitHub Pages
        const response = await fetch(`${API_BASE}/new/shuffle/?deck_count=1`);
        if (!response.ok) throw new Error("No se pudo conectar con el servidor de cartas.");
        
        const data = await response.json();
        deckId = data.deck_id;

        const tableauColumns = document.querySelectorAll(".tableau-pile");
        
        for (let i = 0; i < tableauColumns.length; i++) {
            tableauColumns[i].innerHTML = ""; 
            const count = i + 1;
            const drawRes = await fetch(`${API_BASE}/${deckId}/draw/?count=${count}`);
            const drawData = await drawRes.json();
            
            drawData.cards.forEach((card, index) => {
                renderCardInColumn(tableauColumns[i], card, index === count - 1, index);
            });
        }
    } catch (error) {
        console.error("Error al inicializar el solitario con la API:", error);
        alert("Hubo un error al conectar con la API de cartas desde GitHub Pages.");
    }
}

function renderCardInColumn(columnElement, card, isFaceUp, index) {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");
    cardDiv.style.setProperty('--card-offset', `${index * 25}px`);

    if (isFaceUp) {
        cardDiv.innerHTML = `<img src="${card.image}" alt="${card.value} of ${card.suit}">`;
        cardDiv.classList.add("face-up");
    } else {
        cardDiv.classList.add("face-down");
        cardDiv.innerHTML = `<div class="card-back">🂠</div>`;
    }

    cardDiv.addEventListener("click", () => {
        if (isFaceUp) {
            moves++;
            score += 5;
            updateUI();
        }
    });

    columnElement.appendChild(cardDiv);
}

function updateUI() {
    const scoreElement = document.getElementById("score");
    const movesElement = document.getElementById("moves");
    
    if (scoreElement) scoreElement.textContent = score;
    if (movesElement) movesElement.textContent = moves;
}

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