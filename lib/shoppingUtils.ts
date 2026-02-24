/** Auto-categorize a shopping/grocery item based on its name */
export function categorizeItem(name: string): string {
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
}
