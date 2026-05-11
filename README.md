# 🪄 Unfilter AI — Photo Filter Removal with Machine Learning

> Strip Instagram-style color filters from photos and restore their natural look using a trained ML model.

---

## 📸 What is this?

Unfilter AI is a full-stack web application that uses a machine learning model to reverse color filters applied to images. Upload a filtered photo, click **Remove Filters**, and download the restored version.

The idea came out of a casual conversation with friends — and turned into a real working project. The dataset was **collected and labeled entirely by hand**, and the model was trained from scratch on limited hardware, so results are currently low-resolution and slightly blurry. That's v1. A neural network upgrade is already planned.

---

## 🗂️ Project Structure

```
unfilter-ai/
│
├── backend/                        # FastAPI ML backend
│   ├── main.py                     # API server (endpoints + ML pipeline)
│   ├── requirements.txt            # Python dependencies
│   └── model_2.pkl                 # Trained model (add manually — not tracked by git)
│
├── frontend/                       # React + TanStack Start frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── FilterRemover.tsx   # Main app component
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── routes/
│   │   │   ├── __root.tsx
│   │   │   └── index.tsx
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── styles.css
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

---

## ⚙️ Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 19, TanStack Router, Tailwind CSS v4, Framer Motion |
| Backend   | FastAPI, Uvicorn                    |
| ML Model  | Random Forest Regressor (scikit-learn) |
| Image Processing | NumPy, Pillow               |

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/unfilter-ai.git
cd unfilter-ai
```

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows (Command Prompt)
.venv\Scripts\activate.bat

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

> ⚠️ Place your `model_2.pkl` file inside the `backend/` folder before running.

```bash
# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API is now live at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

### 3. Frontend setup

```bash
cd frontend
npm install       # or: bun install
npm run dev       # or: bun dev
```

Frontend runs at `http://localhost:3000`

### 4. Connect frontend to backend

By default the frontend points to `http://localhost:8000`.
For a different backend URL, create a `.env` file in the `frontend/` folder:

```env
VITE_API_URL=https://your-api-url.com
```

---

## 🔌 API Reference

| Method | Endpoint   | Description                                      |
|--------|------------|--------------------------------------------------|
| GET    | `/health`  | Health check — returns `{ "status": "ok" }`     |
| POST   | `/predict` | Upload an image, receive a restored JPEG back   |

**`POST /predict`**
- Body: `multipart/form-data` with field `file` (JPG / PNG / WebP)
- Response: `image/jpeg` file download

---

## 🧠 How the Model Works

1. Image is resized to **256×256** (aspect-ratio-preserving crop)
2. **7×7 patches** are extracted around every pixel
3. Each patch is flattened and fed to the **Random Forest Regressor**
4. Model predicts the restored RGB value for each pixel
5. Output is reconstructed into the final image and returned

---

## ⚠️ Current Limitations

- Trained on a **small, self-collected dataset** due to hardware constraints
- Output images are **256×256** (low resolution)
- Results may appear slightly blurry
- Processing time increases with image complexity

---

## 🔮 Roadmap

- [ ] Replace Random Forest with a **Convolutional Neural Network (CNN)**
- [ ] Support higher output resolutions
- [ ] Batch image processing
- [ ] Deploy backend to cloud (AWS / Render / Railway)
- [ ] Add before/after slider UI

---

## 🙏 Acknowledgements

- Idea sparked during a conversation with friends 💡
- Dataset collected and labeled manually
- Built with [FastAPI](https://fastapi.tiangolo.com/), [React](https://react.dev/), and [scikit-learn](https://scikit-learn.org/)

---

## 📄 License

MIT License — feel free to use, modify, and build on this.
