// Game state
let gameState = {
  cards: [],
  firstCard: null,
  secondCard: null,
  isLocked: false,
  clickCount: 0,
  pairsMatched: 0,
  totalPairs: 0,
  timer: null,
  timeLeft: 0,
  difficulty: 'easy',
  powerUpAvailable: false
};

// Difficulty settings
const DIFFICULTY_SETTINGS = {
  easy: { pairs: 3, time: 60 },
  medium: { pairs: 6, time: 90 },
  hard: { pairs: 9, time: 120 }
};


async function initGame() {
  const difficulty = $('#difficulty').val();
  gameState.difficulty = difficulty;
  gameState.totalPairs = DIFFICULTY_SETTINGS[difficulty].pairs;
  gameState.timeLeft = DIFFICULTY_SETTINGS[difficulty].time;
  

  $('#game_grid').empty();
  

  await createCards();
  

  updateStats();
  

  gameState.powerUpAvailable = false;
  $('#power-up-btn').prop('disabled', true);
}

// Create cards using Pokemon API
async function createCards() {
  try {
    // Get random Pokemon IDs
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1500');
    const data = await response.json();
    const pokemonList = data.results;
    

    const selectedPokemon = shuffleArray(pokemonList)
      .slice(0, gameState.totalPairs)
      .map(pokemon => pokemon.url);
    

    const cardPairs = [...selectedPokemon, ...selectedPokemon];
    gameState.cards = shuffleArray(cardPairs);
    
    
    gameState.cards.forEach((pokemonUrl, index) => {
      const card = $(`
        <div class="card" data-index="${index}">
          <img class="front_face" src="" alt="Pokemon" data-url="${pokemonUrl}">
          <img class="back_face" src="back.webp" alt="Card Back">
        </div>
      `);
      $('#game_grid').append(card);
      
      // Load Pokemon image
      fetch(pokemonUrl)
        .then(res => res.json())
        .then(data => {
          const imgUrl = data.sprites.other['official-artwork'].front_default;
          card.find('.front_face').attr('src', imgUrl);
        });
    });
  } catch (error) {
    console.error('Error loading Pokemon:', error);
  }
}


function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}


function handleCardClick() {
  if (gameState.isLocked) return;
  if ($(this).hasClass('flip')) return;
  
  $(this).addClass('flip');
  gameState.clickCount++;
  
  if (!gameState.firstCard) {
    gameState.firstCard = this;
  } else {
    gameState.secondCard = this;
    gameState.isLocked = true;
    
    checkForMatch();
  }
  
  updateStats();
}


function checkForMatch() {
  const firstImg = $(gameState.firstCard).find('.front_face').attr('src');
  const secondImg = $(gameState.secondCard).find('.front_face').attr('src');
  
  if (firstImg === secondImg) {
    handleMatch();
  } else {
    handleMismatch();
  }
}

function handleMatch() {
  if (gameState.pairsMatched < gameState.totalPairs) {
    gameState.pairsMatched++;
    $(gameState.firstCard).off('click');
    $(gameState.secondCard).off('click');
    
    // Check for power-up availability
    if (gameState.pairsMatched === 3) {
      gameState.powerUpAvailable = true;
      $('#power-up-btn').prop('disabled', false);
    }
    

    if (gameState.pairsMatched === gameState.totalPairs) {
      handleWin();
    }
  }
  
  resetTurn();
}

// Handle mismatched cards
function handleMismatch() {
  setTimeout(() => {
    $(gameState.firstCard).removeClass('flip');
    $(gameState.secondCard).removeClass('flip');
    resetTurn();
  }, 1000);
}

// Reset turn
function resetTurn() {
  gameState.firstCard = null;
  gameState.secondCard = null;
  gameState.isLocked = false;
}

// Update game stats
function updateStats() {
  $('#click-count').text(gameState.clickCount);
  const pairsLeft = Math.max(0, gameState.totalPairs - gameState.pairsMatched);
  $('#pairs-left').text(pairsLeft);
  $('#pairs-matched').text(gameState.pairsMatched);
  $('#total-pairs').text(gameState.totalPairs);
  $('#timer').text(gameState.timeLeft);
}

// Start timer
function startTimer() {
  if (gameState.timer) clearInterval(gameState.timer);
  
  gameState.timer = setInterval(() => {
    gameState.timeLeft--;
    updateStats();
    
    if (gameState.timeLeft <= 0) {
      handleGameOver();
    }
  }, 1000);
}

// Handle win
function handleWin() {
  clearInterval(gameState.timer);
  alert('Congratulations! You won!');
  $('#game_grid .card').off('click');
}

// Handle game over
function handleGameOver() {
  clearInterval(gameState.timer);
  alert('Game Over! Time\'s up!');
  $('#game_grid .card').off('click');
}

// Power-up: Reveal all cards
function handlePowerUp() {
  if (!gameState.powerUpAvailable) return;
  
  $('#power-up-btn').prop('disabled', true);
  gameState.powerUpAvailable = false;
  
  // Flip all cards
  $('#game_grid .card').addClass('flip');
  
  // Hide cards after 3 seconds
  setTimeout(() => {
    $('#game_grid .card').removeClass('flip');
  }, 3000);
}

// Theme switcher
function handleThemeChange() {
  const theme = $('#theme').val();
  $('body').removeClass('light-theme dark-theme').addClass(`${theme}-theme`);
}

// Event Listeners
$(document).ready(() => {
  // Initialize game
  initGame();
  
  // Card click handler
  $(document).on('click', '.card', handleCardClick);
  
  // Game controls
  $('#start-btn').click(() => {
    initGame();
    startTimer();
  });
  
  $('#reset-btn').click(() => {
    clearInterval(gameState.timer);
    initGame();
  });
  
  $('#difficulty').change(() => {
    clearInterval(gameState.timer);
    initGame();
  });
  
  $('#theme').change(handleThemeChange);
  
  $('#power-up-btn').click(handlePowerUp);
});