// Define the polyphonic synth and connect to the master output
const synth = new Tone.PolySynth({
  voice: Tone.Synth,
  maxPolyphony: 320, // Your current max polyphony setting
  options: {
      oscillator: {
          type: 'sine'
      }
  }
}).toDestination();
  
  const goodbyePhrases = [
    "I'm an eye.", "A mechanical eye.", "I, the machine, show you a world the way only I can see it.", "I free myself for today and forever from human immobility.",
    "I'm in constant movement.", "I approach and pull away from objects.", "i move alongside a running horse's mouth.", " I fall and rise with the falling and rising bodies.",
    "This is I, the machine, manoeuvring in the chaotic movements, recording one movement after another in the most complex combinations.", "Freed from the boundaries of time and space, I co-ordinate any and all points of the universe, wherever I want them to be.", "My way leads towards the creation of a fresh perception of the world.", "Thus I explain in a new way the world unknown to you.",
    "The camera isolated momentary appearances and in so doing destroyed the idea that images were timeless.", "Or, to put it another way, the camera showed that the notion of time passing was inseparable from the experience of the visual (except in paintings).", "It was no longer possible to imagine everything converging on the human eye as on the vanishing point of infinity.", "Farewell!"
  ];
const compressor = new Tone.Compressor(-30, 3).toDestination();
synth.connect(compressor);
// Create and configure the reverb effect
const reverb = new Tone.Reverb({
    decay: 20,
    wet: 1
}).toDestination();
synth.connect(reverb);

synth.volume.value = -18; // Decrease volume, adjust as needed

  // Define the notes for three octaves
  const notes = [
    'A2', 'C2', 'D2', 'E3', 'G3',
    'A3', 'C3', 'D4', 'E4', 'G4',
    'A4', 'C4', 'D5', 'E5', 'G5'
  ];
  
  // Select the grid and play button elements
  const grid = document.getElementById('grid');
  const playButton = document.getElementById('playButton');
  
  // This array will hold the state of the sequencer
  const sequence = Array.from({ length: 16 }, () => Array(notes.length).fill(false));
  
  let isDrawing = false; // Track whether the mouse/finger is currently drawing
  let highlightedColumns = Array(16).fill(false); // Track highlighted columns
  
  // Track the currently playing column index
  let currentPlayingColumn = -1;
  
  // Track the currently displayed phrase index
  let currentDisplayedPhraseIndex = -1;
  
  // Function to toggle the state of a cell and its column highlighting
  function toggleCellState(cell) {
    const noteIndex = parseInt(cell.dataset.note, 10);
    const step = parseInt(cell.dataset.step, 10);
    const isActive = !sequence[step][noteIndex]; // Toggle the state
    sequence[step][noteIndex] = isActive;

    if (isActive) {
        cell.classList.add('active');
    } else {
        cell.classList.remove('active');
    }

    // Check if the column should be highlighted, but do not trigger any audio or visual feedback here
    const isColumnHighlighted = sequence.some(row => row[noteIndex]);
    highlightedColumns[step] = isColumnHighlighted;
}
  
  // Generate grid cells and add event listeners for drawing
  for (let noteIndex = notes.length - 1; noteIndex >= 0; noteIndex--) { // Loop in reverse order
    for (let step = 0; step < 16; step++) {
      const cell = document.createElement('div');
      cell.classList.add('grid-cell');
      cell.dataset.note = noteIndex.toString();
      cell.dataset.step = step.toString();
  
      // Mouse events
      cell.addEventListener('mousedown', () => {
        isDrawing = true;
        toggleCellState(cell);
      });
      cell.addEventListener('mouseover', () => {
        if (isDrawing) {
          toggleCellState(cell);
        }
      });
  
      // Touch events
      cell.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDrawing = true;
        toggleCellState(cell);
      }, { passive: false });
      cell.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (isDrawing) {
          let touch = e.touches[0];
          let targetCell = document.elementFromPoint(touch.clientX, touch.clientY);
          if (targetCell && targetCell.classList.contains('grid-cell')) {
            toggleCellState(targetCell);
          }
        }
      }, { passive: false });
  
      grid.appendChild(cell);
    }
  }
  
  // Global mouseup and touchend event listeners to stop drawing
  document.addEventListener('mouseup', () => {
    isDrawing = false;
  });
  document.addEventListener('touchend', () => {
    isDrawing = false;
  });
  
  const phraseDisplay = document.getElementById('currentPhrase');
  

  // Function to update phrase display after shuffle/clear
function updatePhraseDisplayPostAction() {
    let highlightedColumnFound = false;
    for (let col = 0; col < highlightedColumns.length; col++) {
      if (highlightedColumns[col]) {
        updateDisplayedPhrase(col);
        highlightedColumnFound = true;
        break;
      }
    }
  
    if (!highlightedColumnFound) {
      phraseDisplay.textContent = 'No phrase selected'; // or any default message
    }
  }


// Update displayed phrase function with new logic
function updateDisplayedPhrase(col) {
    if (highlightedColumns[col]) {
      const phraseIndex = col % goodbyePhrases.length;
      const currentPhrase = goodbyePhrases[phraseIndex];
      phraseDisplay.textContent = currentPhrase;
    } else {
      phraseDisplay.textContent = ''; // or any default message
    }
  }
  
  const seq = new Tone.Sequence((time, col) => {
    // Clear previous highlights
    document.querySelectorAll('.playing').forEach(cell => cell.classList.remove('playing'));

    // Update the current playing column index
    currentPlayingColumn = col;

    // Counter for active cells in the current playing column
    let activeCellCount = sequence[col].filter(cell => cell).length;

    // Log the count of active cells in the current playing column

    // Iterate over each row (note) in the column
    sequence[col].forEach((shouldBePlayed, noteIndex) => {
      if (shouldBePlayed) {
        // If the note is active in the sequence, trigger it
        synth.triggerAttackRelease(notes[noteIndex], '8n', time);
      }
      // Update the state of the grid cells
      const cell = document.querySelector(`.grid-cell[data-note="${noteIndex}"][data-step="${col}"]`);
      cell.classList.add('playing');
    });

    // Update the displayed phrase based on the current column intersection
    updateDisplayedPhrase(col); // Move this line here
  }, Array.from({ length: 16 }, (_, i) => i), '16n');
  
  // Start the sequence
  seq.start(0);
  Tone.Transport.bpm.value = 90;
  
  // Attach the play button functionality
  playButton.addEventListener('click', () => {
    Tone.Transport.start();
  
    // Start the sequence from the beginning
    seq.start(0);
  
    // Reset the current playing column index
    currentPlayingColumn = -1;
  });
  
  // Optionally, you can create a stop button to stop the sequence
  // Assuming there is a button with the ID 'stopButton'
  const stopButton = document.getElementById('stopButton');
  stopButton.addEventListener('click', () => {
    Tone.Transport.stop();
    seq.stop();
    // Clear all highlights
    document.querySelectorAll('.playing').forEach(cell => cell.classList.remove('playing'));
  });
  
  // Select the clear button element
  const clearButton = document.getElementById('clearButton');
  
// Attach the clear button functionality
clearButton.addEventListener('click', () => {
    // Iterate over the sequence to reset all steps to false
    for (let step = 0; step < sequence.length; step++) {
      for (let noteIndex = 0; noteIndex < sequence[step].length; noteIndex++) {
        sequence[step][noteIndex] = false;
      }
    }
  
    // Reset the highlighted columns
    highlightedColumns.fill(false);
  
    // Clear the grid cell content and update the phrase display
    clearGridCellContent();
    updatePhraseDisplayPostAction(); // Update phrase display after clearing
  });
  
// Function to clear the grid cell content
function clearGridCellContent() {
    document.querySelectorAll('.grid-cell').forEach(cell => {
      cell.classList.remove('active', 'highlighted');
    });
  }
  
function shuffleGrid() {
  // Count the number of active cells
  let activeCount = 0;
  sequence.forEach(row => {
    row.forEach(cell => {
      if (cell) activeCount++;
    });
  });

  // Clear the grid
  for (let step = 0; step < sequence.length; step++) {
    sequence[step].fill(false);
  }

  // Randomly activate cells
  for (let i = 0; i < activeCount; i++) {
    let randomStep, randomNote;
    do {
      randomStep = Math.floor(Math.random() * 16);
      randomNote = Math.floor(Math.random() * notes.length);
    } while (sequence[randomStep][randomNote]); // Ensure the cell is not already active

    sequence[randomStep][randomNote] = true;
  }

  // Update the grid UI
  updateGrid();

  // Update the highlighted columns
  updateHighlightedColumns();

  // Directly update the phrase display based on the new grid state
  updatePhraseDisplayPostAction();
}

// Function to update highlighted columns based on the current sequence
function updateHighlightedColumns() {
  highlightedColumns.fill(false); // Reset highlighted columns
  for (let step = 0; step < 16; step++) {
    highlightedColumns[step] = sequence[step].some(val => val);
  }
}

// Function to update phrase display after shuffle/clear
// Function to update phrase display after shuffle/clear
function updatePhraseDisplayPostAction() {
    if (highlightedColumns.some(val => val)) {
      // Find the first highlighted column and update the phrase
      const firstHighlightedColumn = highlightedColumns.findIndex(val => val);
      updateDisplayedPhrase(firstHighlightedColumn);
    } else {
      // If no columns are highlighted, set a default message
      phraseDisplay.textContent = 'No phrase selected'; // or any default message
    }
  }

// Update displayed phrase function with conditional background color change
// Update displayed phrase function with dynamic word count and conditional background color
function updateDisplayedPhrase(col) {
  // Check if the current column is highlighted
  if (highlightedColumns[col]) {
      // Get the phrase index based on the column number
      const phraseIndex = col % goodbyePhrases.length;

      // Construct the phrase to be displayed
      const currentPhrase = goodbyePhrases[phraseIndex] + " ";
      const repeatedPhrase = currentPhrase.repeat(100);
      const words = repeatedPhrase.trim().split(" ");

      // Clear the existing content in the phrase display
      phraseDisplay.innerHTML = '';

      // Initialize the word count per line
      const minWordsPerLine = 2;
      const maxWordsPerLine = Math.floor(Math.random() * (20 - 6 + 1)) + 6;
      let wordCountPerLine = Math.floor(Math.random() * (maxWordsPerLine - minWordsPerLine + 1)) + minWordsPerLine;
      let currentWordCount = 0;
      let direction = wordCountPerLine === minWordsPerLine ? 1 : -1;

      // Count the number of active cells in the current column
      let activeCellCount = sequence[col].filter(cell => cell).length;

      // Check and set the background and font color based on active cell count
      if (activeCellCount > 3 && activeCellCount < 7) {
          phraseDisplay.style.backgroundColor = 'red';
          phraseDisplay.style.color = '#88f';
      } else if (activeCellCount > 0 && activeCellCount < 3) {
          phraseDisplay.style.backgroundColor = '#88f';
          phraseDisplay.style.color = 'black';
      } else {
          phraseDisplay.style.backgroundColor = ''; // Reset background color
          phraseDisplay.style.color = ''; // Reset font color
      }

      // Create a container div for each word
      words.forEach((word) => {
          const wordDiv = document.createElement('div');
          wordDiv.textContent = word;
          wordDiv.style.flexGrow = '1';
          wordDiv.style.textAlign = 'center';

          phraseDisplay.appendChild(wordDiv);

          // Increase the current word count
          currentWordCount++;

          if (currentWordCount === wordCountPerLine) {
              wordDiv.style.flexBasis = '100%'; // Create a new line
              currentWordCount = 0; // Reset the word count for the new line

              // Increase or decrease the word count per line based on the direction
              wordCountPerLine += direction;

              // If we reach the max or min, change direction
              if (wordCountPerLine > maxWordsPerLine || wordCountPerLine < minWordsPerLine) {
                  direction *= -1;
                  wordCountPerLine += direction; // Adjust once more because we overshot in the loop
              }
          }
      });
  } else {
      phraseDisplay.textContent = ''; // Set default message
      phraseDisplay.style.backgroundColor = ''; // Reset background color
      phraseDisplay.style.color = ''; // Reset font color
  }
}
  
  
  
  


  // Function to handle phrase display after shuffling
function updatePhraseDisplayAfterShuffle() {
    if (highlightedColumns.some(val => val)) {
      // If there are any highlighted columns, update the phrase for the first one
      const firstHighlightedColumn = highlightedColumns.findIndex(val => val);
      updateDisplayedPhrase(firstHighlightedColumn);
    } else {
      // If no columns are highlighted, clear the phrase or set a default message
      phraseDisplay.textContent = 'No phrase selected'; // or any default message
    }
  }
  
  // Function to update the grid UI based on the sequence
  function updateGrid() {
    for (let step = 0; step < 16; step++) {
      for (let noteIndex = 0; noteIndex < notes.length; noteIndex++) {
        const cell = document.querySelector(`.grid-cell[data-note="${noteIndex}"][data-step="${step}"]`);
        if (sequence[step][noteIndex]) {
          cell.classList.add('active');
        } else {
          cell.classList.remove('active');
        }
      }
    }
  }

  function toggleFullWindow() {
    const phraseDisplay = document.getElementById('currentPhrase');
    const fullToggleDiv = document.getElementById('full-toggle'); // Get the full-toggle div

    if (!phraseDisplay.style.width || phraseDisplay.style.width === "50%") {
        // Expand to full window
        phraseDisplay.style.position = 'fixed';
        phraseDisplay.style.top = '0';
        phraseDisplay.style.left = '0';
        phraseDisplay.style.width = '100%';
        phraseDisplay.style.height = '100%';
        phraseDisplay.style.margin = '0';
        phraseDisplay.style.zIndex = '1';

        // Move the full-toggle button to the bottom left
        fullToggleDiv.style.position = 'fixed';
        fullToggleDiv.style.left = '0';
        fullToggleDiv.style.bottom = '0';
        fullToggleDiv.style.top = 'auto'; // Reset the top property
        fullToggleDiv.style.right = 'auto'; // Reset the right property if it was set

    } else {
        // Revert to original style for phraseDisplay
        phraseDisplay.style.position = '';
        phraseDisplay.style.top = '';
        phraseDisplay.style.left = '';
        phraseDisplay.style.width = '50%'; // Original width
        phraseDisplay.style.height = '100vh'; // Original height
        phraseDisplay.style.margin = '0 auto'; // Original margin
        phraseDisplay.style.zIndex = '';

        // Revert full-toggle button back to original position
        fullToggleDiv.style.position = ''; // Remove fixed positioning
        fullToggleDiv.style.left = '';
        fullToggleDiv.style.bottom = '';
        fullToggleDiv.style.top = ''; // Restore original top property if needed
        fullToggleDiv.style.right = ''; // Restore original right property if needed
        fullToggleDiv.style.zIndex = ''; // Reset zIndex to default
        fullscreenToggle.style.filter = 'invert(0)'; // 100% inversion

    }
}



document.getElementById('fullscreenToggle').addEventListener('click', toggleFullWindow);

  // Shuffle button event listener
  const shuffleButton = document.getElementById('shuffleButton');
  shuffleButton.addEventListener('click', shuffleGrid);
  