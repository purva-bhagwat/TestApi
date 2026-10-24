from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter()

# In-memory database of mock target items
items_db: Dict[int, Dict[str, Any]] = {
    1: {"id": 1, "name": "Laptop", "price": 999.99, "in_stock": True},
    2: {"id": 2, "name": "Mechanical Keyboard", "price": 129.50, "in_stock": True},
}


class ItemCreate(BaseModel):
    name: str = Field(..., description="Item name")
    price: float = Field(..., ge=0.0, description="Item price in USD")
    in_stock: bool = Field(default=True, description="Stock availability status")


class ItemUpdate(BaseModel):
    name: Optional[str] = Field(default=None, description="Updated item name")
    price: Optional[float] = Field(default=None, ge=0.0, description="Updated item price")
    in_stock: Optional[bool] = Field(default=None, description="Updated stock status")


class ItemResponse(BaseModel):
    id: int
    name: str
    price: float
    in_stock: bool


@router.get(
    "/items",
    response_model=List[ItemResponse],
    summary="Get All Mock Items",
    description="Returns the full list of mock inventory items stored in memory.",
)
async def get_items() -> List[Dict[str, Any]]:
    return list(items_db.values())


@router.get(
    "/items/{item_id}",
    response_model=ItemResponse,
    summary="Get Single Mock Item",
    description="Fetches an inventory item by its numeric ID.",
)
async def get_item(item_id: int) -> Dict[str, Any]:
    if item_id not in items_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID {item_id} not found.",
        )
    return items_db[item_id]


@router.post(
    "/items",
    response_model=ItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Mock Item",
    description="Creates a new mock inventory item, auto-generates the next sequential ID, and returns the created record.",
)
async def create_item(item: ItemCreate) -> Dict[str, Any]:
    next_id = max(items_db.keys(), default=0) + 1
    new_item = {
        "id": next_id,
        "name": item.name,
        "price": item.price,
        "in_stock": item.in_stock,
    }
    items_db[next_id] = new_item
    return new_item


@router.put(
    "/items/{item_id}",
    response_model=ItemResponse,
    summary="Update Mock Item",
    description="Modifies existing mock inventory item fields.",
)
async def update_item(item_id: int, item_update: ItemUpdate) -> Dict[str, Any]:
    if item_id not in items_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID {item_id} not found.",
        )

    current_item = items_db[item_id]
    update_data = item_update.model_dump(exclude_unset=True)
    current_item.update(update_data)
    return current_item


@router.delete(
    "/items/{item_id}",
    summary="Delete Mock Item",
    description="Deletes an item from the in-memory database by ID.",
)
async def delete_item(item_id: int) -> Dict[str, str]:
    if item_id not in items_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID {item_id} not found.",
        )
    del items_db[item_id]
    return {"message": "Item deleted successfully"}
