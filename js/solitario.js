const API_BASE = "https://deckofcardsapi.com/api/deck";
let deckId = null;
let score = 0;
let moves = 0;
let selectedCard = null; // Guarda la carta que el usuario seleccionó para mover

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
        selectedCard = null;
        updateUI();
        
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
                // Asignamos propiedades útiles para las reglas
                card.color = (card.suit === 'DIAMONDS' || card.suit === 'HEARTS') ? 'red' : 'black';
                card.numericValue = getNumericValue(card.value);
                
                renderCardInColumn(tableauColumns[i], card, index === count - 1, index, i);
            });
        }
    } catch (error) {
        console.error("Error al inicializar el solitario con la API:", error);
        alert("Hubo un error al conectar con la API de cartas desde GitHub Pages.");
    }
}

function getNumericValue(val) {
    if (val === 'ACE') return 1;
    if (val === 'JACK') return 11;
    if (val === 'QUEEN') return 12;
    if (val === 'KING') return 13;
    return parseInt(val);
}

function renderCardInColumn(columnElement, card, isFaceUp, index, columnIndex) {
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

    // Lógica real de interacción al hacer clic en una carta
    cardDiv.addEventListener("click", (e) => {
        e.stopPropagation(); // Evita que el clic propague a la columna entera

        if (!isFaceUp) return; // No se pueden interactuar con cartas boca abajo

        if (!selectedCard) {
            // Seleccionar carta
            selectedCard = { card, element: cardDiv, columnIndex };
            cardDiv.classList.add("selected"); // Puedes darle estilo CSS de borde brillante
        } else {
            // Si ya había una carta seleccionada, intentamos moverla o cambiar selección
            if (selectedCard.element === cardDiv) {
                // Deseleccionar si hace clic en la misma
                cardDiv.classList.remove("selected");
                selectedCard = null;
            } else {
                // Intentar regla de movimiento básica en Tableau: color alternado y valor descendente (-1)
                if (card.color !== selectedCard.card.color && card.numericValue === selectedCard.card.numericValue + 1) {
                    moves++;
                    score += 10;
                    
                    // Mover visualmente el elemento a la nueva columna
                    columnElement.appendChild(selectedCard.element);
                    selectedCard.element.classList.remove("selected");
                    selectedCard = null;
                    updateUI();
                } else {
                    // Si no es un movimiento válido, cambiamos la selección a esta nueva carta
                    selectedCard.element.classList.remove("selected");
                    selectedCard = { card, element: cardDiv, columnIndex };
                    cardDiv.classList.add("selected");
                }
            }
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