# How The College Cricket Platform Works - Step-by-Step

## 🛠️ TECH STACK OVERVIEW

### Frontend Technologies
```
React 18.3.1           - UI component library
TypeScript 5.6.2       - Type-safe JavaScript
Vite 5.4.2             - Build tool & dev server
Tailwind CSS 3.4.1     - Utility-first CSS framework
Shadcn/UI              - Accessible component library
React Router DOM 6.x   - Client-side routing
Socket.IO Client 4.8.1 - Real-time WebSocket client
Axios 1.7.7           - HTTP client for API calls
Lucide React          - Icon library
```

### Backend Technologies
```
Node.js 22.13.1       - JavaScript runtime
Express 4.21.2        - Web application framework
MongoDB 8.x           - NoSQL database
Mongoose 7.0.3        - MongoDB ODM
Socket.IO 4.8.1       - Real-time WebSocket server
JWT (jsonwebtoken)    - Authentication tokens
bcryptjs              - Password hashing
Multer 1.4.4          - File upload middleware
Cloudinary 1.41.3     - Image hosting & optimization
dotenv 16.0.3         - Environment variable management
CORS 2.8.5            - Cross-Origin Resource Sharing
```

### Browser APIs
```
Picture-in-Picture API - Floating window functionality
Canvas API             - Graphics rendering
MediaStream API        - Video streaming
WebSocket Protocol     - Bi-directional communication
localStorage           - Client-side storage
```

### Development Tools
```
ESLint                - Code linting
Git & GitHub          - Version control
VS Code               - Code editor
Postman               - API testing (optional)
MongoDB Compass       - Database GUI (optional)
```

### Deployment & Cloud Services
```
Vercel                - Frontend hosting
Railway/Render        - Backend hosting (WebSocket support)
MongoDB Atlas         - Cloud database
Cloudinary            - CDN for images
```

---

## 🎬 SYSTEM STARTUP - What Happens First

### Backend Server Start (Port 5001)
```bash
cd backend
node server.js
```

**What happens:**
1. **Environment loads**: `dotenv` reads `.env` file (MongoDB URI, Cloudinary keys, JWT secret)
2. **MongoDB connects**: Mongoose establishes connection to Atlas cloud database
3. **Express initializes**: HTTP server starts on port 5001
4. **Socket.IO attaches**: WebSocket server piggybacks on HTTP server
5. **Routes register**: All API endpoints become active
6. **Middleware loads**: CORS, JSON parser, cookie parser ready
7. **Console logs**: "✅ Server running on port 5001" + "🔄 Socket.IO enabled"

**What's running now:**
- REST API accepting HTTP requests
- WebSocket server accepting connections
- MongoDB pooling ready for queries

---

### Frontend Development Start (Port 5173)
```bash
npm run dev
```

**What happens:**
1. **Vite starts**: Development server launches
2. **React loads**: Main.tsx renders App component
3. **Router initializes**: All routes become available
4. **Index page loads**: First view users see
5. **API calls fire**: Fetches matches, teams, gallery from backend
6. **Socket connects**: Establishes WebSocket to backend:5001
7. **Console logs**: "✅ Socket connected: [socketId]"

**What's running now:**
- React app with hot reload
- WebSocket connection to backend
- API calls fetching data

---

## 🏠 HOMEPAGE FLOW - When User Opens Website

### 1. **HeroSection Component Loads**

**File:** `src/components/HeroSection.tsx`

**What executes:**
```typescript
useEffect(() => {
  const fetchTopTeams = async () => {
    const response = await axios.get(getApiUrl('points-table'));
    setTopTeams(response.data.slice(0, 3));
  }
  fetchTopTeams();
}, []);
```

**Step by step:**
1. Component mounts → useEffect runs
2. Axios sends GET request to `http://localhost:5001/api/points-table`
3. **Backend receives:**
   - Express router catches `/api/points-table`
   - Routes to `routes/pointsTable.js`
   - Mongoose queries MongoDB: `PointsTable.find().sort({ points: -1 })`
4. **MongoDB returns:** Array of teams sorted by points
5. **Backend sends:** JSON response with all teams
6. **Frontend receives:** Stores in `topTeams` state
7. **React renders:** Top 3 teams with gold/silver/bronze badges
8. **User sees:** "🥇 Team A - 8 points, 🥈 Team B - 6 points, 🥉 Team C - 4 points"

**Visual result:**
- Hero video background plays
- Quick stats show (matches, teams, trophies)
- Top 3 teams display with rankings
- Animated entrance effects

---

### 2. **Gallery Section Loads**

**File:** `src/pages/Index.tsx`

**What executes:**
```typescript
useEffect(() => {
  const fetchRecentGallery = async () => {
    const response = await axios.get(getApiUrl('galleries'));
    setRecentGallery(response.data.slice(0, 3));
  }
  fetchRecentGallery();
}, []);
```

**Step by step:**
1. GET request to `http://localhost:5001/api/galleries`
2. **Backend:** `routes/gallery.js` → `Gallery.find().sort({ createdAt: -1 })`
3. **MongoDB returns:** All gallery items newest first
4. **Frontend slices:** Takes first 3 items only
5. **Images load:** Cloudinary URLs render (already optimized)
6. **User sees:** 3 recent match photos in grid layout

**Image loading optimization:**
- Cloudinary serves WebP/AVIF for modern browsers
- Lazy loading (only loads when visible)
- Fallback placeholder if image fails

---

## 📡 LIVE SCORES PAGE - Real-Time System

### When User Clicks "Live Scores"

**Navigation:** Router loads `src/pages/LiveScores.tsx`

### 1. **Component Initialization**

```typescript
useEffect(() => {
  fetchLiveMatches(); // Get current data
  
  const socket = socketService.connect();
  socket.on('ballUpdate', handleBallUpdate);
  socket.on('matchStarted', handleMatchStart);
  
  return () => {
    socket.off('ballUpdate');
    socket.off('matchStarted');
  }
}, []);
```

**What happens:**
1. **Initial fetch:** REST API call gets current match state
2. **Socket connects:** WebSocket connection established
3. **Event listeners:** Subscribes to 'ballUpdate' and 'matchStarted'
4. **Cleanup registered:** Will disconnect on page leave

---

### 2. **Fetching Live Matches**

**Request:** `GET http://localhost:5001/api/matches/live`

**Backend flow:**
```javascript
// routes/matches.js
router.get('/live', async (req, res) => {
  const liveMatches = await Match.find({ status: 'live' })
    .sort({ matchDate: -1 });
  res.json(liveMatches);
});
```

**What MongoDB does:**
1. Searches collection for `status: 'live'`
2. Sorts by newest first
3. Returns complete match documents (with nested innings, stats)

**Frontend receives:**
```json
[
  {
    "matchId": "M001",
    "team1": "Eagles United",
    "team2": "Royal Lions",
    "status": "live",
    "innings": [
      {
        "battingTeam": "Eagles United",
        "runs": 45,
        "wickets": 2,
        "overs": [
          {
            "overNumber": 1,
            "bowler": "John Doe",
            "balls": [
              { "runs": 4, "batsman": "Player A", "isBoundary": true },
              { "runs": 1, "batsman": "Player A" }
            ]
          }
        ]
      }
    ],
    "batsmanStats": [
      { "playerName": "Player A", "runs": 25, "ballsFaced": 18, "fours": 3 }
    ]
  }
]
```

**React renders:**
- Match card with teams
- Current score: "45/2 (6.2 overs)"
- Live batsmen with stats
- Bowler stats
- Last 6 balls

---

### 3. **Real-Time Updates - When Ball is Bowled**

#### Admin Side (Scorer)

**Location:** Admin panel → Live Scoring → Match details

**Admin actions:**
1. Selects striker: "Player A"
2. Selects bowler: "John Doe"
3. Enters runs: 4
4. Checks "Boundary"
5. Clicks "Add Ball" button

**Frontend code executes:**
```typescript
const addBall = async () => {
  const ballData = {
    runs: runsScored,
    batsman: striker,
    bowler: currentBowler,
    isBoundary: runs === 4 || runs === 6,
    isWide: isWide,
    isWicket: isWicket
  };
  
  await axios.post(
    `http://localhost:5001/api/matches/${matchId}/add-ball`,
    ballData
  );
};
```

---

#### Backend Processing

**Request arrives:** `POST /api/matches/M001/add-ball`

**Backend code executes:**
```javascript
// routes/matches.js
router.post('/:matchId/add-ball', async (req, res) => {
  const { runs, batsman, bowler, isBoundary } = req.body;
  
  // 1. Find match
  const match = await Match.findOne({ matchId: req.params.matchId });
  
  // 2. Get current innings
  const currentInnings = match.innings[match.currentInnings - 1];
  
  // 3. Get/create current over
  let currentOver = currentInnings.overs[currentInnings.currentOver];
  if (!currentOver) {
    currentOver = {
      overNumber: currentInnings.currentOver + 1,
      bowler: bowler,
      balls: []
    };
    currentInnings.overs.push(currentOver);
  }
  
  // 4. Create ball object
  const ball = {
    ballNumber: currentOver.balls.length + 1,
    runs: runs,
    batsman: batsman,
    bowler: bowler,
    isBoundary: isBoundary,
    timestamp: new Date()
  };
  
  // 5. Add ball to over
  currentOver.balls.push(ball);
  
  // 6. Update innings totals
  currentInnings.runs += runs;
  currentInnings.currentBall++;
  if (currentInnings.currentBall === 6) {
    currentInnings.currentOver++;
    currentInnings.currentBall = 0;
  }
  
  // 7. Update batsman stats
  let batsmanStat = match.batsmanStats.find(b => b.playerName === batsman);
  if (batsmanStat) {
    batsmanStat.runs += runs;
    batsmanStat.ballsFaced++;
    if (runs === 4) batsmanStat.fours++;
    if (runs === 6) batsmanStat.sixes++;
  }
  
  // 8. Update bowler stats
  let bowlerStat = match.bowlerStats.find(b => b.playerName === bowler);
  if (bowlerStat) {
    bowlerStat.runs += runs;
    if (currentInnings.currentBall === 0) bowlerStat.overs++;
  }
  
  // 9. Save to database
  await match.save();
  
  // 10. Broadcast via Socket.IO
  io.emit('ballUpdate', {
    matchId: match.matchId,
    match: match,
    ball: ball
  });
  
  // 11. Send response
  res.json(match);
});
```

---

#### Database Update

**MongoDB operations:**
```javascript
// Mongoose translates to MongoDB update:
db.matches.updateOne(
  { matchId: "M001" },
  {
    $push: { "innings.0.overs.0.balls": ballObject },
    $inc: { "innings.0.runs": 4 },
    $set: { "innings.0.currentBall": 3 }
  }
);
```

**What happens in database:**
1. Finds document with matchId "M001"
2. Pushes new ball to balls array
3. Increments innings runs by 4
4. Updates current ball count
5. Commits transaction
6. Returns updated document

**Time taken:** ~5-10ms

---

#### Socket.IO Broadcast

**Server emits event:**
```javascript
io.emit('ballUpdate', {
  matchId: "M001",
  match: { /* full updated match object */ },
  ball: { runs: 4, batsman: "Player A", isBoundary: true }
});
```

**What happens:**
1. Socket.IO server has list of all connected clients
2. Iterates through each WebSocket connection
3. Sends binary message with event data
4. Network transmits to all clients simultaneously
5. Takes ~10-50ms depending on network

---

#### Client Receives Update

**All users watching (Live Scores page):**

**Code listening:**
```typescript
socket.on('ballUpdate', (data) => {
  if (data.matchId === currentMatch.matchId) {
    setCurrentMatch(data.match); // Update state
  }
});
```

**React re-renders:**
1. State changes → React detects
2. Component re-renders with new data
3. DOM updates with new score
4. Animations trigger (score increment)

**User sees:**
- Score changes: 41/2 → 45/2
- Batsman runs: 21 → 25
- Batsman balls: 17 → 18
- Recent balls: [1, 0, 4, 4] → [0, 4, 4, new 4]
- Visual: Number animates up
- Sound: Could add "boundary" sound effect

**Total time from Admin clicking "Add Ball" to User seeing update: ~100-200ms**

---

## 🖼️ PICTURE-IN-PICTURE - How Floating Window Works

### User Journey

**Starting point:** User on Live Scores page, match is LIVE

### 1. **Dialog Appears Automatically**

**Trigger code:**
```typescript
useEffect(() => {
  if (currentMatch?.status === 'live' && !isPiPActive && !userDismissed) {
    setShowPermissionDialog(true);
  }
}, [currentMatch?.status]);
```

**What happens:**
1. Match status changes from 'scheduled' → 'live'
2. useEffect detects change
3. Checks: PiP not already active AND user hasn't dismissed
4. Shows dialog overlay

**User sees:**
- Full-screen semi-transparent overlay
- Green gradient card with:
  - Cricket icon (Activity component)
  - Title: "🔴 MATCH IS LIVE!"
  - Message: "The match has started! Enable floating scores..."
  - Match preview (teams, current score)
  - Buttons: "Not Now" | "Watch Live Now!"

---

### 2. **User Clicks "Watch Live Now!"**

**Code executes:**
```typescript
const enterPiP = async () => {
  setIsStartingPiP(true);
  
  const canvas = canvasRef.current;
  const video = videoRef.current;
  
  // 1. Draw score on canvas
  drawScoreToCanvas();
  
  // 2. Capture canvas as video stream
  const stream = canvas.captureStream(30); // 30 fps
  
  // 3. Set video source
  video.srcObject = stream;
  
  // 4. Wait for video to load
  await video.play();
  
  // 5. Request Picture-in-Picture
  await video.requestPictureInPicture();
  
  setIsPiPActive(true);
};
```

---

### 3. **Drawing Score on Canvas**

**Function:** `drawScoreToCanvas()`

**Canvas setup:**
```typescript
const canvas = canvasRef.current;
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 250;
```

**Drawing steps:**

**Step 1: Background gradient**
```typescript
const gradient = ctx.createLinearGradient(0, 0, 0, 250);
gradient.addColorStop(0, '#09AA5B'); // Cricbuzz green
gradient.addColorStop(1, '#078C4A');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 800, 250);
```
*Result:* Green gradient background

---

**Step 2: Header with tournament name**
```typescript
ctx.fillStyle = 'white';
ctx.font = 'bold 20px Arial';
ctx.textAlign = 'center';
ctx.fillText('COLLEGE CHAMPIONSHIP 2025', 400, 30);
```
*Result:* White text centered at top

---

**Step 3: Team names**
```typescript
ctx.font = 'bold 28px Arial';
ctx.fillText('EAGLES UNITED', 200, 80);
ctx.fillText('ROYAL LIONS', 600, 80);
```
*Result:* Team names on left and right

---

**Step 4: Current score**
```typescript
ctx.font = 'bold 48px Arial';
ctx.fillStyle = '#FFD700'; // Gold
ctx.fillText('45/2', 200, 140);
ctx.fillText('TBA', 600, 140);
```
*Result:* Large gold numbers showing scores

---

**Step 5: Overs**
```typescript
ctx.font = '18px Arial';
ctx.fillStyle = 'white';
ctx.fillText('(6.2 overs)', 200, 170);
```
*Result:* Smaller text below score

---

**Step 6: Batsman details**
```typescript
ctx.font = '16px Arial';
ctx.fillText('Player A: 25*(18)', 100, 210);
ctx.fillText('Player B: 18*(12)', 100, 235);
```
*Result:* Batsmen names with runs and balls

---

**Step 7: Live indicator**
```typescript
ctx.fillStyle = '#FF0000';
ctx.beginPath();
ctx.arc(750, 30, 8, 0, 2 * Math.PI);
ctx.fill();
ctx.fillStyle = 'white';
ctx.font = 'bold 14px Arial';
ctx.fillText('LIVE', 720, 35);
```
*Result:* Red pulsing dot with "LIVE" text

---

**Step 8: Connection status**
```typescript
// WiFi icon (simplified)
ctx.strokeStyle = 'white';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.arc(750, 220, 10, Math.PI, 0);
ctx.stroke();
```
*Result:* WiFi icon showing connection status

**Complete canvas drawing time:** ~5-10ms

---

### 4. **Streaming Canvas to Video**

**Code:**
```typescript
const stream = canvas.captureStream(30);
video.srcObject = stream;
```

**What happens internally:**
1. **Browser's Media Capture API:**
   - Takes snapshot of canvas
   - Captures at 30 frames per second
   - Creates MediaStream object
   - Each frame is a new image

2. **Video element receives stream:**
   - Video's source = canvas frames
   - Plays continuously
   - No actual video file exists
   - All happening in memory

**Resource usage:**
- CPU: ~2-5% (depends on canvas complexity)
- Memory: ~20-30 MB
- Network: 0 (local rendering)

---

### 5. **Requesting Picture-in-Picture**

**Code:**
```typescript
await video.requestPictureInPicture();
```

**Browser API flow:**

1. **Permission check:**
   - Some browsers require user gesture (we have it - button click)
   - Check if PiP is supported: `document.pictureInPictureEnabled`

2. **Window creation:**
   - Browser creates new floating window
   - Default size: ~400x200px (adjustable)
   - Always on top of other windows

3. **Video routing:**
   - Video stream redirects to PiP window
   - Original video element hidden
   - PiP window takes control

4. **Event firing:**
```typescript
video.addEventListener('enterpictureinpicture', () => {
  console.log('PiP activated');
  setIsPiPActive(true);
});
```

**User sees:**
- Small floating window appears
- Shows live cricket score
- Can drag to any screen position
- Stays on top of ALL applications (Chrome, VSCode, Excel, etc.)

---

### 6. **Continuous Updates in PiP**

**Animation loop:**
```typescript
const updatePiP = () => {
  if (isPiPActive && currentMatch) {
    drawScoreToCanvas(); // Re-draw with new data
    requestAnimationFrame(updatePiP); // Loop
  }
};

useEffect(() => {
  if (isPiPActive) {
    updatePiP();
  }
}, [isPiPActive, currentMatch]);
```

**What happens every frame (30fps):**
1. **Socket receives update** (ball scored)
2. **React state updates** (currentMatch changes)
3. **useEffect triggers** (detects state change)
4. **drawScoreToCanvas() runs** (redraws canvas)
5. **captureStream sends new frame** (to video)
6. **PiP window updates** (shows new score)

**Timeline:**
- Ball bowled → 0ms
- Socket broadcast → 10ms
- Client receives → 50ms
- React updates → 55ms
- Canvas redraws → 60ms
- PiP shows → 65ms

**Total:** Under 100ms from action to visual

---

### 7. **PiP Window Controls**

**What user can do with PiP window:**

1. **Resize:** Drag corners to make bigger/smaller
2. **Move:** Drag to any screen position
3. **Close:** X button closes PiP (returns to normal)
4. **Pause:** Play/pause button (we keep playing)

**Browser provides controls automatically**

---

### 8. **Exiting PiP**

**User clicks X on PiP window:**

**Event fires:**
```typescript
video.addEventListener('leavepictureinpicture', () => {
  console.log('PiP deactivated');
  setIsPiPActive(false);
  setShowPermissionDialog(false);
});
```

**Cleanup:**
1. PiP window closes
2. Video stream stops
3. Canvas stops rendering
4. State resets
5. Normal page view restored

---

## 🔐 ADMIN AUTHENTICATION - Login Flow

### User Visits `/admin-login`

**File:** `src/pages/AdminLogin.tsx`

**Form appears:**
```tsx
<Input 
  type="email" 
  placeholder="Admin Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
<Input 
  type="password" 
  placeholder="Password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>
<Button onClick={handleLogin}>Login</Button>
```

---

### Admin Enters Credentials

**Example:**
- Email: `ponamandi@gmail.com`
- Password: `prashanth`

**Submit button clicked:**

**Frontend code:**
```typescript
const handleLogin = async () => {
  try {
    const response = await axios.post('http://localhost:5001/api/auth/login', {
      email: email,
      password: password
    });
    
    const { token, user } = response.data;
    
    // Store token
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Redirect
    navigate('/admin');
  } catch (error) {
    toast.error('Invalid credentials');
  }
};
```

---

### Backend Authentication

**Request:** `POST /api/auth/login`

**Backend code:**
```javascript
// routes/auth.js
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // 1. Find user in database
  const user = await User.findOne({ email });
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // 2. Verify password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // 3. Generate JWT token
  const token = jwt.sign(
    { 
      userId: user._id,
      email: user.email,
      role: user.role // 'admin'
    },
    process.env.JWT_SECRET, // From .env file
    { expiresIn: '24h' }
  );
  
  // 4. Send response
  res.json({
    token: token,
    user: {
      email: user.email,
      role: user.role
    }
  });
});
```

**Password verification:**
```javascript
// What bcrypt does:
// 1. Takes entered password: "prashanth"
// 2. Takes stored hash: "$2a$10$..."
// 3. Applies same salt from hash
// 4. Hashes entered password
// 5. Compares hashes
// 6. Returns true if match
```

**JWT token creation:**
```javascript
// Token structure:
{
  header: { alg: 'HS256', typ: 'JWT' },
  payload: { userId: '123', email: 'admin@...', role: 'admin', exp: 1733... },
  signature: 'hashed_with_secret'
}

// Encoded result (what frontend receives):
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6ImFkbWluQC4uLiIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTczMy4uLn0.abcdef123456..."
```

---

### Token Storage

**Frontend stores:**
```typescript
localStorage.setItem('token', 'eyJhbG...');
localStorage.setItem('user', '{"email":"...","role":"admin"}');
```

**Browser localStorage:**
```
Key: "token"
Value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

Key: "user"  
Value: "{\"email\":\"ponamandi@gmail.com\",\"role\":\"admin\"}"
```

---

### Protected Route Access

**User navigates to `/admin`**

**Protected Route wrapper:**
```typescript
// src/components/ProtectedRoute.tsx
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/admin-login" />;
  }
  
  // Verify token is valid (optional check)
  try {
    const decoded = jwt_decode(token);
    if (decoded.exp < Date.now() / 1000) {
      // Token expired
      localStorage.removeItem('token');
      return <Navigate to="/admin-login" />;
    }
  } catch {
    return <Navigate to="/admin-login" />;
  }
  
  return children;
};
```

**If valid:** Renders admin dashboard
**If invalid:** Redirects to login

---

### Authenticated API Requests

**When admin performs action (e.g., add ball):**

**Frontend adds token to request:**
```typescript
const response = await axios.post(
  'http://localhost:5001/api/matches/M001/add-ball',
  ballData,
  {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }
);
```

**Backend verifies token:**
```javascript
// middleware/authMiddleware.js
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next(); // Proceed to route handler
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Applied to routes:
router.post('/:matchId/add-ball', authMiddleware, async (req, res) => {
  // req.user contains { userId, email, role }
  // Only executes if token valid
});
```

---

## 📊 STATISTICS CALCULATION - How Numbers Are Computed

### When Ball is Added

**Example:** Player A scores 4 runs off 1 ball

**Updates triggered:**

### 1. **Batsman Statistics Update**

```javascript
// Find batsman's stat object
let batsmanStat = match.batsmanStats.find(
  b => b.playerName === 'Player A'
);

// Update counts
batsmanStat.runs += 4;           // 21 → 25
batsmanStat.ballsFaced += 1;     // 17 → 18
batsmanStat.fours += 1;          // 2 → 3

// Calculate strike rate
batsmanStat.strikeRate = (batsmanStat.runs / batsmanStat.ballsFaced) * 100;
// (25 / 18) * 100 = 138.89
```

**Visual on scoreboard:**
```
Player A
Runs: 25 | Balls: 18 | SR: 138.89 | 4s: 3 | 6s: 0
```

---

### 2. **Bowler Statistics Update**

```javascript
// Find bowler's stat object
let bowlerStat = match.bowlerStats.find(
  b => b.playerName === 'John Doe'
);

// Update counts
bowlerStat.runs += 4;            // 18 → 22
// Ball count updated separately (when over completes)

// If over completes (6 balls):
if (currentBall === 6) {
  bowlerStat.overs += 1;         // 2 → 3
}

// Calculate economy rate
bowlerStat.economy = bowlerStat.runs / bowlerStat.overs;
// 22 / 3 = 7.33 runs per over
```

**Visual:**
```
John Doe
Overs: 3 | Runs: 22 | Wickets: 1 | Economy: 7.33
```

---

### 3. **Team Score Update**

```javascript
// Current innings
currentInnings.runs += 4;        // 41 → 45
currentInnings.currentBall += 1;  // 2 → 3

// If 6 balls completed:
if (currentInnings.currentBall === 6) {
  currentInnings.currentOver += 1;
  currentInnings.currentBall = 0;
}

// Calculate run rate
const overs = currentInnings.currentOver + (currentInnings.currentBall / 6);
const runRate = currentInnings.runs / overs;
// 45 / 6.3 = 7.14 runs per over
```

**Scoreboard shows:**
```
EAGLES UNITED: 45/2 (6.3 overs)
Run Rate: 7.14
```

---

### 4. **Projected Score (Optional)**

```javascript
// If T20 (20 overs total):
const remainingOvers = 20 - currentOvers;
const projectedScore = currentRuns + (runRate * remainingOvers);

// 45 + (7.14 * 13.7) = 45 + 97.8 = 142.8 ≈ 143
```

**Display:** "Projected: 143"

---

## 🗄️ DATABASE OPERATIONS - MongoDB Queries

### Example: Fetching Live Matches

**Request:** GET `/api/matches/live`

**Mongoose query:**
```javascript
const matches = await Match.find({ status: 'live' })
  .sort({ matchDate: -1 })
  .limit(10);
```

**MongoDB shell equivalent:**
```javascript
db.matches.find({ 
  status: "live" 
})
.sort({ matchDate: -1 })
.limit(10)
```

**What MongoDB does:**

1. **Index lookup:**
   - Checks if index exists on `status` field
   - Uses index for fast filtering
   - Scans index instead of full collection

2. **Document retrieval:**
   - Finds all documents where status = "live"
   - Returns document IDs from index

3. **Sorting:**
   - Orders by matchDate descending
   - May use index on matchDate if exists

4. **Limiting:**
   - Returns only first 10 results
   - Avoids loading too much data

**Query performance:**
- With index: ~5-10ms for 1000 documents
- Without index: ~100-500ms for 1000 documents

**Result returned:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "matchId": "M001",
    "team1": "Eagles United",
    "team2": "Royal Lions",
    "status": "live",
    "innings": [...],
    "batsmanStats": [...]
  }
]
```

---

### Example: Adding Ball (Complex Update)

**Mongoose operation:**
```javascript
const match = await Match.findOne({ matchId: 'M001' });

// Modify nested structure
match.innings[0].overs[5].balls.push({
  ballNumber: 3,
  runs: 4,
  batsman: 'Player A',
  isBoundary: true
});

match.innings[0].runs += 4;

await match.save();
```

**MongoDB update command:**
```javascript
db.matches.updateOne(
  { matchId: "M001" },
  {
    $push: {
      "innings.0.overs.5.balls": {
        ballNumber: 3,
        runs: 4,
        batsman: "Player A",
        isBoundary: true
      }
    },
    $inc: {
      "innings.0.runs": 4,
      "innings.0.currentBall": 1
    }
  }
);
```

**MongoDB execution:**
1. Finds document with matchId "M001"
2. Navigates nested structure: innings[0].overs[5].balls
3. Pushes new object to balls array
4. Increments runs by 4
5. Increments currentBall by 1
6. Writes changes to disk
7. Returns modified document

**Atomic operation:** All changes succeed or all fail (no partial updates)

---

## 🔄 COMPLETE REQUEST-RESPONSE CYCLE

### Example: Admin Adds Ball

**Step-by-step with timestamps:**

**T+0ms:** Admin clicks "Add Ball" button
- React synthetic event fires
- `addBall()` function called

**T+5ms:** Axios sends HTTP request
- JSON payload created
- Authorization header added
- POST request to `http://localhost:5001/api/matches/M001/add-ball`

**T+10ms:** Request reaches backend
- Express receives HTTP request
- Body parser extracts JSON
- CORS middleware checks origin
- Auth middleware verifies JWT token

**T+15ms:** Route handler executes
- Mongoose query finds match
- Match document loaded into memory
- JavaScript objects modified

**T+20ms:** MongoDB update
- Update command sent to database
- Document modified in collection
- Changes written to disk
- Indexes updated

**T+25ms:** Socket.IO broadcast
- io.emit('ballUpdate') called
- Event serialized to binary
- Sent to all connected WebSocket clients

**T+30ms:** All clients receive WebSocket message
- Browser deserializes message
- Socket.IO client parses event
- Callback function executes

**T+35ms:** React state updates
- setCurrentMatch(newData)
- React schedules re-render
- Virtual DOM diff calculated

**T+40ms:** DOM updates
- Real DOM patched with changes
- CSS transitions start
- Numbers animate

**T+50ms:** User sees update
- Score changes on screen
- PiP window updates
- Animations complete

**Total time: ~50-100ms from click to visual update**

---

## 🎯 COMPLETE USER JOURNEY SUMMARY

### Public User Experience

1. **Opens website** → Homepage loads
2. **Sees hero section** → Top teams fetched via API
3. **Clicks "Live Scores"** → WebSocket connects, live matches load
4. **Match goes LIVE** → Auto-notification appears
5. **Enables PiP** → Canvas draws score, floating window appears
6. **Switches to other app** → PiP stays on top, updates continue
7. **Ball is bowled** → Socket sends update, PiP redraws in <100ms
8. **Match ends** → Final score shows, stats saved
9. **Checks points table** → Sees updated rankings
10. **Views gallery** → Recent match photos displayed

---

### Admin User Experience

1. **Visits `/admin-login`** → Login form appears
2. **Enters credentials** → JWT generated, token stored
3. **Redirects to dashboard** → Protected route allows access
4. **Creates match** → Form submitted, MongoDB insert
5. **Match day arrives** → Opens Live Scoring panel
6. **Clicks "Start"** → Match status → LIVE, Socket notifies all
7. **For each ball:**
   - Selects batsman/bowler
   - Enters runs
   - Clicks "Add Ball"
   - Backend updates database
   - Socket broadcasts to all viewers
   - Repeats for 120 balls (T20)
8. **Innings ends** → Clicks "End Innings", teams switch
9. **Match completes** → Enters result, saves stats
10. **Views statistics** → All data preserved for history

---

**This is how every component works together to create a real-time, interactive cricket scoring platform!** 🏏

