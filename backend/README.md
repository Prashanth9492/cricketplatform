# Cricket Championship Backend (MERN)

## Setup

1. Install dependencies:
   ```
npm install
   ```
2. Create a `.env` file (already provided) and set your MongoDB Atlas URI.
3. The backend is configured to use MongoDB Atlas cloud database.
4. Start the backend server:
   ```
npm run dev
   ```
   or
   ```
npm start
   ```

## API Endpoints

- `POST /api/teams` (with logo upload)
- `POST /api/players` (with photo upload)
- `POST /api/matches`
- `POST /api/news` (with image upload)
- `POST /api/gallery` (with multiple images upload)
- `GET /api/teams`, `/api/players`, `/api/matches`, `/api/news`, `/api/gallery`

Uploads are served from `/uploads`.

No authentication required. Designed for local development and integration with your React frontend.
