# Photo Gallery Backend (MERN)

A REST API backend for a photo-storing application, built with Node.js, Express,
MongoDB/Mongoose, JSON Web Tokens, and Cloudinary for image storage.

## 1. Requirements

- [Node.js](https://nodejs.org/) v18+ and npm
- A MongoDB database (local install, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- A free [Cloudinary](https://cloudinary.com/) account
- [Visual Studio Code](https://code.visualstudio.com/) (or any editor)
- (Optional) [Postman](https://www.postman.com/) or the VS Code "REST Client" / "Thunder Client" extension for testing endpoints

## 2. Project structure

```
photo-gallery-backend/
├── config/
│   ├── db.js               # MongoDB connection
│   └── cloudinary.js       # Cloudinary config + upload/delete helpers
├── controllers/
│   ├── authController.js   # signup, login
│   ├── userController.js   # profile + admin user management
│   └── photoController.js  # gallery CRUD
├── middleware/
│   ├── auth.js             # JWT verification (protect)
│   ├── admin.js            # admin-only guard
│   ├── upload.js           # multer (memory storage) config
│   └── errorHandler.js     # 404 + centralized error handling
├── models/
│   ├── User.js
│   └── Photo.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   └── photoRoutes.js
├── utils/
│   └── generateToken.js
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## 3. Setup

1. **Open the folder in VS Code**: `File > Open Folder...` and select `photo-gallery-backend`.

2. **Install dependencies** (open a VS Code terminal with `` Ctrl+` `` / `` Cmd+` ``):

   ```bash
   npm install
   ```

3. **Create your `.env` file** by copying the example and filling in real values:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env`:

   ```env
   PORT=5000
   NODE_ENV=development

   MONGO_URI=mongodb://127.0.0.1:27017/photo-gallery
   # or an Atlas connection string, e.g.:
   # MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/photo-gallery

   JWT_SECRET=some_long_random_string
   JWT_EXPIRES_IN=7d

   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   CLIENT_ORIGIN=http://localhost:3000
   ```

   Get your Cloudinary values from the **Dashboard** at https://cloudinary.com/console
   (Cloud name, API Key, and API Secret are shown right at the top).

4. **Start MongoDB** if running locally (skip this if you're using Atlas):

   ```bash
   mongod
   ```

5. **Run the server**:

   ```bash
   npm run dev     # with nodemon, auto-restarts on file changes
   # or
   npm start       # plain node
   ```

   You should see:

   ```
   MongoDB connected: 127.0.0.1/photo-gallery
   Server running on port 5000
   ```

6. **Verify it's alive**: open http://localhost:5000/api/health in a browser — you
   should see `{"status":"ok","message":"Photo gallery API is running"}`.

## 4. API Reference

All request/response bodies are JSON unless noted otherwise. Protected routes require
an `Authorization: Bearer <token>` header, where `<token>` is the JWT returned from
signup/login.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Register a new user (`username`, `email`, `password`) |
| POST | `/api/auth/login` | Public | Log in (`email`, `password`), returns a JWT |
| GET | `/api/users/me` | User | Get your own profile |
| PUT | `/api/users/me` | User | Update your `username` and/or `email` |
| GET | `/api/users` | Admin | List all users |
| DELETE | `/api/users/:userId` | Admin | Delete a user |
| PUT | `/api/users/:userId/promote` | Admin | Promote a user to admin |
| PUT | `/api/users/:userId/demote` | Admin | Demote an admin to user |
| GET | `/api/photos` | User | List gallery photos |
| GET | `/api/photos/all` | Admin | List all photos (admin view) |
| POST | `/api/photos` | User | Upload a photo (`multipart/form-data`: `image`, `title`, `description`) |
| PUT | `/api/photos/:photoId` | Owner/Admin | Update title/description/image |
| DELETE | `/api/photos/:photoId` | Owner/Admin | Delete a photo |

### Example: sign up

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"Sam","email":"sam@example.com","password":"secret123"}'
```

### Example: log in

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sam@example.com","password":"secret123"}'
```

### Example: upload a photo

```bash
curl -X POST http://localhost:5000/api/photos \
  -H "Authorization: Bearer <YOUR_JWT>" \
  -F "title=Mountain View" \
  -F "description=A photograph taken during a hike." \
  -F "image=@/path/to/photo.jpg"
```

### Example: get your profile

```bash
curl http://localhost:5000/api/users/me \
  -H "Authorization: Bearer <YOUR_JWT>"
```

## 5. Creating your first admin user

New accounts always start as `role: "user"`. To create an admin, either:

- **Promote via another admin**: once you have one admin, use
  `PUT /api/users/:userId/promote`, or
- **Bootstrap the first admin manually** in MongoDB (e.g. via `mongosh` or MongoDB
  Compass):

  ```js
  use photo-gallery
  db.users.updateOne({ email: "sam@example.com" }, { $set: { role: "admin" } })
  ```

## 6. Notes on Cloudinary usage

- Images are uploaded via `multer` using **in-memory storage** (no temp files written
  to disk) and streamed directly to Cloudinary in `config/cloudinary.js`.
- Each `Photo` document stores both the `imageUrl` (secure delivery URL) and the
  `cloudinaryPublicId`. The public ID is required to later delete or replace the
  asset on Cloudinary.
- When updating a photo with a new image, the new image is uploaded **first**; the
  old Cloudinary asset is only deleted after the new upload succeeds, and after the
  database record has already been updated.
- Allowed image types: JPEG, PNG, WEBP, GIF. Max upload size: 10 MB (adjustable in
  `middleware/upload.js`).

## 7. Troubleshooting

- **"MONGO_URI is not defined"** — make sure you created `.env` from `.env.example`
  and it sits in the project root (same folder as `package.json`).
- **`ECONNREFUSED` connecting to MongoDB** — make sure `mongod` is running locally,
  or that your Atlas connection string / IP allowlist is correct.
- **401 on protected routes** — make sure you're sending
  `Authorization: Bearer <token>` and that the token hasn't expired.
- **Cloudinary upload errors** — double-check `CLOUDINARY_CLOUD_NAME`,
  `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `.env`.
