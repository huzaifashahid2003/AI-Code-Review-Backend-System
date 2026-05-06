from fastapi import FastAPI
from database import engine, Base
from routers import users, notes

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Personal Notes API",
    description="A secure notes app with JWT authentication",
    version="1.0.0"
)
app.include_router(users.routerssssssssss)

# separate both
app.include_router(notes.router)

@app.get("/")
def root():
    return {"message": "Welcome to Notes API! 📝"}


@app.post("/")
def create_post(post: PostCreate, db: Session = Depends(get_db)):
    new_post = Post(title=post.title, content=post.content, user_id=1)
    db.add(new_post)
    db.commit()     
    db.refresh(new_post)
    return new_post