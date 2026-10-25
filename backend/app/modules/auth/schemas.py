from typing import Literal

from pydantic import BaseModel, Field

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class RegisterIn(BaseModel):
    email: str = Field(pattern=EMAIL_PATTERN, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=120)
    role: Literal["artist", "venue"] = "artist"


class LoginIn(BaseModel):
    email: str = Field(max_length=255)
    password: str = Field(max_length=128)


class UserOut(BaseModel):
    id: int
    email: str
    role: str
    full_name: str

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
