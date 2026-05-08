from fastapi import APIRouter , UploadFile, File
from services.review_service import process_file

router = APIRouter()

@router.post("/router")
async def upload(file: UploadFile = File(...)):
    result = await process_file(file)
    return result