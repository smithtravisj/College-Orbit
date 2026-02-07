/**
 * Natural Language Parser for College Orbit
 * Parses user input to extract structured data for tasks, assignments, exams, notes, courses, and shopping
 */

import { Course, ShoppingListType, GROCERY_CATEGORIES, WISHLIST_CATEGORIES, PANTRY_CATEGORIES } from '@/types';
import { toLocalDateString } from '@/lib/utils';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ItemType = 'task' | 'assignment' | 'reading' | 'project' | 'exam' | 'note' | 'course' | 'shopping';

export interface NoteFolder {
  id: string;
  name: string;
  parentId?: string | null;
}

export interface ParsedInput {
  type: ItemType;
  title: string;
  courseId: string | null;
  date: string | null; // ISO date YYYY-MM-DD
  time: string | null; // HH:mm 24-hour format
  location: string | null;
  importance: 'low' | 'medium' | 'high' | null; // For tasks
  effort: 'small' | 'medium' | 'large' | null; // For assignments
  tags: string[];
  // Course fields
  courseCode: string | null;
  courseName: string | null;
  term: string | null;
  // Note fields
  folderId: string | null;
  noteContent: string | null; // Content after title for notes
  // Shopping fields
  quantity: number;
  unit: string | null;
  category: string | null;
  shoppingNotes: string | null; // Everything else for shopping
  priority: 'low' | 'medium' | 'high' | null; // For wishlist
  price: number | null; // For wishlist
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DAY_NAMES: Record<string, number> = {
  'sunday': 0, 'sun': 0,
  'monday': 1, 'mon': 1,
  'tuesday': 2, 'tue': 2, 'tues': 2,
  'wednesday': 3, 'wed': 3,
  'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
  'friday': 5, 'fri': 5,
  'saturday': 6, 'sat': 6,
};

const MONTH_NAMES: Record<string, number> = {
  'january': 0, 'jan': 0,
  'february': 1, 'feb': 1,
  'march': 2, 'mar': 2,
  'april': 3, 'apr': 3,
  'may': 4,
  'june': 5, 'jun': 5,
  'july': 6, 'jul': 6,
  'august': 7, 'aug': 7,
  'september': 8, 'sep': 8, 'sept': 8,
  'october': 9, 'oct': 9,
  'november': 10, 'nov': 10,
  'december': 11, 'dec': 11,
};

const TIME_KEYWORDS: Record<string, string> = {
  'midnight': '00:00',
  'noon': '12:00',
  'morning': '09:00',
  'afternoon': '14:00',
  'evening': '18:00',
  'night': '20:00',
  'eod': '17:00',
  'cob': '17:00',
};

// Units for shopping
const UNITS: string[] = [
  'gallon', 'gallons', 'gal',
  'liter', 'liters', 'l', 'lt',
  'pound', 'pounds', 'lb', 'lbs',
  'ounce', 'ounces', 'oz',
  'gram', 'grams', 'g',
  'kilogram', 'kilograms', 'kg',
  'cup', 'cups',
  'tablespoon', 'tablespoons', 'tbsp',
  'teaspoon', 'teaspoons', 'tsp',
  'piece', 'pieces', 'pc', 'pcs',
  'box', 'boxes',
  'bag', 'bags',
  'can', 'cans',
  'bottle', 'bottles',
  'jar', 'jars',
  'pack', 'packs', 'package', 'packages', 'pkg',
  'dozen', 'doz',
  'bunch', 'bunches',
  'roll', 'rolls',
  'slice', 'slices',
  'serving', 'servings',
  'container', 'containers',
  'carton', 'cartons',
  'stick', 'sticks',
  'bar', 'bars',
  'loaf', 'loaves',
  'head', 'heads',
  'clove', 'cloves',
  'quart', 'quarts', 'qt',
  'pint', 'pints', 'pt',
  'fl oz', 'fluid ounce', 'fluid ounces',
  'ml', 'milliliter', 'milliliters',
];

// Category keywords mapping
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  // Grocery categories
  'Produce': ['apple', 'apples', 'banana', 'bananas', 'orange', 'oranges', 'lettuce', 'tomato', 'tomatoes', 'onion', 'onions', 'potato', 'potatoes', 'carrot', 'carrots', 'broccoli', 'spinach', 'cucumber', 'cucumbers', 'pepper', 'peppers', 'celery', 'garlic', 'avocado', 'avocados', 'lemon', 'lemons', 'lime', 'limes', 'grape', 'grapes', 'strawberry', 'strawberries', 'blueberry', 'blueberries', 'berry', 'berries', 'fruit', 'fruits', 'vegetable', 'vegetables', 'veggie', 'veggies', 'produce', 'salad', 'mushroom', 'mushrooms', 'corn', 'pear', 'pears', 'peach', 'peaches', 'melon', 'watermelon', 'cantaloupe', 'mango', 'mangoes', 'pineapple', 'kiwi', 'zucchini', 'squash', 'cabbage', 'kale', 'asparagus', 'green beans', 'peas'],
  'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg', 'eggs', 'cottage cheese', 'sour cream', 'cream cheese', 'half and half', 'whipping cream', 'dairy', 'cheddar', 'mozzarella', 'parmesan', 'swiss', 'feta', 'brie', 'gouda'],
  'Meat & Seafood': ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'turkey', 'bacon', 'sausage', 'ham', 'steak', 'ground beef', 'ground turkey', 'meat', 'seafood', 'lamb', 'crab', 'lobster', 'tilapia', 'cod', 'meatball', 'meatballs', 'hot dog', 'hot dogs', 'deli', 'pepperoni', 'salami'],
  'Bakery': ['bread', 'bagel', 'bagels', 'muffin', 'muffins', 'croissant', 'croissants', 'donut', 'donuts', 'doughnut', 'doughnuts', 'cake', 'pie', 'cookie', 'cookies', 'pastry', 'pastries', 'bun', 'buns', 'roll', 'rolls', 'tortilla', 'tortillas', 'pita', 'baguette', 'bakery'],
  'Frozen': ['frozen', 'ice cream', 'frozen pizza', 'frozen vegetables', 'frozen fruit', 'frozen dinner', 'frozen meal', 'popsicle', 'popsicles', 'freezer'],
  'Canned Goods': ['canned', 'can of', 'soup', 'beans', 'tomato sauce', 'tomato paste', 'diced tomatoes', 'corn', 'peas', 'tuna can', 'chickpeas', 'black beans', 'kidney beans', 'green beans', 'canned fruit'],
  'Snacks': ['chips', 'crackers', 'pretzels', 'popcorn', 'nuts', 'trail mix', 'granola bar', 'granola bars', 'candy', 'chocolate', 'snack', 'snacks', 'cookie', 'cookies', 'goldfish', 'cheez-it', 'oreo', 'oreos', 'gummy', 'gummies'],
  'Beverages': ['water', 'juice', 'soda', 'pop', 'coffee', 'tea', 'energy drink', 'sports drink', 'gatorade', 'lemonade', 'drink', 'drinks', 'beverage', 'beverages', 'sparkling water', 'coconut water', 'almond milk', 'oat milk', 'soy milk', 'kombucha'],
  'Condiments': ['ketchup', 'mustard', 'mayonnaise', 'mayo', 'relish', 'hot sauce', 'soy sauce', 'bbq sauce', 'salsa', 'dressing', 'vinegar', 'olive oil', 'vegetable oil', 'cooking oil', 'honey', 'maple syrup', 'jam', 'jelly', 'peanut butter', 'nutella', 'condiment', 'condiments', 'sauce'],
  'Household': ['paper towel', 'paper towels', 'toilet paper', 'tissues', 'trash bag', 'trash bags', 'dish soap', 'laundry detergent', 'cleaning', 'cleaner', 'sponge', 'sponges', 'aluminum foil', 'plastic wrap', 'ziploc', 'ziplock', 'household', 'batteries', 'light bulb', 'light bulbs'],
  'Personal Care': ['shampoo', 'conditioner', 'soap', 'body wash', 'toothpaste', 'toothbrush', 'deodorant', 'lotion', 'razor', 'razors', 'shaving cream', 'floss', 'mouthwash', 'sunscreen', 'personal care', 'hygiene', 'cotton balls', 'q-tips', 'face wash', 'moisturizer'],
  // Wishlist categories
  'Electronics': ['phone', 'laptop', 'computer', 'tablet', 'ipad', 'headphones', 'earbuds', 'airpods', 'speaker', 'tv', 'television', 'monitor', 'keyboard', 'mouse', 'charger', 'cable', 'electronics', 'camera', 'watch', 'smartwatch', 'gaming', 'playstation', 'xbox', 'nintendo', 'switch', 'console', 'controller'],
  'Clothing': ['shirt', 'pants', 'jeans', 'dress', 'shoes', 'jacket', 'coat', 'sweater', 'hoodie', 'socks', 'underwear', 'hat', 'cap', 'scarf', 'gloves', 'clothing', 'clothes', 'outfit', 'shorts', 'skirt', 'suit', 'tie', 'belt', 'boots', 'sneakers', 'sandals'],
  'Books': ['book', 'books', 'textbook', 'textbooks', 'novel', 'ebook', 'kindle', 'reading', 'magazine', 'journal'],
  'Home & Garden': ['furniture', 'couch', 'sofa', 'chair', 'table', 'desk', 'bed', 'mattress', 'pillow', 'blanket', 'rug', 'curtain', 'curtains', 'lamp', 'plant', 'plants', 'garden', 'home', 'decor', 'decoration', 'frame', 'mirror', 'shelf', 'shelves', 'storage', 'organizer'],
  'Sports & Outdoors': ['ball', 'basketball', 'football', 'soccer', 'baseball', 'tennis', 'golf', 'bike', 'bicycle', 'skateboard', 'helmet', 'camping', 'tent', 'hiking', 'fishing', 'sports', 'outdoor', 'outdoors', 'gym', 'workout', 'fitness', 'weights', 'yoga mat', 'running shoes'],
  'Entertainment': ['game', 'games', 'video game', 'board game', 'movie', 'movies', 'dvd', 'blu-ray', 'music', 'album', 'vinyl', 'record', 'instrument', 'guitar', 'piano', 'entertainment', 'streaming', 'subscription'],
  'Kitchen': ['pan', 'pot', 'knife', 'knives', 'cutting board', 'blender', 'mixer', 'toaster', 'microwave', 'coffee maker', 'instant pot', 'air fryer', 'utensil', 'utensils', 'spatula', 'whisk', 'bowl', 'plate', 'plates', 'cup', 'mug', 'glass', 'glasses', 'tupperware', 'container', 'kitchen'],
  'School Supplies': ['notebook', 'pen', 'pens', 'pencil', 'pencils', 'highlighter', 'highlighters', 'marker', 'markers', 'binder', 'folder', 'folders', 'backpack', 'calculator', 'ruler', 'eraser', 'stapler', 'tape', 'scissors', 'glue', 'index cards', 'flashcards', 'school supplies', 'school', 'planner', 'water bottle', 'waterbottle', 'lunchbox', 'lunch box'],
  'Gifts': ['gift', 'gifts', 'present', 'presents', 'gift card', 'birthday', 'christmas', 'holiday', 'anniversary', 'wedding'],
  // Pantry categories
  'Baking Supplies': ['flour', 'sugar', 'baking soda', 'baking powder', 'yeast', 'vanilla', 'cocoa', 'chocolate chips', 'sprinkles', 'baking'],
  'Breakfast': ['cereal', 'oatmeal', 'pancake', 'pancakes', 'waffle', 'waffles', 'granola', 'breakfast', 'syrup'],
  'Instant Meals': ['ramen', 'instant noodles', 'mac and cheese', 'instant', 'microwave meal', 'cup noodles', 'easy mac'],
  'Pasta & Rice': ['pasta', 'spaghetti', 'penne', 'macaroni', 'rice', 'noodles', 'lasagna', 'fettuccine', 'linguine', 'orzo', 'couscous', 'quinoa'],
  'Oils & Cooking Sprays': ['oil', 'olive oil', 'vegetable oil', 'canola oil', 'coconut oil', 'cooking spray', 'pam'],
  'Sauces': ['pasta sauce', 'marinara', 'alfredo', 'teriyaki', 'soy sauce', 'worcestershire', 'hot sauce', 'sriracha'],
  'Spices & Seasonings': ['salt', 'pepper', 'garlic powder', 'onion powder', 'paprika', 'cumin', 'oregano', 'basil', 'thyme', 'cinnamon', 'nutmeg', 'spice', 'spices', 'seasoning', 'seasonings', 'herb', 'herbs'],
  'Spreads': ['peanut butter', 'almond butter', 'jam', 'jelly', 'nutella', 'cream cheese', 'hummus', 'spread'],
};

// Importance/priority keywords (also accepts large/small for interchangeability with effort)
const IMPORTANCE_KEYWORDS: { pattern: RegExp; value: 'low' | 'medium' | 'high' }[] = [
  { pattern: /\b(urgent|asap|critical|important|high\s*priority|high\s*importance|!!+|!$)\b/i, value: 'high' },
  { pattern: /\bhigh\b(?!\s*(school|noon|time))/i, value: 'high' },
  { pattern: /\b(big\s*(project|task)?|large\s*(project)?|major|extensive)\b/i, value: 'high' },
  { pattern: /\blarge\b/i, value: 'high' },
  { pattern: /\b(medium\s*priority|medium\s*importance|moderate|normal\s*priority)\b/i, value: 'medium' },
  { pattern: /\bmedium\b(?!\s*(rare|well))/i, value: 'medium' },
  { pattern: /\b(low\s*priority|low\s*importance|not\s*urgent|whenever|eventually)\b/i, value: 'low' },
  { pattern: /\blow\b(?!\s*(battery|light))/i, value: 'low' },
  { pattern: /\b(small\s*(task)?|quick|easy|simple|short|minor|brief)\b/i, value: 'low' },
  { pattern: /\bsmall\b/i, value: 'low' },
];

// Effort keywords (also accepts high/low for interchangeability with importance)
const EFFORT_KEYWORDS: { pattern: RegExp; value: 'small' | 'medium' | 'large' }[] = [
  { pattern: /\b(big\s*(project|assignment|task)?|large\s*(project|effort)?|major|extensive|long)\b/i, value: 'large' },
  { pattern: /\blarge\b/i, value: 'large' },
  { pattern: /\bhigh\b(?!\s*(school|noon|time))/i, value: 'large' },
  { pattern: /\b(medium\s*(effort|project|size)?|moderate\s*(effort)?|normal\s*(effort)?)\b/i, value: 'medium' },
  { pattern: /\bmedium\b(?!\s*(rare|well))/i, value: 'medium' },
  { pattern: /\b(small\s*(task|project)?|quick|easy|simple|short|minor|brief)\b/i, value: 'small' },
  { pattern: /\bsmall\b/i, value: 'small' },
  { pattern: /\blow\b(?!\s*(battery|light))/i, value: 'small' },
];

// Term patterns (semester/quarter)
const TERM_PATTERNS = [
  /\b(winter|spring|summer|fall|autumn)\s*(20\d{2})\b/i,
  /\b(winter|spring|summer|fall|autumn)\s*'?(\d{2})\b/i,
  /\b(semester|term|quarter)\s*(\d)\b/i,
  /\b(first|second|1st|2nd)\s*(semester|term|quarter)\b/i,
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Keywords that are category descriptors and SHOULD be removed from title
const REMOVABLE_CATEGORY_KEYWORDS = new Set([
  // Category names and descriptors
  'produce', 'dairy', 'bakery', 'frozen', 'snacks', 'beverages', 'condiments', 'household', 'personal care',
  'electronics', 'clothing', 'books', 'home & garden', 'sports & outdoors', 'entertainment', 'kitchen', 'gifts',
  'baking supplies', 'breakfast', 'instant meals', 'pasta & rice', 'oils & cooking sprays', 'sauces',
  'spices & seasonings', 'spreads', 'canned goods', 'meat & seafood', 'school supplies',
  // Common category phrases users might type
  'for school', 'for home', 'for kitchen', 'for bathroom', 'for office',
]);

function detectCategory(text: string, listType: ShoppingListType): { category: string | null; matchedKeyword: string | null; shouldRemoveKeyword: boolean } {
  const lowerText = text.toLowerCase();

  // Get the appropriate category list based on list type
  let categories: readonly string[];
  if (listType === 'grocery') {
    categories = GROCERY_CATEGORIES;
  } else if (listType === 'wishlist') {
    categories = WISHLIST_CATEGORIES;
  } else {
    categories = PANTRY_CATEGORIES;
  }

  // First, check if the user typed a category name directly (e.g., "bakery", "produce", "electronics")
  for (const category of categories) {
    const categoryLower = category.toLowerCase();
    // Match category name or common variations
    if (lowerText.includes(categoryLower)) {
      return { category, matchedKeyword: categoryLower, shouldRemoveKeyword: true };
    }
    // Handle compound categories
    if (categoryLower === 'meat & seafood' && lowerText.includes('meat & seafood')) {
      return { category, matchedKeyword: 'meat & seafood', shouldRemoveKeyword: true };
    }
    if (categoryLower === 'home & garden' && lowerText.includes('home & garden')) {
      return { category, matchedKeyword: 'home & garden', shouldRemoveKeyword: true };
    }
    if (categoryLower === 'sports & outdoors' && lowerText.includes('sports & outdoors')) {
      return { category, matchedKeyword: 'sports & outdoors', shouldRemoveKeyword: true };
    }
  }

  // Then check each category's keywords - prioritize longer keywords first
  for (const category of categories) {
    const keywords = CATEGORY_KEYWORDS[category];
    if (keywords) {
      // Sort keywords by length descending to match longer phrases first
      const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
      for (const keyword of sortedKeywords) {
        if (lowerText.includes(keyword)) {
          // Only mark for removal if it's a category descriptor, not an item name
          const shouldRemove = REMOVABLE_CATEGORY_KEYWORDS.has(keyword.toLowerCase());
          return { category, matchedKeyword: keyword, shouldRemoveKeyword: shouldRemove };
        }
      }
    }
  }

  return { category: null, matchedKeyword: null, shouldRemoveKeyword: false };
}

// ============================================================================
// MAIN PARSER FUNCTION
// ============================================================================

export function parseNaturalLanguage(
  input: string,
  options: {
    courses?: Course[];
    folders?: NoteFolder[];
    itemType: ItemType;
    shoppingListType?: ShoppingListType;
  }
): ParsedInput {
  const { courses = [], folders = [], itemType, shoppingListType = 'grocery' } = options;

  const result: ParsedInput = {
    type: itemType,
    title: '',
    courseId: null,
    date: null,
    time: null,
    location: null,
    importance: null,
    effort: null,
    tags: [],
    courseCode: null,
    courseName: null,
    term: null,
    folderId: null,
    noteContent: null,
    quantity: 1,
    unit: null,
    category: null,
    shoppingNotes: null,
    priority: null,
    price: null,
  };

  if (!input.trim()) return result;

  const originalInput = input.trim();
  let workingText = originalInput;

  const extractedParts: string[] = [];

  // ========== SHOPPING-SPECIFIC PARSING ==========
  if (itemType === 'shopping') {
    // Extract price first (for wishlist): $20, $19.99, about $50, ~$30, 150 dollars, 50 bucks
    const pricePatterns = [
      /(?:about\s*|~|around\s*)?\$(\d+(?:\.\d{2})?)/i,  // $150, about $50
      /(\d+(?:\.\d{2})?)\s*(?:dollars?|bucks?)/i,       // 150 dollars, 50 bucks
      /(?:about\s*|~|around\s*)(\d+(?:\.\d{2})?)\s*(?:dollars?|bucks?)/i,  // about 150 dollars
    ];

    for (const pricePattern of pricePatterns) {
      const priceMatch = workingText.match(pricePattern);
      if (priceMatch) {
        result.price = parseFloat(priceMatch[1]);
        extractedParts.push(priceMatch[0]);
        workingText = workingText.replace(priceMatch[0], ' ');
        break;
      }
    }

    // Extract priority (for wishlist)
    if (shoppingListType === 'wishlist') {
      for (const { pattern, value } of IMPORTANCE_KEYWORDS) {
        const match = workingText.match(pattern);
        if (match) {
          result.priority = value;
          extractedParts.push(match[0]);
          workingText = workingText.replace(pattern, ' ');
          break;
        }
      }
    }

    // Extract quantity and unit: "2 gallons", "3x", "a dozen", "5 lbs"
    // Build unit pattern from UNITS array
    const unitPatternStr = UNITS.map(u => escapeRegex(u)).join('|');

    // Pattern: "2 gallons of milk" or "2 gallon milk" or "2gal milk"
    const qtyUnitPattern = new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*(${unitPatternStr})(?:\\s+of)?\\s+`, 'i');
    const qtyUnitMatch = workingText.match(qtyUnitPattern);
    if (qtyUnitMatch) {
      result.quantity = parseFloat(qtyUnitMatch[1]);
      result.unit = normalizeUnit(qtyUnitMatch[2]);
      extractedParts.push(qtyUnitMatch[0].trim());
      workingText = workingText.substring(qtyUnitMatch[0].length).trim();
    } else {
      // Try quantity without unit: "2 apples", "3x milk"
      const simpleQtyPatterns = [
        /^(\d+)\s*x\s+/i,           // "3x milk"
        /^x\s*(\d+)\s+/i,           // "x3 milk"
        /^(\d+)\s+(?!pm|am|:|\/|\d)/i, // "2 apples" but not times/dates
        /^a\s+dozen\b/i,            // "a dozen" = 12
        /^(\d+)\s*dozen\b/i,        // "2 dozen" = 24
        /^a\s+couple\s+(of\s+)?/i,  // "a couple" = 2
        /^a\s+few\s+/i,             // "a few" = 3
      ];

      for (const pattern of simpleQtyPatterns) {
        const match = workingText.match(pattern);
        if (match) {
          if (pattern.source.includes('dozen')) {
            const multiplier = match[1] ? parseInt(match[1]) : 1;
            result.quantity = multiplier * 12;
          } else if (pattern.source.includes('couple')) {
            result.quantity = 2;
          } else if (pattern.source.includes('few')) {
            result.quantity = 3;
          } else if (match[1]) {
            result.quantity = parseInt(match[1]);
          }
          extractedParts.push(match[0].trim());
          workingText = workingText.substring(match[0].length).trim();
          break;
        }
      }
    }

    // Also check for unit at the end: "milk 2 gallons"
    const endUnitPattern = new RegExp(`\\s+(\\d+(?:\\.\\d+)?)\\s*(${unitPatternStr})\\s*$`, 'i');
    const endUnitMatch = workingText.match(endUnitPattern);
    if (endUnitMatch && result.unit === null) {
      result.quantity = parseFloat(endUnitMatch[1]);
      result.unit = normalizeUnit(endUnitMatch[2]);
      workingText = workingText.replace(endUnitMatch[0], '').trim();
    }

    // Check for quantity anywhere in text (not at start): "waterbottle 4", "item x3"
    if (result.quantity === 1) {
      const midQtyPatterns = [
        /\s+(\d+)\s*x\b/i,              // "waterbottle 4x" or "item 3x"
        /\s+x(\d+)\b/i,                 // "waterbottle x4"
        /\s+(\d+)(?:\s|$)/,             // "waterbottle 4" (number at end or before space)
      ];

      for (const pattern of midQtyPatterns) {
        const match = workingText.match(pattern);
        if (match && match[1]) {
          const qty = parseInt(match[1]);
          // Only accept reasonable quantities (1-999) to avoid matching other numbers
          if (qty >= 1 && qty <= 999) {
            result.quantity = qty;
            workingText = workingText.replace(match[0], ' ').trim();
            break;
          }
        }
      }
    }

    // Detect category based on item name (for auto-selecting category dropdown)
    // We don't remove keywords from title - the full text stays as the item name
    const { category } = detectCategory(workingText, shoppingListType);
    result.category = category;

    // For shopping, remaining text is the name
    let nameText = workingText.replace(/\s+/g, ' ').trim();
    if (nameText.length > 0) {
      nameText = nameText.charAt(0).toUpperCase() + nameText.slice(1);
    }
    result.title = nameText;

    // If there's extra context after the item name, put it in notes
    // This is handled by the remaining text becoming the title

    return result;
  }

  // ========== COURSE-SPECIFIC PARSING ==========
  if (itemType === 'course') {
    // Extract term: "Winter 2026", "Spring '25", "Fall 2024"
    // Remove ALL occurrences of term patterns (in case user types it multiple times)
    for (const pattern of TERM_PATTERNS) {
      const match = workingText.match(pattern);
      if (match) {
        if (match[2] && match[2].length === 2) {
          // Convert '25 to 2025
          result.term = `${match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase()} 20${match[2]}`;
        } else if (match[2] && match[2].length === 4) {
          result.term = `${match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase()} ${match[2]}`;
        } else {
          result.term = match[0];
        }
        extractedParts.push(match[0]);
        // Create a global version of the pattern to remove ALL occurrences
        const globalPattern = new RegExp(pattern.source, 'gi');
        workingText = workingText.replace(globalPattern, ' ').replace(/\s+/g, ' ').trim();
        break;
      }
    }

    // Collapse any multiple spaces that might remain
    workingText = workingText.replace(/\s+/g, ' ').trim();

    // Pattern: "CS 101 Intro to Computer Science" or "WRTG Writing and Rhetoric"
    const courseWithNumberMatch = workingText.match(/^([A-Za-z]{2,5})\s*(\d{3,4}[A-Za-z]?)\s+(.+)$/i);
    const courseWithoutNumberMatch = workingText.match(/^([A-Za-z]{2,5})\s+(.+)$/i);

    if (courseWithNumberMatch) {
      result.courseCode = `${courseWithNumberMatch[1].toUpperCase()} ${courseWithNumberMatch[2]}`;
      result.courseName = courseWithNumberMatch[3].trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    } else if (courseWithoutNumberMatch && courseWithoutNumberMatch[2].length > 2) {
      result.courseCode = courseWithoutNumberMatch[1].toUpperCase();
      result.courseName = courseWithoutNumberMatch[2].trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    } else {
      // Just use the whole thing as course name if no pattern matches
      result.courseName = workingText.trim();
    }

    return result;
  }

  // ========== NOTE-SPECIFIC PARSING ==========
  if (itemType === 'note') {
    // Extract content after delimiter (: or -)
    // Pattern: "Title: content here" or "Title - content here"
    const contentDelimiterMatch = workingText.match(/^([^:\-]+?)(?:\s*[:\-]\s*)(.+)$/s);
    if (contentDelimiterMatch) {
      // First part before delimiter is potential title, rest is content
      const potentialTitle = contentDelimiterMatch[1].trim();
      const content = contentDelimiterMatch[2].trim();
      if (potentialTitle && content) {
        result.noteContent = content;
        workingText = potentialTitle; // Continue parsing just the title part
      }
    }

    // Extract folder: "in [folder]", "folder: [name]", or just match folder names
    for (const folder of folders) {
      const folderPatterns = [
        new RegExp(`\\bin\\s+${escapeRegex(folder.name)}\\b`, 'i'),
        new RegExp(`\\bfolder[:\\s]+${escapeRegex(folder.name)}\\b`, 'i'),
        new RegExp(`\\b${escapeRegex(folder.name)}\\s+folder\\b`, 'i'),
        // Direct folder name match (case insensitive)
        new RegExp(`\\b${escapeRegex(folder.name)}\\b`, 'i'),
      ];

      for (const pattern of folderPatterns) {
        const match = workingText.match(pattern);
        if (match) {
          result.folderId = folder.id;
          extractedParts.push(match[0]);
          workingText = workingText.replace(pattern, ' ');
          break;
        }
      }
      if (result.folderId) break;
    }
  }

  // ========== COMMON PARSING FOR TASKS/ASSIGNMENTS/EXAMS/NOTES ==========

  // Extract importance (for tasks)
  if (itemType === 'task') {
    for (const { pattern, value } of IMPORTANCE_KEYWORDS) {
      const match = workingText.match(pattern);
      if (match) {
        result.importance = value;
        extractedParts.push(match[0]);
        workingText = workingText.replace(pattern, ' ');
        break;
      }
    }
  }

  // Extract effort (for assignments)
  if (itemType === 'assignment') {
    for (const { pattern, value } of EFFORT_KEYWORDS) {
      const match = workingText.match(pattern);
      if (match) {
        result.effort = value;
        extractedParts.push(match[0]);
        workingText = workingText.replace(pattern, ' ');
        break;
      }
    }
  }

  // Extract course
  const courseCodePattern = /\b([A-Za-z]{2,5})\s*[-]?\s*(\d{3,4}[A-Za-z]?)\b/gi;
  let courseMatch;

  while ((courseMatch = courseCodePattern.exec(workingText)) !== null) {
    const matchedCode = `${courseMatch[1]} ${courseMatch[2]}`.toUpperCase();
    const normalizedMatchedCode = matchedCode.replace(/\s+/g, '').toLowerCase();

    const foundCourse = courses.find(c => {
      const normalizedCourseCode = c.code.replace(/\s+/g, '').toLowerCase();
      return normalizedCourseCode === normalizedMatchedCode ||
             c.code.toLowerCase() === matchedCode.toLowerCase() ||
             c.code.toLowerCase().includes(normalizedMatchedCode) ||
             normalizedMatchedCode.includes(normalizedCourseCode);
    });

    if (foundCourse) {
      result.courseId = foundCourse.id;
      extractedParts.push(courseMatch[0]);
      workingText = workingText.replace(new RegExp(escapeRegex(courseMatch[0]), 'gi'), ' ');
      break;
    }
  }

  // Try matching course names/prefixes (also handles "for [course]" patterns)
  if (!result.courseId) {
    for (const course of courses) {
      const courseNameLower = course.name.toLowerCase();
      const courseCodeParts = course.code.split(/\s+/);
      const codePrefix = courseCodeParts[0]?.toLowerCase();

      // Try "for [code]" pattern first
      const forCodePattern = new RegExp(`\\bfor\\s+${escapeRegex(course.code).replace(/\s+/g, '\\s*')}\\b`, 'gi');
      const forCodeMatch = workingText.match(forCodePattern);
      if (forCodeMatch) {
        result.courseId = course.id;
        extractedParts.push(forCodeMatch[0]);
        workingText = workingText.replace(forCodePattern, ' ');
        break;
      }

      const codePattern = new RegExp(`\\b${escapeRegex(course.code).replace(/\s+/g, '\\s*')}\\b`, 'gi');
      const codeMatch = workingText.match(codePattern);
      if (codeMatch) {
        result.courseId = course.id;
        extractedParts.push(codeMatch[0]);
        workingText = workingText.replace(codePattern, ' ');
        break;
      }

      if (codePrefix && codePrefix.length >= 3) {
        // Try "for [prefix]" pattern first
        const forPrefixPattern = new RegExp(`\\bfor\\s+${escapeRegex(codePrefix)}\\b`, 'gi');
        const forPrefixMatch = workingText.match(forPrefixPattern);
        if (forPrefixMatch) {
          result.courseId = course.id;
          extractedParts.push(forPrefixMatch[0]);
          workingText = workingText.replace(forPrefixPattern, ' ');
          break;
        }

        const prefixPattern = new RegExp(`\\b${escapeRegex(codePrefix)}\\b`, 'gi');
        const prefixMatch = workingText.match(prefixPattern);
        if (prefixMatch) {
          result.courseId = course.id;
          extractedParts.push(prefixMatch[0]);
          workingText = workingText.replace(prefixPattern, ' ');
          break;
        }
      }

      if (workingText.toLowerCase().includes(courseNameLower) && courseNameLower.length > 3) {
        result.courseId = course.id;
        extractedParts.push(course.name);
        workingText = workingText.replace(new RegExp(escapeRegex(course.name), 'gi'), ' ');
        break;
      }
    }
  }

  // "for [course]" pattern
  const forCoursePattern = /\bfor\s+([A-Za-z]{2,5}\s*\d{3,4}[A-Za-z]?)\b/gi;
  const forCourseMatch = forCoursePattern.exec(workingText);
  if (forCourseMatch && !result.courseId) {
    const matchedCode = forCourseMatch[1].replace(/\s+/g, '').toLowerCase();
    const foundCourse = courses.find(c =>
      c.code.replace(/\s+/g, '').toLowerCase() === matchedCode
    );
    if (foundCourse) {
      result.courseId = foundCourse.id;
      extractedParts.push(forCourseMatch[0]);
      workingText = workingText.replace(forCourseMatch[0], ' ');
    }
  }

  // Also check for "for [course name/prefix]" pattern with existing courses
  if (result.courseId) {
    // Remove orphaned "for" that preceded the course
    workingText = workingText.replace(/\bfor\s+$/i, ' ');
    workingText = workingText.replace(/\bfor\s+(?=\s|$)/i, ' ');
  }

  // Extract location (for exams) - check BEFORE dates since locations can contain words like "center"
  if (itemType === 'exam') {
    const locationPatterns = [
      // Explicit location markers
      /\b(?:in|at|@)\s+(room\s+\w+)/i,
      /\b(?:in|at|@)\s+(building\s+\w+)/i,
      /\b(?:in|at|@)\s+(hall\s+\w+)/i,
      /\b(?:in|at|@)\s+(\w+\s+hall)/i,
      /\b(?:in|at|@)\s+(\w+\s+building)/i,
      /\b(?:in|at|@)\s+(\w+\s+center)/i,
      /\b(?:in|at|@)\s+(\w+\s+library)/i,
      /\b(?:in|at|@)\s+(the\s+\w+)/i,
      // Common location types
      /\b(room\s+\d+\w*)/i,
      /\b(building\s+\w+)/i,
      /\b(hall\s+\w+)/i,
      /\b(\w+\s+center)\b/i,
      /\b(\w+\s+library)\b/i,
      /\b(gym|gymnasium)\b/i,
      /\b(auditorium|theater|theatre)\b/i,
      /\b(lab(?:oratory)?\s+\w*)/i,
      // Explicit location prefix
      /\blocation[:\s]+([^\d]+?)(?=\s+\d|\s*$)/i,
      /\b([A-Z]{2,4}\s+\d{3,4}[A-Z]?)\s*(?:room|rm)/i,
    ];

    for (const pattern of locationPatterns) {
      const match = workingText.match(pattern);
      if (match) {
        result.location = match[1].trim();
        // Capitalize first letter of location
        result.location = result.location.charAt(0).toUpperCase() + result.location.slice(1);
        extractedParts.push(match[0]);
        workingText = workingText.replace(match[0], ' ');
        break;
      }
    }
  }

  // Extract date (for tasks, assignments, exams)
  if (itemType === 'task' || itemType === 'assignment' || itemType === 'exam') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formatDate = (d: Date): string => toLocalDateString(d);

    const getNextWeekday = (targetDay: number, includeToday = true): Date => {
      const result = new Date(today);
      const currentDay = result.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd < 0 || (daysToAdd === 0 && !includeToday)) {
        daysToAdd += 7;
      }
      result.setDate(result.getDate() + daysToAdd);
      return result;
    };

    // PRIORITY ORDER: Explicit dates first (month names, numeric), then relative dates
    // This ensures "tomorrow Jan 25" uses Jan 25, not tomorrow

    // 1. Month day patterns (highest priority - explicit dates like "Jan 25")
    for (const [monthName, monthNum] of Object.entries(MONTH_NAMES)) {
      const pattern1 = new RegExp(`\\b${monthName}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:[,\\s]+(\\d{4}))?\\b`, 'i');
      const pattern2 = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${monthName}\\.?(?:[,\\s]+(\\d{4}))?\\b`, 'i');

      let match = workingText.match(pattern1);
      if (match) {
        const day = parseInt(match[1]);
        const year = match[2] ? parseInt(match[2]) : today.getFullYear();
        let targetDate = new Date(year, monthNum, day);
        if (targetDate < today && !match[2]) {
          targetDate = new Date(year + 1, monthNum, day);
        }
        result.date = formatDate(targetDate);
        extractedParts.push(match[0]);
        workingText = workingText.replace(match[0], ' ');
        break;
      }

      match = workingText.match(pattern2);
      if (match) {
        const day = parseInt(match[1]);
        const year = match[2] ? parseInt(match[2]) : today.getFullYear();
        let targetDate = new Date(year, monthNum, day);
        if (targetDate < today && !match[2]) {
          targetDate = new Date(year + 1, monthNum, day);
        }
        result.date = formatDate(targetDate);
        extractedParts.push(match[0]);
        workingText = workingText.replace(match[0], ' ');
        break;
      }
    }

    // 2. Numeric date patterns (second priority - explicit dates like "1/25" or "2025-01-25")
    if (!result.date) {
      const datePatterns = [
        { pattern: /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/, groups: [1, 2, 3] as const },
        { pattern: /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/, groups: [3, 1, 2] as const },
        { pattern: /\b(\d{1,2})[\/\-](\d{1,2})\b(?![\/\-])/, groups: [null, 1, 2] as const },
      ];

      for (const { pattern, groups } of datePatterns) {
        const match = workingText.match(pattern);
        if (match) {
          let year: number, month: number, day: number;

          if (groups[0] === null) {
            month = parseInt(match[groups[1]]) - 1;
            day = parseInt(match[groups[2]]);
            year = today.getFullYear();
            const testDate = new Date(year, month, day);
            if (testDate < today) year++;
          } else {
            year = parseInt(match[groups[0]]);
            month = parseInt(match[groups[1]]) - 1;
            day = parseInt(match[groups[2]]);
            if (year < 100) year += 2000;
          }

          if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
            result.date = formatDate(new Date(year, month, day));
            extractedParts.push(match[0]);
            workingText = workingText.replace(match[0], ' ');
            break;
          }
        }
      }
    }

    // 3. Day names (third priority - like "Monday", "next Tuesday")
    if (!result.date) {
      for (const [dayName, dayNum] of Object.entries(DAY_NAMES)) {
        const nextPattern = new RegExp(`\\bnext\\s+${dayName}\\b`, 'i');
        const thisPattern = new RegExp(`\\bthis\\s+${dayName}\\b`, 'i');
        const plainPattern = new RegExp(`\\b${dayName}\\b`, 'i');

        let match;
        if ((match = workingText.match(nextPattern))) {
          const d = getNextWeekday(dayNum, false);
          if (d.getTime() <= today.getTime() + 7 * 24 * 60 * 60 * 1000) {
            d.setDate(d.getDate() + 7);
          }
          result.date = formatDate(d);
          extractedParts.push(match[0]);
          workingText = workingText.replace(nextPattern, ' ');
          break;
        } else if ((match = workingText.match(thisPattern))) {
          result.date = formatDate(getNextWeekday(dayNum, true));
          extractedParts.push(match[0]);
          workingText = workingText.replace(thisPattern, ' ');
          break;
        } else if ((match = workingText.match(plainPattern))) {
          result.date = formatDate(getNextWeekday(dayNum, true));
          extractedParts.push(match[0]);
          workingText = workingText.replace(plainPattern, ' ');
          break;
        }
      }
    }

    // 4. Relative date patterns (lowest priority - like "today", "tomorrow")
    if (!result.date) {
      const relativeDatePatterns: [RegExp, (match?: RegExpMatchArray) => Date][] = [
        [/\btoday\b/i, () => today],
        [/\btonight\b/i, () => today],
        [/\b(tomorrow|tmrw|tmr|tom)\b/i, () => { const d = new Date(today); d.setDate(d.getDate() + 1); return d; }],
        [/\bday after tomorrow\b/i, () => { const d = new Date(today); d.setDate(d.getDate() + 2); return d; }],
        [/\bnext week\b/i, () => { const d = new Date(today); d.setDate(d.getDate() + 7); return d; }],
        [/\bthis week\b/i, () => { const d = new Date(today); d.setDate(d.getDate() + (5 - d.getDay())); return d; }],
        [/\bend of (?:the )?week\b/i, () => { const d = new Date(today); d.setDate(d.getDate() + (5 - d.getDay())); return d; }],
        [/\bend of (?:the )?month\b/i, () => new Date(today.getFullYear(), today.getMonth() + 1, 0)],
        [/\bin\s+(\d+)\s+days?\b/i, (match) => { const d = new Date(today); d.setDate(d.getDate() + parseInt(match![1])); return d; }],
        [/\bin\s+(\d+)\s+weeks?\b/i, (match) => { const d = new Date(today); d.setDate(d.getDate() + parseInt(match![1]) * 7); return d; }],
        [/\bin\s+a\s+week\b/i, () => { const d = new Date(today); d.setDate(d.getDate() + 7); return d; }],
      ];

      for (const [pattern, getDate] of relativeDatePatterns) {
        const match = workingText.match(pattern);
        if (match) {
          result.date = formatDate(getDate(match as RegExpMatchArray));
          extractedParts.push(match[0]);
          workingText = workingText.replace(match[0], ' ');
          break;
        }
      }
    }

    // Extract time
    for (const [keyword, time] of Object.entries(TIME_KEYWORDS)) {
      const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
      const match = workingText.match(pattern);
      if (match) {
        result.time = time;
        extractedParts.push(match[0]);
        workingText = workingText.replace(pattern, ' ');
        break;
      }
    }

    if (!result.time) {
      const timePatternHandlers: { pattern: RegExp; extract: (m: RegExpMatchArray) => { hours: number; minutes: number; meridiem?: string } | null }[] = [
        {
          pattern: /\b(\d{1,2}):(\d{2})\s*(am|pm)\b/i,
          extract: (m) => ({ hours: parseInt(m[1]), minutes: parseInt(m[2]), meridiem: m[3]?.toLowerCase() })
        },
        {
          pattern: /\b(\d{1,2})\s*(am|pm)\b/i,
          extract: (m) => ({ hours: parseInt(m[1]), minutes: 0, meridiem: m[2]?.toLowerCase() })
        },
        {
          pattern: /(?:at|@)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
          extract: (m) => ({ hours: parseInt(m[1]), minutes: m[2] ? parseInt(m[2]) : 0, meridiem: m[3]?.toLowerCase() })
        },
        {
          pattern: /\b(\d{1,2}):(\d{2})\b(?!\s*(am|pm))/i,
          extract: (m) => ({ hours: parseInt(m[1]), minutes: parseInt(m[2]) })
        },
      ];

      for (const { pattern, extract } of timePatternHandlers) {
        const match = workingText.match(pattern);
        if (match) {
          const extracted = extract(match);
          if (!extracted) continue;

          let { hours, minutes, meridiem } = extracted;

          if (meridiem === 'pm' && hours !== 12) hours += 12;
          else if (meridiem === 'am' && hours === 12) hours = 0;
          else if (!meridiem && hours <= 12 && hours >= 1 && hours < 8) hours += 12;

          if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
            result.time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            extractedParts.push(match[0]);
            workingText = workingText.replace(match[0], ' ');
            break;
          }
        }
      }
    }

    if (/\btonight\b/i.test(originalInput) && !result.time) {
      result.time = '20:00';
    }
  }

  // Extract title (what remains)
  let titleText = workingText.replace(/\s+/g, ' ').trim();
  if (titleText.length > 0) {
    titleText = titleText.charAt(0).toUpperCase() + titleText.slice(1);
  }
  result.title = titleText;

  return result;
}

// Helper to normalize unit names
function normalizeUnit(unit: string): string {
  const normalized = unit.toLowerCase();
  const unitMap: Record<string, string> = {
    'gal': 'gallon',
    'gallons': 'gallon',
    'l': 'liter',
    'lt': 'liter',
    'liters': 'liter',
    'lb': 'lb',
    'lbs': 'lb',
    'pound': 'lb',
    'pounds': 'lb',
    'oz': 'oz',
    'ounce': 'oz',
    'ounces': 'oz',
    'g': 'g',
    'gram': 'g',
    'grams': 'g',
    'kg': 'kg',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'cups': 'cup',
    'tbsp': 'tbsp',
    'tablespoon': 'tbsp',
    'tablespoons': 'tbsp',
    'tsp': 'tsp',
    'teaspoon': 'tsp',
    'teaspoons': 'tsp',
    'pc': 'piece',
    'pcs': 'piece',
    'pieces': 'piece',
    'boxes': 'box',
    'bags': 'bag',
    'cans': 'can',
    'bottles': 'bottle',
    'jars': 'jar',
    'packs': 'pack',
    'packages': 'pack',
    'pkg': 'pack',
    'doz': 'dozen',
    'bunches': 'bunch',
    'rolls': 'roll',
    'slices': 'slice',
    'servings': 'serving',
    'containers': 'container',
    'cartons': 'carton',
    'sticks': 'stick',
    'bars': 'bar',
    'loaves': 'loaf',
    'heads': 'head',
    'cloves': 'clove',
    'qt': 'quart',
    'quarts': 'quart',
    'pt': 'pint',
    'pints': 'pint',
    'ml': 'ml',
    'milliliter': 'ml',
    'milliliters': 'ml',
  };
  return unitMap[normalized] || normalized;
}

// ============================================================================
// PLACEHOLDER EXAMPLES
// ============================================================================

export const NLP_PLACEHOLDERS: Record<ItemType, string> = {
  task: 'e.g. Finish chapter 3 CS 101 tomorrow high priority',
  assignment: 'e.g. Essay draft ENG 201 Jan 26 5pm large',
  reading: 'e.g. Read chapters 5-6 CS 101 by Friday',
  project: 'e.g. Group project proposal HIST 210 next week large',
  exam: 'e.g. Calc midterm Feb 2 1pm Room 102',
  note: 'e.g. Meeting notes: key points from today',
  course: 'e.g. CS 101 Intro to Computer Science Winter 2026',
  shopping: 'e.g. 2 gallons milk, 3 apples produce',
};

export const NLP_SHOPPING_PLACEHOLDERS: Record<ShoppingListType, string> = {
  grocery: 'e.g. 2 gallons milk, 3 apples produce',
  wishlist: 'e.g. AirPods high priority $150 electronics',
  pantry: 'e.g. 2 boxes pasta, 1 can tomato sauce',
};
