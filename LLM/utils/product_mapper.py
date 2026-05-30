"""
Product type to room type mapping utility.
Maps furniture/decor product types to appropriate room types for catalog organization.
"""

# Product type to room type(s) mapping
PRODUCT_TYPE_TO_ROOM_MAPPING = {
    # Bedroom products
    "bed": ["Bedroom"],
    "mattress": ["Bedroom"],
    "bedside_table": ["Bedroom"],
    "wardrobe": ["Bedroom"],
    "dressing_table": ["Bedroom"],
    
    # Living room products
    "sofa": ["Living Room"],
    "sectional": ["Living Room"],
    "coffee_table": ["Living Room"],
    "tv_stand": ["Living Room"],
    "recliner": ["Living Room"],
    
    # Dining room products
    "dining_table": ["Dining Room"],
    "dining_chair": ["Dining Room"],
    "bar_stool": ["Dining Room", "Kitchen"],
    
    # Kitchen products
    "kitchen_cabinet": ["Kitchen"],
    "kitchen_counter": ["Kitchen"],
    "kitchen_island": ["Kitchen"],
    "bar_counter": ["Kitchen"],
    
    # Study/Office products
    "desk": ["Study", "Living Room"],
    "office_chair": ["Study"],
    "bookshelf": ["Study", "Living Room", "Bedroom"],
    "shelving_unit": ["Study", "Living Room", "Bedroom"],
    
    # Multi-purpose storage
    "storage": ["Living Room", "Bedroom", "Study", "Kitchen"],
    "cabinet": ["Living Room", "Bedroom", "Study", "Kitchen"],
    "drawer": ["Bedroom", "Study"],
    "cupboard": ["Kitchen", "Bedroom"],
    
    # Decor items (can go in multiple rooms)
    "decor": ["Living Room", "Bedroom", "Dining Room", "Study", "Pooja Room"],
    "wall_art": ["Living Room", "Bedroom", "Study", "Pooja Room"],
    "mirror": ["Living Room", "Bedroom", "Bathroom"],
    "clock": ["Living Room", "Bedroom", "Study", "Kitchen"],
    "vase": ["Living Room", "Bedroom", "Dining Room", "Pooja Room"],
    "wall_decor": ["Living Room", "Bedroom", "Pooja Room"],
    
    # Lighting (multi-room)
    "lighting": ["Living Room", "Bedroom", "Dining Room", "Kitchen", "Study", "Pooja Room"],
    "lamp": ["Living Room", "Bedroom", "Study"],
    "ceiling_light": ["Living Room", "Bedroom", "Dining Room", "Kitchen", "Study", "Pooja Room"],
    "floor_lamp": ["Living Room", "Bedroom", "Study"],
    "wall_light": ["Living Room", "Bedroom", "Pooja Room"],
    
    # Seating
    "chair": ["Living Room", "Dining Room", "Study"],
    "bench": ["Bedroom", "Living Room", "Entryway"],
    
    # Textiles
    "textile": ["Living Room", "Bedroom"],
    "carpet": ["Living Room", "Bedroom", "Study"],
    "rug": ["Living Room", "Bedroom", "Dining Room"],
    "curtain": ["Living Room", "Bedroom", "Study"],
    
    # Drawing Room (formal Indian guest reception space)
    "drawing_room_sofa": ["Drawing Room"],
    "display_cabinet": ["Drawing Room", "Living Room"],
    "console_table": ["Drawing Room", "Entryway", "Living Room"],
    "accent_chair": ["Drawing Room", "Living Room", "Bedroom"],
    "show_piece": ["Drawing Room", "Living Room", "Pooja Room"],

    # Appliances
    "appliance": ["Living Room", "Kitchen", "Bedroom"],
    "tv": ["Living Room", "Bedroom", "Drawing Room"],
    "ac": ["Living Room", "Bedroom", "Drawing Room", "Study"],
    "refrigerator": ["Kitchen"],
    "microwave": ["Kitchen"],
    "dishwasher": ["Kitchen"],
    "water_purifier": ["Kitchen"],

    # Kitchen accessories
    "kitchen_accessory": ["Kitchen"],
    "pressure_cooker": ["Kitchen"],
    "cookware": ["Kitchen"],
    "kadhai": ["Kitchen"],
    "cutting_board": ["Kitchen"],

    # Outdoor / Balcony
    "outdoor": ["Balcony"],
    "bistro_set": ["Balcony"],
    "hammock": ["Balcony"],
    "planter": ["Balcony", "Living Room", "Bedroom"],
    "outdoor_chair": ["Balcony"],
    "outdoor_table": ["Balcony"],
    "outdoor_rug": ["Balcony"],
    "fairy_lights": ["Balcony", "Bedroom", "Living Room"],

    # Misc/Default
    "misc": ["Living Room"],
}

VALID_ROOM_TYPES = [
    "Living Room",
    "Bedroom",
    "Kitchen",
    "Dining Room",
    "Drawing Room",
    "Study",
    "Pooja Room",
    "Bathroom",
    "Entryway",
    "Home Office",
    "Kids Room",
    "Balcony",
]


def map_product_type_to_room_types(product_type: str) -> list[str]:
    """
    Map a product type to one or more appropriate room types.
    
    Args:
        product_type: The product type (e.g., 'bed', 'sofa', 'lamp')
    
    Returns:
        List of room types where this product is suitable
    """
    if not product_type:
        return ["Living Room"]  # Default
    
    product_type_clean = product_type.lower().strip().replace(" ", "_")
    
    # Direct match
    if product_type_clean in PRODUCT_TYPE_TO_ROOM_MAPPING:
        return PRODUCT_TYPE_TO_ROOM_MAPPING[product_type_clean]
    
    # Partial match (check if product type contains a key)
    for key, rooms in PRODUCT_TYPE_TO_ROOM_MAPPING.items():
        if key in product_type_clean or product_type_clean in key:
            return rooms
    
    # Default fallback
    return ["Living Room"]


def expand_product_with_room_types(product: dict) -> list[dict]:
    """
    Expand a single product into multiple records, one for each applicable room type.
    
    Args:
        product: A product dictionary with 'product_type' key
    
    Returns:
        List of product dictionaries, each with a specific room_type
    """
    product_type = product.get("product_type", "misc")
    room_types = map_product_type_to_room_types(product_type)
    
    expanded = []
    for i, room_type in enumerate(room_types):
        product_copy = product.copy()
        product_copy["room_type"] = room_type
        
        # For multi-room products, create unique product IDs
        if len(room_types) > 1:
            base_id = product_copy.get("product_id", "")
            product_copy["product_id"] = f"{base_id}__{room_type.replace(' ', '_').lower()}"
        
        expanded.append(product_copy)
    
    return expanded


def validate_and_enrich_product(product: dict) -> dict:
    """
    Validate and enrich a product record with room type mapping.
    
    Args:
        product: Product dictionary
    
    Returns:
        Enriched product dictionary
    """
    # Add room_type if missing
    if "room_type" not in product:
        room_types = map_product_type_to_room_types(product.get("product_type", "misc"))
        # Use first matching room type for non-expanded products
        product["room_type"] = room_types[0] if room_types else "Living Room"
    
    # Validate room_type is in valid list
    if product.get("room_type") not in VALID_ROOM_TYPES:
        room_types = map_product_type_to_room_types(product.get("product_type", "misc"))
        product["room_type"] = room_types[0] if room_types else "Living Room"
    
    return product
