// Test configuration
const config = {
    minAngle: 0,
    maxAngle: 360,
    minRadius: 50,  // Starting distance from center in pixels
    maxRadius: 400, // Maximum distance from center in pixels
    radiusStep: 50, // How much to increase radius each round
    targetsPerRound: 8, // Number of targets to show at each radius
    targetDuration: 2000, // How long each target is shown (ms)
    delayBetweenTargets: 1000, // Delay between targets (ms)
};

// DOM elements
const startButton = document.getElementById('start-test');
const testArea = document.querySelector('.test-area');
const peripheralTarget = document.getElementById('peripheral-target');
const resultsDiv = document.getElementById('results');

// Test state
let currentTest = {
    active: false,
    currentRadius: config.minRadius,
    currentAngleIndex: 0,
    detectedTargets: 0,
    totalTargets: 0,
    timeoutId: null,
    results: {}
};

// Initialize the test
function initTest() {
    document.body.classList.add('test-active');
    currentTest = {
        active: true,
        currentRadius: config.minRadius,
        currentAngleIndex: 0,
        detectedTargets: 0,
        totalTargets: 0,
        timeoutId: null,
        results: {}
    };
    startButton.disabled = true;
    showNextTarget();
}

// Show a target at a specific angle and radius
function showTarget(angle, radius) {
    const centerX = testArea.offsetWidth / 2;
    const centerY = testArea.offsetHeight / 2;
    
    // Convert angle to radians and calculate position
    const radians = (angle * Math.PI) / 180;
    const x = centerX + radius * Math.cos(radians);
    const y = centerY + radius * Math.sin(radians);
    
    // Position and show the target
    peripheralTarget.style.left = x + 'px';
    peripheralTarget.style.top = y + 'px';
    peripheralTarget.style.opacity = '1';
    
    currentTest.totalTargets++;
    
    // Hide the target after duration
    currentTest.timeoutId = setTimeout(() => {
        hideTarget();
        setTimeout(showNextTarget, config.delayBetweenTargets);
    }, config.targetDuration);
}

// Hide the current target
function hideTarget() {
    peripheralTarget.style.opacity = '0';
}

// Show the next target in the sequence
function showNextTarget() {
    if (!currentTest.active) return;
    
    // If we've shown all targets at current radius
    if (currentTest.currentAngleIndex >= config.targetsPerRound) {
        currentTest.currentAngleIndex = 0;
        currentTest.currentRadius += config.radiusStep;
        
        // Store results for this radius
        const accuracy = (currentTest.detectedTargets / config.targetsPerRound) * 100;
        currentTest.results[currentTest.currentRadius - config.radiusStep] = accuracy;
        
        // If we've reached the maximum radius, end the test
        if (currentTest.currentRadius > config.maxRadius) {
            endTest();
            return;
        }
    }
    
    // Calculate angle for next target
    const angleStep = 360 / config.targetsPerRound;
    const angle = (currentTest.currentAngleIndex * angleStep + Math.random() * angleStep/2);
    
    showTarget(angle, currentTest.currentRadius);
    currentTest.currentAngleIndex++;
}

// Handle user input (spacebar press)
function handleInput(event) {
    if (!currentTest.active || event.code !== 'Space') return;
    
    event.preventDefault();
    
    // If target is visible, count as detected
    if (peripheralTarget.style.opacity === '1') {
        currentTest.detectedTargets++;
        hideTarget();
        clearTimeout(currentTest.timeoutId);
        setTimeout(showNextTarget, config.delayBetweenTargets);
    }
}

// End the test and show results
function endTest() {
    currentTest.active = false;
    document.body.classList.remove('test-active');
    startButton.disabled = false;
    hideTarget();
    
    // Calculate and display results
    let resultsHTML = '<h2>Test Results</h2>';
    resultsHTML += '<table style="margin: 0 auto; text-align: left;">';
    resultsHTML += '<tr><th>Distance from Center</th><th>Accuracy</th></tr>';
    
    Object.entries(currentTest.results).forEach(([radius, accuracy]) => {
        resultsHTML += `
            <tr>
                <td>${radius}px</td>
                <td>${accuracy.toFixed(1)}%</td>
            </tr>
        `;
    });
    
    resultsHTML += '</table>';
    resultsHTML += `<p>Overall accuracy: ${((currentTest.detectedTargets / currentTest.totalTargets) * 100).toFixed(1)}%</p>`;
    
    resultsDiv.innerHTML = resultsHTML;
}

// Event listeners
startButton.addEventListener('click', initTest);
document.addEventListener('keydown', handleInput);

// Prevent spacebar from scrolling the page
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
    }
}); 