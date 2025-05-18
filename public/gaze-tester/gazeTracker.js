window.onload = async () => {
    const canvas = document.getElementById('gazeCanvas');
    // Use low-latency hint for better performance
    const ctx = canvas.getContext('2d', { 
        alpha: false,
        desynchronized: true,
        willReadFrequently: false
    });
  
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        pathCenterX = window.innerWidth / 2;
        pathCenterY = window.innerHeight / 2;
        if (isTrackingTest) {
            generateCircularPath();
        }
    }
    
    resizeCanvas();
    // Debounce resize for better performance
    let resizeTimeout;
    window.addEventListener('resize', () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resizeCanvas, 100);
    });
  
    try {
        // Initialize webgazer with performance settings
        await webgazer.setRegression('ridge')
            .setTracker('TFFacemesh')
            .begin();
            
        // Configure WebGazer to show eye features
        Object.assign(webgazer.params, {
            showVideo: true,
            showFaceOverlay: true,
            showFaceFeedbackBox: true,
            showPredictionPoints: false,
            trackEyes: true,
            showEyePatches: true,
            camConstraints: { 
                video: { 
                    width: { min: 320, ideal: 640, max: 1280 },
                    height: { min: 240, ideal: 480, max: 720 },
                    facingMode: "user"
                }
            }
        });

        // Set up the video feed with proper sizing
        const videoFeed = document.getElementById('webgazerVideoFeed');
        if (videoFeed) {
            videoFeed.style.width = '320px';
            videoFeed.style.height = '240px';
        }

        // Remove any inline styles that might interfere with our CSS
        const video = document.getElementById('webgazerVideoContainer');
        if (video) {
            video.style.width = '320px';
            video.style.height = '240px';
        }

        // Add gaze listener
        await webgazer.setGazeListener((data, elapsedTime) => {
            if (data == null) return;
            
            // Get raw gaze prediction
            const x = data.x;
            const y = data.y;
            
            // Update gaze positions with smoothing
            if (x && y) {
                if (currentGaze.left.x === null) {
                    currentGaze.left = { x: x, y: y };
                    currentGaze.right = { x: x, y: y };
                } else {
                    // Apply smoothing
                    const smoothingFactor = 0.8;
                    currentGaze.left.x = currentGaze.left.x * smoothingFactor + x * (1 - smoothingFactor);
                    currentGaze.left.y = currentGaze.left.y * smoothingFactor + y * (1 - smoothingFactor);
                    currentGaze.right.x = currentGaze.right.x * smoothingFactor + x * (1 - smoothingFactor);
                    currentGaze.right.y = currentGaze.right.y * smoothingFactor + y * (1 - smoothingFactor);
                }
            }
        });

        startAnimation();
        // Start with first calibration point
        showNextCalibrationPoint();

    } catch (err) {
        console.error('Error initializing webgazer:', err);
    }
};

let currentGaze = {
    left: { x: null, y: null },
    right: { x: null, y: null }
};

let circle = { x: 100, y: 200, radius: 25 };  // Single, slightly larger target
let isTrackingTest = false;
let isCalibrating = true;
let trackingStartTime = null;
let trackingDuration = 15000;  // 15 seconds
let trackingData = [];
let testPath = [];
let pathCenterX = window.innerWidth / 2;
let pathCenterY = window.innerHeight / 2;
const pathRadius = 200;
let frameCount = 0;
let lastFpsUpdate = 0;
let currentFps = 0;
let targetImage = new Image();  // Create image object

// Load the target image
targetImage.src = '/gaze-tester/images/jam.png';
targetImage.onload = () => {
    console.log('Target image loaded successfully');
};
targetImage.onerror = (err) => {
    console.error('Error loading target image:', err);
};

function generateCircularPath() {
    testPath = [];
    const steps = 180;  // More steps for smoother movement over longer duration
    const angleStep = (Math.PI * 2) / steps;
    for (let i = 0; i < steps; i++) {
        const angle = i * angleStep;
        testPath.push({
            x: pathCenterX + Math.cos(angle) * pathRadius,
            y: pathCenterY + Math.sin(angle) * pathRadius
        });
    }
}

function startTrackingTest() {
    console.log("Starting tracking test...");
    isCalibrating = false;
    isTrackingTest = true;
    trackingStartTime = performance.now();
    trackingData = [];
    currentGaze = {
        left: { x: null, y: null },
        right: { x: null, y: null }
    };
    generateCircularPath();
    circle.x = testPath[0].x;
    circle.y = testPath[0].y;
}

function calculateAccuracy() {
    if (trackingData.length === 0) return 0;
    
    let totalError = 0;
    let validSamples = 0;
    
    // Calculate the screen diagonal for scaling
    const screenDiagonal = Math.sqrt(window.innerWidth * window.innerWidth + window.innerHeight * window.innerHeight);
    // Use a more forgiving radius multiplier (8 times the circle radius)
    const maxErrorDistance = circle.radius * 8;
    
    for (const data of trackingData) {
        // Skip invalid gaze data
        if (!data.gaze.left.x || !data.gaze.right.x) continue;
        
        // Calculate the average gaze position between both eyes
        const avgGazeX = (data.gaze.left.x + data.gaze.right.x) / 2;
        const avgGazeY = (data.gaze.left.y + data.gaze.right.y) / 2;
        
        // Calculate distance from gaze point to target
        const distance = Math.sqrt(
            Math.pow(avgGazeX - data.target.x, 2) + 
            Math.pow(avgGazeY - data.target.y, 2)
        );
        
        // Use a sigmoid-like function to make the error curve more forgiving
        // This will make small deviations less punishing and large deviations more forgiving
        const normalizedError = Math.min(1, Math.pow(distance / maxErrorDistance, 1.5));
        totalError += normalizedError;
        validSamples++;
    }
    
    if (validSamples === 0) return 0;
    
    // Calculate accuracy percentage with improved scaling
    const accuracy = 100 * (1 - (totalError / validSamples));
    return Math.max(0, Math.min(100, Math.round(accuracy)));
}

function updateFPS(timestamp) {
    frameCount++;
    if (timestamp - lastFpsUpdate >= 500) { // Update every 500ms for more stable reading
        currentFps = Math.round((frameCount * 1000) / (timestamp - lastFpsUpdate));
        frameCount = 0;
        lastFpsUpdate = timestamp;
    }
}

function startAnimation() {
    const canvas = document.getElementById('gazeCanvas');
    animate();
}

function drawLaser(ctx, fromX, fromY, toX, toY) {
    const gradient = ctx.createLinearGradient(fromX, fromY, toX, toY);
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)'); 
    gradient.addColorStop(1, 'rgba(116,13,164,255)');

    
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.stroke();
}

function animate(timestamp) {
    requestAnimationFrame(animate);
    updateFPS(timestamp);

    const canvas = document.getElementById('gazeCanvas');
    const ctx = canvas.getContext('2d', { 
        alpha: false,
        desynchronized: true,
        willReadFrequently: false
    });

    // Don't clear or draw anything during countdown
    if (!isTrackingTest && !isCalibrating) return;

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(1, '#FAFAFA');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isTrackingTest) {
        const progress = Math.min((timestamp - trackingStartTime) / trackingDuration, 1);
        const pathIndex = Math.floor(progress * testPath.length);
        
        if (progress >= 1) {
            isTrackingTest = false;
            const accuracy = calculateAccuracy();
            console.log("Tracking data points:", trackingData.length);
            console.log("Final accuracy:", accuracy);
            alert(`Tracking test complete! Accuracy: ${accuracy}%`);
        } else {
            const pathPos = testPath[pathIndex];
            circle.x = pathPos.x;
            circle.y = pathPos.y;

            // Record tracking data and calculate current accuracy
            if (currentGaze.left.x && currentGaze.right.x) {
                const currentPoint = {
                    gaze: {
                        left: { ...currentGaze.left },
                        right: { ...currentGaze.right }
                    },
                    target: {
                        x: circle.x,
                        y: circle.y
                    },
                    timestamp: timestamp - trackingStartTime
                };
                
                trackingData.push(currentPoint);
                
                // Calculate current deviation with the same scaling as accuracy calculation
                const avgGazeX = (currentGaze.left.x + currentGaze.right.x) / 2;
                const avgGazeY = (currentGaze.left.y + currentGaze.right.y) / 2;
                const currentDeviation = Math.sqrt(
                    Math.pow(avgGazeX - circle.x, 2) + 
                    Math.pow(avgGazeY - circle.y, 2)
                );
                
                // Calculate percentage of max error for deviation display
                const maxErrorDistance = circle.radius * 8;
                const deviationPercentage = Math.max(0, Math.min(100, 
                    Math.round(100 * (1 - Math.pow(currentDeviation / maxErrorDistance, 1.5)))
                ));
                
                // Show stats in bottom right corner
                ctx.font = "16px Arial";
                ctx.fillStyle = "#2C2C2C";
                ctx.textAlign = "right";
                
                // Position stats 20px from bottom and right edges
                const statsY = canvas.height - 80; // Start 80px from bottom
                ctx.fillText(`Current Deviation: ${Math.round(currentDeviation)}px (${deviationPercentage}%)`, canvas.width - 20, statsY);
                ctx.fillText(`Overall Accuracy: ${calculateAccuracy()}%`, canvas.width - 20, statsY + 25);
                ctx.fillText(`FPS: ${currentFps}`, canvas.width - 20, statsY + 50);
            }

            // Show remaining time in top center
            const remainingSeconds = Math.ceil((trackingDuration - (timestamp - trackingStartTime)) / 1000);
            ctx.font = "48px Arial";
            ctx.fillStyle = "#2C2C2C";
            ctx.textAlign = "center";
            ctx.fillText(`${remainingSeconds}`, canvas.width / 2, 60);
        }

        // Draw target circle
        ctx.save();  // Save current context state
        const imageSize = circle.radius * 8;  // Use circle radius to determine image size
        ctx.translate(circle.x - imageSize/2, circle.y - imageSize/2);  // Center image at target point
        ctx.drawImage(targetImage, 0, 0, imageSize, imageSize);
        ctx.restore();  // Restore context state

        // Draw gaze points and lasers
        if (currentGaze.left.x && currentGaze.right.x) {
            // Draw lasers to single target
            drawLaser(ctx, currentGaze.left.x, currentGaze.left.y, circle.x, circle.y);
            drawLaser(ctx, currentGaze.right.x, currentGaze.right.y, circle.x, circle.y);

            // Draw gaze points
            ctx.beginPath();
            ctx.arc(currentGaze.left.x, currentGaze.left.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#FF4444';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(currentGaze.right.x, currentGaze.right.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#FF4444';
            ctx.fill();
        }
    }
}

let calibrationClicks = 0;
const totalClicksNeeded = 5;
const totalDotsNeeded = 8;  // Changed from 9 to 8 since we're skipping top-left dot

document.querySelectorAll('.calibrationDot').forEach(dot => {
    // Only hide the top-left dot initially
    const isTopLeft = dot.style.top === '5%' && dot.style.left === '5%';
    if (isTopLeft) {
        dot.style.display = 'none';
        dot.dataset.skip = 'true';  // Mark this dot to be skipped
    } else {
        dot.style.display = 'block';
    }
    
    let clickCount = 0;

    dot.addEventListener('click', () => {
        if (dot.dataset.skip === 'true') return;  // Skip if this is the hidden dot
        
        clickCount++;
        calibrationClicks++;

        webgazer.recordScreenPosition(dot.offsetLeft + (dot.offsetWidth / 2), 
                                   dot.offsetTop + (dot.offsetHeight / 2), 'click');
        dot.style.backgroundColor = `rgb(${255 - clickCount * 40}, 0, 0)`;

        if (clickCount >= totalClicksNeeded) {
            dot.style.display = 'none';
        }

        if (calibrationClicks >= totalClicksNeeded * totalDotsNeeded) {
            document.getElementById('calibrationContainer').style.display = 'none';
            startCountdown();
        }
    });
});

function startCountdown() {
    isCalibrating = false;  // We're done with calibration
    const container = document.getElementById('calibrationContainer');
    let count = 3;
    
    // Play the countdown sound once at the start
    const countdownSound = document.getElementById('countdownSound');
    countdownSound.currentTime = 0;
    countdownSound.play();
    
    function showNumber() {
        container.innerHTML = `<div class="countdown">${count}</div>`;
        
        // Clear the canvas and draw the number
        const canvas = document.getElementById('gazeCanvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = "bold 200px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(count.toString(), canvas.width / 2, canvas.height / 2);
        
        if (count > 0) {
            count--;
            setTimeout(showNumber, 1000);
        } else {
            container.innerHTML = '';
            startTrackingTest();
        }
    }
    
    showNumber();
}

// Calibration points configuration
const calibrationPoints = [
    { top: '5%', left: '5%' },
    { top: '5%', left: '45%' },
    { top: '5%', left: '85%' },
    { top: '45%', left: '5%' },
    { top: '45%', left: '45%' },
    { top: '45%', left: '85%' },
    { top: '85%', left: '5%' },
    { top: '85%', left: '45%' },
    { top: '85%', left: '85%' }
];

let currentCalibrationPoint = 0;
let currentClickCount = 0;
const requiredClicks = 5;
let calibrationComplete = false;
let gazeData = [];
const smoothingFactor = 0.95;
let lastGazeX = null;
let lastGazeY = null;
let isClickEnabled = true;

function showNextCalibrationPoint() {
    const container = document.getElementById('calibrationContainer');
    container.innerHTML = ''; // Clear previous dot
    isClickEnabled = true;

    if (currentCalibrationPoint < calibrationPoints.length) {
        // Update progress message
        document.getElementById('calibration-message').textContent = 'Look at the purple dot and click it 5 times.';
        document.getElementById('calibration-count').textContent = 
            `Calibration Point: ${currentCalibrationPoint + 1}/${calibrationPoints.length}`;

        // Create new dot
        const dot = document.createElement('div');
        dot.className = 'calibrationDot';
        dot.style.top = calibrationPoints[currentCalibrationPoint].top;
        dot.style.left = calibrationPoints[currentCalibrationPoint].left;
        
        // Add click counter display
        const clickCounter = document.createElement('div');
        clickCounter.className = 'clickCounter';
        clickCounter.textContent = '0/5';
        dot.appendChild(clickCounter);
        
        currentClickCount = 0;
        
        dot.onclick = () => {
            if (!isClickEnabled) return;
            
            // Play click sound
            const clickSound = document.getElementById('clickSound');
            clickSound.currentTime = 0; // Reset sound to start
            clickSound.play();
            
            currentClickCount++;
            if (currentClickCount <= requiredClicks) {
                clickCounter.textContent = `${currentClickCount}/5`;
                
                // Update dot appearance based on clicks
                const progress = currentClickCount / requiredClicks;
                dot.style.background = `radial-gradient(circle, #6B2FFA ${progress * 100}%, #8B5FFA 100%)`;
                
                // Record click for WebGazer
                webgazer.recordScreenPosition(
                    dot.offsetLeft + (dot.offsetWidth / 2),
                    dot.offsetTop + (dot.offsetHeight / 2),
                    'click'
                );

                if (currentClickCount === requiredClicks) {
                    isClickEnabled = false;
                    setTimeout(() => {
                        currentCalibrationPoint++;
                        if (currentCalibrationPoint < calibrationPoints.length) {
                            showNextCalibrationPoint();
                        } else {
                            completeCalibration();
                        }
                    }, 300); // Short delay before moving to next point
                }
            }
        };

        container.appendChild(dot);
    }
}

function completeCalibration() {
    calibrationComplete = true;
    const container = document.getElementById('calibrationContainer');
    container.innerHTML = ''; // Remove last dot

    // Show alert and start countdown
    alert('Calibration complete! The test will begin after a countdown.');
    
    document.getElementById('calibration-message').textContent = 'Get ready! Test starting...';
    document.getElementById('calibration-count').style.display = 'none';
    
    // Start countdown
    startCountdown();
}

// Handle window resize
window.addEventListener('resize', function() {
    const canvas = document.getElementById('gazeCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
