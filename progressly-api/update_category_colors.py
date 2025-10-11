"""
One-time script to add colors to existing categories that don't have them.
Run this after applying the color column migration.
"""
import random
from sqlmodel import Session, select
from database import engine
from models import Category

def update_category_colors():
    """Add random colors to categories that don't have them."""
    colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', 
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
        '#FF8C94', '#A8DADC', '#E63946', '#FF9F1C', '#2EC4B6',
        '#E71D36', '#011627', '#FF006E', '#8338EC', '#3A86FF'
    ]
    
    with Session(engine) as session:
        # Get all categories
        categories = session.exec(select(Category)).all()
        
        updated_count = 0
        for category in categories:
            # Check if color is None, empty, or the default white
            if not category.color or category.color == '#FFFFFF':
                category.color = random.choice(colors)
                updated_count += 1
        
        session.commit()
        print(f"Updated {updated_count} categories with colors.")

if __name__ == "__main__":
    update_category_colors()
    print("Done!")
