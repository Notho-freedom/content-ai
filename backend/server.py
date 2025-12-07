from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="ContentGenius AI")
api_router = APIRouter(prefix="/api")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

# Plans Configuration
PLANS = {
    "free": {"name": "Free", "price": 0, "credits": 10, "features": ["10 crédits/mois", "Génération basique", "Support email"]},
    "pro": {"name": "Pro", "price": 19.00, "credits": 100, "features": ["100 crédits/mois", "Tous les templates", "Support prioritaire", "Historique illimité"]},
    "enterprise": {"name": "Enterprise", "price": 49.00, "credits": 500, "features": ["500 crédits/mois", "API Access", "Support dédié", "Templates personnalisés"]}
}

CREDIT_PACKAGES = {
    "small": {"credits": 20, "price": 5.00},
    "medium": {"credits": 50, "price": 10.00},
    "large": {"credits": 150, "price": 25.00}
}

CONTENT_COSTS = {
    "article": 5,
    "email": 2,
    "social": 1
}

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    plan: str
    credits: int
    created_at: str

class GenerateRequest(BaseModel):
    content_type: str  # article, email, social
    prompt: str
    tone: Optional[str] = "professional"
    language: Optional[str] = "fr"

class GenerationResponse(BaseModel):
    id: str
    content_type: str
    prompt: str
    generated_content: str
    credits_used: int
    created_at: str

class CheckoutRequest(BaseModel):
    package_type: str  # plan name or credit package
    origin_url: str

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Non authentifié")
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
    return user

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hash_password(user_data.password),
        "plan": "free",
        "credits": PLANS["free"]["credits"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    token = create_token(user_id)
    return {"token": token, "user": {k: v for k, v in user.items() if k != "password" and k != "_id"}}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    token = create_token(user["id"])
    return {"token": token, "user": {k: v for k, v in user.items() if k != "password"}}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {k: v for k, v in user.items() if k != "password"}

# ============== CONTENT GENERATION ==============

@api_router.post("/generate", response_model=GenerationResponse)
async def generate_content(request: GenerateRequest, user: dict = Depends(get_current_user)):
    content_type = request.content_type.lower()
    if content_type not in CONTENT_COSTS:
        raise HTTPException(status_code=400, detail="Type de contenu invalide")
    
    cost = CONTENT_COSTS[content_type]
    if user["credits"] < cost:
        raise HTTPException(status_code=402, detail="Crédits insuffisants")
    
    # Generate content with AI
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        
        system_messages = {
            "article": f"Tu es un rédacteur professionnel. Écris un article complet et engageant en {request.language}. Ton: {request.tone}.",
            "email": f"Tu es un expert en copywriting email. Rédige un email professionnel et persuasif en {request.language}. Ton: {request.tone}.",
            "social": f"Tu es un expert en réseaux sociaux. Crée un post viral et engageant en {request.language}. Ton: {request.tone}. Inclus des hashtags pertinents."
        }
        
        chat = LlmChat(
            api_key=api_key,
            session_id=str(uuid.uuid4()),
            system_message=system_messages[content_type]
        )
        chat.with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=request.prompt)
        generated_content = await chat.send_message(user_message)
        
    except Exception as e:
        logger.error(f"AI Generation error: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la génération")
    
    # Deduct credits
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"credits": -cost}}
    )
    
    # Save generation
    generation_id = str(uuid.uuid4())
    generation = {
        "id": generation_id,
        "user_id": user["id"],
        "content_type": content_type,
        "prompt": request.prompt,
        "generated_content": generated_content,
        "credits_used": cost,
        "tone": request.tone,
        "language": request.language,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.generations.insert_one(generation)
    
    return GenerationResponse(
        id=generation_id,
        content_type=content_type,
        prompt=request.prompt,
        generated_content=generated_content,
        credits_used=cost,
        created_at=generation["created_at"]
    )

@api_router.get("/history")
async def get_history(user: dict = Depends(get_current_user), limit: int = 20):
    generations = await db.generations.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return generations

@api_router.delete("/history/{generation_id}")
async def delete_generation(generation_id: str, user: dict = Depends(get_current_user)):
    result = await db.generations.delete_one({"id": generation_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Génération non trouvée")
    return {"message": "Supprimé"}

# ============== PAYMENTS ==============

@api_router.get("/plans")
async def get_plans():
    return PLANS

@api_router.get("/credit-packages")
async def get_credit_packages():
    return CREDIT_PACKAGES

@api_router.post("/payments/checkout")
async def create_checkout(request: CheckoutRequest, http_request: Request, user: dict = Depends(get_current_user)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    api_key = os.environ.get('STRIPE_API_KEY')
    host_url = request.origin_url.rstrip('/')
    webhook_url = f"{str(http_request.base_url).rstrip('/')}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    # Determine price and type
    package_type = request.package_type
    
    if package_type in PLANS:
        amount = PLANS[package_type]["price"]
        credits = PLANS[package_type]["credits"]
        purchase_type = "subscription"
    elif package_type in CREDIT_PACKAGES:
        amount = CREDIT_PACKAGES[package_type]["price"]
        credits = CREDIT_PACKAGES[package_type]["credits"]
        purchase_type = "credits"
        description = f"{credits} crédits"
    else:
        raise HTTPException(status_code=400, detail="Package invalide")
    
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Le plan gratuit ne nécessite pas de paiement")
    
    success_url = f"{host_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/pricing"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(amount),
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["id"],
            "package_type": package_type,
            "purchase_type": purchase_type,
            "credits": str(credits)
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = {
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "user_id": user["id"],
        "amount": amount,
        "currency": "eur",
        "package_type": package_type,
        "purchase_type": purchase_type,
        "credits": credits,
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, user: dict = Depends(get_current_user)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    api_key = os.environ.get('STRIPE_API_KEY')
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
    
    try:
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction if paid
        if status.payment_status == "paid":
            transaction = await db.payment_transactions.find_one(
                {"session_id": session_id, "payment_status": "pending"},
                {"_id": 0}
            )
            
            if transaction:
                # Update transaction status
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
                
                # Add credits to user
                credits_to_add = int(transaction["credits"])
                if transaction["purchase_type"] == "subscription":
                    # Update plan and reset credits
                    await db.users.update_one(
                        {"id": transaction["user_id"]},
                        {"$set": {"plan": transaction["package_type"], "credits": credits_to_add}}
                    )
                else:
                    # Just add credits
                    await db.users.update_one(
                        {"id": transaction["user_id"]},
                        {"$inc": {"credits": credits_to_add}}
                    )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount": status.amount_total / 100,
            "currency": status.currency
        }
    except Exception as e:
        logger.error(f"Payment status error: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la vérification du paiement")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    api_key = os.environ.get('STRIPE_API_KEY')
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        logger.info(f"Webhook received: {webhook_response.event_type}")
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": False}

# ============== STATS ==============

@api_router.get("/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    total_generations = await db.generations.count_documents({"user_id": user["id"]})
    
    # Get generations by type
    pipeline = [
        {"$match": {"user_id": user["id"]}},
        {"$group": {"_id": "$content_type", "count": {"$sum": 1}}}
    ]
    by_type = {}
    async for doc in db.generations.aggregate(pipeline):
        by_type[doc["_id"]] = doc["count"]
    
    return {
        "total_generations": total_generations,
        "by_type": by_type,
        "credits_remaining": user["credits"],
        "plan": user["plan"]
    }

@api_router.get("/")
async def root():
    return {"message": "ContentGenius AI API"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
