'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useSubscription } from '@/hooks/useSubscription';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';
import { getThemeColors } from '@/lib/visualThemes';
import Card from '@/components/ui/Card';
import CollapsibleCard from '@/components/ui/CollapsibleCard';
import Button from '@/components/ui/Button';
import Input, { Select, Textarea } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import PremiumGate from '@/components/subscription/PremiumGate';
import { Plus, Trash2, Edit2, ShoppingCart, Heart, Package, Check, Copy, History, RotateCcw, Download, X } from 'lucide-react';
import HelpTooltip from '@/components/ui/HelpTooltip';
import NaturalLanguageInput from '@/components/NaturalLanguageInput';
import { parseNaturalLanguage, NLP_SHOPPING_PLACEHOLDERS } from '@/lib/naturalLanguageParser';
import {
  ShoppingListType,
  ShoppingItem,
  GROCERY_CATEGORIES,
  WISHLIST_CATEGORIES,
  PANTRY_CATEGORIES,
} from '@/types';

const TAB_ORDER: ShoppingListType[] = ['pantry', 'grocery', 'wishlist'];

const TAB_CONFIG: Record<ShoppingListType, { label: string; icon: typeof ShoppingCart; categories: readonly string[] }> = {
  pantry: { label: 'Pantry', icon: Package, categories: PANTRY_CATEGORIES },
  grocery: { label: 'Grocery List', icon: ShoppingCart, categories: GROCERY_CATEGORIES },
  wishlist: { label: 'Wishlist', icon: Heart, categories: WISHLIST_CATEGORIES },
};

const STORAGE_KEY = 'shopping-active-tab';

export default function ShoppingPage() {
  const isMobile = useIsMobile();
  const { isPremium } = useSubscription();
  const university = useAppStore((state) => state.settings.university);
  const theme = useAppStore((state) => state.settings.theme) || 'dark';
  const savedUseCustomTheme = useAppStore((state) => state.settings.useCustomTheme);
  const savedCustomColors = useAppStore((state) => state.settings.customColors);
  const savedVisualTheme = useAppStore((state) => state.settings.visualTheme);
  const savedGlowIntensity = useAppStore((state) => state.settings.glowIntensity) ?? 50;

  // Custom theme and visual effects are only active for premium users
  const useCustomTheme = isPremium ? savedUseCustomTheme : false;
  const customColors = isPremium ? savedCustomColors : null;
  const visualTheme = isPremium ? savedVisualTheme : null;
  const glowIntensity = isPremium ? savedGlowIntensity : 50;

  const colorPalette = getCollegeColorPalette(university || null, theme);
  // Visual theme takes priority
  const accentColor = (() => {
    if (visualTheme && visualTheme !== 'default') {
      const themeColors = getThemeColors(visualTheme, theme);
      if (themeColors.accent) return themeColors.accent;
    }
    if (useCustomTheme && customColors) {
      return getCustomColorSetForTheme(customColors as CustomColors, theme).accent;
    }
    return colorPalette.accent;
  })();
  const glowScale = glowIntensity / 50;
  const glowOpacity = Math.min(255, Math.round(0.5 * glowScale * 255)).toString(16).padStart(2, '0');
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ShoppingListType>(() => {
    // Initialize from localStorage if available (client-side only)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && TAB_ORDER.includes(saved as ShoppingListType)) {
        return saved as ShoppingListType;
      }
    }
    return 'pantry';
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [perishableFilter, setPerishableFilter] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '' as string | number,
    unit: '',
    category: '',
    notes: '',
    priority: '' as '' | 'low' | 'medium' | 'high',
    price: '',
    perishable: false,
  });
  const [nlpInput, setNlpInput] = useState('');
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState<ShoppingItem[]>([]);
  const [addedToGroceryId, setAddedToGroceryId] = useState<string | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [bulkImportTarget, setBulkImportTarget] = useState<ShoppingListType>('grocery');
  const [isImporting, setIsImporting] = useState(false);

  const {
    shoppingItems,
    settings,
    addShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,
    toggleShoppingItemChecked,
    clearCheckedShoppingItems,
    moveCheckedToPantry,
    moveItemToGrocery,
    loadPurchaseHistory,
    clearPurchaseHistory,
    restorePurchasedItem,
  } = useAppStore();

  // Handle filters card collapse state changes and save to database
  const handleFiltersCollapseChange = (isOpen: boolean) => {
    const currentCollapsed = settings.dashboardCardsCollapsedState || [];
    const newCollapsed = isOpen
      ? currentCollapsed.filter(id => id !== 'shopping-filters')
      : [...currentCollapsed, 'shopping-filters'];

    useAppStore.setState((state) => ({
      settings: {
        ...state.settings,
        dashboardCardsCollapsedState: newCollapsed,
      },
    }));

    fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dashboardCardsCollapsedState: newCollapsed }),
    }).catch(err => console.error('[Shopping] Failed to save filters collapse state:', err));
  };

  // Handle NLP input changes
  const handleNlpInputChange = (value: string) => {
    setNlpInput(value);

    if (!value.trim()) {
      setFormData({
        name: '',
        quantity: '',
        unit: '',
        category: categoryFilter || '',
        notes: '',
        priority: '',
        price: '',
        perishable: perishableFilter === 'perishable' ? true : perishableFilter === 'non-perishable' ? false : false,
      });
      return;
    }

    const parsed = parseNaturalLanguage(value, {
      itemType: 'shopping',
      shoppingListType: activeTab,
    });

    // Update form fields from parsing - always update name, other fields update when detected
    setFormData({
      name: parsed.title,
      quantity: parsed.quantity > 1 ? parsed.quantity : '',
      unit: parsed.unit || '',
      category: parsed.category || categoryFilter || '',
      notes: parsed.shoppingNotes || '',
      priority: (parsed.priority || '') as '' | 'low' | 'medium' | 'high',
      price: parsed.price ? parsed.price.toString() : '',
      perishable: perishableFilter === 'perishable' ? true : perishableFilter === 'non-perishable' ? false : false,
    });
  };

  useEffect(() => {
    // AppLoader already handles initialization
    setMounted(true);
  }, []);

  // Save active tab to localStorage when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, activeTab);
    }
  }, [activeTab, mounted]);

  // Reset form when tab changes
  useEffect(() => {
    setFormData({
      name: '',
      quantity: '',
      unit: '',
      category: '',
      notes: '',
      priority: '',
      price: '',
      perishable: false,
    });
    setNlpInput('');
    setCategoryFilter('');
    setPerishableFilter('');
    setShowForm(false);
    setEditingId(null);
    setShowPurchaseHistory(false);
  }, [activeTab]);

  // Load purchase history when toggled on grocery tab
  useEffect(() => {
    if (showPurchaseHistory && activeTab === 'grocery') {
      loadPurchaseHistory().then(setPurchaseHistory);
    }
  }, [showPurchaseHistory, activeTab, loadPurchaseHistory]);

  const handleRestoreItem = async (id: string) => {
    await restorePurchasedItem(id);
    // Refresh history
    const history = await loadPurchaseHistory();
    setPurchaseHistory(history);
  };

  const handleClearHistory = async () => {
    await clearPurchaseHistory();
    setPurchaseHistory([]);
  };

  // ============================================================================
  // BULK IMPORT PARSING SYSTEM
  // ============================================================================

  // Auto-categorize items based on name
  const categorizeItem = (name: string): string => {
    const lowerName = name.toLowerCase();

    const categoryMap: [RegExp, string][] = [
      // Spices & Seasonings (check first - more specific)
      [/\b(cumin|paprika|chili powder|cayenne|cinnamon|nutmeg|turmeric|curry powder|oregano|dried oregano|basil|dried basil|thyme|dried thyme|rosemary|bay leaf|garlic powder|onion powder|seasoning|spice mix|italian seasoning|taco seasoning|cajun|old bay|cardamom|coriander seed|fennel seed|mustard seed|red pepper flake|crushed red pepper|black pepper|white pepper|ground pepper|sea salt|kosher salt|table salt|himalayan salt|msg|bouillon)\b/i, 'Spices & Seasonings'],
      // Produce
      [/\b(lettuce|spinach|kale|arugula|cabbage|broccoli|cauliflower|carrots?|celery|cucumber|tomato|tomatoes|bell pepper|jalapeno|habanero|serrano|poblano|onions?|yellow onion|red onion|white onion|green onion|garlic|garlic cloves?|ginger|potatoes?|sweet potatoes?|mushrooms?|zucchini|squash|butternut|acorn|eggplant|corn|asparagus|green beans?|snap peas?|snow peas?|bean sprouts?|avocados?|lemons?|limes?|oranges?|apples?|bananas?|grapes?|berries|strawberr|blueberr|raspberr|blackberr|mangos?|pineapple|melons?|watermelon|cantaloupe|honeydew|peaches?|pears?|plums?|cherries|cilantro|coriander leaves|parsley|fresh basil|fresh mint|fresh rosemary|fresh thyme|fresh oregano|fresh dill|chives?|scallions?|leeks?|shallots?|romaine|iceberg|mixed greens|salad mix|coleslaw mix|stir fry mix)\b/i, 'Produce'],
      // Meat & Seafood
      [/\b(beef|steak|ground beef|beef mince|mince|sirloin|ribeye|chuck|brisket|flank|skirt|chicken|chicken breast|chicken thigh|chicken wing|chicken drum|whole chicken|ground chicken|pork|pork chop|pork loin|pork tenderloin|ground pork|pork belly|bacon|sausages?|italian sausage|breakfast sausage|chorizo|ham|prosciutto|turkey|ground turkey|turkey breast|lamb|ground lamb|lamb chop|veal|duck|fish|salmon|tuna|tilapia|cod|halibut|mahi|sea bass|trout|catfish|shrimp|prawns?|crab|lobster|scallops?|clams?|mussels?|oysters?|calamari|squid|octopus|anchovies?|sardines?)\b/i, 'Meat & Seafood'],
      // Dairy
      [/\b(milk|whole milk|skim milk|2% milk|oat milk|almond milk|soy milk|coconut milk|cream|heavy cream|whipping cream|half and half|sour cream|creme fraiche|cheese|cheddar|mozzarella|parmesan|pecorino|feta|goat cheese|brie|camembert|gruyere|swiss|provolone|american cheese|cream cheese|cottage cheese|ricotta|mascarpone|queso|jack cheese|monterey jack|colby|pepper jack|blue cheese|gorgonzola|butter|unsalted butter|salted butter|margarine|ghee|yogurt|greek yogurt|plain yogurt|eggs?|egg whites?|egg yolks?)\b/i, 'Dairy'],
      // Bread & Bakery
      [/\b(bread|white bread|wheat bread|sourdough|rye bread|pumpernickel|ciabatta|focaccia|loaf|loaves|baguettes?|french bread|rolls?|dinner rolls?|buns?|hamburger buns?|hot dog buns?|croissants?|muffins?|english muffins?|bagels?|pita|pita bread|naan|flatbread|tortillas?|flour tortillas?|corn tortillas?|wraps?|lavash|crackers|breadcrumbs|panko|croutons)\b/i, 'Bread'],
      // Pasta & Rice & Grains
      [/\b(pasta|spaghetti|linguine|fettuccine|penne|rigatoni|ziti|farfalle|rotini|fusilli|macaroni|orzo|lasagna|lasagne|egg noodles?|rice noodles?|ramen|udon|soba|rice|white rice|brown rice|jasmine rice|basmati|arborio|wild rice|risotto|quinoa|couscous|bulgur|farro|barley|oats?|oatmeal|steel cut oats|rolled oats|grits|polenta|cornmeal)\b/i, 'Pasta & Rice'],
      // Canned Goods
      [/\b(canned|can of|tomato paste|tomato sauce|passata|crushed tomatoes?|diced tomatoes?|stewed tomatoes?|tomato puree|marinara|pizza sauce|beans?|black beans?|pinto beans?|kidney beans?|cannellini|navy beans?|great northern|chickpeas?|garbanzo|lentils?|baked beans|refried beans|green beans|canned corn|canned peas|canned carrots|soup|chicken soup|tomato soup|vegetable soup|broth|chicken broth|beef broth|vegetable broth|stock|chicken stock|beef stock|bone broth|coconut cream|evaporated milk|condensed milk|sweetened condensed|pumpkin puree|apple sauce|cranberry sauce|olives?|artichoke hearts?|roasted peppers?|chipotle|adobo|enchilada sauce|green chil|diced chil)\b/i, 'Canned Goods'],
      // Condiments & Sauces
      [/\b(ketchup|catsup|mustard|dijon|yellow mustard|spicy mustard|mayonnaise|mayo|aioli|hot sauce|sriracha|tabasco|frank's|cholula|tapatio|soy sauce|tamari|coconut aminos|teriyaki|hoisin|oyster sauce|fish sauce|worcestershire|bbq sauce|barbecue|buffalo sauce|wing sauce|salsa|pico de gallo|verde|roja|hummus|guacamole|tzatziki|ranch|blue cheese dressing|italian dressing|caesar|vinaigrette|balsamic|balsamic vinegar|red wine vinegar|white wine vinegar|apple cider vinegar|rice vinegar|olive oil|extra virgin|vegetable oil|canola oil|coconut oil|avocado oil|sesame oil|peanut oil|cooking spray|pam)\b/i, 'Condiments'],
      // Baking Supplies
      [/\b(flour|all[- ]purpose flour|bread flour|cake flour|pastry flour|whole wheat flour|almond flour|coconut flour|self[- ]rising|sugar|white sugar|granulated sugar|brown sugar|powdered sugar|confectioners|turbinado|coconut sugar|maple syrup|honey|molasses|corn syrup|agave|stevia|splenda|baking soda|baking powder|yeast|active dry yeast|instant yeast|cream of tartar|cornstarch|arrowroot|vanilla|vanilla extract|vanilla bean|almond extract|lemon extract|cocoa|cocoa powder|dutch process|chocolate chips?|baking chocolate|unsweetened chocolate|semi[- ]sweet|dark chocolate chips|white chocolate|sprinkles|food coloring|gel color)\b/i, 'Baking Supplies'],
      // Snacks
      [/\b(chips?|potato chips?|tortilla chips?|corn chips?|pita chips?|veggie chips?|crisps?|crackers?|ritz|triscuit|wheat thins|goldfish|cheez[- ]it|pretzels?|popcorn|microwave popcorn|nuts?|mixed nuts|almonds?|cashews?|peanuts?|walnuts?|pecans?|pistachios?|macadamia|trail mix|granola|granola bars?|protein bars?|energy bars?|candy|candies|chocolate bar|m&ms?|skittles|gummy|gummies|licorice|cookies?|oreos?)\b/i, 'Snacks'],
      // Beverages
      [/\b(water|bottled water|sparkling water|seltzer|club soda|tonic|juice|orange juice|apple juice|grape juice|cranberry juice|tomato juice|lemonade|limeade|soda|pop|cola|coke|pepsi|sprite|ginger ale|root beer|dr pepper|mountain dew|energy drink|red bull|monster|gatorade|powerade|coffee|ground coffee|coffee beans|instant coffee|k[- ]cups?|tea|black tea|green tea|herbal tea|chai|iced tea|kombucha|wine|red wine|white wine|rose|champagne|prosecco|beer|ale|lager|ipa|stout|cider|hard seltzer|vodka|rum|whiskey|bourbon|tequila|gin|brandy)\b/i, 'Beverages'],
      // Frozen
      [/\b(frozen|ice cream|gelato|sorbet|frozen yogurt|popsicles?|ice pops?|frozen pizza|frozen dinner|tv dinner|frozen vegetables?|frozen fruit|frozen berries|frozen mango|frozen peas|frozen corn|frozen broccoli|frozen spinach|ice|ice cubes|frozen waffles?|frozen pancakes?|frozen burritos?|hot pockets?|pizza rolls?|tater tots?|frozen fries|frozen hash browns?)\b/i, 'Frozen'],
      // Breakfast
      [/\b(cereal|cheerios|frosted flakes|corn flakes|raisin bran|granola cereal|muesli|oatmeal packets?|instant oatmeal|pancake mix|waffle mix|bisquick|syrup|maple syrup|pancake syrup|jam|jelly|preserves|marmalade|peanut butter|almond butter|sunflower butter|nutella|hazelnut spread|pop[- ]tarts?|toaster strudel|breakfast bars?)\b/i, 'Breakfast'],
      // Household (for non-food items)
      [/\b(paper towels?|toilet paper|tissues?|kleenex|napkins?|aluminum foil|tin foil|plastic wrap|saran wrap|cling wrap|parchment paper|wax paper|ziploc|storage bags?|trash bags?|garbage bags?|dish soap|dishwasher detergent|laundry detergent|fabric softener|dryer sheets?|bleach|cleaning|cleaner|wipes?|sponges?|scrubbers?)\b/i, 'Household'],
      // Personal Care
      [/\b(shampoo|conditioner|body wash|soap|bar soap|hand soap|lotion|moisturizer|sunscreen|deodorant|toothpaste|toothbrush|mouthwash|floss|razors?|shaving cream|tampons?|pads?|diapers?|baby wipes?|band[- ]aids?|bandages?|medicine|vitamins?|supplements?|pain relief|advil|tylenol|ibuprofen)\b/i, 'Personal Care'],
    ];

    for (const [pattern, category] of categoryMap) {
      if (pattern.test(lowerName)) {
        return category;
      }
    }
    return 'Other';
  };

  // Capitalize first letter of each word properly
  const capitalizeItem = (name: string): string => {
    if (!name) return name;
    // Don't capitalize certain words unless they're first
    const lowercaseWords = new Set(['and', 'or', 'of', 'the', 'a', 'an', 'to', 'for', 'with', 'in', 'on']);
    return name.split(' ').map((word, index) => {
      if (index === 0 || !lowercaseWords.has(word.toLowerCase())) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.toLowerCase();
    }).join(' ');
  };

  // Clean up item name - remove prep instructions, fix formatting
  const cleanItemName = (name: string): { cleanName: string; prepNotes: string } => {
    let cleanName = name.trim();
    let prepNotes = '';

    // Remove leading/trailing punctuation and whitespace
    cleanName = cleanName.replace(/^[,.\s]+|[,.\s]+$/g, '');

    // Extract prep instructions into notes
    const prepPatterns = [
      /,?\s*(minced|finely minced|roughly minced)$/i,
      /,?\s*(chopped|finely chopped|roughly chopped|coarsely chopped)$/i,
      /,?\s*(diced|finely diced|roughly diced|small dice|medium dice|large dice)$/i,
      /,?\s*(sliced|thinly sliced|thickly sliced)$/i,
      /,?\s*(grated|shredded|julienned|cubed|crushed|ground|crumbled|torn|halved|quartered)$/i,
      /,?\s*(peeled|seeded|deveined|deboned|trimmed|cored)$/i,
      /,?\s*(melted|softened|room temperature|at room temp|cold|chilled|frozen|thawed)$/i,
      /,?\s*(drained|rinsed|drained and rinsed|well drained|patted dry)$/i,
      /,?\s*(to taste|as needed|optional|if desired|for garnish|for serving|for topping)$/i,
    ];

    for (const pattern of prepPatterns) {
      const match = cleanName.match(pattern);
      if (match) {
        if (prepNotes) prepNotes += ', ';
        prepNotes += match[1].toLowerCase();
        cleanName = cleanName.replace(pattern, '').trim();
      }
    }

    // Remove size descriptions that should be notes
    const sizeMatch = cleanName.match(/,?\s*\(?\s*(~?\d+\s*(?:cup|oz|g|lb|inch|cm|mm)?s?)\s*\)?$/i);
    if (sizeMatch) {
      if (prepNotes) prepNotes += ', ';
      prepNotes += sizeMatch[1];
      cleanName = cleanName.replace(sizeMatch[0], '').trim();
    }

    // Clean up any remaining trailing commas or spaces
    cleanName = cleanName.replace(/[,\s]+$/, '').trim();

    return { cleanName, prepNotes };
  };

  // Check if a line is a valid ingredient (not junk)
  const isValidIngredient = (text: string): boolean => {
    const trimmed = text.trim().toLowerCase();

    // Too short
    if (trimmed.length < 2) return false;

    // Just a number
    if (/^\d+(\.\d+)?$/.test(trimmed)) return false;

    // Just punctuation or fragments
    if (/^[()[\]{},.:;!?'"]+$/.test(trimmed)) return false;

    // Starts or ends with orphaned parenthesis content
    if (/^[^(]*\)/.test(trimmed) || /\([^)]*$/.test(trimmed)) return false;

    // Just says "note X" or similar
    if (/^note\s*\d*$/i.test(trimmed)) return false;

    // Section headers
    const headers = [
      'ingredients', 'instructions', 'directions', 'method', 'steps', 'notes', 'tips',
      'spice mix', 'sauce', 'filling', 'topping', 'garnish', 'marinade', 'dressing',
      'for the', 'to make', 'assembly', 'preparation', 'equipment', 'serves', 'yield',
      'prep time', 'cook time', 'total time', 'nutrition', 'calories',
      // Recipe section names
      'enchilada sauce', 'enchiladas', 'beef', 'chicken', 'pork', 'fish', 'meat',
      'vegetables', 'pasta', 'rice', 'salad', 'soup', 'dessert',
    ];
    if (headers.some(h => trimmed === h || trimmed === h + ':' || trimmed === h + 's')) return false;

    // Recipe instructions (starts with action verbs)
    if (/^(preheat|bake|cook|roast|grill|fry|saute|simmer|boil|steam|broil|mix|stir|combine|whisk|blend|fold|add|pour|heat|warm|cool|chill|refrigerate|freeze|let|allow|set aside|serve|enjoy|place|put|arrange|spread|layer|top|drizzle|sprinkle|season|taste|adjust)/i.test(trimmed)) {
      return false;
    }

    return true;
  };

  // Parse a single line/item from bulk import
  const parseBulkImportLine = (line: string): { name: string; quantity: number; unit: string | null; notes: string; category: string } | null => {
    let text = line.trim();
    if (!text) return null;

    // Remove common list prefixes
    text = text.replace(/^[-•*▢☐□■◦◆►▸‣⁃]\s*/, '');
    text = text.replace(/^\d+[.)]\s+/, '');
    text = text.replace(/^[a-z][.)]\s+/i, '');
    text = text.trim();

    if (!text || !isValidIngredient(text)) return null;

    // Initialize result
    let quantity = 1;
    let unit: string | null = null;
    let notes = '';
    let itemName = text;

    // Handle fractions - unicode
    const fractionMap: Record<string, number> = {
      '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 0.333, '⅔': 0.667,
      '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
      '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8, '⅙': 0.167, '⅚': 0.833,
    };
    for (const [frac, val] of Object.entries(fractionMap)) {
      text = text.replace(new RegExp(`(\\d+)?\\s*${frac}`, 'g'), (_, whole) =>
        whole ? String(parseFloat(whole) + val) : String(val)
      );
    }

    // Handle "1 1/2" mixed fractions
    text = text.replace(/(\d+)\s+(\d+)\/(\d+)/g, (_, whole, num, den) =>
      String(parseFloat(whole) + parseFloat(num) / parseFloat(den))
    );

    // Handle standalone fractions "1/2"
    text = text.replace(/^(\d+)\/(\d+)\b/, (_, num, den) =>
      String(parseFloat(num) / parseFloat(den))
    );

    // Handle ranges "1/2 – 1" or "1-2" - take higher number
    text = text.replace(/^([\d.]+)\s*[–—-]\s*([\d.]+)/, '$2');

    // Extract notes from parentheses at the end
    // But be careful with measurement parentheses like "(14 oz)"
    const allParens = text.match(/\([^)]+\)/g) || [];
    for (const paren of allParens) {
      const content = paren.slice(1, -1).trim();
      const lowerContent = content.toLowerCase();

      // Skip if it's a measurement
      if (/^\d+\s*(oz|g|ml|lb|kg|cup|can)s?$/i.test(content)) continue;

      // Extract as note if it contains note-like content
      if (/(note|optional|i use|i like|i prefer|about|approximately|or more|or less|to taste|as needed|adjust|such as|like|eg|e\.g\.|for example|alternative|substitute|brand)/i.test(lowerContent)) {
        if (notes) notes += '; ';
        notes += content;
        text = text.replace(paren, '').trim();
      }
    }

    // Clean up multiple spaces
    text = text.replace(/\s+/g, ' ').trim();

    // List of all units to match
    const unitPattern = /^([\d.]+)\s*(lbs?|pounds?|oz|ounces?|g|grams?|kg|kilograms?|cups?|tbsps?|tablespoons?|tsps?|teaspoons?|gal|gallons?|ml|milliliters?|l|liters?|pints?|quarts?|fl\s*oz|fluid\s*ounces?|bunch|bunches|dozen|heads?|cloves?|slices?|pieces?|sticks?|cans?|boxes?|bags?|packs?|packages?|pkgs?|bottles?|jars?|loaf|loaves|sprigs?|pinch|pinches|dash|dashes|stalks?|ribs?|ears?|sheets?|links?|patties|fillets?|breasts?|thighs?|drumsticks?|wings?|strips?|cubes?)\b\.?\s*/i;

    // Pattern: "1 tbsp each X and Y" or "1 tsp each X, Y, and Z"
    const eachMatch = text.match(/^([\d.]+)\s*(tsp|tbsp|cup|oz|lb|g|kg)s?\s+each\s+(.+)$/i);
    if (eachMatch) {
      quantity = Math.round(parseFloat(eachMatch[1])) || 1;
      unit = eachMatch[2].toLowerCase();
      const ingredients = eachMatch[3]
        .split(/\s*(?:,\s*(?:and\s+)?|(?:\s+and\s+)|\s*&\s*)/i)
        .map(s => s.trim())
        .filter(s => s && isValidIngredient(s));

      if (ingredients.length > 0) {
        // Join them as a single item with note
        itemName = ingredients.map(i => capitalizeItem(i)).join(', ');
        notes = notes ? `${quantity} ${unit} each; ${notes}` : `${quantity} ${unit} each`;
      }
    }
    // Pattern: "400g / 14oz item" - dual measurements
    else if (/^([\d.]+)\s*(g|kg|oz|lb|ml|l|cups?)\s*\/\s*([\d.]+)\s*(g|kg|oz|lb|ml|l|cups?)\s+/.test(text)) {
      const match = text.match(/^([\d.]+)\s*(g|kg|oz|lb|ml|l|cups?)\s*\/\s*([\d.]+)\s*(g|kg|oz|lb|ml|l|cups?)\s+(.+)$/i);
      if (match) {
        quantity = Math.round(parseFloat(match[1])) || 1;
        unit = match[2].toLowerCase();
        itemName = match[5].trim();
        if (notes) notes += '; ';
        notes += `${match[3]}${match[4]}`;
      }
    }
    // Pattern: "2 cups (500ml) item" - measurement with conversion
    else if (/^([\d.]+)\s*(cups?|tbsp|tsp|oz|lb|g|kg|ml|l)\s*\(([\d.]+)\s*(ml|l|g|kg|oz|cups?)\)\s+/.test(text)) {
      const match = text.match(/^([\d.]+)\s*(cups?|tbsp|tsp|oz|lb|g|kg|ml|l)\s*\(([\d.]+)\s*(ml|l|g|kg|oz|cups?)\)\s+(.+)$/i);
      if (match) {
        quantity = Math.round(parseFloat(match[1])) || 1;
        unit = match[2].toLowerCase();
        itemName = match[5].trim();
      }
    }
    // Pattern: quantity + unit + item
    else if (unitPattern.test(text)) {
      const match = text.match(unitPattern);
      if (match) {
        quantity = Math.round(parseFloat(match[1])) || 1;
        unit = match[2].toLowerCase().replace(/s$/, '').replace(/\.$/, '');
        // Normalize common units
        const unitNormalize: Record<string, string> = {
          'tablespoon': 'tbsp', 'teaspoon': 'tsp', 'pound': 'lb', 'ounce': 'oz',
          'gram': 'g', 'kilogram': 'kg', 'liter': 'l', 'milliliter': 'ml',
          'gallon': 'gal', 'package': 'pkg',
        };
        if (unitNormalize[unit]) unit = unitNormalize[unit];

        itemName = text.slice(match[0].length).trim();
      }
    }
    // Pattern: just quantity + item (like "8 tortillas")
    else if (/^([\d.]+)\s+/.test(text)) {
      const match = text.match(/^([\d.]+)\s+(.+)$/);
      if (match) {
        quantity = Math.round(parseFloat(match[1])) || 1;
        itemName = match[2].trim();
      }
    }

    // Remove "of" at the start of item name
    itemName = itemName.replace(/^of\s+/i, '');

    // Clean the item name (remove prep instructions, etc.)
    const { cleanName, prepNotes } = cleanItemName(itemName);
    itemName = cleanName;
    if (prepNotes) {
      notes = notes ? `${notes}; ${prepNotes}` : prepNotes;
    }

    // Final validation
    if (!itemName || !isValidIngredient(itemName)) return null;

    // Capitalize properly
    itemName = capitalizeItem(itemName);

    // Determine category
    const category = categorizeItem(itemName);

    return { name: itemName, quantity, unit, notes, category };
  };

  // Split compound items like "salt and pepper" into separate items
  const splitCompoundItems = (parsed: { name: string; quantity: number; unit: string | null; notes: string; category: string }): { name: string; quantity: number; unit: string | null; notes: string; category: string }[] => {
    // Common compound items that should be split
    const compoundPatterns: [RegExp, string[]][] = [
      [/^salt\s+(?:and|&)\s+pepper$/i, ['Salt', 'Black Pepper']],
      [/^oil\s+(?:and|&)\s+vinegar$/i, ['Olive Oil', 'Vinegar']],
      [/^peanut butter\s+(?:and|&)\s+jelly$/i, ['Peanut Butter', 'Jelly']],
      [/^bread\s+(?:and|&)\s+butter$/i, ['Bread', 'Butter']],
      [/^rice\s+(?:and|&)\s+beans$/i, ['Rice', 'Black Beans']],
      [/^chips\s+(?:and|&)\s+salsa$/i, ['Tortilla Chips', 'Salsa']],
      [/^mac\s+(?:and|&)\s+cheese$/i, ['Macaroni and Cheese']], // Keep as one
      [/^onion\s+(?:and|&)\s+garlic\s+powder$/i, ['Onion Powder', 'Garlic Powder']],
      [/^onion,?\s+garlic\s+powder$/i, ['Onion Powder', 'Garlic Powder']],
    ];

    for (const [pattern, replacements] of compoundPatterns) {
      if (pattern.test(parsed.name)) {
        if (replacements.length === 1) {
          // Keep as single item with updated name
          return [{ ...parsed, name: replacements[0], category: categorizeItem(replacements[0]) }];
        }
        // Split into multiple items
        return replacements.map(r => ({
          name: r,
          quantity: parsed.quantity,
          unit: parsed.unit,
          notes: parsed.notes,
          category: categorizeItem(r),
        }));
      }
    }

    return [parsed];
  };

  // Split bulk import text into individual items intelligently
  const splitBulkImportText = (text: string): string[] => {
    // First, normalize the text
    let normalized = text.trim();

    // If text has newlines, prefer splitting by newlines
    if (normalized.includes('\n')) {
      // Split by newlines, but also handle comma-separated items within lines
      const lines = normalized.split('\n');
      const items: string[] = [];

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Check if this line looks like a comma-separated list (multiple commas, no "and")
        // But be careful not to split things like "salt, pepper" that are meant to be together
        const commaCount = (trimmedLine.match(/,/g) || []).length;
        const hasMultipleItems = commaCount >= 2 || (commaCount === 1 && trimmedLine.includes(' and '));

        if (hasMultipleItems && !trimmedLine.match(/^\d/)) {
          // Split by comma and "and"
          const parts = trimmedLine.split(/,\s*|\s+and\s+/i).filter(p => p.trim());
          items.push(...parts);
        } else {
          items.push(trimmedLine);
        }
      }
      return items;
    }

    // No newlines - try to split intelligently
    // Check for comma-separated list
    if (normalized.includes(',')) {
      return normalized.split(/,\s*/).filter(p => p.trim());
    }

    // Check for semicolon-separated
    if (normalized.includes(';')) {
      return normalized.split(/;\s*/).filter(p => p.trim());
    }

    // Check for "and" separated (like "milk and eggs and bread")
    if (normalized.toLowerCase().includes(' and ')) {
      return normalized.split(/\s+and\s+/i).filter(p => p.trim());
    }

    // Single item
    return [normalized];
  };

  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) return;

    setIsImporting(true);
    try {
      const rawItems = splitBulkImportText(bulkImportText);

      // Parse all items and split compound items
      const allParsed: { name: string; quantity: number; unit: string | null; notes: string; category: string }[] = [];
      for (const item of rawItems) {
        const parsed = parseBulkImportLine(item);
        if (parsed) {
          const split = splitCompoundItems(parsed);
          allParsed.push(...split);
        }
      }

      // Combine duplicates (same name, case-insensitive)
      const combined = new Map<string, { name: string; quantity: number; unit: string | null; notes: string; category: string }>();
      for (const item of allParsed) {
        const key = item.name.toLowerCase();
        if (combined.has(key)) {
          const existing = combined.get(key)!;
          existing.quantity += item.quantity;
          if (item.notes && !existing.notes.includes(item.notes)) {
            existing.notes = existing.notes ? `${existing.notes}; ${item.notes}` : item.notes;
          }
        } else {
          combined.set(key, { ...item });
        }
      }

      // Add all items
      for (const item of combined.values()) {
        await addShoppingItem({
          listType: bulkImportTarget,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          notes: item.notes || '',
          checked: false,
          priority: null,
          price: null,
          perishable: null,
        });
      }

      // Close modal and reset
      setShowBulkImport(false);
      setBulkImportText('');
      // Switch to the target tab
      setActiveTab(bulkImportTarget);
    } catch (error) {
      console.error('Error importing items:', error);
    } finally {
      setIsImporting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  const currentCategories = TAB_CONFIG[activeTab].categories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const quantity = typeof formData.quantity === 'string'
      ? (formData.quantity ? parseInt(formData.quantity, 10) : 1)
      : (formData.quantity || 1);

    const baseItemData = {
      listType: activeTab,
      name: formData.name.trim(),
      quantity,
      unit: formData.unit || null,
      category: formData.category || 'Other',
      notes: formData.notes,
      priority: (formData.priority || null) as 'low' | 'medium' | 'high' | null,
      price: formData.price ? parseFloat(formData.price) : null,
      perishable: (activeTab === 'pantry' || activeTab === 'grocery') ? formData.perishable : null,
    };

    if (editingId) {
      // Don't include 'checked' when editing to preserve its current state
      // Don't await - optimistic update handles UI immediately
      updateShoppingItem(editingId, baseItemData);
      setEditingId(null);
    } else {
      // Only set checked: false for new items
      // Don't await - optimistic update handles UI immediately
      addShoppingItem({ ...baseItemData, checked: false });
    }

    resetForm();
    setShowForm(false);
  };

  const startEdit = (item: ShoppingItem) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingId(item.id);
    setFormData({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || '',
      category: item.category,
      notes: item.notes,
      priority: item.priority || '',
      price: item.price?.toString() || '',
      perishable: item.perishable || false,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setNlpInput('');
    setFormData({
      name: '',
      quantity: '',
      unit: '',
      category: '',
      notes: '',
      priority: '',
      price: '',
      perishable: false,
    });
  };

  // Filter items for current tab
  const filteredItems = shoppingItems
    .filter((item) => item.listType === activeTab)
    .filter((item) => !item.purchasedAt) // Only show active (non-purchased) items
    .filter((item) => !categoryFilter || item.category === categoryFilter)
    .filter((item) => {
      if (!perishableFilter) return true;
      if (perishableFilter === 'perishable') return item.perishable === true;
      if (perishableFilter === 'non-perishable') return !item.perishable;
      return true;
    })
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        item.notes.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      // Unchecked first, then by creation date
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const checkedCount = filteredItems.filter((i) => i.checked).length;
  const TabIcon = TAB_CONFIG[activeTab].icon;

  const copyAllToClipboard = () => {
    // Use filteredItems instead of all pantry items to respect current filters
    const itemsToCopy = filteredItems;

    // Group by category
    const grouped: Record<string, typeof itemsToCopy> = {};
    itemsToCopy.forEach((item) => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    // Sort categories alphabetically, but keep "Other" at the end
    const sortedCategories = Object.keys(grouped).sort((a, b) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return a.localeCompare(b);
    });

    const text = sortedCategories
      .map((category) => {
        const items = grouped[category]
          .map((item) => {
            let line = `  ${item.name} x${item.quantity}${item.unit ? ` ${item.unit}` : ''}`;
            if (item.perishable) {
              line += ` (perishable)`;
            }
            if (item.notes) {
              line += ` - ${item.notes}`;
            }
            return line;
          })
          .join('\n');
        return `${category}\n${items}`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtersContent = (
    <>
      <div style={{ marginBottom: isMobile ? '12px' : '14px' }}>
        <Input
          label="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search items..."
        />
      </div>
      <div style={{ marginBottom: isMobile ? '12px' : '14px' }}>
        <Select
          label="Category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={[
            { value: '', label: 'All Categories' },
            ...[...currentCategories]
              .sort((a, b) => {
                if (a === 'Other') return 1;
                if (b === 'Other') return -1;
                return a.localeCompare(b);
              })
              .map((c) => ({ value: c, label: c })),
          ]}
        />
      </div>
      {(activeTab === 'pantry' || activeTab === 'grocery') && (
        <div style={{ marginBottom: checkedCount > 0 ? (isMobile ? '12px' : '14px') : 0 }}>
          <Select
            label="Perishable"
            value={perishableFilter}
            onChange={(e) => setPerishableFilter(e.target.value)}
            options={[
              { value: '', label: 'All Items' },
              { value: 'perishable', label: 'Perishable Only' },
              { value: 'non-perishable', label: 'Non-Perishable Only' },
            ]}
          />
        </div>
      )}
      {checkedCount > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: activeTab === 'grocery' ? (isMobile ? '12px' : '14px') : 0 }}>
          {activeTab === 'grocery' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => moveCheckedToPantry()}
            >
              <Package size={14} />
              <span style={{ marginLeft: '6px' }}>Move to Pantry</span>
            </Button>
          )}
          {activeTab === 'pantry' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                const checkedPantryItems = shoppingItems.filter(
                  (i) => i.listType === 'pantry' && i.checked
                );
                for (const item of checkedPantryItems) {
                  await moveItemToGrocery(item.id);
                }
              }}
            >
              <ShoppingCart size={14} />
              <span style={{ marginLeft: '6px' }}>Move to Grocery</span>
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => clearCheckedShoppingItems(activeTab)}
          >
            <Trash2 size={14} />
            <span style={{ marginLeft: '6px' }}>Clear {checkedCount} checked</span>
          </Button>
        </div>
      )}
      {activeTab === 'grocery' && (
        <div style={{ marginTop: isMobile ? '12px' : '14px' }}>
          <Button
            variant={showPurchaseHistory ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowPurchaseHistory(!showPurchaseHistory)}
          >
            <History size={14} />
            <span style={{ marginLeft: '6px' }}>{showPurchaseHistory ? 'Hide History' : 'Purchase History'}</span>
          </Button>
        </div>
      )}
    </>
  );

  return (
    <PremiumGate feature="Shopping">
      {/* Shopping Header */}
      <div className="mx-auto w-full max-w-[1800px]" style={{ padding: isMobile ? '8px 20px 8px' : '12px 24px 12px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1
              style={{
                fontSize: isMobile ? '26px' : '34px',
                fontWeight: 700,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
              }}
            >
              Things to Buy
            </h1>
            <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
              {visualTheme === 'cartoon' ? "Never forget the essentials." : "Your shopping lists and pantry inventory."}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: isMobile ? '12px' : '8px' }}>
            <Button variant="secondary" size="md" onClick={() => setShowBulkImport(true)}>
              <Download size={18} />
              {isMobile ? 'Import' : 'Bulk Import'}
            </Button>
            <Button variant="secondary" size="md" onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                if (editingId || !showForm) {
                  setEditingId(null);
                  setNlpInput('');
                  setFormData({
                    name: '',
                    quantity: '',
                    unit: '',
                    category: categoryFilter || '',
                    notes: '',
                    priority: '',
                    price: '',
                    perishable: perishableFilter === 'perishable' ? true : perishableFilter === 'non-perishable' ? false : false,
                  });
                  setShowForm(true);
                } else {
                  setShowForm(false);
                }
              }}>
              <Plus size={18} />
              {isMobile ? 'Item' : 'Add Item'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1800px]" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0', position: 'relative', zIndex: 1 }}>
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4" style={{ marginBottom: isMobile ? '12px' : '20px' }}>
          {TAB_ORDER.map((tab) => {
            const Icon = TAB_CONFIG[tab].icon;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex items-center gap-2 rounded-lg font-medium transition-colors"
                style={{
                  padding: isMobile ? '8px 12px' : '10px 16px',
                  fontSize: isMobile ? '12px' : '14px',
                  backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                  backgroundImage: isActive
                    ? (theme === 'light'
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)'
                      : 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)')
                    : 'none',
                  boxShadow: isActive ? `0 0 ${Math.round(10 * glowScale)}px ${accentColor}${glowOpacity}` : 'none',
                  color: isActive ? 'var(--text)' : 'var(--text-muted)',
                }}
              >
                <Icon size={isMobile ? 14 : 16} />
                {TAB_CONFIG[tab].label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-12 gap-[var(--grid-gap)]" style={{ position: 'relative', zIndex: 1 }}>
          {/* Sidebar - 3 columns */}
          <div className="col-span-12 lg:col-span-3" style={{ height: 'fit-content', position: isMobile ? 'static' : 'sticky', top: isMobile ? undefined : '24px', alignSelf: 'start', marginBottom: isMobile ? '8px' : undefined }}>
            {isMobile ? (
              <CollapsibleCard
                id="shopping-filters"
                title="Filters"
                initialOpen={!(settings.dashboardCardsCollapsedState || []).includes('shopping-filters')}
                onChange={handleFiltersCollapseChange}
              >
                {filtersContent}
              </CollapsibleCard>
            ) : (
              <Card noAccent>
                <h3 className="text-lg font-semibold text-[var(--text)]" style={{ marginBottom: '14px' }}>
                  Filters
                </h3>
                {filtersContent}
              </Card>
            )}
          </div>

          {/* Main Content - 9 columns */}
          <div className="col-span-12 lg:col-span-9" style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '24px' }}>
            {/* Add Item Form */}
            {showForm && (
              <Card style={{ height: 'auto' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '16px' }}>
                  {/* Natural Language Input - only for new items (premium feature) */}
                  {!editingId && isPremium && (
                    <NaturalLanguageInput
                      value={nlpInput}
                      onChange={handleNlpInputChange}
                      placeholder={NLP_SHOPPING_PLACEHOLDERS[activeTab]}
                      autoFocus
                    />
                  )}
                  <Input
                    label="Item Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={
                      activeTab === 'pantry' ? 'What item do you have?' :
                      activeTab === 'wishlist' ? 'What do you want?' :
                      'What do you need?'
                    }
                    required
                  />

                  <div className={isMobile ? 'grid grid-cols-3' : 'grid grid-cols-3'} style={{ gap: isMobile ? '8px' : '16px' }}>
                    <Input
                      label="Quantity"
                      type="number"
                      min={1}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value === '' ? '' : parseInt(e.target.value) || '' })}
                      placeholder="1"
                    />
                    <Input
                      label="Unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="lbs, oz..."
                    />
                    <Select
                      label="Category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      options={[
                        { value: '', label: 'Select category' },
                        ...[...currentCategories]
                          .sort((a, b) => {
                            if (a === 'Other') return 1;
                            if (b === 'Other') return -1;
                            return a.localeCompare(b);
                          })
                          .map((c) => ({ value: c, label: c })),
                      ]}
                    />
                  </div>

                  {/* Wishlist-specific fields */}
                  {activeTab === 'wishlist' && (
                    <div className={isMobile ? 'grid grid-cols-2' : 'grid grid-cols-2'} style={{ gap: isMobile ? '8px' : '16px' }}>
                      <Select
                        label="Priority"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                        options={[
                          { value: '', label: 'No priority' },
                          { value: 'low', label: 'Low' },
                          { value: 'medium', label: 'Medium' },
                          { value: 'high', label: 'High' },
                        ]}
                      />
                      <Input
                        label="Estimated Price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="$0.00"
                      />
                    </div>
                  )}

                  <Textarea
                    label="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={
                      activeTab === 'pantry' ? (isMobile ? 'Storage, expiration...' : 'Storage location, expiration date, etc.') :
                      activeTab === 'wishlist' ? 'Where to buy, links, notes...' :
                      'Brand preferences, store location, etc.'
                    }
                    autoExpand
                    maxHeight={200}
                  />

                  {/* Perishable checkbox for pantry and grocery items */}
                  {(activeTab === 'pantry' || activeTab === 'grocery') && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.perishable}
                        onChange={(e) => setFormData({ ...formData, perishable: e.target.checked })}
                        style={{ width: isMobile ? '16px' : '18px', height: isMobile ? '16px' : '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: isMobile ? '12px' : '14px', color: 'var(--text)' }}>Perishable</span>
                    </label>
                  )}

                  <div className="flex gap-3" style={{ marginTop: isMobile ? '4px' : '4px' }}>
                    <Button variant="primary" type="submit" size={isMobile ? 'sm' : 'md'}>
                      {editingId ? 'Save Changes' : 'Add Item'}
                    </Button>
                    <Button
                      variant="secondary"
                      type="button"
                      size={isMobile ? 'sm' : 'md'}
                      onClick={() => { resetForm(); setShowForm(false); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Item List */}
            {filteredItems.length > 0 ? (
              <Card style={{ height: 'auto' }}>
                {activeTab === 'pantry' && (
                  <div style={{ marginBottom: '8px' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={copyAllToClipboard}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span style={{ marginLeft: '6px' }}>{copied ? 'Copied!' : 'Copy All'}</span>
                    </Button>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {(() => {
                    // Group items by category, maintaining category order
                    const groupedItems: Record<string, ShoppingItem[]> = {};
                    filteredItems.forEach((item) => {
                      if (!groupedItems[item.category]) {
                        groupedItems[item.category] = [];
                      }
                      groupedItems[item.category].push(item);
                    });

                    // Sort categories alphabetically, but keep "Other" at the end
                    const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
                      if (a === 'Other') return 1;
                      if (b === 'Other') return -1;
                      return a.localeCompare(b);
                    });

                    return sortedCategories.map((category, catIndex) => (
                      <div key={category}>
                        {/* Category heading */}
                        <div
                          style={{
                            padding: isMobile ? '12px 8px 8px' : '16px 16px 10px',
                            fontSize: isMobile ? '12px' : '13px',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderTop: catIndex > 0 ? '1px solid var(--border)' : 'none',
                          }}
                        >
                          {category}
                        </div>
                        {/* Items in this category */}
                        {groupedItems[category].map((item, index) => (
                          <div
                            key={item.id}
                            className="flex items-center group/item hover:bg-[var(--panel-2)] rounded transition-colors"
                            style={{
                              padding: isMobile ? '10px 8px' : '12px 16px',
                              opacity: (item.checked && activeTab !== 'pantry') ? 0.6 : 1,
                              borderBottom: index < groupedItems[category].length - 1 ? '1px solid var(--border)' : 'none',
                              cursor: activeTab === 'pantry' ? 'pointer' : 'default',
                            }}
                            onClick={activeTab === 'pantry' ? () => startEdit(item) : undefined}
                          >
                            {/* Checkbox - hidden for pantry, replaced with spacing */}
                            {activeTab !== 'pantry' ? (
                              <button
                                onClick={() => toggleShoppingItemChecked(item.id)}
                                style={{
                                  width: isMobile ? '20px' : '24px',
                                  height: isMobile ? '20px' : '24px',
                                  border: item.checked ? 'none' : '2px solid var(--border)',
                                  borderRadius: '6px',
                                  backgroundColor: item.checked ? 'var(--accent)' : 'transparent',
                                  cursor: 'pointer',
                                  flexShrink: 0,
                                  marginRight: isMobile ? '10px' : '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {item.checked && <Check size={14} color="white" strokeWidth={3} />}
                              </button>
                            ) : (
                              <div style={{ width: isMobile ? '12px' : '18px', flexShrink: 0 }} />
                            )}

                            {/* Item details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`font-medium ${(item.checked && activeTab !== 'pantry') ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}
                                  style={{ fontSize: isMobile ? '13px' : '14px' }}
                                >
                                  {item.name}
                                </span>
                                {(activeTab !== 'wishlist' || item.quantity > 1) && (
                                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    x{item.quantity} {item.unit}
                                  </span>
                                )}
                                {item.priority && (
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      backgroundColor: item.priority === 'high' ? 'rgba(220,38,38,0.1)' :
                                        item.priority === 'medium' ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)',
                                      color: item.priority === 'high' ? 'var(--danger)' :
                                        item.priority === 'medium' ? '#eab308' : '#22c55e',
                                    }}
                                  >
                                    {item.priority}
                                  </span>
                                )}
                                {item.perishable && (
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      backgroundColor: 'rgba(249,115,22,0.15)',
                                      color: '#f97316',
                                    }}
                                  >
                                    perishable
                                  </span>
                                )}
                              </div>
                              {item.price && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  ${item.price.toFixed(2)}
                                </div>
                              )}
                              {item.notes && (
                                <div style={{
                                  fontSize: '11px',
                                  color: 'var(--text-muted)',
                                  marginTop: '2px',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}>
                                  {item.notes}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 lg:opacity-0 lg:group-hover/item:opacity-100" style={{ opacity: isMobile ? 1 : undefined, transition: 'opacity 0.2s' }}>
                              {/* Add to Shopping List button - only for pantry items */}
                              {activeTab === 'pantry' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addShoppingItem({
                                      listType: 'grocery',
                                      name: item.name,
                                      quantity: item.quantity,
                                      unit: item.unit,
                                      category: item.category,
                                      notes: item.notes,
                                      checked: false,
                                      priority: item.priority,
                                      price: item.price,
                                      perishable: item.perishable,
                                    });
                                    setAddedToGroceryId(item.id);
                                    setTimeout(() => setAddedToGroceryId(null), 1500);
                                  }}
                                  className={addedToGroceryId === item.id ? 'text-[var(--success)]' : 'text-[var(--text-muted)] hover:text-[var(--success)]'}
                                  style={{ padding: '4px', marginRight: '2px' }}
                                  aria-label="Add to shopping list"
                                  title="Add to shopping list"
                                >
                                  {addedToGroceryId === item.id ? (
                                    <Check size={isMobile ? 16 : 18} />
                                  ) : (
                                    <ShoppingCart size={isMobile ? 16 : 18} />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); startEdit(item); }}
                                className="text-[var(--text-muted)] hover:text-[var(--edit-hover)]"
                                style={{ padding: '4px' }}
                                aria-label="Edit item"
                              >
                                <Edit2 size={isMobile ? 16 : 18} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteShoppingItem(item.id); }}
                                className="text-[var(--text-muted)] hover:text-[var(--danger)]"
                                style={{ padding: '4px' }}
                                aria-label="Delete item"
                              >
                                <Trash2 size={isMobile ? 16 : 18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              </Card>
            ) : (
              <EmptyState
                icon={<TabIcon size={24} />}
                title={`No ${TAB_CONFIG[activeTab].label.toLowerCase()} items`}
                description={`Add your first item to your ${TAB_CONFIG[activeTab].label.toLowerCase()}`}
                action={{ label: 'Add Item', onClick: () => setShowForm(true) }}
              />
            )}

            {/* Purchase History Section - Only for Grocery Tab */}
            {activeTab === 'grocery' && showPurchaseHistory && (
              <Card style={{ height: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '12px' : '16px' }}>
                  <h3 className="text-lg font-semibold text-[var(--text)]">
                    <History size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                    Purchase History
                  </h3>
                  {purchaseHistory.length > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleClearHistory}
                    >
                      <Trash2 size={14} />
                      <span style={{ marginLeft: '6px' }}>Clear All</span>
                    </Button>
                  )}
                </div>
                {purchaseHistory.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {purchaseHistory.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center group/item hover:bg-[var(--panel-2)] rounded transition-colors"
                        style={{
                          padding: isMobile ? '10px 8px' : '12px 16px',
                          borderBottom: index < purchaseHistory.length - 1 ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-[var(--text)]" style={{ fontSize: isMobile ? '13px' : '14px' }}>
                              {item.name}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              x{item.quantity} {item.unit}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(34,197,94,0.1)',
                                color: '#22c55e',
                              }}
                            >
                              {item.purchasedAt ? new Date(item.purchasedAt).toLocaleDateString() : 'Purchased'}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {item.category}
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRestoreItem(item.id)}
                          title="Add back to grocery list"
                        >
                          <RotateCcw size={14} />
                          <span style={{ marginLeft: '6px' }}>Re-add</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: isMobile ? '24px 16px' : '32px', color: 'var(--text-muted)' }}>
                    <History size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
                    <p style={{ fontSize: '14px' }}>No purchase history yet</p>
                    <p style={{ fontSize: '12px', marginTop: '4px' }}>Items you clear from your grocery list will appear here</p>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* CSS for hover effects */}
      <style jsx>{`
        .group\\/item:hover .flex.items-center.gap-2 {
          opacity: 1 !important;
        }
      `}</style>

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowBulkImport(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--panel)',
              borderRadius: '12px',
              padding: isMobile ? '20px' : '24px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'auto',
              border: '1px solid var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                  Bulk Import
                </h2>
                <HelpTooltip text="Paste any list format: recipe ingredients, comma-separated items, numbered lists, or one item per line. Quantities and units are automatically detected." size={16} width={240} position="below" />
              </div>
              <button
                onClick={() => setShowBulkImport(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text)]"
                style={{ padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <Select
                label="Import to"
                value={bulkImportTarget}
                onChange={(e) => setBulkImportTarget(e.target.value as ShoppingListType)}
                options={[
                  { value: 'grocery', label: 'Grocery List' },
                  { value: 'pantry', label: 'Pantry' },
                  { value: 'wishlist', label: 'Wishlist' },
                ]}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <Textarea
                label="Paste your list or recipe"
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                placeholder={`Paste anything - recipe ingredients, shopping list, etc.`}
                autoExpand
                maxHeight={200}
                style={{ minHeight: '100px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowBulkImport(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleBulkImport}
                disabled={!bulkImportText.trim() || isImporting}
              >
                {isImporting ? 'Importing...' : `Import ${splitBulkImportText(bulkImportText).filter(i => parseBulkImportLine(i)?.name).length} Items`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PremiumGate>
  );
}
